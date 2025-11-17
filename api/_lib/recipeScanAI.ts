// api/_lib/recipeScanAI.ts
// AI Vision helper for extracting recipe data from images

import type { ScannedRecipeDraft, ScannedIngredient } from '../../apps/client/src/features/eten/types';

const RECIPE_SCAN_MODE = process.env.RECIPE_SCAN_MODE || 'stub'; // 'stub' or 'ai'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * System prompt for the AI to extract recipe information from images
 */
const SYSTEM_PROMPT = `Je bent een Nederlandse recepten-expert die receptkaarten kan lezen en omzetten naar gestructureerde data.

Extracteer de volgende informatie van de receptkaart:
- Titel van het recept
- Aantal personen (default 2 als niet vermeld)
- Bereidingstijd in minuten
- Tags (zoals "kip", "rijst", "aziatisch", "snel", "vegetarisch")
- Ingrediënten met hoeveelheid en eenheid
- Bereidingsstappen (elk een aparte regel)
- Extra notities (zoals merknaam, versie, etc.)

Retourneer ALLEEN valid JSON in dit exacte format:
{
  "title": "Naam van het recept",
  "default_servings": 2,
  "prep_time_min": 30,
  "tags": ["tag1", "tag2"],
  "ingredients": [
    {
      "name": "ingredient naam",
      "quantity": 200,
      "unit": "g",
      "category": null,
      "is_optional": false
    }
  ],
  "instructions": [
    "Stap 1...",
    "Stap 2..."
  ],
  "notes": "Extra informatie zoals merknaam of versie"
}

Belangrijke regels:
- Gebruik null als een waarde niet beschikbaar is
- quantity is een getal of null
- unit kan "g", "ml", "el", "tl", "stuk", "kg", "l" zijn
- category kan null zijn (wordt later ingevuld)
- is_optional is standaard false
- Tags moeten lowercase zijn
- Instructions zijn aparte stappen, geen lange paragraaf`;

/**
 * Stub data for development/testing without AI API calls
 */
function getStubRecipeDraft(): Omit<ScannedRecipeDraft, 'image_url'> {
  return {
    title: "Zoetzure Kip met Ananas en Rijst",
    default_servings: 2,
    prep_time_min: 35,
    tags: ["kip", "rijst", "aziatisch", "zoet", "snel"],
    ingredients: [
      {
        name: "kipfilet",
        quantity: 200,
        unit: "g",
        category: "meat",
        is_optional: false,
      },
      {
        name: "basmati rijst",
        quantity: 150,
        unit: "g",
        category: "pantry",
        is_optional: false,
      },
      {
        name: "courgette",
        quantity: 1,
        unit: "stuk",
        category: "produce",
        is_optional: false,
      },
      {
        name: "rode paprika",
        quantity: 1,
        unit: "stuk",
        category: "produce",
        is_optional: false,
      },
      {
        name: "ananas (blik)",
        quantity: 200,
        unit: "g",
        category: "pantry",
        is_optional: false,
      },
      {
        name: "tomatenpuree",
        quantity: 50,
        unit: "g",
        category: "pantry",
        is_optional: false,
      },
      {
        name: "sojasaus",
        quantity: 2,
        unit: "el",
        category: "pantry",
        is_optional: false,
      },
      {
        name: "honing",
        quantity: 1,
        unit: "el",
        category: "pantry",
        is_optional: false,
      },
      {
        name: "knoflook",
        quantity: 1,
        unit: "teen",
        category: "produce",
        is_optional: false,
      },
      {
        name: "gember (vers)",
        quantity: 1,
        unit: "cm",
        category: "spices",
        is_optional: false,
      },
      {
        name: "sesamzaadjes",
        quantity: 1,
        unit: "el",
        category: "spices",
        is_optional: true,
      },
    ],
    instructions: [
      "Breng 400 ml licht gezouten water aan de kook in een pan met deksel. Voeg de rijst toe en kook in 12 min. met deksel op de pan gaar. Laat zonder deksel uitstomen.",
      "Snijd de kipfilet in blokjes van 2 cm. Verhit de olie in een wok op hoog vuur en bak de kip in 5-6 min. goudbruin en gaar. Bestrooi met peper en zout.",
      "Snijd de courgette en paprika in blokjes. Laat de ananas uitlekken en vang het vocht op. Snipper de knoflook en rasp de gember fijn.",
      "Voeg de groenten toe aan de kip en bak 3-4 min. mee. Voeg de knoflook en gember toe en bak 1 min. mee.",
      "Mix de tomatenpuree met het ananasvocht, sojasaus en honing. Voeg toe aan de wok samen met de ananas. Roer en laat 2 min. pruttelen.",
      "Verdeel de rijst over de borden. Schep de zoetzure kip ernaast. Garneer met sesamzaadjes.",
    ],
    notes: "Marley Spoon kaart, 30–40 min, Versie 1: Zoetzure kip met ananas",
  };
}

/**
 * Extract recipe from image using AI vision
 *
 * @param imageUrl - Public URL of the uploaded image
 * @returns Recipe draft without image_url (that's added by the caller)
 */
export async function extractRecipeFromImage(
  imageUrl: string
): Promise<Omit<ScannedRecipeDraft, 'image_url'>> {
  // Stub mode for development
  if (RECIPE_SCAN_MODE === 'stub') {
    console.log('[recipeScanAI] Using STUB mode');
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    return getStubRecipeDraft();
  }

  // Real AI mode
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured. Set RECIPE_SCAN_MODE=stub for development.');
  }

  try {
    console.log('[recipeScanAI] Calling OpenAI Vision API...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview', // or 'gpt-4o' with vision
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extracteer alsjeblieft de receptinformatie van deze kaart en retourneer het als JSON.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.2, // Low temperature for more consistent JSON output
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Parse JSON from response
    // Sometimes the model wraps JSON in markdown code blocks, so we need to clean it
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (!parsed.title || !Array.isArray(parsed.ingredients) || !Array.isArray(parsed.instructions)) {
      throw new Error('Invalid response structure: missing required fields');
    }

    // Ensure defaults
    const result: Omit<ScannedRecipeDraft, 'image_url'> = {
      title: parsed.title,
      default_servings: parsed.default_servings || 2,
      prep_time_min: parsed.prep_time_min || null,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      ingredients: parsed.ingredients.map((ing: any, index: number) => ({
        name: ing.name || 'Unknown',
        quantity: typeof ing.quantity === 'number' ? ing.quantity : null,
        unit: ing.unit || null,
        category: ing.category || null,
        is_optional: ing.is_optional || false,
      })),
      instructions: Array.isArray(parsed.instructions) ? parsed.instructions : [],
      notes: parsed.notes || '',
    };

    console.log('[recipeScanAI] Successfully extracted recipe:', result.title);
    return result;

  } catch (error: any) {
    console.error('[recipeScanAI] Error extracting recipe:', error);
    throw new Error(`Failed to extract recipe: ${error.message}`);
  }
}

/**
 * TODO: For production, consider:
 *
 * 1. Alternative AI providers:
 *    - Anthropic Claude (supports images)
 *    - Google Gemini (supports images)
 *
 * 2. Fallback strategies:
 *    - Try OCR first (Tesseract, Cloud Vision) then LLM for structuring
 *    - Cache results to avoid re-processing same images
 *
 * 3. Image preprocessing:
 *    - Resize large images to reduce API costs
 *    - Rotate based on EXIF data
 *    - Enhance contrast for better text recognition
 *
 * 4. Error handling:
 *    - Retry logic with exponential backoff
 *    - Partial extraction fallback (manual editing in UI)
 *    - Cost limits and rate limiting
 */
