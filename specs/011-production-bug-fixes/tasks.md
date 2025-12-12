# Tasks: Production Bug Fixes

**Input**: Design documents from `/specs/011-production-bug-fixes/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Included per Constitution VII (TDD Cycle)

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/app/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/src/__tests__/`

---

## Phase 1: Setup (Diagnosis)

**Purpose**: Identify the root cause before implementing fixes

- [x] T001 Verify production cookie settings by testing POST /auth/login with curl and inspecting Set-Cookie headers
- [x] T002 Check backend environment variables for COOKIE_SAMESITE, COOKIE_SECURE, CORS_ORIGINS in production
- [x] T003 [P] Inspect frontend API client credentials setting in frontend/src/lib/api/client.ts
- [x] T004 [P] Verify JUST_LOGGED_IN_KEY race condition fix in frontend/src/contexts/AuthContext.tsx
- [x] T005 Document findings: Which root cause is confirmed (Cookie Config / Race Condition / Middleware Sync)

**Diagnosis Result**:
- **ROOT CAUSE CONFIRMED**: Backend Cookie Configuration
  - `COOKIE_SAMESITE` defaults to `"lax"` (blocks cross-origin)
  - `COOKIE_SECURE` defaults to `False` (incompatible with `SameSite=None`)
- Frontend credentials: ✅ OK (`credentials: 'include'` correctly set)
- Race Condition: ✅ OK (JUST_LOGGED_IN_KEY fix exists)
- Middleware: ✅ OK (auth redirect logic correct)

**Checkpoint**: Root cause identified - proceed to Backend Fix (T011-T013)

---

## Phase 2: User Story 1 - 로그인 후 정상 리다이렉트 (Priority: P1) 🎯 MVP

**Goal**: 로그인 성공 후 역할별 대시보드로 정상 리다이렉트되고, 로그인 상태가 유지되어야 한다

**Independent Test**: 로그인 폼에서 유효한 자격 증명 입력 → 대시보드 도달 → 새로고침해도 로그인 유지

### Tests for User Story 1 (TDD)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T006 [P] [US1] E2E test: Login flow redirects to dashboard in frontend/e2e/auth.spec.ts
- [ ] T007 [P] [US1] E2E test: Page refresh maintains login state in frontend/e2e/auth.spec.ts
- [ ] T008 [P] [US1] E2E test: Back button from dashboard redirects back to dashboard in frontend/e2e/auth.spec.ts
- [ ] T009 [P] [US1] Unit test: AuthContext login method stores state correctly in frontend/src/__tests__/contexts/AuthContext.test.tsx
- [ ] T010 [P] [US1] Unit test: Middleware redirects authenticated user from /login in frontend/src/__tests__/middleware.test.ts

### Backend Fix (if cookie config is the root cause)

- [x] T011 [US1] Update cookie settings in backend/app/core/config.py: auto-configure samesite="none" and secure=True for prod/dev environments
- [x] T012 [US1] Verify CORS_ORIGINS includes CloudFront domain in backend/app/core/config.py
  - **Finding**: Code is correct. Production env var `CORS_ALLOW_ORIGINS` must include `https://dpbf86zqulqfy.cloudfront.net`
  - **Action Required**: Add CloudFront domain to Lambda/ECS environment variable
- [x] T013 [P] [US1] Contract test: Login response includes correct Set-Cookie headers in backend/tests/contract/test_auth_cookies.py
  - 12 tests: Cookie headers, settings validator, auto-config for cross-origin

### Frontend Fix (if race condition or middleware is the root cause)

- [ ] T014 [US1] Harden race condition fix: ensure sessionStorage.setItem completes before router.push in frontend/src/contexts/AuthContext.tsx
- [ ] T015 [US1] Verify user_data cookie is set synchronously after login in frontend/src/contexts/AuthContext.tsx
- [ ] T016 [US1] Update middleware to properly detect authenticated user and redirect from /login in frontend/src/middleware.ts
- [ ] T017 [US1] Ensure credentials: 'include' is set on all API calls in frontend/src/lib/api/client.ts

### Verification

- [ ] T018 [US1] Manual test: Complete login flow on production URL (https://dpbf86zqulqfy.cloudfront.net)
- [ ] T019 [US1] Manual test: Verify all 3 roles (lawyer, client, detective) redirect to correct dashboards
- [ ] T020 [US1] Manual test: Page refresh maintains login state
- [ ] T021 [US1] Manual test: Back button redirects to dashboard (not login page)

**Checkpoint**: User Story 1 complete - Login flow works correctly, SC-001 through SC-004 verified

---

## Phase 3: User Story 2 - 추가 버그 수정 (Priority: P2)

**Goal**: 로그인 문제 해결 후 발견되는 추가 버그들을 수정

**Independent Test**: TBD - 로그인 해결 후 확인

> **NOTE**: This phase will be populated after US1 is complete and additional bugs are discovered

### Placeholder Tasks

- [ ] T022 [US2] [PLACEHOLDER] Discover and document additional bugs after login fix
- [ ] T023 [US2] [PLACEHOLDER] Prioritize discovered bugs
- [ ] T024 [US2] [PLACEHOLDER] Implement fixes for highest priority bugs

**Checkpoint**: All discovered bugs fixed

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [ ] T025 Run all tests: backend pytest + frontend Jest + E2E Playwright
- [ ] T026 [P] Update spec.md status from Draft to Complete
- [ ] T027 [P] Run quickstart.md validation steps and document results
- [ ] T028 Create PR to merge 011-production-bug-fixes → dev

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **User Story 1 (Phase 2)**: Depends on Phase 1 root cause identification
  - If root cause = Cookie Config → T011-T013 first
  - If root cause = Race Condition → T014-T015 first
  - If root cause = Middleware Sync → T016-T017 first
- **User Story 2 (Phase 3)**: Depends on US1 completion
- **Polish (Phase 4)**: Depends on all user stories

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 1 - No dependencies on other stories
- **User Story 2 (P2)**: DEPENDS on US1 completion (cannot discover other bugs until login works)

### Within User Story 1

1. **TDD Tests (T006-T010)**: Write first, verify they FAIL
2. **Backend OR Frontend Fix**: Based on diagnosed root cause
   - Backend fix path: T011 → T012 → T013
   - Frontend fix path: T014 → T015 → T016 → T017
   - May need BOTH paths depending on diagnosis
3. **Verification (T018-T021)**: After implementation, verify all tests pass
4. **Manual testing**: Confirm on production URL

### Parallel Opportunities

- **Phase 1**: T003 and T004 can run in parallel (different files)
- **US1 Tests**: T006-T010 can all run in parallel (different test files)
- **US1 Backend Fix**: T011 and T012 sequential, T013 parallel after T011
- **Verification**: T019-T021 can run in parallel (independent manual tests)

---

## Parallel Example: User Story 1 Tests

```bash
# Launch all E2E tests for US1 in parallel:
Task: "E2E test: Login flow redirects to dashboard in frontend/e2e/auth.spec.ts"
Task: "E2E test: Page refresh maintains login state in frontend/e2e/auth.spec.ts"
Task: "E2E test: Back button redirects to dashboard in frontend/e2e/auth.spec.ts"

# Launch all unit tests for US1 in parallel:
Task: "Unit test: AuthContext login method in frontend/src/__tests__/contexts/AuthContext.test.tsx"
Task: "Unit test: Middleware redirects in frontend/src/__tests__/middleware.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (Diagnosis) - ~30 min
2. Complete Phase 2: User Story 1 - ~2-4 hours
3. **STOP and VALIDATE**: Test on production URL
4. Create PR if all success criteria pass

### Root Cause Based Approach

Based on research.md findings:

| Root Cause | Likelihood | Tasks to Execute |
|------------|------------|------------------|
| Cross-Origin Cookie Config | High | T011, T012, T013 |
| Race Condition | Medium | T014, T015 |
| Middleware Sync | Low | T016, T017 |

**Recommended**: Start with Cookie Config (highest likelihood), then verify if additional fixes needed.

### Success Criteria Mapping

| Success Criteria | Verification Task |
|-----------------|-------------------|
| SC-001: 100% redirect to dashboard | T018 |
| SC-002: State maintained on refresh | T020 |
| SC-003: < 3 seconds | T018 (observe timing) |
| SC-004: No login loop | T021 |

---

## Notes

- [P] tasks = different files, no dependencies
- [US1] / [US2] labels map tasks to user stories
- TDD: Write tests first, verify they fail, then implement
- Root cause diagnosis (Phase 1) determines which fix tasks to prioritize
- US2 is intentionally placeholder - will be populated after US1 completion
- Commit after each logical task group
- All verification must pass before PR creation
