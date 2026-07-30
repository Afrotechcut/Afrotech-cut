'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import { buildStorageUrl } from '@/lib/utils';
import type { StyleRecommendation } from '@/types';

type GenerationState = { status: 'loading' | 'done' | 'error'; image?: string };

// Average observed time for the whole flow: analysing the photo (a few seconds) plus
// the GPT image edit coming back (~45-50s). Not exact — used to drive a single countdown
// that starts the instant the user clicks, instead of a gap before anything appears.
const ESTIMATED_TOTAL_SECONDS = 52;

function resolveHairstyleImage(url: string) {
  return url.startsWith('http') ? url : buildStorageUrl('assets', url);
}

// Best-effort geolocation lookup — never blocks the flow if denied, unsupported, or slow.
function getLocationQuick(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    const timer = setTimeout(() => resolve(null), 4000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
      { timeout: 4000 },
    );
  });
}

export default function StyleMatchPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<StyleRecommendation[] | null>(null);
  const [generations, setGenerations] = useState<GenerationState[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cameraMode, setCameraMode] = useState(false);

  // Starts the countdown the instant the user clicks "Find my styles" — covering both
  // the photo-analysis call and the image generation that follows — so there's no gap
  // where nothing on screen is moving. Call stopTimer() once the whole flow settles.
  const startTimer = () => {
    if (timerIdRef.current) clearInterval(timerIdRef.current);
    setElapsed(0);
    timerIdRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  };
  const stopTimer = () => {
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
  };
  useEffect(() => stopTimer, []);

  // Once every card has settled (done or error), the countdown has served its purpose.
  useEffect(() => {
    if (recommendations && generations.length > 0 && generations.every((g) => g.status !== 'loading')) {
      stopTimer();
    }
  }, [generations, recommendations]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setRecommendations(null);
    setGenerations([]);
    setError('');
  };

  const openCamera = async () => {
    setCameraMode(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setError('Camera access denied. Please upload a photo instead.');
      setCameraMode(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const f = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setRecommendations(null);
      setGenerations([]);
      setCameraMode(false);
      (video.srcObject as MediaStream)?.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }, 'image/jpeg', 0.9);
  };

  const generateImage = async (photo: File, hairstyleId: string, index: number) => {
    try {
      const form = new FormData();
      form.append('image', photo);
      form.append('hairstyleId', hairstyleId);
      const res = await fetch('/api/ai/generate-style', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || !data.image) throw new Error(data.error || 'Generation failed');
      setGenerations((prev) => prev.map((g, i) => (i === index ? { status: 'done', image: data.image } : g)));
    } catch {
      setGenerations((prev) => prev.map((g, i) => (i === index ? { status: 'error' } : g)));
    }
  };

  const handleAnalyse = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setRecommendations(null);
    setGenerations([]);
    startTimer();
    try {
      const coords = await getLocationQuick();
      const form = new FormData();
      form.append('image', file);
      if (coords) {
        form.append('lat', String(coords.lat));
        form.append('lng', String(coords.lng));
      }
      const res = await fetch('/api/ai/match-style', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Analysis failed');
        stopTimer();
        return;
      }
      const recs: StyleRecommendation[] = data.recommendations;
      setRecommendations(recs);
      setGenerations(recs.map(() => ({ status: 'loading' })));
      recs.forEach((rec, i) => generateImage(file, rec.hairstyle.id, i));
    } catch {
      setError('Analysis failed. Please try again.');
      stopTimer();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-white border-b border-gray-200 py-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <p className="text-brand-500 text-sm font-semibold uppercase tracking-widest mb-3">AI Style Matching</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Find your perfect Afro cut</h1>
            <p className="text-gray-500 text-base leading-relaxed">
              Take a photo or upload one. Our AI picks the two Afro-hair styles that best suit your face, shows you wearing each one, and finds barbers nearby who specialise in Afro hair and can deliver the look.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-[minmax(0,340px)_1fr] gap-8">
            {/* UPLOAD PANEL */}
            <div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Your photo</h2>

                {cameraMode ? (
                  <div className="space-y-3">
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-black">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    </div>
                    <Button onClick={capturePhoto} className="w-full">Take photo</Button>
                    <Button variant="ghost" onClick={() => { setCameraMode(false); (videoRef.current?.srcObject as MediaStream)?.getTracks().forEach((t) => t.stop()); }} className="w-full">Cancel</Button>
                  </div>
                ) : preview ? (
                  <div className="space-y-3">
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                      <Image src={preview} alt="Your photo" fill className="object-cover" sizes="400px" />
                    </div>
                    <Button onClick={handleAnalyse} loading={loading} className="w-full" size="lg">
                      Find my styles
                    </Button>
                    <button
                      onClick={() => { setPreview(null); setFile(null); setRecommendations(null); setGenerations([]); }}
                      className="w-full text-sm text-gray-400 hover:text-gray-600"
                    >
                      Use a different photo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-gray-400 transition-colors"
                    >
                      <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <p className="text-sm font-medium text-gray-700">Upload a photo</p>
                      <p className="text-xs text-gray-400 mt-1">JPG or PNG, up to 10MB</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-400">or</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                    <Button variant="outline" onClick={openCamera} className="w-full">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Use camera
                    </Button>
                  </div>
                )}

                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

                <p className="mt-4 text-xs text-gray-400 leading-relaxed">
                  For best results, use a clear front-facing photo in good lighting. Your photo is processed by AI and not stored.
                </p>
              </div>
            </div>

            {/* RESULTS PANEL */}
            <div>
              {recommendations ? (
                <div className="grid sm:grid-cols-2 gap-5">
                  {recommendations.map((rec, i) => {
                    const gen = generations[i];
                    const referenceImg = resolveHairstyleImage(rec.hairstyle.image_url);
                    const remaining = Math.max(ESTIMATED_TOTAL_SECONDS - elapsed, 0);
                    const progressPct = Math.min((elapsed / ESTIMATED_TOTAL_SECONDS) * 100, 100);

                    return (
                      <div key={rec.hairstyle.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
                        <div className="relative aspect-square bg-gray-100">
                          {gen?.status === 'loading' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50 px-8">
                              <svg className="w-7 h-7 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                              <p className="text-xs text-gray-400 tabular-nums">
                                {remaining > 0 ? `Generating your look… ${remaining}s` : 'Almost there…'}
                              </p>
                              <div className="w-full max-w-[140px] h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-brand-500 rounded-full transition-[width] duration-1000 ease-linear"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                          )}
                          {gen?.status === 'done' && gen.image && (
                            <Image src={gen.image} alt={`You with ${rec.hairstyle.name}`} fill className="object-cover" sizes="400px" unoptimized />
                          )}
                          {gen?.status === 'error' && (
                            <>
                              <Image
                                src={referenceImg}
                                alt={rec.hairstyle.name}
                                fill
                                className="object-cover"
                                sizes="400px"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  if (img.dataset.fallback !== 'local') {
                                    img.dataset.fallback = 'local';
                                    img.src = `/hairstyles/${rec.hairstyle.slug}.jpg`;
                                  } else {
                                    img.onerror = null;
                                    img.style.display = 'none';
                                  }
                                }}
                              />
                              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[11px] text-center py-1">
                                Showing reference photo
                              </div>
                            </>
                          )}
                        </div>

                        <div className="p-4 flex-1 flex flex-col">
                          <p className="font-semibold text-sm text-gray-900">{rec.hairstyle.name}</p>
                          <p className="text-xs text-brand-600 mt-0.5">{rec.reason}</p>

                          <div className="mt-3 pt-3 border-t border-gray-100 flex-1">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 mb-2">Nearby barbers for this cut</p>
                            {rec.barbers.length === 0 ? (
                              <p className="text-xs text-gray-400">No barbers found nearby yet.</p>
                            ) : (
                              <div className="space-y-2">
                                {rec.barbers.map((barber) => (
                                  <Link
                                    key={barber.id}
                                    href={`/barbers/${barber.id}`}
                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                      {barber.avatar_url ? (
                                        <Image
                                          src={barber.avatar_url.startsWith('http') ? barber.avatar_url : buildStorageUrl('assets', barber.avatar_url)}
                                          alt={barber.shop_name}
                                          width={32}
                                          height={32}
                                          className="object-cover w-full h-full"
                                        />
                                      ) : (
                                        <span className="text-white text-xs font-bold">{barber.shop_name[0]}</span>
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-medium text-gray-900 truncate">{barber.shop_name}</p>
                                      <div className="flex items-center gap-1.5">
                                        <StarRating rating={barber.rating} />
                                        {barber.distance_metres != null && (
                                          <span className="text-[10px] text-gray-400">
                                            {barber.distance_metres < 1000 ? `${Math.round(barber.distance_metres)}m` : `${(barber.distance_metres / 1000).toFixed(1)}km`}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            )}
                            <Link
                              href={`/search?hairstyleId=${rec.hairstyle.id}`}
                              className="block mt-2 text-xs font-semibold text-gray-900 hover:underline"
                            >
                              See all barbers for this cut →
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : loading ? (
                // Shown from the instant "Find my styles" is clicked, before we even know
                // which two cuts will be recommended — so the countdown never has a gap.
                <div className="grid sm:grid-cols-2 gap-5">
                  {[0, 1].map((i) => {
                    const remaining = Math.max(ESTIMATED_TOTAL_SECONDS - elapsed, 0);
                    const progressPct = Math.min((elapsed / ESTIMATED_TOTAL_SECONDS) * 100, 100);
                    return (
                      <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
                        <div className="relative aspect-square bg-gray-50 flex flex-col items-center justify-center gap-3 px-8">
                          <svg className="w-7 h-7 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                          <p className="text-xs text-gray-400 tabular-nums">
                            {remaining > 0 ? `Analysing your photo… ${remaining}s` : 'Almost there…'}
                          </p>
                          <div className="w-full max-w-[140px] h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full transition-[width] duration-1000 ease-linear"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col gap-2">
                          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-36 bg-gray-100 rounded animate-pulse" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Your style recommendations will appear here</p>
                  <p className="text-xs text-gray-400">Upload a photo and tap Find my styles to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
