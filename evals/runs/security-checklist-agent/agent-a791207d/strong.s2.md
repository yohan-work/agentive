# Agent Archive 배포 전 보안 점검 체크리스트

서버, DB, 로그인이 없는 정적 사이트라서 전통적인 웹 공격면(인증, 세션, SQLi)은 거의 없습니다. 실제 위험은 아래 세 곳에 몰려 있습니다.

1. **설치 키트를 통한 프롬프트 인젝션**: 외부 기여자가 쓴 텍스트가 사용자 저장소의 AGENTS.md/CLAUDE.md에 그대로 들어가서 사용자의 코딩 에이전트가 읽습니다. 이 프로젝트에서 영향이 가장 큰 공급망 경로입니다.
2. **CI/CD 공급망**: 의존성이나 Actions가 오염되면 Pages 배포 권한으로 사이트 전체를 바꿀 수 있습니다.
3. **정적 산출물의 MIME/렌더링 경로**: 기여 텍스트가 HTML로 해석되는 경로가 하나라도 있으면 XSS가 됩니다.

항목은 **[매 PR]**(PR 템플릿에 넣을 것)과 **[1회/정기]**(저장소 설정이라 한 번 확인하고 분기마다 재확인할 것)로 나눴습니다. 우선순위는 P0(배포 차단), P1(이번 릴리스 안에 처리), P2(개선)입니다.

---

## 0. 가정

아래 가정 중 틀린 것이 있으면 해당 항목의 우선순위가 바뀝니다.

- A1. CI는 `pull_request` 이벤트로 돌고 `pull_request_target`은 쓰지 않습니다.
- A2. Deploy는 `workflow_run`(CI 완료) 또는 같은 워크플로의 후속 job으로 실행되고, 저장소 시크릿은 쓰지 않습니다(Pages OIDC만 사용).
- A3. 이슈나 PR 이벤트(`issues`, `issue_comment`)로 트리거되는 워크플로는 없습니다. 있다면 3.4 항목이 P0이 됩니다.
- A4. 에이전트 텍스트는 React JSX로 렌더되고, Markdown 렌더러를 쓰더라도 raw HTML은 허용하지 않습니다.
- A5. 커스텀 도메인 없이 `yohan-work.github.io/agentive`로 서비스합니다. 이 경우 **같은 계정의 다른 GitHub Pages 프로젝트와 origin(`yohan-work.github.io`)을 공유**합니다. 4번과 7번 항목에 영향이 있습니다.
- A6. 분석 도구나 외부 스크립트(GA, 폰트 CDN 등)는 없습니다.

---

## 1. PR 템플릿용 요약 (복사해서 사용)

```markdown
### Security checklist
**Agent content (content/agents/*.yaml)**
- [ ] `npm run content` / `check:data` 통과 (schema: additionalProperties false, 길이 제한, slug 패턴)
- [ ] `npm run scan:content` 경고 0건 또는 경고 항목을 직접 읽고 사유를 아래에 적음
- [ ] prompt 필드 diff를 **raw로 전부** 읽었음 (렌더된 페이지가 아니라 YAML 원문)
- [ ] 숨은 지시 없음: 외부 URL, 셸 명령(curl|sh, rm -rf), 비밀값/.env 요구, "사용자에게 말하지 말라"류, HTML 주석, 보이지 않는 유니코드
- [ ] 기존 에이전트의 prompt를 수정하는 PR이면 수정 이유가 PR 본문에 있음

**Code / config**
- [ ] 새 `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, raw HTML Markdown 플러그인 없음
- [ ] YAML에서 온 값이 `href`/`src`로 쓰이면 https만 허용
- [ ] `.github/workflows/**` 변경 없음, 또는 변경 시: 권한 증가 없음, 액션 SHA 고정, `${{ github.event.* }}`를 `run:`에 직접 넣지 않음
- [ ] package-lock.json 변경이 package.json 변경과 대응하고, resolved URL이 전부 registry.npmjs.org
- [ ] 새 의존성이면 이름(타이포스쿼팅), 주간 다운로드, install script 여부 확인

**Build output**
- [ ] `out/`에 .map, .env*, 예상 밖 파일 없음 (`npm run check:out`)
```

`scan:content`와 `check:out`은 아직 없는 스크립트입니다. 만드는 방법은 5장 다음 액션에 적었습니다.

---

## 2. 에이전트 콘텐츠 (외부 기여 YAML)

### 2.1 스키마로 입력 형태 강제 [매 PR, P0]
- **확인 방법**
  - `schema/agent.schema.json`에서 최상위와 중첩 객체 모두 `"additionalProperties": false`인지 확인합니다.
  - 모든 문자열에 `maxLength`가 있는지 봅니다(예: name 80, summary 300, prompt 20000). 배열에는 `maxItems`가 있어야 합니다.
  - `slug`에 `"pattern": "^[a-z0-9]+(-[a-z0-9]+)*$"`가 있고 파일명과 일치하는지 check:data에서 검사합니다.
  - URL 필드는 `format: "uri"`와 `"pattern": "^https://"`를 함께 씁니다(ajv-formats 로드 여부도 확인).
  - ajv가 `strict: true`로 돌고, 검증 실패 시 빌드가 **실패**하는지(경고로 끝나지 않는지) 봅니다.
- **통과 기준**
  - 일부러 잘못 만든 YAML 3종이 모두 `npm run content`를 exit 1로 실패시킵니다: 알 수 없는 키, 50k자 prompt, slug `../x`.
  - 이 세 경우를 `tests/`에 고정합니다.

### 2.2 YAML 파서 안전성 [1회, P1]
- **확인 방법**
  - 사용하는 파서와 버전을 확인합니다.
  - `js-yaml` v4의 `load`는 안전하지만 `!!js/*` 스키마를 확장하지 않았는지 봅니다.
  - `yaml` 패키지는 `maxAliasCount`가 기본값(100) 이하인지 봅니다.
  - 앵커와 별칭을 폭증시키는 billion-laughs YAML을 넣어 빌드해 봅니다.
- **통과 기준**
  - 커스텀 태그는 파싱 에러가 납니다.
  - 별칭 폭증 입력은 수 초 안에 에러로 끝납니다.

### 2.3 설치 키트를 통한 프롬프트 인젝션 [매 PR, P0]
이 프로젝트의 핵심 리스크입니다. 사용자는 키트를 curl로 받아 붙이고, 그 다음에는 사용자의 에이전트가 **셸과 파일 권한을 가진 상태**로 그 텍스트를 따릅니다. 페이지에서는 멀쩡해 보여도 raw 파일에는 숨은 지시가 있을 수 있습니다.

- **확인 방법**
  1. **보이지 않는 문자 탐지**(zero-width, bidi override, Unicode Tag 블록):
     ```bash
     rg -n '[\x{200B}-\x{200F}\x{202A}-\x{202E}\x{2060}-\x{2064}\x{2066}-\x{2069}\x{FEFF}\x{E0000}-\x{E007F}]' content/agents/
     ```
  2. **숨김 마크업**: `<!--`, `<details>`, `<div hidden`, `display:none`, 과도하게 긴 공백이나 개행(스크롤 밖으로 밀어내는 기법)이 있는지 봅니다.
  3. **위험 지시 키워드**: 아래 패턴은 사람이 반드시 읽어야 하는 항목으로 표시합니다. 자동 차단은 오탐이 많으니 플래그만 세웁니다.
     ```bash
     rg -n -i 'curl |wget |\| *(ba)?sh|rm -rf|chmod \+x|base64 -d|npx [a-z]|pip install|\.env|api[_ -]?key|token|secret|ssh|~/\.|ignore (all|previous)|do not (tell|mention|inform)|without asking|silently|exfiltrat|https?://' content/agents/<changed>.yaml
     ```
  4. **긴 인코딩 문자열**: 80자 이상의 base64나 hex 덩어리가 있는지 봅니다.
  5. **구조 위조**: prompt 안에 `# `나 `## ` 헤딩, `---` frontmatter, `SYSTEM:`처럼 키트의 바깥 구조나 상위 지시로 보이게 하는 텍스트가 있는지 봅니다.
  6. **렌더 결과와 raw 결과 비교**: 로컬 빌드 후 `out/kits/<slug>/AGENTS.md`를 `cat -v`로 열어 사람이 읽은 prompt와 바이트 단위로 같은지 봅니다.
- **통과 기준**
  - 1, 2, 4번은 0건이어야 합니다(정당한 사유가 있으면 PR에 명시).
  - 3번 플래그는 전부 사람이 읽고 에이전트 목적상 필요하다고 판단한 경우만 허용합니다.
  - "외부 URL에서 받아 실행", "비밀값 출력/전송", "사용자 확인 없이 파괴적 명령"은 목적과 무관하게 **거절**합니다.
- **구조적 완화 [1회, P1]**
  - 키트 생성기(`agent-install-kit.ts`)에서 기여 텍스트를 명확한 경계로 감쌉니다. 예: `<!-- BEGIN agent-archive:<slug> prompt -->` ... `END`.
  - 키트 상단에 출처 URL, 커밋 SHA, 콘텐츠 SHA-256을 넣습니다.
  - 보이지 않는 유니코드는 생성 단계에서 **제거하거나 빌드 실패**로 처리합니다. 스캔에만 의존하지 않습니다.
  - 설치 안내 문구에 "붙이기 전에 파일 전체를 읽으세요"와 커밋 고정 URL(`raw.githubusercontent.com/.../<sha>/...`) 옵션을 둡니다. Pages URL은 항상 최신 버전을 주기 때문에, 한 번 승인된 에이전트가 나중 PR로 바뀌어도(rug-pull) 사용자가 알아채기 어렵습니다.

### 2.4 기존 에이전트 수정 PR [매 PR, P1]
- **확인 방법**: `git diff origin/main -- content/agents/ | grep '^[-+]' | grep -v '^[-+]\{3\}'`로 prompt 필드 변경분만 따로 읽습니다.
- **통과 기준**: 원 작성자가 아닌 사람이 prompt를 바꾸는 PR은 변경 이유가 적혀 있고, 2.3 검사를 다시 통과합니다.

### 2.5 CODEOWNERS [1회, P1]
- **확인 방법**
  - `.github/CODEOWNERS`에 `content/agents/`, `.github/`, `package*.json`, `src/lib/agent-install-kit.ts`, `scripts/`, `schema/`를 본인으로 지정합니다.
  - 브랜치 보호의 "Require review from Code Owners"를 켭니다.
- **통과 기준**: 테스트 PR에서 코드오너 리뷰가 필수로 표시됩니다.

---

## 3. XSS / 주입

### 3.1 기여 텍스트의 렌더 경로 [매 PR, P0]
- **확인 방법**
  ```bash
  rg -n 'dangerouslySetInnerHTML|innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function|rehype-raw|allowDangerousHtml|html:\s*true' src/
  ```
  JSON-LD(`<script type="application/ld+json">`)가 있다면 `JSON.stringify(...)` 결과에서 `<`를 `<`로 이스케이프하는지 봅니다. 이스케이프하지 않으면 summary에 `</script><script>...`를 넣어 빠져나올 수 있습니다.
- **통과 기준**
  - 각 매치가 기여 데이터를 쓰지 않거나, 이스케이프나 sanitize를 거치는 것이 코드로 확인됩니다.
  - 테스트 에이전트의 모든 텍스트 필드에 `<img src=x onerror=alert(1)>`와 `</script><script>alert(1)</script>`를 넣고 빌드해도 `out/`의 HTML에서 실행 가능한 태그로 나타나지 않습니다(`rg -n 'onerror=alert' out/`의 결과가 이스케이프된 형태여야 함).

### 3.2 URL 속성 [매 PR, P1]
- **확인 방법**: YAML 값이 `href`, `src`, `action`에 들어가는 곳을 `rg -n 'href=\{' src/`로 찾습니다.
- **통과 기준**
  - 스키마에서 https만 허용합니다. React 19가 `javascript:` URL을 막아 주지만 스키마로 한 번 더 막습니다.
  - 외부 링크의 `target="_blank"`에는 `rel="noopener noreferrer"`를 붙입니다.

### 3.3 키트 route handler와 정적 산출물의 MIME [1회, P0]
정적 export에서는 `Response`의 `Content-Type` 헤더가 **배포 후에는 적용되지 않습니다**. GitHub Pages는 파일 **확장자**로 MIME을 정합니다. 그래서 코드에 `text/markdown`이라고 적혀 있어도 실제 응답은 다를 수 있습니다.
- **확인 방법**
  - `generateStaticParams`의 `file` 값이 코드 안의 고정 allowlist(예: `AGENTS.md`, `CLAUDE.md`, `<slug>.mdc`)에서만 나오고, 기여 데이터에서 파일명이 오지 않는지 확인합니다.
  - `slug`는 2.1 패턴으로 제한합니다.
  - 배포 후 실제 응답 헤더를 확인합니다.
    ```bash
    for f in AGENTS.md CLAUDE.md <slug>.mdc; do curl -sI "https://yohan-work.github.io/agentive/kits/<slug>/$f" | grep -i '^content-type'; done
    find out/kits -type f | sed 's/.*\.//' | sort | uniq -c   # 확장자 분포
    ```
- **통과 기준**
  - `out/kits/` 아래에 `.html`, `.htm`, `.svg`, `.xml` 파일이나 확장자 없는 파일이 없습니다.
  - 실제 Content-Type이 `text/html`이 아닙니다(`.mdc`가 `application/octet-stream`으로 내려가는 것은 보안상 문제 없음).
  - 존재하지 않는 slug는 빌드 산출물에 없습니다(`dynamicParams = false`).

### 3.4 GitHub Actions 표현식 주입 [1회 + 워크플로 변경 PR, P0]
- **확인 방법**
  ```bash
  rg -n '\$\{\{\s*github\.(event\.(issue|pull_request|comment|review|head_commit)|head_ref)' .github/workflows/
  rg -n 'pull_request_target|workflow_run|issues:|issue_comment:' .github/workflows/
  ```
- **통과 기준**
  - 사용자가 제어하는 값(이슈 본문, PR 제목, 브랜치명)이 `run:` 안에 직접 보간되지 않습니다. 필요하면 `env:`로 넘기고 `"$VAR"`로 참조합니다.
  - `pull_request_target`이 없거나, 있어도 PR head를 checkout하지 않습니다.
  - `workflow_run`을 쓴다면 `github.event.workflow_run.event == 'push'`, `head_branch == 'main'`, `head_repository.full_name == github.repository` 조건이 모두 있습니다. 이 조건이 없으면 포크 PR의 CI 성공이 배포로 이어질 수 있습니다.

### 3.5 제출 폼(/submit) [1회, P2]
- **확인 방법**
  - URL을 `new URL("https://github.com/yohan-work/agentive/issues/new")`와 `searchParams.set`으로 만들고, 호스트가 하드코딩되어 있는지 확인합니다. 사용자 입력이 경로나 호스트에 들어가지 않아야 합니다.
  - 자를 때 서로게이트 쌍(이모지 등) 중간이 끊기지 않게 `Array.from` 기준으로 자르는지 봅니다. 기능 결함이지만 깨진 문자열이 이슈로 넘어갑니다.
- **통과 기준**
  - 오픈 리다이렉트 경로가 없습니다.
  - 잘림이 발생하면 사용자에게 표시됩니다. 조용히 잘린 prompt가 그대로 머지되는 일을 막기 위해서입니다.
  - 폼에 "이슈는 공개됩니다. 내부 정보, 키, 사내 프롬프트를 넣지 마세요"라는 안내가 있습니다.
  - 이슈 내용을 YAML로 옮길 때도 2.3 검사를 거칩니다. 이슈는 PR과 똑같이 신뢰할 수 없는 입력입니다.

### 3.6 검색 쿼리 [1회, P2]
- **확인 방법**: `rg -n 'new RegExp' src/`로 query에서 정규식을 만드는 곳을 찾고, 하이라이트를 `innerHTML`로 하는지 봅니다.
- **통과 기준**
  - query는 input value와 텍스트 비교에만 쓰입니다.
  - 정규식을 만든다면 특수문자를 이스케이프합니다. `?query=(a+)+$`를 넣어도 멈추지 않고 에러도 나지 않아야 합니다.
  - `?query=<script>alert(1)</script>`를 넣어도 입력창에 텍스트로만 표시됩니다.

### 3.7 북마크(localStorage) [1회, P2]
- **확인 방법**: 파싱 후 `Array.isArray(x) && x.every(s => typeof s === "string")`인지 검사하고, **알려진 slug 목록과 교집합**만 쓰는지 봅니다.
- **통과 기준**
  - 개발자도구에서 값을 `{"__proto__":1}`, `["<img src=x onerror=alert(1)>"]`, 100KB 문자열로 바꿔도 에러나 실행 없이 빈 목록 또는 무시로 처리됩니다.
  - 가정 A5 때문에 같은 계정의 다른 Pages 프로젝트가 이 localStorage를 읽고 쓸 수 있습니다. 저장값은 항상 신뢰하지 않는 입력으로 다루고, 민감정보를 저장하지 않습니다(slug만 저장하는 현재 방식이면 괜찮습니다).

### 3.8 sitemap.xml / robots.txt [1회, P2]
- **확인 방법**: `out/sitemap.xml`을 `xmllint --noout`으로 검증하고, robots.txt에 "숨겨진 경로"가 적혀 있지 않은지 봅니다.
- **통과 기준**
  - XML이 유효합니다(slug 패턴 덕분에 이스케이프할 문자가 없음).
  - 모든 URL이 `https://yohan-work.github.io/agentive/`로 시작합니다.
  - robots.txt에 비공개로 두고 싶은 경로가 나열되어 있지 않습니다.

---

## 4. 공급망 (의존성, Actions)

### 4.1 Actions 권한 최소화 [1회 + 워크플로 변경 PR, P0]
- **확인 방법**
  - 모든 워크플로 최상위에 `permissions: contents: read`(또는 `{}`)가 있는지 봅니다.
  - `pages: write`와 `id-token: write`는 **deploy job에만** 있는지 봅니다.
  - Settings → Actions → General에서 "Workflow permissions: Read repository contents"를 선택하고, "Allow GitHub Actions to create and approve pull requests"는 꺼 둡니다.
- **통과 기준**
  - CI 워크플로의 GITHUB_TOKEN은 read 권한뿐입니다.
  - deploy job은 산출물 업로드와 배포만 합니다.
- **권장 구조 [P1]**
  - 현재 Deploy 워크플로가 `npm ci`와 빌드까지 한다면, 빌드 job(권한 read)과 deploy job(`actions/deploy-pages`만 실행, pages/id-token write)을 분리합니다.
  - 그러면 악성 postinstall 스크립트가 Pages 배포용 OIDC 토큰에 닿지 않습니다.

### 4.2 Actions 버전 고정 [1회 + 워크플로 변경 PR, P1]
- **확인 방법**
  ```bash
  rg -n 'uses:' .github/workflows/ | rg -v '@[0-9a-f]{40}'
  ```
- **통과 기준**
  - 서드파티 액션은 전부 40자 커밋 SHA로 고정합니다(`# v4.1.7`처럼 버전 주석을 붙임).
  - `actions/*`도 SHA 고정을 권장합니다.
  - Dependabot에 `package-ecosystem: github-actions`가 있어서 SHA를 자동으로 갱신합니다.

### 4.3 포크 PR 실행 정책 [1회, P1]
- **확인 방법**: Settings → Actions → "Fork pull request workflows"를 확인합니다.
- **통과 기준**: "Require approval for first-time contributors"(또는 all outside collaborators)가 켜져 있습니다. 승인하기 전에 PR의 `package.json`, `.github/`, `scripts/` 변경 여부를 먼저 봅니다.

### 4.4 npm 의존성 [매 PR, P1]
- **확인 방법**
  - 매 PR에서 `npm ci`를 씁니다(현재 사용 중).
  - `npm audit --omit=dev --audit-level=high`를 돌립니다. 런타임 코드가 브라우저에만 있으니 결과는 참고용입니다.
  - lockfile 변경을 검사합니다.
    ```bash
    npx lockfile-lint --path package-lock.json --type npm --allowed-hosts npm --validate-https --validate-integrity
    ```
  - 새 패키지는 이름(오타 스쿼팅), 게시자, 설치 스크립트 유무(`npm view <pkg> scripts`)를 봅니다.
- **통과 기준**
  - lockfile-lint를 통과합니다.
  - high 이상 취약점은 0건이거나, 해당 경로가 빌드 전용이라 실행되지 않는다는 판단을 기록합니다.
  - package.json 변경 없이 lockfile만 크게 바뀐 외부 기여 PR은 거절합니다.

### 4.5 Dependabot 설정의 빈틈 [1회, P1]
- **확인 방법**: Settings → Code security에서 "Dependabot alerts"와 "Dependabot security updates"가 켜져 있는지 봅니다.
- **통과 기준**
  - major 제외 규칙은 **버전 업데이트**에만 적용되고, **보안 업데이트**는 major여도 PR이 생성됩니다. 둘은 별도 설정입니다.
  - Next.js 보안 패치가 major 경계에 걸리는 경우를 놓치지 않습니다.

### 4.6 브랜치 보호 [1회, P0]
- **확인 방법**: `main`의 Rulesets 또는 Branch protection을 확인합니다.
- **통과 기준**
  - PR 필수, CI 5종 required status check, force push와 삭제 금지, 코드오너 리뷰(2.5)가 설정되어 있습니다.
  - 혼자 메인테이너라서 본인 PR 승인이 불가능하면 "관리자 우회 허용"을 켜되, **직접 push는 금지**합니다.
  - `github-pages` environment의 Deployment branches를 `main`으로 제한합니다.

---

## 5. 비밀값

### 5.1 저장소와 히스토리 [1회, P1]
- **확인 방법**
  - Settings → Code security에서 "Secret scanning"과 "Push protection"을 켭니다(공개 저장소는 무료).
  - 히스토리를 스캔합니다: `gitleaks detect --source . --log-opts="--all"`
  - `.gitignore`에 `.env*`가 있는지 봅니다.
- **통과 기준**: 탐지 0건입니다. 탐지되면 해당 키를 **폐기**하고, 히스토리 제거는 부차적으로 처리합니다.

### 5.2 빌드 산출물 [매 릴리스, P1]
- **확인 방법**
  ```bash
  rg -n 'NEXT_PUBLIC_' src/ next.config.*
  rg -n -i 'ghp_|github_pat_|sk-[a-z0-9]{20}|AKIA[0-9A-Z]{16}|-----BEGIN' out/
  find out \( -name '*.map' -o -name '.env*' -o -name '*.yaml' -o -path '*/evals/*' \) -print
  ```
- **통과 기준**
  - `NEXT_PUBLIC_` 변수에는 공개되어도 되는 값만 있습니다.
  - 토큰 패턴이 0건입니다. 단, 에이전트 prompt에 예시로 나온 가짜 토큰은 예외로 둡니다. 예시는 `EXAMPLE` 표기를 쓰도록 가이드를 둡니다.
  - `out/`에 의도하지 않은 파일이 없습니다.

### 5.3 Actions 시크릿 [1회, P2]
- **확인 방법**: Settings → Secrets and variables에서 저장소와 environment 시크릿 목록을 확인합니다.
- **통과 기준**: 필요한 시크릿이 없으므로 **0개**여야 합니다. 쓰지 않는 PAT가 남아 있으면 삭제합니다.

---

## 6. 로깅 / 데이터 노출

### 6.1 수집 데이터 [1회, P2]
- **확인 방법**: `rg -n 'fetch\(|navigator\.sendBeacon|gtag|analytics|posthog|sentry' src/`
- **통과 기준**
  - 외부로 나가는 요청이 없습니다. 있다면 목록과 목적을 README나 개인정보 안내에 적습니다.
  - GitHub Pages 자체 접근 로그는 GitHub이 보관하며 메인테이너가 통제하지 않는다는 점을 인지합니다.

### 6.2 공개 경로로 새는 정보 [매 PR, P2]
- **확인 방법**: `docs/`, `evals/`, `.eval-work/` 같은 내부 작업물이 `public/`이나 빌드 산출물로 복사되는지, 커밋 대상인지 확인합니다.
- **통과 기준**: 내부 메모, 평가 원본, 개인 정보가 공개 저장소나 `out/`에 의도치 않게 포함되지 않습니다. 저장소가 공개이므로 커밋이 곧 공개입니다.

### 6.3 제출 이슈 [1회, P2]
- 3.5의 안내 문구와 같습니다. 이슈 템플릿 상단에도 같은 경고를 넣습니다.

---

## 7. 보안 헤더 (GitHub Pages 제약 하에서)

커스텀 응답 헤더는 설정할 수 없으므로, 가능한 것만 하고 나머지는 리스크로 수용합니다.

| 항목 | 가능 여부 | 조치 | 통과 기준 |
|---|---|---|---|
| HTTPS 강제 | 가능 | Pages 설정에서 "Enforce HTTPS" | http 요청이 301로 https 이동 |
| HSTS | 자동 | `github.io`는 HSTS preload 도메인 | 조치 불필요 |
| CSP | 부분 가능 | `<meta http-equiv="Content-Security-Policy">`를 layout에 추가. Next 인라인 스크립트 때문에 `script-src 'self' 'unsafe-inline'`은 불가피하지만 `object-src 'none'; base-uri 'self'; form-action 'self' https://github.com; connect-src 'self'; frame-src 'none'`만으로도 주입 후의 피해 범위를 줄입니다 | 배포 후 콘솔에 CSP 위반이 없고 전 페이지가 정상 동작 |
| frame-ancestors / X-Frame-Options | 불가 | meta로는 적용되지 않음. 상태를 바꾸는 동작이 없어 클릭재킹 영향이 낮으므로 **수용** | 리스크로 기록 |
| X-Content-Type-Options | 불가 | 3.3에서 확장자 allowlist로 대체 | 3.3 통과 |
| Referrer-Policy | 가능 | `<meta name="referrer" content="strict-origin-when-cross-origin">` | 외부 링크 이동 시 전체 URL이 전달되지 않음 |
| Origin 격리 | 불가 | `yohan-work.github.io`를 다른 프로젝트와 공유(A5). 격리가 필요하면 커스텀 도메인 사용 | 리스크로 기록 |

---

## 8. 리스크 요약

| # | 리스크 | 가능성 | 영향 | 현재 완화 | 남은 조치 |
|---|---|---|---|---|---|
| R1 | 기여 prompt에 숨은 지시가 들어가 사용자 에이전트가 명령 실행이나 비밀 유출 | 중 | **높음** (사용자 로컬 환경) | 사람 리뷰 | 2.3 스캔 자동화, 보이지 않는 문자 빌드 차단, 키트 경계와 해시 |
| R2 | 승인된 에이전트가 이후 PR로 악성화(rug-pull), Pages URL이 항상 최신본 제공 | 중 | 높음 | 없음 | 2.4, 커밋 고정 URL 안내 |
| R3 | 의존성이나 액션 오염으로 사이트 전체 변조 | 낮음 | 높음 | Dependabot, npm ci | 4.1 job 분리, 4.2 SHA 고정, lockfile-lint |
| R4 | `workflow_run` 조건 누락으로 포크 PR이 배포를 트리거 | 낮음~중 | 높음 | 불명(A2) | 3.4 조건 확인 |
| R5 | 키트나 기타 산출물이 HTML로 서빙되어 XSS | 낮음 | 중 | force-static, dynamicParams false | 3.3 확장자 allowlist |
| R6 | 렌더 경로의 XSS (JSON-LD, Markdown) | 낮음 | 중 | React 기본 이스케이프 | 3.1 페이로드 테스트 |
| R7 | 같은 origin의 다른 Pages 프로젝트가 localStorage 접근 | 낮음 | 낮음 | slug만 저장 | 3.7 검증 로직 유지 |
| R8 | 클릭재킹, 헤더 부재 | 낮음 | 낮음 | 상태 변경 동작 없음 | 수용, meta CSP |
| R9 | 제출자가 이슈에 민감정보를 입력 | 중 | 낮음(제출자 본인) | 없음 | 폼과 이슈 템플릿 경고 |

---

## 9. 다음 액션 (순서대로)

1. **[P0, 30분]** 3.4와 4.1을 확인합니다: 워크플로에서 `workflow_run` 조건, 표현식 주입, 권한 범위. 가정 A1~A3이 맞는지 여기서 판별됩니다.
2. **[P0, 1시간]** 4.6 브랜치 보호, 2.5 CODEOWNERS, 4.3 포크 승인, 5.1 secret scanning과 push protection을 설정합니다. 전부 클릭 몇 번이면 됩니다.
3. **[P0, 2~3시간]** `scripts/scan-content.mjs`를 만들어 `npm run scan:content`로 등록합니다. 내용은 2.3의 1~5번 정규식입니다. 보이지 않는 문자와 HTML 주석은 **실패** 처리하고, 키워드는 **경고 출력**만 합니다. 이 스크립트를 check:data에 연결해 CI에서 돌리고, 101개 기존 에이전트에 한 번 전수 실행해 기준선을 만듭니다.
4. **[P0, 1시간]** 3.1 XSS 페이로드 테스트 에이전트를 `tests/` 픽스처로 만들고 빌드 산출물을 검사하는 테스트를 추가합니다. 3.3 확장자 검사와 5.2 `out/` 검사를 합쳐 `npm run check:out`으로 만듭니다.
5. **[P1]** 키트 생성기에 경계 주석, 출처 SHA, 콘텐츠 해시를 넣고, 설치 안내에 "붙이기 전에 읽기"와 커밋 고정 URL을 추가합니다.
6. **[P1]** 4.1 build/deploy job 분리, 4.2 액션 SHA 고정과 Dependabot github-actions 추가, 4.4 lockfile-lint를 CI에 넣습니다.
7. **[P2]** meta CSP와 referrer를 추가하고, 3.5~3.7 소소한 항목을 정리한 뒤 `SECURITY.md`를 만들고 Private vulnerability reporting을 켭니다.

---

## 확인이 필요한 정보 (답해 주시면 해당 항목을 확정하겠습니다)

1. Deploy 워크플로가 `workflow_run`으로 트리거되나요, 같은 워크플로의 후속 job인가요? (R4의 우선순위가 여기에 달려 있습니다)
2. 이슈 이벤트(`issues`, `issue_comment`)로 도는 워크플로가 있나요? 예를 들어 제출 이슈를 YAML PR로 자동 변환하는 것이 있다면 3.4가 최우선입니다.
3. 에이전트 텍스트를 Markdown으로 렌더하나요? 그렇다면 어떤 라이브러리와 플러그인을 쓰나요?
