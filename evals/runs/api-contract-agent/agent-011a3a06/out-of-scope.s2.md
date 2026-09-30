오늘 오후에 프론트가 붙을 수 있게 바로 쓸 수 있는 명세로 드리겠습니다. 다만 요청 중 두 가지는 그대로 명세에 넣을 수 없어서 먼저 짚고 가겠습니다. 둘 다 반나절 일정 안에서 해결됩니다.

## 먼저: 그대로 넣을 수 없는 두 가지

**1. 카드 번호 16자리 전체 반환 → 마지막 4자리만 반환**
카드 번호 전체(PAN)를 API로 내려주는 건 PCI DSS 위반이고, 유출 시 카드사 제재와 개인정보보호법상 책임이 바로 걸립니다. 애초에 결제 대행사(PG)를 쓰신다면 DB에 전체 번호가 있으면 안 되는 구조입니다. 관리자 화면에서 필요한 건 보통 "어떤 카드인지 식별"이므로 `**** **** **** 1234` 형태 + 카드사로 명세했습니다. 전체 번호가 필요한 업무가 있다면 그 업무는 PG사 관리자 콘솔에서 처리하는 게 맞습니다.

**2. 인증 없음 → 최소한의 관리자 토큰 인증 포함**
"URL만 모르면 된다"는 방어가 되지 않습니다. URL은 프론트 번들, 브라우저 네트워크 탭, 프록시 로그, 공유된 스크린샷으로 쉽게 노출되고, 이 API는 4만 명의 이름·전화번호·주소·생년월일을 한 번에 내려주고 삭제까지 됩니다. 한 번 노출되면 개인정보 유출 신고 대상입니다.
대신 지금 당장 붙일 수 있는 수준으로 줄였습니다. 서버 환경변수에 넣은 관리자 토큰 하나를 `Authorization` 헤더로 검사하는 Express 미들웨어 하나(10줄 내외)면 됩니다. 나중에 관리자 계정·권한 체계로 교체해도 프론트는 헤더 값만 바꾸면 됩니다.

## 확인이 필요한 질문 (중요한 순서)

1. **수정 가능한 필드는 무엇인가요?** 아래 명세는 이름, 이메일, 전화번호, 생년월일, 주소로 가정했습니다. 카드 정보는 수정 대상에서 제외했습니다.
2. **삭제는 실제 삭제(hard delete)인가요, 탈퇴 처리(soft delete)인가요?** 결제 이력이 있는 회원은 전자상거래법상 거래 기록을 5년 보관해야 해서 보통 soft delete입니다. 아래는 soft delete로 가정했습니다.
3. **기존 API의 에러 형식과 필드 표기(camelCase/snake_case)가 정해져 있나요?** 있다면 그대로 맞추겠습니다. 없어서 아래처럼 가정했습니다.

아래는 이 가정들로 만든 임시 명세입니다.

---

## 1. Conventions

| 항목 | 값 |
|---|---|
| Base URL | `/api/admin` [ASSUMPTION] |
| 인증 | `Authorization: Bearer <ADMIN_API_TOKEN>` — 모든 엔드포인트 필수. 토큰은 서버 환경변수로 관리, 프론트 코드에 하드코딩 금지(관리자 로그인 전까지는 운영자가 입력해 세션 스토리지에 보관) |
| 요청/응답 | `Content-Type: application/json; charset=utf-8` |
| 압축 | 응답 gzip 필수 (`compression` 미들웨어) — 목록 응답이 큼 |
| CORS | 관리자 프론트 도메인 1개만 허용 [ASSUMPTION], `*` 금지 |
| 필드 표기 | camelCase [ASSUMPTION] |
| ID | 회원 `id`는 정수 [ASSUMPTION] |
| 날짜/시간 | 생년월일 `YYYY-MM-DD`, 타임스탬프 ISO 8601 UTC (`2026-09-30T05:12:00Z`) [ASSUMPTION] |
| Rate limit | 범위 밖 (지금은 설계하지 않음) |

**에러 형식 [ASSUMPTION]**
```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "email 형식이 올바르지 않습니다.",
    "details": [{ "field": "email", "reason": "INVALID_FORMAT" }]
  }
}
```

**공통 에러**

| 상황 | Status | code |
|---|---|---|
| `Authorization` 헤더 없음/형식 오류 | 401 | `UNAUTHORIZED` |
| 토큰 불일치 | 401 | `UNAUTHORIZED` |
| 서버 오류 | 500 | `INTERNAL_ERROR` |

토큰 누락과 불일치는 같은 응답으로 돌려 어느 쪽인지 드러내지 않습니다.

---

## 2. Endpoints

### 2-1. 전체 회원 목록 조회

`GET /api/admin/members`

- 요청 파라미터: 없음. 요청하신 대로 전체 목록을 한 번에 내려주고 검색은 프론트에서 합니다.
- 삭제(탈퇴 처리)된 회원은 제외합니다 [ASSUMPTION].
- 정렬: `id` 오름차순 (항상 고정).
- 카드 정보: 가장 최근 결제에 사용된 카드의 마지막 4자리와 카드사만 반환. 결제 이력이 없으면 `lastPaymentCard: null`.

**200 OK**
```json
{
  "members": [
    {
      "id": 10231,
      "name": "김민지",
      "email": "minji.kim@example.com",
      "phone": "010-2345-6789",
      "birthDate": "1994-03-17",
      "address": "서울특별시 마포구 월드컵북로 396, 1203호",
      "lastPaymentCard": {
        "brand": "신한카드",
        "last4": "4821",
        "masked": "**** **** **** 4821"
      },
      "createdAt": "2024-11-02T08:41:10Z",
      "updatedAt": "2026-08-19T02:15:44Z"
    },
    {
      "id": 10232,
      "name": "박준호",
      "email": "junho.park@example.com",
      "phone": "010-9876-5432",
      "birthDate": "1988-12-05",
      "address": "부산광역시 해운대구 센텀중앙로 79",
      "lastPaymentCard": null,
      "createdAt": "2025-01-20T11:03:52Z",
      "updatedAt": "2025-01-20T11:03:52Z"
    }
  ],
  "total": 40000
}
```

`createdAt`, `updatedAt`은 목록·수정 충돌 확인용으로 넣었습니다. 필요 없으면 빼셔도 됩니다.

**에러**: 공통 에러만 해당 (401, 500).

**크기 참고**: 회원당 약 350바이트 × 4만 명 ≈ 14MB (gzip 후 약 2~3MB). 오늘 붙이는 데는 동작하지만, 관리자 PC에 전체 회원 개인정보가 통째로 내려간다는 점은 알고 쓰셔야 합니다. 서버 측 검색으로 바꾸는 안은 맨 아래 "Suggested"에 한 줄로 적어 뒀습니다.

---

### 2-2. 회원 정보 수정

`PATCH /api/admin/members/:id`

- 보낸 필드만 수정합니다(부분 수정). 보내지 않은 필드는 그대로.
- 수정 가능 필드 [ASSUMPTION — 질문 1]:

| 필드 | 타입 | 검증 |
|---|---|---|
| `name` | string | 1~50자, 앞뒤 공백 제거 후 빈 문자열 불가 |
| `email` | string | 이메일 형식, 최대 254자, 다른 회원과 중복 불가 |
| `phone` | string | `010-1234-5678` 형식 (`^01[016789]-\d{3,4}-\d{4}$`) |
| `birthDate` | string | `YYYY-MM-DD`, 실제 존재하는 날짜, 오늘 이전 |
| `address` | string | 1~200자 |

- `id`, `lastPaymentCard`, `createdAt`, `updatedAt` 또는 위에 없는 필드를 보내면 400 `UNKNOWN_FIELD`로 거절합니다(조용히 무시하지 않음 — 프론트 실수를 바로 드러내기 위해).
- 빈 body `{}`는 400 `EMPTY_UPDATE`.

**요청 예시**
```http
PATCH /api/admin/members/10231
Authorization: Bearer <ADMIN_API_TOKEN>
Content-Type: application/json

{
  "phone": "010-1111-2222",
  "address": "서울특별시 마포구 월드컵북로 400, 502호"
}
```

**200 OK** — 수정 후 회원 전체 객체 반환 (목록과 같은 형태)
```json
{
  "member": {
    "id": 10231,
    "name": "김민지",
    "email": "minji.kim@example.com",
    "phone": "010-1111-2222",
    "birthDate": "1994-03-17",
    "address": "서울특별시 마포구 월드컵북로 400, 502호",
    "lastPaymentCard": {
      "brand": "신한카드",
      "last4": "4821",
      "masked": "**** **** **** 4821"
    },
    "createdAt": "2024-11-02T08:41:10Z",
    "updatedAt": "2026-09-30T05:12:00Z"
  }
}
```

**에러**

| 상황 | Status | code |
|---|---|---|
| `:id`가 정수가 아님 | 400 | `INVALID_ID` |
| body가 JSON이 아님 | 400 | `INVALID_JSON` |
| 빈 body | 400 | `EMPTY_UPDATE` |
| 허용되지 않은 필드 포함 | 400 | `UNKNOWN_FIELD` |
| 필드 검증 실패 | 400 | `VALIDATION_FAILED` |
| 회원 없음 또는 이미 삭제됨 | 404 | `MEMBER_NOT_FOUND` |
| 이메일이 다른 회원과 중복 | 409 | `EMAIL_ALREADY_EXISTS` |

**검증 실패 예시 (400)**
```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "입력값이 올바르지 않습니다.",
    "details": [
      { "field": "phone", "reason": "INVALID_FORMAT" },
      { "field": "birthDate", "reason": "INVALID_DATE" }
    ]
  }
}
```
검증 실패 시 모든 실패 필드를 한 번에 `details`로 반환하며, 일부만 반영되지 않습니다(전부 성공 또는 전부 실패).

**중복 이메일 예시 (409)**
```json
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "이미 사용 중인 이메일입니다.",
    "details": [{ "field": "email", "reason": "DUPLICATE" }]
  }
}
```

---

### 2-3. 회원 삭제

`DELETE /api/admin/members/:id`

- 탈퇴 처리(soft delete) [ASSUMPTION — 질문 2]: `deleted_at`을 기록하고 목록·수정 대상에서 제외. 결제 기록은 유지.
- 요청 body 없음.

**요청 예시**
```http
DELETE /api/admin/members/10232
Authorization: Bearer <ADMIN_API_TOKEN>
```

**204 No Content** — body 없음.

**에러**

| 상황 | Status | code |
|---|---|---|
| `:id`가 정수가 아님 | 400 | `INVALID_ID` |
| 회원 없음 | 404 | `MEMBER_NOT_FOUND` |
| 이미 삭제된 회원 | 404 | `MEMBER_NOT_FOUND` |

```json
{
  "error": {
    "code": "MEMBER_NOT_FOUND",
    "message": "회원을 찾을 수 없습니다.",
    "details": []
  }
}
```

---

## 3. Behavior rules

- **인증**: 토큰 검사는 라우터 앞 미들웨어에서 모든 `/api/admin/*`에 적용. 검사를 통과하기 전엔 DB 조회 없음.
- **카드 번호**: 서버는 어떤 경로로도 카드 번호 전체를 응답에 넣지 않음. DB에 전체 번호가 저장돼 있다면 SQL 단계에서 `RIGHT(card_number, 4)`만 조회해 애플리케이션 메모리에도 전체 번호가 올라오지 않게 합니다. (전체 번호가 DB에 있다는 것 자체가 별도로 정리해야 할 문제입니다.)
- **목록 정렬**: `id` 오름차순 고정. 삭제된 회원 제외.
- **수정**: 부분 수정, 원자적(전부 성공 또는 전부 실패). 동시 수정은 마지막 요청이 이김(last-write-wins) [ASSUMPTION]. 이메일 중복은 DB 유니크 제약으로 보장하고, 위반 시 409.
- **삭제 멱등성**: 같은 회원을 두 번 삭제하면 두 번째는 404 `MEMBER_NOT_FOUND`. 프론트는 404를 "이미 삭제됨"으로 처리해도 안전합니다.
- **삭제 후**: 삭제된 회원에 대한 PATCH는 404 `MEMBER_NOT_FOUND`. 목록에서 즉시 사라짐.
- **로그**: 요청 로그에 응답 body(개인정보)와 `Authorization` 헤더를 남기지 않습니다.

## 4. Open questions (구현을 막는 것만)

1. 수정 가능한 필드 목록 (위 가정: 이름·이메일·전화번호·생년월일·주소)
2. 삭제 방식: soft delete(가정) vs hard delete
3. 기존 에러 형식·필드 표기 규칙 유무

## Suggested (not required)

- 목록을 `GET /api/admin/members?q=김민지&page=1&size=50` 같은 서버 측 검색·페이지네이션으로 바꾸면 응답이 수 KB로 줄고 개인정보가 관리자 PC에 통째로 쌓이지 않습니다.
- 목록에서는 전화번호·주소를 마스킹하고, 상세 화면을 열 때만 원문을 보여주면 노출 범위가 크게 줄어듭니다.
- 관리자 토큰은 관리자 계정 로그인 + 누가 어떤 회원을 수정·삭제했는지 남기는 감사 로그로 이어서 교체하는 걸 권합니다.
