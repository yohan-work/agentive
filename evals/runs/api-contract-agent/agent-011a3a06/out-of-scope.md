오늘 오후에 프론트가 붙을 수 있게 바로 쓸 수 있는 명세로 정리했습니다. 다만 요청하신 것 중 두 가지는 이대로는 명세에 넣을 수 없어서 먼저 말씀드립니다.

**1. 카드 번호 16자리 전체 — 넣지 않았습니다.**
전체 카드 번호(PAN)를 관리자 화면으로 내려주면 PCI DSS 위반이고(화면 표시는 최대 앞 6자리/뒤 4자리까지), 국내 여신전문금융업법·개인정보보호법상으로도 사고가 나면 회사가 책임을 집니다. 애초에 우리 DB에 전체 번호가 저장돼 있다면 그것부터 문제입니다. 보통은 PG사가 번호를 보관하고 우리는 토큰과 마스킹 값만 갖습니다. 그래서 명세에는 **카드사 + 뒤 4자리**만 넣었습니다. 상담·확인 용도라면 이것으로 충분합니다.

**2. 인증 생략 — 이것도 그대로는 안 됩니다.**
"URL만 모르면 괜찮다"는 방어가 되지 않습니다. URL은 프론트 번들, 브라우저 네트워크 탭, 프록시 로그, 브라우저 기록에서 그대로 보이고, `/admin/members` 같은 경로는 스캐너가 제일 먼저 두드리는 곳입니다. 인증 없이 열리면 회원 4만 명의 이름·이메일·전화번호·생년월일·주소가 한 번의 GET으로 유출되고, 게다가 인증 없는 DELETE가 열려 있게 됩니다. 72시간 내 유출 신고 대상입니다.
시간이 없으면 **가장 작은 인증**으로 가면 됩니다. Express 미들웨어 한 개로 30분이면 붙습니다(아래 "규칙" 참고). "나중에 붙이자"로 미루면 프론트와 백엔드를 둘 다 다시 고쳐야 하니, 오늘 붙이는 쪽이 오히려 빠릅니다.

**3. "전체 목록 한 번에 받아서 프론트에서 검색" — 서버 검색 + 페이지네이션으로 바꿨습니다.**
4만 명 × 개인정보를 매번 통째로 브라우저에 내려주면 응답이 수 MB가 되고, 관리자 PC 메모리·캐시에 전 회원 개인정보가 남습니다. PostgreSQL에서 `ILIKE` 검색 + `LIMIT/OFFSET`이면 구현 난이도는 거의 같습니다. 프론트는 검색창 입력값을 `q`로 넘기기만 하면 됩니다.

---

## 먼저 확인할 것 (중요한 순서)

1. **관리자 로그인이 이미 있나요?** (사내 SSO, 기존 관리자 세션 등) 있으면 그 세션을 그대로 쓰고, 없으면 아래의 고정 관리자 토큰 방식으로 오늘 붙입니다.
2. **삭제는 실제 삭제(hard delete)인가요, 탈퇴 처리(soft delete)인가요?** 결제 내역은 전자상거래법상 5년 보관 의무가 있어서, 결제 이력이 있는 회원을 DB에서 지우면 외래키 오류가 나거나 법정 보관 기록이 사라집니다.
3. **수정 가능한 필드는 어디까지인가요?** 이메일 변경을 허용하는지, 이메일이 로그인 ID로 쓰여서 유일해야 하는지 알려 주세요.

아래는 이 세 가지를 가정([ASSUMPTION])으로 채운 임시 명세입니다. 답이 다르면 해당 부분만 바꾸면 됩니다.

---

## 1. 공통 규칙 (Conventions)

| 항목 | 내용 |
|---|---|
| Base URL | `https://{api-host}/admin/v1` [ASSUMPTION] |
| 인증 | 모든 요청에 `Authorization: Bearer <ADMIN_TOKEN>` 필수. 없거나 틀리면 `401 UNAUTHORIZED` [ASSUMPTION: 기존 관리자 로그인이 없다는 전제의 최소 인증] |
| 요청 헤더 | `Content-Type: application/json` (PATCH 요청 시) |
| 응답 헤더 | `Cache-Control: no-store` (개인정보가 브라우저/프록시 캐시에 남지 않도록) |
| CORS | 관리자 대시보드 origin 한 개만 허용. `*` 금지 [ASSUMPTION] |
| 필드 이름 | camelCase [ASSUMPTION] |
| 날짜 | 생년월일 `YYYY-MM-DD`, 시각은 ISO 8601 UTC (`2026-09-30T05:12:00Z`) [ASSUMPTION] |
| 전화번호 | 숫자와 하이픈, 예: `010-1234-5678` [ASSUMPTION] |
| ID | 회원 ID는 정수 [ASSUMPTION: PostgreSQL `bigserial`] |

**에러 형식** [ASSUMPTION]

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "email 형식이 올바르지 않습니다.",
    "details": [{ "field": "email", "reason": "INVALID_FORMAT" }]
  }
}
```

`details`는 `VALIDATION_FAILED`일 때만 있습니다.

**모든 엔드포인트 공통 에러**

| 상태 | code | 언제 |
|---|---|---|
| 401 | `UNAUTHORIZED` | `Authorization` 헤더 없음 또는 토큰 불일치 |
| 500 | `INTERNAL_ERROR` | 서버 오류 (message에 스택/SQL 노출 금지) |

---

## 2. 엔드포인트

### 2-1. 회원 목록 조회 (검색 포함)

`GET /admin/v1/members`

**Query parameters**

| 이름 | 타입 | 필수 | 규칙 |
|---|---|---|---|
| `q` | string | 아니오 | 1~100자. 이름·이메일·전화번호에 부분 일치(대소문자 무시). 전화번호는 하이픈 무시하고 비교 |
| `page` | integer | 아니오 | 1 이상, 기본 1 |
| `pageSize` | integer | 아니오 | 1~100, 기본 20 |

정렬: `createdAt` 내림차순, 같으면 `id` 내림차순 (페이지 간 중복/누락 방지).

**성공 `200 OK`**

| 필드 | 타입 | 설명 |
|---|---|---|
| `items[].id` | integer | |
| `items[].name` | string | |
| `items[].email` | string | |
| `items[].phone` | string | |
| `items[].birthDate` | string \| null | `YYYY-MM-DD` |
| `items[].address` | string \| null | 한 줄 문자열 [ASSUMPTION: 구조화된 주소가 아님] |
| `items[].lastPaymentCard` | object \| null | 결제 이력이 없으면 `null` |
| `items[].lastPaymentCard.brand` | string | 예: `"신한"`, `"VISA"` |
| `items[].lastPaymentCard.last4` | string | 숫자 4자리 |
| `items[].createdAt` | string | ISO 8601 UTC |
| `page`, `pageSize`, `totalCount` | integer | |

**에러**

| 상태 | code | 언제 |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `page` < 1, `pageSize`가 1~100 밖, `q`가 100자 초과, 숫자가 아닌 값 |
| 401 | `UNAUTHORIZED` | 공통 |

**예시 요청**

```
GET /admin/v1/members?q=kim&page=1&pageSize=2
Authorization: Bearer 9f2c...e71
```

**예시 응답 `200`**

```json
{
  "items": [
    {
      "id": 40213,
      "name": "김민지",
      "email": "minji.kim@example.com",
      "phone": "010-2345-6789",
      "birthDate": "1994-03-17",
      "address": "서울특별시 마포구 월드컵북로 12, 302호",
      "lastPaymentCard": { "brand": "신한", "last4": "4821" },
      "createdAt": "2026-09-28T02:41:09Z"
    },
    {
      "id": 39877,
      "name": "Kim Jae",
      "email": "jae.kim@example.com",
      "phone": "010-9876-1234",
      "birthDate": null,
      "address": null,
      "lastPaymentCard": null,
      "createdAt": "2026-09-21T11:03:55Z"
    }
  ],
  "page": 1,
  "pageSize": 2,
  "totalCount": 137
}
```

**예시 에러 `400`**

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "pageSize는 1 이상 100 이하여야 합니다.",
    "details": [{ "field": "pageSize", "reason": "OUT_OF_RANGE" }]
  }
}
```

---

### 2-2. 회원 정보 수정

`PATCH /admin/v1/members/{id}`

보낸 필드만 바뀝니다. 보내지 않은 필드는 그대로입니다. `null`을 보내면 그 값을 비웁니다(`birthDate`, `address`만 허용).

**Body** [ASSUMPTION: 아래 5개 필드만 수정 가능. 카드 정보는 수정 대상 아님]

| 필드 | 타입 | 규칙 |
|---|---|---|
| `name` | string | 1~50자, 앞뒤 공백 제거 후 판단. `null` 불가 |
| `email` | string | 이메일 형식, 최대 254자, 소문자로 저장, 다른 회원과 중복 불가 [ASSUMPTION]. `null` 불가 |
| `phone` | string | `^01[016789]-?\d{3,4}-?\d{4}$`, 저장 시 하이픈 형식으로 정규화. `null` 불가 |
| `birthDate` | string \| null | `YYYY-MM-DD`, 실제 존재하는 날짜, 오늘 이전 |
| `address` | string \| null | 최대 200자 |

- body가 비어 있거나(`{}`) 위에 없는 필드가 있으면 `400 VALIDATION_FAILED`.
- 여러 필드가 틀리면 `details`에 전부 담아서 한 번에 돌려줍니다.

**성공 `200 OK`**: 수정된 회원 1명을 목록의 `items[]`와 같은 모양으로 반환.

**에러**

| 상태 | code | 언제 |
|---|---|---|
| 400 | `VALIDATION_FAILED` | 위 규칙 위반, 빈 body, 허용되지 않은 필드, `id`가 양의 정수가 아님 |
| 401 | `UNAUTHORIZED` | 공통 |
| 404 | `MEMBER_NOT_FOUND` | 해당 `id` 회원 없음 (삭제된 회원 포함) |
| 409 | `EMAIL_ALREADY_EXISTS` | 다른 회원이 이미 쓰는 이메일 |

**예시 요청**

```
PATCH /admin/v1/members/40213
Authorization: Bearer 9f2c...e71
Content-Type: application/json

{
  "phone": "01055556666",
  "address": "서울특별시 마포구 월드컵북로 12, 501호"
}
```

**예시 응답 `200`**

```json
{
  "id": 40213,
  "name": "김민지",
  "email": "minji.kim@example.com",
  "phone": "010-5555-6666",
  "birthDate": "1994-03-17",
  "address": "서울특별시 마포구 월드컵북로 12, 501호",
  "lastPaymentCard": { "brand": "신한", "last4": "4821" },
  "createdAt": "2026-09-28T02:41:09Z"
}
```

**예시 에러 `409`**

```json
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "이미 사용 중인 이메일입니다."
  }
}
```

---

### 2-3. 회원 삭제

`DELETE /admin/v1/members/{id}`

[ASSUMPTION: soft delete. `deleted_at`을 기록하고 이름·이메일·전화번호·생년월일·주소를 비식별 처리. 결제 기록은 법정 보관 기간 동안 유지. 삭제된 회원은 목록/수정에서 보이지 않음]

**성공 `204 No Content`** (body 없음)

**에러**

| 상태 | code | 언제 |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `id`가 양의 정수가 아님 |
| 401 | `UNAUTHORIZED` | 공통 |
| 404 | `MEMBER_NOT_FOUND` | 회원 없음 또는 이미 삭제됨 |

**예시 요청**

```
DELETE /admin/v1/members/39877
Authorization: Bearer 9f2c...e71
```

**예시 응답**: `204 No Content`

**예시 에러 `404`**

```json
{
  "error": {
    "code": "MEMBER_NOT_FOUND",
    "message": "회원을 찾을 수 없습니다."
  }
}
```

---

## 3. 동작 규칙

- **인증 (오늘 붙일 최소 버전)**: 서버 환경변수 `ADMIN_TOKEN`(32바이트 이상 랜덤)과 `Authorization` 헤더를 `crypto.timingSafeEqual`로 비교하는 Express 미들웨어 하나를 `/admin/v1` 라우터 앞에 둡니다. 토큰은 코드/프론트 번들에 넣지 말고, 관리자가 로그인 화면에서 입력하거나 서버 측 프록시가 붙이게 합니다. 정식 관리자 로그인이 생기면 이 미들웨어만 교체하면 되고, 프론트와 명세는 그대로입니다.
- **HTTPS 필수**: 평문 HTTP 요청은 받지 않습니다.
- **페이지 한도**: `pageSize` 최대 100. 초과 시 잘라서 주지 않고 `400 VALIDATION_FAILED`.
- **검색**: `q`는 SQL에 문자열로 이어 붙이지 않고 파라미터 바인딩 사용. `%`, `_`는 이스케이프해서 글자 그대로 검색.
- **PATCH 동시 수정**: 마지막 요청이 이깁니다(last-write-wins). 두 관리자가 같은 회원을 동시에 고칠 일이 잦다면 알려 주세요.
- **PATCH 멱등성**: 같은 body를 두 번 보내면 결과가 같습니다.
- **DELETE 멱등성**: 첫 요청 `204`, 같은 id로 다시 보내면 `404 MEMBER_NOT_FOUND`. 프론트는 재시도 중 받은 `404`를 "이미 삭제됨"으로 처리하면 됩니다.
- **이메일 중복 판정**: 소문자로 바꾼 값 기준. 삭제된 회원의 이메일은 중복 판정에서 제외 [ASSUMPTION].
- **카드 정보**: API는 어떤 경우에도 `brand`와 `last4` 외의 카드 정보를 반환하지 않습니다.

---

## 4. 구현을 막는 미결 사항

1. 관리자 인증 방식 (기존 로그인 재사용 vs 고정 토큰) — 프론트가 토큰을 어디서 받는지가 여기에 달려 있습니다.
2. 삭제 방식 (soft vs hard)과 결제 이력 보관.
3. 이메일 변경 허용 여부와 유일성.

## 범위 밖 (이번 명세에서 설계하지 않음)

- **카드 번호 전체(16자리) 조회**: 제공하지 않습니다. 필요한 업무(예: 환불, 결제 확인)가 있다면 PG사 관리자 콘솔이나 PG 결제 조회 API로 처리하는 게 맞습니다.
- **인증 없는 관리자 API**: 제공하지 않습니다.

## Suggested (not required)

- `GET /admin/v1/members/{id}` 단건 조회 — 수정 화면 진입 시 최신 값 로딩용.
- 관리자 행위 로그(누가 언제 어떤 회원을 조회/수정/삭제했는지) — 개인정보 접속기록 보관 의무 대응.
- 목록에서 전화번호·주소 일부 마스킹, 상세 화면에서만 전체 표시.
- `/admin/v1` 경로에 IP 허용 목록(사내망/VPN) 적용.
