# Receipt Wrangler

A Telegram-based receipt categorization bot for family budgeting. Send receipt photos or text via Telegram and get them automatically parsed and categorized into budget categories using AI.

## Features

- **AI-Powered Receipt Parsing** - Uses OpenAI GPT with vision capabilities to read and interpret receipt images
- **Smart Categorization** - Automatically distributes items into budget categories (Groceries, Baby Supplies, Pharmacy, etc.)
- **Telegram Interface** - Message receipts directly to a Telegram bot (free, no per-message costs)
- **Web Upload** - Password-protected web interface for uploading receipts
- **Tax Distribution** - Evenly distributes store taxes across categories proportionally
- **User Corrections** - Provide feedback to recategorize items when needed

## Tech Stack

**Backend:** Node.js, Express 5, TypeScript
**Frontend:** Preact, Vite, Tailwind CSS
**AI:** OpenAI GPT (via Vercel AI SDK)
**Messaging:** Telegram Bot API
**Deployment:** Docker

## Prerequisites

- Node.js 22 (LTS)
- pnpm 10.8+
- Telegram Bot (created via @BotFather)
- OpenAI API key

## Setup

1. **Clone and install dependencies**

   ```bash
   git clone <repo-url>
   cd receipt-wrangler
   pnpm install
   ```

2. **Create a Telegram Bot**
   - Open Telegram and search for `@BotFather`
   - Send `/newbot` and follow the prompts to create your bot
   - Copy the bot token (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

3. **Get your Chat IDs**
   - Start a chat with your new bot (search for it and click Start)
   - Send any message to the bot
   - Visit `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Find your `chat.id` in the response (it's a number like `123456789`)
   - Repeat for the receiver if different from sender

4. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your credentials:

   ```bash
   # Telegram Bot
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   SENDER_CHAT_ID=123456789      # Chat ID authorized to send receipts
   RECEIVER_CHAT_ID=987654321    # Chat ID to receive summaries

   # OpenAI
   OPENAI_API_KEY=sk-your-api-key

   # Web upload
   UPLOAD_PASSWORD=your-password

   # Server
   PORT=3000
   NODE_ENV=development
   ```

5. **Set up the webhook**

   Once your server is running and publicly accessible (via ngrok, Cloudflare Tunnel, or deployed):

   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-domain.com/webhook/telegram"
   ```

6. **Start development server**

   ```bash
   pnpm dev
   ```

## Usage

### Via Telegram

1. Open Telegram and message your bot
2. Send a receipt photo (with optional caption for instructions)
3. Receive a categorized breakdown
4. Reply YES to confirm or provide corrections

### Via Web Upload

1. Navigate to `http://localhost:3000/upload`
2. Enter the upload password
3. Upload receipt image(s) or paste receipt text
4. Review the categorization and confirm

## Scripts

| Command          | Description                              |
| ---------------- | ---------------------------------------- |
| `pnpm dev`       | Start development server with hot reload |
| `pnpm build`     | Build client for production              |
| `pnpm start`     | Start production server                  |
| `pnpm typecheck` | Run TypeScript type checking             |
| `pnpm lint`      | Run ESLint                               |
| `pnpm lint:fix`  | Fix ESLint issues                        |
| `pnpm format`    | Format code with Prettier                |

## Docker

```bash
# Build
pnpm docker:build

# Run
pnpm docker:run

# Or with Docker Compose
docker-compose up
```

## Project Structure

```
receipt-wrangler/
├── server/           # Express backend
│   ├── agent/        # AI receipt processing
│   ├── telegram/     # Telegram bot integration
│   ├── web/          # Web upload endpoints
│   └── state/        # Conversation state
├── client/           # Vite + Preact frontend
├── shared/           # Shared types and components
│   ├── pages/        # Page components
│   └── components/   # UI components
├── Dockerfile
└── docker-compose.yml
```

## Budget Categories

- Groceries
- Baby Supplies
- Bathroom Supplies
- House Supplies
- Pharmacy
- Charity
- Unknown (for unclear items)
- Custom categories (supported)

## License

MIT
