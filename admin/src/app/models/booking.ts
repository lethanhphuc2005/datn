export interface Booking {
  booking_method_id: string;
  booking_status?: { _id: string; name: string }[];
  booking_method?: { _id: string; name: string }[];
  _id?: string;
  code?: string;
  user_id: string;
  user?: {
    _id?: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    email?: string;
  }[];
  full_name?: string;
  phone_number?: string;
  note?: string;
  email?: string;
  check_in_date?: string;
  check_out_date?: string;
  adult_count?: number;
  children_count?: number;
  // booking_method?: string;
  status?: string;
  payment_status?: string;
  total_price?: number;
  created_at?: string;
  updated_at?: string;
  room_id?: {
    name?: string;
  };
}
