"use client";

import { FormEvent } from "react";
import { Github } from "lucide-react";
import { Button } from "@/components/common/button";
import { siteConfig } from "@/lib/site";

const fields = [
  ["Agent name", "text"],
  ["Summary", "text"],
  ["Role", "text"],
  ["Category", "text"],
  ["Tags", "text"],
  ["Tools", "text"],
  ["Example input", "textarea"],
  ["Example output", "textarea"],
  ["Creator name", "text"],
  ["Notes", "textarea"],
  ["Prompt", "prompt"]
] as const;

const inputClassName =
  "w-full rounded-lg border border-line bg-panel px-3 text-sm text-primary outline-none transition placeholder:text-muted focus:border-accent/55 focus:ring-2 focus:ring-accent/20";

function buildSubmissionIssueUrl(values: Record<string, string>) {
  const name = values["Agent name"]?.trim() || "New agent";
  const body = fields
    .map(([label]) => `### ${label}\n\n${values[label]?.trim() || "_No response_"}`)
    .join("\n\n");
  const params = new URLSearchParams({
    title: `[Agent]: ${name}`,
    labels: "new-agent",
    body
  });

  return `${siteConfig.repoUrl}/issues/new?${params.toString()}`;
}

export function SubmitForm() {
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values = Object.fromEntries(fields.map(([label]) => [label, String(data.get(label) ?? "")]));
    window.open(buildSubmissionIssueUrl(values), "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        {fields.map(([label, type]) => (
          <label key={label} className={type === "text" ? "" : "md:col-span-2"}>
            <span className="mb-2 block text-sm font-medium text-primary">{label}</span>
            {type === "text" ? (
              <input name={label} required={label === "Agent name"} className={`h-11 ${inputClassName}`} />
            ) : (
              <textarea
                name={label}
                required={label === "Prompt"}
                className={type === "prompt" ? `min-h-44 py-3 font-mono ${inputClassName}` : `min-h-28 py-3 ${inputClassName}`}
              />
            )}
          </label>
        ))}
      </div>
      <Button type="submit" variant="primary">
        <Github className="h-4 w-4" />
        Open submission on GitHub
      </Button>
      <p className="text-sm leading-6 text-muted">
        Submissions are reviewed as GitHub issues. This opens a pre-filled issue in a new tab; nothing is stored on this site.
      </p>
    </form>
  );
}
