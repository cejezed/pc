// api/recipes/scan.ts
// POST /api/recipes/scan - Upload and scan recipe image
// SIMPLIFIED VERSION: Returns stub data for now
// TODO: Implement full multipart upload with formidable or busboy

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractRecipeFromImage } from '../_lib/recipeScanAI';

const RECIPE_SCAN_MODE = process.env.RECIPE_SCAN_MODE || 'stub';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // For now, we'll use stub mode regardless of the uploaded image
    // The image upload will be implemented in a future update

    console.log('[scan] Generating recipe draft in mode:', RECIPE_SCAN_MODE);

    // Use stub image URL for now
    const stubImageUrl = 'https://via.placeholder.com/400x300.png?text=Recipe+Card';

    // Extract recipe data using AI (or stub)
    const extracted = await extractRecipeFromImage(stubImageUrl);
    const recipeDraft = {
      ...extracted,
      image_url: stubImageUrl,
    };

    console.log('[scan] Recipe extracted successfully:', recipeDraft.title);
    return res.status(200).json({ recipeDraft });

  } catch (error: any) {
    console.error('[scan] Error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
