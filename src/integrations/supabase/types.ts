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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ai_predictions: {
        Row: {
          asset_name: string
          asset_symbol: string
          created_at: string
          current_price: number
          id: string
          prediction_data: Json
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          asset_name: string
          asset_symbol: string
          created_at?: string
          current_price?: number
          id?: string
          prediction_data?: Json
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          asset_name?: string
          asset_symbol?: string
          created_at?: string
          current_price?: number
          id?: string
          prediction_data?: Json
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      ai_signals: {
        Row: {
          asset_name: string
          asset_symbol: string
          created_at: string
          current_price: number
          id: string
          signal_data: Json
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          asset_name: string
          asset_symbol: string
          created_at?: string
          current_price?: number
          id?: string
          signal_data?: Json
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          asset_name?: string
          asset_symbol?: string
          created_at?: string
          current_price?: number
          id?: string
          signal_data?: Json
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      ai_whale_activity: {
        Row: {
          asset_name: string
          asset_symbol: string
          created_at: string
          current_price: number
          id: string
          user_id: string | null
          wallet_address: string | null
          whale_data: Json
        }
        Insert: {
          asset_name: string
          asset_symbol: string
          created_at?: string
          current_price?: number
          id?: string
          user_id?: string | null
          wallet_address?: string | null
          whale_data?: Json
        }
        Update: {
          asset_name?: string
          asset_symbol?: string
          created_at?: string
          current_price?: number
          id?: string
          user_id?: string | null
          wallet_address?: string | null
          whale_data?: Json
        }
        Relationships: []
      }
      alert_history: {
        Row: {
          alert_type: string
          asset_id: string
          asset_symbol: string
          id: string
          is_read: boolean
          target_price: number
          triggered_at: string
          triggered_price: number
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          alert_type: string
          asset_id: string
          asset_symbol: string
          id?: string
          is_read?: boolean
          target_price: number
          triggered_at?: string
          triggered_price: number
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          alert_type?: string
          asset_id?: string
          asset_symbol?: string
          id?: string
          is_read?: boolean
          target_price?: number
          triggered_at?: string
          triggered_price?: number
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      flexes: {
        Row: {
          caption: string
          cid: string
          created_at: string
          flex_type: string
          hashtags: string[] | null
          id: string
          image_cid: string | null
          show_portfolio_value: boolean | null
          wallet_address: string
        }
        Insert: {
          caption: string
          cid: string
          created_at?: string
          flex_type?: string
          hashtags?: string[] | null
          id?: string
          image_cid?: string | null
          show_portfolio_value?: boolean | null
          wallet_address: string
        }
        Update: {
          caption?: string
          cid?: string
          created_at?: string
          flex_type?: string
          hashtags?: string[] | null
          id?: string
          image_cid?: string | null
          show_portfolio_value?: boolean | null
          wallet_address?: string
        }
        Relationships: []
      }
      portfolio_transactions: {
        Row: {
          amount: number
          asset_id: string
          asset_symbol: string
          created_at: string
          id: string
          notes: string | null
          price_per_unit: number
          total_value: number
          transaction_type: string
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          amount: number
          asset_id: string
          asset_symbol: string
          created_at?: string
          id?: string
          notes?: string | null
          price_per_unit: number
          total_value: number
          transaction_type: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          amount?: number
          asset_id?: string
          asset_symbol?: string
          created_at?: string
          id?: string
          notes?: string | null
          price_per_unit?: number
          total_value?: number
          transaction_type?: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      strategies: {
        Row: {
          asset_id: string
          asset_symbol: string
          conditions: Json | null
          confidence: number | null
          created_at: string
          entry_price: number | null
          exit_price: number | null
          id: string
          investment_amount: number
          position_size: number | null
          reasoning: string | null
          risk_level: string
          risk_reward: number | null
          signal: string
          status: string
          stop_loss: number | null
          strategy_name: string
          strategy_type: string
          take_profits: Json | null
          timeframe: string
          updated_at: string
          user_id: string | null
          wallet_address: string | null
          win_rate: number | null
        }
        Insert: {
          asset_id: string
          asset_symbol: string
          conditions?: Json | null
          confidence?: number | null
          created_at?: string
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          investment_amount?: number
          position_size?: number | null
          reasoning?: string | null
          risk_level?: string
          risk_reward?: number | null
          signal?: string
          status?: string
          stop_loss?: number | null
          strategy_name: string
          strategy_type: string
          take_profits?: Json | null
          timeframe?: string
          updated_at?: string
          user_id?: string | null
          wallet_address?: string | null
          win_rate?: number | null
        }
        Update: {
          asset_id?: string
          asset_symbol?: string
          conditions?: Json | null
          confidence?: number | null
          created_at?: string
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          investment_amount?: number
          position_size?: number | null
          reasoning?: string | null
          risk_level?: string
          risk_reward?: number | null
          signal?: string
          status?: string
          stop_loss?: number | null
          strategy_name?: string
          strategy_type?: string
          take_profits?: Json | null
          timeframe?: string
          updated_at?: string
          user_id?: string | null
          wallet_address?: string | null
          win_rate?: number | null
        }
        Relationships: []
      }
      user_portfolio: {
        Row: {
          amount: number
          asset_id: string
          asset_logo: string | null
          asset_name: string
          asset_symbol: string
          avg_buy_price: number
          created_at: string
          id: string
          updated_at: string
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          amount?: number
          asset_id: string
          asset_logo?: string | null
          asset_name: string
          asset_symbol: string
          avg_buy_price?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          amount?: number
          asset_id?: string
          asset_logo?: string | null
          asset_name?: string
          asset_symbol?: string
          avg_buy_price?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      user_watchlist: {
        Row: {
          alert_price: number | null
          alert_triggered: boolean
          alert_type: string | null
          asset_id: string
          asset_logo: string | null
          asset_name: string
          asset_symbol: string
          created_at: string
          id: string
          updated_at: string
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          alert_price?: number | null
          alert_triggered?: boolean
          alert_type?: string | null
          asset_id: string
          asset_logo?: string | null
          asset_name: string
          asset_symbol: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          alert_price?: number | null
          alert_triggered?: boolean
          alert_type?: string | null
          asset_id?: string
          asset_logo?: string | null
          asset_name?: string
          asset_symbol?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_flexes_with_urls: {
        Args: {
          limit_count?: number
          offset_count?: number
          wallet_filter?: string
        }
        Returns: {
          caption: string
          cid: string
          created_at: string
          flex_type: string
          hashtags: string[]
          id: string
          image_cid: string
          image_url: string
          metadata_url: string
          show_portfolio_value: boolean
          wallet_address: string
        }[]
      }
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
  public: {
    Enums: {},
  },
} as const
