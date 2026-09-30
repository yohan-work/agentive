바로 쓸 수 있게 명세를 드릴게요. 다만 요청하신 것 중 두 가지는 그대로는 만들어 드리기 어렵습니다. 먼저 이 두 가지부터 짧게 설명하고, 오늘 오후에 프론트가 붙을 수 있는 버전으로 명세를 정리했습니다.

## 먼저 바꿔야 하는 두 가지

### 1. 카드 번호 16자리 전체는 내려줄 수 없습니다
- 카드 번호 전체(PAN)를 저장하거나 응답으로 내보내면 **PCI DSS** 적용 대상이 됩니다. 국내에서는 **여신전문금융업법**과 **개인정보보호법**에도 걸립니다. 유출되면 과징금과 신고 의무가 생기고, PG사 계약도 위험해질 수 있습니다.
- 보통은 PG사(토스페이먼츠, 나이스페이, 아임포트 등)가 카드 번호를 보관하고, 우리 DB에는 **빌링키/토큰, 카드사, 마스킹 번호(`1234-****-****-5678` 또는 끝 4자리)**만 둡니다. 지금 DB에 전체 번호가 있다면 그 자체를 따로 점검하셔야 합니다.
- 관리자 화면에서는 대부분 **카드사와 끝 4자리**만 있으면 충분합니다. 이 명세에서도 그렇게 내려줍니다.

### 2. 인증 없이 여는 건 "나중에"로 미루면 안 됩니다
- "URL만 모르면 괜찮다"는 가정은 성립하지 않습니다. 프론트 번들, 브라우저 네트워크 탭, 프록시 로그, 크롤러를 통해 URL은 금방 드러납니다. 인증이 없는 상태라면 4만 명의 개인정보가 `curl` 한 줄로 빠져나가고, 수정·삭제 API까지 누구나 호출할 수 있게 됩니다.
- Express에서는 **최소한의 인증을 붙이는 데 30분이면 충분합니다**. 아래에 바로 붙일 수 있는 미들웨어를 넣어 두었습니다. 오늘은 이 정도로 시작하고, 정식 관리자 로그인(SSO 또는 세션)은 다음 단계에서 붙이면 됩니다.

---

## API 명세 (v1)

**공통**
- Base URL: `/api/admin/v1`
- 인증: 모든 요청에 `Authorization: Bearer <ADMIN_TOKEN>` 헤더가 필요합니다. 없거나 틀리면 `401`을 반환합니다.
- Content-Type: `application/json; charset=utf-8`
- 시간: ISO 8601 UTC 문자열 (`2026-09-30T05:12:00Z`)
- ID: `memberId`는 문자열로 내려줍니다(bigint 정밀도 문제 예방).

**공통 에러 형식**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "email 형식이 올바르지 않습니다.",
    "details": [{ "field": "email", "reason": "invalid_format" }]
  }
}
```

| HTTP | code | 상황 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 파라미터나 바디 검증 실패 |
| 401 | `UNAUTHORIZED` | 토큰이 없거나 틀림 |
| 403 | `FORBIDDEN` | 권한 부족(추후 역할 도입 시) |
| 404 | `MEMBER_NOT_FOUND` | 대상 회원이 없음 |
| 409 | `CONFLICT` | 이메일 중복, 버전 충돌 |
| 500 | `INTERNAL_ERROR` | 서버 오류 |

---

### 1. 회원 목록 조회

`GET /api/admin/v1/members`

4만 명을 한 번에 내려받아 프론트에서 검색하는 방식은 권하지 않습니다. 응답이 수십 MB가 되고, 개인정보 전체가 브라우저 메모리와 캐시에 남습니다. **서버에서 검색하고 페이지네이션**하는 쪽이 오히려 구현도 간단하고 빠릅니다.

**Query**

| 이름 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `q` | string | – | 이름·이메일·전화번호 부분 검색 (2자 이상) |
| `status` | `active` \| `suspended` \| `deleted` | `active` | 상태 필터 |
| `page` | int ≥ 1 | 1 | 페이지 번호 |
| `pageSize` | int 1–100 | 20 | 페이지 크기 |
| `sort` | `createdAt` \| `name` \| `lastPaidAt` | `createdAt` | 정렬 기준 |
| `order` | `asc` \| `desc` | `desc` | 정렬 방향 |

**200 응답**
```json
{
  "items": [
    {
      "memberId": "10482",
      "name": "홍길동",
      "email": "gildong@example.com",
      "phone": "010-****-5678",
      "birthDate": "1990-**-**",
      "address": {
        "zipCode": "06236",
        "line1": "서울특별시 강남구 테헤란로 123",
        "line2": null
      },
      "lastPayment": {
        "cardBrand": "SHINHAN",
        "cardLast4": "5678",
        "paidAt": "2026-09-28T10:22:11Z"
      },
      "status": "active",
      "createdAt": "2025-03-02T01:00:00Z",
      "updatedAt": "2026-09-01T08:30:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 40213
}
```

- 목록에서는 **전화번호와 생년월일을 마스킹**합니다. 전체 값은 아래 상세 조회에서만 내려줍니다.
- `address.line2`(상세 주소)는 목록에서 `null`로 두고 상세 조회에서 내려줘도 됩니다. 팀 정책에 맞게 정하세요.
- `lastPayment`는 결제 이력이 없으면 `null`입니다.

### 1-1. 회원 상세 조회

`GET /api/admin/v1/members/:memberId`

**200 응답**: 목록 아이템과 같은 구조이며, `phone`과 `birthDate`를 마스킹하지 않은 값으로 내려줍니다. `version`(정수) 필드가 추가됩니다.
```json
{
  "memberId": "10482",
  "name": "홍길동",
  "email": "gildong@example.com",
  "phone": "010-1234-5678",
  "birthDate": "1990-05-17",
  "address": { "zipCode": "06236", "line1": "서울특별시 강남구 테헤란로 123", "line2": "4층" },
  "lastPayment": { "cardBrand": "SHINHAN", "cardLast4": "5678", "paidAt": "2026-09-28T10:22:11Z" },
  "status": "active",
  "version": 7,
  "createdAt": "2025-03-02T01:00:00Z",
  "updatedAt": "2026-09-01T08:30:00Z"
}
```
**404**: `MEMBER_NOT_FOUND`

상세 조회는 개인정보 열람에 해당하므로 **접근 로그**(누가, 언제, 어떤 회원을)를 남기세요. 개인정보보호법상 개인정보처리시스템의 접속기록 보관 의무가 있습니다.

---

### 2. 회원 정보 수정

`PATCH /api/admin/v1/members/:memberId`

보낸 필드만 변경합니다. 결제 정보는 이 API로 수정할 수 없습니다.

**Request body**
```json
{
  "name": "홍길동",
  "email": "new@example.com",
  "phone": "010-9876-5432",
  "birthDate": "1990-05-17",
  "address": { "zipCode": "06236", "line1": "서울특별시 강남구 테헤란로 123", "line2": "5층" },
  "status": "suspended",
  "version": 7
}
```

| 필드 | 규칙 |
|---|---|
| `name` | 1–50자 |
| `email` | 이메일 형식, 소문자로 정규화, 중복이면 `409` |
| `phone` | `010-0000-0000` 또는 숫자만 10–11자리. 서버에서 하이픈 형식으로 정규화 |
| `birthDate` | `YYYY-MM-DD`, 미래 날짜 불가 |
| `address` | 객체 전체를 교체합니다. `zipCode`는 5자리 |
| `status` | `active` \| `suspended` |
| `version` | **필수**. 상세 조회에서 받은 값을 그대로 보냅니다. 다른 관리자가 먼저 수정했다면 `409 CONFLICT` |

**200 응답**: 수정된 회원 상세(1-1과 같은 구조, `version`은 +1)
**400** 검증 실패 / **404** 없음 / **409** 이메일 중복이나 버전 충돌

---

### 3. 회원 삭제

`DELETE /api/admin/v1/members/:memberId`

**소프트 삭제**를 권합니다. `status = 'deleted'`, `deleted_at = now()`로 표시하고, 개인정보는 보관 기간이 지난 뒤 배치로 파기하거나 익명화합니다. 결제 기록처럼 전자상거래법상 5년 보관 의무가 있는 데이터가 회원에 연결되어 있을 수 있어서, 바로 하드 삭제하면 FK나 법적 보관 요건과 충돌합니다.

**Request body (선택)**
```json
{ "reason": "회원 요청에 의한 탈퇴 처리" }
```

**204 No Content**: 성공. 이미 삭제된 회원이라도 204를 반환합니다(멱등).
**404**: `MEMBER_NOT_FOUND`

---

## Express 구현 뼈대

**오늘 붙일 최소 인증 미들웨어**
```js
// middleware/adminAuth.js
const crypto = require('crypto');

module.exports = function adminAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const expected = process.env.ADMIN_API_TOKEN || '';
  const ok =
    token.length === expected.length &&
    expected.length >= 32 &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  if (!ok) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } });
  }
  req.admin = { id: 'shared-token' }; // 정식 로그인 도입 시 실제 관리자 ID로 교체
  next();
};
```
```js
// app.js
app.use('/api/admin/v1', adminAuth, adminRouter);
```
- `ADMIN_API_TOKEN`은 `openssl rand -hex 32`로 생성해서 환경변수로만 관리하세요. 프론트 코드에 하드코딩하면 안 됩니다. 관리자 대시보드가 브라우저에서 돈다면 **대시보드 서버(BFF)가 토큰을 붙여 프록시**하거나, 최소한 사내 VPN이나 IP 허용 목록 뒤에 두세요.
- HTTPS 필수, CORS는 대시보드 도메인만 허용합니다.

**목록 조회 쿼리 예시**
```js
router.get('/members', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
    const status = ['active', 'suspended', 'deleted'].includes(req.query.status) ? req.query.status : 'active';
    const sortMap = { createdAt: 'm.created_at', name: 'm.name', lastPaidAt: 'lp.paid_at' };
    const sort = sortMap[req.query.sort] || 'm.created_at';
    const order = req.query.order === 'asc' ? 'ASC' : 'DESC';
    const q = (req.query.q || '').trim();

    const params = [status];
    let where = 'm.status = $1';
    if (q.length >= 2) {
      params.push(`%${q}%`);
      where += ` AND (m.name ILIKE $2 OR m.email ILIKE $2 OR regexp_replace(m.phone, '-', '', 'g') ILIKE regexp_replace($2, '-', '', 'g'))`;
    }
    params.push(pageSize, (page - 1) * pageSize);

    const sql = `
      SELECT m.id, m.name, m.email, m.phone, m.birth_date, m.zip_code, m.address1,
             m.status, m.created_at, m.updated_at,
             lp.card_brand, lp.card_last4, lp.paid_at,
             COUNT(*) OVER() AS total
      FROM members m
      LEFT JOIN LATERAL (
        SELECT card_brand, card_last4, paid_at FROM payments p
        WHERE p.member_id = m.id ORDER BY paid_at DESC LIMIT 1
      ) lp ON true
      WHERE ${where}
      ORDER BY ${sort} ${order} NULLS LAST, m.id DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const { rows } = await pool.query(sql, params);
    res.json({
      items: rows.map(toListItem), // 여기서 phone/birthDate 마스킹
      page, pageSize,
      total: rows[0] ? Number(rows[0].total) : 0,
    });
  } catch (e) { next(e); }
});
```
- 정렬 컬럼은 반드시 화이트리스트로 매핑하세요(SQL 인젝션 방지). 값은 모두 `$n` 파라미터로 넘깁니다.
- 4만 건이면 `ILIKE`로도 충분히 빠르지만, 느려지면 `pg_trgm` GIN 인덱스(`CREATE INDEX ... USING gin (name gin_trgm_ops)`)를 추가하세요.
- `payments(member_id, paid_at DESC)` 인덱스가 있어야 LATERAL 조인이 빠릅니다.
- `payments` 테이블에 전체 카드 번호 컬럼이 있다면 **SELECT에서 절대 가져오지 말고**, `card_last4` 컬럼을 따로 두세요.

---

## 오늘 할 일 순서 (추천)

1. `ADMIN_API_TOKEN` 발급 → `adminAuth` 미들웨어 적용 (30분)
2. `GET /members`, `GET /members/:id` 구현 → 프론트 연동 시작
3. `PATCH`, `DELETE` 구현 (검증, version 체크, 소프트 삭제)
4. 수정·삭제·상세 조회에 감사 로그 테이블 기록 (`admin_id, action, member_id, at, diff`)
5. 다음 스프린트: 정식 관리자 로그인과 역할(조회 전용 / 수정 가능), 카드 번호 원문 보관 여부 점검

프론트 쪽에서 필요한 필드나 검색 조건이 더 있으면 알려 주세요. 명세에 바로 반영해 드리겠습니다.
