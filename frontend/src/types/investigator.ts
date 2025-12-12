/**
 * Investigator Types for Lawyer Portal
 * 005-lawyer-portal-pages Feature - US3
 */

export type InvestigatorAvailability = 'available' | 'busy' | 'unavailable';

export interface InvestigatorItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  active_assignments: number;
  completed_assignments: number;
  availability: InvestigatorAvailability;
  last_activity?: string;
  rating?: number;
}

export interface InvestigatorListResponse {
  items: InvestigatorItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface InvestigatorFilter {
  search?: string;
  availability?: InvestigatorAvailability | 'all';
  sort_by?: 'name' | 'active_assignments' | 'completed_assignments' | 'last_activity';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface InvestigatorDetail {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  bio?: string;
  certifications?: string[];
  availability: InvestigatorAvailability;
  availability_note?: string;
  stats: InvestigatorStats;
  case_assignments: CaseAssignment[];
  recent_work: WorkItem[];
}

export interface InvestigatorStats {
  active_assignments: number;
  completed_assignments: number;
  total_evidence_collected: number;
  avg_case_duration_days: number;
  success_rate: number;
}

export interface CaseAssignment {
  case_id: string;
  case_title: string;
  status: string;
  assigned_at: string;
  evidence_count: number;
  last_activity: string;
}

export interface WorkItem {
  type: string;
  case_id: string;
  description: string;
  timestamp: string;
}

// ============== Detective CRUD Types (US2 - Lawyer Portal) ==============

/**
 * Detective contact for lawyer's address book
 * Separate from User accounts - these are contacts managed by lawyers
 */
export interface DetectiveContact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  specialty?: string;
  memo?: string;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface DetectiveContactCreate {
  name: string;
  phone?: string;
  email?: string;
  specialty?: string;
  memo?: string;
}

export interface DetectiveContactUpdate {
  name?: string;
  phone?: string;
  email?: string;
  specialty?: string;
  memo?: string;
}

export interface DetectiveContactListResponse {
  detectives: DetectiveContact[];
  total: number;
  page: number;
  limit: number;
}

export interface DetectiveContactQueryParams {
  search?: string;
  page?: number;
  limit?: number;
}
