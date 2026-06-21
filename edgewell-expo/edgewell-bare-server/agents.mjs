// Agent routing and system prompts for the EdgeWell companion server.
// Mirrors the keyword-based router from src/agents/orchestrator.ts.

const HEALTH_KEYWORDS =
  /symptom|sleep|exercise|diet|medication|pain|stress|mood|health|headache|fever|tired|anxious|depress|insomnia|therapy|panic|mental|psych/
const FINANCE_KEYWORDS =
  /money|budget|expense|saving|debt|income|price|cost|spend|thb|usd|baht|dollar|salary/

export function routeAgent(question) {
  const q = (question ?? '').toLowerCase()
  if (HEALTH_KEYWORDS.test(q)) return 'health'
  if (FINANCE_KEYWORDS.test(q)) return 'finance'
  return 'lifestyle'
}

const HEALTH_SYSTEM = `You are the EdgeWell Health Agent — a private, on-device health coach.
Answer the user's health question concisely using evidence-based knowledge.
Focus on practical, actionable advice. Keep responses under 200 words.
If the user describes acute or severe symptoms, remind them to consult a doctor.
Note: I'm an AI, not a doctor. For urgent or severe symptoms, contact a licensed clinician.`

const FINANCE_SYSTEM = `You are the EdgeWell Finance Agent — a private, on-device budget coach.
Answer the user's finance question concisely with practical money-management tips.
Focus on spending patterns, saving strategies, and budget advice.
Keep responses under 200 words.
Note: not financial advice.`

const LIFESTYLE_SYSTEM = `You are the EdgeWell Lifestyle Coach — a private, on-device personal assistant.
Answer the user's question with practical, actionable advice about habits, productivity,
routines, and general wellness. Keep responses under 200 words.`

export function getSystemPrompt(agent) {
  switch (agent) {
    case 'health': return HEALTH_SYSTEM
    case 'finance': return FINANCE_SYSTEM
    default: return LIFESTYLE_SYSTEM
  }
}
