# Auto Bump

<p align="center">
  <img src="https://badge.教育目的.com/?lang=en&color=blue" alt="Education Purpose Blue" />
</p>

A small Discord bump scheduler with a companion statistics bot.

Runtime state, credentials, and local configuration are intentionally excluded from Git.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

   Add your required tokens to `.env`.

3. Copy the channel configuration:

   ```bash
   cp config/channels.example.json config/channels.json
   ```

4. Copy the service configuration:

   ```bash
   cp config/services.example.json config/services.json
   ```

   Configure the services you want to use.

5. Start the statistics bot:

   ```bash
   npm start
   ```

6. Start the bump scheduler:

   ```bash
   npm run bump
   ```

## Runtime Data

Runtime history is stored in:

```text
data/
```

The directory is ignored by Git.

## Disclaimer

> [!WARNING]
> This project uses a self-bot library for the scheduler.  
> Self-bots may violate Discord's Terms of Service.
