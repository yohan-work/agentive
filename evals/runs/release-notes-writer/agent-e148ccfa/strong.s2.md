아래 세 가지를 바로 붙여 넣을 수 있게 정리했습니다. 버전 번호는 확정 전이라 `[version TBD]`로 두었습니다.

---

## 1-A. 사용자용 (English)

```markdown
# Agent Archive [version TBD] (2026-09-29)

## Fetch install kits directly
Every install kit file now has a stable URL at `/kits/<slug>/<file>`, for curl downloads or linking from other projects. Each agent page shows a one-line curl command and per-file links, and the kit README lists the download URLs. The command also works with curl older than 7.73 (for example on Ubuntu 20.04 and Debian 10).

## Verification labels corrected
61 agents were labelled "tested" without the recorded sample runs our contribution guide requires. They are now labelled "unverified". This means their testing was never recorded, not that they are known to be broken. If you chose one because it said "tested", review its output as you would any unverified agent. From now on, "tested" and "expert" require a recorded evaluation with at least two sample runs, checked automatically.

## More of the site in Korean
On /ko, agent detail pages, status and difficulty badges, agent and workflow cards, and the agent search panel are now in Korean. Role and category names are still in English.

## Easier to find
The site now publishes sitemap.xml and robots.txt, linking English and Korean versions of each page.
```

## 1-B. 사용자용 (한국어)

```markdown
# Agent Archive [version TBD] (2026-09-29)

## 설치 키트를 바로 받을 수 있습니다
모든 설치 키트 파일이 `/kits/<slug>/<file>` 고정 URL로 제공됩니다. curl로 내려받거나 다른 프로젝트에서 링크할 수 있습니다. 에이전트 페이지에 한 줄 curl 명령과 파일별 링크가 표시되고, 키트 README에도 다운로드 URL이 들어갑니다. 7.73 이전 curl(예: Ubuntu 20.04, Debian 10)에서도 명령이 동작합니다.

## 검증 상태 표시를 바로잡았습니다
에이전트 61개가 기여 가이드에서 요구하는 샘플 실행 기록 없이 "tested"로 표시되어 있었습니다. 이 에이전트들은 이제 "unverified"로 표시됩니다. 테스트 기록이 없다는 뜻이지, 문제가 확인되었다는 뜻은 아닙니다. "tested" 표시를 보고 고른 에이전트가 있다면, 다른 미검증 에이전트처럼 결과를 한 번 검토해 주세요. 앞으로 "tested"와 "expert"는 샘플 실행 2회 이상이 포함된 평가 기록이 있어야 하며, 자동으로 검사됩니다.

## 한국어 화면이 늘었습니다
/ko에서 에이전트 상세 페이지, 상태·난이도 배지, 에이전트·워크플로 카드, 에이전트 검색 패널이 한국어로 표시됩니다. 역할과 카테고리 이름은 아직 영어입니다.

## 검색 노출 개선
sitemap.xml과 robots.txt를 제공하며, 각 페이지의 영어·한국어 버전이 서로 연결됩니다.
```

---

## 2. 기여자용 내부 요약

```markdown
# [version TBD] 내부 요약 (2026-09-29, PR #12–#19)

**규칙 변경**
- `check:data`가 `verifiedStatus: tested` 또는 `expert`인 에이전트에 샘플 실행 2회 이상이 포함된 evaluation 기록이 없으면 실패합니다 (#14). CONTRIBUTING.md에 expert도 샘플 실행 기록이 필요하다고 명시했습니다.
- 기존 61개 에이전트를 tested → unverified로 내렸고, sitemap lastModified가 맞도록 이들의 `updatedAt`을 갱신했습니다 (#14, #18). 상태를 바꿀 때는 `updatedAt`도 함께 갱신하세요.

**테스트 / CI**
- `npm test` 추가: `tests/`의 node:test 스위트를 tsx로 실행(설치 키트, 검색, 로케일 헬퍼). CI에서도 실행됩니다 (#17).
- Node 20 이슈: 테스트 glob을 셸이 확장하도록 바꿔 Node 20에서도 `npm test`가 돕니다 (#17).
- lockfile을 npm 10으로 재생성해 CI의 `npm ci`가 통과합니다. lockfile을 다시 만들 때는 npm 10을 쓰세요 (#17).

**i18n**
- 에이전트 상세 페이지 문자열을 en/ko 사전으로 이동했고(#15), 배지·카드·검색 패널용 `agentMeta`, `agentSearch` 그룹을 새로 추가했습니다 (#19). 새 UI 문자열은 en과 ko 양쪽에 키를 추가하세요. 역할·카테고리 이름 번역은 별도로 추적 중입니다.

**그 밖에**
- 설치 키트 파일이 `/kits/<slug>/<file>`로 프리렌더됩니다. 설치 명령은 `--output-dir` 대신 디렉터리를 만들고 서브셸에서 curl을 실행합니다(curl < 7.73 대응) (#13).
- sitemap.xml / robots.txt 생성, en/ko hreflang 포함. Bookmarks 페이지는 로컬 저장 내용만 보여 주므로 제외 (#16).
- 의존성 업데이트: react/react-dom 19.3.0, @types/node 22.20.4, autoprefixer 10.6.1 등 (#12, dependabot).
```

---

참고: 사용자용 두 버전 모두 200단어 이내(공백 기준)이고 이모지는 없습니다. 의존성 업데이트(#12)와 테스트 추가(#17)는 사용자 동작을 바꾸지 않아 내부 요약에만 넣었습니다.
