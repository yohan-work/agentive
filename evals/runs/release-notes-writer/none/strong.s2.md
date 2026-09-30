두 버전 모두 아래에 정리했습니다. 버전 번호는 확정 전이라 `vX.Y.Z` 자리표시자로 두었으니, 확정되면 바꿔 넣어 주세요.

---

## (1) 사용자용 릴리스 노트

### English

**Agent Archive vX.Y.Z — 2026-09-29**

**Install kits now have stable URLs**
Every install kit file is published at `/kits/<slug>/<file>`. Each agent page shows a one-line `curl` command and per-file links, and the kit README lists the download URLs, so you can fetch a kit from your terminal or link it from another project. The command also works on older curl (before 7.73), such as on Ubuntu 20.04 and Debian 10.

**Verification labels corrected**
61 agents were labelled "tested" without the recorded sample runs our contribution guide requires for that level. They are now "unverified". Their prompts have not changed; the label now reflects only what has actually been checked. Going forward, "tested" and "expert" require a recorded evaluation with at least two sample runs, and our data checks enforce this.

**More of the site in Korean**
Agent detail pages, status and difficulty badges, agent and workflow cards, and the agent search panel are now translated on /ko. Role and category names are still English and are next.

**Also**
- sitemap.xml and robots.txt with en/ko alternates
- Dependency updates (React 19.3.0)

### 한국어

**Agent Archive vX.Y.Z — 2026-09-29**

**설치 키트를 고정 URL로 받을 수 있습니다**
모든 설치 키트 파일이 `/kits/<slug>/<file>` 주소로 제공됩니다. 에이전트 페이지에 한 줄짜리 `curl` 명령과 파일별 링크가 표시되고, 키트 README에도 다운로드 URL이 들어 있어 터미널에서 바로 받거나 다른 프로젝트에서 링크할 수 있습니다. Ubuntu 20.04, Debian 10처럼 curl 7.73 미만이 설치된 환경에서도 동작합니다.

**검증 상태 표시를 바로잡았습니다**
에이전트 61개가 기여 가이드에서 요구하는 샘플 실행 기록 없이 "tested"로 표시되어 있었습니다. 이 에이전트들은 이제 "unverified"로 표시됩니다. 프롬프트 내용은 바뀌지 않았고, 표시가 실제로 확인한 범위와 일치하도록 고친 것입니다. 앞으로 "tested"와 "expert"는 샘플 실행 2회 이상을 포함한 평가 기록이 있어야 하며, 데이터 검사에서 자동으로 확인합니다.

**한국어 화면이 늘었습니다**
/ko에서 에이전트 상세 페이지, 상태·난이도 배지, 에이전트·워크플로 카드, 에이전트 검색 패널이 한국어로 표시됩니다. 역할·카테고리 이름은 아직 영어이며 다음 작업으로 진행합니다.

**기타**
- en/ko 대체 링크를 포함한 sitemap.xml, robots.txt 추가
- 의존성 업데이트 (React 19.3.0)

---

## (2) 기여자용 내부 요약

**2026-09-29 배포 요약 (v0.4.0 이후, #12–#19)**

**꼭 알아야 할 규칙 변경**
- **check:data 검증 강화 (#14):** `verifiedStatus`가 `tested` 또는 `expert`이면 평가 기록과 샘플 실행 2회 이상이 없을 때 `npm run check:data`가 실패합니다. 기존 61개는 `unverified`로 내렸고(#14), 해당 에이전트의 `updatedAt`도 갱신했습니다(#18). 다시 올리려면 평가와 샘플 실행을 먼저 기록해야 합니다. expert도 같은 요건이라는 점을 CONTRIBUTING.md에 명시했습니다.
- **npm test가 CI에 추가됨 (#17):** 설치 키트, 검색, 로케일 헬퍼에 대한 `node:test` 스위트(tsx로 실행)가 생겼고, CI에서 `npm test`를 돌립니다. PR 전에 로컬에서도 실행해 주세요.
- **Node / npm 버전 이슈 (#17):** Node 20에서 테스트 글롭이 동작하도록 셸이 글롭을 확장하게 바꿨습니다. lockfile은 npm 10으로 재생성했으니, 다른 npm 메이저로 lockfile을 다시 만들면 `npm ci`가 CI에서 깨질 수 있습니다.

**알아 두면 좋은 변경**
- **i18n (#15, #19):** 에이전트 상세 페이지, 배지, 카드, 검색 패널 문자열을 사전으로 옮겼고, `agentMeta`, `agentSearch` 그룹이 새로 생겼습니다. 새 UI 문자열은 en/ko 양쪽에 추가해야 합니다. 역할·카테고리 이름 번역은 별도로 추적 중입니다.
- **설치 키트 URL (#13):** 키트 파일이 `/kits/<slug>/<file>`로 프리렌더링됩니다. 설치 명령은 `--output-dir`(curl 7.73+)을 쓰지 않고 디렉터리 생성 후 서브셸에서 curl을 실행합니다. 이 명령을 수정할 때 구형 curl 호환을 유지해 주세요.
- **sitemap / robots (#16):** 모든 로컬라이즈 페이지가 en/ko hreflang과 함께 포함되고, 에이전트 페이지는 `updatedAt`이 `lastModified`로 쓰입니다. 따라서 에이전트 내용을 바꾸면 `updatedAt`도 갱신해 주세요. Bookmarks 페이지는 의도적으로 제외했습니다.
- **의존성 (#12):** React/react-dom 19.3.0, @types/node 22.20.4, autoprefixer 10.6.1 등 minor/patch 업데이트 (dependabot).

**남은 일**
- 버전 번호 확정 (v0.5.0 예정)
- 역할·카테고리 이름 한국어화
- "unverified"로 내려간 에이전트 중 우선순위 높은 것부터 평가 기록 추가
