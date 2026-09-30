## 먼저 확인할 질문 (중요한 순서)

1. **`getInstallKitUrl`이 사이트 URL과 basePath를 어디서 읽나요?** 상수인지, `process.env`(예: `NEXT_PUBLIC_*`)인지, 모듈 로드 시점에 읽는지 호출 시점에 읽는지에 따라 테스트 환경을 CI와 같게 맞추는 방법이 달라집니다.
2. **테스트에서 전체 에이전트 목록을 어떻게 가져오나요?** `src/data`의 로더 export 이름, 그리고 `npm test` 전에 `src/data/generated/agents.ts`가 생성돼 있는지(CI 순서) 알려 주세요. 아래 안전망이 이 목록을 기준으로 동작합니다.
3. **리팩터링 기간 중에 출력을 *의도적으로* 바꾸는 PR이 있나요?** (예: RUNBOOK 템플릿 문구 수정.) 있으면 그 PR과 순서를 정해야 하고, 없으면 이 기간 동안 출력 변경을 동결하는 것으로 가정하겠습니다.

아래 계획은 잠정안입니다. 보지 못한 코드에 기대는 부분은 [ASSUMPTION] 또는 "확인:"으로 표시했습니다.

---

## 1. 안전망부터 (PR 0a, 0b — 테스트만 추가, 프로덕션 코드 변경 없음)

현재 테스트 20개는 파일 이름, URL, curl 문자열만 검사하고 **파일 본문은 검사하지 않습니다.** 목표가 "바이트 단위 동일"이므로 본문을 비교하는 테스트가 먼저 있어야 합니다. 두 가지를 겹쳐 둡니다.

### PR 0a — 구현 비교(parity) 테스트: 모든 실제 에이전트, 모든 파일

- `tests/legacy/agent-install-kit.legacy.ts`: 현재 `src/lib/agent-install-kit.ts`를 **그대로** 복사한 기준본입니다. import 경로만 필요한 만큼 고칩니다. `@/…` 별칭을 쓴다면 tsx가 tsconfig paths를 해석하는지 확인하세요.
- `tests/install-kit-parity.test.ts`: 새 구현과 기준본을 에이전트 전체에 대해 비교합니다.

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import * as current from "../src/lib/agent-install-kit";
import * as legacy from "./legacy/agent-install-kit.legacy";
import { agents } from "../src/data/…"; // [ASSUMPTION] 실제 로더 export로 교체

test("install kit output is byte-identical to legacy for every agent", () => {
  assert.ok(agents.length > 0);
  for (const agent of agents) {
    assert.equal(current.isInstallable(agent), legacy.isInstallable(agent), agent.slug);
    // name, 순서, mimeType, content를 한 번에 비교
    assert.deepStrictEqual(current.getInstallKitFiles(agent), legacy.getInstallKitFiles(agent), agent.slug);
    assert.equal(current.getInstallKitCommand(agent.slug), legacy.getInstallKitCommand(agent.slug), agent.slug);
    for (const { name } of legacy.getInstallKitFiles(agent)) {
      assert.equal(current.getInstallKitPath(agent.slug, name), legacy.getInstallKitPath(agent.slug, name));
      assert.equal(current.getInstallKitUrl(agent.slug, name), legacy.getInstallKitUrl(agent.slug, name));
    }
  }
});
```

- 테스트 대상이 매 실행마다 로드한 **에이전트 목록 전체**이므로, 다른 사람이 YAML을 추가해도 새 에이전트가 자동으로 검사에 들어갑니다. 커밋해 둔 스냅샷이 깨지지도 않습니다.
- 확인: `npm test`가 `tests/*.test.ts`만 잡는다면 `tests/legacy/`는 테스트로 실행되지 않습니다(의도한 동작). `tsconfig`/ESLint 대상에 `tests/`가 들어 있는지도 확인하세요.

**검증**

```bash
diff src/lib/agent-install-kit.ts tests/legacy/agent-install-kit.legacy.ts   # import 줄 말고는 차이가 없어야 함
npm run check:data && npm run lint && npm run typecheck && npm test && npm run build
# 기대: 테스트 21개 이상 통과(기존 20 + parity)
```

**테스트가 실제로 잡는지 확인(커밋하지 않는 로컬 확인)**: `src/lib/agent-install-kit.ts`의 `toRunbookFile` 템플릿 한 줄 끝에 공백 하나를 넣고 `npm test`를 돌려 parity가 실패하는지 봅니다. 그다음 `git checkout src/lib/agent-install-kit.ts`로 되돌립니다.

- 크기: 약 300줄 복사와 40줄 테스트입니다. 복사본은 위의 `diff` 한 줄로 검토하므로 리뷰는 10분 이내입니다.
- 롤백: `git revert <merge-sha>`. 테스트만 추가했으므로 배포물에 영향이 없습니다.

### PR 0b — 골든 파일(합성 fixture) 테스트

리팩터링이 끝나 legacy 복사본을 지운 뒤에도 출력을 고정하려는 장치입니다.

- `tests/install-kit-golden.test.ts`: 테스트 안에 합성 에이전트 2~3개를 정의합니다. (a) RUNBOOK/EVALUATION이 모두 나오는 설치 가능한 에이전트, (b) 선택 필드가 비어 있는 최소 에이전트, (c) `isInstallable === false`인 에이전트입니다. 필수 필드는 `src/types/agent.ts`의 `Agent`를 보고 맞추세요. 실제 YAML을 쓰지 않으므로 다른 사람의 콘텐츠 수정에 영향받지 않습니다.
- `tests/fixtures/install-kit/<fixture>/<file>`: **현재 코드**로 생성한 기대 출력 7개 × fixture 수. 비교는 `readFileSync(path)`(Buffer)와 `Buffer.from(content, "utf8")`로 바이트 비교합니다.
- 생성은 `UPDATE_GOLDEN=1`일 때만 파일을 쓰는 분기로 합니다. 새 의존성은 필요 없습니다(`node:fs`만 사용).

**검증**

```bash
UPDATE_GOLDEN=1 npx tsx --test tests/install-kit-golden.test.ts   # 확인: package.json의 test 스크립트와 같은 러너 방식으로
git status tests/fixtures      # 생성된 파일만 추가됐는지
npm test                       # UPDATE_GOLDEN 없이 통과해야 함
```

- 주의: `.gitattributes`에서 fixture 경로를 `-text`(또는 `eol=lf`)로 지정해 줄바꿈 변환을 막으세요. 에디터의 "trailing whitespace 제거"도 fixture에 적용되지 않게 해야 합니다.
- 크기: 테스트 약 60줄과 생성된 fixture입니다. 리뷰어는 fixture 몇 개만 훑어보면 됩니다. 약 15분.
- 롤백: `git revert <merge-sha>`.

### 모든 PR에 공통으로 쓰는 빌드 산출물 비교

`out/kits/<slug>/<file>`가 외부 사용자가 curl로 받는 실제 바이트입니다. 같은 콘텐츠 기준에서 비교해야 하므로, YAML이 계속 추가되는 상황에서는 **브랜치를 먼저 main에 rebase하고** 그 main과 비교합니다.

```bash
git fetch origin && git rebase origin/main
git worktree add ../aa-base origin/main
(cd ../aa-base && npm ci && npm run build && cd out && find kits -type f | sort | xargs shasum -a 256) > /tmp/kits-base.sha
npm run build && (cd out && find kits -type f | sort | xargs shasum -a 256) > /tmp/kits-branch.sha
diff /tmp/kits-base.sha /tmp/kits-branch.sha && echo "IDENTICAL"
git worktree remove ../aa-base
```

- 기대 결과: `diff` 출력이 없고 `IDENTICAL`이 나옵니다. 파일 목록(`generateStaticParams` 결과)과 각 파일 해시를 동시에 확인합니다.
- 이 결과를 각 PR 설명에 붙여 두면 리뷰어가 따로 빌드하지 않아도 됩니다.

---

## 2. 단계별 PR (순서대로, 한 PR에 하나)

원칙:
- **PR 1~7은 "옮기기만" 합니다.** 템플릿 문자열은 한 글자도 고치지 않습니다. 합치기(헤더/푸터 공통화)는 옮기기가 끝난 뒤 PR 8에서만 합니다.
- `src/lib/agent-install-kit.ts`는 끝까지 남겨 **파사드**로 씁니다. `route.ts`, `agent-export-panel.tsx`, 기존 테스트의 import는 이 PR 시리즈에서 바꾸지 않습니다. 공개 API 이름과 경로가 그대로 유지됩니다.
- 새 하위 모듈은 **절대 `agent-install-kit.ts`를 import하지 않습니다.** 의존 방향은 파사드 → `install-kit/*` 한 방향입니다(순환 import 방지).
- 리뷰 팁(PR 설명에 적어 두기): `git diff --color-moved=dimmed-zebra --color-moved-ws=no origin/main...HEAD`로 보면 옮겨진 줄은 흐리게, 실제로 바뀐 줄만 강조됩니다. `--color-moved-ws=no`를 써야 들여쓰기 변화도 드러납니다.

각 PR의 공통 검증:

```bash
npm run check:data && npm run lint && npm run typecheck && npm test && npm run build
# 기대: 기존 20개 + parity + golden 전부 통과
# + 위의 out/kits 해시 비교 → IDENTICAL
```

각 PR의 공통 롤백: `git revert <merge-sha>` 후 main 배포. 매 단계 출력이 같으므로 어느 단계를 되돌려도 배포물은 바뀌지 않습니다. 여러 개를 되돌릴 때는 파사드 충돌을 피하려고 **최신 PR부터 역순으로** 되돌립니다. 데이터 마이그레이션은 없습니다.

| PR | 내용 | 새/수정 파일 | 크기(추정) |
|---|---|---|---|
| 1 | URL 헬퍼 이동 | `install-kit/urls.ts`, 파사드 | 60~80줄 이동 |
| 2 | 공통 내부 헬퍼 이동 | `install-kit/shared.ts`, 파사드 | 40~60줄 이동 |
| 3 | 도구별 규칙 파일 3종 | `install-kit/files/{codex,claude,cursor}.ts` | 50~80줄 이동 |
| 4 | manifest, README | `install-kit/files/{manifest,readme}.ts` | 50~70줄 이동 |
| 5 | RUNBOOK | `install-kit/files/runbook.ts` | 약 60줄 이동 |
| 6 | EVALUATION | `install-kit/files/evaluation.ts` | 약 60줄 이동 |
| 7 | 조립 함수 이동, 파사드화 | `install-kit/index.ts`, 파사드 | 30~50줄 |
| 8 | 공통 헤더/푸터 한 곳으로 | `shared.ts`, `files/*` | 실제 로직 변경, 40~80줄 |
| 9 | legacy 복사본 제거 | `tests/legacy/*`, parity 테스트 | 삭제만 |

### PR 1 — URL/경로/명령 헬퍼 → `src/lib/install-kit/urls.ts`
- 이동: `getInstallKitPath`, `getInstallKitUrl`, `getInstallKitCommand`, 내부 `getAgentPageUrl`.
- 파사드에 `export { getInstallKitPath, getInstallKitUrl, getInstallKitCommand } from "./install-kit/urls";`를 추가합니다.
- 확인: `getInstallKitCommand`가 `{a,b,c}`의 파일 이름 목록을 어디서 가져오는지 보세요. `getInstallKitFiles`를 호출하거나 파사드 안의 상수에 의존한다면, 그 상수도 `urls.ts`(또는 `shared.ts`)로 같이 옮겨야 순환이 생기지 않습니다.
- 확인: basePath `/agentive`와 사이트 URL이 `process.env`에서 오면, 읽는 시점(모듈 최상위인지 함수 안인지)을 그대로 유지합니다.
- 추가 검증: parity 테스트의 URL/curl 비교, 그리고 기존 `tests/agent-install-kit.test.ts`의 curl 문자열 테스트.

### PR 2 — 내부 헬퍼 → `src/lib/install-kit/shared.ts`
- 이동: `agentInstructions`, `list`, `isInstallable`. `isInstallable`은 파사드에서 re-export합니다.
- `agentInstructions`와 `list`는 **파사드에서 export하지 않습니다.** 지금 내부용이므로 공개 API를 넓히지 않습니다.

### PR 3 — `toCodexAgentFile`, `toClaudeProjectFile`, `toCursorRuleFile` → `install-kit/files/` 아래 각각
- 세 함수가 공통 헤더/출처 문구를 복붙하고 있어도 **이 PR에서는 그대로 둡니다.**
- 확인: 이 함수들이 현재 export돼 있고 컴포넌트나 테스트가 직접 쓰고 있다면 파사드에서 같은 이름으로 re-export합니다. `grep -rn "agent-install-kit" src tests scripts`로 importer 전체를 먼저 확인하세요.

### PR 4 — `toInstallManifest`(agent.json), `toInstallReadme`
- manifest: `JSON.stringify` 결과는 **객체 키 순서**와 들여쓰기 인자에 좌우됩니다. 객체 리터럴의 키 순서, 스프레드 위치, `JSON.stringify(…, null, 2)` 인자, 끝의 `"\n"` 유무를 그대로 옮기세요.

### PR 5 — `toRunbookFile`, PR 6 — `toEvaluationFile`
- 60줄짜리 템플릿이 하나씩이라 각각 별도 PR로 둡니다. 둘을 합치면 120줄이 넘는 템플릿 diff가 되어 20분 리뷰 기준을 넘기기 쉽습니다.
- 여러 줄 템플릿 리터럴은 **들여쓰기가 곧 출력**입니다. 함수 안/밖으로 옮기면서 에디터가 다시 들여쓰면 출력이 바뀝니다. PR 설명에 `--color-moved-ws=no` diff 결과를 첨부합니다.

### PR 7 — `getInstallKitFiles` → `src/lib/install-kit/index.ts`, 파사드는 re-export만
- 7개 파일의 **배열 순서**(AGENTS.md, CLAUDE.md, cursor-rule.mdc, agent.json, README.md, RUNBOOK.md, EVALUATION.md)와 각 `mimeType`을 그대로 둡니다. `generateStaticParams`와 curl의 `{…}` 목록이 이 순서와 이름을 씁니다.
- 결과적으로 `src/lib/agent-install-kit.ts`는 re-export 몇 줄만 남습니다. `route.ts`, `agent-export-panel.tsx`, 테스트는 수정하지 않습니다.
- 추가 검증: `out/kits` 해시 비교에서 **파일 목록**이 같은지(파일 수 = 설치 가능한 에이전트 수 × 7) 확인합니다.

### PR 8 — 공통 헤더/푸터 한 곳으로 (유일하게 "로직"이 바뀌는 단계)
- 먼저 PR 설명에 **복붙된 문구의 인벤토리**를 적습니다. 어느 함수에 어떤 헤더/출처 문구가 있고 줄바꿈이 몇 개인지입니다. 겉보기에 같아도 끝 줄바꿈, 빈 줄 수, 링크 형식이 다를 수 있습니다.
- **완전히 같은 것만** `shared.ts`의 함수(예: `kitHeader(agent)`, `kitSourceFooter(agent)`)로 합칩니다. 차이가 있는 변형은 인자로 억지로 맞추지 말고 그대로 둡니다. 출력 동일성이 공통화보다 우선입니다.
- 템플릿 결합 방식(`\n` 조인, 끝 개행)을 바꾸게 되므로 파일 종류별로 커밋을 나눕니다. 20분이 넘을 것 같으면 8a(규칙 파일 3종), 8b(README/RUNBOOK/EVALUATION)로 나눕니다.
- 이 단계에서는 parity 테스트와 golden 테스트가 핵심 검증입니다. 실패하면 `assert.deepStrictEqual`의 diff에 어긋난 줄이 나옵니다.

### PR 9 — legacy 복사본과 parity 테스트 제거
- 조건: PR 8이 배포되고 `out/kits` 해시 비교가 IDENTICAL로 확인된 뒤. 그 뒤로는 golden 테스트(PR 0b)가 출력을 고정합니다.
- 제거를 미루고 싶다면 parity를 계속 둬도 됩니다. 다만 이후 의도적으로 출력을 바꿀 때마다 legacy 복사본도 같이 수정해야 합니다.

---

## 3. 리스크

| 리스크 | 어떻게 드러나나 | 잡는 검사 |
|---|---|---|
| 템플릿 리터럴을 옮기며 들여쓰기가 바뀜 | 파일 본문 줄 앞 공백이 달라짐 → 사용자 AGENTS.md diff | parity `deepStrictEqual`, `out/kits` 해시 비교, `--color-moved-ws=no` diff |
| 에디터가 템플릿 안의 trailing whitespace를 지우거나 줄바꿈을 CRLF로 바꿈 (Markdown 줄바꿈용 공백 두 칸 포함) | 눈에 안 보이는 바이트 차이 | parity 테스트, golden 바이트 비교, fixture용 `.gitattributes` |
| 헤더/푸터 공통화에서 끝 개행이나 빈 줄 수가 달라짐 (PR 8) | 파일 끝, 섹션 사이 빈 줄 변화 | parity와 golden. PR 8 인벤토리로 사전 확인 |
| manifest 키 순서 변경 | agent.json 해시 변경 | parity, golden의 agent.json |
| 파일 순서나 이름 변경 | `generateStaticParams` 결과, curl `{…}` 목록 변화, 404 | 기존 테스트(파일 7개 이름, curl 문자열), `out/kits` 파일 목록 diff |
| 순환 import (하위 모듈이 파사드를 import) | 런타임에 `undefined` 함수, 빌드 에러 | `npm run typecheck`, `npm test`, `npm run build`. 리뷰 규칙: `grep -rn "agent-install-kit" src/lib/install-kit`가 비어 있어야 함 |
| 환경값(site URL, basePath) 읽는 시점이 바뀜 | 테스트에서는 같지만 빌드 산출물 URL이 달라짐 | `out/kits` 해시 비교(README 등 URL을 담은 파일), parity의 URL 비교 |
| 다른 사람의 YAML 추가로 비교 기준이 흔들림 | 브랜치와 main의 `out/kits` 파일 수가 다름(리팩터링 문제가 아님) | 비교 전에 `git rebase origin/main`, 같은 커밋 기준으로 빌드. parity는 실행 시점의 전체 목록을 쓰므로 영향 없음 |
| 새 YAML에 특이한 필드 조합(선택 필드 누락 등)이 있어 새 구현에서만 다르게 처리됨 | 특정 slug에서 parity 실패 | parity가 전체 에이전트를 돌림. 실패 메시지에 slug가 나옴 |
| 누군가 기간 중에 출력을 의도적으로 수정 | legacy와 불일치로 parity 실패 | 질문 3. 동결하거나, 같은 PR에서 legacy와 golden을 함께 갱신 |
| legacy 복사본이 lint `--fix`나 포매터로 바뀜 | 기준 자체가 흔들림 | PR 0a 머지 후 `git log -- tests/legacy/`에 변경이 없어야 함. golden이 이중으로 고정 |
| `agent-export-panel.tsx`가 클라이언트 컴포넌트라면 모듈 분리로 번들 구성이 달라짐 | 동작 차이는 없고 번들 크기만 변할 수 있음 | `npm run build` 출력의 페이지별 JS 크기를 PR 1 전후로 비교(참고용) |

---

## 가정

- [ASSUMPTION] `src/data`에 전체 에이전트 목록을 동기적으로 돌려주는 export가 있고, 테스트 시점에 generated 파일이 존재합니다.
- [ASSUMPTION] Markdown 본문 조립 함수들은 순수 함수이고(입력 agent → 문자열), 시간이나 랜덤 값을 쓰지 않습니다. 날짜를 넣는다면 parity와 golden에서 고정해야 합니다.
- [ASSUMPTION] `agent-install-kit.ts`를 import하는 곳은 말씀하신 세 곳뿐입니다. `scripts/` 쪽은 `grep`으로 확인이 필요합니다.
- [ASSUMPTION] 기간 중에 이 모듈의 출력을 의도적으로 바꾸는 PR은 없습니다(동결).

## 다음 액션

1. 위 질문 3개에 답해 주세요. 특히 에이전트 로더 export와 URL 환경값입니다.
2. `grep -rn "agent-install-kit" src tests scripts`로 importer 목록을 확정합니다.
3. PR 0a를 올리고, 로컬에서 "공백 하나 넣어 보기"로 parity가 실제로 실패하는지 확인한 결과를 PR 설명에 적습니다.
4. PR 0b를 머지한 뒤 PR 1부터 순서대로 진행합니다. 각 PR 설명에는 다섯 개 명령 통과, `out/kits` 해시 비교 IDENTICAL, `--color-moved` diff 요약을 붙입니다.

## Later

- 파사드를 거치지 않고 `route.ts`/컴포넌트가 `@/lib/install-kit`를 직접 import하도록 전환.
- `out/kits` 해시 비교를 CI 잡으로 자동화(main 산출물과 비교).
- `getInstallKitFiles`의 파일 이름 목록을 상수 하나로 두고 curl `{…}`, `generateStaticParams`가 공유하게 정리.
