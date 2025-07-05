import { z } from 'zod'

// Base schemas for reusable validation
const positiveNumber = z.number().positive('Must be a positive number')
const optionalPositiveNumber = z.number().positive('Must be a positive number').optional().or(z.literal(''))
const urlSchema = z.string().url('Must be a valid URL').optional().or(z.literal(''))
const requiredUrlSchema = z.string().url('Must be a valid URL').min(1, 'This field is required')
const emailSchema = z.string().email('Must be a valid email address')

// Extended company schema with all fields including the 5 new investment fields
export const companySchema = z.object({
  // Required fields
  name: z.string().min(1, 'Company name is required').max(255, 'Company name too long'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),

  // Basic info - NOW REQUIRED
  tagline: z.string().min(1, 'Tagline is required').max(500, 'Tagline too long'),
  description_raw: z.string().max(5000, 'Description too long').optional().or(z.literal('')),
  description: z.any().optional(), // Vector embedding data (processed separately)
  website_url: requiredUrlSchema,
  company_linkedin_url: urlSchema,
  
  // Portfolio analytics fields
  country: z.string()
    .length(2, 'Must be a valid ISO country code (2 letters)')
    .regex(/^[A-Z]{2}$/, 'Country code must be uppercase')
    .optional()
    .or(z.literal('')),
  stage_at_investment: z.enum(['pre_seed', 'seed'] as const, {
    invalid_type_error: 'Invalid investment stage'
  }),
  pitch_season: z.number()
    .int('Season must be a whole number')
    .positive('Season must be greater than 0')
    .optional()
    .or(z.literal('')),
  fund: z.enum(['fund_i', 'fund_ii', 'fund_iii'] as const, {
    invalid_type_error: 'Fund selection is required'
  }).default('fund_i'),

  // Investment details - NOW REQUIRED
  investment_date: z.string().min(1, 'Investment date is required'),
  investment_amount: z.number().positive('Investment amount is required and must be positive'),
  
  // Investment instrument and conditional fields
  instrument: z.enum(['safe_post', 'safe_pre', 'convertible_note', 'equity'] as const, {
    invalid_type_error: 'Invalid investment instrument'
  }).default('safe_post'),
  
  // SAFE/note only fields
  conversion_cap_usd: optionalPositiveNumber,
  discount_percent: z.number().min(0, 'Discount cannot be negative').max(100, 'Discount cannot exceed 100%').optional().or(z.literal('')),
  
  // Equity only field
  post_money_valuation: optionalPositiveNumber,

  // ────────────────────────────────────────────────────────────────────
  // 🚀 NEW INVESTMENT FIELDS (5 fields added) - SOME NOW REQUIRED
  // ────────────────────────────────────────────────────────────────────
  
  // 1. Full target round size in USD - NOW REQUIRED
  round_size_usd: z.number().positive('Round size is required and must be positive'),

  // 2. Whether SAFE/Note includes pro-rata clause
  has_pro_rata_rights: z.boolean().default(false),

  // 3. Internal memo for IC / LP letter - NOW REQUIRED
  reason_for_investing: z.string().min(1, 'Reason for investing is required').max(4000, 'Reason for investing is too long (max 4000 characters)'),

  // 4. ISO-3166-1 alpha-2 country code for incorporation - NOW REQUIRED
  country_of_incorp: z
    .string()
    .min(1, 'Country of incorporation is required')
    .length(2, 'Use ISO-3166 alpha-2 country code (e.g. US)')
    .regex(/^[A-Z]{2}$/, 'Country code must be uppercase')
    .transform(val => val?.toUpperCase()),

  // 5. Legal entity type at formation - NOW REQUIRED
  incorporation_type: z.enum([
    'c_corp',
    's_corp',
    'llc',
    'bcorp',
    'gmbh',
    'ltd',
    'plc',
    'other',
  ], {
    invalid_type_error: 'Incorporation type is required'
  }),

  // ────────────────────────────────────────────────────────────────────

  // Other existing fields
  industry_tags: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'acquihired', 'exited', 'dead'] as const).default('active'),
  co_investors: z.string().optional().or(z.literal('')),
  pitch_episode_url: urlSchema,
  notes: z.string().max(2000, 'Notes too long').optional().or(z.literal('')),

  // Founder fields (can be included here or kept separate)
  founder_email: z.string().email('Must be a valid email address').optional().or(z.literal('')),
  founder_name: z.string().max(255, 'Name too long').optional().or(z.literal('')),
  founder_linkedin_url: urlSchema,
  founder_role: z.enum(['solo_founder', 'cofounder'] as const).default('solo_founder'),
  founder_sex: z.enum(['male', 'female'] as const, {
    invalid_type_error: 'Please select a valid option'
  }).optional().or(z.literal('')),
  founder_bio: z.string().max(1000, 'Bio too long').optional().or(z.literal('')),
})

// Type inference for TypeScript
export type CompanyFormValues = z.infer<typeof companySchema>

// Helper function to transform form data for validation (updated for new fields)
export const prepareFormDataForValidation = (formData: any) => {
  const prepared = { ...formData }
  
  // Convert string numbers to actual numbers for validation
  const numericFields = [
    'investment_amount', 'post_money_valuation', 'pitch_season',
    'conversion_cap_usd', 'discount_percent', 'round_size_usd' // Added new field
  ]
  
  numericFields.forEach(field => {
    if (prepared[field] && prepared[field] !== '') {
      const parsed = parseFloat(prepared[field])
      prepared[field] = isNaN(parsed) ? prepared[field] : parsed
    }
  })

  // Convert empty strings to undefined for optional fields EXCEPT required fields
  const requiredFields = [
    'name', 'slug', 'tagline', 'website_url', 'investment_date', 
    'investment_amount', 'round_size_usd', 'reason_for_investing',
    'country_of_incorp', 'incorporation_type'
  ]
  
  Object.keys(prepared).forEach(key => {
    if (prepared[key] === '' && !requiredFields.includes(key)) {
      prepared[key] = undefined
    }
  })

  // Ensure country codes are uppercase
  if (prepared.country && typeof prepared.country === 'string') {
    prepared.country = prepared.country.toUpperCase()
  }
  if (prepared.country_of_incorp && typeof prepared.country_of_incorp === 'string') {
    prepared.country_of_incorp = prepared.country_of_incorp.toUpperCase()
  }

  // Convert has_pro_rata_rights to boolean if it's a string
  if (typeof prepared.has_pro_rata_rights === 'string') {
    prepared.has_pro_rata_rights = prepared.has_pro_rata_rights === 'true'
  }

  // Ensure status is always 'active' for new investments (when no existing company data)
  if (!prepared.id) {
    prepared.status = 'active'
  }

  return prepared
}

// Validation result type
export interface ValidationResult {
  success: boolean
  data?: CompanyFormValues
  errors?: Record<string, string[]>
} 