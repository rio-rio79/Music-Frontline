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
      blog_comments: {
        Row: {
          blog_posts_id: string
          body: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          blog_posts_id: string
          body: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          blog_posts_id?: string
          body?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_blog_posts_id_fkey"
            columns: ["blog_posts_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_likes: {
        Row: {
          blog_posts_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          blog_posts_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          blog_posts_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_likes_blog_posts_id_fkey"
            columns: ["blog_posts_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          body: string
          created_at: string
          id: string
          junior_id: string
          published_at: string
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          junior_id: string
          published_at?: string
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          junior_id?: string
          published_at?: string
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_junior_id_fkey"
            columns: ["junior_id"]
            isOneToOne: false
            referencedRelation: "juniors"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_juniors: {
        Row: {
          created_at: string
          id: string
          junior_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          junior_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          junior_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_juniors_junior_id_fkey"
            columns: ["junior_id"]
            isOneToOne: false
            referencedRelation: "juniors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_juniors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_path: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      juniors: {
        Row: {
          birth_date: string | null
          birthplace: string | null
          catchphrase: string | null
          created_at: string
          group_id: string | null
          height: number | null
          id: string
          image_path: string | null
          join_date: string | null
          name: string
          name_en: string | null
          name_kana: string
          profile: string | null
          region: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          birthplace?: string | null
          catchphrase?: string | null
          created_at?: string
          group_id?: string | null
          height?: number | null
          id?: string
          image_path?: string | null
          join_date?: string | null
          name: string
          name_en?: string | null
          name_kana: string
          profile?: string | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          birthplace?: string | null
          catchphrase?: string | null
          created_at?: string
          group_id?: string | null
          height?: number | null
          id?: string
          image_path?: string | null
          join_date?: string | null
          name?: string
          name_en?: string | null
          name_kana?: string
          profile?: string | null
          region?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "juniors_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          id: string
          monthly_price: number
          name: string
          point_multiplier: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_price?: number
          name: string
          point_multiplier?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          monthly_price?: number
          name?: string
          point_multiplier?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          color_code: string
          created_at: string
          id: string
          name: string
          oshi_junior_id: string | null
          plan_id: string
          updated_at: string
        }
        Insert: {
          color_code?: string
          created_at?: string
          id: string
          name?: string
          oshi_junior_id?: string | null
          plan_id?: string
          updated_at?: string
        }
        Update: {
          color_code?: string
          created_at?: string
          id?: string
          name?: string
          oshi_junior_id?: string | null
          plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_oshi_junior_id_fkey"
            columns: ["oshi_junior_id"]
            isOneToOne: false
            referencedRelation: "juniors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_point_rules: {
        Row: {
          action_type: string
          apply_plan_multiplier: boolean
          base_points: number
          calculation_type: string
          created_at: string
          is_active: boolean
          limit_count: number | null
          limit_type: string
          oshi_multiplier: number
          updated_at: string
        }
        Insert: {
          action_type: string
          apply_plan_multiplier?: boolean
          base_points: number
          calculation_type?: string
          created_at?: string
          is_active?: boolean
          limit_count?: number | null
          limit_type?: string
          oshi_multiplier?: number
          updated_at?: string
        }
        Update: {
          action_type?: string
          apply_plan_multiplier?: boolean
          base_points?: number
          calculation_type?: string
          created_at?: string
          is_active?: boolean
          limit_count?: number | null
          limit_type?: string
          oshi_multiplier?: number
          updated_at?: string
        }
        Relationships: []
      }
      ranking_scores: {
        Row: {
          blog_view_points: number
          calculated_at: string
          category: string
          comment_points: number
          created_at: string
          follow_points: number
          id: string
          junior_id: string
          like_points: number
          oshi_points: number
          payment_points: number
          play_points: number
          score: number
          updated_at: string
        }
        Insert: {
          blog_view_points?: number
          calculated_at?: string
          category?: string
          comment_points?: number
          created_at?: string
          follow_points?: number
          id?: string
          junior_id: string
          like_points?: number
          oshi_points?: number
          payment_points?: number
          play_points?: number
          score?: number
          updated_at?: string
        }
        Update: {
          blog_view_points?: number
          calculated_at?: string
          category?: string
          comment_points?: number
          created_at?: string
          follow_points?: number
          id?: string
          junior_id?: string
          like_points?: number
          oshi_points?: number
          payment_points?: number
          play_points?: number
          score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ranking_scores_junior_id_fkey"
            columns: ["junior_id"]
            isOneToOne: false
            referencedRelation: "juniors"
            referencedColumns: ["id"]
          },
        ]
      }
      song_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          song_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          song_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          song_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_comments_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      song_juniors: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          junior_id: string
          song_id: string
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          junior_id: string
          song_id: string
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          junior_id?: string
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_juniors_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_juniors_junior_id_fkey"
            columns: ["junior_id"]
            isOneToOne: false
            referencedRelation: "juniors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_juniors_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      song_likes: {
        Row: {
          created_at: string
          id: string
          song_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          song_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          song_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_likes_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          audio_path: string | null
          composer: string | null
          created_at: string
          id: string
          image_path: string | null
          lyricist: string | null
          lyrics: string | null
          play_count: number
          published_at: string
          title: string
          updated_at: string
        }
        Insert: {
          audio_path?: string | null
          composer?: string | null
          created_at?: string
          id?: string
          image_path?: string | null
          lyricist?: string | null
          lyrics?: string | null
          play_count?: number
          published_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          audio_path?: string | null
          composer?: string | null
          created_at?: string
          id?: string
          image_path?: string | null
          lyricist?: string | null
          lyrics?: string | null
          play_count?: number
          published_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          junior_id: string
          message: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          junior_id: string
          message?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          junior_id?: string
          message?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_payments_junior_id_fkey"
            columns: ["junior_id"]
            isOneToOne: false
            referencedRelation: "juniors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_point_logs: {
        Row: {
          action_type: string
          base_points: number | null
          created_at: string
          event_id: string | null
          id: string
          junior_id: string
          oshi_multiplier: number | null
          period_key: string | null
          plan_multiplier: number | null
          points: number
          reversal_of_log_id: string | null
          source_id: string | null
          source_type: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          base_points?: number | null
          created_at?: string
          event_id?: string | null
          id?: string
          junior_id: string
          oshi_multiplier?: number | null
          period_key?: string | null
          plan_multiplier?: number | null
          points?: number
          reversal_of_log_id?: string | null
          source_id?: string | null
          source_type?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          base_points?: number | null
          created_at?: string
          event_id?: string | null
          id?: string
          junior_id?: string
          oshi_multiplier?: number | null
          period_key?: string | null
          plan_multiplier?: number | null
          points?: number
          reversal_of_log_id?: string | null
          source_id?: string | null
          source_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_point_logs_action_type_fkey"
            columns: ["action_type"]
            isOneToOne: false
            referencedRelation: "ranking_point_rules"
            referencedColumns: ["action_type"]
          },
          {
            foreignKeyName: "support_point_logs_junior_id_fkey"
            columns: ["junior_id"]
            isOneToOne: false
            referencedRelation: "juniors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_point_logs_reversal_of_log_id_fkey"
            columns: ["reversal_of_log_id"]
            isOneToOne: false
            referencedRelation: "support_point_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_point_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ranking_leaderboard: {
        Row: {
          blog_view_points: number | null
          calculated_at: string | null
          category: string | null
          comment_points: number | null
          follow_points: number | null
          group_id: string | null
          group_name: string | null
          junior_id: string | null
          junior_image_path: string | null
          junior_name: string | null
          like_points: number | null
          oshi_points: number | null
          payment_points: number | null
          play_points: number | null
          ranking_position: number | null
          score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "juniors_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ranking_scores_junior_id_fkey"
            columns: ["junior_id"]
            isOneToOne: false
            referencedRelation: "juniors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      award_blog_view_points: {
        Args: { p_blog_post_id: string }
        Returns: Json
      }
      award_song_play_points: { Args: { p_song_id: string }; Returns: Json }
      change_membership_plan: { Args: { p_plan_id: string }; Returns: Json }
      create_blog_comment_with_points: {
        Args: { p_blog_post_id: string; p_body: string }
        Returns: Json
      }
      create_song_comment_with_points: {
        Args: { p_body: string; p_song_id: string }
        Returns: Json
      }
      delete_blog_comment_with_points: {
        Args: { p_blog_post_id: string; p_comment_id: string }
        Returns: Json
      }
      delete_song_comment_with_points: {
        Args: { p_comment_id: string; p_song_id: string }
        Returns: Json
      }
      get_my_support_point_summary: { Args: never; Returns: Json }
      increment_blog_view: { Args: { blog_id: string }; Returns: undefined }
      increment_play_count: { Args: { song_id: string }; Returns: undefined }
      record_blog_view_with_points: {
        Args: { p_blog_post_id: string }
        Returns: Json
      }
      record_song_play_with_points: {
        Args: { p_song_id: string }
        Returns: Json
      }
      send_fan_letter: {
        Args: { p_amount: number; p_junior_id: string; p_message: string }
        Returns: Json
      }
      set_oshi_junior: { Args: { p_junior_id: string }; Returns: Json }
      sync_blog_comment_points: {
        Args: { p_blog_post_id: string }
        Returns: Json
      }
      sync_blog_like_points: { Args: { p_blog_post_id: string }; Returns: Json }
      sync_follow_points: { Args: { p_junior_id: string }; Returns: Json }
      sync_oshi_points: { Args: never; Returns: Json }
      sync_song_comment_points: { Args: { p_song_id: string }; Returns: Json }
      sync_song_like_points: { Args: { p_song_id: string }; Returns: Json }
      toggle_blog_like_with_points: {
        Args: { p_blog_post_id: string }
        Returns: Json
      }
      toggle_follow_junior: { Args: { p_junior_id: string }; Returns: Json }
      toggle_song_like_with_points: {
        Args: { p_song_id: string }
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
