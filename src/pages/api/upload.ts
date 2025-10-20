// src/pages/api/upload.ts
import type { APIRoute } from 'astro';
import { put } from '@vercel/blob';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('Upload request received');
    
    const contentType = request.headers.get('content-type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return new Response(JSON.stringify({ error: 'Content-Type must be multipart/form-data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const formData = await request.formData();
    const fileEntry = formData.get('file');
    
    if (!fileEntry || typeof fileEntry === 'string') {
      return new Response(JSON.stringify({ error: 'No valid file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const file = fileEntry as File;
    console.log('File info:', { name: file.name, size: file.size, type: file.type });

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${sanitizedName}`;
    
    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      token: import.meta.env.BLOB_READ_WRITE_TOKEN,
    });
    
    console.log('File uploaded to blob:', blob.url);

    return new Response(JSON.stringify({ 
      success: true,
      path: blob.url,
      filename: filename
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({ 
      error: 'Failed to upload file',
      details: errorMessage
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};