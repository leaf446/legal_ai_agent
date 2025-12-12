import CaseDetailClient from '@/components/case/CaseDetailClient';

// Allow dynamic routes not listed in generateStaticParams
export const dynamicParams = true;

interface PageProps {
  params: { id: string };
}

export default function LawyerCaseDetailPage({ params }: PageProps) {
  return <CaseDetailClient id={params.id} />;
}
