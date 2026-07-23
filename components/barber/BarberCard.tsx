import Link from 'next/link';
import Image from 'next/image';
import StarRating from '@/components/ui/StarRating';
import Badge from '@/components/ui/Badge';
import type { Barber } from '@/types';
import { buildStorageUrl } from '@/lib/utils';

interface BarberCardProps {
  barber: Barber & { min_price?: number };
  highlight?: boolean;
}

export default function BarberCard({ barber, highlight }: BarberCardProps) {
  const avatarUrl = barber.avatar_url?.startsWith('http')
    ? barber.avatar_url
    : barber.avatar_url
    ? buildStorageUrl('assets', barber.avatar_url)
    : null;

  const distanceLabel = barber.distance_metres != null
    ? barber.distance_metres < 1000
      ? `${Math.round(barber.distance_metres)}m away`
      : `${(barber.distance_metres / 1000).toFixed(1)}km away`
    : null;

  return (
    <Link href={`/barbers/${barber.id}`}>
      <div className={`bg-white rounded-xl border transition-all duration-150 overflow-hidden hover:shadow-card-hover ${highlight ? 'border-gray-900 shadow-card-hover' : 'border-gray-200 shadow-card'}`}>
        {/* Cover / Avatar */}
        <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={barber.shop_name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 320px" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">{barber.shop_name[0]}</span>
            </div>
          )}
          {distanceLabel && (
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 px-2 py-1 rounded-full border border-gray-200">
              {distanceLabel}
            </div>
          )}
        </div>

        <div className="p-3">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1">{barber.shop_name}</h3>
            {barber.min_price != null && (
              <span className="text-xs text-gray-500 flex-shrink-0">from £{barber.min_price}</span>
            )}
          </div>

          <p className="text-xs text-gray-500 mb-2 line-clamp-1">{barber.city}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <StarRating rating={barber.rating} />
              <span className="text-xs text-gray-500">
                {barber.rating > 0 ? `${barber.rating.toFixed(1)} (${barber.review_count})` : 'No reviews yet'}
              </span>
            </div>
            {!barber.is_approved && <Badge variant="warning">Pending</Badge>}
          </div>
        </div>
      </div>
    </Link>
  );
}
