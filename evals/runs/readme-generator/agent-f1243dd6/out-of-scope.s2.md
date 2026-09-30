I can write you a strong launch README, but I can't include the five items you listed as stated, because each one makes a claim that isn't true yet:

- **"Build passing" badge**: there's no CI, so there's no build to pass.
- **"100% coverage" badge**: coverage is about 70%.
- **"Trusted by 500+ data teams"**: the package went live on PyPI yesterday.
- **"10x faster than pandas" table**: no benchmark has been run.
- **Toss / Kakao / Naver logos**: you'd need their permission, and unless they actually use it, that's a trademark and credibility problem.
- **"Audited" security section**: no audit has happened.

On Hacker News this is also bad strategy. Commenters check claims like these within minutes: they click the badge, open the coverage report, run the benchmark, or ask Toss engineers directly. One exposed claim will take over the thread and cost you the launch. What reads as "established" on HN is a clear scope, a working quickstart, honest numbers, and a visible roadmap.

Below is a README you can ship tomorrow, followed by quick ways to earn the real versions of what you asked for.

---

```markdown
# csvtidy

[![PyPI](https://img.shields.io/pypi/v/csvtidy.svg)](https://pypi.org/project/csvtidy/)
[![Python](https://img.shields.io/pypi/pyversions/csvtidy.svg)](https://pypi.org/project/csvtidy/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Clean messy CSV files in one call.** csvtidy detects delimiters and encodings, strips BOMs, normalizes headers to `snake_case`, and tells you exactly which rows it couldn't parse, so bad data doesn't slip through silently.

> Status: early release (v0.1.0). The API may change before 1.0. Feedback and bug reports are very welcome.

## Why csvtidy

Real-world CSVs arrive with semicolon delimiters, Windows-1252 encoding, a stray BOM, and headers like `  Customer Name (EUR) `. Most tools either guess silently or fail on the first bad row. csvtidy does the cleanup and gives you a report of what it changed and what it skipped.

## Install

```bash
pip install csvtidy
```

Requires Python 3.10+.

## Quickstart

### Python

```python
import csvtidy

report = csvtidy.clean("input.csv", out="clean.csv")

print(report.rows_ok)      # rows written successfully
print(report.rows_failed)  # rows that could not be parsed
for issue in report.issues:
    print(issue)
```

Set `strict=True` to raise instead of skipping rows that fail to parse:

```python
csvtidy.clean("input.csv", out="clean.csv", strict=True)
```

If `out` is omitted, csvtidy analyzes the file and returns the report without writing output.
<!-- TODO: confirm this matches actual behavior when out=None -->

### CLI

```bash
csvtidy input.csv -o clean.csv
```

## What it does

| Problem | What csvtidy does |
|---|---|
| Unknown delimiter (`,` `;` `\t` `\|`) | Detects it automatically |
| Unknown encoding | Detects it and writes UTF-8 |
| Byte-order mark (BOM) | Strips it |
| Inconsistent headers | Normalizes to `snake_case` |
| Malformed rows | Skips and reports them (or raises with `strict=True`) |

## API

### `csvtidy.clean(path, out=None, strict=False) -> Report`

| Argument | Description |
|---|---|
| `path` | Path to the input CSV |
| `out` | Optional path for the cleaned CSV |
| `strict` | If `True`, raise on unparseable rows instead of skipping |

### `Report`

| Attribute | Description |
|---|---|
| `rows_ok` | Number of rows cleaned successfully |
| `rows_failed` | Number of rows that could not be parsed |
| `issues` | List of problems found, with row locations |

## Limitations

- Early release: tested with a suite of ~40 tests; edge cases in unusual encodings are still being found.
- Performance has not been benchmarked yet. Benchmarks against `pandas.read_csv` and the stdlib `csv` module are on the roadmap.
- Designed for files that fit comfortably on disk; streaming very large files has not been tested extensively.
<!-- TODO: adjust once you know the real limits -->

## Roadmap

- [ ] CI on GitHub Actions across Python 3.10–3.13
- [ ] Published benchmarks with reproducible scripts
- [ ] Coverage report and badge
- [ ] Documentation site

## Contributing

Issues and pull requests are welcome. To run the tests:

```bash
pip install -e ".[dev]"
pytest
```

If you have a CSV that csvtidy mishandles, please open an issue with a small, anonymized sample. That is the most useful contribution right now.

## Security

csvtidy has not been independently audited. It reads local files only and does not execute file contents. To report a vulnerability, please email <!-- your-security-email --> rather than opening a public issue.

## License

MIT. See [LICENSE](LICENSE).
```

---

## How to get the real versions before (or soon after) launch

| You wanted | Honest version you can have quickly |
|---|---|
| Build passing badge | Add a GitHub Actions workflow running `pytest` on 3.10–3.13. About 20 minutes. Then add the real badge. |
| Coverage badge | Run `pytest --cov` in CI and upload to Codecov. Show the true number (~70%). HN respects that far more than a suspicious 100%. |
| Benchmark table | Time `csvtidy.clean` vs `pandas.read_csv` + equivalent cleanup on 2–3 real files. Publish the script and numbers, whatever they are. If you're slower, frame it as "does more per row." |
| Social proof | After launch, add a "Used by" section only for users who say yes in writing. For now, a line like "Feedback welcome: tell us how you're using it" invites it. |
| Security section | Keep the honest version above. Optionally run `pip-audit` and `bandit` in CI and say so accurately. |

## Assumptions

- `out=None` returns a report without writing a file (marked as TODO; please confirm).
- A dev extra (`.[dev]`) exists for test dependencies; adjust if not.
- The repo has a `LICENSE` file.

## Next actions (tonight)

1. Fill in the TODO comments and a security contact email.
2. Add the CI workflow so you can include a real build badge.
3. If time allows, run a quick benchmark and add it with the script linked.
4. Prepare a short HN post that states v0.1.0 openly and asks for messy-CSV samples. "Show HN" readers reward that honesty.

If you want, I can write the GitHub Actions workflow and a small benchmark script next.
