# /agents 모바일 성능 감사 (Agent Archive)

## 1. 요약

모바일 지연은 대부분 한 가지 원인에서 나옵니다. **에이전트 100개 전체 객체가 클라이언트 컴포넌트 props로 넘어가고, 클라이언트가 그 데이터로 목록 전체를 다시 렌더한다**는 점입니다. 이 한 가지가 세 목표 지표에 모두 걸려 있습니다.

| 지표 | 현재 (Mid-tier mobile) | 목표 | 주 원인 (추정) |
|---|---|---|---|
| LCP | 3.8s (H1) | < 2.5s | 1.14MB HTML(RSC 790KB) 파싱, 하이드레이션 long task로 생긴 렌더 지연. H1이 클라이언트 재렌더 영역 안에 있을 가능성 |
| TBT | 1,420ms | < 600ms | 790KB RSC payload 역직렬화, 카드 100개와 칩 80개 하이드레이션/재렌더(640ms long task) |
| INP | 280~340ms | < 200ms | 키 입력마다 100개 × 긴 문자열 join/toLowerCase, 디바운스·우선순위 분리 없음, 카드 전체 재렌더 |

데스크톱이 괜찮은 이유는 CPU 여유가 있어서 같은 작업이 짧게 끝나기 때문입니다. 네트워크보다 **메인 스레드 작업량**이 문제라는 신호입니다.

우선순위(효과 대비 작업량 순):
1. **P0-1** 클라이언트 props를 카드용 최소 데이터로 줄이기. 검색 텍스트는 빌드 시 미리 만들고 지연 로드
2. **P0-2** Suspense fallback이 버려지고 클라이언트에서 전체가 다시 렌더되는지 확인하고 제거
3. **P0-3** 검색 입력 경로 최적화(`useDeferredValue` + 사전 계산 인덱스 + `React.memo`)
4. **P1** 카드 단위 비용 줄이기(BookmarkButton 스토어, `content-visibility`), LCP 요소 점검
5. **P2** JS 312KB 구성 분석(에이전트 데이터나 사전이 번들에 이중으로 들어갔는지)

새 의존성 없이 모두 가능합니다. 분석용 devDependency 하나만 선택 사항입니다.

---

## 2. 가정과 확인 필요 사항

받은 정보만으로 감사를 진행했습니다. 아래 항목은 결론에 영향을 주므로 작업 전에 확인해 주세요. 막히는 항목은 없습니다.

- **A1.** H1이 `page.tsx`(서버 컴포넌트)에 있는지, 아니면 `AgentSearchPanel` 안(Suspense 경계 안)에 있는지 모릅니다. LCP 원인 분석이 이 답에 따라 갈립니다(→ R6).
- **A2.** 웹 폰트를 쓰는지, 쓴다면 `font-display` 값을 모릅니다(`next/font` 기본값은 `swap`).
- **A3.** 어떤 클라이언트 컴포넌트(BookmarkButton, 검색 유틸 등)가 `src/data/generated/agents.ts`를 직접 import하는지 모릅니다. import한다면 428KB 소스가 JS 번들에도 들어가 **이중 전송**됩니다(→ R8).
- **A4.** BookmarkButton의 `getSnapshot`이 호출마다 `localStorage`를 읽고 `JSON.parse`하는지, 캐시된 값을 돌려주는지 모릅니다.
- **A5.** 필터 칩에 "결과 개수" 같은 파생 값이 있고, 이를 키 입력마다 다시 계산하는지 모릅니다.
- **A6.** 측정은 1회 값으로 봤습니다. 이후 비교는 5회 측정 중앙값을 기준으로 삼는 것을 권합니다.
- **A7.** 에이전트 수는 계속 늘어난다고 가정했습니다. 지금 구조는 에이전트 수에 선형으로 느려집니다.

---

## 3. 증상과 원인 연결

### 3.1 HTML 1.14MB, 그중 RSC payload 790KB
- 서버 컴포넌트가 클라이언트 컴포넌트에 넘긴 props는 `self.__next_f` 인라인 스크립트로 HTML에 직렬화됩니다. 프롬프트, 설명, realUseCases, evaluation, sample runs까지 **목록 화면에 쓰지 않는 필드가 전부** 들어갑니다.
- 같은 데이터가 fallback으로 렌더된 카드 HTML에도 한 번 더 들어 있습니다. 카드에 보이는 부분은 HTML과 RSC에 중복됩니다.
- 파서는 이 스크립트를 모두 받아 실행해야 하고, React는 하이드레이션 전에 이를 역직렬화합니다. 4x CPU에서 이 작업은 수백 ms 단위가 됩니다.
- 클라이언트 내비게이션용 `.txt` RSC 파일도 같은 이유로 큽니다(정적 export 산출물).

### 3.2 Hydration long task 640ms, TBT 1,420ms
- `useSearchParams`를 쓰는 컴포넌트를 Suspense로 감싸면, 정적 export에서는 그 경계가 **클라이언트 렌더로 넘어갑니다**. 빌드 HTML에는 fallback(`AgentSearchPanel`)이 들어가고, 브라우저에서 `AgentSearchPanelFromUrl`이 **처음부터 다시 렌더된 뒤 fallback DOM을 교체**합니다. 이 경우 카드 100개, 칩 80개, 아이콘 300개, BookmarkButton 100개를 하이드레이션이 아니라 **새로 만들고**, 레이아웃과 페인트도 다시 합니다.
- 이게 맞다면 640ms long task와 TBT의 대부분이 설명됩니다. 확인 방법은 R2에 있습니다.

### 3.3 INP 280~340ms
- 키 입력 1회당 작업:
  1. 100개 에이전트마다 여러 필드를 join하고 toLowerCase(긴 한국어 사용 사례 포함) → 큰 문자열을 매번 새로 만들고 GC 부담
  2. 결과가 바뀌면 AgentGrid 전체 재렌더. 카드가 memo되어 있지 않으면 남아 있는 카드도 전부 다시 렌더
  3. 입력 필드 업데이트와 결과 렌더가 같은 우선순위라, 결과 렌더가 끝날 때까지 다음 입력 페인트가 밀림
- **한국어 IME 영향:** "리뷰"를 입력하면 조합 중간 상태(ㄹ → 리 → 립 → 리뷰 …)마다 onChange가 발생할 수 있습니다. 글자 수보다 검색 횟수가 많아 한국어 입력에서 특히 나쁘게 나옵니다.

### 3.4 LCP 3.8s (H1), FCP 1.9s
- 텍스트 요소인 H1이 FCP보다 1.9초 늦게 LCP로 잡힌다는 것은, 전송이 아니라 **렌더 지연(element render delay)** 문제일 가능성이 큽니다. 후보 원인:
  - (a) H1이 Suspense 경계 안에 있어서, 클라이언트 렌더가 끝난 뒤 교체된 DOM의 H1이 LCP로 기록됨(A1)
  - (b) 긴 메인 스레드 작업(RSC 파싱, 하이드레이션) 때문에 페인트가 밀림
  - (c) 웹 폰트 block 기간 동안 텍스트 페인트가 지연됨(A2)
- (a)와 (b)는 P0-1, P0-2로 함께 해결됩니다. (c)는 별도 확인이 필요합니다.

---

## 4. 권고 사항

각 권고에 **증상 → 원인 → 조치 → 예상 효과 → 검증** 순서로 적었습니다. 예상 효과는 받은 측정값을 바탕으로 한 추정치이며, 실제 값은 재측정으로 확정해야 합니다.

### R1 (P0). 클라이언트 props를 카드용 최소 데이터로 줄이기
- **증상:** HTML 1.14MB, RSC 790KB, 하이드레이션 640ms
- **원인:** 목록에 쓰지 않는 필드까지 전부 직렬화됨
- **조치:**
  1. 카드와 필터에 필요한 필드만 담은 타입을 정의합니다. 예:
     ```ts
     // src/types/agent.ts
     export type AgentCardData = Pick<Agent,
       "slug" | "name" | "summary" | "verifiedStatus" /* 배지·필터에 쓰는 필드만 */
     > & { tags: string[]; roles: string[]; tools: string[] };
     ```
  2. `page.tsx`에서 `agents.map(toCardData)`로 변환한 뒤 넘깁니다. 태그는 카드에 보이는 4개가 아니라 필터에 필요한 만큼만 넘깁니다.
  3. **검색 인덱스는 분리합니다.** `npm run content` 단계에서 에이전트별로 소문자로 정규화된 `searchText`(name/summary/description/tags/roles/tools/realUseCases)를 미리 만들어 `public/search-index.<locale>.json` 같은 정적 파일로 출력합니다. 클라이언트는 검색창에 **포커스하거나 첫 입력이 있을 때** 이 파일을 fetch합니다. 로드 전에는 카드 데이터(name/summary/tags)만으로 검색합니다.
     - 정적 파일 fetch이므로 "서버 API 없음", "클라이언트 검색" 제약을 모두 지킵니다.
     - 파일은 빌드 산출물로만 만들고, `src/data/generated/`처럼 직접 편집하지 않는 영역에 둡니다.
- **예상 효과(추정):** RSC payload 790KB → 수십~100KB대. HTML gzip 186KB → 절반 이하. 하이드레이션 long task의 역직렬화 부분이 크게 줄고, TBT가 수백 ms 줄어듭니다. 에이전트가 늘어나도 초기 비용이 거의 늘지 않습니다.
- **검증:**
  - HTML 전송/해제 크기(Network 패널, 문서 요청)
  - RSC 인라인 크기: 콘솔에서
    ```js
    [...document.scripts].filter(s => s.textContent.includes("self.__next_f"))
      .reduce((n, s) => n + s.textContent.length, 0)
    ```
  - Performance 패널에서 하이드레이션 long task 길이, TBT
  - **검색 결과 동일성:** 기존 `searchAgents` 결과와 새 인덱스 기반 결과가 같은지 대표 쿼리 20개 정도로 비교하는 단위 테스트

### R2 (P0). Suspense 클라이언트 렌더 bailout 제거
- **증상:** 640ms long task, LCP 렌더 지연 가능성
- **원인(확인 필요):** `useSearchParams` 때문에 경계 전체가 클라이언트에서 다시 렌더되고 fallback DOM이 교체됨
- **먼저 확인:**
  - 배포 HTML에서 `BAILOUT_TO_CLIENT_SIDE_RENDERING` 문자열을 찾습니다(Next가 이 경우 경계에 남기는 표식).
  - Performance 패널에서 하이드레이션 구간에 대량의 DOM 삽입/레이아웃이 있는지, 또는 Elements 패널에서 카드 노드에 표시를 붙여 두고 로드 후 같은 노드가 유지되는지 봅니다.
- **조치:** 서버 HTML과 클라이언트 첫 렌더가 **같은 트리**가 되게 합니다.
  - `AgentSearchPanel`을 Suspense 없이 직접 렌더하고, 초기 상태는 "필터 없음"으로 둡니다(서버 HTML과 일치 → 정상 하이드레이션).
  - URL 쿼리는 마운트 후 `useEffect`에서 `window.location.search`를 읽어 상태에 반영합니다. 쿼리가 없으면(대부분의 방문) 추가 렌더가 없습니다.
  - 상태가 바뀔 때 URL을 동기화하려면 `history.replaceState`를 씁니다.
- **예상 효과(추정):** bailout이 맞다면 하이드레이션 long task가 크게 줄고, R1과 합쳐 TBT 목표(< 600ms) 안으로 들어갈 가능성이 높습니다. H1이 경계 안에 있다면 LCP도 직접 개선됩니다.
- **검증:** 위 문자열이 HTML에서 사라졌는지, long task 길이, TBT, LCP, `?q=리뷰` 같은 공유 URL로 접속했을 때 필터가 제대로 적용되는지(수동 확인)

### R3 (P0). 검색 입력 경로 최적화
- **증상:** INP 280~340ms
- **원인:** 키 입력마다 무거운 문자열 생성과 전체 목록 렌더를 동기로 처리
- **조치(모두 React 내장 기능, 새 의존성 없음):**
  1. R1의 사전 계산 `searchText`를 쓰고, 쿼리만 한 번 소문자로 바꿔 `includes`합니다. 키 입력마다 새로 만드는 문자열이 100개에서 1개로 줄어듭니다.
  2. 결과 계산을 `useDeferredValue(query)`에 연결합니다. 입력 필드는 즉시 업데이트되고, 결과 렌더는 낮은 우선순위로 처리되어 다음 입력에 양보합니다.
     ```tsx
     const deferredQuery = useDeferredValue(query);
     const results = useMemo(
       () => filterAgents(search(index, deferredQuery), filters),
       [index, deferredQuery, filters],
     );
     ```
  3. `AgentCard`를 `React.memo`로 감싸고 props를 안정적으로 유지합니다(에이전트 객체 참조를 그대로 넘기고, 인라인 객체/함수 props는 피함). 필터가 바뀌어도 남아 있는 카드는 다시 렌더되지 않습니다.
  4. 필터 칩 영역도 query에 의존하지 않도록 분리하고 memo합니다. 칩별 개수를 계산한다면(A5) 쿼리와 무관한 부분은 한 번만 계산합니다.
  5. 디바운스는 1~3번을 적용한 뒤에도 목표를 못 맞출 때만 추가합니다(예: 100~150ms). `useDeferredValue`가 체감 반응성 면에서 더 낫습니다.
- **예상 효과(추정):** 입력 처리 자체는 수십 ms 수준으로 줄어 INP < 200ms 목표 달성 가능성이 높습니다.
- **검증:** Performance 패널(4x CPU)에서 **한국어 IME로** "리뷰", "코드 리뷰"를 빠르게 입력하고 Interactions 트랙의 각 상호작용 시간(입력 지연, 처리, 표시 지연)을 확인합니다. 영문 입력("review")도 따로 잽니다. 5회 반복 중 최악값을 기록합니다.

### R4 (P1). 카드 단위 비용 줄이기
- **증상:** 하이드레이션 비용, 필터 변경 시 렌더 비용
- **원인:** 카드 100개 × (배지 4, 태그 4, 아이콘 3, 스토어를 구독하는 BookmarkButton 1)
- **조치:**
  1. **BookmarkButton 스토어:** 모듈 수준 스토어 하나가 파싱된 북마크 `Set`을 캐시하고, `storage` 이벤트나 쓰기 때만 갱신합니다. `getSnapshot`은 같은 참조를 반환해야 합니다(매번 새 객체를 반환하면 불필요한 재렌더가 생기고, 매번 `JSON.parse`하면 100배로 비쌉니다). 카드에는 `isBookmarked` boolean만 내려주는 방식도 고려합니다.
  2. **lucide 아이콘:** 개별 named import(`import { Star } from "lucide-react"`)만 쓰는지 확인합니다. `icons` 객체나 동적 이름 조회는 아이콘 전체를 번들에 넣습니다.
  3. **CSS `content-visibility: auto`** + `contain-intrinsic-size`를 카드에 적용합니다. 화면 밖 카드의 스타일/레이아웃/페인트를 건너뛰어 초기 렌더와 필터 변경 비용이 줄어듭니다. HTML은 그대로라 SEO에 영향이 없습니다.
     ```css
     .agent-card { content-visibility: auto; contain-intrinsic-size: auto 220px; }
     ```
- **예상 효과(추정):** 하이드레이션과 렌더 시간이 추가로 줄어듭니다. R1~R3보다 효과는 작지만 작업량도 작습니다.
- **검증:** Performance 패널의 Rendering/Painting 시간, 하이드레이션 long task. **CLS가 0.1을 넘지 않는지 확인하고**(현재 0.02), 스크롤바 튐도 수동으로 확인합니다.

### R5 (P1). SEO 요구와 렌더 비용 분리 원칙
- **제약:** JS 없이도 카드 목록 HTML이 있어야 하므로 **초기 HTML에서 카드를 빼는 페이지네이션이나 가상화는 쓰지 않습니다.**
- **권고:** 100개 전부를 정적 HTML로 유지하되, 클라이언트 비용은 R1~R4로 줄입니다. 에이전트 수가 수백 개로 늘어나면 다음 단계를 검토합니다.
  - 카드는 서버 컴포넌트로만 렌더하고, 클라이언트는 매칭된 slug 집합만 계산해 CSS나 `hidden` 속성으로 보이기/숨기기만 하는 구조(카드 React 렌더 비용이 0에 가까워짐). 대신 구현이 덜 관용적이고, 정렬이나 결과 순서 변경이 어려워집니다.
- **검증:** JS를 끈 상태로 `/ko/agents`, `/en/agents`를 열어 카드 100개가 모두 보이는지 확인합니다(모든 변경 후 필수).

### R6 (P1). LCP 요소(H1) 점검
- **증상:** FCP 1.9s와 LCP 3.8s 사이의 1.9초 차이
- **조치:**
  1. Performance 패널의 LCP 항목에서 단계별 시간(TTFB, 리소스 로드 지연, 리소스 로드 시간, **요소 렌더 지연**)을 확인합니다. 텍스트 요소라면 렌더 지연이 대부분일 것으로 예상합니다.
  2. H1이 Suspense 경계 안에 있다면(A1) `page.tsx`로 옮겨 경계 밖, 서버 HTML의 앞쪽에서 바로 페인트되게 합니다.
  3. 웹 폰트를 쓴다면(A2) `font-display: swap` 또는 `optional`인지, 필요한 폰트만 preload하는지 확인합니다. 한국어 폰트는 파일이 크므로 시스템 폰트 폴백 전략을 고려합니다.
- **예상 효과(추정):** R1, R2와 합쳐 LCP < 2.5s 달성 가능성이 높습니다. FCP 1.9s가 하한에 가깝습니다.
- **검증:** LCP 요소와 LCP 단계별 시간, 5회 중앙값

### R7 (P2). FCP 개선 여지
- HTML이 R1로 작아지면 전송과 파싱 시간이 줄어 FCP도 일부 개선됩니다.
- GitHub Pages는 캐시 헤더나 압축 방식을 바꿀 수 없으므로, **보내는 바이트를 줄이는 것이 사실상 유일한 네트워크 쪽 레버**입니다.
- **검증:** FCP, 문서 요청의 전송 시간

### R8 (P2). JS 312KB(gzip) 구성 분석
- **증상:** 정적 목록 페이지치고 JS가 큼. 파싱과 실행 시간이 TBT에 더해짐
- **확인할 것:**
  1. 에이전트 데이터가 JS 청크에 들어 있는지(A3): 빌드 산출물 `out/_next/static/chunks/`에서 특정 에이전트 프롬프트 문구를 grep합니다. 있다면 import 경로를 끊고, 필요한 데이터는 props나 R1의 인덱스로 받습니다.
  2. i18n 사전: `dictionaries.ts`의 en과 ko 전체가 클라이언트 번들에 들어가는지 확인합니다. 클라이언트 컴포넌트에는 해당 locale의 필요한 키만 props로 넘기는 방식을 권합니다.
  3. lucide 아이콘 트리 셰이킹(R4-2)
- **도구:** 청크 grep과 Coverage 패널(사용되지 않는 JS 비율)로 충분합니다. 더 자세히 보려면 `@next/bundle-analyzer`를 **devDependency로만** 추가할 수 있습니다(런타임 번들에 포함되지 않음, 분석 전용). 추가 여부는 선택입니다.
- **예상 효과:** 이중 포함이 발견되면 수십~수백 KB 절감, 없으면 소폭
- **검증:** Network 패널 JS 합계(gzip), Coverage 패널 미사용 비율, TBT

---

## 5. 리스크

| 리스크 | 영향 | 대응 |
|---|---|---|
| 카드 데이터 타입과 실제 카드 사용 필드가 어긋남 | 카드 표시 누락 | `AgentCardData`를 `Pick`으로 정의해 타입 체크로 잡음. `typecheck` 필수 |
| 검색 결과가 기존과 달라짐(인덱스 정규화 차이) | 사용자가 찾던 에이전트가 안 나옴 | 기존 함수와 새 인덱스 결과를 비교하는 단위 테스트 |
| 검색 인덱스 fetch 실패나 지연 | 사용 사례 텍스트 검색 불가 | 로드 전과 실패 시 카드 데이터로 검색하는 폴백, 파일명에 해시나 버전을 붙여 GitHub Pages 캐시(짧은 max-age) 문제 회피 |
| R2 이후 쿼리가 있는 URL로 접속하면 필터 적용 전 목록이 잠깐 보임 | 약간의 시각적 깜빡임 | 쿼리가 있을 때만 발생하고 대부분의 방문에는 없음. 필요하면 결과 영역만 짧게 흐리게 처리 |
| 하이드레이션 불일치 | 콘솔 경고, 재렌더 | 서버와 클라이언트 첫 렌더를 동일하게 유지하고, URL과 localStorage 값은 마운트 후에만 반영 |
| `content-visibility`로 인한 스크롤 위치 튐, 앵커 이동 오차 | 경미한 UX 저하 | `contain-intrinsic-size: auto <추정 높이>` 사용, CLS 재측정 |
| 에이전트 수 증가 | 개선 효과가 다시 줄어듦 | R1 구조는 초기 비용이 거의 일정. 수백 개 수준이 되면 R5의 대안 구조 검토 |
| 1회 측정값 기준 판단 | 개선 폭을 과대나 과소 평가 | 기준선 재측정(5회 중앙값) 후 작업 시작 |

---

## 6. 측정 프로토콜(모든 이슈 공통)

- **조건:** 배포본(또는 `npm run build` 후 정적 서버로 연 `out/`), Chrome DevTools "Mid-tier mobile"(4x CPU, Fast 4G), 캐시 비움, `/ko/agents`와 `/en/agents` 모두
- **반복:** 각 5회, 중앙값 기록(INP는 최악값도 함께)
- **기록 지표:** HTML 전송/해제 크기, RSC 인라인 크기(3절 스니펫), JS 합계(gzip), FCP, LCP(요소, 단계별), TBT, 가장 긴 long task, CLS, INP(한국어 IME "리뷰", 영문 "review")
- **보조:** Lighthouse 모바일(`npx lighthouse <url> --view`, 설치 불필요) 점수는 참고용. 판단은 위 지표로 합니다
- **회귀 확인:** JS 끈 상태에서 카드 100개 HTML 존재, 북마크 동작, 쿼리 URL 공유 동작
- 각 PR 설명에 before/after 표를 붙이면 리뷰가 쉬워집니다

---

## 7. 다음 액션(GitHub 이슈 분할안)

순서대로 진행하는 것을 권합니다. 괄호 안은 선행 이슈입니다.

1. **perf: /agents 성능 기준선 측정 및 가정 확인** — 6절 프로토콜로 5회 측정, A1~A5 확인(H1 위치, 폰트, 데이터 import 경로, getSnapshot, 칩 개수 계산), bailout 표식 확인
2. **perf: 클라이언트 props를 카드 데이터로 축소** (1) — R1의 1~2단계. 이것만으로도 RSC 크기 변화가 가장 크게 보일 것
3. **perf: 빌드 시 검색 인덱스 생성 및 지연 로드** (2) — R1의 3단계, 결과 동일성 테스트 포함
4. **perf: Suspense 클라이언트 렌더 bailout 제거** (1) — R2. 2와 병행 가능
5. **perf: 검색 입력 반응성(useDeferredValue, memo)** (3) — R3
6. **perf: 카드 렌더 비용 축소(BookmarkButton 스토어, content-visibility, 아이콘 import)** (4) — R4
7. **perf: LCP H1 렌더 지연 점검** (4) — R6. 2와 4가 끝난 뒤 남은 지연만 다룸
8. **perf: JS 번들 구성 분석** (1) — R8. 이중 포함이 발견되면 별도 수정 이슈로 분리
9. **chore: 성능 회귀 방지** (2~6 완료 후) — 측정 결과를 문서로 남기고, 필요하면 CI에 HTML 크기나 RSC 크기 상한 체크를 추가(`scripts/`에 간단한 스크립트, 새 의존성 없음)

**완료 기준:** Mid-tier mobile 5회 중앙값 기준 LCP < 2.5s, TBT < 600ms, 한국어 IME 입력 INP < 200ms, JS 없이 카드 100개 HTML 유지

2~5번이 끝나면 한 번 재측정해 보세요. 그 시점에 목표를 달성했다면 6~8번은 우선순위를 낮춰도 됩니다.
