I can't include the badges, the "trusted by 500+ data teams" line, the 10x benchmark, the Toss/Kakao/Naver logos, or the "audited" security claim. None of them is true yet. There's no CI to produce a "build passing" badge, coverage is about 70%, not 100%, and the benchmark was never run. HN readers check these things, and a single made-up claim that gets caught will overshadow the launch. Using company logos without permission can also cause legal trouble.

Here is a README built only on facts you gave me. A v0.1.0 project with a clear API, honest limitations, and a real roadmap looks credible on HN. At the end I list quick things you could make true before tomorrow.

Three questions, most important first:
1. What does `strict=True` do: raise on the first bad row, or fail at the end? What's the CLI exit code when rows fail?
2. When `out=None`, what happens: no file written, or a default output path? Does `-o` overwrite an existing file without asking?
3. What's the repository URL, for install-from-source and contributing links?

---

```markdown
# csvtidy

Clean messy CSV files in one call: delimiter and encoding detection, snake_case headers, BOM stripping, and a report of rows that couldn't be parsed.

## Why

Real-world CSVs arrive with unknown delimiters, odd encodings, stray BOMs, and inconsistent headers. csvtidy handles those in one step and tells you exactly which rows it couldn't parse, so they don't get dropped without notice.

## Status

v0.1.0 is the first release (on PyPI). The API may change before 1.0.

## Requirements

- Python 3.10+

## Install

```bash
pip install csvtidy
```

## Quick start

### Python

```python
import csvtidy

report = csvtidy.clean("input.csv", out="clean.csv")

print(report.rows_ok)      # rows parsed successfully
print(report.rows_failed)  # rows that could not be parsed
print(report.issues)       # details on what went wrong
```

### CLI

```bash
csvtidy input.csv -o clean.csv
```

## What it does

- **Delimiter detection**: works out the delimiter automatically.
- **Encoding detection**: works out the file encoding automatically.
- **Header normalization**: converts column headers to `snake_case`.
- **BOM stripping**: removes a leading byte-order mark.
- **Failure reporting**: rows it can't parse are counted in `rows_failed` and described in `issues`. They are not dropped silently.

## API

### `csvtidy.clean(path, out=None, strict=False) -> Report`

| Parameter | Default | Description |
|-----------|---------|-------------|
| `path`    | —       | Path to the input CSV. |
| `out`     | `None`  | Output path for the cleaned CSV. <TBD: behavior when `None` (no file written? default path?)> |
| `strict`  | `False` | <TBD: what strict mode changes, e.g. raises on the first unparseable row> |

### `Report`

| Attribute     | Description |
|---------------|-------------|
| `rows_ok`     | Number of rows parsed successfully. |
| `rows_failed` | Number of rows that could not be parsed. |
| `issues`      | Details of the problems found. <TBD: type/structure> |

## CLI

```bash
csvtidy INPUT.csv -o OUTPUT.csv
```

- `-o`: path for the cleaned output file. <TBD: overwrite behavior if the file exists; behavior when `-o` is omitted>
- <TBD: exit code when some rows fail>

## Limitations

- Early release (v0.1.0): expect rough edges and possible API changes.
- No CI yet. Tests are run locally.
- Test coverage is about 70% (around 40 tests).
- No performance benchmarks published yet.

## Roadmap

- Set up CI
- Raise test coverage
- Publish reproducible benchmarks

## Development

```bash
pip install pytest
pytest
```

<TBD: how to install from source / dev dependencies>

## Contributing

Issues and pull requests are welcome at <TBD: repository URL>.

## Security

To report a vulnerability, contact <TBD: security contact email>. csvtidy has not had an independent security audit.

## License

MIT
```

---

## Notes for the author

**Left out on purpose (not true, or can't be verified yet):**
- "Build passing" badge: there's no CI. Add a GitHub Actions workflow running `pytest` tonight and you can use the real badge it generates.
- "100% coverage" badge: coverage is about 70%. A real coverage badge (e.g. from Codecov) showing 70% is fine. Nobody expects 100% at v0.1.0.
- "Trusted by 500+ data teams": the package was published yesterday. A PyPI version badge (`https://img.shields.io/pypi/v/csvtidy`) and a Python-version badge are honest and still look polished.
- 10x-faster-than-pandas table: it was never measured. If you run a benchmark tonight, publish the script, dataset, and hardware next to the numbers. HN commenters will try to reproduce it. Also, csvtidy and pandas do different jobs, so compare a specific operation, such as "read + clean a 1 GB messy CSV".
- "Used by" Toss / Kakao / Naver: don't show company logos unless they actually use it and have agreed. Doing so can break trademark rules and would likely be the most-upvoted comment on your launch post.
- "Audited" security section: no audit happened. I wrote a vulnerability-reporting section instead.

**Assumptions to verify:**
- `issues` is described generically. Fill in its real type/shape.
- `pip install pytest` + `pytest` is assumed to be the dev test flow. Confirm the dev dependencies.
- The "Status" and "Limitations" sections restate facts you gave (v0.1.0, no CI, ~70% coverage, ~40 tests).
- Fill every `<TBD: …>` before publishing, especially `strict`, `out=None`, the `-o` overwrite behavior, and the CLI exit codes. People will ask about those first.
