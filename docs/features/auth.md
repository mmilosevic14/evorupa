# Auth Flow Guide

This guide explains why the authentication flow is structured the way it is.

## Files That Define Auth Behavior

1. [../../middleware.ts](../../middleware.ts)
2. [../../app/auth/login/LoginPageClient.tsx](../../app/auth/login/LoginPageClient.tsx)
3. [../../app/auth/signup/SignupPageClient.tsx](../../app/auth/signup/SignupPageClient.tsx)
4. [../../app/auth/callback/route.ts](../../app/auth/callback/route.ts)
5. [../../utils/supabase/profile.ts](../../utils/supabase/profile.ts)
6. [../../lib/adminAccess.ts](../../lib/adminAccess.ts)

## Flow Summary

1. User starts auth from login or signup.
2. Supabase/Auth provider redirects back with query params.
3. Middleware detects auth query params on arbitrary routes and normalizes them through `/auth/callback`.
4. Callback exchanges the code for a session and replays any cookie mutations onto the final redirect response.
5. The app synchronizes the user's `public.users` row.
6. Downstream UI such as nav, account, report submission, and admin access rely on that synchronized state.

## Why Middleware Intercepts Provider Returns

OAuth providers can send users back to routes other than a dedicated callback page. The middleware removes that ambiguity by funneling all auth query-param returns into one callback implementation.

Without that normalization, the app would need duplicate session-exchange logic in multiple routes, and failures would become route-dependent.

## Why Profile Sync Happens Repeatedly

Profile sync happens after callback and in some direct login/signup/report flows.

That repetition is intentional. The app treats the `users` table as a required operational mirror of the auth identity. If it is missing or stale, author visibility, ownership, and admin-related features become unreliable.

## Admin Behavior

Admin state is intentionally migration-tolerant and should not be simplified casually. The app accepts multiple admin signals because older or partially migrated accounts can temporarily disagree between auth metadata and `public.users`.

## Safe Changes

1. UI changes to login and signup forms.
2. Better error copy.
3. Additional profile bootstrap fields if the profile sync path is updated intentionally.

## High-Risk Changes

1. Removing middleware auth redirect normalization.
2. Making profile sync mandatory for successful login if transient profile failures are expected.
3. Replacing the admin check with a single field without migration cleanup.