# Auto Bump

A small Discord bump scheduler with a companion statistics bot. Runtime state and credentials are intentionally excluded from Git.

## Setup

1. Run `npm install`.
2. Copy `.env.example` to `.env` and add your tokens.
3. Copy `config/channels.example.json` to `config/channels.json`.
4. Copy `config/services.example.json` to `config/services.json` and configure the services you use.
5. Start the statistics bot with `npm start` and the scheduler with `npm run bump`.

Runtime history is written to `data/` and is ignored by Git.

> This project uses a self-bot library for the scheduler. Self-bots may violate Discord's Terms of Service.
