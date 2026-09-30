# `agent-install-kit.ts` 리팩터링 계획

핵심 원칙은 두 가지입니다.

1. **먼저 안전망을 깔고 나서 코드를 옮깁니다.** 첫 PR에서는 코드를 한 줄도 옮기지 않고, 출력이 바이트 단위로 같은지 기계가 판정할 수 있는 장치만 만듭니다.
2. **옮기는 PR과 바꾸는 PR을 나눕니다.** 함수를 다른 파일로 옮기는 PR(순수 이동)과 복붙된 헤더/출처 문구를 하나로 합치는 PR(실제 로직 변경)을 절대 섞지 않습니다. 바이트 차이가 생길 수 있는 곳은 사실상 후자뿐이라서, 그 PR만 집중해서 보면 됩니다.

---

## 0. 가정

아래 가정이 틀리면 계획 일부를 조정해야 합니다.

- `getInstallKitFiles(agent)`는 순수 함수입니다. 입력은 agent 객체와 상수(basePath `/agentive`, 사이트 URL)뿐이고, 날짜·랜덤·환경변수에 의존하지 않습니다. (만약 빌드 시각 같은 값이 들어간다면 비교 전에 고정하거나 마스킹해야 합니다.)
- `out/kits/<slug>/<file>`의 내용은 `route.ts`의 GET이 `getInstallKitFiles`의 `content`를 그대로 반환한 결과입니다. 즉 "라이브러리 출력이 같으면 배포 파일도 같다"가 성립합니다.
- `agent-export-panel.tsx`는 URL/curl 헬퍼와 파일 목록만 쓰며, 본문 생성 로직에 따로 손대지 않습니다.
- 다른 사람들의 YAML 추가 작업은 `content/agents/`만 건드리고 `src/lib/`는 건드리지 않습니다.
- PR은 squash merge하고, 각 PR은 `main`에 들어가는 순간 배포될 수 있다고 봅니다. 그래서 **모든 중간 상태가 배포 가능해야** 합니다.

---

## 1. 동작 보존을 확인하는 장치 (모든 PR에서 공통 사용)

기존 테스트 20개는 파일 이름, URL, curl 문자열만 봅니다. **본문 내용은 검사하지 않으므로** 이번 리팩터링의 안전망으로는 부족합니다. 두 겹으로 보완합니다.

### 1-A. 골든(스냅샷) 테스트: 고정 fixture 기반, CI에서 매번 실행

- `tests/fixtures/install-kit/agents/*.ts`(또는 `.yaml`)에 **테스트 전용 가짜 agent 몇 개**를 둡니다. 실제 `content/agents/`를 쓰지 않는 이유는 다른 사람들이 YAML을 계속 추가·수정하기 때문입니다. 실제 데이터를 쓰면 리팩터링과 무관한 이유로 스냅샷이 깨집니다.
- fixture는 경계 조건을 골고루 포함해야 합니다.
  - 모든 선택 필드가 채워진 agent
  - 선택 필드가 최대한 비어 있는 agent (빈 배열, `undefined` → `list()` 헬퍼가 어떻게 동작하는지)
  - `isInstallable === false`인 agent
  - 한국어·이모지·백틱·`$`·`{}`·따옴표·줄 끝 공백이 들어간 문자열 (템플릿 리터럴과 curl 명령 이스케이프 확인용)
  - 여러 줄 instructions
- 각 fixture마다 7개 파일 출력을 `tests/fixtures/install-kit/golden/<fixture>/<file>`에 저장하고, 테스트는 `assert.strictEqual(actual, readFileSync(golden, "utf8"))`로 비교합니다. `Buffer` 비교까지 하면 더 확실합니다.
- 골든 갱신은 `UPDATE_GOLDEN=1 npm test`처럼 환경변수로만 가능하게 하고, **리팩터링 PR에서는 골든 파일이 diff에 나타나면 안 된다**는 규칙을 둡니다. 리뷰어는 "골든 파일 변경 0개"만 확인하면 됩니다.
- `.gitattributes`에 `tests/fixtures/install-kit/golden/** -text`를 추가합니다. 이렇게 해야 Git이나 Windows 체크아웃이 줄바꿈(CRLF)을 바꾸거나 파일 끝 개행을 건드려 골든이 틀어지는 일을 막을 수 있습니다.

### 1-B. 실제 전체 데이터 비교: 머지 기준 커밋 대비, PR마다 실행

골든 테스트는 fixture만 봅니다. 실제 agent 전체에 대해서도 한 번 더 확인합니다.

- `scripts/dump-install-kits.ts`(tsx로 실행, 새 의존성 없음)를 추가합니다. 모든 agent에 대해 `getInstallKitFiles`, `getInstallKitUrl`, `getInstallKitCommand`, `getInstallKitPath` 결과를 `<outDir>/<slug>/<name>`과 `<outDir>/<slug>/_meta.txt`로 씁니다.
- 비교할 때는 **같은 content로 코드만 바꿔서** 비교해야 합니다. YAML이 계속 추가되기 때문입니다. 브랜치의 merge-base를 기준으로 삼습니다.

```bash
# PR 브랜치에서
BASE=$(git merge-base HEAD origin/main)
git worktree add /tmp/kit-base "$BASE"
(cd /tmp/kit-base && npm ci && npx tsx scripts/dump-install-kits.ts /tmp/kits-before)
npx tsx scripts/dump-install-kits.ts /tmp/kits-after
diff -r /tmp/kits-before /tmp/kits-after && echo "IDENTICAL"
git worktree remove /tmp/kit-base
```

- 주의: dump 스크립트는 PR 1에서 들어오므로, PR 1 이후의 base에만 존재합니다. PR 1 자체는 1-C의 빌드 비교로 확인합니다.
- 브랜치를 main에 rebase해서 새 YAML이 들어온 경우에도 base와 head가 같은 content를 보므로 비교는 유효합니다.

### 1-C. 최종 산출물 비교: 빌드 결과물 `out/kits`

라우트 핸들러나 import 경로 변경이 있는 PR(주로 마지막 PR)에서는 실제 빌드 산출물도 비교합니다.

```bash
# base worktree에서
npm run build && (cd out/kits && find . -type f -exec shasum -a 256 {} + | sort -k2) > /tmp/kits-before.sha
# head에서
npm run build && (cd out/kits && find . -type f -exec shasum -a 256 {} + | sort -k2) > /tmp/kits-after.sha
diff /tmp/kits-before.sha /tmp/kits-after.sha && echo "IDENTICAL"
```

### 1-D. 매 PR 공통 체크리스트

```bash
npm run check:data && npm run lint && npm run typecheck && npm test && npm run build
# + 1-B dump diff (PR 2부터)
# + 골든 파일 diff 0줄 확인
git diff --stat origin/main -- tests/fixtures/install-kit/golden   # 출력이 없어야 함
```

---

## 2. PR 순서

각 PR의 예상 크기는 대략적인 값입니다. "순수 이동" PR은 diff 줄 수는 커도 리뷰가 빠릅니다. GitHub의 moved-lines 표시를 쓰거나 `git diff --color-moved=zebra`로 확인하면 됩니다.

### PR 1: 안전망 추가 (프로덕션 코드 변경 없음)

- 추가: fixture agent, 골든 파일, 골든 테스트, `scripts/dump-install-kits.ts`, `.gitattributes` 항목.
- 기존 `tests/agent-install-kit.test.ts`는 그대로 둡니다.
- **확인:** `src/` diff가 0줄이어야 합니다(`git diff --stat origin/main -- src` 결과가 비어 있음). 테스트 수가 20개에서 20+N개로 늘어나고 모두 통과해야 합니다.
- **자기 검증:** 골든 테스트가 실제로 차이를 잡는지 확인합니다. 로컬에서 `toRunbookFile`의 공백 하나를 일부러 바꿔 테스트가 실패하는 것을 본 뒤 되돌립니다. 이 결과를 PR 설명에 적어 둡니다.
- 리뷰 포인트: fixture가 경계 조건을 충분히 덮는지 여부. 골든 내용 자체는 "현재 출력"이므로 맞는지 틀리는지를 따질 필요가 없습니다.

### PR 2: 디렉터리 골격 + 내부 헬퍼 이동 (순수 이동)

- 생성: `src/lib/install-kit/shared.ts`. 여기로 `list`, `agentInstructions`, `getAgentPageUrl`를 **그대로** 옮깁니다(export만 추가).
- `src/lib/agent-install-kit.ts`는 이 헬퍼들을 `./install-kit/shared`에서 import합니다.
- 공개 API와 호출처는 변경하지 않습니다.
- **확인:** 1-D + 1-B diff. `git diff --color-moved`에서 이동 블록 외의 변경이 import 줄뿐이어야 합니다.

### PR 3: URL/경로/curl 헬퍼 분리 (순수 이동)

- 생성: `src/lib/install-kit/urls.ts`. 여기로 `isInstallable`, `getInstallKitPath`, `getInstallKitUrl`, `getInstallKitCommand`와 basePath/사이트 URL 상수를 옮깁니다.
- `agent-install-kit.ts`에서 `export { ... } from "./install-kit/urls"`로 재노출합니다. 따라서 `agent-export-panel.tsx`와 기존 테스트의 import는 바뀌지 않습니다.
- 파일 이름 목록(`AGENTS.md`, …, `EVALUATION.md`)이 curl의 `{a,b,c}`와 `getInstallKitFiles` 양쪽에서 쓰인다면, 이 PR에서는 **아직 합치지 않습니다**. 순서가 같다는 보장이 테스트로 확인될 때 PR 7에서 다룹니다.
- **확인:** 1-D + 1-B(`_meta.txt`에 URL/curl이 들어 있으므로 함께 비교됨). 추가로 `agent-export-panel.tsx`가 클라이언트 컴포넌트라면, `urls.ts`가 Node 전용 모듈(`fs`, `path`)을 끌어오지 않는지 빌드 로그에서 확인합니다.

### PR 4: 에이전트 지시문 파일 3종 분리 (순수 이동)

- `install-kit/codex.ts`(`toCodexAgentFile`), `install-kit/claude.ts`(`toClaudeProjectFile`), `install-kit/cursor.ts`(`toCursorRuleFile`)를 만듭니다.
- 이 단계에서는 복붙된 헤더/출처 문구를 **각 파일에 그대로 둡니다.**
- **확인:** 1-D + 1-B.

### PR 5: manifest + README 분리 (순수 이동)

- `install-kit/manifest.ts`(`toInstallManifest`), `install-kit/readme.ts`(`toInstallReadme`)를 만듭니다.
- `agent.json`은 `JSON.stringify`의 키 순서와 들여쓰기(인자), 끝 개행 여부가 바이트에 영향을 줍니다. 이동 중에 객체 리터럴의 키 순서를 바꾸지 않도록 주의합니다.
- **확인:** 1-D + 1-B.

### PR 6: RUNBOOK + EVALUATION 분리 (순수 이동)

- `install-kit/runbook.ts`, `install-kit/evaluation.ts`를 만듭니다(각 약 60줄).
- **확인:** 1-D + 1-B.

이 시점에서 `agent-install-kit.ts`에는 `getInstallKitFiles`와 re-export만 남습니다.

### PR 7: 조립부 이동 + 진입점 정리

- `install-kit/index.ts`에 `getInstallKitFiles`와 공개 API 재노출을 둡니다.
- `src/lib/agent-install-kit.ts`는 **삭제하지 않고** `export * from "./install-kit"` 한 줄짜리 호환 파일로 남깁니다. 호출처 import를 새 경로로 바꿀지는 선택이며, 바꾸더라도 같은 PR에서 3곳 모두 바꿉니다.
- 파일 순서(7개 배열 순서)와 `mimeType` 값을 그대로 유지합니다. `generateStaticParams`가 이 순서에 의존할 수 있습니다.
- **확인:** 1-D + 1-B + **1-C(빌드 산출물 sha 비교)**. 라우트가 import하는 경로가 바뀌므로 이 PR에서는 빌드 비교를 반드시 합니다.

### PR 8: 공통 헤더/푸터 통합 (유일한 로직 변경 PR)

- `install-kit/shared.ts`에 `renderHeader(agent, opts)`와 `renderSourceFooter(agent, opts)` 같은 함수를 만들고, 각 파일 생성기가 이를 쓰도록 바꿉니다.
- **가장 큰 리스크:** "복붙"된 문구가 실제로는 파일마다 미세하게 다를 가능성이 높습니다. 공백, 빈 줄 수, 마침표, 링크 텍스트, 상대 URL과 절대 URL 차이 같은 것들입니다. 작업 순서는 이렇습니다.
  1. 먼저 7개 생성기의 헤더/푸터 부분을 나란히 놓고 차이 목록을 PR 설명에 표로 적습니다.
  2. 차이가 있으면 **통일하지 않고** 파라미터로 표현합니다(예: `{ trailingBlankLine: true }`). 통일하면 출력이 바뀌므로 "기능 변경 없음" 목표를 어깁니다. 문구 통일은 이 작업 밖의 별도 결정으로 넘깁니다.
  3. 파라미터가 너무 많아져 오히려 읽기 어려워지는 문구는 공유하지 않고 그대로 둡니다.
- 커지면 둘로 나눕니다: 8a 헤더, 8b 푸터(출처 문구).
- **확인:** 1-D + 1-B + 1-C. 이 PR은 골든 테스트가 가장 큰 역할을 하는 단계입니다.

### (선택) PR 9: 정리

- 기존 `tests/agent-install-kit.test.ts`의 검사를 모듈별 테스트 파일로 나눌지 결정합니다. 나누더라도 기존 assertion은 하나도 지우지 않습니다.
- `scripts/dump-install-kits.ts`는 이후 변경에도 유용하므로 남기는 쪽을 권합니다. 남긴다면 `package.json`에 `"kits:dump"` 스크립트를 추가합니다.
- `agent-install-kit.ts` 호환 파일을 없앨지 결정합니다. 외부에서 이 경로를 import하는 곳이 없다면 없애도 되지만, 필요하지 않다면 남겨도 비용이 거의 없습니다.

---

## 3. 롤백

- **각 PR은 squash merge된 커밋 하나**이므로 `git revert <sha>` 후 새 PR로 되돌립니다. PR 2~7은 출력이 동일하므로 되돌려도 배포 파일이 바뀌지 않습니다. 순서 의존성이 있어서 뒤의 PR부터 역순으로 revert해야 합니다.
- **배포 후 바이트 차이가 발견된 경우(가장 중요한 시나리오):**
  1. 즉시 해당 PR을 revert하고 main에 머지합니다. GitHub Pages는 다음 배포에서 원래 파일로 돌아갑니다.
  2. 더 빠르게 복구해야 한다면 Actions에서 직전 성공 배포 워크플로를 re-run하는 방법도 있습니다. 단, 그 사이 추가된 YAML이 빠질 수 있으므로 revert가 기본입니다.
  3. 원인이 된 입력을 fixture에 추가해서 골든 테스트가 다음에는 잡도록 합니다.
- 데이터나 스키마 변경이 없으므로 마이그레이션 롤백은 필요 없습니다.
- PR 1(테스트만 추가)은 롤백할 이유가 거의 없지만, 골든 테스트가 불안정하면 테스트만 revert해도 됩니다.

---

## 4. 리스크와 대응

| 리스크 | 가능성 | 영향 | 대응 |
|---|---|---|---|
| 복붙된 헤더/출처 문구가 실제로는 미세하게 달라서 통합 시 출력이 바뀜 | 높음 | 높음 (외부 사용자 AGENTS.md diff) | PR 8 분리, 차이 표 작성, 파라미터화, 골든 + 전체 dump 비교 |
| 에디터/포매터가 템플릿 리터럴 안의 줄 끝 공백이나 들여쓰기를 바꿈 | 중간 | 높음 | 이동 시 복사-붙여넣기가 아닌 잘라내기 + `--color-moved` 확인, 골든 테스트, 해당 파일에 포매터 저장 시 자동 정리를 끄거나 `.editorconfig` 확인 |
| 템플릿 리터럴을 옮기면서 들여쓰기 레벨이 바뀜(함수 안 → 모듈 최상위 등) | 중간 | 높음 | 여러 줄 템플릿은 들여쓰기 그대로 이동, 1-B diff |
| `JSON.stringify` 키 순서/들여쓰기 변경 | 낮음 | 중간 | PR 5에서 객체 리터럴 수정 금지, `agent.json` 골든 |
| 파일 끝 개행 또는 CRLF 차이 | 낮음 | 중간 | `.gitattributes -text`, `Buffer` 비교 |
| 순환 import (`shared` ↔ 생성기 ↔ `index`) | 중간 | 낮음 (빌드 실패로 바로 드러남) | 의존 방향 고정: `shared`/`urls` ← 생성기 ← `index` ← `agent-install-kit.ts`. `shared`는 다른 install-kit 모듈을 import하지 않음 |
| 클라이언트 번들에 서버 전용 코드가 섞이거나 번들 크기 증가 | 낮음 | 낮음 | `urls.ts`를 가볍게 유지, 빌드 로그 확인 |
| 병행 YAML 추가로 rebase 충돌 또는 비교 기준 혼동 | 중간 | 낮음 | `src/lib`만 건드리므로 충돌은 드묾, 비교는 항상 merge-base 기준 |
| 새로 추가된 YAML이 fixture에 없는 형태(새 필드, 특이 문자)를 가짐 | 중간 | 중간 | 1-B의 실제 전체 데이터 비교가 보완 |
| 리팩터링 도중 다른 사람이 `agent-install-kit.ts`를 수정 | 낮음 | 중간 | 작업 기간 동안 팀에 공지, 가능하면 CODEOWNERS 또는 PR 설명에 "이 파일 변경 시 알려 주세요" |
| PR이 20분을 넘김 | 중간 | 낮음 | 순수 이동은 `--color-moved`로 빠르게 리뷰 가능, PR 8은 필요하면 8a/8b로 분할 |

---

## 5. 다음 액션

1. **현재 코드 확인 (30분):** `agent-install-kit.ts`에서 복붙된 헤더/출처 문구를 모두 찾아 차이를 표로 정리합니다. PR 8의 난이도가 여기서 결정됩니다. 날짜, 환경변수 같은 비결정적 입력이 있는지도 함께 확인합니다(가정 1 검증).
2. **fixture 설계:** 실제 `content/agents/`에서 가장 필드가 많은 agent와 가장 적은 agent 한두 개를 골라 fixture의 출발점으로 삼고, 특수 문자 케이스를 추가합니다.
3. **PR 1 작성:** 골든 테스트, dump 스크립트, `.gitattributes`. "일부러 깨뜨려서 테스트가 잡는지" 확인한 결과를 PR 설명에 포함합니다.
4. **팀 공지:** 작업 기간 동안 `src/lib/agent-install-kit.ts` 수정은 먼저 알려 달라고 요청합니다. YAML 추가는 계속해도 된다고 명시합니다.
5. **PR 설명 템플릿 준비:** PR 2~8에 공통으로 "1-D 결과, 1-B `diff -r` 결과(IDENTICAL), 골든 diff 0줄" 세 가지를 붙이도록 합니다. 리뷰어는 이 세 줄과 구조 변경만 보면 됩니다.
