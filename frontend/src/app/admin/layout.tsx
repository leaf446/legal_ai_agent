import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/admin/dashboard" className="font-bold text-lg text-secondary">
            Admin Portal
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/admin/users" className="text-sm text-neutral-600 hover:text-secondary">
              사용자
            </Link>
            <Link href="/admin/roles" className="text-sm text-neutral-600 hover:text-secondary">
              역할
            </Link>
            <Link href="/admin/analytics" className="text-sm text-neutral-600 hover:text-secondary">
              분석
            </Link>
            <Link href="/admin/audit" className="text-sm text-neutral-600 hover:text-secondary">
              감사로그
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-6">{children}</main>
    </div>
  );
}
