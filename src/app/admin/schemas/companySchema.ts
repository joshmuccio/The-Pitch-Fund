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
  description_raw: z.string().min(1, 'Company description is required').max(5000, 'Description too long (max 5000 characters)'),
  description: z.any().optional(), // Vector embedding data (processed separately)
  website_url: requiredUrlSchema,
  company_linkedin_url: urlSchema,
  
  // Portfolio analytics fields
  country: z.string()
    .length(2, 'Must be a valid ISO country code (2 letters)')
    .regex(/^[A-Z]{2}$/, 'Country code must be uppercase')
    .optional()
    .or(z.literal('')),
  stage_at_investment: z.enum(['pre_seed', 'seed', 'series_a', 'series_b', 'series_c'] as const, {
    errorMap: () => ({ message: 'Stage at investment is required' })
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
// Add conditional validation for SAFE/Note fields
.superRefine((data, ctx) => {
  // Check if instrument requires SAFE/Note fields
  const requiresSafeFields = ['safe_post', 'safe_pre', 'convertible_note'].includes(data.instrument)
  
  if (requiresSafeFields) {
    // Conversion Cap is required for SAFE/Note
    if (!data.conversion_cap_usd || data.conversion_cap_usd <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Conversion cap is required for SAFE and convertible note investments',
        path: ['conversion_cap_usd']
      })
    }
    
    // Discount is required for SAFE/Note
    if (data.discount_percent === undefined || data.discount_percent === null || data.discount_percent === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Discount percentage is required for SAFE and convertible note investments',
        path: ['discount_percent']
      })
    }
  }
  
  // For equity deals, post-money valuation is typically expected
  if (data.instrument === 'equity') {
    if (!data.post_money_valuation || data.post_money_valuation <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Post-money valuation is required for equity investments',
        path: ['post_money_valuation']
      })
    }
  }
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
    'name', 'slug', 'tagline', 'description_raw', 'website_url', 'stage_at_investment',
    'investment_date', 'investment_amount', 'round_size_usd', 'reason_for_investing',
    'country_of_incorp', 'incorporation_type'
  ]
  
  // Add conditional required fields based on instrument type
  const instrumentType = prepared.instrument
  if (['safe_post', 'safe_pre', 'convertible_note'].includes(instrumentType)) {
    requiredFields.push('conversion_cap_usd', 'discount_percent')
  }
  if (instrumentType === 'equity') {
    requiredFields.push('post_money_valuation')
  }
  
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

// Helper function to determine if conditional fields are required
export const getConditionalRequirements = (instrument: string) => {
  const isSafeOrNote = ['safe_post', 'safe_pre', 'convertible_note'].includes(instrument)
  const isEquity = instrument === 'equity'
  
  return {
    isSafeOrNote,
    isEquity,
    isConversionCapRequired: isSafeOrNote,
    isDiscountRequired: isSafeOrNote,
    isPostMoneyRequired: isEquity,
  }
}

// Test function to verify conditional validation logic
export const testConditionalValidation = () => {
  console.log('Testing conditional validation logic:')
  
  // Test SAFE Post-Money
  const safePost = getConditionalRequirements('safe_post')
  console.log('SAFE Post-Money:', safePost)
  
  // Test SAFE Pre-Money  
  const safePre = getConditionalRequirements('safe_pre')
  console.log('SAFE Pre-Money:', safePre)
  
  // Test Convertible Note
  const convertibleNote = getConditionalRequirements('convertible_note')
  console.log('Convertible Note:', convertibleNote)
  
  // Test Equity
  const equity = getConditionalRequirements('equity')
  console.log('Equity:', equity)
  
  return { safePost, safePre, convertibleNote, equity }
}

// ────────────────────────────────────────────────────────────────────
// 🔧 STEP-SPECIFIC VALIDATION SCHEMAS FOR WIZARD
// ────────────────────────────────────────────────────────────────────

// Step 1: AngelList Fields - Primary investment and company data
export const step1Schema = z.object({
  // Required fields from Step 1
  name: z.string().min(1, 'Company name is required').max(255, 'Company name too long'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  
  // Investment details
  investment_date: z.string().min(1, 'Investment date is required'),
  investment_amount: z.number().positive('Investment amount is required and must be positive'),
  
  // Investment structure
  instrument: z.enum(['safe_post', 'safe_pre', 'convertible_note', 'equity'] as const, {
    invalid_type_error: 'Invalid investment instrument'
  }).default('safe_post'),
  stage_at_investment: z.enum(['pre_seed', 'seed', 'series_a', 'series_b', 'series_c'] as const, {
    errorMap: () => ({ message: 'Stage at investment is required' })
  }),
  round_size_usd: z.number().positive('Round size is required and must be positive'),
  fund: z.enum(['fund_i', 'fund_ii', 'fund_iii'] as const, {
    invalid_type_error: 'Fund selection is required'
  }).default('fund_i'),
  
  // New required fields from Step 1
  reason_for_investing: z.string().min(1, 'Reason for investing is required').max(4000, 'Reason for investing is too long (max 4000 characters)'),
  country_of_incorp: z
    .string()
    .min(1, 'Country of incorporation is required')
    .length(2, 'Use ISO-3166 alpha-2 country code (e.g. US)')
    .regex(/^[A-Z]{2}$/, 'Country code must be uppercase')
    .transform(val => val?.toUpperCase()),
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
  description_raw: z.string().min(1, 'Company description is required').max(5000, 'Description too long (max 5000 characters)'),
  
  // Optional fields from Step 1
  conversion_cap_usd: optionalPositiveNumber,
  discount_percent: z.number().min(0, 'Discount cannot be negative').max(100, 'Discount cannot exceed 100%').optional().or(z.literal('')),
  post_money_valuation: optionalPositiveNumber,
  has_pro_rata_rights: z.boolean().default(false),
  co_investors: z.string().optional().or(z.literal('')),
  founder_name: z.string().max(255, 'Name too long').optional().or(z.literal('')),
})
// Add conditional validation for SAFE/Note fields in Step 1
.superRefine((data, ctx) => {
  // Check if instrument requires SAFE/Note fields
  const requiresSafeFields = ['safe_post', 'safe_pre', 'convertible_note'].includes(data.instrument)
  
  if (requiresSafeFields) {
    // Conversion Cap is required for SAFE/Note
    if (!data.conversion_cap_usd || data.conversion_cap_usd <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Conversion cap is required for SAFE and convertible note investments',
        path: ['conversion_cap_usd']
      })
    }
    
    // Discount is required for SAFE/Note
    if (data.discount_percent === undefined || data.discount_percent === null || data.discount_percent === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Discount percentage is required for SAFE and convertible note investments',
        path: ['discount_percent']
      })
    }
  }
  
  // For equity deals, post-money valuation is typically expected
  if (data.instrument === 'equity') {
    if (!data.post_money_valuation || data.post_money_valuation <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Post-money valuation is required for equity investments',
        path: ['post_money_valuation']
      })
    }
  }
})

// Step 2: Additional Information - Company metadata and founder details
export const step2Schema = z.object({
  // Required fields from Step 2
  tagline: z.string().min(1, 'Tagline is required').max(500, 'Tagline too long'),
  website_url: requiredUrlSchema,
  founder_email: z.string().email('Must be a valid email address').min(1, 'Founder email is required'),
  
  // Optional fields from Step 2
  industry_tags: z.string().optional().or(z.literal('')),
  pitch_episode_url: urlSchema,
  company_linkedin_url: urlSchema,
  founder_linkedin_url: urlSchema,
  founder_role: z.enum(['solo_founder', 'cofounder'] as const).default('solo_founder'),
  founder_sex: z.enum(['male', 'female'] as const, {
    invalid_type_error: 'Please select a valid option'
  }).optional().or(z.literal('')),
  founder_bio: z.string().max(1000, 'Bio too long').optional().or(z.literal('')),
  
  // System fields
  status: z.enum(['active', 'acquihired', 'exited', 'dead'] as const).default('active'),
  country: z.string()
    .length(2, 'Must be a valid ISO country code (2 letters)')
    .regex(/^[A-Z]{2}$/, 'Country code must be uppercase')
    .optional()
    .or(z.literal('')),
  pitch_season: z.number()
    .int('Season must be a whole number')
    .positive('Season must be greater than 0')
    .optional()
    .or(z.literal('')),
  notes: z.string().max(2000, 'Notes too long').optional().or(z.literal('')),
  description: z.any().optional(), // Vector embedding data
})

// Helper function to get field names for each step
export const getStepFieldNames = (step: number): string[] => {
  switch (step) {
    case 0: // Step 1
      return [
        'name',
        'slug',
        'investment_date',
        'investment_amount',
        'instrument',
        'stage_at_investment',
        'round_size_usd',
        'fund',
        'reason_for_investing',
        'country_of_incorp',
        'incorporation_type',
        'description_raw',
        'conversion_cap_usd',
        'discount_percent',
        'post_money_valuation',
        'has_pro_rata_rights',
        'co_investors',
        'founder_name'
      ]
    case 1: // Step 2
      return [
        'tagline',
        'website_url',
        'founder_email',
        'industry_tags',
        'pitch_episode_url',
        'company_linkedin_url',
        'founder_linkedin_url',
        'founder_role',
        'founder_sex',
        'founder_bio',
        'status',
        'country',
        'pitch_season',
        'notes'
      ]
    default:
      return []
  }
}

// Helper function to validate a specific step
export const validateStep = async (step: number, data: any): Promise<{ isValid: boolean; errors: any }> => {
  const fieldNames = getStepFieldNames(step)
  const stepData = Object.fromEntries(
    Object.entries(data).filter(([key]) => fieldNames.includes(key))
  )
  
  // Prepare data for validation
  const preparedData = prepareFormDataForValidation(stepData)
  
  try {
    if (step === 0) {
      await step1Schema.parseAsync(preparedData)
    } else if (step === 1) {
      await step2Schema.parseAsync(preparedData)
    }
    return { isValid: true, errors: {} }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const fieldErrors: any = {}
      error.errors.forEach((err: z.ZodIssue) => {
        const fieldName = err.path[0] as string
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = []
        }
        fieldErrors[fieldName].push(err.message)
      })
      return { isValid: false, errors: fieldErrors }
    }
    return { isValid: false, errors: { general: ['Validation failed'] } }
  }
}

// Type exports for step schemas
export type Step1FormValues = z.infer<typeof step1Schema>
export type Step2FormValues = z.infer<typeof step2Schema> 