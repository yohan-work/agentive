Happy to help you launch strong. I'll write you a README that looks polished and established, but I'm going to leave out the parts that would state things that aren't true yet, because on Hacker News those are the fastest way to sink a launch:

- **"Build passing" badge**: there's no CI, so the badge would be fake. HN readers click badges.
- **100% coverage badge**: you're at about 70%. Someone will run `pytest --cov` in the first hour.
- **"Trusted by 500+ data teams"**: the package went live on PyPI yesterday. The download stats are public (pypistats, pepy.tech).
- **"10x faster than pandas" benchmark table**: made-up numbers will get picked apart, and "it should be about that" won't hold up in the comments.
- **Toss / Kakao / Naver logos**: putting company logos in a "Used by" section without their permission is a trademark problem, and those companies (or their engineers, who read HN) can easily say it isn't true.
- **"Audited" SECURITY section**: saying a library has had a security audit when it hasn't can mislead people who decide to adopt it because of that claim.

Here's the good news: an honest v0.1.0 with a clear pitch, a real example, and a visible roadmap does *well* on HN. "Show HN: I got tired of messy CSVs, so I built this" is a story people like. Below is a README that uses only true badges and claims, and has spots you can fill in once you have real numbers.

---

```markdown
# csvtidy

[![PyPI version](https://img.shields.io/pypi/v/csvtidy.svg)](https://pypi.org/project/csvtidy/)
[![Python versions](https://img.shields.io/pypi/pyversions/csvtidy.svg)](https://pypi.org/project/csvtidy/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Clean messy CSV files in one call.** csvtidy detects delimiters and encodings, strips BOMs, normalizes headers to `snake_case`, and tells you exactly which rows it couldn't parse, and why.

```python
import csvtidy

report = csvtidy.clean("export_from_somewhere.csv", out="clean.csv")
print(report.rows_ok, report.rows_failed)
```

> **Status:** early release (v0.1.0). The API may change before 1.0. Feedback and issues are very welcome.

---

## Why csvtidy?

Real-world CSVs are rarely "comma-separated values." They show up as:

- semicolon- or tab-delimited files that say they're `.csv`
- Windows-1252 or EUC-KR files that break when read as UTF-8
- a stray UTF-8 BOM that turns your first column into `﻿id`
- headers like `Customer Name `, `customer-name`, and `CUSTOMER_NAME` in the same pipeline
- a handful of malformed rows that make the whole load fail

csvtidy handles these cases and gives you a **report** rather than silently dropping data or crashing.

## Features

- **Delimiter detection**: comma, semicolon, tab, pipe, and more
- **Encoding detection**: reads non-UTF-8 files and writes clean output
- **BOM stripping**
- **Header normalization**: `" Order ID "` becomes `order_id`
- **Row-level error reporting**: see which rows failed and why
- **Strict mode**: fail fast when you need guarantees
- **CLI and Python API**

## Installation

```bash
pip install csvtidy
```

Requires Python 3.10+.

## Quickstart

### Python

```python
import csvtidy

report = csvtidy.clean("input.csv", out="clean.csv")

print(f"{report.rows_ok} rows cleaned, {report.rows_failed} rows failed")
for issue in report.issues:
    print(issue)
```

If you set `out=None` (the default), csvtidy analyzes and cleans the file without writing output. <!-- TODO: confirm exact behavior when out=None -->

### Strict mode

```python
report = csvtidy.clean("input.csv", out="clean.csv", strict=True)
```

With `strict=True`, csvtidy stops at the first row it can't parse instead of skipping it. <!-- TODO: confirm: raises an exception? which one? -->

### Command line

```bash
csvtidy input.csv -o clean.csv
```

## API

### `csvtidy.clean(path, out=None, strict=False) -> Report`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | `str` / path-like | required | The CSV file to clean |
| `out` | `str` / path-like or `None` | `None` | Where to write the cleaned CSV |
| `strict` | `bool` | `False` | Stop at the first unparseable row instead of skipping it |

### `Report`

| Attribute | Description |
|-----------|-------------|
| `rows_ok` | Number of rows parsed and written successfully |
| `rows_failed` | Number of rows that couldn't be parsed |
| `issues` | Details about each problem found |

## Performance

Benchmarks are coming. We'd rather publish reproducible numbers than guess. If you have a large or especially messy CSV you'd like included, please open an issue.

<!-- Once measured, add: dataset, file size, machine, Python version, csvtidy and pandas versions, and a script in benchmarks/ so anyone can reproduce it. -->

## Roadmap

- [ ] CI on GitHub Actions (Python 3.10–3.13)
- [ ] Raise test coverage (currently ~70%)
- [ ] Reproducible benchmarks
- [ ] Streaming support for very large files
- [ ] Documentation site

Ideas and requests are welcome in [Issues](../../issues).

## Contributing

Contributions are welcome!

```bash
git clone https://github.com/<your-org>/csvtidy.git
cd csvtidy
pip install -e ".[dev]"
pytest
```

Good first contributions: messy sample CSVs that csvtidy handles badly, which are great test cases.

## Security

To report a security issue, please email **<security@your-domain>** instead of opening a public issue. We'll acknowledge it within a few days.

csvtidy has not had a formal security audit yet. It reads local files and doesn't execute their contents or make network requests.

## License

[MIT](LICENSE)
```

---

### Things you can realistically do before tomorrow to look more established, honestly

1. **Add CI (about 15 minutes).** A basic GitHub Actions workflow that runs `pytest` on 3.10–3.13 gets you a *real* "build passing" badge. I can write the workflow file for you if you'd like.
2. **Add a real coverage badge.** Hook up Codecov or Coveralls in the same workflow. A true 70% badge looks better than a false 100% one, and it shows you're being straightforward.
3. **Run a quick benchmark.** Even one honest comparison, such as "cleaning a 100 MB file with mixed encodings: csvtidy X s vs. pandas + manual fixes Y s," with the script included, is far more convincing than a big claim. It's also fine to compare against the work of *fixing* a CSV in pandas instead of raw read speed, since that's where csvtidy actually helps.
4. **Add a GIF or a before/after example** of a messy file and the resulting report. On HN this does more than any logo wall.
5. **After launch:** if people at real companies tell you they use csvtidy, ask whether you can list them. Then you'll have a genuine "Used by" section.

Want me to write the GitHub Actions workflow or a small reproducible benchmark script next?
