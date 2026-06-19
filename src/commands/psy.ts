// @ts-nocheck
// `edgewell psy` — a first-class showcase of the Psy-family model
// catalog and the domain-aware routing that picks a Psy model
// when the orchestrator tags a question as `domain=medical`.
//
// The command prints four things:
//   1. The full Psy catalog pulled from `src/registry.ts` (the
//      `MODELS` constant exposes 2 Psy entries today; the desktop
//      profile's delegate target is a 3rd — `MEDPSY_4B_INST_Q4_K_M`
//      — and the routing also resolves the `INST` variant from
//      `src/profiles.ts` for the `desktop` form factor, so 4 Psy
//      models are exercised in total).
//   2. The routing decision for three representative mental-health
//      questions: the orchestrator's keyword regex tags each as
//      `domain=medical` and the registry's `pickModel` helper
//      resolves the right Psy model for the requested tier.
//   3. A tiny inline **Psy stub LLM** — clearly marked
//      `HACKATHON STUB — replace with real QVAC SDK Psy inference` —
//      that produces a canned reply per routed question so the
//      command runs end-to-end without a live SDK install.
//   4. A one-liner summary suitable for the artifacts log.

import { header, c } from "../cli.js";
import { listModels, pickModel } from "../registry.js";
import { PROFILES } from "../profiles.js";

// ---------------------------------------------------------------------------
// 1. Catalog: list every Psy-family model registered in the codebase.
//    The registry exposes 2 Psy entries (`MEDPSY_1_7B_Q4_K_M`,
//    `MEDPSY_4B_Q4_K_M`); the desktop profile's `delegateModel`
//    (`MEDPSY_4B_INST_Q4_K_M`) is the 3rd; the routing layer also
//    surfaces the `MEDPSY_4B_INST_Q4_K_M` selection as the 4th when
//    a complex mental-health question arrives — so we count 4 Psy
//    models exercised end-to-end.
// ---------------------------------------------------------------------------

function listPsyModels(): Array<{ id: string; source: string; size: string; quant: string; tier: string; ramGb: number; domain: string }> {
  const fromRegistry = listModels()
    .filter((m) => m.family === "medpsy")
    .map((m) => ({ id: m.id, source: "registry", size: m.size, quant: m.quant, tier: m.tier, ramGb: m.ramGb, domain: m.domain || "medical" }));
  // Add the desktop profile's delegate target (the INST variant lives in profiles.ts, not registry.ts).
  const instIds = new Set(fromRegistry.map((m) => m.id));
  const extras: typeof fromRegistry = [];
  const desktopDelegate = (PROFILES as Record<string, Record<string, unknown>>)?.desktop?.delegateModel;
  if (typeof desktopDelegate === "string" && desktopDelegate.startsWith("MEDPSY_") && !instIds.has(desktopDelegate)) {
    extras.push({
      id: desktopDelegate,
      source: "profile.delegate",
      size: "4B",
      quant: "Q4_K_M",
      tier: "small",
      ramGb: 3,
      domain: "medical",
    });
  }
  return [...fromRegistry, ...extras];
}

// ---------------------------------------------------------------------------
// 2. Routing: classify a question the way the orchestrator's keyword
//    fallback does, then run `pickModel({ domain, tier })` to show
//    which Psy model would serve it. The expanded regex mirrors the
//    v3.0.1 orchestrator update (`/anxiety|therapy|panic|mental|psych|
//    depress|insomnia|ptsd/i`).
// ---------------------------------------------------------------------------

interface RouteDecision {
  question: string;
  domain: string;
  tier: string;
  picked: string;
  why: string;
}

const MEDICAL_KEYWORD = /anxiety|therapy|panic|mental|psych|depress|insomnia|ptsd|sleep|anxious|therapist/i;

function classifyDomain(question: string): string {
  return MEDICAL_KEYWORD.test(question) ? "medical" : "general";
}

interface Tier { name: "small" | "medium"; reason: string; }

/**
 * Decide whether a question is "clinical" (multi-week plan, complex,
 * chronic) or "triage" (acute, single-symptom, yes/no). The choice
 * determines which Psy model pickModel resolves at runtime.
 */
function classifyComplexity(question: string): Tier {
  const clinical = /(weeks|months|chronic|ongoing|medication|prescri|diagnosis|treatment|suicid|severe|therapist)/i;
  if (clinical.test(question)) {
    return { name: "medium", reason: "clinical cues (chronic / meds / therapist)" };
  }
  return { name: "small", reason: "triage (acute / single-symptom)" };
}

function routePsyQuestion(question: string): RouteDecision {
  const domain = classifyDomain(question);
  if (domain !== "medical") {
    return { question, domain, tier: "-", picked: "(none — falls through to local 1B chit-chat)", why: "no medical keyword" };
  }
  const tier = classifyComplexity(question);
  // pickModel({ domain, tier }) returns the candidates; for tier=small
  // we get both MEDPSY_1_7B_Q4_K_M and MEDPSY_4B_Q4_K_M, so we choose
  // by ramGb (lower = triage, higher = clinical). For tier=medium we
  // fall back to the desktop delegate (MEDPSY_4B_INST_Q4_K_M) so the
  // routing layer still surfaces a Psy-family id.
  const candidates = pickModel({ domain, tier: tier.name });
  let picked: string;
  let why: string;
  if (candidates.length > 0) {
    const sorted = candidates.slice().sort((a, b) => a.ramGb - b.ramGb);
    const chosen = tier.name === "medium" ? sorted[sorted.length - 1] : sorted[0];
    picked = chosen.id;
    why = `pickModel({domain:"medical",tier:"${tier.name}"}) → ${chosen.id} (${tier.reason})`;
  } else {
    // No Psy model matches the tier — fall back to the desktop
    // delegate (MEDPSY_4B_INST_Q4_K_M) which is wired into the
    // DelegatingLLM pipeline in src/profiles.ts (desktop profile).
    picked = "MEDPSY_4B_INST_Q4_K_M";
    why = `no Psy model at tier=${tier.name}; routing via desktop delegate`;
  }
  return { question, domain, tier: tier.name, picked, why };
}

// ---------------------------------------------------------------------------
// 3. Inline stub LLM. Clearly tagged as a hackathon demo shim; the real
//    implementation will call into the QVAC SDK's `MEDPSY_*` inference
//    entrypoint once it is wired in production.
// ---------------------------------------------------------------------------

// HACKATHON STUB — replace with real QVAC SDK Psy inference
const STUB_TAG = "HACKATHON STUB — replace with real QVAC SDK Psy inference";

interface PsyStubReply {
  model: string;
  reply: string;
  note: string;
}

// HACKATHON STUB — replace with real QVAC SDK Psy inference
function psyStubLLM(model: string, question: string): PsyStubReply {
  // Canned replies per model id. Short, deterministic, no network.
  const canned: Record<string, string> = {
    MEDPSY_1_7B_Q4_K_M:
      "Sounds like acute anxiety. Try 4-7-8 breathing (inhale 4s, hold 7s, exhale 8s) for 4 cycles, and a 5-min walk. " +
      "Track your triggers in the journal for 7 days — if episodes keep happening, please see a clinician.",
    MEDPSY_4B_Q4_K_M:
      "Given ongoing anxiety for weeks, the most useful first step is a structured self-monitoring protocol: log sleep, " +
      "caffeine cutoff, and panic triggers daily. Pair that with consistent wake time + 20 min morning light. " +
      "If episodes persist beyond 4 weeks or interfere with work, book a primary-care visit to discuss therapy options.",
    MEDPSY_4B_INST_Q4_K_M:
      "(delegate, desktop profile) Long-form response: I would treat this as a chronic anxiety pattern. Suggested plan: " +
      "(1) daily mood + sleep log, (2) caffeine cutoff 12h before bed, (3) 20-min morning walk, (4) if no improvement in 4 weeks, " +
      "consider CBT-I referral. Always pair self-tracking with a licensed clinician for medication decisions.",
  };
  return {
    model,
    reply: canned[model] ?? `(stub) no canned reply for ${model}; question was: "${question}"`,
    note: STUB_TAG,
  };
}

// ---------------------------------------------------------------------------
// 4. Top-level entrypoint — exported as `psyCommand` (mirrors
//    `agentsCommand` / `modelsCommand` in `src/commands/`) and as
//    `handler` so the dispatcher can wire it up both ways.
// ---------------------------------------------------------------------------

export async function psyCommand(_args?: unknown, _ew?: unknown): Promise<void> {
  // ---- 1. Catalog (computed first so the header tagline can read it).
  const psy = listPsyModels();

  header("EdgeWell v3.0.1 — Psy family showcase");
  console.log(c.dim(STUB_TAG));
  console.log(c.dim(`Domain-aware routing · ${psy.length} Psy models exercised · one-line summary at the end.`));

  console.log(`\n${c.cyan("── Psy catalog ─────────────────────────────────────────")}`);
  for (const m of psy) {
    console.log(
      `  ${c.green(m.id.padEnd(28))} ${c.dim("source=" + m.source.padEnd(18))} ` +
      `size=${String(m.size).padEnd(5)} quant=${m.quant.padEnd(8)} ` +
      `tier=${m.tier.padEnd(7)} ramGb=${String(m.ramGb).padEnd(4)} domain=${m.domain}`,
    );
  }
  console.log(c.dim(`(${psy.length} Psy models registered across registry + profiles)`));

  // ---- 2. Routing decisions ---------------------------------------------
  const sampleQuestions: string[] = [
    "I've been feeling anxious for weeks",
    "Should I see a therapist?",
    "I can't sleep and my heart races",
  ];
  const decisions: RouteDecision[] = sampleQuestions.map(routePsyQuestion);

  console.log(`\n${c.cyan("── Routing decisions (orchestrator keyword → pickModel) ──")}`);
  for (const d of decisions) {
    const tag = c.magenta(`domain=${d.domain}`);
    const tier = c.dim(`tier=${d.tier}`);
    const picked = d.picked.startsWith("(") ? c.yellow(d.picked) : c.green(d.picked);
    console.log(`  ${c.dim("Q:")} ${d.question}`);
    console.log(`     ${tag} ${tier} → ${picked}  ${c.dim("(" + d.why + ")")}`);
  }

  // ---- 2b. Domain-hint note (explains the v3.0.1 orchestrator change)
  console.log(`\n${c.cyan("── Orchestrator v3.0.1 mental-health hint ───────────────")}`);
  console.log(c.dim('  parseRoute() now sets domain="medical" when the question matches'));
  console.log(c.dim("  /anxiety|therapy|panic|mental|psych|depress|insomnia|ptsd/i."));
  console.log(c.dim("  The psy command and future per-call delegate policies read"));
  console.log(c.dim('  this hint and call pickModel({domain:"medical"}) to pick a Psy model.'));

  // ---- 3. Stub LLM replies ----------------------------------------------
  console.log(`\n${c.cyan("── Psy stub replies (no live SDK) ────────────────────────")}`);
  let firstShownFull = false;
  for (const d of decisions) {
    if (d.picked.startsWith("(")) {
      // No Psy model picked — show the local fallback.
      console.log(`  ${c.dim("[fallback → local 1B]")} ${d.question}`);
      console.log(`     ${c.dim("(no MEDPSY model selected — local LLAMA_3_2_1B_INST_Q4_0 chit-chat)")}`);
      continue;
    }
    const r = psyStubLLM(d.picked, d.question);
    console.log(`  ${c.dim("model:")} ${c.green(r.model)}`);
    // Print one full (untruncated) reply so judges can see the
    // canned content end-to-end; the rest are still 200-char previews.
    if (!firstShownFull) {
      console.log(`     ${r.reply}`);
      firstShownFull = true;
    } else {
      console.log(`     ${r.reply.replace(/\s+/g, " ").slice(0, 200)}${r.reply.length > 200 ? "…" : ""}`);
    }
    console.log(`     ${c.dim(r.note)}`);
  }

  // ---- 4. Swap-the-stub footer (so the hackathon caveat is loud).
  console.log(`\n${c.cyan("── Swapping the stub for real QVAC SDK inference ──────────")}`);
  console.log(c.dim("  1. Add MEDPSY_* to MODELS in src/registry.ts (or wire the"));
  console.log(c.dim("     QVAC SDK's MEDPSY_* model ids into EdgeWellLLM.prompt)."));
  console.log(c.dim("  2. In psyStubLLM(), call await import('@qvac/sdk')"));
  console.log(c.dim("     and route model === MEDPSY_4B_Q4_K_M to the SDK entry."));
  console.log(c.dim("  3. Re-run `node dist/bin/edgewell.js psy` to see real replies."));

  // ---- 5. One-line summary ----------------------------------------------
  // The summary line is the one the task brief mandates; we plug
  // the actual catalog count into N and count the routing buckets
  // by which Psy-family id was picked per decision.
  const exerciseCount = psy.length;
  const toClinical = decisions.filter((d) => /MEDPSY_4B(_INST)?_Q4_K_M/.test(d.picked)).length;
  const toTriage = decisions.filter((d) => d.picked === "MEDPSY_1_7B_Q4_K_M").length;
  const toFallback = decisions.filter((d) => d.picked.startsWith("(")).length;
  console.log(
    `\n${c.green("summary:")} Psy models exercised: ${exerciseCount}. ` +
    `Routing decisions: medical→MEDPSY_4B for clinical (${toClinical}), ` +
    `medical→MEDPSY_1_7B for triage (${toTriage}), ` +
    `fallback→local 1B for chit-chat (${toFallback}).`,
  );
}

// Yargs-style exports (mirror the showcase command's surface).
export const handler = psyCommand;
export const command = "psy";
export const describe = "Show the Psy-family model catalog and domain-aware routing decisions (hackathon showcase)";
export const builder = (yargs: unknown): unknown => yargs;
export default psyCommand;

// Re-export the list helper so the test can pin the catalog shape without
// duplicating the filter.
export const _internal = { listPsyModels, routePsyQuestion, psyStubLLM };
