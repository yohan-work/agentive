# Agent Archive 배포 전 보안 점검 체크리스트

주신 정보로 체크리스트를 만들 수 있어서 추가 질문은 드리지 않았습니다. 확인하지 못한 부분은 아래 **가정**에 적었으니, 사실과 다른 항목이 있으면 해당 체크 항목만 조정하시면 됩니다.

구성은 다음과 같습니다.
1. 가정
2. 영역별 체크리스트 (확인 방법 / 통과 기준, 우선순위 P0~P2)
3. PR 템플릿에 붙일 압축본
4. 리스크
5. 다음 액션

---

## 1. 가정

- **A1.** 서드파티 스크립트(애널리틱스, 광고, 댓글 위젯)와 외부 폰트·CDN 스크립트를 쓰지 않습니다.
- **A2.** 사이트에 영향을 주는 빌드 시 환경변수나 시크릿이 없습니다. Deploy는 GitHub 기본 `GITHUB_TOKEN`과 OIDC(`id-token`)만 사용합니다.
- **A3.** 이슈를 YAML이나 PR로 자동 변환하는 봇이나 워크플로가 없습니다. 이슈 내용은 메인테이너가 손으로 옮깁니다.
- **A4.** 에이전트 텍스트(prompt, 설명, 예시)는 React 텍스트 노드로 렌더되며, HTML을 허용하는 마크다운 렌더러를 쓰지 않습니다. 이 가정이 틀리면 XSS 항목이 P0로 올라갑니다.
- **A5.** YAML에 URL 필드(출처, 작성자 링크 등)가 있고, 이 값이 `<a href>`로 렌더됩니다.
- **A6.** 기본 도메인 `yohan-work.github.io`를 사용하며 커스텀 도메인은 없습니다.
- **A7.** 저장소는 public이고, 외부 기여자는 fork에서 PR을 보냅니다.

---

## 2. 영역별 체크리스트

### 2-1. 외부 기여 YAML과 입력 검증 (공급망 1: 콘텐츠)

| # | 우선 | 항목 | 확인 방법 | 통과 기준 |
|---|---|---|---|---|
| C1 | P0 | 스키마가 엄격한가 | `schema/agent.schema.json`에서 루트와 중첩 객체의 `additionalProperties`를 확인 | 모든 객체가 `additionalProperties: false`이고, 모든 문자열 필드에 `maxLength`가 있음 (예: prompt 20k, 요약 300) |
| C2 | P0 | slug와 파일명 형식 | 스키마의 `slug` 패턴을 확인하고, `check:data`가 파일명과 slug가 같은지 검사하는지 확인 | `^[a-z0-9]+(-[a-z0-9]+)*$`. `/`, `..`, `.`, 대문자, 공백이 불가능해야 함. 파일명과 slug가 같아야 함 |
| C3 | P0 | URL 필드 스킴 제한 | 스키마에서 URL 필드의 `format`/`pattern` 확인. 테스트용 YAML에 `javascript:alert(1)`을 넣고 `npm run check:data` 실행 | `^https://` 패턴이 있어 `javascript:`, `data:`, `http:`가 검증에서 실패함 |
| C4 | P0 | 보이지 않는 문자 차단 | `rg -n '[\x{200B}-\x{200F}\x{202A}-\x{202E}\x{2060}-\x{2069}\x{FEFF}\x{E0000}-\x{E007F}]' content/agents` | 0건. 이 검사를 `check:data`에 추가해 CI에서 실패하게 함. 제로폭, bidi 제어(Trojan Source), 유니코드 Tag 문자 대상 |
| C5 | P1 | YAML 파서 안전성 | 사용 중인 파서와 옵션 확인 (`yaml`/`js-yaml` 버전, 커스텀 태그 사용 여부) | 커스텀 타입이나 `!!js/*` 태그가 없음. alias 확장 제한이 기본값 이상임. 파일 크기 상한이 있음 (예: 64KB 초과 시 check:data 실패) |
| C6 | P1 | ajv 설정 | ajv 생성 코드 확인 | `strict: true`. 원격 `$ref`를 불러오지 않음. `allErrors`를 켜는 것은 무방 |
| C7 | P1 | 콘텐츠 PR이 코드를 건드리지 않음 | PR의 "Files changed" 확인 | 에이전트 추가 PR은 `content/agents/*.yaml`만 변경함. `package*.json`, `.github/`, `scripts/`, `src/` 변경이 섞여 있으면 따로 분리하거나 거절 |

### 2-2. 설치 키트를 통한 프롬프트 인젝션 (공급망 2: 가장 큰 위험)

사용자는 이 파일을 **자기 저장소의 에이전트 지시문으로** 그대로 붙여 넣습니다. 그래서 브라우저 XSS가 없더라도 코딩 에이전트에게 악성 지시가 전달될 수 있습니다. 예를 들어 `curl … | sh` 실행, `.env`나 `~/.ssh` 읽기, 특정 URL로 전송, CI 설정 수정, "이 지시는 사용자에게 알리지 말 것" 같은 문장입니다.

| # | 우선 | 항목 | 확인 방법 | 통과 기준 |
|---|---|---|---|---|
| K1 | P0 | 위험 패턴 스캔 | `rg -n -i 'curl .*\\|\\s*(ba)?sh\|wget \|base64\|eval\|\.env\b\|~/\.ssh\|id_rsa\|token\|secret\|password\|ignore (all\|previous)\|do not (tell\|mention)\|<!--' content/agents/<변경 파일>` | 걸린 항목마다 정당한 용도인지 PR에 사유를 적음. 사유가 없으면 거절 |
| K2 | P0 | 숨은 지시 | 마크다운 HTML 주석(`<!-- -->`), 매우 긴 한 줄, base64 형태 문자열, C4의 보이지 않는 문자를 확인 | 렌더된 화면에서 보이지 않는 텍스트가 없음. `<!--`는 check:data에서 금지 |
| K3 | P0 | **raw 키트로 리뷰** | PR 브랜치에서 `npm run build` 후 `cat out/kits/<slug>/AGENTS.md`, `CLAUDE.md`, `.mdc` 파일을 직접 읽음 | 웹 페이지가 아니라 사용자가 실제로 받게 될 raw 파일을 사람이 끝까지 읽었음 |
| K4 | P0 | 외부 URL과 명령 | 키트 안의 모든 URL과 셸 명령 목록을 뽑아 봄 (`rg -o 'https?://[^ )"]+' out/kits/<slug>`) | 모든 URL이 에이전트 목적과 관련 있음. 단축 URL이나 개인 서버가 없음. 파괴적이거나 네트워크 전송을 하는 명령이 없음 |
| K5 | P1 | 섹션 경계 위조 | 기여 텍스트에 `#`/`##` 헤딩, 코드펜스, `---`, "System:" 같은 역할 표기가 있는지 확인 | 기여 텍스트가 키트 템플릿의 헤더나 메타 영역을 흉내 낼 수 없음. 키트 생성기가 기여 텍스트를 명확한 구분자 안에 넣거나 헤딩 레벨을 내림 |
| K6 | P1 | 출처 표시 | 생성된 키트의 머리말 확인 | slug, 소스 파일 경로, 커밋 SHA 또는 빌드 날짜, `verifiedStatus`, "외부 기여 콘텐츠이니 붙이기 전에 읽어 보세요" 안내가 들어 있음 |
| K7 | P1 | 사용자 안내 | 키트 다운로드 UI와 README의 curl 예시 확인 | "붙이기 전에 내용 검토"와 "특정 커밋에 고정된 raw URL 사용법"이 안내되어 있음 |
| K8 | P2 | 기존 101개 일괄 점검 | K1, K2, C4 스캔을 전체 `content/agents`에 1회 실행 | 걸린 항목을 모두 처리하거나 사유를 기록함 |

### 2-3. XSS와 렌더링

| # | 우선 | 항목 | 확인 방법 | 통과 기준 |
|---|---|---|---|---|
| X1 | P0 | 위험 API 사용 여부 | `rg -n 'dangerouslySetInnerHTML\|innerHTML\|outerHTML\|insertAdjacentHTML\|document\.write\|new Function\|eval\(' src` | 0건. 있다면 각 위치의 입력이 빌드 시 상수이거나 sanitize된 값임을 증명할 수 있음 |
| X2 | P0 | 마크다운/HTML 렌더러 | `rg -n 'rehype-raw\|allowDangerousHtml\|marked\|markdown-it\|remark' src package.json` | HTML 통과 옵션이 없음. 쓴다면 `rehype-sanitize` 같은 허용목록 기반 sanitize를 적용함 |
| X3 | P0 | href 렌더링 | 외부 링크 컴포넌트 확인 + C3 | 스키마에서 https만 허용함(C3). `target="_blank"`에는 `rel="noopener noreferrer"`(필요하면 `ugc nofollow`)가 붙어 있음 |
| X4 | P1 | JSON-LD 등 인라인 스크립트 | `rg -n 'application/ld\+json\|<script' src` | 사용한다면 `JSON.stringify` 결과의 `<`를 `<`로 치환해 `</script>`로 탈출할 수 없음 |
| X5 | P1 | 메타데이터 주입 | `generateMetadata`에서 YAML 텍스트를 title/description/OG에 쓰는지 확인 | Next 메타데이터 API로만 출력함(자동 이스케이프). 문자열을 이어 붙여 태그를 만들지 않음 |
| X6 | P1 | 빌드 산출물 스모크 테스트 | 테스트용 YAML에 `<img src=x onerror=alert(1)>`, `</script><script>alert(1)</script>`, `{{7*7}}`을 넣고 빌드한 뒤 해당 페이지 HTML을 확인 | 모든 페이로드가 `&lt;` 등으로 이스케이프되어 텍스트로만 보임. 확인 후 테스트 파일은 삭제 |

### 2-4. 키트 route handler (`src/app/kits/[slug]/[file]/route.ts`)

중요한 점이 하나 있습니다. **GitHub Pages는 route handler가 설정한 `Content-Type` 헤더를 쓰지 않습니다.** 정적 export된 파일을 **확장자 기준으로** 서빙합니다. 따라서 코드의 `mimeType`보다 산출물의 파일명과 확장자가 실제 동작을 결정합니다.

| # | 우선 | 항목 | 확인 방법 | 통과 기준 |
|---|---|---|---|---|
| R1 | P0 | 파일명 허용목록 | `generateStaticParams`에서 `file` 값의 출처 확인 | `file`은 코드에 하드코딩된 고정 목록(예: `AGENTS.md`, `CLAUDE.md`, `<slug>.mdc`)에서만 나옴. YAML 값으로 파일명이 결정되지 않음 |
| R2 | P0 | 산출물에 HTML/SVG 없음 | `find out/kits -type f \| sed 's/.*\.//' \| sort \| uniq -c` | 확장자가 `md`/`mdc`(또는 `txt`)뿐임. `.html`/`.htm`/`.svg`/`.xml`이 없음 |
| R3 | P0 | 경로 탈출 없음 | `find out/kits -mindepth 2 -maxdepth 2 -type d \| wc -l`과 에이전트 수 비교. C2 통과 여부 | 디렉터리 수가 에이전트 수와 같고, 모든 파일이 `out/kits/<slug>/` 아래에만 있음 |
| R4 | P1 | 배포 후 실제 헤더 | `curl -sI https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md`와 `.mdc` 파일 | `content-type`이 `text/html`이 아님(`text/markdown`, `text/plain`, `application/octet-stream`은 허용). `x-content-type-options: nosniff`가 붙는지도 기록 |
| R5 | P2 | 404 동작 | 존재하지 않는 slug로 `curl -sI` | 404 반환. 다른 에이전트 키트가 반환되지 않음 |

### 2-5. 클라이언트 입력: 제출 폼, 북마크, 검색

| # | 우선 | 항목 | 확인 방법 | 통과 기준 |
|---|---|---|---|---|
| F1 | P1 | 이슈 URL 고정 | 제출 폼 코드 확인 | 호스트, 경로, `template` 값이 상수임. 사용자 입력은 `URLSearchParams` 값으로만 들어감(문자열 연결 없음) |
| F2 | P1 | 잘라내기 안전성 | 7000자 초과 입력(이모지, 한글 포함)으로 테스트 | 서로게이트 쌍이 깨지지 않도록 코드포인트 단위(`Array.from`)로 자름. 잘렸다는 사실을 사용자에게 알림 |
| F3 | P1 | 민감정보 경고 | 폼 UI 확인 | "공개 GitHub 이슈로 올라갑니다. API 키, 내부 URL, 개인정보를 넣지 마세요" 문구가 있음 |
| F4 | P0 (A3이 틀린 경우) | 이슈 자동화 | `rg -n 'issues:\|github\.event\.issue' .github/workflows` | 이슈 트리거 워크플로가 없음. 있다면 `run:` 안에서 `${{ github.event.issue.* }}`를 직접 쓰지 않고 `env:`로 전달함(스크립트 인젝션 방지). 권한은 최소로 설정 |
| B1 | P2 | 북마크 파싱 | 북마크 코드 확인. DevTools에서 `localStorage.setItem('agent-archive:bookmarks','{"a":1}')`, `'[1,null,"../x"]'`, `'not json'`, 1MB 문자열을 넣은 뒤 새로고침 | 크래시가 없음. 배열이면서 slug 정규식을 통과하고 **실제 존재하는 slug**만 남김. `localStorage` 접근 자체도 try/catch로 감쌈(사파리 프라이빗 모드 등) |
| S1 | P1 | 검색어 사용처 | `rg -n 'useSearchParams\|new RegExp' src` | query가 input value와 텍스트 필터에만 쓰임. `href`, HTML, `RegExp`에 쓰인다면 이스케이프함. 길이 상한(예: 200자) 있음 |
| S2 | P2 | 하이라이트 | 검색 결과 하이라이트 구현이 있다면 확인 | 문자열을 split해서 React 노드로 렌더함. HTML 문자열을 만들지 않음 |

### 2-6. 의존성 (공급망 3)

| # | 우선 | 항목 | 확인 방법 | 통과 기준 |
|---|---|---|---|---|
| D1 | P0 | 알려진 취약점 | `npm audit --omit=dev` 및 `npm audit` | 프로덕션 의존성에 high/critical 0건. dev 의존성의 high 이상은 영향 분석을 기록함(정적 사이트라 대부분 빌드 시에만 영향) |
| D2 | P0 | lockfile 무결성 | `npm ci` 사용 확인. `rg -n '"resolved": "http' package-lock.json \| rg -v 'registry.npmjs.org'` | CI가 `npm ci`를 씀. 모든 resolved가 `https://registry.npmjs.org`임 |
| D3 | P1 | Dependabot 보안 업데이트 | 저장소 Settings → Code security에서 Dependabot alerts와 security updates가 켜져 있는지 확인. `dependabot.yml`의 `ignore` 확인 | 알림과 보안 업데이트가 켜져 있음. major 제외 규칙 때문에 **보안 패치가 필요한 major 업그레이드가 묻히지 않도록**, 알림 목록을 월 1회 직접 확인함 |
| D4 | P1 | Dependabot PR 리뷰 | Dependabot PR의 lockfile diff 확인 | 새로 추가된 transitive 패키지와 `install` 스크립트가 있는 패키지를 확인함. 자동 머지는 CI 통과 + patch/minor에만 허용 |
| D5 | P1 | Actions 의존성 | `rg -n 'uses:' .github/workflows \| rg -v '@[0-9a-f]{40}'` | 서드파티 액션은 커밋 SHA로 고정함(공식 `actions/*`도 권장). `dependabot.yml`에 `package-ecosystem: github-actions`가 있음 |
| D6 | P2 | Next.js 권고 추적 | Next.js 보안 권고 확인 | 해당 권고가 middleware, 이미지 최적화, 서버 액션 등 **서버 기능**에만 해당하면 정적 export에는 영향 없음으로 기록함. 빌드 도구나 클라이언트 런타임에 해당하면 업데이트 |

### 2-7. GitHub Actions와 저장소 설정

| # | 우선 | 항목 | 확인 방법 | 통과 기준 |
|---|---|---|---|---|
| G1 | P0 | fork PR에서 권한 상승 없음 | `rg -n 'pull_request_target\|workflow_run' .github/workflows` | CI는 `pull_request` 트리거임. `pull_request_target`에서 PR 코드를 checkout하는 곳이 없음 |
| G2 | P0 | **Deploy 트리거 조건** | Deploy 워크플로의 `on:`과 `if:` 확인 | `workflow_run`이라면 `conclusion == 'success'`, `event == 'push'`, `head_branch == 'main'`, **`head_repository.full_name == github.repository`** 를 모두 검사함. fork에도 `main`이라는 브랜치가 있을 수 있으므로 마지막 조건이 필요함. checkout은 `workflow_run.head_sha` 기준 |
| G3 | P0 | 최소 권한 | 각 워크플로 최상단과 job별 `permissions:` 확인 | CI는 `contents: read`만 가짐. `pages: write`와 `id-token: write`는 **deploy job에만** 있고 build job에는 없음 |
| G4 | P0 | Pages 환경 보호 | Settings → Environments → `github-pages` | Deployment branches가 `main`으로 제한되어 있음 |
| G5 | P0 | 기본 토큰 권한 | Settings → Actions → General | Workflow permissions가 "Read repository contents"임. "Allow GitHub Actions to create and approve pull requests"는 꺼져 있음 |
| G6 | P0 | 외부 기여자 워크플로 승인 | Settings → Actions → "Fork pull request workflows" | "Require approval for first-time contributors" 이상으로 설정됨. 승인 전에 `.github/`, `package*.json`, `scripts/` 변경이 있는지 확인 |
| G7 | P1 | checkout 자격증명 | `rg -n -A3 'actions/checkout' .github/workflows` | `persist-credentials: false`(push가 필요 없는 job) |
| G8 | P1 | 브랜치 보호 | Settings → Branches(또는 Rulesets) → main | PR 필수, CI 필수 체크(check:data, lint, typecheck, test, build), force push 금지. 1인 메인테이너라면 "관리자 우회"를 켜 두되, 우회는 기록이 남을 때만 사용 |
| G9 | P1 | CODEOWNERS | `.github/CODEOWNERS` 확인 | `.github/`, `package*.json`, `scripts/`, `src/lib/agent-install-kit.ts`, `schema/`에 소유자가 지정되어 있음 |
| G10 | P2 | 계정 보안 | GitHub 계정 설정 | 2FA(가능하면 패스키 또는 하드웨어 키)가 켜져 있음. 오래된 PAT와 불필요한 OAuth 앱을 정리함 |

### 2-8. 비밀값

| # | 우선 | 항목 | 확인 방법 | 통과 기준 |
|---|---|---|---|---|
| P1 | P0 | 저장소 스캔 | `gitleaks detect --source . --log-opts="--all"`(히스토리 포함) | 0건. 오탐은 `.gitleaksignore`에 사유와 함께 등록 |
| P2 | P0 | 빌드 산출물 스캔 | `rg -n 'ghp_\|github_pat_\|gho_\|sk-[A-Za-z0-9]\|AKIA[0-9A-Z]{16}\|BEGIN [A-Z ]*PRIVATE KEY' out content` | 0건. 기여 YAML의 예시 입력에 실제 키가 들어가는 경우를 막기 위함 |
| P3 | P1 | 클라이언트 번들 env | `rg -n 'process\.env' src` | `NEXT_PUBLIC_*` 외 값이 없음. `NEXT_PUBLIC_*` 값은 공개되어도 되는 것뿐임 |
| P4 | P1 | GitHub 기능 | Settings → Code security | Secret scanning과 Push protection이 켜져 있음(public 저장소는 무료) |
| P5 | P2 | 시크릿 목록 | Settings → Secrets and variables → Actions | 사용하지 않는 시크릿이 없음(A2 기준으로 비어 있는 것이 정상) |

### 2-9. 로깅과 데이터 노출

| # | 우선 | 항목 | 확인 방법 | 통과 기준 |
|---|---|---|---|---|
| L1 | P1 | 소스맵 | `find out -name '*.map' \| wc -l`, `next.config`의 `productionBrowserSourceMaps` | 0개(또는 공개해도 된다고 명시적으로 결정함). 오픈소스라 치명적이지는 않지만, 의도하지 않은 노출을 막기 위해 확인 |
| L2 | P1 | 기여자 개인정보 | 스키마의 author 계열 필드 확인 | 이메일이나 전화번호 필드가 없음. GitHub 핸들이나 공개 URL만 받음 |
| L3 | P1 | 빌드 로그 | 최근 CI/Deploy 로그 훑어보기 | env 덤프(`env`, `printenv`), 토큰, 내부 경로 이외의 민감정보가 출력되지 않음. public 저장소의 Actions 로그는 누구나 볼 수 있음 |
| L4 | P2 | 산출물에 불필요한 파일 | `ls -la out`, `find out -name '.*'` | `.env`, `.git`, 원본 YAML, 테스트 픽스처, `_template`/draft 에이전트가 포함되지 않음 |
| L5 | P2 | sitemap/robots | `cat out/sitemap.xml out/robots.txt` | 공개 페이지만 나열함. robots를 "숨기기" 용도로 쓰지 않음(robots는 보안 통제가 아님). URL이 모두 `https://yohan-work.github.io/agentive/...`임 |
| L6 | P2 | 클라이언트 콘솔 | 주요 페이지에서 DevTools 콘솔 확인 | 디버그 로그와 내부 데이터 덤프가 없음 |

### 2-10. 보안 헤더 (GitHub Pages 제약)

커스텀 응답 헤더는 설정할 수 없습니다. 가능한 범위는 **HTTPS 강제**와 **`<meta>` 태그**뿐입니다. `frame-ancestors`, `X-Frame-Options`, HSTS는 meta로 적용할 수 없다는 점을 받아들이고 리스크로 기록합니다. 로그인도 없고 상태를 바꾸는 동작도 없어서 클릭재킹 영향은 낮습니다.

| # | 우선 | 항목 | 확인 방법 | 통과 기준 |
|---|---|---|---|---|
| H1 | P0 | HTTPS 강제 | Settings → Pages에서 "Enforce HTTPS" 확인. `curl -sI http://yohan-work.github.io/agentive/` | HTTPS 강제가 켜져 있고, http 요청이 301로 https로 이동함 |
| H2 | P1 | meta CSP | `app/[locale]/layout`에 `<meta http-equiv="Content-Security-Policy">` 추가 여부 | 최소한 `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'`. Next 정적 export는 인라인 스크립트를 넣기 때문에 `'unsafe-inline'`이 필요하며, 이 경우 CSP는 XSS 방지책이 아니라 **외부 출처 로드를 차단하는 용도**라는 점을 인지함 |
| H3 | P1 | CSP 동작 확인 | 배포 후(또는 `npx serve out`) 전 페이지 순회, 콘솔 확인 | CSP 위반 에러가 0건. 검색, 북마크, 제출 폼, 키트 다운로드가 정상 동작함 |
| H4 | P2 | Referrer 정책 | `<meta name="referrer" content="strict-origin-when-cross-origin">` | 적용됨(외부 링크로 검색어 등 URL 쿼리가 새지 않게 함) |
| H5 | P2 | 헤더 현황 기록 | `curl -sI https://yohan-work.github.io/agentive/en/` | 결과를 문서에 기록함. Pages가 기본으로 주는 헤더(HSTS 등)와 줄 수 없는 헤더를 구분해 둠 |

---

## 3. PR 템플릿에 붙일 압축본

매 PR마다 전부 확인할 필요는 없도록 **PR 종류별**로 나눴습니다. 해당하지 않는 섹션은 지우고 쓰시면 됩니다.

```markdown
## 보안 체크 (해당 섹션만)

### 모든 PR
- [ ] CI 통과 (check:data, lint, typecheck, test, build)
- [ ] `rg -n 'dangerouslySetInnerHTML|innerHTML|eval\(|new Function' src` 신규 0건
- [ ] `.github/`, `package*.json`, `scripts/` 변경 여부 확인 (있으면 아래 "코드/워크플로" 섹션 필수)

### 에이전트 콘텐츠 PR (content/agents/*.yaml)
- [ ] YAML 외 파일 변경 없음
- [ ] 보이지 않는 문자 0건 (C4 명령)
- [ ] 위험 패턴 스캔 결과 확인, 걸린 항목에 사유 기재 (K1 명령)
- [ ] `<!--`, base64 형태 문자열, 비정상적으로 긴 줄 없음
- [ ] 로컬 빌드 후 `out/kits/<slug>/` raw 파일(AGENTS.md / CLAUDE.md / .mdc)을 끝까지 읽음
- [ ] 키트 안 URL과 셸 명령이 모두 목적에 맞음 (단축 URL, 개인 서버, `curl | sh` 없음)
- [ ] URL 필드가 https:// 로 시작
- [ ] verifiedStatus와 점수가 실제로 테스트한 수준을 넘지 않음
- [ ] 실제 키나 개인정보 없음 (예시 입력 포함)

### 코드 / 워크플로 / 의존성 PR
- [ ] `npm audit --omit=dev` high/critical 0건
- [ ] lockfile resolved가 모두 registry.npmjs.org
- [ ] 새 의존성: 필요성, 유지 상태, install 스크립트 확인
- [ ] 워크플로: `pull_request_target` 미사용, job별 최소 permissions, 서드파티 액션 SHA 고정
- [ ] Deploy 조건: push + main + 같은 저장소(head_repository) + CI success
- [ ] `run:`에서 `${{ github.event.* }}` 사용자 입력을 직접 쓰지 않음
- [ ] 키트 route 변경 시: `find out/kits -type f` 확장자가 md/mdc만 있음

### 릴리스(배포) 직전
- [ ] `gitleaks detect` 0건, 산출물 시크릿 패턴 0건
- [ ] `find out -name '*.map'` 결과 의도대로
- [ ] XSS 페이로드 스모크 테스트 통과 (X6), 테스트 파일 삭제
- [ ] 배포 후 `curl -sI` 로 키트 content-type이 text/html 아님, http가 https로 리다이렉트
- [ ] 주요 페이지 콘솔에 CSP 위반과 에러 없음
```

한 번만 설정하면 되는 항목(G4~G6, G8~G10, P4, D3, H1)은 PR 템플릿이 아니라 **분기별 점검 이슈**로 따로 관리하는 편이 낫습니다.

---

## 4. 리스크 (심각도 순)

| 순위 | 리스크 | 영향 | 가능성 | 현재 완화책 | 남는 리스크 |
|---|---|---|---|---|---|
| 1 | **설치 키트를 통한 프롬프트 인젝션**: 외부 기여 prompt에 악성 지시가 섞여 사용자의 코딩 에이전트가 실행함 | 높음: 사용자 저장소, 시크릿, CI에 피해가 가고 프로젝트 신뢰도도 잃음 | 중간: 기여가 열려 있고 텍스트가 길어 리뷰에서 놓치기 쉬움 | 스키마 검증뿐(형식만 검사하고 의미는 검사하지 않음) | K1~K7 적용 후에도 교묘한 자연어 지시는 사람 리뷰에 의존함. 사용자에게 "읽고 붙이기" 안내가 반드시 필요함 |
| 2 | **Deploy 워크플로 조건 오류**로 fork 코드가 Pages에 배포됨 | 높음: 사이트 변조(악성 JS, 키트 교체) | 낮음~중간: `workflow_run` 조건 누락은 흔한 실수 | CI 성공 조건 | G2와 G4를 적용하면 낮음 |
| 3 | **의존성 공급망**: 빌드 의존성 탈취로 산출물 변조 | 높음 | 낮음 | npm ci, Dependabot | major 제외 설정 때문에 보안 업데이트가 지연될 수 있음(D3) |
| 4 | **링크/렌더링 XSS**: `javascript:` URL, 인라인 스크립트 탈출, HTML 허용 렌더러 | 중간: 로그인이 없어 탈취할 세션은 없지만 피싱, 키트 링크 조작 가능 | 낮음(React 기본 이스케이프) | React 이스케이프 | C3, X1~X4 확인 전까지는 미확정 |
| 5 | **헤더 제약**: CSP가 약하고 frame-ancestors, nosniff를 제어할 수 없음 | 낮음 | 낮음 | 정적, 무로그인 | 수용. meta CSP로 외부 출처만 차단 |
| 6 | **제출 폼으로 인한 민감정보 공개**: 사용자가 사내 프롬프트나 키를 붙여 공개 이슈에 올림 | 중간(사용자 쪽 피해) | 중간 | 없음 | F3 경고 문구로 낮춤 |
| 7 | **메인테이너 1인 계정 탈취** | 치명적: 모든 통제를 우회함 | 낮음 | 알 수 없음 | G10(2FA, 토큰 정리)이 사실상 마지막 방어선 |

---

## 5. 다음 액션

**이번 주 (P0, 대부분 30분 이내)**
1. Deploy 워크플로의 트리거와 `if:` 조건 확인(G2), `github-pages` 환경을 main으로 제한(G4), 기본 토큰 권한 read 설정(G5), fork 워크플로 승인 설정(G6).
2. 스키마 강화: `additionalProperties: false`, `maxLength`, slug 패턴, URL `^https://`(C1~C3).
3. `check:data`에 보이지 않는 문자와 `<!--` 금지 검사 추가(C4, K2). CI에서 자동으로 실패하도록 하는 것이 핵심입니다.
4. 기존 101개 YAML에 C4, K1, K2 스캔을 1회 실행하고 결과 처리(K8).
5. 빌드 후 `find out/kits` 확장자 확인, 배포 후 `curl -sI`로 content-type 확인(R2, R4).

**이번 달 (P1)**
6. 키트 생성기 개선: 출처와 커밋 SHA, `verifiedStatus`, "검토 후 사용" 머리말 추가. 기여 텍스트를 구분자 안에 넣기(K5, K6). 사이트와 README에 사용자 안내 추가(K7).
7. `.github/CODEOWNERS` 추가, 브랜치 보호/Ruleset 설정(G8, G9).
8. Actions SHA 고정과 `github-actions` Dependabot 추가(D5), Secret scanning과 Push protection 켜기(P4).
9. meta CSP와 referrer 정책 추가 후 전 페이지 동작 확인(H2~H4).
10. 제출 폼에 공개 경고 문구 추가, 코드포인트 단위로 자르도록 수정(F2, F3).

**지속**
11. 3절의 PR 템플릿을 `.github/pull_request_template.md`에 반영.
12. 분기별 점검 이슈 템플릿(한 번만 설정하는 항목 + Dependabot 알림 확인 + 계정 보안)을 만들어 반복.
13. 필요하면 C4와 K1 스캔을 GitHub Action으로 만들어, 콘텐츠 PR에 결과를 자동 코멘트하게 하기. 1인 리뷰 부담을 가장 많이 줄여 줍니다.

가정 중 **A3(이슈 자동화 없음)** 이나 **A4(HTML 렌더러 없음)** 가 사실과 다르면 알려 주세요. 해당 영역을 P0 기준으로 더 자세히 나눠 드리겠습니다.
