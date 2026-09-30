# Agent Archive 배포 전 보안 점검 체크리스트

## 0. 전제로 둔 가정

설명해 주신 구조를 바탕으로 아래를 가정했습니다. 하나라도 틀리면 해당 항목의 위험도가 달라집니다.

- **A1.** 런타임 서버가 없습니다. 배포물은 `out/`에 생성된 정적 파일뿐이고, route handler(`kits/[slug]/[file]`)도 빌드할 때 파일로 굳어집니다.
- **A2.** 사이트 origin은 `https://yohan-work.github.io`입니다(커스텀 도메인 없음). **같은 계정의 다른 GitHub Pages 프로젝트도 이 origin을 함께 씁니다.**
- **A3.** CI는 `pull_request` 트리거로 돌고 `pull_request_target`은 쓰지 않습니다. Deploy는 `workflow_run`(CI 완료) 또는 `push` 트리거입니다.
- **A4.** 저장소와 워크플로 어디에도 비밀값(API 키, PAT)이 필요하지 않습니다.
- **A5.** 에이전트 텍스트는 React JSX로 렌더됩니다. 기본값이 이스케이프이고, 마크다운 렌더러나 `dangerouslySetInnerHTML`은 쓰지 않는다고 봤습니다. 쓴다면 2장의 항목이 가장 중요해집니다.
- **A6.** 이 프로젝트에서 가장 현실적인 위협은 브라우저 XSS가 아닙니다. **외부 기여 YAML이 설치 키트를 거쳐 사용자의 AI 코딩 에이전트에 지시문으로 주입되는 것**(공급망·프롬프트 인젝션)과 **GitHub Actions 권한 오남용**입니다.

---

## 1. 사용 방법

- **[매 PR]** 항목은 PR 템플릿에 넣고, **[릴리스/월 1회]** 항목은 정기 점검 이슈로 돌리는 것을 권장합니다.
- 각 항목은 `확인 방법`과 `통과 기준`으로 구성했습니다. 통과 기준을 만족하지 못하면 머지하지 않거나, 이유를 PR 본문에 적고 예외로 처리합니다.

---

## 2. 입력 처리 · XSS · 주입

### 2-1. [릴리스] HTML 원문 삽입 경로가 없는지
- **확인 방법:** `grep -rnE "dangerouslySetInnerHTML|innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function" src/`
- **통과 기준:** 결과가 0건입니다. 예외(예: JSON-LD)는 아래 2-2 기준을 만족하고, 목록으로 문서화되어 있어야 합니다.

### 2-2. [릴리스] JSON-LD 또는 인라인 `<script>`에 콘텐츠가 들어가는 경우
- **확인 방법:** `<script type="application/ld+json">` 같은 곳에 에이전트 이름이나 설명을 `JSON.stringify`로 넣는지 확인합니다. 그런 곳이 있으면 YAML 테스트 픽스처에 `</script><script>alert(1)</script>`를 넣고 빌드한 뒤 `out/`의 HTML을 확인합니다.
- **통과 기준:** 결과물에 `</script`가 그대로 남지 않아야 합니다. `<`는 `<`로 치환되어 있어야 합니다.

### 2-3. [매 PR] 콘텐츠 안의 URL 필드(링크, 출처, 저자 URL 등)
- **확인 방법:** 스키마에서 URL 필드에 `format: "uri"`와 `pattern: "^https://"`가 걸려 있는지 확인합니다. 렌더링하는 `<a href>`에 `javascript:`나 `data:`가 들어갈 수 없는지도 확인합니다. 외부 링크에는 `rel="noopener noreferrer"`가 붙어야 합니다.
- **통과 기준:** `href`로 쓰이는 필드는 모두 스키마에서 `https://`만 허용합니다. `javascript:` 픽스처는 `check:data`에서 실패해야 합니다.

### 2-4. [매 PR] 스키마가 닫혀 있는지 (ajv)
- **확인 방법:** `schema/agent.schema.json`의 모든 object에 `additionalProperties: false`가 있는지 봅니다. 문자열에는 `maxLength`, 배열에는 `maxItems`가 있어야 합니다. `slug`에는 `^[a-z0-9]+(-[a-z0-9]+)*$` 패턴과 "파일명 = slug" 검사가 있어야 합니다.
- **통과 기준:** 알 수 없는 필드, 초장문(예: prompt 20k자 초과), 경로 문자(`/`, `..`, `%`)가 들어간 slug는 모두 CI에서 실패합니다.

### 2-5. [릴리스] YAML 파서 안전성
- **확인 방법:** 사용하는 라이브러리를 확인합니다. `js-yaml` v4의 `load`는 기본 스키마가 안전합니다. `yaml` 패키지라면 `maxAliasCount`를 확인합니다. 앵커/별칭 폭탄(billion laughs) 픽스처로 `npm run content`를 돌려 봅니다.
- **통과 기준:** 커스텀 태그(`!!js/function` 등)가 거부되고, 별칭 폭탄은 몇 초 안에 에러로 끝나야 합니다. 멈추거나 메모리가 폭주하면 실패입니다.

### 2-6. [릴리스] 검색 쿼리(`/agents?query=`)
- **확인 방법:** `query`가 쓰이는 곳을 모두 grep합니다. input `value` 말고 다른 용도가 있는지, 특히 하이라이트용 `new RegExp(query)`, `href` 조립, 문서 `title` 설정 등이 있는지 봅니다.
- **통과 기준:** `RegExp`에 넣는다면 반드시 이스케이프해야 합니다(ReDoS와 오류 방지). `query`로 URL이나 HTML을 조립하지 않아야 합니다. `?query=<img src=x onerror=alert(1)>` 로 접속해도 텍스트로만 보여야 합니다.

### 2-7. [릴리스] 북마크 localStorage
- **확인 방법:** 파싱 코드가 `Array.isArray`를 검사한 뒤, 각 원소가 string이고 slug 패턴에 맞으며 실제로 존재하는 slug인지 필터링하는지 확인합니다. DevTools에서 값을 `[{"a":1},"../../x","<b>x</b>"]`로 바꾼 뒤 새로고침해 봅니다.
- **통과 기준:** 알 수 없는 값은 조용히 버립니다. 링크는 존재하는 slug로만 만들어집니다. 에러로 화면이 깨지지 않아야 합니다.
- **참고:** 가정 A2 때문에 `yohan-work.github.io`의 다른 프로젝트도 이 localStorage를 읽고 쓸 수 있습니다. 저장값은 신뢰하지 않는 입력으로 취급해야 합니다.

### 2-8. [릴리스] 제출 폼 (/submit)
- **확인 방법:**
  - 이슈 URL의 host와 path가 상수이고, `template=new-agent.yml`이 하드코딩되어 있는지 확인합니다. 사용자 입력은 `URLSearchParams` 값으로만 들어가야 합니다.
  - 7000자 자르기를 **인코딩 전 문자열 기준**으로 할 경우, 서로게이트 쌍(이모지)이나 한글 중간에서 잘려 깨진 문자가 생기지 않는지 봅니다.
  - `/submit?name=...`처럼 쿼리로 폼을 미리 채우는 기능이 있는지도 확인합니다. 있다면 공격자가 악성 프롬프트를 미리 채운 링크를 퍼뜨릴 수 있습니다.
- **통과 기준:** 이슈 URL의 origin이 `https://github.com`으로 고정되어 있습니다. 이모지와 한글이 섞인 초장문을 넣어도 URL이 유효합니다. 폼에 "제출 내용은 공개 이슈가 됩니다"라는 안내가 있습니다.

### 2-9. [릴리스] 이슈 → 자동화 연결
- **확인 방법:** `new-agent` 이슈를 입력으로 받는 워크플로가 있는지 확인합니다(예: 이슈 본문을 YAML이나 PR로 바꾸는 봇). 있다면 `run:` 안에 `${{ github.event.issue.body }}` 또는 `title`을 직접 보간하고 있는지 봅니다.
- **통과 기준:** 그런 워크플로가 없거나, 있다면 값을 `env:`로 전달하고 셸에서는 `"$BODY"`로만 참조합니다. 이슈 본문이 셸 인젝션의 입력이 될 수 없어야 합니다.

---

## 3. 설치 키트와 프롬프트 인젝션 (최우선)

사용자가 `curl`로 받은 파일은 **사용자 저장소에서 권한을 가진 AI 에이전트의 시스템 지시문**이 됩니다. 이 사이트에서 사용자에게 가장 크게 영향을 주는 경로입니다.

### 3-1. [매 PR] 보이지 않는 문자와 방향 제어 문자
- **확인 방법:** 변경된 YAML을 대상으로 아래를 실행합니다.
  ```bash
  git diff --name-only origin/main -- content/agents | xargs -r \
    grep -nP '[\x{200B}-\x{200F}\x{202A}-\x{202E}\x{2060}-\x{2064}\x{2066}-\x{2069}\x{FEFF}\x{E0000}-\x{E007F}]'
  ```
  `check:data`에 같은 검사를 넣는 것이 가장 좋습니다.
- **통과 기준:** 0건입니다. zero-width, bidi 제어 문자(Trojan Source), Unicode tag 문자는 모두 거부합니다.

### 3-2. [매 PR] 숨은 지시문과 위험한 지시문
- **확인 방법:** 변경된 prompt, 설명, 예시 텍스트를 **렌더된 키트 파일 기준으로** 끝까지 읽습니다. 로컬에서 `out/kits/<slug>/AGENTS.md`를 열면 됩니다. 아래 키워드를 grep해서 보조로 씁니다.
  `ignore (all|previous)`, `system prompt`, `curl`, `wget`, `| sh`, `bash -c`, `base64`, `eval`, `.env`, `secret`, `token`, `id_rsa`, `~/.ssh`, `npm publish`, `git push`, `--force`, `http://`, `https://`(외부 URL), `<!--`, 긴 base64/hex 블록
- **통과 기준:**
  - HTML 주석이나 접힌 블록에 숨은 지시문이 없습니다.
  - 네트워크 전송, 원격 스크립트 실행, 비밀값 읽기, 푸시/배포/삭제를 지시하는 문장이 없습니다. 에이전트 목적상 필요하다면 "사용자 확인 후"라는 조건이 붙어 있어야 합니다.
  - 외부 URL은 목적이 설명된 공식 문서 링크뿐입니다.
  - prompt가 에이전트의 선언된 역할(summary)을 벗어난 행동을 지시하지 않습니다.

### 3-3. [매 PR] 기존 에이전트 수정 PR
- **확인 방법:** 신규 추가보다 **기존 prompt를 조금 바꾸는 PR**을 더 엄격하게 봅니다. 이미 사용자가 신뢰하고 받아 가는 파일이기 때문입니다. `git diff --word-diff`로 바뀐 문장만 봅니다.
- **통과 기준:** 바뀐 문장마다 PR 본문에 이유가 있습니다. 행동 범위를 넓히는 변경(새 도구, 새 명령, 새 URL)은 별도 승인 대상으로 표시합니다.

### 3-4. [릴리스] 키트 생성기(`agent-install-kit.ts`)가 콘텐츠로 구조를 깰 수 없는지
- **확인 방법:** 콘텐츠에 `---`(frontmatter 구분자), `globs:`, `alwaysApply: true`, `# ` 헤딩, 코드펜스 ```` ``` ````를 넣은 픽스처로 `.mdc`와 `CLAUDE.md`를 생성합니다.
- **통과 기준:** 콘텐츠가 Cursor `.mdc` frontmatter를 끝내거나 새로 만들 수 없어야 합니다. 예를 들어 `alwaysApply`나 `globs: "**/*"`를 주입할 수 없어야 합니다. frontmatter 값은 스키마에서 온 제한된 필드로만 만들고, 본문 텍스트는 frontmatter 바깥에만 들어가야 합니다.

### 3-5. [릴리스] 키트 파일의 출처 표시
- **확인 방법:** 생성된 키트 상단에 출처 URL, 에이전트 slug, 빌드 커밋 SHA, "붙여넣기 전에 내용을 검토하세요"라는 문구가 있는지 봅니다.
- **통과 기준:** 모든 키트 파일에 출처와 커밋 SHA가 있습니다. 설치 안내 페이지의 `curl` 예시는 `curl -fsSL URL -o AGENTS.md` 뒤에 "열어서 확인" 단계를 둡니다. `| sh`나 자동 append 한 줄 명령은 제공하지 않습니다.

### 3-6. [릴리스] 키트 route의 정적 출력
- **확인 방법:** `npm run build` 후 `find out/kits -type f | sed 's/.*\.//' | sort | uniq -c`로 확장자를 봅니다. 배포 후에는 `curl -sI https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md`로 Content-Type을 봅니다.
- **통과 기준:**
  - **static export에서는 route handler의 `headers`가 배포에 반영되지 않습니다.** GitHub Pages는 확장자로 Content-Type을 정합니다. 따라서 키트 파일명이 `.md`, `.mdc`, `.txt`만 가능하도록 파일 목록이 코드 상수로 고정되어 있어야 합니다. `.html`, `.svg`, `.xml`, `.js` 파일명이 생성되면 실패입니다(같은 origin에서 스크립트가 실행되는 경로가 되기 때문).
  - `[file]` 값은 콘텐츠가 아니라 코드 상수에서만 옵니다.
  - 존재하지 않는 조합은 파일이 생성되지 않습니다(`dynamicParams = false` 확인).

---

## 4. 공급망: 의존성과 외부 기여

### 4-1. [매 PR] lockfile 변경
- **확인 방법:** 외부 기여 PR이 `package.json`이나 `package-lock.json`을 건드렸는지 봅니다. 건드렸다면 `npx lockfile-lint --path package-lock.json --type npm --allowed-hosts npm --validate-https --validate-integrity`를 돌립니다.
- **통과 기준:** 콘텐츠 PR은 lockfile을 건드리지 않습니다(건드리면 반려). 의존성 PR에서는 모든 `resolved`가 `https://registry.npmjs.org/`이고 `integrity`가 있어야 합니다.

### 4-2. [릴리스] 취약점
- **확인 방법:** `npm audit --omit=dev`와 `npm audit`를 돌리고, GitHub의 Dependabot alerts 탭을 봅니다.
- **통과 기준:** 배포물에 포함되는 런타임 의존성에 high/critical이 0건입니다. dev 의존성의 high/critical은 "빌드 환경에서만 실행되고 비밀값이 없다"는 근거와 함께 기록합니다.
- **참고:** Next.js 보안 공지는 대부분 서버 기능(middleware, 이미지 최적화, Server Actions)에 대한 것이라 정적 export에는 영향이 적습니다. 그래도 패치 버전은 따라가는 것이 기본입니다.

### 4-3. [릴리스] Dependabot 설정의 빈틈
- **확인 방법:** `.github/dependabot.yml`에 `github-actions` 생태계도 포함되어 있는지 봅니다. Settings → Code security에서 **Dependabot security updates**가 켜져 있는지도 봅니다.
- **통과 기준:** 버전 업데이트에서 major를 빼는 것과 별개로, 보안 업데이트는 켜져 있습니다. **보안 수정이 major 업그레이드를 요구하면 그룹 설정 때문에 PR이 오지 않을 수 있으므로**, 월 1회 alerts 탭을 직접 확인합니다.

### 4-4. [릴리스] 설치 스크립트
- **확인 방법:** `npm ci` 로그나 `npm query ':attr(scripts, [postinstall])'`로 install 스크립트가 있는 패키지를 확인합니다.
- **통과 기준:** 목록이 지난 점검 때와 같거나, 새로 생긴 항목의 이유를 설명할 수 있습니다.

### 4-5. [매 PR] 콘텐츠 PR의 변경 범위
- **확인 방법:** `git diff --name-only origin/main...HEAD`
- **통과 기준:** 에이전트 추가/수정 PR은 `content/agents/*.yaml`(필요하면 `evals/`)만 바꿉니다. `.github/`, `scripts/`, `src/`, `package*.json`, `schema/`가 섞여 있으면 분리를 요청합니다. `CODEOWNERS`로 `.github/`와 `scripts/`는 본인 승인을 필수로 합니다.

---

## 5. GitHub Actions 권한

### 5-1. [릴리스] 기본 토큰 권한
- **확인 방법:** 모든 워크플로 최상단에 `permissions: contents: read`(또는 `{}`)가 있는지 봅니다. Settings → Actions → General → Workflow permissions가 "Read repository contents"인지도 봅니다.
- **통과 기준:** CI 워크플로는 read-only입니다. `pages: write`와 `id-token: write`는 **Deploy의 deploy job에만** job 단위로 부여되고, build job에는 없습니다.

### 5-2. [릴리스] 포크 PR 실행 경로
- **확인 방법:** `grep -rn "pull_request_target\|workflow_run" .github/workflows`
- **통과 기준:**
  - `pull_request_target`이 없습니다. 있다면 PR head를 checkout하지 않아야 합니다.
  - Deploy가 `workflow_run`이라면 조건이 `github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.event == 'push' && github.event.workflow_run.head_branch == 'main' && github.event.workflow_run.head_repository.full_name == github.repository` 형태입니다. **CI run이 만든 artifact를 내려받아 배포하지 않고, main을 다시 checkout해서 빌드합니다.** 포크 PR의 CI artifact가 배포로 흘러가는 경로를 막기 위해서입니다.

### 5-3. [릴리스] Action 고정
- **확인 방법:** `grep -rn "uses:" .github/workflows`
- **통과 기준:** 서드파티 action은 커밋 SHA로 고정합니다(`@<40자 sha> # v4.x.x`). `actions/*` 공식 action도 SHA 고정을 권장합니다. Dependabot `github-actions`가 이를 갱신합니다.

### 5-4. [릴리스] checkout 자격증명
- **확인 방법:** `actions/checkout`에 `persist-credentials: false`가 있는지 봅니다.
- **통과 기준:** 빌드 단계(npm 스크립트, 서드파티 코드 실행)에서 `GITHUB_TOKEN`이 `.git/config`에 남아 있지 않습니다.

### 5-5. [릴리스] 저장소 보호 설정
- **확인 방법:** Settings에서 아래를 확인합니다.
  - Branches/Rulesets: main 보호
  - Environments: `github-pages`
  - Actions: 포크 PR 워크플로 승인 정책
- **통과 기준:**
  - main에 직접 push와 force push가 금지되고, CI 통과가 필수입니다.
  - `github-pages` environment의 deployment branch가 `main`만 허용합니다.
  - "Require approval for all outside collaborators"(최소 first-time contributors)가 켜져 있습니다.

### 5-6. [매 PR] 워크플로 스크립트 인젝션
- **확인 방법:** `grep -rnE '\$\{\{\s*github\.(event|head_ref)' .github/workflows`
- **통과 기준:** `run:` 블록 안에 PR 제목, 브랜치명, 이슈 본문 같은 외부 제어 값이 직접 보간되지 않습니다. 필요하면 `env:`를 거칩니다.

---

## 6. 비밀값

### 6-1. [릴리스] 저장소 전체 스캔
- **확인 방법:** Settings → Code security에서 **Secret scanning**과 **Push protection**을 켭니다. 로컬에서는 `gitleaks detect --source . --log-opts="--all"`를 한 번 돌립니다.
- **통과 기준:** 탐지 0건입니다. 오탐은 `.gitleaksignore`에 이유와 함께 기록합니다.

### 6-2. [매 PR] 클라이언트 번들 노출
- **확인 방법:** `grep -rn "NEXT_PUBLIC_\|process.env" src/`, `ls -a | grep .env`, `git ls-files | grep -i "\.env"`를 돌립니다. 빌드 후에는 `grep -rIE "(ghp_|github_pat_|sk-|AKIA)[A-Za-z0-9]" out/`로 확인합니다.
- **통과 기준:** `NEXT_PUBLIC_`에는 공개해도 되는 값만 있습니다. `.env*`는 커밋되지 않고 `.gitignore`에 포함되어 있습니다. `out/`에서 토큰 패턴이 0건입니다.

### 6-3. [매 PR] 콘텐츠 속 비밀값
- **확인 방법:** 기여 YAML의 예시 입력/출력에 실제처럼 보이는 키, 내부 URL, 개인 이메일, 전화번호가 있는지 봅니다. 6-1의 gitleaks가 `content/`도 스캔합니다.
- **통과 기준:** 예시 값은 명백한 placeholder(`sk-XXXX`, `example.com`)만 씁니다.

---

## 7. 로깅과 데이터 노출

### 7-1. [릴리스] 서드파티 요청
- **확인 방법:** 배포된 페이지를 DevTools Network 탭에서 "3rd-party requests" 필터로 봅니다. `out/`에서 `grep -rhoE 'https?://[a-zA-Z0-9.-]+' out/ | sort -u`도 돌립니다.
- **통과 기준:** 폰트, 분석, 이미지 등 외부 origin 요청이 0건입니다(`next/font`는 셀프 호스팅). 분석 도구를 쓴다면 목록과 수집 항목을 README에 공개합니다.

### 7-2. [릴리스] URL에 담기는 사용자 입력
- **확인 방법:** 검색어가 URL 쿼리에 남고, 외부 링크를 클릭할 때 Referer로 전달되는지 봅니다.
- **통과 기준:** `<meta name="referrer" content="strict-origin-when-cross-origin">` 이상이 설정되어 있습니다(브라우저 기본값이지만 명시). 제출 폼에는 "입력 내용이 GitHub URL과 공개 이슈에 담긴다"는 안내가 있습니다.

### 7-3. [릴리스] 빌드 산출물
- **확인 방법:** `find out -name "*.map"`, `ls out/`으로 빌드 산출물을 확인합니다. `sitemap.xml`에 포함된 URL 목록도 봅니다.
- **통과 기준:**
  - 배포물에 내부 문서(`docs/`, `evals/` 원자료, `.eval-work` 등)나 초안 에이전트가 섞이지 않습니다.
  - `sitemap.xml`의 base URL은 상수(`https://yohan-work.github.io/agentive/`)이고, 실제 공개 페이지만 담습니다.
  - `robots.txt`에 숨기고 싶은 경로를 나열하지 않습니다. robots는 접근 제어가 아니라 오히려 경로를 알려 주는 파일입니다.
  - 공개 저장소라 source map 자체는 민감하지 않지만, 켜 둘지는 의도적으로 결정합니다.

### 7-4. [릴리스] CI 로그
- **확인 방법:** 최근 Actions 로그를 훑어봅니다.
- **통과 기준:** 환경 변수 전체를 덤프하는 단계(`env`, `printenv`, `set -x`에 토큰 포함)가 없습니다.

---

## 8. 보안 헤더 (GitHub Pages 제약)

GitHub Pages에서는 HTTP 응답 헤더를 설정할 수 없습니다. 할 수 있는 일은 `<meta>` 태그와 저장소 설정뿐입니다.

### 8-1. [릴리스] HTTPS 강제
- **확인 방법:** Settings → Pages에서 "Enforce HTTPS"를 확인하고, `curl -sI http://yohan-work.github.io/agentive/`를 실행합니다.
- **통과 기준:** 설정이 켜져 있고, 301로 https로 이동합니다.

### 8-2. [릴리스] 현재 헤더 기준선 기록
- **확인 방법:** `curl -sI https://yohan-work.github.io/agentive/en/`의 결과(HSTS, `x-content-type-options` 등 GitHub가 기본으로 주는 헤더)를 저장해 둡니다.
- **통과 기준:** 기준선이 문서로 남아 있고, 헤더가 바뀌면 알아챌 수 있습니다.

### 8-3. [릴리스] meta CSP (선택, 권장)
- **확인 방법:** `<meta http-equiv="Content-Security-Policy">`를 넣을 수 있는지 검토합니다. Next.js static export는 인라인 스크립트(`self.__next_f.push`)를 만들기 때문에 `script-src 'self' 'unsafe-inline'`이 현실적인 하한선입니다.
- **통과 기준(최소):** `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action https://github.com`
  적용 후 모든 페이지에서 콘솔에 CSP 위반이 0건이어야 합니다.
  `'unsafe-inline'` 때문에 XSS 방어 효과는 제한적입니다. 그래도 외부 스크립트 로드, `<base>` 탈취, 외부 전송은 막습니다.
- **한계:** meta CSP로는 `frame-ancestors`(클릭재킹 방어)를 설정할 수 없습니다. 이 사이트에는 로그인이나 상태 변경 동작이 없으므로 수용 가능한 리스크로 기록합니다.

### 8-4. [릴리스] 공유 origin
- **확인 방법:** 같은 계정(`yohan-work`)의 다른 Pages 저장소 목록을 봅니다.
- **통과 기준:** 다른 프로젝트에 XSS가 생기면 이 사이트의 localStorage도 조작될 수 있다는 점을 인지하고 있습니다(2-7 방어로 충분한지 판단). 장기적으로는 커스텀 도메인(예: `agentive.example.dev`)으로 origin을 분리하는 것을 고려합니다.

---

## 9. PR 템플릿용 요약본 (복사해서 사용)

```markdown
### 보안 체크 (메인테이너)
- [ ] 변경 파일 범위가 PR 목적과 일치 (콘텐츠 PR은 content/agents/*.yaml만, .github/·scripts/·package*.json 미포함)
- [ ] `npm run check:data` 통과 (스키마 closed, slug 패턴, URL은 https만)
- [ ] 보이지 않는 문자/bidi/tag 문자 0건
- [ ] 렌더된 키트 파일(out/kits/<slug>/*)을 끝까지 읽음: 숨은 지시문, 원격 실행, 비밀값 접근, 외부 전송, 푸시/삭제 지시 없음
- [ ] 기존 prompt 수정이면 word-diff로 바뀐 문장과 이유 확인, 권한 범위 확장 없음
- [ ] 예시 값에 실제 비밀값/개인정보 없음
- [ ] lockfile 변경 없음 (의존성 PR이면 lockfile-lint 통과)
- [ ] 워크플로 변경 없음 (변경 시: permissions 최소, SHA 고정, `${{ github.event.* }}` run 보간 없음)
- [ ] 새 `dangerouslySetInnerHTML`/`innerHTML`/`new RegExp(userInput)` 없음
```

---

## 10. 리스크 요약 (위험도순)

| # | 리스크 | 가능성 | 영향 | 현재 방어 | 남은 빈틈 |
|---|---|---|---|---|---|
| R1 | 기여 YAML 속 악성 지시문이 키트를 통해 사용자의 AI 에이전트에 주입됨 | 중 | **높음** (사용자 저장소, 비밀값, 푸시 권한) | 스키마 검증, 수동 리뷰 | 리뷰가 사람 눈에만 의존함. 보이지 않는 문자 자동 검사 없음(추정) |
| R2 | 기존 인기 에이전트를 미묘하게 수정하는 PR | 중 | 높음 | 수동 리뷰 | 신규보다 덜 주의 깊게 보기 쉬움 |
| R3 | `workflow_run` Deploy 조건 누락이나 artifact 재사용으로 포크 코드가 배포됨 | 낮음 | 높음 (사이트 변조) | "main push일 때만" 조건 | 조건식과 artifact 출처를 실제로 확인해야 함 |
| R4 | 의존성 또는 action 탈취 | 낮음 | 중~높음 | Dependabot, `npm ci` | action SHA 미고정 가능성, major 보안 수정 누락 |
| R5 | 키트 `.mdc` frontmatter 주입(`alwaysApply`, `globs`) | 낮음 | 중 | — | 생성기 픽스처 테스트 필요 |
| R6 | 브라우저 XSS (JSON-LD, 검색, 링크) | 낮음 | 중 (공유 origin 포함) | React 이스케이프 | JSON-LD와 URL 필드 확인 필요 |
| R7 | 보안 헤더 부재 (CSP, frame-ancestors) | — | 낮음 | GitHub 기본 헤더 | 플랫폼 한계. meta CSP로 일부 완화 |
| R8 | 제출 폼 입력의 의도치 않은 공개 | 낮음 | 낮음 | 사용자가 GitHub에서 직접 제출 | 공개 안내 문구 |

---

## 11. 다음 액션 (우선순위)

1. **[이번 주] `check:data`에 콘텐츠 보안 린트 추가**
   - 보이지 않는 문자, bidi, tag 문자를 거부합니다.
   - HTML 주석(`<!--`)을 거부합니다.
   - 위험 패턴(`| sh`, `curl .* \|`, `base64 -d`, `~/.ssh`, `.env`, `ignore previous`)은 **경고**로 출력해 리뷰어의 주의를 끌게 합니다. 오탐이 많으므로 차단은 하지 않습니다.
   - 필드별 `maxLength`를 둡니다.
   3-1과 3-2를 사람의 기억이 아니라 CI에 맡기는 작업입니다.
2. **[이번 주] 워크플로 점검 1회:** 5-1~5-5를 실제 파일과 Settings에서 확인합니다. 특히 Deploy 트리거 조건과 artifact 출처, 포크 PR 승인 정책, `github-pages` environment의 branch 제한을 봅니다.
3. **[이번 주] Secret scanning, Push protection, Dependabot security updates 활성화**와 `github-actions` 생태계 추가.
4. **[2주 내] 키트 생성기 테스트 추가:** 2-2와 3-4의 악성 픽스처(`</script>`, `---\nalwaysApply: true`, 코드펜스)로 `tests/`에 회귀 테스트를 만듭니다. 3-6의 "키트 파일 확장자 화이트리스트" 단언도 넣습니다.
5. **[2주 내] 키트 상단에 출처와 커밋 SHA 헤더**를 넣고, 설치 안내를 "다운로드 → 검토 → 붙여넣기" 순서로 고칩니다.
6. **[2주 내] `CODEOWNERS`**를 추가합니다(`.github/`, `scripts/`, `schema/`, `src/lib/agent-install-kit.ts`는 본인 필수 리뷰). 이 체크리스트의 9장을 PR 템플릿에 반영합니다.
7. **[선택] meta CSP 도입**(8-3)과 **커스텀 도메인으로 origin 분리**(8-4).
8. **[월 1회] 정기 점검:** `npm audit`, Dependabot alerts, action SHA 갱신 여부, 헤더 기준선 비교(8-2)를 확인합니다.

필요하시면 1번의 `check:data` 보안 린트 스크립트나 4번의 테스트 픽스처를 실제 코드로 작성해 드리겠습니다.
