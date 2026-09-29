"use client";

import { Check, Clipboard, FileArchive, FileJson, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import type { Agent } from "@/types/agent";
import { Button } from "@/components/common/button";
import { Card } from "@/components/common/card";
import { getInstallKitCommand, getInstallKitFiles, getInstallKitPath } from "@/lib/agent-install-kit";
import { toAgentJson, toAgentMarkdown, toChatPromptBundle } from "@/lib/agent-export";
import { siteConfig } from "@/lib/site";

type ActionState = "idle" | "copied" | "downloaded" | "error";

export function AgentExportPanel({ agent }: { agent: Agent }) {
  const [state, setState] = useState<ActionState>("idle");
  const markdown = useMemo(() => toAgentMarkdown(agent), [agent]);
  const json = useMemo(() => toAgentJson(agent), [agent]);
  const chatBundle = useMemo(() => toChatPromptBundle(agent), [agent]);
  const installKitFiles = useMemo(() => getInstallKitFiles(agent), [agent]);
  const inputTemplate = agent.runbook?.inputTemplate ?? "";
  const installable = installKitFiles.length > 0;
  const installCommand = getInstallKitCommand(agent.slug);

  async function copyAgent() {
    await copyText(chatBundle);
  }

  async function copyInputTemplate() {
    if (!inputTemplate) {
      return;
    }

    await copyText(inputTemplate);
  }

  async function copyInstallCommand() {
    await copyText(installCommand);
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
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

  function downloadKit() {
    if (!installable) {
      return;
    }

    for (const file of installKitFiles) {
      window.setTimeout(() => download(file.content, file.filename, file.mimeType), 0);
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
            Copy the complete agent card into ChatGPT or Claude, or download project-ready files for Codex, Claude, and Cursor.
          </p>
          <p className="mt-3 text-xs text-muted">
            Includes role, use cases, inputs, expected outputs, operating instructions, examples, best practices, limitations, and install notes.
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
          <Button onClick={copyInputTemplate} variant="secondary" disabled={!inputTemplate}>
            <Clipboard className="h-4 w-4" />
            Copy Input Template
          </Button>
          <Button onClick={downloadKit} variant={installable ? "primary" : "secondary"} disabled={!installable}>
            <FileArchive className="h-4 w-4" />
            {installable ? "Download Kit" : "Kit coming soon"}
          </Button>
        </div>
      </div>
      <div className="mt-5 rounded-md border border-line bg-elevated/60 p-4">
        <p className="text-sm font-semibold text-primary">
          {installable ? "Project-ready install kit" : "Install kit coming soon"}
        </p>
        <p className="mt-2 text-sm leading-6 text-secondary">
          {installable
            ? "Downloads AGENTS.md, CLAUDE.md, Cursor rule, agent.json, and README files that can be copied into a project."
            : "This agent can still be copied as a prompt bundle, but project-ready files have not been curated yet."}
        </p>
        {installable ? (
          <>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Fetch from a terminal</p>
            <div className="mt-2 flex items-start gap-2">
              <pre className="min-w-0 flex-1 overflow-x-auto rounded-md border border-line bg-[#08090c] px-3 py-2 font-mono text-xs leading-5 text-secondary">
                {installCommand}
              </pre>
              <Button onClick={copyInstallCommand} variant="secondary" aria-label="Copy install command">
                <Clipboard className="h-4 w-4" />
              </Button>
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {installKitFiles.map((file) => (
                <li key={file.name}>
                  <a
                    className="font-mono text-sky-200 hover:underline"
                    href={`${siteConfig.basePath}${getInstallKitPath(agent.slug, file.name)}`}
                  >
                    {file.name}
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : null}
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
