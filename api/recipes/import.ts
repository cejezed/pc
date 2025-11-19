// api/recipes/import.ts
// POST /api/recipes/import - Import recipe from URL

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY;

// Remove Edge config
// export const config = {
//   runtime: 'edge',
// };

interface ScrapedRecipe {
  title: string;
  ingredients: Array<{
    name: string;
    quantity?: number;
    unit?: string;
  }>;
  instructions: string;
  prepTime?: number;
  servings?: number;
  imageUrl?: string;
  tags?: string[];
}

async function scrapeRecipeFromHTML(html: string): Promise<ScrapedRecipe | null> {
  try {
    // Try to extract JSON-LD recipe data (common on recipe sites)
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/is);
    if (jsonLdMatch) {
      const jsonLd = JSON.parse(jsonLdMatch[1]);

      // Look for Recipe schema
      const recipe = Array.isArray(jsonLd)
        ? jsonLd.find(item => item['@type'] === 'Recipe')
        : jsonLd['@type'] === 'Recipe' ? jsonLd : null;

      if (recipe) {
        return {
          title: recipe.name || '',
          ingredients: (recipe.recipeIngredient || []).map((ing: string) => ({
            name: ing,
          })),
          instructions: Array.isArray(recipe.recipeInstructions)
            ? recipe.recipeInstructions.map((step: any) =>
              typeof step === 'string' ? step : step.text
            ).join('\n')
            : recipe.recipeInstructions || '',
          prepTime: recipe.prepTime ? parseDuration(recipe.prepTime) : undefined,
          servings: recipe.recipeYield ? parseInt(String(recipe.recipeYield)) : undefined,
          imageUrl: recipe.image?.url || recipe.image || undefined,
          tags: recipe.recipeCategory ? [recipe.recipeCategory] : [],
        };
      }
    }

    // Basic HTML scraping fallback
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'Untitled Recipe';

    return {
      title,
      ingredients: [],
      instructions: '',
    };
  } catch (error) {
    console.error('HTML scraping error:', error);
    return null;
  }
}

function parseDuration(duration: string): number | undefined {
  // Parse ISO 8601 duration (e.g., "PT30M" = 30 minutes)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return undefined;

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  return hours * 60 + minutes;
}

async function extractRecipeWithLLM(html: string, url: string): Promise<ScrapedRecipe | null> {
  if (!openaiApiKey) {
    console.error('OpenAI API key not configured');
    return null;
  }

  try {
    // Strip HTML to text (basic)
    const text = html
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000); // Limit length

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a recipe extraction assistant. Extract recipe information from the provided text and return it as JSON with this structure:
{
  "title": "Recipe name",
  "ingredients": [
    { "name": "ingredient name", "quantity": number, "unit": "unit" }
  ],
  "instructions": "Step by step instructions",
  "prepTime": number (in minutes),
  "servings": number,
  "tags": ["tag1", "tag2"]
}

If any field is not found, omit it. For ingredients, try to parse quantity and unit separately from the name.`
          },
          {
            role: 'user',
            content: `Extract the recipe from this webpage text:\n\n${text}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    const recipe = JSON.parse(content);
    return recipe;
  } catch (error) {
    console.error('LLM extraction error:', error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get user from auth header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Fetch the URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();

    // Try HTML scraping first
    let scrapedRecipe = await scrapeRecipeFromHTML(html);

    // If scraping didn't get ingredients, try LLM
    if (!scrapedRecipe || scrapedRecipe.ingredients.length === 0) {
      console.log('Falling back to LLM extraction');
      const llmRecipe = await extractRecipeWithLLM(html, url);
      if (llmRecipe) {
        scrapedRecipe = llmRecipe;
      }
    }

    if (!scrapedRecipe) {
      return res.status(400).json({
        error: 'Could not extract recipe from URL',
        success: false,
      });
    }

    // Create recipe in database
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert([{
        user_id: user.id,
        title: scrapedRecipe.title,
        source_type: 'url',
        source_url: url,
        default_servings: scrapedRecipe.servings || 2,
        prep_time_min: scrapedRecipe.prepTime,
        instructions: scrapedRecipe.instructions,
        tags: scrapedRecipe.tags || [],
        image_url: scrapedRecipe.imageUrl,
      }])
      .select()
      .single();

    if (recipeError) throw recipeError;

    // Create ingredients
    if (scrapedRecipe.ingredients.length > 0) {
      const ingredientsData = scrapedRecipe.ingredients.map((ing, index) => ({
        recipe_id: recipe.id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        category: 'other',
        sort_order: index,
      }));

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsData);

      if (ingredientsError) throw ingredientsError;
    }

    // Fetch complete recipe
    const { data: completeRecipe, error: fetchError } = await supabase
      .from('recipes')
      .select('*, ingredients:recipe_ingredients(*)')
      .eq('id', recipe.id)
      .single();

    if (fetchError) throw fetchError;

    return res.status(201).json({
      success: true,
      recipe: completeRecipe.recipe || completeRecipe,
      ingredients: completeRecipe.ingredients || [],
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return res.status(500).json({
      error: error.message,
      success: false,
    });
  }
}
