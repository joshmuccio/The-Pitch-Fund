import { Database } from './supabase.types'

// Export commonly used types for easier importing
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
export type Functions<T extends keyof Database['public']['Functions']> = Database['public']['Functions'][T]

// Company types
export type Company = Tables<'companies'>
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type CompanyUpdate = Database['public']['Tables']['companies']['Update']

// Founder types
export type Founder = Tables<'founders'>
export type FounderInsert = Database['public']['Tables']['founders']['Insert']
export type FounderUpdate = Database['public']['Tables']['founders']['Update']

// Enum types (for form selects, validation, etc.)
export type CompanyStage = Enums<'company_stage'>
export type CompanyStatus = Enums<'company_status'>
export type FounderSex = Enums<'founder_sex'>
export type FounderRole = Enums<'founder_role'>
export type UserRole = Enums<'user_role'>

// Analytics view types (for dashboard components)
export type PortfolioDemographics = Views<'portfolio_demographics'>
export type SeasonPerformance = Views<'season_performance'>
export type CompanyProgressTimeline = Views<'company_progress_timeline'>
export type FounderInsights = Views<'founder_insights'>

// Secure function return types
export type FounderTimelineAnalysis = Functions<'get_founder_timeline_analysis'>['Returns'][0]
export type CompanyProgressData = Functions<'get_company_progress_timeline'>['Returns'][0]
export type FounderInsightsData = Functions<'get_founder_insights'>['Returns'][0]

// Utility types for forms and components
export interface NewCompanyForm {
  name: string
  slug: string
  tagline?: string
  country?: string
  stage_at_investment?: CompanyStage
  pitch_season?: number
  founded_year?: number
  investment_amount?: number
  post_money_valuation?: number
  website_url?: string
}

export interface NewFounderForm {
  email: string
  name?: string
  sex?: FounderSex
  role?: FounderRole
  linkedin_url?: string
  bio?: string
}

// Helper constants for form validation
export const COMPANY_STAGES: CompanyStage[] = ['pre_seed', 'seed']
export const COMPANY_STATUSES: CompanyStatus[] = ['active', 'acquihired', 'exited', 'dead']
export const FOUNDER_SEXES: FounderSex[] = ['male', 'female']
export const FOUNDER_ROLES: FounderRole[] = ['solo_founder', 'cofounder']

// Type guards for runtime validation
export const isValidCompanyStage = (value: string): value is CompanyStage => {
  return COMPANY_STAGES.includes(value as CompanyStage)
}

export const isValidFounderSex = (value: string): value is FounderSex => {
  return FOUNDER_SEXES.includes(value as FounderSex)
}

export const isValidCountryCode = (value: string): boolean => {
  return /^[A-Z]{2}$/.test(value)
}

// Utility function for safe numeric parsing
export const parseNumericField = (value: string | undefined): number | undefined => {
  if (!value || value.trim() === '') return undefined
  const parsed = parseFloat(value)
  return isNaN(parsed) ? undefined : parsed
} 