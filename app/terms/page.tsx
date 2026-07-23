import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata = { title: 'Terms of Service — AFROTECHCUTS' };

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-400 mb-8">Last updated {new Date().getFullYear()}</p>

          <div className="space-y-8 text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Using the platform</h2>
              <p>
                AFROTECHCUTS connects customers with barbers for booking appointments. By creating
                an account or making a booking, you agree to provide accurate information and to
                use the platform only for its intended purpose.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Bookings and payment</h2>
              <p>
                Bookings made through AFROTECHCUTS are appointment reservations only. Payment is
                made directly with the barber at the time of your appointment — we do not process
                or hold payments on the platform. Cancellation and no-show policies are set by
                individual barbers.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Barber listings</h2>
              <p>
                Barbers are responsible for the accuracy of their shop details, services, pricing
                and availability. AFROTECHCUTS reviews new barber profiles before they go live and
                reserves the right to suspend accounts that violate these terms or provide
                misleading information.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">AI style matching</h2>
              <p>
                Our AI style matching tool provides suggestions based on an automated analysis of
                an uploaded photo. Recommendations are for inspiration only and are not a guarantee
                of the exact result a barber will deliver.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Changes to these terms</h2>
              <p>
                We may update these terms from time to time. Continued use of the platform after
                changes are posted constitutes acceptance of the updated terms.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
