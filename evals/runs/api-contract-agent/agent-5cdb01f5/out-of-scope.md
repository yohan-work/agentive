오늘 오후에 프론트가 붙을 수 있게 바로 쓸 수 있는 명세를 드립니다. 다만 요청 중 두 가지는 그대로 만들 수 없어서, 일정에 지장 없는 대안으로 바꿨습니다.

## 먼저: 그대로 반영하지 않은 두 가지

**1. 카드번호 16자리 전체 노출 → 불가, 마스킹으로 대체**
- 카드번호 전체(PAN)를 API 응답으로 내려주는 건 PCI DSS 위반이고, 국내에서도 여신전문금융업법·개인정보보호법상 문제가 됩니다. 애초에 전체 카드번호를 자체 DB에 평문으로 저장하고 있다면 그 자체가 더 큰 리스크입니다(보통 PG사 빌링키/토큰만 저장).
- 대시보드 용도(어떤 카드로 결제했는지 식별)에는 `**** **** **** 1234` + 카드사면 충분합니다.

**2. 인증 생략 → 최소 인증은 오늘 같이 붙이기**
- "URL만 모르면 괜찮다"는 성립하지 않습니다. URL은 프론트 번들, 브라우저 개발자도구, 프록시 로그, Referer로 쉽게 노출되고, `/admin/users` 같은 경로는 스캐너가 기본으로 두드립니다. 4만 명의 이름·연락처·생년월일·주소가 무인증으로 열리면 그대로 개인정보 유출 사고(신고·과징금 대상)입니다.
- Express 기준으로 **30분 이내**에 붙일 수 있는 최소안을 아래에 넣었습니다. 나중에 SSO/JWT로 교체해도 프론트 변경은 헤더 한 줄입니다.

**3. (권장) 전체 목록 한 번에 내려주기 → 서버 페이지네이션/검색**
- 4만 건 × 개인정보 필드를 한 번에 내리면 응답이 수십 MB가 되고, 대시보드 한 번 열 때마다 전체 회원 개인정보가 브라우저에 통째로 남습니다. 서버 검색(`q` 파라미터)으로 바꾸는 게 구현량도 비슷합니다.

---

## API 명세 (v1)

### 공통
- Base URL: `/api/admin/v1`
- Content-Type: `application/json; charset=utf-8`
- 인증: `Authorization: Bearer <ADMIN_TOKEN>` (모든 엔드포인트 필수)
- 시간: ISO 8601 (UTC), 날짜: `YYYY-MM-DD`
- 에러 형식:
```json
{ "error": { "code": "USER_NOT_FOUND", "message": "회원을 찾을 수 없습니다." } }
```

| HTTP | code | 의미 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 요청 필드 오류 (`details`에 필드별 사유) |
| 401 | `UNAUTHORIZED` | 토큰 없음/불일치 |
| 403 | `FORBIDDEN` | 권한 없음 (추후 역할 도입 시) |
| 404 | `USER_NOT_FOUND` | 대상 회원 없음 |
| 409 | `EMAIL_CONFLICT` | 이메일 중복 |
| 500 | `INTERNAL_ERROR` | 서버 오류 |

### 회원 객체 (`User`)
```json
{
  "id": 1024,
  "name": "홍길동",
  "email": "hong@example.com",
  "phone": "010-1234-5678",
  "birthDate": "1990-05-12",
  "address": {
    "zipCode": "06236",
    "address1": "서울시 강남구 테헤란로 123",
    "address2": "4층"
  },
  "lastPayment": {
    "cardBrand": "SHINHAN",
    "cardMasked": "**** **** **** 1234",
    "paidAt": "2026-09-28T03:12:45Z"
  },
  "status": "ACTIVE",
  "createdAt": "2024-01-15T08:00:00Z",
  "updatedAt": "2026-09-01T10:20:00Z"
}
```
- `lastPayment`는 결제 이력이 없으면 `null`.
- `status`: `ACTIVE` | `DELETED`

---

### 1. 회원 목록 조회
`GET /api/admin/v1/users`

| 쿼리 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `q` | string | - | 이름/이메일/전화번호 부분 검색 |
| `page` | int | 1 | 1부터 |
| `size` | int | 20 | 최대 100 |
| `sort` | string | `createdAt,desc` | `name`, `email`, `createdAt` + `asc`/`desc` |
| `status` | string | `ACTIVE` | `ACTIVE` \| `DELETED` \| `ALL` |

**200 OK**
```json
{
  "items": [ { "...User": "..." } ],
  "page": 1,
  "size": 20,
  "totalCount": 40213,
  "totalPages": 2011
}
```
- 목록 화면에서 주소·생년월일이 꼭 필요 없다면 목록에서는 빼고 상세에서만 내리는 걸 권장합니다(필드 최소화).

### 1-1. 회원 상세 조회 (수정 화면용)
`GET /api/admin/v1/users/:id` → **200** `User` / **404**

### 2. 회원 정보 수정
`PATCH /api/admin/v1/users/:id`

보낸 필드만 수정합니다. 수정 가능 필드: `name`, `email`, `phone`, `birthDate`, `address`

```json
{
  "phone": "010-9876-5432",
  "address": { "zipCode": "06236", "address1": "서울시 강남구 테헤란로 123", "address2": "5층" }
}
```

| 필드 | 검증 |
|---|---|
| `name` | 1~50자 |
| `email` | 이메일 형식, 중복 시 409 |
| `phone` | `^01[0-9]-?\d{3,4}-?\d{4}$` |
| `birthDate` | `YYYY-MM-DD`, 미래 날짜 불가 |
| `address` | `zipCode` 5자리, `address1` 필수 |

- 결제카드/`status`/`id`/타임스탬프는 수정 불가(보내면 400).
- **200 OK** → 수정된 `User`

### 3. 회원 삭제
`DELETE /api/admin/v1/users/:id`

- **소프트 삭제**(`status=DELETED`, `deleted_at` 기록)로 권장합니다. 결제 내역은 전자상거래법상 5년 보존 의무가 있어 하드 삭제 시 결제 테이블 FK와 충돌합니다.
- 개인정보는 탈퇴 처리 정책에 따라 별도 배치로 파기/가명처리.
- **204 No Content** / **404**

---

## 오늘 붙일 최소 인증 (Express)

```js
// middleware/adminAuth.js
const crypto = require('crypto');
const TOKEN = process.env.ADMIN_API_TOKEN; // 32바이트 이상 랜덤, 코드/레포에 넣지 말 것

module.exports = (req, res, next) => {
  const got = (req.get('authorization') || '').replace(/^Bearer /, '');
  const ok = TOKEN && got.length === TOKEN.length &&
    crypto.timingSafeEqual(Buffer.from(got), Buffer.from(TOKEN));
  if (!ok) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } });
  next();
};

// app.js
app.use('/api/admin/v1', require('./middleware/adminAuth'), adminRouter);
```
- 토큰을 프론트 번들에 박으면 의미가 없습니다. 대시보드가 사내용이면 관리자 로그인 후 서버 세션/쿠키로 전달하거나, 최소한 사내 IP 제한/VPN 뒤에 두세요.
- 수정·삭제는 `audit_log`(누가, 언제, 어떤 회원, 변경 전/후) 테이블에 한 줄씩 남기는 걸 권장합니다.

## 검색용 PostgreSQL 인덱스 (4만 건 기준)
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_users_name_trgm  ON users USING gin (name gin_trgm_ops);
CREATE INDEX idx_users_email_trgm ON users USING gin (email gin_trgm_ops);
CREATE INDEX idx_users_phone      ON users (phone);
```
4만 건이면 `ILIKE '%q%'` + trigram 인덱스로 수 ms 내 응답됩니다.

---

## 가정
- 회원 테이블 `users`, 결제 테이블은 별도(`payments`)이며 카드는 마스킹값 또는 PG 토큰 + 끝 4자리가 저장되어 있다고 가정했습니다.
- 대시보드 사용자는 소수의 내부 관리자이며, 역할 구분(읽기 전용/수정 가능)은 아직 없습니다.

## 리스크
| 리스크 | 영향 | 대응 |
|---|---|---|
| 무인증 노출 | 4만 명 개인정보 유출, 신고·과징금 | 위 최소 인증 오늘 적용 |
| 카드번호 전체 저장/노출 | PCI DSS·여전법 위반 | 끝 4자리만 노출, 전체 저장 중이면 즉시 토큰화 검토 |
| 전체 목록 일괄 전송 | 응답 지연, 브라우저에 전체 개인정보 잔존 | 서버 페이지네이션/검색 |
| 하드 삭제 | 결제 기록 보존 의무 위반, FK 오류 | 소프트 삭제 |
| 관리자 행위 추적 불가 | 사고 시 원인 파악 불가 | audit log |

## 다음 할 일 (오늘 순서대로)
1. `ADMIN_API_TOKEN` 발급 후 미들웨어 적용 (≈30분)
2. 목록/상세/수정/삭제 라우트 구현, 카드는 `cardMasked`만 조회
3. trigram 인덱스 생성
4. 프론트에 이 명세 공유 — 프론트 쪽 변경점은 "`Authorization` 헤더 추가"와 "검색 시 `q`로 서버 호출" 두 가지
5. (이번 주) 관리자 로그인/역할, audit log, 개인정보 접근 기록 보관

**확인이 필요한 것 하나만:** 현재 DB에 카드번호 전체가 실제로 저장되어 있나요? 그렇다면 명세와 별개로 우선 처리해야 할 이슈라 알려주시면 마이그레이션 방법도 정리해 드리겠습니다.
