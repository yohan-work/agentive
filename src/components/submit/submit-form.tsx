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

// GitHub rejects very long /issues/new URLs, so long fields are trimmed and the submitter
// is asked to paste the full text into the issue.
const MAX_ISSUE_URL_LENGTH = 7000;
const CODE_FIELDS = new Set<string>(["Example input", "Example output", "Prompt"]);

function formatField(label: string, value: string) {
  if (!value) {
    return `### ${label}\n\n_No response_`;
  }

  if (CODE_FIELDS.has(label)) {
    const fence = value.includes("```") ? "~~~~" : "```";
    return `### ${label}\n\n${fence}text\n${value}\n${fence}`;
  }

  return `### ${label}\n\n${value}`;
}

function buildIssueUrl(title: string, values: Record<string, string>) {
  const body = fields.map(([label]) => formatField(label, values[label] ?? "")).join("\n\n");
  const params = new URLSearchParams({ title, labels: "new-agent", body });
  return `${siteConfig.repoUrl}/issues/new?${params.toString()}`;
}

function buildSubmissionIssueUrl(rawValues: Record<string, string>) {
  const values = Object.fromEntries(Object.entries(rawValues).map(([label, value]) => [label, value.trim()]));
  const title = `[Agent]: ${(values["Agent name"] || "New agent").slice(0, 120)}`;
  const truncated = new Set<string>();
  const render = () =>
    buildIssueUrl(
      title,
      Object.fromEntries(
        Object.entries(values).map(([label, value]) => [
          label,
          truncated.has(label) ? `${value}\n[truncated — paste the full ${label.toLowerCase()} here]` : value
        ])
      )
    );

  // Shrink the longest field until the URL fits; truncated fields ask the submitter to paste the rest.
  let url = render();
  while (url.length > MAX_ISSUE_URL_LENGTH) {
    const [label, value] = Object.entries(values).sort((a, b) => b[1].length - a[1].length)[0];
    if (value.length < 40) {
      break;
    }
    values[label] = value.slice(0, Math.floor(value.length * 0.7));
    truncated.add(label);
    url = render();
  }

  return url;
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
