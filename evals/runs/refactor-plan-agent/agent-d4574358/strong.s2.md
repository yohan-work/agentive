핵심 원칙부터 말씀드리겠습니다. **"출력 바이트 동일"을 사람이 눈으로 확인하게 두지 말고, 첫 PR에서 기계가 판정하게 만든 다음** 나머지 PR은 전부 "순수 이동" 또는 "골든이 안 바뀌는 추출"로만 구성합니다. 공통 헤더 추출은 바이트가 바뀔 위험이 가장 큰 단계라서, 이동이 모두 끝난 뒤 단독 PR로 맨 마지막에 둡니다.

## 먼저 확인하고 싶은 것 (중요한 순서)

1. **복붙된 공통 헤더/출처 문구가 함수마다 정말 글자 하나까지 같습니까?** 제목 줄, 빈 줄 개수, 끝의 `\n` 같은 작은 차이가 있으면 "한 곳으로 모으기"는 헤더 하나가 아니라 변형을 받는 헬퍼가 됩니다. 이 답에 따라 PR 6의 모양이 달라집니다.
2. **`agent-export-panel.tsx`가 `"use client"` 컴포넌트입니까?** 그렇다면 `agent-install-kit.ts`는 클라이언트 번들에도 들어가므로, 새 모듈이 `node:fs`, `node:path` 같은 서버 전용 코드를 import하면 안 됩니다.
3. **사이트 URL과 basePath(`/agentive`)는 코드에 상수로 있습니까, 아니면 환경변수(`NEXT_PUBLIC_...` 등)로 들어옵니까?** 아래의 빌드 비교는 base와 head를 같은 env로 빌드해야 의미가 있습니다.

답을 받기 전이라 아래 계획은 잠정안이고, 추측한 부분은 [ASSUMPTION]으로 표시했습니다.

- [ASSUMPTION] 공통 헤더 복사본 중 일부는 완전히 같고 일부는 조금 다를 수 있다고 보고 계획했습니다.
- [ASSUMPTION] 패널은 클라이언트 컴포넌트라고 가정했습니다. 아니어도 계획은 바뀌지 않고, 제약이 하나 줄어들 뿐입니다.
- [ASSUMPTION] `npm run build`가 `out/kits/<slug>/<file>`에 모든 설치형 에이전트의 7개 파일을 만든다고 보았습니다(말씀하신 route.ts 동작 기준).
- [ASSUMPTION] 기존 import 경로인 `@/lib/agent-install-kit`는 re-export 배럴로 남겨서, route.ts, 패널, 기존 테스트는 이 작업 동안 한 줄도 고치지 않습니다.

---

## 1. 안전망 먼저 (PR 1, 코드 이동 없음)

바이트 동일성은 서로 보완하는 두 가지 장치로 확인합니다.

### A. 픽스처 골든 테스트 (`npm test`에 포함, 빠르고 데이터 변화의 영향을 받지 않음)

- 새 파일은 `tests/install-kit-golden.test.ts`와 `tests/fixtures/install-kit/` 두 개입니다.
- 픽스처 에이전트 3~4개는 **실제 YAML이 아니라 테스트 안에 고정된 객체**로 만듭니다. 다른 사람이 YAML을 계속 추가해도 골든이 흔들리지 않게 하려는 것입니다.
  - `minimal`: 선택 필드가 모두 비어 있는 에이전트. `list()`가 빈 배열을 받는 경로와 runbook/evaluation의 "없음" 분기를 확인합니다.
  - `full`: 모든 필드가 채워지고 항목이 여러 개인 에이전트.
  - `tricky`: 한글, 백틱, `$`, 따옴표, 역슬래시, 여러 줄 instructions를 넣은 에이전트. 템플릿 리터럴 이스케이프와 `agent.json`의 JSON 이스케이프를 확인합니다.
  - `not-installable`: `isInstallable`이 `false`를 돌려주는 에이전트.
  - 어떤 필드가 분기를 만드는지는 제가 코드를 보지 못했습니다. **`src/types/agent.ts`의 `Agent` 타입과, `toRunbookFile` 및 `toEvaluationFile` 안의 `if`/`?.`/`??`/`.length` 분기를 확인해서 모든 분기가 최소 한 번 실행되도록 픽스처를 고르세요.**
- 테스트가 검사하는 내용은 다음과 같습니다.
  - 각 픽스처의 `getInstallKitFiles(agent)` 결과에서, 파일 7개의 `content`가 `tests/fixtures/install-kit/<fixture>/<name>`과 **`Buffer.from(content, "utf8").equals(readFileSync(path))`** 기준으로 같은지 봅니다. 문자열 `===`가 아니라 바이트 비교입니다.
  - 파일 순서, `name`, `mimeType` 배열은 `tests/fixtures/install-kit/<fixture>/_files.json`과 비교합니다.
  - `getInstallKitPath`, `getInstallKitUrl`, `getInstallKitCommand`, `isInstallable`의 픽스처별 결과는 `_helpers.json`과 비교합니다. curl 명령의 `{a,b,c}` 순서도 여기서 고정됩니다.
- 골든 생성은 `UPDATE_GOLDENS=1 npm test`로 할 때만 파일을 쓰게 하고, 평소에는 비교만 합니다. **이 명령은 PR 1에서, 리팩터링 전 코드로 딱 한 번 실행**합니다.
- 픽스처 파일은 바이트 그대로 보존되어야 합니다. `.gitattributes`에 `tests/fixtures/install-kit/** -text`를 추가해서 git의 줄바꿈 변환을 막으세요. 에디터가 끝 공백을 지우지 않는지도 확인해야 합니다(markdown 줄바꿈용 `"  "`가 있다면 특히).

### B. 실제 빌드 산출물 비교 (모든 실제 에이전트가 대상인 최종 판정)

`scripts/diff-install-kits.sh`를 추가합니다. bash와 git만 쓰고 새 의존성은 없습니다.

```bash
#!/usr/bin/env bash
# 사용법: scripts/diff-install-kits.sh [base-ref]   (기본값: origin/main)
set -euo pipefail
BASE_REF="${1:-origin/main}"
WT="$(mktemp -d)/base"
git worktree add --detach "$WT" "$(git merge-base HEAD "$BASE_REF")"
trap 'git worktree remove --force "$WT"' EXIT

# 동시에 추가되는 YAML의 영향을 없애기 위해 base에도 head와 같은 에이전트 데이터를 넣음
rm -rf "$WT/content/agents" && cp -R content/agents "$WT/content/agents"

(cd "$WT" && npm ci --silent && npm run build >/dev/null)
npm run build >/dev/null

hash_tree() { (cd "$1" && find . -type f -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256); }
diff <(hash_tree "$WT/out/kits") <(hash_tree out/kits) \
  && echo "install kits: byte-identical ($(find out/kits -type f | wc -l | tr -d ' ') files)"
```

- 해시 목록 비교는 **파일 내용의 바이트 차이, 빠진 파일, 추가된 파일**(= `generateStaticParams` 결과 변화)을 한 번에 잡아냅니다.
- base를 `merge-base`로 잡고 `content/agents`를 head 것으로 덮어쓰기 때문에, 작업 중에 main에 YAML이 늘어나도 "코드 차이만" 비교됩니다.
- 3번 질문의 답에 따라, 사이트 URL이 env로 들어온다면 두 빌드에 같은 값을 export한 뒤 실행해야 합니다.

### PR 1 검증

```bash
UPDATE_GOLDENS=1 npm test          # 골든 생성 (PR 1에서만 1회)
npm test                           # 기대값: 20 + 새 테스트 수만큼 통과, 0 fail
npm run check:data && npm run lint && npm run typecheck && npm run build
scripts/diff-install-kits.sh       # 기대값: "install kits: byte-identical (N files)"
                                   # (PR 1은 src 변경이 없으므로 당연히 동일해야 하며, 스크립트 자체를 검증하는 단계)
```

스크립트가 정말 차이를 잡아내는지도 한 번 확인합니다. 로컬에서 `toCursorRuleFile` 출력에 공백 하나를 넣고 `npm test`와 스크립트가 **둘 다 실패하는지** 본 뒤 되돌립니다. 이 결과는 PR 설명에 적어 둡니다.

- **크기**: 테스트와 스크립트 약 120~150줄, 나머지는 생성된 골든 파일입니다. 리뷰어는 골든을 "현재 출력을 떠 놓은 것"으로 훑어만 보면 됩니다. 약 15분.
- **롤백**: `git revert <PR1 merge sha>`. 테스트와 스크립트만 사라지고 사이트 출력에는 영향이 없습니다.

---

## 2. 단계별 PR (순서대로, PR당 하나)

모든 PR에 공통으로 적용하는 규칙이 있습니다.

- **골든 파일은 PR 2 이후 절대 바뀌면 안 됩니다.** 각 PR에서 `git diff --stat origin/main -- tests/fixtures/install-kit .gitattributes`를 실행해서 **출력이 비어 있어야 합니다.** 리뷰어 체크리스트 1번 항목입니다.
- **이동은 복사-붙여넣기 없이 잘라내기로만 합니다.** 리뷰어는 `git diff --color-moved=dimmed-zebra --color-moved-ws=no origin/main...HEAD`로 보면 됩니다. 이동한 블록은 흐리게 보이고 실제로 바뀐 줄만 강조되니 20분 리뷰가 가능해집니다. `--color-moved-ws=no`를 쓰는 이유는 **공백이 바뀐 이동을 "변경"으로 드러내려는 것**입니다. 템플릿 리터럴 안의 들여쓰기 변화가 곧 출력 바이트 변화이기 때문입니다.
- **의존 방향은 한쪽으로만 둡니다.** `src/lib/install-kit/*`는 `src/lib/agent-install-kit.ts`(배럴)를 절대 import하지 않습니다. 순환 import가 생기면 ESM에서 초기화 전 접근(TDZ) 오류나 `undefined`가 날 수 있습니다. 확인 명령은 `grep -rn "agent-install-kit" src/lib/install-kit/`이고, 기대 결과는 출력 없음입니다.
- 각 PR의 검증 세트는 다음과 같습니다(이하 "**표준 검증**").
  ```bash
  npm run check:data && npm run lint && npm run typecheck && npm test && npm run build
  scripts/diff-install-kits.sh
  git diff --stat origin/main -- tests/fixtures/install-kit .gitattributes   # 빈 출력
  ```
  기대 결과: 5개 명령 모두 exit 0, 테스트 수는 PR 1 이후 숫자 그대로 fail 0, `install kits: byte-identical`, stat 출력 없음.
- **롤백**: 모든 PR은 출력 바이트가 같으므로, revert해도 사용자에게 보이는 변화가 없습니다. 뒤 PR이 앞 PR의 파일에 의존하므로 **revert는 역순으로** 합니다(PR 5 → 4 → ...). 특정 PR 하나만 문제라면 그 PR과 그 뒤의 PR들을 역순으로 revert합니다.

### PR 2: 디렉터리 생성, 내부 헬퍼와 URL/경로 헬퍼 이동

- **이동**
  - `list`, `agentInstructions`, `getAgentPageUrl` → `src/lib/install-kit/shared.ts`. 내부용이므로 export는 모듈 간에만 쓰고 배럴에서는 re-export하지 않습니다. 원래 파일에서 export되지 않던 것이 공개 API로 새지 않게 하려는 것입니다.
  - `isInstallable`, `getInstallKitPath`, `getInstallKitUrl`, `getInstallKitCommand` → `src/lib/install-kit/urls.ts`.
  - `agent-install-kit.ts`에는 `export { isInstallable, getInstallKitPath, getInstallKitUrl, getInstallKitCommand } from "./install-kit/urls";`를 추가합니다.
- **손대는 파일**: `src/lib/agent-install-kit.ts`, `src/lib/install-kit/shared.ts`(신규), `src/lib/install-kit/urls.ts`(신규).
- **특별 확인**
  - basePath `/agentive`와 사이트 URL 상수가 어디서 오는지 확인합니다. 상수가 이 파일 안에 있으면 같이 이동하고, 다른 모듈에서 import하고 있으면 import 경로만 고칩니다.
  - `getInstallKitCommand`의 curl 문자열은 이미 `_helpers.json` 골든과 기존 테스트가 이중으로 지켜 줍니다.
- **공개 API 확인**: `git diff origin/main -- src/app src/components tests/agent-install-kit.test.ts`의 출력이 비어 있어야 합니다. 호출자 파일을 하나도 건드리지 않았다는 뜻입니다.
- **크기**: 이동 약 70~90줄과 import 몇 줄. 약 10분.

### PR 3: 짧은 에이전트 파일 3개 (`toCodexAgentFile`, `toClaudeProjectFile`, `toCursorRuleFile`)

- **이동**: `src/lib/install-kit/codex.ts`, `claude.ts`, `cursor.ts`를 각각 만들거나, 짧다면 `agent-files.ts` 하나로 묶습니다. 공통 헤더 복붙은 **이 PR에서는 그대로 둡니다.** 이동과 추출을 섞지 않기 위해서입니다.
- **특별 확인**: 템플릿 리터럴을 옮길 때 **함수의 중첩 깊이를 원래와 똑같이** 유지하세요. 여러 줄 템플릿의 둘째 줄부터는 들여쓰기가 곧 내용입니다. `.mdc` 파일 frontmatter(`---`)의 앞뒤 줄바꿈도 골든의 `cursor-rule.mdc`가 지켜 줍니다.
- **손대는 파일**: 배럴과 신규 모듈 1~3개.
- **크기**: 약 60~80줄 이동. 약 10분.

### PR 4: `toInstallManifest`(agent.json)와 `toInstallReadme`

- **이동**: `src/lib/install-kit/manifest.ts`, `readme.ts`로 옮깁니다.
- **특별 확인**
  - `agent.json`은 `JSON.stringify`를 쓴다면 **객체 리터럴의 키 순서가 곧 출력 순서**입니다. 이동하면서 키를 정렬하거나 구조를 바꾸지 마세요. `JSON.stringify(x, null, 2)`의 들여쓰기 인자와 끝의 `\n` 유무도 그대로 둡니다.
  - README가 URL이나 curl 명령을 본문에 넣는다면 `urls.ts`(PR 2)에서 import하게 됩니다. 이 import 방향이 규칙에 맞는지 확인하세요.
- **크기**: 약 50~70줄. 약 10분.

### PR 5: `toRunbookFile`과 `toEvaluationFile` (각 60줄)

- **이동**: `src/lib/install-kit/runbook.ts`, `evaluation.ts`로 옮깁니다.
- **특별 확인**: 가장 긴 템플릿이자 분기가 가장 많은 두 함수입니다. PR 1에서 모든 분기가 픽스처로 실행되는지 확인했다는 전제가 여기서 제일 중요합니다. 불안하면 이 PR 전에 **커버리지를 확인**하세요. Node 내장 기능이라 의존성이 추가되지 않습니다.
  ```bash
  node --experimental-test-coverage --import tsx --test tests/install-kit-golden.test.ts
  ```
  기대 결과: `agent-install-kit.ts`(또는 이동 후의 `runbook.ts`, `evaluation.ts`)의 branch 커버리지가 100%이거나, 빠진 분기를 설명할 수 있는 상태. 실제 `npm test` 스크립트가 tsx를 어떻게 부르는지 확인하고 같은 방식으로 맞추세요.
- **크기**: 약 120줄 이동이지만 순수 이동이라 `--color-moved`로 보면 약 15분. 20분을 넘길 것 같으면 runbook과 evaluation을 PR 두 개로 나눕니다.

### PR 6: 공통 헤더/출처 문구를 한 곳으로 (유일하게 "이동이 아닌" PR)

- **준비 (PR 전에 로컬에서)**: 복붙된 문구를 모두 찾아서 **서로 바이트가 같은지 기계로** 확인합니다. `grep -n "<출처 문구의 고유한 일부>" src/lib/install-kit/*.ts`로 위치를 찾고, 블록들을 파일로 떼어서 `diff`나 `shasum`으로 비교합니다.
  - 완전히 같은 복사본만 `src/lib/install-kit/common.ts`의 상수나 함수(`kitHeader(agent)`, `kitFooter(agent)`)로 바꿉니다.
  - 차이가 있는 복사본(예: 제목 줄만 다름)은 **그 차이를 인자로 받는** 헬퍼로 바꾸거나, 억지로 합치지 말고 그대로 둡니다. "거의 같으니 통일"은 곧 출력 변경이라 금지입니다.
- **특별 확인 (바이트가 바뀌기 쉬운 곳)**
  - 헤더와 본문 경계의 줄바꿈 개수입니다. `${header}\n\n${body}`처럼 조합할 때, 헤더 상수 끝에 `\n`이 있었는지 없었는지가 달라지기 쉽습니다.
  - 헤더 안의 보간(`${agent.name}` 등)이 호출 시점의 값을 쓰는지 봅니다. 모듈 수준 상수로 만들면 안 되고, 에이전트를 인자로 받는 함수여야 합니다.
- **표준 검증 + 추가 확인**: 골든 테스트가 실패하면 이 PR에서만큼은 골든을 고치는 것이 아니라 **코드를 고칩니다.** `UPDATE_GOLDENS=1`은 이 PR에서 절대 실행하지 않습니다. 골든 stat이 비어 있어야 한다는 공통 규칙이 이를 강제합니다.
- **크기**: 순감소 diff(복사본 N개 → 헬퍼 1개). 약 40~80줄. 동작 판단이 필요한 유일한 PR이니 리뷰어에게 "골든 stat 비어 있음"과 "diff-install-kits 결과"를 PR 설명에 붙여 달라고 요청합니다. 약 15~20분.
- **롤백**: `git revert`만 하면 됩니다. 이전 PR들과 독립적인 변경이라 이 PR만 되돌려도 PR 2~5는 유지됩니다.

### PR 7: `getInstallKitFiles`를 옮기고 `agent-install-kit.ts`를 순수 배럴로 정리

- **이동**: `getInstallKitFiles` → `src/lib/install-kit/index.ts`. 7개 파일 배열의 **순서와 `mimeType` 문자열**을 그대로 유지하고, 골든의 `_files.json`이 이를 지켜 줍니다.
- `agent-install-kit.ts`는 기존 공개 API만 re-export하는 파일이 됩니다. 원래 export 목록과 비교할 때는 다음 명령을 씁니다.
  ```bash
  git show origin/main~N:src/lib/agent-install-kit.ts | grep -oE "^export (async )?(function|const) \w+" | awk '{print $NF}' | sort > /tmp/before.txt
  # 배럴의 re-export 이름 목록을 /tmp/after.txt로 뽑아서
  diff /tmp/before.txt /tmp/after.txt   # 기대 결과: 차이 없음 (공개 API 이름 보존)
  ```
  (`origin/main~N`은 PR 1 머지 직후 커밋으로 바꾸세요. `to*File` 함수들을 원래 export했다면 그것도 목록에 포함됩니다.)
- **클라이언트 번들 확인 (2번 질문 관련)**: `grep -rnE "from \"(node:)?(fs|path|crypto)\"" src/lib/install-kit/`의 출력이 비어 있어야 합니다. `npm run build`가 통과하는 것도 함께 확인합니다.
- **크기**: 약 30~40줄. 약 5~10분.

---

## 3. 리스크

| 리스크 | 어떻게 나타나는가 | 잡아내는 검사 |
|---|---|---|
| 템플릿 리터럴을 옮기다 들여쓰기가 바뀜 | 외부 사용자의 AGENTS.md에 공백 diff가 생김 | 골든 바이트 비교, `diff-install-kits.sh`, `--color-moved-ws=no`로 공백 변경이 드러남 |
| 에디터나 포매터가 템플릿 안의 끝 공백이나 탭을 바꿈 | 눈에 보이지 않는 1바이트 차이 | 골든 바이트 비교(`Buffer.equals`). `.gitattributes -text`로 픽스처 쪽 변환도 차단 |
| "거의 같은" 헤더를 하나로 합침 (PR 6) | 특정 파일 한 종류의 첫 줄이나 빈 줄 수가 바뀜 | PR 6 준비 단계의 복사본 해시 비교, 골든 테스트, 골든 stat이 비어 있음 |
| `agent.json`의 키 순서나 들여쓰기 변경 | JSON 의미는 같지만 바이트가 다름 | `full`/`tricky` 픽스처의 `agent.json` 골든 |
| 픽스처가 못 덮는 분기가 실제 데이터에만 존재 | 골든은 통과하는데 실제 kit 하나가 달라짐 | `diff-install-kits.sh`(모든 실제 에이전트), PR 5 전의 커버리지 확인 |
| 작업 중 추가된 YAML 때문에 비교가 오염 | 코드 차이가 없는데도 diff가 발생(거짓 양성) | 스크립트가 base에 head의 `content/agents`를 복사. 골든은 고정 픽스처를 써서 영향 없음 |
| 새 YAML이 전에 없던 모양(예: 빈 runbook)을 가짐 | 리팩터링과 무관한 새 경로가 실행됨 | 해당 PR의 `diff-install-kits.sh`가 base와 head 양쪽에서 같은 데이터로 돌므로 코드 차이만 판정. 필요하면 픽스처를 추가하되 **PR 1 이후에는 추가만 하고 기존 골든은 수정 금지** |
| 다른 사람이 작업 중에 `agent-install-kit.ts`를 수정 | 리베이스 충돌, 또는 이동 전 위치에 변경이 남음 | 작업 기간(PR 2~7) 동안 이 파일을 수정 금지로 팀에 공지. 각 PR 전에 `git log origin/main --since=<PR1 날짜> -- src/lib/agent-install-kit.ts`의 출력이 비어 있는지 확인 |
| 배럴과 서브모듈 사이의 순환 import | 빌드나 테스트에서 `undefined is not a function`, TDZ 오류 | `grep -rn "agent-install-kit" src/lib/install-kit/`의 출력이 비어 있음, `npm test`, `npm run build` |
| 클라이언트 번들에 서버 전용 import가 들어감 | `npm run build` 실패 또는 번들 증가 | PR 7의 grep, `npm run build` |
| `generateStaticParams` 결과 변화 | `out/kits`에 파일이 빠지거나 추가됨 | `diff-install-kits.sh`가 해시 목록으로 파일 존재 여부까지 비교 |
| 사이트 URL/basePath의 env 차이 | 비교에서 모든 파일의 URL 줄이 다르게 나옴 | 두 빌드에 같은 env를 export(3번 질문). `_helpers.json` 골든 |

---

## 다음 액션

1. 위 세 가지 질문에 답해 주세요. 특히 1번(헤더 복사본이 완전히 같은지)은 `grep`과 `shasum`으로 5분이면 확인할 수 있습니다.
2. `src/types/agent.ts`와 `toRunbookFile`/`toEvaluationFile`의 분기를 보고 픽스처 필드를 확정합니다.
3. PR 1(골든 테스트, `diff-install-kits.sh`, `.gitattributes`)을 올리고, 일부러 공백 하나를 넣어 두 장치가 모두 실패하는지 확인한 결과를 PR 설명에 남깁니다.
4. 팀에 "PR 2~7 기간 동안 `src/lib/agent-install-kit.ts` 수정 금지, YAML 추가는 자유"라고 공지합니다.

## Later

- route.ts, 패널, 테스트의 import를 `@/lib/install-kit`로 옮기고 배럴 제거하기 (별도 PR, 선택 사항).
- `diff-install-kits.sh`를 CI 단계로 올리기 (PR마다 빌드가 두 번 돌아 CI 시간이 늘어나는 비용을 먼저 확인).
- `tests/fixtures/install-kit/`에 CODEOWNERS 걸기.
