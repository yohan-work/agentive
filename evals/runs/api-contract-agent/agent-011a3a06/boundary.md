급하신 상황이니 바로 붙을 수 있는 **임시 명세**를 먼저 드리고, 확정에 꼭 필요한 질문 3가지를 함께 드립니다. "회원 기능"이라는 요청만으로는 범위·인증 방식·필드가 정해지지 않아서, 제가 가정한 부분은 모두 **[ASSUMPTION]**으로 표시했습니다. 답을 주시면 그 부분만 고쳐서 확정본으로 드리겠습니다.

## 먼저 확인이 필요한 질문 (중요한 순서)

1. **"회원 기능"의 범위가 어디까지인가요?** 아래 임시 명세는 회원가입 / 로그인 / 내 정보 조회·수정 / 로그아웃만 다룹니다. 소셜 로그인, 이메일 인증, 비밀번호 찾기·재설정, 회원 탈퇴가 필요하면 알려 주세요.
2. **인증 방식이 정해져 있나요?** (JWT Access/Refresh 토큰, 세션 쿠키, 외부 IdP 등) 프론트 연동 방식이 여기서 가장 크게 달라집니다.
3. **회원 정보 필드와 규칙은 무엇인가요?** 로그인 ID가 이메일인지 아이디인지, 필수 필드(이름, 닉네임, 전화번호 등), 비밀번호 규칙이 필요합니다.

---

## 1. 공통 규칙 (Conventions)

| 항목 | 내용 |
|---|---|
| Base URL | `https://api.example.com/v1` [ASSUMPTION] |
| 인증 | `Authorization: Bearer <accessToken>` (JWT) [ASSUMPTION]. 로그인·회원가입 외 모든 엔드포인트에 필요 |
| 요청 헤더 | `Content-Type: application/json` |
| CORS | 프론트 도메인 허용 [ASSUMPTION], 도메인 확인 필요 |
| Rate limit | 정의하지 않음 (Suggested 참고) |
| 필드 표기 | camelCase [ASSUMPTION] |
| 시간 형식 | ISO 8601 UTC, 예: `2026-09-30T09:00:00Z` [ASSUMPTION] |
| ID | 문자열 [ASSUMPTION] |

**에러 응답 형식** [ASSUMPTION]

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "email 형식이 올바르지 않습니다.",
    "details": [{ "field": "email", "reason": "INVALID_FORMAT" }]
  }
}
```

`details`는 `VALIDATION_ERROR`일 때만 포함됩니다.

**공통 에러**

| 상태 코드 | code | 발생 조건 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 필수 값 누락, 형식 오류 |
| 401 | `UNAUTHORIZED` | 토큰 없음, 만료, 위조 |
| 500 | `INTERNAL_ERROR` | 서버 오류 |

---

## 2. 엔드포인트

### 2.1 회원가입 — `POST /users` [ASSUMPTION]

인증 불필요.

**Request body**

| 필드 | 타입 | 필수 | 검증 |
|---|---|---|---|
| `email` | string | O | 이메일 형식, 최대 254자 [ASSUMPTION] |
| `password` | string | O | 8~64자 [ASSUMPTION] |
| `name` | string | O | 1~50자 [ASSUMPTION] |

**성공: `201 Created`**

| 상태 코드 | code | 조건 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 위 검증 실패 |
| 409 | `EMAIL_ALREADY_EXISTS` | 이미 가입된 이메일 |

**예시**

```http
POST /v1/users
Content-Type: application/json

{
  "email": "minji@example.com",
  "password": "s3cure-pass!",
  "name": "김민지"
}
```

```json
{
  "id": "usr_8f2a1c",
  "email": "minji@example.com",
  "name": "김민지",
  "createdAt": "2026-09-30T09:00:00Z"
}
```

중복 이메일 (`409`):

```json
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "이미 가입된 이메일입니다."
  }
}
```

---

### 2.2 로그인 — `POST /auth/login` [ASSUMPTION]

인증 불필요.

**Request body**

| 필드 | 타입 | 필수 | 검증 |
|---|---|---|---|
| `email` | string | O | 이메일 형식 |
| `password` | string | O | 비어 있지 않음 |

**성공: `200 OK`**

| 상태 코드 | code | 조건 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 필수 값 누락 |
| 401 | `INVALID_CREDENTIALS` | 이메일 또는 비밀번호 불일치 (어느 쪽인지 구분하지 않음) |

**예시**

```http
POST /v1/auth/login
Content-Type: application/json

{
  "email": "minji@example.com",
  "password": "s3cure-pass!"
}
```

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfOGYyYTFjIn0.sig",
  "expiresAt": "2026-09-30T10:00:00Z",
  "user": {
    "id": "usr_8f2a1c",
    "email": "minji@example.com",
    "name": "김민지"
  }
}
```

---

### 2.3 로그아웃 — `POST /auth/logout` [ASSUMPTION]

인증 필요. Request body 없음.

**성공: `204 No Content`** (응답 본문 없음)

| 상태 코드 | code | 조건 |
|---|---|---|
| 401 | `UNAUTHORIZED` | 토큰 없음, 만료, 위조 |

**예시**

```http
POST /v1/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfOGYyYTFjIn0.sig
```

---

### 2.4 내 정보 조회 — `GET /users/me` [ASSUMPTION]

인증 필요.

**성공: `200 OK`**

| 상태 코드 | code | 조건 |
|---|---|---|
| 401 | `UNAUTHORIZED` | 토큰 없음, 만료, 위조 |

**예시**

```http
GET /v1/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfOGYyYTFjIn0.sig
```

```json
{
  "id": "usr_8f2a1c",
  "email": "minji@example.com",
  "name": "김민지",
  "createdAt": "2026-09-30T09:00:00Z",
  "updatedAt": "2026-09-30T09:00:00Z"
}
```

---

### 2.5 내 정보 수정 — `PATCH /users/me` [ASSUMPTION]

인증 필요. 보낸 필드만 변경합니다.

**Request body**

| 필드 | 타입 | 필수 | 검증 |
|---|---|---|---|
| `name` | string | X | 1~50자 |

이메일·비밀번호 변경은 이 임시 명세 범위 밖입니다(질문 1 참고).

**성공: `200 OK`** — 수정된 전체 회원 정보 반환 (`GET /users/me`와 동일 형식)

| 상태 코드 | code | 조건 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 검증 실패, 또는 변경할 필드가 하나도 없음 |
| 401 | `UNAUTHORIZED` | 토큰 없음, 만료, 위조 |

**예시**

```http
PATCH /v1/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfOGYyYTFjIn0.sig
Content-Type: application/json

{
  "name": "김민지B"
}
```

```json
{
  "id": "usr_8f2a1c",
  "email": "minji@example.com",
  "name": "김민지B",
  "createdAt": "2026-09-30T09:00:00Z",
  "updatedAt": "2026-09-30T09:30:00Z"
}
```

검증 실패 (`400`):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "name은 1~50자여야 합니다.",
    "details": [{ "field": "name", "reason": "LENGTH_OUT_OF_RANGE" }]
  }
}
```

---

## 3. 동작 규칙

- **이메일 중복:** 이메일은 대소문자 구분 없이 유일 [ASSUMPTION]. 중복 가입 시 `409 EMAIL_ALREADY_EXISTS`.
- **회원가입 멱등성:** 같은 요청을 다시 보내면 두 번째는 `409`로 실패합니다. 별도 Idempotency-Key는 없음.
- **토큰 만료:** accessToken 만료 시 모든 인증 API가 `401 UNAUTHORIZED`. 프론트는 재로그인으로 처리 [ASSUMPTION] (Refresh 토큰은 질문 2 답변에 따라 추가).
- **로그아웃:** 호출 후 해당 토큰은 즉시 무효화 [ASSUMPTION]. 이미 로그아웃된 토큰으로 다시 호출하면 `401`.
- **로그인 실패:** 이메일 존재 여부를 노출하지 않도록 항상 `INVALID_CREDENTIALS` 하나로 응답.
- **응답에 비밀번호 미포함:** 어떤 응답에도 `password`는 포함되지 않습니다.

## 4. 구현을 막는 미결 사항

- 회원 기능 범위 (질문 1)
- 인증 방식과 토큰 수명, Refresh 토큰 여부 (질문 2)
- 회원 필드와 비밀번호 규칙 (질문 3)
- 실제 Base URL과 CORS 허용 도메인

## 범위 밖 (Out of scope)

소셜 로그인, 이메일 인증, 비밀번호 찾기·재설정·변경, 이메일 변경, 회원 탈퇴, 관리자용 회원 관리 API는 요청 범위가 확인되지 않아 설계하지 않았습니다.

## Suggested (not required)

- 로그인에 IP·계정 기준 rate limit(예: 5회/분) 적용 후 `429 TOO_MANY_REQUESTS` 반환.
- Refresh 토큰(`POST /auth/refresh`)을 도입해 재로그인 빈도를 줄이기.
- 프론트가 오늘 바로 붙을 수 있도록 위 예시 응답으로 mock 서버를 먼저 띄우기.
