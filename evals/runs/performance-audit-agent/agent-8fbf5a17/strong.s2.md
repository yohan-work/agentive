# `/agents` 모바일 성능 감사

## 요약

측정값을 보면 증상 세 가지의 원인이 대부분 한 곳에 몰려 있습니다. **에이전트 100개의 전체 객체가 클라이언트로 넘어가고, 그 데이터로 클라이언트가 카드 100개를 처음부터 다시 그리는 구조**입니다.

| 목표 | 현재 | 목표치 | 주 원인(추정) | 핵심 조치 |
|---|---|---|---|---|
| LCP | 3.8s | < 2.5s | 1.14MB HTML 파싱과 메인 스레드 점유, Suspense fallback이 교체되면서 H1이 늦게 다시 그려질 가능성 | R1 props 경량화, R2 CSR bailout 제거 |
| TBT | 1,420ms | < 600ms | 790KB RSC payload 파싱, 카드 100개 클라이언트 렌더(640ms long task), 312KB JS | R1, R2, R3 번들 점검 |
| INP | 280~340ms | < 200ms | 키 입력마다 긴 문자열 100개 생성 + 카드 100개 동기 재렌더 | R4 검색 인덱스 사전 계산, R5 `useDeferredValue` + memo |

권장 순서: **진단(D0, 반나절) → R1 → R2 → R4/R5 → 재측정 → 필요할 때만 R6~R8.** R1~R5만으로 세 목표 모두 도달할 가능성이 높다고 보지만, 아래 가정 몇 가지는 코드를 직접 확인해야 확정됩니다. 그래서 D0을 먼저 둡니다.

---

## 1. 측정값 해석: 증상과 원인 연결

**HTML 1.14MB 중 RSC payload가 790KB입니다.**
`agents.ts` 소스는 428KB인데 payload는 그 약 1.85배입니다. 가능한 이유는 두 가지입니다.
1. **이중 직렬화.** `agents`가 Suspense의 `fallback`(`AgentSearchPanel`)과 본체(`AgentSearchPanelFromUrl`) 양쪽에 props로 들어갑니다. Flight가 같은 참조를 한 번만 내보내는지는 구조에 따라 다르므로 확인이 필요합니다.
2. **이스케이프 오버헤드.** payload는 `self.__next_f.push([1,"..."])` 안에 JS 문자열로 들어가므로 `"`, 줄바꿈, 백틱이 많은 프롬프트 텍스트는 크기가 커집니다.

어느 쪽이든 카드 목록에는 프롬프트, evaluation, sample runs가 필요 없습니다. 이 데이터는 전부 낭비입니다.

**hydration long task 640ms**
`useSearchParams()`를 쓰는 컴포넌트가 Suspense 안에 있으면, 정적 export에서 그 경계는 **클라이언트 렌더링으로 bailout**됩니다. HTML에는 fallback(카드 100개가 있는 `AgentSearchPanel`)이 들어가고, 클라이언트에서는 이것을 hydrate하지 않고 `AgentSearchPanelFromUrl` 트리를 **새로 렌더한 뒤 DOM을 교체**합니다. 카드 100개, 칩 80개, BookmarkButton 100개를 처음부터 만드는 비용이 이 long task의 대부분이라고 추정합니다.

**LCP 3.8s(H1), FCP 1.9s**
텍스트 요소인 H1의 LCP가 FCP보다 1.9초 늦은 것은 이상 신호입니다. 텍스트 LCP에는 리소스 로드 시간이 없으므로 거의 전부 *render delay*입니다. 후보 가설은 두 가지입니다.
- (a) H1이 `AgentSearchPanel` 안에 있어서 fallback이 교체될 때 새 노드로 다시 그려진다.
- (b) 거대한 인라인 스크립트 파싱과 실행이 메인 스레드를 막아 H1의 첫 페인트가 늦어진다.

두 가지는 D0에서 구분합니다.

**JS 312KB(gzip)**
Next 16과 React 19의 기본 런타임은 보통 이것보다 훨씬 작습니다. **클라이언트 컴포넌트나 그 유틸(예: `src/lib/search.ts`, 북마크, 스타터팩 관련 모듈)이 `src/data/agents`를 import해서 데이터가 JS 번들에도 들어갔을 가능성**이 있습니다. 그렇다면 같은 데이터를 HTML과 JS로 두 번 받는 셈입니다.

**INP 280~340ms(키 입력당)**
키 입력 하나가 동기적으로 다음 작업을 모두 수행합니다.
1. 에이전트 100개에 대해 긴 문자열을 join하고 `toLowerCase()`한다(할당량은 수백 KB 수준).
2. 결과 배열이 새로 만들어진다.
3. `AgentGrid`, 카드 전체, 필터 칩 80개를 재렌더하고 커밋하고 레이아웃을 다시 계산한다.

그리고 **한국어 IME 입력은 자모 조합 단계마다 `onChange`가 발생**합니다. "리뷰"를 치면 ㄹ→리→립→리뷰처럼 이벤트가 여러 번 생기고 매번 이 작업 전체가 돕니다. 1번과 3번 중 어느 쪽이 더 큰지는 프로파일로 확인해야 하지만, 구조상 3번(렌더와 레이아웃)이 더 클 것으로 봅니다.

**데스크톱은 정상**
CPU 4배 스로틀링에서만 문제가 커지는 것은 네트워크보다 **메인 스레드 작업량** 문제라는 뜻입니다. 전송 크기(186KB gzip)는 Fast 4G에서 수백 ms 수준이라 주범은 아닙니다.

---

## 2. 가정

코드를 직접 보지 못했기 때문에 아래를 가정합니다. 틀린 항목이 있으면 해당 권고의 우선순위가 바뀝니다.

1. `AgentSearchPanelFromUrl`은 `useSearchParams()`로 초기 query/filters를 읽고 `AgentSearchPanel`에 넘기는 래퍼이며, H1과 결과 개수 같은 헤더가 `AgentSearchPanel` 안에 있다.
2. `/ko/agents`에 넘어가는 agent 객체에 en/ko 텍스트가 모두 들어 있을 수 있다. 그렇다면 R1의 효과가 더 커진다.
3. `BookmarkButton`의 `getSnapshot`은 호출될 때마다 `localStorage.getItem` + `JSON.parse`를 할 수 있다. 버튼 100개면 렌더마다 100번이다.
4. `AgentCard`는 `React.memo`가 아니고, 결과 배열이 바뀌면 카드 전체가 재렌더된다.
5. 웹폰트는 `next/font`로 `display: swap`이다. 폰트가 LCP의 주 원인은 아니라고 본다.
6. GitHub Pages는 gzip만 제공하고 캐시 헤더(`max-age=600`)를 바꿀 수 없다. 그래서 전송 최적화보다 **보내는 양과 실행량 줄이기**가 유일한 레버다.
7. 측정값은 단일 실행 값이다. 스로틀링 환경에서는 실행마다 ±15~20% 흔들릴 수 있다.

---

## 3. 권고

각 항목은 GitHub 이슈 하나로 옮길 수 있게 썼습니다. 효과 수치는 **추정치**이고 근거를 함께 적었습니다. 확정값은 재측정으로 얻어야 합니다.

### D0. 진단: 가설 확인 (P0, 반나절, 코드 변경 없음)

**목적:** R1~R5의 우선순위와 효과 추정을 확정합니다.

로컬에서 `npm run build` 후 `out/`을 대상으로 아래를 확인합니다.

- [ ] **payload 중복 여부.** 한 에이전트 프롬프트에만 있는 고유 문장 하나를 골라 `out/ko/agents` HTML에서 등장 횟수를 셉니다(`grep -o "고유 문장" out/ko/agents*.html | wc -l`). HTML 본문에 1회, payload에 1회면 정상이고, payload에 2회 이상이면 이중 직렬화입니다.
- [ ] **JS 번들에 데이터 포함 여부.** 같은 문장을 `grep -l "고유 문장" out/_next/static/chunks/*.js`로 찾습니다. 나오면 R3이 P0으로 올라갑니다.
- [ ] **로케일 혼입.** `/ko/agents` HTML에 영어 전용 설명 문장이 들어 있는지 확인합니다.
- [ ] **LCP 분해.** Performance 패널(Mid-tier mobile)에서 LCP 마커를 클릭해 LCP 요소 노드와 시점을 봅니다. hydration long task **이후**에 찍히면 가설 (a), 스크립트 파싱 구간 중에 찍히면 가설 (b)입니다. `new PerformanceObserver(l => console.log(l.getEntries())).observe({type:'largest-contentful-paint', buffered:true})`로 후보가 여러 번 갱신되는지도 봅니다.
- [ ] **INP 분해.** "리뷰" 입력 한 번을 Performance 패널로 기록해 interaction을 input delay / processing / presentation delay로 나눕니다. processing 안에서 `searchAgents` 비중과 React 렌더/커밋 비중을 확인합니다(React DevTools Profiler 병행).
- [ ] **long task 640ms 내역.** 바텀업 뷰에서 JSON 파싱(RSC), React 렌더, 레이아웃 비중을 봅니다.

**산출물:** 이슈에 각 체크 결과를 1~2줄씩 기록합니다. 이것이 이후 이슈의 "before" 기준선이 됩니다.

---

### R1. 클라이언트로 넘기는 에이전트 데이터 경량화 (P0)

**증상 → 원인:** HTML 1.14MB, RSC 790KB, TBT와 LCP 악화 ← 카드 목록에 필요 없는 프롬프트, evaluation, sample runs, 다른 로케일 텍스트까지 직렬화됨.

**변경:**
- 서버(`page.tsx`)에서 카드와 필터에 필요한 필드만 뽑은 요약 타입을 만들어 넘깁니다. 로케일도 여기서 확정합니다.

```ts
// src/types/agent.ts (예시)
export type AgentListItem = Pick<Agent,
  "slug" | "name" | "summary" | "tags" | "roles" | "tools" | "verifiedStatus" /* 카드에 쓰는 배지 필드 */
>;

// page.tsx (서버)
const items: AgentListItem[] = agents.map((a) => toListItem(a, locale));
```

- fallback과 본체가 **같은 `items` 참조**를 받게 합니다. R2를 적용하면 fallback 자체가 사라집니다.
- 태그처럼 카드에 4개만 보이는 필드도 필터나 검색에 전체 목록이 필요하면 유지합니다. 표시만 하는 필드는 잘라서 넘깁니다.

**예상 효과(추정):** 카드 하나에 필요한 데이터를 0.5~1KB로 잡으면 100개에 50~100KB입니다. RSC payload는 **790KB에서 약 80~150KB**, HTML 압축 해제는 **1.14MB에서 약 0.4~0.5MB**, gzip 전송은 **186KB에서 약 60~90KB**로 줄 것으로 봅니다. RSC 파싱과 HTML 파싱 비용이 비례해서 줄어 TBT는 수백 ms 단위로 감소할 것으로 예상하지만, 정확한 폭은 D0의 long task 내역에 달려 있습니다.

**검증:**
- `out/ko/agents` HTML 크기(압축 해제, `gzip -c | wc -c`)를 전후 비교합니다.
- DevTools Network에서 문서 전송 크기를 비교합니다.
- Performance 패널 동일 조건 5회의 TBT, LCP 중앙값을 비교합니다.
- **JS를 끈 상태에서 카드 100개가 HTML에 있는지 확인합니다(SEO 회귀 체크).**

**리스크:** 검색 대상인 `realUseCases`를 빼면 검색 결과가 달라집니다. R4에서 함께 처리하고, 이 PR에서는 검색 동작이 바뀌지 않게 검색에 필요한 텍스트를 유지하거나 R4와 묶어서 진행합니다.

---

### R2. `useSearchParams` 때문에 생기는 클라이언트 렌더링 bailout 제거 (P0)

**증상 → 원인:** 640ms long task, LCP 지연(가설 a) ← Suspense 경계 전체가 클라이언트에서 새로 렌더되고 fallback DOM이 교체됨.

**변경(둘 중 하나):**
- **A안(권장):** `AgentSearchPanel`을 Suspense 밖에서 기본 상태(쿼리 없음)로 렌더해서 서버 HTML과 **hydration이 일치**하게 합니다. URL 쿼리는 hydration 이후 `useEffect`에서 `window.location.search`를 읽어 상태에 반영합니다. URL 갱신은 `history.replaceState`로 합니다.
- **B안:** Suspense 안에는 UI가 없는 작은 컴포넌트(`<SearchParamsSync onChange={...} />`)만 둡니다. 이 컴포넌트는 `useSearchParams`로 읽은 값을 상위 상태에 전달합니다. 목록 UI는 경계 밖에 있으므로 bailout 대상이 아닙니다.

**예상 효과(추정):** 카드 트리를 "새로 렌더 + DOM 교체"하던 작업이 "hydration(기존 DOM에 이벤트 연결)"으로 바뀝니다. hydration도 공짜는 아니지만 DOM 생성과 레이아웃이 빠지므로 **640ms long task가 절반 이하로 줄 것**으로 봅니다. 가설 (a)가 맞다면 **LCP는 FCP 근처(약 2s 전후)로 당겨집니다.**

**검증:**
- Performance 패널에서 hydration long task 길이를 봅니다.
- LCP 마커가 long task 이전으로 이동했는지 확인합니다.
- 콘솔에 hydration mismatch 경고가 없는지 확인합니다.
- `?q=리뷰&tool=...` 같은 쿼리 URL로 직접 진입해 필터가 적용되는지 확인합니다.

**리스크:**
- 쿼리 URL로 진입하면 **처음에 전체 목록이 잠깐 보였다가 필터가 적용됩니다**(깜빡임). 목록이 줄어들며 생기는 레이아웃 이동은 입력 없이 일어나므로 CLS에 잡힐 수 있습니다. 대책은 쿼리가 있을 때만 결과 영역을 한 프레임 `visibility:hidden` 처리하거나, 공유 링크 진입이 드물다면 수용하는 것입니다. 쿼리 URL로 진입했을 때의 CLS도 따로 측정합니다.
- `useSearchParams` 제거가 Next의 클라이언트 라우팅과 충돌하지 않는지(뒤로가기 시 상태 복원) 확인해야 합니다.

---

### R3. 클라이언트 JS 번들에서 데이터 제거 (D0 결과에 따라 P0/P2)

**증상 → 원인:** JS 312KB(gzip), TBT의 스크립트 파싱과 컴파일 비용 ← 클라이언트 모듈이 `src/data/agents`(또는 generated 파일)를 import했을 가능성.

**변경:**
- 클라이언트 컴포넌트와 그들이 import하는 `src/lib/*`에서 데이터 모듈 import를 제거하고 props로만 받게 합니다.
- 필요하면 데이터 모듈 상단에 `import "server-only"`를 두어 재발을 막습니다. 이 패키지가 없다면 Next 내장 여부를 확인하고, 없으면 수 줄짜리 dev 의존성이므로 추가할 이유가 충분합니다.
- `lucide-react`는 named import인지 확인합니다. Next의 `optimizePackageImports` 기본 대상입니다.

**예상 효과(추정):** 데이터가 번들에 있다면 한국어 텍스트 428KB의 gzip 크기는 대략 **100~150KB**입니다. 이만큼 JS가 줄고, 4x CPU 기준으로 파싱과 컴파일 비용이 **100~250ms** 정도 감소할 것으로 봅니다. 데이터가 번들에 없다면 이 항목은 일반 번들 점검(P2)으로 내립니다.

**검증:**
- D0의 grep을 재실행해 0건인지 확인합니다.
- `out/_next/static/chunks`에서 이 페이지가 로드하는 청크의 gzip 합계를 Network 패널 JS 필터로 비교합니다.
- TBT를 비교합니다.

**리스크:** 낮음. 빌드 시 `server-only` 위반이 에러로 드러나므로 오히려 안전장치가 됩니다.

---

### R4. 검색 텍스트 사전 계산 (P0, INP)

**증상 → 원인:** INP 280~340ms 중 processing 구간 일부 ← 키 입력마다 100 × (join + toLowerCase) 문자열을 새로 만듦.

**변경:**
- 검색 대상 문자열을 **한 번만** 만듭니다. 가장 좋은 위치는 서버(빌드 시점)이고, 차선은 `useMemo(() => ..., [agents])`입니다.
- 키 입력 시에는 `query.toLowerCase()` 하나와 `haystack.includes()` 100번만 수행합니다.

```ts
// 서버에서 생성해 AgentListItem에 포함하거나, 별도 배열로 전달
searchText: [name, summary, description, ...tags, ...roles, ...tools, ...realUseCases]
  .join("\n").toLowerCase()
```

- **`realUseCases` 텍스트가 크다면**(D0에서 비중 확인): 초기 HTML에 넣지 않고 `npm run content` 단계에서 로케일별 정적 JSON(`public/search-index.ko.json`)으로 따로 생성합니다. 검색창에 **처음 포커스할 때** `fetch`합니다. 로드 전에는 카드 필드만으로 검색합니다. 정적 파일이므로 "서버 API 없음" 제약을 지키고, 검색도 계속 클라이언트에서 합니다.

**예상 효과(추정):** 문자열 할당이 사라지므로 검색 함수 자체는 4x CPU에서도 **수 ms 이내**가 됩니다. 다만 INP 중 이 부분의 비중은 D0 전까지 모릅니다. 렌더 비중이 크면 R4만으로는 목표에 못 미치고, **R5와 함께 적용해야 합니다.**

**검증:**
- Performance 패널에서 입력 이벤트 핸들러 안의 `searchAgents` self time을 전후 비교합니다.
- 단위 테스트(`tests/`)로 기존 `searchAgents`와 새 구현이 같은 쿼리 세트(한글, 영문 대소문자, 도구명, 빈 쿼리)에 같은 결과를 내는지 고정합니다.

**리스크:** 인덱스 JSON을 lazy-load하면 첫 검색이 네트워크 상태에 좌우됩니다. 로드 전 부분 검색 결과가 나중에 늘어나는 동작이 헷갈릴 수 있으므로, 로드 전후에 결과가 달라질 수 있다는 점을 UI에서 드러낼지 결정해야 합니다.

---

### R5. 입력과 목록 렌더 분리: `useDeferredValue` + 카드 memo (P0, INP)

**증상 → 원인:** INP의 processing과 presentation 구간 ← 입력 한 번이 카드 100개, 칩 80개의 동기 재렌더로 이어지고 IME 조합 이벤트마다 반복됨.

**변경(새 의존성 없음, React 내장):**

```tsx
const [query, setQuery] = useState(initialQuery);
const deferredQuery = useDeferredValue(query);
const results = useMemo(
  () => filterAgents(searchIndex(items, deferredQuery), filters),
  [items, deferredQuery, filters],
);
const isStale = query !== deferredQuery; // 필요하면 결과 영역에 opacity로 표시
```

- `AgentCard`를 `React.memo`로 감싸고 `key={slug}`를 유지합니다. 결과에 남아 있는 카드는 재렌더되지 않고, 들어오고 나가는 카드만 마운트/언마운트됩니다. 카드에 넘기는 props는 안정적인 참조(원본 item 객체)로 유지합니다.
- 필터 칩 영역을 별도 컴포넌트로 분리하고 memo 처리합니다. query가 바뀌어도 칩 80개가 재렌더되지 않게 합니다.
- **BookmarkButton:** 가정 3이 맞다면 북마크 store를 모듈 하나로 만듭니다. 파싱한 `Set`을 캐시하고 `storage` 이벤트와 자체 변경 시에만 갱신합니다. `getSnapshot`은 캐시에서 `boolean`만 반환하게 해서 렌더마다 `localStorage`를 100번 읽지 않도록 합니다.
- 디바운스는 **넣지 않는 것**을 권합니다. `useDeferredValue`는 입력 반영을 막지 않으면서 무거운 렌더를 중단 가능하게 만듭니다. 디바운스는 결과 표시를 늦출 뿐 INP의 원인(동기 렌더)은 그대로 둡니다.

**예상 효과(추정):** 입력 필드 업데이트는 가벼운 긴급 렌더로 끝나고, 목록 렌더는 뒤로 밀려 다음 입력이 오면 중단됩니다. 그래서 INP는 목록 크기와 거의 무관해지고 **100~150ms 이하**가 될 것으로 봅니다. memo가 적용되면 저우선순위 렌더 자체도 짧아집니다.

**검증:**
- Performance 패널(4x CPU)에서 "리뷰"를 빠르게 입력하는 동작을 5회 기록하고 interaction별 INP의 최댓값과 중앙값을 비교합니다.
- React DevTools Profiler의 "Highlight updates"로 입력 시 칩과 남아 있는 카드가 깜빡이지 않는지 확인합니다.
- 입력을 멈춘 뒤 최종 결과가 정확한지 확인합니다.

**리스크:** 결과가 한두 프레임 늦게 바뀌는 것이 보일 수 있습니다(`isStale` 표시로 완화). memo 대상 props에 인라인 객체나 함수를 넘기면 memo가 무력화되므로 PR 리뷰 체크 포인트로 둡니다.

---

### R6. 화면 밖 카드의 렌더링 비용 줄이기: `content-visibility` (P1)

**증상 → 원인:** hydration과 결과 변경 시의 스타일, 레이아웃, 페인트 비용 ← 카드 100개가 모두 레이아웃 대상임.

**변경:** 카드 래퍼에 CSS를 적용합니다. 새 의존성은 없습니다.

```css
.agent-card { content-visibility: auto; contain-intrinsic-size: auto 220px; } /* 실제 카드 높이로 조정 */
```

HTML에는 카드 100개가 그대로 남으므로 **SEO 요구사항을 유지**합니다. 이 점에서 가상화나 페이지네이션보다 이 조건에 맞습니다.

**예상 효과(추정):** 첫 화면 밖 카드의 레이아웃과 페인트가 생략되어, 초기 렌더와 결과 변경 시 렌더링 단계가 줄어듭니다. 효과 크기는 D0에서 확인한 레이아웃/페인트 비중에 달려 있습니다.

**검증:**
- Performance 패널에서 Layout, Paint 시간을 비교합니다.
- 스크롤 시 스크롤바 튐과 CLS를 확인합니다.
- Ctrl+F 페이지 내 검색, 앵커 이동이 정상인지 확인합니다.

**리스크:** `contain-intrinsic-size` 값이 실제 높이와 크게 다르면 스크롤 위치가 튑니다. 미지원 브라우저에서는 효과만 없고 깨지지는 않습니다.

---

### R7. (필요할 때만) 카드를 서버 컴포넌트로, 클라이언트는 표시/숨김만 (P2)

**조건:** R1~R6 이후에도 INP나 TBT가 목표를 넘는 경우에만 진행합니다.

**변경:**
- 카드를 서버 컴포넌트로 렌더합니다. BookmarkButton만 클라이언트 island로 둡니다.
- 클라이언트 그리드는 `children`으로 카드를 받고, 검색 결과(slug 집합)에 따라 각 래퍼의 `hidden`만 토글합니다.
- 검색할 때 카드 트리는 전혀 재렌더되지 않습니다.

**효과 / 트레이드오프:** 입력 비용이 "속성 100개 토글" 수준으로 떨어집니다. 대신 정렬 순서를 바꾸는 기능(관련도순 등)은 구현이 까다로워지고, 구조 변경 폭이 큽니다. 지금 단계에서는 권하지 않습니다.

---

### R8. 측정 절차 표준화 (P1, 모든 이슈 공통)

단일 측정값으로는 ±15~20% 변동을 걸러낼 수 없으므로, 모든 PR이 같은 절차로 before/after를 붙이게 합니다.

- **조건:** Chrome 시크릿 창, DevTools "Mid-tier mobile"(4x CPU, Fast 4G), 캐시 비움, `/ko/agents`, **5회 측정 후 중앙값**을 기록합니다.
- **로드 지표:** FCP, LCP(요소와 시점 포함), TBT, 가장 긴 long task, 문서 전송 크기(gzip과 압축 해제), JS 합계.
- **INP:** 검색창 포커스 → "리뷰" 빠르게 입력 → interaction 목록의 최댓값. 필터 칩 클릭 1회도 따로 기록합니다(칩 클릭도 같은 렌더 경로를 탑니다).
- **SEO 회귀:** JS를 끈 상태로 `/ko/agents`를 열어 카드 100개가 있는지 확인하거나, `curl`로 받은 HTML에서 카드 수를 셉니다.
- **최종 확인:** 로컬 `out/` 정적 서빙 결과와 GitHub Pages 배포본을 모두 측정합니다. gzip 여부와 TTFB가 다르기 때문입니다.
- Lighthouse 점수는 참고용으로만 기록하고 **합격 기준은 LCP, TBT, INP 수치**로 둡니다. Lighthouse는 시뮬레이션 스로틀링이라 DevTools 측정과 값이 다를 수 있습니다.
- 서버가 없어 필드 데이터(실사용자 INP)는 수집할 수 없습니다. 목표 달성은 lab 기준이며, 실제 저사양 기기에서는 더 나쁠 수 있습니다. 가능하면 실제 중저가 안드로이드 기기에서 원격 디버깅으로 1회 교차 확인합니다.

---

## 4. 검토했지만 권하지 않는 것

| 방법 | 권하지 않는 이유 |
|---|---|
| 페이지네이션 / 무한 스크롤 | JS 없는 HTML에 카드 목록이 있어야 한다는 SEO 요구와 충돌합니다. 100개는 페이지네이션이 꼭 필요한 규모도 아닙니다. |
| 가상화 라이브러리(react-window 등) | 새 의존성이 생기고, SSR HTML에 전체 목록을 두는 요구와 맞지 않습니다. `content-visibility`(R6)로 대부분 대체됩니다. |
| Fuse.js 등 검색 라이브러리 | 성능 문제가 아니라 기능 변경입니다. 번들도 커집니다. |
| Web Worker 검색 | 사전 계산 후의 검색은 수 ms이므로 복잡도에 비해 이득이 없습니다. |
| 디바운스만 추가 | INP의 원인(동기 렌더)은 그대로 두고 결과 표시만 늦춥니다(R5 참고). |

---

## 5. 리스크

1. **검색 동작 변화:** R1/R4에서 검색 대상 필드가 바뀌면 사용자가 찾던 결과가 사라질 수 있습니다. → 기존 구현과 동일 결과를 보장하는 단위 테스트를 먼저 작성합니다.
2. **쿼리 URL 진입 시 깜빡임과 CLS:** R2의 대가입니다. → 쿼리 URL 진입 시나리오를 측정 절차에 포함합니다.
3. **hydration mismatch:** R2 A안에서 초기 렌더가 서버와 다르면(예: 초기 렌더에서 `localStorage`나 URL 값을 사용) 경고가 나고 전체 재렌더가 일어나 오히려 느려집니다. → 브라우저 전용 값은 effect 이후에만 읽습니다.
4. **효과 추정의 불확실성:** 수치는 구조로부터 추정한 값입니다. D0 결과에 따라 R3의 우선순위와 LCP 개선 폭이 크게 달라질 수 있습니다.
5. **lab과 실사용 차이:** 목표를 lab에서 달성해도 실제 저사양 기기 INP는 더 높을 수 있습니다. 여유를 두려면 lab INP 150ms 이하를 목표로 삼을 것을 권합니다.
6. **회귀 방지 장치 부재:** 이후 카드에 필드가 추가되면 payload가 다시 커질 수 있습니다. → `check:data` 또는 빌드 후 스크립트에 "`/ko/agents` HTML 압축 해제 크기 ≤ N KB" 예산 체크를 추가하는 것을 고려합니다.

---

## 6. 다음 액션 (이슈 분할안)

| # | 이슈 | 우선순위 | 선행 | 규모 | 완료 기준 |
|---|---|---|---|---|---|
| 1 | D0: 성능 가설 진단 및 기준선 기록 | P0 | - | 반나절 | 섹션 3-D0 체크리스트 결과 기록 |
| 2 | R8: 측정 절차 문서화(CONTRIBUTING 또는 이슈 템플릿) | P1 | - | 1시간 | PR 템플릿에 before/after 표 |
| 3 | 검색 동작 고정 단위 테스트 | P0 | - | 2~3시간 | 기존 `searchAgents` 결과 스냅샷 테스트 통과 |
| 4 | R1: 목록용 요약 타입과 로케일 확정 | P0 | 1, 3 | 0.5~1일 | HTML 압축 해제 ≤ 500KB, JS-off 카드 100개 |
| 5 | R3: 클라이언트 번들 데이터 제거 | P0 또는 P2 | 1 | 2~4시간 | 고유 문장 grep 0건 |
| 6 | R2: CSR bailout 제거 | P0 | 4 | 0.5~1일 | long task < 300ms, mismatch 경고 0, 쿼리 URL 동작 |
| 7 | R4 + R5: 검색 인덱스 사전 계산, `useDeferredValue`, memo, 북마크 store | P0 | 3, 4 | 1일 | INP(4x) < 200ms, 목표 여유 150ms |
| 8 | 중간 재측정 | P0 | 4~7 | 1시간 | LCP, TBT, INP 5회 중앙값 |
| 9 | R6: `content-visibility` | P1 | 8 | 2시간 | 8 결과가 목표 미달일 때, 또는 여유 확보용 |
| 10 | 성능 예산 체크 스크립트 | P2 | 4 | 2시간 | CI에서 HTML 크기 초과 시 실패 |
| 11 | R7: 서버 카드 + 표시 토글 | P2 | 8 | 1~2일 | 8 이후에도 목표 미달일 때만 |

기여자에게 나눌 때는 3, 5, 9, 10이 독립적이고 범위가 작아 먼저 배정하기 좋습니다. 4, 6, 7은 같은 컴포넌트를 건드리므로 한 사람이 순서대로 맡는 편이 충돌이 적습니다.

---

## 확인하고 싶은 것 (답이 없어도 위 계획은 진행 가능)

1. `AgentSearchPanelFromUrl`이 `useSearchParams` 외에 하는 일이 있나요? 예: 라우터로 URL 동기화. R2의 A안/B안 선택에 영향이 있습니다.
2. 검색에서 `realUseCases` 매칭이 꼭 필요한가요? 필요 없다면 R4의 lazy 인덱스 없이 끝납니다.
3. 쿼리가 붙은 `/agents?...` 링크를 외부에 공유하는 흐름이 흔한가요? R2 깜빡임 대책의 필요 여부가 달라집니다.
