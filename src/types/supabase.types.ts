export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      companies: {
        Row: {
          annual_revenue_usd: number | null
          apple_podcasts_url: string | null
          business_model_tags:
            | Database["public"]["Enums"]["business_model_tag"][]
            | null
          co_investors: string[] | null
          company_linkedin_url: string | null
          conversion_cap_usd: number | null
          country_of_incorp: string | null
          created_at: string | null
          description: string | null
          description_raw: string | null
          discount_percent: number | null
          employees: number | null
          episode_publish_date: string | null
          episode_season: number | null
          episode_show_notes: string | null
          episode_title: string | null
          founded_year: number | null
          founder_name: string | null
          fund: Database["public"]["Enums"]["fund_number"]
          has_pro_rata_rights: boolean
          hq_address_line_1: string | null
          hq_address_line_2: string | null
          hq_city: string | null
          hq_country: string | null
          hq_latitude: number | null
          hq_longitude: number | null
          hq_state: string | null
          hq_zip_code: string | null
          id: string
          incorporation_type:
            | Database["public"]["Enums"]["incorporation_type"]
            | null
          industry_tags: Database["public"]["Enums"]["industry_tag"][] | null
          instrument: Database["public"]["Enums"]["investment_instrument"]
          investment_amount: number | null
          investment_date: string | null
          key_metrics: Json | null
          keywords: string[] | null
          last_scraped_at: string | null
          latest_round: string | null
          legal_name: string | null
          location: string | null
          logo_url: string | null
          name: string
          notes: string | null
          pitch_episode_url: string | null
          pitch_transcript: string | null
          post_money_valuation: number | null
          reason_for_investing: string | null
          round_size_usd: number | null
          slug: string
          spotify_url: string | null
          stage_at_investment:
            | Database["public"]["Enums"]["company_stage"]
            | null
          status: Database["public"]["Enums"]["company_status"] | null
          svg_logo_url: string | null
          tagline: string | null
          total_funding_usd: number | null
          updated_at: string | null
          users: number | null
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          annual_revenue_usd?: number | null
          apple_podcasts_url?: string | null
          business_model_tags?:
            | Database["public"]["Enums"]["business_model_tag"][]
            | null
          co_investors?: string[] | null
          company_linkedin_url?: string | null
          conversion_cap_usd?: number | null
          country_of_incorp?: string | null
          created_at?: string | null
          description?: string | null
          description_raw?: string | null
          discount_percent?: number | null
          employees?: number | null
          episode_publish_date?: string | null
          episode_season?: number | null
          episode_show_notes?: string | null
          episode_title?: string | null
          founded_year?: number | null
          founder_name?: string | null
          fund?: Database["public"]["Enums"]["fund_number"]
          has_pro_rata_rights?: boolean
          hq_address_line_1?: string | null
          hq_address_line_2?: string | null
          hq_city?: string | null
          hq_country?: string | null
          hq_latitude?: number | null
          hq_longitude?: number | null
          hq_state?: string | null
          hq_zip_code?: string | null
          id?: string
          incorporation_type?:
            | Database["public"]["Enums"]["incorporation_type"]
            | null
          industry_tags?: Database["public"]["Enums"]["industry_tag"][] | null
          instrument?: Database["public"]["Enums"]["investment_instrument"]
          investment_amount?: number | null
          investment_date?: string | null
          key_metrics?: Json | null
          keywords?: string[] | null
          last_scraped_at?: string | null
          latest_round?: string | null
          legal_name?: string | null
          location?: string | null
          logo_url?: string | null
          name: string
          notes?: string | null
          pitch_episode_url?: string | null
          pitch_transcript?: string | null
          post_money_valuation?: number | null
          reason_for_investing?: string | null
          round_size_usd?: number | null
          slug: string
          spotify_url?: string | null
          stage_at_investment?:
            | Database["public"]["Enums"]["company_stage"]
            | null
          status?: Database["public"]["Enums"]["company_status"] | null
          svg_logo_url?: string | null
          tagline?: string | null
          total_funding_usd?: number | null
          updated_at?: string | null
          users?: number | null
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          annual_revenue_usd?: number | null
          apple_podcasts_url?: string | null
          business_model_tags?:
            | Database["public"]["Enums"]["business_model_tag"][]
            | null
          co_investors?: string[] | null
          company_linkedin_url?: string | null
          conversion_cap_usd?: number | null
          country_of_incorp?: string | null
          created_at?: string | null
          description?: string | null
          description_raw?: string | null
          discount_percent?: number | null
          employees?: number | null
          episode_publish_date?: string | null
          episode_season?: number | null
          episode_show_notes?: string | null
          episode_title?: string | null
          founded_year?: number | null
          founder_name?: string | null
          fund?: Database["public"]["Enums"]["fund_number"]
          has_pro_rata_rights?: boolean
          hq_address_line_1?: string | null
          hq_address_line_2?: string | null
          hq_city?: string | null
          hq_country?: string | null
          hq_latitude?: number | null
          hq_longitude?: number | null
          hq_state?: string | null
          hq_zip_code?: string | null
          id?: string
          incorporation_type?:
            | Database["public"]["Enums"]["incorporation_type"]
            | null
          industry_tags?: Database["public"]["Enums"]["industry_tag"][] | null
          instrument?: Database["public"]["Enums"]["investment_instrument"]
          investment_amount?: number | null
          investment_date?: string | null
          key_metrics?: Json | null
          keywords?: string[] | null
          last_scraped_at?: string | null
          latest_round?: string | null
          legal_name?: string | null
          location?: string | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          pitch_episode_url?: string | null
          pitch_transcript?: string | null
          post_money_valuation?: number | null
          reason_for_investing?: string | null
          round_size_usd?: number | null
          slug?: string
          spotify_url?: string | null
          stage_at_investment?:
            | Database["public"]["Enums"]["company_stage"]
            | null
          status?: Database["public"]["Enums"]["company_status"] | null
          svg_logo_url?: string | null
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
            referencedRelation: "company_investment_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_founders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_progress_timeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_founders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "vc_investments"
            referencedColumns: ["company_id"]
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
      company_vcs: {
        Row: {
          company_id: string | null
          created_at: string | null
          episode_number: string | null
          episode_season: string | null
          episode_url: string | null
          id: string
          investment_amount_usd: number | null
          investment_date: string | null
          is_invested: boolean | null
          vc_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          episode_number?: string | null
          episode_season?: string | null
          episode_url?: string | null
          id?: string
          investment_amount_usd?: number | null
          investment_date?: string | null
          is_invested?: boolean | null
          vc_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          episode_number?: string | null
          episode_season?: string | null
          episode_url?: string | null
          id?: string
          investment_amount_usd?: number | null
          investment_date?: string | null
          is_invested?: boolean | null
          vc_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_vcs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_vcs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_investment_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_vcs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_progress_timeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_vcs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "vc_investments"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_vcs_vc_id_fkey"
            columns: ["vc_id"]
            isOneToOne: false
            referencedRelation: "vc_investments"
            referencedColumns: ["vc_id"]
          },
          {
            foreignKeyName: "company_vcs_vc_id_fkey"
            columns: ["vc_id"]
            isOneToOne: false
            referencedRelation: "vc_portfolio_summary"
            referencedColumns: ["vc_id"]
          },
          {
            foreignKeyName: "company_vcs_vc_id_fkey"
            columns: ["vc_id"]
            isOneToOne: false
            referencedRelation: "vcs"
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
            referencedRelation: "company_investment_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "embeddings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_progress_timeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embeddings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "vc_investments"
            referencedColumns: ["company_id"]
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
            referencedRelation: "company_investment_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "founder_updates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_progress_timeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "founder_updates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "vc_investments"
            referencedColumns: ["company_id"]
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
          first_name: string | null
          id: string
          last_name: string | null
          linkedin_url: string | null
          name: string | null
          role: Database["public"]["Enums"]["founder_role"] | null
          sex: Database["public"]["Enums"]["founder_sex"] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          linkedin_url?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["founder_role"] | null
          sex?: Database["public"]["Enums"]["founder_sex"] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          linkedin_url?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["founder_role"] | null
          sex?: Database["public"]["Enums"]["founder_sex"] | null
          title?: string | null
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
            referencedRelation: "company_investment_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "kpis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_progress_timeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "vc_investments"
            referencedColumns: ["company_id"]
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
      vcs: {
        Row: {
          bio: string | null
          created_at: string | null
          firm_name: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          name: string
          podcast_url: string | null
          profile_image_url: string | null
          role_title: string | null
          thepitch_profile_url: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string | null
          website_url: string | null
          wikipedia_url: string | null
          youtube_url: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          firm_name?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          name: string
          podcast_url?: string | null
          profile_image_url?: string | null
          role_title?: string | null
          thepitch_profile_url?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          website_url?: string | null
          wikipedia_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          firm_name?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          name?: string
          podcast_url?: string | null
          profile_image_url?: string | null
          role_title?: string | null
          thepitch_profile_url?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          website_url?: string | null
          wikipedia_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      company_investment_summary: {
        Row: {
          company_id: string | null
          company_name: string | null
          company_slug: string | null
          first_investment_date: string | null
          investor_names: string[] | null
          total_investors: number | null
          total_raised_from_episode_usd: number | null
          total_vcs_featured: number | null
        }
        Relationships: []
      }
      company_progress_timeline: {
        Row: {
          business_model_tags:
            | Database["public"]["Enums"]["business_model_tag"][]
            | null
          created_at: string | null
          id: string | null
          industry_tags: Database["public"]["Enums"]["industry_tag"][] | null
          keywords: string[] | null
          name: string | null
          post_money_valuation: number | null
          slug: string | null
          stage_at_investment:
            | Database["public"]["Enums"]["company_stage"]
            | null
          total_funding_usd: number | null
          updated_at: string | null
        }
        Insert: {
          business_model_tags?:
            | Database["public"]["Enums"]["business_model_tag"][]
            | null
          created_at?: string | null
          id?: string | null
          industry_tags?: Database["public"]["Enums"]["industry_tag"][] | null
          keywords?: string[] | null
          name?: string | null
          post_money_valuation?: number | null
          slug?: string | null
          stage_at_investment?:
            | Database["public"]["Enums"]["company_stage"]
            | null
          total_funding_usd?: number | null
          updated_at?: string | null
        }
        Update: {
          business_model_tags?:
            | Database["public"]["Enums"]["business_model_tag"][]
            | null
          created_at?: string | null
          id?: string | null
          industry_tags?: Database["public"]["Enums"]["industry_tag"][] | null
          keywords?: string[] | null
          name?: string | null
          post_money_valuation?: number | null
          slug?: string | null
          stage_at_investment?:
            | Database["public"]["Enums"]["company_stage"]
            | null
          total_funding_usd?: number | null
          updated_at?: string | null
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
            referencedRelation: "company_investment_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "embeddings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_progress_timeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embeddings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "vc_investments"
            referencedColumns: ["company_id"]
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
          episode_season: number | null
          female_founder_percentage: number | null
          female_founders: number | null
          founder_count: number | null
          hq_country: string | null
          male_founders: number | null
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
          episode_season: number | null
          failed_companies: number | null
          still_active: number | null
          success_rate_percentage: number | null
          successful_exits: number | null
        }
        Relationships: []
      }
      tag_analytics: {
        Row: {
          tag_type: string | null
          tag_value: string | null
          usage_count: number | null
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
      vc_investments: {
        Row: {
          company_id: string | null
          company_name: string | null
          company_slug: string | null
          episode_number: string | null
          episode_season: string | null
          episode_url: string | null
          firm_name: string | null
          investment_amount_usd: number | null
          investment_date: string | null
          is_invested: boolean | null
          relationship_created_at: string | null
          relationship_id: string | null
          role_title: string | null
          vc_id: string | null
          vc_name: string | null
        }
        Relationships: []
      }
      vc_portfolio_summary: {
        Row: {
          firm_name: string | null
          first_investment_date: string | null
          last_investment_date: string | null
          total_episode_appearances: number | null
          total_invested_usd: number | null
          total_investments: number | null
          vc_id: string | null
          vc_name: string | null
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
      get_valid_business_model_tags: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_valid_industry_tags: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_valid_keywords: {
        Args: Record<PropertyKey, never>
        Returns: {
          value: string
          label: string
          count: number
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
      validate_business_model_tags: {
        Args:
          | { tags: Database["public"]["Enums"]["business_model_tag"][] }
          | { tags: string[] }
        Returns: boolean
      }
      validate_industry_tags: {
        Args: { tags: Database["public"]["Enums"]["industry_tag"][] }
        Returns: boolean
      }
      validate_keywords: {
        Args: { keywords: string[] }
        Returns: boolean
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
      business_model_tag:
        | "subscription"
        | "saas"
        | "freemium"
        | "transaction_fee"
        | "advertising"
        | "sponsored_content"
        | "affiliate"
        | "licensing"
        | "white_label"
        | "franchise"
        | "one_time_purchase"
        | "pay_per_use"
        | "marketplace"
        | "social_network"
        | "two_sided_marketplace"
        | "multi_sided_platform"
        | "aggregator"
        | "peer_to_peer"
        | "p2p"
        | "live_commerce"
        | "group_buying"
        | "subscription_commerce"
        | "direct_to_consumer"
        | "d2c"
        | "b2b"
        | "b2c"
        | "b2b2c"
        | "data_monetization"
      company_stage: "pre_seed" | "seed"
      company_status: "active" | "acquihired" | "exited" | "dead"
      founder_role: "founder" | "cofounder"
      founder_sex: "male" | "female"
      founder_update_type:
        | "monthly"
        | "quarterly"
        | "milestone"
        | "annual"
        | "ad_hoc"
        | "other"
      fund_number: "fund_i" | "fund_ii" | "fund_iii"
      incorporation_type:
        | "c_corp"
        | "s_corp"
        | "llc"
        | "bcorp"
        | "gmbh"
        | "ltd"
        | "plc"
        | "other"
      industry_tag:
        | "fintech"
        | "edtech"
        | "healthtech"
        | "proptech"
        | "insurtech"
        | "legaltech"
        | "hrtech"
        | "martech"
        | "adtech"
        | "cleantech"
        | "foodtech"
        | "agtech"
        | "regtech"
        | "cybersecurity"
        | "data_analytics"
        | "cloud"
        | "mobile"
        | "gaming"
        | "ar_vr"
        | "iot"
        | "robotics"
        | "autonomous_vehicles"
        | "hardware"
        | "ev_tech"
        | "vertical_saas"
        | "agentic_ai"
        | "deeptech"
        | "e_commerce"
        | "retail"
        | "grocery_retail"
        | "social_commerce"
        | "fashion_beauty"
        | "cpg"
        | "food_beverage"
        | "fitness"
        | "wellness"
        | "mental_health"
        | "telemedicine"
        | "biotech"
        | "pharma"
        | "medical_devices"
        | "diagnostics"
        | "digital_health"
        | "consumer_goods"
        | "productivity"
        | "communication"
        | "media_entertainment"
        | "sports"
        | "travel"
        | "hospitality"
        | "food_delivery"
        | "logistics"
        | "supply_chain"
        | "transportation"
        | "real_estate"
        | "construction"
        | "manufacturing"
        | "energy"
        | "greentech_sustainability"
        | "circular_economy"
        | "impact"
        | "non_profit"
        | "government"
        | "public_sector"
        | "defense"
        | "space"
        | "agriculture"
        | "farming"
        | "pets"
        | "parenting"
        | "seniors"
        | "disability"
        | "accessibility"
        | "diversity"
        | "inclusion"
        | "gig_economy"
        | "freelance"
        | "remote_work"
        | "future_of_work"
        | "smb"
        | "enterprise"
        | "consumer_tech"
        | "prosumer"
        | "developer"
        | "creator"
        | "influencer"
        | "small_business"
        | "solopreneur"
        | "freelancer"
        | "remote_worker"
        | "genz"
        | "millennials"
        | "parents"
        | "students"
        | "professionals"
        | "healthcare_providers"
        | "financial_advisors"
      investment_instrument:
        | "safe_post"
        | "safe_pre"
        | "convertible_note"
        | "equity"
      keyword_tag:
        | "product_market_fit"
        | "founder_market_fit"
        | "minimum_viable_product"
        | "mvp"
        | "pivot"
        | "bootstrapped"
        | "viral_growth"
        | "flywheel_effect"
        | "lean_startup"
        | "network_effects"
        | "product_led_growth"
        | "sales_led_growth"
        | "community_led_growth"
        | "customer_acquisition_cost"
        | "lifetime_value"
        | "churn_rate"
        | "AI"
        | "machine_learning"
        | "deep_learning"
        | "natural_language_processing"
        | "nlp"
        | "computer_vision"
        | "generative_ai"
        | "agentic_ai"
        | "blockchain_based"
        | "cloud_native"
        | "edge_computing"
        | "api_first"
        | "no_code"
        | "low_code"
        | "open_source"
        | "proprietary_technology"
        | "patent_pending"
        | "scalable_infrastructure"
        | "data_play"
        | "predictive_analytics"
        | "big_data"
        | "personalization"
        | "recommendation_engine"
        | "user_generated_content"
        | "content_moderation"
        | "search_optimization"
        | "mobile_app"
        | "web_based"
        | "cross_platform"
        | "omnichannel"
        | "white_glove"
        | "self_service"
        | "managed_service"
        | "do_it_yourself"
        | "on_demand"
        | "subscription_based"
        | "freemium_model"
        | "pay_per_use"
        | "usage_based_pricing"
        | "3d_printing"
        | "additive_manufacturing"
        | "supply_chain_optimization"
        | "inventory_management"
        | "logistics"
        | "last_mile_delivery"
        | "cold_chain"
        | "quality_assurance"
        | "regulatory_compliance"
        | "intuitive_interface"
        | "single_sign_on"
        | "multi_tenant"
        | "white_label"
        | "customizable"
        | "configurable"
        | "plug_and_play"
        | "turnkey_solution"
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
    Enums: {
      business_model_tag: [
        "subscription",
        "saas",
        "freemium",
        "transaction_fee",
        "advertising",
        "sponsored_content",
        "affiliate",
        "licensing",
        "white_label",
        "franchise",
        "one_time_purchase",
        "pay_per_use",
        "marketplace",
        "social_network",
        "two_sided_marketplace",
        "multi_sided_platform",
        "aggregator",
        "peer_to_peer",
        "p2p",
        "live_commerce",
        "group_buying",
        "subscription_commerce",
        "direct_to_consumer",
        "d2c",
        "b2b",
        "b2c",
        "b2b2c",
        "data_monetization",
      ],
      company_stage: ["pre_seed", "seed"],
      company_status: ["active", "acquihired", "exited", "dead"],
      founder_role: ["founder", "cofounder"],
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
      incorporation_type: [
        "c_corp",
        "s_corp",
        "llc",
        "bcorp",
        "gmbh",
        "ltd",
        "plc",
        "other",
      ],
      industry_tag: [
        "fintech",
        "edtech",
        "healthtech",
        "proptech",
        "insurtech",
        "legaltech",
        "hrtech",
        "martech",
        "adtech",
        "cleantech",
        "foodtech",
        "agtech",
        "regtech",
        "cybersecurity",
        "data_analytics",
        "cloud",
        "mobile",
        "gaming",
        "ar_vr",
        "iot",
        "robotics",
        "autonomous_vehicles",
        "hardware",
        "ev_tech",
        "vertical_saas",
        "agentic_ai",
        "deeptech",
        "e_commerce",
        "retail",
        "grocery_retail",
        "social_commerce",
        "fashion_beauty",
        "cpg",
        "food_beverage",
        "fitness",
        "wellness",
        "mental_health",
        "telemedicine",
        "biotech",
        "pharma",
        "medical_devices",
        "diagnostics",
        "digital_health",
        "consumer_goods",
        "productivity",
        "communication",
        "media_entertainment",
        "sports",
        "travel",
        "hospitality",
        "food_delivery",
        "logistics",
        "supply_chain",
        "transportation",
        "real_estate",
        "construction",
        "manufacturing",
        "energy",
        "greentech_sustainability",
        "circular_economy",
        "impact",
        "non_profit",
        "government",
        "public_sector",
        "defense",
        "space",
        "agriculture",
        "farming",
        "pets",
        "parenting",
        "seniors",
        "disability",
        "accessibility",
        "diversity",
        "inclusion",
        "gig_economy",
        "freelance",
        "remote_work",
        "future_of_work",
        "smb",
        "enterprise",
        "consumer_tech",
        "prosumer",
        "developer",
        "creator",
        "influencer",
        "small_business",
        "solopreneur",
        "freelancer",
        "remote_worker",
        "genz",
        "millennials",
        "parents",
        "students",
        "professionals",
        "healthcare_providers",
        "financial_advisors",
      ],
      investment_instrument: [
        "safe_post",
        "safe_pre",
        "convertible_note",
        "equity",
      ],
      keyword_tag: [
        "product_market_fit",
        "founder_market_fit",
        "minimum_viable_product",
        "mvp",
        "pivot",
        "bootstrapped",
        "viral_growth",
        "flywheel_effect",
        "lean_startup",
        "network_effects",
        "product_led_growth",
        "sales_led_growth",
        "community_led_growth",
        "customer_acquisition_cost",
        "lifetime_value",
        "churn_rate",
        "AI",
        "machine_learning",
        "deep_learning",
        "natural_language_processing",
        "nlp",
        "computer_vision",
        "generative_ai",
        "agentic_ai",
        "blockchain_based",
        "cloud_native",
        "edge_computing",
        "api_first",
        "no_code",
        "low_code",
        "open_source",
        "proprietary_technology",
        "patent_pending",
        "scalable_infrastructure",
        "data_play",
        "predictive_analytics",
        "big_data",
        "personalization",
        "recommendation_engine",
        "user_generated_content",
        "content_moderation",
        "search_optimization",
        "mobile_app",
        "web_based",
        "cross_platform",
        "omnichannel",
        "white_glove",
        "self_service",
        "managed_service",
        "do_it_yourself",
        "on_demand",
        "subscription_based",
        "freemium_model",
        "pay_per_use",
        "usage_based_pricing",
        "3d_printing",
        "additive_manufacturing",
        "supply_chain_optimization",
        "inventory_management",
        "logistics",
        "last_mile_delivery",
        "cold_chain",
        "quality_assurance",
        "regulatory_compliance",
        "intuitive_interface",
        "single_sign_on",
        "multi_tenant",
        "white_label",
        "customizable",
        "configurable",
        "plug_and_play",
        "turnkey_solution",
      ],
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
