import OpenAI from "openai";

// Nexus Flash 3B - Multi-model reasoning system
// 7 micro-thinkers with condenser and chief synthesis

const OPENROUTER_API_KEY = "YOUR_OPENROUTER_API_KEY";

//CHANGE THESE MODELS TO YOUR LIKING, :free may catch you errors with OpenRouterAPI
const THINKER_1 = "google/gemini-2.0-flash-001";
const THINKER_2 = "qwen/qwen3-235b-a22b:free";
const THINKER_3 = "anthropic/claude-3.5-haiku";
const THINKER_4 = "openai/gpt-4o-mini";
const THINKER_5 = "meta-llama/llama-3.3-70b-instruct:free";
const THINKER_6 = "deepseek/deepseek-v3.1-terminus";
const THINKER_7 = "mistralai/mistral-small-3.1-24b-instruct:free";

const CONDENSER = "openai/gpt-4o-mini";
const CHIEF = "meta-llama/llama-3.3-70b-instruct:free";

interface ThinkerConfig {
  model: string;
  role: string;
  prompt: string;
}

interface ThinkerResult {
  role: string;
  insight: string;
  success: boolean;
}

interface NexusOptions {
  outputStyle?: "concise" | "detailed" | "structured" | "writing" | "coding";
  maxTokens?: number;
  conversationHistory?: Array<{ role: string; content: string }>;
}

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "NotNerdz ©2025",
    "X-Title": "Nexus Flash 3B",
  },
});

const thinkers: ThinkerConfig[] = [
  { model: THINKER_1, role: "Strategic Analyst", prompt: "Analyze from a strategic, high-level perspective. Focus on long-term implications, key decisions, and overall approach." },
  { model: THINKER_2, role: "Critical Thinker", prompt: "Challenge assumptions, find edge cases, identify potential flaws in obvious solutions. Be adversarial." },
  { model: THINKER_3, role: "Creative Innovator", prompt: "Propose unconventional approaches, novel solutions, and creative alternatives others might miss." },
  { model: THINKER_4, role: "Technical Expert", prompt: "Focus on implementation details, technical accuracy, and practical feasibility." },
  { model: THINKER_5, role: "User Experience Specialist", prompt: "Consider clarity, usability, real-world application, and how the solution will be received." },
  { model: THINKER_6, role: "Data Researcher", prompt: "Focus on evidence, data patterns, research findings, and factual accuracy." },
  { model: THINKER_7, role: "Efficiency Optimizer", prompt: "Identify ways to simplify, optimize, and make solutions more elegant and maintainable." },
];

const styleGuides: Record<string, string> = {
  concise: "Be brief and to the point. Maximum 3 paragraphs.",
  detailed: "Be comprehensive with examples and clear explanations.",
  structured: "Use headings, numbered lists, and organized sections.",
  writing: "Create polished, flowing prose with excellent narrative structure.",
  coding: "Provide complete, working code with proper formatting and comments.",
};

async function runThinker(thinker: ThinkerConfig, prompt: string, history: Array<{ role: string; content: string }>): Promise<ThinkerResult> {
  try {
    const response = await openrouter.chat.completions.create({
      model: thinker.model,
      messages: [
        { 
          role: "system", 
          content: `You are the ${thinker.role}. ${thinker.prompt}

Provide your expert analysis in a structured format:
1. KEY INSIGHT (1-2 sentences)
2. SUPPORTING POINTS (3-5 bullet points)
3. RECOMMENDATION (1 sentence)

Be precise and avoid filler.` 
        },
        ...history.slice(-4).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user", content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.5,
    });
    return { role: thinker.role, insight: response.choices[0]?.message?.content || "", success: true };
  } catch (error) {
    console.error(`Thinker ${thinker.role} failed:`, error);
    return { role: thinker.role, insight: "", success: false };
  }
}

async function runCondenser(insights: ThinkerResult[], prompt: string): Promise<string> {
  const formatted = insights.map(i => `[${i.role}]\n${i.insight}`).join('\n\n---\n\n');
  
  try {
    const response = await openrouter.chat.completions.create({
      model: CONDENSER,
      messages: [
        { 
          role: "system", 
          content: `You are the Nexus Condenser. Synthesize multiple expert analyses into a unified strategic brief.

OUTPUT FORMAT:
1. CONSENSUS INSIGHTS (what experts agree on)
2. DIVERGENT PERSPECTIVES (important disagreements)
3. SYNTHESIS (unified recommendation)
4. KEY ACTIONS (prioritized next steps)

Be precise. No filler. Maximum 400 words.` 
        },
        { role: "user", content: `USER QUERY: ${prompt}\n\n═══════════════════════════════════════\nEXPERT ANALYSES:\n${formatted}` }
      ],
      max_tokens: 800,
      temperature: 0.3,
    });
    return response.choices[0]?.message?.content || formatted;
  } catch (error) {
    console.error("Condenser failed:", error);
    return formatted;
  }
}

async function runChief(condensed: string, prompt: string, options: NexusOptions): Promise<string> {
  const { outputStyle = "detailed", maxTokens = 2000, conversationHistory = [] } = options;
  
  const response = await openrouter.chat.completions.create({
    model: CHIEF,
    messages: [
      { 
        role: "system", 
        content: `You are the Nexus Chief Reasoner.

You have received a condensed synthesis from 7 expert thinkers.
Your task is to produce the definitive, superior answer.

STYLE: ${styleGuides[outputStyle] || styleGuides.detailed}

RULES:
- Integrate all expert perspectives into a unified, coherent response
- Address any tensions between different viewpoints
- Provide actionable, specific guidance
- Be authoritative and confident
- NO generic preambles or "As an AI..." statements
- Start your answer directly

You are the final arbiter. Make the response exceptional.` 
      },
      ...conversationHistory.slice(-4).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { 
        role: "user", 
        content: `QUERY: ${prompt}

═══════════════════════════════════════
EXPERT SYNTHESIS:
${condensed}

═══════════════════════════════════════
Provide your definitive answer:` 
      }
    ],
    max_tokens: maxTokens,
    temperature: 0.6,
  });

  return response.choices[0]?.message?.content || "";
}

export async function nexus(prompt: string, options: NexusOptions = {}): Promise<string> {
  const { conversationHistory = [] } = options;

  const thinkerPromises = thinkers.map((thinker, index) => 
    new Promise<ThinkerResult>(async (resolve) => {
      await new Promise(r => setTimeout(r, index * 100));
      const result = await runThinker(thinker, prompt, conversationHistory);
      resolve(result);
    })
  );

  const results = await Promise.all(thinkerPromises);
  const successfulInsights = results.filter(r => r.success && r.insight.length > 0);

  if (successfulInsights.length === 0) {
    throw new Error("All thinkers failed");
  }

  const condensed = await runCondenser(successfulInsights, prompt);
  const finalResponse = await runChief(condensed, prompt, options);

  return finalResponse;
}

export async function nexusStream(prompt: string, options: NexusOptions = {}, onChunk: (chunk: string) => void): Promise<void> {
  const { conversationHistory = [], outputStyle = "detailed", maxTokens = 2000 } = options;

  const thinkerPromises = thinkers.map((thinker, index) => 
    new Promise<ThinkerResult>(async (resolve) => {
      await new Promise(r => setTimeout(r, index * 100));
      const result = await runThinker(thinker, prompt, conversationHistory);
      resolve(result);
    })
  );

  const results = await Promise.all(thinkerPromises);
  const successfulInsights = results.filter(r => r.success && r.insight.length > 0);

  if (successfulInsights.length === 0) {
    throw new Error("All thinkers failed");
  }

  const condensed = await runCondenser(successfulInsights, prompt);

  const stream = await openrouter.chat.completions.create({
    model: CHIEF,
    messages: [
      { 
        role: "system", 
        content: `You are the Nexus Chief Reasoner.

You have received a condensed synthesis from 7 expert thinkers.
Your task is to produce the definitive, superior answer.

STYLE: ${styleGuides[outputStyle] || styleGuides.detailed}

RULES:
- Integrate all expert perspectives into a unified, coherent response
- Address any tensions between different viewpoints
- Provide actionable, specific guidance
- Be authoritative and confident
- NO generic preambles or "As an AI..." statements
- Start your answer directly` 
      },
      ...conversationHistory.slice(-4).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { 
        role: "user", 
        content: `QUERY: ${prompt}

═══════════════════════════════════════
EXPERT SYNTHESIS:
${condensed}

═══════════════════════════════════════
Provide your definitive answer:` 
      }
    ],
    max_tokens: maxTokens,
    temperature: 0.6,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      onChunk(content);
    }
  }
}

async function main() {
  const response = await nexus("What are the key considerations when designing a distributed system?", {
    outputStyle: "structured",
    maxTokens: 3000,
  });
  console.log(response);
}

main().catch(console.error);
