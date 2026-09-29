# Agent Archive 북마크 동기화 API 계약서 v1 (초안)

주신 정보만으로 계약서를 확정할 수 있습니다. 아래에서 정하지 않은 부분은 **[가정]**으로 표시했고 기본값도 적어 두었습니다. 월요일 전에 확인이 필요한 항목은 5장에 모았습니다. 답이 없으면 기본값으로 진행하면 됩니다.

---

## 0. 요약

| # | 기능 | 메서드 | 경로 | 성공 응답 |
|---|---|---|---|---|
| 1 | 내 북마크 목록 조회 | `GET` | `/v1/me/bookmarks` | `200` |
| 2 | 북마크 추가(단건, 멱등) | `PUT` | `/v1/me/bookmarks/{slug}` | `201` 새로 생성 / `200` 이미 있음 |
| 3 | 북마크 삭제(단건, 멱등) | `DELETE` | `/v1/me/bookmarks/{slug}` | `204` |
| 4 | localStorage 병합 업로드 | `POST` | `/v1/me/bookmarks/merge` | `200` |

- Base URL: `https://api.agentarchive.dev`
- 모든 엔드포인트는 인증이 필요합니다(`Authorization: Bearer <JWT>`).
- **추가를 `POST`가 아니라 `PUT /{slug}`로 설계한 이유:** "같은 slug를 두 번 추가하면 멱등"이라는 결정이 HTTP 의미와 그대로 맞습니다. 요청 바디가 없어서 프론트 구현도 단순하고, 재시도해도 안전합니다.

---

## 1. 공통 규약

### 1.1 요청과 응답
- `Content-Type: application/json; charset=utf-8`. 요청 바디는 병합(#4)에만 있습니다.
- 응답 필드는 camelCase를 씁니다. 시간은 ISO 8601 UTC이고 밀리초까지 표기합니다(예: `2025-01-15T09:30:00.000Z`).
- 모든 응답에 `Cache-Control: no-store`를 붙입니다. 사용자별 데이터라서 캐시되면 안 됩니다.
- 모든 응답에 `X-Request-Id` 헤더를 넣습니다. 버그를 제보할 때 이 값을 함께 전달합니다.

### 1.2 데이터 모델

```ts
// 프론트/백엔드 공유 타입 (그대로 복사해 사용)
export type Bookmark = {
  slug: string;       // ^[a-z0-9]+(?:-[a-z0-9]+)*$, 3~64자
  createdAt: string;  // ISO 8601 UTC
};

export type BookmarkListResponse = {
  bookmarks: Bookmark[];  // createdAt 내림차순(최신 먼저)
  total: number;
  limit: 500;
};

export type BookmarkPutResponse = {
  bookmark: Bookmark;
};

export type MergeSkipReason =
  | "INVALID_SLUG"
  | "UNKNOWN_AGENT_SLUG"
  | "BOOKMARK_LIMIT_REACHED";

export type MergeRequest = {
  slugs: string[]; // 0~200개
};

export type MergeResponse = {
  added: string[];
  alreadyBookmarked: string[];
  skipped: { slug: string; reason: MergeSkipReason }[];
  bookmarks: Bookmark[];  // 병합 후 전체 목록 (GET과 동일한 정렬)
  total: number;
  limit: 500;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};
```

### 1.3 slug 검증 순서
1. **형식 검사**: `^[a-z0-9]+(?:-[a-z0-9]+)*$`, 길이 3~64자. 실패하면 `400 INVALID_SLUG`를 반환합니다.
   - **[가정]** 하이픈으로 시작하거나 끝나는 slug, 하이픈이 연속되는 slug(`--`)는 허용하지 않습니다.
   - **[가정]** 대문자를 소문자로 바꿔 주는 정규화는 하지 않습니다. `My-Agent`는 그대로 거부합니다. 서버가 조용히 고쳐 주면 클라이언트 버그가 가려지기 때문입니다.
2. **카탈로그 존재 검사**: 서버가 가진 agents 목록에 없으면 `422 UNKNOWN_AGENT_SLUG`를 반환합니다.
   - 예외: **삭제(#3)는 카탈로그 검사를 하지 않습니다.** 사이트에서 에이전트가 빠진 뒤에도 사용자가 그 북마크를 지울 수 있어야 하기 때문입니다.

### 1.4 에러 코드 전체 표

| HTTP | code | 발생 조건 | `details` |
|---|---|---|---|
| 400 | `INVALID_JSON` | 병합 요청 바디가 JSON이 아님 | 없음 |
| 400 | `VALIDATION_FAILED` | 병합 바디 스키마 위반(`slugs` 누락, 배열 아님, 문자열 아닌 원소, 200개 초과) | `{ field, reason, max?, actual? }` |
| 400 | `INVALID_SLUG` | 경로의 slug가 형식 규칙 위반 | `{ slug, pattern, minLength: 3, maxLength: 64 }` |
| 401 | `UNAUTHORIZED` | 토큰 없음, 서명 불일치, 형식 오류 | 없음 |
| 401 | `TOKEN_EXPIRED` | JWT `exp`가 지남 | `{ expiredAt }` |
| 404 | `NOT_FOUND` | 정의되지 않은 경로 | 없음 |
| 409 | `BOOKMARK_LIMIT_REACHED` | 이미 500개인데 새 slug를 추가하려 함 | `{ limit: 500, total: 500 }` |
| 422 | `UNKNOWN_AGENT_SLUG` | 형식은 맞지만 카탈로그에 없는 slug | `{ slug }` |
| 429 | `RATE_LIMITED` | 사용자당 분당 60회 초과 | `{ limit: 60, windowSeconds: 60, retryAfterSeconds }` |
| 500 | `INTERNAL_ERROR` | 서버 오류 | 없음 |

- `message`는 **개발자용 영어 문장**으로 둡니다 **[가정]**. 사이트가 en/ko를 모두 지원하므로, UI 문구는 프론트가 `code`를 기준으로 i18n 사전에서 가져옵니다. 서버 `message`를 화면에 그대로 띄우지 않습니다.
- 401을 두 코드로 나눈 이유가 있습니다. 프론트가 `TOKEN_EXPIRED`를 받았을 때만 refresh 후 1회 재시도하고, `UNAUTHORIZED`를 받으면 로그아웃 처리하도록 분기하기 위해서입니다.

---

## 2. 엔드포인트 상세

### 2.1 내 북마크 목록 조회: `GET /v1/me/bookmarks`

- 요청 바디가 없고 쿼리 파라미터도 받지 않습니다.
- 최대 500개라서 **페이지네이션을 두지 않고 전체를 반환**합니다. 500개 × 약 90바이트 ≈ 45KB로, 한 번에 보내도 충분한 크기입니다.
- 정렬은 `createdAt` 내림차순이고, 시각이 같으면 나중에 저장된 것이 먼저 옵니다.

**200 OK**
```json
{
  "bookmarks": [
    { "slug": "api-contract-agent", "createdAt": "2025-01-15T09:30:12.418Z" },
    { "slug": "code-review-agent", "createdAt": "2025-01-14T22:03:55.001Z" }
  ],
  "total": 2,
  "limit": 500
}
```

북마크가 없으면 `{ "bookmarks": [], "total": 0, "limit": 500 }`을 반환합니다. 404를 쓰지 않습니다.

| HTTP | code |
|---|---|
| 401 | `UNAUTHORIZED`, `TOKEN_EXPIRED` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |

---

### 2.2 북마크 추가: `PUT /v1/me/bookmarks/{slug}`

- 요청 바디가 없습니다. 바디가 오더라도 무시합니다.
- 멱등 규칙:
  - 새로 저장했으면 `201 Created`를 반환합니다.
  - 이미 있으면 `200 OK`를 반환하고, **처음 저장된 `createdAt`을 그대로 돌려줍니다**(갱신하지 않음).
  - 이미 있는 slug는 **500개 한도에 걸려도 `200`**입니다. 추가되는 것이 없기 때문입니다.

**201 Created** / **200 OK** (바디 형식 동일)
```json
{
  "bookmark": { "slug": "api-contract-agent", "createdAt": "2025-01-15T09:30:12.418Z" }
}
```

**400 INVALID_SLUG**
```json
{
  "error": {
    "code": "INVALID_SLUG",
    "message": "Slug must be 3-64 characters of lowercase letters, digits, and single hyphens.",
    "details": { "slug": "My_Agent", "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$", "minLength": 3, "maxLength": 64 }
  }
}
```

**422 UNKNOWN_AGENT_SLUG**
```json
{
  "error": {
    "code": "UNKNOWN_AGENT_SLUG",
    "message": "No agent exists with this slug.",
    "details": { "slug": "removed-agent" }
  }
}
```

**409 BOOKMARK_LIMIT_REACHED**
```json
{
  "error": {
    "code": "BOOKMARK_LIMIT_REACHED",
    "message": "Bookmark limit of 500 reached.",
    "details": { "limit": 500, "total": 500 }
  }
}
```

| HTTP | code |
|---|---|
| 400 | `INVALID_SLUG` |
| 401 | `UNAUTHORIZED`, `TOKEN_EXPIRED` |
| 409 | `BOOKMARK_LIMIT_REACHED` |
| 422 | `UNKNOWN_AGENT_SLUG` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |

---

### 2.3 북마크 삭제: `DELETE /v1/me/bookmarks/{slug}`

- 요청 바디가 없습니다.
- **멱등**입니다. 북마크가 없는 slug를 지워도 `204`를 반환합니다 **[가정]**. 두 기기에서 동시에 지우거나 네트워크 재시도가 일어나도 에러가 나지 않게 하기 위해서입니다.
- 형식 검사만 하고 **카탈로그 검사는 하지 않습니다**(1.3 참고).

**204 No Content**: 바디가 없습니다.

| HTTP | code |
|---|---|
| 400 | `INVALID_SLUG` |
| 401 | `UNAUTHORIZED`, `TOKEN_EXPIRED` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |

---

### 2.4 localStorage 병합 업로드: `POST /v1/me/bookmarks/merge`

**요청**
```json
{
  "slugs": ["api-contract-agent", "code-review-agent", "Old_Agent", "deleted-agent", "api-contract-agent"]
}
```

**병합 규칙**
1. **요청 단위 검증에 실패하면 요청 전체를 `400`으로 거부합니다.** 대상은 바디가 JSON이 아닌 경우, `slugs`가 배열이 아닌 경우, 원소 중 문자열이 아닌 값이 있는 경우, 200개를 초과한 경우입니다.
2. **원소 단위 문제는 거부하지 않고 건너뛴 뒤 `skipped`로 보고합니다.** localStorage 데이터는 오래되었거나 손상되었을 수 있는데, 원소 하나 때문에 로그인 흐름 전체가 막히면 안 되기 때문입니다.
   - 형식 위반은 `INVALID_SLUG`입니다.
   - 카탈로그에 없는 slug는 `UNKNOWN_AGENT_SLUG`입니다. 사이트에서 빠진 에이전트가 이 경우에 해당합니다.
3. 요청 안의 중복은 **처음 등장한 것만 처리하고 나머지는 조용히 제거**합니다. 응답에 따로 표시하지 않습니다.
4. 서버에 이미 있는 slug는 `alreadyBookmarked`로 분류합니다. 기존 `createdAt`은 유지합니다.
5. **500개 한도는 배열 순서대로 채웁니다.** 한도에 도달한 뒤의 새 slug는 `skipped`(`BOOKMARK_LIMIT_REACHED`)로 보고하고, 이 경우에도 응답은 `200`입니다.
6. 새로 추가된 항목의 `createdAt`은 **병합 시점의 서버 시각**입니다. localStorage에 시각 정보가 없으므로 과거 시각을 지어내지 않습니다. 같은 요청에서 추가된 항목들은 시각이 같고, 정렬은 저장 순서로 가립니다.
7. 서버에 있고 요청에 없는 북마크는 **절대 삭제하지 않습니다.** 병합은 합집합(union)만 수행합니다.
8. **재호출해도 안전합니다(멱등).** 같은 요청을 두 번 보내면 두 번째 요청에서는 모두 `alreadyBookmarked`로 분류됩니다. 그래서 `Idempotency-Key`는 필요 없습니다.
9. 빈 배열(`[]`)도 허용합니다. 이 경우 현재 전체 목록을 반환합니다.
10. `skipped[].slug`는 입력값을 그대로 돌려주되, 최대 100자로 자릅니다. 손상된 긴 문자열이 응답을 부풀리지 않게 하기 위해서입니다.

**200 OK** (위 요청 예시에 대한 응답. `code-review-agent`는 이미 있었다고 가정)
```json
{
  "added": ["api-contract-agent"],
  "alreadyBookmarked": ["code-review-agent"],
  "skipped": [
    { "slug": "Old_Agent", "reason": "INVALID_SLUG" },
    { "slug": "deleted-agent", "reason": "UNKNOWN_AGENT_SLUG" }
  ],
  "bookmarks": [
    { "slug": "api-contract-agent", "createdAt": "2025-01-15T09:30:12.418Z" },
    { "slug": "code-review-agent", "createdAt": "2025-01-14T22:03:55.001Z" }
  ],
  "total": 2,
  "limit": 500
}
```

**400 VALIDATION_FAILED** (201개를 보낸 경우)
```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "slugs must contain at most 200 items.",
    "details": { "field": "slugs", "reason": "TOO_MANY_ITEMS", "max": 200, "actual": 201 }
  }
}
```

| HTTP | code |
|---|---|
| 400 | `INVALID_JSON`, `VALIDATION_FAILED` |
| 401 | `UNAUTHORIZED`, `TOKEN_EXPIRED` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |

**프론트 권장 흐름**
1. 로그인에 성공하고 access token을 받습니다.
2. localStorage `agent-archive:bookmarks`에 항목이 있고, 이 사용자로 병합한 기록이 없으면 `POST /merge`를 **1회** 호출합니다. 항목이 200개를 넘으면 200개씩 나눠 순차로 호출합니다. localStorage에는 원래 한도가 없었을 수 있기 때문입니다.
3. 응답의 `bookmarks`로 클라이언트 상태를 통째로 교체합니다. 병합 후 GET을 다시 부를 필요는 없습니다.
4. 병합 완료 플래그를 저장합니다 **[가정: 키 `agent-archive:bookmarks-merged:{userId}`]**.
5. 이후에는 PUT과 DELETE로 낙관적 업데이트를 하고, 실패하면 롤백합니다.

---

## 3. 인증, CORS, 레이트 리밋

### 3.1 인증
- `Authorization: Bearer <JWT>`를 사용하고, 만료 시간은 15분입니다.
- **[가정]** JWT의 `sub`에는 서버 내부 user id를 넣습니다. GitHub login은 이름이 바뀔 수 있으므로 키로 쓰지 않습니다.
- **[가정]** 서명 검증 시 시계 오차 허용치(clock skew)는 30초입니다.
- 프론트는 `TOKEN_EXPIRED`를 받으면 refresh(이번 범위 밖)를 거친 뒤 **1회만** 재시도합니다. 재시도에도 실패하면 로그아웃 상태로 전환합니다.

### 3.2 CORS
| 헤더 | 값 |
|---|---|
| `Access-Control-Allow-Origin` | `https://yohan-work.github.io` (허용 목록과 **정확히 일치할 때만** 요청 Origin을 그대로 반사하고, `*` 금지) |
| `Access-Control-Allow-Methods` | `GET, PUT, DELETE, POST, OPTIONS` |
| `Access-Control-Allow-Headers` | `Authorization, Content-Type` |
| `Access-Control-Expose-Headers` | `Retry-After, X-Request-Id, RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset` |
| `Access-Control-Max-Age` | `600` |
| `Vary` | `Origin` |
| `Access-Control-Allow-Credentials` | **이번 범위 엔드포인트에서는 보내지 않음** (Bearer 헤더만 쓰고 쿠키는 쓰지 않음) |

- `Authorization` 헤더를 쓰므로 모든 요청에 **preflight(OPTIONS)가 발생**합니다. OPTIONS에는 인증을 요구하지 않고, 레이트 리밋에도 포함하지 않습니다. `204`로 응답합니다.
- **401, 429, 500 에러 응답에도 CORS 헤더를 반드시 붙입니다.** 빠뜨리면 브라우저는 에러 바디를 읽지 못하고 `TypeError: Failed to fetch`만 보게 되어, 프론트가 `TOKEN_EXPIRED`와 `RATE_LIMITED`를 구분할 수 없습니다. 실무에서 가장 흔한 CORS 버그입니다.
- **[가정]** 개발 환경의 `http://localhost:3000`은 **dev/staging 배포에서만** 허용 목록에 넣습니다. 프로덕션 API에서는 허용하지 않습니다.
- fetch는 `credentials` 기본값(`same-origin`)으로 호출합니다. 즉 이번 범위에서는 `credentials: "include"`를 쓰지 않습니다.

### 3.3 레이트 리밋
- **사용자(JWT `sub`) 기준으로 슬라이딩 또는 고정 60초 창에 60회**를 허용합니다.
- 인증에 실패한 요청은 user id가 없으므로 **[가정] IP 기준으로 분당 60회**를 별도로 적용합니다.
- 병합 1회는 요청 1회로 셉니다. 그래서 localStorage 업로드에 PUT을 반복하지 말고 반드시 `/merge`를 써야 합니다.
- 초과하면 `429`와 함께 `Retry-After: <초>` 헤더를 보내고, `details.retryAfterSeconds`에도 같은 값을 넣습니다.
- 권장 사항으로, 정상 응답에도 `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` 헤더를 붙입니다. 필수는 아닙니다.
- 구현 참고: Workers의 Rate Limiting 바인딩은 위치(PoP)별로 집계되어 근사치입니다. 60회를 엄격하게 지켜야 한다면 Durable Object 카운터를 쓰는 편이 정확합니다. 이번 용도(남용 방지)에는 근사치로도 충분하다고 봅니다.

**429 예시**
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Try again later.",
    "details": { "limit": 60, "windowSeconds": 60, "retryAfterSeconds": 23 }
  }
}
```

---

## 4. 백엔드 구현 참고 (D1)

```sql
CREATE TABLE bookmarks (
  user_id    TEXT NOT NULL,
  slug       TEXT NOT NULL,
  created_at TEXT NOT NULL,              -- ISO 8601 UTC
  PRIMARY KEY (user_id, slug)
);
CREATE INDEX idx_bookmarks_user_created ON bookmarks (user_id, created_at DESC);
```
- 추가(PUT): `INSERT ... ON CONFLICT(user_id, slug) DO NOTHING`을 실행한 뒤, 변경된 행 수로 201과 200을 판정합니다.
- 한도 검사와 삽입은 **하나의 조건부 INSERT**로 묶습니다(`INSERT ... SELECT ... WHERE (SELECT COUNT(*) ...) < 500`). 따로 실행하면 동시 요청이 들어올 때 501개가 저장될 수 있습니다.
- 병합: 한도까지 남은 슬롯을 계산한 뒤 `db.batch()`로 한 번에 삽입합니다.

---

## 5. 월요일 전에 확인이 필요한 사항

답이 없으면 괄호 안의 기본값으로 진행합니다.

1. **slug 세부 규칙**: 하이픈으로 시작하거나 끝나는 slug, 연속 하이픈을 허용하나요? (기본값: 불허. 현재 100개 slug가 이 규칙을 모두 통과하는지 백엔드가 확인)
2. **삭제한 slug가 다시 살아나는 문제의 정책**: 기기 A에서 지운 북마크가 기기 B의 localStorage에는 남아 있으면, B에서 처음 로그인할 때 병합으로 되살아납니다. 이것을 허용하나요? (기본값: 허용. "기기별 최초 1회 병합"이므로 발생 빈도가 낮다고 봄)
3. **로그아웃 후 localStorage 처리**: 서버 목록을 localStorage에 남기나요, 비우나요? (기본값: 남기되 병합 플래그는 유지) 계약서가 아니라 프론트 동작 결정이지만, 2번과 연결되어 있습니다.
4. **localhost와 프리뷰 origin 허용 범위** (기본값: dev/staging API에서만 `http://localhost:3000` 허용)
5. **에러 `message` 언어** (기본값: 영어, UI 문구는 프론트 i18n)

---

## 6. 리스크

| 리스크 | 영향 | 대응 |
|---|---|---|
| **refresh 쿠키가 크로스 사이트에서 막힘**: `yohan-work.github.io`와 `api.agentarchive.dev`는 서로 다른 사이트이므로, refresh용 httpOnly 쿠키는 서드파티 쿠키가 됩니다. Safari ITP와 Firefox, 그리고 서드파티 쿠키를 제한하는 브라우저에서 차단될 수 있습니다. | **높음.** 15분 뒤 모든 사용자가 로그아웃되는 것처럼 보일 수 있음 | 이번 범위 밖이지만 **이 기능 전체의 성패를 좌우하는 문제**입니다. 사이트를 `agentarchive.dev` 하위 도메인(예: `www.agentarchive.dev`)에 커스텀 도메인으로 두어 same-site로 만드는 방안을 병행 검토하세요. 결정되면 CORS origin도 바뀝니다. |
| **카탈로그 불일치**: 사이트와 API가 따로 배포되는데 API는 빌드 시점 목록을 씀 | 새 에이전트를 사이트에 추가해도 API를 재배포하기 전까지는 북마크할 때 `422`가 남 | 사이트 배포 CI에서 API 카탈로그 갱신까지 함께 수행하거나, API가 사이트의 공개 agents 인덱스(JSON)를 캐시해 주기적으로 가져오는 방식으로 바꿉니다. 프론트는 `422`를 받으면 "잠시 후 다시 시도"로 안내합니다. |
| **사이트에서 삭제된 에이전트의 북마크** | GET 결과에 사이트에 없는 slug가 섞이고, 이 항목도 500개 한도를 차지함 | 서버는 저장된 목록을 그대로 반환하고, **프론트가 자기 카탈로그에 없는 slug는 숨깁니다**. 필요하면 나중에 정리 작업을 추가합니다. |
| **CORS 헤더 누락 에러 응답** | 프론트에서 에러 종류를 구분할 수 없음 | 3.2의 규칙을 미들웨어 한 곳에서 처리하고, 계약 테스트에 401과 429 응답의 CORS 헤더 검증을 넣습니다. |
| **동시 요청 때문에 500개 한도 초과** | 데이터 정합성 깨짐 | 4장의 조건부 INSERT를 사용합니다. |
| **localStorage 데이터 손상 또는 레거시 형식** | 병합 실패 | 원소 단위로 skip하는 규칙(2.4)을 적용하고, 프론트는 JSON 파싱에 실패하면 병합을 건너뜁니다. |
| **레이트 리밋 근사치** | 60회를 약간 넘는 요청이 통과할 수 있음 | 남용 방지 목적이면 수용합니다. 엄격해야 하면 Durable Object를 씁니다. |

---

## 7. 다음 액션

| 담당 | 할 일 | 시점 |
|---|---|---|
| 전원 | 5장 질문 5개에 답하고 계약서 v1 동결 | 이번 주 금요일 전 |
| 백엔드 | 이 문서를 OpenAPI 3.1 YAML로 옮겨 레포에 커밋(단일 진실 공급원) | 동결 직후 |
| 백엔드 | 현재 100개 slug가 1.3의 정규식을 통과하는지 스크립트로 확인 | 동결 전 |
| 프론트 | 1.2의 TS 타입과 2장의 예시 JSON으로 MSW 목(mock) 핸들러 작성. 월요일부터 서버 없이 개발 가능 | 월요일 |
| 프론트 | 에러 `code`별 en/ko i18n 문구 추가 | 1주차 |
| 백엔드 | CORS와 레이트 리밋 미들웨어 먼저 배포(엔드포인트는 stub). 프론트가 preflight를 조기에 검증할 수 있게 함 | 1주차 초 |
| 공동 | 계약 테스트: 엔드포인트별 성공 1건, 주요 에러 1건, 401/429 응답의 CORS 헤더 | 통합 전 |
| 리드 | **refresh 쿠키의 크로스 사이트 문제(리스크 1번)** 결정. 커스텀 도메인 여부 | 가능한 빨리(구현 2주차 전) |

계약서를 동결한 뒤 변경할 때는 `/v1` 안에서 **필드 추가만** 허용합니다. 필드 삭제나 의미 변경이 필요하면 `/v2`를 만들거나, 양쪽이 합의한 뒤 이 문서의 버전을 올립니다.
