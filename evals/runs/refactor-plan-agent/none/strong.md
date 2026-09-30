# `agent-install-kit.ts` 분리 리팩터링 계획

## 핵심 전략 요약

1. **먼저 안전망부터 깝니다.** 바이트 동일성을 기계적으로 검증하는 골든(characterization) 테스트를 코드 변경 없이 먼저 머지합니다.
2. **"이동"과 "정리"를 절대 한 PR에 섞지 않습니다.** 파일을 옮기는 PR은 순수 cut/paste라서 `git diff --color-moved`로 몇 분 만에 리뷰할 수 있습니다. 공통 헤더/푸터 중복 제거처럼 실제로 코드 모양이 바뀌는 작업은 마지막에 따로 합니다.
3. **`src/lib/agent-install-kit.ts`는 끝까지 facade(재export)로 남깁니다.** 그래서 `route.ts`, `agent-export-panel.tsx`, 기존 테스트의 import 경로는 한 번도 바뀌지 않고, 공개 API도 그대로 유지됩니다.
4. **두 가지 방법으로 검증합니다.**
   - (a) 저장소에 커밋된 고정 픽스처 기반 골든 테스트: CI에서 자동으로 돌고, YAML이 추가돼도 흔들리지 않습니다.
   - (b) 실제 전체 코퍼스 기준 `out/kits` 디렉터리 diff: 각 PR마다 로컬에서 돌립니다.

---

## PR 순서

| # | 제목 | 내용 | 예상 diff 크기 |
|---|---|---|---|
| 1 | `test: add byte-exact golden tests for install kit` | 픽스처 에이전트와 골든 파일, 골든 비교 테스트, 골든 생성 스크립트. 프로덕션 코드 변경 0줄 | 코드 약 120줄 + 골든 파일(읽을 필요 없음) |
| 2 | `refactor: extract install-kit shared helpers` | `src/lib/install-kit/shared.ts`로 `agentInstructions`, `list`, `getAgentPageUrl` 이동. 기존 파일은 import만 하도록 변경 | 약 80줄 이동 |
| 3 | `refactor: move install-kit URL/path/command helpers` | `install-kit/paths.ts`로 `isInstallable`, `getInstallKitPath`, `getInstallKitUrl`, `getInstallKitCommand` 이동. facade에서 재export | 약 60줄 이동 |
| 4 | `refactor: split agent instruction file generators` | `install-kit/files/codex.ts`, `claude.ts`, `cursor.ts`로 `toCodexAgentFile`, `toClaudeProjectFile`, `toCursorRuleFile` 이동 | 약 70줄 이동 |
| 5 | `refactor: split manifest and readme generators` | `files/manifest.ts`, `files/readme.ts` | 약 60줄 이동 |
| 6 | `refactor: split runbook and evaluation generators` | `files/runbook.ts`, `files/evaluation.ts` (각 약 60줄) | 약 120줄 이동 |
| 7 | `refactor: assemble install kit in install-kit/index.ts` | `getInstallKitFiles`를 `install-kit/index.ts`로 옮기고, `agent-install-kit.ts`는 `export * from "./install-kit"` 한 줄짜리 facade로 축소 | 약 40줄 |
| 8 | `refactor: share install-kit header and attribution text` | 복붙된 공통 헤더/출처 문구를 `shared.ts`의 함수/상수 하나로 통합. **이 PR에서만 실제 텍스트 조립 방식이 바뀝니다** | 약 100줄 |
| 9 (선택) | `docs: point AGENTS.md at src/lib/install-kit/` | 문서의 경로 언급 갱신 | 몇 줄 |

순서를 이렇게 잡은 이유는 다음과 같습니다.

- **2 → 3**: 헬퍼가 먼저 빠져 있어야 이후 파일별 모듈이 원래 파일을 import하지 않습니다. 이렇게 해야 순환 import가 생기지 않습니다.
- **4~6**: 크기가 작고 단순한 것부터 옮겨서 리뷰어가 패턴에 익숙해지게 합니다.
- **8을 마지막에**: 헤더 통합은 공백·개행 하나로도 바이트가 달라지는 가장 위험한 단계입니다. 모든 생성기가 각자 파일에 분리된 뒤에 하면, 파일 종류별로 커밋을 나눠 문제를 좁힐 수 있습니다. 필요하면 8을 8a(codex/claude/cursor)와 8b(readme/runbook/evaluation)로 쪼갭니다.

### 목표 구조

```
src/lib/
  agent-install-kit.ts          # facade: export * from "./install-kit"
  install-kit/
    index.ts                    # getInstallKitFiles + 공개 API 재export
    paths.ts                    # isInstallable, getInstallKitPath/Url/Command
    shared.ts                   # agentInstructions, list, getAgentPageUrl, 공통 헤더/출처
    files/
      codex.ts  claude.ts  cursor.ts  manifest.ts  readme.ts  runbook.ts  evaluation.ts
```

---

## PR 1 상세: 골든 테스트 (가장 중요)

**왜 실제 `content/agents/*.yaml`이 아니라 픽스처를 쓰는가**
작업 중에도 다른 사람이 YAML을 계속 추가합니다. 실제 코퍼스를 스냅샷으로 떠 두면 에이전트가 추가될 때마다 테스트가 깨지고, 그때마다 골든을 재생성하게 됩니다. 그러면 안전망의 의미가 사라집니다. 그래서 `tests/fixtures/install-kit/` 아래에 고정된 에이전트 객체를 두고, 다음 경우를 커버합니다.

- `full`: 모든 선택 필드가 채워진 에이전트 (runbook/evaluation 섹션이 전부 렌더링되는 경우)
- `minimal`: 필수 필드만 있는 에이전트 (빈 배열/undefined 분기)
- `tricky`: 백틱, 따옴표, `$`, `${}`, 한국어, 이모지, 줄 끝 공백, 여러 줄 문자열, 마크다운 특수문자가 들어간 에이전트
- `not-installable`: `isInstallable`이 false인 경우

**구성**

- `tests/fixtures/install-kit/agents.ts`: 픽스처 에이전트 정의
- `tests/fixtures/install-kit/golden/<fixture>/<file>`: 현재 코드로 생성한 7개 파일 원본
- `tests/fixtures/install-kit/golden/<fixture>/meta.json`: `getInstallKitPath/Url/Command` 결과, 파일 순서, `mimeType`
- `tests/install-kit-golden.test.ts`: `Buffer.compare`로 바이트 비교. 실패 시 첫 번째로 다른 위치(줄/열)와 앞뒤 문맥을 출력해서, 공백 차이도 바로 보이게 합니다.
- `scripts/update-install-kit-goldens.ts`: `npx tsx scripts/update-install-kit-goldens.ts`로 골든 재생성 (`tsx`는 이미 devDependency라 새 의존성 없음)

**규칙**: 골든 파일은 PR 1에서만 생성합니다. PR 2~8에서 `tests/fixtures/install-kit/golden/`에 diff가 있으면 리뷰에서 즉시 거절합니다. PR 템플릿이나 리뷰 체크리스트에 한 줄로 넣어 두세요.

**PR 1 머지 전 자체 검증**: 골든 테스트가 실제로 변화를 잡아내는지 확인합니다.

```bash
# 일부러 한 글자를 바꿔서 테스트가 실패하는지 확인 (확인 후 되돌림)
sed -i '' 's/## /##  /' src/lib/agent-install-kit.ts && npm test; git checkout src/lib/agent-install-kit.ts
# 끝 개행을 바꿔도 실패하는지 확인
```

---

## 각 PR에서 동작 보존을 확인하는 방법

### 1) CI와 같은 기본 검증 (매 PR)

```bash
npm run check:data && npm run lint && npm run typecheck && npm test && npm run build
```

기존 20개 테스트에 골든 테스트가 더해져 통과해야 합니다. 테스트 개수가 줄었다면 import 경로가 깨져 테스트 파일이 로드되지 않았다는 신호입니다.

### 2) 전체 코퍼스 `out/kits` 바이트 diff (매 PR, 로컬)

같은 콘텐츠 기준으로 비교해야 하므로, **먼저 브랜치를 최신 main에 rebase**한 뒤 main 빌드와 브랜치 빌드를 비교합니다. 이렇게 하면 동시에 추가된 YAML 때문에 생기는 차이가 없어집니다.

```bash
git fetch origin
git rebase origin/main

# 베이스라인: 같은 main 커밋을 별도 worktree에서 빌드
git worktree add ../agentive-base origin/main
(cd ../agentive-base && npm ci && npm run build)

# 브랜치 빌드
npm run build

# 파일 목록과 내용이 모두 같은지 확인
diff -r ../agentive-base/out/kits out/kits && echo "KITS IDENTICAL"

# 요약용 해시 (PR 설명에 붙여 두면 좋음)
(cd out/kits && find . -type f -print0 | sort -z | xargs -0 shasum -a 256 | shasum -a 256)
(cd ../agentive-base/out/kits && find . -type f -print0 | sort -z | xargs -0 shasum -a 256 | shasum -a 256)

git worktree remove ../agentive-base
```

두 해시가 같으면 PR 설명에 "out/kits sha256: `<hash>` (main과 동일)"이라고 적습니다.

### 3) UI에 노출되는 curl 명령과 링크 확인

`agent-export-panel.tsx`가 렌더링하는 curl 명령과 파일 링크도 외부 사용자가 복사해 가는 값입니다. 정적 HTML에서 뽑아 비교합니다.

```bash
grep -rhoE 'curl -fsSL[^<]*' ../agentive-base/out/en/agents | sort > /tmp/base-curl.txt
grep -rhoE 'curl -fsSL[^<]*' out/en/agents | sort > /tmp/head-curl.txt
diff /tmp/base-curl.txt /tmp/head-curl.txt && echo "CURL IDENTICAL"
```

(HTML 이스케이프 때문에 패턴은 실제 마크업에 맞게 조정해야 할 수 있습니다. `/ko/`도 같은 방식으로 확인합니다.)

### 4) 이동 PR 리뷰 요령 (PR 2~7)

```bash
git diff origin/main --color-moved=dimmed-zebra --color-moved-ws=no
```

옮겨진 블록은 흐리게, 실제로 바뀐 줄만 강조됩니다. 리뷰어는 강조된 줄(import/export 선언)만 보면 됩니다. `--color-moved-ws=no`를 써야 들여쓰기 변화도 "변경"으로 표시되고, 템플릿 리터럴 안의 공백 변화를 놓치지 않습니다.

### 5) 클라이언트 번들 확인 (PR 3, 7)

`agent-export-panel.tsx`가 클라이언트 컴포넌트라면, 새 모듈 구조 때문에 서버 전용 코드(파일 시스템을 읽는 agent 로더 등)가 클라이언트 번들로 끌려 들어가면 안 됩니다. `npm run build`가 통과하는지와 함께, 빌드 출력의 First Load JS 크기가 main과 비슷한지 확인합니다.

---

## 롤백 방법

- **머지 전**: PR을 닫고 브랜치를 버리면 끝입니다.
- **머지 후 문제 발견 시**: 해당 PR의 머지 커밋을 revert합니다.
  ```bash
  git revert <squash-commit-sha>          # squash merge인 경우
  git revert -m 1 <merge-commit-sha>      # merge commit인 경우
  ```
  main에 push되면 GitHub Pages가 재배포되고, `out/kits`는 이전 바이트로 돌아갑니다.
- **여러 PR을 되돌릴 때**는 역순(최신 → 과거)으로 revert합니다. 뒤 PR이 앞 PR이 만든 모듈에 의존하기 때문입니다.
- **PR 1(골든 테스트)은 되돌리지 않습니다.** 프로덕션 코드를 건드리지 않으므로 다른 PR을 모두 되돌려도 계속 통과하고, 되돌린 뒤 상태도 검증해 줍니다.
- 각 PR이 바이트 동일성을 보장하므로, 어느 지점에서 작업을 멈춰도 사용자에게 보이는 결과는 main과 같습니다. 중간 상태로 오래 머물러도 괜찮습니다.

---

## 가정

1. 생성 함수들은 순수 함수입니다. `Date.now()`, 랜덤 값, 빌드 시각 같은 비결정적 요소가 없다고 가정합니다. 만약 있다면 PR 1에서 주입 가능하게 만드는 것이 먼저이고, 그 자체가 별도 PR입니다.
2. 사이트 URL과 basePath(`/agentive`)는 빌드 환경에 따라 정해집니다. 베이스라인과 브랜치 빌드를 **같은 환경 변수**로 돌린다고 가정합니다. 로컬 값과 CI 값이 다르면 두 빌드 모두 CI 값을 쓰도록 맞춥니다.
3. `getInstallKitFiles`가 반환하는 배열의 **순서**도 공개 계약의 일부로 봅니다. `generateStaticParams`와 UI 파일 링크 순서가 여기에 의존합니다.
4. `agent.json`은 `JSON.stringify`로 만들어지고, 객체 리터럴의 키 순서가 출력 순서를 결정합니다. 이동할 때 키 순서를 바꾸지 않습니다.
5. 외부에서 이 모듈을 import하는 곳은 명시한 세 곳뿐입니다. (`grep -rn "agent-install-kit" src tests scripts`로 PR 1에서 확인)
6. 에디터나 포매터가 템플릿 리터럴 안의 공백이나 줄 끝 개행을 건드리지 않습니다.

## 리스크와 대응

| 리스크 | 가능성 | 영향 | 대응 |
|---|---|---|---|
| 템플릿 리터럴을 옮길 때 들여쓰기·줄 끝 공백·마지막 개행이 바뀜 | 중 | 높음 (외부 AGENTS.md diff) | 골든 테스트 + `out/kits` diff + `--color-moved-ws=no` 리뷰 |
| PR 8의 헤더 통합에서 함수마다 미묘하게 달랐던 문구(공백 1칸, 문장부호)가 하나로 합쳐짐 | **높음** | 높음 | 통합 전에 각 함수의 헤더를 문자열 그대로 비교합니다. 실제로 다르다면 억지로 합치지 말고 파라미터로 차이를 표현합니다. 골든 테스트가 최종 판정 |
| 순환 import (파일별 모듈 ↔ facade) | 중 | 중 (런타임 undefined) | 하위 모듈은 절대 `agent-install-kit.ts`나 `install-kit/index.ts`를 import하지 않고 `shared.ts`/`paths.ts`만 import |
| 클라이언트 번들에 서버 전용 코드 유입 | 낮음~중 | 중 (빌드 실패 또는 번들 증가) | `paths.ts`는 순수 문자열 로직만 두고, 빌드 결과 번들 크기 비교 |
| 동시에 추가되는 YAML과 충돌 | 낮음 | 낮음 | 이 작업은 `content/`를 건드리지 않습니다. 골든은 픽스처 기반이라 YAML 추가와 무관. 코퍼스 diff는 rebase 후 수행 |
| 다른 사람이 작업 도중 `agent-install-kit.ts`를 수정 | 중 | 중 (rebase 충돌, 골든 불일치) | 작업 기간 동안 해당 파일 변경을 멈춰 달라고 팀에 공지. 불가피하면 그 변경을 먼저 머지하고 골든을 재생성하는 별도 PR로 처리 |
| 새 에이전트 YAML이 픽스처가 커버하지 않는 분기를 탐 | 낮음 | 중 | 매 PR의 전체 코퍼스 `out/kits` diff가 실제 데이터 전체를 커버 |
| PR 1이 커서 리뷰가 20분을 넘음 | 중 | 낮음 | 골든 파일은 "현재 출력 그대로"라 내용 검토가 필요 없다고 PR 설명에 명시. 리뷰어는 테스트 코드와 픽스처 정의만 봄 |

---

## 다음 액션

1. `grep -rn "agent-install-kit\|install-kit" src tests scripts`로 import 지점이 정말 세 곳뿐인지 확인합니다.
2. `agent-install-kit.ts`에서 `Date`, `Math.random`, `process.env` 사용 여부를 확인합니다. 가정 1, 2 검증용입니다.
3. 여러 함수에 복붙된 공통 헤더/출처 문구를 나란히 놓고 글자 단위로 같은지 확인합니다. PR 8의 난이도가 여기서 결정됩니다.
4. 팀에 "리팩터링 기간 동안 `src/lib/agent-install-kit.ts` 변경 보류"를 공지합니다. YAML 추가는 계속해도 된다고 함께 알립니다.
5. PR 1(골든 테스트)을 작성하고, 일부러 한 글자를 바꿔 테스트가 실패하는지 확인한 뒤 머지합니다.
6. 이후 PR 2부터 하나씩 진행합니다. 각 PR 설명에는 다음 세 가지를 붙입니다.
   - 위 검증 명령의 결과
   - `out/kits` 해시가 main과 같다는 확인
   - 골든 디렉터리 diff가 없다는 확인
