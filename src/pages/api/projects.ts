import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';

const projectsPath = path.join(process.cwd(), 'src/data/projects.json');

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const data = await fs.readFile(projectsPath, 'utf-8');
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error reading projects:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to read projects',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};