# /agents 모바일 성능 감사

## 요약

측정값을 보면 원인이 네트워크보다 **메인 스레드 작업**에 몰려 있습니다. 데스크톱은 LCP 0.9s인데 4x CPU 스로틀링에서 3.8s이고, TBT가 1,420ms, hydration long task 하나가 640ms입니다. 원인은 세 가지로 보입니다.

1. **클라이언트로 넘기는 데이터가 너무 큽니다.** 카드와 검색에 쓰지 않는 필드(프롬프트, evaluation, sample runs 등)까지 100개 전부 RSC payload로 직렬화되고 있습니다. 1.14MB HTML 중 790KB가 이 payload이고, 브라우저는 이를 모두 파싱한 뒤 hydration합니다.
2. **`useSearchParams` + Suspense 구조 때문에 카드 그리드를 두 번 렌더할 가능성이 큽니다.** 정적 export에서는 `useSearchParams`를 쓰는 컴포넌트가 빌드 때 Suspense fallback으로 대체됩니다. HTML에는 fallback(`AgentSearchPanel`)이 들어가고, 클라이언트에서 fallback을 hydration한 뒤 `AgentSearchPanelFromUrl`이 새 트리를 마운트해 교체합니다. 즉 카드 100개 + 칩 80개 + BookmarkButton 100개를 두 번 처리합니다.
3. **키 입력 한 번마다 하는 일이 전부 동기적입니다.** 검색 문자열 100개를 새로 만들고, 결과 전체를 다시 렌더하며, 디바운스나 우선순위 분리가 없습니다.

아래 권고 중 P0 세 개(데이터 슬림화, 이중 렌더 제거, 검색 경로 최적화)만 해도 목표(LCP < 2.5s, INP < 200ms, TBT < 600ms)에 도달할 가능성이 높다고 봅니다. 다만 수치는 추정이므로 P0마다 재측정해서 확인해야 합니다.

---

## 측정값 → 원인 연결

| 증상 | 가장 유력한 원인 | 근거 / 확인 방법 |
|---|---|---|
| HTML 1.14MB, RSC 790KB | 에이전트 전체 객체를 client props로 직렬화 | `out/ko/agents/index.html`에서 프롬프트 본문의 고유 문자열을 grep해 몇 번 나오는지 확인 |
| hydration long task 640ms | 거대한 payload 파싱 + 카드 100개 hydration + (fallback → 실제 컴포넌트) 재마운트 | Performance 패널에서 long task 안의 `JSON.parse`/Flight 디코딩 비중과 React commit 횟수 확인 |
| TBT 1,420ms | 위 long task + BookmarkButton 100개의 스토어 구독/스냅샷 계산 + 재마운트 | Bottom-Up 뷰에서 함수별 self time 확인 |
| LCP 3.8s (H1, FCP 1.9s) | H1은 텍스트라 리소스 로딩 지연은 없고 **render delay**입니다. H1이 Suspense 경계 안에 있어 교체 때 새 노드로 다시 그려지거나, 메인 스레드가 막혀 페인트가 늦어지는 경우 | DevTools Performance → LCP 항목의 phase breakdown(TTFB / render delay)과 LCP 노드가 교체된 새 노드인지 확인 |
| INP 280~340ms | 입력마다 100개 × 긴 문자열 join + toLowerCase, 결과 전체 재렌더, 한글 IME 조합 중에도 매번 필터링 | Performance 패널 Interactions 트랙에서 input delay / processing / presentation 분해 |
| JS 312KB(gzip) | 페이지 규모에 비해 큼. 428KB `agents.ts`를 클라이언트 모듈이 import하고 있을 가능성 | 번들 분석(아래 P1-4) |

> 참고: "리뷰"를 한글 IME로 입력하면 ㄹ → 리 → 립 → 리뷰처럼 조합 단계마다 input 이벤트가 생깁니다. 두 글자여도 무거운 필터링이 4~6번 돕니다.

---

## 권고 (우선순위순)

### P0-1. 클라이언트로 넘기는 데이터를 카드/검색용 최소 필드로 줄이기

**증상 → 원인:** RSC 790KB, 640ms hydration task, 1.14MB HTML 파싱. 카드는 name/summary/배지/태그만 보여 주는데 props에는 프롬프트, realUseCases, evaluation, sample runs까지 들어 있습니다.

**변경:**
- 서버 컴포넌트(`page.tsx`)에서 `AgentListItem` 같은 슬림 타입으로 매핑해서 넘깁니다. 카드 렌더링 필드와 필터용 필드(카테고리, roles, tools 등)만 남깁니다.
- 검색용 텍스트는 서버에서 미리 **하나의 소문자 문자열(`searchText`)** 로 만들어 함께 넘깁니다. realUseCases가 길다면 전체 원문 대신 제목/키워드만 넣을지 결정이 필요합니다(아래 리스크 참고).
- 가능하면 이 매핑을 `npm run content` 단계에서 `src/data/generated/`에 별도 산출물(예: `agent-index.ts`)로 생성해 빌드마다 재계산하지 않게 합니다.

**예상 효과(추정):** RSC payload 790KB → 약 80~150KB. HTML 압축 해제 크기가 절반 이하로 줄고, hydration task의 파싱 부분이 크게 줄어듭니다. TBT와 LCP render delay 모두에 직접 기여합니다.

**검증:**
- 빌드 후 `out/ko/agents/index.html`의 크기와 `self.__next_f` 스크립트 합계를 전후로 비교합니다(아래 P2-1 스크립트로 자동화).
- 프롬프트 본문의 고유 문자열이 HTML에 0회 나와야 합니다.
- Mid-tier mobile 조건에서 hydration long task 시간과 TBT를 전후 비교합니다.

### P0-2. `useSearchParams` Suspense 경계를 없애 이중 렌더/재마운트 제거

**증상 → 원인:** 640ms long task, LCP H1 지연. 정적 export에서 `useSearchParams`는 빌드 시 가장 가까운 Suspense 경계까지 CSR bailout을 일으킵니다. 그래서 fallback을 먼저 hydration하고, 그다음 실제 컴포넌트를 새로 마운트해 DOM을 교체합니다. fallback과 본 컴포넌트가 같은 `agents` props를 받으므로 payload에 참조가 두 번 들어가는 것도 확인이 필요합니다.

**변경(권장안):**
- `useSearchParams` 대신 hydration 이후 URL을 읽습니다. 예를 들어 `useSyncExternalStore(subscribe, () => location.search, () => "")`를 쓰면 서버/첫 렌더에서는 빈 쿼리로 서버 HTML과 일치시키고, 이후 URL 필터를 적용합니다. URL 갱신은 `history.replaceState`로 하고, 뒤로가기는 `popstate`로 구독합니다.
- 이렇게 하면 Suspense 경계가 필요 없어지고, 컴포넌트는 **한 번만 hydration**됩니다. URL에 쿼리가 없는 대부분의 방문(검색엔진 유입 포함)에서는 추가 렌더가 없습니다.
- H1, 페이지 소개 문구 등 정적 부분은 반드시 클라이언트 경계 **밖**(서버 컴포넌트)에 둡니다.

**대안:** 서버가 카드 100개 HTML을 그리고, 클라이언트는 필터/검색 UI만 담당하면서 카드의 표시 여부만 `hidden` 속성으로 토글합니다(카드는 React가 관리하지 않음). 성능은 가장 좋지만 구조 변경이 커서 P0-1/P0-2/P0-3으로 목표에 못 미칠 때 검토하는 편이 좋겠습니다.

**예상 효과(추정):** 카드/칩/BookmarkButton 처리가 한 번 줄어서 hydration 구간이 30~50% 감소합니다. H1이 교체되지 않으면 LCP가 FCP 근처(현재 기준 약 2s 안팎)로 당겨질 수 있습니다.

**검증:**
- Performance 패널에서 페이지 로드 중 React commit이 카드 그리드 기준 1회인지 확인합니다.
- LCP 노드가 서버 HTML의 H1과 같은 노드인지 확인합니다(교체되면 LCP 타이밍이 뒤로 밀림).
- `/ko/agents?q=리뷰` 같은 쿼리 URL로 직접 진입했을 때 필터가 정상 적용되는지, 뒤로가기가 동작하는지 회귀 테스트합니다.

### P0-3. 검색/입력 경로 최적화 (INP)

**증상 → 원인:** 키 입력당 280~340ms. 문자열 생성 + 결과 전체 재렌더가 입력 이벤트와 같은 우선순위로 동기 실행됩니다.

**변경 (새 의존성 없음):**
1. **검색 텍스트 사전 계산:** P0-1의 `searchText`를 사용하면 키 입력당 작업이 `includes` 100번으로 줄어듭니다. 빌드 단계로 옮기기 어렵다면 최소한 `useMemo(() => agents.map(...), [agents])`로 한 번만 만듭니다.
2. **`useDeferredValue(query)`:** 입력창은 즉시 갱신하고, 결과 계산/렌더는 deferred 값으로 합니다. React 19 내장 기능이며, 연속 입력 중에는 이전 렌더를 버리므로 IME 조합 중에 이벤트가 몰려도 입력 반응이 막히지 않습니다.
3. **카드 재렌더 차단:** `AgentCard`를 `React.memo`로 감싸고 `key={slug}`를 유지하고, props는 원본 객체 참조로 넘겨 결과에 남은 카드는 재렌더되지 않게 합니다. 필터 패널(칩 80개)도 query가 바뀔 때 재렌더되지 않도록 memo 처리하거나 상태를 분리합니다.
4. (선택) 결과가 바뀌지 않았으면(같은 slug 목록) 그리드 업데이트를 건너뜁니다.

디바운스(예: 150ms)도 가능하지만 결과가 늦게 뜨는 체감이 생깁니다. `useDeferredValue`를 먼저 적용하고, 그래도 부족할 때 추가하길 권합니다.

**예상 효과(추정):** 입력 처리 시간이 수십 ms 이하로 줄어 INP 100~150ms대가 예상됩니다. presentation delay(렌더/레이아웃)는 결과 개수에 좌우되므로 P1-2와 함께 보면 더 안정적입니다.

**검증:**
- Performance 패널(4x CPU)에서 "리뷰"를 빠르게 입력해 Interactions 트랙의 가장 긴 interaction을 확인합니다. input delay / processing / presentation 각각을 기록합니다.
- 콘솔에서 `PerformanceObserver`로 `event` 엔트리(`durationThreshold: 16`)를 모아 최댓값을 봅니다. web-vitals 라이브러리를 추가할 필요는 없습니다.
- 5회 반복해 중앙값을 비교합니다.

### P1-1. BookmarkButton 100개의 스토어 구독 정리

**증상 → 원인:** TBT, hydration. 카드마다 `useSyncExternalStore`로 localStorage를 구독합니다. `getSnapshot`이 매 호출마다 `localStorage.getItem` + `JSON.parse`를 한다면 렌더마다 100번 파싱합니다. 또 매번 새 배열/객체를 반환하면 무한 재렌더 경고나 불필요한 재렌더가 생깁니다. 서버 스냅샷(빈 값)과 클라이언트 스냅샷이 다르면 hydration 직후 100개 전부 다시 렌더됩니다.

**변경:** 북마크 스토어를 모듈 하나로 만들어 raw 문자열이 바뀔 때만 파싱해 `Set`을 캐시하고, 리스너는 모듈 수준에서 한 번만 `storage` 이벤트에 등록합니다. 카드에서는 `useSyncExternalStore(subscribe, () => store.has(slug))`처럼 **원시값(boolean)** 을 반환하게 합니다. 그러면 바뀐 카드만 재렌더됩니다.

**예상 효과(추정):** TBT 수십~100ms대 감소. 북마크 수가 많은 사용자일수록 효과가 큽니다.

**검증:** Bottom-Up에서 `getSnapshot`/`JSON.parse` self time 확인. 북마크 20개를 저장한 상태와 비운 상태 각각에서 TBT를 측정합니다.

### P1-2. 화면 밖 카드의 렌더링 비용 줄이기 (SEO 유지)

**증상 → 원인:** 100개 카드를 한 번에 레이아웃/페인트합니다(presentation delay, 초기 렌더). 페이지네이션이나 "더 보기"는 JS 없는 HTML에서 카드를 빼게 되어 SEO 요구와 충돌합니다.

**변경:** 카드(또는 12개 단위 그룹)에 `content-visibility: auto`와 `contain-intrinsic-size`를 적용합니다. Tailwind 3에서는 `[content-visibility:auto] [contain-intrinsic-size:auto_280px]` 같은 arbitrary property로 가능합니다. HTML은 그대로 남고 화면 밖 카드의 레이아웃/페인트만 생략됩니다. 가상화 라이브러리는 SEO와 새 의존성 문제로 권하지 않습니다.

**예상 효과(추정):** 초기 렌더와 검색 결과 갱신 시 레이아웃 비용 감소. INP presentation 부분에 기여합니다.

**검증:** Performance 패널의 Layout/Paint 시간 전후 비교. CLS가 0.1을 넘지 않는지 확인합니다(intrinsic size를 실제 카드 높이에 맞춰야 함). 브라우저 찾기(Ctrl+F)와 앵커 이동이 정상인지도 확인합니다.

### P1-3. LCP 요소(H1) 경로 점검

**변경:** H1이 서버 컴포넌트에서 렌더되고 Suspense/클라이언트 경계 밖에 있는지 확인합니다. 웹폰트를 쓴다면 `next/font`에서 `display: "swap"`인지, 한글 폰트 파일이 크지 않은지 봅니다. 한글 웹폰트가 block이면 텍스트 LCP가 폰트 로드까지 밀립니다.

**검증:** LCP phase breakdown에서 render delay 비중이 줄었는지 확인합니다. 폰트 요청이 LCP 전에 끝나는지 Network 워터폴을 봅니다.

### P1-4. JS 312KB(gzip) 원인 파악

**변경:** 먼저 분석부터 합니다.
- `src/data/generated/agents.ts`(428KB)나 이를 import하는 모듈이 `"use client"` 파일의 import 체인에 있는지 확인합니다(예: BookmarkButton이나 유틸이 `getAgentBySlug`를 import). 그렇다면 데이터가 props와 번들 양쪽에 중복됩니다.
- lucide 아이콘은 named import(`import { X } from "lucide-react"`)인지 확인합니다.
- 번들 분석: Next 16 버전에 내장 분석기(`next experimental-analyze`)가 있으면 그것을, 없으면 `npx source-map-explorer`로 일회성 분석합니다(`productionBrowserSourceMaps` 임시 활성화). 프로젝트 의존성은 추가하지 않습니다.

**예상 효과:** 분석 결과에 따라 다릅니다. 데이터 모듈이 클라이언트 번들에 들어가 있다면 수십~100KB 이상(gzip) 줄어들 수 있습니다.

**검증:** `out/_next/static/chunks`에서 /agents가 로드하는 청크의 gzip 합계를 전후 비교합니다. Network 패널 JS 전송량도 확인합니다.

### P2-1. 회귀 방지용 크기 예산

`scripts/`에 빌드 후 실행하는 체크를 추가합니다. `out/ko/agents/index.html`의 크기, 인라인 `self.__next_f` 합계, /agents 청크 gzip 합계가 예산(예: HTML 300KB 비압축, RSC 150KB)을 넘으면 CI를 실패시킵니다. 새 에이전트가 늘어도 다시 부풀지 않게 하는 장치입니다. 예산 값은 P0 적용 후 실측치 + 여유분으로 정합니다.

### P2-2. 필터 칩 80개

칩 자체는 가볍지만 query 변경마다 재렌더되지 않게 P0-3에서 분리합니다. 칩별 결과 개수를 표시하고 있다면 그 계산도 매 입력마다 100 × 80번이 되므로 deferred 값 기준으로 계산하거나 memo 처리합니다.

---

## 측정 프로토콜 (모든 이슈 공통)

- 조건: 배포본(또는 `npx serve out`으로 로컬 정적 서빙), `/ko/agents`, Chrome DevTools "Mid-tier mobile"(4x CPU, Fast 4G), 캐시 비움, 시크릿 창(확장 프로그램 제외).
- 각 지표 **5회 측정, 중앙값** 기록. Lighthouse는 편차가 크므로 점수보다 LCP/TBT 원값을 봅니다(`npx lighthouse <url> --form-factor=mobile`을 여러 번 실행).
- 이슈마다 "전/후" 표(HTML 크기, RSC 크기, JS gzip, FCP, LCP, TBT, 가장 긴 long task, INP)를 남깁니다.
- 9/27 측정값을 기준선으로 둡니다. 실제 기기(중저가 Android) 1회 확인을 권합니다.

---

## GitHub 이슈 분할 제안

| # | 제목 | 우선순위 | 의존 | 주 지표 |
|---|---|---|---|---|
| 1 | perf: /agents에 슬림 에이전트 목록과 사전 계산된 searchText 전달 | P0 | - | RSC 크기, TBT, LCP |
| 2 | perf: /agents에서 useSearchParams Suspense bailout 제거 | P0 | - | long task, LCP |
| 3 | perf: 검색 입력에 useDeferredValue 적용 + AgentCard/필터 패널 memo | P0 | #1 권장 | INP |
| 4 | perf: 북마크 스토어를 단일 캐시 스토어로 교체 | P1 | - | TBT |
| 5 | perf: 카드 그리드에 content-visibility 적용 | P1 | - | INP presentation, 렌더 |
| 6 | perf: /agents LCP(H1)와 폰트 경로 점검 | P1 | #2 이후 | LCP |
| 7 | chore: /agents 번들 분석과 클라이언트 번들의 데이터 모듈 제거 | P1 | - | JS 크기 |
| 8 | ci: 빌드 산출물 크기 예산 체크 | P2 | #1, #7 이후 | 회귀 방지 |

#1, #2, #4, #7은 서로 독립이라 기여자들이 병렬로 진행할 수 있습니다.

---

## 가정

- 590KB 이상의 RSC 데이터가 카드에서 쓰지 않는 필드라고 가정했습니다. 프롬프트/사례 텍스트가 전체 데이터의 대부분이라는 점(`agents.ts` 428KB)에 근거한 추정입니다.
- `AgentSearchPanelFromUrl`이 `useSearchParams`를 사용해 빌드 시 fallback이 HTML에 들어간다고 가정했습니다. 이름과 Suspense 구조에서 추론한 것이므로 #2 착수 전에 확인이 필요합니다.
- 예상 효과 수치는 모두 추정이며, 실측으로 대체해야 합니다.
- LCP H1의 지연이 render delay라는 판단은 텍스트 LCP라는 점과 FCP–LCP 간격(1.9s)에 근거합니다.

## 리스크

- **검색 범위 축소:** realUseCases 전문을 검색 대상에서 빼면 지금은 찾히던 결과가 안 찾힐 수 있습니다. 전문을 유지하되 payload에서 문자열 하나로만 보내는 방식이 절충안이며, 이 경우 payload 절감 폭이 줄어듭니다.
- **URL 동기화 회귀:** P0-2 이후 쿼리 URL 직접 진입, 뒤로가기, 공유 링크 동작이 바뀔 수 있습니다. 쿼리 URL로 진입하면 첫 페인트에 전체 목록이 보였다가 필터가 적용되는 짧은 전환이 생깁니다.
- **content-visibility:** 카드 높이 추정이 틀리면 스크롤바가 튀거나 CLS가 생길 수 있습니다. Safari 지원은 비교적 최근이지만, 미지원 브라우저에서는 그냥 무시되므로 기능 문제는 없습니다.
- **memo 효과:** props로 매 렌더 새 객체/함수를 넘기면 `React.memo`가 무력화됩니다. 리뷰할 때 확인해야 합니다.
- 데이터가 100개에서 더 늘면 P0만으로는 부족해질 수 있습니다. #8 예산 체크가 그 시점을 알려 주는 신호 역할을 합니다.

## 다음 액션

1. (30분) 가정 확인: 빌드 산출물에서 프롬프트 문자열 grep, `AgentSearchPanelFromUrl`의 `useSearchParams` 사용 여부, 클라이언트 import 체인에 `generated/agents` 포함 여부.
2. 위 확인 결과로 이슈 #1~#8을 생성하고, 9/27 기준선 표를 각 이슈에 첨부합니다.
3. #1과 #2를 먼저 머지하고 재측정합니다. 여기서 LCP/TBT 목표 달성 여부를 판단합니다.
4. #3 적용 후 INP를 재측정합니다. 200ms를 못 넘기면 #5와 디바운스를 추가합니다.
5. 목표 달성 후 #8로 예산을 고정합니다.
