"use client";

import { Check, Clipboard, FileArchive, FileJson, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import type { Agent } from "@/types/agent";
import type { Dictionary } from "@/i18n/dictionaries";
import { Button } from "@/components/common/button";
import { Card } from "@/components/common/card";
import { getInstallKitCommand, getInstallKitFiles, getInstallKitPath } from "@/lib/agent-install-kit";
import { toAgentJson, toAgentMarkdown, toChatPromptBundle } from "@/lib/agent-export";
import { siteConfig } from "@/lib/site";

type ActionState = "idle" | "copied" | "downloaded" | "error";

export function AgentExportPanel({ agent, labels }: { agent: Agent; labels: Dictionary["agentExport"] }) {
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
          <h3 className="text-lg font-semibold text-primary">{labels.title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">{labels.description}</p>
          <p className="mt-3 text-xs text-muted">{labels.includes}</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button onClick={copyAgent} variant={state === "copied" ? "primary" : "secondary"}>
            {state === "copied" ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
            {state === "copied" ? labels.copied : labels.copyAgent}
          </Button>
          <Button
            onClick={() => download(markdown, `${agent.slug}.agent.md`, "text/markdown;charset=utf-8")}
            variant="secondary"
          >
            <FileText className="h-4 w-4" />
            {labels.downloadMd}
          </Button>
          <Button
            onClick={() => download(json, `${agent.slug}.agent.json`, "application/json;charset=utf-8")}
            variant="secondary"
          >
            <FileJson className="h-4 w-4" />
            {labels.downloadJson}
          </Button>
          <Button onClick={copyInputTemplate} variant="secondary" disabled={!inputTemplate}>
            <Clipboard className="h-4 w-4" />
            {labels.copyInputTemplate}
          </Button>
          <Button onClick={downloadKit} variant={installable ? "primary" : "secondary"} disabled={!installable}>
            <FileArchive className="h-4 w-4" />
            {installable ? labels.downloadKit : labels.kitComingSoon}
          </Button>
        </div>
      </div>
      <div className="mt-5 rounded-md border border-line bg-elevated/60 p-4">
        <p className="text-sm font-semibold text-primary">
          {installable ? labels.kitReadyTitle : labels.kitPendingTitle}
        </p>
        <p className="mt-2 text-sm leading-6 text-secondary">
          {installable ? labels.kitReadyDescription : labels.kitPendingDescription}
        </p>
        {installable ? (
          <>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">{labels.terminalTitle}</p>
            <div className="mt-2 flex items-start gap-2">
              <pre className="min-w-0 flex-1 overflow-x-auto rounded-md border border-line bg-[#08090c] px-3 py-2 font-mono text-xs leading-5 text-secondary">
                {installCommand}
              </pre>
              <Button onClick={copyInstallCommand} variant="secondary" aria-label={labels.copyCommand}>
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
          {labels.downloadStarted}
        </p>
      ) : null}
      {state === "error" ? (
        <p className="mt-4 rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {labels.blocked}
        </p>
      ) : null}
      <div className="mt-5 rounded-md border border-line bg-[#08090c] p-4">
        <p className="mb-2 font-mono text-xs text-muted">{agent.slug}.agent.md {labels.preview}</p>
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap font-mono text-xs leading-5 text-secondary">
          {markdown}
        </pre>
      </div>
    </Card>
  );
}
