# 북마크 동기화 API 계약서 v1 (초안 → 월요일 전 확정용)

주신 결정 사항만으로 계약을 확정할 수 있어서 추가 질문 없이 작성했습니다. 제가 정한 부분은 각 절의 **[가정]**과 맨 끝 "확정 필요 항목"에 모아 두었으니, 거기만 검토하고 동의하시면 됩니다.

---

## 0. 한눈에 보기

| # | 기능 | 메서드 | 경로 | 성공 응답 |
|---|------|--------|------|-----------|
| 1 | 내 북마크 목록 | `GET` | `/v1/me/bookmarks` | `200` |
| 2 | 북마크 추가(단건, 멱등) | `PUT` | `/v1/me/bookmarks/{slug}` | `201` 새로 생성 / `200` 이미 있음 |
| 3 | 북마크 삭제(단건, 멱등) | `DELETE` | `/v1/me/bookmarks/{slug}` | `204` |
| 4 | localStorage 병합 업로드 | `POST` | `/v1/me/bookmarks/merge` | `200` |

- Base URL: `https://api.agentarchive.dev`
- 모든 엔드포인트에 인증 필요(`Authorization: Bearer <JWT>`)
- 요청·응답 본문: `application/json; charset=utf-8`, camelCase
- 시간: ISO 8601 UTC, 밀리초 포함, `Z` 접미사 (예: `2026-10-05T09:12:33.120Z`)

**추가를 `POST`가 아니라 `PUT /{slug}`로 한 이유:** "같은 slug를 두 번 추가해도 멱등"이라는 결정과 HTTP 의미가 그대로 맞습니다. 클라이언트가 재시도해도 안전하고, 요청 본문이 필요 없어서 프론트 코드도 단순해집니다.

**`/merge` 경로와 slug 충돌:** `merge`는 slug 규칙상 유효한 문자열입니다. 다만 `/merge`는 `POST`로만, `/{slug}`는 `PUT`/`DELETE`로만 라우팅되므로 메서드가 겹치지 않아 충돌은 없습니다. 백엔드는 `POST /v1/me/bookmarks/:slug` 라우트를 만들지 않으면 됩니다.

---

## 1. 공통 규약

### 1.1 slug 검증

- 정규식: `^[a-z0-9-]{3,64}$`
- 검증 순서: ① 형식 → ② 카탈로그 존재 여부(서버에 내장된 빌드 시점 agents 목록)
- 형식 오류는 `400 INVALID_SLUG`, 형식은 맞는데 카탈로그에 없으면 `422 UNKNOWN_AGENT`
- **[가정]** 대문자가 섞인 slug를 소문자로 바꿔 받아 주지 않고 그대로 거부합니다. 정규화는 클라이언트 책임입니다.

### 1.2 에러 포맷(팀 표준)

```json
{
  "error": {
    "code": "UNKNOWN_AGENT",
    "message": "존재하지 않는 에이전트입니다: code-reviewr",
    "details": { "slug": "code-reviewr" }
  }
}
```

- `details`는 항상 객체입니다(내용이 없으면 `{}`). `null`이나 생략은 쓰지 않습니다.
- `message`는 디버깅용 문장입니다. **프론트는 `message`로 분기하지 말고 `code`로 분기**합니다. 사용자에게 보여 줄 문구는 프론트 i18n(en/ko)에서 `code`에 맞춰 매핑합니다.
- 모든 응답에 `X-Request-Id` 헤더를 넣습니다. 버그를 제보할 때 이 값을 함께 전달합니다.

### 1.3 공통 에러 코드

| HTTP | code | 언제 | `details` | 프론트 처리 |
|------|------|------|-----------|-------------|
| 400 | `VALIDATION_FAILED` | JSON 파싱 실패, 필드 누락/타입 오류 | `{ "field": "slugs", "reason": "must be an array" }` | 버그로 간주, 로깅 |
| 400 | `INVALID_SLUG` | slug 형식 위반 | `{ "slug": "Bad_Slug", "pattern": "^[a-z0-9-]{3,64}$" }` | 버그로 간주, 로깅 |
| 401 | `UNAUTHENTICATED` | 헤더 없음, 서명 불일치, 형식 오류 | `{}` | 로그아웃 상태로 전환 |
| 401 | `TOKEN_EXPIRED` | JWT `exp` 경과 | `{ "expiredAt": "..." }` | refresh 후 **1회만** 재시도 |
| 404 | `NOT_FOUND` | 정의되지 않은 경로 | `{}` | 버그 |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | 본문이 있는 요청인데 JSON이 아님 | `{}` | 버그 |
| 429 | `RATE_LIMITED` | 분당 60회 초과 | `{ "limit": 60, "windowSeconds": 60, "retryAfterSeconds": 17 }` | `Retry-After`만큼 대기 |
| 500 | `INTERNAL_ERROR` | 서버 오류 | `{}` | 토스트 + 롤백 |
| 503 | `SERVICE_UNAVAILABLE` | D1 장애 등 | `{}` | 토스트 + 롤백 |

- 401 응답에는 `WWW-Authenticate: Bearer error="invalid_token"` 헤더를 붙입니다.
- `TOKEN_EXPIRED`와 `UNAUTHENTICATED`를 구분하는 이유: 프론트가 "refresh를 시도할지, 바로 로그아웃시킬지"를 판단해야 하기 때문입니다.

---

## 2. 엔드포인트 상세

### 2.1 `GET /v1/me/bookmarks` — 내 북마크 목록

**요청**: 본문 없음. 쿼리 파라미터 없음.

**[가정] 페이지네이션 없음.** 상한이 500건이고 항목당 약 80바이트라서 최대 40KB 정도입니다. 커서 페이지네이션은 복잡도만 늘립니다.

**정렬**: `createdAt` 내림차순(최신 먼저). 같은 시각이면 `slug` 오름차순.

**200 응답**

```json
{
  "bookmarks": [
    { "slug": "pr-review-agent", "createdAt": "2026-10-05T09:12:33.120Z" },
    { "slug": "bug-root-cause", "createdAt": "2026-10-04T22:01:07.004Z" }
  ],
  "count": 2,
  "limit": 500
}
```

- 북마크가 없으면 `"bookmarks": []`, `"count": 0`입니다(404가 아님).
- 헤더: `Cache-Control: no-store`. 개인 데이터라서 CDN이나 브라우저가 캐시하면 안 됩니다.
- **카탈로그에서 사라진 slug**(에이전트 삭제·이름 변경)도 목록에 그대로 포함합니다. 프론트는 로컬 agents 데이터에 없는 slug를 화면에서 숨깁니다. 서버가 조용히 걸러 내면 사용자가 그 북마크를 지울 수 없게 되고, 500건 한도만 계속 차지하게 됩니다.

**에러**: 401, 429, 500/503 (공통)

---

### 2.2 `PUT /v1/me/bookmarks/{slug}` — 북마크 추가(멱등)

**요청**: 본문 없음. `Content-Type`도 필요 없습니다.

**처리 순서**
1. 인증 확인
2. slug 형식 검증 → 실패 시 `400 INVALID_SLUG`
3. 카탈로그 존재 확인 → 실패 시 `422 UNKNOWN_AGENT`
4. 이미 있으면 → `200`, 기존 `createdAt` 그대로 반환(**한도 검사보다 먼저** 합니다. 500건이 찬 상태에서 이미 있는 slug를 다시 추가해도 에러가 나지 않아야 멱등이기 때문입니다.)
5. 500건 도달 상태면 → `409 BOOKMARK_LIMIT_EXCEEDED`
6. 저장 → `201`

**201 응답 (새로 생성)**

```json
{
  "bookmark": { "slug": "pr-review-agent", "createdAt": "2026-10-05T09:12:33.120Z" },
  "created": true
}
```

**200 응답 (이미 있음)**

```json
{
  "bookmark": { "slug": "pr-review-agent", "createdAt": "2026-09-28T03:40:11.502Z" },
  "created": false
}
```

프론트는 201과 200을 같은 성공으로 처리하면 됩니다. `created`는 로깅·분석용입니다.

**엔드포인트 전용 에러**

| HTTP | code | `details` 예시 |
|------|------|----------------|
| 400 | `INVALID_SLUG` | `{ "slug": "PR_Review", "pattern": "^[a-z0-9-]{3,64}$" }` |
| 422 | `UNKNOWN_AGENT` | `{ "slug": "code-reviewr" }` |
| 409 | `BOOKMARK_LIMIT_EXCEEDED` | `{ "limit": 500, "current": 500 }` |

```json
{
  "error": {
    "code": "BOOKMARK_LIMIT_EXCEEDED",
    "message": "북마크는 최대 500개까지 저장할 수 있습니다.",
    "details": { "limit": 500, "current": 500 }
  }
}
```

**[가정] 존재하지 않는 slug에 404가 아니라 422를 쓰는 이유:** 404는 "경로가 없음"과 헷갈립니다. 요청 형식은 맞지만 의미상 처리할 수 없는 경우라서 422가 맞습니다.

---

### 2.3 `DELETE /v1/me/bookmarks/{slug}` — 북마크 삭제(멱등)

**요청**: 본문 없음.

**처리**
- slug 형식이 틀리면 `400 INVALID_SLUG`
- 형식만 맞으면 **카탈로그 존재 여부는 검사하지 않습니다.** 카탈로그에서 빠진 에이전트의 북마크도 지울 수 있어야 하기 때문입니다.
- 북마크가 있든 없든 `204 No Content`(본문 없음)

**[가정] 없는 북마크를 지워도 404가 아니라 204:** 추가를 멱등으로 만들었으니 삭제도 맞춥니다. 두 기기에서 동시에 지우거나, 네트워크 재시도로 두 번 지워도 에러가 나지 않습니다.

**에러**: 400 `INVALID_SLUG`, 401, 429, 500/503

---

### 2.4 `POST /v1/me/bookmarks/merge` — localStorage 병합 업로드

**요청**

```http
POST /v1/me/bookmarks/merge
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json

{
  "slugs": ["pr-review-agent", "bug-root-cause", "pr-review-agent", "Old_Agent", "deleted-agent"]
}
```

- `slugs`: 문자열 배열, **1~200개**. localStorage 값(`agent-archive:bookmarks`)을 그대로 넣으면 됩니다.
- 요청 본문 상한 32KB(200 × 64자 + 여유분). 초과 시 `400 VALIDATION_FAILED`.

**병합 규칙**

| # | 규칙 |
|---|------|
| M1 | **합집합.** 서버 북마크는 절대 삭제하지 않습니다. 병합은 추가만 합니다. |
| M2 | 요청 안의 중복 slug는 서버가 먼저 제거합니다(첫 등장만 인정). 에러가 아닙니다. |
| M3 | 형식 위반(`INVALID_SLUG`)이나 카탈로그에 없는 slug(`UNKNOWN_AGENT`)는 **그 항목만 건너뛰고** 나머지는 저장합니다. 요청 전체를 실패시키지 않습니다. |
| M4 | 서버에 이미 있는 slug는 기존 `createdAt`을 유지합니다. |
| M5 | 새로 추가되는 slug의 `createdAt`은 서버 현재 시각입니다. localStorage에는 시각 정보가 없기 때문입니다. **[가정]** 요청 배열 순서를 보존하려고 첫 항목부터 1ms씩 빼서 부여합니다(첫 항목이 가장 최신). localStorage 배열 순서를 신뢰할 수 없다면 모두 같은 시각으로 둬도 됩니다. 이 경우 정렬은 slug 오름차순 타이브레이크로 결정됩니다. |
| M6 | 500건 한도에 닿으면 배열 순서대로 채우다가, 남은 항목은 `LIMIT_REACHED`로 건너뜁니다(부분 성공). |
| M7 | **멱등.** 같은 요청을 다시 보내면 `added: []`이고 서버 상태도 바뀌지 않습니다. 네트워크 실패 후 재시도해도 안전합니다. |
| M8 | 병합 전체가 한 트랜잭션(D1 batch)으로 처리됩니다. 중간에 실패하면 아무것도 저장되지 않고 `500`을 반환합니다. |

**200 응답**

```json
{
  "added": ["bug-root-cause"],
  "alreadyPresent": ["pr-review-agent"],
  "skipped": [
    { "slug": "Old_Agent", "reason": "INVALID_SLUG" },
    { "slug": "deleted-agent", "reason": "UNKNOWN_AGENT" }
  ],
  "bookmarks": [
    { "slug": "bug-root-cause", "createdAt": "2026-10-05T09:15:00.000Z" },
    { "slug": "pr-review-agent", "createdAt": "2026-09-28T03:40:11.502Z" }
  ],
  "count": 2,
  "limit": 500
}
```

- `bookmarks`는 병합 후 **전체 목록**입니다(`GET`과 같은 형태·정렬). 프론트가 병합 직후 `GET`을 한 번 더 호출하지 않아도 됩니다.
- `skipped[].reason` 값: `INVALID_SLUG` | `UNKNOWN_AGENT` | `LIMIT_REACHED`
- `added` / `alreadyPresent` / `skipped`에 들어간 slug 수의 합은 중복을 제거한 입력 개수와 같습니다. 백엔드 테스트에서 이 불변식을 확인하세요.

**엔드포인트 전용 에러 (요청 전체 거부)**

| HTTP | code | 언제 | `details` |
|------|------|------|-----------|
| 400 | `VALIDATION_FAILED` | `slugs` 없음, 배열 아님, 요소가 문자열 아님, 빈 배열 | `{ "field": "slugs", "reason": "must be a non-empty array of strings" }` |
| 400 | `TOO_MANY_ITEMS` | 200개 초과(중복 제거 **전** 기준) | `{ "max": 200, "received": 245 }` |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | JSON이 아님 | `{}` |

```json
{
  "error": {
    "code": "TOO_MANY_ITEMS",
    "message": "한 번에 최대 200개까지 병합할 수 있습니다.",
    "details": { "max": 200, "received": 245 }
  }
}
```

**[가정] 200개 제한을 중복 제거 전 기준으로 세는 이유:** 서버가 파싱하자마자 바로 거부할 수 있어서 구현이 단순합니다. 프론트는 보내기 전에 중복을 제거하고 정규식으로 걸러 내면 됩니다(2.5 참고).

**[가정] 여러 번 호출할 수 있고, "최초 로그인" 판정은 클라이언트가 합니다.** 서버는 "이 사용자가 이미 병합했는지"를 기억하지 않습니다. 병합이 멱등이라서 그럴 필요가 없습니다.

### 2.5 프론트 병합 흐름(권장)

1. 로그인해서 access token을 받습니다.
2. localStorage `agent-archive:bookmarks`를 읽고, 중복 제거 + 정규식 필터 + (선택) 로컬 agents 데이터에 있는 slug만 남깁니다.
3. 결과가 비어 있지 않고 `agent-archive:bookmarks-merged:<userId>` 플래그가 없으면 `POST /merge`를 보냅니다. 200개를 넘으면 200개씩 나눠 보냅니다(멱등이라 안전합니다).
4. 응답의 `bookmarks`로 UI 상태를 교체하고, 플래그를 기록합니다.
5. 로그인 상태에서는 서버가 원본입니다. 추가·삭제는 낙관적 업데이트 후 실패하면 롤백합니다.

참고로 **현재 카탈로그가 100개**라서 유효한 slug는 최대 100개입니다. 그래서 병합 200개 제한과 500개 한도는 당분간 실제로 닿지 않습니다. 둘 다 악의적이거나 손상된 입력을 막는 방어선입니다.

---

## 3. 인증 가정

| 항목 | 계약 |
|------|------|
| 전달 방식 | `Authorization: Bearer <JWT>`. 쿼리스트링 토큰은 허용하지 않습니다. |
| 수명 | 15분 |
| 검증 | 서명, `exp`, `iss`, `aud`(= `https://api.agentarchive.dev`). 시계 오차 허용 30초. |
| 사용자 식별 | `sub` = 서버 내부 사용자 ID. **[가정]** GitHub 로그인명이 아니라 불변 ID(GitHub numeric id 기반)를 씁니다. GitHub 로그인명은 바뀔 수 있기 때문입니다. |
| 만료 시 | `401 TOKEN_EXPIRED` → 프론트가 refresh(범위 밖) 후 원 요청을 1회 재시도합니다. 재시도도 401이면 로그아웃 처리합니다. |
| 토큰 보관 | **[가정]** 프론트는 access token을 메모리에만 둡니다(localStorage 금지). 정적 사이트라서 XSS가 생기면 localStorage의 토큰은 그대로 노출됩니다. |

---

## 4. CORS 가정

```
Access-Control-Allow-Origin: https://yohan-work.github.io
Access-Control-Allow-Methods: GET, PUT, DELETE, POST, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Expose-Headers: X-Request-Id, Retry-After, RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset
Access-Control-Max-Age: 600
Vary: Origin
```

- Origin은 **정확히 일치하는 allowlist**로 비교합니다. `*`나 `*.github.io` 패턴은 금지입니다. `*.github.io`를 허용하면 다른 사람의 GitHub Pages가 전부 통과합니다.
- 허용되지 않은 Origin에는 CORS 헤더를 붙이지 않습니다(브라우저가 차단합니다).
- `Authorization` 헤더 때문에 **모든 요청에 preflight(OPTIONS)가 발생**합니다. `Max-Age: 600`으로 10분 동안 캐시합니다. OPTIONS는 인증과 레이트 리밋에서 제외하고 `204`로 응답합니다.
- 이번 범위의 4개 엔드포인트는 쿠키가 필요 없으므로 `Access-Control-Allow-Credentials`를 붙이지 않고, 프론트 fetch도 `credentials: "omit"`(기본값)로 둡니다. refresh 엔드포인트만 `credentials: "include"` + `Allow-Credentials: true`가 필요합니다(범위 밖, 리스크 R1 참고).
- **[가정]** 로컬 개발 Origin(`http://localhost:3000`)은 dev/staging 환경 변수로만 allowlist에 추가하고, 프로덕션에는 넣지 않습니다.

---

## 5. 레이트 리밋 가정

- 키: JWT `sub`(사용자). 한도: **분당 60회**, 4개 엔드포인트 합산. 병합 1회 = 1회로 셉니다.
- 인증 실패 요청은 사용자를 알 수 없으므로 **[가정]** IP 기준으로 별도 한도(분당 60회)를 둡니다.
- 모든 인증 응답 헤더:
  ```
  RateLimit-Limit: 60
  RateLimit-Remaining: 42
  RateLimit-Reset: 17
  ```
  (`Reset`은 남은 초입니다.)
- 초과 시:
  ```http
  HTTP/1.1 429 Too Many Requests
  Retry-After: 17
  ```
  ```json
  {
    "error": {
      "code": "RATE_LIMITED",
      "message": "요청이 너무 많습니다. 17초 후 다시 시도해 주세요.",
      "details": { "limit": 60, "windowSeconds": 60, "retryAfterSeconds": 17 }
    }
  }
  ```
- **[가정] 한도는 근사치입니다.** Workers의 Rate Limiting binding은 로케이션별로 집계되는 근사 카운터입니다. 정확한 전역 카운트가 필요하면 Durable Object를 써야 합니다. 북마크 용도에는 근사치로 충분합니다. D1에 카운터를 두는 방식은 요청마다 쓰기가 생기므로 권장하지 않습니다.
- 프론트: 북마크 버튼 연타에 대비해 같은 slug의 토글은 디바운스(약 300ms)해서 마지막 상태만 전송합니다.

---

## 6. 백엔드 구현 메모 (Hono + D1)

```sql
CREATE TABLE bookmarks (
  user_id    TEXT NOT NULL,
  slug       TEXT NOT NULL,
  created_at TEXT NOT NULL,          -- ISO 8601 UTC, ms 포함
  PRIMARY KEY (user_id, slug)
);
CREATE INDEX idx_bookmarks_user_created ON bookmarks (user_id, created_at DESC);
```

- 추가: `INSERT ... ON CONFLICT(user_id, slug) DO NOTHING`. 영향 행 수가 0이면 기존 행을 조회해서 `200`으로 응답합니다.
- **500건 한도 경쟁 조건:** "COUNT 후 INSERT"를 따로 실행하면 동시 요청에서 한도를 넘을 수 있습니다. 한 문장으로 조건부 삽입합니다.
  ```sql
  INSERT INTO bookmarks (user_id, slug, created_at)
  SELECT ?1, ?2, ?3
  WHERE (SELECT COUNT(*) FROM bookmarks WHERE user_id = ?1) < 500
  ON CONFLICT(user_id, slug) DO NOTHING;
  ```
- 병합: 남은 용량을 계산한 뒤 `db.batch([...])`로 한 번에 실행합니다(D1 batch는 트랜잭션).
- 카탈로그: 빌드 시 `Set<string>`으로 번들링합니다. 조회는 O(1)입니다.

---

## 7. 리스크

| # | 리스크 | 영향 | 대응 |
|---|--------|------|------|
| R1 | **refresh 쿠키가 서드파티 쿠키가 됩니다.** 사이트는 `yohan-work.github.io`, API는 `api.agentarchive.dev`로 사이트(eTLD+1)가 다릅니다. Safari ITP와 Chrome의 서드파티 쿠키 제한 때문에 httpOnly refresh 쿠키가 전송되지 않을 수 있습니다. | 15분마다 재로그인. 사실상 기능 불능 | 이번 범위 밖이지만 **월요일 전에 결정이 필요합니다.** 선택지: (a) 사이트를 `agentarchive.dev` 커스텀 도메인으로 옮겨 same-site로 만들기, (b) `SameSite=None; Secure; Partitioned`(CHIPS) 적용, (c) refresh token을 메모리에 두는 방식으로 전환. (a)를 권장합니다. |
| R2 | **카탈로그 불일치.** 사이트에 새 에이전트가 추가됐는데 API를 다시 배포하지 않으면 새 slug가 `UNKNOWN_AGENT`로 거부됩니다. | 신규 에이전트를 북마크할 수 없음 | 콘텐츠 변경 시 CI가 API도 재배포하도록 파이프라인을 연결합니다. 또는 API가 사이트의 agents 인덱스 JSON을 주기적으로 가져옵니다. 프론트는 `UNKNOWN_AGENT`를 받으면 로컬에만 유지하고 안내합니다. |
| R3 | **삭제한 북마크 부활.** 기기 A에서 지운 북마크가 기기 B의 localStorage에 남아 있다가, B에서 처음 로그인할 때 병합으로 다시 생깁니다. | 사용자 혼란 | 병합을 기기·사용자별 1회로 제한합니다(2.5의 플래그). 병합은 합집합만 하므로 서버에서는 막을 수 없습니다. 제품 차원에서 허용 가능한지 확인이 필요합니다. |
| R4 | 에이전트 이름 변경·삭제 시 기존 북마크가 고아가 됩니다. | 한도를 차지하고 UI에 보이지 않음 | 목록에 그대로 반환하고 삭제를 허용합니다(2.1, 2.3). 장기적으로는 slug 리다이렉트 맵이 필요합니다. |
| R5 | 병합 부분 성공(`skipped`)을 프론트가 무시하면 사용자 북마크가 조용히 사라집니다. | 데이터 손실 인식 | `skipped`가 있으면 localStorage를 덮어쓰지 말고 해당 항목만 남기거나, 사용자에게 알립니다. |
| R6 | 모든 요청에 preflight가 붙어 첫 요청 지연이 두 배가 됩니다. | 체감 지연 | `Max-Age: 600`, 낙관적 UI로 가립니다. |
| R7 | 레이트 리밋이 근사치라 짧은 순간 60회를 넘길 수 있습니다. | 낮음 | 수용합니다. 문서에 "근사치"로 명시합니다. |

---

## 8. 확정 필요 항목 (월요일 전, 기본값 제시)

반대 의견이 없으면 아래 기본값으로 확정합니다.

1. **R1 refresh 쿠키 전략** — 기본값: 커스텀 도메인으로 same-site 구성. *유일하게 기본값만으로 진행하기 어려운 항목입니다.*
2. 추가 메서드 `PUT /{slug}` — 기본값: 채택
3. 없는 slug 추가 시 코드 — 기본값: `422 UNKNOWN_AGENT`
4. 병합 시 `createdAt` 부여 — 기본값: 배열 순서 보존(1ms씩 감소)
5. 병합 한도 초과 처리 — 기본값: 부분 성공 + `LIMIT_REACHED`
6. 로컬 개발 Origin 허용 범위 — 기본값: dev/staging에만 `http://localhost:3000`

---

## 9. 다음 액션

| 담당 | 할 일 | 기한 |
|------|-------|------|
| 전원 | 이 문서의 8절 항목 확정, 특히 R1 | 금요일 |
| 백엔드 | 이 계약을 `openapi.yaml`(v1)로 옮겨 저장소에 커밋합니다. 이후 계약 변경은 PR로만 합니다. | 금요일 |
| 백엔드 | 에러 코드 enum과 응답 타입을 공유 TS 패키지나 파일(`api-types.ts`)로 내보냅니다. | 월요일 오전 |
| 프론트 | OpenAPI 기반 목 서버(MSW)를 세팅하고 4개 엔드포인트 + 모든 에러 코드 시나리오를 만듭니다. 백엔드를 기다리지 않고 병렬 개발할 수 있습니다. | 월요일 |
| 프론트 | `code` → en/ko 메시지 매핑을 dictionaries에 추가합니다. | 1주차 |
| 백엔드 | 계약 테스트: 멱등성(PUT 2회, DELETE 2회, merge 2회), 500건 동시성, 병합 불변식(`added + alreadyPresent + skipped = 중복 제거 입력 수`), CORS 거부 Origin | 1주차 |
| 백엔드 | 카탈로그 동기화 파이프라인(R2) 설계 | 1주차 |
| 전원 | 스테이징에서 GitHub Pages Origin으로 실제 CORS·preflight·쿠키 동작을 확인합니다. Safari 포함. | 2주차 초 |
