주신 PR 목록으로 두 버전을 모두 만들 수 있어서 추가로 여쭐 것은 없습니다. 버전 번호는 `vX.Y.Z`로 비워 두었고, 확정되면 바꿔 넣으시면 됩니다(아래 "다음 할 일" 참고).

---

## 1. 사용자용: English (약 190단어)

```markdown
# Agent Archive vX.Y.Z (2026-09-29)

## Download install kits directly
Every agent's install kit now has stable URLs at `https://yohan-work.github.io/agentive/kits/<slug>/<file>`. You can fetch a kit with curl or link to it from your own project. Each agent page shows a one-line curl command and per-file links, and the kit README lists the download URLs. The command also works with older curl versions, such as those on Ubuntu 20.04 and Debian 10.

## Corrected verification labels
We reviewed verification statuses and found that 61 agents were labelled "tested" without the recorded sample runs our guidelines require. They are now "unverified". Their prompts and kits have not changed. Only the label changed, so it now matches what was actually recorded. Going forward, an agent can only be labelled "tested" or "expert" if it records an evaluation with at least two sample runs. If you use one of these agents, contributing sample runs is the fastest way to restore its status.

## More of the site in Korean
On /ko, agent detail pages, status and difficulty badges, agent and workflow cards, and the agent search panel are now in Korean. Role and category names are still in English. That work is tracked separately.

## Sitemap
The site now publishes sitemap.xml and robots.txt, with English and Korean alternates for every page.
```

## 1. 사용자용: 한국어 (약 130어절)

```markdown
# Agent Archive vX.Y.Z (2026-09-29)

## 설치 키트 직접 다운로드
이제 모든 에이전트의 설치 키트를 고정 URL(`https://yohan-work.github.io/agentive/kits/<slug>/<file>`)에서 받을 수 있습니다. curl로 내려받거나 다른 프로젝트에서 바로 링크할 수 있습니다. 에이전트 페이지에는 한 줄 curl 명령과 파일별 링크가 표시되고, 키트 README에도 다운로드 URL이 들어 있습니다. Ubuntu 20.04, Debian 10처럼 curl 버전이 낮은 환경에서도 동작합니다.

## 검증 상태 정정
검증 상태를 점검한 결과, 61개 에이전트가 기여 가이드에서 요구하는 샘플 실행 기록 없이 "tested"로 표시되어 있었습니다. 이 에이전트들은 "unverified"로 바꿨습니다. 프롬프트와 키트 내용은 그대로이고, 실제 기록된 검증 수준에 맞게 표시만 고쳤습니다. 앞으로는 평가와 2회 이상의 샘플 실행 기록이 있어야 "tested"나 "expert"로 표시할 수 있습니다. 이 에이전트를 써 보셨다면 샘플 실행을 기여해 주세요. 상태를 되돌리는 가장 빠른 방법입니다.

## 한국어 화면 확대
/ko의 에이전트 상세 페이지, 상태·난이도 배지, 에이전트·워크플로 카드, 에이전트 검색 패널이 한국어로 표시됩니다. 역할과 카테고리 이름은 아직 영어이며, 별도로 작업하고 있습니다.

## 사이트맵
sitemap.xml과 robots.txt를 제공합니다. 모든 페이지에 영어/한국어 대체 링크가 포함됩니다.
```

---

## 2. 기여자용 내부 요약

**vX.Y.Z (2026-09-29) — 기여자가 알아야 할 변경**

- **check:data 검증 규칙 강화 (#14).** 이제 `verifiedStatus: tested` 또는 `expert`인 에이전트는 평가(evaluation)와 샘플 실행 2회 이상이 기록되어 있어야 합니다. 없으면 `npm run check:data`와 CI가 실패합니다. CONTRIBUTING.md에도 expert에 샘플 실행이 필요하다는 내용이 추가되었습니다.
- **상태를 바꾸면 `updatedAt`도 올려 주세요 (#16, #18).** sitemap의 `lastModified`가 `updatedAt`에서 나옵니다. 지금은 check:data가 이것을 강제하지 않으니 직접 챙겨야 합니다.
- **`npm test` 추가, CI에서도 실행 (#17).** tsx로 돌리는 node:test 스위트입니다(install kit, search, locale 헬퍼). PR을 올리기 전에 기존 check:data / lint / typecheck / build에 더해 `npm test`도 돌려 주세요.
- **Node 20과 npm 10 (#17).** 테스트 glob을 Node가 아니라 셸이 펼치도록 바꿔서 Node 20에서도 `npm test`가 동작합니다. lockfile은 npm 10으로 다시 생성했습니다. 다른 npm 메이저 버전으로 lockfile을 다시 만들면 CI의 `npm ci`가 깨질 수 있습니다.
- **키트 URL은 이제 공개 계약입니다 (#13).** `/kits/<slug>/<file>`로 외부에서 링크합니다. 에이전트 slug나 키트 파일 이름을 바꾸면 외부 링크가 깨집니다. 설치 명령은 curl 7.73 미만을 지원하려고 `--output-dir` 대신 디렉터리를 만든 뒤 subshell에서 curl을 실행합니다. 이 방식을 유지해 주세요.
- **i18n (#15, #19).** 새 dictionary 그룹 `agentMeta`, `agentSearch`가 생겼습니다. UI 문자열을 하드코딩하지 말고, 키는 en과 ko 양쪽에 모두 추가해 주세요. 역할/카테고리 이름 번역은 아직 남아 있습니다.
- **의존성 (#12).** react/react-dom 19.3.0, @types/node 22.20.4, autoprefixer 10.6.1로 올렸습니다(마이너/패치).

---

## 가정

- 키트 URL은 사이트 base path(`/agentive/`) 아래에서 제공된다고 보고 전체 URL로 적었습니다. 실제 경로가 다르면 고쳐 주세요.
- 61개 에이전트는 프롬프트/키트 내용이 바뀌지 않고 상태 라벨과 `updatedAt`만 바뀌었다고 봤습니다(#14, #18 설명 기준).
- /ko에서 상태 배지가 이제 한국어로 보이면, 한국어 노트의 "tested"/"unverified"를 화면에 실제로 보이는 문구로 바꾸거나 함께 적는 편이 좋습니다.
- 테스트, 의존성 업데이트, lockfile 변경은 사용자에게 보이는 변화가 아니어서 사용자용 노트에서는 뺐습니다.

## 권장 사항

- 검증 상태 정정 항목에서 61개 에이전트 목록(또는 `unverified` 필터 링크)을 연결하면 투명하게 보이고 문의도 줄어듭니다.
- 샘플 실행을 기여하는 방법(CONTRIBUTING.md 해당 절)을 링크해서 "상태를 되돌리는 법"을 실제로 할 수 있게 해 주세요.
- 키트 기능이 이번 릴리스의 대표 기능이니, GitHub Releases 첫머리에 curl 명령 예시 하나를 실제 slug로 넣는 것을 권합니다.

## 리스크

- **신뢰 인식:** "tested → unverified"를 품질이 떨어졌다는 뜻으로 읽는 사용자가 있을 수 있습니다. 노트에 "내용은 바뀌지 않았다"를 넣어 두었지만, 공지 채널에서 질문이 들어오면 같은 문장으로 답하도록 맞춰 두세요.
- **외부 링크 의존:** 키트 URL이 공개되었으므로 앞으로 slug 이름 변경이 breaking change가 됩니다. 리다이렉트 정책이 없다면 정해 둘 필요가 있습니다.
- **기여자 PR 실패:** 새 check:data 규칙과 `npm test` 때문에 진행 중인 기여 PR이 CI에서 갑자기 실패할 수 있습니다. 열려 있는 PR 작성자에게 알려 주세요.
- **React 19.3 마이너 업데이트:** 위험은 낮지만 정적 export 결과를 배포 전에 한 번 눈으로 확인하는 것이 좋습니다.

## 다음 할 일

1. 버전 번호 확정(변경 범위상 새 기능 + 비호환 변경 없음이라 v0.5.0이 적절해 보입니다) 후 `vX.Y.Z` 교체.
2. 키트 URL 예시와 base path 실제 값 확인.
3. /ko 배지 문구 확인 후 한국어 노트의 상태 이름 맞추기.
4. 61개 에이전트 목록 링크와 CONTRIBUTING 링크 추가.
5. GitHub Releases와 사이트 공지 게시 후 내부 요약을 기여자 채널에 공유하고, 열려 있는 PR에 새 CI 요구 사항을 알리기.
