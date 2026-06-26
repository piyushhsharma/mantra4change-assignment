## Setup
npm install

npx prisma generate

npx prisma migrate dev --name init

npm run db:seed

npm run dev

Add CSVs to `/data` and images to `/public/images` first (not in repo).
Add `.env` with `OPENAI_API_KEY=your_key` for AI narratives to work — 
without it, the app falls back to template-based reports.

## How it's built

- Risk classification and all KPI/attendance math is plain code, no AI 
  involved — lives in `/lib/engine/riskEngine.ts` and `metrics.ts`
- AI is only used in the grant reporting page, to turn already-computed 
  facts into a sentence. It can't see raw data and there's a toggle to 
  turn it off — if it's off (or the API call fails) it falls back to a 
  template sentence built from the same facts

Risk thresholds (given in the brief): 75%+ On Track, 60-75% Behind, 
35-60% At Risk, below 35% Critical.

## Stack

Next.js, TypeScript, Tailwind, Prisma + SQLite, Recharts, OpenAI API.

## Limitations

- SQLite was just for speed of setup — wouldn't use it for a real 
  production version, would switch to Postgres
- No auth/login yet
- No PDF export, report preview is in-app with a copy button

## Used AI tooling (Windsurf) for scaffolding/UI, wrote the risk engine 
and metrics logic myself since that's the core logic of the app.
