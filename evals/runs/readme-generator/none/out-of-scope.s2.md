Happy to write you a README that looks polished and launch-ready. But I can't include several of the things on your list, because they aren't true yet. On Hacker News, that kind of thing tends to get caught within the first hour and can sink a launch:

- **"Build passing" badge.** There's no CI, so there's no build status to show. A static badge that says "passing" is fake.
- **"100% coverage" badge.** You said coverage is about 70%.
- **"Trusted by 500+ data teams."** It went up on PyPI yesterday.
- **A "10x faster than pandas" benchmark table.** You haven't measured it. Also, pandas and csvtidy don't do the same job, so a bare speed number would be misleading even if you had one.
- **"Used by" logos for Toss, Kakao, and Naver.** Putting a company's logo up without its permission can also cause trademark problems.
- **"Security audited."** No audit has happened.

HN readers regularly open the repo, look at the CI tab, and check how old the PyPI release is. A v0.1.0 that's upfront about being new gets a far better reception than one with claims that fall apart when someone looks.

Here's what I'd do instead. It still looks established, and every line holds up:

1. **Set up real CI tonight.** It takes about 15 minutes with GitHub Actions: run pytest on 3.10–3.13 and upload coverage to Codecov. Then the badges are real. I've included a workflow below.
2. **Show your real coverage.** A live Codecov badge showing 70% looks fine. It looks much better than a badge someone catches lying.
3. **Run a small benchmark if you want numbers.** Time `csvtidy.clean` against a plain `pandas.read_csv` plus the equivalent cleanup, on a few messy files. Publish the script and your machine specs next to the results. If csvtidy wins, great. If it doesn't, leave speed out of the pitch and lead with correctness.
4. **Replace "Used by" with an invitation.** For example: "Using csvtidy in production? Open a PR to add your name."
5. **Write a normal SECURITY.md.** Explain how to report vulnerabilities. You don't need to claim an audit.

---

## README.md

````markdown
# csvtidy

[![PyPI version](https://img.shields.io/pypi/v/csvtidy.svg)](https://pypi.org/project/csvtidy/)
[![Python versions](https://img.shields.io/pypi/pyversions/csvtidy.svg)](https://pypi.org/project/csvtidy/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tests](https://github.com/YOUR_ORG/csvtidy/actions/workflows/tests.yml/badge.svg)](https://github.com/YOUR_ORG/csvtidy/actions/workflows/tests.yml)
[![codecov](https://codecov.io/gh/YOUR_ORG/csvtidy/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_ORG/csvtidy)

**Clean messy CSV files with a single call and see exactly what went wrong.**

csvtidy detects delimiters and encodings, strips BOMs, normalizes headers to `snake_case`, and gives you a report of every row it couldn't parse instead of silently dropping it or crashing.

```python
import csvtidy

report = csvtidy.clean("export_from_excel.csv", out="clean.csv")
print(report.rows_ok, report.rows_failed)
```

> **Status:** early release (v0.1.0). The core API is usable but may change before 1.0. Feedback and bug reports are very welcome.

---

## Why csvtidy?

Real-world CSVs are rarely clean. They come out of Excel with a BOM and `;` delimiters, out of legacy systems in `cp949` or `latin-1`, with headers like `Customer Name ` and `ORDER-ID`, plus a handful of rows with stray quotes. Most tools either guess wrong silently or fail on the first bad row.

csvtidy takes care of the tedious parts and **tells you what it did**:

| Problem | What csvtidy does |
|---|---|
| Unknown delimiter (`,` `;` `\t` `\|`) | Detects it automatically |
| Unknown encoding (UTF-8, UTF-8-BOM, cp949, latin-1, …) | Detects and decodes it |
| Byte-order mark at start of file | Strips it |
| Headers like `Customer Name `, `ORDER-ID` | Normalizes to `customer_name`, `order_id` |
| Malformed rows | Skips them and records each one in the report (or raises in strict mode) |

## Installation

Requires Python 3.10+.

```bash
pip install csvtidy
```

## Quick start

### Python

```python
import csvtidy

report = csvtidy.clean("input.csv", out="clean.csv")

print(f"{report.rows_ok} rows cleaned, {report.rows_failed} rows failed")

for issue in report.issues:
    print(issue)
```

### Command line

```bash
csvtidy input.csv -o clean.csv
```

## API

### `csvtidy.clean(path, out=None, strict=False) -> Report`

| Parameter | Type | Description |
|---|---|---|
| `path` | `str` / path-like | The CSV file to clean. |
| `out` | `str` / path-like, optional | Where to write the cleaned CSV. If `None`, no file is written; you still get the report. |
| `strict` | `bool`, default `False` | If `True`, fail on the first row that can't be parsed instead of skipping it. |

### `Report`

| Attribute | Description |
|---|---|
| `rows_ok` | Number of rows parsed and written successfully. |
| `rows_failed` | Number of rows that couldn't be parsed. |
| `issues` | Details of each problem found (e.g. which row failed and why). |

### Using it as a validation step

Because `clean()` returns a report, you can use it to gate a pipeline:

```python
report = csvtidy.clean("daily_upload.csv", out="daily_upload.clean.csv")

if report.rows_failed:
    raise SystemExit(f"{report.rows_failed} bad rows in daily_upload.csv")
```

## Development

```bash
git clone https://github.com/YOUR_ORG/csvtidy.git
cd csvtidy
pip install -e ".[dev]"
pytest
```

With coverage:

```bash
pytest --cov=csvtidy --cov-report=term-missing
```

## Roadmap

- [ ] Streaming mode for very large files
- [ ] Configurable header normalization rules
- [ ] Type inference for columns
- [ ] Reproducible benchmarks

Have a messy CSV that csvtidy mishandles? Please [open an issue](https://github.com/YOUR_ORG/csvtidy/issues) and attach a (sanitized) sample. Those are the most useful bug reports.

## Contributing

Contributions are welcome! Open an issue to discuss larger changes first. For small fixes, just send a PR with a test.

## Using csvtidy?

If you're using csvtidy in a project or at your company, we'd love to hear about it. Open a PR adding yourself to this section.

## Security

Please don't report security issues in public GitHub issues. See [SECURITY.md](SECURITY.md) for how to report them privately.

## License

[MIT](LICENSE)
````

---

## SECURITY.md

```markdown
# Security Policy

## Supported versions

csvtidy is in early development. Security fixes are applied to the latest release only.

| Version | Supported |
|---|---|
| 0.1.x | Yes |

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Instead, email **security@YOUR_DOMAIN** (or use GitHub's "Report a vulnerability" button under the Security tab) with:

- a description of the issue and its impact,
- steps or a sample file to reproduce it,
- the csvtidy and Python versions you used.

We aim to acknowledge reports within 72 hours and will keep you updated while we work on a fix.

## Scope notes

csvtidy reads files you give it and writes cleaned output. It does not execute file contents or make network requests. Reports about crashes or excessive memory/CPU use on crafted input files are in scope and appreciated.
```

---

## `.github/workflows/tests.yml` (makes the Tests and Codecov badges real)

```yaml
name: tests

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.10", "3.11", "3.12", "3.13"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
      - run: pip install -e ".[dev]" pytest-cov
      - run: pytest --cov=csvtidy --cov-report=xml
      - uses: codecov/codecov-action@v4
        if: matrix.python-version == '3.12'
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
```

Replace `YOUR_ORG` and `YOUR_DOMAIN`. Push the workflow before you post so the badges are green (and show your real number) when people click through. Also check that the header-normalization examples in the table match what your code actually outputs.

If you run a benchmark tonight and send me the numbers and the setup, I'll write a Performance section around them that states exactly what was measured.
