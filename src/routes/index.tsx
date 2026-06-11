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
              note="AI helps you find what matters fast."
              rows={10}
            />
          </TabsContent>

          <TabsContent value="planner" className="mt-6">
            <AssistantPanel
              kind="planner"
              title="AI Task Planner"
              description="List what's on your plate today and get a focused schedule with priorities."
              inputLabel="My tasks today"
              placeholder="e.g. Prep slides for client meeting, reply to Sarah's email, review the Q3 budget, 1:1 with manager at 2pm, gym at 6pm"
              buttonLabel="Schedule"
              outputLabel="Your day"
              note="Adjust times to fit your real calendar."
              rows={6}
              renderAs="table"
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
  kind: "email" | "summary" | "planner";
  title: string;
  description: string;
  inputLabel: string;
  placeholder: string;
  buttonLabel: string;
  outputLabel: string;
  note: string;
  rows: number;
  renderAs?: "text" | "table";
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
          {props.renderAs === "table" ? (
            <ScheduleTable markdown={output} />
          ) : (
            <div className="rounded-lg border border-border bg-secondary/40 p-4 whitespace-pre-wrap text-sm text-foreground leading-relaxed">
              {output}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2 italic">
            Note: {props.note}
          </p>
        </div>
      )}
    </div>
  );
}

function ScheduleTable({ markdown }: { markdown: string }) {
  const lines = markdown
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|") && l.endsWith("|"));

  // Drop the markdown separator row (|---|---|).
  const rows = lines
    .filter((l) => !/^\|\s*:?-+/.test(l))
    .map((l) =>
      l
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim()),
    );

  if (rows.length < 2) {
    return (
      <div className="rounded-lg border border-border bg-secondary/40 p-4 whitespace-pre-wrap text-sm text-foreground leading-relaxed">
        {markdown}
      </div>
    );
  }

  const [header, ...body] = rows;

  const priorityStyle = (p: string) => {
    const v = p.toLowerCase();
    if (v.includes("high")) return "bg-red-100 text-red-700 border-red-200";
    if (v.includes("med")) return "bg-amber-100 text-amber-700 border-amber-200";
    if (v.includes("low")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    return "bg-secondary text-foreground border-border";
  };

  return (
    <div className="rounded-lg border border-border bg-white overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-foreground">
          <tr>
            {header.map((h, i) => (
              <th key={i} className="text-left font-semibold px-3 py-2 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, i) => (
            <tr key={i} className="border-t border-border align-top">
              {row.map((cell, j) => {
                const isPriority = (header[j] ?? "").toLowerCase().includes("priority");
                return (
                  <td key={j} className="px-3 py-2">
                    {isPriority ? (
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${priorityStyle(cell)}`}
                      >
                        {cell}
                      </span>
                    ) : (
                      cell
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
