export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          code: string
          name: string
          barcode: string | null
          category_id: string | null
          unit: string
          price_mode: 'auto' | 'fixed'
          base_cost: number
          base_price: number
          last_cost: number
          sell_price: number
          avg_cost: number
          stock: number
          min_stock: number
          expiry_date: string | null
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          barcode?: string | null
          category_id?: string | null
          unit?: string
          price_mode?: 'auto' | 'fixed'
          base_cost?: number
          base_price?: number
          last_cost?: number
          sell_price?: number
          avg_cost?: number
          stock?: number
          min_stock?: number
          expiry_date?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          barcode?: string | null
          category_id?: string | null
          unit?: string
          price_mode?: 'auto' | 'fixed'
          base_cost?: number
          base_price?: number
          last_cost?: number
          sell_price?: number
          avg_cost?: number
          stock?: number
          min_stock?: number
          expiry_date?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      suppliers: {
        Row: {
          id: string
          name: string
          phone: string | null
          address: string | null
          note: string | null
          debt: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          address?: string | null
          note?: string | null
          debt?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          address?: string | null
          note?: string | null
          debt?: number
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          phone: string | null
          address: string | null
          note: string | null
          debt: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          address?: string | null
          note?: string | null
          debt?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          address?: string | null
          note?: string | null
          debt?: number
          created_at?: string
          updated_at?: string
        }
      }
      purchases: {
        Row: {
          id: string
          code: string
          supplier_id: string | null
          total_amount: number
          paid_amount: number
          debt_amount: number
          status: 'completed' | 'cancelled'
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          supplier_id?: string | null
          total_amount?: number
          paid_amount?: number
          debt_amount?: number
          status?: 'completed' | 'cancelled'
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          supplier_id?: string | null
          total_amount?: number
          paid_amount?: number
          debt_amount?: number
          status?: 'completed' | 'cancelled'
          note?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      purchase_items: {
        Row: {
          id: string
          purchase_id: string
          product_id: string | null
          product_name: string
          unit: string
          quantity: number
          cost_price: number
          subtotal: number
          expiry_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          purchase_id: string
          product_id?: string | null
          product_name: string
          unit: string
          quantity: number
          cost_price: number
          subtotal: number
          expiry_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          purchase_id?: string
          product_id?: string | null
          product_name?: string
          unit?: string
          quantity?: number
          cost_price?: number
          subtotal?: number
          expiry_date?: string | null
          created_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          code: string
          customer_id: string | null
          total_amount: number
          discount_amount: number
          final_amount: number
          customer_paid: number
          change_amount: number
          debt_amount: number
          payment_method: 'cash' | 'transfer' | 'debt'
          status: 'completed' | 'cancelled'
          cancel_reason: string | null
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          customer_id?: string | null
          total_amount: number
          discount_amount?: number
          final_amount: number
          customer_paid?: number
          change_amount?: number
          debt_amount?: number
          payment_method: 'cash' | 'transfer' | 'debt'
          status?: 'completed' | 'cancelled'
          cancel_reason?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          customer_id?: string | null
          total_amount?: number
          discount_amount?: number
          final_amount?: number
          customer_paid?: number
          change_amount?: number
          debt_amount?: number
          payment_method?: 'cash' | 'transfer' | 'debt'
          status?: 'completed' | 'cancelled'
          cancel_reason?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          product_id: string | null
          product_code: string
          product_name: string
          unit: string
          quantity: number
          sell_price: number
          cost_price: number
          subtotal: number
          created_at: string
        }
        Insert: {
          id?: string
          sale_id: string
          product_id?: string | null
          product_code: string
          product_name: string
          unit: string
          quantity: number
          sell_price: number
          cost_price?: number
          subtotal: number
          created_at?: string
        }
        Update: {
          id?: string
          sale_id?: string
          product_id?: string | null
          product_code?: string
          product_name?: string
          unit?: string
          quantity?: number
          sell_price?: number
          cost_price?: number
          subtotal?: number
          created_at?: string
        }
      }
      stock_movements: {
        Row: {
          id: string
          product_id: string
          type: 'sale' | 'purchase' | 'sale_cancel' | 'purchase_cancel' | 'adjust'
          quantity: number
          balance_before: number
          balance_after: number
          ref_type: string | null
          ref_id: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          type: 'sale' | 'purchase' | 'sale_cancel' | 'purchase_cancel' | 'adjust'
          quantity: number
          balance_before: number
          balance_after: number
          ref_type?: string | null
          ref_id?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          type?: 'sale' | 'purchase' | 'sale_cancel' | 'purchase_cancel' | 'adjust'
          quantity?: number
          balance_before?: number
          balance_after?: number
          ref_type?: string | null
          ref_id?: string | null
          note?: string | null
          created_at?: string
        }
      }
      price_history: {
        Row: {
          id: string
          product_id: string
          old_cost: number
          new_cost: number
          old_price: number
          new_price: number
          changed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          old_cost: number
          new_cost: number
          old_price: number
          new_price: number
          changed_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          old_cost?: number
          new_cost?: number
          old_price?: number
          new_price?: number
          changed_by?: string | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          target_type: 'customer' | 'supplier'
          target_id: string
          amount: number
          payment_type: 'pay_debt' | 'add_debt'
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          target_type: 'customer' | 'supplier'
          target_id: string
          amount: number
          payment_type: 'pay_debt' | 'add_debt'
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          target_type?: 'customer' | 'supplier'
          target_id?: string
          amount?: number
          payment_type?: 'pay_debt' | 'add_debt'
          note?: string | null
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          store_name: string
          store_address: string | null
          store_phone: string | null
          rounding_step: 100 | 500 | 1000
          font_size: 'medium' | 'large' | 'xlarge'
          min_stock_threshold: number
          allow_sell_out_of_stock: boolean
          receipt_footer: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          store_name?: string
          store_address?: string | null
          store_phone?: string | null
          rounding_step?: 100 | 500 | 1000
          font_size?: 'medium' | 'large' | 'xlarge'
          min_stock_threshold?: number
          allow_sell_out_of_stock?: boolean
          receipt_footer?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          store_name?: string
          store_address?: string | null
          store_phone?: string | null
          rounding_step?: 100 | 500 | 1000
          font_size?: 'medium' | 'large' | 'xlarge'
          min_stock_threshold?: number
          allow_sell_out_of_stock?: boolean
          receipt_footer?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_sale: {
        Args: {
          p_customer_id: string | null
          p_discount_amount: number
          p_customer_paid: number
          p_payment_method: 'cash' | 'transfer' | 'debt'
          p_note: string | null
          p_items: Json
        }
        Returns: Json
      }
      cancel_sale: {
        Args: {
          p_sale_id: string
          p_reason: string
        }
        Returns: Json
      }
      create_purchase: {
        Args: {
          p_supplier_id: string | null
          p_paid_amount: number
          p_note: string | null
          p_items: Json
        }
        Returns: Json
      }
      confirm_price_change: {
        Args: {
          p_product_id: string
          p_new_price: number
          p_new_cost: number
          p_is_accepted_suggested: boolean
        }
        Returns: Json
      }
      adjust_stock: {
        Args: {
          p_product_id: string
          p_actual_stock: number
          p_note: string | null
        }
        Returns: Json
      }
      record_payment: {
        Args: {
          p_target_type: 'customer' | 'supplier'
          p_target_id: string
          p_amount: number
          p_payment_type: 'pay_debt' | 'add_debt'
          p_note: string | null
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
