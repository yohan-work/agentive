급한 상황이라 질문만 드리고 기다리게 하지 않겠습니다. 정보가 없는 부분은 **가장 흔한 구성으로 가정해서 v0 명세를 먼저 드리고**, 틀리면 바뀌는 부분만 아래에서 확인받겠습니다. 프론트는 이 v0로 오늘 바로 목(mock) 작업을 시작할 수 있습니다.

---

## 1. 꼭 확인이 필요한 3가지 (답 주시면 명세를 확정합니다)

아래 셋은 화면 흐름과 토큰 처리 방식이 달라지는 항목이라 확인이 필요합니다. 나머지는 가정으로 진행해도 됩니다.

1. **가입/로그인 방식**: 이메일+비밀번호만인가요, 소셜 로그인(카카오/구글/애플 등)도 포함인가요?
   - 가정: 이메일+비밀번호만. 소셜은 2차 범위.
2. **인증 토큰 방식**: 웹 전용인가요, 앱(모바일)도 붙나요?
   - 가정: 웹. Access Token은 응답 body로 주고 `Authorization: Bearer` 헤더로 보내며, Refresh Token은 `HttpOnly` 쿠키에 담습니다.
3. **가입 시 필수 항목과 인증 절차**: 이메일 인증이 필수인가요? 휴대폰 번호나 약관 동의 항목이 있나요?
   - 가정: 이메일, 비밀번호, 닉네임, 필수 약관 동의. 이메일 인증은 가입 후 별도로 진행하고 로그인은 허용합니다.

---

## 2. 공통 규약

| 항목 | 내용 |
|---|---|
| Base URL | `/api/v1` |
| Content-Type | `application/json; charset=utf-8` |
| 인증 | `Authorization: Bearer {accessToken}` |
| Access Token 만료 | 30분 (가정) |
| Refresh Token | `HttpOnly; Secure; SameSite=Lax` 쿠키, 14일 (가정) |
| 시간 형식 | ISO 8601 UTC (`2026-09-29T09:00:00Z`) |
| ID | 문자열 (`"usr_01H..."`), 숫자로 가정하지 않기 |
| 필드 네이밍 | camelCase |

**에러 응답 형식 (모든 API 공통)**

```json
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "이미 가입된 이메일입니다.",
    "fields": { "email": "이미 사용 중입니다." }
  }
}
```

- 프론트는 `message`가 아니라 **`code`로 분기**합니다. `message`는 표시용이고 바뀔 수 있습니다.
- `fields`는 입력값 검증 오류(400)일 때만 들어갑니다.

**공통 에러 코드**

| HTTP | code | 의미 |
|---|---|---|
| 400 | `VALIDATION_FAILED` | 입력값 형식 오류 (`fields` 포함) |
| 401 | `UNAUTHORIZED` | 토큰 없음 또는 유효하지 않음 |
| 401 | `TOKEN_EXPIRED` | Access Token 만료. refresh 후 재시도 |
| 403 | `FORBIDDEN` | 권한 없음 |
| 404 | `NOT_FOUND` | 리소스 없음 |
| 429 | `TOO_MANY_REQUESTS` | 요청 과다 (`Retry-After` 헤더) |
| 500 | `INTERNAL_ERROR` | 서버 오류 |

---

## 3. 엔드포인트 목록

| # | Method | Path | 인증 | 설명 |
|---|---|---|---|---|
| 1 | POST | `/auth/signup` | X | 회원가입 |
| 2 | POST | `/auth/login` | X | 로그인 |
| 3 | POST | `/auth/refresh` | 쿠키 | Access Token 재발급 |
| 4 | POST | `/auth/logout` | O | 로그아웃 |
| 5 | GET | `/auth/check-email?email=` | X | 이메일 중복 확인 |
| 6 | GET | `/users/me` | O | 내 정보 조회 |
| 7 | PATCH | `/users/me` | O | 내 정보 수정 |
| 8 | PUT | `/users/me/password` | O | 비밀번호 변경 |
| 9 | POST | `/auth/password-reset/request` | X | 비밀번호 재설정 메일 요청 |
| 10 | POST | `/auth/password-reset/confirm` | X | 비밀번호 재설정 |
| 11 | POST | `/auth/email-verification/send` | O | 인증 메일 (재)발송 |
| 12 | POST | `/auth/email-verification/confirm` | X | 이메일 인증 완료 |
| 13 | DELETE | `/users/me` | O | 회원 탈퇴 |

---

## 4. 상세 명세

### 공통 User 객체

```json
{
  "id": "usr_01HZX3...",
  "email": "user@example.com",
  "nickname": "홍길동",
  "profileImageUrl": null,
  "emailVerified": false,
  "marketingAgreed": false,
  "createdAt": "2026-09-29T09:00:00Z"
}
```

### 1) POST `/auth/signup`

**Request**
```json
{
  "email": "user@example.com",
  "password": "Passw0rd!",
  "nickname": "홍길동",
  "agreements": {
    "terms": true,
    "privacy": true,
    "marketing": false
  }
}
```

**검증 규칙 (가정)**
- `email`: 이메일 형식, 최대 254자
- `password`: 8~64자, 영문, 숫자, 특수문자 중 2종 이상
- `nickname`: 2~20자
- `agreements.terms`, `agreements.privacy`: 반드시 `true`

**Response `201`**: 가입 후 바로 로그인된 상태로 응답합니다. Refresh Token은 쿠키로 내려갑니다.
```json
{
  "accessToken": "eyJ...",
  "expiresIn": 1800,
  "user": { /* User */ }
}
```

**Errors**: `400 VALIDATION_FAILED`, `409 EMAIL_ALREADY_EXISTS`, `400 REQUIRED_AGREEMENT_MISSING`

### 2) POST `/auth/login`

**Request**
```json
{ "email": "user@example.com", "password": "Passw0rd!" }
```

**Response `200`**: 1)과 같은 형식입니다.

**Errors**
- `401 INVALID_CREDENTIALS`: 이메일이 없는 경우와 비밀번호가 틀린 경우를 **구분하지 않습니다** (계정 존재 여부 노출 방지)
- `423 ACCOUNT_LOCKED`: 5회 연속 실패 시 15분 잠금 (가정)
- `403 ACCOUNT_WITHDRAWN`: 탈퇴한 계정

### 3) POST `/auth/refresh`

- Body 없음. 쿠키의 Refresh Token을 사용합니다.
- 프론트는 `credentials: 'include'`(fetch) 또는 `withCredentials: true`(axios)를 설정해야 합니다.

**Response `200`**
```json
{ "accessToken": "eyJ...", "expiresIn": 1800 }
```
Refresh Token은 호출할 때마다 교체(rotation)되어 쿠키로 다시 내려갑니다.

**Errors**: `401 REFRESH_TOKEN_INVALID` → 프론트는 로그인 화면으로 이동

### 4) POST `/auth/logout`

**Response `204`**: 서버는 Refresh Token을 폐기하고 쿠키를 삭제합니다. 프론트는 메모리의 Access Token을 지웁니다.

### 5) GET `/auth/check-email?email=user@example.com`

**Response `200`**
```json
{ "available": true }
```
Rate limit을 적용합니다 (IP당 분당 10회, 가정).

### 6) GET `/users/me`

**Response `200`**: User 객체

### 7) PATCH `/users/me`

**Request**: 보낸 필드만 수정합니다.
```json
{ "nickname": "새닉네임", "profileImageUrl": "https://...", "marketingAgreed": true }
```
- 이메일 변경은 이 API에서 **불가**합니다 (별도 인증 플로우가 필요해 2차 범위).
- 프로필 이미지 업로드 방식은 미정입니다 (아래 리스크 참고).

**Response `200`**: 수정된 User 객체

### 8) PUT `/users/me/password`

**Request**
```json
{ "currentPassword": "Passw0rd!", "newPassword": "NewPassw0rd!" }
```
**Response `204`**: 다른 기기의 세션(Refresh Token)은 모두 폐기합니다.

**Errors**: `400 INVALID_CURRENT_PASSWORD`, `400 VALIDATION_FAILED`, `400 SAME_AS_OLD_PASSWORD`

### 9) POST `/auth/password-reset/request`

**Request**
```json
{ "email": "user@example.com" }
```
**Response `202`**: 이메일이 존재하지 않아도 **항상 202**를 반환합니다 (계정 존재 여부 노출 방지). 메일의 링크는 `{FRONT_URL}/reset-password?token=...` 형식이며 30분 유효 (가정)입니다.

### 10) POST `/auth/password-reset/confirm`

**Request**
```json
{ "token": "rst_abc...", "newPassword": "NewPassw0rd!" }
```
**Response `204`**
**Errors**: `400 RESET_TOKEN_INVALID`, `400 RESET_TOKEN_EXPIRED`, `400 VALIDATION_FAILED`

### 11) POST `/auth/email-verification/send`

**Response `202`**: 재발송 간격은 60초 (가정)입니다. 60초 이내에 다시 요청하면 `429`를 반환합니다.
**Errors**: `409 ALREADY_VERIFIED`

### 12) POST `/auth/email-verification/confirm`

**Request**
```json
{ "token": "evf_abc..." }
```
**Response `204`**
**Errors**: `400 VERIFICATION_TOKEN_INVALID`, `400 VERIFICATION_TOKEN_EXPIRED`

### 13) DELETE `/users/me`

**Request**: 본인 확인을 위해 비밀번호를 받습니다.
```json
{ "password": "Passw0rd!", "reason": "선택 입력" }
```
**Response `204`**: 소프트 삭제 후 30일 유예 기간 뒤 파기합니다 (가정). 모든 세션을 폐기합니다.
**Errors**: `400 INVALID_PASSWORD`

---

## 5. 가정 정리

- 이메일+비밀번호 방식만 지원합니다. 소셜 로그인은 제외합니다.
- 웹 클라이언트이며, 프론트와 API가 같은 상위 도메인을 쓰거나 CORS에서 credentials를 허용합니다.
- 가입과 동시에 로그인 처리하고, 이메일 미인증 상태에서도 로그인할 수 있습니다.
- 권한(role) 구분은 없습니다. 일반 회원만 있습니다.
- 만료 시간, 잠금 정책, 비밀번호 규칙 등의 숫자는 모두 임시값입니다.

## 6. 권장 사항

- **오늘 목 서버부터 띄우기**: 이 명세를 OpenAPI(YAML)로 옮겨 Prism이나 MSW로 목을 띄우면, 백엔드 구현과 상관없이 프론트가 내일 바로 붙을 수 있습니다. 원하시면 OpenAPI YAML로 바로 변환해 드리겠습니다.
- **401 처리 인터셉터 하나로 통일**: `TOKEN_EXPIRED`를 받으면 refresh를 한 번 호출하고 원래 요청을 재시도합니다. refresh도 실패하면 로그아웃 처리합니다. 요청이 동시에 여러 개 나가도 refresh는 한 번만 호출되게 큐로 처리합니다.
- **Access Token은 메모리에만 저장**하고 localStorage에는 두지 않습니다. 새로고침하면 앱 시작 시 `/auth/refresh`를 호출해 복구합니다.
- 에러 분기는 반드시 `error.code` 기준으로 합니다.

## 7. 리스크

| 리스크 | 영향 | 대응 |
|---|---|---|
| 1번(소셜 로그인) 가정이 틀림 | 로그인 화면과 콜백 플로우가 추가되고, 계정 연동 정책이 필요해짐 | 확인되면 `/auth/oauth/{provider}` 계열을 추가합니다. 기존 API는 유지됩니다 |
| 2번(앱 지원) 가정이 틀림 | 앱에서는 쿠키 기반 refresh를 쓰기 어려움 | refresh token을 body로 주고받는 옵션을 추가합니다 |
| 쿠키/CORS 설정 불일치 | 로컬 개발 환경에서 refresh가 동작하지 않음 | 개발 환경의 도메인과 포트를 미리 합의합니다 (프록시 사용 권장) |
| 프로필 이미지 업로드 방식 미정 | 7번 API 연동이 지연됨 | Presigned URL 방식을 권장합니다. 별도 API로 추가하겠습니다 |
| 백엔드 구현 일정과 명세 불일치 | 프론트 재작업 발생 | v0 동결 후 변경은 필드 추가만 허용합니다 (삭제·이름 변경 금지) |

## 8. 다음 액션

1. **(지금)** 위 1장의 3가지 질문에 답해 주세요. 한 줄씩이면 충분합니다.
2. **(오늘)** 답을 반영해 v1으로 확정하고, OpenAPI YAML과 목 서버 설정을 제공합니다.
3. **(오늘)** 백엔드와 프론트가 에러 코드 목록과 토큰 쿠키 도메인에 합의합니다.
4. **(내일)** 프론트가 목 서버 기준으로 회원가입, 로그인, 내 정보 화면부터 연동을 시작합니다.
5. **(이후)** 실서버가 준비된 엔드포인트부터 목을 실서버로 교체합니다.

질문 3개에 답이 늦어져도 프론트는 위 가정대로 먼저 진행하셔도 됩니다. 가정이 틀려도 대부분은 **엔드포인트 추가**로 대응할 수 있어, 이미 만든 연동을 버릴 일은 적습니다.
