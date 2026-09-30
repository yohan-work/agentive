# Agent Archive 북마크 동기화 API 계약서 (v1 초안)

월요일 병렬 개발 전에 확정할 수 있도록 결정된 사항을 그대로 반영하고, 비어 있는 부분은 **[가정]** 으로 표시했습니다. [가정] 항목만 금요일까지 합의하면 이 문서를 그대로 계약으로 써도 됩니다.

---

## 0. 공통 규칙

| 항목 | 값 |
|---|---|
| Base URL | `https://api.agentarchive.dev/v1` **[가정: 경로 버전 `/v1`]** |
| 인증 | 모든 엔드포인트 `Authorization: Bearer <accessToken>` 필수 (JWT, 15분) |
| 사용자 식별 | JWT의 `sub` (서버 내부 user id). 요청 경로/바디에 userId를 받지 않음 → 항상 `/me` |
| 요청 본문 | `Content-Type: application/json; charset=utf-8` (본문이 있는 요청만) |
| 응답 | JSON, camelCase, 시간은 ISO 8601 UTC 밀리초 포함 (`2026-10-05T09:12:33.120Z`) |
| slug 규칙 | 정규식 `^[a-z0-9-]{3,64}$` + 서버 빌드 시점 agents 목록에 존재 |
| 사용자당 한도 | 북마크 500개 |
| 레이트 리밋 | 사용자당 분당 60회 (아래 5절) |
| 에러 포맷 | `{ "error": { "code", "message", "details" } }` — `details`는 없으면 `{}` **[가정: 생략하지 않고 항상 객체]** |

---

## 1. 엔드포인트 요약

| # | 기능 | 메서드 | 경로 | 성공 |
|---|---|---|---|---|
| 1 | 내 북마크 목록 조회 | `GET` | `/v1/me/bookmarks` | `200` |
| 2 | 북마크 추가(단건, 멱등) | `PUT` | `/v1/me/bookmarks/{slug}` | `201` 신규 / `200` 이미 존재 |
| 3 | 북마크 삭제(단건, 멱등) | `DELETE` | `/v1/me/bookmarks/{slug}` | `204` |
| 4 | localStorage 병합 업로드 | `POST` | `/v1/me/bookmarks/merge` | `200` |

**추가를 `PUT /{slug}`로 한 이유:** "같은 slug 두 번 추가 = 멱등"이라는 결정과 HTTP 의미가 정확히 일치합니다. 리소스 식별자(slug)를 클라이언트가 이미 알고 있고, 재시도해도 결과가 같습니다. `POST /bookmarks { slug }`를 선호하면 바꿔도 되지만, 그 경우에도 중복 시 `200`을 반환하는 규칙은 유지해야 합니다.

---

## 2. 엔드포인트 상세

### 2.1 `GET /v1/me/bookmarks` — 목록 조회

- 요청 본문 없음. 쿼리 파라미터 없음 **[가정: 최대 500개라 페이지네이션 없이 전체 반환]**
- 정렬: `createdAt` 내림차순(최신 먼저), 동률이면 `slug` 오름차순

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

북마크가 없으면 `"bookmarks": []`, `"total": 0` (404 아님).

| HTTP | code | 언제 |
|---|---|---|
| 401 | `UNAUTHENTICATED` | 헤더 없음, 서명 불일치, 형식 오류 |
| 401 | `TOKEN_EXPIRED` | JWT `exp` 경과 → 프론트는 refresh 후 1회 재시도 |
| 429 | `RATE_LIMITED` | 분당 60회 초과 |
| 500 | `INTERNAL_ERROR` | 그 외 |

---

### 2.2 `PUT /v1/me/bookmarks/{slug}` — 추가(멱등)

- 요청 본문 없음 (보내도 무시)
- 처리 순서: ① 인증 → ② slug 형식 검사 → ③ 카탈로그 존재 검사 → ④ **이미 있으면 200** → ⑤ 500개 한도 검사 → ⑥ 삽입 후 201
- ④가 ⑤보다 먼저인 점이 중요합니다. 500개 꽉 찬 상태에서 이미 있는 slug를 다시 추가하면 에러가 아니라 `200`.
- 이미 존재하면 `createdAt`은 **최초 값 유지**(덮어쓰지 않음).

**응답 201 (신규)**
```json
{
  "bookmark": { "slug": "pr-review-agent", "createdAt": "2026-10-05T09:12:33.120Z" },
  "created": true,
  "total": 3
}
```

**응답 200 (이미 존재)**
```json
{
  "bookmark": { "slug": "pr-review-agent", "createdAt": "2026-10-01T03:40:00.000Z" },
  "created": false,
  "total": 3
}
```

| HTTP | code | 언제 | details 예 |
|---|---|---|---|
| 400 | `INVALID_SLUG` | 정규식 불일치 | `{ "slug": "PR_Review", "pattern": "^[a-z0-9-]{3,64}$" }` |
| 404 | `AGENT_NOT_FOUND` | 형식은 맞지만 카탈로그에 없음 | `{ "slug": "no-such-agent" }` |
| 409 | `BOOKMARK_LIMIT_REACHED` | 신규 추가인데 이미 500개 | `{ "limit": 500, "total": 500 }` |
| 401 | `UNAUTHENTICATED` / `TOKEN_EXPIRED` | 2.1과 동일 | |
| 429 | `RATE_LIMITED` | | `{ "retryAfterSeconds": 12 }` |
| 500 | `INTERNAL_ERROR` | | |

**에러 예시**
```json
{
  "error": {
    "code": "BOOKMARK_LIMIT_REACHED",
    "message": "북마크는 최대 500개까지 저장할 수 있습니다.",
    "details": { "limit": 500, "total": 500 }
  }
}
```

> `AGENT_NOT_FOUND`를 404로 둘지 422로 둘지는 취향 문제인데, 경로의 리소스(agent)가 없다는 의미라 404를 택했습니다. 프론트는 status가 아니라 **`error.code`로 분기**하는 것을 원칙으로 해주세요.

---

### 2.3 `DELETE /v1/me/bookmarks/{slug}` — 삭제(멱등)

- 요청 본문 없음
- 북마크가 없어도 `204` **[가정: 추가와 대칭으로 멱등]** — 다른 기기에서 이미 지운 경우, 재시도 등에서 에러를 만들 이유가 없습니다.
- **카탈로그 존재 검사를 하지 않습니다.** 형식 검사만 합니다. 사이트에서 에이전트가 삭제/이름 변경되면 사용자가 그 북마크를 지울 수 있어야 하기 때문입니다.

**응답 204** — 본문 없음

| HTTP | code | 언제 |
|---|---|---|
| 400 | `INVALID_SLUG` | 정규식 불일치 |
| 401 | `UNAUTHENTICATED` / `TOKEN_EXPIRED` | |
| 429 | `RATE_LIMITED` | |
| 500 | `INTERNAL_ERROR` | |

---

### 2.4 `POST /v1/me/bookmarks/merge` — 최초 로그인 병합 업로드

**요청**
```json
{
  "slugs": ["pr-review-agent", "readme-agent", "bug-root-cause", "Old_Agent", "removed-agent"]
}
```

- `slugs`: 문자열 배열, 필수, 길이 0~200. localStorage `agent-archive:bookmarks` 값을 **파싱한 그대로** 전송.
- 요청 단위 검증(실패 시 요청 전체 거부, 아무것도 저장 안 함):
  - `slugs` 누락 / 배열 아님 / 원소가 문자열 아님 → `400 VALIDATION_FAILED`
  - 200개 초과 → `400 MERGE_TOO_LARGE`
- 원소 단위 검증(실패한 원소만 건너뛰고 나머지는 저장): 아래 병합 규칙 참고.

**응답 200**
```json
{
  "added": ["pr-review-agent", "bug-root-cause"],
  "alreadyPresent": ["readme-agent"],
  "skipped": [
    { "slug": "Old_Agent", "reason": "INVALID_SLUG" },
    { "slug": "removed-agent", "reason": "AGENT_NOT_FOUND" }
  ],
  "bookmarks": [
    { "slug": "pr-review-agent", "createdAt": "2026-10-05T09:12:33.120Z" },
    { "slug": "bug-root-cause", "createdAt": "2026-10-05T09:12:33.119Z" },
    { "slug": "readme-agent", "createdAt": "2026-09-20T11:00:00.000Z" }
  ],
  "total": 3,
  "limit": 500
}
```

`skipped[].reason` 값: `INVALID_SLUG` | `AGENT_NOT_FOUND` | `LIMIT_REACHED` | `DUPLICATE_IN_REQUEST`

응답에 병합 후 **전체 목록**을 포함해서 프론트가 병합 직후 `GET`을 한 번 더 호출하지 않아도 되게 했습니다.

| HTTP | code | 언제 | details 예 |
|---|---|---|---|
| 400 | `VALIDATION_FAILED` | 바디 형식 오류, JSON 파싱 실패 | `{ "field": "slugs", "reason": "must be an array of strings" }` |
| 400 | `MERGE_TOO_LARGE` | 201개 이상 | `{ "max": 200, "received": 237 }` |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Content-Type이 JSON 아님 | |
| 401 | `UNAUTHENTICATED` / `TOKEN_EXPIRED` | | |
| 429 | `RATE_LIMITED` | | |
| 500 | `INTERNAL_ERROR` | | |

> 500개 한도에 걸려 일부만 들어가도 **요청 자체는 200**입니다. 한도 초과분은 `skipped`에 `LIMIT_REACHED`로 표시됩니다.

---

## 3. 병합 규칙 (2.4 상세)

1. **합집합(union)이며, 서버 데이터는 절대 삭제하지 않습니다.** localStorage에 없고 서버에만 있는 북마크는 그대로 둡니다.
2. **정규화하지 않습니다.** 대문자 등 규칙 위반 slug를 서버가 몰래 소문자로 바꾸지 않고 `INVALID_SLUG`로 건너뜁니다. (자동 변환은 다른 에이전트와 우연히 일치하는 사고를 낼 수 있음)
3. **요청 내 중복**은 첫 번째만 처리, 나머지는 `DUPLICATE_IN_REQUEST`로 skipped.
4. **이미 서버에 있는 slug**는 `alreadyPresent`, `createdAt`은 서버 값 유지.
5. **처리 순서는 배열 순서**. 500개 한도에 도달하면 이후 원소는 모두 `LIMIT_REACHED`.
   - **[가정] localStorage 배열은 오래된 것 → 최신 순으로 push 된다.** 프론트가 이 순서를 확인해 주세요. 반대라면 한도에 걸릴 때 어떤 게 살아남는지가 바뀝니다.
6. **createdAt**: localStorage에는 시각이 없으므로 서버 시각을 부여합니다. 모두 같은 시각이면 정렬이 무의미해지므로, 요청 시각 `T`를 기준으로 배열 인덱스 `i`의 원소에 `T - (n - 1 - i) ms`를 부여해 **원래 순서를 보존**합니다(마지막 원소가 가장 최신). **[가정]**
7. **원자성**: 요청 단위 검증을 통과하면 저장은 D1 `batch()` 한 번(단일 트랜잭션)으로 처리합니다. 중간 실패 시 전부 롤백 → `500`, 클라이언트는 그대로 재시도.
8. **멱등성**: 같은 요청을 두 번 보내도 두 번째는 전부 `alreadyPresent`가 되어 결과 상태가 같습니다. 별도 Idempotency-Key는 두지 않습니다.
9. **"최초 로그인"을 서버가 강제하지 않습니다.** 합집합·멱등이라 여러 번 호출돼도 안전하므로, 언제 호출할지는 프론트가 결정합니다(아래 프론트 흐름).
10. 레이트 리밋상 병합 1회 = 요청 1회로 계산합니다(원소 수와 무관).

**프론트 권장 흐름**
1. 로그인 성공 → localStorage 북마크가 1개 이상이면 `POST /merge` 호출 (201개 이상이면 200개씩 나눠 순차 호출 — 사실상 한도 500이라 최대 3회)
2. 200 수신 → 응답의 `bookmarks`로 UI 갱신 → localStorage를 **서버 목록으로 덮어쓰기**(또는 비우기 — 로그아웃 시 동작과 함께 결정 필요)
3. 실패(네트워크/5xx) → localStorage는 건드리지 않고 다음 로드 때 재시도. 멱등이라 안전.
4. `skipped` 가 있으면 조용히 버리되, `LIMIT_REACHED`가 있으면 사용자에게 한 줄 안내

---

## 4. 인증 가정

- 모든 엔드포인트는 `Authorization: Bearer <JWT>` 필수. 쿠키로 인증하지 않습니다(이 4개 엔드포인트는 `credentials: "omit"`로 호출 가능).
- 서버 검증 항목: 서명, `exp`, `iss`, `aud` **[가정: `iss=https://api.agentarchive.dev`, `aud=agent-archive-web`]**, `sub` 존재.
- 만료는 `TOKEN_EXPIRED`, 나머지 실패는 `UNAUTHENTICATED`로 구분 → 프론트는 `TOKEN_EXPIRED`일 때만 refresh 후 **1회** 재시도, `UNAUTHENTICATED`면 로그아웃 상태로 전환.
- 시계 오차 허용 `leeway` 30초 **[가정]**.
- access token 저장 위치(메모리 권장, localStorage 비권장)는 프론트 결정 사항이지만 XSS 관점에서 메모리 보관을 권장합니다.

---

## 5. CORS 가정

| 헤더 | 값 |
|---|---|
| `Access-Control-Allow-Origin` | `https://yohan-work.github.io` (정확히 일치하는 경우에만 echo, `*` 금지) |
| `Access-Control-Allow-Methods` | `GET, PUT, DELETE, POST, OPTIONS` |
| `Access-Control-Allow-Headers` | `Authorization, Content-Type` |
| `Access-Control-Expose-Headers` | `RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, Retry-After` |
| `Access-Control-Max-Age` | `600` |
| `Vary` | `Origin` |
| `Access-Control-Allow-Credentials` | 이 4개 엔드포인트에는 불필요. refresh 엔드포인트에서만 `true` (범위 밖) |

- 개발용 origin `http://localhost:3000` 허용 여부는 **환경변수 allowlist**로 분리(프로덕션에는 미포함) **[가정]**.
- `OPTIONS` preflight는 **인증 없이** `204`, 레이트 리밋 카운트에서 제외.
- **401/429/500 에러 응답에도 CORS 헤더를 붙여야 합니다.** 빠지면 브라우저에서 프론트가 `error.code`를 읽지 못하고 그냥 네트워크 에러로 보입니다. Hono의 `cors()` 미들웨어를 에러 핸들러보다 먼저 등록하세요.
- `Authorization` 헤더 때문에 GET 포함 모든 요청이 preflight를 유발합니다. `Max-Age`로 완화.

---

## 6. 레이트 리밋 가정

- 키: JWT `sub`. 인증 실패 요청은 사용자를 모르므로 IP 기준 별도 한도 **[가정: IP당 분당 60회]**.
- 한도: 60회 / 60초 고정 윈도우 **[가정: 슬라이딩이 아니라 고정 윈도우 — 구현 단순]**.
- 모든 응답에 헤더:
  - `RateLimit-Limit: 60`
  - `RateLimit-Remaining: 17`
  - `RateLimit-Reset: 23` (초)
- 초과 시:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 23
Content-Type: application/json
```
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
    "details": { "limit": 60, "windowSeconds": 60, "retryAfterSeconds": 23 }
  }
}
```
- 프론트: 429는 자동 재시도하지 않거나, `Retry-After` 이후 1회만. 북마크 토글 연타는 클라이언트에서 디바운스.

---

## 7. 에러 코드 전체 목록

| code | HTTP | 엔드포인트 | 프론트 처리 |
|---|---|---|---|
| `UNAUTHENTICATED` | 401 | 전체 | 로그아웃 상태로 전환 |
| `TOKEN_EXPIRED` | 401 | 전체 | refresh 후 1회 재시도 |
| `INVALID_SLUG` | 400 | PUT, DELETE | 버그로 간주, 로깅 |
| `AGENT_NOT_FOUND` | 404 | PUT | "더 이상 없는 에이전트" 안내, 로컬 상태 롤백 |
| `BOOKMARK_LIMIT_REACHED` | 409 | PUT | "최대 500개" 안내 |
| `VALIDATION_FAILED` | 400 | merge | 버그로 간주, 로깅 |
| `MERGE_TOO_LARGE` | 400 | merge | 200개씩 분할 (클라이언트에서 사전 방지) |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | merge | 버그로 간주 |
| `RATE_LIMITED` | 429 | 전체 | `Retry-After` 존중 |
| `INTERNAL_ERROR` | 500 | 전체 | 낙관적 업데이트 롤백, 토스트 |

`message`는 사람이 읽는 문장이라 **바뀔 수 있는 값**입니다. 로직은 `code`로만 분기해 주세요.

---

## 8. 백엔드 참고 (계약 외, 구현 제안)

```sql
CREATE TABLE bookmarks (
  user_id    TEXT    NOT NULL,
  slug       TEXT    NOT NULL,
  created_at INTEGER NOT NULL,          -- epoch ms, 응답 시 ISO 변환
  PRIMARY KEY (user_id, slug)
);
CREATE INDEX idx_bookmarks_user_created ON bookmarks (user_id, created_at DESC);
```

- 추가: `INSERT ... ON CONFLICT(user_id, slug) DO NOTHING` 후 `changes`로 201/200 판단.
- 500개 한도: "COUNT 후 INSERT"는 동시 요청 시 501개가 될 수 있음. `INSERT ... SELECT ... WHERE (SELECT COUNT(*) ...) < 500` 형태로 한 문장에 묶거나, 1~2개 초과는 허용 오차로 받아들일지 결정.
- 카탈로그: 빌드 시점 slug 목록을 `Set`으로 번들에 포함.

---

## 9. 리스크

| # | 리스크 | 영향 | 대응 제안 |
|---|---|---|---|
| 1 | **refresh 쿠키가 서드파티 쿠키가 됨.** 사이트(`yohan-work.github.io`)와 API(`api.agentarchive.dev`)가 다른 사이트라, Safari ITP·Chrome 서드파티 쿠키 제한에서 httpOnly refresh 쿠키가 전송되지 않을 수 있음 | 15분마다 재로그인 → 동기화 기능 사실상 무력화 | 범위 밖이지만 **월요일 전에 결정 필요**. 사이트를 커스텀 도메인(예: `agentarchive.dev`)으로 옮겨 same-site로 만들거나, refresh 방식 재검토 |
| 2 | **카탈로그 드리프트.** 사이트는 GitHub Pages로 배포, API는 별도 배포. 새 에이전트가 사이트에 먼저 올라가면 API가 `AGENT_NOT_FOUND`로 거부 | 사용자가 새 에이전트를 북마크 못 함 | 사이트 배포 파이프라인에서 API도 함께 재배포, 또는 API가 사이트의 공개 slug 목록 JSON을 주기적으로 가져오기 |
| 3 | **삭제/이름 변경된 에이전트.** 서버에 남은 북마크가 사이트에 없는 slug를 가리킴 | 목록에 깨진 항목 | GET은 저장된 그대로 반환, 프론트가 현재 카탈로그에 없는 slug는 숨김(또는 "삭제됨" 표시 후 DELETE 허용 — 2.3에서 카탈로그 검사 안 하는 이유) |
| 4 | **Workers 레이트 리밋 정확도.** KV는 eventual consistency라 카운터로 부적합, Rate Limiting 바인딩은 위치별 근사치 | 60회가 정확히 지켜지지 않음 | 정확도가 중요하면 사용자별 Durable Object, 아니면 근사치 허용을 명시 |
| 5 | **localStorage 순서 가정 오류** (3절 5번) | 한도 초과 시 엉뚱한 북마크가 버려짐 | 프론트가 실제 push 순서 확인 |
| 6 | **localStorage 오염 데이터** (파싱 불가 JSON, 문자열 아닌 값) | merge 400 | 프론트가 전송 전 `Array.isArray` + 문자열 필터링 |
| 7 | **낙관적 업데이트 충돌.** 여러 기기 동시 토글 | 일시적 불일치 | 마지막 쓰기 우선 허용. 탭 포커스 시 GET으로 재동기화 |

---

## 10. 다음 액션

| 담당 | 할 일 | 기한 제안 |
|---|---|---|
| 전원 | [가정] 항목 확정: `/v1` 경로, DELETE 멱등 204, 병합 createdAt 부여 방식, 고정 윈도우, `details` 항상 객체 | 금요일 |
| 전원 + 결정권자 | **리스크 1 (서드파티 쿠키) 결정** — 커스텀 도메인 여부 | 금요일, 이게 가장 급함 |
| 프론트 | localStorage 배열 순서 확인, 병합 후 localStorage 처리(덮어쓰기/비우기) 및 로그아웃 시 동작 결정 | 금요일 |
| 백엔드 | 이 문서를 OpenAPI 3.1 YAML로 옮겨 레포에 커밋 (프론트 타입 생성·목 서버 기반) | 월요일 오전 |
| 백엔드 | slug 카탈로그를 API 빌드에 포함하는 방법과 재배포 트리거 결정 (리스크 2) | 다음 주 중 |
| 프론트 | OpenAPI 기반 목 서버(MSW 등)로 병렬 개발 시작, `error.code` 분기 유틸 작성 | 월요일~ |
| 공동 | 계약 테스트: 각 에러 코드별 1케이스 이상 (특히 CORS 헤더가 에러 응답에 붙는지) | 통합 전 |

이 초안에서 바꾸고 싶은 결정(예: 추가를 `POST`로, 삭제 미존재 시 404)이 있으면 알려주세요. 해당 표와 예시를 맞춰서 수정해 드리겠습니다.
