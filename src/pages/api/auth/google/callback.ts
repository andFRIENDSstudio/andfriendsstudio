// src/pages/api/auth/google/callback.ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  
  console.log('Google callback received, code:', !!code);
  
  if (!code) {
    return redirect('/editor/login?error=no_code');
  }
  
  try {
    const clientId = import.meta.env.GOOGLE_CLIENT_ID;
    const clientSecret = import.meta.env.GOOGLE_CLIENT_SECRET;
    const siteUrl = import.meta.env.SITE_URL || url.origin;
    const redirectUri = `${siteUrl}/api/auth/google/callback`;
    
    console.log('Exchanging code for token...');
    
    // Exchange code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    
    const tokens = await tokenResponse.json();
    
    console.log('Token response:', { hasAccessToken: !!tokens.access_token, error: tokens.error });
    
    if (!tokens.access_token) {
      console.error('No access token:', tokens);
      return redirect('/editor/login?error=auth_failed');
    }
    
    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });
    
    const user = await userResponse.json();
    
    console.log('User info received:', { email: user.email });
    
    // Check if user is allowed
    const allowedEmails = import.meta.env.ALLOWED_EMAILS?.split(',').map((e: string) => e.trim()) || [];
    
    console.log('Checking authorization:', { 
      userEmail: user.email, 
      allowedEmails,
      isAllowed: allowedEmails.includes(user.email)
    });
    
    if (!allowedEmails.includes(user.email)) {
      console.log('Unauthorized email:', user.email);
      return redirect('/editor/login?error=unauthorized');
    }
    
    // Store user info in cookie - DEFINE userData HERE
    const userData = {
      email: user.email,
      name: user.name,
      picture: user.picture,
      authedAt: Date.now()
    };
    
    console.log('Setting auth cookie...');
    
    cookies.set('editor-auth-google', JSON.stringify(userData), {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax' as any,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    
    console.log('Redirecting to /editor');
    
    return redirect('/editor');
  } catch (error) {
    console.error('Auth error:', error);
    return redirect('/editor/login?error=auth_failed');
  }
};