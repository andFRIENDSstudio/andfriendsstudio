// src/pages/api/test-blob.ts
import type { APIRoute } from 'astro';
import { list } from '@vercel/blob';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const token = import.meta.env.BLOB_READ_WRITE_TOKEN;
    
    if (!token) {
      return new Response(JSON.stringify({ 
        error: 'BLOB_READ_WRITE_TOKEN not found',
        hasToken: false
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Try to list blobs
    const { blobs } = await list({ token });
    
    return new Response(JSON.stringify({ 
      success: true,
      hasToken: true,
      blobCount: blobs.length,
      message: 'Blob connection working!'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      hasToken: !!import.meta.env.BLOB_READ_WRITE_TOKEN
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};