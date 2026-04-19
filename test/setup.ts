// Set required environment variables before any module loads config.
process.env.TELEGRAM_BOT_TOKEN ||= 'test-bot-token';
process.env.SENDER_CHAT_ID ||= '111';
process.env.RECEIVER_CHAT_ID ||= '222';
process.env.OPENAI_API_KEY ||= 'sk-test';
process.env.UPLOAD_PASSWORD ||= 'test-password';
process.env.NODE_ENV ||= 'test';
process.env.CHECKPOINT_DB ||= ':memory:';
