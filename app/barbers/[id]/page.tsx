import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import StarRating from '@/components/ui/StarRating';
import Badge from '@/components/ui/Badge';
import { getServiceClient } from '@/lib/supabase';
import { buildStorageUrl, DAY_NAMES, formatPrice } from '@/lib/utils';
import type { Service, BarberAvailability, Review, PortfolioImage, Hairstyle } from '@/types';

async function getBarber(id: string) {
  const db = getServiceClient();

  const [{ data: barber }, { data: services }, { data: availability }, { data: portfolio }, { data: reviews }, { data: hairstyles }] =
    await Promise.all([
      db.from('barbers').select('*').eq('id', id).single(),
      db.from('services').select('*').eq('barber_id', id).eq('is_active', true).order('price'),
      db.from('barber_availability').select('*').eq('barber_id', id).order('day_of_week'),
      db.from('barber_portfolio').select('*').eq('barber_id', id).order('sort_order'),
      db.from('reviews').select('*').eq('barber_id', id).order('created_at', { ascending: false }).limit(20),
      db.from('barber_hairstyles')
        .select('hairstyle_id, hairstyles(id, name, slug, description, image_url, face_shapes, tags)')
        .eq('barber_id', id),
    ]);

  if (!barber) return null;

  return {
    barber,
    services: services || [],
    availability: availability || [],
    portfolio: portfolio || [],
    reviews: reviews || [],
    hairstyles: (hairstyles || []).map((h: any) => h.hairstyles).filter(Boolean),
  };
}

export default async function BarberProfilePage({ params }: { params: { id: string } }) {
  const data = await getBarber(params.id);
  if (!data) notFound();

  const { barber, services, availability, portfolio, reviews, hairstyles } = data;

  const avatarUrl = barber.avatar_url?.startsWith('http')
    ? barber.avatar_url
    : barber.avatar_url
    ? buildStorageUrl('assets', barber.avatar_url)
    : null;

  const coverUrl = barber.cover_image_url?.startsWith('http')
    ? barber.cover_image_url
    : barber.cover_image_url
    ? buildStorageUrl('assets', barber.cover_image_url)
    : 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&q=80&fit=crop';

  return (
    <>
      <Navbar />
      <main className="bg-gray-50 min-h-screen">
        {/* COVER */}
        <div className="relative h-56 sm:h-72 bg-gray-200">
          <Image src={coverUrl} alt={barber.shop_name} fill className="object-cover" priority sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white border-2 border-white overflow-hidden flex-shrink-0 shadow-lg">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={barber.shop_name} width={80} height={80} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <span className="text-white font-bold text-3xl">{barber.shop_name[0]}</span>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-white">{barber.shop_name}</h1>
                  {!barber.is_approved && <Badge variant="warning">Pending approval</Badge>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={barber.rating} />
                  <span className="text-white/80 text-sm">
                    {barber.rating > 0 ? `${Number(barber.rating).toFixed(1)} (${barber.review_count} reviews)` : 'No reviews yet'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* MAIN CONTENT */}
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              {barber.bio && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="font-semibold text-gray-900 mb-3">About</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">{barber.bio}</p>
                </div>
              )}

              {/* Services */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Cuts &amp; services</h2>
                {services.length === 0 ? (
                  <p className="text-sm text-gray-400">No services listed yet.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {services.map((svc: Service) => {
                      const imgSrc = svc.image_url
                        ? svc.image_url.startsWith('http') ? svc.image_url : buildStorageUrl('assets', svc.image_url)
                        : null;
                      return (
                        <Link
                          key={svc.id}
                          href={`/book/${barber.id}?serviceId=${svc.id}`}
                          className="group block border border-gray-200 rounded-xl overflow-hidden hover:border-gray-900 hover:shadow-card-hover transition-all"
                        >
                          <div className="relative aspect-[4/3] bg-gray-100">
                            {imgSrc ? (
                              <Image src={imgSrc} alt={svc.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 320px" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              </div>
                            )}
                          </div>
                          <div className="p-3.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-gray-900 text-sm">{svc.name}</p>
                              <span className="font-semibold text-gray-900 text-sm flex-shrink-0">{formatPrice(svc.price)}</span>
                            </div>
                            {svc.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{svc.description}</p>}
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-gray-400">{svc.duration_minutes} min</p>
                              <span className="text-xs font-semibold text-brand-600 group-hover:text-brand-700">Book this cut →</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Portfolio */}
              {portfolio.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">Portfolio</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {portfolio.map((img: PortfolioImage) => {
                      const src = img.image_url.startsWith('http') ? img.image_url : buildStorageUrl('assets', img.image_url);
                      return (
                        <div key={img.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <Image src={src} alt={img.caption || 'Portfolio'} width={200} height={200} className="object-cover w-full h-full" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Hairstyles */}
              {hairstyles.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">Specialises in</h2>
                  <div className="flex flex-wrap gap-2">
                    {hairstyles.map((h: Hairstyle) => (
                      <span key={h.id} className="px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-700">{h.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Reviews</h2>
                {reviews.length === 0 ? (
                  <p className="text-sm text-gray-400">No reviews yet. Be the first to leave one after your visit.</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((r: Review) => (
                      <div key={r.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm text-gray-900">{r.reviewer_name}</p>
                          <StarRating rating={r.rating} />
                        </div>
                        {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
                        <p className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="space-y-4">
              {/* Book CTA */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-4">
                <h3 className="font-semibold text-gray-900 mb-1">Ready to book?</h3>
                <p className="text-sm text-gray-500 mb-4">Select a service and pick a time that works.</p>
                {services.length > 0 ? (
                  <Link
                    href={`/book/${barber.id}`}
                    className="block w-full text-center py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors text-sm"
                  >
                    Book an appointment
                  </Link>
                ) : (
                  <p className="text-sm text-gray-400 text-center">No services available yet.</p>
                )}
              </div>

              {/* Location */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
                <p className="text-sm text-gray-600">{barber.address}</p>
                <p className="text-sm text-gray-600">{barber.city}</p>
                <p className="text-sm text-gray-600">{barber.postcode}</p>
                {barber.phone && <p className="text-sm text-gray-500 mt-3">{barber.phone}</p>}
              </div>

              {/* Hours */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Opening hours</h3>
                <div className="space-y-1.5">
                  {(availability as BarberAvailability[]).map((slot) => (
                    <div key={slot.day_of_week} className="flex justify-between text-sm">
                      <span className="text-gray-600">{DAY_NAMES[slot.day_of_week]}</span>
                      <span className={slot.is_open ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                        {slot.is_open ? `${slot.open_time?.slice(0, 5)} – ${slot.close_time?.slice(0, 5)}` : 'Closed'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
