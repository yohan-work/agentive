내일부터 프론트가 붙을 수 있도록 먼저 확인이 필요한 질문 3가지를 드리고, 그 아래에 바로 작업을 시작할 수 있는 **임시 명세**를 붙였습니다. 요청에 명시되지 않은 부분은 모두 `[ASSUMPTION]`으로 표시했으니, 답변 주시면 해당 부분만 고쳐 확정본으로 드리겠습니다.

## 먼저 확인할 질문 (중요한 순서)

1. **"회원 기능"의 범위가 어디까지인가요?** 아래 임시 명세는 회원가입 / 로그인 / 로그아웃 / 토큰 갱신 / 내 정보 조회·수정 / 회원 탈퇴까지만 다룹니다. 이메일 인증, 비밀번호 재설정, 소셜 로그인, 관리자용 회원 관리가 필요한지 알려 주세요.
2. **인증 방식은 무엇인가요?** 임시로 JWT Access Token(Bearer 헤더) + Refresh Token(HttpOnly 쿠키)으로 잡았습니다. 세션 쿠키 방식이나 다른 방식을 쓰고 있다면 Conventions와 로그인/로그아웃 응답이 바뀝니다.
3. **회원 정보 필드와 규칙은 무엇인가요?** 임시로 `email`, `password`, `nickname`만 두었습니다. 로그인 ID가 이메일인지, 휴대폰 번호 등 추가 필드가 있는지, 비밀번호 규칙이 정해져 있는지 알려 주세요.

---

# 회원 API 임시 명세 (v0.1, provisional)

## 1. Conventions

| 항목 | 내용 |
|---|---|
| Base URL | `https://api.example.com/v1` [ASSUMPTION] |
| 인증 | `Authorization: Bearer <accessToken>` [ASSUMPTION]. Access Token 유효기간 30분, Refresh Token 14일 [ASSUMPTION] |
| Refresh Token 전달 | `refreshToken` HttpOnly, Secure, SameSite=Lax 쿠키, Path=`/v1/auth` [ASSUMPTION] |
| 공통 헤더 | 요청: `Content-Type: application/json`. 응답: `Content-Type: application/json; charset=utf-8` |
| CORS | 프론트 origin만 허용, `Access-Control-Allow-Credentials: true` (쿠키 전송을 위해 필요) [ASSUMPTION]. 프론트는 `/auth/*` 호출 시 `credentials: "include"` 필요 |
| Rate limit | 로그인: IP당 10회/분, 회원가입: IP당 5회/분 [ASSUMPTION]. 초과 시 `429` + `Retry-After` 헤더(초) |
| 필드 표기 | JSON 필드는 camelCase [ASSUMPTION] |
| 시간 형식 | ISO 8601 UTC, 예: `"2026-09-30T09:00:00Z"` [ASSUMPTION] |
| ID 형식 | 문자열 ID, 예: `"usr_01J9ZK3Q7X"` [ASSUMPTION] |

**공통 에러 형식** [ASSUMPTION]

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "입력값이 올바르지 않습니다.",
    "details": [
      { "field": "email", "reason": "INVALID_FORMAT" }
    ]
  }
}
```

- `code`: 프론트가 분기할 때 쓰는 값 (아래 표에 정의된 것만 사용)
- `message`: 사용자에게 그대로 보여 줘도 되는 한국어 문구
- `details`: 필드 검증 오류일 때만 포함, 그 외에는 생략

**공통 에러 (모든 인증 필요 엔드포인트)**

| 상황 | 상태 코드 | `code` |
|---|---|---|
| Authorization 헤더 없음 / 형식 오류 / 서명 불일치 | 401 | `UNAUTHORIZED` |
| Access Token 만료 | 401 | `TOKEN_EXPIRED` |
| 탈퇴한 회원의 토큰 | 401 | `UNAUTHORIZED` |
| 요청 본문이 JSON이 아님 | 400 | `INVALID_JSON` |
| Rate limit 초과 | 429 | `RATE_LIMITED` |
| 서버 오류 | 500 | `INTERNAL_ERROR` |

프론트 처리 규칙: `TOKEN_EXPIRED`를 받으면 `POST /auth/refresh`를 1회 호출한 뒤 원래 요청을 재시도하고, refresh도 실패하면 로그인 화면으로 보냅니다.

**검증 규칙** [ASSUMPTION]

| 필드 | 규칙 | 위반 시 `details[].reason` |
|---|---|---|
| `email` | 필수, 이메일 형식, 최대 254자, 대소문자 구분 없이 유일(소문자로 저장) | `REQUIRED`, `INVALID_FORMAT`, `TOO_LONG` |
| `password` | 필수, 8~64자, 영문과 숫자를 각각 1자 이상 포함 | `REQUIRED`, `TOO_SHORT`, `TOO_LONG`, `WEAK_PASSWORD` |
| `nickname` | 필수, 앞뒤 공백 제거 후 2~20자 | `REQUIRED`, `TOO_SHORT`, `TOO_LONG` |

---

## 2. Endpoints

### 2.1 회원가입 — `POST /users`

- 인증: 불필요
- Body: `email`, `password`, `nickname` (모두 필수, 위 검증 규칙 적용)
- 성공: `201 Created`, 생성된 회원 정보 반환. 가입만 하고 자동 로그인은 하지 않음 [ASSUMPTION] → 프론트는 이어서 `POST /auth/login` 호출

| 상황 | 상태 코드 | `code` |
|---|---|---|
| 필드 검증 실패 | 400 | `VALIDATION_FAILED` |
| 이미 가입된 이메일 | 409 | `EMAIL_ALREADY_EXISTS` |
| Rate limit 초과 (IP당 5회/분) | 429 | `RATE_LIMITED` |

요청 예시:

```http
POST /v1/users
Content-Type: application/json

{
  "email": "minji@example.com",
  "password": "sunny2026",
  "nickname": "민지"
}
```

응답 예시 (201):

```json
{
  "id": "usr_01J9ZK3Q7X",
  "email": "minji@example.com",
  "nickname": "민지",
  "createdAt": "2026-09-30T09:00:00Z",
  "updatedAt": "2026-09-30T09:00:00Z"
}
```

에러 예시 (409):

```json
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "이미 가입된 이메일입니다."
  }
}
```

에러 예시 (400, 여러 필드 동시 실패 시 모두 반환):

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "입력값이 올바르지 않습니다.",
    "details": [
      { "field": "password", "reason": "TOO_SHORT" },
      { "field": "nickname", "reason": "REQUIRED" }
    ]
  }
}
```

### 2.2 로그인 — `POST /auth/login`

- 인증: 불필요
- Body: `email`, `password` (필수, 형식 검증만 하고 길이 규칙은 적용하지 않음)
- 성공: `200 OK`, body에 Access Token, `Set-Cookie`로 Refresh Token

| 상황 | 상태 코드 | `code` |
|---|---|---|
| 필드 누락 / 이메일 형식 오류 | 400 | `VALIDATION_FAILED` |
| 이메일 없음 또는 비밀번호 불일치 (구분하지 않음) | 401 | `INVALID_CREDENTIALS` |
| Rate limit 초과 (IP당 10회/분) | 429 | `RATE_LIMITED` |

요청 예시:

```http
POST /v1/auth/login
Content-Type: application/json

{
  "email": "minji@example.com",
  "password": "sunny2026"
}
```

응답 예시 (200):

```http
HTTP/1.1 200 OK
Set-Cookie: refreshToken=rt_8f2c...; HttpOnly; Secure; SameSite=Lax; Path=/v1/auth; Max-Age=1209600
```

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c3JfMDFKOVpLM1E3WCJ9.sig",
  "expiresAt": "2026-09-30T09:30:00Z",
  "user": {
    "id": "usr_01J9ZK3Q7X",
    "email": "minji@example.com",
    "nickname": "민지",
    "createdAt": "2026-09-30T09:00:00Z",
    "updatedAt": "2026-09-30T09:00:00Z"
  }
}
```

에러 예시 (429):

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 42
```

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
  }
}
```

### 2.3 토큰 갱신 — `POST /auth/refresh`

- 인증: Refresh Token 쿠키 (Authorization 헤더 불필요)
- Body: 없음
- 성공: `200 OK`, 새 Access Token 반환, Refresh Token도 새로 발급(rotation)하고 이전 것은 무효화 [ASSUMPTION]

| 상황 | 상태 코드 | `code` |
|---|---|---|
| 쿠키 없음 | 401 | `REFRESH_TOKEN_MISSING` |
| 만료되었거나 무효화된 Refresh Token | 401 | `REFRESH_TOKEN_INVALID` |

응답 예시 (200):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c3JfMDFKOVpLM1E3WCIsIm4iOjJ9.sig",
  "expiresAt": "2026-09-30T10:05:00Z"
}
```

에러 예시 (401):

```json
{
  "error": {
    "code": "REFRESH_TOKEN_INVALID",
    "message": "로그인이 만료되었습니다. 다시 로그인해 주세요."
  }
}
```

### 2.4 로그아웃 — `POST /auth/logout`

- 인증: Refresh Token 쿠키
- Body: 없음
- 성공: `204 No Content`, 해당 Refresh Token 무효화 + 쿠키 삭제(`Max-Age=0`)
- 쿠키가 없거나 이미 무효여도 `204` 반환 (멱등) → 에러 없음

```http
POST /v1/auth/logout

HTTP/1.1 204 No Content
Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Lax; Path=/v1/auth; Max-Age=0
```

### 2.5 내 정보 조회 — `GET /users/me`

- 인증: 필요
- 성공: `200 OK`
- 에러: 공통 에러(401 `UNAUTHORIZED` / `TOKEN_EXPIRED`)만 해당

```http
GET /v1/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c3JfMDFKOVpLM1E3WCJ9.sig
```

```json
{
  "id": "usr_01J9ZK3Q7X",
  "email": "minji@example.com",
  "nickname": "민지",
  "createdAt": "2026-09-30T09:00:00Z",
  "updatedAt": "2026-09-30T09:00:00Z"
}
```

에러 예시 (401):

```json
{
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "인증이 만료되었습니다."
  }
}
```

### 2.6 내 정보 수정 — `PATCH /users/me`

- 인증: 필요
- Body: `nickname` (선택). 보낸 필드만 변경(부분 수정) [ASSUMPTION]
- 이메일은 수정 불가 [ASSUMPTION]. 비밀번호 변경은 이 명세 범위 밖(질문 1 참고)
- 성공: `200 OK`, 수정된 전체 회원 정보

| 상황 | 상태 코드 | `code` |
|---|---|---|
| `nickname` 검증 실패 | 400 | `VALIDATION_FAILED` |
| 수정 가능한 필드가 하나도 없음 (빈 body 포함) | 400 | `NO_UPDATABLE_FIELDS` |
| `email` 또는 `password` 필드를 보냄 | 400 | `FIELD_NOT_UPDATABLE` |

요청 예시:

```http
PATCH /v1/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c3JfMDFKOVpLM1E3WCJ9.sig
Content-Type: application/json

{
  "nickname": "민지짱"
}
```

응답 예시 (200):

```json
{
  "id": "usr_01J9ZK3Q7X",
  "email": "minji@example.com",
  "nickname": "민지짱",
  "createdAt": "2026-09-30T09:00:00Z",
  "updatedAt": "2026-09-30T11:12:45Z"
}
```

에러 예시 (400):

```json
{
  "error": {
    "code": "FIELD_NOT_UPDATABLE",
    "message": "수정할 수 없는 항목이 포함되어 있습니다.",
    "details": [
      { "field": "email", "reason": "NOT_UPDATABLE" }
    ]
  }
}
```

### 2.7 회원 탈퇴 — `DELETE /users/me`

- 인증: 필요
- Body: `password` (필수, 본인 확인용) [ASSUMPTION]
- 성공: `204 No Content`. 모든 Refresh Token 무효화 + 쿠키 삭제. 이후 기존 Access Token은 `401 UNAUTHORIZED`

| 상황 | 상태 코드 | `code` |
|---|---|---|
| `password` 누락 | 400 | `VALIDATION_FAILED` |
| 비밀번호 불일치 | 401 | `INVALID_CREDENTIALS` |

요청 예시:

```http
DELETE /v1/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c3JfMDFKOVpLM1E3WCJ9.sig
Content-Type: application/json

{
  "password": "sunny2026"
}
```

응답: `204 No Content` (본문 없음)

---

## 3. Behavior rules

- **이메일 중복**: 소문자로 바꿔 비교합니다. `Minji@Example.com`으로 가입을 시도해도 `409 EMAIL_ALREADY_EXISTS`입니다. 동시에 같은 이메일로 두 요청이 들어오면 하나만 `201`, 나머지는 `409`입니다 (DB unique 제약).
- **회원가입 멱등성**: 멱등 키는 두지 않습니다. 같은 요청을 재전송하면 두 번째는 `409`이므로 프론트는 `409`를 "이미 가입됨"으로 처리하면 됩니다.
- **로그인 실패 메시지**: 이메일이 없는 경우와 비밀번호가 틀린 경우를 구분하지 않고 둘 다 `401 INVALID_CREDENTIALS`로 응답합니다.
- **Rate limit**: 윈도우는 1분 고정 [ASSUMPTION]. 한도 초과 시점부터 윈도우가 끝날 때까지 `429 RATE_LIMITED`, `Retry-After`에 남은 초를 줍니다. 성공한 요청도 횟수에 포함됩니다.
- **토큰 갱신 동시 호출**: Refresh Token rotation 때문에 여러 탭에서 동시에 refresh하면 늦게 도착한 요청은 `401 REFRESH_TOKEN_INVALID`를 받을 수 있습니다. 프론트는 refresh 호출을 한 번에 하나만 보내고 결과를 공유해야 합니다.
- **로그아웃/탈퇴 후**: 로그아웃은 현재 기기의 Refresh Token만, 탈퇴는 모든 기기의 Refresh Token을 무효화합니다. 로그아웃 후에도 이미 발급된 Access Token은 만료(최대 30분)까지 유효합니다 [ASSUMPTION].
- **PATCH 처리**: 보내지 않은 필드는 유지, `null`을 보내면 `400 VALIDATION_FAILED` (`reason: "REQUIRED"`). 알 수 없는 필드는 무시합니다.
- **탈퇴 후 재가입**: 같은 이메일로 즉시 재가입 가능 여부는 미정입니다 (Open questions 참고).

## 4. Open questions (구현을 막는 것만)

1. 위 질문 1~3 (범위, 인증 방식, 회원 필드/비밀번호 규칙)
2. 탈퇴 회원 데이터는 즉시 삭제인가요, 일정 기간 보관(soft delete)인가요? 같은 이메일 재가입 가능 여부가 여기에 달려 있습니다.
3. 기존에 쓰는 에러 응답 형식이나 필드 표기(camelCase/snake_case) 규칙이 있다면 그 형식으로 바꾸겠습니다.

## Suggested (not required)

- 이메일 인증을 넣는다면 가입 직후 `status: "PENDING_VERIFICATION"` 같은 상태 필드가 필요합니다.
- 비밀번호 변경(`PUT /users/me/password`)과 비밀번호 재설정 흐름은 대부분의 회원 기능에 필요하니 범위에 포함할지 결정해 주세요.
- 프론트 가입 폼의 실시간 중복 체크가 필요하면 이메일 중복 확인 엔드포인트를 추가할 수 있습니다.

**범위 밖 (설계하지 않음)**: 소셜 로그인, 관리자용 회원 목록/관리, 휴대폰 인증, 프로필 이미지 업로드.
