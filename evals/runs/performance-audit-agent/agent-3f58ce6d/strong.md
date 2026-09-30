# /agents 모바일 성능 감사 (Agent Archive)

측정 조건은 9/27 배포본, Chrome DevTools "Mid-tier mobile"(4x CPU, Fast 4G), `/ko/agents`, 캐시 비움입니다. 아래에서 **[측정]**은 주신 숫자이고, **[ASSUMPTION]**은 제가 코드 구조를 보고 추론한 것이라 먼저 확인해야 하는 내용입니다.

## 요약

| 지표 | 현재 [측정] | 목표 | 필요한 개선폭 |
|---|---|---|---|
| LCP (모바일) | 3.8s | < 2.5s | 1.3s 이상 (34% 이상) |
| TBT | 1,420ms | < 600ms | 820ms 이상 (58% 이상) |
| INP (검색 입력) | 280~340ms | < 200ms | 80~140ms 이상 (30~40%) |

숫자를 보면 **병목은 네트워크가 아니라 메인 스레드(CPU)입니다.**
- 데스크톱 INP 60ms × 4(CPU 스로틀링) ≈ 240ms이고, 실측 모바일 INP는 280~340ms입니다. 거의 CPU 배율만큼 느려진 것이니 계산 비용 문제입니다.
- 데스크톱 LCP 0.9s → 모바일 3.8s(약 4.2배)도 CPU 배율과 비슷합니다. HTML 전송량 186KB(gzip)는 Fast 4G에서 수백 ms 안에 다 받습니다. 따라서 LCP 3.8s의 대부분은 전송이 아니라 파싱, 스크립트 실행, 렌더링 지연입니다.
- 결론적으로 **"클라이언트가 처리할 데이터 양"과 "클라이언트가 그리거나 다시 그리는 DOM 양"**을 줄이는 것이 세 목표 모두에 공통으로 효과가 있습니다.

---

## 1. 진단

### D1. RSC payload가 HTML의 69%를 차지하며, 카드에 안 쓰는 데이터까지 직렬화된다
- **[측정]** HTML 압축 해제 크기는 1.14MB이고, 그중 `self.__next_f` 인라인 스크립트가 약 790KB(69%)입니다. 이를 뺀 실제 마크업은 약 350KB입니다.
- **원인:** `page.tsx`가 `agents` 100개 **전체 객체**(프롬프트, 설명, realUseCases, evaluation, sample runs)를 클라이언트 컴포넌트 props로 넘깁니다. 클라이언트 컴포넌트 props는 전부 RSC payload에 직렬화됩니다. 카드 한 장에 보이는 것은 이름, 요약, 배지 4개, 태그 4개 정도라서 대부분의 바이트는 화면에 쓰이지 않습니다.
- **크기 불일치:** 원본 `agents.ts`는 428KB인데 payload는 790KB(약 1.85배)입니다. 가능한 원인은 다음과 같습니다.
  - (a) JS 문자열 안의 JSON이라 따옴표와 개행이 이스케이프되어 부풀어남
  - (b) `fallback`의 `<AgentSearchPanel agents>`와 children의 `<AgentSearchPanelFromUrl agents>`가 같은 배열을 두 번 참조함. React 19 Flight는 동일 참조를 보통 중복 제거하지만 확인이 필요합니다.
  - (c) `/ko` 페이지에 en 필드까지 함께 들어감
  - 셋 다 **[ASSUMPTION]**이며, 측정 계획 0단계에서 확인합니다.
- **영향:** 브라우저가 790KB 인라인 스크립트를 파싱하고, React가 이를 디코딩(Flight parse)하는 비용이 메인 스레드에 쌓입니다. 이는 TBT를 늘리고, HTML 파싱이 길어지면 LCP도 늦어집니다.

### D2. `useSearchParams` + Suspense 때문에 카드 목록 전체가 클라이언트에서 버려지고 다시 만들어질 가능성이 높다 [ASSUMPTION, 확인 1순위]
- **구조:** `<Suspense fallback={<AgentSearchPanel/>}><AgentSearchPanelFromUrl/></Suspense>`
- **동작:** `output: "export"`에서 `useSearchParams`를 쓰는 컴포넌트는 빌드 시 렌더할 수 없어 가장 가까운 Suspense 경계까지 **클라이언트 렌더로 bailout**합니다. 정적 HTML에는 fallback(카드 100개)이 들어갑니다.
- 클라이언트에서 React는 이 경계를 hydrate하지 않고, children(`AgentSearchPanelFromUrl`)을 **처음부터 렌더한 뒤 fallback DOM을 통째로 교체**합니다.
- 그 결과 카드 100개(배지, 태그, lucide SVG 3개, BookmarkButton)와 칩 80개를 새로 만들고, 레이아웃과 페인트를 전부 다시 합니다.
- **증거와의 연결:**
  - **[측정]** "Hydration 관련 long task 640ms": hydrate가 아니라 이 전체 클라이언트 렌더와 DOM 교체일 가능성이 큽니다.
  - **[측정]** LCP 요소가 H1이고 FCP 1.9s와 LCP 3.8s 사이에 1.9s의 간격이 있습니다. 텍스트 요소는 첫 페인트 때 그려지면 LCP ≈ FCP여야 정상입니다. 1.9s나 늦게 잡혔다는 것은 H1이 **나중에 다시 그려진(새 노드로 삽입된)** 것을 뜻할 수 있습니다. H1이 Suspense 경계 안(AgentSearchPanel 내부)에 있다면 이 설명이 맞습니다. **[ASSUMPTION]**
  - H1이 경계 밖에 있다면 LCP 지연의 다른 후보는 웹폰트 로딩(`font-display: block` 등) 또는 1.14MB HTML과 인라인 스크립트 파싱으로 인한 렌더 지연입니다. 0단계의 LCP 분해로 가려냅니다.
- **확인 방법:** 빌드 산출물 HTML에 `BAILOUT_TO_CLIENT_SIDE_RENDERING` 문자열이 있으면 bailout이 확정입니다.

### D3. TBT 1,420ms의 구성
- **[측정]** 640ms long task 하나가 TBT에 기여하는 양은 640 − 50 = **590ms**입니다. 나머지 약 **830ms**는 다른 long task들에서 나옵니다.
- 나머지의 후보 **[ASSUMPTION]**:
  - (a) 790KB 인라인 RSC 스크립트 파싱과 Flight 디코딩
  - (b) JS 312KB(gzip, 압축 해제 시 대략 1MB 안팎) 파싱, 컴파일, 평가
  - (c) 에이전트 데이터가 **클라이언트 JS 번들에도** 들어가 있을 가능성. 312KB gzip은 목록 페이지 기준으로 큽니다. Next/React 런타임만으로는 이 크기가 설명되지 않습니다. 어떤 클라이언트 모듈(검색 lib, 북마크, 헤더 검색 등)이 `src/data/generated/agents.ts`를 import하면 428KB 데이터가 JS와 RSC에 **이중으로** 실립니다.
- 목표 600ms를 맞추려면 640ms 태스크를 없애거나 쪼개는 것만으로는 부족합니다. D1/D3의 파싱 비용도 함께 줄여야 합니다.

### D4. 검색 INP 280~340ms: 키 입력마다 패널 전체가 동기적으로 다시 렌더된다
- **[측정]** "리뷰"를 빠르게 입력하면 키마다 280~340ms가 걸리고, 데스크톱에서는 60ms입니다.
- **원인 1 (주원인으로 추정, [ASSUMPTION]):** `query`가 `AgentSearchPanel`의 state입니다. 그래서 키 입력 하나가 패널 전체의 **긴급(동기) 렌더**를 일으킵니다.
  - 칩 약 80개가 다시 렌더됩니다(memo가 없다면).
  - 결과가 바뀌면 AgentGrid가 카드를 unmount/mount합니다. mount마다 lucide SVG 3개를 만들고 BookmarkButton의 `useSyncExternalStore` 구독을 설정합니다.
  - 이것이 커밋, 레이아웃, 페인트까지 이어져 input의 다음 페인트를 막습니다.
- **원인 2:** `searchAgents`가 키마다 100개 에이전트의 긴 문자열(realUseCases 포함)을 새로 `join` + `toLowerCase`합니다. 문자열 생성과 GC 비용입니다. 렌더 비용보다는 작을 것으로 보지만(4x CPU에서 수~수십 ms 추정, [ASSUMPTION]) 쉽게 없앨 수 있습니다.
- **원인 3:** 한국어 IME는 "리뷰" 두 글자에도 조합 중에 `onChange`를 여러 번 발생시킵니다(ㄹ→리→륩…→리뷰). 디바운스나 지연 처리가 없으니 조합 단계마다 위 비용을 전부 치릅니다.

### D5. CLS 0.02는 목표 범위 안이다
- 조치할 필요가 없습니다. 다만 아래 권고(DOM 교체 제거, content-visibility)를 적용한 뒤 회귀하지 않는지만 확인합니다.

---

## 2. 권고 (목표 지표 기여도가 큰 순서)

> 각 권고는 GitHub 이슈 하나로 쪼갤 수 있게 썼습니다. 효과 추정치는 모두 범위이고 근거를 붙였으며, 실제 값은 측정으로 확정해야 합니다.

### R1. Suspense bailout 제거: URL 동기화만 작은 경계로 분리
**전제:** 0단계에서 `BAILOUT_TO_CLIENT_SIDE_RENDERING`가 확인될 것.

**변경** (`src/app/[locale]/agents/page.tsx`, `AgentSearchPanel`, 새 `UrlStateSync`)
- 패널 자체는 Suspense 밖에서 렌더합니다. 그러면 정적 HTML이 **hydrate**되고, 버려지고 다시 만들어지지 않습니다.
- `useSearchParams`는 아무것도 렌더하지 않는 작은 컴포넌트에만 두고, 그 컴포넌트만 `<Suspense fallback={null}>`로 감쌉니다.

```tsx
// AgentSearchPanel.tsx ("use client")
export function AgentSearchPanel({ items, facets }: Props) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  return (
    <>
      <Suspense fallback={null}>
        <UrlStateSync onInit={(q, f) => { setQuery(q); setFilters(f); }} />
      </Suspense>
      {/* H1, 검색창, 칩, 그리드 */}
    </>
  );
}

// UrlStateSync.tsx ("use client")
export function UrlStateSync({ onInit }: { onInit: (q: string, f: Filters) => void }) {
  const params = useSearchParams();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const q = params.get("q") ?? "";
    const f = parseFilters(params);
    if (q || hasAny(f)) onInit(q, f);   // 쿼리가 없으면 추가 렌더 없음
  }, [params, onInit]);
  return null;
}
```

- `page.tsx`에서는 `<Suspense fallback=…>` 래퍼와 `AgentSearchPanelFromUrl`을 제거하고 `<AgentSearchPanel …/>`를 직접 렌더합니다.
- H1은 가능하면 `page.tsx`(서버 컴포넌트)에서 패널 **밖**에 둡니다. 그러면 JS와 무관하게 첫 페인트에 고정됩니다.

**움직이는 지표와 추정 효과**
- **LCP:** D2 가설대로 H1이 교체되고 있었다면 LCP가 첫 페인트 시점으로 당겨집니다. 3.8s → 대략 **1.9~2.4s**(FCP 근처)로 예상합니다. 근거는 H1이 이미 FCP 시점 HTML에 있으므로 교체만 없으면 그때 확정된다는 점입니다. H1이 원래 경계 밖이었다면 LCP 효과는 작고, R5를 봐야 합니다.
- **TBT:** 640ms 태스크가 "새로 만들기 + DOM 교체 + 전체 레이아웃"에서 "기존 DOM hydrate"로 바뀝니다. DOM 생성, 교체, 재레이아웃이 빠지므로 **200~400ms 감소**를 예상합니다 **[ASSUMPTION]**. 컴포넌트 함수 실행과 hydration 비교 작업은 남으니 0이 되지는 않습니다.
- **SEO:** 오히려 좋아집니다. 정적 HTML이 그대로 최종 DOM이 됩니다.

**비용과 리스크:** 작습니다(파일 2~3개).
- URL에 `?q=`가 있는 진입에서는 hydration 직후 한 번 필터링 렌더가 더 일어납니다. 서버 HTML에는 전체 목록이 보였다가 필터된 목록으로 바뀌므로, 공유 링크 진입 시 짧은 깜빡임이나 CLS가 생길 수 있습니다. 필터링은 R3의 `hidden` 방식으로 하면 레이아웃 이동이 작습니다.
- URL을 갱신하는 코드(검색 시 `router.replace`)가 있다면 `UrlStateSync`와 무한 루프가 생기지 않게 "초기 1회만 읽기"를 유지합니다.

**검증**
- `out/ko/agents/index.html`에 `BAILOUT_TO_CLIENT_SIDE_RENDERING`가 **0회**여야 합니다.
- Performance 패널(Mid-tier mobile, 캐시 비움)에서 LCP 요소가 H1이고 LCP 시간 ≤ FCP + 300ms이면 통과입니다. H1 노드가 교체되지 않는지는 콘솔 스니펫(3장 C)으로 확인합니다.
- Main 트랙의 최대 long task가 640ms에서 **≤ 400ms**로 줄면 통과입니다.

---

### R2. 클라이언트로 넘기는 데이터를 "카드용 슬림 항목 + 사전 계산된 검색 텍스트"로 교체
**변경**
- 서버 전용 모듈 `src/lib/agent-list-item.ts`를 새로 만들어 `page.tsx`에서만 import합니다.
```ts
export type AgentListItem = {
  slug: string;
  name: string;
  summary: string;          // 현재 locale만
  badges: Badge[];          // 카드에 보이는 4개만
  tags: string[];           // 카드에 보이는 4개만
  facets: { roles: string[]; tools: string[]; category: string; /* 필터 7개 그룹에 필요한 키만 */ };
  searchText: string;       // name/summary/description/tags/roles/tools/realUseCases를 join 후 toLowerCase (빌드 시 1회)
};
export function toListItem(a: Agent, locale: Locale): AgentListItem { /* ... */ }
```
- `page.tsx`: `const items = agents.map((a) => toListItem(a, locale));` 후 `<AgentSearchPanel items={items} facets={facets} />`
- 프롬프트, evaluation, sample runs, realUseCases 원문은 목록 페이지 클라이언트로 보내지 않습니다. 상세 페이지에서만 씁니다.
- `searchAgents`/`filterAgents`는 `AgentListItem`을 받도록 바꾸고 `item.searchText.includes(q)`만 검사합니다. 키 입력마다 하던 문자열 생성이 사라집니다. 이 변경은 `tests/`에 있는 검색 단위 테스트로 동작 동일성을 확인합니다.

**크기를 먼저 잽니다** (새 의존성 없이 tsx 사용)
```bash
npx tsx -e '
import { agents } from "./src/data/generated/agents";
const size = (v) => Buffer.byteLength(JSON.stringify(v));
const keys = Object.keys(agents[0]);
for (const k of keys) console.log(k, (agents.reduce((n, a) => n + size(a[k] ?? null), 0) / 1024).toFixed(1) + "KB");
'
```
어느 필드가 790KB를 차지하는지, `searchText`에 들어갈 realUseCases가 얼마나 큰지가 나옵니다.

**움직이는 지표와 추정 효과**
- **HTML/RSC 크기:** 카드 표시 필드는 에이전트당 약 0.5~1.5KB로 추정되어, 100개면 50~150KB입니다 **[ASSUMPTION]**. 여기에 `searchText`가 더해집니다. RSC payload는 790KB → 대략 **150~350KB**로 예상하며, realUseCases 크기에 크게 좌우됩니다.
- **TBT:** 인라인 스크립트 파싱과 Flight 디코딩량이 절반 이하로 줄어 **100~300ms 감소**로 추정합니다 **[ASSUMPTION]**. 디코딩 비용은 대략 바이트 수에 비례한다는 가정입니다.
- **LCP:** HTML 파싱 시간이 줄어 **0~400ms** 개선을 기대합니다. H1은 HTML 앞쪽에 있어 효과가 제한적일 수 있습니다.
- **INP:** 문자열 생성 제거로 키당 **수~수십 ms** 줄어듭니다 **[ASSUMPTION]**.

**`searchText`가 여전히 큰 경우의 확장 (R2b)**
- 검색 인덱스를 별도 정적 JSON(`/[locale]/agents/search-index.json`)으로 빌드하고, 검색창 **첫 포커스나 `requestIdleCallback` 시점에 fetch**합니다.
  - 생성 방법 1: `force-static` GET route handler를 `generateStaticParams`와 함께 사용합니다. 정적 export에서 지원됩니다.
  - 생성 방법 2: `npm run content` 단계에서 `public/`에 파일을 씁니다.
- 제약과의 관계: 서버 API가 아니라 정적 파일이고, 검색은 클라이언트에서 그대로 하므로 제약을 지킵니다.
- 리스크: 인덱스가 도착하기 전 첫 입력에서 결과가 늦게 나옵니다. 인덱스가 오기 전에는 name/summary/tags(카드 데이터)로만 검색하고, 도착하면 다시 검색하는 식으로 대응합니다.

**비용과 리스크:** 중간 수준입니다.
- 카드나 필터가 쓰는 필드를 빠뜨리면 UI가 깨집니다. `AgentListItem` 타입으로 컴파일 타임에 잡히게 합니다.
- 상세 페이지 링크(`slug`)는 반드시 포함해야 합니다.

**검증**
- `out/ko/agents/index.html`의 `self.__next_f` 합계가 790KB → **≤ 300KB**이고 gzip HTML이 186KB → **≤ 90KB**이면 통과입니다. 측정은 3장 A의 스크립트로 합니다.
- 특정 에이전트 프롬프트 문구가 목록 HTML에 **0회** 나와야 합니다(grep).
- TBT는 3장 프로토콜에서 R1 적용 후 값 대비 추가 감소폭을 기록합니다.

---

### R3. 검색 INP: 입력은 즉시 반영하고 목록은 지연시키며, 카드는 재생성하지 않고 숨긴다
**변경** (`AgentSearchPanel`, `AgentGrid`, `AgentCard`, 필터 칩 컴포넌트)
1. `const deferredQuery = useDeferredValue(query);`로 결과 계산은 `deferredQuery` 기준으로 합니다. 입력창 렌더는 긴급 렌더로 바로 페인트되고, 목록 렌더는 인터럽트 가능한 백그라운드 렌더가 됩니다(React 19 내장, 의존성 없음). IME 조합 중에 연속으로 들어오는 입력도 앞선 목록 렌더를 버리고 최신 값만 반영합니다.
2. **카드를 mount/unmount하지 않고 `hidden`으로 토글합니다.** `searchAgents`가 원래 순서를 유지하는 필터라면 결과가 동일합니다 **[ASSUMPTION: 관련도 정렬 없음]**.
```tsx
const visible = useMemo(
  () => new Set(matchSlugs(items, deferredQuery.trim().toLowerCase(), filters)),
  [items, deferredQuery, filters],
);
// AgentGrid
{items.map((item) => (
  <AgentCard key={item.slug} item={item} hidden={!visible.has(item.slug)} />
))}
// AgentCard = memo(function AgentCard({ item, hidden }) { return <article hidden={hidden} …> })
```
   이렇게 하면 키 입력마다 lucide SVG와 BookmarkButton 구독을 새로 만들지 않고, `hidden`이 바뀐 카드만 다시 렌더합니다. 결과 개수는 `visible.size`로 표시합니다.
3. 필터 칩 영역을 `memo`로 감싸고 `filters`/`onChange`(useCallback)가 바뀔 때만 렌더되게 합니다. 칩 80개가 쿼리 입력 때마다 렌더되지 않습니다. 칩에 "결과 수" 카운트가 있다면 그 계산도 `deferredQuery` 기준으로 옮깁니다.
4. 입력 요소는 제어 컴포넌트 그대로 두되, 패널에서 가장 가벼운 형제 노드가 되게 합니다.

**움직이는 지표와 추정 효과**
- **INP:** 키 입력의 동기 작업이 "input + 패널 셸 렌더"로 줄어듭니다. 280~340ms → **80~160ms**로 추정합니다 **[ASSUMPTION]**. 근거는 현재 비용의 대부분이 카드와 칩 렌더/커밋이라는 D4 추정이며, 그 부분이 긴급 경로에서 빠집니다.
- 목록이 화면에 반영되는 시간은 입력보다 약간 늦을 수 있습니다. 체감상 "타이핑이 막히지 않음"이 우선입니다.

**디바운스를 쓰지 않는 이유:** 150ms 디바운스도 의존성 없이 가능하지만, 마지막 키 뒤의 렌더는 여전히 동기 long task라서 그 순간 들어온 입력의 INP를 막습니다. `useDeferredValue`는 렌더 자체를 양보 가능하게 만드는 방식입니다. R3 적용 후에도 INP가 목표를 넘으면 두 가지를 조합합니다.

**비용과 리스크:** 작거나 중간입니다.
- `hidden` 카드도 DOM에 남으므로 초기 DOM 크기는 그대로입니다. 초기 비용 쪽은 R1/R2/R5에서 다룹니다.
- Tailwind에서 `hidden` 속성은 기본 UA 스타일(`display:none`)로 동작합니다. 카드에 `display` 유틸리티(`flex`, `grid`)가 있으면 속성을 덮어쓰므로 `hidden:` 대신 `[&[hidden]]:hidden` 또는 `className={cn(…, hidden && "hidden")}`로 처리합니다.

**검증**
- 3장 B의 INP 스니펫과 Performance 패널 Interactions 트랙을 사용합니다(Mid-tier mobile).
- "리뷰"를 입력하는 3회 기록에서 **모든 키 입력 interaction이 < 200ms**이고 중앙값이 < 150ms이면 통과입니다.
- 회귀 확인: 검색/필터 단위 테스트를 통과하고, 결과 개수와 순서가 변경 전과 같아야 합니다.

---

### R4. 클라이언트 JS에 에이전트 데이터가 포함됐는지 확인하고 제거
**변경:** 먼저 확인합니다.
```bash
npm run build
# 특정 에이전트의 프롬프트나 realUseCases에만 있는 고유 문구로
grep -l "고유한 문구" out/_next/static/chunks/*.js out/_next/static/chunks/**/*.js
```
- 문구가 나오면 해당 청크를 import하는 클라이언트 모듈을 찾습니다(`"use client"` 파일 중 `@/data/…agents` import). 서버에서 필요한 값만 props로 받게 바꿉니다.
  - 예: BookmarkButton이 slug→이름 조회 때문에 전체 데이터를 import하는 경우, 필요한 값만 props로 받게 합니다.
- 번들 분석기(`@next/bundle-analyzer`)는 새 dev 의존성이므로 grep으로 충분하지 않을 때만 쓰는 것을 권합니다. 쓴다면 이유는 "청크별 모듈 구성 확인"이며, 런타임 영향은 없습니다.

**움직이는 지표와 추정 효과** (데이터가 번들에 있을 때에만 해당)
- **JS 크기:** 312KB → 약 **180~230KB** gzip. 428KB 원본은 gzip 후 약 80~130KB로 추정합니다 **[ASSUMPTION]**.
- **TBT:** JS 파싱과 평가가 줄어 **100~250ms 감소**를 예상합니다 **[ASSUMPTION]**.
- 데이터가 번들에 없으면 효과는 0이고, 이 이슈는 "확인 완료"로 닫습니다.

**비용과 리스크:** 확인은 5분이면 됩니다. 수정 비용은 import 경로에 따라 다릅니다.

**검증**
- 고유 문구 grep 결과가 **0개 파일**이어야 합니다.
- Network 패널(캐시 비움)에서 `/ko/agents`의 JS 합계(gzip)를 변경 전후로 비교합니다.

---

### R5. LCP가 R1 후에도 2.5s 이상이면: H1 렌더 지연 원인별 처리
0단계의 LCP 분해(TTFB / 렌더 지연) 결과에 따라 해당하는 것만 적용합니다.
- **웹폰트가 원인인 경우** (H1이 폰트 로드 후에야 그려짐): `next/font`를 쓴다면 `display: "swap"`을 확인합니다(`next/font` 기본값은 swap). 직접 `@font-face`를 쓴다면 `font-display: swap`과 H1용 폰트 `<link rel="preload">`를 적용합니다. 한국어 웹폰트는 파일이 크므로 H1에는 시스템 폰트 스택을 쓰는 것도 선택지입니다.
  - 효과: 폰트 대기 시간만큼 줄어듭니다.
  - 리스크: 폰트 교체 시 CLS가 생길 수 있습니다(현재 0.02, 목표 범위 내 유지 확인).
- **HTML 파싱이나 인라인 스크립트가 원인인 경우:** R2(payload 축소)가 해당 조치이며 추가 작업은 없습니다.
- **렌더 차단 CSS가 원인인 경우:** Tailwind CSS 파일 크기와 요청 시점을 확인합니다. purge가 정상이면 보통 작습니다.

**검증:** 3장 C의 LCP 스니펫과 Performance 패널의 LCP 분해에서 LCP < 2.5s(5회 중앙값)이면 통과입니다.

---

### R6. (조건부) 초기 렌더와 hydration 비용 추가 절감
R1~R4 적용 후에도 **TBT ≥ 600ms이거나 최대 long task > 200ms**일 때만 진행합니다.
- **R6a. `content-visibility: auto`를 카드에 적용합니다** (CSS만, 의존성 없음).
  - 적용: `className="[content-visibility:auto] [contain-intrinsic-size:auto_220px]"`. 높이값은 실제 카드 높이로 맞춥니다.
  - 효과: 화면 밖 카드의 레이아웃과 페인트를 생략해 초기 렌더와 필터 변경 시 커밋 후 렌더링 비용이 줄어듭니다. 추정치는 **수십~150ms**입니다 **[ASSUMPTION]**.
  - 리스크: 높이 추정이 틀리면 스크롤바가 튑니다. 스크롤 중 CLS는 지표에 잡히지 않지만 체감상 확인이 필요합니다. 페이지 내 찾기(Ctrl+F)는 동작합니다.
- **R6b. 카드 내용을 서버 컴포넌트로 만듭니다.**
  - 방식: `page.tsx`에서 `<AgentCard>`(서버)를 렌더해 `cards: Record<slug, ReactNode>`로 클라이언트 그리드에 넘깁니다. 클라이언트는 `hidden` 토글만 담당하고, BookmarkButton만 클라이언트 섬으로 남습니다.
  - 효과: hydration 때 카드별 컴포넌트 함수(배지, 태그, lucide)를 실행하지 않습니다.
  - 트레이드오프: 카드 엘리먼트 트리가 RSC payload에 들어가므로 R2로 줄인 payload가 다시 늘어납니다(대략 카드 마크업 크기만큼). **적용 전후 TBT와 HTML 크기를 둘 다 재서 이득일 때만 채택**합니다.
- **SEO 제약 때문에 권하지 않는 것:** 페이지네이션이나 가상화로 초기 카드 수를 줄이는 방법입니다. "JS 없이도 카드 목록 HTML이 있어야 한다"는 제약과 충돌합니다. 목록 일부만 HTML에 두려면 SEO 쪽 결정(나머지 카드의 크롤 경로 보장)이 먼저 필요합니다.

---

### Later (목표 지표를 거의 움직이지 않음)
- BookmarkButton 100개가 각각 `storage` 이벤트를 구독하는 구조를 모듈 단일 구독자로 합칩니다. 체감 효과는 작습니다.
- lucide 아이콘을 카드당 3개에서 줄이거나 CSS 스프라이트로 바꿉니다. R3 이후에는 효과가 미미합니다.
- 검색어 하이라이트나 관련도 정렬 같은 기능 개선은 성능 작업과 분리합니다.
- GitHub Pages의 캐시 헤더는 제어할 수 없으므로 재방문 캐시 튜닝은 범위 밖입니다.
- 빌드 산출물 크기 예산을 CI에 추가합니다(아래 다음 액션 참고). 지표를 직접 움직이지는 않지만 회귀를 막습니다.

---

## 3. 측정 계획

### 0단계: 원인 확정 (코드 수정 전, 약 30분). 결과에 따라 R1/R4/R5 적용 여부가 정해집니다.
```bash
npm run build
F=out/ko/agents/index.html
grep -c "BAILOUT_TO_CLIENT_SIDE_RENDERING" $F          # ≥1이면 D2 확정 → R1
grep -o "특정 에이전트 realUseCases 고유 문구" $F | wc -l   # 마크업 1회 + RSC 1회 초과면 중복 직렬화
grep -o "특정 에이전트 프롬프트 고유 문구" $F | wc -l      # ≥1이면 카드에 안 쓰는 필드가 payload에 있음(D1)
grep -l "특정 에이전트 프롬프트 고유 문구" out/_next/static/chunks/*.js   # 결과 있으면 R4
```
- `page.tsx`/`AgentSearchPanel`에서 H1이 Suspense 경계 안에 있는지 코드로 확인합니다.
- Performance 패널에서 LCP 분해(TTFB / 렌더 지연)와, 50ms를 넘는 long task 목록을 Bottom-up 기준 상위 원인과 함께 표로 기록합니다. TBT 1,420ms가 어디서 오는지 이것으로 확정합니다.

### 고정 조건 (전후 비교용)
- **대상:** 배포본 `/ko/agents/`. 로컬 비교가 필요하면 `npx serve out`을 쓰되, 로컬 수치와 배포본 수치를 섞어서 비교하지 않습니다. 배포 전 검증은 fork의 GitHub Pages에 올려 같은 CDN 조건을 맞추는 것을 권합니다.
- **환경:** Chrome 같은 버전, 시크릿 창, 확장 프로그램 없음, DevTools "Disable cache" 켬, Performance 패널 "Mid-tier mobile"(4x CPU, Fast 4G). 9/27 측정과 동일한 조건입니다. 다른 앱을 닫아 호스트 CPU 부하를 맞춥니다.
- **반복:** 로드 지표(FCP/LCP/TBT)는 **5회 측정 후 중앙값**, INP는 **3회 기록**합니다. 모든 키 입력 interaction의 최댓값과 중앙값을 적습니다.
- **입력 시나리오:** 페이지 로드 완료 후 3초를 기다립니다. 검색창을 클릭하고 "리뷰"를 입력한 뒤(IME 조합 포함), Backspace 2회를 누르고, 도구 칩 1개를 클릭합니다. 매번 같은 순서로 합니다.
- **Lighthouse:** 모바일 점수는 참고용으로 같은 날 3회 중앙값을 기록합니다. Lighthouse는 시뮬레이션 스로틀링이라 DevTools 수치와 직접 비교하지 않습니다.

### 측정 스니펫 (새 의존성 없음, DevTools 콘솔)
**A. 크기**
```js
// RSC payload 합계 (문자 수 ≈ 바이트, 한국어는 더 큼)
[...document.scripts].filter(s => s.textContent.includes("self.__next_f"))
  .reduce((n, s) => n + new Blob([s.textContent]).size, 0) / 1024
```
```bash
curl -s -H 'Accept-Encoding: gzip' https://<site>/ko/agents/ | wc -c   # 전송(gzip) 크기
curl -s --compressed https://<site>/ko/agents/ | wc -c                 # 압축 해제 크기
```
**B. INP (키 입력별)** — 페이지 로드 직후 붙여넣고 시나리오를 실행합니다.
```js
new PerformanceObserver((l) => l.getEntries().forEach((e) => e.interactionId && console.log(
  e.name, "total", Math.round(e.duration),
  "delay", Math.round(e.processingStart - e.startTime),
  "processing", Math.round(e.processingEnd - e.processingStart),
  "present", Math.round(e.startTime + e.duration - e.processingEnd)
))).observe({ type: "event", durationThreshold: 16, buffered: true });
```
delay, processing, present 분해를 보면 R3가 어느 구간을 줄였는지 알 수 있습니다.

**C. LCP와 H1 교체 여부**
```js
new PerformanceObserver((l) => l.getEntries().forEach((e) =>
  console.log("LCP", Math.round(e.startTime), e.element, e.element?.isConnected)
)).observe({ type: "largest-contentful-paint", buffered: true });
```
로드가 끝난 뒤 로그된 H1 요소의 `isConnected`가 `false`이면, 그 H1은 교체되어 DOM에서 빠진 노드입니다(D2 확정).

### 합격 기준 (모두 5회 중앙값, Mid-tier mobile)
| 항목 | 현재 | 합격 |
|---|---|---|
| LCP | 3.8s | < 2.5s |
| TBT | 1,420ms | < 600ms |
| 최대 long task | 640ms | ≤ 200ms (권장) |
| INP (검색 키 입력 최댓값) | 280~340ms | < 200ms |
| RSC payload | ~790KB | ≤ 300KB |
| HTML gzip | 186KB | ≤ 90KB |
| CLS | 0.02 | ≤ 0.1 유지 |
| 데스크톱 LCP/INP | 0.9s / 60ms | 악화 없음 |

권고를 **하나씩** 적용하고 매번 같은 프로토콜로 측정한 뒤, 이슈에 전후 표를 붙입니다. 그래야 어느 변경이 얼마나 기여했는지 분리됩니다.

---

## 가정 (확인 필요)
1. H1이 Suspense 경계 안에 있어 클라이언트에서 교체된다(D2, R1의 LCP 효과 전제). 확인: 0단계 grep과 스니펫 C.
2. 640ms long task는 hydration이 아니라 bailout 후의 클라이언트 전체 렌더다. 확인: `BAILOUT_TO_CLIENT_SIDE_RENDERING` 존재 여부.
3. RSC payload 790KB의 대부분이 카드에 안 쓰는 필드다. 확인: R2의 필드별 크기 스크립트.
4. 에이전트 데이터가 클라이언트 JS 번들에도 들어 있을 수 있다. 확인: R4의 청크 grep.
5. `searchAgents`는 원래 순서를 유지한다(관련도 정렬 없음). R3의 `hidden` 방식 전제이며, 코드로 확인합니다.
6. 모든 효과 추정치(ms, KB)는 위 근거에 따른 범위이고, 벤치마크 결과가 아닙니다.

## 리스크
- **R1:** `?q=` 공유 링크로 진입하면 hydration 뒤 필터링 렌더가 한 번 더 일어납니다(짧은 깜빡임). URL 쓰기 로직과 루프가 생기지 않게 해야 합니다.
- **R2:** 카드나 필터에 필요한 필드를 누락할 수 있습니다. 타입과 테스트로 막습니다. R2b를 쓰면 인덱스 도착 전 첫 검색의 결과가 부분적일 수 있습니다.
- **R3:** 카드의 `display` 유틸리티가 `hidden` 속성을 덮어쓸 수 있습니다. 관련도 정렬을 나중에 추가하면 `hidden` 방식을 다시 검토해야 합니다.
- **R6b:** payload가 다시 늘어나는 트레이드오프가 있어 측정 없이 채택하면 안 됩니다.
- **측정 편차:** 로컬 서버와 GitHub Pages 수치를 섞으면 전후 비교가 무효가 됩니다.

## 다음 액션 (이슈 분할 제안, 순서대로)
1. **[perf] 0단계 진단 결과 기록.** grep 4종, H1 위치, LCP 분해, long task 표를 기록하고, 이 이슈에 기준선 수치를 고정합니다. 결과에 따라 2~5번 이슈의 범위를 확정합니다.
2. **[perf] R1: useSearchParams bailout 제거.** 목표 지표는 LCP와 TBT입니다. 선행 조건은 1번입니다.
3. **[perf] R2: 목록 페이지 슬림 props + 빌드 시 searchText.** 목표 지표는 TBT, HTML 크기, INP 일부입니다. 2번과 병행할 수 있지만 측정은 순차로 합니다.
4. **[perf] R3: 검색 INP (useDeferredValue + hidden 토글 + 칩 memo).** 목표 지표는 INP입니다. R2의 `AgentListItem`에 의존합니다.
5. **[perf] R4: 클라이언트 번들 내 에이전트 데이터 확인과 제거.** 1번 결과가 음성이면 닫습니다.
6. **[perf] 재측정 후 판단.** 목표 미달 항목에 대해서만 R5/R6를 진행합니다.
7. **[chore] 회귀 방지.** `scripts/`에 빌드 후 `out/ko/agents/index.html` 크기와 RSC payload 크기 예산 체크를 추가합니다(예: HTML 압축 해제 기준 400KB 초과 시 CI 실패). 새 의존성은 없습니다.
