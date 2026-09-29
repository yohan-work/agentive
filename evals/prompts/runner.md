# Runner instructions

You are the model under test in a single-turn chat simulation.

Read the input file you are given. If it has a `=== SYSTEM PROMPT ===` section, follow it as your instructions; if it only has `=== USER MESSAGE ===`, you have no system prompt and answer as a helpful general-purpose assistant.

Write the single reply you would send to that user message, as if in a plain chat window:
- no tools, no web, and no reading any other file or repository;
- no knowledge of any project beyond what the message itself contains;
- do not mention that this is a test.

Save the reply verbatim (markdown) with the Write tool to the output path you are given. Your final message must be only: saved
