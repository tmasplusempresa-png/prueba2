// ==================== TIPOS BASE DE SUPABASE ====================
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ==================== INTERFAZ PRINCIPAL DE BASE DE DATOS T+PLUS ====================
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          auth_id: string | null
          email: string
          first_name: string
          last_name: string
          mobile: string | null
          user_type: string
          wallet_balance: number
          location: Json | null
          profile_image: string | null
          rating: number
          total_rides: number
          is_verified: boolean
          approved: boolean
          blocked: boolean
          referral_id: string | null
          city: string | null
          driver_active_status: boolean
          license_number: string | null
          license_image: string | null
          license_image_back: string | null
          soat_image: string | null
          card_prop_image: string | null
          card_prop_image_bk: string | null
          verify_id_image: string | null
          verify_id_image_bk: string | null
          push_token: string | null
          user_platform: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_id?: string | null
          email: string
          first_name: string
          last_name: string
          mobile?: string | null
          user_type?: string
          wallet_balance?: number
          location?: Json | null
          profile_image?: string | null
          rating?: number
          total_rides?: number
          is_verified?: boolean
          approved?: boolean
          blocked?: boolean
          referral_id?: string | null
          city?: string | null
          driver_active_status?: boolean
          license_number?: string | null
          license_image?: string | null
          license_image_back?: string | null
          soat_image?: string | null
          card_prop_image?: string | null
          card_prop_image_bk?: string | null
          verify_id_image?: string | null
          verify_id_image_bk?: string | null
          push_token?: string | null
          user_platform?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_id?: string | null
          email?: string
          first_name?: string
          last_name?: string
          mobile?: string | null
          user_type?: string
          wallet_balance?: number
          location?: Json | null
          profile_image?: string | null
          rating?: number
          total_rides?: number
          is_verified?: boolean
          approved?: boolean
          blocked?: boolean
          referral_id?: string | null
          city?: string | null
          driver_active_status?: boolean
          license_number?: string | null
          license_image?: string | null
          license_image_back?: string | null
          soat_image?: string | null
          card_prop_image?: string | null
          card_prop_image_bk?: string | null
          verify_id_image?: string | null
          verify_id_image_bk?: string | null
          push_token?: string | null
          user_platform?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cars: {
        Row: {
          id: string
          driver_id: string | null
          make: string
          model: string
          year: number | null
          color: string | null
          plate: string
          car_image: string | null
          vehicle_number: string | null
          vehicle_model: string | null
          vehicle_make: string | null
          vehicle_color: string | null
          fuel_type: string
          transmission: string
          capacity: number
          is_active: boolean
          features: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          driver_id?: string | null
          make: string
          model: string
          year?: number | null
          color?: string | null
          plate: string
          car_image?: string | null
          vehicle_number?: string | null
          vehicle_model?: string | null
          vehicle_make?: string | null
          vehicle_color?: string | null
          fuel_type?: string
          transmission?: string
          capacity?: number
          is_active?: boolean
          features?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          driver_id?: string | null
          make?: string
          model?: string
          year?: number | null
          color?: string | null
          plate?: string
          car_image?: string | null
          vehicle_number?: string | null
          vehicle_model?: string | null
          vehicle_make?: string | null
          vehicle_color?: string | null
          fuel_type?: string
          transmission?: string
          capacity?: number
          is_active?: boolean
          features?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      car_types: {
        Row: {
          id: string
          name: string
          description: string | null
          base_price: number
          price_per_km: number
          image: string | null
          capacity: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          base_price: number
          price_per_km: number
          image?: string | null
          capacity?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          base_price?: number
          price_per_km?: number
          image?: string | null
          capacity?: number
          is_active?: boolean
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          customer_id: string | null
          driver_id: string | null
          car_type_id: string | null
          car_id: string | null
          status: string
          pickup_location: Json
          destination_location: Json
          drop_location: Json | null
          distance: number | null
          duration: number | null
          price: number
          total_trip_time: number | null
          trip_start_time: string | null
          trip_end_time: string | null
          driver_arrived_time: string | null
          start_time: number | null
          end_time: number | null
          driver_status: string | null
          customer_status: string | null
          driver_name: string | null
          driver_image: string | null
          driver_contact: string | null
          driver_rating: number | null
          car_image: string | null
          vehicle_number: string | null
          vehicle_model: string | null
          vehicle_make: string | null
          vehicle_color: string | null
          customer_token: string | null
          driver_token: string | null
          payment_mode: string
          prepaid: boolean
          rating: number | null
          review: string | null
          reason: string | null
          cancelled_by: string | null
          cancellation_time: string | null
          cancelled_at: number | null
          incident: Json | null
          customer_city: string | null
          driver_city: string | null
          reference: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          driver_id?: string | null
          car_type_id?: string | null
          car_id?: string | null
          status?: string
          pickup_location: Json
          destination_location: Json
          drop_location?: Json | null
          distance?: number | null
          duration?: number | null
          price: number
          total_trip_time?: number | null
          trip_start_time?: string | null
          trip_end_time?: string | null
          driver_arrived_time?: string | null
          start_time?: number | null
          end_time?: number | null
          driver_status?: string | null
          customer_status?: string | null
          driver_name?: string | null
          driver_image?: string | null
          driver_contact?: string | null
          driver_rating?: number | null
          car_image?: string | null
          vehicle_number?: string | null
          vehicle_model?: string | null
          vehicle_make?: string | null
          vehicle_color?: string | null
          customer_token?: string | null
          driver_token?: string | null
          payment_mode?: string
          prepaid?: boolean
          rating?: number | null
          review?: string | null
          reason?: string | null
          cancelled_by?: string | null
          cancellation_time?: string | null
          cancelled_at?: number | null
          incident?: Json | null
          customer_city?: string | null
          driver_city?: string | null
          reference?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          driver_id?: string | null
          car_type_id?: string | null
          car_id?: string | null
          status?: string
          pickup_location?: Json
          destination_location?: Json
          drop_location?: Json | null
          distance?: number | null
          duration?: number | null
          price?: number
          total_trip_time?: number | null
          trip_start_time?: string | null
          trip_end_time?: string | null
          driver_arrived_time?: string | null
          start_time?: number | null
          end_time?: number | null
          driver_status?: string | null
          customer_status?: string | null
          driver_name?: string | null
          driver_image?: string | null
          driver_contact?: string | null
          driver_rating?: number | null
          car_image?: string | null
          vehicle_number?: string | null
          vehicle_model?: string | null
          vehicle_make?: string | null
          vehicle_color?: string | null
          customer_token?: string | null
          driver_token?: string | null
          payment_mode?: string
          prepaid?: boolean
          rating?: number | null
          review?: string | null
          reason?: string | null
          cancelled_by?: string | null
          cancellation_time?: string | null
          cancelled_at?: number | null
          incident?: Json | null
          customer_city?: string | null
          driver_city?: string | null
          reference?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tracking: {
        Row: {
          id: string
          booking_id: string | null
          status: string
          latitude: number
          longitude: number
          timestamp_ms: number
          created_at: string
        }
        Insert: {
          id?: string
          booking_id?: string | null
          status: string
          latitude: number
          longitude: number
          timestamp_ms: number
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string | null
          status?: string
          latitude?: number
          longitude?: number
          timestamp_ms?: number
          created_at?: string
        }
      }
      wallet_history: {
        Row: {
          id: string
          user_id: string | null
          type: string
          amount: number
          balance: number
          description: string
          booking_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          type: string
          amount: number
          balance: number
          description: string
          booking_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          type?: string
          amount?: number
          balance?: number
          description?: string
          booking_id?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          title: string
          message: string
          type: string
          is_read: boolean
          data: Json | null
          booking_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          message: string
          type?: string
          is_read?: boolean
          data?: Json | null
          booking_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          message?: string
          type?: string
          is_read?: boolean
          data?: Json | null
          booking_id?: string | null
          created_at?: string
        }
      }
      user_ratings: {
        Row: {
          id: string
          user_id: string | null
          rated_by: string | null
          booking_id: string | null
          rate: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          rated_by?: string | null
          booking_id?: string | null
          rate: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          rated_by?: string | null
          booking_id?: string | null
          rate?: number
          comment?: string | null
          created_at?: string
        }
      }
      saved_addresses: {
        Row: {
          id: string
          user_id: string | null
          name: string | null
          address: string
          latitude: number
          longitude: number
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name?: string | null
          address: string
          latitude: number
          longitude: number
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string | null
          address?: string
          latitude?: number
          longitude?: number
          is_default?: boolean
          created_at?: string
        }
      }
      promos: {
        Row: {
          id: string
          title: string
          description: string | null
          discount_type: string | null
          discount_value: number | null
          min_amount: number | null
          max_discount: number | null
          start_date: string | null
          end_date: string | null
          is_active: boolean
          usage_limit: number | null
          used_count: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          min_amount?: number | null
          max_discount?: number | null
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          usage_limit?: number | null
          used_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          min_amount?: number | null
          max_discount?: number | null
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          usage_limit?: number | null
          used_count?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ==================== TIPOS HELPER PARA FACILIDAD DE USO ====================
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type TablesRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

// ==================== TIPOS ESPECIFICOS DE T+PLUS ====================
export type UserRow = TablesRow<'users'>
export type UserInsert = TablesInsert<'users'>
export type UserUpdate = TablesUpdate<'users'>

export type CarRow = TablesRow<'cars'>
export type CarInsert = TablesInsert<'cars'>
export type CarUpdate = TablesUpdate<'cars'>

export type CarTypeRow = TablesRow<'car_types'>
export type CarTypeInsert = TablesInsert<'car_types'>
export type CarTypeUpdate = TablesUpdate<'car_types'>

export type BookingRow = TablesRow<'bookings'>
export type BookingInsert = TablesInsert<'bookings'>
export type BookingUpdate = TablesUpdate<'bookings'>

export type TrackingRow = TablesRow<'tracking'>
export type TrackingInsert = TablesInsert<'tracking'>
export type TrackingUpdate = TablesUpdate<'tracking'>

export type WalletHistoryRow = TablesRow<'wallet_history'>
export type WalletHistoryInsert = TablesInsert<'wallet_history'>
export type WalletHistoryUpdate = TablesUpdate<'wallet_history'>

export type NotificationRow = TablesRow<'notifications'>
export type NotificationInsert = TablesInsert<'notifications'>
export type NotificationUpdate = TablesUpdate<'notifications'>

export type UserRatingRow = TablesRow<'user_ratings'>
export type UserRatingInsert = TablesInsert<'user_ratings'>
export type UserRatingUpdate = TablesUpdate<'user_ratings'>

export type SavedAddressRow = TablesRow<'saved_addresses'>
export type SavedAddressInsert = TablesInsert<'saved_addresses'>
export type SavedAddressUpdate = TablesUpdate<'saved_addresses'>

export type PromoRow = TablesRow<'promos'>
export type PromoInsert = TablesInsert<'promos'>
export type PromoUpdate = TablesUpdate<'promos'>

// ==================== TIPOS PERSONALIZADOS PARA T+PLUS ====================
export interface LocationData {
  lat: number
  lng: number
  address?: string
  time?: string
}

export interface UserLocation {
  lat: number
  lng: number
}

export interface CarFeatures {
  features: string[]
}

export type UserType = 'customer' | 'driver' | 'company'
export type BookingStatus = 'NEW' | 'ACCEPTED' | 'STARTED' | 'REACHED' | 'PAID' | 'COMPLETE' | 'CANCELLED'
export type PaymentMode = 'cash' | 'wallet' | 'card'
export type WalletTransactionType = 'credit' | 'debit'
export type UserPlatform = 'IOS' | 'ANDROID'
export type FuelType = 'gasolina' | 'diesel' | 'electrico' | 'hibrido'
export type TransmissionType = 'manual' | 'automatico'
export type DiscountType = 'percentage' | 'fixed'