import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, FileText, CalendarClock, Copy, Check, Loader2, Sparkles } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { runAssistant } from "@/lib/assistant.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nande's AI Workplace Assistant" },
      { name: "description", content: "Draft professional emails, summarize meeting notes, and plan your day with AI." },
      { property: "og:title", content: "Nande's AI Workplace Assistant" },
      { property: "og:description", content: "Draft professional emails, summarize meeting notes, and plan your day with AI." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white">
      <Toaster richColors position="top-center" />
      <header className="border-b border-border bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight text-foreground">Nande's AI Workplace Assistant</h1>
            <p className="text-xs text-muted-foreground">Draft, summarize, and polish — in seconds.</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto bg-secondary p-1 rounded-xl">
            <TabsTrigger value="email" className="flex flex-col sm:flex-row gap-1 sm:gap-2 py-2.5 text-xs sm:text-sm">
              <Mail className="h-4 w-4" /> Email
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex flex-col sm:flex-row gap-1 sm:gap-2 py-2.5 text-xs sm:text-sm">
              <FileText className="h-4 w-4" /> Notes
            </TabsTrigger>
            <TabsTrigger value="planner" className="flex flex-col sm:flex-row gap-1 sm:gap-2 py-2.5 text-xs sm:text-sm">
              <CalendarClock className="h-4 w-4" /> Planner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="mt-6">
            <AssistantPanel
              kind="email"
              title="Professional Email Draft"
              description="Describe the purpose of your email and we'll write it for you."
              inputLabel="What's the email about?"
              placeholder="e.g. Follow up with Sarah from finance about the Q3 budget review meeting we had on Tuesday. I want to confirm next steps and ask for the updated spreadsheet by Friday."
              buttonLabel="Generate Email Draft"
              outputLabel="Your draft email"
              note="Copy this and paste it into Gmail or Outlook."
              rows={5}
            />
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            <AssistantPanel
              kind="summary"
              title="Meeting Notes Summarizer"
              description="Paste your messy meeting notes and get a clean summary with action items."
              inputLabel="Your meeting notes"
              placeholder="Paste raw notes here — bullet points, half sentences, whatever you scribbled during the meeting."
              buttonLabel="Summarize Notes"
              outputLabel="Clean summary"
              note="Copy this into your project doc or share it with your team."
              rows={10}
            />
          </TabsContent>

          <TabsContent value="rewrite" className="mt-6">
            <AssistantPanel
              kind="rewrite"
              title="Message Tone Rewriter"
              description="Turn a quick or casual message into something polished and professional."
              inputLabel="Your message"
              placeholder="e.g. hey can u send me the file asap, need it before the call"
              buttonLabel="Rewrite Professionally"
              outputLabel="Polished version"
              note="Copy this and send it in Slack, Teams, or email."
              rows={5}
            />
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground mt-10">
          Powered by Lovable AI · No login required
        </p>
      </main>
    </div>
  );
}

function AssistantPanel(props: {
  kind: "email" | "summary" | "rewrite";
  title: string;
  description: string;
  inputLabel: string;
  placeholder: string;
  buttonLabel: string;
  outputLabel: string;
  note: string;
  rows: number;
}) {
  const run = useServerFn(runAssistant);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!input.trim()) {
      toast.error("Please enter some text first.");
      return;
    }
    setLoading(true);
    setOutput("");
    try {
      const res = await run({ data: { kind: props.kind, text: input.trim() } });
      setOutput(res.text);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-5 sm:p-6">
      <h2 className="text-xl font-semibold text-foreground">{props.title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{props.description}</p>

      <div className="mt-5 space-y-2">
        <Label htmlFor={`input-${props.kind}`} className="text-sm font-medium">
          {props.inputLabel}
        </Label>
        <Textarea
          id={`input-${props.kind}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={props.placeholder}
          rows={props.rows}
          className="resize-y bg-white"
        />
      </div>

      <Button
        onClick={handleGenerate}
        disabled={loading}
        className="mt-4 w-full sm:w-auto"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> {props.buttonLabel}
          </>
        )}
      </Button>

      {output && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">{props.outputLabel}</Label>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="rounded-lg border border-border bg-secondary/40 p-4 whitespace-pre-wrap text-sm text-foreground leading-relaxed">
            {output}
          </div>
          <p className="text-xs text-muted-foreground mt-2 italic">
            Note: {props.note}
          </p>
        </div>
      )}
    </div>
  );
}
