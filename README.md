# SmartMark - Bookmark Manager

## Project Overview

SmartMark is a minimal, secure bookmark manager built for developers who need a simple way to save and sync links across devices. The application features Google OAuth authentication, private per-user bookmarks, and real-time synchronization across browser tabs. Built with Next.js 16, Supabase for backend services, and Tailwind CSS for styling.

## Approach & Architecture

The application follows a modern web architecture using Next.js App Router for server-side rendering and client-side navigation. Supabase handles authentication, database operations, and real-time subscriptions. The frontend is built with React 19 and TypeScript for type safety.

Key architectural decisions:
- **Client-side rendering** for the dashboard to enable real-time features
- **Optimistic UI updates** for immediate feedback on user actions
- **Row-level security** in Supabase to ensure data privacy
- **Minimal state management** using React hooks for simplicity

## Authentication & Privacy Handling

Authentication is exclusively through Google OAuth, redirecting users to the dashboard upon successful login. User sessions are managed by Supabase Auth, with automatic token refresh.

Privacy is enforced through:
- Database queries filtered by `user_id`
- Supabase Row Level Security (RLS) policies
- Real-time subscriptions scoped to the authenticated user
- No cross-user data exposure in any operation

## Real-Time Implementation

Real-time updates are powered by Supabase's PostgreSQL change streams. The application subscribes to INSERT and DELETE events on the bookmarks table, filtered by the current user's ID. This ensures instant synchronization across multiple tabs without manual refresh.

The implementation includes optimistic updates for immediate UI feedback, with rollback mechanisms if database operations fail.

## Problems Faced & Solutions

### Real-Time Subscription Setup
**Problem**: Initial attempts to set up real-time subscriptions were failing due to incorrect filter syntax and subscription lifecycle management.

**Solution**: Carefully reviewed Supabase documentation for the correct `postgres_changes` event format. Implemented proper cleanup in useEffect to prevent memory leaks and multiple subscriptions.

### Optimistic UI Rollback
**Problem**: When database operations failed, the UI would show incorrect state until manual refresh.

**Solution**: Implemented rollback logic by storing previous state snapshots before optimistic updates. On failure, the state is restored to maintain data integrity.

### Duplicate Bookmark Prevention
**Problem**: Users could accidentally save the same URL multiple times, cluttering their collection.

**Solution**: Added client-side duplicate checking before database insertion, comparing URLs case-insensitively after normalization.

### URL Formatting Consistency
**Problem**: Users entering URLs without protocols (e.g., "google.com") caused inconsistent storage and display.

**Solution**: Implemented automatic URL prefixing with "https://" for URLs without protocols, ensuring consistent formatting throughout the application.

## Deployment Notes

The application is deployed on Vercel with the following environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `NEXT_PUBLIC_SITE_URL`: Your deployment URL (for OAuth redirects)

Ensure Supabase is configured with Google OAuth provider and appropriate database policies for production use.

## Future Improvements

- **Bookmark categories/tags** for better organization
- **Search functionality** across saved bookmarks
- **Import/export** capabilities for bookmark migration
- **Mobile app** using React Native
- **Advanced analytics** on bookmark usage patterns
- **Collaborative features** for shared bookmark collections

## AI Tools Used

Yes — I used GitHub Copilot and ChatGPT for debugging guidance and architectural clarification, but all implementation decisions and testing were done manually.
