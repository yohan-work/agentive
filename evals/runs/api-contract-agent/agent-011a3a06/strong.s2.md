# Agent Archive 북마크 동기화 API 계약서 (v0, 월요일 착수용)

결정된 사항은 그대로 반영했습니다. 제가 채운 부분은 모두 **[ASSUMPTION]** 으로 표시했으니, 월요일 전에 확인하거나 뒤집어 주세요. 착수 전에 꼭 답이 필요한 건 맨 아래 "미결 질문" 3개뿐입니다.

---

## 1. 공통 규약

| 항목 | 내용 |
|---|---|
| Base URL | `https://api.agentarchive.dev` (버전 prefix 없음 [ASSUMPTION]) |
| 인증 | 모든 엔드포인트 필수. `Authorization: Bearer <accessToken>` (GitHub OAuth 로그인 후 서버가 발급한 JWT, 유효기간 15분). refresh는 범위 밖 |
| 요청 헤더 | `Authorization` (전부), `Content-Type: application/json` (`POST /bookmarks/merge`만) |
| 응답 헤더 | `Content-Type: application/json; charset=utf-8`, `Cache-Control: no-store` [ASSUMPTION] |
| 필드 표기 | camelCase |
| 시간 | ISO 8601 UTC, 밀리초 포함 `Z` 형식 (JS `toISOString()` 출력과 동일): `2026-10-05T01:23:45.678Z` [ASSUMPTION: 밀리초 포함] |
| slug 규칙 | 정규식 `^[a-z0-9-]{3,64}$`. 대문자, 공백, 앞뒤 공백은 정규화하지 않고 그대로 규칙 위반으로 처리 [ASSUMPTION] |
| 에러 포맷 | 팀 표준 `{ "error": { "code", "message", "details" } }`. `details`는 항상 객체이며 추가 정보가 없으면 `{}` [ASSUMPTION] |
| 에러 message 언어 | 개발자용 영어 문장. 프론트는 `message`를 그대로 노출하지 않고 `code`로 en/ko 문구를 매핑 [ASSUMPTION] |

### 1.1 CORS

| 헤더 | 값 |
|---|---|
| `Access-Control-Allow-Origin` | `https://yohan-work.github.io` (정확히 이 origin만, `*` 금지. 그 외 origin에는 CORS 헤더를 붙이지 않음) |
| `Access-Control-Allow-Methods` | `GET, PUT, DELETE, POST, OPTIONS` |
| `Access-Control-Allow-Headers` | `Authorization, Content-Type` |
| `Access-Control-Expose-Headers` | `Retry-After` |
| `Access-Control-Max-Age` | `600` [ASSUMPTION] |
| `Access-Control-Allow-Credentials` | 보내지 않음. 이번 4개 엔드포인트는 쿠키가 필요 없으므로 프론트는 `credentials: "omit"`(기본값 `same-origin`도 가능)으로 호출 [ASSUMPTION] |
| `Vary` | `Origin` |

- 모든 호출에 `Authorization` 헤더가 붙으므로 GET/DELETE까지 전부 preflight가 발생합니다.
- `OPTIONS` preflight: 인증 없음, 레이트 리밋 집계 제외, `204` 응답.
- 에러 응답(401, 429, 500 포함)에도 CORS 헤더를 붙여야 합니다. 안 붙이면 프론트에서는 에러 코드를 못 읽고 `TypeError: Failed to fetch`만 보입니다.

### 1.2 인증 에러 (모든 엔드포인트 공통)

| 상황 | Status | code | 프론트 처리 |
|---|---|---|---|
| `Authorization` 헤더 없음, 또는 `Bearer ` 형식 아님 | 401 | `UNAUTHORIZED` | 로그인 유도 |
| 서명 불일치, 디코딩 실패, 필수 claim 누락 | 401 | `INVALID_TOKEN` | 로그인 유도 |
| `exp` 경과 (15분 만료) | 401 | `TOKEN_EXPIRED` | refresh(범위 밖) 후 원 요청 1회 재시도 |

```json
{
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Access token has expired.",
    "details": {}
  }
}
```

### 1.3 레이트 리밋

- 사용자(JWT `sub`)당 **분당 60회**. 고정 60초 윈도우 [ASSUMPTION].
- 집계 대상: 인증에 성공한 모든 요청(4개 엔드포인트 모두 1회로 카운트, merge도 1회). `OPTIONS`와 401로 끝난 요청은 사용자를 특정할 수 없으므로 사용자 카운트에 넣지 않음 [ASSUMPTION].
- 61번째 요청: `429 RATE_LIMITED`, `Retry-After: <초>` 헤더, 요청은 처리되지 않음(부분 반영 없음).

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 23
Content-Type: application/json; charset=utf-8
```
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit of 60 requests per minute exceeded.",
    "details": { "limit": 60, "windowSeconds": 60, "retryAfterSeconds": 23 }
  }
}
```

### 1.4 검사 순서 (에러 코드를 결정적으로 만들기 위함)

1. CORS / preflight → 2. 인증(401) → 3. 레이트 리밋(429) → 4. 요청 형식(400/413/415) → 5. slug 형식(400) → 6. 에이전트 존재 여부(422) → 7. 개수 한도(409)

여러 조건을 동시에 어기면 먼저 걸리는 쪽의 에러 하나만 반환합니다.

### 1.5 공통 서버 에러

| Status | code | 비고 |
|---|---|---|
| 404 | `NOT_FOUND` | 정의되지 않은 경로 |
| 405 | `METHOD_NOT_ALLOWED` | 정의된 경로, 지원하지 않는 메서드 |
| 500 | `INTERNAL_ERROR` | D1 오류 등. 쓰기 요청이면 반영되지 않았음을 보장(트랜잭션) |

---

## 2. 엔드포인트

### 요약표

| # | 메서드 | 경로 | 성공 | 엔드포인트 고유 에러 |
|---|---|---|---|---|
| 1 | GET | `/bookmarks` | 200 | (공통만) |
| 2 | PUT | `/bookmarks/{slug}` | 201 신규 / 200 이미 있음 | 400 `INVALID_SLUG`, 422 `AGENT_NOT_FOUND`, 409 `BOOKMARK_LIMIT_EXCEEDED` |
| 3 | DELETE | `/bookmarks/{slug}` | 204 | 400 `INVALID_SLUG` |
| 4 | POST | `/bookmarks/merge` | 200 | 400 `INVALID_REQUEST_BODY`, 400 `MERGE_TOO_MANY_ITEMS`, 413 `PAYLOAD_TOO_LARGE`, 415 `UNSUPPORTED_MEDIA_TYPE`, 409 `BOOKMARK_LIMIT_EXCEEDED` |

모든 엔드포인트에 공통 401(`UNAUTHORIZED` / `INVALID_TOKEN` / `TOKEN_EXPIRED`), 429 `RATE_LIMITED`, 500 `INTERNAL_ERROR`가 적용됩니다.

`Bookmark` 객체 (저장 필드는 이 두 개가 전부):

| 필드 | 타입 | 설명 |
|---|---|---|
| `slug` | string | 에이전트 slug |
| `createdAt` | string (ISO 8601 UTC) | 서버가 처음 저장한 시각. 이후 변경되지 않음 |

---

### 2.1 내 북마크 목록 조회: `GET /bookmarks`

**요청**: 파라미터, 바디 없음. 페이지네이션 없음. 최대 500개라서 한 번에 반환합니다.

**성공**: `200 OK`

- 정렬: `createdAt` 내림차순, 같으면 `slug` 오름차순 [ASSUMPTION]
- 북마크가 없으면 `"bookmarks": []`
- 저장 이후 카탈로그에서 빠진 에이전트의 slug도 그대로 반환합니다. 프론트는 모르는 slug를 표시에서 제외하거나 "삭제된 에이전트"로 처리해야 합니다 [ASSUMPTION]

**에러**: 공통(401, 429, 500)만.

**예시**

```http
GET /bookmarks HTTP/1.1
Host: api.agentarchive.dev
Origin: https://yohan-work.github.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
```json
{
  "bookmarks": [
    { "slug": "pr-review-agent", "createdAt": "2026-10-05T01:23:45.678Z" },
    { "slug": "bug-root-cause", "createdAt": "2026-10-04T09:10:11.000Z" },
    { "slug": "readme-writer", "createdAt": "2026-10-04T09:10:11.000Z" }
  ]
}
```

---

### 2.2 북마크 추가(단건): `PUT /bookmarks/{slug}`

같은 slug를 다시 추가해도 에러가 아니어야 하므로 멱등 메서드인 `PUT`을 씁니다 [ASSUMPTION: 메서드/경로 선택].

**요청**

| 위치 | 이름 | 규칙 |
|---|---|---|
| path | `slug` | `^[a-z0-9-]{3,64}$`, 빌드 시점 agents 목록(현재 100개)에 존재해야 함 |
| body | 없음 | 보내도 무시 |

**성공**

| 상황 | Status | 바디 |
|---|---|---|
| 새로 저장됨 | `201 Created` | `{ "bookmark": Bookmark }` |
| 이미 북마크돼 있음 (멱등) | `200 OK` | `{ "bookmark": Bookmark }`. `createdAt`은 **최초 저장 시각 유지**(갱신 안 함) |

프론트는 201과 200을 같은 성공으로 처리하면 됩니다.

**에러**

| 상황 | Status | code | details |
|---|---|---|---|
| slug 형식 위반 (대문자, 밑줄, 2자 이하, 65자 이상 등) | 400 | `INVALID_SLUG` | `{ "slug": "<받은 값>", "pattern": "^[a-z0-9-]{3,64}$" }` |
| 형식은 맞지만 agents 목록에 없음 | 422 | `AGENT_NOT_FOUND` | `{ "slug": "<받은 값>" }` |
| 이미 500개이고 새 slug 추가 시도 | 409 | `BOOKMARK_LIMIT_EXCEEDED` | `{ "limit": 500, "current": 500 }` |
| 공통 | 401 / 429 / 500 | 1장 참고 | |

한도 경계 규칙: 500개 상태에서 **이미 있는 slug**를 PUT하면 한도 검사 없이 `200`입니다(멱등이 한도보다 우선).

**예시: 신규 추가**

```http
PUT /bookmarks/pr-review-agent HTTP/1.1
Host: api.agentarchive.dev
Origin: https://yohan-work.github.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
```http
HTTP/1.1 201 Created
```
```json
{
  "bookmark": { "slug": "pr-review-agent", "createdAt": "2026-10-05T01:23:45.678Z" }
}
```

**예시: 같은 slug 재추가 (5분 뒤)**

```http
HTTP/1.1 200 OK
```
```json
{
  "bookmark": { "slug": "pr-review-agent", "createdAt": "2026-10-05T01:23:45.678Z" }
}
```

**예시: 형식 위반** (`PUT /bookmarks/PR_Review`)

```json
{
  "error": {
    "code": "INVALID_SLUG",
    "message": "Slug must match ^[a-z0-9-]{3,64}$.",
    "details": { "slug": "PR_Review", "pattern": "^[a-z0-9-]{3,64}$" }
  }
}
```

**예시: 없는 에이전트** (`PUT /bookmarks/does-not-exist`)

```json
{
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "No agent exists with slug 'does-not-exist'.",
    "details": { "slug": "does-not-exist" }
  }
}
```

**예시: 한도 초과**

```json
{
  "error": {
    "code": "BOOKMARK_LIMIT_EXCEEDED",
    "message": "Bookmark limit of 500 reached.",
    "details": { "limit": 500, "current": 500 }
  }
}
```

---

### 2.3 북마크 삭제(단건): `DELETE /bookmarks/{slug}`

**요청**

| 위치 | 이름 | 규칙 |
|---|---|---|
| path | `slug` | `^[a-z0-9-]{3,64}$` **형식만** 검사. agents 목록 존재 여부는 검사하지 않음 (카탈로그에서 빠진 에이전트의 북마크도 지울 수 있어야 하므로) |

**성공**: `204 No Content`, 바디 없음.

- 북마크가 없는 slug를 삭제해도 `204` (멱등 삭제) [ASSUMPTION]. 두 기기에서 동시에 지워도 둘 다 성공합니다.

**에러**

| 상황 | Status | code | details |
|---|---|---|---|
| slug 형식 위반 | 400 | `INVALID_SLUG` | `{ "slug": "<받은 값>", "pattern": "^[a-z0-9-]{3,64}$" }` |
| 공통 | 401 / 429 / 500 | 1장 참고 | |

**예시**

```http
DELETE /bookmarks/pr-review-agent HTTP/1.1
Host: api.agentarchive.dev
Origin: https://yohan-work.github.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
```http
HTTP/1.1 204 No Content
```

---

### 2.4 localStorage 병합 업로드: `POST /bookmarks/merge`

최초 로그인 직후 프론트가 `localStorage["agent-archive:bookmarks"]`(slug 문자열 배열)를 그대로 올리면, 서버가 기존 북마크와 합집합으로 병합합니다.

**요청**

```http
POST /bookmarks/merge HTTP/1.1
Host: api.agentarchive.dev
Origin: https://yohan-work.github.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```
```json
{
  "slugs": ["pr-review-agent", "readme-writer", "readme-writer", "Old_Agent", "removed-agent"]
}
```

| 필드 | 타입 | 규칙 |
|---|---|---|
| `slugs` | string[] | 필수. 배열 길이(중복 포함 원본 길이) 0~200. 모든 원소가 문자열이어야 함 |

**요청 단위 검증 (하나라도 어기면 전체 거부, 아무것도 저장 안 함)**

| 상황 | Status | code | details |
|---|---|---|---|
| `Content-Type`이 `application/json` 아님 | 415 | `UNSUPPORTED_MEDIA_TYPE` | `{ "expected": "application/json" }` |
| 바디가 32KB 초과 [ASSUMPTION: 200 × 64자 ≈ 13KB라 여유 있게] | 413 | `PAYLOAD_TOO_LARGE` | `{ "maxBytes": 32768 }` |
| JSON 파싱 실패, 객체 아님, `slugs` 없음/배열 아님, 문자열 아닌 원소 포함 | 400 | `INVALID_REQUEST_BODY` | `{ "field": "slugs[3]", "reason": "must be a string" }` |
| `slugs.length > 200` | 400 | `MERGE_TOO_MANY_ITEMS` | `{ "max": 200, "received": 237 }` |
| 병합 후 총 개수가 500 초과 | 409 | `BOOKMARK_LIMIT_EXCEEDED` | `{ "limit": 500, "current": 480, "toAdd": 35 }` |
| 공통 | 401 / 429 / 500 | 1장 참고 | |

**원소 단위 처리 (요청은 성공, 해당 원소만 건너뜀)**

localStorage 값은 오래됐거나 손으로 수정됐을 수 있으므로, 원소 하나 때문에 전체 병합을 막지 않습니다 [ASSUMPTION]. "존재하지 않는 slug는 저장 거부" 규칙은 **저장하지 않고 `skipped`로 보고**하는 방식으로 지킵니다.

| 원소 상태 | 처리 | `skipped[].reason` |
|---|---|---|
| slug 형식 위반 | 저장 안 함 | `INVALID_SLUG` |
| 형식은 맞지만 agents 목록에 없음 | 저장 안 함 | `AGENT_NOT_FOUND` |
| 요청 안에서 중복 | 한 번만 처리, 보고하지 않음 | (없음) |
| 서버에 이미 있음 | 그대로 둠, 기존 `createdAt` 유지 | (없음, `added`에 안 들어감) |
| 신규이고 유효 | 저장, `createdAt` = 병합 처리 시각(요청 내 모든 신규 항목이 같은 값) | (없음, `added`에 들어감) |

**성공**: `200 OK` (추가된 게 0개여도 200)

| 필드 | 타입 | 설명 |
|---|---|---|
| `added` | string[] | 이번 요청으로 새로 저장된 slug (요청 배열에서 처음 나온 순서) |
| `skipped` | `{ slug: string, reason: "INVALID_SLUG" \| "AGENT_NOT_FOUND" }[]` | 저장되지 않은 원소 (중복 제거 후) |
| `bookmarks` | Bookmark[] | 병합 후 전체 목록. 2.1과 같은 정렬. 프론트가 GET을 한 번 더 부르지 않아도 됨 |

**예시 응답** (서버에 원래 `bug-root-cause`, `pr-review-agent`가 있었던 경우)

```json
{
  "added": ["readme-writer"],
  "skipped": [
    { "slug": "Old_Agent", "reason": "INVALID_SLUG" },
    { "slug": "removed-agent", "reason": "AGENT_NOT_FOUND" }
  ],
  "bookmarks": [
    { "slug": "readme-writer", "createdAt": "2026-10-05T01:30:00.000Z" },
    { "slug": "pr-review-agent", "createdAt": "2026-10-05T01:23:45.678Z" },
    { "slug": "bug-root-cause", "createdAt": "2026-10-04T09:10:11.000Z" }
  ]
}
```

**예시: 200개 초과**

```json
{
  "error": {
    "code": "MERGE_TOO_MANY_ITEMS",
    "message": "At most 200 slugs can be merged per request.",
    "details": { "max": 200, "received": 237 }
  }
}
```

**예시: 병합 후 500 초과**

```json
{
  "error": {
    "code": "BOOKMARK_LIMIT_EXCEEDED",
    "message": "Merging would exceed the bookmark limit of 500.",
    "details": { "limit": 500, "current": 480, "toAdd": 35 }
  }
}
```

`toAdd`는 형식 오류, 없는 에이전트, 요청 내 중복, 이미 있는 항목을 모두 제외한 **실제 신규 개수**입니다. 그래서 409는 정말 새로 들어갈 게 넘칠 때만 납니다.

---

## 3. 동작 규칙

| 규칙 | 내용 |
|---|---|
| 멱등성 | PUT: 같은 slug 재추가 시 200, `createdAt` 불변. DELETE: 없는 북마크 삭제도 204. merge: 합집합이므로 같은 요청을 여러 번 보내도 결과 동일(두 번째부터 `added: []`). 네트워크 재시도가 안전함 |
| "최초 로그인" 판별 | 서버는 최초 여부를 추적하지 않음. 언제 merge를 호출할지는 프론트가 결정 [ASSUMPTION]. 멱등이라 중복 호출해도 해 없음 |
| 병합 규칙 | 서버 기존 + localStorage의 합집합. 서버에서 삭제는 절대 일어나지 않음(localStorage에 없는 서버 북마크도 유지). 기존 항목의 `createdAt`은 덮어쓰지 않음 |
| 사용자당 500개 | PUT: 새 slug로 501번째가 되면 409. merge: 신규 개수 기준 all-or-nothing 409 [ASSUMPTION, 미결 질문 2]. DELETE와 GET은 영향 없음 |
| merge 200개 | 원본 배열 길이 기준(중복 제거 전). 201개 이상이면 400 `MERGE_TOO_MANY_ITEMS`, 전체 거부 |
| slug 존재 검증 | PUT, merge: 검증함. DELETE: 형식만 검증. GET: 저장된 그대로 반환 |
| 정렬 | `createdAt` 내림차순, 동률이면 `slug` 오름차순. merge로 들어온 항목은 `createdAt`이 같아서 slug 알파벳순이 됨(localStorage 순서는 보존 안 됨) |
| 동시성 | 한도 검사와 insert는 반드시 원자적으로 처리해야 함. 두 기기에서 499개 상태로 동시에 PUT하면 501개가 되는 경쟁 조건을 막기 위함. 백엔드 참고: D1에 `UNIQUE(userId, slug)` + `INSERT ... ON CONFLICT DO NOTHING`, 한도는 `INSERT ... SELECT ... WHERE (SELECT COUNT(*) ...) < 500` 같은 단일 문장이나 `db.batch()` 트랜잭션으로 |
| 부분 실패 | 모든 쓰기는 전부 반영되거나 전혀 반영되지 않음. 500이면 아무것도 저장되지 않은 것으로 간주하고 재시도하면 됨 |

---

## 4. 리스크

1. **refresh 쿠키가 크로스 사이트임 (범위 밖이지만 기능 전체를 막을 수 있음).** 사이트는 `yohan-work.github.io`, API는 `agentarchive.dev`라 서로 다른 site입니다. httpOnly refresh 쿠키는 `SameSite=None; Secure` 서드파티 쿠키가 되고, Safari(ITP)와 Firefox는 기본적으로 차단하며 Chrome도 제한하는 쪽으로 가고 있습니다. 그러면 access token이 15분마다 만료될 때 refresh가 안 돼서 사용자가 계속 재로그인해야 합니다. refresh 계약서를 쓰기 전에 도메인 전략(예: 사이트를 `agentarchive.dev` 하위로 옮기기)을 결정해야 합니다.
2. **카탈로그 불일치.** API는 빌드 시점 agents 목록을 씁니다. 사이트에 새 에이전트가 먼저 배포되면 그 에이전트 북마크는 `422 AGENT_NOT_FOUND`가 됩니다. API를 먼저 배포하거나 같은 파이프라인에서 함께 배포해야 합니다.
3. **카탈로그에서 빠진 에이전트.** 기존 북마크에는 남아 GET으로 내려옵니다. 프론트가 모르는 slug에서 깨지지 않게 처리해야 합니다.
4. **레이트 리밋 구현.** Workers는 isolate가 여러 개라 메모리 카운터로는 사용자당 60회가 지켜지지 않습니다. D1, Durable Object, Workers Rate Limiting binding 중 하나가 필요하고, 방식에 따라 정확도가 다릅니다. 또 북마크 토글을 빠르게 연타하면 60회에 닿을 수 있으니 프론트에서 디바운스가 필요합니다.
5. **merge 후 localStorage 처리.** 병합 뒤 localStorage를 비울지, 로그인 상태에서는 무엇이 기준인지(서버 vs 로컬)는 이 계약서에서 정하지 않습니다. 정하지 않으면 로그아웃 후 다시 로그인했을 때 이미 삭제한 북마크가 merge로 되살아납니다.
6. **merge 항목의 순서 손실.** localStorage에는 시각이 없어서 병합된 항목들은 같은 `createdAt`을 갖고 slug 알파벳순으로 정렬됩니다.

---

## 5. 미결 질문 (착수 전 결정 필요)

1. **localStorage에 200개 넘게 있으면?** "최대 200개"가 요청 1건당 한도인지(프론트가 200개씩 나눠 여러 번 호출해도 되는지), 전체 업로드 한도인지(201번째부터는 버리는지)에 따라 프론트 로직이 달라집니다. 현재 초안은 요청당 한도로 쓰여 있습니다.
2. **merge 결과가 500을 넘으면?** 현재 초안은 전체 거부(409)입니다. 대안은 한도까지만 채우고 나머지를 `skipped`(reason `BOOKMARK_LIMIT_EXCEEDED`)로 돌려주는 것입니다. 이 경우 어떤 걸 먼저 채울지(요청 배열 순서?)도 정해야 합니다.
3. **로컬 개발 origin.** 프론트 개발자가 `http://localhost:3000`에서 이 API를 호출해야 하나요? 그렇다면 CORS 허용 origin에 추가할지, 별도 staging API를 둘지 정해야 합니다.

---

## 6. 다음 액션

| 담당 | 할 일 |
|---|---|
| 전원 | 미결 질문 1~3과 [ASSUMPTION] 항목 확인, 계약서 v1 확정 |
| 백엔드 | 1.4 검사 순서대로 미들웨어 구성(CORS → auth → rate limit), D1 스키마 `bookmarks(userId, slug, createdAt, UNIQUE(userId, slug))`, 에러 코드 상수 공유 |
| 백엔드 | agents 목록을 빌드 시점에 API 번들에 넣는 방법과 배포 순서 정하기(리스크 2) |
| 프론트 | 에러 `code` → en/ko 문구 매핑, `TOKEN_EXPIRED` 재시도 훅(refresh 연결 지점만 비워 두기), `bookmarks`에 모르는 slug가 와도 안 깨지게 처리 |
| 프론트 | merge 호출 시점과 이후 localStorage 처리 방식 결정(리스크 5) |
| 공동 | 이 문서의 예시 JSON으로 목(mock) 서버나 MSW 핸들러를 만들어 월요일부터 서로 기다리지 않게 하기 |
| 리드 | refresh 쿠키 도메인 전략 결정(리스크 1). 이번 범위는 아니지만 늦어지면 기능이 못 나감 |

---

## Suggested (not required)

- 경로에 `/v1` prefix를 붙여 나중에 깨지는 변경에 대비.
- 모든 응답에 `RateLimit-Limit` / `RateLimit-Remaining` / `RateLimit-Reset` 헤더를 붙여 프론트가 미리 속도를 늦출 수 있게 하기.
- 에러 `details`에 `requestId`를 넣어 Workers 로그와 대조하기 쉽게 하기.
- `GET /bookmarks`에 `ETag`를 붙여 기기 간 동기화 폴링 비용 줄이기.
