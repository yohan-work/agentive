# Agent Archive 배포 전 보안 점검 체크리스트

정적 사이트라 공격 표면이 작긴 하지만, 이 프로젝트에서 **실제로 제일 큰 리스크는 웹 취약점이 아니라 "설치 키트를 통한 프롬프트 인젝션"**입니다. 외부 기여자가 쓴 텍스트가 사용자 저장소의 AGENTS.md/CLAUDE.md에 들어가고, 거기서 코딩 에이전트가 **지시문으로** 읽기 때문입니다. 두 번째는 GitHub Actions 트리거 구성(특히 fork PR과 배포 사이의 연결)입니다. 체크리스트도 이 두 가지에 비중을 두었습니다.

---

## 0. 전제로 삼은 가정

설명해 주신 내용을 기준으로 다음을 가정했습니다. 하나라도 다르면 해당 항목 판정이 달라집니다.

| # | 가정 | 틀리면 |
|---|---|---|
| A1 | 페이지 렌더링은 React 기본 이스케이프를 쓰고, prompt 같은 긴 텍스트를 마크다운→HTML로 변환하지 않거나, 변환하더라도 raw HTML을 허용하지 않는다 | XSS 항목(B)의 우선순위가 크게 올라감 |
| A2 | CI는 `pull_request` 트리거이고, `pull_request_target`은 쓰지 않는다 | 즉시 수정 필요한 치명 항목 |
| A3 | Deploy는 `workflow_run`(CI 완료)으로 트리거되거나, `push: main`에서 CI job에 `needs`로 연결된다 | `workflow_run`이라면 E3 조건 필수 |
| A4 | 저장소 Secrets는 비어 있고, Pages 배포는 OIDC(`id-token: write`)만 쓴다 | D 항목 범위 확대 |
| A5 | 이슈 템플릿(`new-agent.yml`)으로 들어온 이슈를 자동으로 처리하는 Action(이슈→PR 자동 생성 등)은 없다 | 있으면 E5가 치명 항목이 됨 |
| A6 | 분석 도구/외부 스크립트(GA, 폰트 CDN 등)는 없다 | F, G 항목 추가 필요 |
| A7 | 키트 파일 이름은 코드에 고정된 목록(AGENTS.md, CLAUDE.md, `.mdc` 등)이고, YAML에서 파일 이름을 받지 않는다 | C 항목이 치명 항목이 됨 |

---

## 1. 사용 방법

- **[PR마다]** 표시 항목은 짧은 PR 템플릿 블록(맨 아래 §4)에 넣어 매 PR마다 확인하세요.
- **[릴리스/월 1회]** 표시 항목은 설정·구성 점검이라, 한 번 통과시킨 뒤 주기적으로(또는 워크플로/의존성/렌더링 코드가 바뀔 때) 다시 보면 됩니다.
- 명령 예시는 저장소 루트 기준이고, 유니코드 검사는 `rg`(ripgrep)를 기준으로 합니다(macOS 기본 `grep`에는 `-P`가 없습니다).

---

## 2. 체크리스트

### A. 외부 기여 YAML 및 입력 처리

- [ ] **A1. 콘텐츠 PR이 콘텐츠 파일만 건드리는가** [PR마다]
  - 확인: `git diff --name-only origin/main...HEAD`
  - 통과: 외부 기여 PR의 변경 파일이 `content/agents/*.yaml`뿐이다. `package.json`, `package-lock.json`, `.github/`, `scripts/`, `src/`, `next.config.*`, `schema/`가 섞여 있으면 콘텐츠 PR로 보지 않고 코드 PR 기준으로 따로 리뷰한다.
  - 자동화 권장: CI에 "라벨이 `content`인 PR은 `content/agents/` 밖의 파일을 바꾸면 실패" 체크 추가.

- [ ] **A2. 스키마가 필드 모양을 엄격하게 제한하는가** [릴리스/월 1회]
  - 확인: `schema/agent.schema.json`에서 다음을 확인.
    - 최상위 및 중첩 객체에 `additionalProperties: false`
    - `slug`에 `pattern: "^[a-z0-9]+(-[a-z0-9]+)*$"` 수준의 제한과 `maxLength`
    - 모든 문자열 필드에 `maxLength` (prompt도 상한을 둘 것, 예: 20,000자)
    - URL 필드는 `format: uri` + `pattern: "^https://"` (javascript:, data:, http: 차단)
    - 배열에 `maxItems`
  - 통과: 위 조건이 모두 있고, `slug: "../x"`, `slug: "A B"`, `sourceUrl: "javascript:alert(1)"`, 알 수 없는 키가 들어간 테스트 YAML이 `npm run content`/`check:data`에서 **실패**한다. (이 네 케이스를 `tests/`에 음성 테스트로 넣어 두면 스키마 회귀를 막을 수 있습니다.)

- [ ] **A3. YAML 파서가 안전 모드인가** [릴리스/월 1회]
  - 확인: 로더 코드에서 사용하는 파서와 옵션 확인. js-yaml v4의 `load`(기본 스키마)나 `yaml` 패키지 기본값은 커스텀 태그로 코드 실행을 하지 않음. `!!js/function` 등 확장 스키마를 켜지 않았는지 확인.
  - 통과: 안전 스키마 사용, 중복 키를 오류로 처리(`yaml` 패키지는 기본 오류, js-yaml은 `json: false` 기본값에서 오류), 앵커/별칭 폭증(billion laughs)을 막는 제한(`maxAliasCount` 등)이 있거나 파일 크기 상한이 있다.

- [ ] **A4. slug 유일성과 파일명 일치** [PR마다, 자동]
  - 확인: `npm run check:data`
  - 통과: slug 중복 없음, 파일명 = `<slug>.yaml`, 참조(workflow/starter pack)가 모두 존재하는 slug를 가리킴.

- [ ] **A5. 검색어(`?query=`)는 값으로만 쓰이는가** [렌더링 코드 변경 시]
  - 확인: `rg -n "useSearchParams" src/` 후 query가 흘러가는 곳을 추적.
  - 통과: `<input value>`, 필터링 비교에만 쓰이고, `dangerouslySetInnerHTML`, `href`, `document.title` 직접 조작, `RegExp` 생성(ReDoS: 사용자가 `(a+)+$` 입력)에 들어가지 않는다. 하이라이트를 구현했다면 문자열 split 방식이지 HTML 삽입 방식이 아니다. `new RegExp(query)`를 쓴다면 이스케이프 처리되어 있다.

- [ ] **A6. localStorage 북마크를 신뢰하지 않는가** [렌더링 코드 변경 시]
  - 배경: GitHub Pages 프로젝트 사이트는 `yohan-work.github.io` **오리진을 같은 사용자 계정의 다른 모든 Pages 저장소와 공유**합니다. 다른 저장소 페이지의 스크립트가 `agent-archive:bookmarks`를 읽고 쓸 수 있으므로, 이 값은 외부 입력으로 취급해야 합니다.
  - 확인: 북마크 로드 코드.
  - 통과: `JSON.parse`가 try/catch로 감싸져 있고(이미 됨), 결과가 배열인지, 각 원소가 문자열인지 검사하고, **알려진 slug 목록과 교집합**만 사용한다. 저장된 값이 그대로 `href`나 HTML로 들어가는 경로가 없다. 배열 길이 상한(예: 500)이 있다.

### B. XSS / 주입 (렌더링)

- [ ] **B1. 위험 API 사용 여부** [PR마다, 자동 가능]
  - 확인: `rg -n "dangerouslySetInnerHTML|innerHTML|outerHTML|insertAdjacentHTML|eval\(|new Function|document\.write" src/`
  - 통과: 결과 없음. 있다면 각 사용처의 입력이 빌드 시 고정 상수이거나 아래 B2처럼 이스케이프가 검증된 것만 허용.

- [ ] **B2. JSON-LD / 인라인 스크립트의 `</script>` 탈출** [릴리스/월 1회]
  - 배경: `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />`는 흔한 패턴인데, `JSON.stringify`는 `<`를 이스케이프하지 않습니다. 에이전트 설명에 `</script><script>alert(1)</script>`가 들어가면 스크립트가 실행됩니다. 정적 사이트에서 가능한 거의 유일한 저장형 XSS 경로입니다.
  - 확인: `rg -n "ld\+json" src/`, 빌드 후 `rg -c "</script" out/**/*.html`와 비교해 비정상적으로 많은지, 테스트 YAML로 직접 확인.
  - 통과: 직렬화 시 `.replace(/</g, "\\u003c")`(필요하면 `>`, `&`, U+2028/2029도) 처리. 테스트 에이전트 설명에 `</script><img src=x onerror=alert(1)>`를 넣고 빌드한 페이지에서 alert가 뜨지 않는다.

- [ ] **B3. 마크다운 렌더링이 raw HTML을 허용하지 않는가** [렌더링 코드 변경 시]
  - 확인: `rg -n "react-markdown|rehype-raw|remark-html|marked|markdown-it" src/ package.json`
  - 통과: 마크다운 렌더러를 쓰지 않거나, 쓰더라도 `rehype-raw` 미사용 / `marked`는 sanitizer(DOMPurify 등) 적용 / 링크 프로토콜이 http(s)·mailto로 제한.

- [ ] **B4. YAML에서 온 URL의 링크 처리** [렌더링 코드 변경 시]
  - 확인: YAML 필드가 `href`/`src`에 들어가는 곳 전수 확인(`rg -n "href=\{" src/components`).
  - 통과: 스키마(A2)에서 `https://`만 허용하고, 외부 링크는 `rel="noopener noreferrer"`(`target="_blank"`일 때). 이미지 `src`에 외부 URL을 허용하지 않는다(추적 픽셀 방지).

- [ ] **B5. 메타데이터 / OG / sitemap 주입** [릴리스/월 1회]
  - 확인: `generateMetadata`에 들어가는 텍스트, `out/sitemap.xml`.
  - 통과: Next.js Metadata API로만 설정(자체 이스케이프됨). sitemap은 slug 패턴(A2) 덕분에 XML 특수문자가 들어갈 수 없고, `xmllint --noout out/sitemap.xml` 통과. sitemap에 비공개/내부 경로(예: 평가 결과, 초안)가 없다. robots.txt는 보안 통제가 아님을 인지(숨기고 싶은 경로를 robots.txt에 나열하지 않는다).

### C. 설치 키트 route handler

- [ ] **C1. 생성되는 파일 확장자 허용 목록** [릴리스/월 1회]
  - 배경: `output: "export"`에서 route handler는 빌드 시 **정적 파일로 떨어지고**, GitHub Pages는 코드에서 지정한 `Content-Type` 헤더가 아니라 **파일 확장자로** MIME을 결정합니다. 즉 `mimeType` 설정은 배포 환경에선 사실상 무시됩니다. 만약 파일명이 `.html`/`.svg`/`.xhtml`로 끝나는 조합이 생기면 기여자 텍스트가 사이트 오리진에서 HTML로 실행됩니다.
  - 확인: 빌드 후 `find out/kits -type f | sed 's/.*\.//' | sort | uniq -c`
  - 통과: 확장자가 `md`, `mdc`, (있다면) `txt`/`json`뿐이다. 파일명 목록은 코드 상수이며 YAML 값에서 오지 않는다(가정 A7).

- [ ] **C2. 실제 배포 응답 확인** [릴리스 시]
  - 확인: `curl -sI https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md` 및 `.mdc` 파일
  - 통과: `Content-Type`이 `text/markdown` 또는 `text/plain` 계열이거나 `application/octet-stream`(다운로드)이며, `text/html`이 아니다. `.mdc`가 octet-stream으로 나오면 보안 문제는 아니지만 사용자 경험상 문서에 적어 두기.

- [ ] **C3. generateStaticParams 범위** [PR마다, 자동]
  - 통과: `dynamicParams = false` 유지, 파라미터는 `agents` 배열에서만 생성, 404 경로 존재. (정적 export라 경로 순회는 원천적으로 불가하지만, slug 패턴(A2)이 두 번째 방어선.)

### D. 설치 키트를 통한 프롬프트 인젝션 (가장 중요)

키트 내용은 사용자의 코딩 에이전트에게 **신뢰된 지시문**으로 전달됩니다. 악의적인 기여자는 XSS가 아니라 "에이전트가 실행할 지시"를 심는 것이 목표일 것입니다. 사람 리뷰가 1차 방어이고, 자동 검사는 리뷰어가 놓치기 쉬운 "보이지 않는 것"을 잡는 용도입니다.

- [ ] **D1. 보이지 않는 문자 검사** [PR마다, 자동화 강력 권장]
  - 확인:
    ```bash
    rg -n '[\x{200B}-\x{200F}\x{202A}-\x{202E}\x{2060}-\x{2064}\x{2066}-\x{2069}\x{FEFF}\x{00AD}\x{E0000}-\x{E007F}]' content/agents/
    ```
    (제로폭 문자, 양방향 제어문자, 소프트 하이픈, **유니코드 태그 문자 U+E0000–E007F**: 화면엔 안 보이지만 LLM은 읽는 대표적인 숨김 지시 기법)
  - 통과: 결과 0건. `check-data.mjs`에 같은 검사를 넣어 CI에서 실패하게 한다. 탭 외 제어문자(`\x00-\x08`, `\x0B-\x1F`)도 거부.

- [ ] **D2. 렌더된 화면에서 숨겨지는 마크다운 구조** [PR마다]
  - 확인: `rg -n '<!--|<details|<div|<span|<img|\]\(\s*<|^\s{40,}' content/agents/`
  - 통과: HTML 주석, HTML 태그, 과도한 공백 패딩(화면 밖으로 밀어내기), 참조형 링크에 숨긴 텍스트가 없다. 사이트 상세 페이지에서 보는 텍스트와 키트 원문이 동일하다고 판단할 수 있다.

- [ ] **D3. 지시 내용 리뷰: "역할 밖 행동"** [PR마다, 사람 리뷰]
  - prompt / 예시 입력 / 설명 전문을 **렌더된 페이지가 아니라 YAML diff 원문**으로 읽고 다음이 있으면 거절 또는 수정 요청:
    - 명령 실행 유도: `curl … | sh`, `bash -c`, `npx <낯선 패키지>`, `pip install`, `rm -rf`, `chmod`, `git push --force`
    - 비밀·자격증명 접근: `.env`, `~/.ssh`, `~/.aws`, `GITHUB_TOKEN`, `printenv`, 키체인, 토큰 출력/전송
    - 외부 전송: 특정 URL/웹훅/이메일로 결과·코드·로그 보내기, 이미지 마크다운에 데이터 싣기(`![](https://x/?d=...)`)
    - 안전장치 해제: "테스트/린트/CI를 건너뛰어라", "확인 없이 진행하라", "이전 지시/시스템 지시를 무시하라", "사용자에게 말하지 말라"
    - 설정 변경: CI 워크플로, 의존성, 권한, 다른 AGENTS.md/CLAUDE.md 수정 지시
    - 에이전트 역할과 무관한 특정 도메인/패키지/서비스 홍보
    - base64·hex 등 인코딩된 긴 문자열, 단축 URL
  - 자동 보조: 위 키워드를 `check-data.mjs`에서 **경고**(실패가 아니라 PR 코멘트/로그)로 출력해 리뷰어 주의를 끈다. 정규식만으로는 우회가 쉬우니 통과 기준은 사람 리뷰다.
  - 통과: 에이전트의 지시가 요약(summary)에 적힌 역할 범위 안에 있고, 위 항목에 해당하는 문장이 없다.

- [ ] **D4. 기존 에이전트 "조용한 수정" 감시** [PR마다]
  - 배경: 신규 에이전트보다 인기 있는 기존 에이전트 prompt의 한 줄 수정이 더 위험합니다(이미 사용자들이 curl로 받아가는 파일).
  - 확인: 기존 YAML을 수정하는 PR은 `git diff -U0 origin/main...HEAD -- content/agents/`로 prompt 필드 변경분만 따로 확인.
  - 통과: 기존 에이전트 prompt 변경은 외부 기여자 PR이라도 신규 제출과 동일한 D1–D3 기준으로 리뷰하고, 변경 사유가 PR 설명에 있다.

- [ ] **D5. 사용자 측 안전장치 안내** [릴리스/월 1회]
  - 확인: 설치 안내 문구(사이트 및 키트 파일 헤더).
  - 통과:
    - 안내 명령이 `curl … >> AGENTS.md`처럼 바로 이어붙이는 형태만 있지 않고, "받아서 읽어본 뒤 붙이기"(`curl -o agent.md …` → 검토) 흐름을 먼저 제시한다.
    - 특정 버전 고정 방법을 제공한다(예: raw.githubusercontent.com의 **커밋 SHA 고정 URL**). 사이트 URL은 main 최신 내용이 계속 바뀔 수 있음을 명시.
    - 키트 파일 상단에 출처 주석(에이전트 slug, 소스 커밋 SHA, 원본 YAML 링크, "커뮤니티 기여 콘텐츠이며 검토 후 사용하라")이 들어간다.
    - (선택) 키트별 SHA-256 체크섬 목록을 빌드 시 생성해 게시.

### E. GitHub Actions / 공급망

- [ ] **E1. fork PR에서 쓰기 권한이 없는가** [릴리스/월 1회, 워크플로 변경 시 PR마다]
  - 확인: `rg -n "pull_request_target|workflow_run|issue_comment|issues:" .github/workflows/`
  - 통과: CI는 `pull_request`만 사용(외부 PR 코드는 읽기 전용 토큰·시크릿 없음으로 실행). `pull_request_target`이 있다면 PR head를 체크아웃·빌드하지 않는다(가능하면 제거).

- [ ] **E2. 워크플로 기본 권한 최소화** [릴리스/월 1회]
  - 확인: 각 워크플로 최상위 `permissions:`와 저장소 Settings → Actions → General → Workflow permissions.
  - 통과: 저장소 기본값 "Read repository contents"; CI 최상위 `permissions: contents: read`; `pages: write`, `id-token: write`는 **Deploy의 배포 job에만** 부여(워크플로 최상위가 아니라 job 단위가 이상적). `actions/checkout`에 `persist-credentials: false`.

- [ ] **E3. Deploy가 main push에서만 돌고, 신뢰된 코드만 배포하는가** [릴리스/월 1회]
  - 배경: Deploy가 `workflow_run`이면, **fork PR의 CI가 끝났을 때도 base 저장소 권한으로 Deploy 워크플로가 트리거**됩니다. 조건문이 느슨하거나 PR의 빌드 산출물(artifact)을 내려받아 배포하면 외부 코드가 Pages에 올라갈 수 있습니다.
  - 확인: Deploy 워크플로의 `if:` 조건과 체크아웃 대상.
  - 통과(모두 만족):
    - `github.event.workflow_run.conclusion == 'success'`
    - `github.event.workflow_run.event == 'push'`
    - `github.event.workflow_run.head_branch == 'main'`
    - `github.event.workflow_run.head_repository.full_name == github.repository`
    - Deploy job이 `head_sha`의 main 코드를 **직접 체크아웃해서 빌드**하거나, 같은 조건을 만족한 run의 artifact만 사용. PR run의 artifact를 받는 경로가 없다.
    - `environment: github-pages`에 Deployment branch 규칙 "main만 허용" 설정(Settings → Environments). 이게 조건문 실수에 대한 두 번째 방어선입니다.
  - (Deploy가 `push: main` + `needs: ci`라면 이 항목은 `on: push: branches: [main]` 확인만으로 통과.)

- [ ] **E4. 워크플로 식 주입** [워크플로 변경 시 PR마다]
  - 확인: `rg -n '\$\{\{\s*github\.(event|head_ref)' .github/workflows/`
  - 통과: `github.event.pull_request.title/body`, `github.head_ref`, `issue.body` 등 사용자 제어 값이 `run:` 스크립트에 직접 삽입되지 않는다. 필요하면 `env:`로 넘긴 뒤 `"$VAR"`로 사용.

- [ ] **E5. 이슈 폼 자동화 부재 확인** [릴리스/월 1회]
  - 통과: `new-agent.yml` 이슈를 트리거로 하는 워크플로가 없다(가정 A5). 추후 "이슈→YAML 자동 PR"을 만든다면 이슈 본문을 코드로 실행하지 않고, 생성된 PR도 A·D 리뷰를 동일하게 거치게 한다.

- [ ] **E6. Action 버전 고정** [릴리스/월 1회]
  - 확인: `rg -n "uses:" .github/workflows/`
  - 통과: 서드파티 Action은 **전체 커밋 SHA로 고정**(`uses: owner/action@<40자 SHA> # vX.Y.Z`). GitHub 공식(`actions/*`)도 SHA 고정 권장. Dependabot에 `package-ecosystem: github-actions`가 있어 SHA 갱신이 자동으로 온다.

- [ ] **E7. npm 의존성** [PR마다(자동) + 릴리스 시]
  - 확인:
    - CI가 `npm ci`(lockfile 고정) 사용 — 이미 충족
    - `npm audit --omit=dev --audit-level=high` (정적 export라 런타임 의존성 취약점 영향은 대부분 빌드 시점이지만, 클라이언트 번들에 들어가는 패키지는 영향 있음)
    - `npm audit signatures` (레지스트리 서명/출처 검증)
    - lockfile diff에서 `resolved`가 `registry.npmjs.org` 외 주소를 가리키지 않는지: `rg -n '"resolved": "(?!https://registry\.npmjs\.org)' package-lock.json --pcre2`
  - 통과: high/critical 없음(또는 영향 없음 사유를 기록), 서명 검증 통과, 외부 레지스트리·git URL 의존성 없음. 외부 기여자의 lockfile 변경은 A1에 의해 콘텐츠 PR에서 거절.

- [ ] **E8. Dependabot 구성의 빈틈** [릴리스/월 1회]
  - 확인: Settings → Code security에서 **Dependabot alerts**와 **Dependabot security updates**가 켜져 있는지, `dependabot.yml`의 major 제외가 `ignore`(update-types: semver-major)로 되어 있다면 그게 보안 업데이트에도 적용되는지.
  - 통과: security updates 활성화. major 제외 규칙 때문에 **보안 패치가 major 버전에만 있는 경우**가 막히지 않는지 확인(`ignore`는 보안 업데이트에도 적용될 수 있으니 GitHub 문서로 현재 동작을 확인하고, 필요하면 major는 그룹에서만 빼고 ignore는 쓰지 않는 방식으로). 열린 Dependabot alert 0건 또는 각 alert에 판단 기록.

- [ ] **E9. main 브랜치 보호** [릴리스/월 1회]
  - 통과: main에 ruleset/branch protection: PR 필수, CI 상태 체크 필수, force push·삭제 금지. 1인 메인테이너라 "승인 1명 필수"는 본인 PR을 막으니 생략 가능하지만, 외부 PR은 본인이 반드시 리뷰 후 머지. Settings → Actions → "Fork pull request workflows from outside collaborators"를 **"Require approval for first-time contributors"** 이상으로 설정.

### F. 비밀값

- [ ] **F1. 저장소에 비밀값이 필요 없는 상태 유지** [릴리스/월 1회]
  - 확인: Settings → Secrets and variables → Actions(저장소·환경 둘 다).
  - 통과: 시크릿 0개(Pages는 OIDC로 충분). 추가해야 한다면 해당 environment에만 두고 fork PR이 접근할 수 없는 워크플로에서만 사용.

- [ ] **F2. 시크릿 스캐닝 / 푸시 보호** [릴리스/월 1회]
  - 통과: 공개 저장소 무료 기능인 Secret scanning과 Push protection 활성화. 열린 알림 0건.

- [ ] **F3. 번들/산출물에 환경변수·내부 파일이 없는가** [릴리스 시]
  - 확인:
    - `rg -n "NEXT_PUBLIC_" src/ next.config.*` → 공개돼도 되는 값만
    - 빌드 후 `find out -name "*.map" -o -name ".env*" -o -name "*.yaml"` 및 `out/` 최상위 목록 확인
    - `rg -n "(ghp_|github_pat_|sk-[A-Za-z0-9]{20}|AKIA[0-9A-Z]{16}|-----BEGIN)" out/ content/`
  - 통과: `NEXT_PUBLIC_` 값이 공개 가능, `out/`에 소스맵(`productionBrowserSourceMaps` 미설정)·.env·원본 YAML·평가 작업물·내부 문서가 없음, 토큰 패턴 0건.

### G. 로깅 / 데이터 노출 / 개인정보

- [ ] **G1. 제출 폼의 데이터 흐름 고지** [렌더링 코드 변경 시]
  - 배경: 제출 폼 내용은 URL 쿼리로 GitHub에 전달되고, 이슈는 **공개**됩니다. 사용자가 사내 프롬프트나 토큰을 붙여넣을 수 있습니다.
  - 통과: 폼에 "제출 내용은 공개 GitHub 이슈가 됩니다. 비밀값·내부 정보를 넣지 마세요" 안내가 있다. 사이트 자체는 폼 입력을 localStorage/분석 도구로 보내지 않는다.

- [ ] **G2. 제출 URL 구성** [렌더링 코드 변경 시]
  - 확인: submit 컴포넌트 코드.
  - 통과: 베이스 URL(`https://github.com/yohan-work/agentive/issues/new`)과 `template` 값이 상수이고, 사용자 입력은 `URLSearchParams`로만 인코딩된다(문자열 연결 없음). `window.open`에 `noopener,noreferrer` 유지(이미 충족). 7000자 절단이 서로게이트 쌍/한글 조합 중간에서 깨지지 않는다(`Array.from(str).slice(...)` 또는 `Intl.Segmenter`). 절단 시 사용자에게 잘렸다고 표시.
  - 참고: 긴 쿼리 URL은 브라우저 기록과 GitHub 접근 로그에 남습니다. 비밀값을 넣지 말라는 G1 안내로 대응하는 것이 현실적입니다.

- [ ] **G3. 외부 요청 / 추적 없음** [릴리스 시]
  - 확인: 배포 페이지에서 DevTools Network 탭, 또는 `rg -n "https?://" out/**/*.html | rg -v "yohan-work.github.io|github.com|schema.org|w3.org"` 로 외부 도메인 목록 확인.
  - 통과: 외부 스크립트·폰트·이미지 요청이 없거나, 있다면 목록화되어 있고 의도된 것이다. (에이전트 YAML이 외부 이미지를 끌어오지 못하게 한 B4와 연결)

- [ ] **G4. console 출력** [PR마다, 자동]
  - 통과: 프로덕션 번들에 디버그용 `console.log`로 내부 데이터 덤프가 없다(ESLint `no-console` 경고 수준이면 충분).

### H. 보안 헤더 (GitHub Pages 제약 하에서)

커스텀 HTTP 헤더는 못 쓰지만, 일부는 `<meta>`로 대체할 수 있습니다.

- [ ] **H1. HTTPS 강제** [릴리스/월 1회]
  - 통과: Settings → Pages → "Enforce HTTPS" 체크. `curl -sI http://yohan-work.github.io/agentive/`가 301로 https 이동.

- [ ] **H2. meta CSP** [릴리스/월 1회]
  - 배경: `<meta http-equiv="Content-Security-Policy">`는 대부분 지시어가 동작합니다(`frame-ancestors`, `report-uri`, `sandbox`는 meta로 불가). Next.js 정적 export는 인라인 스크립트(`self.__next_f.push(...)`)를 생성하므로, 빌드마다 바뀌는 해시를 관리하지 않는 한 `script-src`에 `'unsafe-inline'`이 필요합니다. 그래도 아래 지시어만으로 의미 있는 제한이 됩니다.
  - 권장 값(루트 레이아웃 `<head>`에 가능한 한 앞쪽 배치):
    ```
    default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
    img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none';
    base-uri 'self'; form-action 'none'; upgrade-insecure-requests
    ```
    (외부 이미지/폰트를 쓰면 해당 도메인만 추가)
  - 통과: 배포 페이지 콘솔에 CSP 위반 오류가 없고, 사이트 기능(검색, 북마크, 제출 창 열기, 키트 다운로드)이 정상 동작한다. `object-src 'none'`과 `base-uri 'self'`가 들어가 있다.

- [ ] **H3. Referrer 정책** [릴리스/월 1회]
  - 통과: `<meta name="referrer" content="strict-origin-when-cross-origin">`(Next.js Metadata `referrer` 필드로 설정 가능). 외부 링크에 `rel="noreferrer"`.

- [ ] **H4. 클릭재킹** [인지만]
  - 판단: `frame-ancestors`/`X-Frame-Options`는 Pages에서 설정 불가. 이 사이트에는 로그인·상태 변경 동작이 없어 실질 리스크는 낮음. 통과 기준은 "리스크 수용으로 기록"입니다. 향후 인증이 필요한 기능이 생기면 Cloudflare 등 헤더를 제어할 수 있는 호스팅으로 옮기는 것이 전제 조건.

- [ ] **H5. 실제 헤더 기록** [릴리스 시]
  - 확인: `curl -sI https://yohan-work.github.io/agentive/en/`
  - 통과: 결과를 한 번 기록해 두고(Pages가 어떤 헤더를 기본 제공하는지), 이후 변화가 있으면 알아챌 수 있게 한다.

---

## 3. 리스크 요약 (우선순위순)

| 순위 | 리스크 | 가능성 | 영향 | 현재 방어 | 남는 빈틈 |
|---|---|---|---|---|---|
| 1 | 기여 prompt에 숨긴/노골적 악성 지시 → 사용자 에이전트가 명령 실행·비밀 유출 | 중 | **높음**(영향이 이 사이트가 아니라 사용자 저장소·머신) | 스키마 검증, 1인 리뷰 | 보이지 않는 문자·HTML 주석 자동 검사 없음, 기존 에이전트 조용한 수정, 사용자가 검토 없이 curl 붙임 |
| 2 | Deploy 트리거 조건 느슨 → fork PR 코드가 Pages로 배포 | 저~중(설정에 달림) | 높음(사이트 전체 변조, 키트 변조) | "CI 성공 후 main push일 때만" | `workflow_run` 조건 4개와 environment 브랜치 규칙이 모두 있는지 미확인 |
| 3 | JSON-LD 등 인라인 스크립트의 `</script>` 탈출로 저장형 XSS | 저(해당 코드가 있을 때만) | 중(같은 오리진의 다른 Pages 사이트 localStorage까지 접근 가능) | React 이스케이프 | `dangerouslySetInnerHTML` 사용처 확인 필요 |
| 4 | 공급망: 악성/취약 npm 패키지, 태그 고정 Action | 저 | 중~높음 | `npm ci`, Dependabot | Action SHA 미고정 가능성, major 제외 규칙이 보안 패치를 막을 가능성 |
| 5 | 키트 파일이 HTML로 서빙 | 매우 낮음(파일명 고정 시) | 중 | 고정 파일명 | 확장자 검사 자동화 없음 |
| 6 | 공유 오리진 localStorage 변조 | 저 | 저(북마크 표시 오류 정도) | JSON 파싱 실패 처리 | 원소 타입/알려진 slug 필터 확인 필요 |
| 7 | 사용자가 제출 폼에 비밀값 입력 → 공개 이슈 | 중 | 저~중(사용자 측 유출) | 없음 | 안내 문구 |
| 8 | 보안 헤더 부재(클릭재킹, CSP) | - | 저 | 없음 | meta CSP로 일부 보완, 나머지는 수용 |

---

## 4. PR 템플릿에 붙일 짧은 버전

```markdown
### Security check
**모든 PR**
- [ ] CI 통과 (schema, check:data, lint, typecheck, test, build)
- [ ] 변경 범위 확인: 콘텐츠 PR이면 `content/agents/*.yaml`만 변경됨 (package*.json, .github/, scripts/, src/ 변경 없음)
- [ ] `dangerouslySetInnerHTML` / `innerHTML` / `eval` 신규 사용 없음 (또는 이스케이프 검증 완료)

**에이전트 YAML 추가/수정 시**
- [ ] 보이지 않는 문자 검사 0건 (제로폭, 양방향 제어, U+E0000 태그 문자)
- [ ] HTML 주석/HTML 태그/과도한 공백 없음
- [ ] prompt·예시·설명 원문(YAML diff)을 읽음: 명령 실행 유도, 비밀·자격증명 접근, 외부 전송, 안전장치 해제("테스트 건너뛰기", "이전 지시 무시", "사용자에게 알리지 말 것"), 인코딩 문자열, 무관한 URL/패키지 없음
- [ ] 기존 에이전트 수정이면 prompt 변경분을 따로 확인하고 변경 사유가 PR에 있음
- [ ] URL 필드는 https만

**워크플로/의존성 변경 시**
- [ ] `pull_request_target` 없음, 사용자 제어 `${{ github.event.* }}`가 `run:`에 직접 들어가지 않음
- [ ] 권한은 job 단위 최소, Action은 SHA 고정
- [ ] lockfile의 resolved가 registry.npmjs.org만, `npm audit --omit=dev` high 이상 없음
```

---

## 5. 다음 액션 (작업량 대비 효과순)

1. **Deploy 워크플로 조건 점검 (10분)**: E3의 조건 4개와 `github-pages` environment의 "main만 허용" 규칙을 확인·추가. 가장 적은 노력으로 가장 큰 사고(사이트·키트 전체 변조)를 막습니다.
2. **`check-data.mjs`에 콘텐츠 인젝션 검사 추가 (1–2시간)**: 보이지 않는 문자·제어문자·HTML 주석·HTML 태그는 **실패**, 위험 키워드(D3 목록)와 URL은 **경고**. 101개 기존 파일에 먼저 돌려 기준선 확인. `tests/`에 음성 케이스 추가.
3. **스키마 강화 (1시간)**: slug 패턴, 모든 문자열 `maxLength`, URL `^https://`, `additionalProperties: false`, 음성 테스트 4종(A2).
4. **`dangerouslySetInnerHTML`/JSON-LD 확인 (30분)**: 있으면 `<` 이스케이프 적용하고 `</script>` 테스트 YAML로 검증(B2).
5. **설치 안내와 키트 헤더 개선 (1시간)**: "받아서 검토 후 붙이기" 흐름, 커밋 SHA 고정 URL, 키트 상단 출처·주의 주석(D5).
6. **저장소 설정 한 번에 점검 (30분)**: 기본 워크플로 권한 read, fork PR 승인 요구, 브랜치 보호, Secret scanning + Push protection, Dependabot security updates, Enforce HTTPS (E2, E8, E9, F2, H1).
7. **Action SHA 고정 + Dependabot `github-actions` 생태계 추가 (30분)** (E6).
8. **meta CSP + referrer 추가 후 배포 페이지에서 기능 확인 (1시간)** (H2, H3).
9. **북마크 로더에 타입·알려진 slug 필터 추가, 제출 폼에 공개 이슈 안내 문구 추가 (30분)** (A6, G1).
10. **SECURITY.md 작성**: 취약점 제보 경로(GitHub Private vulnerability reporting 활성화), 특히 "악성 에이전트 prompt 발견 시 신고 방법"과 대응 절차(해당 에이전트 즉시 제거 → 재배포 → 이슈/릴리스 노트로 사용자 공지)를 적어 두면, 1번 리스크가 실제로 발생했을 때 대응 시간이 줄어듭니다.

필요하시면 2번(`check-data.mjs` 인젝션 검사)이나 E3 조건이 들어간 Deploy 워크플로 예시를 코드로 써 드릴게요.
