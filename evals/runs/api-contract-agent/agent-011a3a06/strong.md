# Agent Archive 북마크 동기화 API 계약서 (v1, 확정 후보)

범위: 북마크 목록 조회 / 단건 추가 / 단건 삭제 / 최초 로그인 병합 업로드.
범위 밖(이 문서에서 설계하지 않음): GitHub OAuth 로그인 흐름, refresh 토큰 발급·갱신, 로그아웃, 계정 삭제, 폴더/메모, 페이지네이션.

`[ASSUMPTION]` 표시는 요청에 명시되지 않아 제가 임의로 정한 값입니다. 월요일 전에 확인해 주세요. 확정이 필요한 3가지는 맨 아래 "미결 사항"에 있습니다.

---

## 1. 공통 규약

### 1.1 Base URL과 경로

| 항목 | 값 |
|---|---|
| Base URL | `https://api.agentarchive.dev` |
| 경로 접두사 | `/v1` `[ASSUMPTION]` (나중에 호환되지 않는 변경을 할 때를 대비) |
| 리소스 | `/v1/me/bookmarks`: 항상 토큰의 사용자 본인 것만 다룹니다. 경로에 user id가 들어가지 않으므로 다른 사용자의 북마크에 접근할 수 있는 경로 자체가 없습니다. |

### 1.2 인증

- 모든 엔드포인트(CORS preflight `OPTIONS` 제외)에 `Authorization: Bearer <accessToken>`이 필요합니다.
- access token은 서버가 발급한 JWT이고 유효 기간은 15분입니다. 서버는 서명과 `exp`를 검증하고, 사용자 식별자는 `sub` 클레임에서 가져옵니다 `[ASSUMPTION: 클레임 이름]`.
- 만료와 그 밖의 무효 토큰은 서로 다른 에러 코드로 구분합니다. 프론트가 "refresh 후 1회 재시도"와 "로그아웃 상태로 전환"을 코드만 보고 결정할 수 있게 하기 위해서입니다.

| 상황 | 상태 | `error.code` | 프론트 동작 |
|---|---|---|---|
| 헤더 없음, `Bearer ` 형식 아님, 서명 불일치, JWT 파싱 실패 | 401 | `UNAUTHENTICATED` | 로그아웃 상태로 전환(localStorage 모드) |
| `exp` 경과 | 401 | `TOKEN_EXPIRED` | refresh(범위 밖) 후 같은 요청 1회 재시도 |

### 1.3 요청/응답 헤더

| 헤더 | 규칙 |
|---|---|
| `Content-Type: application/json` | 본문이 있는 요청(`POST /merge`)에 필수. 응답은 본문이 있으면 항상 `application/json; charset=utf-8`. |
| `Cache-Control: no-store` | 모든 응답에 붙입니다 `[ASSUMPTION]`. 사용자별 데이터라 캐시되면 안 됩니다. |
| `Retry-After` | 429 응답에만. 정수 초. |

### 1.4 CORS

| 항목 | 값 |
|---|---|
| `Access-Control-Allow-Origin` | `https://yohan-work.github.io` (정확히 일치할 때만 반환. 와일드카드 `*` 사용 안 함) |
| `Access-Control-Allow-Methods` | `GET, PUT, DELETE, POST, OPTIONS` |
| `Access-Control-Allow-Headers` | `Authorization, Content-Type` |
| `Access-Control-Expose-Headers` | `Retry-After` (safelisted 헤더가 아니라서 이걸 빼면 프론트 JS에서 읽을 수 없습니다) |
| `Access-Control-Max-Age` | `86400` `[ASSUMPTION]` |
| `Access-Control-Allow-Credentials` | 이 4개 엔드포인트에는 보내지 않습니다. 토큰이 헤더로 오므로 쿠키가 필요 없고, 프론트는 `credentials: "omit"`(기본값 `same-origin`도 가능)으로 호출합니다. |
| `Vary` | `Origin` |

규칙:
- 허용되지 않은 origin: CORS 헤더 없이 정상 처리합니다. 브라우저가 응답을 차단합니다. 서버에서 별도 에러 코드를 주지는 않습니다.
- `OPTIONS` preflight: 인증과 레이트 리밋 없이 `204`를 반환합니다.
- 4xx/5xx(특히 401, 429) 응답에도 CORS 헤더가 반드시 붙어야 합니다. 빠지면 프론트는 에러 본문 대신 `TypeError: Failed to fetch`만 보게 됩니다. Hono에서는 CORS 미들웨어를 인증·레이트 리밋 미들웨어보다 먼저 등록하고, `onError`/`notFound` 핸들러 응답에도 헤더가 붙는지 확인해 주세요.
- 로컬 개발 origin(`http://localhost:3000`) 허용 여부는 미결 사항 3번입니다.

### 1.5 레이트 리밋

- 사용자(`sub`)당 **분당 60회**. 4개 엔드포인트가 한 버킷을 공유하고, `merge` 한 번도 1회로 셉니다.
- 윈도우: 고정 60초 윈도우 `[ASSUMPTION]`.
- 집계 대상: 인증을 통과한 모든 요청(4xx 응답 포함). 인증 실패(401)는 사용자를 식별할 수 없어 이 버킷에 넣지 않고, `OPTIONS`도 세지 않습니다.
- 초과 시:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json; charset=utf-8
Retry-After: 23
Access-Control-Allow-Origin: https://yohan-work.github.io
Access-Control-Expose-Headers: Retry-After
```
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "요청이 너무 많습니다. 23초 후에 다시 시도해 주세요.",
    "details": {
      "limit": 60,
      "windowSeconds": 60,
      "retryAfterSeconds": 23
    }
  }
}
```

- 프론트는 429를 받으면 `Retry-After`초 동안 같은 요청을 재시도하지 않습니다. 북마크 토글 UI는 낙관적 업데이트를 되돌리거나 대기열에 넣습니다(프론트 재량).

### 1.6 에러 포맷(팀 표준 그대로)

```json
{ "error": { "code": "STRING_CODE", "message": "사람이 읽는 문장", "details": {} } }
```

- `code`: 프론트가 분기하는 기준. 아래 표에 있는 값만 사용합니다.
- `message`: 사람이 읽는 한국어 문장 `[ASSUMPTION: 언어]`. 프론트는 이 값으로 분기하지 않습니다.
- `details`: 항상 객체입니다. 추가 정보가 없으면 `{}`를 보내고 생략하지 않습니다.

**공통 에러(모든 엔드포인트)**

| 상태 | `code` | 발생 조건 | `details` |
|---|---|---|---|
| 401 | `UNAUTHENTICATED` | 1.2 참고 | `{}` |
| 401 | `TOKEN_EXPIRED` | 1.2 참고 | `{}` |
| 404 | `NOT_FOUND` | 정의되지 않은 경로/메서드 | `{}` |
| 429 | `RATE_LIMITED` | 1.5 참고 | `{ "limit", "windowSeconds", "retryAfterSeconds" }` |
| 500 | `INTERNAL_ERROR` | 서버 오류 (D1 실패 등) | `{}` |

**검사 순서(모든 엔드포인트 공통)**: CORS → 인증(401) → 레이트 리밋(429) → 입력 검증(400) → 카탈로그 검사(422) → 상태 검사(409) → 처리.
그래서 한 요청이 여러 조건에 동시에 걸리면 앞선 에러 하나만 반환합니다.

### 1.7 네이밍과 데이터 형식

| 항목 | 규칙 |
|---|---|
| JSON 필드 | camelCase |
| 시간 | ISO 8601 UTC, 밀리초 포함, `Z` 접미사. 예: `2026-10-05T01:23:45.678Z` |
| slug 형식 | 정규식 `^[a-z0-9-]{3,64}$`. 대문자, 공백, 밑줄은 거부하며 **서버가 소문자로 정규화하지 않습니다** `[ASSUMPTION]`. `"Code-Review"`는 `INVALID_SLUG`입니다. |
| slug 존재 | 서버가 빌드 시점에 가진 agents 목록(현재 100개)에 있어야 추가할 수 있습니다. |

### 1.8 데이터 모델

북마크 = `{ slug, createdAt }` 두 필드뿐입니다.

```json
{ "slug": "pr-review-agent", "createdAt": "2026-10-05T01:23:45.678Z" }
```

백엔드 참고(D1): `bookmarks(user_id TEXT NOT NULL, slug TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (user_id, slug))`. 멱등성과 동시성 규칙(3절)은 이 기본키에 의존합니다.

---

## 2. 엔드포인트

### 요약표

| # | 메서드 | 경로 | 성공 | 엔드포인트 고유 에러 |
|---|---|---|---|---|
| 1 | `GET` | `/v1/me/bookmarks` | `200` | 없음(공통 에러만) |
| 2 | `PUT` | `/v1/me/bookmarks/{slug}` | `201` 새로 추가 / `200` 이미 있음 | `400 INVALID_SLUG`, `422 UNKNOWN_SLUG`, `409 BOOKMARK_LIMIT_REACHED` |
| 3 | `DELETE` | `/v1/me/bookmarks/{slug}` | `204` (있었든 없었든) | `400 INVALID_SLUG` |
| 4 | `POST` | `/v1/me/bookmarks/merge` | `200` | `400 INVALID_BODY`, `400 TOO_MANY_ITEMS` |

모든 엔드포인트는 1.6의 공통 에러(401 ×2, 404, 429, 500)도 반환할 수 있습니다.

단건 추가를 `POST /bookmarks` + body 대신 `PUT /bookmarks/{slug}`로 정한 이유: "같은 slug를 두 번 추가해도 에러 없이 멱등"이라는 결정이 PUT의 의미와 그대로 맞고, 본문이 없어 검증할 것이 경로 하나로 줄어듭니다.

---

### 2.1 내 북마크 목록 조회

`GET /v1/me/bookmarks`

**요청**
- 쿼리 파라미터 없음. 본문 없음.
- 페이지네이션 없음: 사용자당 최대 500개라 한 번에 전부 반환합니다.

**성공 `200 OK`**

| 필드 | 타입 | 설명 |
|---|---|---|
| `bookmarks` | `Bookmark[]` | 0~500개. 정렬: `createdAt` 내림차순(최신 먼저), 같으면 `slug` 오름차순. |

- 북마크가 없으면 `{ "bookmarks": [] }`입니다(404 아님).
- 저장된 뒤 카탈로그에서 사라진 slug도 **그대로 반환합니다** `[ASSUMPTION, 미결 사항 2]`. 프론트는 현재 agents 목록에 없는 slug를 화면에서 숨깁니다.

**에러**: 공통 에러만.

**예시**

```http
GET /v1/me/bookmarks HTTP/1.1
Host: api.agentarchive.dev
Origin: https://yohan-work.github.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJnaDoxMjM0NTYiLCJleHAiOjE3OTE0MzY4MjV9.sig
```

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Cache-Control: no-store
Access-Control-Allow-Origin: https://yohan-work.github.io
```
```json
{
  "bookmarks": [
    { "slug": "pr-review-agent", "createdAt": "2026-10-05T01:23:45.678Z" },
    { "slug": "bug-root-cause-agent", "createdAt": "2026-10-04T09:10:11.000Z" },
    { "slug": "readme-writer", "createdAt": "2026-10-04T09:10:11.000Z" }
  ]
}
```

(두 번째와 세 번째는 `createdAt`이 같아서 `slug` 오름차순으로 정렬됐습니다. 보통 같은 병합 요청으로 들어온 경우입니다.)

---

### 2.2 북마크 추가(단건, 멱등)

`PUT /v1/me/bookmarks/{slug}`

**요청**

| 위치 | 이름 | 규칙 |
|---|---|---|
| path | `slug` | `^[a-z0-9-]{3,64}$` + 카탈로그에 존재 |
| body | 없음 | 본문을 보내도 무시합니다 |

**처리 순서**: 형식 검사 → 카탈로그 검사 → 이미 있는지 확인 → 개수 한도 검사 → 삽입.
이미 있는지를 한도보다 먼저 확인하므로, 500개가 꽉 찬 상태에서도 **이미 있는 slug를 다시 추가하면 `200`**입니다(`409` 아님).

**성공**

| 상태 | 조건 | 본문 |
|---|---|---|
| `201 Created` | 새로 저장됨. `createdAt` = 서버 현재 시각 | `{ "bookmark": Bookmark }` |
| `200 OK` | 이미 있었음. 아무것도 바꾸지 않고, **기존 `createdAt`을 유지**해서 반환 | `{ "bookmark": Bookmark }` |

프론트는 201과 200을 같은 성공으로 처리하면 됩니다. 구분은 로그와 디버깅용입니다.

**에러**

| 상태 | `code` | 조건 | `details` |
|---|---|---|---|
| 400 | `INVALID_SLUG` | 형식 위반(길이, 대문자, 허용되지 않는 문자) | `{ "slug": "<받은 값>", "pattern": "^[a-z0-9-]{3,64}$" }` |
| 422 | `UNKNOWN_SLUG` | 형식은 맞지만 카탈로그에 없음 | `{ "slug": "<받은 값>" }` |
| 409 | `BOOKMARK_LIMIT_REACHED` | 새 slug인데 이미 500개 | `{ "limit": 500, "current": 500 }` |
| + 공통 | | | |

**예시: 새로 추가 (201)**

```http
PUT /v1/me/bookmarks/pr-review-agent HTTP/1.1
Host: api.agentarchive.dev
Origin: https://yohan-work.github.io
Authorization: Bearer eyJhbGciOi...
```
```http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
```
```json
{
  "bookmark": { "slug": "pr-review-agent", "createdAt": "2026-10-05T01:23:45.678Z" }
}
```

**예시: 같은 요청 반복 (200, createdAt 그대로)**

```json
{
  "bookmark": { "slug": "pr-review-agent", "createdAt": "2026-10-05T01:23:45.678Z" }
}
```

**예시: 형식 위반 (400)**. `PUT /v1/me/bookmarks/PR_Review`

```json
{
  "error": {
    "code": "INVALID_SLUG",
    "message": "slug는 소문자 영문, 숫자, 하이픈으로 된 3~64자여야 합니다.",
    "details": { "slug": "PR_Review", "pattern": "^[a-z0-9-]{3,64}$" }
  }
}
```

**예시: 카탈로그에 없음 (422)**. `PUT /v1/me/bookmarks/not-a-real-agent`

```json
{
  "error": {
    "code": "UNKNOWN_SLUG",
    "message": "존재하지 않는 에이전트입니다.",
    "details": { "slug": "not-a-real-agent" }
  }
}
```

**예시: 한도 초과 (409)**

```json
{
  "error": {
    "code": "BOOKMARK_LIMIT_REACHED",
    "message": "북마크는 최대 500개까지 저장할 수 있습니다.",
    "details": { "limit": 500, "current": 500 }
  }
}
```

---

### 2.3 북마크 삭제(단건, 멱등)

`DELETE /v1/me/bookmarks/{slug}`

**요청**

| 위치 | 이름 | 규칙 |
|---|---|---|
| path | `slug` | `^[a-z0-9-]{3,64}$`만 검사합니다. **카탈로그 존재 여부는 검사하지 않습니다.** 카탈로그에서 빠진 에이전트의 북마크도 지울 수 있어야 하기 때문입니다. |

**성공 `204 No Content`**: 본문 없음. 삭제했든 원래 없었든 같은 응답입니다(멱등). 404를 쓰지 않는 이유는 여러 기기에서 동시에 지울 때 프론트가 에러를 처리하지 않아도 되게 하기 위해서입니다.

**에러**

| 상태 | `code` | 조건 | `details` |
|---|---|---|---|
| 400 | `INVALID_SLUG` | 형식 위반 | `{ "slug": "<받은 값>", "pattern": "^[a-z0-9-]{3,64}$" }` |
| + 공통 | | | |

**예시**

```http
DELETE /v1/me/bookmarks/pr-review-agent HTTP/1.1
Host: api.agentarchive.dev
Origin: https://yohan-work.github.io
Authorization: Bearer eyJhbGciOi...
```
```http
HTTP/1.1 204 No Content
Cache-Control: no-store
Access-Control-Allow-Origin: https://yohan-work.github.io
```

---

### 2.4 localStorage 북마크 병합 업로드

`POST /v1/me/bookmarks/merge`

**요청**

```http
Content-Type: application/json
```

| 필드 | 타입 | 규칙 |
|---|---|---|
| `slugs` | `string[]` | 필수. 길이 0~200(**중복 제거 전 원본 길이** 기준). 모든 원소는 문자열. localStorage `agent-archive:bookmarks` 값을 그대로 보냅니다. |

**요청 전체를 거부하는 경우(아무것도 저장하지 않음)**

| 상태 | `code` | 조건 | `details` |
|---|---|---|---|
| 400 | `INVALID_BODY` | JSON 파싱 실패, `slugs` 없음, 배열 아님, 문자열이 아닌 원소 있음, `Content-Type` 누락 | `{ "reason": "<파싱 실패 요약>" }` |
| 400 | `TOO_MANY_ITEMS` | `slugs.length > 200` | `{ "field": "slugs", "max": 200, "received": 250 }` |
| + 공통 | | | |

**원소 단위 처리 (요청은 성공하고 결과로 보고함)**: 3.3 병합 규칙을 참고하세요.

**성공 `200 OK`**

| 필드 | 타입 | 설명 |
|---|---|---|
| `added` | `string[]` | 이번에 새로 저장된 slug. 요청 배열 순서 유지. |
| `alreadyPresent` | `string[]` | 서버에 이미 있어서 건드리지 않은 slug. 요청 순서 유지. |
| `skipped` | `{ slug: string, reason: string }[]` | 저장하지 않은 slug와 이유. `reason` ∈ `INVALID_SLUG`, `UNKNOWN_SLUG`, `BOOKMARK_LIMIT_REACHED`. |
| `bookmarks` | `Bookmark[]` | 병합 후 서버의 전체 목록(2.1과 같은 정렬). 프론트가 GET을 다시 호출하지 않아도 됩니다. |

항상 성립하는 조건: `added` ∪ `alreadyPresent` ∪ `skipped[].slug` = 중복 제거된 요청 `slugs`이고, 세 목록은 서로 겹치지 않습니다.

**예시**

상황: 서버에 이미 `pr-review-agent` 1개가 있고, localStorage에는 5개(중복 1개, 대문자 1개, 삭제된 에이전트 1개 포함)가 있습니다.

```http
POST /v1/me/bookmarks/merge HTTP/1.1
Host: api.agentarchive.dev
Origin: https://yohan-work.github.io
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json
```
```json
{
  "slugs": [
    "pr-review-agent",
    "readme-writer",
    "readme-writer",
    "Design-QA",
    "old-deprecated-agent"
  ]
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Cache-Control: no-store
```
```json
{
  "added": ["readme-writer"],
  "alreadyPresent": ["pr-review-agent"],
  "skipped": [
    { "slug": "Design-QA", "reason": "INVALID_SLUG" },
    { "slug": "old-deprecated-agent", "reason": "UNKNOWN_SLUG" }
  ],
  "bookmarks": [
    { "slug": "readme-writer", "createdAt": "2026-10-05T02:00:00.000Z" },
    { "slug": "pr-review-agent", "createdAt": "2026-10-05T01:23:45.678Z" }
  ]
}
```

**예시: 201개 전송 (400)**

```json
{
  "error": {
    "code": "TOO_MANY_ITEMS",
    "message": "한 번에 최대 200개까지 병합할 수 있습니다.",
    "details": { "field": "slugs", "max": 200, "received": 201 }
  }
}
```

**예시: 빈 배열**. `{ "slugs": [] }`를 보내면 `200`과 함께 `added`, `alreadyPresent`, `skipped`가 모두 `[]`이고 `bookmarks`에는 현재 목록이 옵니다. 에러가 아닙니다.

---

## 3. 동작 규칙

### 3.1 멱등성

| 엔드포인트 | 반복 호출 결과 |
|---|---|
| `GET` | 부수 효과 없음 |
| `PUT /{slug}` | 처음 호출은 `201`, 이후는 `200`. `createdAt`은 처음 값에서 바뀌지 않습니다. |
| `DELETE /{slug}` | 항상 `204` |
| `POST /merge` | 같은 본문으로 다시 보내면 두 번째 결과는 `added: []`이고 앞에서 추가된 것은 `alreadyPresent`에 들어갑니다. 저장 상태는 같으므로 **네트워크 실패 시 그대로 재시도해도 안전**합니다. |

- merge는 "최초 로그인 시"에만 호출하는 것이 프론트의 규칙이고, **서버는 호출 횟수를 제한하지 않습니다**. 기기마다 localStorage가 다르므로 기기별 첫 로그인마다 한 번씩 호출되는 것이 정상입니다.

### 3.2 개수 한도(사용자당 500개)

| 상황 | 결과 |
|---|---|
| `PUT` 새 slug, 현재 < 500 | `201` |
| `PUT` 새 slug, 현재 = 500 | `409 BOOKMARK_LIMIT_REACHED`, `details: { "limit": 500, "current": 500 }` |
| `PUT` 이미 있는 slug, 현재 = 500 | `200` (한도와 무관) |
| `merge`로 새 slug가 남은 칸보다 많음 | 남은 칸만큼 **요청 배열 순서대로** 추가하고, 나머지는 `skipped`에 `reason: "BOOKMARK_LIMIT_REACHED"`로 넣습니다. 요청은 `200`입니다. `[ASSUMPTION, 미결 사항 1]` |
| `DELETE`, `GET` | 한도와 무관 |

동시성: 한도 검사와 삽입은 원자적으로 처리해야 합니다. 499개인 상태에서 두 기기가 동시에 `PUT`을 보내도 501개가 되면 안 됩니다. D1에서는 조건부 삽입 하나로 처리하세요.
예: `INSERT INTO bookmarks (...) SELECT ?, ?, ? WHERE (SELECT COUNT(*) FROM bookmarks WHERE user_id = ?) < 500 ON CONFLICT DO NOTHING`. 영향받은 행이 0이면 "이미 있음"인지 "한도 초과"인지 다시 조회해서 구분합니다.

### 3.3 병합 규칙(merge)

원소마다 아래 순서로 판정합니다.

1. **중복 제거**: 요청 안에서 같은 slug는 첫 번째만 남깁니다. 중복은 `skipped`에 넣지 않습니다.
2. **형식 검사**: `^[a-z0-9-]{3,64}$`에 맞지 않으면 → `skipped` (`INVALID_SLUG`). 정규화하지 않습니다.
3. **카탈로그 검사**: 없으면 → `skipped` (`UNKNOWN_SLUG`).
4. **서버에 이미 있음** → `alreadyPresent`. 기존 `createdAt`을 유지합니다(서버 데이터 우선, 덮어쓰지 않음).
5. **남은 칸 있음** → `added`. `createdAt` = 요청 처리 시각이고, 이번 요청에서 추가된 것은 모두 같은 값입니다. localStorage에는 시각 정보가 없기 때문입니다.
6. **남은 칸 없음** → `skipped` (`BOOKMARK_LIMIT_REACHED`).

- **병합은 합집합만 합니다.** 서버에 있지만 요청에 없는 북마크는 삭제하지 않습니다.
- 잘못된 원소가 있어도 요청 전체를 거부하지 않는 이유: localStorage에는 이름이 바뀌었거나 삭제된 에이전트의 slug가 남아 있을 수 있고, 그 하나 때문에 나머지 북마크까지 동기화에 실패하면 안 되기 때문입니다.
- 원자성: 저장은 하나의 D1 `batch()`(트랜잭션)로 수행합니다. 500 에러가 나면 아무것도 저장되지 않은 상태이고, 3.1에 따라 재시도하면 됩니다.
- 프론트 권장 흐름: 로그인 → `merge` 성공 → 응답 `bookmarks`로 화면 상태를 교체합니다. localStorage 처리(비우기 또는 캐시로 유지)는 프론트가 결정하지만, merge가 성공한 **뒤에만** 손대야 합니다.

### 3.4 정렬

`GET` 결과와 `merge` 응답의 `bookmarks`는 `createdAt` 내림차순이고, 같으면 `slug` 오름차순입니다. 같은 merge로 들어온 북마크는 알파벳순으로 나열됩니다.

### 3.5 카탈로그(현재 100개)와 slug 검사

| 동작 | 카탈로그 검사 |
|---|---|
| `PUT` | 함 (`422 UNKNOWN_SLUG`) |
| `merge` | 함 (`skipped: UNKNOWN_SLUG`) |
| `DELETE` | 안 함 |
| `GET` | 안 함 (저장된 것을 그대로 반환) |

### 3.6 레이트 리밋에 걸렸을 때

모든 엔드포인트에 같은 규칙이 적용됩니다. `429 RATE_LIMITED` + `Retry-After`를 반환하고, 요청은 처리하지 않습니다(merge도 아무것도 저장하지 않음).

---

## 4. 리스크

1. **카탈로그 동기화(가장 큼)**: API 서버는 빌드 시점 agents 목록으로 slug를 검사합니다. 사이트에 새 에이전트가 먼저 배포되고 API가 그대로면, 사용자가 새 에이전트를 북마크할 때 `422 UNKNOWN_SLUG`를 받습니다. 배포 순서를 **API 먼저, 사이트 나중**으로 정하거나 두 배포를 같은 CI 파이프라인에 묶어야 합니다.
2. **refresh 쿠키가 서드파티 쿠키가 됨(범위 밖이지만 이 설계에 영향)**: `yohan-work.github.io`와 `api.agentarchive.dev`는 서로 다른 사이트입니다. httpOnly refresh 쿠키는 `SameSite=None; Secure`여야 하고, Safari ITP나 서드파티 쿠키 차단 환경에서는 전송되지 않을 수 있습니다. 그러면 15분마다 `TOKEN_EXPIRED` 후 refresh가 실패해 사실상 로그아웃됩니다. refresh 계약서를 쓰기 전에 검증해야 합니다. 그 엔드포인트에는 `Access-Control-Allow-Credentials: true`도 필요합니다.
3. **Workers에서의 레이트 리밋 정확도**: KV는 최종 일관성이라 분당 60회를 정확히 세지 못합니다. Durable Object나 Cloudflare Rate Limiting 바인딩을 써야 "사용자당"이 지켜집니다. D1에 카운터를 두면 모든 요청마다 쓰기가 발생합니다.
4. **500개 한도는 현재 도달할 수 없음**: 카탈로그가 100개라 실제 데이터로는 409 경로를 테스트할 수 없습니다. 백엔드는 한도와 카탈로그를 주입할 수 있게 만들고 테스트 fixture로 검증해야 합니다. merge의 200개 상한도 마찬가지입니다(현재 유효한 slug는 최대 100개).
5. **에러 응답의 CORS 누락**: 1.4에 적은 대로, 401/429/500에 CORS 헤더가 빠지면 프론트가 에러 코드를 읽지 못합니다. 실제로 흔히 생기는 버그입니다.
6. **낙관적 업데이트와 429**: 빠르게 토글을 반복하면 분당 60회에 도달할 수 있습니다. 프론트에서 디바운스하는 것이 안전합니다.

## 5. 다음 액션

| 담당 | 할 일 | 기한 |
|---|---|---|
| 결정권자 | 아래 미결 사항 3개 확정 | 금요일 |
| 백엔드 | D1 스키마(1.8), CORS → 인증 → 레이트 리밋 미들웨어 순서, 에러 envelope 헬퍼, `onError`/`notFound` JSON화 | 월요일 착수 |
| 백엔드 | 카탈로그 slug 목록을 빌드 산출물에서 주입하는 방식과 배포 순서(리스크 1) 결정 | 월요일 |
| 프론트 | 이 문서의 예시 JSON으로 목(mock) 서버 구성, 에러 코드별 분기(`TOKEN_EXPIRED` 재시도 1회, `RATE_LIMITED` 대기) | 월요일 착수 |
| 프론트+백엔드 | refresh 쿠키 크로스사이트 동작 PoC(리스크 2). 이번 범위 밖이지만 로그인 기능 전체를 좌우합니다. | 다음 주 중 |
| 공통 | 계약 테스트: 이 문서의 예시 요청/응답을 그대로 테스트 케이스로 사용 | 다음 주 |

## 6. 미결 사항(구현을 막는 것만)

1. **merge에서 한도를 넘을 때**: 이 문서는 "배열 순서대로 채우고 나머지는 `skipped`"(부분 성공, 200)로 정했습니다. 대신 "전부 거부(409, 아무것도 저장 안 함)"를 원하시나요? 프론트의 결과 처리 UI가 달라집니다.
2. **카탈로그에서 사라진 slug가 목록에 남는 문제**: `GET`이 그대로 반환하고 프론트가 숨기는 방식(이 문서의 가정)으로 할까요, 아니면 서버가 응답에서 걸러낼까요? 서버에서 거르면 사용자가 그 북마크를 지울 방법이 없어집니다.
3. **추가 CORS origin**: 로컬 개발(`http://localhost:3000`)이나 프리뷰 환경 origin을 허용할까요? 운영 API에 localhost를 허용할지, 별도 개발용 API를 둘지 정해야 프론트가 월요일부터 실제 서버에 붙을 수 있습니다.

## Suggested (not required)

- `RateLimit-Limit` / `RateLimit-Remaining` / `RateLimit-Reset` 응답 헤더를 두면 프론트가 429 전에 속도를 줄일 수 있습니다.
- merge에서 `createdAt`을 요청 순서대로 1ms씩 다르게 부여하면 localStorage의 순서를 보존할 수 있습니다.
- 401 응답에 `WWW-Authenticate: Bearer error="invalid_token"` 헤더를 추가하면 표준에 맞습니다.
- 이 문서를 OpenAPI 3.1 YAML로 옮겨 Hono(`@hono/zod-openapi`)와 프론트 타입 생성에 함께 쓸 수 있습니다.
