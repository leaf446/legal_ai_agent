import Link from 'next/link';
import CaseDetailClient from '@/components/case/CaseDetailClient';

interface PageProps {
  searchParams?: {
    caseId?: string;
    returnUrl?: string;
    [key: string]: string | string[] | undefined;
  };
}

export default function LawyerCaseDetailByQuery({ searchParams }: PageProps) {
  const caseId = typeof searchParams?.caseId === 'string' ? searchParams.caseId : undefined;

  if (!caseId) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-4">
        <p className="text-lg text-[var(--color-text-secondary)]">
          조회할 사건 ID가 전달되지 않았습니다.
        </p>
        <Link
          href="/lawyer/cases"
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          케이스 목록으로 가기
        </Link>
      </div>
    );
  }

  return (
    <CaseDetailClient
      id={caseId}
      apiBasePath="/lawyer"
      defaultReturnUrl={typeof searchParams?.returnUrl === 'string' ? searchParams.returnUrl : '/lawyer/cases'}
    />
  );
}
