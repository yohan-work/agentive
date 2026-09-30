급하신 상황이니 **바로 붙일 수 있는 초안(v0.1)**을 먼저 드리고, 확정이 꼭 필요한 부분만 질문으로 정리했습니다. 아래 질문에 답이 없으면 표시된 **기본 가정**대로 진행하시면 됩니다.

---

## 0. 먼저 확인이 필요한 것 (답 주시면 바로 수정)

| # | 질문 | 답이 없을 때의 기본 가정 |
|---|---|---|
| 1 | 로그인 방식은? (이메일+비밀번호 / 소셜 / 둘 다) | 이메일+비밀번호만 |
| 2 | 인증 토큰 방식은? (JWT Bearer / 세션 쿠키) | JWT: Access(헤더) + Refresh(HttpOnly 쿠키) |
| 3 | 가입 시 이메일 인증이 필요한가요? | 필요 없음 (v0.2에서 추가 가능하도록 필드만 예약) |
| 4 | "회원 기능" 범위에 탈퇴·비밀번호 재설정까지 포함되나요? | 포함 (아래 7번, 9번, 10번) |
| 5 | 회원 정보 필드는? | email, password, name, nickname, phone(선택) |

> 1, 2번은 프론트 구현 방식(토큰 저장 위치, 인터셉터)을 바꾸므로 **오늘 안에** 확정하시는 걸 권합니다. 나머지는 나중에 바뀌어도 프론트 영향이 작습니다.

---

## 1. 공통 규칙

- **Base URL**: `/api/v1`
- **Content-Type**: `application/json; charset=utf-8`
- **인증**: `Authorization: Bearer {accessToken}`
- **Access Token 만료**: 30분 / **Refresh Token 만료**: 14일 (HttpOnly, Secure, SameSite=Lax 쿠키)
- **시간 형식**: ISO 8601 UTC (`2026-09-30T09:00:00Z`)
- **필드 표기**: camelCase

### 에러 응답 형식 (모든 API 공통)

```json
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "이미 사용 중인 이메일입니다.",
    "details": [{ "field": "email", "reason": "duplicate" }]
  }
}
```

프론트는 `message`가 아닌 **`code`로 분기**해 주세요. `message`는 문구가 바뀔 수 있습니다.

### 공통 에러 코드

| HTTP | code | 의미 |
|---|---|---|
| 400 | `VALIDATION_FAILED` | 입력값 검증 실패 (`details`에 필드별 사유) |
| 401 | `UNAUTHORIZED` | 토큰 없음/유효하지 않음 |
| 401 | `TOKEN_EXPIRED` | Access Token 만료 → refresh 호출 |
| 403 | `FORBIDDEN` | 권한 없음 |
| 404 | `NOT_FOUND` | 리소스 없음 |
| 429 | `TOO_MANY_REQUESTS` | 요청 과다 |
| 500 | `INTERNAL_ERROR` | 서버 오류 |

---

## 2. 엔드포인트 요약

| # | Method | Path | 인증 | 설명 |
|---|---|---|---|---|
| 1 | POST | `/auth/signup` | - | 회원가입 |
| 2 | GET | `/auth/email-availability?email=` | - | 이메일 중복 확인 |
| 3 | POST | `/auth/login` | - | 로그인 |
| 4 | POST | `/auth/refresh` | 쿠키 | 토큰 재발급 |
| 5 | POST | `/auth/logout` | O | 로그아웃 |
| 6 | GET | `/users/me` | O | 내 정보 조회 |
| 7 | PATCH | `/users/me` | O | 내 정보 수정 |
| 8 | PUT | `/users/me/password` | O | 비밀번호 변경 |
| 9 | POST | `/auth/password-reset/request` | - | 비밀번호 재설정 메일 요청 |
| 10 | POST | `/auth/password-reset/confirm` | - | 비밀번호 재설정 |
| 11 | DELETE | `/users/me` | O | 회원 탈퇴 |

---

## 3. 상세 명세

### 1) 회원가입 `POST /auth/signup`

**Request**
```json
{
  "email": "user@example.com",
  "password": "Passw0rd!",
  "name": "홍길동",
  "nickname": "gildong",
  "phone": "01012345678",
  "agreements": { "terms": true, "privacy": true, "marketing": false }
}
```

**검증 규칙**
- `email`: 이메일 형식, 최대 254자
- `password`: 8~64자, 영문·숫자·특수문자 중 2종 이상
- `name`: 1~30자 / `nickname`: 2~20자, 중복 불가
- `phone`: 선택, 숫자만 10~11자리
- `agreements.terms`, `agreements.privacy`: 반드시 `true`

**Response `201 Created`**
```json
{
  "user": {
    "id": "usr_01J9ZK3...",
    "email": "user@example.com",
    "name": "홍길동",
    "nickname": "gildong",
    "createdAt": "2026-09-30T09:00:00Z"
  }
}
```
> 가입 후 자동 로그인은 하지 않는다고 가정했습니다. 자동 로그인이 필요하면 로그인 응답과 같은 토큰을 함께 내려주도록 바꾸면 됩니다.

**에러**: `409 EMAIL_ALREADY_EXISTS`, `409 NICKNAME_ALREADY_EXISTS`, `400 VALIDATION_FAILED`

---

### 2) 이메일 중복 확인 `GET /auth/email-availability?email=user@example.com`

**Response `200`**
```json
{ "available": false }
```

---

### 3) 로그인 `POST /auth/login`

**Request**
```json
{ "email": "user@example.com", "password": "Passw0rd!" }
```

**Response `200`** (+ `Set-Cookie: refreshToken=...; HttpOnly; Secure; Path=/api/v1/auth`)
```json
{
  "accessToken": "eyJhbGciOi...",
  "expiresIn": 1800,
  "user": { "id": "usr_01J9ZK3...", "email": "user@example.com", "nickname": "gildong" }
}
```

**에러**: `401 INVALID_CREDENTIALS` (이메일/비밀번호 중 무엇이 틀렸는지 구분하지 않음), `423 ACCOUNT_LOCKED` (5회 연속 실패 시 15분 잠금)

---

### 4) 토큰 재발급 `POST /auth/refresh`

- Body 없음. Refresh Token은 쿠키로 자동 전송 (프론트는 `credentials: 'include'` 필요)

**Response `200`**
```json
{ "accessToken": "eyJhbGciOi...", "expiresIn": 1800 }
```
**에러**: `401 REFRESH_TOKEN_INVALID` → 로그인 화면으로 이동

---

### 5) 로그아웃 `POST /auth/logout`

**Response `204 No Content`** (Refresh 쿠키 삭제, 서버 측 토큰 무효화)

---

### 6) 내 정보 조회 `GET /users/me`

**Response `200`**
```json
{
  "id": "usr_01J9ZK3...",
  "email": "user@example.com",
  "name": "홍길동",
  "nickname": "gildong",
  "phone": "01012345678",
  "agreements": { "marketing": false },
  "createdAt": "2026-09-30T09:00:00Z",
  "updatedAt": "2026-09-30T09:00:00Z"
}
```

---

### 7) 내 정보 수정 `PATCH /users/me`

보낸 필드만 수정됩니다. `email`은 이 API로 변경 불가.

**Request**
```json
{ "nickname": "newnick", "phone": "01098765432", "agreements": { "marketing": true } }
```
**Response `200`**: 6번과 동일한 구조
**에러**: `409 NICKNAME_ALREADY_EXISTS`, `400 VALIDATION_FAILED`

---

### 8) 비밀번호 변경 `PUT /users/me/password`

**Request**
```json
{ "currentPassword": "Passw0rd!", "newPassword": "NewPassw0rd!" }
```
**Response `204`**
**에러**: `400 CURRENT_PASSWORD_MISMATCH`, `400 VALIDATION_FAILED`, `400 SAME_AS_OLD_PASSWORD`

---

### 9) 비밀번호 재설정 요청 `POST /auth/password-reset/request`

**Request**
```json
{ "email": "user@example.com" }
```
**Response `202 Accepted`**: 가입 여부와 상관없이 항상 같은 응답 (계정 존재 여부 노출 방지)

---

### 10) 비밀번호 재설정 `POST /auth/password-reset/confirm`

**Request**
```json
{ "token": "메일 링크에 포함된 토큰", "newPassword": "NewPassw0rd!" }
```
**Response `204`**
**에러**: `400 RESET_TOKEN_INVALID`, `400 RESET_TOKEN_EXPIRED` (유효시간 30분)

---

### 11) 회원 탈퇴 `DELETE /users/me`

**Request**
```json
{ "password": "Passw0rd!", "reason": "선택 입력" }
```
**Response `204`** (모든 토큰 무효화, Refresh 쿠키 삭제)
**에러**: `400 CURRENT_PASSWORD_MISMATCH`

> DELETE에 Body를 싣는 게 일부 클라이언트/프록시에서 문제가 되면 `POST /users/me/withdrawal`로 바꾸세요.

---

## 4. 가정 정리

- 이메일+비밀번호 로그인만, 소셜 로그인 없음
- 이메일 인증 없음, 가입 즉시 활성화
- 권한(Role)은 일반 회원 하나만 존재 (관리자 API는 범위 밖)
- 사용자 ID는 순번이 아닌 문자열 (예: ULID). 프론트는 **문자열로 취급**
- 탈퇴는 소프트 삭제, 같은 이메일로 재가입 정책은 미정

## 5. 권장 사항 (내일 연동을 위해)

1. **Mock 서버를 오늘 띄우세요.** 이 명세를 OpenAPI(YAML)로 옮기고 Prism이나 MSW로 목 응답을 제공하면, 백엔드 구현과 상관없이 프론트가 내일 바로 작업할 수 있습니다. 원하시면 OpenAPI 파일로 변환해 드리겠습니다.
2. **우선순위를 나누세요.** 내일 먼저 필요한 건 보통 1·3·4·6번입니다. 나머지(8~11번)는 목으로 두고 뒤에 구현해도 됩니다.
3. **401 처리 흐름을 프론트와 먼저 합의하세요.** `TOKEN_EXPIRED` → refresh 1회 시도 → 실패 시 로그아웃. 이게 가장 자주 어긋나는 지점입니다.

## 6. 리스크

| 리스크 | 영향 | 대응 |
|---|---|---|
| 토큰 방식(질문 2)이 나중에 바뀜 | 프론트 인증 로직 전면 수정 | 오늘 확정 |
| 쿠키 기반 Refresh + 프론트/백 도메인 다름 | CORS·쿠키 전송 실패 | `Access-Control-Allow-Credentials`, 허용 Origin 명시, SameSite 설정 확인 |
| 소셜 로그인이 뒤늦게 추가됨 | `password` 필수 전제가 깨짐 | 필요 가능성이 있으면 지금 알려주세요 |
| 에러 코드 목록 누락 | 프론트가 `message` 문자열로 분기 | 코드 목록을 이 문서에서만 관리 |

## 7. 다음 액션

- [ ] **(오늘, 기획/백엔드)** 0번 질문 1·2번 확정
- [ ] **(오늘, 백엔드)** 이 초안 기준 Mock 서버 제공
- [ ] **(내일, 프론트)** 1·3·4·6번부터 연동 시작
- [ ] **(이번 주)** 확정 사항 반영해 v1.0으로 고정, 이후 변경은 변경 이력으로 관리

0번 질문에 답 주시면 바로 v0.2로 수정하고, 필요하면 OpenAPI 3.0 YAML로도 드리겠습니다.
