export type UserRole = 'customer' | 'barber' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
}

export interface Barber {
  id: string;
  user_id: string;
  shop_name: string;
  bio?: string;
  address: string;
  city: string;
  postcode: string;
  location: { lat: number; lng: number };
  phone?: string;
  website?: string;
  avatar_url?: string;
  cover_image_url?: string;
  is_approved: boolean;
  is_active: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  // joined fields
  distance_metres?: number;
  services?: Service[];
  hairstyles?: Hairstyle[];
  portfolio?: PortfolioImage[];
}

export interface Service {
  id: string;
  barber_id: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  image_url?: string;
  is_active: boolean;
}

export interface Hairstyle {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  face_shapes: string[];
  tags: string[];
  is_active: boolean;
}

export interface Booking {
  id: string;
  barber_id: string;
  service_id: string;
  user_id?: string;
  guest_name?: string;
  guest_email: string;
  guest_phone?: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  total_price: number;
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  created_at: string;
  // joined
  barber?: Pick<Barber, 'id' | 'shop_name' | 'address' | 'avatar_url'>;
  service?: Pick<Service, 'id' | 'name' | 'price' | 'duration_minutes'>;
}

export interface Review {
  id: string;
  barber_id: string;
  booking_id: string;
  reviewer_name: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface PortfolioImage {
  id: string;
  barber_id: string;
  image_url: string;
  caption?: string;
  hairstyle_id?: string;
  sort_order: number;
}

export interface BarberAvailability {
  id: string;
  barber_id: string;
  day_of_week: number;
  is_open: boolean;
  open_time?: string;
  close_time?: string;
}

export interface TimeSlot {
  time: string;   // "HH:MM"
  available: boolean;
}

export interface AuthPayload {
  sub: string;
  email: string;
  role: UserRole;
  barberId?: string;
  exp: number;
}

export interface SearchFilters {
  lat: number;
  lng: number;
  radius: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  hairstyleId?: string;
}
