급하시다고 하니 일단 **일반적인 회원 기능 기준으로 바로 쓸 수 있는 초안**을 드리고, 확인이 필요한 부분은 맨 아래에 정리해 두겠습니다. 프론트는 이 초안으로 먼저 붙이고, 확정되면 차이만 반영하시면 됩니다.

---

# 회원(Member) API 명세 v0.1 (초안)

## 공통 사항

- **Base URL**: `/api/v1`
- **Content-Type**: `application/json; charset=utf-8`
- **인증**: `Authorization: Bearer {accessToken}` (JWT 가정)
  - Access Token 만료: 30분 / Refresh Token 만료: 14일 (가정)
- **날짜 형식**: ISO 8601 (`2026-09-30T10:00:00+09:00`)
- **공통 에러 응답**

```json
{
  "code": "MEMBER_NOT_FOUND",
  "message": "회원을 찾을 수 없습니다.",
  "details": null
}
```

| HTTP | code | 설명 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 입력값 오류 (`details`에 필드별 오류) |
| 401 | `UNAUTHORIZED` | 토큰 없음/유효하지 않음 |
| 401 | `TOKEN_EXPIRED` | Access Token 만료 → refresh 호출 |
| 403 | `FORBIDDEN` | 권한 없음 |
| 404 | `MEMBER_NOT_FOUND` | 회원 없음 |
| 409 | `DUPLICATE_EMAIL` | 이메일 중복 |
| 409 | `DUPLICATE_NICKNAME` | 닉네임 중복 |
| 500 | `INTERNAL_ERROR` | 서버 오류 |

`VALIDATION_ERROR`의 `details` 예시:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "입력값이 올바르지 않습니다.",
  "details": [
    { "field": "password", "reason": "8자 이상, 영문/숫자/특수문자를 포함해야 합니다." }
  ]
}
```

---

## 엔드포인트 요약

| # | Method | Path | 설명 | 인증 |
|---|---|---|---|---|
| 1 | POST | `/members` | 회원가입 | X |
| 2 | GET | `/members/check-email?email=` | 이메일 중복 확인 | X |
| 3 | GET | `/members/check-nickname?nickname=` | 닉네임 중복 확인 | X |
| 4 | POST | `/auth/login` | 로그인 | X |
| 5 | POST | `/auth/refresh` | 토큰 재발급 | X (Refresh Token) |
| 6 | POST | `/auth/logout` | 로그아웃 | O |
| 7 | GET | `/members/me` | 내 정보 조회 | O |
| 8 | PATCH | `/members/me` | 내 정보 수정 | O |
| 9 | PATCH | `/members/me/password` | 비밀번호 변경 | O |
| 10 | DELETE | `/members/me` | 회원 탈퇴 | O |
| 11 | POST | `/auth/password-reset/request` | 비밀번호 재설정 메일 요청 | X |
| 12 | POST | `/auth/password-reset/confirm` | 비밀번호 재설정 | X |

---

## 1. 회원가입

`POST /members`

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

| 필드 | 타입 | 필수 | 규칙 |
|---|---|---|---|
| email | string | O | 이메일 형식, 최대 100자 |
| password | string | O | 8~20자, 영문+숫자+특수문자 |
| nickname | string | O | 2~12자, 한글/영문/숫자 |
| agreements.terms | boolean | O | `true`여야 함 |
| agreements.privacy | boolean | O | `true`여야 함 |
| agreements.marketing | boolean | X | 기본값 `false` |

**Response** `201 Created`

```json
{
  "id": 1024,
  "email": "user@example.com",
  "nickname": "홍길동",
  "createdAt": "2026-09-30T10:00:00+09:00"
}
```

**Errors**: `400 VALIDATION_ERROR`, `409 DUPLICATE_EMAIL`, `409 DUPLICATE_NICKNAME`

> 가입 후 자동 로그인이 필요하면 응답에 토큰을 포함할지 결정 필요 (아래 확인 사항 참고).

---

## 2. 이메일 중복 확인

`GET /members/check-email?email=user@example.com`

**Response** `200 OK`

```json
{ "available": false }
```

## 3. 닉네임 중복 확인

`GET /members/check-nickname?nickname=홍길동`

**Response** `200 OK`

```json
{ "available": true }
```

---

## 4. 로그인

`POST /auth/login`

**Request**

```json
{
  "email": "user@example.com",
  "password": "Passw0rd!"
}
```

**Response** `200 OK`

```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "expiresIn": 1800,
  "member": {
    "id": 1024,
    "email": "user@example.com",
    "nickname": "홍길동",
    "profileImageUrl": null
  }
}
```

**Errors**: `400 VALIDATION_ERROR`, `401 INVALID_CREDENTIALS` (이메일/비밀번호 불일치 — 보안상 어느 쪽이 틀렸는지 구분하지 않음), `423 ACCOUNT_LOCKED` (로그인 5회 실패 시, 선택)

---

## 5. 토큰 재발급

`POST /auth/refresh`

**Request**

```json
{ "refreshToken": "eyJhbGciOi..." }
```

**Response** `200 OK`

```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "expiresIn": 1800
}
```

**Errors**: `401 INVALID_REFRESH_TOKEN` → 프론트는 로그인 화면으로 이동

> Refresh Token Rotation 적용 가정: 재발급 시 refreshToken도 새로 내려가므로 반드시 교체 저장.

---

## 6. 로그아웃

`POST /auth/logout`

**Request**

```json
{ "refreshToken": "eyJhbGciOi..." }
```

**Response** `204 No Content`

---

## 7. 내 정보 조회

`GET /members/me`

**Response** `200 OK`

```json
{
  "id": 1024,
  "email": "user@example.com",
  "nickname": "홍길동",
  "profileImageUrl": "https://cdn.example.com/profile/1024.png",
  "agreements": {
    "marketing": false
  },
  "createdAt": "2026-09-30T10:00:00+09:00",
  "updatedAt": "2026-09-30T10:00:00+09:00"
}
```

---

## 8. 내 정보 수정

`PATCH /members/me`

보낸 필드만 수정됩니다.

**Request**

```json
{
  "nickname": "새닉네임",
  "profileImageUrl": "https://cdn.example.com/profile/1024-new.png",
  "marketingAgreed": true
}
```

**Response** `200 OK` — 7번과 동일한 형태

**Errors**: `400 VALIDATION_ERROR`, `409 DUPLICATE_NICKNAME`

> 프로필 이미지 업로드 방식(별도 업로드 API / Presigned URL)은 확인 필요.

---

## 9. 비밀번호 변경

`PATCH /members/me/password`

**Request**

```json
{
  "currentPassword": "Passw0rd!",
  "newPassword": "NewPassw0rd!"
}
```

**Response** `204 No Content`

**Errors**: `400 VALIDATION_ERROR`, `400 INVALID_CURRENT_PASSWORD`, `400 SAME_AS_OLD_PASSWORD`

---

## 10. 회원 탈퇴

`DELETE /members/me`

**Request**

```json
{
  "password": "Passw0rd!",
  "reason": "서비스를 자주 이용하지 않아요"
}
```

**Response** `204 No Content`

> 탈퇴 후 모든 토큰 무효화. Soft delete 후 N일 보관 여부는 정책 확인 필요.

---

## 11. 비밀번호 재설정 메일 요청

`POST /auth/password-reset/request`

**Request**

```json
{ "email": "user@example.com" }
```

**Response** `202 Accepted` — 가입되지 않은 이메일이어도 동일하게 응답 (계정 존재 여부 노출 방지)

## 12. 비밀번호 재설정

`POST /auth/password-reset/confirm`

**Request**

```json
{
  "token": "메일 링크에 포함된 토큰",
  "newPassword": "NewPassw0rd!"
}
```

**Response** `204 No Content`

**Errors**: `400 INVALID_OR_EXPIRED_TOKEN`, `400 VALIDATION_ERROR`

---

## 확인이 필요한 사항 (답 주시면 v0.2로 바로 반영할게요)

1. **로그인 방식**: 이메일/비밀번호만인지, 소셜 로그인(카카오/네이버/구글/애플)도 있는지
2. **토큰 전달 방식**: 응답 바디(위 초안) vs HttpOnly 쿠키 — 웹이면 쿠키 방식을 권장하는데, 그러면 4·5·6번 요청/응답이 바뀝니다
3. **가입 필드**: 이름, 휴대폰 번호, 생년월일, 성별 등 추가 필드 여부 / 휴대폰·이메일 인증 필요 여부
4. **가입 후 흐름**: 자동 로그인(토큰 반환) vs 이메일 인증 후 로그인
5. **프로필 이미지 업로드** 방식
6. **탈퇴 정책**: 즉시 삭제 vs 유예 기간, 재가입 제한
7. **ID 타입**: 숫자(`1024`) vs UUID 문자열

**프론트가 내일 바로 붙어야 한다면** 이 명세 그대로 목(mock) 서버를 먼저 띄우는 걸 추천드립니다. 필요하시면 이 내용을 **OpenAPI(Swagger) YAML**로 변환해 드릴게요 — MSW나 Prism으로 바로 목 서버를 만들 수 있고, 백엔드와 프론트가 같은 계약을 기준으로 작업할 수 있습니다.
