2026-09-29 배포 릴리스 노트 초안입니다. 버전 번호는 확정 전이라 `vX.Y.Z`로 표시했습니다. v0.5.0으로 확정되면 그대로 바꾸시면 됩니다. 추가로 여쭤볼 필수 정보는 없어서 바로 작성했습니다.

---

## 1. 사용자용: English (GitHub Releases / 사이트 공지)

**Agent Archive vX.Y.Z (2026-09-29)**

### New
- **Install kits at stable URLs.** Every kit file is now served at `/kits/<slug>/<file>`, so you can fetch it with curl or link to it from your own project. Each agent page shows a one-line curl command and per-file links. The command also works on older curl (before 7.73), for example on Ubuntu 20.04 and Debian 10.
- **More of the site in Korean.** On `/ko`, agent detail pages, status and difficulty badges, agent and workflow cards, and the agent search panel are now translated. Role and category names are still in English. That is next.
- **sitemap.xml and robots.txt** with en/ko alternates, so pages are easier to find through search.

### Verification labels corrected
61 agents were labelled "tested" without the recorded sample runs our contribution guide requires for that label. They are now "unverified". Their prompts have not changed. Only the label has, so it matches what has actually been checked. From now on, "tested" and "expert" require a recorded evaluation with at least two sample runs, and this is checked automatically.

If you use one of these agents, review its output as you would for any unverified prompt. Evaluation contributions are welcome.

### Maintenance
Dependency updates (React 19.3.0) and new unit tests in CI.

*(약 185단어)*

---

## 1. 사용자용: 한국어 (GitHub Releases / 사이트 공지)

**Agent Archive vX.Y.Z (2026-09-29)**

### 새 기능
- **설치 키트를 고정 URL로 제공합니다.** 모든 키트 파일을 `/kits/<slug>/<file>` 주소에서 받을 수 있어 curl로 내려받거나 다른 프로젝트에서 바로 링크할 수 있습니다. 에이전트 페이지에서 한 줄짜리 curl 명령과 파일별 링크를 확인하세요. 이 명령은 curl 7.73 미만 버전(예: Ubuntu 20.04, Debian 10)에서도 동작합니다.
- **한국어 화면이 늘었습니다.** `/ko`에서 에이전트 상세 페이지, 상태·난이도 배지, 에이전트·워크플로 카드, 에이전트 검색 패널이 한국어로 표시됩니다. 역할·카테고리 이름은 아직 영어이며 다음 작업으로 진행합니다.
- **sitemap.xml과 robots.txt를 추가했습니다.** 영어/한국어 페이지가 서로 연결되어 검색으로 더 쉽게 찾을 수 있습니다.

### 검증 표시 정정
에이전트 61개가 기여 가이드에서 요구하는 샘플 실행 기록 없이 "tested"로 표시되어 있었습니다. 이 에이전트들을 "unverified"로 바로잡았습니다. 프롬프트는 바뀌지 않았고, 실제로 확인된 수준에 맞게 표시만 고쳤습니다. 앞으로 "tested"와 "expert"는 샘플 실행 2회 이상이 담긴 평가 기록이 있어야 하며, 자동으로 검사합니다.

해당 에이전트를 쓰고 계시다면 다른 미검증 프롬프트와 마찬가지로 결과를 검토한 뒤 사용해 주세요. 평가 기여도 환영합니다.

### 유지보수
의존성 업데이트(React 19.3.0), CI에 단위 테스트 추가.

*(한국어 기준 영문 200단어 분량 이내)*

---

## 2. 기여자용 내부 요약

**배포 2026-09-29 (vX.Y.Z, #12–#19)**

**꼭 알아야 할 변경**
- **`check:data` 규칙 강화 (#14):** `verifiedStatus`가 `tested` 또는 `expert`이면 샘플 실행 2회 이상이 기록된 evaluation이 없을 경우 실패합니다. `expert`도 동일하다고 CONTRIBUTING.md에 명시했습니다. 평가 없이 상태를 올리는 PR은 이제 CI에서 막힙니다.
- **`npm test` 추가, CI에서 실행 (#17):** install kit, 검색, 로케일 헬퍼 단위 테스트(node:test + tsx). PR 전에 로컬에서 `npm test`를 돌려 주세요.
- **Node / npm 버전 (#17):** 테스트 glob을 셸이 확장하도록 바꿔 Node 20에서도 `npm test`가 동작합니다. lockfile은 npm 10으로 재생성했습니다. npm 9 이하로 `npm install`하면 lockfile diff가 크게 생기거나 `npm ci`가 CI에서 실패할 수 있으니 npm 10 이상을 쓰세요.
- **`updatedAt` 관리 (#18):** 검증 상태를 바꾸면 `updatedAt`도 함께 올려 주세요. sitemap의 `lastModified`가 이 값을 씁니다.

**기타**
- 설치 키트가 `/kits/<slug>/<file>`로 prerender됩니다(#13). 키트 파일 구성이나 이름을 바꾸면 외부 링크가 깨질 수 있으니 공개 URL로 취급해 주세요.
- 새 UI 문자열은 `en`과 `ko` 사전 모두에 추가해야 합니다. 새 그룹 `agentMeta`, `agentSearch`가 생겼습니다(#15, #19).
- 남은 번역: 역할·카테고리 이름(별도 추적 중).
- 의존성: react 19.3.0, @types/node 22.20.4, autoprefixer 10.6.1 등(#12).

---

## 가정
- 61개 에이전트는 라벨만 바뀌었고 프롬프트 내용은 그대로라고 보았습니다(#14 설명 기준). 실제로 프롬프트도 수정했다면 공지 문구를 고쳐야 합니다.
- "자동으로 검사한다"는 표현은 `check:data`가 CI에서 돌아간다는 전제입니다.
- #12, #17, #18은 사용자 체감 변화가 작아 사용자용에서는 한 줄로 묶거나 뺐습니다.
- 사이트 공지는 GitHub Releases와 같은 본문을 쓴다고 가정했습니다.

## 권장 사항
- 검증 표시 정정 섹션에 영향받은 61개 에이전트 목록(또는 `unverified` 필터 링크)을 달아 두면 사용자가 자신이 쓰는 에이전트인지 바로 확인할 수 있습니다.
- CONTRIBUTING.md의 검증 레벨 설명으로 링크를 걸어 "tested"의 의미를 한 번에 볼 수 있게 하세요.
- 사용자용 curl 예시를 한 줄 넣고 싶다면 실제 에이전트 slug 하나로 예시를 만들어 주세요(예시 slug를 제가 지어내지 않았습니다).

## 리스크
- **신뢰:** "61개 하향"만 따로 인용되면 품질 문제로 오해될 수 있습니다. "프롬프트는 그대로, 표시만 정정"과 "앞으로 자동 검사"를 같은 문단에 두는 구성을 유지하세요.
- **고정 URL 약속:** `/kits/...`를 "stable"이라고 공지하면 이후 경로 변경이 breaking change가 됩니다. 경로 정책을 정해 두세요.
- **기여자 환경:** npm 10 미만 사용자는 lockfile 충돌을 겪을 수 있습니다. `package.json`에 `engines` 필드가 없다면 추가를 고려하세요.

## 다음 할 일
1. 버전 번호 확정 후 `vX.Y.Z` 치환, 태그 생성.
2. 61개 에이전트 목록 또는 필터 링크, CONTRIBUTING.md 링크 삽입.
3. GitHub Releases 게시 후 사이트 공지(영/한) 반영.
4. 기여자 요약을 Discussions나 기여자 채널에 공유.
5. 역할·카테고리 이름 번역 이슈를 다음 릴리스 범위로 연결.
