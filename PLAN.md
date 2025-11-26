# Receipt Wrangler - Project Plan

A SMS-based receipt categorization bot that helps split grocery/store receipts into budget categories.

## Overview

**Flow:**
1. Wife texts receipt (photo(s) or pasted text) + optional guidance to Twilio number
2. Bot processes receipt using OpenAI vision/text capabilities
3. Bot asks clarifying questions if needed (replies to wife)
4. Bot sends categorized breakdown to wife for confirmation
5. Wife confirms ("yes", "looks good", etc.)
6. Bot sends final concise summary to husband's phone number

**Constraints:**
- Only responds to wife's phone number (all other numbers ignored)
- One receipt at a time - pushes back if new receipt sent before confirmation
- No persistence/database - SMS threads serve as history

---

## Categories

| Category | Examples |
|----------|----------|
| **Groceries** | Regular food items (tax-exempt in Texas) |
| **Baby Supplies** | Fruit, kids' snacks, toys, anything for daughter |
| **Bathroom Supplies** | Soap, shampoo, toilet items, etc. |
| **House Supplies** | Paper towels, foil, trash bags, toilet paper |
| **Charity** | Round-up donations on receipts |

---

## Texas Sales Tax Rules

- **Tax-exempt**: Unprepared food (groceries, baby food, fruit, snacks)
- **Taxable at ~8.25%**: Household supplies, bathroom supplies, prepared foods, non-food items
- The bot will calculate tax per category based on what's taxable, ensuring subtotal + tax = total

---

## Tech Stack

- **Runtime**: Node.js (latest LTS)
- **Package Manager**: pnpm
- **AI**: OpenAI API via Vercel AI SDK (Agents)
- **SMS/MMS**: Twilio
- **Containerization**: Docker
- **Hosting**: Local development initially, Digital Ocean later

---

## Environment Variables Required

```env
# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890  # The Twilio number that receives texts

# Phone Numbers
WIFE_PHONE_NUMBER=+1234567890    # Only respond to this number
HUSBAND_PHONE_NUMBER=+1234567890 # Send final summaries here

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Optional
PORT=3000                        # Server port for Twilio webhooks
NODE_ENV=development
```

---

## Architecture

```
┌─────────────┐     SMS/MMS      ┌─────────────┐
│   Wife's    │ ───────────────> │   Twilio    │
│   Phone     │ <─────────────── │   Number    │
└─────────────┘                  └──────┬──────┘
                                        │ webhook
                                        v
                                 ┌─────────────┐
                                 │  Express    │
                                 │  Server     │
                                 └──────┬──────┘
                                        │
                                        v
                                 ┌─────────────┐
                                 │  AI Agent   │
                                 │  (Vercel    │
                                 │   AI SDK)   │
                                 └──────┬──────┘
                                        │
                                        v
                                 ┌─────────────┐
                                 │  OpenAI     │
                                 │  (Vision +  │
                                 │   Text)     │
                                 └─────────────┘
                                        │
                                        v
                                 ┌─────────────┐     SMS
                                 │  Twilio     │ ──────────> Husband's Phone
                                 │  (outbound) │             (final summary)
                                 └─────────────┘
```

---

## Conversation State Machine

```
┌──────────────┐
│    IDLE      │  (waiting for receipt)
└──────┬───────┘
       │ receives image/text
       v
┌──────────────┐
│  PROCESSING  │  (parsing receipt, categorizing)
└──────┬───────┘
       │
       ├──── needs clarification ────> ┌─────────────────┐
       │                               │ AWAITING_ANSWER │
       │ <──── receives answer ─────── └─────────────────┘
       │
       v
┌──────────────────┐
│ AWAITING_CONFIRM │  (sent breakdown to wife, waiting for "yes")
└──────┬───────────┘
       │ receives confirmation
       v
┌──────────────┐
│ SEND_SUMMARY │  (sends to husband, returns to IDLE)
└──────────────┘
```

**Note:** State will be stored in-memory per phone number. Since only wife's number is allowed and one receipt at a time, a simple object suffices.

---

## Project Structure

```
receipt-wrangler/
├── src/
│   ├── index.ts              # Express server entry point
│   ├── twilio/
│   │   ├── webhook.ts        # Handle incoming SMS/MMS
│   │   └── send.ts           # Send outbound SMS
│   ├── agent/
│   │   ├── index.ts          # AI agent setup (Vercel AI SDK)
│   │   ├── tools.ts          # Agent tools (categorize, calculate tax, etc.)
│   │   └── prompts.ts        # System prompts and category definitions
│   ├── state/
│   │   └── conversation.ts   # In-memory conversation state
│   ├── receipt/
│   │   ├── parser.ts         # Parse receipt from image/text
│   │   ├── categorizer.ts    # Categorize items
│   │   └── tax.ts            # Texas tax calculations
│   └── utils/
│       └── format.ts         # Format messages for SMS
├── Dockerfile
├── docker-compose.yml
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── .env.example
├── .gitignore
├── PLAN.md
└── README.md
```

---

## Implementation Phases

### Phase 1: Project Setup
- [x] Create project directory and plan
- [ ] Initialize Node.js project with TypeScript
- [ ] Install dependencies (Vercel AI SDK, Twilio, Express, etc.)
- [ ] Set up Docker configuration
- [ ] Create .env.example and .gitignore

### Phase 2: Twilio Integration
- [ ] Set up Express server with webhook endpoint
- [ ] Handle incoming SMS/MMS from Twilio
- [ ] Implement phone number filtering (wife only)
- [ ] Implement outbound SMS sending
- [ ] Test with ngrok for local development

### Phase 3: AI Agent Core
- [ ] Set up Vercel AI SDK with OpenAI
- [ ] Create receipt parsing logic (image + text support)
- [ ] Implement categorization with category definitions
- [ ] Implement Texas sales tax calculation
- [ ] Create agent tools and prompts

### Phase 4: Conversation Flow
- [ ] Implement state machine for conversation
- [ ] Handle multi-image receipts (combine before processing)
- [ ] Implement clarifying questions flow
- [ ] Implement confirmation flow
- [ ] Implement final summary sending to husband

### Phase 5: Testing & Polish
- [ ] Test with real receipts
- [ ] Handle edge cases (unreadable receipts, weird formats)
- [ ] Ensure math always adds up (validation)
- [ ] Test Docker container
- [ ] Document deployment steps

---

## Message Formats

### Final Summary (sent to husband)
```
H-E-B - Nov 26, 2025

Groceries: $45.23
Baby Supplies: $12.50
House Supplies: $8.75 (+$0.72 tax)
Bathroom Supplies: $6.99 (+$0.58 tax)

Total: $74.77
```

### Confirmation (sent to wife)
```
Here's the breakdown - reply YES to confirm:

GROCERIES ($45.23)
- Milk $3.99
- Bread $2.50
- Chicken breast $12.99
...

BABY SUPPLIES ($12.50)
- Apples $4.99
- Goldfish crackers $3.51
- Bananas $4.00

HOUSE SUPPLIES ($8.75 + $0.72 tax = $9.47)
- Paper towels $5.99
- Trash bags $2.76

BATHROOM SUPPLIES ($6.99 + $0.58 tax = $7.57)
- Hand soap $3.99
- Toothpaste $3.00

Subtotal: $73.47
Tax: $1.30
Total: $74.77
```

---

## Twilio Setup Instructions

1. Create a Twilio account at https://www.twilio.com
2. Buy a phone number with SMS and MMS capability
3. Get your Account SID and Auth Token from the Twilio Console
4. Configure the webhook URL for incoming messages:
   - Go to Phone Numbers > Manage > Active Numbers
   - Click your number
   - Under "Messaging", set webhook URL to: `https://your-domain.com/webhook/sms`
   - For local dev, use ngrok: `ngrok http 3000` then use the ngrok URL

---

## Local Development

```bash
# Install dependencies
pnpm install

# Copy environment file and fill in values
cp .env.example .env

# Run with hot reload
pnpm dev

# In another terminal, expose localhost via ngrok
ngrok http 3000
# Copy the ngrok URL and set it as your Twilio webhook
```

---

## Docker Deployment

```bash
# Build
docker build -t receipt-wrangler .

# Run
docker run -d \
  --name receipt-wrangler \
  -p 3000:3000 \
  --env-file .env \
  receipt-wrangler
```

---

## Next Steps

1. Review this plan
2. Set up Twilio account and get credentials
3. Get OpenAI API key
4. Begin Phase 1 implementation
