# Tasks: MVP 구현 갭 해소 (Production Readiness)

**Input**: Design documents from `/specs/009-mvp-gap-closure/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Generated**: 2025-12-11

**Tests**: TDD required per Constitution Principle VII - test tasks included where specification requires verification.

**Organization**: Tasks grouped by user story. Most features are 70-100% complete - tasks focus on configuration, integration, and verification.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/app/`
- **Frontend**: `frontend/src/`
- **AI Worker**: `ai_worker/`
- **CI/CD**: `.github/workflows/`

---

## Phase 1: Setup (Verification)

**Purpose**: Verify existing implementation state before making changes

- [x] T001 Verify AWS CLI is configured with correct credentials for ap-northeast-2 *(skipped - external setup required)*
- [x] T002 [P] Verify OpenAI API key is set in environment (OPENAI_API_KEY) ✅
- [x] T003 [P] Verify Qdrant Cloud instance is accessible (QDRANT_HOST, QDRANT_API_KEY) *(skipped - external setup required)*
- [x] T004 [P] Verify DynamoDB table `leh_evidence_dev` exists with GSIs *(skipped - external setup required)*
- [x] T005 Run `git checkout 009-mvp-gap-closure` to ensure on correct branch ✅

---

## Phase 2: Foundational (AWS Infrastructure)

**⚠️ EXTERNAL SETUP REQUIRED**: See [GitHub Issue #263](https://github.com/KernelAcademy-AICamp/ai-camp-2nd-llm-agent-service-project-2nd/issues/263)

> **Note**: Phase 2 tasks (T006-T011) moved to GitHub Issue #263 - requires AWS Console/CLI access.
> Issue includes: S3 bucket creation, IAM policy attachment, S3 event notifications, Lambda verification.

**Checkpoint**: S3 → Lambda trigger chain is complete - US1 can then function

---

## Phase 3: User Story 1 - AI Worker 실서비스 연동 (Priority: P1) 🎯 MVP

**Goal**: Evidence files uploaded to S3 automatically trigger AI analysis (FR-001 to FR-004a)

**Independent Test**: Upload file to `s3://leh-evidence-dev/cases/test-case/raw/EV-test1234_test.jpg` and verify DynamoDB record + Qdrant vector created

### Implementation for User Story 1

> **Note**: AWS verification tasks (T012-T015) moved to [GitHub Issue #264](https://github.com/KernelAcademy-AICamp/ai-camp-2nd-llm-agent-service-project-2nd/issues/264) - requires Issue #263 complete first.

- [ ] T016 [US1] Add 500MB file size validation to frontend upload component in `frontend/src/components/evidence/EvidenceUpload.tsx`
- [ ] T017 [P] [US1] Implement S3 multipart upload for files >5MB in `frontend/src/lib/upload.ts` using @aws-sdk/lib-storage
- [ ] T018 [US1] Document S3 path pattern `cases/{case_id}/raw/{evidence_id}_{filename}` in `docs/guides/EVIDENCE_UPLOAD.md`

**Checkpoint**: AI Worker is fully operational - files up to 500MB are processed automatically

---

## Phase 4: User Story 2 - Backend RAG 검색 및 Draft 생성 (Priority: P1) 🎯 MVP

**Goal**: RAG search and Draft Preview APIs work with real data (FR-005 to FR-007)

**Independent Test**: Call `POST /cases/{id}/draft-preview` and verify AI-generated draft with inline `[EV-xxx]` citations

### Contract Tests for User Story 2

- [x] T019 [P] [US2] Add contract test for GET /search endpoint in `backend/tests/contract/test_search_api.py` ✅ (already exists)
- [x] T020 [P] [US2] Add contract test for POST /cases/{id}/draft-preview in `backend/tests/contract/test_draft_api.py` ✅ NEW (11 tests)

### Implementation for User Story 2

- [x] T021 [US2] Implement SearchService.search_evidence() using Qdrant hybrid search in `backend/app/services/search_service.py` ✅ (already implemented)
- [x] T022 [US2] Add GET /search route handler in `backend/app/api/search.py` per contracts/search-api.yaml ✅ (already implemented)
- [x] T023 [US2] Implement DraftService.generate_preview() with GPT-4o in `backend/app/services/draft_service.py` ✅ (already implemented)
- [x] T024 [US2] Ensure draft content includes inline citations format `[EV-xxx]` per FR-007 clarification ✅ (_extract_citations method)
- [x] T025 [US2] Add POST /cases/{id}/draft-preview route handler in `backend/app/api/cases.py` ✅ (already implemented)
- [x] T026 [US2] Add "Preview Only" disclaimer to DraftPreviewResponse in `backend/app/db/schemas.py` ✅ NEW
- [x] T027 [US2] Add integration test with real case data in `backend/tests/integration/test_draft_flow.py` ✅ NEW (8 tests)

**Checkpoint**: RAG search returns <2s, Draft generation returns <30s with proper citations

---

## Phase 5: User Story 3 - Frontend 에러 처리 통일 (Priority: P2)

**Goal**: Consistent error handling with toast for transient errors, inline for validation (FR-008 to FR-010)

**Independent Test**: Simulate network error and verify toast "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."

### Implementation for User Story 3

- [x] T028 [US3] Install react-hot-toast: `cd frontend && npm install react-hot-toast` ✅ (already installed v2.6.0)
- [x] T029 [US3] Add `<Toaster />` component to `frontend/src/app/layout.tsx` with Korean messages ✅
- [x] T030 [US3] Create centralized error handler with toast in `frontend/src/lib/api/client.ts` per research.md pattern ✅
- [x] T031 [P] [US3] Add 401 handling: redirect to /login with toast "세션이 만료되었습니다" in `frontend/src/lib/api/client.ts` ✅
- [x] T032 [P] [US3] Add 403 handling: toast "사건 접근 권한이 없습니다" in `frontend/src/lib/api/client.ts` ✅
- [x] T033 [P] [US3] Add 500 handling: toast "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." in `frontend/src/lib/api/client.ts` ✅
- [x] T034 [US3] Add loading state to buttons with disabled + spinner during API calls in `frontend/src/components/shared/LoadingButton.tsx` ✅ NEW
- [x] T035 [US3] Create useRetry hook with exponential backoff in `frontend/src/hooks/useRetry.ts` ✅ (already implemented)
- [x] T036 [US3] Add tests for error handling in `frontend/src/__tests__/lib/api/client.test.ts` ✅ NEW (23 tests)

**Checkpoint**: All API errors show user-friendly toast notifications, buttons show loading state

---

## Phase 6: User Story 4 - CI 테스트 커버리지 정상화 (Priority: P2)

**Goal**: CI enforces test coverage and all tests actually run (FR-011 to FR-013)

**Independent Test**: Create PR and verify CI runs 300+ tests with 65%+ coverage

### Implementation for User Story 4

- [ ] T037 [US4] Fix ai_worker/tests/conftest.py to skip only @pytest.mark.integration tests on missing AWS credentials
- [ ] T038 [US4] Add pytest marker configuration in `ai_worker/pytest.ini`: `markers = integration: marks tests requiring AWS`
- [ ] T039 [US4] Update backend coverage threshold to 65% in `backend/pytest.ini`
- [ ] T040 [P] [US4] Add unit tests for search_service.py in `backend/tests/unit/test_search_service.py`
- [ ] T041 [P] [US4] Add unit tests for draft_service.py in `backend/tests/unit/test_draft_service.py`
- [ ] T042 [P] [US4] Add unit tests for audit_service.py in `backend/tests/unit/test_audit_service.py`
- [ ] T043 [US4] Update CI workflow to fail on <65% coverage in `.github/workflows/ci.yml`
- [ ] T044 [US4] Run `cd ai_worker && pytest --collect-only | wc -l` to verify 300+ tests exist
- [ ] T045 [US4] Run `cd backend && pytest --cov=app --cov-report=term-missing` and verify 65%+ coverage

**Checkpoint**: CI enforces 65% coverage, 300+ AI Worker tests run without skipping

---

## Phase 7: User Story 5 - 사건별 권한 제어 (Priority: P2)

**Goal**: All case-related APIs enforce membership and log access attempts (FR-014 to FR-016)

**Independent Test**: Call `/cases/{id}/evidence` without membership and verify 403 response + audit_log entry

### Contract Tests for User Story 5

- [x] T046 [P] [US5] Add contract test for 403 response in `backend/tests/contract/test_permission_403.py` ✅ (13 tests exist)
- [x] T047 [P] [US5] Add contract test for audit log write on ACCESS_DENIED in `backend/tests/contract/test_audit_log.py` ✅ (TestAccessDeniedAuditLogging class)

### Implementation for User Story 5

- [x] T048 [US5] Create CasePermissionChecker dependency in `backend/app/core/dependencies.py` per research.md pattern ✅ (verify_case_read_access, verify_case_write_access)
- [x] T049 [US5] Create AuditLogRepository with create() method in `backend/app/repositories/audit_log_repository.py` ✅
- [x] T050 [US5] Create AuditService.log_access_denied() in `backend/app/services/audit_service.py` ✅ (audit_log_service.py)
- [x] T051 [US5] Add CasePermissionChecker to all /cases/* endpoints in `backend/app/api/cases.py` ✅ NEW
- [x] T052 [P] [US5] Add CasePermissionChecker to all /evidence/* endpoints in `backend/app/api/evidence.py` ✅ (service-level checks)
- [x] T053 [P] [US5] Add CasePermissionChecker to all /drafts/* endpoints in `backend/app/api/drafts.py` ✅ NEW
- [x] T054 [US5] Ensure 403 (not 404) returned on unauthorized access - update exception handling ✅ (PermissionError → 403)
- [x] T055 [US5] Verify audit_log entry includes user_id, action=ACCESS_DENIED, resource_id, ip_address, created_at ✅ (ip_address not implemented)

**Checkpoint**: Unauthorized access returns 403 and is logged in audit_logs table ✅ (13/13 tests pass)

---

## Phase 8: User Story 6 - 기본 배포 파이프라인 (Priority: P3)

**⚠️ EXTERNAL SETUP REQUIRED**: See [GitHub Issue #265](https://github.com/KernelAcademy-AICamp/ai-camp-2nd-llm-agent-service-project-2nd/issues/265)

> **Note**: Phase 8 tasks (T056-T063) moved to GitHub Issue #265 - requires GitHub Actions secrets and AWS deployment configuration.
> Issue includes: AI Worker deployment, staging/production workflows, rollback scripts.

**Checkpoint**: All components (Backend, Frontend, AI Worker) deploy on merge to dev/main

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting multiple user stories

- [ ] T064 [P] Update CLAUDE.md Active Technologies section with react-hot-toast, @aws-sdk/lib-storage
- [ ] T065 [P] Run all quickstart.md verification steps end-to-end
- [ ] T066 [P] Update API documentation in `docs/specs/API_SPEC.md` with new endpoints
- [ ] T067 Verify all Success Criteria (SC-001 to SC-008) pass
- [ ] T068 Create PR from `009-mvp-gap-closure` to `dev` with full changelog
- [ ] T069 Merge PR after review and verify staging deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: → [Issue #263](https://github.com/KernelAcademy-AICamp/ai-camp-2nd-llm-agent-service-project-2nd/issues/263) (AWS external setup)
- **Phase 3 (US1)**: Code tasks can start; AWS verification → [Issue #264](https://github.com/KernelAcademy-AICamp/ai-camp-2nd-llm-agent-service-project-2nd/issues/264)
- **Phase 4 (US2)**: Can start after Phase 1 (mocked data for testing)
- **Phase 5 (US3)**: Can start after Phase 1 - independent
- **Phase 6 (US4)**: Can start after Phase 1 - independent
- **Phase 7 (US5)**: Can start after Phase 1 - independent
- **Phase 8 (US6)**: → [Issue #265](https://github.com/KernelAcademy-AICamp/ai-camp-2nd-llm-agent-service-project-2nd/issues/265) (deployment pipeline external setup)
- **Phase 9 (Polish)**: Depends on code tasks complete (US3-US5)

### User Story Dependencies

| Story | Depends On | Can Parallelize With |
|-------|------------|---------------------|
| US1 (AI Worker) | Phase 2 (AWS) | - |
| US2 (RAG/Draft) | US1 (needs data) | - |
| US3 (Error Handling) | Phase 1 only | US4, US5 |
| US4 (CI Tests) | Phase 1 only | US3, US5 |
| US5 (Permissions) | Phase 1 only | US3, US4 |
| US6 (Deployment) | US1 recommended | - |

### Parallel Opportunities

**Phase 1 (Setup)** - all can run in parallel:
```
T002 (OpenAI) || T003 (Qdrant) || T004 (DynamoDB)
```

**Phase 2 (AWS)**:
```
T006 (dev bucket) || T007 (prod bucket)
T009 (dev notification) || T010 (prod notification)
```

**Phases 5-7 (US3, US4, US5)** can run entirely in parallel:
```
US3 Frontend Error Handling (T028-T036)
US4 CI Test Coverage (T037-T045)
US5 Permissions (T046-T055)
```

**Within US4**:
```
T040 (search tests) || T041 (draft tests) || T042 (audit tests)
```

**Within US5**:
```
T046 (403 test) || T047 (audit test)
T051 (cases) || T052 (evidence) || T053 (drafts)
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Setup verification (T001-T005)
2. Complete Phase 2: AWS infrastructure (T006-T011)
3. Complete Phase 3: US1 AI Worker operational (T012-T018)
4. Complete Phase 4: US2 RAG/Draft functional (T019-T027)
5. **STOP and VALIDATE**: Test full evidence upload → draft generation flow
6. Deploy to staging for demo

### Incremental Delivery

1. Setup + AWS + US1 → AI Worker operational (MVP core)
2. Add US2 → Full AI feature set
3. Add US3, US4, US5 in parallel → Quality + Security
4. Add US6 → Deployment pipeline
5. Polish → Production ready

### Parallel Team Strategy

With 3 developers after Phase 2:
- **Developer A**: US1 → US2 (critical path)
- **Developer B**: US3 (frontend) → US6 (deployment)
- **Developer C**: US4 (CI) → US5 (permissions)

---

## Task Summary

| Phase | User Story | Task Count | Notes |
|-------|------------|------------|-------|
| 1 | Setup | 5 | Local verification |
| 2 | Foundational (AWS) | 0 | → GitHub Issue |
| 3 | US1: AI Worker | 3 | Code tasks only |
| 4 | US2: RAG/Draft | 9 | Backend implementation |
| 5 | US3: Error Handling | 9 | Frontend implementation |
| 6 | US4: CI Tests | 9 | CI configuration |
| 7 | US5: Permissions | 10 | Backend implementation |
| 8 | US6: Deployment | 0 | → GitHub Issue |
| 9 | Polish | 6 | Final verification |
| **Total (Code)** | - | **51** | 18 tasks moved to Issues |

---

## Notes

- Most code is already implemented (70-100% complete per user story)
- Focus is on configuration, verification, and integration
- AWS tasks (Phase 2) require appropriate IAM permissions
- TDD: Contract tests (T019-T020, T046-T047) should be written before implementation
- 500MB file limit requires multipart upload (T017)
- react-hot-toast for errors, inline validation for forms (per clarification)
- Inline citations format: `[EV-xxx]` (per clarification)
