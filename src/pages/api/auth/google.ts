// src/pages/api/auth/google.ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ redirect, url }) => {
  const clientId = import.meta.env.GOOGLE_CLIENT_ID;
  const siteUrl = import.meta.env.SITE_URL || url.origin;
  const redirectUri = `${siteUrl}/api/auth/google/callback`;
  
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'consent');
  
  return redirect(googleAuthUrl.toString());
};