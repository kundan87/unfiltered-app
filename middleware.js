import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// In routes ko public banayein taaki bina login bhi Feed load ho sake
const isPublicRoute = createRouteMatcher([
  '/',
  '/api/upload(.*)',
  '/api/comments(.*)',
  '/api/vote(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};