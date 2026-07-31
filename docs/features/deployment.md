# Deployment Guide

This guide explains the current deployment model and the assumptions it depends on.

## Files That Define Deployment Behavior

1. [../../package.json](../../package.json)
2. [../../open-next.config.ts](../../open-next.config.ts)
3. [../../wrangler.jsonc](../../wrangler.jsonc)
4. [../../AGENTS.md](../../AGENTS.md)

## Current Model

The application targets Cloudflare Pages advanced mode using OpenNext.

Primary commands:

1. `npm run build:cf`
2. `npm run build:pages`
3. `npm run deploy:pages`

## Why This Is Not A Generic Next.js Deploy

The repo uses OpenNext packaging and a prepared `.pages-deploy` output. Runtime compatibility flags and asset routing assumptions matter. A clean `next build` alone is not enough to prove deploy safety.

## Windows Note

The repository contains a Windows-specific OpenNext build wrapper. That exists because local Windows packaging has required extra handling on this machine. It should not be removed as dead complexity without validating local packaging again.

## Validation Standard

Before deployment-facing changes, the repo expects:

1. `npm run test`
2. `npm run type-check`
3. `npm run lint`
4. `npm run build:pages`

## High-Risk Changes

1. Changing build output directories without synchronizing Wrangler and scripts.
2. Removing compatibility flags without Cloudflare runtime validation.
3. Reintroducing outdated next-on-pages or Vercel assumptions into the active deploy path.