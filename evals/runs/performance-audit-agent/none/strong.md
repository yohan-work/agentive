# /agents 모바일 성능 감사 (Agent Archive)

## 요약

측정값을 보면 문제는 세 가지이고, 하나의 설계 결정에서 대부분 비롯됩니다. **에이전트 100개의 전체 객체를 클라이언트 컴포넌트 props로 넘기는 구조**입니다.

| 지표 (Mid-tier mobile) | 현재 | 목표 | 주 원인 (추정) |
|---|---|---|---|
| LCP | 3.8s | < 2.5s | H1이 Suspense 경계 안에 있어 클라이언트 렌더 이후에 다시 그려짐 + 1.14MB HTML |
| TBT | 1,420ms | < 600ms | 790KB RSC payload 파싱 + 카드 100개 클라이언트 렌더(640ms long task) + JS 312KB |
| INP | 280~340ms | < 200ms | 키 입력마다 동기 검색(100 × 긴 문자열 생성) + 결과 전체 재조정, 디바운스/지연 없음 |
| CLS | 0.02 | — | 문제 없음 |

가장 효과가 큰 변경 두 가지는 이렇습니다.
1. **`useSearchParams` + Suspense 구조를 없애기.** 서버가 만든 HTML을 버리고 클라이언트에서 다시 그리는 동작을 막고, H1을 서버 컴포넌트로 빼냅니다. (LCP, TBT)
2. **클라이언트로 가는 데이터를 카드에 필요한 필드와 검색 인덱스로 줄이기.** (HTML 크기, TBT)

그다음에 `useDeferredValue`와 미리 계산한 검색 문자열로 INP를 잡습니다. 새 의존성은 필요 없습니다.

> 아래 "원인"은 설명해 주신 구조와 수치에서 추론한 것이고, 코드와 트레이스를 직접 보지는 않았습니다. 그래서 각 항목에 **확인 방법**을 붙였고, 먼저 30분 정도 걸리는 사전 확인(§1)으로 가설을 검증하는 걸 권합니다.

---

## 1. 사전 확인 (가설 검증, 약 30분)

작업을 쪼개기 전에 아래 네 가지부터 확인하세요. 결과에 따라 우선순위가 바뀝니다.

**A. H1이 Suspense 경계 안에서 클라이언트 렌더 후 "새로" 그려지는가? (LCP 가설)**
- Performance 패널에서 LCP 마커 시점과 640ms long task가 끝나는 시점을 비교합니다. LCP가 long task 직후에 찍히면 확정입니다.
- 코드에서는 H1이 `AgentSearchPanel` 안에 있는지 확인합니다. 정적 export에서 `useSearchParams`를 쓰는 컴포넌트는 가장 가까운 `<Suspense>`까지 클라이언트 렌더로 빠집니다(CSR bailout). 그래서 빌드 HTML에는 fallback이 들어가고, 클라이언트에서는 fallback을 **hydrate하지 않고** 실제 컴포넌트를 새로 렌더해서 DOM을 교체합니다. 이때 생긴 새 H1 노드가 LCP 후보가 됩니다.

**B. 에이전트 데이터가 RSC payload에 몇 번 들어가는가?**
```bash
npm run build
F=out/ko/agents/index.html
wc -c "$F"
# 어떤 에이전트 프롬프트에만 있는 고유 문자열 하나로 등장 횟수 확인
grep -o '고유한_프롬프트_문구' "$F" | wc -l
```
fallback과 실제 컴포넌트가 둘 다 `agents`를 받으므로 중복 직렬화 여부를 봐야 합니다. 1회면 HTML 카드 텍스트와 payload에 각각 한 번씩 들어간 것이고, 2회 이상이면 중복입니다.

**C. 312KB(gzip) JS에 에이전트 데이터나 아이콘 전체가 들어가 있는가?**
- `src/data/generated/agents.ts`(또는 이를 import하는 모듈)를 `"use client"` 파일이 import하고 있는지 grep합니다. 예를 들어 BookmarkButton이나 클라이언트 유틸이 slug로 에이전트를 찾으려고 import하는 경우입니다. 그렇다면 428KB 소스가 JS 번들에도 들어가 **데이터가 3중으로** 전송됩니다.
  ```bash
  grep -rl '"use client"' src | xargs grep -l 'data/generated\|data/agents'
  ```
- lucide를 `import * as Icons` 형태로 쓰거나 이름 문자열로 아이콘을 동적으로 고르는 곳이 있는지도 봅니다. 그런 경우 아이콘 전체가 번들에 들어갑니다.
- 번들 구성은 Next 16의 번들 분석 기능(`next experimental-analyze`, 버전에 따라 다름)이나 `@next/bundle-analyzer`(devDependency 한정, 런타임 영향 없음)로 확인합니다.

**D. BookmarkButton의 `getSnapshot`이 매번 `localStorage`를 읽고 `JSON.parse`하는가?**
- 호출될 때마다 새 배열/객체를 반환하면 `useSyncExternalStore`가 매 렌더마다 변경으로 판단합니다. 그러면 불필요한 재렌더가 생기고, 심하면 경고나 루프로 이어집니다. 카드 100개면 렌더 1번에 `localStorage` 동기 읽기가 100번 일어납니다.
- `getServerSnapshot`과 클라이언트 첫 스냅샷이 다르면 hydration 직후 버튼 100개가 한꺼번에 재렌더됩니다.

---

## 2. 권고 사항

우선순위: **P0** = 목표 달성에 필수, **P1** = 목표 달성을 안정화, **P2** = 여유분 확보.

### P0-1. Suspense/`useSearchParams` 구조 제거, H1과 정적 영역을 서버 컴포넌트로 분리

- **증상 → 원인:** LCP 3.8s인데 FCP는 1.9s이고, LCP 요소는 텍스트 H1입니다. 텍스트 H1은 원래 FCP 무렵에 그려져야 합니다. 2초 가까운 차이는 H1이 클라이언트 렌더 후 교체되는 노드라는 뜻으로 보입니다(§1-A). 같은 구조 때문에 서버가 만든 카드 100개를 버리고 새로 그리며, 이것이 640ms long task의 주 후보입니다.
- **변경:**
  1. H1, 소개 문구 등 URL과 무관한 부분을 `page.tsx`(서버 컴포넌트)로 옮깁니다.
  2. 검색 패널에서 `useSearchParams`를 빼고, **기본 상태(필터 없음)로 렌더해서 서버 HTML과 그대로 hydrate**합니다. URL 쿼리는 마운트 후 `useEffect`에서 `window.location.search`를 읽어 `startTransition` 안에서 반영합니다. URL 갱신은 `history.replaceState`로 합니다.
  3. 그러면 `<Suspense fallback>` 이중 구조가 사라지고 `agents` 직렬화도 한 번으로 줄어듭니다.
- **예상 효과:** LCP가 FCP 근처(약 2.0s 안팎)로 내려올 것으로 봅니다. 640ms long task는 "전체 새 렌더"에서 "hydration"으로 바뀌며, hydration은 DOM 생성이 없어 보통 더 쌉니다(P0-2와 합치면 크게 감소). §1-B에서 중복이 확인되면 payload도 줄어듭니다.
- **검증:** Lighthouse 모바일 LCP, Performance 패널에서 LCP 마커 위치(long task 이전으로 이동했는지), "Recalculate style/Layout" 규모. 또 `?q=리뷰` 같은 쿼리가 붙은 URL을 열어 필터가 복원되는지 확인합니다(회귀 테스트).
- **리스크:** 쿼리 URL로 들어오면 필터되지 않은 목록이 잠깐 보인 뒤 필터됩니다. 공유 링크 유입이 적다면 괜찮고, 신경 쓰인다면 쿼리가 있을 때만 목록에 `opacity` 전환을 줍니다. hydration mismatch가 나지 않도록 첫 렌더에서는 `window`를 읽지 않아야 합니다.

### P0-2. 클라이언트로 가는 데이터 축소: 카드 필드 + 검색 인덱스만

- **증상 → 원인:** HTML 1.14MB 중 RSC payload가 약 790KB입니다. 카드에 보이지 않는 프롬프트 전문, evaluation, sample runs, realUseCases가 전부 props로 직렬화됩니다. 모바일에서는 이 문자열을 다운로드하고, 파싱하고, React 트리로 복원하는 비용이 TBT와 LCP 양쪽을 밀어 올립니다.
- **변경:**
  1. `page.tsx`에서 `toAgentCardData(agent)`처럼 카드 렌더에 실제로 쓰는 필드(slug, name, summary, 배지 4개, 태그 4개, 아이콘 키 등)만 뽑아서 넘깁니다. 타입을 `AgentCardData`로 분리하면 나중에 필드가 무심코 늘어나는 것도 막을 수 있습니다.
  2. 검색용 문자열은 **빌드 시점**(`npm run content`의 생성 단계)이나 서버 컴포넌트에서 미리 만듭니다. 에이전트마다 `searchText`(join + `toLowerCase` + 필요하면 NFC 정규화) 하나입니다.
  3. realUseCases처럼 긴 텍스트를 검색 대상에 계속 둔다면, 인덱스를 **별도 정적 JSON 파일**(`/search-index.<hash>.json`)로 빼고 검색창에 처음 focus할 때 `fetch`합니다. 로드 전에는 이름/요약/태그만으로 검색합니다. 정적 export에서 그대로 동작하고 서버도 필요 없습니다.
- **예상 효과:** 프롬프트와 evaluation이 데이터 대부분을 차지한다고 가정하면 payload가 790KB에서 100~200KB 수준으로 줄어들 것으로 추정합니다(실측 필요). HTML gzip도 186KB에서 대략 절반 이하로 줄어듭니다. TBT에서는 파싱과 복원 비용 수백 ms가 빠질 것으로 기대합니다.
- **검증:** `wc -c out/ko/agents/index.html`, `self.__next_f` 인라인 스크립트 총량(DevTools Elements 또는 빌드 파일에 스크립트 추출), Network 탭 document 전송 크기, Lighthouse TBT.
- **리스크:** 카드나 필터가 쓰는 필드를 빠뜨리면 런타임에서 `undefined`가 됩니다. 타입으로 강제하면 막을 수 있습니다. 검색 인덱스를 지연 로드하면 첫 검색 결과가 로드 전후로 달라질 수 있으니 UX 기준을 합의해야 합니다(예: 로드 중 표시).

### P0-3. 검색 입력 경로 가볍게: `useDeferredValue` + 미리 계산한 문자열

- **증상 → 원인:** 키 입력당 INP 280~340ms인데 데스크톱은 60ms입니다. CPU에 비례해 느려지는 동기 작업이라는 뜻입니다. 매 입력마다 (a) 100개 × 여러 필드 join/`toLowerCase`로 큰 문자열을 새로 만들고, (b) 결과 카드 전체와 칩 약 80개를 한 렌더에서 재조정하며, (c) 디바운스나 지연 처리가 없습니다.
- **변경:**
  1. `const deferredQuery = useDeferredValue(query)`를 쓰고, `results`는 `deferredQuery` 기준으로 계산합니다. 입력창은 즉시 갱신되고, 무거운 목록 렌더는 인터럽트 가능한 낮은 우선순위로 밀립니다. React 19 내장이라 의존성이 없습니다.
  2. 검색은 P0-2의 `searchText`에 `includes`만 수행합니다(매 입력마다 문자열을 생성하지 않음).
  3. `AgentCard`, 필터 칩 그룹을 `React.memo`로 감쌉니다. 필터 영역은 query가 바뀌어도 props가 같으면 재렌더되지 않게 상태 전달을 정리합니다(칩에 넘기는 콜백은 `useCallback`으로).
- **예상 효과:** INP의 입력 지연과 처리 부분이 입력창 갱신만 남으므로 4x CPU에서도 200ms 이하가 현실적입니다. 디바운스와 달리 체감 지연을 인위적으로 추가하지 않습니다.
- **검증:** Performance 패널(4x CPU)에서 "리뷰"를 빠르게 입력하며 Interactions 트랙의 INP 확인. 아래 §3 콘솔 스니펫으로 입력별 duration을 기록하고, 입력 전후 5회 중앙값을 비교합니다.
- **리스크:** 느린 기기에서 결과 목록이 입력보다 한 박자 늦게 따라옵니다. 이는 의도된 동작이고, 필요하면 `query !== deferredQuery`일 때 목록에 약한 흐림 처리를 줍니다.

### P1-1. 필터링 시 카드 마운트/언마운트 대신 `hidden` 토글

- **증상 → 원인:** 결과 배열로 `map`하면 필터가 바뀔 때마다 카드가 언마운트되거나 새로 마운트됩니다. 새로 마운트될 때마다 BookmarkButton 구독, lucide SVG 생성 등이 반복되고, INP와 필터 클릭 반응성을 해칩니다.
- **변경:** 카드 100개를 항상 렌더하고, 매칭 여부는 `visibleSlugs: Set`으로 계산해 `<li hidden={!visible.has(slug)}>`로 토글합니다. 카드 컴포넌트는 memo 상태를 유지하므로 재조정 비용이 속성 100개 변경 수준으로 떨어집니다. 부수 효과로 **JS 없이도 전체 카드 HTML이 항상 존재**해 SEO 요구도 충족됩니다.
- **예상 효과:** 필터와 검색 커밋 비용이 크게 감소합니다(카드 서브트리 재생성 제거). 결과 개수 0↔100 같은 큰 변화에서 특히 효과가 큽니다.
- **검증:** React DevTools Profiler에서 입력 1회당 commit duration과 렌더된 컴포넌트 수를 전후 비교합니다.
- **리스크:** DOM 노드 수는 그대로입니다(100개면 문제 없는 규모). 결과 수 표시나 "결과 없음" 상태는 `visibleSlugs.size`로 따로 계산해야 합니다.

### P1-2. BookmarkButton 저장소를 모듈 단일 store로

- **증상 → 원인:** §1-D가 확인되면, 카드 100개 × `localStorage` 동기 읽기 + `JSON.parse`가 렌더마다 반복되고, 스냅샷 불일치로 재렌더가 일어납니다.
- **변경:** `bookmarkStore.ts` 하나에 캐시한 스냅샷(`Set<string>`)과 listener 집합을 두고, `storage` 이벤트 리스너는 모듈 전체에 하나만 등록합니다. `getSnapshot`은 캐시된 참조를 반환하고, 쓰기 시에만 새 참조를 만듭니다. `getServerSnapshot`은 안정적인 빈 Set을 반환합니다. 버튼 단위로 구독하는 대신 `useIsBookmarked(slug)`가 boolean을 반환하게 하면, 한 카드의 북마크가 바뀌어도 해당 카드만 재렌더됩니다.
- **예상 효과:** hydration 후 추가 재렌더와 렌더당 스토리지 I/O가 제거됩니다. 규모는 §1-D 결과에 따라 달라집니다(수십 ms 단위로 예상).
- **검증:** Profiler에서 hydration 직후 commit 수, Performance 패널의 hydration 이후 추가 task.
- **리스크:** 다른 페이지(상세 페이지 등)도 같은 store를 쓰도록 맞춰야 동기화가 깨지지 않습니다.

### P1-3. JS 번들 정리 (§1-C 결과에 따라)

- **증상 → 원인:** 목록 페이지치고 JS 312KB(gzip)는 큽니다. 에이전트 데이터가 클라이언트 번들에 포함됐거나 아이콘을 전체 import하고 있을 가능성이 있습니다.
- **변경:** 클라이언트 모듈에서 generated 데이터 import를 제거합니다(필요한 값은 props로 받음). 아이콘은 `import { Star } from "lucide-react"` 같은 개별 import나 명시적 매핑 객체로 바꿉니다. 이 페이지에서만 쓰는 무거운 클라이언트 UI(모달 등)는 `next/dynamic`으로 지연 로드합니다.
- **예상 효과:** 데이터가 번들에 있다면 gzip 기준 100KB 이상 감소하고, 스크립트 평가 시간(TBT)도 함께 줄어듭니다.
- **검증:** 번들 분석 결과, Network 탭 JS 합계, Coverage 탭 미사용 바이트 비율.
- **리스크:** 낮습니다.

### P2-1. 오프스크린 카드 렌더 비용 줄이기: `content-visibility`

- **변경:** 카드 `li`에 `content-visibility: auto; contain-intrinsic-size: auto 220px;`(실제 카드 높이에 맞춤)를 적용합니다. Tailwind arbitrary property(`[content-visibility:auto]`)로 가능하고 의존성이 없습니다.
- **효과:** 초기 로드와 필터 변경 시 화면 밖 카드 약 90개의 layout/paint가 생략됩니다.
- **검증:** Performance 패널의 Layout/Paint 시간, CLS 유지(0.1 미만) 확인.
- **리스크:** intrinsic size가 부정확하면 스크롤바가 튀거나 CLS가 생길 수 있습니다. 브라우저 내 찾기(Ctrl+F)는 지원됩니다.

### P2-2. 필터 칩 80개 경량화

- **변경:** "도구" 그룹(49개)은 상위 약 10개만 보여 주고 나머지는 네이티브 `<details>`로 접습니다(JS 불필요). 칩 그룹 컴포넌트는 memo합니다.
- **효과:** 초기 DOM과 hydration 대상이 줄고, 모바일에서 첫 화면 스크롤 길이가 짧아집니다(UX 개선).
- **검증:** DOM 노드 수(Lighthouse "DOM size"), hydration long task 길이.
- **리스크:** 접힌 필터는 발견성이 떨어지므로 선택된 칩이 접힌 영역에 있으면 펼친 상태로 렌더합니다.

### 새 의존성에 대하여

위 권고는 모두 **의존성 없이** 가능합니다. 퍼지 검색 라이브러리(Fuse.js, MiniSearch 등)는 100개 규모에서는 `includes`로 충분하고 오히려 번들이 늘어나므로 권하지 않습니다. 예외로 `@next/bundle-analyzer`는 분석용 devDependency로만 고려할 만합니다(런타임 번들에 포함되지 않음).

---

## 3. 측정 및 검증 프로토콜

변경 효과를 비교하려면 조건을 고정해야 합니다.

- **환경:** 9/27 측정과 동일하게 배포본, `/ko/agents`, Chrome DevTools "Mid-tier mobile"(4x CPU, Fast 4G), 캐시 비움, 시크릿 창(확장 프로그램 제외).
- **반복:** Lighthouse 모바일 5회, **중앙값**을 기록합니다(1회 측정은 편차가 큼). CLI를 쓴다면 `npx lighthouse <url> --preset=perf --form-factor=mobile --output=json` 5회.
- **기록할 값:** HTML 전송/해제 크기, `self.__next_f` 합계, JS gzip 합계, FCP, LCP(와 LCP 요소), TBT, 가장 긴 task, INP(아래 스니펫), Lighthouse 점수, 커밋 SHA.
- **INP 측정 스니펫** (콘솔에 붙여 넣은 뒤 "리뷰"를 빠르게 입력, 의존성 없음):
  ```js
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.interactionId) console.log(e.name, Math.round(e.duration), "ms",
        "input delay", Math.round(e.processingStart - e.startTime),
        "processing", Math.round(e.processingEnd - e.processingStart));
    }
  }).observe({ type: "event", durationThreshold: 16, buffered: true });
  ```
  input delay, processing, presentation을 나눠 보면 어느 권고가 효과를 냈는지 구분할 수 있습니다.
- **실사용 확인(선택):** 실제 모바일 기기(중저가 Android)에서 Chrome remote debugging으로 한 번 더 측정합니다. DevTools 스로틀링은 실기기의 근사치일 뿐입니다.
- **회귀 방지(선택):** CI에 `out/ko/agents/index.html` 크기 상한 체크(예: 400KB)를 추가하면, 나중에 누군가 전체 객체를 다시 props로 넘길 때 바로 잡힙니다. 기존 `check:data` 스크립트 옆에 작은 스크립트로 충분합니다.

---

## 4. 가정

- 790KB payload의 대부분은 카드에 표시되지 않는 필드(프롬프트, evaluation, sample runs, realUseCases)라고 가정했습니다. 필드별 크기는 확인하지 않았습니다.
- 640ms long task는 Suspense 경계의 클라이언트 전체 렌더라고 추정했습니다(§1-A로 검증).
- H1이 `AgentSearchPanel` 안에 있다고 가정했습니다. 밖에 있다면 LCP 지연의 원인은 폰트 로딩(`font-display`)이나 렌더 차단 CSS/JS일 수 있으니 Performance 패널의 LCP 세부 단계(TTFB / load delay / render delay)를 확인해야 합니다.
- GitHub Pages는 gzip만 제공하고(brotli 없음) 캐시 헤더를 제어할 수 없으므로, 전송량 절감은 콘텐츠 자체를 줄이는 방법뿐이라고 전제했습니다.
- 에이전트 수는 당분간 100개 수준이라고 가정했습니다. 수백 개 이상으로 늘면 서버 HTML 페이지네이션(정적 `/agents/page/2`)과 가상화를 다시 검토해야 합니다.

## 5. 리스크

- **URL 상태 복원 동작 변경(P0-1):** 쿼리 URL로 진입하면 잠깐 필터 전 목록이 보입니다. 기존 공유 링크 동작을 회귀 테스트해야 합니다.
- **hydration mismatch:** 첫 렌더에서 `window`나 `localStorage`를 읽는 코드가 남아 있으면 경고가 나고, 오히려 전체 재렌더가 일어납니다. 콘솔 경고 0을 완료 기준에 넣으세요.
- **검색 결과 변화(P0-2):** 인덱스를 지연 로드하거나 검색 필드 구성을 바꾸면 결과가 달라질 수 있습니다. 대표 쿼리 몇 개("리뷰", 영어 태그 등)로 전후 결과를 비교하는 단위 테스트를 추가하는 것을 권합니다.
- **효과 추정치의 불확실성:** 수치는 추정입니다. P0 세 가지를 적용한 뒤 재측정해서 P1/P2 진행 여부를 결정하세요.

## 6. 다음 액션 (이슈 분할 제안)

| # | 이슈 | 우선순위 | 의존성 | 완료 기준 |
|---|---|---|---|---|
| 1 | 사전 확인 §1 A~D 결과 기록 | P0 | — | 4개 항목 결과를 이슈에 코멘트 |
| 2 | H1 서버 분리 + `useSearchParams`/Suspense 제거, URL 상태는 effect에서 복원 | P0 | 1 | LCP 마커가 hydration 이전, 쿼리 URL 복원 동작 |
| 3 | `AgentCardData` 도입, 전체 객체 props 제거, 검색 텍스트 빌드 시 생성 | P0 | 1 | payload 200KB 이하(목표치, 실측 후 조정) |
| 4 | `useDeferredValue` + memo 적용 | P0 | 3 | 4x CPU INP < 200ms |
| 5 | 카드 `hidden` 토글 방식 전환 | P1 | 4 | Profiler commit 시간 감소, JS 없이 카드 100개 HTML 존재 |
| 6 | Bookmark 단일 store | P1 | 1-D | hydration 후 추가 commit 없음 |
| 7 | 클라이언트 번들 정리 | P1 | 1-C | JS gzip 합계 감소 수치 기록 |
| 8 | `content-visibility`, 도구 칩 접기 | P2 | 2~5 | CLS < 0.1 유지 |
| 9 | CI에 HTML 크기 상한 체크 | P2 | 3 | 상한 초과 시 CI 실패 |

권장 순서는 **1 → 2·3(병렬 가능) → 4 → 재측정**입니다. 재측정에서 LCP < 2.5s, TBT < 600ms, INP < 200ms를 달성하면 5~9는 여유분 확보용으로 천천히 진행해도 됩니다.
