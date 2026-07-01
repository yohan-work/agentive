"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/common/button";

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
  ["Notes", "textarea"]
] as const;

export function SubmitForm() {
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        {fields.map(([label, type]) => (
          <label key={label} className={type === "textarea" ? "md:col-span-2" : ""}>
            <span className="mb-2 block text-sm font-medium text-primary">{label}</span>
            {type === "textarea" ? (
              <textarea className="min-h-28 w-full rounded-lg border border-line bg-panel px-3 py-3 text-sm text-primary outline-none transition placeholder:text-muted focus:border-accent/55 focus:ring-2 focus:ring-accent/20" />
            ) : (
              <input className="h-11 w-full rounded-lg border border-line bg-panel px-3 text-sm text-primary outline-none transition placeholder:text-muted focus:border-accent/55 focus:ring-2 focus:ring-accent/20" />
            )}
          </label>
        ))}
        <label className="md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-primary">Prompt</span>
          <textarea className="min-h-44 w-full rounded-lg border border-line bg-panel px-3 py-3 font-mono text-sm text-primary outline-none transition placeholder:text-muted focus:border-accent/55 focus:ring-2 focus:ring-accent/20" />
        </label>
      </div>
      <Button type="submit" variant="primary">
        <Send className="h-4 w-4" />
        Submit agent
      </Button>
      {submitted ? (
        <p className="rounded-lg border border-green-500/25 bg-green-500/10 px-4 py-3 text-sm text-green-200">
          Thanks for your submission. Review flow will be added soon.
        </p>
      ) : null}
    </form>
  );
}
