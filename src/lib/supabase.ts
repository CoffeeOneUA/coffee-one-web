import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Brand = { id: string; name: string; slug: string; logo_url: string | null };
export type Category = { id: string; name: string; slug: string; emoji: string };
export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  rating: number | null;
  reviews_count: number | null;
};

export type Listing = {
  id: string;
  user_id: string;
  title: string;
  brand_id: string;
  category_id: string;
  price_usd: number;
  price_uah: number;
  condition: 'new' | 'used';
  groups: number | null;
  year: number | null;
  city: string;
  description: string;
  photos: string[];
  is_top: boolean;
  is_verified: boolean;
  status: string;
  sold_reason: 'marketplace' | 'other' | null;
  views: number;
  created_at: string;
  brands?: Brand;
  categories?: Category;
  profiles?: Profile;
};

export type Conversation = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message: string | null;
  last_message_at: string | null;
  buyer_unread: number;
  seller_unread: number;
  created_at: string;
  listings?: { id: string; title: string; photos: string[]; price_uah: number };
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: 'text' | 'offer' | 'system';
  body: string | null;
  offer_amount_uah: number | null;
  offer_status: 'pending' | 'accepted' | 'declined' | null;
  created_at: string;
};
