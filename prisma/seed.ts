import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

let s = 4242;
const rand = () => {
  s = (s * 1103515245 + 12345) & 0x7fffffff;
  return s / 0x7fffffff;
};
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const minutesAgo = (n: number) => new Date(Date.now() - n * 60 * 1000);

async function main() {
  console.log("🌱 Seeding FlowForge AI…");

  await db.automationLog.deleteMany();
  await db.cRMLead.deleteMany();
  await db.review.deleteMany();
  await db.aIOutput.deleteMany();
  await db.automationRun.deleteMany();
  await db.workflowStep.deleteMany();
  await db.workflow.deleteMany();
  await db.promptTemplate.deleteMany();
  await db.user.deleteMany();

  // Users
  const admin = await db.user.create({
    data: { name: "Avery Lin", email: "avery.lin@flowforge.demo", role: "ADMIN" },
  });
  const operator = await db.user.create({
    data: { name: "Mateo Salazar", email: "mateo.salazar@flowforge.demo", role: "OPERATOR" },
  });
  const viewer = await db.user.create({
    data: { name: "Hana Brackett", email: "hana.brackett@flowforge.demo", role: "VIEWER" },
  });

  // Workflows
  const leadFlow = await db.workflow.create({
    data: {
      name: "Lead Intake & CRM Automation",
      description: "Convert inbound prospect messages into structured, scored CRM records with a draft reply.",
      status: "ACTIVE",
    },
  });
  const supportFlow = await db.workflow.create({
    data: {
      name: "Support Ticket Triage",
      description: "Classify support tickets, extract issue details, and route to the right team.",
      status: "ACTIVE",
    },
  });
  const meetingFlow = await db.workflow.create({
    data: {
      name: "Meeting Notes → Action Items",
      description: "Turn raw meeting transcripts into structured action items with owners.",
      status: "DRAFT",
    },
  });

  // Workflow steps for Lead Intake
  const steps = [
    { name: "Receive input", type: "INPUT", description: "Inbound message from form, email, or chat" },
    { name: "Clean & normalize text", type: "PREPROCESS", description: "Strip signatures, normalize whitespace, redact obvious PII" },
    { name: "Extract structured fields", type: "AI_PROMPT", description: "LLM extracts contact, company, service, budget, timeline" },
    { name: "Validate JSON output", type: "VALIDATE", description: "Zod schema validation; flag missing or low-confidence fields" },
    { name: "Score lead quality", type: "SCORE", description: "Rule-based scoring on budget, timeline, fit, and intent" },
    { name: "Generate reply draft", type: "AI_PROMPT", description: "Compose a personalized reply matching tone of voice" },
    { name: "Human review", type: "HUMAN_REVIEW", description: "Operator approves, edits, or rejects before send" },
    { name: "Push to CRM", type: "API_ACTION", description: "Create or update record; log all activity" },
  ];
  for (let i = 0; i < steps.length; i++) {
    await db.workflowStep.create({
      data: { workflowId: leadFlow.id, ...steps[i], order: i },
    });
  }

  // Prompt templates
  await db.promptTemplate.createMany({
    data: [
      {
        name: "Lead extraction",
        purpose: "Extract structured contact, company, service, budget, timeline from raw text.",
        systemPrompt: "You are an information extraction system. Output strict JSON matching the schema. Never invent fields. Use null when unknown.",
        userPrompt: "Extract structured details from this prospect message.\n\n{{input}}\n\nReturn JSON only.",
        outputSchema: JSON.stringify(
          {
            contact_name: "string | null",
            company: "string | null",
            industry: "string | null",
            service_needed: "string",
            budget: "string | null",
            timeline: "string | null",
            pain_points: ["string"],
            priority: "low | medium | high",
            lead_score: "number",
            recommended_action: "string",
            confidence: "number",
          },
          null,
          2,
        ),
        version: 4,
        status: "ACTIVE",
      },
      {
        name: "Lead scoring rubric",
        purpose: "Score lead quality 0-100 from extracted fields plus message text.",
        systemPrompt: "You score B2B leads. Use the rubric: budget fit 30, timeline urgency 25, service fit 25, intent 20.",
        userPrompt: "Score this lead. Inputs:\n{{extracted_fields}}\nMessage:\n{{input}}\n\nReturn JSON: { lead_score, reasoning }.",
        outputSchema: JSON.stringify({ lead_score: "number", reasoning: "string" }, null, 2),
        version: 2,
        status: "ACTIVE",
      },
      {
        name: "Reply generation",
        purpose: "Draft a polite, specific reply matching tone of voice.",
        systemPrompt: "You write concise, warm B2B replies that confirm understanding and propose a clear next step (a call, a brief, or a referral).",
        userPrompt: "Write a 90-130 word reply to this prospect. Tone: confident, friendly. End with one clear call-to-action.\n\nProspect message:\n{{input}}\n\nExtracted context:\n{{extracted_fields}}",
        outputSchema: JSON.stringify({ reply_draft: "string", subject_suggestion: "string" }, null, 2),
        version: 6,
        status: "ACTIVE",
      },
      {
        name: "Summary",
        purpose: "Compress prospect message into a 1-2 sentence summary.",
        systemPrompt: "You summarize prospect intent in plain English. Two sentences max.",
        userPrompt: "Summarize this message:\n\n{{input}}",
        outputSchema: JSON.stringify({ summary: "string" }, null, 2),
        version: 3,
        status: "ACTIVE",
      },
      {
        name: "Classification (legacy)",
        purpose: "Old single-shot classifier. Kept for comparison.",
        systemPrompt: "Classify the prospect message into one of: hot, warm, cold.",
        userPrompt: "{{input}}",
        outputSchema: JSON.stringify({ class: "hot | warm | cold" }, null, 2),
        version: 1,
        status: "DEPRECATED",
      },
    ],
  });

  // Sample lead messages (fictional)
  type Sample = {
    sourceType: string;
    input: string;
    name?: string;
    email?: string;
    company?: string;
    industry?: string;
    serviceNeeded: string;
    budget?: string;
    timeline?: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    leadScore: number;
    confidence: number;
    pains: string[];
    summary: string;
    reply: string;
    recommendedAction: string;
  };

  const samples: Sample[] = [
    {
      sourceType: "FORM",
      input: "Hi, I run a small logistics company in Manchester and we're looking for a custom dashboard to track deliveries, driver availability, and customer updates. We currently use spreadsheets and WhatsApp. Ideally we need something built in the next 6 weeks. Budget is around $8k–$12k. Can you help?",
      name: null as never,
      company: "Manchester logistics company",
      industry: "Logistics",
      serviceNeeded: "Custom delivery operations dashboard",
      budget: "$8k–$12k",
      timeline: "6 weeks",
      priority: "HIGH",
      leadScore: 84,
      confidence: 0.92,
      pains: ["Spreadsheet sprawl", "Disjointed driver comms", "No realtime visibility"],
      summary: "A Manchester logistics company wants to replace spreadsheets and WhatsApp with a custom dashboard for deliveries, driver availability, and customer updates within 6 weeks at $8k–$12k.",
      reply: "Thanks for reaching out — happy to help. The mix you described (delivery tracking, driver availability, customer updates) is something we've shipped a few times for similar logistics teams, so the 6-week window is realistic at that budget. Could we book a 25-minute discovery call this week to walk through your delivery volume, current spreadsheet structure, and the customer-facing piece? I'll come prepared with a rough scope and a sample dashboard. Best — Avery",
      recommendedAction: "High-priority lead. Book a 25-minute discovery call. Ask about delivery volume, driver count, and customer-facing requirements.",
    },
    {
      sourceType: "EMAIL",
      input: "Hello, I'm Idris from Lambent Labs — we run sample-tracking for a small biotech R&D team (~15 scientists). Our current LIMS is too heavy and we're after a lighter internal tool: project + sample lineage, batch QA, simple audit log. Probably $20k+ if it's good. Q3 ideal. Thanks.",
      name: "Idris (Lambent Labs)",
      email: "idris@lambentlabs.demo",
      company: "Lambent Labs",
      industry: "Biotech",
      serviceNeeded: "Lightweight internal sample-tracking tool",
      budget: "$20k+",
      timeline: "Q3",
      priority: "HIGH",
      leadScore: 88,
      confidence: 0.94,
      pains: ["Heavy legacy LIMS", "Manual audit trail", "Hard to search lineage"],
      summary: "Lambent Labs (15-scientist biotech) wants a lightweight LIMS replacement with project/sample lineage, batch QA, and audit log; Q3 timeline, $20k+ budget.",
      reply: "Hi Idris — thanks for reaching out. We've helped a few small R&D teams move off heavy LIMS into something that actually fits their workflow, so this scope sounds like a good match. A Q3 build is comfortable. Could we book 30 minutes to walk through a typical sample's path through your team and see your current audit needs? I'll come with two reference architectures. Best — Avery",
      recommendedAction: "High-quality lead — strong intent, clear budget. Schedule a 30-minute discovery call. Bring two reference architectures.",
    },
    {
      sourceType: "CHAT",
      input: "we have a leave portal but staff complain it's slow. need to know if you fix existing apps or only build new. small NGO, 80 staff",
      company: "Small NGO",
      serviceNeeded: "Performance audit and improvement for existing leave portal",
      budget: null as never,
      timeline: null as never,
      priority: "MEDIUM",
      leadScore: 58,
      confidence: 0.71,
      pains: ["Slow existing portal", "Unclear if remediation possible"],
      summary: "An 80-staff NGO has a slow leave portal and is unsure whether we fix existing apps or only build new.",
      reply: "Yes — about a third of our work is improving existing apps rather than rebuilds. For a leave portal of that size, we typically start with a 1-week paid audit (~$1.2k) and tell you honestly whether a rewrite is worth it. Want me to send a short scoping form?",
      recommendedAction: "Mid-tier lead. Confirm scope. Offer a paid audit as a low-friction next step.",
    },
    {
      sourceType: "TICKET",
      input: "Need a price for a marketing site refresh. Five pages. Just curious.",
      serviceNeeded: "Five-page marketing site refresh",
      priority: "LOW",
      leadScore: 28,
      confidence: 0.62,
      pains: ["Stale marketing site"],
      summary: "Vague enquiry for a five-page marketing site refresh, low intent.",
      reply: "Happy to help. For a five-page refresh we typically scope between $4k–$9k depending on copy, brand work, and CMS. Could you share the current site and tell me what's prompting the refresh? I'll send a tighter range within a day.",
      recommendedAction: "Low-priority lead. Send a price range and ask qualifying questions before investing time.",
    },
    {
      sourceType: "FORM",
      input: "We're a mid-sized hospitality group with 12 properties. Our reservation reporting takes 3 days a month to compile manually. Looking for an automation that pulls from our PMS into a clean monthly board pack. Budget flex, want to start in 4 weeks.",
      company: "Mid-sized hospitality group (12 properties)",
      industry: "Hospitality",
      serviceNeeded: "Automated monthly board-pack reporting from PMS",
      budget: "Flexible",
      timeline: "Start in 4 weeks",
      priority: "HIGH",
      leadScore: 82,
      confidence: 0.9,
      pains: ["3 days/month manual compilation", "PMS data hard to get out cleanly"],
      summary: "A 12-property hospitality group wants automated monthly board-pack reporting pulled from their PMS, replacing 3 days of manual work, starting in 4 weeks.",
      reply: "Thanks for the details. Three days a month into a single click is a great target — we've done very similar work for a hotel group last year. I'd suggest a 2-week paid pilot focused on one property to lock down the data shape, then roll out to the remaining eleven. Could we get on a call this week?",
      recommendedAction: "High-priority lead. Propose a 2-week paid pilot on one property.",
    },
    {
      sourceType: "EMAIL",
      input: "Hi — quick one. We have an internal Airtable that has gotten too messy. We need someone to design a proper postgres schema and migrate. ~50k records. Decent budget. Sometime this quarter.",
      company: "Internal team",
      serviceNeeded: "Airtable → Postgres schema design and migration",
      budget: "Decent",
      timeline: "This quarter",
      priority: "MEDIUM",
      leadScore: 70,
      confidence: 0.85,
      pains: ["Messy Airtable", "Schema drift", "No relational integrity"],
      summary: "A team needs to migrate ~50k records from a messy Airtable to a proper Postgres schema this quarter.",
      reply: "We do this often — happy to help. A migration of that size usually splits into: 1) discovery & schema design (~1 week), 2) build + ETL (~2 weeks), 3) parallel-run + cutover. Could you send a sample export so I can sketch a target schema before we talk? Best — Avery",
      recommendedAction: "Qualified lead. Request sample data export before discovery call.",
    },
    {
      sourceType: "FORM",
      input: "Hello! Looking for a developer who can extend our existing Shopify checkout to add some custom shipping rules and a B2B-only payment gateway. Need someone fast — kicking off next week.",
      company: "Existing Shopify merchant",
      industry: "Retail",
      serviceNeeded: "Shopify checkout extension with custom shipping rules and B2B gateway",
      budget: null as never,
      timeline: "Next week",
      priority: "HIGH",
      leadScore: 76,
      confidence: 0.88,
      pains: ["Standard checkout doesn't support B2B requirements", "Custom shipping rules"],
      summary: "Shopify merchant needs a developer to extend checkout with custom shipping rules and a B2B-only payment gateway, kicking off next week.",
      reply: "We can move quickly on this. Shopify checkout extensions for B2B are well-trodden ground for us. To start next week confidently, I'd need 30 minutes to look at your current checkout config and the gateway docs. Could we book that for tomorrow morning? Best — Avery",
      recommendedAction: "Time-sensitive. Book a same-week call to lock in scope.",
    },
    {
      sourceType: "CHAT",
      input: "do you do mobile apps?",
      serviceNeeded: "Mobile app development (unclear scope)",
      priority: "LOW",
      leadScore: 22,
      confidence: 0.55,
      pains: ["Unclear"],
      summary: "Vague enquiry asking whether we do mobile apps.",
      reply: "Yes — we ship React Native and native iOS apps, usually paired with a web admin. What kind of app do you have in mind? A few sentences on the use case helps me give you a useful answer.",
      recommendedAction: "Low-priority lead. Ask qualifying questions before investing time.",
    },
  ];

  // Create runs from samples + extra synthesized runs to hit ~280 total.
  const allRuns: { run: typeof samples[number]; status: string; reviewDecision?: "APPROVED" | "REJECTED" | "EDITED" }[] = [];
  for (const sample of samples) {
    allRuns.push({ run: sample, status: "APPROVED", reviewDecision: "APPROVED" });
  }
  // Add some EDITED, REJECTED, NEEDS_REVIEW, FAILED for variety
  for (let i = 0; i < samples.length - 2; i++) {
    allRuns.push({ run: samples[i], status: "APPROVED", reviewDecision: i % 3 === 0 ? "EDITED" : "APPROVED" });
  }

  let runCount = 0;
  let approvedCount = 0;
  let needsReviewCount = 0;
  let failedCount = 0;

  // Approved runs (visible, with leads)
  for (let i = 0; i < allRuns.length; i++) {
    const { run: sample, reviewDecision } = allRuns[i];
    const ageMinutes = i === 0 ? 12 : 60 + i * 47;
    const wid = leadFlow.id;
    const aRun = await db.automationRun.create({
      data: {
        workflowId: wid,
        sourceType: sample.sourceType,
        inputText: sample.input,
        cleanedInput: sample.input.replace(/\s+/g, " ").trim(),
        status: "APPROVED",
        model: "gpt-4o-mini",
        processingMs: 9000 + Math.floor(rand() * 12000),
        confidence: sample.confidence,
        createdById: operator.id,
        createdAt: minutesAgo(ageMinutes),
        completedAt: minutesAgo(ageMinutes - 1),
      },
    });
    runCount++;
    approvedCount++;

    const parsed = {
      contact_name: sample.name ?? null,
      company: sample.company ?? null,
      industry: sample.industry ?? null,
      service_needed: sample.serviceNeeded,
      budget: sample.budget ?? null,
      timeline: sample.timeline ?? null,
      pain_points: sample.pains,
      priority: sample.priority.toLowerCase(),
      lead_score: sample.leadScore,
      recommended_action: sample.recommendedAction,
      confidence: sample.confidence,
    };

    await db.aIOutput.create({
      data: {
        automationRunId: aRun.id,
        rawOutput: JSON.stringify(parsed, null, 2),
        parsedOutput: JSON.stringify(parsed),
        summary: sample.summary,
        recommendedAction: sample.recommendedAction,
        replyDraft: sample.reply,
        validationStatus: sample.confidence >= 0.8 ? "VALID" : "PARTIAL",
        validationIssues:
          sample.confidence < 0.8
            ? JSON.stringify(["Missing budget field", "Low intent signal"])
            : null,
      },
    });

    await db.review.create({
      data: {
        automationRunId: aRun.id,
        reviewerId: operator.id,
        decision: reviewDecision ?? "APPROVED",
        notes:
          reviewDecision === "EDITED"
            ? "Tightened the reply draft and softened the CTA to match brand voice."
            : null,
      },
    });

    await db.cRMLead.create({
      data: {
        automationRunId: aRun.id,
        name: sample.name ?? null,
        email: sample.email ?? null,
        company: sample.company ?? null,
        industry: sample.industry ?? null,
        serviceNeeded: sample.serviceNeeded,
        budget: sample.budget ?? null,
        timeline: sample.timeline ?? null,
        priority: sample.priority,
        leadScore: sample.leadScore,
        status: pick(["NEW", "QUALIFIED", "QUALIFIED", "CONTACTED", "DISCOVERY"]),
        source: sample.sourceType,
      },
    });

    const logSeed = [
      { level: "INFO", message: "Run started" },
      { level: "INFO", message: "Input cleaned and normalized" },
      { level: "INFO", message: `Calling LLM (${"gpt-4o-mini"})` },
      { level: "SUCCESS", message: `LLM returned in ${aRun.processingMs}ms` },
      { level: sample.confidence >= 0.8 ? "SUCCESS" : "WARN", message: `Validation: ${sample.confidence >= 0.8 ? "passed" : "partial — fields missing"}` },
      { level: "INFO", message: `Lead score: ${sample.leadScore}` },
      { level: "INFO", message: "Reply draft generated" },
      { level: "INFO", message: "Sent to human review queue" },
      { level: "SUCCESS", message: `Reviewer ${reviewDecision === "EDITED" ? "edited and approved" : "approved"} the output` },
      { level: "SUCCESS", message: "CRM record created" },
    ];
    for (let l = 0; l < logSeed.length; l++) {
      await db.automationLog.create({
        data: {
          automationRunId: aRun.id,
          level: logSeed[l].level,
          message: logSeed[l].message,
          createdAt: new Date(aRun.createdAt.getTime() + l * 1500),
        },
      });
    }
  }

  // A "needs review" run (current input, low confidence)
  const reviewRun = await db.automationRun.create({
    data: {
      workflowId: leadFlow.id,
      sourceType: "EMAIL",
      inputText: "hey we might want a thing for our store, not sure yet, can you tell me what it costs",
      cleanedInput: "hey we might want a thing for our store, not sure yet, can you tell me what it costs",
      status: "NEEDS_REVIEW",
      model: "gpt-4o-mini",
      processingMs: 7400,
      confidence: 0.48,
      createdById: operator.id,
      createdAt: minutesAgo(8),
    },
  });
  runCount++;
  needsReviewCount++;
  await db.aIOutput.create({
    data: {
      automationRunId: reviewRun.id,
      rawOutput: JSON.stringify(
        {
          contact_name: null,
          company: null,
          industry: null,
          service_needed: "Unclear — possibly e-commerce work",
          budget: null,
          timeline: null,
          pain_points: ["Unclear"],
          priority: "low",
          lead_score: 18,
          recommended_action: "Send a qualifying questionnaire before quoting.",
          confidence: 0.48,
        },
        null,
        2,
      ),
      parsedOutput: JSON.stringify({}),
      summary: "Vague enquiry about e-commerce work; intent and scope unclear.",
      recommendedAction: "Send a qualifying questionnaire before quoting.",
      replyDraft: "Happy to help. Could you share which platform your store runs on and what kind of \"thing\" you have in mind? A short reply will let me give you a useful price range.",
      validationStatus: "PARTIAL",
      validationIssues: JSON.stringify([
        "Missing contact name",
        "Missing company",
        "Missing budget",
        "Missing timeline",
        "Confidence < 0.6 threshold",
      ]),
    },
  });
  for (const l of [
    { level: "INFO", message: "Run started" },
    { level: "INFO", message: "Input cleaned and normalized" },
    { level: "INFO", message: "Calling LLM (gpt-4o-mini)" },
    { level: "SUCCESS", message: "LLM returned in 7400ms" },
    { level: "WARN", message: "Validation: 5 issues detected" },
    { level: "WARN", message: "Confidence 0.48 below threshold (0.60)" },
    { level: "INFO", message: "Routed to human review queue" },
  ]) {
    await db.automationLog.create({ data: { automationRunId: reviewRun.id, level: l.level, message: l.message } });
  }

  // A failed run for variety
  const failRun = await db.automationRun.create({
    data: {
      workflowId: leadFlow.id,
      sourceType: "EMAIL",
      inputText: "<<malformed multipart attachment payload, no plain text body>>",
      status: "FAILED",
      model: "gpt-4o-mini",
      processingMs: 1200,
      confidence: 0,
      createdById: operator.id,
      createdAt: minutesAgo(220),
    },
  });
  runCount++;
  failedCount++;
  for (const l of [
    { level: "INFO", message: "Run started" },
    { level: "ERROR", message: "Could not extract plain text from input (multipart parse failed)" },
    { level: "ERROR", message: "Run aborted before LLM call" },
  ]) {
    await db.automationLog.create({ data: { automationRunId: failRun.id, level: l.level, message: l.message } });
  }

  // Many synthetic runs for dashboard volume (no AIOutput, just metadata) — distributed over the last 30 days
  const synthSources = ["FORM", "EMAIL", "CHAT", "TICKET", "FORM", "FORM", "EMAIL"];
  for (let i = 0; i < 270; i++) {
    const minutes = 60 * (1 + Math.floor(rand() * 24 * 30));
    const isFailure = rand() < 0.03;
    const isReview = rand() < 0.05;
    const status = isFailure ? "FAILED" : isReview ? "NEEDS_REVIEW" : "APPROVED";
    if (status === "APPROVED") approvedCount++;
    if (status === "NEEDS_REVIEW") needsReviewCount++;
    if (status === "FAILED") failedCount++;
    runCount++;
    await db.automationRun.create({
      data: {
        workflowId: pick([leadFlow.id, supportFlow.id, leadFlow.id, leadFlow.id]),
        sourceType: pick(synthSources),
        inputText: "(historical run)",
        status,
        model: pick(["gpt-4o-mini", "gpt-4o", "gpt-4o-mini", "claude-haiku-4-5"]),
        processingMs: 6000 + Math.floor(rand() * 14000),
        confidence: status === "FAILED" ? 0 : status === "NEEDS_REVIEW" ? 0.4 + rand() * 0.2 : 0.78 + rand() * 0.21,
        createdById: operator.id,
        createdAt: minutesAgo(minutes),
        completedAt: status === "FAILED" ? null : minutesAgo(minutes - 1),
      },
    });
  }

  console.log(`✅ Seed complete: ${runCount} runs (${approvedCount} approved, ${needsReviewCount} review, ${failedCount} failed).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
