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
              <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-6">The UK's platform for Afro hair specialists</p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6">
                Barbers who know<br />
                <span className="text-brand-400">Afro hair.</span>
              </h1>
              <p className="text-lg text-gray-300 mb-10 leading-relaxed max-w-lg">
                Discover barbers near you who specialise in Afro hair — fades, locs, twists, and cornrows. Browse their work, get AI-powered style suggestions, and book in seconds. No phone calls. No walk-ins.
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
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">From search to seat in minutes</h2>
              <div className="flex flex-col sm:flex-row items-stretch justify-center gap-6 sm:gap-8 max-w-3xl mx-auto">
                <div className="flex-1 text-left sm:text-center">
                  <p className="text-terracotta-500 text-xs font-semibold uppercase tracking-widest mb-2">For customers</p>
                  <p className="text-gray-600 text-lg leading-snug">No more trying a barber who isn't specialised in your type of hair.</p>
                </div>
                <div className="hidden sm:block w-px bg-gray-200" />
                <div className="flex-1 text-left sm:text-center">
                  <p className="text-brand-500 text-xs font-semibold uppercase tracking-widest mb-2">For barbers</p>
                  <p className="text-gray-600 text-lg leading-snug">No more sitting in an empty shop while your potential customers can't find you.</p>
                </div>
              </div>
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
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">Not sure what cut<br />suits your hair? Let the AI decide.</h2>
                <p className="text-gray-500 text-base leading-relaxed mb-8">
                  Take a photo with your camera or upload one. Our AI analyses your face shape and recommends 3–5 Afro-hair styles specifically suited to your features — from fades and twist-outs to locs and cornrows. Each suggestion shows an image of the style and links to barbers nearby who specialise in it.
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

        {/* CUSTOMER CTA */}
        <section className="py-24 bg-gray-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">Ready for your next cut?</h2>
            <p className="text-gray-400 text-base leading-relaxed mb-8">
              Find a barber near you who knows Afro hair, and book your haircut in seconds.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center px-7 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors text-base"
            >
              Find a barber nearby
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
