# `agent-install-kit.ts` 리팩터링 계획

## 요약

핵심은 **"먼저 출력을 고정하고, 그다음 옮기고, 마지막에 합친다"**입니다.

1. **PR 0**: 현재 출력을 바이트 단위 골든 파일로 고정합니다. 코드 변경은 없습니다.
2. **PR 1~5**: 순수 이동만 합니다. 로직은 바꾸지 않고 파일 위치만 바꾸며, 기존 경로는 재export 파사드로 유지합니다.
3. **PR 6~7**: 공통 헤더/푸터를 한 곳으로 합칩니다. 출력이 바뀔 수 있는 유일한 단계라서 따로 뺐습니다.
4. **PR 8**: 정리(파사드 확정, 문서화)

모든 PR에서 같은 검증을 합니다. 5개 CI 명령, 골든 테스트, 그리고 `out/kits` 전체를 main 빌드와 `diff -r`로 비교하는 것입니다. 골든 파일이 한 줄이라도 바뀌면 그 PR은 리팩터링이 아니라는 뜻입니다.

---

## 가정

질문으로 막지 않고, 아래를 가정하고 진행합니다. 틀린 가정이 있으면 해당 PR만 조정하면 됩니다.

| # | 가정 | 틀렸을 때 영향 |
|---|---|---|
| A1 | 모든 `to*File` 함수는 순수 함수입니다. `Date.now()`, 빌드 시각, 랜덤 값, 환경별 값이 출력에 없습니다. | 골든 테스트가 매번 깨집니다. PR 0에서 해당 값을 주입받는 인자로 빼는 작업이 먼저 필요합니다. |
| A2 | 사이트 URL/basePath는 상수이거나 env로 결정되고, 테스트와 빌드에서 같은 값을 씁니다. | URL 골든이 환경마다 달라집니다. 테스트에서 env를 고정해야 합니다. |
| A3 | 외부 코드는 `@/lib/agent-install-kit`(또는 상대경로)에서만 import합니다. 내부 헬퍼(`agentInstructions`, `list`, `getAgentPageUrl`)를 export해서 다른 데서 쓰는 곳은 없습니다. | 있다면 그 헬퍼도 파사드에서 재export해야 합니다. |
| A4 | PR은 squash merge이고, main에 머지되면 GitHub Pages에 자동 배포됩니다. | 롤백 절차의 "재배포" 단계가 달라집니다. |
| A5 | "복붙된 공통 헤더/출처 문구"는 **완전히 같지 않을 수 있습니다**(공백, 줄바꿈, 문구가 조금씩 다를 수 있음). | 이 가정이 핵심이라 PR 6에서 먼저 실측합니다. |
| A6 | `agent-export-panel.tsx`는 클라이언트 컴포넌트이고, 이 모듈은 Node 전용 API를 쓰지 않습니다. | 분리할 때 `node:*` import가 끼어들면 클라이언트 번들 빌드가 깨집니다. `npm run build`에서 잡힙니다. |

시작 전에 5분이면 확인할 수 있습니다.

```bash
grep -nE "Date|new Date|Math.random|process.env" src/lib/agent-install-kit.ts        # A1, A2
grep -rn "agent-install-kit" src tests scripts                                       # A3
```

---

## 목표 구조

```
src/lib/
  agent-install-kit.ts          ← 공개 API 파사드 (재export만). 경로 유지.
  install-kit/
    shared.ts                   ← agentInstructions, list, getAgentPageUrl
    urls.ts                     ← isInstallable, getInstallKitPath/Url/Command
    frame.ts                    ← 공통 헤더/출처/푸터 (PR 6에서 생성)
    files/
      codex-agent.ts            ← toCodexAgentFile      (AGENTS.md)
      claude-project.ts         ← toClaudeProjectFile   (CLAUDE.md)
      cursor-rule.ts            ← toCursorRuleFile      (cursor-rule.mdc)
      manifest.ts               ← toInstallManifest     (agent.json)
      readme.ts                 ← toInstallReadme       (README.md)
      runbook.ts                ← toRunbookFile         (RUNBOOK.md)
      evaluation.ts             ← toEvaluationFile      (EVALUATION.md)
    index.ts                    ← getInstallKitFiles (7개 배열, 순서 유지)
```

의존 방향 규칙: `files/* → frame, shared`, `index → files/*, urls`, `agent-install-kit.ts → index, urls`. **`install-kit/` 안의 파일은 절대 `agent-install-kit.ts`를 import하지 않습니다.** 파사드를 import하면 순환 참조가 생깁니다.

소비처 3곳(route.ts, agent-export-panel.tsx, 테스트)의 import는 이번 작업에서 **바꾸지 않습니다.** 공개 API 경로를 유지하는 것이 목표 중 하나이고, 소비처를 건드리지 않아야 리뷰 범위가 작아집니다.

---

## 모든 PR 공통: 동작 보존 확인 절차

### 1) CI 5종 + 골든

```bash
npm run check:data && npm run lint && npm run typecheck && npm test && npm run build
```

### 2) 실제 빌드 산출물 비교 (모든 실제 에이전트 대상)

다른 사람이 YAML을 계속 추가하므로, **비교 직전에 반드시 rebase해서 양쪽 콘텐츠를 같게 맞춥니다.**

```bash
# 브랜치 쪽
git fetch origin && git rebase origin/main
npm run build
(cd out/kits && find . -type f | LC_ALL=C sort | xargs shasum -a 256) > /tmp/kits-branch.sha

# main 쪽 (별도 worktree, 같은 origin/main)
git worktree add /tmp/aa-base origin/main
(cd /tmp/aa-base && npm ci && npm run build \
  && cd out/kits && find . -type f | LC_ALL=C sort | xargs shasum -a 256) > /tmp/kits-base.sha

diff /tmp/kits-base.sha /tmp/kits-branch.sha && echo "KITS IDENTICAL"
# 차이가 나면 원인 확인:
diff -r /tmp/aa-base/out/kits out/kits | head -50

git worktree remove /tmp/aa-base
```

통과 기준: `KITS IDENTICAL`이 출력되고, 파일 개수가 같아야 합니다(`wc -l` 두 sha 파일).

PR 0에서 이 절차를 `scripts/compare-kits.sh`로 커밋해 두면 이후 PR에서는 `bash scripts/compare-kits.sh` 한 줄로 끝납니다. bash, git, shasum만 쓰므로 새 의존성은 없습니다.

### 3) 골든 파일 불변 확인

```bash
git diff --stat origin/main -- tests/fixtures/install-kit   # 출력이 비어 있어야 함 (PR 0 제외)
```

### 4) 순환 참조 확인

```bash
grep -rn "agent-install-kit" src/lib/install-kit && echo "CYCLE RISK" || echo "ok"
```

각 PR 설명에 위 4개 결과를 붙이는 것을 규칙으로 합니다.

---

## 단계별 PR

### PR 0: 출력 고정 (characterization test), 프로덕션 코드 변경 없음

**내용**
- `tests/fixtures/install-kit-agents.ts`: 합성 에이전트 4~5개를 둡니다. 실제 YAML에 의존하지 않으므로 다른 사람의 YAML 추가와 충돌하지 않습니다.
  - 필드를 전부 채운 에이전트
  - 선택 필드가 비어 있는 에이전트(빈 배열, `undefined`), 즉 `list()`의 빈 분기
  - 한글, 백틱, `|`, `{}`, 따옴표, 끝 공백, 여러 줄 문자열이 들어간 에이전트
  - `isInstallable === false`인 에이전트
  - runbook/evaluation 관련 필드가 있는 경우와 없는 경우
- `tests/install-kit-golden.test.ts`: 에이전트마다 `getInstallKitFiles()` 결과(순서, name, mimeType, content)와 `getInstallKitPath/Url/Command` 결과를 JSON으로 직렬화해서 `tests/fixtures/install-kit/<slug>.json`과 **문자열 완전 일치**로 비교합니다. JSON은 `\r`, 탭, 끝 공백, 마지막 개행을 이스케이프로 보존하므로 바이트 차이가 리뷰에서 보입니다.

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import {
  getInstallKitFiles, getInstallKitPath, getInstallKitUrl, getInstallKitCommand, isInstallable,
} from "../src/lib/agent-install-kit";
import { fixtureAgents } from "./fixtures/install-kit-agents";

for (const agent of fixtureAgents) {
  test(`install kit golden: ${agent.slug}`, () => {
    const snapshot = {
      installable: isInstallable(agent),
      command: getInstallKitCommand(agent.slug),
      files: getInstallKitFiles(agent).map((f) => ({
        name: f.name,
        mimeType: f.mimeType,
        path: getInstallKitPath(agent.slug, f.name),
        url: getInstallKitUrl(agent.slug, f.name),
        content: f.content,
      })),
    };
    const actual = JSON.stringify(snapshot, null, 2) + "\n";
    const file = new URL(`./fixtures/install-kit/${agent.slug}.json`, import.meta.url);
    if (process.env.UPDATE_GOLDEN === "1") return writeFileSync(file, actual);
    assert.equal(actual, readFileSync(file, "utf8"));
  });
}
```

- `scripts/compare-kits.sh`: 위 공통 절차 2)를 스크립트로 만듭니다.
- A1에서 시각이나 랜덤 값이 발견되면, 이 PR에서는 **테스트에서만** 고정하고(env나 모킹) 코드는 건드리지 않습니다.

**확인**
- `npm test`가 20개에서 20+N개로 늘어나고 모두 통과
- 골든을 만든 직후 `UPDATE_GOLDEN` 없이 다시 실행해도 통과(결정성 확인)
- 두 번 연속 실행해도 골든 diff 없음

**리뷰 포인트**: 골든 JSON을 눈으로 한 번 훑어서 현재 출력이 의도한 모습인지 확인합니다. 지금 버그가 있더라도 **그대로 고정합니다.** 버그 수정은 이 시리즈가 끝난 뒤 별도 PR로 합니다.

---

### PR 1: `install-kit/shared.ts`로 내부 헬퍼 이동

- `agentInstructions`, `list`, `getAgentPageUrl`를 잘라 붙이고, 원래 파일은 `import`로 바꿉니다.
- 코드 본문은 한 글자도 바꾸지 않습니다. 리뷰어가 `git diff --color-moved`로 이동만 했는지 확인할 수 있습니다.
- 규모: 약 +40/−35줄

### PR 2: `install-kit/urls.ts`로 URL/경로/curl 헬퍼 이동

- `isInstallable`, `getInstallKitPath`, `getInstallKitUrl`, `getInstallKitCommand`를 이동하고, `agent-install-kit.ts`에서 `export { ... } from "./install-kit/urls"`로 재export합니다.
- 기존 `tests/agent-install-kit.test.ts`는 **수정하지 않습니다.** 파사드 경로로 계속 통과하면 공개 API가 유지된다는 증거가 됩니다.
- 규모: 약 +50/−45줄

### PR 3: 단순 파일 3종 이동 (codex / claude / cursor)

- `files/codex-agent.ts`, `files/claude-project.ts`, `files/cursor-rule.ts`
- 복붙된 헤더도 **복붙된 그대로 함께 옮깁니다.** 여기서 합치지 않습니다.

### PR 4: manifest + readme 이동

- `files/manifest.ts`: `agent.json`은 `JSON.stringify`의 들여쓰기, 키 순서, 끝 개행이 출력을 결정하므로 호출 형태를 그대로 옮깁니다.
- `files/readme.ts`

### PR 5: runbook + evaluation 이동, 그리고 `index.ts`로 조립

- 60줄짜리 두 함수 + `getInstallKitFiles`를 `install-kit/index.ts`로 옮깁니다. **배열 순서(7개)를 유지**합니다. UI 버튼 순서와 골든에 반영되기 때문입니다.
- 이 시점에 `agent-install-kit.ts`는 재export만 남은 파사드가 됩니다.
- 150줄 이상이면 20분을 넘을 수 있으니 runbook(5a)과 evaluation(5b)으로 나눠도 됩니다. 다만 순수 이동은 `--color-moved`로 보면 빨리 읽히므로 하나로 가도 무방합니다.

> PR 1~5는 서로 독립적이지 않고 순서가 있습니다(shared가 먼저). 대신 각 PR이 main에 들어간 상태에서 언제 멈춰도 제품은 정상입니다. 중간에 우선순위가 바뀌어 작업이 멈춰도 문제가 없습니다.

---

### PR 6: 공통 문구 실측 + `frame.ts` 도입 (1~2개 파일만 적용)

출력이 바뀔 수 있는 유일한 구간이라 가장 조심합니다.

**6-1. 실측 (PR 설명에 첨부)**
7개 파일의 헤더/출처/푸터 조각을 나란히 놓고 **정확히 같은 것과 조금 다른 것**을 표로 정리합니다.

| 조각 | 등장 파일 | 완전 동일? | 차이 |
|---|---|---|---|
| 출처 문구 | AGENTS.md, CLAUDE.md, README.md … | 예/아니오 | 예: README만 끝 개행 2개 |
| 페이지 링크 줄 | … | … | … |

**6-2. 규칙**
- 완전히 같은 조각만 `frame.ts`의 상수나 함수로 추출합니다.
- 조금 다른 조각은 두 가지 중 하나로 처리합니다. (a) 차이를 파라미터로 표현하거나(`sourceLine(agent, { trailingBlank: true })`), (b) **합치지 않고 남겨 둡니다.** 바이트 동일성이 DRY보다 우선입니다.
- 이 PR에서는 가장 단순한 2개 파일(AGENTS.md, CLAUDE.md)에만 적용합니다.

**확인**: 공통 절차 전부. 특히 `compare-kits.sh`가 실제 에이전트 전체에서 `KITS IDENTICAL`인지 봅니다. 합성 골든이 못 잡는 실데이터 분기(특정 필드 조합)를 여기서 잡습니다.

### PR 7: 나머지 파일에 `frame.ts` 적용

- cursor, readme, runbook, evaluation. 필요하면 7a/7b로 나눕니다.
- manifest(`agent.json`)는 JSON이므로 마크다운 헤더 대상에서 제외합니다.

### PR 8: 정리

- `agent-install-kit.ts`에 "공개 API 파사드. 구현은 `install-kit/`에 있음. 출력 변경 시 골든 갱신 필요"라는 주석을 남깁니다.
- 골든 갱신 방법(`UPDATE_GOLDEN=1 npm test`)과 "갱신은 출력 변경 의도가 있는 PR에서만"이라는 규칙을 CONTRIBUTING 또는 테스트 파일 상단에 적습니다.
- 소비처 import 경로를 `install-kit/`로 옮길지는 **이번 시리즈에서 하지 않습니다.** 파사드를 유지하는 비용은 거의 없습니다.

---

## 롤백

| 상황 | 방법 |
|---|---|
| PR 머지 후 CI 실패 | `git revert <squash 커밋>` → PR → 머지. 순수 이동 PR이므로 되돌려도 기능 영향이 없습니다. |
| 여러 PR을 되돌려야 할 때 | **최신 PR부터 역순으로** revert합니다(PR 7 → 6 → …). 앞 PR을 먼저 되돌리면 뒤 PR의 import가 깨집니다. |
| 바이트 차이가 배포까지 나간 경우 | ① 즉시 해당 PR revert 후 머지(Pages 자동 재배포) ② 배포된 `/agentive/kits/<slug>/<file>`을 curl로 받아 main 빌드 산출물과 `diff` ③ 그 사이에 받아 간 사용자가 있을 수 있으니 변경 내용과 시간대를 이슈에 기록 ④ 골든이 왜 못 잡았는지 확인하고 해당 케이스를 합성 에이전트로 추가 |
| 자동 배포가 아니라면 | revert 후 Pages 배포 워크플로를 수동으로 재실행합니다(`gh workflow run <deploy workflow>`). |

PR 0 이후에는 바이트 차이가 머지 전에 골든 테스트나 `compare-kits.sh`에서 막히는 구조라서 배포 롤백까지 갈 가능성은 낮습니다.

---

## 리스크

| 리스크 | 가능성 | 영향 | 대응 |
|---|---|---|---|
| "같아 보이는" 복붙 문구가 실제로는 공백이나 개행이 다름 | 높음 | 높음 (외부 사용자 AGENTS.md diff) | PR 6 실측 표, 다른 것은 합치지 않음, 골든 + 실데이터 비교 |
| 합성 골든이 실제 YAML의 특이 조합을 커버하지 못함 | 중 | 높음 | `compare-kits.sh`로 **모든 실제 에이전트**의 out/kits 해시 비교 |
| 작업 중 YAML이 추가되어 비교 기준이 흔들림 | 높음 | 낮음 | 비교 직전 rebase, 같은 origin/main으로 base 빌드. 골든은 합성 데이터라 무관 |
| 새 YAML이 이번에 이동 중인 분기(빈 필드 등)를 처음 건드림 | 중 | 중 | 그 경우도 base/branch 양쪽이 같은 YAML로 빌드되므로 비교가 유효함 |
| 순환 import (`install-kit/*` → 파사드) | 중 | 중 (빌드 순서에 따라 `undefined` export) | 공통 절차 4) grep, 리뷰 체크 항목 |
| 클라이언트 번들에 Node 전용 코드 유입 | 낮음 | 중 | install-kit 아래에 `node:*` import 금지, `npm run build`에서 확인 |
| 골든을 "그냥 갱신"해서 통과시킴 | 중 | 높음 | PR 1~8에서 `tests/fixtures/install-kit` diff가 있으면 리뷰에서 거절한다는 규칙. 필요하면 CI에 `git diff --exit-code origin/main -- tests/fixtures/install-kit` 추가 |
| 파일 배열 순서나 `mimeType` 변경 | 낮음 | 중 (UI 순서, 라우트 Content-Type) | 골든에 순서와 mimeType 포함 |
| 이동 중 기존 버그를 "김에" 고침 | 중 | 중 | 금지. 발견한 버그는 이슈로 남기고 시리즈 종료 후 별도 PR로 처리 |

---

## 다음 액션

1. **(오늘, 5분)** 가정 A1~A3 확인 grep을 실행합니다. 시각이나 env 의존이 나오면 PR 0 범위에 반영합니다.
2. **(PR 0)** 합성 에이전트 fixture, 골든 테스트, `scripts/compare-kits.sh`를 작성합니다. 골든 JSON을 한 번 눈으로 검토하고 머지합니다.
3. **(PR 1~5)** 이동 PR을 하루 1~2개 속도로 진행합니다. 각 PR 설명에 공통 절차 4개 결과를 첨부합니다.
4. **(PR 6 착수 전)** 공통 문구 실측 표를 먼저 이슈나 PR 설명으로 공유하고, 어디까지 합칠지 합의합니다.
5. **(PR 6~8)** 공통화하고 정리합니다. 끝나면 이동 중 발견한 버그나 개선점을 별도 이슈로 정리합니다.

추가로 알려 주시면 계획이 더 정확해지는 정보가 두 가지 있습니다. 둘 다 없어도 위 계획대로 시작할 수 있습니다.
- `to*File` 출력에 날짜나 버전처럼 빌드마다 바뀌는 값이 있는지
- main 머지 시 Pages 배포가 자동인지 수동인지
