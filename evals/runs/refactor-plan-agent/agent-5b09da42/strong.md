# `agent-install-kit.ts` 리팩터링 계획

## 1. 요약

핵심 원칙은 **"먼저 출력을 고정하고, 그다음에 옮긴다"**입니다.

- 첫 PR은 코드를 건드리지 않습니다. 현재 출력을 바이트 단위로 고정하는 골든(characterization) 테스트만 추가합니다.
- 이후 PR은 **순수 이동**과 **중복 제거**를 절대 섞지 않습니다. 바이트가 바뀔 위험은 거의 전부 "공통 헤더/푸터 통합" 단계에 몰려 있으므로, 그 단계는 파일 종류별로 쪼갭니다.
- 모든 PR은 같은 두 가지 게이트를 통과해야 합니다. (1) 골든 테스트 통과, (2) `origin/main` 빌드와 브랜치 빌드의 `out/kits/` 비교 결과 차이 없음.

## 2. 가정

아래 중 틀린 것이 있으면 알려 주세요. 계획의 해당 부분만 조정하면 됩니다.

1. **출력이 결정적(deterministic)입니다.** 생성 파일에 빌드 시각, `Date.now()`, 랜덤 값, 환경별로 달라지는 값이 없습니다. `updatedAt` 같은 값은 YAML에서만 옵니다. 이 가정이 틀리면 비교 전에 해당 줄을 정규화해야 합니다.
2. **사이트 URL은 환경 변수나 상수 하나로 정해지고**, 비교용 두 빌드에 같은 값을 넣을 수 있습니다.
3. **`src/lib/agent-install-kit.ts` 경로 자체도 공개 API로 취급합니다.** 이 파일은 끝까지 re-export 배럴로 남기고, 내부 import만 새 경로로 바꿉니다.
4. `mimeType`, 파일 순서(7개 배열 순서), `generateStaticParams`가 만드는 경로 목록도 "출력"에 포함되며 바뀌면 안 됩니다.
5. Node 버전은 `node:test`와 `tsx`가 이미 도는 버전 그대로이고, 스냅샷 기능은 Node 내장 API 대신 파일 비교로 직접 구현합니다(새 의존성 금지).

## 3. PR 순서

| PR | 내용 | 예상 diff | 바이트 변경 위험 |
|---|---|---|---|
| 0 | 골든 테스트 + 비교 스크립트 | +150줄 안팎(픽스처 제외) | 없음(코드 무변경) |
| 1 | `install-kit/` 디렉터리로 통째 이동, 기존 파일은 배럴 | 이동 위주 | 매우 낮음 |
| 2 | URL/경로/curl 헬퍼와 내부 헬퍼 분리 | ~100줄 이동 | 낮음 |
| 3 | 파일 생성기 분리 (작은 5개) | ~120줄 이동 | 낮음 |
| 4 | 파일 생성기 분리 (`RUNBOOK`, `EVALUATION`) | ~120줄 이동 | 낮음 |
| 5a–5c | 공통 헤더/푸터 통합, 파일 종류별로 쪼개서 | 각 수십 줄 | **높음** |
| 6 | 소비처 import 경로 정리, 배럴에 주석 | 소규모 | 없음 |

### PR 0: 동작 고정 (`test: add golden snapshots for install kit output`)

**추가할 것**

- `tests/fixtures/install-kit/agents/*.ts`: 실제 `content/agents`와 독립된 **고정 픽스처 에이전트** 4–6개. 경계 케이스를 포함합니다.
  - 모든 선택 필드가 채워진 에이전트
  - 선택 필드가 비어 있거나 없는 에이전트(`list()`의 빈 배열 처리 확인)
  - 한글, 백틱, `$`, `{}`, 따옴표, 마크다운 특수문자가 들어간 에이전트
  - `isInstallable`이 `false`인 에이전트
- `tests/fixtures/install-kit/golden/<slug>/<파일명>`: 현재 코드로 생성한 7개 파일 원본과 `manifest.json`(파일 이름, `mimeType`, 순서).
- `tests/install-kit-golden.test.ts`: 픽스처마다 `getInstallKitFiles()`를 호출하고 `assert.strictEqual(content, readFileSync(golden, "utf8"))`로 비교합니다. 추가로 `getInstallKitPath/Url/Command`와 `isInstallable` 결과도 골든 JSON과 비교합니다.
- `UPDATE_GOLDEN=1 npm test`로만 골든을 재생성하게 하고, 재생성 스크립트는 **PR 0에서만** 씁니다.
- `.gitattributes`에 `tests/fixtures/install-kit/golden/** -text`를 넣어 줄바꿈 변환을 막습니다.
- `scripts/compare-kits.sh`: 실제 전체 에이전트 출력을 비교하는 스크립트입니다(아래 4장).

**왜 픽스처를 따로 두나:** 작업 중에도 다른 사람이 YAML을 추가하므로 실제 콘텐츠로 골든을 만들면 매번 깨집니다. 픽스처 골든은 "코드가 같은 입력에 같은 출력을 내는가"만 검증하고, 실제 콘텐츠 전체는 빌드 비교(4장)로 검증합니다.

**리뷰 포인트:** 골든 파일이 현재 main 출력과 같은지 확인합니다. 리뷰어가 로컬에서 `UPDATE_GOLDEN=1 npm test && git status`를 돌려 변경이 없으면 됩니다.

### PR 1: 디렉터리 이동 (`refactor: move install kit into src/lib/install-kit`)

- `src/lib/agent-install-kit.ts`의 내용을 **한 글자도 바꾸지 않고** `src/lib/install-kit/index.ts`로 옮깁니다(`git mv` 후 새 파일 생성).
- `src/lib/agent-install-kit.ts`는 `export * from "./install-kit";`만 남깁니다.
- 소비처(route, 패널, 테스트)는 아직 건드리지 않습니다.
- 리뷰는 `git diff -M --stat`로 rename 인식 여부만 보면 됩니다.

### PR 2: 헬퍼 분리 (`refactor: split install kit url and shared helpers`)

- `install-kit/urls.ts`: `isInstallable`, `getInstallKitPath`, `getInstallKitUrl`, `getInstallKitCommand`
- `install-kit/shared.ts`: `agentInstructions`, `list`, `getAgentPageUrl` (export는 하되 `index.ts`에서 re-export하지 않아 공개 API가 늘지 않게 합니다)
- `index.ts`는 re-export와 아직 남은 생성기만 갖습니다.
- 순환 import 금지: `shared.ts` → `urls.ts` 방향만 허용합니다.

### PR 3: 작은 생성기 분리 (`refactor: split small install kit file generators`)

- `install-kit/files/codex.ts` (`toCodexAgentFile`), `claude.ts`, `cursor.ts`, `manifest.ts` (`toInstallManifest`), `readme.ts`
- **템플릿 리터럴은 복사-붙여넣기만 합니다.** 들여쓰기가 다른 위치로 옮기더라도 여러 줄 템플릿 안의 공백은 그대로 둡니다. 에디터의 자동 들여쓰기, 포매터, trailing whitespace 제거를 이 PR에서는 끄고 작업합니다.

### PR 4: 큰 생성기 분리 (`refactor: split runbook and evaluation generators`)

- `files/runbook.ts`, `files/evaluation.ts`. 각 60줄이라 PR 3과 합치면 20분을 넘기기 쉬워서 따로 뺐습니다.
- `getInstallKitFiles`는 `install-kit/index.ts`에서 7개 생성기를 **기존과 같은 순서로** 조립합니다.

### PR 5a–5c: 공통 헤더/푸터 통합 (`refactor: share install kit header and footer`)

바이트가 바뀔 수 있는 유일한 단계입니다. 한 PR에 한 묶음씩만 바꿉니다.

- 5a: `install-kit/sections.ts`에 공통 헤더/출처 문구 함수를 만들고, **Markdown 3종**(`AGENTS.md`, `CLAUDE.md`, `README.md`)에만 적용
- 5b: `RUNBOOK.md`, `EVALUATION.md`에 적용
- 5c: `cursor-rule.mdc`(frontmatter가 있어 헤더 위치가 다를 수 있음)에 적용
- `agent.json`은 통합 대상에서 제외합니다. 문구 공유 이득은 작고, 키 순서가 바뀌면 바이트가 바뀝니다.

**규칙:**
- 복붙된 문구들이 사실은 미세하게 다를 수 있습니다(끝 공백, 마침표, 빈 줄 개수). 통합 전에 각 복사본을 `diff`로 비교하고, **다른 부분은 파라미터로 남깁니다.** 억지로 하나로 합치지 않습니다.
- 헬퍼는 "줄 배열 → `join("\n")`" 방식보다 기존 템플릿 조각을 그대로 반환하는 방식을 우선합니다. 끝 개행 처리가 가장 흔한 사고 지점이기 때문입니다.

### PR 6: import 정리 (`refactor: import install kit from new path`)

- `route.ts`, `agent-export-panel.tsx`, 기존 테스트의 import를 `@/lib/install-kit`로 바꿉니다.
- `src/lib/agent-install-kit.ts` 배럴은 유지하고, 새 경로를 쓰라는 주석만 답니다(가정 3). 삭제는 이 계획 범위 밖입니다.

## 4. 단계마다 동작 보존 확인하기

### 4.1 모든 PR 공통 (CI와 동일)

```bash
npm run check:data && npm run lint && npm run typecheck && npm test && npm run build
```

골든 테스트가 `npm test`에 들어 있으므로 CI가 자동으로 막아 줍니다. 기존 20개 테스트 수와 새 골든 테스트 수가 줄지 않았는지도 확인합니다.

### 4.2 실제 전체 콘텐츠 빌드 비교 (`scripts/compare-kits.sh`)

YAML이 계속 추가되므로 **main 최신에 rebase한 뒤** 비교합니다. 그러면 두 빌드의 콘텐츠가 같고 코드만 다릅니다.

```bash
git fetch origin && git rebase origin/main

# 기준 빌드 (origin/main)
rm -rf /tmp/kit-base && git worktree add /tmp/kit-base origin/main
(cd /tmp/kit-base && npm ci && npm run build)

# 브랜치 빌드 (사이트 URL 등 환경 변수는 두 빌드에 동일하게)
npm run build

# 1) 파일 목록이 같은지 (generateStaticParams 결과 포함)
diff <(cd /tmp/kit-base/out/kits && find . -type f | sort) \
     <(cd out/kits && find . -type f | sort)

# 2) 내용이 바이트 단위로 같은지
diff -r /tmp/kit-base/out/kits out/kits && echo "KITS IDENTICAL"

# 3) 해시 요약 (PR 본문에 붙이기용)
(cd out/kits && find . -type f -print0 | sort -z | xargs -0 shasum -a 256) | shasum -a 256

git worktree remove /tmp/kit-base
```

`diff -r`는 끝 개행, CRLF, 공백 차이도 잡아냅니다. PR 본문에 "`KITS IDENTICAL`, 파일 N개, 해시 xxx"를 적는 것을 머지 조건으로 합니다.

### 4.3 UI 쪽 확인 (PR 2, 6)

`agent-export-panel.tsx`는 curl 명령과 링크를 화면에 보여 주므로 빌드된 HTML에서도 확인합니다.

```bash
diff <(grep -rho 'curl -fsSL[^<]*' /tmp/kit-base/out | sort -u) \
     <(grep -rho 'curl -fsSL[^<]*' out | sort -u)
```

## 5. 롤백

- **PR 단위로 되돌릴 수 있습니다.** 모든 PR은 동작을 보존하므로 `git revert <merge-commit>`(merge commit이면 `-m 1`)로 되돌리고 main에 푸시하면 GitHub Pages가 이전 출력으로 다시 배포됩니다.
- 이후 PR이 이전 PR의 구조에 의존하므로 **역순으로만** 되돌립니다(예: PR 4를 되돌리려면 5a–5c를 먼저 되돌림).
- 배포 후 출력 차이가 발견되면(외부 사용자 신고 등) 원인 분석보다 **먼저 revert**합니다. 원인은 revert된 main에서 4.2 스크립트로 재현합니다.
- 골든 픽스처는 모든 단계에서 유지하므로 revert 뒤에도 테스트가 그대로 통과해야 합니다. 통과하지 않으면 revert가 불완전하다는 신호입니다.
- PR 5 이전 단계까지만 머지하고 멈춰도 코드베이스는 일관된 상태입니다. 중간에 중단해도 됩니다.

## 6. 리스크와 대응

| 리스크 | 가능성 | 대응 |
|---|---|---|
| 템플릿 리터럴을 옮기면서 들여쓰기나 공백이 바뀜 | 높음 | 순수 이동 PR에서는 포매터 끄기, 골든 + `diff -r` |
| 에디터가 trailing whitespace를 제거함(Markdown 두 칸 줄바꿈 등) | 중간 | `.editorconfig`/에디터 설정 확인, 골든 파일은 `-text` |
| 복붙된 헤더가 미세하게 달라서 통합하면 바이트가 바뀜 | 높음 | 5단계 전에 복사본끼리 `diff`, 다른 부분은 파라미터로 |
| `agent.json` 키 순서가 바뀜 | 중간 | 통합 대상에서 제외, 객체 리터럴 순서 유지 |
| 콘텐츠가 계속 추가돼 비교 기준이 흔들림 | 높음 | 코드 검증은 고정 픽스처로, 전체 비교는 rebase 후 같은 콘텐츠로 |
| 다른 사람의 YAML에 픽스처가 다루지 않는 필드 조합이 있음 | 중간 | 4.2 전체 빌드 비교가 보완. 새 경계 케이스가 보이면 PR 0 픽스처에 추가 |
| 순환 import나 번들 경계 문제로 클라이언트 번들이 커짐(패널이 클라이언트 컴포넌트라면) | 낮음 | `shared.ts`/`urls.ts`에 Node 전용 import 금지, 빌드 로그의 번들 크기 비교 |
| 머지 대기 중인 다른 PR이 `agent-install-kit.ts`를 수정 | 낮음–중간 | 작업 시작 전 공지, 배럴 유지로 import 충돌 최소화 |
| 환경 변수(사이트 URL) 차이로 비교가 거짓 양성 | 중간 | 두 빌드에 같은 env 명시, 스크립트에 고정값 박기 |

## 7. 권장 사항

- PR 0은 반드시 먼저, 단독으로 머지합니다. 이게 없으면 나머지 PR의 "바이트 동일" 주장을 검증할 수 없습니다.
- PR 템플릿에 체크박스를 추가합니다: `[ ] npm test 통과`, `[ ] compare-kits: KITS IDENTICAL`, `[ ] 이 PR은 이동만 / 통합만 포함`.
- 기능 추가 금지 원칙대로, 리팩터링 중 발견한 오타나 문구 개선은 **고치지 말고** 이슈로만 남깁니다. 고치면 외부 사용자 쪽에 diff가 생깁니다.
- (선택) 4.2 비교를 CI job으로 만들면 PR 5 이후에도 회귀를 막을 수 있습니다. 다만 CI 시간이 두 배가 되므로 이번 범위에서는 로컬 스크립트와 PR 본문 증빙으로 충분합니다.

## 8. 다음 액션

1. 가정 1–3을 확인해 주세요. 특히 생성 파일에 날짜나 환경 의존 값이 있는지, `agent-install-kit.ts` 경로를 외부에서도 import하는지 확인이 필요합니다.
2. 현재 `agent-install-kit.ts`에서 복붙된 헤더/출처 문구 블록을 모두 찾아 서로 `diff`해 두세요(PR 5 범위 결정용).
3. PR 0 작성: 픽스처 4–6개 선정, 골든 생성, `scripts/compare-kits.sh` 추가.
4. 팀에 "이 파일은 N주간 리팩터링 중, 기능 변경은 보류" 공지.
5. PR 0 머지 후 PR 1–4를 순서대로 진행하고, 매 PR 본문에 4.2 결과를 첨부합니다.
