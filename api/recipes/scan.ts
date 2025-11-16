// api/recipes/scan.ts
// POST /api/recipes/scan - Upload and scan recipe image

import { createServerSupabaseClient, getUserFromRequest } from '../_lib/supabaseServer';
import { extractRecipeFromImage } from '../_lib/recipeScanAI';

export const config = {
  runtime: 'edge',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];

/**
 * Upload file to Supabase Storage
 */
async function uploadImageToStorage(
  file: File,
  userId: string
): Promise<string> {
  const supabase = createServerSupabaseClient();

  // Generate unique filename
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(7);
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `${userId}/${timestamp}-${randomStr}.${ext}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('recipe-images')
    .upload(filename, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('[scan] Storage upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('recipe-images')
    .getPublicUrl(filename);

  console.log('[scan] Image uploaded:', publicUrl);
  return publicUrl;
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Authenticate user
    const user = await getUserFromRequest(req);
    console.log('[scan] User authenticated:', user.id);

    // 2. Parse multipart form data
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return new Response(JSON.stringify({ error: 'Missing image file' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Validate file
    if (imageFile.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!ALLOWED_TYPES.includes(imageFile.type)) {
      return new Response(
        JSON.stringify({ error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[scan] File validated:', imageFile.name, imageFile.type, imageFile.size);

    // 4. Upload image to Supabase Storage
    const imageUrl = await uploadImageToStorage(imageFile, user.id);

    // 5. Extract recipe data using AI
    let recipeDraft;
    try {
      const extracted = await extractRecipeFromImage(imageUrl);
      recipeDraft = {
        ...extracted,
        image_url: imageUrl,
      };
    } catch (error: any) {
      console.error('[scan] AI extraction failed:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to extract recipe from image',
          details: error.message,
        }),
        {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 6. Return the recipe draft
    console.log('[scan] Recipe extracted successfully:', recipeDraft.title);
    return new Response(
      JSON.stringify({ recipeDraft }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('[scan] Error:', error);

    // Handle auth errors
    if (error.message?.includes('Unauthorized')) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle other errors
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
