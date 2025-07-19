// Form validation utilities for production-ready data integrity

import { type CompanyFormValues } from '@/app/admin/schemas/companySchema'
import { type VcInvestment } from '@/app/admin/investments/new/steps/InvestmentTrackingStep'

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Comprehensive pre-submission validation for investment form data
 */
export function validateInvestmentSubmission(
  formData: CompanyFormValues,
  investmentData: VcInvestment[]
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate required fields that might be missed
  const requiredFields = {
    name: 'Company name',
    slug: 'Company slug',
    tagline: 'Tagline',
    description_raw: 'Company description',
    website_url: 'Website URL',
    logo_url: 'Logo URL',
    stage_at_investment: 'Investment stage',
    fund: 'Fund',
    investment_date: 'Investment date',
    investment_amount: 'Investment amount',
    instrument: 'Investment instrument',
    round_size_usd: 'Round size',
    reason_for_investing: 'Reason for investing',
    country_of_incorp: 'Country of incorporation',
    incorporation_type: 'Incorporation type',
    industry_tags: 'Industry tags',
    business_model_tags: 'Business model tags',
    // keywords: 'Keywords', // TEMPORARILY DISABLED - debugging keywords issue
    pitch_transcript: 'Pitch transcript',
    pitch_episode_url: 'Episode URL',
    episode_publish_date: 'Episode publish date',
    episode_title: 'Episode title',
    episode_season: 'Episode season',
    episode_show_notes: 'Episode show notes',
    youtube_url: 'YouTube URL',
    apple_podcasts_url: 'Apple Podcasts URL',
    spotify_url: 'Spotify URL'
  }

  // Check for missing required fields
  Object.entries(requiredFields).forEach(([field, label]) => {
    const value = (formData as any)[field]
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push(`${label} is required but missing`)
    }
  })

  // Validate investment amounts
  if (formData.investment_amount && formData.investment_amount <= 0) {
    errors.push('Investment amount must be greater than 0')
  }

  if (formData.round_size_usd && formData.round_size_usd <= 0) {
    errors.push('Round size must be greater than 0')
  }

  // Validate investment tracking data
  const investedVcs = investmentData.filter(inv => inv.isInvested)
  investedVcs.forEach(investment => {
    if (!investment.investmentAmount || investment.investmentAmount <= 0) {
      errors.push(`${investment.vcName}: Investment amount required when marked as invested`)
    }
    if (!investment.investmentDate) {
      errors.push(`${investment.vcName}: Investment date required when marked as invested`)
    }
  })

  // Validate conditional fields based on instrument
  if (['safe_post', 'safe_pre', 'convertible_note'].includes(formData.instrument)) {
    if (!formData.conversion_cap_usd || formData.conversion_cap_usd <= 0) {
      errors.push('Conversion cap is required for SAFE and convertible note investments')
    }
  }

  if (formData.instrument === 'equity') {
    if (!formData.post_money_valuation || formData.post_money_valuation <= 0) {
      errors.push('Post-money valuation is required for equity investments')
    }
  }

  // Validate data types
  if (typeof formData.episode_season !== 'number') {
    warnings.push('Episode season should be a number')
  }

  // Validate URLs
  const urlFields = ['website_url', 'logo_url', 'pitch_episode_url', 'youtube_url', 'apple_podcasts_url', 'spotify_url']
  urlFields.forEach(field => {
    const url = (formData as any)[field]
    if (url && typeof url === 'string') {
      try {
        new URL(url)
      } catch {
        errors.push(`${field.replace('_', ' ')} is not a valid URL: ${url}`)
      }
    }
  })

  // Check for logical inconsistencies
  if (formData.investment_amount && formData.round_size_usd) {
    if (formData.investment_amount > formData.round_size_usd) {
      warnings.push('Investment amount is larger than total round size')
    }
  }

  const totalVcInvestments = investmentData
    .filter(inv => inv.isInvested && inv.investmentAmount)
    .reduce((sum, inv) => sum + (inv.investmentAmount || 0), 0)

  if (totalVcInvestments > 0 && formData.investment_amount) {
    if (totalVcInvestments > formData.investment_amount) {
      warnings.push('Total VC investments exceed our investment amount')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Clean and normalize form data before submission
 */
export function cleanFormData(formData: CompanyFormValues): CompanyFormValues {
  const cleaned = { ...formData }

  // Trim string fields
  const stringFields = ['name', 'slug', 'tagline', 'description_raw', 'website_url', 'company_linkedin_url', 'logo_url']
  stringFields.forEach(field => {
    const value = (cleaned as any)[field]
    if (typeof value === 'string') {
      (cleaned as any)[field] = value.trim()
    }
  })

  // Ensure episode_season is a number and handle "Season 13" format
  if (typeof (cleaned as any).episode_season === 'string') {
    // Handle "Season 13" format by extracting the number
    const seasonMatch = (cleaned as any).episode_season.match(/season\s*(\d+)/i) || (cleaned as any).episode_season.match(/(\d+)/)
    if (seasonMatch && seasonMatch[1]) {
      (cleaned as any).episode_season = parseInt(seasonMatch[1], 10)
    } else {
      (cleaned as any).episode_season = parseInt((cleaned as any).episode_season, 10)
    }
  }

  // Ensure coordinates are numbers (convert from strings if needed)
  if (typeof (cleaned as any).hq_latitude === 'string') {
    const lat = parseFloat((cleaned as any).hq_latitude)
    ;(cleaned as any).hq_latitude = isNaN(lat) || (cleaned as any).hq_latitude === '' ? undefined : lat
  }
  if (typeof (cleaned as any).hq_longitude === 'string') {
    const lng = parseFloat((cleaned as any).hq_longitude)
    ;(cleaned as any).hq_longitude = isNaN(lng) || (cleaned as any).hq_longitude === '' ? undefined : lng
  }
  
  console.log('🧹 [cleanFormData] Coordinates after cleaning:', {
    hq_latitude: (cleaned as any).hq_latitude,
    hq_longitude: (cleaned as any).hq_longitude,
    hq_latitude_type: typeof (cleaned as any).hq_latitude,
    hq_longitude_type: typeof (cleaned as any).hq_longitude
  })

  // Clean array fields
  if (typeof cleaned.industry_tags === 'string') {
    cleaned.industry_tags = cleaned.industry_tags.split(',').map(tag => tag.trim()).filter(Boolean).join(', ')
  }

  if (typeof cleaned.business_model_tags === 'string') {
    cleaned.business_model_tags = cleaned.business_model_tags.split(',').map(tag => tag.trim()).filter(Boolean).join(', ')
  }

  if (typeof cleaned.keywords === 'string') {
    console.log('🧹 [cleanFormData] Keywords before cleaning:', cleaned.keywords, 'Type:', typeof cleaned.keywords)
    cleaned.keywords = cleaned.keywords.split(',').map(keyword => keyword.trim()).filter(Boolean).join(', ')
    console.log('🧹 [cleanFormData] Keywords after cleaning:', cleaned.keywords)
  } else {
    console.log('🧹 [cleanFormData] Keywords not a string:', cleaned.keywords, 'Type:', typeof cleaned.keywords)
  }

  return cleaned
}

/**
 * Normalize a keyword to snake_case format to match database enum patterns
 */
export function normalizeKeyword(keyword: string): string {
  if (!keyword || typeof keyword !== 'string') {
    return keyword
  }
  
  return keyword
    .toLowerCase()
    .trim()
    // Replace spaces and hyphens with underscores
    .replace(/[\s\-]+/g, '_')
    // Remove any character that isn't a letter, digit, or underscore
    .replace(/[^a-z0-9_]/g, '')
    // Replace multiple underscores with single underscore
    .replace(/_+/g, '_')
    // Remove leading and trailing underscores
    .replace(/^_+|_+$/g, '')
}

/**
 * Normalize an array of keywords to snake_case format
 */
export function normalizeKeywords(keywords: string[]): string[] {
  if (!Array.isArray(keywords)) {
    return keywords
  }
  
  return keywords
    .map(normalizeKeyword)
    .filter(keyword => keyword.length >= 2) // Filter out keywords that are too short after normalization
}

/**
 * Normalize a co-investor name to snake_case format to match database patterns
 */
export function normalizeCoInvestor(investor: string): string {
  if (!investor || typeof investor !== 'string') {
    return investor
  }
  
  return investor
    .toLowerCase()
    .trim()
    // Replace spaces and hyphens with underscores
    .replace(/[\s\-]+/g, '_')
    // Remove any character that isn't a letter, digit, or underscore
    .replace(/[^a-z0-9_]/g, '')
    // Replace multiple underscores with single underscore
    .replace(/_+/g, '_')
    // Remove leading and trailing underscores
    .replace(/^_+|_+$/g, '')
}

/**
 * Normalize an array of co-investors to snake_case format
 */
export function normalizeCoInvestors(coInvestors: string[]): string[] {
  if (!Array.isArray(coInvestors)) {
    return coInvestors
  }
  
  return coInvestors
    .map(normalizeCoInvestor)
    .filter(investor => investor.length >= 2) // Filter out co-investors that are too short after normalization
}

/**
 * Check if form data is ready for submission
 */
export function isFormReadyForSubmission(
  step: number,
  formData: CompanyFormValues,
  investmentData: VcInvestment[]
): boolean {
  // Only allow submission on final step
  if (step !== 3) return false

  const validation = validateInvestmentSubmission(formData, investmentData)
  return validation.isValid
} 