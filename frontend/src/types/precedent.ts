/**
 * Precedent Types
 * 유사 판례 검색 관련 타입 정의
 */

// =============================================================================
// Enums
// =============================================================================

/**
 * 유책사유 유형
 */
export enum FaultType {
  ADULTERY = 'adultery',           // 부정행위
  VIOLENCE = 'violence',           // 폭행
  VERBAL_ABUSE = 'verbal_abuse',   // 폭언
  ECONOMIC = 'economic',           // 경제적 학대
  ABANDONMENT = 'abandonment',     // 유기
  MALICIOUS_DESERTION = 'malicious_desertion', // 악의의 유기
  OTHER = 'other',                 // 기타
}

// =============================================================================
// Interfaces
// =============================================================================

/**
 * 유사 판례
 */
export interface SimilarPrecedent {
  id: string;
  court: string;              // 법원명 (예: "서울가정법원")
  case_number: string;        // 사건번호 (예: "2023드합1234")
  case_year: number;          // 판결 연도
  similarity_score: number;   // 유사도 점수 (0~100)
  fault_types: FaultType[];   // 유책사유 유형
  fault_type_labels: string[]; // 유책사유 라벨 (한글)
  alimony_amount?: number;    // 위자료 금액 (만원 단위)
  division_ratio?: string;    // 재산분할 비율 (예: "60:40")
  summary: string;            // 판결 요약 (1-2문장)
  key_points: string[];       // 핵심 판결 포인트
  full_text?: string;         // 전체 판결문 (선택)
  relevance_reason?: string;  // 유사 판단 근거
}

/**
 * 판례 검색 통계
 */
export interface PrecedentStatistics {
  total_count: number;            // 검색된 판례 수
  avg_alimony: number;            // 평균 위자료 (만원)
  min_alimony: number;            // 최소 위자료 (만원)
  max_alimony: number;            // 최대 위자료 (만원)
  avg_division_ratio?: string;    // 평균 재산분할 비율
  most_common_fault_types: string[]; // 가장 흔한 유책사유
  win_rate?: number;              // 승소율 (0~100)
}

/**
 * 판례 검색 결과
 */
export interface PrecedentSearchResult {
  case_id: string;
  query_summary: string;           // 검색 쿼리 요약
  search_type: 'fault_types' | 'keywords' | 'rag'; // 검색 유형
  precedents: SimilarPrecedent[];
  statistics: PrecedentStatistics;
  generated_at: string;            // ISO 8601
}

/**
 * 판례 검색 필터
 */
export interface PrecedentSearchFilter {
  fault_types?: FaultType[];
  min_alimony?: number;
  max_alimony?: number;
  year_from?: number;
  year_to?: number;
  courts?: string[];
}

/**
 * 판례 사이드 패널 상태
 */
export interface PrecedentPanelState {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  searchResult: PrecedentSearchResult | null;
  selectedPrecedent: SimilarPrecedent | null;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 유책사유 한글 라벨 반환
 */
export function getFaultTypeLabel(type: FaultType): string {
  const labels: Record<FaultType, string> = {
    [FaultType.ADULTERY]: '부정행위',
    [FaultType.VIOLENCE]: '폭행',
    [FaultType.VERBAL_ABUSE]: '폭언',
    [FaultType.ECONOMIC]: '경제적 학대',
    [FaultType.ABANDONMENT]: '유기',
    [FaultType.MALICIOUS_DESERTION]: '악의의 유기',
    [FaultType.OTHER]: '기타',
  };
  return labels[type] || '기타';
}

/**
 * 유사도 점수에 따른 색상 반환
 */
export function getSimilarityColor(score: number): string {
  if (score >= 80) return '#4CAF50'; // 녹색 - 매우 유사
  if (score >= 60) return '#2196F3'; // 파랑 - 유사
  if (score >= 40) return '#FF9800'; // 주황 - 보통
  return '#9E9E9E'; // 회색 - 낮음
}

/**
 * 유사도 점수에 따른 라벨 반환
 */
export function getSimilarityLabel(score: number): string {
  if (score >= 80) return '매우 유사';
  if (score >= 60) return '유사';
  if (score >= 40) return '보통';
  return '참고';
}

/**
 * 위자료 금액 포맷팅 (만원 단위)
 */
export function formatAlimonyAmount(amount: number): string {
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(1)}억원`;
  }
  return `${amount.toLocaleString()}만원`;
}

/**
 * 사건번호 파싱
 */
export function parseCaseNumber(caseNumber: string): {
  year: number;
  type: string;
  number: number;
} | null {
  // 예: "2023드합1234" -> { year: 2023, type: "드합", number: 1234 }
  const match = caseNumber.match(/(\d{4})(\D+)(\d+)/);
  if (!match) return null;

  return {
    year: parseInt(match[1], 10),
    type: match[2],
    number: parseInt(match[3], 10),
  };
}
