# Mati AI Worker Service

External AI processing worker for the Mati platform. This service handles heavy AI operations (transcription, report generation) separately from the main web server to improve performance and reliability.

## Architecture

This worker service processes jobs from a shared database queue and sends progress updates back to the web server via HTTP webhooks. This separation ensures:

- Reliable socket communication (web server stays responsive)
- Better resource isolation
- Improved scalability
- No blocking of main event loop

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run locally:**
   ```bash
   npm run dev
   ```

4. **Run in production:**
   ```bash
   npm start
   ```

## Environment Variables

See `.env.example` for all required configuration options.

Key variables:
- `WEB_SERVER_URL`: URL of the main web server for webhook callbacks
- `WORKER_API_KEY`: Shared secret for authenticating webhook requests
- `DATABASE_URL`: Supabase database connection
- `OPENAI_API_KEY`: OpenAI API key for AI processing

## Deployment

This service is designed to run as a Render Background Worker:

1. Create new Background Worker service on Render
2. Connect to this repository
3. Set environment variables
4. Deploy

## Job Processing

The worker polls the database for jobs and processes them sequentially:

1. **Transcription jobs**: Convert audio to text using OpenAI Whisper
2. **Report generation jobs**: Generate advisor and client reports using GPT
3. **Report regeneration jobs**: Regenerate reports with additional notes

Progress updates are sent to the web server via HTTP webhooks, which then forward them to the frontend via Socket.IO.

## Memory Management

The worker includes aggressive memory management for large file processing:
- Garbage collection after each chunk
- Memory usage monitoring
- Cleanup of temporary files
- Optimized for 512MB containers
