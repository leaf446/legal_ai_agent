# Feature Specs Index

Spec-driven development로 진행한 기능별 명세 모음입니다.
프로젝트 후반부(016 이후)에는 일정상 스펙 문서의 체크리스트 갱신이 코드를 따라가지
못했습니다. 아래 표의 **실제 상태**가 tasks.md 체크박스보다 정확합니다.

| 스펙 | 내용 | 실제 상태 |
|------|------|-----------|
| 001-draft-export | 초안 DOCX/PDF 내보내기 | 구현 완료 → 이후 UI 간소화로 다운로드 버튼 제거 |
| 003-role-based-ui | 역할별(변호사/직원/의뢰인/탐정) UI | ✅ 완료 |
| 004-paralegal-progress | 직원 진행률 대시보드 | ✅ 완료 |
| 005-lawyer-portal-pages | 변호사 포털 페이지 404 수정 | ✅ 완료 |
| 007-lawyer-portal-v1 | 변호사 포털 v1 (캘린더/메시지/빌링) | ✅ 핵심 완료 (일부 고도화 항목 미착수) |
| 008-law-url-integration | 국가법령정보센터 법령 링크 | ✅ 완료 (tasks.md 없음) |
| 009-mvp-gap-closure | MVP 프로덕션 준비 | ✅ 완료 |
| 010-calm-control-design | Calm-Control 디자인 시스템 | ⏸️ 미착수 — 013 UI 업그레이드로 방향 대체 |
| 011-production-bug-fixes | 쿠키 인증/로그인 리다이렉트 수정 | ✅ 핵심 완료 (US1·US2 반영) |
| 012-detective-portal-update | 탐정 포털 개선 | ✅ 완료 (tasks.md 없음) |
| 012-precedent-integration | 유사 판례 검색·초안 인용 | ✅ 완료 |
| 013-ui-upgrade | 전면 UI 업그레이드 | ✅ 완료 |
| 014-case-fact-summary | 사건 사실관계 요약 | ✅ 완료 |
| 015-evidence-speaker-mapping | 증거 화자 매핑 | ✅ 완료 |
| 015-fix-async-draft-503 | 비동기 초안 생성 503 수정 | ✅ 완료 (tasks.md 없음) |
| 016-draft-fact-summary | fact-summary 기반 초안 생성 (타임아웃 해결) | ✅ **구현 완료** — tasks.md 체크박스만 미갱신 |

> 스펙 폴더 없이 커밋으로만 진행된 후속 기능: 017-party-graph-improvement(인물 추출 개선),
> 019-party-extraction-prompt(추출 프롬프트 정확도 개선) — `git log --grep` 으로 확인 가능
