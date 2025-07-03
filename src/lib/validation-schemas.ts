import { z } from 'zod/v4'
import { COMPANY_STAGES, COMPANY_STATUSES, FOUNDER_ROLES, FOUNDER_SEXES } from './supabase-helpers'

// Base schemas for reusable validation
const positiveNumber = z.number().positive('Must be a positive number')
const optionalPositiveNumber = z.number().positive('Must be a positive number').optional().or(z.literal(''))
const urlSchema = z.string().url('Must be a valid URL').optional().or(z.literal(''))
const emailSchema = z.string().email('Must be a valid email address')

// Company validation schema
export const CompanySchema = z.object({
  // Required fields
  name: z.string().min(1, 'Company name is required').max(255, 'Company name too long'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),

  // Basic info
  tagline: z.string().max(500, 'Tagline too long').optional().or(z.literal('')),
  description_raw: z.string().max(5000, 'Description too long').optional().or(z.literal('')),
  description: z.any().optional(), // Vector embedding data (processed separately)
  website_url: urlSchema,
  company_linkedin_url: urlSchema,
  
  // Portfolio analytics fields (the new ones we added)
  country: z.string()
    .length(2, 'Must be a valid ISO country code (2 letters)')
    .regex(/^[A-Z]{2}$/, 'Country code must be uppercase')
    .optional()
    .or(z.literal('')),
  stage_at_investment: z.enum(['pre_seed', 'seed'] as const, {
    error: 'Invalid investment stage'
  }),
  pitch_season: z.number()
    .int('Season must be a whole number')
    .positive('Season must be greater than 0')
    .optional()
    .or(z.literal('')),
  fund: z.enum(['fund_i', 'fund_ii', 'fund_iii'] as const, {
    error: 'Invalid fund selection'
  }).default('fund_i'),

  // Financial and business metrics
  founded_year: z.number()
    .int('Year must be a whole number')
    .min(1800, 'Founded year seems too early')
    .max(new Date().getFullYear() + 10, 'Founded year cannot be in the distant future')
    .optional()
    .or(z.literal('')),
  
  annual_revenue_usd: optionalPositiveNumber,
  users: z.number().int('Users must be a whole number').min(0, 'Users cannot be negative').optional().or(z.literal('')),
  total_funding_usd: optionalPositiveNumber,
  employees: z.number().int('Employees must be a whole number').min(0, 'Employees cannot be negative').optional().or(z.literal('')),

  // Investment details
  investment_date: z.string().optional().or(z.literal('')),
  investment_amount: optionalPositiveNumber,
  
  // Investment instrument and conditional fields
  instrument: z.enum(['safe_post', 'safe_pre', 'convertible_note', 'equity'] as const, {
    error: 'Invalid investment instrument'
  }).default('safe_post'),
  
  // SAFE/note only fields
  conversion_cap_usd: optionalPositiveNumber,
  discount_percent: z.number().min(0, 'Discount cannot be negative').max(100, 'Discount cannot exceed 100%').optional().or(z.literal('')),
  
  // Equity only field
  post_money_valuation: optionalPositiveNumber,

  // Other fields
  industry_tags: z.string().optional().or(z.literal('')),
  latest_round: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'acquihired', 'exited', 'dead'] as const).default('active'),
  co_investors: z.string().optional().or(z.literal('')),
  pitch_episode_url: urlSchema,
  notes: z.string().max(2000, 'Notes too long').optional().or(z.literal('')),
})

// Founder validation schema
export const FounderSchema = z.object({
  // Required fields
  founder_email: emailSchema,

  // Optional fields
  founder_name: z.string().max(255, 'Name too long').optional().or(z.literal('')),
  founder_linkedin_url: urlSchema,
  founder_role: z.enum(['solo_founder', 'cofounder'] as const).default('solo_founder'),
  founder_sex: z.enum(['male', 'female'] as const, {
    error: 'Please select a valid option'
  }).optional().or(z.literal('')),
  founder_bio: z.string().max(1000, 'Bio too long').optional().or(z.literal('')),
})

// Combined schema for the complete company form
export const CompanyFormSchema = CompanySchema.merge(FounderSchema)

// Type inference for TypeScript
export type CompanyFormData = z.infer<typeof CompanyFormSchema>
export type CompanyData = z.infer<typeof CompanySchema>
export type FounderData = z.infer<typeof FounderSchema>

// Helper function to transform form data for validation
export const prepareFormDataForValidation = (formData: any) => {
  const prepared = { ...formData }
  
  // Convert string numbers to actual numbers for validation
  const numericFields = [
    'founded_year', 'annual_revenue_usd', 'users', 'total_funding_usd', 
    'employees', 'investment_amount', 'post_money_valuation', 'pitch_season',
    'conversion_cap_usd', 'discount_percent'
  ]
  
  numericFields.forEach(field => {
    if (prepared[field] && prepared[field] !== '') {
      const parsed = parseFloat(prepared[field])
      prepared[field] = isNaN(parsed) ? prepared[field] : parsed
    }
  })

  // Convert empty strings to undefined for optional fields
  Object.keys(prepared).forEach(key => {
    if (prepared[key] === '') {
      prepared[key] = undefined
    }
  })

  // Ensure country code is uppercase
  if (prepared.country && typeof prepared.country === 'string') {
    prepared.country = prepared.country.toUpperCase()
  }

  return prepared
}

// Validation result type
export interface ValidationResult {
  success: boolean
  data?: CompanyFormData
  errors?: Record<string, string[]>
} 