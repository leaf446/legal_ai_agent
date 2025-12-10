/**
 * Relationship API Client
 * 인물 관계도 분석 API
 */

import { apiRequest, ApiResponse } from './client';
import { RelationshipGraph, PersonRole, RelationshipType } from '@/types/relationship';

/**
 * API 응답 형식 (Backend l-demo)
 */
interface AnalyzeRelationshipsResponse {
  status: string;
  result: RelationshipGraph;
}

/**
 * 텍스트에서 인물 관계를 분석합니다.
 *
 * @param text - 분석할 텍스트 (카카오톡 대화 등)
 * @returns 관계 그래프 (노드 + 엣지)
 *
 * @example
 * ```typescript
 * const response = await analyzeRelationships('김철수: 여보, 언제 와?');
 * if (response.data) {
 *   console.log(response.data.nodes); // 인물 목록
 *   console.log(response.data.edges); // 관계 목록
 * }
 * ```
 */
// MOCK IMPLEMENTATION FOR VERIFICATION - REVERTED
export async function analyzeRelationships(
  text: string
): Promise<ApiResponse<RelationshipGraph>> {
  const response = await apiRequest<AnalyzeRelationshipsResponse>(
    '/l-demo/analyze/relationships',
    {
      method: 'POST',
      body: JSON.stringify({ text }),
    }
  );

  // 성공 시 result를 추출하여 반환
  if (response.data) {
    return {
      data: response.data.result,
      status: response.status,
    };
  }

  // 에러 시 에러 정보만 반환
  return {
    error: response.error,
    status: response.status,
  };
}

/**
 * 케이스의 관계도 데이터를 조회합니다.
 * (009 브랜치 호환용)
 *
 * @param caseId - 사건 ID
 * @returns 관계 그래프
 */
export async function getCaseRelationships(
  caseId: string
): Promise<ApiResponse<RelationshipGraph>> {
  return apiRequest<RelationshipGraph>(`/cases/${caseId}/relationships`);
}

/**
 * 데모용 Mock 관계도 데이터를 반환합니다.
 * (009 브랜치 호환용)
 *
 * @returns Mock 관계 그래프
 */
export function getMockRelationshipGraph(): RelationshipGraph {
  return {
    nodes: [
      {
        id: 'person-0',
        name: '김철수',
        role: PersonRole.PLAINTIFF,
        side: 'plaintiff',
        color: '#4CAF50',
        aliases: ['원고', '남편'],
      },
      {
        id: 'person-1',
        name: '이영희',
        role: PersonRole.DEFENDANT,
        side: 'defendant',
        color: '#F44336',
        aliases: ['피고', '아내'],
      },
      {
        id: 'person-2',
        name: '박지민',
        role: PersonRole.THIRD_PARTY,
        side: 'third_party',
        color: '#E91E63',
        aliases: ['제3자'],
      },
      {
        id: 'person-3',
        name: '김민준',
        role: PersonRole.CHILD,
        side: 'plaintiff',
        color: '#2196F3',
        aliases: ['아들'],
      },
    ],
    edges: [
      {
        source: 'person-0',
        target: 'person-1',
        relationship: RelationshipType.SPOUSE,
        label: '배우자',
        confidence: 1.0,
        evidence: '혼인관계증명서',
      },
      {
        source: 'person-1',
        target: 'person-2',
        relationship: RelationshipType.AFFAIR,
        label: '외도 상대',
        confidence: 0.85,
        evidence: '카카오톡 대화 내역',
      },
      {
        source: 'person-0',
        target: 'person-3',
        relationship: RelationshipType.PARENT,
        label: '부모',
        confidence: 1.0,
        evidence: '가족관계증명서',
      },
      {
        source: 'person-1',
        target: 'person-3',
        relationship: RelationshipType.PARENT,
        label: '부모',
        confidence: 1.0,
        evidence: '가족관계증명서',
      },
    ],
  };
}
