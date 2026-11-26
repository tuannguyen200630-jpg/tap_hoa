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
      invoice_sequences: {
        Row: {
          date_key: string
          current_val: number
        }
        Insert: {
          date_key: string
          current_val?: number
        }
        Update: {
          date_key?: string
          current_val?: number
        }
        Relationships: []
      }
      purchase_sequences: {
        Row: {
          date_key: string
          current_val: number
        }
        Insert: {
          date_key: string
          current_val?: number
        }
        Update: {
          date_key?: string
          current_val?: number
        }
        Relationships: []
      }
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          }
        ]
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
        Relationships: []
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: 'purchases_supplier_id_fkey'
            columns: ['supplier_id']
            isOneToOne: false
            referencedRelation: 'suppliers'
            referencedColumns: ['id']
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: 'purchase_items_purchase_id_fkey'
            columns: ['purchase_id']
            isOneToOne: false
            referencedRelation: 'purchases'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'purchase_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: 'sales_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: 'sale_items_sale_id_fkey'
            columns: ['sale_id']
            isOneToOne: false
            referencedRelation: 'sales'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sale_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: 'stock_movements_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          }
        ]
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
          changed_by_name: string | null
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
          changed_by_name?: string | null
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
          changed_by_name?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'price_history_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          }
        ]
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
        Relationships: []
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_product_code: {
        Args: {
          p_category_id: string
        }
        Returns: string
      }
      create_product: {
        Args: {
          p_category_id: string
          p_name: string
          p_barcode: string | null
          p_unit: string
          p_price_mode: 'auto' | 'fixed'
          p_cost_price: number
          p_sell_price: number
          p_initial_stock: number
          p_min_stock: number
          p_expiry_date: string | null
          p_image_url: string | null
        }
        Returns: Json
      }
      update_product: {
        Args: {
          p_product_id: string
          p_name: string
          p_barcode: string | null
          p_category_id: string
          p_unit: string
          p_price_mode: 'auto' | 'fixed'
          p_cost_price: number
          p_sell_price: number
          p_min_stock: number
          p_expiry_date: string | null
          p_image_url?: string | null
        }
        Returns: Json
      }
      list_products_page: {
        Args: {
          p_search?: string | null
          p_category_id?: string | null
          p_filter?: string
          p_page?: number
          p_page_size?: number
        }
        Returns: Json
      }
      get_store_report: {
        Args: {
          p_from_date: string
          p_to_date: string
        }
        Returns: Json
      }
      get_favorite_products: {
        Args: {
          p_limit?: number
        }
        Returns: Json
      }
      list_sales_page: {
        Args: {
          p_date: string
          p_search?: string | null
          p_page?: number
          p_page_size?: number
        }
        Returns: Json
      }
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
          p_old_cost: number
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
      list_debt_contacts: {
        Args: {
          p_target_type: 'customer' | 'supplier'
          p_search?: string | null
          p_page?: number
          p_page_size?: number
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
