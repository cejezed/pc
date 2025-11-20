import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY;

// --- Helper Functions ---

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

function parseDuration(duration: string): number | undefined {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return undefined;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  return hours * 60 + minutes;
}

async function scrapeRecipeFromHTML(html: string): Promise<ScrapedRecipe | null> {
  try {
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/is);
    if (jsonLdMatch) {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      const recipe = Array.isArray(jsonLd)
        ? jsonLd.find(item => item['@type'] === 'Recipe')
        // @ts-ignore
        : jsonLd['@type'] === 'Recipe' ? jsonLd : null;

      if (recipe) {
        return {
          // @ts-ignore
          title: recipe.name || '',
          // @ts-ignore
          ingredients: (recipe.recipeIngredient || []).map((ing: string) => ({
            name: ing,
          })),
          // @ts-ignore
          instructions: Array.isArray(recipe.recipeInstructions)
            // @ts-ignore
            ? recipe.recipeInstructions.map((step: any) =>
              typeof step === 'string' ? step : step.text
            ).join('\n')
            // @ts-ignore
            : recipe.recipeInstructions || '',
          // @ts-ignore
          prepTime: recipe.prepTime ? parseDuration(recipe.prepTime) : undefined,
          // @ts-ignore
          servings: recipe.recipeYield ? parseInt(String(recipe.recipeYield)) : undefined,
          // @ts-ignore
          imageUrl: recipe.image?.url || recipe.image || undefined,
          // @ts-ignore
          tags: recipe.recipeCategory ? [recipe.recipeCategory] : [],
        };
      }
    }

    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'Untitled Recipe';
    return { title, ingredients: [], instructions: '' };
  } catch (error) {
    console.error('HTML scraping error:', error);
    return null;
  }
}

async function extractRecipeWithLLM(html: string, url: string): Promise<ScrapedRecipe | null> {
  if (!openaiApiKey) return null;
  try {
    const text = html
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000);

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
            content: `You are a recipe extraction assistant. Extract recipe information from the provided text and return it as JSON.`
          },
          {
            role: 'user',
            content: `Extract the recipe from this webpage text:\n\n${text}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error('No content in OpenAI response');
    return JSON.parse(content);
  } catch (error) {
    console.error('LLM extraction error:', error);
    return null;
  }
}

// --- Main Handler ---

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized - No header' });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) return res.status(401).json({ error: 'Unauthorized - Invalid token' });

    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'URL is required' });

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);
      const html = await response.text();

      let scrapedRecipe = await scrapeRecipeFromHTML(html);
      if (!scrapedRecipe || scrapedRecipe.ingredients.length === 0) {
        const llmRecipe = await extractRecipeWithLLM(html, url);
        if (llmRecipe) scrapedRecipe = llmRecipe;
      }

      if (!scrapedRecipe) {
        return res.status(400).json({ error: 'Could not extract recipe', success: false });
      }

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

      if (scrapedRecipe.ingredients.length > 0) {
        const ingredientsData = scrapedRecipe.ingredients.map((ing, index) => ({
          recipe_id: recipe.id,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          category: 'other',
          sort_order: index,
        }));
        await supabase.from('recipe_ingredients').insert(ingredientsData);
      }

      const { data: completeRecipe } = await supabase
        .from('recipes')
        // @ts-ignore
        .select('*, ingredients:recipe_ingredients(*)')
        .eq('id', recipe.id)
        .single();

      return res.status(201).json({
        success: true,
        // @ts-ignore
        recipe: completeRecipe.recipe || completeRecipe,
        // @ts-ignore
        ingredients: completeRecipe.ingredients || [],
      });

    } catch (error: any) {
      console.error('Import error:', error);
      return res.status(500).json({ error: error.message, success: false });
    }
}
