버전 번호는 확정 전이라 `[version TBD]` / `[버전 미정]`으로 두었습니다. 확정되면 제목만 바꾸면 됩니다.

---

## 1. 사용자용: English (GitHub Releases / site notice)

## Agent Archive [version TBD] (2026-09-29)

### Install kits from stable URLs
Every install kit file now has a fixed URL at `/kits/<slug>/<file>`. Each agent page shows a one-line curl command and per-file links, and the kit README lists the download URLs, so you can fetch a kit from the terminal or link to it from another project. The command also works on curl older than 7.73 (e.g. Ubuntu 20.04, Debian 10).

### Verification labels corrected
61 agents were labelled "tested" without the recorded sample runs our contribution guidelines require. They are now "unverified". Only the label changed; the prompts are the same. From now on, "tested" and "expert" require a recorded evaluation with at least two sample runs, and our data checks enforce this. If you picked an agent because it was marked tested, check its current badge and review its output before relying on it.

### More of the site in Korean
On /ko, agent detail pages, badges, cards, and the agent search panel are now in Korean. Role and category names are still in English; this is tracked separately.

### Sitemap
The site now publishes sitemap.xml and robots.txt, with English and Korean alternates for each page.

---

## 1. 사용자용: 한국어 (GitHub Releases / 사이트 공지)

## Agent Archive [버전 미정] (2026-09-29)

### 고정 URL로 설치 키트 받기
모든 설치 키트 파일을 `/kits/<slug>/<file>` 고정 주소로 받을 수 있습니다. 에이전트 페이지에 한 줄짜리 curl 명령과 파일별 링크가 표시되고, 키트 README에도 다운로드 URL이 들어 있어 터미널에서 바로 받거나 다른 프로젝트에서 링크할 수 있습니다. 이 명령은 curl 7.73 미만(예: Ubuntu 20.04, Debian 10)에서도 동작합니다.

### 검증 상태 표시 수정
에이전트 61개가 기여 가이드에서 요구하는 샘플 실행 기록 없이 "tested"로 표시되어 있었습니다. 이 에이전트들은 이제 "unverified"로 표시됩니다. 바뀐 것은 표시뿐이며 프롬프트 내용은 그대로입니다. 앞으로 "tested"와 "expert"는 샘플 실행 2회 이상이 포함된 평가 기록이 있어야 하며, 데이터 검사에서 이를 확인합니다. "tested" 표시를 보고 에이전트를 골랐다면 현재 배지를 확인하고, 결과물을 검토한 뒤 사용해 주세요.

### 한국어 화면 확대
/ko에서 에이전트 상세 페이지, 배지, 카드, 에이전트 검색 패널이 한국어로 표시됩니다. 역할·카테고리 이름은 아직 영어이며, 별도로 관리하고 있습니다.

### 사이트맵
sitemap.xml과 robots.txt를 제공하며, 각 페이지의 영어·한국어 버전을 서로 연결합니다.

---

## 2. 기여자용 내부 요약

**[version TBD] (2026-09-29) — contributor notes**

- **Verification rules (#14, #18):** `check:data` now rejects `verifiedStatus: tested` or `expert` unless the agent records an evaluation with at least 2 sample runs. CONTRIBUTING.md now states this applies to `expert` too. 61 agents were lowered to `unverified`, and their `updatedAt` was bumped (#18). To raise a status, add the evaluation and sample runs first.
- **`updatedAt` feeds the sitemap (#16, #18):** agent pages use `updatedAt` as `lastModified` in sitemap.xml, so bump it when you change an agent.
- **Tests in CI (#17):** `npm test` (node:test via tsx) now runs in CI; run it locally before opening a PR. The test glob is now expanded by the shell so it works on Node 20. The lockfile was regenerated with npm 10 so `npm ci` passes; use npm 10 if you touch `package-lock.json`.
- **i18n (#15, #19):** agent detail page strings moved into the en/ko dictionaries; badges, cards, and the search panel use the new `agentMeta` and `agentSearch` groups. Add new UI strings to both `en` and `ko` instead of hardcoding English. Role and category names are still English (tracked separately).
- **Install kits (#13):** kit files are prerendered to `/kits/<slug>/<file>`. The install command avoids `curl --output-dir` (missing before curl 7.73); it creates the directory and runs curl in a subshell. Don't reintroduce `--output-dir`.
- **Sitemap (#16):** sitemap.xml and robots.txt list every localized page with en/ko hreflang alternates; Bookmarks is intentionally excluded.
- **Dependencies (#12):** react/react-dom 19.2.7 → 19.3.0 with matching `@types/react`/`@types/react-dom`, `@types/node` 22.20.0 → 22.20.4, autoprefixer 10.5.2 → 10.6.1.
