import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata = { title: 'Privacy Policy — AFROTECHCUTS' };

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mb-8">Last updated {new Date().getFullYear()}</p>

          <div className="space-y-8 text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">What we collect</h2>
              <p>
                When you create an account, book an appointment, or use our AI style matching tool,
                we collect the information you provide directly: your name, email address, phone
                number, and, for barbers, shop details. When you book as a guest, we collect the
                contact details needed to confirm your appointment.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Photos used for AI style matching</h2>
              <p>
                Photos you upload for AI face-shape analysis are sent to our AI provider for
                processing and are not stored on our servers afterwards. They are used solely to
                generate your style recommendations.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">How we use your information</h2>
              <p>
                We use your information to create and manage your account, process bookings, send
                confirmation emails, and — for barbers — to power the dashboard analytics that show
                how your shop is performing. We do not sell your personal data to third parties.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Data storage</h2>
              <p>
                Account and booking data is stored securely with our database provider. Passwords
                are never stored in plain text — they are hashed before being saved.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Your rights</h2>
              <p>
                You can request a copy of the data we hold about you, ask us to correct it, or
                request that your account and associated data be deleted, by contacting us through
                the details on your account settings page.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
