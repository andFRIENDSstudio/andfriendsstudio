// src/pages/editor/logout.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete('editor-auth', { path: '/' });
  return redirect('/editor/login');
};

export const prerender = false;