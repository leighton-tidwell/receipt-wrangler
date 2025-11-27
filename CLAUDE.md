# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Receipt Wrangler is a Telegram-based receipt categorization bot for family budgeting. Users send receipt photos or text via Telegram or a web interface, and the app uses OpenAI GPT with vision to parse and categorize items into budget categories with proportional tax distribution.

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (both client and server with hot reload)
pnpm dev:server       # Start only the Express server with tsx watch
pnpm dev:client       # Start only the Vite dev server
pnpm build            # Build client for production
pnpm start            # Start production server
pnpm typecheck        # Run TypeScript type checking
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm format           # Format code with Prettier
pnpm docker:build     # Build Docker image
pnpm docker:run       # Run Docker container with .env file
```

## Architecture

### Directory Structure

- `server/` - Express 5 backend (TypeScript, ESM)
  - `agent/` - AI receipt processing using Vercel AI SDK with OpenAI GPT
  - `telegram/` - Telegram bot webhook handling and message sending
  - `web/` - Web upload endpoints with SSR
  - `state/` - Conversation state management
- `client/` - Vite + Preact frontend (minimal, just entry point)
- `shared/` - Shared code between server and client
  - `pages/` - Page components (PasswordPage, UploadPage, ReviewPage, DonePage, ErrorPage)
  - `components/ui/` - Reusable UI components (Button, Card, Input, etc.)
  - `components/receipt/` - Receipt display components
  - `types.ts` - Shared TypeScript types

### Key Patterns

**Import Aliases**: Use absolute imports with these prefixes (enforced by ESLint):

- `@/server/*` for server code
- `@/client/*` for client code
- `@/shared/*` for shared code

**Server-Side Rendering**: The web UI uses Preact SSR. Express routes render pages to HTML using `preact-render-to-string`, then hydrate on the client.

**Conversation Flow**: The app tracks Telegram conversations through states (IDLE → PROCESSING → AWAITING_CONFIRM) stored in memory. Users can confirm categorizations or provide corrections to reprocess.

**Receipt Processing**: The AI agent uses a structured output schema with Zod validation to ensure consistent receipt parsing results.

## Environment Variables

Required in `.env` (see `.env.example`):

- `TELEGRAM_BOT_TOKEN` - Bot token from @BotFather
- `SENDER_CHAT_ID` - Telegram chat ID authorized to send receipts
- `RECEIVER_CHAT_ID` - Telegram chat ID to receive summaries
- `OPENAI_API_KEY`
- `UPLOAD_PASSWORD`
- `PORT` (optional, defaults to 3000)

## Tech Stack

- **Backend**: Node.js 22+, Express 5, TypeScript (ESM)
- **Frontend**: Preact, Vite, Tailwind CSS
- **AI**: OpenAI GPT via Vercel AI SDK (`ai` package)
- **Messaging**: Telegram Bot API
- **Validation**: Zod
