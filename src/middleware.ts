// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';

const EDITOR_PASSWORD = import.meta.env.EDITOR_PASSWORD;

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url?.pathname || '';
  
  if (!pathname) {
    return next();
  }
  
  // Only protect /editor routes (not /editor/login or auth callbacks)
  if (pathname.startsWith('/editor') && 
      pathname !== '/editor/login' && 
      !pathname.startsWith('/api/auth')) {
    
    const passwordAuth = context.cookies.get('editor-auth')?.value;
    const googleAuth = context.cookies.get('editor-auth-google')?.value;
    
    // Check if authenticated via either method
    if (passwordAuth !== EDITOR_PASSWORD && !googleAuth) {
      return context.redirect('/editor/login');
    }
  }
  
  // Handle password login POST
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
    
    return context.redirect('/editor/login?error=invalid');
  }
  
  return next();
});