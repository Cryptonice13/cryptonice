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
      ai_alert_suggestions: {
        Row: {
          asset_id: string
          asset_symbol: string
          confidence: number | null
          created_at: string
          id: string
          reasoning: string | null
          status: string
          suggestion_type: string
          target_price: number
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          asset_id: string
          asset_symbol: string
          confidence?: number | null
          created_at?: string
          id?: string
          reasoning?: string | null
          status?: string
          suggestion_type?: string
          target_price: number
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          asset_id?: string
          asset_symbol?: string
          confidence?: number | null
          created_at?: string
          id?: string
          reasoning?: string | null
          status?: string
          suggestion_type?: string
          target_price?: number
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      ai_analysis: {
        Row: {
          analysis_data: Json
          analysis_type: string
          asset_id: string
          asset_name: string
          asset_symbol: string
          created_at: string
          current_price: number
          id: string
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          analysis_data?: Json
          analysis_type: string
          asset_id: string
          asset_name: string
          asset_symbol: string
          created_at?: string
          current_price?: number
          id?: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          analysis_data?: Json
          analysis_type?: string
          asset_id?: string
          asset_name?: string
          asset_symbol?: string
          created_at?: string
          current_price?: number
          id?: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      ai_portfolio_analysis: {
        Row: {
          analysis_data: Json
          created_at: string
          diversification: string
          health_score: number
          id: string
          portfolio_snapshot: Json
          risk_level: string
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          analysis_data?: Json
          created_at?: string
          diversification?: string
          health_score?: number
          id?: string
          portfolio_snapshot?: Json
          risk_level?: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          analysis_data?: Json
          created_at?: string
          diversification?: string
          health_score?: number
          id?: string
          portfolio_snapshot?: Json
          risk_level?: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
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
      community_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
          user_name?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          asset_symbol: string | null
          comments_count: number
          content: string
          created_at: string
          id: string
          image_url: string | null
          likes_count: number
          post_type: string
          signal: string | null
          user_avatar: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          asset_symbol?: string | null
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          post_type?: string
          signal?: string | null
          user_avatar?: string | null
          user_id: string
          user_name?: string
        }
        Update: {
          asset_symbol?: string | null
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          post_type?: string
          signal?: string | null
          user_avatar?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      conditional_alerts: {
        Row: {
          assets_involved: string[]
          conditions: Json
          created_at: string
          id: string
          last_evaluated_at: string | null
          logic: string
          name: string
          natural_language: string
          notify_via: Json
          status: string
          triggered_at: string | null
          triggered_data: Json | null
          updated_at: string
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          assets_involved?: string[]
          conditions?: Json
          created_at?: string
          id?: string
          last_evaluated_at?: string | null
          logic?: string
          name: string
          natural_language: string
          notify_via?: Json
          status?: string
          triggered_at?: string | null
          triggered_data?: Json | null
          updated_at?: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          assets_involved?: string[]
          conditions?: Json
          created_at?: string
          id?: string
          last_evaluated_at?: string | null
          logic?: string
          name?: string
          natural_language?: string
          notify_via?: Json
          status?: string
          triggered_at?: string | null
          triggered_data?: Json | null
          updated_at?: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      credit_purchases: {
        Row: {
          amount_usd: number
          coupon_code: string | null
          created_at: string
          credits: number
          id: string
          plan: string
          status: string
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          amount_usd: number
          coupon_code?: string | null
          created_at?: string
          credits: number
          id?: string
          plan: string
          status?: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          amount_usd?: number
          coupon_code?: string | null
          created_at?: string
          credits?: number
          id?: string
          plan?: string
          status?: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          transaction_type: string
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          transaction_type?: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          transaction_type?: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
        }
        Relationships: []
      }
      portfolio_briefs: {
        Row: {
          brief_data: Json
          brief_date: string
          created_at: string
          day_change_pct: number
          id: string
          portfolio_snapshot: Json
          total_value: number
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          brief_data?: Json
          brief_date?: string
          created_at?: string
          day_change_pct?: number
          id?: string
          portfolio_snapshot?: Json
          total_value?: number
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          brief_data?: Json
          brief_date?: string
          created_at?: string
          day_change_pct?: number
          id?: string
          portfolio_snapshot?: Json
          total_value?: number
          user_id?: string | null
          wallet_address?: string | null
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
          purchase_date: string | null
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
          purchase_date?: string | null
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
          purchase_date?: string | null
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
      published_signals: {
        Row: {
          asset_id: string
          asset_logo: string | null
          asset_name: string | null
          asset_symbol: string
          closed_at: string | null
          closed_price: number | null
          entry_price: number
          id: string
          last_checked_at: string | null
          outcome: string | null
          pnl_pct: number | null
          published_at: string
          publisher_user_id: string
          reasoning: string
          signal: string
          status: string
          stop_loss: number
          take_profits: Json
          timeframe: string
        }
        Insert: {
          asset_id: string
          asset_logo?: string | null
          asset_name?: string | null
          asset_symbol: string
          closed_at?: string | null
          closed_price?: number | null
          entry_price: number
          id?: string
          last_checked_at?: string | null
          outcome?: string | null
          pnl_pct?: number | null
          published_at?: string
          publisher_user_id: string
          reasoning: string
          signal: string
          status?: string
          stop_loss: number
          take_profits?: Json
          timeframe?: string
        }
        Update: {
          asset_id?: string
          asset_logo?: string | null
          asset_name?: string | null
          asset_symbol?: string
          closed_at?: string | null
          closed_price?: number | null
          entry_price?: number
          id?: string
          last_checked_at?: string | null
          outcome?: string | null
          pnl_pct?: number | null
          published_at?: string
          publisher_user_id?: string
          reasoning?: string
          signal?: string
          status?: string
          stop_loss?: number
          take_profits?: Json
          timeframe?: string
        }
        Relationships: []
      }
      safety_scans: {
        Row: {
          ai_verdict: string | null
          chain: string
          contract_address: string
          created_at: string
          dex_data: Json | null
          factors: Json
          goplus_data: Json | null
          id: string
          recommendation: string | null
          risk_level: string
          risk_score: number
          token_logo: string | null
          token_name: string | null
          token_symbol: string | null
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          ai_verdict?: string | null
          chain?: string
          contract_address: string
          created_at?: string
          dex_data?: Json | null
          factors?: Json
          goplus_data?: Json | null
          id?: string
          recommendation?: string | null
          risk_level?: string
          risk_score?: number
          token_logo?: string | null
          token_name?: string | null
          token_symbol?: string | null
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          ai_verdict?: string | null
          chain?: string
          contract_address?: string
          created_at?: string
          dex_data?: Json | null
          factors?: Json
          goplus_data?: Json | null
          id?: string
          recommendation?: string | null
          risk_level?: string
          risk_score?: number
          token_logo?: string | null
          token_name?: string | null
          token_symbol?: string | null
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      signal_followers: {
        Row: {
          created_at: string
          follower_user_id: string
          id: string
          publisher_user_id: string
        }
        Insert: {
          created_at?: string
          follower_user_id: string
          id?: string
          publisher_user_id: string
        }
        Update: {
          created_at?: string
          follower_user_id?: string
          id?: string
          publisher_user_id?: string
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
      user_credits: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
          wallet_address?: string | null
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
      publisher_stats: {
        Row: {
          active_signals: number | null
          avg_pnl_pct: number | null
          follower_count: number | null
          last_signal_at: string | null
          losses: number | null
          publisher_avatar: string | null
          publisher_name: string | null
          publisher_user_id: string | null
          total_pnl_pct: number | null
          total_signals: number | null
          win_rate: number | null
          wins: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_credits: {
        Args: {
          _amount: number
          _description: string
          _type: string
          _user_id: string
          _wallet: string
        }
        Returns: number
      }
      claim_daily_bonus: {
        Args: { _user_id: string; _wallet: string }
        Returns: number
      }
      deduct_credits_atomic: {
        Args: {
          _amount: number
          _description: string
          _user_id: string
          _wallet: string
        }
        Returns: number
      }
      ensure_credits_account: {
        Args: { _user_id: string; _wallet: string }
        Returns: number
      }
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
