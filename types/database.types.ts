export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_detail: string
          city: string
          created_at: string
          district: string
          id: string
          is_default: boolean
          label: string | null
          phone: string
          postal_code: string
          province: string
          recipient_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_detail: string
          city: string
          created_at?: string
          district: string
          id?: string
          is_default?: boolean
          label?: string | null
          phone: string
          postal_code: string
          province: string
          recipient_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_detail?: string
          city?: string
          created_at?: string
          district?: string
          id?: string
          is_default?: boolean
          label?: string | null
          phone?: string
          postal_code?: string
          province?: string
          recipient_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_path: string | null
          is_active: boolean
          name: string
          requires_size: boolean
          size_options: string[]
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          name: string
          requires_size?: boolean
          size_options?: string[]
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          name?: string
          requires_size?: boolean
          size_options?: string[]
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          color_snapshot: string | null
          id: string
          line_total: number
          order_id: string
          product_name_snapshot: string
          quantity: number
          size_snapshot: string | null
          sku_snapshot: string
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          color_snapshot?: string | null
          id?: string
          line_total: number
          order_id: string
          product_name_snapshot: string
          quantity: number
          size_snapshot?: string | null
          sku_snapshot: string
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          color_snapshot?: string | null
          id?: string
          line_total?: number
          order_id?: string
          product_name_snapshot?: string
          quantity?: number
          size_snapshot?: string | null
          sku_snapshot?: string
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          actor_id: string | null
          created_at: string
          from_payment_status:
            | Database["public"]["Enums"]["payment_status"]
            | null
          from_status: Database["public"]["Enums"]["order_status"] | null
          id: string
          order_id: string
          to_payment_status: Database["public"]["Enums"]["payment_status"]
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          from_payment_status?:
            | Database["public"]["Enums"]["payment_status"]
            | null
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          order_id: string
          to_payment_status: Database["public"]["Enums"]["payment_status"]
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          from_payment_status?:
            | Database["public"]["Enums"]["payment_status"]
            | null
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          order_id?: string
          to_payment_status?: Database["public"]["Enums"]["payment_status"]
          to_status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancel_reason: string | null
          created_at: string
          customer_email_snapshot: string | null
          customer_name_snapshot: string
          customer_phone_snapshot: string
          discount_amount: number
          expires_at: string
          grand_total: number
          id: string
          idempotency_key: string
          notes: string | null
          order_number: string
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          public_token: string
          shipped_at: string | null
          shipping_address_snapshot: Json
          shipping_cost: number
          status: Database["public"]["Enums"]["order_status"]
          stock_released_at: string | null
          subtotal: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancel_reason?: string | null
          created_at?: string
          customer_email_snapshot?: string | null
          customer_name_snapshot: string
          customer_phone_snapshot: string
          discount_amount?: number
          expires_at: string
          grand_total?: number
          id?: string
          idempotency_key: string
          notes?: string | null
          order_number: string
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          public_token?: string
          shipped_at?: string | null
          shipping_address_snapshot: Json
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          stock_released_at?: string | null
          subtotal?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancel_reason?: string | null
          created_at?: string
          customer_email_snapshot?: string | null
          customer_name_snapshot?: string
          customer_phone_snapshot?: string
          discount_amount?: number
          expires_at?: string
          grand_total?: number
          id?: string
          idempotency_key?: string
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          public_token?: string
          shipped_at?: string | null
          shipping_address_snapshot?: Json
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          stock_released_at?: string | null
          subtotal?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          bank_name: string | null
          created_at: string
          customer_note: string | null
          id: string
          method: string
          order_id: string
          proof_path: string | null
          provider: string | null
          provider_reference: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sender_name: string | null
          status: Database["public"]["Enums"]["payment_record_status"]
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          bank_name?: string | null
          created_at?: string
          customer_note?: string | null
          id?: string
          method?: string
          order_id: string
          proof_path?: string | null
          provider?: string | null
          provider_reference?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_name?: string | null
          status?: Database["public"]["Enums"]["payment_record_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_name?: string | null
          created_at?: string
          customer_note?: string | null
          id?: string
          method?: string
          order_id?: string
          proof_path?: string | null
          provider?: string | null
          provider_reference?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_name?: string | null
          status?: Database["public"]["Enums"]["payment_record_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          product_id: string
          sort_order: number
          storage_path: string
          variant_id: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number
          storage_path: string
          variant_id?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number
          storage_path?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color_hex: string | null
          color_hex_2: string | null
          color_name: string | null
          compare_at_price: number | null
          created_at: string
          id: string
          is_active: boolean
          price: number
          product_id: string
          size: string | null
          sku: string
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          color_hex?: string | null
          color_hex_2?: string | null
          color_name?: string | null
          compare_at_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          price: number
          product_id: string
          size?: string | null
          sku: string
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          color_hex?: string | null
          color_hex_2?: string | null
          color_name?: string | null
          compare_at_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          price?: number
          product_id?: string
          size?: string | null
          sku?: string
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          care_instructions: string | null
          category_id: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          is_featured: boolean
          material: string | null
          name: string
          slug: string
          specs: Json
          updated_at: string
        }
        Insert: {
          care_instructions?: string | null
          category_id: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          material?: string | null
          name: string
          slug: string
          specs?: Json
          updated_at?: string
        }
        Update: {
          care_instructions?: string | null
          category_id?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          material?: string | null
          name?: string
          slug?: string
          specs?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shipments: {
        Row: {
          courier: string
          created_at: string
          delivered_at: string | null
          id: string
          note: string | null
          order_id: string
          service: string | null
          shipped_at: string | null
          status: Database["public"]["Enums"]["shipment_status"]
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          courier: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          note?: string | null
          order_id: string
          service?: string | null
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          courier?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          note?: string | null
          order_id?: string
          service?: string | null
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_rates: {
        Row: {
          cost: number
          created_at: string
          estimated_days: string | null
          id: string
          is_active: boolean
          label: string
          province: string
          updated_at: string
        }
        Insert: {
          cost: number
          created_at?: string
          estimated_days?: string | null
          id?: string
          is_active?: boolean
          label?: string
          province: string
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          estimated_days?: string | null
          id?: string
          is_active?: boolean
          label?: string
          province?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_roles: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["staff_role"]
          user_id?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          order_id: string | null
          quantity_delta: number
          reason: string | null
          stock_after: number
          variant_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          order_id?: string | null
          quantity_delta: number
          reason?: string | null
          stock_after: number
          variant_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          order_id?: string | null
          quantity_delta?: number
          reason?: string | null
          stock_after?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          address: string | null
          bank_accounts: Json
          contact_email: string | null
          contact_whatsapp: string | null
          id: number
          logo_path: string | null
          low_stock_threshold: number
          payment_expiry_hours: number
          store_name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          bank_accounts?: Json
          contact_email?: string | null
          contact_whatsapp?: string | null
          id?: number
          logo_path?: string | null
          low_stock_threshold?: number
          payment_expiry_hours?: number
          store_name?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          bank_accounts?: Json
          contact_email?: string | null
          contact_whatsapp?: string | null
          id?: number
          logo_path?: string | null
          low_stock_threshold?: number
          payment_expiry_hours?: number
          store_name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_stock: {
        Args: { p_delta: number; p_reason: string; p_variant_id: string }
        Returns: number
      }
      audit_tables_without_rls: { Args: never; Returns: string[] }
      cancel_order: {
        Args: { p_order_id: string; p_reason: string }
        Returns: undefined
      }
      complete_order: { Args: { p_order_id: string }; Returns: undefined }
      create_order: {
        Args: {
          p_customer_email: string
          p_customer_name: string
          p_customer_phone: string
          p_idempotency_key: string
          p_items: Json
          p_notes?: string
          p_shipping_address: Json
          p_user_id: string
        }
        Returns: Json
      }
      expire_unpaid_orders: { Args: never; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      mark_order_shipped: {
        Args: {
          p_courier: string
          p_order_id: string
          p_service?: string
          p_tracking_number?: string
        }
        Returns: undefined
      }
      mark_refunded: {
        Args: { p_note?: string; p_order_id: string }
        Returns: undefined
      }
      random_code: { Args: { p_length: number }; Returns: string }
      reject_payment: {
        Args: { p_note: string; p_order_id: string }
        Returns: undefined
      }
      release_order_stock: {
        Args: { p_order_id: string; p_reason: string }
        Returns: undefined
      }
      submit_payment_proof: {
        Args: {
          p_bank_name: string
          p_note: string
          p_order_id: string
          p_proof_path: string
          p_sender_name: string
        }
        Returns: undefined
      }
      verify_payment: { Args: { p_order_id: string }; Returns: undefined }
    }
    Enums: {
      order_status:
        | "pending"
        | "processing"
        | "shipped"
        | "completed"
        | "cancelled"
        | "expired"
      payment_record_status: "pending" | "submitted" | "verified" | "rejected"
      payment_status: "unpaid" | "proof_submitted" | "paid" | "refunded"
      shipment_status: "pending" | "shipped" | "delivered" | "returned"
      staff_role: "admin" | "staff"
      stock_movement_type:
        | "initial"
        | "restock"
        | "adjustment"
        | "reserve"
        | "release"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      order_status: [
        "pending",
        "processing",
        "shipped",
        "completed",
        "cancelled",
        "expired",
      ],
      payment_record_status: ["pending", "submitted", "verified", "rejected"],
      payment_status: ["unpaid", "proof_submitted", "paid", "refunded"],
      shipment_status: ["pending", "shipped", "delivered", "returned"],
      staff_role: ["admin", "staff"],
      stock_movement_type: [
        "initial",
        "restock",
        "adjustment",
        "reserve",
        "release",
      ],
    },
  },
} as const
