# /agents 모바일 성능 감사 (측정일 9/27, /ko/agents, Mid-tier mobile)

## 요약

| 목표 | 현재 | 목표 | 주 원인 (추정 포함) |
|---|---|---|---|
| LCP | 3.8s | < 2.5s | H1이 FCP(1.9s)에 그려지지 않고, JS 로드·hydration 이후 **다시 그려짐** [ASSUMPTION: Suspense 경계 안에 H1이 있음] |
| TBT | 1,420ms | < 600ms | 790KB RSC payload 처리 + 312KB(gzip) JS 평가 + 640ms hydration long task |
| INP | 280–340ms | < 200ms | 키 입력마다 100개 카드 그리드 전체를 동기 렌더 (디바운스·지연 렌더 없음) + 검색 문자열 재생성 |

세 목표 모두 같은 뿌리에서 나옵니다. **카드 목록에 필요 없는 데이터(프롬프트, evaluation, sample runs 등)까지 100개 전부 클라이언트 props로 넘기고, 그 목록을 클라이언트에서 통째로 다시 그리는 구조**입니다. 데스크톱(LCP 0.9s, INP 60ms)이 괜찮은 건 같은 작업이 4x 느린 CPU에서만 임계치를 넘기 때문이고, 네트워크보다 **메인 스레드 작업**이 병목이라는 뜻입니다.

---

## 1. 진단

측정값이 보여 주는 것(**측정**)과 제가 추론한 것(**[ASSUMPTION]**)을 나눠 적었습니다.

### D1. HTML의 70%가 RSC payload다

- **측정**: HTML은 압축 해제 기준 1.14MB이고, 그중 `self.__next_f` 인라인 스크립트가 약 790KB(69%)입니다. 실제 마크업(카드, 칩, 레이아웃)은 약 350KB입니다.
- **원인**: `page.tsx`가 `agents` 100개 전체 객체를 클라이언트 컴포넌트(`AgentSearchPanel`, `AgentSearchPanelFromUrl`)에 props로 넘깁니다. 카드와 검색에 쓰지 않는 필드(프롬프트, evaluation, sample runs)도 모두 직렬화됩니다.
- **크기 비교**: 소스 `agents.ts`는 428KB인데 payload는 790KB로 약 1.85배입니다. 이 차이를 설명하는 후보는 세 가지입니다.
  - (a) JS 문자열 안에 JSON을 넣으면서 생기는 이스케이프(`\"`, `\n`) 오버헤드.
  - (b) fallback의 props와 실제 자식의 props에 `agents`가 **두 번** 들어감.
  - (c) 다른 언어(en) 필드까지 함께 들어감.
  - [ASSUMPTION] 어느 쪽인지는 아직 모릅니다. 아래 "확인 1"로 판별합니다.
- **효과**: 모바일 네트워크 비용은 크지 않습니다. 186KB gzip은 Fast 4G에서 전송 수백 ms 수준입니다. 비용은 **메인 스레드**에서 생깁니다. 4x CPU에서 790KB짜리 인라인 스크립트를 파싱·실행하고 Flight 행을 역직렬화해야 hydration을 시작할 수 있습니다.

### D2. LCP(H1)가 FCP보다 1.9s 늦다

- **측정**: FCP는 1.9s, LCP는 3.8s이고 LCP 요소는 H1입니다. 텍스트 요소라서 리소스 로드 지연이 없으므로 1.9s의 차이는 거의 전부 **render delay**입니다.
- **추론 [ASSUMPTION]**: `AgentSearchPanelFromUrl`은 `useSearchParams`를 쓰므로, 정적 export 시 이 Suspense 경계는 **fallback만 HTML로 렌더**됩니다. 클라이언트에서는 fallback DOM을 버리고 실제 자식을 새로 렌더해 교체합니다(클라이언트 렌더 bailout). H1이 이 경계 안(패널 내부)에 있다면 교체 후의 H1은 **새 요소**이므로, 새 LCP 후보가 JS 다운로드·평가·hydration이 끝난 뒤에 기록됩니다. 3.8s ≈ FCP 1.9s + JS 312KB 평가 + 640ms long task라는 구성과 맞습니다.
- **다른 후보**: H1에 쓰는 한글 웹폰트가 `font-display: block`이거나, 폰트 로드 뒤 크기가 바뀌어 LCP가 갱신되는 경우입니다. "확인 2"로 배제합니다.
- 같은 bailout 때문에 **카드 100개와 칩 80개도 클라이언트에서 처음부터 다시 생성**됩니다. 이것도 640ms long task의 일부로 추정합니다 [ASSUMPTION].

### D3. TBT 1,420ms의 구성

- **측정**: hydration long task 1개가 640ms이므로 TBT 기여는 약 590ms입니다. 나머지 **약 830ms**는 다른 long task에서 나옵니다.
- **추론 [ASSUMPTION]** 나머지 구성 후보는 다음과 같습니다.
  - (1) JS 312KB(gzip), 압축 해제 시 대략 1MB 안팎의 파싱·평가.
  - (2) 790KB RSC payload 처리.
  - (3) 1.14MB HTML 파싱 청크.
  - (4) BookmarkButton 100개의 `useSyncExternalStore`. 서버 스냅샷과 클라이언트 스냅샷이 다르면 hydration 직후 재렌더가 생깁니다.
- **의심 지점**: 312KB gzip은 목록 페이지치고 큽니다. Next/React 런타임만으로는 보통 이보다 훨씬 작습니다. **클라이언트 번들 어딘가(헤더 검색, 북마크, 커맨드 팔레트 등)가 `src/data/generated/agents.ts`를 import해서 데이터가 JS 청크에도 들어갔을 가능성**이 있습니다 [ASSUMPTION]. 그렇다면 같은 데이터를 HTML과 JS로 두 번 보내는 셈입니다. "확인 3"으로 판별합니다.

### D4. INP 280–340ms (키 입력당)

- **측정**: 4x CPU에서 "리뷰"를 빠르게 입력할 때 키 입력당 280–340ms입니다. 데스크톱은 60ms입니다.
- **원인**:
  - (a) `query` state가 바뀔 때마다 `searchAgents`가 100개 × 긴 문자열(realUseCases 포함) join + `toLowerCase`를 새로 만듭니다.
  - (b) `results`가 새 배열이 되므로 `AgentGrid`가 결과 전체를 동기 렌더합니다. 카드 100개 × (배지 4, 태그 4, 아이콘 3, BookmarkButton)입니다.
  - (c) 사라지거나 나타나는 카드의 DOM commit, layout, paint가 따라옵니다.
- **한국어 IME**: "리뷰"를 입력하면 조합 과정(ㄹ→리→립→리ㅂ→리뷰…)마다 `onChange`가 발생합니다. 따라서 체감 업데이트 횟수는 글자 수보다 많습니다.
- **추론 [ASSUMPTION]**: 처리 시간의 대부분은 (a)보다 (b)+(c), 즉 React 렌더와 DOM 작업일 가능성이 높습니다. 100개 문자열 처리는 수~수십 ms 규모이기 때문입니다. INP 분해(input delay / processing / presentation delay)로 확인합니다.

### 먼저 할 확인 (30분, 코드 변경 없음)

1. **payload 중복**: 배포 HTML에서 특정 에이전트 프롬프트에만 있는 문장이 몇 번 나오는지 셉니다.
   `curl -s https://<host>/ko/agents/ | grep -o "<프롬프트 고유 문장>" | wc -l`
   2 이상이면 D1(b) 중복입니다. 영어 전용 필드 문장도 같은 방법으로 세면 D1(c)를 판별할 수 있습니다.
2. **LCP 원인**: DevTools Performance 녹화 → LCP 마커를 클릭해 해당 노드를 확인합니다. 콘솔에서 다음을 실행하면 LCP 후보가 여러 번 기록되는지, 마지막 후보의 시각이 hydration 직후인지 볼 수 있습니다.
   ```js
   new PerformanceObserver(l => l.getEntries().forEach(e =>
     console.log('LCP', Math.round(e.startTime), e.element, e.size)
   )).observe({ type: 'largest-contentful-paint', buffered: true });
   ```
   H1 엔트리가 두 번(약 1.9s와 약 3.8s) 찍히면 D2 가설(교체)이 맞습니다. 한 번만 약 3.8s에 찍히고 Network에서 폰트 완료 시각과 겹치면 폰트 쪽 원인입니다.
3. **번들에 데이터 포함 여부**: `npm run build` 후
   `grep -l "<프롬프트 고유 문장>" out/_next/static/chunks/*.js out/_next/static/chunks/**/*.js`
   결과가 나오면 해당 청크의 import 경로를 추적합니다.
4. **필드별 크기**: 어떤 필드를 빼야 효과가 큰지 수치로 봅니다. 1회용 스크립트이므로 커밋할 필요는 없습니다. export 이름은 실제 코드에 맞춰 바꾸세요 [ASSUMPTION].
   ```ts
   // npx tsx measure-fields.ts
   import { agents } from "./src/data/generated/agents";
   const sizes: Record<string, number> = {};
   for (const a of agents)
     for (const [k, v] of Object.entries(a))
       sizes[k] = (sizes[k] ?? 0) + Buffer.byteLength(JSON.stringify(v ?? null));
   console.table(Object.entries(sizes).sort((x, y) => y[1] - x[1])
     .map(([field, b]) => ({ field, KB: +(b / 1024).toFixed(1) })));
   ```

---

## 2. 권고 (목표 지표에 대한 예상 효과 순)

각 항목은 GitHub 이슈 하나로 쪼갤 수 있게 작성했습니다. 새 의존성은 쓰지 않습니다.

### R1. Suspense bailout 제거: 패널을 정적 렌더되게 하고 H1은 서버 컴포넌트로 → **LCP, TBT**

**증상→원인**: LCP 3.8s, 640ms long task ← `useSearchParams` 때문에 패널 전체가 fallback→클라이언트 렌더로 교체됨 (D2).

**변경**:
- `page.tsx`에서 H1, 소개 문단 등 페이지 헤더를 패널 밖, 서버 컴포넌트 영역으로 옮깁니다.
- `useSearchParams`는 URL→state 동기화만 하는 작은 컴포넌트로 격리합니다. 그러면 패널 자체는 Suspense 밖에서 정적 prerender되고, 클라이언트는 이를 **교체하지 않고 hydrate**합니다.

```tsx
// page.tsx (서버)
<h1>…</h1>
<AgentSearchPanel agents={listItems} locale={locale} />

// AgentSearchPanel.tsx ("use client")
const [query, setQuery] = useState("");
const [filters, setFilters] = useState(EMPTY_FILTERS);
return (
  <>
    <Suspense fallback={null}>
      <UrlStateSync onQuery={setQuery} onFilters={setFilters} />
    </Suspense>
    {/* 검색창, 필터, 그리드 */}
  </>
);

// UrlStateSync.tsx ("use client"): useSearchParams를 읽어 useEffect에서 setter 호출, 렌더 결과 null
```

**예상 효과**:
- LCP: H1이 HTML 첫 페인트에 그려지고 교체되지 않으므로 LCP ≈ FCP가 됩니다. **3.8s → 약 1.7–2.4s**. R2로 HTML이 줄면 FCP도 약간 앞당겨질 수 있습니다. 근거는 텍스트 LCP의 render delay가 FCP 이후 JS 대기뿐이라는 점입니다 (D2 가설이 "확인 2"에서 맞을 때).
- TBT: 카드 100개와 칩 80개의 DOM 재생성이 hydration(기존 DOM 재사용)으로 바뀝니다. 렌더 함수 실행 비용은 비슷하게 남으므로 **-100~-300ms 정도**로 보수적으로 잡습니다 [ASSUMPTION].
- **fallback과 자식에 `agents`가 두 번 들어가 있었다면** 한 번으로 줄어 payload가 크게 감소합니다 (확인 1의 결과에 따라).

**비용/리스크**:
- `?q=` 또는 필터가 붙은 URL로 들어오면 hydration 직후 한 번 필터가 적용되므로, 전체 목록이 잠깐 보였다 줄어드는 깜빡임이 생깁니다. 딥링크 사용 빈도가 낮다면 수용 가능하다고 봅니다.
- 패널 렌더 중에 `localStorage`나 `window`를 읽는 코드가 있으면 hydration mismatch가 납니다. 그런 코드는 effect나 `useSyncExternalStore`의 `getServerSnapshot`으로 옮겨야 합니다.

**SEO**: 오히려 좋아집니다. 카드 목록이 fallback이 아니라 실제 패널 마크업으로 HTML에 들어갑니다.

**검증**:
- Performance 패널(Mid-tier mobile, 캐시 비움)에서 LCP 엔트리가 1개이고 그 시각이 FCP 근처인지 확인합니다 (위 PerformanceObserver 스니펫 사용).
- **통과 기준: LCP 중앙값 < 2.5s (5회)**. 콘솔에 hydration mismatch 경고가 없어야 합니다.
- `/ko/agents/?q=리뷰` 딥링크가 결과를 필터링하는지 확인합니다.

### R2. 클라이언트로 넘기는 데이터를 카드·검색 필드로 축소 → **TBT, LCP(보조), INP(보조)**

**증상→원인**: RSC payload 790KB, 파싱·hydration 비용 ← 카드에 안 쓰는 필드까지 전부 직렬화됨 (D1).

**변경**:
- `src/types/agent.ts`에 `AgentListItem` 타입을 추가합니다.
- `page.tsx`(서버)에서 `agents.map(a => toListItem(a, locale))`으로 변환한 결과만 넘깁니다.
  - **포함할 필드**: slug, name, summary, 카드 배지 4개와 태그 4개에 필요한 값, 필터 대상(roles, tools, category 등).
  - 검색용으로는 **미리 소문자화한 `searchText` 문자열 하나**를 넣습니다: name + summary + description + tags + roles + tools + realUseCases.
  - **제외할 필드**: prompt, evaluation, sample runs, 원본 realUseCases 배열, 현재 locale이 아닌 번역 필드.
- `AgentCard`, `filterAgents`, `searchAgents`의 입력 타입을 `AgentListItem`으로 바꿉니다. 그러면 타입 체크가 "카드가 무거운 필드를 다시 참조하는 회귀"를 막아 줍니다.

**예상 효과**:
- payload 크기는 "확인 4"의 필드별 크기로 정확히 산정해야 합니다. 프롬프트와 sample runs가 전체의 절반 이상이라면 [ASSUMPTION] **790KB → 약 150–350KB**입니다. 남는 양은 realUseCases를 searchText에 얼마나 남기느냐에 좌우됩니다.
- TBT: payload 처리와 props hydration 비용이 비례해 줄어 **-100~-300ms**로 봅니다 [ASSUMPTION: payload 처리 비용을 Performance 패널에서 확인].
- LCP: HTML이 작아져 파싱이 빨라지므로 소폭 개선됩니다.

**2단계 (필요할 때만)**: payload가 여전히 크고 대부분이 realUseCases라면, `searchText`를 locale별 정적 JSON(`public/search/ko.json`)으로 분리합니다. 이 JSON은 검색창 첫 focus 때 `fetch`합니다. 로드 전에는 name/summary/tags만으로 검색합니다. 정적 파일이므로 "서버 API 없음" 제약과 충돌하지 않습니다.

**리스크**: 필드 누락 시 카드 표시가 빠집니다. 타입과 테스트로 막습니다. 검색 결과 집합이 기존과 달라지면 안 되므로 `tests/`에 "기존 searchAgents와 새 구현이 같은 쿼리 샘플에 같은 slug 집합을 반환" 테스트를 추가하길 권합니다.

**SEO**: 영향 없습니다. 카드 HTML은 그대로입니다.

**검증**:
- `out/ko/agents/index.html`에서 `self.__next_f` 스크립트 총 크기를 측정합니다 (측정 계획의 스크립트 사용).
- **통과 기준: RSC payload ≤ 350KB(압축 해제)**. 그리고 Performance 패널에서 TBT 중앙값이 R1 이후 값보다 감소해야 합니다.

### R3. 검색 입력을 그리드 렌더와 분리 (`useDeferredValue` + memo + 사전 계산) → **INP**

**증상→원인**: INP 280–340ms ← 키 입력(IME 조합 단계 포함)마다 그리드 전체를 동기 렌더하고 검색 문자열을 재생성함 (D4).

**변경** (React 19 내장 기능만 사용):
```tsx
const deferredQuery = useDeferredValue(query);
const q = deferredQuery.trim().toLowerCase();
const results = useMemo(
  () => filterAgents(q ? agents.filter(a => a.searchText.includes(q)) : agents, filters),
  [agents, q, filters],
);
// 입력 중임을 표시(선택): const isStale = query !== deferredQuery;
```
- `searchText`는 R2에서 서버가 미리 만든 값이므로, 키 입력마다 하던 100회 join과 `toLowerCase`가 사라집니다. R2 전에 R3를 먼저 한다면 `useMemo(() => agents.map(build), [agents])`로 한 번만 만듭니다.
- `AgentCard`를 `memo`로 감쌉니다. 에이전트 객체 참조가 안정적이므로, 결과에 남아 있는 카드는 재렌더되지 않고 추가/삭제되는 카드만 처리됩니다. 카드에 인라인 객체나 함수 props를 넘기고 있다면 제거해야 memo가 효과를 냅니다.
- 입력창은 `query`(즉시 반영)로, 그리드는 `deferredQuery`로 렌더합니다. 입력 업데이트가 먼저 페인트되고, 그리드 렌더는 중단 가능한 저우선 작업이 됩니다. 디바운스는 결과가 늦게 뜨는 체감 지연을 추가하므로 넣지 않습니다.

**예상 효과**: INP가 측정하는 "입력 → 다음 페인트"에는 입력창 업데이트만 들어가게 됩니다. **280–340ms → 약 80–180ms**로 봅니다. 폭이 넓은 이유는 deferred 렌더가 이미 진행 중일 때 들어온 입력의 input delay가 React의 양보 단위(약 5ms 태스크)와 카드 단위 commit 크기에 좌우되기 때문입니다. **commit(DOM 반영)은 중단되지 않으므로**, 결과 변화가 큰 입력(100개→3개)의 presentation delay는 R4로 추가로 줄입니다.

**리스크**: 결과가 입력보다 한 박자 늦게 바뀝니다. 필요하면 `isStale`일 때 그리드 opacity를 낮춰 표시합니다. 로직 변화는 작습니다.

**검증**:
- 콘솔에서 Event Timing 관찰자를 켜고 "리뷰"를 입력합니다.
  ```js
  new PerformanceObserver(l => l.getEntries().forEach(e => e.interactionId && console.log(
    e.name, Math.round(e.duration), 'delay', Math.round(e.processingStart - e.startTime),
    'proc', Math.round(e.processingEnd - e.processingStart)
  ))).observe({ type: 'event', durationThreshold: 16, buffered: true });
  ```
- **통과 기준: 시나리오 전체 interaction 중 최댓값 < 200ms** (INP는 최악에 가까운 값을 대표로 쓰므로 최댓값으로 판정). 3회 반복합니다.
- 영어(`/en/agents`에서 "review") 시나리오도 같이 측정해 IME와 무관한 기준선으로 씁니다.

### R4. 카드에 `content-visibility: auto` 적용 → **INP(presentation delay), TBT(보조)**

**증상→원인**: 결과가 크게 바뀌거나 첫 렌더를 할 때 화면 밖 카드까지 layout과 paint를 함 (D4-c).

**변경**: `AgentCard` 루트에 Tailwind arbitrary property를 추가합니다. `h-[…]` 값은 실제 모바일 카드 높이에 맞춥니다 [ASSUMPTION: 모바일 1열, 카드 높이 약 280px].
```tsx
<article className={cn("[content-visibility:auto] [contain-intrinsic-size:auto_280px]", …)}>
```

**예상 효과**: 모바일 1열 기준으로 뷰포트 밖 카드 약 95개의 렌더링 작업(layout/paint)을 건너뜁니다. 결과가 바뀌는 입력의 presentation delay와 초기 렌더의 layout 비용이 줄어듭니다. **layout/paint 시간 30–70% 감소**를 기대하지만, INP 전체에 대한 효과는 layout이 얼마나 차지하느냐에 달려 있어 **-20~-80ms**로 폭을 넓게 잡습니다 [ASSUMPTION].

**비용/리스크**:
- 스크롤할 때 intrinsic size와 실제 높이 차이로 스크롤바가 튈 수 있습니다. `auto` 키워드로 한 번 렌더된 뒤의 높이를 기억하므로 완화됩니다.
- CLS를 재측정해야 합니다 (현재 0.02).
- DOM은 그대로라서 페이지 내 검색(Ctrl+F), 스크린리더, SEO에는 영향이 없습니다.

**검증**:
- R3와 같은 INP 시나리오에서 interaction 엔트리의 `duration - (processingEnd - startTime)`(presentation delay)가 감소했는지 확인합니다.
- **CLS < 0.1 유지**. 스크롤 시나리오를 포함해 Performance 패널 Layout Shifts 트랙을 확인합니다.

### R5. (확인 3에서 발견될 때만) 클라이언트 번들에서 에이전트 데이터 제거 → **TBT**

**증상→원인**: JS 312KB(gzip)가 목록 페이지치고 큼. 데이터 모듈이 클라이언트 청크에 포함됐을 가능성 (D3).

**변경**: 해당 클라이언트 컴포넌트가 필요한 값만 서버 컴포넌트에서 props로 받게 합니다. 예를 들어 북마크 목록 페이지는 slug→이름 맵만 받습니다. 또는 R2의 정적 JSON을 lazy `fetch`합니다. `"use client"` 파일에서 `src/data/agents`를 import하지 못하게 ESLint `no-restricted-imports` 규칙을 추가하면 재발을 막을 수 있습니다.

**예상 효과**: 데이터가 들어 있었다면 gzip 약 80–130KB(428KB 소스의 일반적인 압축률 기준 [ASSUMPTION])가 JS에서 빠집니다. 4x CPU에서 파싱·평가 **-150~-400ms**의 TBT 감소를 예상합니다. 데이터가 없었다면 이 항목은 닫고, 312KB의 구성을 `@next/bundle-analyzer` 없이 `.next/`의 청크 크기와 Coverage 탭으로 분석하는 후속 이슈로 전환합니다.

**검증**: 빌드 후 `grep`에 결과가 없어야 합니다. DevTools Network(JS 필터)에서 전송 합계를 확인하고, **TBT 중앙값 < 600ms**인지 봅니다.

### R6. BookmarkButton 100개의 스토어 구독 정리 → **TBT(보조)**

**증상→원인**: hydration long task 안에 카드별 `useSyncExternalStore`가 100개 있음. `getSnapshot`이 매번 `localStorage.getItem`과 `JSON.parse`를 한다면 렌더마다 100회 이상 파싱합니다 [ASSUMPTION: 코드 미확인].

**변경**:
- 스토어 모듈에서 `localStorage` 값을 한 번 읽어 캐시합니다. `getSnapshot`은 캐시된 `Set`(참조가 안정적인 값)을 반환하고, `storage` 이벤트와 쓰기 시에만 캐시를 갱신합니다.
- `getServerSnapshot`은 빈 Set을 반환하도록 명시합니다.

**예상 효과**: 작습니다. **-20~-100ms** 정도입니다 [ASSUMPTION]. Performance 패널 Bottom-up에서 `getItem`/`JSON.parse` 시간이 보일 때만 우선순위를 올립니다.

**검증**: Bottom-up 탭에서 해당 함수의 누적 self time을 확인합니다. 북마크 토글이 다른 탭과 동기화되는 기존 동작은 수동으로 확인합니다.

### 권고하지 않는 것 (제약과 충돌)

- **페이지네이션/가상화**: "JS 없이 카드 목록 HTML 전체" 요구와 충돌합니다. 정적 HTML 전체 + 클라이언트 가상화 조합은 hydration mismatch와 복잡도가 커서 R1–R4로 목표를 먼저 확인하는 게 낫습니다.
- **검색 라이브러리(Fuse, FlexSearch 등)**: 100개 규모에서 병목은 문자열 매칭이 아니라 렌더입니다 (D4). 새 의존성의 이유가 성립하지 않습니다.
- **Web Worker 검색**: 같은 이유로 과합니다.

### Later (목표 지표를 직접 움직이지 않음)

- 카드 `Link`의 viewport prefetch(스크롤 시 RSC `.txt` 요청 다수) → `prefetch={false}` 검토. 데이터 사용량 절감용입니다.
- 필터 칩 80개의 개수 표시가 키 입력마다 재계산되는지 확인하고, 필요하면 `useMemo`를 추가합니다.
- lucide 아이콘 import가 개별 아이콘 단위로 tree-shake되는지 번들에서 확인합니다.
- 한글 웹폰트를 쓴다면 subset과 `preload` 여부를 점검합니다 (FCP 개선용이며, 확인 2에서 폰트가 LCP 원인으로 나오면 우선순위를 올립니다).
- GitHub Pages 기본 캐시(`max-age=600`)는 재방문에만 영향이 있고 헤더 제어가 불가하므로 대응하지 않습니다.

---

## 3. 측정 계획 (전후 비교 프로토콜)

결과를 PR 간에 비교할 수 있도록 조건을 고정합니다.

**환경**
- 같은 머신, 같은 Chrome 버전(버전을 기록), 시크릿 창, 확장 프로그램 없음, 다른 탭 닫기, 전원 연결.
- DevTools: **"Mid-tier mobile" 프리셋(4x CPU, Fast 4G)**, Disable cache 체크, 모바일 뷰포트(예: 412×915)를 고정합니다. 9/27 기준선과 같은 설정입니다.
- 대상: `/ko/agents/` 쿼리 없음. INP만 `/ko/agents/`와 `/en/agents/` 모두 측정합니다.

**PR 단위 측정 (배포 전)**
- `npm run build` 후 `out/`을 gzip을 지원하는 로컬 정적 서버로 서빙합니다 (예: `npx serve out`, 개발 도구이며 프로젝트 의존성 아님).
  - 로컬은 TTFB와 압축이 GitHub Pages와 다르므로, **로컬 before와 로컬 after끼리만** 비교합니다.
  - 같은 서버로 main 브랜치 빌드(before)와 PR 브랜치 빌드(after)를 번갈아 측정합니다.
- 로드 지표(FCP, LCP, TBT, CLS): Performance 패널에서 새로고침 녹화 **5회, 중앙값**을 씁니다. 첫 회는 워밍업으로 버립니다.
  - Lighthouse 점수(54)는 참고용으로만 씁니다. Lighthouse 기본 simulated throttling과 DevTools applied throttling은 값이 달라서 섞어 비교하면 안 됩니다.
- INP: 페이지 로드 → 3초 대기 → 검색창 탭 → "리뷰" 입력(IME, 평소 속도) → 전체 지우기. **3회 반복**하고 Event Timing 스니펫의 interaction 최댓값을 기록합니다.
  - `/en`에서는 "review"로 같은 절차를 따릅니다.
- 크기: 다음 명령으로 RSC payload 크기를 기록합니다.
  ```bash
  node -e 'const h=require("fs").readFileSync("out/ko/agents/index.html","utf8");const m=h.match(/self\.__next_f\.push\([\s\S]*?\)<\/script>/g)||[];console.log("html",(Buffer.byteLength(h)/1024|0)+"KB","rsc",(m.reduce((s,x)=>s+Buffer.byteLength(x),0)/1024|0)+"KB")'
  ```
  JS 합계는 Network 패널 JS 필터의 transferred 값으로 기록합니다.
- SEO 가드: JS를 비활성화한 상태에서 카드가 보이는지 확인하고, 다음 명령으로 카드 링크 수를 셉니다. 셀렉터는 실제 마크업에 맞춰 조정하세요.
  ```bash
  grep -o 'href="/ko/agents/[^"]*"' out/ko/agents/index.html | sort -u | wc -l
  ```
  **통과 기준: 에이전트 수(100) 이상**.

**배포 후 확인**
- main 머지 후 배포본에서 같은 프로토콜로 5회를 측정하고 9/27 기준선과 비교합니다.

**기록 양식 (이슈 코멘트용)**

| 날짜 | 커밋 | 환경 | FCP | LCP | TBT | CLS | INP(ko max) | INP(en max) | HTML 압축해제 | RSC | JS gzip |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 9/27 | (배포본) | 배포, Mid-tier | 1.9s | 3.8s | 1,420ms | 0.02 | 280–340ms | 미측정 | 1.14MB | ~790KB | 312KB |

**최종 통과 기준 (배포본, 중앙값)**: LCP < 2.5s, TBT < 600ms, INP < 200ms, CLS < 0.1 유지, 카드 HTML 100개 유지.

---

## 가정 목록

- [A1] H1이 `AgentSearchPanel`(Suspense 경계) 안에 렌더된다 → 확인 2.
- [A2] RSC payload의 대부분이 카드에 쓰지 않는 필드(prompt, evaluation, sample runs)다 → 확인 4.
- [A3] fallback과 자식 props에 `agents`가 중복 직렬화됐을 수 있다 → 확인 1.
- [A4] 클라이언트 JS 청크에 에이전트 데이터가 포함됐을 수 있다 → 확인 3.
- [A5] INP 처리 시간의 대부분은 문자열 검색이 아니라 React 렌더와 DOM 작업이다 → Performance 패널에서 해당 interaction의 call tree로 확인.
- [A6] BookmarkButton의 `getSnapshot` 구현 방식 (코드 미확인).
- [A7] 모바일 카드 높이 약 280px (R4의 intrinsic size 값).

모든 예상 효과는 위 가정에 기반한 범위이며, 측정으로만 확정됩니다.

## 리스크

- R1: 쿼리가 붙은 딥링크에서 필터 적용 전 목록이 잠깐 보입니다. 렌더 중 브라우저 API를 쓰는 코드가 있으면 hydration mismatch가 납니다.
- R2: 카드 필드 누락, 검색 결과 집합 변화 → 동등성 테스트로 방지합니다.
- R3: 결과 갱신이 입력보다 한 박자 늦습니다 (의도된 트레이드오프).
- R4: 스크롤바 튐, CLS 변화 → CLS 재측정 필수입니다.
- 공통: 로컬 측정과 배포 측정은 절대값이 다릅니다. 판정은 배포본 기준으로 합니다.

## 다음 액션 (이슈 분할 제안)

1. **[조사] 성능 기준선 확인 1–4 실행** (메인테이너, 30분). 결과에 따라 R5를 열지 결정하고, R2의 필드 목록을 확정합니다.
2. **[perf] R1: Suspense bailout 제거 + H1 서버 렌더**. LCP 목표의 핵심입니다. 가장 먼저 머지합니다.
3. **[perf] R2: AgentListItem으로 클라이언트 props 축소 + 검색 동등성 테스트**. 기여자에게 적합하며, 타입이 가이드 역할을 합니다.
4. **[perf] R3: useDeferredValue + AgentCard memo**. 작고 독립적이라 기여자 good first issue 후보입니다.
5. **[perf] R4: content-visibility**. R3 이후 INP가 200ms 근처에 남을 때 진행합니다.
6. **[perf] R5 / R6**: 확인 결과에 따라 엽니다.
7. 각 PR 설명에 위 기록 양식의 before/after 행을 첨부하는 것을 머지 조건으로 합니다.

R1+R2만으로 LCP와 TBT 목표 달성이 유력하고, INP는 R3(+R4)가 담당합니다. 1번 조사 결과가 가정과 다르게 나오면(예: LCP 원인이 폰트) R1의 우선순위를 폰트 대응으로 바꿔야 합니다.
