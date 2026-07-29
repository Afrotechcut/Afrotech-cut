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
              <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-6">The UK's growth platform for Afro hair barbers</p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6">
                Fill your chair with<br />
                <span className="text-brand-400">clients who want you.</span>
              </h1>
              <p className="text-lg text-gray-300 mb-10 leading-relaxed max-w-lg">
                List your shop, showcase your work, and let AI match new clients to the exact Afro hair cuts you specialise in — fades, locs, twists, and cornrows. No more empty chairs between walk-ins.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register?role=barber"
                  className="inline-flex items-center px-7 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors text-base"
                >
                  For barbers — sign up free
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
                <Link
                  href="/search"
                  className="inline-flex items-center px-7 py-3.5 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors text-base"
                >
                  Find a barber nearby
                </Link>
                <Link
                  href="/style-match"
                  className="inline-flex items-center px-7 py-3.5 border border-white/10 text-white/80 font-semibold rounded-xl hover:bg-white/10 hover:text-white transition-colors text-base"
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
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">From sign-up to fully booked</h2>
              <div className="flex flex-col sm:flex-row items-stretch justify-center gap-6 sm:gap-8 max-w-3xl mx-auto">
                <div className="flex-1 text-left sm:text-center">
                  <p className="text-brand-500 text-xs font-semibold uppercase tracking-widest mb-2">For barbers</p>
                  <p className="text-gray-600 text-lg leading-snug">No more sitting in an empty shop while clients who want exactly what you offer can't find you.</p>
                </div>
                <div className="hidden sm:block w-px bg-gray-200" />
                <div className="flex-1 text-left sm:text-center">
                  <p className="text-terracotta-500 text-xs font-semibold uppercase tracking-widest mb-2">For clients</p>
                  <p className="text-gray-600 text-lg leading-snug">No more guessing which barber actually knows how to work with your hair type.</p>
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: '01',
                  title: 'List your shop',
                  desc: 'Create your profile in minutes — add your services, prices, and photos of your best work.',
                  accent: 'bg-terracotta-500',
                },
                {
                  step: '02',
                  title: 'Get discovered',
                  desc: 'Clients searching for barbers who specialise in Afro hair find you by location, style, and rating.',
                  accent: 'bg-brand-500',
                },
                {
                  step: '03',
                  title: 'AI sends you matched clients',
                  desc: 'Our AI matches each client\'s face shape to styles you offer, then routes them straight to your profile.',
                  accent: 'bg-savanna-500',
                },
                {
                  step: '04',
                  title: 'Fill your calendar',
                  desc: 'Clients book online and pay you directly. No missed calls, no back-and-forth, no empty chairs.',
                  accent: 'bg-gray-900',
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
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">Turn browsers into<br />booked clients.</h2>
                <p className="text-gray-500 text-base leading-relaxed mb-8">
                  When a client uploads a photo, our AI analyses their face shape and matches them to Afro-hair styles — fades, twist-outs, locs, and cornrows — then shows them barbers nearby who specialise in each look. It's a built-in stream of qualified clients who already know what they want, and know you can deliver it.
                </p>
                <Link
                  href="/style-match"
                  className="inline-flex items-center px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
                >
                  See the AI in action
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
              </div>
              <div className="relative h-96 rounded-2xl overflow-hidden bg-gray-100">
                <Image
                  src="/images/ai-style-match.jpg"
                  alt="Barber lining up a client's fade with a straight razor"
                  fill
                  className="object-cover"
                  style={{ objectPosition: '50% 47%' }}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </section>

        {/* BARBER CTA */}
        <section className="py-24 bg-gray-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">Ready to grow your shop?</h2>
            <p className="text-gray-400 text-base leading-relaxed mb-8">
              List your business free and start getting discovered by clients looking for Afro hair specialists near them.
            </p>
            <Link
              href="/register?role=barber"
              className="inline-flex items-center px-7 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors text-base"
            >
              List your shop free
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <p className="mt-5 text-sm text-gray-500">
              Looking for a cut instead?{' '}
              <Link href="/search" className="text-gray-300 hover:text-white underline underline-offset-2">Find a barber nearby</Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
