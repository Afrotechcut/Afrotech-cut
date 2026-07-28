import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-brand-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.171c.969 0 1.371 1.24.588 1.81l-3.376 2.453a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118L10 15.347l-3.353 2.702c-.784.57-1.838-.196-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.655 9.394c-.783-.57-.38-1.81.588-1.81h4.17a1 1 0 00.951-.69L9.049 2.927z" />
                </svg>
              </div>
              <span className="font-bold text-sm text-gray-900">AFROTECHCUTS</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">The UK's booking platform for Black barbers and Afro hair.</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Platform</h4>
            <ul className="space-y-2">
              <li><Link href="/search" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Find a Barber</Link></li>
              <li><Link href="/style-match" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">AI Style Match</Link></li>
              <li><Link href="/register?role=barber" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">List Your Shop</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Account</h4>
            <ul className="space-y-2">
              <li><Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Sign In</Link></li>
              <li><Link href="/register" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Register</Link></li>
              <li><Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Barber Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">About</Link></li>
              <li><Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} AFROTECHCUTS. All rights reserved.</p>
          <p className="text-xs text-gray-400">Built for Black barbers and Afro hair.</p>
        </div>
      </div>
    </footer>
  );
}
