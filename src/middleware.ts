// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';

const EDITOR_PASSWORD = import.meta.env.EDITOR_PASSWORD;

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url?.pathname || '';
  
  if (!pathname) {
    return next();
  }
  
  // Skip auth check for login page and auth callbacks
  if (pathname === '/editor/login' || pathname.startsWith('/api/auth')) {
    // Handle password login POST
    if (pathname === '/editor/login' && context.request.method === 'POST') {
      const formData = await context.request.formData();
      const password = formData.get('password');
      
      if (password === EDITOR_PASSWORD) {
        context.cookies.set('editor-auth', EDITOR_PASSWORD, {
          path: '/',
          httpOnly: true,
          secure: import.meta.env.PROD,
          sameSite: 'lax', // Changed from 'strict'
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
        return context.redirect('/editor');
      }
      
      return context.redirect('/editor/login?error=invalid');
    }
    
    return next();
  }
  
  // Protect /editor routes
  if (pathname.startsWith('/editor')) {
    const passwordAuth = context.cookies.get('editor-auth')?.value;
    const googleAuthCookie = context.cookies.get('editor-auth-google')?.value;
    
    // Debug logging (remove after fixing)
    console.log('Auth check:', {
      pathname,
      hasPassword: !!passwordAuth,
      hasGoogle: !!googleAuthCookie,
      passwordMatch: passwordAuth === EDITOR_PASSWORD
    });
    
    // Check if authenticated via either method
    const isAuthenticated = passwordAuth === EDITOR_PASSWORD || !!googleAuthCookie;
    
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      return context.redirect('/editor/login');
    }
  }
  
  return next();
});