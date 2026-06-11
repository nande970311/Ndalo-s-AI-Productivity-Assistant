import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MODEL = "google/gemini-3-flash-preview";

const Input = z.object({
  kind: z.enum(["email", "summary", "rewrite"]),
  text: z.string().min(1).max(8000),
});

const PROMPTS: Record<z.infer<typeof Input>["kind"], string> = {
  email:
    "You are a professional email-writing assistant. Given the user's purpose, write a polished business email. Respond in EXACTLY this format and nothing else:\n\nSubject: <one-line subject>\n\n<email body, with greeting, clear paragraphs>\n\nBest regards,\n[Your Name]",
  summary:
    "You are a meeting-notes summarizer. Given messy meeting notes, output a clean summary in this exact markdown structure:\n\n## Summary\n<2-3 sentence overview>\n\n## Key Decisions\n- ...\n\n## Action Items\n- [Owner if known] Action — due date if mentioned\n\n## Open Questions\n- ...\n\nIf a section has nothing, write 'None'. Be concise and faithful to the notes.",
  rewrite:
    "You are a professional tone editor. Rewrite the user's message in a clear, polite, professional workplace tone. Preserve the original intent and key facts. Return ONLY the rewritten message — no preamble, no explanation.",
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