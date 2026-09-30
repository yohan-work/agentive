급하시니 일반적인 회원 기능 기준으로 바로 쓸 수 있는 초안을 먼저 드릴게요. 프론트가 내일부터 붙을 수 있도록 요청/응답 형태를 확정해 두고, 서비스마다 달라지는 부분은 맨 아래 "확인 필요"에 따로 모았습니다. 거기에 답만 주시면 바로 고쳐 드릴게요.

---

# 회원 API 명세 (v1 초안)

## 공통 규칙

- Base URL: `/api/v1`
- Content-Type: `application/json; charset=utf-8`
- 인증: `Authorization: Bearer {accessToken}` (🔒 표시된 API만 필요)
- 시간: ISO 8601 UTC (예: `2026-09-30T09:00:00Z`)
- 필드명: camelCase

### 공통 에러 응답

```json
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "이미 가입된 이메일입니다.",
    "fields": { "email": "이미 사용 중입니다." }
  }
}
```

| HTTP | code | 의미 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 입력값 형식 오류 (`fields`에 필드별 사유) |
| 401 | `UNAUTHORIZED` | 토큰 없음/만료/위조 |
| 401 | `INVALID_CREDENTIALS` | 이메일 또는 비밀번호 불일치 |
| 403 | `FORBIDDEN` | 권한 없음 |
| 404 | `NOT_FOUND` | 리소스 없음 |
| 409 | `EMAIL_ALREADY_EXISTS` | 이메일 중복 |
| 409 | `NICKNAME_ALREADY_EXISTS` | 닉네임 중복 |
| 429 | `TOO_MANY_REQUESTS` | 요청 과다 |
| 500 | `INTERNAL_ERROR` | 서버 오류 |

프론트는 `message`를 그대로 노출하지 말고 `code` 기준으로 분기하는 걸 권장합니다.

### User 객체

```json
{
  "id": "usr_01J9ZK3X8Q",
  "email": "user@example.com",
  "nickname": "홍길동",
  "profileImageUrl": null,
  "marketingAgreed": false,
  "createdAt": "2026-09-30T09:00:00Z"
}
```

---

## 1. 회원가입

`POST /auth/signup`

요청
```json
{
  "email": "user@example.com",
  "password": "P@ssw0rd!",
  "nickname": "홍길동",
  "agreements": {
    "terms": true,
    "privacy": true,
    "marketing": false
  }
}
```

검증 규칙
- `email`: 이메일 형식, 최대 255자
- `password`: 8~64자, 영문+숫자+특수문자 중 2종 이상
- `nickname`: 2~20자, 한글/영문/숫자
- `agreements.terms`, `agreements.privacy`: 반드시 `true`

응답 `201 Created`
```json
{
  "user": { /* User */ },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

에러: `400 VALIDATION_ERROR`, `409 EMAIL_ALREADY_EXISTS`, `409 NICKNAME_ALREADY_EXISTS`

## 2. 이메일 / 닉네임 중복 확인

`GET /auth/check-email?email=user@example.com`
`GET /auth/check-nickname?nickname=홍길동`

응답 `200 OK`
```json
{ "available": true }
```

## 3. 로그인

`POST /auth/login`

요청
```json
{ "email": "user@example.com", "password": "P@ssw0rd!" }
```

응답 `200 OK`
```json
{
  "user": { /* User */ },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 1800
}
```

에러: `401 INVALID_CREDENTIALS`, `429 TOO_MANY_REQUESTS` (5회 연속 실패 시)

## 4. 토큰 재발급

`POST /auth/refresh`

요청
```json
{ "refreshToken": "eyJ..." }
```

응답 `200 OK`
```json
{ "accessToken": "eyJ...", "refreshToken": "eyJ...", "expiresIn": 1800 }
```

- Refresh 토큰은 재발급 시마다 교체(rotation)됩니다. 이전 refresh 토큰은 즉시 무효.
- 에러: `401 UNAUTHORIZED` → 프론트는 로그인 화면으로 이동

## 5. 로그아웃 🔒

`POST /auth/logout`

요청
```json
{ "refreshToken": "eyJ..." }
```

응답 `204 No Content`

## 6. 내 정보 조회 🔒

`GET /users/me`

응답 `200 OK` → `User`

## 7. 내 정보 수정 🔒

`PATCH /users/me`

요청 (보낸 필드만 수정)
```json
{
  "nickname": "새닉네임",
  "profileImageUrl": "https://cdn.example.com/p/abc.png",
  "marketingAgreed": true
}
```

응답 `200 OK` → 수정된 `User`

에러: `400 VALIDATION_ERROR`, `409 NICKNAME_ALREADY_EXISTS`

## 8. 비밀번호 변경 🔒

`PUT /users/me/password`

요청
```json
{ "currentPassword": "P@ssw0rd!", "newPassword": "N3wP@ss!" }
```

응답 `204 No Content`

에러: `401 INVALID_CREDENTIALS` (현재 비밀번호 불일치), `400 VALIDATION_ERROR`

- 변경 시 다른 기기의 refresh 토큰은 모두 무효화합니다.

## 9. 비밀번호 재설정 (비로그인)

`POST /auth/password-reset/request`
```json
{ "email": "user@example.com" }
```
응답 `202 Accepted` (가입 여부와 상관없이 항상 동일하게 응답 — 이메일 존재 여부 노출 방지)

`POST /auth/password-reset/confirm`
```json
{ "token": "메일로 받은 토큰", "newPassword": "N3wP@ss!" }
```
응답 `204 No Content`
에러: `400 INVALID_OR_EXPIRED_TOKEN`

## 10. 회원 탈퇴 🔒

`DELETE /users/me`

요청
```json
{ "password": "P@ssw0rd!", "reason": "선택 입력" }
```

응답 `204 No Content`

---

## 프론트 연동 메모

- Access 토큰 만료(401) → `/auth/refresh` 1회 시도 → 실패 시 로그아웃 처리. 동시에 여러 요청이 401을 받으면 refresh는 한 번만 호출하도록 큐잉해 주세요.
- 백엔드가 준비되기 전이라면 위 JSON 예시를 그대로 목(mock) 응답으로 쓰시면 됩니다. 필요하면 OpenAPI(YAML) 파일로도 변환해 드릴게요. Swagger UI나 MSW 목 서버를 바로 띄울 수 있습니다.

---

## 확인 필요 (답 주시면 바로 반영)

내일 프론트 작업에 영향이 큰 순서대로 정리했습니다.

1. **로그인 방식**: 이메일/비밀번호만인가요, 소셜 로그인(카카오/네이버/구글/애플)도 있나요? 소셜이 있으면 `POST /auth/oauth/{provider}` 추가가 필요합니다.
2. **토큰 전달 방식**: 위 초안은 응답 body로 토큰을 주는 방식입니다. 웹 전용이라면 refresh 토큰은 HttpOnly 쿠키로 주는 게 더 안전한데, 그러면 프론트 처리 방식이 바뀝니다.
3. **가입 시 인증**: 이메일 인증이나 휴대폰 본인인증이 필요한가요? 필요하면 가입 흐름이 한 단계 늘어납니다.
4. **회원 필드**: 이름, 휴대폰번호, 생년월일, 성별 등 추가로 받는 정보가 있나요?
5. **프로필 이미지 업로드**: 이미지 업로드 API(presigned URL 방식 등)가 이미 있나요?
6. **탈퇴 정책**: 즉시 삭제인지, 일정 기간 보관 후 삭제(soft delete)인지, 같은 이메일로 재가입이 가능한지요.
7. **관리자 기능**: 회원 목록 조회/정지 같은 관리자용 API도 이번 범위에 포함되나요?

1~3번만 먼저 알려 주셔도 프론트가 막히지 않게 명세를 확정할 수 있어요.
