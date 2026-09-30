I can make this README look polished and launch-ready, but I'm leaving out five things you asked for, because each would be a false claim on a page Hacker News readers will check within minutes:

- **"Build passing" badge**: there's no CI, so nothing is passing. A badge that points nowhere (or at a static image) is the first thing people click.
- **"100% coverage" badge**: coverage is about 70%.
- **"Trusted by 500+ data teams"**: the package went up on PyPI yesterday.
- **"10x faster than pandas" table**: no benchmark has been run. Made-up numbers in a README are the quickest way to get a launch thread derailed.
- **Toss / Kakao / Naver logos**: using company logos without their permission is a trademark problem as well as a false claim, and someone will ask those companies.
- **"Audited" security section**: no audit has happened. I've written an honest security policy instead.

What reads as "established" to HN is a clear pitch, a working quickstart, honest status, and a visible roadmap. Here's that version:

---

```markdown
# csvtidy

[![PyPI](https://img.shields.io/pypi/v/csvtidy)](https://pypi.org/project/csvtidy/)
[![Python](https://img.shields.io/pypi/pyversions/csvtidy)](https://pypi.org/project/csvtidy/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Clean messy CSV files in one call.** csvtidy detects delimiters and encodings, strips BOMs, normalizes headers to `snake_case`, and tells you exactly which rows it couldn't parse, instead of failing silently or crashing halfway through.

> **Status:** early release (v0.1.0). The API may change before 1.0. Feedback and bug reports are very welcome.

## Why

Real-world CSVs arrive with semicolon delimiters, Latin-1 encodings, invisible BOMs, and headers like `" Customer ID "`. csvtidy handles the boring normalization and gives you a report of what went wrong, so bad rows are visible rather than lost.

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
print(report.rows_failed)  # rows that couldn't be parsed
for issue in report.issues:
    print(issue)
```

### CLI

```bash
csvtidy input.csv -o clean.csv
```

## What it does

| Problem                          | What csvtidy does                         |
|----------------------------------|-------------------------------------------|
| Unknown delimiter (`,` `;` `\t` `|`) | Detects it automatically               |
| Unknown encoding                 | Detects it and writes clean output        |
| UTF-8 BOM at the start of file   | Strips it                                 |
| Headers like `" Order Date "`    | Normalizes to `order_date`                |
| Malformed rows                   | Skips and reports them in `report.issues` |

## API

### `csvtidy.clean(path, out=None, strict=False) -> Report`

| Parameter | Description |
|-----------|-------------|
| `path`    | Path to the input CSV. |
| `out`     | Output path. If `None`, <!-- TODO: describe default behavior -->. |
| `strict`  | If `True`, <!-- TODO: e.g. raise on the first unparseable row -->. |

### `Report`

| Attribute     | Description |
|---------------|-------------|
| `rows_ok`     | Number of rows cleaned and written. |
| `rows_failed` | Number of rows that could not be parsed. |
| `issues`      | Details of each problem found. |

## Performance

No benchmarks have been published yet. If you run csvtidy on a large or unusual file, please share the results in an issue.

## Development

```bash
git clone https://github.com/<you>/csvtidy
cd csvtidy
pip install -e ".[dev]"
pytest
```

Around 40 tests, about 70% coverage. CI is coming soon (see Roadmap).

## Roadmap

- [ ] CI on GitHub Actions (3.10–3.13)
- [ ] Coverage reporting and a higher coverage target
- [ ] Reproducible benchmarks
- [ ] Streaming mode for very large files

## Contributing

Issues and PRs are welcome. Please include a small sample CSV that reproduces the problem (with any sensitive data removed).

## Security

csvtidy has not had a formal security audit. It reads and writes local files only and makes no network calls. <!-- verify this claim --> To report a vulnerability, please email <!-- security@yourdomain --> rather than opening a public issue.

## License

MIT. See [LICENSE](LICENSE).
```

---

**Assumptions**
- The repo is on GitHub (swap in the real URL) and a `[dev]` extra exists. If not, change the dev install line.
- I left TODOs where I don't know how `out=None` and `strict=True` behave.

**Risks**
- The "no network calls" line in Security has to be true. Check it before publishing.
- The auto-detection claims in the feature table should match what the code actually does today.

**Next actions (most can be done before tomorrow)**
1. **Add CI (~15 min):** a GitHub Actions workflow that runs `pytest`. You'll then have a real build badge.
2. **Add coverage reporting:** `pytest-cov` plus Codecov. A real "70%" badge next to a roadmap looks better than a fake 100%.
3. **Run a quick benchmark:** time csvtidy against `pandas.read_csv` on two or three messy files and publish the script with the results. That's a much stronger HN story than a claimed 10x, whatever the numbers turn out to be.
4. **Add a "Used by" section later,** once real users say yes to being listed.
5. **Fill in the TODOs** and the security contact.
