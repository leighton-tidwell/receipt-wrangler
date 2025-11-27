# Receipt Wrangler

An SMS-based receipt categorization bot for family budgeting. Send receipt photos or text via SMS and get them automatically parsed and categorized into budget categories using AI.

## Features

- **AI-Powered Receipt Parsing** - Uses OpenAI GPT with vision capabilities to read and interpret receipt images
- **Smart Categorization** - Automatically distributes items into budget categories (Groceries, Baby Supplies, Pharmacy, etc.)
- **SMS Interface** - Text receipts directly to the bot via Twilio
- **Web Upload** - Password-protected web interface for uploading receipts
- **Tax Distribution** - Evenly distributes store taxes across categories proportionally
- **User Corrections** - Provide feedback to recategorize items when needed

## Tech Stack

**Backend:** Node.js, Express 5, TypeScript
**Frontend:** Preact, Vite, Tailwind CSS
**AI:** OpenAI GPT (via Vercel AI SDK)
**SMS:** Twilio
**Deployment:** Docker

## Prerequisites

- Node.js 22 (LTS)
- pnpm 10.8+
- Twilio account with a phone number
- OpenAI API key

## Setup

1. **Clone and install dependencies**

   ```bash
   git clone <repo-url>
   cd receipt-wrangler
   pnpm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your credentials:

   ```bash
   # Twilio
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890

   # Phone numbers
   SENDER_PHONE_NUMBER=+1234567890    # Number authorized to send receipts
   RECEIVER_PHONE_NUMBER=+1234567890  # Number to receive summaries

   # OpenAI
   OPENAI_API_KEY=sk-your-api-key

   # Web upload
   UPLOAD_PASSWORD=your-password

   # Server
   PORT=3000
   NODE_ENV=development
   ```

3. **Start development server**

   ```bash
   pnpm dev
   ```

## Usage

### Via SMS

1. Configure your Twilio webhook to point to `https://your-domain.com/webhook/sms`
2. Send a receipt photo (with optional text instructions) to your Twilio number
3. Receive a categorized breakdown
4. Confirm or provide corrections

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
│   ├── twilio/       # SMS integration
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
