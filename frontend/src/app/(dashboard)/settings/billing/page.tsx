'use client';

/**
 * Billing Settings Page - App Router Version
 */

import { useState, useEffect } from 'react';
import { CreditCard, Package, CheckCircle, AlertCircle, ArrowRight, Shield, Clock, Users } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  recommended?: boolean;
  cta: string;
}

interface BillingHistory {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
}

interface CurrentSubscription {
  plan: string;
  status: 'active' | 'canceled' | 'past_due';
  nextBillingDate: string;
  amount: number;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49000,
    period: '월',
    description: '개인 변호사 및 소규모 사무실을 위한 기본 플랜',
    features: [
      '월 10건 사건 관리',
      '기본 AI 분석',
      '이메일 지원',
      '기본 보고서',
    ],
    cta: '시작하기',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 99000,
    period: '월',
    description: '성장하는 로펌을 위한 전문가 플랜',
    features: [
      '무제한 사건 관리',
      '고급 AI 분석',
      '우선 지원',
      '상세 보고서',
      '팀 협업 기능',
      'API 접근',
    ],
    recommended: true,
    cta: '업그레이드',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199000,
    period: '월',
    description: '대형 로펌을 위한 맞춤형 솔루션',
    features: [
      'Professional 모든 기능',
      '전담 계정 관리자',
      '맞춤형 AI 모델',
      'SLA 보장',
      '온프레미스 배포 옵션',
      '무제한 사용자',
    ],
    cta: '문의하기',
  },
];

const BILLING_HISTORY: BillingHistory[] = [
  {
    id: '1',
    date: '2024-11-01',
    description: 'Professional 플랜 - 11월',
    amount: 99000,
    status: 'paid',
  },
  {
    id: '2',
    date: '2024-10-01',
    description: 'Professional 플랜 - 10월',
    amount: 99000,
    status: 'paid',
  },
  {
    id: '3',
    date: '2024-09-01',
    description: 'Starter 플랜 - 9월',
    amount: 49000,
    status: 'paid',
  },
];

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<CurrentSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setCurrentPlan({
        plan: 'Professional',
        status: 'active',
        nextBillingDate: '2024-12-01',
        amount: 99000,
      });
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            활성
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            결제 완료
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            대기 중
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            실패
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Settings</p>
          <h1 className="text-2xl font-bold text-secondary">구독 및 결제</h1>
          <p className="text-sm text-neutral-600 mt-1">구독 플랜 관리 및 결제 내역을 확인하세요.</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Current Subscription */}
        {currentPlan && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">현재 구독</h2>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900">{currentPlan.plan} 플랜</h3>
                    {getStatusBadge(currentPlan.status)}
                  </div>
                  <p className="text-sm text-neutral-600">
                    다음 결제일: {new Date(currentPlan.nextBillingDate).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {currentPlan.amount.toLocaleString()}원
                  <span className="text-sm font-normal text-neutral-600">/월</span>
                </p>
                <button className="mt-2 text-sm text-accent hover:underline">
                  구독 관리
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Pricing Plans */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">플랜 비교</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl shadow-sm border p-6 ${
                  plan.recommended ? 'border-accent ring-2 ring-accent/20' : 'border-gray-100'
                }`}
              >
                {plan.recommended && (
                  <span className="inline-block px-3 py-1 text-xs font-medium text-accent bg-accent/10 rounded-full mb-4">
                    추천
                  </span>
                )}
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-neutral-600 mt-1">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-900">
                    {plan.price.toLocaleString()}원
                  </span>
                  <span className="text-neutral-600">/{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-neutral-700">
                      <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full mt-6 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    plan.recommended
                      ? 'bg-accent text-white hover:bg-accent-dark'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">모든 플랜에 포함</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">보안</h3>
                <p className="text-sm text-neutral-600">엔터프라이즈급 보안으로 데이터 보호</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">24/7 지원</h3>
                <p className="text-sm text-neutral-600">언제든지 도움을 받을 수 있습니다</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">팀 협업</h3>
                <p className="text-sm text-neutral-600">팀원들과 효율적으로 협업</p>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Method */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">결제 수단</h2>
            <button className="text-sm text-accent hover:underline">수정</button>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <CreditCard className="w-8 h-8 text-neutral-600" />
            <div>
              <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
              <p className="text-sm text-neutral-600">만료: 12/25</p>
            </div>
          </div>
        </section>

        {/* Billing History */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">결제 내역</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    날짜
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    설명
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    금액
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {BILLING_HISTORY.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-neutral-700">
                      {new Date(item.date).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">
                      {item.amount.toLocaleString()}원
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
