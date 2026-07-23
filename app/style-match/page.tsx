'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import { buildStorageUrl } from '@/lib/utils';
import type { Hairstyle } from '@/types';

interface MatchResult {
  face_shape: string;
  confidence: number;
  hairstyles: Hairstyle[];
}

export default function StyleMatchPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraMode, setCameraMode] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
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
      setCameraMode(false);
      // Stop camera
      (video.srcObject as MediaStream)?.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }, 'image/jpeg', 0.9);
  };

  const handleAnalyse = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/ai/match-style', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Analysis failed'); return; }
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  const FACE_SHAPE_LABELS: Record<string, string> = {
    oval: 'Oval', round: 'Round', square: 'Square', heart: 'Heart', oblong: 'Oblong', diamond: 'Diamond',
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-white border-b border-gray-200 py-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <p className="text-brand-500 text-sm font-semibold uppercase tracking-widest mb-3">AI Style Matching</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Find your perfect cut</h1>
            <p className="text-gray-500 text-base leading-relaxed">
              Take a photo or upload one. Our AI analyses your face shape and suggests 3–5 hairstyles that complement your features — with barbers nearby who can deliver each look.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-8">
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
                      Analyse my face shape
                    </Button>
                    <button
                      onClick={() => { setPreview(null); setFile(null); setResult(null); }}
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
              {result ? (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Face shape detected</p>
                    <p className="text-2xl font-bold text-gray-900">{FACE_SHAPE_LABELS[result.face_shape] || result.face_shape}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {result.confidence >= 0.8 ? 'High confidence' : result.confidence >= 0.5 ? 'Moderate confidence' : 'Low confidence'} — {Math.round(result.confidence * 100)}%
                    </p>
                  </div>

                  <h3 className="font-semibold text-gray-900">Recommended styles for you</h3>

                  {(result.hairstyles || []).length === 0 && (
                    <p className="text-sm text-gray-400">No specific style matches yet — browse all barbers to see their full range.</p>
                  )}

                  {(result.hairstyles || []).map((style) => {
                    const imgSrc = style.image_url.startsWith('http')
                      ? style.image_url
                      : buildStorageUrl('assets', style.image_url);

                    return (
                      <div key={style.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex gap-4 p-4">
                        <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          <Image src={imgSrc} alt={style.name} width={80} height={80} className="object-cover w-full h-full" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&q=60&fit=crop'; }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900">{style.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{style.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {style.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-medium text-gray-600">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <Link
                    href={`/search`}
                    className="block w-full text-center py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors text-sm"
                  >
                    Find barbers near you
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Your style recommendations will appear here</p>
                  <p className="text-xs text-gray-400">Upload a photo and tap Analyse to get started.</p>
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
