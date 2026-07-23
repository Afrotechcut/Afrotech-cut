'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') === 'barber' ? 'barber' : 'customer';
  const [role, setRole] = useState<'customer' | 'barber'>(defaultRole as 'customer' | 'barber');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName, phone, role, shop_name: shopName }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed'); return; }
      router.push(role === 'barber' ? '/dashboard/settings' : '/search');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-7 h-7 bg-gray-900 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-brand-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.171c.969 0 1.371 1.24.588 1.81l-3.376 2.453a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118L10 15.347l-3.353 2.702c-.784.57-1.838-.196-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.655 9.394c-.783-.57-.38-1.81.588-1.81h4.17a1 1 0 00.951-.69L9.049 2.927z" /></svg>
            </div>
            <span className="font-bold text-gray-900">AFROTECHCUTS</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Join AFROTECHCUTS today</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          {/* Role toggle */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
            {(['customer', 'barber'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                  role === r ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {r === 'customer' ? 'I want a haircut' : 'I am a barber'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Smith" required />
            {role === 'barber' && (
              <Input label="Shop name" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="J's Barbershop" required />
            )}
            <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            <Input label="Phone number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7700 000000" />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              hint="Minimum 8 characters"
            />
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {role === 'barber' ? 'Create barber account' : 'Create account'}
            </Button>
          </form>

          {role === 'barber' && (
            <p className="mt-4 text-xs text-gray-400 text-center">Your profile will be reviewed before going live on the platform.</p>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-gray-900 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
