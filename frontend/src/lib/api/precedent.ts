/**
 * Precedent API Client
 * 유사 판례 검색 관련 API 호출
 */

import { apiRequest, ApiResponse } from './client';
import {
  SimilarPrecedent,
  PrecedentSearchResult,
  PrecedentStatistics,
  FaultType,
  PrecedentSearchFilter,
} from '@/types/precedent';

// =============================================================================
// API 응답 타입
// =============================================================================

interface PrecedentApiResponse {
  status: string;
  result: PrecedentSearchResult;
}

interface PrecedentDetailResponse {
  status: string;
  result: SimilarPrecedent;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * 사건 기반 유사 판례 검색
 * 사건의 유책사유와 증거를 기반으로 유사 판례 검색
 *
 * @param caseId - 사건 ID
 * @param limit - 결과 제한 (기본 5)
 * @returns 판례 검색 결과
 */
export async function searchPrecedentsByCase(
  caseId: string,
  limit: number = 5
): Promise<ApiResponse<PrecedentSearchResult>> {
  const response = await apiRequest<PrecedentApiResponse>(
    `/cases/${caseId}/similar-precedents?limit=${limit}`,
    { method: 'GET' }
  );

  if (response.data) {
    return { ...response, data: response.data.result };
  }
  return { error: response.error, status: response.status };
}

/**
 * 유책사유 기반 판례 검색
 *
 * @param faultTypes - 유책사유 유형 배열
 * @param filters - 추가 필터 옵션
 * @returns 판례 검색 결과
 */
export async function searchPrecedentsByFaultTypes(
  faultTypes: FaultType[],
  filters?: PrecedentSearchFilter
): Promise<ApiResponse<PrecedentSearchResult>> {
  const params = new URLSearchParams();

  faultTypes.forEach((type) => params.append('fault_types', type));

  if (filters) {
    if (filters.min_alimony) params.append('min_alimony', filters.min_alimony.toString());
    if (filters.max_alimony) params.append('max_alimony', filters.max_alimony.toString());
    if (filters.year_from) params.append('year_from', filters.year_from.toString());
    if (filters.year_to) params.append('year_to', filters.year_to.toString());
    if (filters.courts?.length) params.append('courts', filters.courts.join(','));
  }

  const response = await apiRequest<PrecedentApiResponse>(
    `/precedents/search?${params.toString()}`,
    { method: 'GET' }
  );

  if (response.data) {
    return { ...response, data: response.data.result };
  }
  return { error: response.error, status: response.status };
}

/**
 * 키워드 기반 판례 검색
 *
 * @param query - 검색 쿼리 텍스트
 * @param limit - 결과 제한 (기본 5)
 * @returns 판례 검색 결과
 */
export async function searchPrecedentsByQuery(
  query: string,
  limit: number = 5
): Promise<ApiResponse<PrecedentSearchResult>> {
  const response = await apiRequest<PrecedentApiResponse>(
    '/precedents/search',
    {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    }
  );

  if (response.data) {
    return { ...response, data: response.data.result };
  }
  return { error: response.error, status: response.status };
}

/**
 * 판례 상세 조회
 *
 * @param precedentId - 판례 ID
 * @returns 판례 상세 정보
 */
export async function getPrecedentDetail(
  precedentId: string
): Promise<ApiResponse<SimilarPrecedent>> {
  const response = await apiRequest<PrecedentDetailResponse>(
    `/precedents/${precedentId}`,
    { method: 'GET' }
  );

  if (response.data) {
    return { ...response, data: response.data.result };
  }
  return { error: response.error, status: response.status };
}

// =============================================================================
// Demo API (L-Demo 연동)
// =============================================================================

/**
 * RAG 기반 유사 판례 검색 (Demo)
 *
 * @param text - 검색할 텍스트 (사건 설명)
 * @param topK - 상위 결과 수 (기본 5)
 * @returns 유사 판례 검색 결과
 */
export async function searchPrecedentsByRAG(
  text: string,
  topK: number = 5
): Promise<ApiResponse<PrecedentSearchResult>> {
  const response = await apiRequest<{
    status: string;
    result: {
      cases: Array<{
        id: string;
        content: string;
        metadata: Record<string, unknown>;
        similarity: number;
      }>;
      query: string;
    };
  }>('/l-demo/search/precedents', {
    method: 'POST',
    body: JSON.stringify({ text, top_k: topK }),
  });

  if (response.data) {
    // Transform RAG response to PrecedentSearchResult
    const transformed = transformRAGToPrecedents(response.data.result, text);
    return { ...response, data: transformed };
  }
  return { error: response.error, status: response.status };
}

/**
 * RAG 응답을 PrecedentSearchResult로 변환
 */
function transformRAGToPrecedents(
  ragResult: {
    cases: Array<{
      id: string;
      content: string;
      metadata: Record<string, unknown>;
      similarity: number;
    }>;
    query: string;
  },
  queryText: string
): PrecedentSearchResult {
  const precedents: SimilarPrecedent[] = ragResult.cases.map((item, index) => ({
    id: item.id,
    court: (item.metadata?.court as string) || '가정법원',
    case_number: (item.metadata?.case_number as string) || `20XX드합${1000 + index}`,
    case_year: (item.metadata?.year as number) || 2023,
    similarity_score: Math.round(item.similarity * 100),
    fault_types: (item.metadata?.fault_types as FaultType[]) || [],
    fault_type_labels: (item.metadata?.fault_type_labels as string[]) || [],
    alimony_amount: item.metadata?.alimony as number,
    division_ratio: item.metadata?.division_ratio as string,
    summary: item.content.slice(0, 200) + (item.content.length > 200 ? '...' : ''),
    key_points: (item.metadata?.key_points as string[]) || [],
    full_text: item.content,
    relevance_reason: `유사도 ${Math.round(item.similarity * 100)}% 매칭`,
  }));

  const alimonyAmounts = precedents
    .filter((p) => p.alimony_amount !== undefined)
    .map((p) => p.alimony_amount as number);

  return {
    case_id: 'search',
    query_summary: queryText.slice(0, 100),
    search_type: 'rag',
    precedents,
    statistics: {
      total_count: precedents.length,
      avg_alimony: alimonyAmounts.length > 0
        ? Math.round(alimonyAmounts.reduce((a, b) => a + b, 0) / alimonyAmounts.length)
        : 0,
      min_alimony: alimonyAmounts.length > 0 ? Math.min(...alimonyAmounts) : 0,
      max_alimony: alimonyAmounts.length > 0 ? Math.max(...alimonyAmounts) : 0,
      most_common_fault_types: getMostCommonFaultTypes(precedents),
    },
    generated_at: new Date().toISOString(),
  };
}

/**
 * 가장 흔한 유책사유 추출
 */
function getMostCommonFaultTypes(precedents: SimilarPrecedent[]): string[] {
  const counts: Record<string, number> = {};

  precedents.forEach((p) => {
    p.fault_type_labels.forEach((label) => {
      counts[label] = (counts[label] || 0) + 1;
    });
  });

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([label]) => label);
}

// =============================================================================
// Mock Data (Backend API 준비 전 테스트용)
// =============================================================================

/**
 * Mock 판례 데이터 생성
 */
export function generateMockPrecedents(caseId: string): PrecedentSearchResult {
  const mockPrecedents: SimilarPrecedent[] = [
    {
      id: 'prec_001',
      court: '서울가정법원',
      case_number: '2023드합1234',
      case_year: 2023,
      similarity_score: 85,
      fault_types: [FaultType.ADULTERY, FaultType.VIOLENCE],
      fault_type_labels: ['부정행위', '폭행'],
      alimony_amount: 3500,
      division_ratio: '55:45',
      summary: '배우자의 외도 및 폭행으로 인한 이혼 사건. 유책배우자에게 위자료 3,500만원 및 재산분할 45% 인정.',
      key_points: [
        '외도 증거: 카카오톡 대화 내역, 호텔 영수증',
        '폭행 증거: 진단서, 녹음 파일',
        '유책성 인정으로 재산분할에서 불리하게 적용',
      ],
      relevance_reason: '부정행위와 폭행이 동시에 있는 유사 사안',
    },
    {
      id: 'prec_002',
      court: '수원가정법원',
      case_number: '2022드합5678',
      case_year: 2022,
      similarity_score: 72,
      fault_types: [FaultType.VERBAL_ABUSE, FaultType.ECONOMIC],
      fault_type_labels: ['폭언', '경제적 학대'],
      alimony_amount: 2500,
      summary: '지속적인 폭언과 경제적 학대로 인한 혼인파탄 사건.',
      key_points: [
        '폭언 녹음 파일 10건 이상 제출',
        '생활비 미지급 기간 2년',
      ],
      relevance_reason: '정서적 학대 패턴이 유사',
    },
    {
      id: 'prec_003',
      court: '인천가정법원',
      case_number: '2023드합9012',
      case_year: 2023,
      similarity_score: 68,
      fault_types: [FaultType.ADULTERY],
      fault_type_labels: ['부정행위'],
      alimony_amount: 4000,
      division_ratio: '60:40',
      summary: '배우자의 장기간 외도로 인한 이혼. 위자료 4,000만원 인정.',
      key_points: [
        '외도 기간 3년 이상 지속',
        '자녀 양육권은 원고에게',
      ],
      relevance_reason: '부정행위 사안',
    },
  ];

  return {
    case_id: caseId,
    query_summary: '사건 정보 기반 유사 판례 검색',
    search_type: 'rag',
    precedents: mockPrecedents,
    statistics: {
      total_count: mockPrecedents.length,
      avg_alimony: 3333,
      min_alimony: 2500,
      max_alimony: 4000,
      most_common_fault_types: ['부정행위', '폭행', '폭언'],
      win_rate: 75,
    },
    generated_at: new Date().toISOString(),
  };
}
