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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      analysis_results: {
        Row: {
          additive_count: number | null
          ai_explanation: string | null
          confidence: number | null
          created_at: string
          flags: Json
          id: string
          ingredient_count: number | null
          insight_score: number | null
          is_demo: boolean
          nova_class: number | null
          nutrition: Json | null
          report: Json
          scan_id: string
          user_id: string
          verdict: string | null
        }
        Insert: {
          additive_count?: number | null
          ai_explanation?: string | null
          confidence?: number | null
          created_at?: string
          flags?: Json
          id?: string
          ingredient_count?: number | null
          insight_score?: number | null
          is_demo?: boolean
          nova_class?: number | null
          nutrition?: Json | null
          report?: Json
          scan_id: string
          user_id: string
          verdict?: string | null
        }
        Update: {
          additive_count?: number | null
          ai_explanation?: string | null
          confidence?: number | null
          created_at?: string
          flags?: Json
          id?: string
          ingredient_count?: number | null
          insight_score?: number | null
          is_demo?: boolean
          nova_class?: number | null
          nutrition?: Json | null
          report?: Json
          scan_id?: string
          user_id?: string
          verdict?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_results_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "product_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          created_at: string
          id: string
          is_seed_data: boolean
          license_information: string | null
          notes: string | null
          retrieved_at: string | null
          source_name: string
          source_reference: string | null
          source_type: string
          source_version: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_seed_data?: boolean
          license_information?: string | null
          notes?: string | null
          retrieved_at?: string | null
          source_name: string
          source_reference?: string | null
          source_type: string
          source_version?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_seed_data?: boolean
          license_information?: string | null
          notes?: string | null
          retrieved_at?: string | null
          source_name?: string
          source_reference?: string | null
          source_type?: string
          source_version?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fssai_ingredient_rules: {
        Row: {
          condition: string | null
          created_at: string
          effective_date: string | null
          food_category: string
          id: string
          ingredient_id: string
          is_seed_data: boolean
          last_verified_at: string | null
          maximum_level: number | null
          permission_status: string
          regulation_id: string | null
          regulation_reference: string | null
          source_version: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          condition?: string | null
          created_at?: string
          effective_date?: string | null
          food_category?: string
          id?: string
          ingredient_id: string
          is_seed_data?: boolean
          last_verified_at?: string | null
          maximum_level?: number | null
          permission_status?: string
          regulation_id?: string | null
          regulation_reference?: string | null
          source_version?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          condition?: string | null
          created_at?: string
          effective_date?: string | null
          food_category?: string
          id?: string
          ingredient_id?: string
          is_seed_data?: boolean
          last_verified_at?: string | null
          maximum_level?: number | null
          permission_status?: string
          regulation_id?: string | null
          regulation_reference?: string | null
          source_version?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fssai_ingredient_rules_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fssai_ingredient_rules_regulation_id_fkey"
            columns: ["regulation_id"]
            isOneToOne: false
            referencedRelation: "fssai_regulations"
            referencedColumns: ["id"]
          },
        ]
      }
      fssai_regulations: {
        Row: {
          applicable_food_category: string | null
          category: string | null
          created_at: string
          effective_date: string | null
          id: string
          ingredient_or_substance: string | null
          is_seed_data: boolean
          last_verified_at: string | null
          maximum_limit: number | null
          notes: string | null
          permitted_condition: string | null
          regulation_name: string
          regulation_number: string | null
          section: string | null
          source_id: string | null
          source_reference: string | null
          source_version: string | null
          status: string
          subsection: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          applicable_food_category?: string | null
          category?: string | null
          created_at?: string
          effective_date?: string | null
          id?: string
          ingredient_or_substance?: string | null
          is_seed_data?: boolean
          last_verified_at?: string | null
          maximum_limit?: number | null
          notes?: string | null
          permitted_condition?: string | null
          regulation_name: string
          regulation_number?: string | null
          section?: string | null
          source_id?: string | null
          source_reference?: string | null
          source_version?: string | null
          status?: string
          subsection?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          applicable_food_category?: string | null
          category?: string | null
          created_at?: string
          effective_date?: string | null
          id?: string
          ingredient_or_substance?: string | null
          is_seed_data?: boolean
          last_verified_at?: string | null
          maximum_limit?: number | null
          notes?: string | null
          permitted_condition?: string | null
          regulation_name?: string
          regulation_number?: string | null
          section?: string | null
          source_id?: string | null
          source_reference?: string | null
          source_version?: string | null
          status?: string
          subsection?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fssai_regulations_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_aliases: {
        Row: {
          alias: string
          alias_type: string
          created_at: string
          id: string
          ingredient_id: string
        }
        Insert: {
          alias: string
          alias_type?: string
          created_at?: string
          id?: string
          ingredient_id: string
        }
        Update: {
          alias?: string
          alias_type?: string
          created_at?: string
          id?: string
          ingredient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_aliases_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          allergen_flag: boolean
          allergen_group: string | null
          canonical_name: string
          category: string
          common_name: string | null
          confidence: number
          consumer_explanation: string | null
          created_at: string
          description: string | null
          e_number: string | null
          fssai_status: string
          functional_class: string | null
          id: string
          ins_number: string | null
          is_seed_data: boolean
          nova_relevance: number
          processing_indicator: string
          risk_level: string
          scientific_name: string | null
          source_id: string | null
          source_reference: string | null
          sugar_alias: boolean
          updated_at: string
          vegan_status: string
          vegetarian_status: string
          why_used: string | null
        }
        Insert: {
          allergen_flag?: boolean
          allergen_group?: string | null
          canonical_name: string
          category?: string
          common_name?: string | null
          confidence?: number
          consumer_explanation?: string | null
          created_at?: string
          description?: string | null
          e_number?: string | null
          fssai_status?: string
          functional_class?: string | null
          id?: string
          ins_number?: string | null
          is_seed_data?: boolean
          nova_relevance?: number
          processing_indicator?: string
          risk_level?: string
          scientific_name?: string | null
          source_id?: string | null
          source_reference?: string | null
          sugar_alias?: boolean
          updated_at?: string
          vegan_status?: string
          vegetarian_status?: string
          why_used?: string | null
        }
        Update: {
          allergen_flag?: boolean
          allergen_group?: string | null
          canonical_name?: string
          category?: string
          common_name?: string | null
          confidence?: number
          consumer_explanation?: string | null
          created_at?: string
          description?: string | null
          e_number?: string | null
          fssai_status?: string
          functional_class?: string | null
          id?: string
          ins_number?: string | null
          is_seed_data?: boolean
          nova_relevance?: number
          processing_indicator?: string
          risk_level?: string
          scientific_name?: string | null
          source_id?: string | null
          source_reference?: string | null
          sugar_alias?: boolean
          updated_at?: string
          vegan_status?: string
          vegetarian_status?: string
          why_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      product_scans: {
        Row: {
          barcode: string | null
          brand: string | null
          corrected_text: string | null
          created_at: string
          extracted_text: string | null
          id: string
          image_url: string | null
          input_method: string
          is_demo: boolean
          ocr_confidence: number | null
          product_name: string | null
          user_id: string
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          corrected_text?: string | null
          created_at?: string
          extracted_text?: string | null
          id?: string
          image_url?: string | null
          input_method?: string
          is_demo?: boolean
          ocr_confidence?: number | null
          product_name?: string | null
          user_id: string
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          corrected_text?: string | null
          created_at?: string
          extracted_text?: string | null
          id?: string
          image_url?: string | null
          input_method?: string
          is_demo?: boolean
          ocr_confidence?: number | null
          product_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      unknown_ingredients: {
        Row: {
          first_seen_at: string
          id: string
          last_seen_at: string
          occurrences: number
          raw_name: string
          reviewed_by: string | null
          status: string
        }
        Insert: {
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          occurrences?: number
          raw_name: string
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          occurrences?: number
          raw_name?: string
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
