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
    PostgrestVersion: "14.5"
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
      budget_categories: {
        Row: {
          allocated_amount: number
          category: string
          created_at: string
          event_id: string
          id: string
        }
        Insert: {
          allocated_amount?: number
          category: string
          created_at?: string
          event_id: string
          id?: string
        }
        Update: {
          allocated_amount?: number
          category?: string
          created_at?: string
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_categories_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          booking_id: string | null
          category: string | null
          created_at: string
          event_id: string
          id: string
          item_type: string
          offline_supplier_category: string | null
          offline_supplier_contact: string | null
          offline_supplier_name: string | null
          offline_supplier_notes: string | null
          offline_supplier_price: number | null
          sort_order: number
          status: string
          title: string
        }
        Insert: {
          booking_id?: string | null
          category?: string | null
          created_at?: string
          event_id: string
          id?: string
          item_type?: string
          offline_supplier_category?: string | null
          offline_supplier_contact?: string | null
          offline_supplier_name?: string | null
          offline_supplier_notes?: string | null
          offline_supplier_price?: number | null
          sort_order?: number
          status?: string
          title: string
        }
        Update: {
          booking_id?: string | null
          category?: string | null
          created_at?: string
          event_id?: string
          id?: string
          item_type?: string
          offline_supplier_category?: string | null
          offline_supplier_contact?: string | null
          offline_supplier_name?: string | null
          offline_supplier_notes?: string | null
          offline_supplier_price?: number | null
          sort_order?: number
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_files: {
        Row: {
          checklist_item_id: string | null
          event_id: string
          file_name: string
          id: string
          mime_type: string | null
          storage_path: string
          supplier_label: string | null
          uploaded_at: string
        }
        Insert: {
          checklist_item_id?: string | null
          event_id: string
          file_name: string
          id?: string
          mime_type?: string | null
          storage_path: string
          supplier_label?: string | null
          uploaded_at?: string
        }
        Update: {
          checklist_item_id?: string | null
          event_id?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          storage_path?: string
          supplier_label?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_files_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_files_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_invitations: {
        Row: {
          accepted_at: string | null
          event_id: string
          id: string
          invitation_token: string
          invited_at: string
          invitee_email: string
          status: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          event_id: string
          id?: string
          invitation_token: string
          invited_at?: string
          invitee_email: string
          status?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          event_id?: string
          id?: string
          invitation_token?: string
          invited_at?: string
          invitee_email?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_invitations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_invitations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_locations: {
        Row: {
          address: string | null
          created_at: string
          event_id: string
          id: string
          label: string | null
          location_time: string | null
          role: string | null
          venue_name: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          event_id: string
          id?: string
          label?: string | null
          location_time?: string | null
          role?: string | null
          venue_name?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          event_id?: string
          id?: string
          label?: string | null
          location_time?: string | null
          role?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_locations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          attire_photo_1_path: string | null
          attire_photo_2_path: string | null
          client_id: string
          color_motif: string | null
          created_at: string
          event_date: string | null
          event_time: string | null
          event_type: string
          id: string
          meal_preference_enabled: boolean
          rsvp_deadline: string | null
          title: string | null
          total_budget: number | null
        }
        Insert: {
          attire_photo_1_path?: string | null
          attire_photo_2_path?: string | null
          client_id: string
          color_motif?: string | null
          created_at?: string
          event_date?: string | null
          event_time?: string | null
          event_type?: string
          id?: string
          meal_preference_enabled?: boolean
          rsvp_deadline?: string | null
          title?: string | null
          total_budget?: number | null
        }
        Update: {
          attire_photo_1_path?: string | null
          attire_photo_2_path?: string | null
          client_id?: string
          color_motif?: string | null
          created_at?: string
          event_date?: string | null
          event_time?: string | null
          event_type?: string
          id?: string
          meal_preference_enabled?: boolean
          rsvp_deadline?: string | null
          title?: string | null
          total_budget?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          balance_due_date: string | null
          checklist_item_id: string | null
          created_at: string
          deposit_paid: number
          deposit_paid_date: string | null
          event_id: string
          id: string
          remaining_balance: number
          supplier_name: string | null
          total_amount: number
        }
        Insert: {
          balance_due_date?: string | null
          checklist_item_id?: string | null
          created_at?: string
          deposit_paid?: number
          deposit_paid_date?: string | null
          event_id: string
          id?: string
          remaining_balance?: number
          supplier_name?: string | null
          total_amount?: number
        }
        Update: {
          balance_due_date?: string | null
          checklist_item_id?: string | null
          created_at?: string
          deposit_paid?: number
          deposit_paid_date?: string | null
          event_id?: string
          id?: string
          remaining_balance?: number
          supplier_name?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "expenses_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          created_at: string
          event_id: string
          full_name: string
          has_plus_one: boolean
          id: string
          nickname: string | null
          plus_one_name: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          full_name: string
          has_plus_one?: boolean
          id?: string
          nickname?: string | null
          plus_one_name?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          full_name?: string
          has_plus_one?: boolean
          id?: string
          nickname?: string | null
          plus_one_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          consent_given_at: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string
        }
        Insert: {
          consent_given_at?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
        }
        Update: {
          consent_given_at?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      receipt_files: {
        Row: {
          expense_id: string
          file_name: string
          id: string
          mime_type: string | null
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          expense_id: string
          file_name: string
          id?: string
          mime_type?: string | null
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          expense_id?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_files_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvp_responses: {
        Row: {
          guest_id: string
          id: string
          meal_preference: string | null
          plus_one_attending: boolean | null
          plus_one_name: string | null
          responded_at: string
          status: string
        }
        Insert: {
          guest_id: string
          id?: string
          meal_preference?: string | null
          plus_one_attending?: boolean | null
          plus_one_name?: string | null
          responded_at?: string
          status: string
        }
        Update: {
          guest_id?: string
          id?: string
          meal_preference?: string | null
          plus_one_attending?: boolean | null
          plus_one_name?: string | null
          responded_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_responses_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: true
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvp_tokens: {
        Row: {
          created_at: string
          event_id: string
          id: string
          token: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          token: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_tokens_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_can_access_event: { Args: { evt_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
    Enums: {},
  },
} as const
