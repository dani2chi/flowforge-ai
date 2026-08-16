# FlowForge AI

AI workflow automation system. Portfolio piece showing a production-style LLM pipeline with structured outputs, validation, prompt versioning, human-in-the-loop review, and a simulated CRM.

> **Portfolio demo.** Runs in mock-AI mode by default — no live LLM calls, no API keys required. The structure mirrors a real production pipeline so swapping in OpenAI / Anthropic is a small change in `lib/`.

## What's in here

- **8-step pipeline** — Input → Preprocess → AI extract → Validate → Score → Reply → Human review → API action
- **Strict JSON outputs** — Every prompt has an explicit schema. Validation fails closed: low confidence or missing fields routes the run to the human review queue.
- **Prompt versioning** — Every prompt has a version, status (Active / Draft / Deprecated), and history. Runs are pinned to the prompt version they used.
- **Human-in-the-loop** — A reviewer approves, edits, or rejects every output before it pushes to the CRM.
- **Run logs** — Full step-trace per run with INFO / WARN / ERROR / SUCCESS levels.
- **Simulated CRM** — Approved runs become structured lead records with score, priority, status, and source.
- **Seeded data** — 286 historical runs, 8 hand-written realistic lead messages, 5 prompt templates, full step logs.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Server | Server actions running on Node.js |
| Database | SQLite via Prisma (PostgreSQL-compatible) |
| Charts | Recharts |
| AI | Mock mode for demo; structure ready for OpenAI / Anthropic / on-prem |
| Auth (demo) | Signed cookie with Admin / Operator / Viewer roles |

## Run it locally

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open http://localhost:3000, pick a demo role at `/login`.

### Scripts

```bash
npm run dev      # dev server
npm run build    # build
npm run db:seed  # re-seed (286 runs, prompts, leads, logs)
npm run db:reset # reset migrations + reseed
```

## Repo layout

```
flowforge-ai/
├── prisma/
│   ├── schema.prisma                # Workflow, AutomationRun, AIOutput, Review, CRMLead, PromptTemplate, AutomationLog
│   └── seed.ts                      # deterministic seed with realistic lead messages
├── src/
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── dashboard/           # runs, success rate, top leads
│   │   │   ├── workflows/           # 8-step pipeline visualiser
│   │   │   ├── intake/              # manual run submission
│   │   │   ├── review/              # output review with extracted fields, summary, reply draft
│   │   │   ├── leads/               # simulated CRM
│   │   │   ├── prompts/             # prompt templates with versions and JSON schema
│   │   │   ├── logs/                # per-run step trace
│   │   │   ├── analytics/           # success / review / failure breakdown, model mix
│   │   │   └── settings/            # models, API keys (masked), integrations, queue rules
│   │   └── login/                   # role picker
│   ├── components/                  # ui/, layout/, charts/
│   └── lib/
│       ├── db.ts
│       ├── auth.ts
│       └── utils.ts
└── .env.example                     # copy to .env before first run
```

## Going live (mock → real LLM)

1. Add `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`) to `.env`.
2. Add a small `lib/ai.ts` that takes a `PromptTemplate` + input, calls the provider with `response_format: { type: "json_object" }`, and returns parsed output.
3. Replace the mock outputs in `intake/page.tsx`'s server action with the real call.
4. Validate the output against the prompt's schema using Zod (the schema field is already JSON in the DB).
5. Branch on `validationStatus` and `confidence` to route to `NEEDS_REVIEW` or `APPROVED`.

## License

[MIT](./LICENSE) — free to use, modify, and distribute with attribution.
