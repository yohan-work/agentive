# Agent Archive 북마크 동기화 API 계약서 v1 (초안)

> 상태: **확정 전 초안**. 아래 "확정 필요 결정사항"의 4개 항목에 대해 금요일까지 합의되면 v1.0으로 동결하고, 이후 변경은 계약서 PR로만 합니다.

---

## 0. 공통 규칙

| 항목 | 값 |
|---|---|
| Base URL | `https://api.agentarchive.dev/v1` |
| 인증 | 모든 엔드포인트 `Authorization: Bearer <accessToken>` 필수 (JWT, 15분) |
| 요청 본문 | `Content-Type: application/json` (UTF-8). 본문 없는 요청은 헤더 생략 가능 |
| 응답 본문 | JSON, camelCase. `204`는 본문 없음 |
| 시간 | ISO 8601 UTC, 밀리초 포함, `Z` 접미사 (예: `2026-10-05T09:12:33.120Z`) |
| 캐시 | 모든 응답 `Cache-Control: no-store` |
| 사용자 식별 | JWT의 `sub` 클레임. 경로에 userId를 넣지 않고 항상 `/me` 사용 |
| slug 형식 | `^[a-z0-9-]{3,64}$` |
| 에러 포맷 | `{ "error": { "code", "message", "details" } }` — `details`는 항상 객체(없으면 `{}`) |

**원칙**
- 추가(PUT)와 삭제(DELETE)는 모두 **멱등**입니다. 같은 요청을 몇 번 보내도 결과 상태가 같고 에러가 나지 않습니다. 프론트는 네트워크 실패 시 안심하고 재시도해도 됩니다.
- 프론트는 `error.code`로만 분기하고, `message`는 표시/로그용입니다(문구는 바뀔 수 있음).

---

## 1. 엔드포인트 요약

| # | 기능 | 메서드 | 경로 | 성공 | 요청 본문 |
|---|---|---|---|---|---|
| 1 | 내 북마크 목록 | `GET` | `/v1/me/bookmarks` | `200` | 없음 |
| 2 | 북마크 추가(단건) | `PUT` | `/v1/me/bookmarks/{slug}` | `201` 신규 / `200` 이미 있음 | 없음 |
| 3 | 북마크 삭제(단건) | `DELETE` | `/v1/me/bookmarks/{slug}` | `204` | 없음 |
| 4 | localStorage 병합 업로드 | `POST` | `/v1/me/bookmarks/merge` | `200` | `{ "slugs": string[] }` |

추가를 `POST /bookmarks` + body 대신 `PUT /bookmarks/{slug}`로 한 이유: 리소스 식별자가 slug 자체이고 멱등이 요구사항이라, PUT의 의미와 정확히 맞습니다. 본문도 필요 없습니다.

---

## 2. 엔드포인트 상세

### 2.1 `GET /v1/me/bookmarks` — 내 북마크 목록

- 최대 500개이므로 **페이지네이션 없음**, 전체를 한 번에 반환.
- 정렬: `createdAt` 내림차순(최신 먼저), 같으면 `slug` 오름차순.

**응답 200**
```json
{
  "bookmarks": [
    { "slug": "pr-review-agent", "createdAt": "2026-10-05T09:12:33.120Z" },
    { "slug": "bug-root-cause", "createdAt": "2026-10-04T22:01:07.004Z" }
  ],
  "total": 2,
  "limit": 500
}
```

북마크가 없으면 `{ "bookmarks": [], "total": 0, "limit": 500 }`.

| 상태 | code | 언제 |
|---|---|---|
| 401 | `UNAUTHENTICATED` | 토큰 없음/형식 오류/서명 불일치 |
| 401 | `TOKEN_EXPIRED` | 토큰 만료 |
| 429 | `RATE_LIMITED` | 분당 60회 초과 |
| 500 | `INTERNAL_ERROR` | 서버 오류 |

> 참고: 카탈로그에서 나중에 삭제된 에이전트의 북마크도 목록에 **그대로 반환**합니다(서버가 임의로 지우지 않음). 프론트는 현재 빌드의 agents 목록에 없는 slug를 "더 이상 제공되지 않는 에이전트"로 표시하거나 숨기면 됩니다.

---

### 2.2 `PUT /v1/me/bookmarks/{slug}` — 북마크 추가

- 본문 없음.
- 검증 순서: ① slug 형식 → ② 이미 북마크되어 있는지 → ③ 카탈로그 존재 여부 → ④ 500개 한도.
- **이미 있으면** 기존 `createdAt`을 유지한 채 `200`. 한도(500)에 꽉 찬 상태여도 이미 있는 slug면 에러 없이 `200`.

**응답 201 (새로 추가됨)**
```json
{
  "bookmark": { "slug": "pr-review-agent", "createdAt": "2026-10-05T09:12:33.120Z" },
  "created": true,
  "total": 43
}
```

**응답 200 (이미 있었음)**
```json
{
  "bookmark": { "slug": "pr-review-agent", "createdAt": "2026-09-28T03:40:11.500Z" },
  "created": false,
  "total": 43
}
```

| 상태 | code | 언제 | details 예시 |
|---|---|---|---|
| 400 | `INVALID_SLUG` | 형식 위반 | `{ "slug": "PR_Review", "pattern": "^[a-z0-9-]{3,64}$" }` |
| 404 | `AGENT_NOT_FOUND` | 형식은 맞지만 카탈로그에 없음 | `{ "slug": "no-such-agent" }` |
| 409 | `BOOKMARK_LIMIT_REACHED` | 신규 추가인데 이미 500개 | `{ "limit": 500, "total": 500 }` |
| 401 | `UNAUTHENTICATED` / `TOKEN_EXPIRED` | 인증 | `{}` |
| 429 | `RATE_LIMITED` | 레이트 리밋 | `{ "retryAfterSeconds": 12 }` |
| 500 | `INTERNAL_ERROR` | 서버 오류 | `{ "requestId": "..." }` |

에러 예시:
```json
{
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "존재하지 않는 에이전트입니다: no-such-agent",
    "details": { "slug": "no-such-agent" }
  }
}
```

---

### 2.3 `DELETE /v1/me/bookmarks/{slug}` — 북마크 삭제

- 본문 없음. 성공 시 **항상 `204 No Content`** (원래 없던 북마크를 지워도 204 — 멱등).
- **카탈로그 존재 여부는 검사하지 않습니다.** 에이전트가 사이트에서 삭제된 뒤에도 사용자가 해당 북마크를 지울 수 있어야 하기 때문입니다. 형식 검사만 합니다.

| 상태 | code | 언제 |
|---|---|---|
| 204 | — | 삭제됨 또는 원래 없음 |
| 400 | `INVALID_SLUG` | 형식 위반 |
| 401 | `UNAUTHENTICATED` / `TOKEN_EXPIRED` | 인증 |
| 429 | `RATE_LIMITED` | 레이트 리밋 |
| 500 | `INTERNAL_ERROR` | 서버 오류 |

---

### 2.4 `POST /v1/me/bookmarks/merge` — localStorage 병합 업로드

**요청**
```json
{
  "slugs": ["pr-review-agent", "bug-root-cause", "old-removed-agent", "Bad Slug"]
}
```

**요청 수준 검증 (실패 시 전체 거부, 아무것도 저장 안 함)**
- 본문이 JSON 객체가 아니거나 `slugs`가 문자열 배열이 아님 → `400 VALIDATION_ERROR`
- `slugs.length > 200` → `400 MERGE_TOO_MANY_ITEMS` (`details: { "max": 200, "received": 237 }`)
- 본문 크기 > 32KB → `413 PAYLOAD_TOO_LARGE`
- 빈 배열은 허용(아무것도 안 하고 현재 목록 반환).

**항목 수준 처리 (부분 성공)** — localStorage 데이터는 오래됐거나 손상됐을 수 있으므로, 잘못된 항목 하나 때문에 전체를 실패시키지 않습니다.

**응답 200**
```json
{
  "added": ["bug-root-cause"],
  "alreadyPresent": ["pr-review-agent"],
  "rejected": [
    { "slug": "old-removed-agent", "reason": "AGENT_NOT_FOUND" },
    { "slug": "Bad Slug", "reason": "INVALID_SLUG" }
  ],
  "bookmarks": [
    { "slug": "bug-root-cause", "createdAt": "2026-10-05T09:15:00.000Z" },
    { "slug": "pr-review-agent", "createdAt": "2026-09-28T03:40:11.500Z" }
  ],
  "total": 2,
  "limit": 500
}
```

- `bookmarks`는 병합 **이후의 전체 목록**(GET과 같은 형식·정렬). 프론트는 병합 직후 별도 GET 없이 이 값으로 상태를 교체하면 됩니다.
- `rejected[].reason` 값: `INVALID_SLUG` | `AGENT_NOT_FOUND` | `BOOKMARK_LIMIT_REACHED`
- 인증/레이트리밋/500 에러는 다른 엔드포인트와 동일.

---

## 3. 병합 규칙

1. **합집합(union)만 합니다.** 서버에 있는데 localStorage에 없는 북마크는 **절대 삭제하지 않습니다.** (다른 기기에서 추가한 것일 수 있음)
2. 입력 정규화: 문자열 앞뒤 공백 제거 후 처리. **대소문자 변환은 하지 않음** — 대문자가 섞이면 `INVALID_SLUG`로 거부(자동 소문자화하면 의도와 다른 slug와 합쳐질 수 있음).
3. 입력 내 중복은 첫 번째만 처리하고 나머지는 조용히 무시(응답 어디에도 중복 표기 안 함).
4. 이미 서버에 있는 slug → `alreadyPresent`, 기존 `createdAt` 유지.
5. 새로 추가되는 항목의 `createdAt`은 **서버 시각**. localStorage에는 생성 시각이 없으므로 클라이언트 시각을 받지 않습니다. 한 번의 병합에서 추가된 항목은 모두 같은 시각을 가질 수 있고, 정렬은 `slug` 오름차순으로 결정됩니다.
6. **500개 한도**: 입력 순서대로 추가하다가 한도에 닿으면 나머지 신규 항목은 `rejected`(`BOOKMARK_LIMIT_REACHED`)로 반환. 요청 전체를 실패시키지 않습니다.
7. **멱등**: 같은 요청을 다시 보내면 두 번째에는 전부 `alreadyPresent`로 나옵니다. 따라서 병합 응답을 못 받고 끊겨도 재시도가 안전합니다.
8. 원자성: 실제 INSERT는 하나의 D1 batch(트랜잭션)로 수행해, 중간 실패 시 일부만 저장되는 상태를 만들지 않습니다(`500` → 아무것도 저장 안 됨 → 재시도).

**"최초 로그인"의 판단은 클라이언트 책임**입니다. 서버는 "최초인지"를 추적하지 않고, 이 엔드포인트는 언제 호출해도 안전합니다.

**프론트 권장 흐름**
1. 로그인 성공 → localStorage `agent-archive:bookmarks`가 비어 있지 않으면 `POST /merge` 호출.
2. 200 수신 → 응답 `bookmarks`로 상태 교체, localStorage에 `agent-archive:bookmarks-merged:<userId>` 같은 플래그 기록(같은 기기에서 재병합 방지. 재병합돼도 무해하지만 호출 낭비).
3. localStorage 북마크가 200개 초과면 200개씩 나눠 순차 호출(현재 카탈로그가 100개라 실제로는 발생하기 어렵지만 계약상 처리 규칙은 둠).
4. `rejected`는 사용자에게 알릴 필요 없음(권장: 조용히 버리고 콘솔 로그만). 단 `BOOKMARK_LIMIT_REACHED`가 있으면 토스트로 안내.
5. 로그인 상태에서 localStorage를 계속 캐시로 쓸지(오프라인 표시용)는 프론트 결정 — 단, 진실의 원천(source of truth)은 로그인 중에는 서버.

---

## 4. 인증 가정

- 로그인 후 서버가 발급한 access token(JWT, 15분)을 `Authorization: Bearer <token>`으로 전달.
- JWT `sub` = 서버 내부 userId(GitHub user id를 직접 쓰지 않는 것을 권장. GitHub 계정 연결 변경에 대비).
- 401 응답에는 `WWW-Authenticate: Bearer` 헤더 포함.
- **`TOKEN_EXPIRED`와 `UNAUTHENTICATED`를 구분**합니다.
  - `TOKEN_EXPIRED` → 프론트는 refresh 호출 후 원 요청을 **1회만** 재시도.
  - `UNAUTHENTICATED` → 재시도 없이 로그아웃 상태로 전환.
- refresh 엔드포인트와 쿠키 사양은 이번 범위 밖이지만, 위 재시도 규칙은 이번 계약에 포함합니다(프론트 fetch 래퍼가 여기에 의존하므로).
- 모든 북마크 엔드포인트는 Bearer 토큰만 쓰므로 **쿠키가 필요 없습니다** → 프론트 fetch는 `credentials: "omit"`(기본값 `same-origin`도 교차 출처라 쿠키 미전송이므로 무방).

## 5. CORS 가정

| 헤더 | 값 |
|---|---|
| `Access-Control-Allow-Origin` | `https://yohan-work.github.io` (정확히 일치할 때만 반사, `*` 금지) |
| `Access-Control-Allow-Methods` | `GET, PUT, DELETE, POST, OPTIONS` |
| `Access-Control-Allow-Headers` | `Authorization, Content-Type` |
| `Access-Control-Expose-Headers` | `Retry-After, RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset` |
| `Access-Control-Max-Age` | `600` |
| `Access-Control-Allow-Credentials` | 북마크 엔드포인트에는 **보내지 않음** (refresh 엔드포인트 사양에서 별도 결정) |
| `Vary` | `Origin` |

- `Authorization` 헤더 때문에 모든 요청에 **preflight(OPTIONS)가 발생**합니다. `Max-Age: 600`으로 완화. OPTIONS는 인증 불필요, 레이트 리밋 카운트 제외, `204` 응답.
- 허용되지 않은 origin: CORS 헤더 없이 응답(브라우저가 차단). 서버가 별도 403을 줄 필요는 없음.
- 개발 환경: 스테이징/로컬 Worker에서만 `http://localhost:3000` 추가 허용. **프로덕션에는 넣지 않음.**
- 에러 응답(401/429/500 포함)에도 CORS 헤더를 붙여야 합니다. 안 붙이면 프론트에서 에러 본문을 못 읽고 "CORS 에러"로만 보입니다(Hono 미들웨어 순서 주의: `cors()`를 인증·레이트리밋 미들웨어보다 **앞**에 등록).

## 6. 레이트 리밋 가정

- **사용자(JWT `sub`)당 분당 60회**, 모든 북마크 엔드포인트 합산. merge도 1회로 계산.
- 인증 실패 요청은 사용자를 알 수 없으므로 IP 기준 별도 제한(예: 분당 30회) — 수치는 백엔드 재량, 계약에는 "429가 올 수 있음"만 명시.
- 모든 응답에 헤더 포함:
  - `RateLimit-Limit: 60`
  - `RateLimit-Remaining: 17`
  - `RateLimit-Reset: 23` (초)
- 429 응답:
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
    "details": { "retryAfterSeconds": 23 }
  }
}
```
  헤더 `Retry-After: 23` 포함. 프론트는 자동 재시도하지 말고(또는 `Retry-After` 이후 1회만) 사용자 액션을 되돌립니다.

## 7. 전체 에러 코드표

| code | HTTP | 발생 엔드포인트 | 프론트 처리 |
|---|---|---|---|
| `UNAUTHENTICATED` | 401 | 전부 | 로그아웃 상태 전환 |
| `TOKEN_EXPIRED` | 401 | 전부 | refresh 후 1회 재시도 |
| `INVALID_SLUG` | 400 | PUT, DELETE (merge는 항목 reason) | 버그로 간주, 로그 |
| `AGENT_NOT_FOUND` | 404 | PUT (merge는 항목 reason) | "존재하지 않는 에이전트" 안내, 낙관적 업데이트 롤백 |
| `BOOKMARK_LIMIT_REACHED` | 409 | PUT (merge는 항목 reason) | "북마크는 최대 500개" 안내 |
| `VALIDATION_ERROR` | 400 | merge | 버그로 간주 |
| `MERGE_TOO_MANY_ITEMS` | 400 | merge | 200개씩 분할 전송 |
| `PAYLOAD_TOO_LARGE` | 413 | merge | 버그로 간주 |
| `RATE_LIMITED` | 429 | 전부 | 롤백 + 안내 |
| `NOT_FOUND` | 404 | 정의되지 않은 경로 | 버그 |
| `METHOD_NOT_ALLOWED` | 405 | 정의되지 않은 메서드 | 버그 |
| `INTERNAL_ERROR` | 500 | 전부 | 롤백 + 재시도 버튼 |

`500` 응답의 `details`에는 `requestId`를 넣어(같은 값을 `X-Request-Id` 응답 헤더로도) 프론트 로그와 서버 로그를 연결합니다.

## 8. 백엔드 참고 (계약 아님, 구현 가이드)

```sql
CREATE TABLE bookmarks (
  user_id    TEXT NOT NULL,
  slug       TEXT NOT NULL,
  created_at TEXT NOT NULL,          -- ISO 8601 UTC
  PRIMARY KEY (user_id, slug)
);
CREATE INDEX idx_bookmarks_user_created ON bookmarks (user_id, created_at DESC);
```
- 추가: `INSERT ... ON CONFLICT(user_id, slug) DO NOTHING` 후 `changes`로 201/200 판별.
- 한도 검사와 INSERT 사이 경쟁 조건: 동시 요청 시 500을 1~2개 넘을 수 있음. 단일 사용자 기준이라 허용 가능 수준으로 보고, 엄격히 막으려면 `INSERT ... SELECT ... WHERE (SELECT COUNT(*) ...) < 500` 형태로 한 문장에서 처리.
- 카탈로그 slug 목록은 Worker 번들에 상수(Set)로 포함.

---

## 9. 리스크

| # | 리스크 | 영향 | 대응 |
|---|---|---|---|
| 1 | **API의 agents 목록과 사이트 빌드가 어긋남.** 사이트에 새 에이전트가 배포됐는데 API 재배포가 안 되면 그 에이전트는 북마크 불가(`AGENT_NOT_FOUND`) | 높음 | 사이트와 API를 같은 CI 파이프라인에서 배포하거나, API가 사이트의 공개 JSON(예: 빌드 산출물의 agents 목록)을 주기적으로 읽도록. 최소한 "API 먼저 배포 → 사이트 배포" 순서를 규칙화 |
| 2 | **refresh 쿠키가 서드파티 쿠키로 취급됨.** 사이트(`github.io`)와 API(`agentarchive.dev`)가 다른 사이트라, `SameSite=None` 쿠키가 Safari ITP·Chrome 서드파티 쿠키 제한에 막힐 수 있음 → 15분마다 재로그인 | 높음 (범위 밖이지만 이 기능 전체를 좌우) | refresh 사양 확정 전에 Safari에서 PoC. 대안: 사이트를 커스텀 도메인(`agentarchive.dev`)으로 옮겨 same-site로 만들기 |
| 3 | Workers에서 "사용자당 분당 60회"를 정확히 세기 어려움. D1로 세면 요청마다 쓰기 발생, Workers Rate Limiting 바인딩은 위치별 근사치 | 중간 | 계약은 "대략 60회/분"으로 해석하도록 명시. 정확도가 필요하면 Durable Object 카운터 |
| 4 | 매 요청 preflight로 체감 지연 증가 | 낮음 | `Max-Age: 600`, 목록은 앱 시작 시 1회만 조회 |
| 5 | 낙관적 업데이트 중 여러 탭/기기 간 불일치 | 낮음 | 탭 포커스 시 GET 재조회로 충분. 실시간 동기화는 범위 밖 |
| 6 | 로그아웃 시 localStorage 처리 미정 → 공용 PC에서 이전 사용자 북마크 노출/재병합 | 중간 | 로그아웃 시 서버 북마크 캐시를 지우고, 로그인 전 localStorage 원본은 유지할지 결정 필요 |

## 10. 확정 필요 결정사항 (금요일까지)

1. **merge 한도 초과 시 부분 성공**(본 초안) vs 전체 거부 — 초안은 부분 성공.
2. **카탈로그에 없는 slug의 PUT을 404**(본 초안) vs 422 — 팀 표준에 422 관례가 있으면 그쪽으로.
3. **로그아웃 시 localStorage 정책**(리스크 6).
4. **agents 목록 동기화 방식**(리스크 1) — 배포 순서 규칙으로 갈지, 런타임 조회로 갈지.

## 11. 다음 액션

| 담당 | 할 일 | 기한 |
|---|---|---|
| 전원 | 이 문서 리뷰, 10번 결정사항 합의 → v1.0 동결 | 금요일 |
| 백엔드 | 이 계약으로 OpenAPI 3.1 스펙 작성(프론트 타입 생성·목 서버 겸용) | 월요일 오전 |
| 백엔드 | Hono 라우트 스텁 + CORS/인증/레이트리밋 미들웨어를 먼저 배포(스테이징), 응답은 고정값이라도 OK | 월요일~화요일 |
| 프론트 | OpenAPI에서 타입 생성, MSW 등으로 목 응답 구성해 스테이징 전까지 독립 개발 | 월요일부터 |
| 프론트 | fetch 래퍼: `TOKEN_EXPIRED` 1회 재시도, 에러 코드 매핑, 낙관적 업데이트 롤백 | 이번 주 |
| 프론트 + 백엔드 | Safari에서 교차 사이트 refresh 쿠키 PoC (리스크 2) | 다음 주 초 |
| 백엔드 | 계약 테스트: 멱등 PUT/DELETE, merge 중복·한도·잘못된 slug, 에러 응답에 CORS 헤더 존재 여부 | 구현과 함께 |

필요하시면 이 내용을 그대로 OpenAPI 3.1 YAML로 옮겨 드리겠습니다.
