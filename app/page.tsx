import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      {/* Kente-inspired accent stripe */}
      <div className="flex h-1.5 w-full">
        <div className="flex-1 bg-terracotta-500" />
        <div className="flex-1 bg-brand-400" />
        <div className="flex-1 bg-savanna-500" />
        <div className="flex-1 bg-gray-900" />
        <div className="flex-1 bg-brand-500" />
        <div className="flex-1 bg-terracotta-600" />
      </div>
      <main>
        {/* HERO */}
        <section className="relative min-h-[88vh] flex items-center overflow-hidden bg-gray-950">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover opacity-70"
            style={{ objectPosition: '50% 35%' }}
          >
            <source src="/videos/hero-barber-cutting.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-terracotta-600/40 via-gray-950/70 to-gray-950/40" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="max-w-2xl">
              <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-6">The UK's premium barber platform</p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6">
                Find your<br />
                <span className="text-brand-400">perfect</span> barber.
              </h1>
              <p className="text-lg text-gray-300 mb-10 leading-relaxed max-w-lg">
                Discover top barbers near you, browse their work, get AI-powered style suggestions, and book in seconds. No phone calls. No walk-ins.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/search"
                  className="inline-flex items-center px-7 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors text-base"
                >
                  Find a barber nearby
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
                <Link
                  href="/style-match"
                  className="inline-flex items-center px-7 py-3.5 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors text-base"
                >
                  Try AI style match
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">From search to seat in minutes</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">No more calling ahead, no more showing up to a packed shop. Just clean, simple booking.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'Discover barbers near you',
                  desc: 'Browse a live map of barbers in your area. Filter by price, rating, style, and distance. See their work before you commit.',
                  accent: 'bg-terracotta-500',
                },
                {
                  step: '02',
                  title: 'Get matched to a style',
                  desc: 'Upload a photo and our AI analyses your face shape, then suggests hairstyles that suit you — with barbers who can deliver each look.',
                  accent: 'bg-brand-500',
                },
                {
                  step: '03',
                  title: 'Book a slot and go',
                  desc: 'Pick a time that works, enter your details, and confirm. A receipt lands in your inbox and the barber knows you\'re coming.',
                  accent: 'bg-savanna-500',
                },
              ].map(({ step, title, desc, accent }) => (
                <div key={step} className="bg-white rounded-2xl p-8 border border-gray-200">
                  <div className={`w-12 h-12 rounded-xl ${accent} text-white flex items-center justify-center text-sm font-bold mb-5`}>
                    {step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI FEATURE HIGHLIGHT */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-brand-500 text-sm font-semibold uppercase tracking-widest mb-4">AI Style Matching</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">Not sure what cut<br />suits you? Let the AI decide.</h2>
                <p className="text-gray-500 text-base leading-relaxed mb-8">
                  Take a photo with your camera or upload one. Our AI analyses your face shape — oval, round, square, heart, oblong, or diamond — and recommends 3–5 cuts specifically suited to your features. Each suggestion shows an image of the style and links to barbers nearby who specialise in it.
                </p>
                <Link
                  href="/style-match"
                  className="inline-flex items-center px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Try it free
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
              </div>
              <div className="relative h-96 rounded-2xl overflow-hidden bg-gray-100">
                <Image
                  src="https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&q=80&fit=crop"
                  alt="Barber styling hair"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </section>

        {/* FOR BARBERS CTA */}
        <section className="py-24 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="relative h-80 rounded-2xl overflow-hidden bg-gray-800">
                <Image
                  src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80&fit=crop"
                  alt="Modern barbershop interior"
                  fill
                  className="object-cover opacity-80"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div>
                <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-4">For Barbers</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-tight">Your shop, on the map.<br />Your business, under control.</h2>
                <p className="text-gray-400 text-base leading-relaxed mb-8">
                  Get discovered by customers actively looking for a barber in your area. Manage bookings, track repeat clients, showcase your work, and understand how your shop is performing — all in one dashboard.
                </p>
                <Link
                  href="/register?role=barber"
                  className="inline-flex items-center px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors"
                >
                  List your barbershop — it's free
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
