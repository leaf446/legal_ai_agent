import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '관리자 대시보드 | LEH',
};

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary mb-6">관리자 대시보드</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/users"
          className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold text-lg text-secondary">사용자 관리</h3>
          <p className="text-sm text-neutral-600 mt-1">사용자 목록 및 권한 관리</p>
        </Link>

        <Link
          href="/admin/roles"
          className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold text-lg text-secondary">역할 관리</h3>
          <p className="text-sm text-neutral-600 mt-1">역할 및 권한 설정</p>
        </Link>

        <Link
          href="/admin/analytics"
          className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold text-lg text-secondary">분석</h3>
          <p className="text-sm text-neutral-600 mt-1">사용 통계 및 분석</p>
        </Link>

        <Link
          href="/admin/audit"
          className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold text-lg text-secondary">감사 로그</h3>
          <p className="text-sm text-neutral-600 mt-1">시스템 활동 기록</p>
        </Link>
      </div>
    </div>
  );
}
