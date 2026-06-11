import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MODEL = "google/gemini-3-flash-preview";

const Input = z.object({
  kind: z.enum(["email", "summary", "planner"]),
  text: z.string().min(1).max(8000),
});

const PROMPTS: Record<z.infer<typeof Input>["kind"], string> = {
  email:
    "You are a professional email-writing assistant. Given the user's purpose, write a polished business email. Respond in EXACTLY this format and nothing else:\n\nSubject: <one-line subject>\n\n<email body, with greeting, clear paragraphs>\n\nBest regards,\n[Your Name]",
  summary:
    "You are a meeting-notes summarizer. Given messy meeting notes, output a clean summary in EXACTLY this markdown structure and nothing else:\n\n## Key Points\n- point 1\n- point 2\n- point 3\n- point 4\n- point 5\n\n## Action Items\n- [Owner] Action item\n- [Owner] Action item\n\n## Next Meeting\n<date/time/topic if mentioned, otherwise 'Not specified'>\n\nExactly 5 key points. Be concise and faithful to the notes.",
  planner:
    "You are an AI task planner. Given the user's list of tasks for today, schedule them into a realistic workday (assume 9:00–17:00 unless the user specifies otherwise). Respond with ONLY a GitHub-flavored markdown table and nothing else — no preamble, no notes after.\n\n| Time | Task | Priority | Reason |\n|------|------|----------|--------|\n| 9:00–9:45 | ... | High | ... |\n\nPriority must be High, Medium, or Low. Keep Reason to one short sentence. Order rows chronologically.",
};

export const runAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    try {
      const { text } = await generateText({
        model: gateway(MODEL),
        system: PROMPTS[data.kind],
        prompt: data.text,
      });
      return { text };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) throw new Error("Rate limit reached. Please try again in a moment.");
      if (msg.includes("402")) throw new Error("AI credits exhausted. Please add credits in your workspace settings.");
      throw new Error("Something went wrong generating a response. Please try again.");
    }
  });