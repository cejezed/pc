// api/recipes/scan.ts
// POST /api/recipes/scan - Upload and scan recipe image

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { extractRecipeFromImage } from '../../server/_lib/recipeScanAI';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Disable body parsing, we'll handle it ourselves
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Parse multipart form data manually
 */
async function parseMultipartForm(req: VercelRequest): Promise<{ file: Buffer; filename: string; mimetype: string }> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const contentType = req.headers['content-type'] || '';
        const boundary = contentType.split('boundary=')[1];

        if (!boundary) {
          return reject(new Error('No boundary found in multipart form'));
        }

        const boundaryBuffer = Buffer.from(`--${boundary}`);
        const parts = [];
        let start = 0;

        while (start < buffer.length) {
          const boundaryIndex = buffer.indexOf(boundaryBuffer, start);
          if (boundaryIndex === -1) break;

          const endIndex = buffer.indexOf(boundaryBuffer, boundaryIndex + boundaryBuffer.length);
          if (endIndex === -1) break;

          const part = buffer.slice(boundaryIndex + boundaryBuffer.length, endIndex);
          if (part.length > 4) {
            parts.push(part);
          }

          start = endIndex;
        }

        // Find the image part
        for (const part of parts) {
          const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
          if (headerEnd === -1) continue;

          const headers = part.slice(0, headerEnd).toString();
          const fileData = part.slice(headerEnd + 4, part.length - 2); // Remove trailing \r\n

          if (headers.includes('name="image"')) {
            const filenameMatch = headers.match(/filename="(.+?)"/);
            const contentTypeMatch = headers.match(/Content-Type: (.+?)\r\n/);

            const filename = filenameMatch ? filenameMatch[1] : 'image.jpg';
            const mimetype = contentTypeMatch ? contentTypeMatch[1] : 'image/jpeg';

            return resolve({ file: fileData, filename, mimetype });
          }
        }

        reject(new Error('No image file found in form data'));
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

/**
 * Upload file to Supabase Storage
 */
async function uploadImageToStorage(
  fileBuffer: Buffer,
  filename: string,
  mimetype: string,
  userId: string
): Promise<string> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Generate unique filename
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(7);
  const ext = filename.split('.').pop() || 'jpg';
  const storagePath = `${userId}/${timestamp}-${randomStr}.${ext}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('recipe-images')
    .upload(storagePath, fileBuffer, {
      contentType: mimetype,
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
    .getPublicUrl(storagePath);

  console.log('[scan] Image uploaded:', publicUrl);
  return publicUrl;
}

/**
 * Get user ID from auth token
 */
async function getUserIdFromToken(token: string): Promise<string> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return user.id;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Authenticate user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.replace('Bearer ', '');
    const userId = await getUserIdFromToken(token);
    console.log('[scan] User authenticated:', userId);

    // 2. Parse multipart form data
    const { file, filename, mimetype } = await parseMultipartForm(req);
    console.log('[scan] File received:', filename, mimetype, file.length, 'bytes');

    // 3. Validate file
    if (file.length > MAX_FILE_SIZE) {
      return res.status(400).json({
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
      });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(mimetype)) {
      return res.status(400).json({
        error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`
      });
    }

    // 4. Upload image to Supabase Storage
    const imageUrl = await uploadImageToStorage(file, filename, mimetype, userId);

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
      return res.status(422).json({
        error: 'Failed to extract recipe from image',
        details: error.message,
      });
    }

    // 6. Return the recipe draft
    console.log('[scan] Recipe extracted successfully:', recipeDraft.title);
    return res.status(200).json({ recipeDraft });

  } catch (error: any) {
    console.error('[scan] Error:', error);

    // Handle auth errors
    if (error.message?.includes('Unauthorized')) {
      return res.status(401).json({ error: error.message });
    }

    // Handle other errors
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
