// Common industry tags for AI model guidance and frontend suggestions
export const COMMON_INDUSTRY_TAGS = [
  'fintech', 'healthtech', 'edtech', 'proptech', 'foodtech', 'cleantech',
  'b2b', 'b2c', 'saas', 'marketplace', 'e-commerce', 'social', 'gaming',
  'ai', 'ml', 'blockchain', 'crypto', 'iot', 'cybersecurity', 'biotech',
  'hardware', 'software', 'mobile', 'web', 'enterprise', 'consumer',
  'retail', 'healthcare', 'education', 'finance', 'real estate', 'logistics',
  'travel', 'media', 'entertainment', 'sports', 'fitness', 'wellness',
  'automotive', 'manufacturing', 'energy', 'sustainability', 'climate'
]

// Common business model tags for AI model guidance and frontend suggestions
export const COMMON_BUSINESS_MODEL_TAGS = [
  'b2b', 'b2c', 'b2b2c', 'marketplace', 'platform', 'saas', 'paas', 'iaas',
  'subscription', 'freemium', 'pay-per-use', 'transaction-based', 'commission',
  'advertising', 'affiliate', 'licensing', 'white-label', 'franchise',
  'direct-sales', 'e-commerce', 'dropshipping', 'aggregator', 'broker',
  'on-demand', 'sharing-economy', 'peer-to-peer', 'crowdsourcing', 'crowdfunding',
  'data-monetization', 'api-based', 'integration', 'automation', 'consulting',
  'managed-service', 'outsourcing', 'channel-partner', 'reseller', 'distributor',
  'ecosystem', 'network-effect', 'viral', 'content', 'community', 'social',
  'mobile-first', 'web-based', 'hybrid', 'omnichannel', 'enterprise',
  'smb', 'consumer', 'prosumer', 'vertical', 'horizontal', 'niche'
]

// Utility function to validate transcript length
export function validateTranscriptLength(transcript: string): { valid: boolean; error?: string } {
  if (!transcript || typeof transcript !== 'string') {
    return { valid: false, error: 'Transcript is required and must be a string' }
  }

  const estimatedTokens = Math.ceil(transcript.length / 4) // Rough estimate: ~4 chars per token
  if (estimatedTokens > 8000) {
    return { 
      valid: false, 
      error: 'Transcript too long. Please limit to approximately 6,000 tokens.' 
    }
  }

  return { valid: true }
}

// Utility function to parse comma-separated tags from AI response
export function parseTagsFromResponse(response: string, maxTags: number = 5): string[] {
  if (!response) return []
  
  return response
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length > 0)
    .slice(0, maxTags)
}

// Utility function to generate AI prompts with consistent formatting
export function generatePrompt(
  type: 'tagline' | 'industry' | 'business_model',
  transcript: string,
  commonTags?: string[]
): string {
  const basePrompt = `Here's the pitch transcript:\n\n${transcript}\n\n`

  switch (type) {
    case 'tagline':
      return `You are an expert at creating compelling startup taglines. Based on the following pitch transcript, generate a single, catchy tagline that captures the essence of what the company does. The tagline should be:
- One concise sentence (10-15 words maximum)
- Clear and memorable
- Focused on the company's value proposition
- Professional yet engaging

${basePrompt}Generate only the tagline, no additional text or explanation:`

    case 'industry':
      return `You are an expert at categorizing startups by industry. Based on the following pitch transcript, suggest 3-5 relevant industry tags that best describe the company's sector and category.

Choose from common industry tags when applicable, but you can also suggest new ones if they're more accurate. Focus on:
- Primary industry/sector (e.g., fintech, healthtech, edtech)
- Business model type (e.g., b2b, b2c, saas, marketplace)
- Technology focus (e.g., ai, ml, blockchain, iot)
- Market segment (e.g., enterprise, consumer, healthcare)

${commonTags ? `Common industry tags for reference: ${commonTags.join(', ')}\n\n` : ''}${basePrompt}Return only a comma-separated list of 3-5 industry tags, no additional text:`

    case 'business_model':
      return `You are an expert at analyzing startup business models. Based on the following pitch transcript, suggest 3-5 relevant business model tags that best describe how the company operates and generates revenue.

Focus on:
- Revenue model (e.g., subscription, marketplace, transaction-based, advertising)
- Customer segments (e.g., b2b, b2c, enterprise, smb)
- Distribution model (e.g., direct-sales, channel-partner, platform, saas)
- Market approach (e.g., on-demand, sharing-economy, peer-to-peer, freemium)
- Operational model (e.g., managed-service, automation, api-based, white-label)

${commonTags ? `Common business model tags for reference: ${commonTags.join(', ')}\n\n` : ''}${basePrompt}Return only a comma-separated list of 3-5 business model tags, no additional text:`

    default:
      throw new Error(`Unknown prompt type: ${type}`)
  }
} 