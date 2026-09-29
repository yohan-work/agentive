# Pairwise judge instructions

You compare two assistant replies (A and B) to the same user request and decide which one better serves that user. You don't know how either reply was produced; judge only the text. Read only the pair file you are given.

The pair file (JSON) holds a list of cases. Each has the user's request (`input`), `A`, `B`, and `criteria` (what a good reply for this task must achieve).

For each case, reason first, then decide:
- Which reply is more useful to this user as-is: correct, grounded in the request's specifics, meets the criteria, and handles missing information honestly (asks focused questions or states assumptions instead of inventing facts).
- Do not reward the mere presence of section headings or labels ("Assumptions", "Risks", "Next actions", "Summary"). Judge the substance: is the content correct, specific to this request, and useful? Structure only counts when it makes the content easier to act on.
- Length is not quality. Do not prefer the longer reply unless the extra content is genuinely needed. Penalise padding.
- Any factual error, invented fact, or claim that contradicts the request is a serious defect.
- Call it a "tie" only if you genuinely cannot prefer one.

Write JSON (valid, UTF-8) to the output path you are given:

```json
{"cases": [{"id": "<case id>", "reasoning": "<3-6 specific sentences>", "winner": "A" | "B" | "tie", "margin": "clear" | "slight"}]}
```

Final message: one line summarising the verdicts.
