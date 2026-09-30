I can't include five of the things you asked for, because each one would be false and anyone on Hacker News can check it in a minute:

- **"Build passing" badge**: there's no CI yet, so there's no build to report on.
- **"100% coverage" badge**: coverage is about 70%.
- **"Trusted by 500+ data teams"**: v0.1.0 went up on PyPI yesterday.
- **"10x faster than pandas" table**: no benchmark has been run.
- **"Used by" Toss, Kakao, Naver**: using company logos without permission is a legal and reputational risk, not just a stretch.
- **"Audited" SECURITY section**: no audit has happened.

HN readers are quick to spot inflated claims, and a caught one will hurt the launch more than an honest v0.1.0 would. A small, precise, honest README tends to land well there. Below is one built only from the facts you gave me, plus honest versions of the badge, benchmark, and security sections you can fill in once they're real.

---

````markdown
# csvtidy

Clean messy CSV files in one call: detect delimiters and encodings, normalize headers, strip BOMs, and get a report of rows that couldn't be parsed.

![PyPI](https://img.shields.io/pypi/v/csvtidy) ![Python](https://img.shields.io/pypi/pyversions/csvtidy) ![License: MIT](https://img.shields.io/badge/license-MIT-blue)

> **Status:** early release (v0.1.0). The API may change before 1.0.

## Why

Real-world CSVs arrive with guessed delimiters, unknown encodings, invisible BOMs, and headers like `Customer Name ` or `ORDER-ID`. csvtidy handles those steps for you and tells you which rows it couldn't parse, so bad rows are reported instead of silently dropped.

## What it does

- **Delimiter detection**: works out the separator instead of assuming a comma.
- **Encoding detection**: works out the file's text encoding.
- **BOM stripping**: removes a leading byte-order mark so it doesn't end up in your first column name.
- **Header normalization**: converts headers to `snake_case` (for example `Customer Name` becomes `customer_name`).
- **Failure reporting**: returns a report listing the rows it couldn't parse.

## Requirements

- Python 3.10 or newer

## Install

```bash
pip install csvtidy
```

## Quick start

### Python

```python
import csvtidy

report = csvtidy.clean("input.csv", out="clean.csv")

print(report.rows_ok)      # rows cleaned successfully
print(report.rows_failed)  # rows that couldn't be parsed
print(report.issues)       # details of the problems found
```

### Command line

```bash
csvtidy input.csv -o clean.csv
```

## API

### `csvtidy.clean(path, out=None, strict=False) -> Report`

| Parameter | Default | Description |
|-----------|---------|-------------|
| `path`    | required | Path to the input CSV file. |
| `out`     | `None`  | Path to write the cleaned CSV. <TBD: what happens when `out` is `None` (nothing written? cleaned data returned?)> |
| `strict`  | `False` | <TBD: exact behavior, for example whether it raises on the first unparseable row instead of reporting it> |

**`Report`**

| Attribute     | Description |
|---------------|-------------|
| `rows_ok`     | Number of rows cleaned successfully. <TBD: confirm it's a count and not a list> |
| `rows_failed` | Rows that couldn't be parsed. <TBD: count or list of row numbers?> |
| `issues`      | Details of the problems found. <TBD: structure of each issue> |

## Command-line usage

```bash
csvtidy input.csv -o clean.csv
```

| Option | Description |
|--------|-------------|
| `-o`   | Output file for the cleaned CSV. |

<TBD: behavior when `-o` is omitted, when the output file already exists (overwrite?), whether there's a strict flag on the CLI, and the exit code when rows fail>

## Limitations

- Early release (v0.1.0): the API may change.
- <TBD: known limits, for example very large files, multi-line quoted fields, encodings it can't detect>

## Development

```bash
pytest
```

The suite has about 40 tests with roughly 70% coverage. CI isn't set up yet.

## Security

Please report vulnerabilities privately to <TBD: contact email or GitHub security advisory link> rather than opening a public issue. csvtidy has not had a third-party security audit.

## Contributing

Issues and pull requests are welcome. <TBD: link to the repository and any contribution guidelines>

## License

MIT. See [LICENSE](LICENSE).
````

---

## Notes for the author

**Left out on purpose** (add them back only once they're true):

- **Build badge**: set up CI (for example GitHub Actions running `pytest`), then add the badge your CI provider gives you.
- **Coverage badge**: add one from a coverage service once CI uploads reports, and let it show the real number. 70% on a v0.1.0 is nothing to hide.
- **Benchmark table**: run a reproducible benchmark first (same files, same machine, published script) and report whatever it shows. Keep in mind that csvtidy and pandas do different jobs, so "faster than pandas" needs a careful, like-for-like comparison.
- **"Used by" / "Trusted by"**: add these only with real users who have agreed to be named. Put logos up only with written permission.
- **Security audit**: only claim one if an audit was done, and name who did it.

**Assumptions and things to check before publishing:**

1. The shields.io PyPI badges assume the package name on PyPI is exactly `csvtidy`. They'll render as soon as it's live.
2. What `out=None` does, what `strict=True` does, and the exact types of `rows_ok`, `rows_failed`, and `issues` are marked `<TBD>`. Please fill them in so users know what to expect.
3. CLI behavior still needs confirming: what happens without `-o`, whether an existing output file gets overwritten, and the exit code when some rows fail.
4. Add the repository URL, a security contact, and a `LICENSE` file if the repo doesn't have one yet.
5. I didn't name a detection library or give a list of supported encodings because you didn't mention either. Add them if you want.
