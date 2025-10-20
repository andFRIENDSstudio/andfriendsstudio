// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';

const EDITOR_PASSWORD = import.meta.env.EDITOR_PASSWORD;

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context;
  
  // Only protect /editor routes (not /editor/login)
  if (pathname.startsWith('/editor') && pathname !== '/editor/login') {
    const authCookie = context.cookies.get('editor-auth')?.value;
    
    // Check if authenticated
    if (authCookie !== EDITOR_PASSWORD) {
      return context.redirect('/editor/login');
    }
  }
  
  // Handle login POST
  if (pathname === '/editor/login' && context.request.method === 'POST') {
    const formData = await context.request.formData();
    const password = formData.get('password');
    
    if (password === EDITOR_PASSWORD) {
      context.cookies.set('editor-auth', EDITOR_PASSWORD, {
        path: '/',
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return context.redirect('/editor');
    }
    
    // Wrong password
    return context.redirect('/editor/login?error=invalid');
  }
  
  return next();
});