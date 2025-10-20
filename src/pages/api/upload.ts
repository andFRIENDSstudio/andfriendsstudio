import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';

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
    
    console.log('File entry type:', typeof fileEntry, fileEntry);
    
    if (!fileEntry || typeof fileEntry === 'string') {
      console.error('No file in formData or file is string');
      return new Response(JSON.stringify({ error: 'No valid file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const file = fileEntry as File;
    console.log('File info:', { name: file.name, size: file.size, type: file.type });

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.name);
    const nameWithoutExt = path.basename(file.name, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9-]/g, '_');
    const filename = `${timestamp}-${sanitizedName}${ext}`;
    const imagesDir = path.join(process.cwd(), 'public', 'images');
    const filepath = path.join(imagesDir, filename);
    
    console.log('Target filepath:', filepath);

    // Ensure images directory exists
    try {
      await fs.access(imagesDir);
    } catch {
      console.log('Creating images directory...');
      await fs.mkdir(imagesDir, { recursive: true });
    }

    // Write file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filepath, buffer);
    
    console.log('File written successfully:', filename);

    return new Response(JSON.stringify({ 
      success: true,
      path: `/images/${filename}`,
      filename: filename
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error stack:', errorStack);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to upload file',
      details: errorMessage
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};