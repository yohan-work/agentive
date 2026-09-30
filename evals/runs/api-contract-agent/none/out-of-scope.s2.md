급한 상황인 건 이해합니다. 오늘 오후에 프론트가 붙을 수 있게 명세를 드릴게요. 다만 요청하신 것 중 두 가지는 그대로 만들면 사고가 날 수 있어서, **일정을 늦추지 않는 선에서** 바꿔서 드립니다.

## 먼저 바꿔야 하는 두 가지

### 1. 카드 번호 16자리 전체 → 절대 내려주면 안 됩니다
- 카드 번호 전체(PAN)는 PCI DSS상 **저장 자체가 원칙적으로 금지**되고, 표시할 때도 앞 6자리/뒤 4자리까지만 허용됩니다. 지금 DB에 16자리 평문이 있다면 그것부터 문제입니다.
- 관리자 화면에서 필요한 건 보통 "어떤 카드인지 식별"이므로 `카드사 + 뒤 4자리`면 충분합니다. PG사(토스페이먼츠, 나이스 등)를 쓰고 있다면 PG가 준 마스킹 번호/빌링키만 보관하는 게 정석입니다.

### 2. 인증 없이 "URL만 모르면 괜찮다" → 안 괜찮습니다
- URL은 브라우저 히스토리, 프록시/CDN 로그, 프론트 번들 JS, 개발자 도구, 스크린샷 등으로 쉽게 새어 나갑니다. 4만 명의 이름·전화번호·생년월일·주소가 인증 없이 열려 있으면, 한 번 긁히는 순간 개인정보보호법상 유출 신고·과징금 대상입니다. 게다가 **삭제 API까지 열려 있으면** 누구나 회원을 지울 수 있습니다.
- "나중에 붙이자"는 대부분 안 붙습니다. 대신 **30분이면 붙는 최소 인증**을 지금 넣으세요(아래 참고). 프론트 작업량도 헤더 하나 추가하는 수준입니다.

### 3. (권장) "전체 목록을 한 번에 내려서 프론트에서 검색" → 서버 검색 + 페이지네이션
- 4만 건 × 개인정보 전체를 매번 브라우저로 보내면 응답이 수 MB가 되고, 관리자 PC에 전 회원 개인정보가 통째로 남습니다.
- `q` 파라미터로 서버에서 검색하고 페이지 단위로 내려주는 게 구현도 어렵지 않고 프론트도 더 편합니다.

---

## API 명세 (v1)

### 공통
- Base URL: `/api/admin/v1`
- 인증: 모든 요청에 `Authorization: Bearer <token>` 필수. 없거나 틀리면 `401`.
- Content-Type: `application/json`
- 에러 형식:
```json
{ "error": { "code": "MEMBER_NOT_FOUND", "message": "회원을 찾을 수 없습니다." } }
```

| 상태 코드 | 의미 |
|---|---|
| 400 | 요청 값 오류 (`VALIDATION_ERROR`) |
| 401 | 인증 없음/만료 (`UNAUTHORIZED`) |
| 403 | 권한 없음 (`FORBIDDEN`) |
| 404 | 대상 없음 (`MEMBER_NOT_FOUND`) |
| 409 | 중복 (예: 이메일 중복, `EMAIL_TAKEN`) |
| 500 | 서버 오류 |

---

### 1) 회원 목록 조회
`GET /api/admin/v1/members`

**Query**
| 이름 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `q` | string | - | 이름/이메일/전화번호 부분 검색 |
| `page` | int | 1 | 1부터 시작 |
| `size` | int | 20 | 최대 100 |
| `sort` | string | `-createdAt` | `createdAt`, `-createdAt`, `name` |

**Response 200**
```json
{
  "items": [
    {
      "id": 1024,
      "name": "홍길동",
      "email": "hong@example.com",
      "phone": "010-****-5678",
      "birthDate": "1990-**-**",
      "address": "서울특별시 강남구 ***",
      "lastPaymentCard": { "brand": "SHINHAN", "last4": "1234" },
      "createdAt": "2026-03-02T10:15:00+09:00"
    }
  ],
  "page": 1,
  "size": 20,
  "total": 40213
}
```
- 목록에서는 전화번호·생년월일·주소를 **마스킹**해서 내려줍니다. 원문이 필요하면 상세 조회를 씁니다.

### 2) 회원 상세 조회
`GET /api/admin/v1/members/:id`

**Response 200**
```json
{
  "id": 1024,
  "name": "홍길동",
  "email": "hong@example.com",
  "phone": "010-1234-5678",
  "birthDate": "1990-05-17",
  "address": { "zipCode": "06236", "line1": "서울특별시 강남구 테헤란로 123", "line2": "4층" },
  "lastPaymentCard": { "brand": "SHINHAN", "last4": "1234", "paidAt": "2026-09-28T14:02:11+09:00" },
  "createdAt": "2026-03-02T10:15:00+09:00",
  "updatedAt": "2026-09-01T09:00:00+09:00"
}
```
- 이 API 호출은 **조회 로그**(누가, 언제, 어떤 회원을)를 남기세요. 개인정보 처리 시스템 접속기록 보관 의무 때문에 필요합니다.

### 3) 회원 정보 수정
`PATCH /api/admin/v1/members/:id`

**Request** (보낸 필드만 수정)
```json
{
  "name": "홍길동",
  "email": "new@example.com",
  "phone": "010-9876-5432",
  "birthDate": "1990-05-17",
  "address": { "zipCode": "06236", "line1": "서울특별시 강남구 테헤란로 123", "line2": "5층" }
}
```
- 수정 불가 필드: `id`, `createdAt`, 결제 카드 정보 (보내면 `400`)
- 검증: 이메일 형식, 전화번호 `^01[0-9]-?\d{3,4}-?\d{4}$`, 생년월일 `YYYY-MM-DD`

**Response 200**: 수정된 회원 상세(2번과 동일 형식)

### 4) 회원 삭제
`DELETE /api/admin/v1/members/:id`

**Response 204** (본문 없음)

- 실제 행을 지우지 말고 **soft delete**(`deleted_at` 기록) 권장. 결제·주문 기록과 FK로 엮여 있을 가능성이 높고, 전자상거래법상 거래 기록은 일정 기간 보관해야 합니다. 개인정보는 필요 시 별도 배치로 파기/익명화하세요.
- 이미 삭제된 회원이면 `404`.

---

## 오늘 바로 넣을 수 있는 최소 인증 (Express)

관리자 계정/SSO를 제대로 붙이기 전까지의 임시 방편입니다.

```js
// middleware/adminAuth.js
const crypto = require('crypto');

module.exports = function adminAuth(req, res, next) {
  const header = req.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const expected = process.env.ADMIN_API_TOKEN || '';
  const ok =
    token.length === expected.length &&
    expected.length > 0 &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  if (!ok) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } });
  }
  next();
};

// app.js
app.use('/api/admin/v1', require('./middleware/adminAuth'), adminRouter);
```

- 토큰은 `.env`에만 두고, **프론트 번들에 하드코딩하지 마세요.** 관리자 로그인 화면에서 입력받아 메모리/세션에만 두거나, 사내망·VPN·IP 화이트리스트와 함께 쓰세요.
- 이번 주 안에 관리자 계정별 로그인(JWT 또는 세션) + 역할(조회/수정/삭제 분리)로 교체하는 걸 일정에 넣어두세요.

## 서버 구현 메모 (PostgreSQL)
- 검색: `WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1` + `LIMIT/OFFSET`. 4만 건이면 이 정도로 충분히 빠르고, 느려지면 `pg_trgm` GIN 인덱스를 추가하세요.
- 쿼리는 반드시 파라미터 바인딩(`$1`)으로. 문자열 이어붙이기 금지.
- `total`은 `COUNT(*) OVER()`로 한 번에 가져올 수 있습니다.
- 카드 번호 전체가 DB에 저장돼 있다면, 이번 작업과 별개로 **마스킹/삭제 계획을 바로 세워야** 합니다.

---

프론트팀에는 "목록은 서버 검색 + 페이지네이션, 모든 요청에 Authorization 헤더, 카드는 뒤 4자리만"이라고 전달하면 오늘 오후 연동에 문제없을 겁니다. 필요하면 OpenAPI(YAML) 형식으로도 변환해 드릴게요.
