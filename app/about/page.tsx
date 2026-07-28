import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata = { title: 'About — AFROTECHCUTS' };

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">About AFROTECHCUTS</h1>
          <div className="space-y-5 text-gray-600 leading-relaxed">
            <p>
              AFROTECHCUTS is a booking platform built specifically for barbers who specialise in
              Afro hair and the community they serve. We started with a simple observation: finding
              a barber who actually understands your hair — whether that's a sharp fade, freeform
              locs, a twist-out, or cornrows — shouldn't mean relying on word of mouth, phone calls,
              or walking in and hoping for the best.
            </p>
            <p>
              Our platform lets customers discover barbers nearby who specialise in Afro hair,
              browse real photos of their work, get AI-powered suggestions for cuts and styles that
              suit their face shape, and book a slot in seconds — no calls, no waiting.
            </p>
            <p>
              For barbers, AFROTECHCUTS is a way to get discovered by customers actively searching
              for someone who can do their hair right, showcase a visual portfolio of your work, and
              manage bookings, schedules and customer relationships from one dashboard.
            </p>
            <p>
              We're a small team building for barbers who specialise in Afro hair and the community
              they serve, and we're just getting started.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
