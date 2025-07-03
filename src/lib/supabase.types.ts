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
      companies: {
        Row: {
          annual_revenue_usd: number | null
          co_investors: string[] | null
          company_linkedin_url: string | null
          country: string | null
          created_at: string | null
          description: string | null
          description_raw: string | null
          employees: number | null
          founded_year: number | null
          fund: Database["public"]["Enums"]["fund_number"]
          id: string
          industry_tags: string[] | null
          investment_amount: number | null
          investment_date: string | null
          key_metrics: Json | null
          last_scraped_at: string | null
          latest_round: string | null
          linkedin_url: string | null
          location: string | null
          logo_url: string | null
          name: string
          notes: string | null
          pitch_deck_url: string | null
          pitch_episode_url: string | null
          pitch_season: number | null
          post_money_valuation: number | null
          slug: string
          spotify_url: string | null
          stage_at_investment:
            | Database["public"]["Enums"]["company_stage"]
            | null
          status: Database["public"]["Enums"]["company_status"] | null
          tagline: string | null
          total_funding_usd: number | null
          updated_at: string | null
          users: number | null
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          annual_revenue_usd?: number | null
          co_investors?: string[] | null
          company_linkedin_url?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          description_raw?: string | null
          employees?: number | null
          founded_year?: number | null
          fund?: Database["public"]["Enums"]["fund_number"]
          id?: string
          industry_tags?: string[] | null
          investment_amount?: number | null
          investment_date?: string | null
          key_metrics?: Json | null
          last_scraped_at?: string | null
          latest_round?: string | null
          linkedin_url?: string | null
          location?: string | null
          logo_url?: string | null
          name: string
          notes?: string | null
          pitch_deck_url?: string | null
          pitch_episode_url?: string | null
          pitch_season?: number | null
          post_money_valuation?: number | null
          slug: string
          spotify_url?: string | null
          stage_at_investment?:
            | Database["public"]["Enums"]["company_stage"]
            | null
          status?: Database["public"]["Enums"]["company_status"] | null
          tagline?: string | null
          total_funding_usd?: number | null
          updated_at?: string | null
          users?: number | null
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          annual_revenue_usd?: number | null
          co_investors?: string[] | null
          company_linkedin_url?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          description_raw?: string | null
          employees?: number | null
          founded_year?: number | null
          fund?: Database["public"]["Enums"]["fund_number"]
          id?: string
          industry_tags?: string[] | null
          investment_amount?: number | null
          investment_date?: string | null
          key_metrics?: Json | null
          last_scraped_at?: string | null
          latest_round?: string | null
          linkedin_url?: string | null
          location?: string | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          pitch_deck_url?: string | null
          pitch_episode_url?: string | null
          pitch_season?: number | null
          post_money_valuation?: number | null
          slug?: string
          spotify_url?: string | null
          stage_at_investment?:
            | Database["public"]["Enums"]["company_stage"]
            | null
          status?: Database["public"]["Enums"]["company_status"] | null
          tagline?: string | null
          total_funding_usd?: number | null
          updated_at?: string | null
          users?: number | null
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      company_founders: {
        Row: {
          company_id: string
          created_at: string | null
          founder_id: string
          is_active: boolean | null
          joined_date: string | null
          left_date: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          founder_id: string
          is_active?: boolean | null
          joined_date?: string | null
          left_date?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          founder_id?: string
          is_active?: boolean | null
          joined_date?: string | null
          left_date?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_founders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_founders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_progress_timeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_founders_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "founder_insights"
            referencedColumns: ["founder_id"]
          },
          {
            foreignKeyName: "company_founders_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "founders"
            referencedColumns: ["id"]
          },
        ]
      }
      embeddings: {
        Row: {
          company_id: string | null
          content: string | null
          content_embedding: string | null
          content_size_bytes: number | null
          created_at: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          content?: string | null
          content_embedding?: string | null
          content_size_bytes?: number | null
          created_at?: string | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          content?: string | null
          content_embedding?: string | null
          content_size_bytes?: number | null
          created_at?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "embeddings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embeddings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_progress_timeline"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_updates: {
        Row: {
          action_items: string[] | null
          ai_summary: string | null
          company_id: string
          created_at: string | null
          founder_email: string | null
          founder_id: string | null
          founder_linkedin_url: string | null
          founder_name: string | null
          founder_role: string | null
          id: string
          key_metrics_mentioned: Json | null
          period_end: string | null
          period_start: string | null
          sentiment_score: number | null
          topics_extracted: string[] | null
          update_text: string | null
          update_type: Database["public"]["Enums"]["founder_update_type"] | null
          updated_at: string | null
        }
        Insert: {
          action_items?: string[] | null
          ai_summary?: string | null
          company_id: string
          created_at?: string | null
          founder_email?: string | null
          founder_id?: string | null
          founder_linkedin_url?: string | null
          founder_name?: string | null
          founder_role?: string | null
          id?: string
          key_metrics_mentioned?: Json | null
          period_end?: string | null
          period_start?: string | null
          sentiment_score?: number | null
          topics_extracted?: string[] | null
          update_text?: string | null
          update_type?:
            | Database["public"]["Enums"]["founder_update_type"]
            | null
          updated_at?: string | null
        }
        Update: {
          action_items?: string[] | null
          ai_summary?: string | null
          company_id?: string
          created_at?: string | null
          founder_email?: string | null
          founder_id?: string | null
          founder_linkedin_url?: string | null
          founder_name?: string | null
          founder_role?: string | null
          id?: string
          key_metrics_mentioned?: Json | null
          period_end?: string | null
          period_start?: string | null
          sentiment_score?: number | null
          topics_extracted?: string[] | null
          update_text?: string | null
          update_type?:
            | Database["public"]["Enums"]["founder_update_type"]
            | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "founder_updates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "founder_updates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_progress_timeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "founder_updates_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "founder_insights"
            referencedColumns: ["founder_id"]
          },
          {
            foreignKeyName: "founder_updates_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "founders"
            referencedColumns: ["id"]
          },
        ]
      }
      founders: {
        Row: {
          bio: string | null
          created_at: string | null
          email: string
          id: string
          linkedin_url: string | null
          name: string | null
          role: Database["public"]["Enums"]["founder_role"] | null
          sex: Database["public"]["Enums"]["founder_sex"] | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          email: string
          id?: string
          linkedin_url?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["founder_role"] | null
          sex?: Database["public"]["Enums"]["founder_sex"] | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          email?: string
          id?: string
          linkedin_url?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["founder_role"] | null
          sex?: Database["public"]["Enums"]["founder_sex"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kpi_values: {
        Row: {
          created_at: string | null
          id: string
          kpi_id: string
          period_date: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          kpi_id: string
          period_date: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          kpi_id?: string
          period_date?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_values_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          label: string
          unit: Database["public"]["Enums"]["kpi_unit"] | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          label: string
          unit?: Database["public"]["Enums"]["kpi_unit"] | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          label?: string
          unit?: Database["public"]["Enums"]["kpi_unit"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kpis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_progress_timeline"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      company_progress_timeline: {
        Row: {
          annual_revenue_usd: number | null
          avg_sentiment: number | null
          co_investors: string[] | null
          company_linkedin_url: string | null
          created_at: string | null
          description: string | null
          description_raw: string | null
          employees: number | null
          founded_year: number | null
          founder_roles: string[] | null
          founders: string[] | null
          id: string | null
          industry_tags: string[] | null
          investment_amount: number | null
          investment_date: string | null
          key_metrics: Json | null
          last_scraped_at: string | null
          last_update_period: string | null
          latest_round: string | null
          latest_summary: string | null
          linkedin_url: string | null
          location: string | null
          logo_url: string | null
          name: string | null
          notes: string | null
          pitch_deck_url: string | null
          pitch_episode_url: string | null
          post_money_valuation: number | null
          slug: string | null
          spotify_url: string | null
          status: Database["public"]["Enums"]["company_status"] | null
          tagline: string | null
          total_funding_usd: number | null
          total_updates: number | null
          updated_at: string | null
          users: number | null
          website_url: string | null
          youtube_url: string | null
        }
        Relationships: []
      }
      embedding_size_monitor: {
        Row: {
          company_id: string | null
          content_size_bytes: number | null
          created_at: string | null
          id: number | null
          size_category: string | null
          size_kb: number | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          content_size_bytes?: number | null
          created_at?: string | null
          id?: number | null
          size_category?: never
          size_kb?: never
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          content_size_bytes?: number | null
          created_at?: string | null
          id?: number | null
          size_category?: never
          size_kb?: never
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "embeddings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embeddings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_progress_timeline"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_insights: {
        Row: {
          avg_sentiment: number | null
          companies_involved: string[] | null
          company_names: string[] | null
          email: string | null
          first_update: string | null
          founder_id: string | null
          last_update: string | null
          linkedin_url: string | null
          name: string | null
          primary_role: Database["public"]["Enums"]["founder_role"] | null
          top_topics: string[] | null
          total_updates: number | null
        }
        Relationships: []
      }
      founder_timeline_analysis: {
        Row: {
          ai_summary: string | null
          company_name: string | null
          company_slug: string | null
          created_at: string | null
          founder_email: string | null
          founder_name: string | null
          founder_role_at_company: string | null
          key_metrics_mentioned: Json | null
          period_end: string | null
          period_start: string | null
          previous_sentiment: number | null
          sentiment_score: number | null
          topics_extracted: string[] | null
          update_quarter: number | null
          update_type: Database["public"]["Enums"]["founder_update_type"] | null
          update_year: number | null
        }
        Relationships: []
      }
      portfolio_demographics: {
        Row: {
          company_count: number | null
          country: string | null
          female_founder_percentage: number | null
          female_founders: number | null
          founder_count: number | null
          male_founders: number | null
          pitch_season: number | null
          stage_at_investment:
            | Database["public"]["Enums"]["company_stage"]
            | null
        }
        Relationships: []
      }
      season_performance: {
        Row: {
          acquihires: number | null
          avg_investment: number | null
          avg_valuation: number | null
          companies_invested: number | null
          failed_companies: number | null
          pitch_season: number | null
          still_active: number | null
          success_rate_percentage: number | null
          successful_exits: number | null
        }
        Relationships: []
      }
      timezone_best_practices: {
        Row: {
          description: string | null
          implementation: string | null
          practice: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      citext: {
        Args: { "": boolean } | { "": string } | { "": unknown }
        Returns: string
      }
      citext_hash: {
        Args: { "": string }
        Returns: number
      }
      citextin: {
        Args: { "": unknown }
        Returns: string
      }
      citextout: {
        Args: { "": string }
        Returns: unknown
      }
      citextrecv: {
        Args: { "": unknown }
        Returns: string
      }
      citextsend: {
        Args: { "": string }
        Returns: string
      }
      ensure_utc_timestamp: {
        Args: { input_timestamp: string }
        Returns: string
      }
      get_company_progress_timeline: {
        Args: Record<PropertyKey, never>
        Returns: {
          company_id: string
          company_slug: string
          company_name: string
          company_data: Json
          total_updates: number
          avg_sentiment: number
          founders: string[]
          founder_roles: string[]
          last_update_period: string
          latest_summary: string
        }[]
      }
      get_embedding_size_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_embeddings: number
          avg_size_bytes: number
          max_size_bytes: number
          oversized_count: number
          size_distribution: Json
        }[]
      }
      get_founder_insights: {
        Args: Record<PropertyKey, never>
        Returns: {
          founder_id: string
          founder_email: string
          founder_name: string
          primary_role: Database["public"]["Enums"]["founder_role"]
          linkedin_url: string
          total_updates: number
          avg_sentiment: number
          companies_involved: string[]
          company_names: string[]
          top_topics: string[]
          first_update: string
          last_update: string
        }[]
      }
      get_founder_timeline_analysis: {
        Args: Record<PropertyKey, never>
        Returns: {
          company_name: string
          company_slug: string
          founder_name: string
          founder_email: string
          founder_role_at_company: string
          period_start: string
          period_end: string
          update_type: Database["public"]["Enums"]["founder_update_type"]
          sentiment_score: number
          key_metrics_mentioned: string[]
          topics_extracted: string[]
          ai_summary: string
          created_at: string
          previous_sentiment: number
          update_year: number
          update_quarter: number
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      safe_parse_timestamp: {
        Args: { input_text: string; fallback_timezone?: string }
        Returns: string
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      utc_now: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      company_stage: "pre_seed" | "seed"
      company_status: "active" | "acquihired" | "exited" | "dead"
      founder_role: "solo_founder" | "cofounder"
      founder_sex: "male" | "female"
      founder_update_type:
        | "monthly"
        | "quarterly"
        | "milestone"
        | "annual"
        | "ad_hoc"
        | "other"
      fund_number: "fund_i" | "fund_ii" | "fund_iii"
      kpi_unit:
        | "usd"
        | "users"
        | "percent"
        | "count"
        | "months"
        | "days"
        | "mbps"
        | "gb"
        | "requests_sec"
        | "score"
        | "ratio"
        | "other"
        | "percentage_decimal"
      user_role: "admin" | "lp"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      company_stage: ["pre_seed", "seed"],
      company_status: ["active", "acquihired", "exited", "dead"],
      founder_role: ["solo_founder", "cofounder"],
      founder_sex: ["male", "female"],
      founder_update_type: [
        "monthly",
        "quarterly",
        "milestone",
        "annual",
        "ad_hoc",
        "other",
      ],
      fund_number: ["fund_i", "fund_ii", "fund_iii"],
      kpi_unit: [
        "usd",
        "users",
        "percent",
        "count",
        "months",
        "days",
        "mbps",
        "gb",
        "requests_sec",
        "score",
        "ratio",
        "other",
        "percentage_decimal",
      ],
      user_role: ["admin", "lp"],
    },
  },
} as const
