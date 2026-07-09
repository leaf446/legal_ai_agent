### *REST API 명세서 (MVP)*

**버전:** v3.1
**작성일:** 2025-12-12
**작성자:** Gemini
**관련 문서:** `PRD.md`, `ARCHITECTURE.md`, `BACKEND_DESIGN.md`, `AI_PIPELINE_DESIGN.md`, `FRONTEND_SPEC.md`

> **v3.1 변경사항**: API 경로에 `/api` 접두사 추가, 누락된 인증/검색/설정 API 엔드포인트 추가, 역할 기반 경로 명시

---

# 📌 0. 목적 & 범위

이 문서는 **LEH 백엔드 REST API**의 공식 스펙이다.

- 클라이언트(Frontend)와 백엔드 간 통신 규약 정의
- 주요 리소스(Cases, Evidence, Draft)의 요청/응답 형식 정의
- 인증/에러 공통 규칙 정의

> 참고: 기존 Paralegal API 설계의 엔드포인트 구조와 에러 처리 원칙을 계승하되, S3 Presigned URL, 사건별 RAG, Preview-only Draft 등 LEH 아키텍처에 맞게 재구성했다.

---

# 🧭 1. 공통 규칙

## 1.1 Base

- Base URL (예시): `https://api.leh.app`
- 모든 API 경로는 `/api` 접두사로 시작
- 모든 API는 **JSON** 기반 (파일 업로드는 예외)

## 1.2 인증

- 방식: **JWT (Bearer Token)**
- 헤더:

http
Authorization: Bearer <JWT_TOKEN>
`

- `/api/auth/login`, `/api/health` 일부를 제외하면 **모든 엔드포인트에 필수**

## 1.3 공통 응답 형식

### 성공 (예)

json
{
  "data": { ... },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2025-11-18T10:00:00Z"
  }
}

### 오류 (예)

json
{
  "error": {
    "code": "CASE_NOT_FOUND",
    "message": "존재하지 않거나 접근 권한이 없는 사건입니다."
  }
}

- HTTP Status Code:

  - 200 / 201 / 204: 성공
  - 400: 잘못된 요청 (validation 실패 등)
  - 401: 인증 실패 (토큰 없음/무효)
  - 403: 권한 없음
  - 404: 리소스 없음
  - 409: 충돌 (중복 요청, Draft 생성 중 등)
  - 413: 파일 과대 (Evidence 업로드 관련)
  - 500: 서버 오류

---

# 🔐 2. 인증 / Auth

## 2.1 로그인

### `POST /api/auth/login`

- 설명: 이메일/비밀번호로 로그인 후 JWT 발급
- 요청 Body:

json
{
  "email": "<user@example.com>",
  "password": "string"
}

- 응답 (200):

json
{
  "data": {
    "access_token": "jwt-token",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "id": "uuid",
      "name": "홍길동",
      "role": "LAWYER"
    }
  }
}

- 오류:

  - 401: 잘못된 인증 정보 (메시지는 항상 일반적인 문구로)

## 2.2 내 정보 조회

### `GET /api/auth/me`

- 설명: 현재 로그인된 사용자의 정보를 반환합니다. `Authorization` 헤더의 토큰을 기반으로 사용자를 식별합니다.
- 응답 (200):

json
{
  "data": {
    "id": "uuid",
    "name": "홍길동",
    "email": "user@example.com",
    "role": "LAWYER",
    "status": "active",
    "created_at": "2025-01-15T10:00:00Z"
  }
}

- 오류:
  - 401: 유효한 토큰이 없는 경우

## 2.3 토큰 갱신 (옵션)

### `POST /api/auth/refresh`

- 설명: Refresh Token으로 Access Token 재발급 (도입 시)

---

# 📁 3. 사건(Case) API

> **Note on Role-Based Access**: Case-related APIs are namespaced by user roles. The `{role}` path parameter should be one of `lawyer`, `client`, or `detective`. For example, a lawyer would access `GET /api/lawyer/cases`.

## 3.1 사건 목록 조회

### `GET /api/{role}/cases`

- 설명: 로그인한 사용자가 접근 가능한 사건 리스트
- 쿼리 파라미터:

  - `status` (optional): `active` / `closed`
  - `q` (optional): 사건명 검색
- 응답 (200):

json
{
  "data": [
    {
      "id": "case_123",
      "title": "김○○ 이혼 사건",
      "status": "active",
      "updated_at": "2025-11-18T02:10:00Z",
      "evidence_count": 42,
      "draft_status": "ready"
    }
  ]
}

---

## 3.2 사건 생성

### `POST /api/{role}/cases`

- 설명: 새로운 사건 생성
- 요청 Body:

json
{
  "title": "김○○ 이혼 사건",
  "description": "간략 설명 (선택)"
}

- 응답 (201):

json
{
  "data": {
    "id": "case_123",
    "title": "김○○ 이혼 사건",
    "description": "간략 설명",
    "status": "active",
    "created_at": "2025-11-18T01:00:00Z"
  }
}

---

## 3.3 사건 상세 조회

### `GET /api/{role}/cases/{case_id}`

- 설명: 사건 요약 정보 조회
- 응답 (200):

json
{
  "data": {
    "id": "case_123",
    "title": "김○○ 이혼 사건",
    "description": "간략 설명",
    "status": "active",
    "created_at": "2025-11-18T01:00:00Z",
    "evidence_count": 42,
    "draft_status": "ready"
  }
}

---

## 3.4 사건 수정

### `PATCH /api/{role}/cases/{case_id}`

- 설명: 사건 제목/설명 수정
- 요청 Body:

json
{
  "title": "수정된 사건명",
  "description": "수정된 설명"
}

- 응답 (200): 수정된 사건 객체

---

## 3.5 사건 종료(Soft Delete)

### `DELETE /api/{role}/cases/{case_id}`

- 설명:

  - 사건을 “종료” 상태로 전환
  - Qdrant 사건 인덱스 삭제
  - DynamoDB 메타데이터 soft-delete
  - S3 원본 증거는 유지 (법무법인 책임) — PRD 규칙 따름

- 응답:

  - 204 No Content

---

# 📎 4. 증거(Evidence) API

LEH는 **Presigned URL + S3 직접 업로드**를 사용한다.

## 4.1 업로드용 Presigned URL 발급

### `POST /api/evidence/presigned-url`

- 설명: 특정 사건에 대한 S3 업로드 URL 발급
- 요청 Body:

json
{
  "case_id": "case_123",
  "filename": "kakao_export.txt",
  "content_type": "text/plain"
}

- 응답 (200):

json
{
  "data": {
    "upload_url": "<https://s3>....",
    "fields": {
      "key": "cases/case_123/raw/uuid_kakao_export.txt",
      "policy": "...",
      "x-amz-algorithm": "...",
      "x-amz-credential": "...",
      "x-amz-date": "...",
      "x-amz-signature": "..."
    },
    "evidence_temp_id": "temp_abc123"
  }
}

---

## 4.2 업로드 완료 알림

### `POST /api/evidence/upload-complete`

- 설명: 클라이언트가 S3 업로드를 마친 후 백엔드에 알리는 엔드포인트

- 백엔드는 Evidence 레코드 생성 + AI Worker 트리거

- 요청 Body:

json
{
  "case_id": "case_123",
  "evidence_temp_id": "temp_abc123",
  "s3_key": "cases/case_123/raw/uuid_kakao_export.txt",
  "note": "2021년~2023년 카카오톡 내역"
}

- 응답 (201):

json
{
  "data": {
    "id": "ev_001",
    "case_id": "case_123",
    "filename": "kakao_export.txt",
    "file_type": "text/plain",
    "status": "processing",
    "uploaded_at": "2025-11-18T01:20:00Z"
  }
}

---

## 4.3 사건별 증거 목록 조회 (타임라인용)

### `GET /api/cases/{case_id}/evidence`

- 설명: 타임라인·리스트 표기를 위한 사건별 증거 메타데이터 조회

- 쿼리 파라미터 (optional):

  - `type`: `text|image|audio|video|pdf`
  - `label`: 유책사유 라벨 (예: `학대`, `부정행위`)
  - `from`, `to`: 날짜 범위

- 응답 (200):

json
{
  "data": [
    {
      "id": "ev_001",
      "case_id": "case_123",
      "type": "text",
      "filename": "kakao_export.txt",
      "timestamp": "2021-06-01T10:20:00Z",
      "speaker": "원고",
      "labels": ["계속적 불화"],
      "summary": "6월 1일 새벽 반복적인 언쟁...",
      "status": "done"
    }
  ]
}

---

## 4.4 증거 상세 조회

### `GET /api/evidence/{evidence_id}`

- 설명: 특정 증거의 상세 정보 + 원본 다운로드 URL

- 응답 (200):

json
{
  "data": {
    "id": "ev_001",
    "case_id": "case_123",
    "type": "audio",
    "filename": "call.m4a",
    "timestamp": "2021-06-01T10:20:00Z",
    "speaker": "피고",
    "labels": ["폭언", "계속적 불화"],
    "summary": "통화 내내 고함 및 모욕적 표현...",
    "content": "STT 전문 (필요 시 일부만)",
    "ocr_text": null,
    "transcript": "Whisper STT 결과...",
    "download_url": "<https://s3-presigned-url>..."
  }
}

- `download_url`은 짧은 유효기간의 Presigned URL (이미지/PDF/오디오 뷰어에 사용)

---

# 🧠 5. Draft(소장 초안) API

LEH는 **“Preview 전용 Draft”**만 제공하며,
실제 제출/최종 편집은 변호사가 Word 등에서 처리한다.

## 5.1 Draft Preview 생성

### `POST /api/cases/{case_id}/draft-preview`

- 설명:

  - 사건별 RAG + Gemini(기본, OpenAI 폴백)를 이용해 **소장 초안 텍스트 + 인용 증거 목록** 생성
  - 동기 처리(HTTP 응답 내에서 완료)를 기본 가정
  - 향후 비동기 큐 기반 설계로 확장 가능 (기존 Paralegal은 비동기 초안 생성을 제안함)

- 요청 Body (옵션 필드):

json
{
  "sections": ["청구취지", "청구원인"],
  "language": "ko",
  "style": "법원 제출용_표준"
}

- 응답 (200):

json
{
  "data": {
    "case_id": "case_123",
    "draft_text": "1. 당사자 관계...\n2. 혼인 경위...\n...",
    "citations": [
      {
        "evidence_id": "ev_001",
        "snippet": "2021년 6월 1일 피고의 폭언 장면",
        "labels": ["폭언", "계속적 불화"]
      }
    ],
    "generated_at": "2025-11-18T02:00:00Z"
  }
}

- 오류:

  - 400: 증거가 전혀 없는 사건 등
  - 409: Draft 생성이 이미 진행 중인 경우 (비동기 모드 도입 시)

---

## 5.2 Draft Preview 조회 (선택)

### `GET /api/cases/{case_id}/draft-preview`

- 설명: 최근 생성된 Draft Preview 조회 (캐싱/이력 관리용)
- 응답: 200 / 404 (아직 생성 전)

---

## 5.3 Draft docx 다운로드

### `GET /api/cases/{case_id}/draft-export`

- 설명:

  - 현재 Draft Preview 내용을 **.docx 파일**로 내려줌
  - 기존 Paralegal 설계에서도 `/cases/{case_id}/draft/export` 형태의 docx 다운로드를 제안함

- 응답:

  - `Content-Disposition: attachment; filename="case_123_draft.docx"`
  - 바디: 바이너리 파일

---

# 🔍 6. RAG / 검색 API [MVP 이후]

> ✅ **Note:** 이 섹션의 API는 구현 완료되었습니다. (Updated: 2025-12-10)

## 6.1 사건 내 RAG 검색

### `GET /api/cases/{case_id}/search`

- 설명: 사건별 증거를 기반으로 한 의미 검색 (Qdrant + 임베딩)

- 쿼리 파라미터:

  - `q`: 검색 질의 (예: "폭언이 집중된 시점")
  - `label` (옵션): 유책사유 라벨 필터
  - `limit` (옵션): 기본 20

- 응답 (200):

json
{
  "data": [
    {
      "evidence_id": "ev_001",
      "score": 0.91,
      "snippet": "2021년 6월 1일 통화에서 피고가...",
      "labels": ["폭언"]
    }
  ]
}

---

# 🛠 7. 관리/헬스체크 API

## 7.1 Health Check

### `GET /api/health`

- 설명: 단순 헬스 체크 (모니터링/로드밸런서용)
- 응답 (200):

json
{
  "status": "ok"
}

---

# 🧪 8. 사용 예시 플로우

1. **로그인**

   - `POST /api/auth/login` → JWT 획득

2. **사건 생성 & 진입**

   - `POST /api/{role}/cases` → 새 사건 ID
   - `GET /api/{role}/cases/{case_id}` → 상세 조회

3. **증거 업로드**

   - `POST /api/evidence/presigned-url` → S3 업로드 정보
   - 클라이언트가 S3에 직접 업로드
   - `POST /api/evidence/upload-complete` → Evidence 생성 (status=`processing`)
   - AI Worker 완료 후 `GET /api/cases/{case_id}/evidence`에서 `status=done` 확인

4. **타임라인/세부 내용 확인**

   - `GET /api/cases/{case_id}/evidence` → 리스트
   - `GET /api/evidence/{evidence_id}` → 전문/요약/다운로드 URL

5. **Draft Preview 생성/다운로드**

   - `POST /api/cases/{case_id}/draft-preview` → 초안 텍스트 + 인용 증거
   - `GET /api/cases/{case_id}/draft-export` → docx 파일 다운로드

6. **사건 종료**

   - `DELETE /api/{role}/cases/{case_id}` → 사건 상태 종료, RAG index 제거

---

# 📊 8. Staff Progress Dashboard API

## 8.1 진행 상황 요약 조회

### `GET /api/staff/progress`

- **권한**: `staff`, `lawyer`, `admin`
- **설명**: Paralegal/Lawyer가 배정된 사건들의 증거 수집, AI 상태, 피드백 체크리스트를 한 번에 조회.
- **쿼리 파라미터**:
  - `blocked_only` (bool, optional) → true 시 `is_blocked=true` 인 케이스만 반환
  - `assignee_id` (string, optional) → 관리자/변호사가 특정 스태프의 큐를 모니터링할 때 사용
- **응답 (200)**

```json
[
  {
    "case_id": "case_001",
    "title": "이혼 조정 사건",
    "status": "open",
    "assignee": { "id": "staff_17", "name": "Paralegal Kim" },
    "updated_at": "2025-02-20T07:00:00Z",
    "evidence_counts": {
      "pending": 1,
      "uploaded": 0,
      "processing": 2,
      "completed": 4,
      "failed": 0
    },
    "ai_status": "processing",
    "ai_last_updated": "2025-02-20T07:00:00Z",
    "outstanding_feedback_count": 3,
    "feedback_items": [
      {
        "item_id": "fbk-1",
        "title": "판례 DB 연동",
        "status": "done",
        "owner": "Ops",
        "notes": "12/4 동기화 완료",
        "updated_by": "staff_17",
        "updated_at": "2025-02-20T06:30:00Z"
      }
    ],
    "is_blocked": false,
    "blocked_reason": null
  }
]
```

> `feedback_items` 는 사양서(`specs/004-paralegal-progress/contracts/checklist.json`)에 정의된 16개 항목을 기본으로 전달하며, `status/notes/updated_at` 은 DB (case_checklist_statuses) 값이 있을 때 덮어쓴다.

## 8.2 체크리스트 상태 갱신

### `PATCH /api/staff/progress/{case_id}/checklist/{item_id}`

- **권한**: `staff`, `lawyer`, `admin`
- **설명**: 파라리걸이 mid-demo 피드백 항목을 완료/대기 상태로 토글하거나 메모를 남길 때 사용.
- **요청 Body**

```json
{
  "status": "done",
  "notes": "판례 DB 최신화"
}
```

- **검증**:
  - `status` 는 `pending` 또는 `done` 만 허용
  - `item_id` 는 16개 체크리스트 중 하나여야 함 → 존재하지 않으면 400

- **응답 (200)**

```json
{
  "item_id": "fbk-1",
  "title": "판례 DB 연동",
  "status": "done",
  "owner": "Ops",
  "notes": "판례 DB 최신화",
  "updated_by": "staff_17",
  "updated_at": "2025-02-21T02:10:00Z"
}
```

오류 케이스:

| Status | Code | 설명 |
|--------|------|------|
| 400 | `CHECKLIST_INVALID_STATUS` | 허용되지 않은 status 값 |
| 400 | `CHECKLIST_ITEM_NOT_FOUND` | 잘못된 item_id |
| 403 | `FORBIDDEN` | staff/lawyer/admin 이외의 역할 |

---

# 👥 9. Party Graph API (US1)

당사자 관계도 시각화를 위한 API. 원고, 피고, 제3자 등의 당사자와 관계(혼인, 외도 등)를 관리.

## 9.1 당사자 목록 조회

### `GET /api/cases/{case_id}/parties`

- **권한**: case_members (READ)
- **설명**: 사건에 등록된 모든 당사자 노드 조회
- **쿼리 파라미터**:
  - `type` (optional): `plaintiff` | `defendant` | `third_party` | `child` | `family`
- **응답 (200)**

```json
{
  "items": [
    {
      "id": "party_001",
      "case_id": "case_123",
      "type": "plaintiff",
      "name": "김철수",
      "alias": "원고",
      "birth_year": 1985,
      "occupation": "회사원",
      "position": { "x": 100, "y": 200 },
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 3
}
```

## 9.2 당사자 생성

### `POST /api/cases/{case_id}/parties`

- **권한**: case_members (WRITE)
- **요청 Body**

```json
{
  "type": "plaintiff",
  "name": "김철수",
  "alias": "원고",
  "birth_year": 1985,
  "occupation": "회사원",
  "position": { "x": 100, "y": 200 }
}
```

## 9.3 당사자 관계 목록

### `GET /api/cases/{case_id}/relationships`

- **응답 (200)**

```json
{
  "items": [
    {
      "id": "rel_001",
      "source_party_id": "party_001",
      "target_party_id": "party_002",
      "type": "marriage",
      "start_date": "2010-05-20",
      "end_date": null,
      "notes": "2010년 혼인"
    }
  ]
}
```

## 9.4 관계 생성

### `POST /api/cases/{case_id}/relationships`

- **type 값**: `marriage` | `affair` | `parent_child` | `sibling` | `in_law` | `cohabit`

---

# 📎 10. Evidence Links API (US4)

증거와 당사자/관계 간의 연결 관리.

## 10.1 증거 링크 목록

### `GET /api/cases/{case_id}/evidence-links`

- **쿼리 파라미터**:
  - `party_id` (optional): 특정 당사자에 연결된 링크만
  - `evidence_id` (optional): 특정 증거에 연결된 링크만
- **응답 (200)**

```json
{
  "items": [
    {
      "id": "link_001",
      "evidence_id": "ev_001",
      "party_id": "party_001",
      "relationship_id": null,
      "relevance": "primary",
      "notes": "원고의 폭언 녹음",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

## 10.2 증거 링크 생성

### `POST /api/cases/{case_id}/evidence-links`

- **relevance 값**: `primary` | `supporting` | `context`

---

# 💰 11. Assets API (US2)

재산분할을 위한 자산 관리.

## 11.1 자산 목록 조회

### `GET /api/cases/{case_id}/assets`

- **쿼리 파라미터**:
  - `category` (optional): `real_estate` | `financial` | `vehicle` | `business` | `retirement` | `other`
- **응답 (200)**

```json
{
  "items": [
    {
      "id": "asset_001",
      "name": "서울 아파트",
      "category": "real_estate",
      "value": 500000000,
      "acquisition_date": "2015-03-20",
      "ownership": "joint",
      "plaintiff_share": 50,
      "defendant_share": 50,
      "notes": "혼인 후 공동 매입",
      "evidence_ids": ["ev_001", "ev_002"]
    }
  ],
  "total_value": 750000000,
  "plaintiff_total": 375000000,
  "defendant_total": 375000000
}
```

## 11.2 자산 요약 조회

### `GET /api/cases/{case_id}/assets/summary`

- **응답 (200)**

```json
{
  "total_value": 750000000,
  "by_category": {
    "real_estate": { "count": 1, "value": 500000000 },
    "financial": { "count": 2, "value": 200000000 },
    "vehicle": { "count": 1, "value": 50000000 }
  },
  "plaintiff_total": 375000000,
  "defendant_total": 375000000,
  "division_ratio": "50:50"
}
```

---

# 📋 12. Procedure Stages API (US3)

이혼 소송 절차 단계 추적.

## 12.1 절차 단계 목록

### `GET /api/cases/{case_id}/procedure/stages`

- **응답 (200)**

```json
{
  "items": [
    {
      "id": "stage_001",
      "stage_order": 1,
      "label": "소장 접수",
      "status": "completed",
      "target_date": "2025-01-10",
      "completed_date": "2025-01-08",
      "notes": "법원 접수 완료"
    },
    {
      "id": "stage_002",
      "stage_order": 2,
      "label": "송달",
      "status": "in_progress",
      "target_date": "2025-01-25",
      "completed_date": null
    }
  ],
  "current_stage": "송달",
  "progress_percent": 33
}
```

## 12.2 절차 단계 상태 업데이트

### `PATCH /api/cases/{case_id}/procedure/stages/{stage_id}`

- **요청 Body**

```json
{
  "status": "completed",
  "completed_date": "2025-01-20",
  "notes": "피고 수령 확인"
}
```

---

# 📊 13. Summary Card API (US8)

의뢰인 소통용 사건 진행 현황 요약 카드.

## 13.1 요약 카드 조회

### `GET /api/cases/{case_id}/summary`

- **응답 (200)**

```json
{
  "case_id": "case_123",
  "case_title": "김○○ 이혼 사건",
  "court_reference": "2024가합12345",
  "client_name": "김민수",
  "current_stage": "조정 절차 진행 중",
  "progress_percent": 33,
  "completed_stages": [
    { "stage_label": "소장 접수", "completed_date": "2024-10-15T10:00:00Z" },
    { "stage_label": "송달 완료", "completed_date": "2024-10-25T14:00:00Z" }
  ],
  "next_schedules": [
    {
      "event_type": "조정기일",
      "scheduled_date": "2024-12-11T14:00:00Z",
      "location": "서울가정법원 305호"
    }
  ],
  "evidence_total": 12,
  "evidence_stats": [
    { "category": "부정행위 관련", "count": 8 },
    { "category": "재산분할 관련", "count": 4 }
  ],
  "lawyer": {
    "name": "홍길동",
    "phone": "02-1234-5678",
    "email": "hong@lawfirm.com"
  },
  "generated_at": "2024-12-09T10:00:00Z"
}
```

## 13.2 요약 카드 PDF 다운로드

### `GET /api/cases/{case_id}/summary/pdf`

- **응답**: HTML (print-ready format)
- **Content-Type**: `text/html`

---

# ⚙️ 14. Settings API

사용자 설정 관련 API.

## 14.1 프로필 조회

### `GET /api/settings/profile`

- **설명**: 현재 사용자의 프로필 정보 조회
- **응답 (200)**:
```json
{
  "id": "user-uuid",
  "name": "홍길동",
  "email": "hong@example.com",
  "phone_number": "010-1234-5678",
  "profile_image_url": "https://..."
}
```

## 14.2 프로필 수정

### `PUT /api/settings/profile`

- **요청 Body**:
```json
{
  "name": "홍길동",
  "phone_number": "010-1111-2222",
  "profile_image_url": "https://..."
}
```
- **응답 (200)**:
```json
{
  "message": "프로필이 업데이트되었습니다."
}
```

## 14.3 알림 설정 조회

### `GET /api/settings/notifications`

- **응답 (200)**:
```json
{
  "email_notifications": {
    "case_updates": true,
    "new_messages": true,
    "weekly_summary": false
  },
  "push_notifications": {
    "case_updates": true,
    "new_messages": true
  }
}
```

## 14.4 알림 설정 수정

### `PUT /api/settings/notifications`

- **요청 Body**:
```json
{
  "email_notifications": {
    "weekly_summary": true
  }
}
```
- **응답 (200)**:
```json
{
  "message": "알림 설정이 업데이트되었습니다."
}
```

## 14.5 보안 설정 조회

### `GET /api/settings/security`

- **응답 (200)**:
```json
{
  "mfa_enabled": true,
  "last_password_change": "2025-10-01T10:00:00Z"
}
```

## 14.6 비밀번호 변경

### `POST /api/settings/security/change-password`

- **요청 Body**:
```json
{
  "current_password": "...",
  "new_password": "..."
}
```
- **응답 (200)**:
```json
{
  "message": "비밀번호가 변경되었습니다."
}
```

---
# 📅 15. Calendar API

일정 관리 API.

## 15.1 일정 목록 조회

### `GET /api/calendar/events`

- **쿼리 파라미터**:
  - `start`: ISO 날짜 (필수)
  - `end`: ISO 날짜 (필수)
  - `case_id` (optional): 특정 사건 일정만
- **응답 (200)**

```json
{
  "items": [
    {
      "id": "evt_001",
      "title": "조정기일",
      "event_type": "hearing",
      "start_time": "2025-01-15T14:00:00Z",
      "end_time": "2025-01-15T16:00:00Z",
      "case_id": "case_001",
      "case_title": "김○○ 이혼 사건",
      "location": "서울가정법원 305호",
      "color": "#3B82F6"
    }
  ]
}
```

## 15.2 일정 생성

### `POST /api/calendar/events`

- **요청 Body**

```json
{
  "title": "조정기일",
  "event_type": "hearing",
  "start_time": "2025-01-15T14:00:00Z",
  "end_time": "2025-01-15T16:00:00Z",
  "case_id": "case_001",
  "location": "서울가정법원 305호",
  "notes": "준비서면 지참"
}
```

---

# ⚖️ 16. Precedent Search API (012-precedent-integration)

유사 판례 검색 및 초안 인용 기능을 위한 API

## 16.1 유사 판례 검색

### `GET /cases/{case_id}/similar-precedents`

- 설명: 사건 증거 기반 유사 판례 검색 (Qdrant 벡터 검색)
- 쿼리 파라미터:
  - `limit` (optional): 반환할 판례 수 (default: 10, max: 50)
  - `min_score` (optional): 최소 유사도 점수 (default: 0.5)

- 응답 (200):

```json
{
  "precedents": [
    {
      "case_ref": "2022다12345",
      "court": "대법원",
      "decision_date": "2023-03-15",
      "case_type": "이혼",
      "summary": "판시사항 요약...",
      "key_factors": ["불륜", "재산분할"],
      "property_division_ratio": "50:50",
      "alimony_amount": 30000000,
      "similarity_score": 0.87,
      "source_url": "https://www.law.go.kr/..."
    }
  ],
  "total": 5,
  "search_keywords": ["불륜", "재산분할"]
}
```

- 오류 응답:
  - 403: 사건 접근 권한 없음
  - 404: 사건 없음
  - 503: Qdrant 연결 실패 (빈 배열 + warning 반환)

---

# 🤖 17. Auto-Extraction API (012-precedent-integration)

AI Worker가 자동 추출한 인물/관계를 저장하는 API

## 17.1 자동 추출 인물 저장

### `POST /cases/{case_id}/parties/auto-extract`

- 설명: AI Worker가 추출한 인물을 저장 (중복 검출 포함)
- 요청 Body:

```json
{
  "name": "김철수",
  "type": "plaintiff",
  "extraction_confidence": 0.85,
  "source_evidence_id": "ev_abc123",
  "alias": "철수",
  "birth_year": 1985,
  "occupation": "회사원"
}
```

- 응답 (201):

```json
{
  "id": "party_xyz789",
  "name": "김철수",
  "is_duplicate": false,
  "matched_party_id": null
}
```

- 중복 검출 시 (201):

```json
{
  "id": "party_existing123",
  "name": "김철수",
  "is_duplicate": true,
  "matched_party_id": "party_existing123"
}
```

- 오류 응답:
  - 400: 신뢰도 0.7 미만
  - 403: 사건 쓰기 권한 없음
  - 404: 사건 없음

## 17.2 자동 추출 관계 저장

### `POST /cases/{case_id}/relationships/auto-extract`

- 설명: AI Worker가 추론한 관계를 저장
- 요청 Body:

```json
{
  "source_party_id": "party_abc",
  "target_party_id": "party_def",
  "type": "marriage",
  "extraction_confidence": 0.92,
  "evidence_text": "2010년 결혼식..."
}
```

- 응답 (201):

```json
{
  "id": "rel_xyz123",
  "created": true
}
```

- 오류 응답:
  - 400: 신뢰도 0.7 미만 또는 인물 없음
  - 403: 사건 쓰기 권한 없음
  - 404: 인물 없음

---

# ✅ 18. 확장 포인트 (v2 이후)

- Draft 버전 관리 및 편집 이력 (`PUT /api/cases/{id}/draft`)
- Opponent Claim 관리 API (상대방 주장 텍스트 + 증거 링크)
- Webhook 기반 비동기 알림 (증거 분석 완료, Draft 생성 완료 등)
- Admin용 감사 로그 조회 API

---

**END OF API_SPEC.md**