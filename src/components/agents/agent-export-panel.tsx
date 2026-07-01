"use client";

import { Check, Clipboard, FileJson, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import type { Agent } from "@/types/agent";
import { Button } from "@/components/common/button";
import { Card } from "@/components/common/card";
import { toAgentJson, toAgentMarkdown, toChatPromptBundle } from "@/lib/agent-export";

type ActionState = "idle" | "copied" | "downloaded" | "error";

export function AgentExportPanel({ agent }: { agent: Agent }) {
  const [state, setState] = useState<ActionState>("idle");
  const markdown = useMemo(() => toAgentMarkdown(agent), [agent]);
  const json = useMemo(() => toAgentJson(agent), [agent]);
  const chatBundle = useMemo(() => toChatPromptBundle(agent), [agent]);

  async function copyAgent() {
    try {
      await navigator.clipboard.writeText(chatBundle);
      setState("copied");
      window.setTimeout(() => setState("idle"), 1400);
    } catch {
      setState("error");
    }
  }

  function download(value: string, filename: string, type: string) {
    try {
      const blob = new Blob([value], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setState("downloaded");
      window.setTimeout(() => setState("idle"), 1400);
    } catch {
      setState("error");
    }
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md border border-accent/25 bg-accent/10 text-sky-200">
            <Clipboard className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-primary">Use this agent elsewhere</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
            Copy the complete agent card into ChatGPT or Claude, or download a portable Markdown/JSON version for your own archive.
          </p>
          <p className="mt-3 text-xs text-muted">
            Includes role, use cases, inputs, expected outputs, operating instructions, examples, best practices, and limitations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button onClick={copyAgent} variant={state === "copied" ? "primary" : "secondary"}>
            {state === "copied" ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
            {state === "copied" ? "Copied!" : "Copy Agent"}
          </Button>
          <Button
            onClick={() => download(markdown, `${agent.slug}.agent.md`, "text/markdown;charset=utf-8")}
            variant="secondary"
          >
            <FileText className="h-4 w-4" />
            Download .md
          </Button>
          <Button
            onClick={() => download(json, `${agent.slug}.agent.json`, "application/json;charset=utf-8")}
            variant="secondary"
          >
            <FileJson className="h-4 w-4" />
            Download .json
          </Button>
        </div>
      </div>
      {state === "downloaded" ? (
        <p className="mt-4 rounded-md border border-green-500/25 bg-green-500/10 px-3 py-2 text-sm text-green-200">
          Download started.
        </p>
      ) : null}
      {state === "error" ? (
        <p className="mt-4 rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          This browser blocked the action. Try copying the prompt directly.
        </p>
      ) : null}
      <div className="mt-5 rounded-md border border-line bg-[#08090c] p-4">
        <p className="mb-2 font-mono text-xs text-muted">{agent.slug}.agent.md preview</p>
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap font-mono text-xs leading-5 text-secondary">
          {markdown}
        </pre>
      </div>
    </Card>
  );
}
