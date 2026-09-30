아래에 세 가지를 준비했습니다: 사용자용 영어, 사용자용 한국어, 기여자용 내부 요약. 버전 번호는 확정 전이라 제목에 `vX.Y.Z` 자리표시자를 두었습니다. v0.5.0으로 확정되면 그대로 바꿔 넣으시면 됩니다.

---

## 1. 사용자용 (English)

**Agent Archive vX.Y.Z — 2026-09-29**

### Install kits you can fetch directly
Every agent's install kit files now live at stable URLs: `/kits/<slug>/<file>`. Each agent page shows a one-line `curl` command and per-file links, and the kit README lists the download URLs, so you can pull a kit into any project or link to it. The command also works on older curl versions (for example, Ubuntu 20.04 and Debian 10).

### More accurate verification labels
61 agents were labelled "tested" without the recorded sample runs our contribution guide requires for that level. We've changed them to "unverified". Their prompts and kits are unchanged; only the label now matches what has actually been tested. From now on, "tested" and "expert" require a recorded evaluation with at least two sample runs, and this is checked automatically on every change.

### More of the site in Korean
On /ko, agent detail pages, status and difficulty badges, agent and workflow cards, and the agent search panel are now in Korean. Role and category names are still in English; that is next.

### Easier to find
The site now publishes `sitemap.xml` and `robots.txt`, with English and Korean page alternates.

---

## 2. 사용자용 (한국어)

**Agent Archive vX.Y.Z — 2026-09-29**

### 설치 키트를 URL로 바로 받기
모든 에이전트의 설치 키트 파일을 고정 URL `/kits/<slug>/<file>`에서 받을 수 있습니다. 에이전트 페이지에 한 줄짜리 `curl` 명령과 파일별 링크가 표시되고, 키트 README에도 다운로드 URL이 들어 있어 다른 프로젝트에서 바로 가져오거나 링크할 수 있습니다. Ubuntu 20.04, Debian 10 같은 환경의 구버전 curl에서도 동작합니다.

### 검증 표시를 실제에 맞게 바로잡았습니다
에이전트 61개가 기여 가이드에서 요구하는 샘플 실행 기록 없이 "tested"로 표시되어 있었습니다. 이들을 "unverified"로 변경했습니다. 프롬프트와 키트 내용은 그대로이며, 표시만 실제로 검증된 수준에 맞춘 것입니다. 앞으로 "tested"와 "expert"는 샘플 실행 2회 이상이 포함된 평가 기록이 있어야 하며, 모든 변경에서 자동으로 확인됩니다.

### 한국어 화면 확대
/ko에서 에이전트 상세 페이지, 상태·난이도 배지, 에이전트·워크플로 카드, 에이전트 검색 패널이 한국어로 표시됩니다. 역할과 카테고리 이름은 아직 영어이며 다음 작업으로 진행합니다.

### 검색 노출 개선
`sitemap.xml`과 `robots.txt`를 제공하며, 영어·한국어 페이지를 서로 연결해 둡니다.

---

## 3. 기여자용 내부 요약

**2026-09-29 배포 (v0.4.0 이후, #12–#19)**

**꼭 알아야 할 변경**
- **`check:data` 규칙 강화 (#14):** `verifiedStatus`가 `tested` 또는 `expert`이면 샘플 실행 2회 이상이 포함된 evaluation 기록이 없을 경우 실패합니다. 근거 없이 상태를 올리는 PR은 이제 CI에서 막힙니다. CONTRIBUTING.md에 expert도 샘플 실행 기록이 필요하다고 명시했습니다.
- **상태를 바꾸면 `updatedAt`도 올리세요 (#18):** #14에서 내린 61개가 `updatedAt: 2026-07-01`로 남아 sitemap의 lastModified가 틀렸습니다. `updatedAt`이 이제 sitemap에 그대로 나가므로 메타데이터 변경 시 함께 갱신해야 합니다.
- **`npm test` 추가, CI에서 실행 (#17):** 설치 키트, 검색, 로케일 헬퍼 단위 테스트(node:test + tsx). 로컬에서도 PR 전에 돌려 주세요.
- **Node 20 / npm 버전 이슈 (#17):** 테스트 glob을 셸이 확장하도록 바꿔 Node 20에서도 `npm test`가 동작합니다. lockfile은 npm 10으로 재생성했습니다. 다른 npm 메이저로 lockfile을 다시 만들면 CI의 `npm ci`가 깨질 수 있으니 npm 10을 쓰세요.

**참고할 변경**
- **i18n (#15, #19):** 상세 페이지와 배지·카드·검색 패널 문자열을 en/ko 사전으로 옮겼고, `agentMeta`, `agentSearch` 그룹을 새로 만들었습니다. UI 문자열을 하드코딩하지 말고 두 언어에 모두 키를 추가하세요. 역할·카테고리 이름 번역은 별도로 추적 중입니다.
- **키트 고정 URL (#13):** `/kits/<slug>/<file>`로 프리렌더됩니다. 이 경로는 외부에서 링크되므로 이제 사실상 공개 계약입니다. 파일 이름이나 경로를 바꿀 때 주의하세요. 설치 명령은 `--output-dir`(curl 7.73+) 대신 디렉터리 생성 후 서브셸에서 curl을 실행합니다.
- **sitemap/robots (#16):** 모든 로컬라이즈 페이지를 hreflang 대체 링크와 함께 나열합니다. Bookmarks는 로컬 데이터 전용 페이지라 제외했습니다. 새 페이지 유형을 추가하면 sitemap 포함 여부를 확인하세요.
- **의존성 (#12):** react/react-dom 19.3.0, @types/node 22.20.4, autoprefixer 10.6.1 등 마이너·패치 업데이트.

**미정**
- 버전 번호(v0.5.0 예정). 확정되면 위 두 공지의 `vX.Y.Z`를 바꾸고 태그를 만들면 됩니다.

---

참고: 의존성 업데이트(#12)와 테스트 추가(#17)는 사용자에게 보이는 변화가 없어 사용자용에서는 뺐습니다. 단어 수는 영어 약 190단어, 한국어 약 150어절로 둘 다 200 이내입니다.
