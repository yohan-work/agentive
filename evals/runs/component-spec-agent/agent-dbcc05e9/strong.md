# FilterChipGroup 컴포넌트 스펙

> 대상: 디자인 + 프론트엔드 공용
> 위치: `src/components/common/filter-chip-group.tsx`
> 대체 대상: `agent-search-panel.tsx` 내부의 `FilterRow`

주신 정보로 스펙을 쓰는 데는 충분해서 추가 질문 없이 진행했습니다. 판단이 필요했던 부분은 **가정**에 적었고, 컴포넌트가 아니라 페이지 쪽에서 정해야 하는 두 가지는 맨 끝 **열린 질문**에 모았습니다. 작업을 막는 질문은 아닙니다.

---

## 1. 요약: 핵심 결정

| 항목 | 결정 |
|---|---|
| 선택 모델 | **제어 컴포넌트**. `selectionMode: "single" \| "multiple"`. 토글(같은 값 다시 누르면 해제)은 컴포넌트가 처리하고, 부모는 결과값만 받습니다. |
| 시맨틱 | 칩은 `<button aria-pressed>` 토글 버튼입니다. 단일 선택이어도 `radiogroup`은 쓰지 않습니다. 라디오는 해제가 불가능하고, 화살표를 누르면 곧바로 선택되어 필터가 연달아 바뀌기 때문입니다. |
| 키보드 | **그룹당 Tab 정지점 1개와 화살표 이동(roving tabindex)**. 컨테이너는 `role="toolbar"`와 `aria-labelledby`로 둡니다. 도구 49개와 6개 그룹이면 Tab 정지점이 약 80개가 되므로 칩마다 Tab을 받는 방식은 제외했습니다. |
| 선택 표시 | 색 외에 **체크 아이콘과 테두리 강조**를 추가해서 색에만 의존하지 않게 합니다. |
| 터치 타깃 | 칩 높이를 모바일 36px(`h-9`), `sm` 이상 32px(`h-8`)로 하고, 간격 8px를 유지합니다. WCAG 2.5.8(AA, 24px)을 여유 있게 충족합니다. |
| 긴 목록 | `collapseAfter` prop으로 접습니다. **선택된 칩은 접혀도 항상 보입니다.** 숨길 칩이 2개 이하이면 접지 않습니다. |
| 문자열 | 컴포넌트는 dictionaries를 직접 import하지 않고, `messages` prop으로 주입받습니다. |
| 의존성 | 추가하지 않습니다. 체크 아이콘은 인라인 SVG, roving tabindex는 직접 구현합니다. |

---

## 2. Props (TypeScript)

```ts
"use client";

export type FilterChipOption<V extends string = string> = {
  value: V;
  /** 이미 번역된 표시 문자열 */
  label: string;
  /** showCounts가 true일 때 배지로 표시 */
  count?: number;
  /** 선택 불가. 포커스는 가능(aria-disabled) */
  disabled?: boolean;
};

export type FilterChipGroupMessages = {
  /** 예: "{count}개 더 보기" / "Show {count} more" */
  showMore: string;
  /** 예: "접기" / "Show less" */
  showLess: string;
  /** 스크린 리더용 개수 문구. 예: "{count}개" / "{count} results" */
  countLabel?: string;
};

type FilterChipGroupBaseProps<V extends string> = {
  /** 그룹 제목 (번역된 문자열). 버튼 그룹의 접근 가능한 이름이 됨 */
  title: string;
  options: readonly FilterChipOption<V>[];
  /** 이 개수를 넘으면 접기. 미지정 시 접지 않음 */
  collapseAfter?: number;
  /** 개수 배지 표시 여부. 기본 false */
  showCounts?: boolean;
  /** count === 0이고 선택되지 않은 옵션을 비활성 처리. 기본 false */
  disableEmpty?: boolean;
  messages: FilterChipGroupMessages;
  /** 제목 요소 태그. 페이지의 헤딩 구조에 맞춰 선택. 기본 "p" */
  titleAs?: "p" | "h2" | "h3" | "h4";
  /** 제목을 시각적으로 숨김(접근성 이름은 유지) */
  hideTitle?: boolean;
  className?: string;
};

type SingleSelectProps<V extends string> = {
  selectionMode?: "single";
  value: V | undefined;
  onValueChange: (next: V | undefined) => void;
};

type MultipleSelectProps<V extends string> = {
  selectionMode: "multiple";
  value: readonly V[];
  onValueChange: (next: V[]) => void;
};

export type FilterChipGroupProps<V extends string = string> =
  FilterChipGroupBaseProps<V> & (SingleSelectProps<V> | MultipleSelectProps<V>);
```

**설계 메모**

- `values: string[]`와 `label()` 대신 `options` 객체 배열을 받습니다. count와 disabled를 옵션 단위로 붙여야 하고, 라벨 번역은 호출하는 쪽에서 끝내는 편이 i18n 흐름에 맞습니다.
- 단일 선택에서 `value`는 기존 `active?: string`과 맞춰 `undefined`로 "선택 없음"을 표현합니다.
- 토글 로직은 순수 함수로 export해서 단위 테스트를 붙입니다.

```ts
export function nextSingleValue<V>(current: V | undefined, clicked: V) {
  return current === clicked ? undefined : clicked;
}
export function nextMultipleValue<V>(current: readonly V[], clicked: V, order: readonly V[]) {
  const set = new Set(current);
  set.has(clicked) ? set.delete(clicked) : set.add(clicked);
  return order.filter((v) => set.has(v)); // 옵션 순서로 정렬해 URL/상태를 안정적으로 유지
}
```

---

## 3. 구조 (DOM)

```html
<div class="...">                                  <!-- 루트, className 병합 -->
  <p id="{uid}-title">Tools</p>                    <!-- titleAs -->
  <div role="toolbar" aria-labelledby="{uid}-title" class="flex flex-wrap gap-2">
    <button type="button" aria-pressed="true" tabindex="0">
      <svg aria-hidden="true">✓</svg> Claude Code
      <span aria-hidden="true">12</span><span class="sr-only">, 12개</span>
    </button>
    <button type="button" aria-pressed="false" tabindex="-1">…</button>
    …
    <button type="button" aria-expanded="false" aria-controls="{uid}-toolbar" tabindex="-1">
      37개 더 보기
    </button>
  </div>
</div>
```

- id는 `useId()`로 만듭니다. 정적 export에서도 SSR과 클라이언트의 id가 일치합니다.
- "더 보기" 버튼은 툴바 **안의 마지막 항목**으로 두어 칩과 같은 줄에 이어서 wrap되게 합니다. roving 순서에도 포함되고, `End` 키로 바로 이동할 수 있습니다.
- `display: contents`로 툴바를 감싸는 방식은 쓰지 않습니다. 일부 브라우저에서 role이 사라지는 문제가 있습니다.

---

## 4. 상태 (디자인 토큰 / Tailwind)

공통 칩 베이스:

```
inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border
h-9 px-3 sm:h-8 sm:px-2.5 text-xs font-medium
transition-colors
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
focus-visible:ring-offset-2 focus-visible:ring-offset-panel
```

| 상태 | 시각 | 클래스(제안) | ARIA |
|---|---|---|---|
| 기본 | 중립 칩 | `border-line bg-elevated text-secondary` | `aria-pressed="false"` |
| hover | 테두리와 텍스트 강조 | `hover:border-accent/35 hover:text-primary` | – |
| focus-visible | 2px accent 링과 offset | 위 베이스의 focus-visible 링 | – |
| 선택 | accent 배경, **체크 아이콘**, 진한 테두리 | `border-accent/60 bg-accent/15 text-sky-200` + 체크 SVG(`size-3.5`) | `aria-pressed="true"` |
| 선택+hover | 배경을 한 단계 진하게 | `hover:bg-accent/20` | – |
| 비활성 | 흐리게, hover 없음 | `opacity-50 cursor-not-allowed` (hover 클래스 제거) | `aria-disabled="true"`. 포커스는 가능하고 클릭은 무시 |
| 비활성+선택 | 선택 표시는 유지하고 해제만 가능 | 선택 스타일 유지 | 선택된 칩은 count가 0이어도 **비활성으로 만들지 않습니다** (해제할 수 있어야 함) |
| 개수 배지 | 라벨 옆 작은 숫자 | `rounded px-1 tabular-nums text-[11px] text-muted`, 선택 시 `text-sky-200/80` | 숫자는 `aria-hidden`, sr-only로 "12개" 제공 |
| 접힘 | `collapseAfter`개와 선택된 칩만 보이고, 끝에 "+N개 더 보기" | 더 보기 버튼: `border-dashed border-line bg-transparent text-accent hover:border-accent/35` | `aria-expanded="false"` |
| 펼침 | 전체 표시, 끝에 "접기" | 동일 | `aria-expanded="true"` |

**디자인 쪽 확인 사항**

- 선택 칩의 체크 아이콘은 **선행 배치**합니다. 선택할 때 칩 폭이 약 18px 늘어나는 레이아웃 시프트는 허용하는 것으로 가정했습니다. 허용하지 않는다면 모든 칩에 아이콘 자리를 비워 두어야 해서 칩 밀도가 떨어집니다.
- `text-sky-200`은 토큰이 아닌 하드코딩 값입니다. 유지하거나 `accent-foreground` 같은 토큰을 추가할지 결정해 주세요.
- 대비 확인이 필요합니다. `text-muted` 배지가 `bg-elevated` 위에서 4.5:1을 넘는지, 선택 칩의 `text-sky-200`이 `accent/15` + panel 조합 위에서 기준을 넘는지 봐야 합니다.
- 칩이 `panel`이 아닌 배경 위에 놓이면 `ring-offset` 색을 그 배경에 맞춰야 합니다. 필요하면 prop이나 className으로 대응합니다.

---

## 5. 인터랙션

**선택**

- 단일: 클릭하면 선택하고, 이미 선택된 칩을 다시 누르면 해제(`undefined`)합니다. 다른 칩을 누르면 선택이 교체됩니다.
- 다중: 클릭할 때마다 해당 값을 토글합니다. 결과 배열은 옵션 순서로 정렬합니다.
- `aria-disabled` 칩을 클릭하거나 Space/Enter를 눌러도 아무 일도 일어나지 않습니다.

**접기/펼치기**

- `options.length > collapseAfter`이고 숨길 개수가 **3개 이상**일 때만 접습니다. "1개 더 보기" 버튼은 칩 하나와 공간이 같아서 의미가 없습니다.
- 접힌 상태에서 보이는 칩은 앞에서부터 `collapseAfter`개에 **선택된 칩 전부**를 더한 것입니다. 원래 옵션 순서를 유지합니다.
- 버튼 문구의 N은 실제로 숨겨진 개수입니다(선택되어 노출된 칩은 제외).
- 펼치면 포커스가 **새로 드러난 첫 칩**으로 이동합니다. 접으면 포커스는 토글 버튼에 남습니다.
- 펼침 상태는 내부 `useState`로 관리합니다. 필터가 바뀌어도 유지되고, 페이지를 이동하면 초기화됩니다.

**hover**

- Tailwind 3의 `hover:`는 터치에서 잔상이 남습니다. `tailwind.config.ts`에 `future: { hoverOnlyWhenSupported: true }`를 켜는 것을 권장합니다. 전역에 영향이 있으므로 별도 PR로 진행합니다.

---

## 6. 접근성

**역할과 ARIA**

- 그룹: `role="toolbar"`와 `aria-labelledby={titleId}`. 제목을 `hideTitle`로 숨겨도 sr-only로 남깁니다.
- 칩: 네이티브 `<button type="button">`에 `aria-pressed`를 붙입니다. 다중 선택에서도 같은 패턴을 씁니다.
- 개수: 시각 숫자는 `aria-hidden`로 가리고, sr-only로 `messages.countLabel`을 붙입니다. 읽히는 예: "리뷰, 12개, 전환 버튼, 눌림".
- 체크 아이콘: `aria-hidden="true"`. 선택 상태는 `aria-pressed`로 전달합니다.
- 더 보기: `aria-expanded`와 `aria-controls`(툴바 id).

**키보드 (roving tabindex)**

| 키 | 동작 |
|---|---|
| Tab / Shift+Tab | 그룹 진입과 이탈. 그룹당 정지점은 1개입니다. |
| → / ↓ | 다음 칩(마지막에서 처음으로 순환) |
| ← / ↑ | 이전 칩(처음에서 마지막으로 순환) |
| Home / End | 처음 / 마지막 항목(더 보기 버튼 포함) |
| Space / Enter | 토글 (네이티브 버튼 동작) |

- 진입할 때 포커스를 받는 칩은 **마지막으로 포커스했던 칩**입니다. 기록이 없으면 첫 번째 선택된 칩, 선택이 없으면 첫 칩입니다.
- 화살표는 **포커스만 옮기고 선택하지는 않습니다**. 선택할 때마다 결과가 바뀌기 때문입니다.
- 줄바꿈된 칩 사이에서 ↑/↓를 누르면 윗줄/아랫줄이 아니라 이전/다음 칩으로 이동합니다(DOM 순서 기준). 2D 이동은 구현 비용 대비 이점이 작습니다.
- 접힐 때 tabindex=0이던 칩이 숨겨지면 tabindex=0을 첫 칩으로 넘깁니다.
- 결과 개수 변화 안내(`aria-live`)는 **페이지 책임**입니다. 컴포넌트는 안내하지 않습니다.

**Tab 방식 대비 선택 근거**

| | 칩마다 Tab | roving (채택) |
|---|---|---|
| /agents에서 Tab 횟수 | 약 80회 이상 | 약 6회 |
| 학습 비용 | 없음 | 낮음 (toolbar 역할을 스크린 리더가 안내) |
| 구현 | 없음 | 약 40줄 (keydown과 ref 배열) |

---

## 7. 반응형 규칙 (375 ~ 1440px)

| 구간 | 규칙 |
|---|---|
| < 640px (375 기준) | 칩 `h-9 px-3`, 간격 `gap-2`. 한 줄에 보통 3~4개. 라벨은 `whitespace-nowrap`에 `max-w-full truncate`를 적용하고, 잘리면 `title`에 전체 라벨을 넣습니다. |
| ≥ 640px | 칩 `h-8 px-2.5`. 간격은 같습니다. |
| 공통 | 가로 스크롤은 쓰지 않습니다. 숨겨진 옵션을 발견하기 어렵고 roving 포커스와도 충돌합니다. 줄 수는 `collapseAfter`로 조절합니다. |
| 권장 `collapseAfter` | 도구 **12** (375px에서 약 4줄). 역할 9개, 카테고리 11개, 난이도, 자동화, 검증은 접지 않습니다. |

- 화면 폭에 따라 기준 개수를 다르게 하는 기능은 넣지 않습니다. `matchMedia`에 의존하면 정적 export의 hydration 결과가 달라지고, 12개 기준이면 1440px에서도 2줄 정도라 과하지 않습니다.
- 49개를 펼친 상태의 모바일 스크롤 길이는 허용합니다. 사용자가 직접 펼친 것이기 때문입니다.

---

## 8. 사용 예시

**/agents: 단일 선택과 개수 배지**

```tsx
<FilterChipGroup
  title={t.filters.tools}
  options={tools.map((tool) => ({
    value: tool,
    label: toolLabel(tool),
    count: facetCounts.tools[tool] ?? 0,
  }))}
  value={filters.tool}
  onValueChange={(tool) => setFilters((f) => ({ ...f, tool }))}
  collapseAfter={12}
  showCounts
  disableEmpty
  messages={t.filterChips}
/>
```

**/agents: 자동화 레벨 (숫자 값은 문자열로)**

```tsx
<FilterChipGroup
  title={t.filters.automation}
  options={["1", "2", "3", "4", "5"].map((v) => ({ value: v, label: `${t.filters.level} ${v}` }))}
  value={filters.automation}
  onValueChange={(automation) => setFilters((f) => ({ ...f, automation }))}
  messages={t.filterChips}
/>
```

**/cases: 다중 선택**

```tsx
<FilterChipGroup
  selectionMode="multiple"
  title={t.filters.categories}
  options={categoryOptions}
  value={filters.categories}            // string[]
  onValueChange={(categories) => setFilters((f) => ({ ...f, categories }))}
  messages={t.filterChips}
/>
```

**dictionaries 추가 키 (en과 ko 모두)**

```ts
// en
filterChips: { showMore: "Show {count} more", showLess: "Show less", countLabel: "{count} results" },
// ko
filterChips: { showMore: "{count}개 더 보기", showLess: "접기", countLabel: "{count}개" },
```

`{count}` 치환은 컴포넌트 안의 작은 헬퍼가 처리합니다. 사전이 이미 함수형 메시지를 지원한다면 그 방식을 따릅니다.

---

## 9. 마이그레이션 메모

1. `filter-chip-group.tsx`를 만들고 `nextSingleValue`와 `nextMultipleValue`의 단위 테스트를 추가합니다(기존 unit test 구성을 사용).
2. **부모의 토글 로직을 제거합니다.** 지금은 `setFilter`가 토글을 하는데, 컴포넌트도 토글하면 **두 번 토글되어 선택이 되지 않습니다**. `onValueChange`에는 받은 값을 그대로 저장하는 setter만 넘겨야 합니다. 가장 놓치기 쉬운 부분입니다.
3. `values`와 `label` 조합을 `options`로 바꿉니다. 기존 `titleCase` 기본 라벨은 호출하는 쪽으로 옮기고, 가능하면 dictionaries 번역으로 대체합니다.
4. 개수 배지를 쓰는 그룹은 facet count 계산을 페이지 쪽에 추가합니다(열린 질문 2 참고).
5. `filterChips` 키를 `en`과 `ko`에 모두 추가합니다.
6. `FilterRow`를 삭제하고 6개 그룹을 교체합니다. 도구 그룹에만 `collapseAfter={12}`를 적용합니다.
7. URL 쿼리 동기화(`useSearchParams`)는 그대로 둡니다. 다중 선택용 직렬화 규칙은 /cases 작업에서 정합니다(예: `?category=a,b`).
8. 확인: `check:data`, `lint`, `typecheck`, `build`. 키보드만으로 6개 그룹을 순회하고, VoiceOver로 "눌림" 상태가 읽히는지, 375px 레이아웃을 수동으로 점검합니다.

시각 변경이 함께 들어갑니다(칩 높이 증가, 체크 아이콘). 스크린샷 비교를 PR에 첨부하는 것을 권장합니다.

---

## 10. 가정

- 필터 패널은 `panel` 배경 위에 놓입니다(ring-offset 색 기준).
- 옵션 라벨은 짧은 단어입니다(대부분 20자 이하). 긴 라벨은 truncate로 처리합니다.
- 옵션 수는 최대 약 50개입니다. 수백 개가 되면 검색 입력이 필요해지며 이 스펙의 범위를 벗어납니다.
- 선택 시 체크 아이콘 때문에 칩 폭이 변하는 것은 허용합니다.
- 기존에 아이콘 라이브러리가 있어도 체크 하나는 인라인 SVG로 충분합니다(의존성 금지 조건 충족).
- 펼침 상태를 URL에 저장할 필요는 없습니다.

---

## 11. 리스크

| 리스크 | 영향 | 대응 |
|---|---|---|
| 부모와 컴포넌트가 모두 토글 | 선택 불가 버그 | 마이그레이션 2단계에서 처리하고, 교체 PR에서 전 그룹을 수동 테스트합니다. |
| 접힌 영역에 선택 값이 숨음 | 현재 필터 상태를 오인 | 선택된 칩은 항상 노출하도록 스펙에 명시했습니다. |
| roving tabindex 구현 오류(포커스 유실, 숨긴 칩에 tabindex=0) | 키보드 사용자가 그룹에 진입하지 못함 | 접기/펼치기, 옵션 변경, 선택 해제 시나리오로 테스트합니다. |
| count 변경 시 칩 폭 흔들림 | 레이아웃이 들썩임 | `tabular-nums`를 적용합니다. 자릿수 변화는 허용합니다. |
| `disableEmpty`로 선택된 칩까지 비활성화 | 해제 불가 | 선택된 칩은 비활성 예외로 둡니다(스펙 명시). |
| 칩 높이 증가(24→36px)로 필터 패널이 길어짐 | 모바일 첫 화면의 결과 노출 감소 | 도구 그룹 접기로 상쇄합니다. 여전히 길면 모바일에서 필터 패널을 접는 방식을 별도로 검토합니다. |
| `hoverOnlyWhenSupported` 전역 변경 | 다른 컴포넌트 hover 동작 변화 | 별도 PR로 분리해 영향 범위를 확인합니다. |
| 영어 복수형("1 more") | 문구 어색함 | 숨김이 3개 이상일 때만 접으므로 N은 항상 3 이상이고, 단수 문제가 생기지 않습니다. |

---

## 12. 다음 액션

| # | 담당 | 작업 |
|---|---|---|
| 1 | 디자인 | 선택 스타일(체크 아이콘, 테두리 강조) 확정, `text-sky-200` 토큰화 여부 결정, 대비 수치 확인 |
| 2 | 디자인 | 더 보기 버튼 스타일(점선 테두리 + accent 텍스트) 확정 |
| 3 | 개발 | 컴포넌트와 토글 헬퍼 단위 테스트 작성 (1 PR) |
| 4 | 개발 | /agents 교체와 부모 토글 제거, i18n 키 추가 (1 PR, 스크린샷 첨부) |
| 5 | 개발 | (선택) `hoverOnlyWhenSupported` 적용 (별도 PR) |
| 6 | 개발 | /workflows, /cases 적용. /cases는 다중 선택 URL 직렬화 포함 |
| 7 | 공동 | 키보드와 VoiceOver, 375/768/1440px QA 체크리스트 수행 |

---

## 열린 질문 (페이지 쪽 결정, 컴포넌트 작업을 막지 않음)

1. **/cases 다중 선택의 의미**: 같은 그룹 안에서 여러 값을 고르면 OR(하나라도 해당)인가요, AND(모두 해당)인가요? 필터 UI의 관례는 OR입니다. 컴포넌트는 어느 쪽이든 동일합니다.
2. **개수 배지 기준**: "다른 그룹 필터를 적용한 상태에서 이 칩을 선택하면 나오는 결과 수"(facet count, 권장)인가요, 아니면 전체 데이터 기준의 고정 개수인가요? 권장안으로 가면 0개 칩을 `disableEmpty`로 흐리게 처리할 수 있습니다.
