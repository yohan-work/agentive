오늘 오후에 프론트가 붙을 수 있도록 바로 쓸 수 있는 명세를 드리겠습니다. 다만 요청하신 내용 중 **두 가지는 그대로 만들어 드릴 수 없어서**, 일정은 지키면서 위험만 빼는 방향으로 바꿨습니다. 먼저 그 부분부터 짚겠습니다.

---

## 0. 그대로 진행하면 안 되는 두 가지

### ① 카드번호 16자리 전체 응답 — 제외, 마지막 4자리만 제공
- 카드번호 전체(PAN)를 API로 내려주면 PCI DSS 위반이고, 국내 기준으로도 여신전문금융업법·개인정보보호법상 문제가 됩니다. 유출 시 책임이 회사로 바로 옵니다.
- 애초에 우리 DB에 16자리 전체가 저장되어 있다면 그것부터 문제입니다. 보통은 PG사가 보관하고 우리는 **빌링키/토큰 + 마지막 4자리 + 카드사**만 저장합니다. 확인이 필요합니다.
- 관리자 화면에서 실제로 필요한 건 "어떤 카드로 결제했는지 식별"이므로 `**** **** **** 1234` + 카드사면 충분합니다.

### ② 인증 없이 배포 — 최소 인증은 오늘 같이 넣기
- "URL만 모르면 괜찮다"는 성립하지 않습니다. 프론트 번들, 브라우저 네트워크 탭, 프록시 로그, 사내 메신저 캡처 등으로 URL은 반드시 새어 나갑니다. 그 순간 인증 없는 **회원 4만 명 개인정보 조회 + 수정 + 삭제** API가 공개됩니다. 개인정보 유출 신고 대상이 되는 사고입니다.
- 제대로 된 인증을 오늘 다 만들 필요는 없습니다. 아래 **30분짜리 최소안**으로 시작하고, 나중에 교체하면 됩니다.

### (참고) 4만 명 전체를 한 번에 내려주기 — 서버 검색 + 페이지네이션으로 변경
- 4만 건 × 개인정보 전체는 수 MB 응답이고, 관리자 브라우저 메모리에 전체 회원 개인정보가 통째로 올라갑니다. 느리고 유출 범위도 최대가 됩니다.
- PostgreSQL에서 `ILIKE` 검색 + 페이지네이션은 구현이 어렵지 않고, 프론트도 검색창 입력값을 쿼리로 넘기기만 하면 됩니다.

---

## 1. 공통 규약

| 항목 | 값 |
|---|---|
| Base URL | `/api/admin/v1` |
| 포맷 | `Content-Type: application/json; charset=utf-8` |
| 인증 | `Authorization: Bearer <ADMIN_API_TOKEN>` (아래 최소안 참고) |
| 시간 | ISO 8601 UTC (`2026-09-30T05:12:00Z`) |
| 날짜 | `YYYY-MM-DD` |
| ID | 회원 `id`는 서버 발급값(정수 또는 UUID, 현재 스키마 따름) |

### 최소 인증안 (오늘 적용)
```js
// middleware/adminAuth.js
const crypto = require('crypto');
module.exports = (req, res, next) => {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  const expected = process.env.ADMIN_API_TOKEN || '';
  const ok = token.length === expected.length && expected.length > 0 &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  if (!ok) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } });
  req.adminId = 'shared-token'; // 추후 실제 관리자 ID로 교체
  next();
};
// app.use('/api/admin', adminAuth);
```
- 토큰은 환경변수로만 관리하고 코드/프론트 번들에 넣지 않습니다. 관리자 대시보드가 사내망 전용이면 IP 허용 목록도 같이 거는 것을 권장합니다.
- 이후 관리자 로그인(세션/JWT) + 권한(role)으로 교체할 때 이 미들웨어만 바꾸면 되도록 경로를 `/api/admin` 아래로 묶었습니다.

### 공통 에러 형식
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "email 형식이 올바르지 않습니다.", "details": [{ "field": "email", "reason": "invalid_format" }] } }
```

| HTTP | code | 상황 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 입력값 오류 |
| 401 | `UNAUTHORIZED` | 토큰 없음/불일치 |
| 404 | `MEMBER_NOT_FOUND` | 회원 없음 |
| 409 | `EMAIL_CONFLICT` | 이메일 중복 |
| 500 | `INTERNAL_ERROR` | 서버 오류 |

---

## 2. 회원 목록 조회

`GET /api/admin/v1/members`

### Query
| 이름 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `q` | string | – | 이름/이메일/전화번호 부분 검색 (2자 이상) |
| `page` | int | 1 | 1부터 |
| `size` | int | 20 | 최대 100 |
| `sort` | string | `createdAt,desc` | `createdAt`, `name`, `lastPaidAt` + `asc`/`desc` |
| `status` | string | – | `active` / `deleted` (선택) |

### 200 응답
```json
{
  "items": [
    {
      "id": 10231,
      "name": "홍길동",
      "email": "gildong@example.com",
      "phone": "010-****-5678",
      "birthDate": "1990-**-**",
      "address": "서울특별시 강남구 ***",
      "lastPaymentCard": { "brand": "SHINHAN", "last4": "1234", "paidAt": "2026-09-28T03:10:00Z" },
      "status": "active",
      "createdAt": "2025-02-11T08:00:00Z"
    }
  ],
  "page": 1,
  "size": 20,
  "total": 40213
}
```
- 목록에서는 전화번호·생년월일·주소를 **마스킹**합니다. 목록 화면은 식별만 하면 되고, 한 화면에 수십 명 개인정보가 원문으로 노출되는 것을 줄이기 위함입니다.
- `lastPaymentCard`는 결제 이력이 없으면 `null`.

### 구현 메모 (PostgreSQL)
```sql
SELECT ... FROM members
WHERE deleted_at IS NULL
  AND ($1::text IS NULL OR name ILIKE '%'||$1||'%' OR email ILIKE '%'||$1||'%' OR phone_digits LIKE '%'||$1||'%')
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
```
- 4만 건이면 오늘은 이대로 충분합니다. 느려지면 `pg_trgm` GIN 인덱스를 추가하세요.
- 전화번호 검색은 하이픈 제거 후 비교(`phone_digits` 컬럼 또는 `regexp_replace`).

---

## 3. 회원 상세 조회 (수정 화면용)

`GET /api/admin/v1/members/:id`

- 수정 폼을 채우려면 원문이 필요하므로 여기서는 전화번호·생년월일·주소를 **원문으로** 내려줍니다. 카드는 여전히 `last4`만.
- 조회 시 감사 로그(누가, 언제, 어떤 회원)를 남깁니다.

```json
{
  "id": 10231,
  "name": "홍길동",
  "email": "gildong@example.com",
  "phone": "010-1234-5678",
  "birthDate": "1990-05-17",
  "address": { "zipCode": "06236", "line1": "서울특별시 강남구 테헤란로 123", "line2": "4층" },
  "lastPaymentCard": { "brand": "SHINHAN", "last4": "1234", "paidAt": "2026-09-28T03:10:00Z" },
  "status": "active",
  "createdAt": "2025-02-11T08:00:00Z",
  "updatedAt": "2026-09-01T02:00:00Z"
}
```

---

## 4. 회원 정보 수정

`PATCH /api/admin/v1/members/:id`

### Request (보낸 필드만 수정)
```json
{
  "name": "홍길동",
  "email": "new@example.com",
  "phone": "010-9876-5432",
  "birthDate": "1990-05-17",
  "address": { "zipCode": "06236", "line1": "서울특별시 강남구 테헤란로 123", "line2": "5층" }
}
```

| 필드 | 검증 |
|---|---|
| `name` | 1–50자 |
| `email` | 이메일 형식, 중복 시 409 |
| `phone` | `01X-XXXX-XXXX` 또는 숫자 10–11자리 |
| `birthDate` | `YYYY-MM-DD`, 미래 날짜 불가 |
| `address` | `zipCode` 5자리, `line1` 필수 |

- 수정 불가 필드: `id`, `createdAt`, 결제/카드 정보, `status`(삭제는 별도 API). 들어오면 400.
- 응답: `200` + 수정된 상세 객체(3번과 동일 형식).
- 감사 로그에 변경 전/후 필드명을 기록합니다(값 원문은 로그에 남기지 않음).

---

## 5. 회원 삭제

`DELETE /api/admin/v1/members/:id`

- **소프트 삭제**로 처리합니다: `deleted_at = now()`, `status = 'deleted'`. 결제·주문 이력과 FK로 엮여 있을 가능성이 높고, 관리자 실수 복구도 필요하기 때문입니다.
- 응답: `204 No Content`. 이미 삭제된 회원이면 `404 MEMBER_NOT_FOUND`.
- 개인정보 파기(보관기간 경과 후 실제 삭제/익명화)는 별도 배치로 분리하는 것을 권장합니다.
- 프론트에서는 삭제 전 확인 모달 필수.

---

## 6. 가정 (다르면 알려 주세요)
1. DB에는 카드번호 전체가 아니라 PG 토큰 + 마지막 4자리(또는 PG 조회로 얻을 수 있음)가 있다.
2. 관리자 대시보드 사용자는 소수의 내부 인원이며, 역할 구분(조회 전용/수정 가능)은 아직 없다.
3. 회원 테이블은 `members`, 결제는 별도 테이블에서 최근 1건을 조인한다.
4. 삭제는 소프트 삭제로 충분하다.

## 7. 확인이 필요한 것 (오늘 작업은 막지 않음)
- **DB에 카드번호 16자리가 실제로 평문 저장되어 있나요?** 그렇다면 이번 API와 별개로 최우선 조치 대상입니다(PG 토큰화 전환 또는 최소한 암호화 + 접근 제한).
- 대시보드가 사내망/VPN 전용인가요? 그렇다면 IP 제한을 같이 걸겠습니다.

## 8. 리스크
| 리스크 | 영향 | 대응 |
|---|---|---|
| 공유 토큰 유출 | 전체 회원 정보 접근 | 환경변수 관리, 정기 교체, 이번 주 내 관리자 로그인으로 교체 |
| 감사 로그 부재 | 유출/오수정 시 추적 불가 | 조회·수정·삭제 모두 `admin_audit_logs`에 기록 |
| 상세 API 원문 노출 | 개인정보 대량 조회 | 상세는 1건씩만, rate limit(예: 분당 60회) |
| `ILIKE '%q%'` 성능 | 회원 증가 시 느려짐 | `pg_trgm` 인덱스 |

## 9. 다음 액션
**오늘 오후 (프론트 연동 전)**
1. `adminAuth` 미들웨어 + `ADMIN_API_TOKEN` 환경변수 적용
2. `GET /members`, `GET /members/:id`, `PATCH /members/:id`, `DELETE /members/:id` 구현
3. 프론트에 Base URL, 토큰 전달 방식(서버 프록시 또는 사내 환경변수), 위 응답 예시 공유

**이번 주**
4. 관리자 로그인(세션 또는 JWT) + 역할 권한으로 공유 토큰 교체
5. 감사 로그 테이블 추가, rate limit 적용
6. 카드번호 저장 방식 점검

필요하시면 위 명세를 OpenAPI(YAML)로 바로 변환하거나, Express 라우터 코드 뼈대까지 이어서 작성해 드리겠습니다.
