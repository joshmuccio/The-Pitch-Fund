import { z } from 'zod'

// Base schemas for reusable validation
const positiveNumber = z.number().positive('Must be a positive number')
const optionalPositiveNumber = z.number().positive('Must be a positive number').optional().or(z.literal(''))
const urlSchema = z.string().url('Must be a valid URL').optional().or(z.literal(''))
const requiredUrlSchema = z.string().url('Must be a valid URL').min(1, 'This field is required')
const emailSchema = z.string().email('Must be a valid email address')

// Pitch episode URL with domain validation (required)
const pitchEpisodeUrlSchema = z.string().min(1, 'Pitch episode URL is required')
  .refine((val) => {
    // Check if it's a valid URL
    if (!val || val.trim() === '') return false
    
    // Check if it's a valid URL
    try {
      const url = new URL(val)
      // Check if domain contains thepitch.show
      return url.hostname.toLowerCase().includes('thepitch.show')
    } catch {
      return false
    }
  }, {
    message: 'Pitch episode URL must be a valid URL from thepitch.show domain'
  })

// 🚀 Async URL validator that checks if URL returns 200 status
// Handles redirects (301/302) and sites blocking HEAD requests automatically
export const urlMust200 = z
  .string()
  .url('Invalid URL')
  .superRefine(async (val, ctx) => {
    console.log('🔍 [Zod urlMust200] Validation called for:', val);
    
    // Skip validation for empty or whitespace-only strings
    if (!val || val.trim() === '') {
      console.log('⏭️ [Zod urlMust200] Skipping validation for empty value');
      return; // Let the base string validation handle empty values
    }
    
    try {
      console.log('🌐 [Zod urlMust200] Calling API for URL:', val);
      const res = await fetch(`/api/check-url?url=${encodeURIComponent(val)}`);
      const json = await res.json();
      console.log('📡 [Zod urlMust200] API response:', json);
      
      if (!json.ok) {
        console.log('❌ [Zod urlMust200] URL validation failed:', json.status);
        ctx.addIssue({ 
          code: 'custom', 
          message: `URL responded ${json.status ?? 'with an error'}. Please check the URL and try again.` 
        });
      } else {
        console.log('✅ [Zod urlMust200] URL validation passed');
      }
    } catch (error) {
      console.log('💥 [Zod urlMust200] API call failed:', error);
      ctx.addIssue({ 
        code: 'custom', 
        message: 'Unable to validate URL. Please check your connection and try again.' 
      });
    }
    // Note: Redirect handling (finalUrl) is handled in the form validation layer
  })

// ────────────────────────────────────────────────────────────────────
// 🚀 FOUNDER SCHEMA FOR MULTIPLE FOUNDERS SUPPORT
// ────────────────────────────────────────────────────────────────────
// Founder schema for multiple founders support (moved here for proper ordering)
export const founderSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  email: z.string().email('Must be a valid email address').min(1, 'Email is required'),
  linkedin_url: z.string().url('Must be a valid URL').min(1, 'LinkedIn URL is required'),
  role: z.enum(['founder', 'cofounder'] as const).default('founder'),
  sex: z.string().min(1, 'Sex is required').refine((val) => ['male', 'female'].includes(val), {
    message: 'Please select a valid option'
  }),
  bio: z.string().max(1000, 'Bio too long').optional().or(z.literal('')), // STAYS OPTIONAL
})

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
  website_url: urlMust200,
  company_linkedin_url: urlSchema,
  logo_url: z.string().url('Must be a valid URL').min(1, 'Company logo is required'),
  svg_logo_url: z.string().url('Must be a valid URL').optional().or(z.literal('')), // Optional SVG version of logo
  
  // Portfolio analytics fields
  country: z.string()
    .length(2, 'Must be a valid ISO country code (2 letters)')
    .regex(/^[A-Z]{2}$/, 'Country code must be uppercase')
    .optional()
    .or(z.literal('')),
  stage_at_investment: z.enum(['pre_seed', 'seed'] as const, {
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
  }),
  
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
  industry_tags: z.string().min(1, 'Industry tags are required'),
  // 🚀 NEW AI-POWERED FIELDS
  business_model_tags: z.string().min(1, 'Business model tags are required'),
  keywords: z.string().min(1, 'Keywords are required').optional(), // TEMPORARILY OPTIONAL FOR DEBUGGING
  pitch_transcript: z.string().min(1, 'Pitch transcript is required').max(500000, 'Transcript too long (max 500,000 characters)'),
  
  status: z.enum(['active', 'acquihired', 'exited', 'dead'] as const).default('active'),
  co_investors: z.string().optional().or(z.literal('')),
  pitch_episode_url: pitchEpisodeUrlSchema,
  episode_publish_date: z.string().min(1, 'Episode publish date is required'),
  
  // 🚀 NEW EPISODE EXTRACTION FIELDS
  episode_title: z.string().min(1, 'Episode title is required'),
  episode_season: z.number()
    .int('Season must be a whole number')
    .min(1, 'Season must be at least 1')
    .max(50, 'Season must be 50 or less'),
  episode_show_notes: z.string().min(1, 'Episode show notes are required').max(10000, 'Show notes too long (max 10,000 characters)'),
  
  // 🚀 EPISODE PODCAST PLATFORM URLS
  youtube_url: requiredUrlSchema,
  apple_podcasts_url: requiredUrlSchema,
  spotify_url: requiredUrlSchema,
  
  notes: z.string().max(2000, 'Notes too long').optional().or(z.literal('')),

  // Founder fields (can be included here or kept separate)
  founder_email: z.string().email('Must be a valid email address').optional().or(z.literal('')),
  founder_name: z.string().max(255, 'Name too long').optional().or(z.literal('')),
  founder_first_name: z.string().max(255, 'First name too long').optional().or(z.literal('')),
  founder_last_name: z.string().max(255, 'Last name too long').optional().or(z.literal('')),
  founder_title: z.string().max(255, 'Title too long').optional().or(z.literal('')),
  founder_linkedin_url: urlSchema,
      founder_role: z.enum(['founder', 'cofounder'] as const).default('founder'),
  founder_sex: z.enum(['male', 'female'] as const, {
    invalid_type_error: 'Please select a valid option'
  }).optional().or(z.literal('')),
  founder_bio: z.string().max(1000, 'Bio too long').optional().or(z.literal('')),

  // Company HQ location fields
  legal_name: z.string().max(255, 'Legal name too long').optional().or(z.literal('')),
  hq_address_line_1: z.string().max(255, 'Address line 1 too long').optional().or(z.literal('')),
  hq_address_line_2: z.string().max(255, 'Address line 2 too long').optional().or(z.literal('')),
  hq_city: z.string().max(100, 'City name too long').optional().or(z.literal('')),
  hq_state: z.string().max(100, 'State/province too long').optional().or(z.literal('')),
  hq_zip_code: z.string().max(20, 'ZIP/postal code too long').optional().or(z.literal('')),
  hq_country: z.string()
    .length(2, 'Must be a valid ISO country code (2 letters)')
    .regex(/^[A-Z]{2}$/, 'Country code must be uppercase')
    .optional()
    .or(z.literal('')),
  
  // HQ Coordinates from Mapbox geocoding
  hq_latitude: z.number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional(),
  hq_longitude: z.number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional(),
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
    
    // Post-money valuation must NOT be set for SAFE/Note (database constraint)
    if (data.post_money_valuation !== undefined && data.post_money_valuation !== null && data.post_money_valuation !== '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Post-money valuation cannot be set for SAFE and convertible note investments',
        path: ['post_money_valuation']
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
    
    // Conversion fields must NOT be set for equity (database constraint)
    if (data.conversion_cap_usd !== undefined && data.conversion_cap_usd !== null && data.conversion_cap_usd !== '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Conversion cap cannot be set for equity investments',
        path: ['conversion_cap_usd']
      })
    }
    
    if (data.discount_percent !== undefined && data.discount_percent !== null && data.discount_percent !== '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Discount percentage cannot be set for equity investments',
        path: ['discount_percent']
      })
    }
  }
})

// ────────────────────────────────────────────────────────────────────
// 🚀 STEP-SPECIFIC VALIDATION SCHEMAS FOR WIZARD
// ────────────────────────────────────────────────────────────────────

// Step 1: AngelList Fields - Primary investment and company data (UNCHANGED)
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
  }),
  stage_at_investment: z.enum(['pre_seed', 'seed'] as const, {
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
    
    // Post-money valuation must NOT be set for SAFE/Note (database constraint)
    if (data.post_money_valuation !== undefined && data.post_money_valuation !== null && data.post_money_valuation !== '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Post-money valuation cannot be set for SAFE and convertible note investments',
        path: ['post_money_valuation']
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

// Step 2: Additional Information - Company HQ location and founder details (UPDATED)
export const step2Schema = z.object({
  // Company HQ location fields - NOW REQUIRED (except Address Line 2)
  legal_name: z.string().min(1, 'Legal name is required').max(255, 'Legal name too long'),
  hq_address_line_1: z.string().min(1, 'Address line 1 is required').max(255, 'Address line 1 too long'),
  hq_address_line_2: z.string().max(255, 'Address line 2 too long').optional().or(z.literal('')), // STAYS OPTIONAL
  hq_city: z.string().min(1, 'City is required').max(100, 'City name too long'),
  hq_state: z.string().min(1, 'State/province is required').max(100, 'State/province too long'),
  hq_zip_code: z.string().min(1, 'ZIP/postal code is required').max(20, 'ZIP/postal code too long'),
  hq_country: z.string()
    .min(1, 'Country is required')
    .length(2, 'Must be a valid ISO country code (2 letters)')
    .regex(/^[A-Z]{2}$/, 'Country code must be uppercase'),
  
  // HQ Coordinates from Mapbox geocoding (optional - populated automatically)
  hq_latitude: z.number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional(),
  hq_longitude: z.number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional(),

  // Multiple founders support
  founders: z
    .array(founderSchema)
    .min(1, 'At least one founder is required')
    .max(3, 'Maximum 3 founders allowed'),
  
  // Company fields - NOW REQUIRED
  company_linkedin_url: z.string().url('Must be a valid URL').min(1, 'Company LinkedIn URL is required'),
  logo_url: z.string().url('Must be a valid URL').min(1, 'Company logo is required'),
  svg_logo_url: z.string().url('Must be a valid URL').optional().or(z.literal('')), // Optional SVG version of logo
  

  
  // System fields - KEPT OPTIONAL (not shown in Step 2 UI)
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

// Step 3: Company Marketing & Pitch Information (NEW)
export const step3Schema = z.object({
  // Required fields from Step 3
  tagline: z.string().min(1, 'Tagline is required').max(500, 'Tagline too long'),
  website_url: z.string().url('Must be a valid URL').min(1, 'Website URL is required'),
  
  // Required marketing fields
  industry_tags: z.string().min(1, 'Industry tags are required'),
  // 🚀 NEW AI-POWERED FIELDS
  business_model_tags: z.string().min(1, 'Business model tags are required'),
  keywords: z.string().min(1, 'Keywords are required').optional(), // TEMPORARILY OPTIONAL FOR DEBUGGING
  pitch_transcript: z.string().min(1, 'Pitch transcript is required').max(500000, 'Transcript too long (max 500,000 characters)'),
  
  // Episode information
  pitch_episode_url: pitchEpisodeUrlSchema,
  episode_publish_date: z.string().min(1, 'Episode publish date is required'),
  episode_title: z.string().min(1, 'Episode title is required'),
  episode_season: z.number().int('Season must be a whole number').min(1, 'Season must be at least 1').max(50, 'Season must be 50 or less'),
  episode_show_notes: z.string().min(1, 'Episode show notes are required').max(10000, 'Show notes too long (max 10,000 characters)'),
  
  // Podcast platform URLs
  youtube_url: requiredUrlSchema,
  apple_podcasts_url: requiredUrlSchema,
  spotify_url: requiredUrlSchema,
})

// Helper function to get field names for each step (UPDATED)
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
    case 1: // Step 2 (UPDATED for multiple founders)
      return [
        'founders', // Now an array instead of individual fields
        'legal_name',
        'hq_address_line_1',
        'hq_address_line_2',
        'hq_city',
        'hq_state',
        'hq_zip_code',
        'hq_country',
        'company_linkedin_url',
        'logo_url',
        'svg_logo_url',
        'status',
        'country',
        'pitch_season',
        'notes'
      ]
    case 2: // Step 3 (NEW - Marketing & Pitch Information)
      return [
        'tagline',
        'website_url',
        'industry_tags',
        'business_model_tags',
        'keywords',
        'pitch_transcript',
        'pitch_episode_url',
        'episode_publish_date',
        'episode_title',
        'episode_season',
        'episode_show_notes',
        'youtube_url',
        'apple_podcasts_url',
        'spotify_url'
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
    } else if (step === 2) {
      await step3Schema.parseAsync(preparedData)
    }
    return { isValid: true, errors: {} }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const fieldErrors: any = {}
      error.errors.forEach((err: z.ZodIssue) => {
        // Build the full field path for nested errors (e.g., "founders.0.title")
        const fieldName = err.path.join('.')
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
export type CompanyFormValues = z.infer<typeof companySchema>
export type Step1FormValues = z.infer<typeof step1Schema>
export type Step2FormValues = z.infer<typeof step2Schema>
export type Step3FormValues = z.infer<typeof step3Schema>
export type FounderFormValues = z.infer<typeof founderSchema>

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
      // If parsing results in NaN, set to undefined instead of keeping NaN
      prepared[field] = isNaN(parsed) ? undefined : parsed
    }
  })
  
  // Handle NaN values - convert them to undefined for optional fields
  Object.keys(prepared).forEach(key => {
    if (prepared[key] === 'NaN' || (typeof prepared[key] === 'number' && isNaN(prepared[key]))) {
      prepared[key] = undefined
    }
  })

  // Handle null values - convert them to undefined for optional fields
  // This fixes issues when data is restored from localStorage
  Object.keys(prepared).forEach(key => {
    if (prepared[key] === null) {
      prepared[key] = undefined
    }
  })

  // Convert empty strings to undefined for optional fields EXCEPT required fields
  const requiredFields = [
    'name', 'slug', 'tagline', 'description_raw', 'website_url', 'stage_at_investment',
    'investment_date', 'investment_amount', 'round_size_usd', 'reason_for_investing',
    'country_of_incorp', 'incorporation_type',
    // Step 2 required fields (only fields visible in UI)
    'legal_name', 'hq_address_line_1', 'hq_city', 'hq_state', 'hq_zip_code', 'hq_country',
    'company_linkedin_url', 'logo_url', 'svg_logo_url',
    // Step 3 required fields (NEW - AI-powered fields)
    'industry_tags', 'business_model_tags', 'pitch_transcript'
  ]
  
  // Add conditional required fields based on instrument type
  const instrumentType = prepared.instrument
  if (['safe_post', 'safe_pre', 'convertible_note'].includes(instrumentType)) {
    requiredFields.push('conversion_cap_usd', 'discount_percent')
    // Clear post_money_valuation for SAFE/Note to avoid constraint violation
    prepared.post_money_valuation = undefined
  }
  if (instrumentType === 'equity') {
    requiredFields.push('post_money_valuation')
    // Clear conversion fields for equity to avoid constraint violation
    prepared.conversion_cap_usd = undefined
    prepared.discount_percent = undefined
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

// ────────────────────────────────────────────────────────────────────
// 🔄 PARTIAL SCHEMA FOR REAL-TIME VALIDATION
// ────────────────────────────────────────────────────────────────────
// This schema is used for real-time validation (as-you-type) and is more
// forgiving than the full schema. It validates format/type but doesn't
// enforce all required fields until step navigation.

export const partialCompanySchema = z.object({
  // Basic company info - optional for real-time, validated on step navigation
  name: z.string().max(255, 'Company name too long').optional(),
  slug: z.string()
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9-]*$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional().or(z.literal('')),
  
  // Investment details - validate format but not required
  investment_date: z.string().optional().or(z.literal('')),
  investment_amount: z.number().positive('Investment amount must be positive').optional(),
  
  // Investment structure
  instrument: z.enum(['safe_post', 'safe_pre', 'convertible_note', 'equity'] as const).optional(),
  stage_at_investment: z.enum(['pre_seed', 'seed'] as const).optional(),
  round_size_usd: z.number().positive('Round size must be positive').optional(),
  fund: z.enum(['fund_i', 'fund_ii', 'fund_iii'] as const).optional(),
  
  // Text fields - validate length but not required
  reason_for_investing: z.string().max(4000, 'Reason for investing is too long').optional().or(z.literal('')),
  description_raw: z.string().max(5000, 'Description too long').optional().or(z.literal('')),
  tagline: z.string().max(500, 'Tagline too long').optional().or(z.literal('')),
  
  // Location fields - validate format
  country_of_incorp: z
    .string()
    .length(2, 'Use ISO-3166 alpha-2 country code (e.g. US)')
    .regex(/^[A-Z]{2}$/, 'Country code must be uppercase')
    .optional().or(z.literal('')),
  incorporation_type: z.enum([
    'c_corp', 's_corp', 'llc', 'bcorp', 'gmbh', 'ltd', 'plc', 'other',
  ]).optional(),
  
  // URLs - validate format when provided (async validation only during step transitions)
  website_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  company_linkedin_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  logo_url: z.string().url('Must be a valid URL').optional().or(z.literal('')), // Keep optional in partial schema for real-time validation
  svg_logo_url: z.string().url('Must be a valid URL').optional().or(z.literal('')), // Keep optional in partial schema for real-time validation
  pitch_episode_url: z.string().url('Must be a valid URL').min(1, 'Pitch episode URL is required'),
  episode_publish_date: z.string().min(1, 'Episode publish date is required'),
  
  // 🚀 NEW EPISODE EXTRACTION FIELDS
  episode_title: z.string().optional().or(z.literal('')),
  episode_season: z.number()
    .int('Season must be a whole number')
    .min(1, 'Season must be at least 1')
    .max(50, 'Season must be 50 or less')
    .optional()
    .or(z.literal('')),
  episode_show_notes: z.string().max(10000, 'Show notes too long (max 10,000 characters)').optional().or(z.literal('')),
  
  // 🚀 EPISODE PODCAST PLATFORM URLS
  youtube_url: urlSchema,
  apple_podcasts_url: urlSchema,
  spotify_url: urlSchema,
  
  // Company HQ location - validate format
  legal_name: z.string().max(255, 'Legal name too long').optional().or(z.literal('')),
  hq_address_line_1: z.string().max(255, 'Address line 1 too long').optional().or(z.literal('')),
  hq_address_line_2: z.string().max(255, 'Address line 2 too long').optional().or(z.literal('')),
  hq_city: z.string().max(100, 'City name too long').optional().or(z.literal('')),
  hq_state: z.string().max(100, 'State/province too long').optional().or(z.literal('')),
  hq_zip_code: z.string().max(20, 'ZIP/postal code too long').optional().or(z.literal('')),
  hq_country: z.string()
    .length(2, 'Must be a valid ISO country code (2 letters)')
    .regex(/^[A-Z]{2}$/, 'Country code must be uppercase')
    .optional().or(z.literal('')),
  
  // Founders array - validate format when provided
  founders: z.array(z.object({
    first_name: z.string().max(100, 'First name too long').optional().or(z.literal('')),
    last_name: z.string().max(100, 'Last name too long').optional().or(z.literal('')),
    email: z.string().email('Must be a valid email').optional().or(z.literal('')),
    title: z.string().max(200, 'Title too long').optional().or(z.literal('')),
    linkedin_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    role: z.enum(['founder', 'cofounder']).optional(),
    sex: z.enum(['male', 'female']).optional().or(z.literal('')),
    bio: z.string().max(1000, 'Bio too long').optional().or(z.literal('')),
  })).optional(),
  
  // Investment-specific fields - validate format
  conversion_cap_usd: z.number().positive('Conversion cap must be positive').optional(),
  discount_percent: z.number().min(0, 'Discount cannot be negative').max(100, 'Discount cannot exceed 100%').optional(),
  post_money_valuation: z.number().positive('Post-money valuation must be positive').optional(),
  has_pro_rata_rights: z.boolean().optional(),
  
  // Other fields
  co_investors: z.string().optional().or(z.literal('')),
  founder_name: z.string().max(255, 'Name too long').optional().or(z.literal('')),
  industry_tags: z.string().optional().or(z.literal('')), // Keep optional in partial schema for real-time validation
  business_model_tags: z.string().optional().or(z.literal('')), // Keep optional in partial schema for real-time validation
  pitch_transcript: z.string().max(500000, 'Transcript too long (max 500,000 characters)').optional().or(z.literal('')), // Keep optional in partial schema for real-time validation
  status: z.enum(['active', 'acquihired', 'exited', 'dead']).optional(),
  country: z.string()
    .length(2, 'Must be a valid ISO country code (2 letters)')
    .regex(/^[A-Z]{2}$/, 'Country code must be uppercase')
    .optional().or(z.literal('')),
  pitch_season: z.number().int('Season must be a whole number').positive('Season must be greater than 0').optional(),
  notes: z.string().max(2000, 'Notes too long').optional().or(z.literal('')),
  description: z.any().optional(),
})

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
// 📝 LEGACY FOUNDER FIELDS (TO BE REMOVED AFTER MIGRATION)
// ────────────────────────────────────────────────────────────────────
// These are kept temporarily for backward compatibility but should be 
// removed once the form is updated to use the founders array:
//
// founder_email, founder_first_name, founder_last_name, founder_title,
// founder_linkedin_url, founder_role, founder_sex, founder_bio
// ──────────────────────────────────────────────────────────────────── 