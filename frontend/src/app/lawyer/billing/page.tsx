import { Metadata } from 'next';
import { CreditCard } from 'lucide-react';

export const metadata: Metadata = {
  title: '청구/정산 - Legal Evidence Hub',
  description: '청구 및 정산 관리 페이지',
};

export default function BillingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border-default)] p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-[var(--color-primary-light)] rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-[var(--color-primary)]" />
        </div>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
          청구/정산
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-2">
          이 기능은 곧 제공될 예정입니다.
        </p>
        <div className="mt-4 px-3 py-2 bg-[var(--color-bg-secondary)] rounded-lg">
          <p className="text-sm text-[var(--color-text-tertiary)]">
            수임료 청구서 발행, 정산 내역, 결제 관리 기능을 제공합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
