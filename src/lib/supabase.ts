import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Typen für unsere Daten
export interface Product {
  id: number;
  name: string;
  description: string;
  stock: number;
  min_stock: number;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface AccessCode {
  id: number;
  code: string;
  is_active: boolean;
  created_at: string;
}

export interface UserAccount {
  id: number;
  username: string;
  password_hash: string;
  access_code_id: number;
  created_at: string;
  updated_at: string;
} 