import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server-side function to get standardized tags directly from Supabase
export async function getStandardizedTagsServer(): Promise<{
  industryTags: string[]
  businessModelTags: string[]
  keywords: string[]
}> {
  try {
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )
    
    // Get all valid industry tags
    const { data: industryTags, error: industryError } = await supabase
      .rpc('get_valid_industry_tags')
    
    if (industryError) {
      console.error('❌ Failed to fetch industry tags from Supabase:', industryError)
      const error = new Error(`Supabase RPC failed for get_valid_industry_tags: ${industryError.message}`)
      Sentry.captureException(error, {
        tags: { 
          error_type: 'supabase_rpc_failure',
          function: 'getStandardizedTagsServer',
          rpc_function: 'get_valid_industry_tags'
        },
        extra: { 
          supabaseError: industryError,
          errorCode: industryError.code,
          errorDetails: industryError.details
        }
      })
      throw error
    }
    
    // Get all valid business model tags
    const { data: businessModelTags, error: businessError } = await supabase
      .rpc('get_valid_business_model_tags')
    
    if (businessError) {
      console.error('❌ Failed to fetch business model tags from Supabase:', businessError)
      const error = new Error(`Supabase RPC failed for get_valid_business_model_tags: ${businessError.message}`)
      Sentry.captureException(error, {
        tags: { 
          error_type: 'supabase_rpc_failure',
          function: 'getStandardizedTagsServer',
          rpc_function: 'get_valid_business_model_tags'
        },
        extra: { 
          supabaseError: businessError,
          errorCode: businessError.code,
          errorDetails: businessError.details
        }
      })
      throw error
    }
    
    // Get all valid keywords
    const { data: keywords, error: keywordsError } = await supabase
      .rpc('get_valid_keywords')
    
    if (keywordsError) {
      console.error('❌ Failed to fetch keywords from Supabase:', keywordsError)
      const error = new Error(`Supabase RPC failed for get_valid_keywords: ${keywordsError.message}`)
      Sentry.captureException(error, {
        tags: { 
          error_type: 'supabase_rpc_failure',
          function: 'getStandardizedTagsServer',
          rpc_function: 'get_valid_keywords'
        },
        extra: { 
          supabaseError: keywordsError,
          errorCode: keywordsError.code,
          errorDetails: keywordsError.details
        }
      })
      throw error
    }

    // Validate that we actually got data
    if (!industryTags || !Array.isArray(industryTags)) {
      console.error('❌ Industry tags data is invalid:', industryTags)
      const error = new Error('Invalid industry tags data returned from Supabase')
      Sentry.captureException(error, {
        tags: { 
          error_type: 'invalid_supabase_data',
          function: 'getStandardizedTagsServer',
          data_type: 'industry_tags'
        },
        extra: { receivedData: industryTags }
      })
      throw error
    }

    if (!businessModelTags || !Array.isArray(businessModelTags)) {
      console.error('❌ Business model tags data is invalid:', businessModelTags)
      const error = new Error('Invalid business model tags data returned from Supabase')
      Sentry.captureException(error, {
        tags: { 
          error_type: 'invalid_supabase_data',
          function: 'getStandardizedTagsServer',
          data_type: 'business_model_tags'
        },
        extra: { receivedData: businessModelTags }
      })
      throw error
    }

    if (!keywords || !Array.isArray(keywords)) {
      console.error('❌ Keywords data is invalid:', keywords)
      const error = new Error('Invalid keywords data returned from Supabase')
      Sentry.captureException(error, {
        tags: { 
          error_type: 'invalid_supabase_data',
          function: 'getStandardizedTagsServer',
          data_type: 'keywords'
        },
        extra: { receivedData: keywords }
      })
      throw error
    }

    console.log(`✅ Successfully fetched standardized tags from Supabase:`, {
      industryTags: industryTags.length,
      businessModelTags: businessModelTags.length,
      keywords: keywords.length
    })
    
    return {
      industryTags: industryTags as string[],
      businessModelTags: businessModelTags as string[],
      keywords: keywords?.map((tag: any) => tag.value) || []
    }
  } catch (error) {
    console.error('💥 Critical error in getStandardizedTagsServer:', error)
    
    // If it's already our custom error, re-throw it
    if (error instanceof Error && error.message.includes('Supabase RPC failed')) {
      throw error
    }
    
    // Handle unexpected errors
    const criticalError = new Error(`Critical failure fetching standardized tags: ${error instanceof Error ? error.message : 'Unknown error'}`)
    Sentry.captureException(criticalError, {
      tags: { 
        error_type: 'critical_supabase_failure',
        function: 'getStandardizedTagsServer'
      },
      extra: { 
        originalError: error,
        stack: error instanceof Error ? error.stack : undefined
      }
    })
    throw criticalError
  }
}

// Get standardized tags from database
export async function getStandardizedTags(): Promise<{
  industryTags: string[]
  businessModelTags: string[]
  keywords: string[]
}> {
  try {
    const response = await fetch('/api/tags')
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Failed to fetch tags from API:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      })
      const error = new Error(`Tags API failed with status ${response.status}: ${response.statusText}`)
      Sentry.captureException(error, {
        tags: { 
          error_type: 'tags_api_failure',
          function: 'getStandardizedTags',
          status_code: response.status.toString()
        },
        extra: { 
          statusText: response.statusText,
          errorText,
          url: response.url
        }
      })
      throw error
    }
    
    const data = await response.json()
    
    // Validate the API response structure
    if (!data || typeof data !== 'object') {
      console.error('❌ Invalid response format from tags API:', data)
      const error = new Error('Invalid response format from tags API')
      Sentry.captureException(error, {
        tags: { 
          error_type: 'invalid_api_response',
          function: 'getStandardizedTags'
        },
        extra: { receivedData: data }
      })
      throw error
    }

    const industryTags = data.industryTags?.map((tag: any) => tag.value) || []
    const businessModelTags = data.businessModelTags?.map((tag: any) => tag.value) || []
    const keywords = data.keywords?.map((tag: any) => tag.value) || []

    // Validate that we got arrays with data
    if (!Array.isArray(industryTags) || industryTags.length === 0) {
      console.error('❌ No valid industry tags received from API:', data.industryTags)
      const error = new Error('No valid industry tags received from tags API')
      Sentry.captureException(error, {
        tags: { 
          error_type: 'empty_tags_data',
          function: 'getStandardizedTags',
          data_type: 'industry_tags'
        },
        extra: { receivedData: data.industryTags }
      })
      throw error
    }

    if (!Array.isArray(businessModelTags) || businessModelTags.length === 0) {
      console.error('❌ No valid business model tags received from API:', data.businessModelTags)
      const error = new Error('No valid business model tags received from tags API')
      Sentry.captureException(error, {
        tags: { 
          error_type: 'empty_tags_data',
          function: 'getStandardizedTags',
          data_type: 'business_model_tags'
        },
        extra: { receivedData: data.businessModelTags }
      })
      throw error
    }

    if (!Array.isArray(keywords) || keywords.length === 0) {
      console.error('❌ No valid keywords received from API:', data.keywords)
      const error = new Error('No valid keywords received from tags API')
      Sentry.captureException(error, {
        tags: { 
          error_type: 'empty_tags_data',
          function: 'getStandardizedTags',
          data_type: 'keywords'
        },
        extra: { receivedData: data.keywords }
      })
      throw error
    }

    console.log(`✅ Successfully fetched standardized tags from API:`, {
      industryTags: industryTags.length,
      businessModelTags: businessModelTags.length,
      keywords: keywords.length
    })

    return {
      industryTags,
      businessModelTags,
      keywords
    }
  } catch (error) {
    console.error('💥 Critical error in getStandardizedTags:', error)
    
    // If it's already our custom error, re-throw it
    if (error instanceof Error && (error.message.includes('Tags API failed') || error.message.includes('No valid'))) {
      throw error
    }
    
    // Handle unexpected errors (network issues, JSON parsing, etc.)
    const criticalError = new Error(`Critical failure fetching standardized tags from API: ${error instanceof Error ? error.message : 'Unknown error'}`)
    Sentry.captureException(criticalError, {
      tags: { 
        error_type: 'critical_api_failure',
        function: 'getStandardizedTags'
      },
      extra: { 
        originalError: error,
        stack: error instanceof Error ? error.stack : undefined
      }
    })
    throw criticalError
  }
}

// Utility function to validate transcript length
export function validateTranscriptLength(transcript: string): { valid: boolean; error?: string } {
  if (!transcript || typeof transcript !== 'string') {
    // Track validation failures for monitoring
    Sentry.addBreadcrumb({
      message: 'Transcript validation failed - invalid input',
      level: 'warning',
      data: { 
        type: typeof transcript,
        hasValue: !!transcript
      }
    })
    
    return { valid: false, error: 'Transcript is required and must be a string' }
  }

  // More accurate token estimation (OpenAI suggests ~4 characters per token for English)
  const estimatedTokens = Math.ceil(transcript.length / 4)
  
  // GPT-4o Mini has 128,000 token context window
  // Reserve space for prompts and responses (~8,000 tokens)
  // Allow up to 120,000 tokens for transcript (much more generous)
  const maxTranscriptTokens = 120000
  const maxTranscriptChars = maxTranscriptTokens * 4 // ~480,000 characters
  
  if (estimatedTokens > maxTranscriptTokens) {
    // Track when users hit the token limit
    Sentry.addBreadcrumb({
      message: 'Transcript validation failed - token limit exceeded',
      level: 'warning',
      data: { 
        estimatedTokens,
        maxTokens: maxTranscriptTokens,
        transcriptLength: transcript.length,
        maxChars: maxTranscriptChars
      }
    })
    
    return { 
      valid: false, 
      error: `Transcript too long (${estimatedTokens.toLocaleString()} tokens estimated). Please limit to approximately ${maxTranscriptTokens.toLocaleString()} tokens (${maxTranscriptChars.toLocaleString()} characters).` 
    }
  }

  return { valid: true }
}

// Utility function to parse comma-separated tags from AI response
export function parseTagsFromResponse(response: string, maxTags: number = 10): string[] {
  if (!response) {
    Sentry.addBreadcrumb({
      message: 'parseTagsFromResponse received empty response',
      level: 'warning',
      data: { response }
    })
    return []
  }
  
  const tags = response
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length > 0)
    .slice(0, maxTags)
    
  // Track successful parsing for monitoring
  Sentry.addBreadcrumb({
    message: 'Tags parsed from AI response',
    level: 'info',
    data: { 
      originalLength: response.length,
      parsedCount: tags.length,
      maxTags
    }
  })
  
  return tags
}

// Utility function to generate AI prompts with consistent formatting
export function generatePrompt(
  type: 'tagline' | 'industry' | 'business_model' | 'keywords',
  transcript: string,
  commonTags?: string[],
  reasonForInvesting?: string,
  companyDescription?: string
): string {
  try {
    let contextSection = ''
    
    // Add investor context if provided
    if (reasonForInvesting || companyDescription) {
      contextSection += 'INVESTOR CONTEXT:\n'
      if (reasonForInvesting) {
        contextSection += `Investment Rationale: ${reasonForInvesting}\n`
      }
      if (companyDescription) {
        contextSection += `Company Description: ${companyDescription}\n`
      }
      contextSection += '\n'
    }
    
    const basePrompt = `${contextSection}Here's the pitch transcript:\n\n${transcript}\n\n`

    let prompt: string

    switch (type) {
      case 'tagline':
        prompt = `You are an expert at creating compelling startup taglines for an investor audience (angel investors, LPs, and startup founders). Based on the following context and pitch transcript, generate a single, punchy tagline that captures the essence of what the company does. The tagline should be:
- EXTREMELY concise (3-7 words maximum)
- Clear and memorable
- Focused on the core value proposition
- Professional and direct
- Avoid flowery language or unnecessary descriptors

Examples of great startup taglines:
- "Uber for X"
- "Netflix for podcasts"
- "Shopify for creators"
- "Social grocery shopping"
- "AI-powered recruiting"
- "Instagram meets commerce"

${basePrompt}Generate only the tagline, no additional text or explanation:`
        break

      case 'industry':
        prompt = `You are a venture capital analyst expert at categorizing startups by industry from an investor perspective. Based on the following pitch transcript, suggest up to 10 relevant industry tags that best describe the company's sector and market opportunity.

INVESTOR PERSPECTIVE: Consider industries through a VC lens focusing on:
- Market size and growth potential of the sectors they operate in
- Technology disruption opportunities they're addressing
- Multiple industry exposure for diversified market risk
- Emerging vs. established market categories
- B2B vs. B2C market dynamics and scalability

CRITICAL: This is a STRICT taxonomy. You must ONLY use tags from the approved list below. DO NOT create new tags. DO NOT use variations or similar words. DO NOT invent tags. If you cannot find suitable tags from the approved list, use fewer tags rather than inventing new ones. The tags must match EXACTLY as provided.

REQUIRED EVIDENCE: Only use industry tags when there is clear evidence in the transcript:

CORE TECHNOLOGY SECTORS (look for technology solutions):
- fintech: Only if they provide financial services, payments, banking, lending, or financial technology solutions
- healthtech: Only if they provide medical services, healthcare technology, or clinical solutions as their core business
- edtech: Only if they provide educational technology, learning platforms, or academic services
- foodtech: Use if they mention food technology, food industry innovation, grocery tech, restaurant tech, or food-related technology solutions
- martech: Use if they BUILD marketing technology products, marketing automation tools, campaign management platforms, or new advertising products that brands use to run campaigns
- adtech: Use if they BUILD advertising technology products, programmatic advertising platforms, ad optimization tools, or new advertising products for media buying
- data_analytics: Use if they provide data analysis services, analytics dashboards, data insights subscriptions, or sell data/analytics to help brands understand performance (this is different from building marketing tools)

COMMERCE & RETAIL (look for commerce models):
- e_commerce: Use if they facilitate online selling, digital marketplaces, or online shopping platforms
- social_commerce: Use if they combine social media/content with commerce, influencer shopping, or social-driven purchasing
- retail: Use if they work with retailers, operate retail technology, or serve the retail industry
- grocery_retail: Use if they specifically work with grocery stores, food retailers, or grocery retail technology

CONTENT & CREATOR ECONOMY (look for content/creator focus):
- influencer: Use if they work with influencers, provide influencer marketing tools, or focus on influencer ecosystem
- creator: Use if they work with content creators, provide creator tools, or focus on creator economy
- media_entertainment: Use if they provide media content, entertainment platforms, or media technology

TARGET MARKET CATEGORIES (look for who they serve):
- consumer_tech: Use if they build technology (typically software) designed for consumer use rather than business use. Consumer tech is often free rather than sold directly to consumers, but it's specifically built for individual consumer usage, not enterprise/business customers
- enterprise: Use if they primarily serve large enterprise customers with B2B solutions
- smb: Use if they primarily serve small and medium businesses

SPECIALIZED VERTICALS (only if primary focus):
- wellness: Only if their PRIMARY business focus is wellness, fitness, mental health, or lifestyle improvement services (not just mentioning health benefits)
- digital_health: Only if they provide digital health solutions, telemedicine, or health monitoring technology as their main product

CRITICAL TAG SELECTION RULES:
1. **Choose the MOST SPECIFIC tag** when multiple options apply:
   - Use "grocery_retail" over "retail" if they specifically work with grocery stores
   - Use "data_analytics" over "martech" if they sell data insights rather than build marketing tools
   - Use "social_commerce" over "e_commerce" if they combine social media with commerce

2. **For technology vs. market tags:**
   - Use technology tags (fintech, healthtech, foodtech, martech, adtech) when they BUILD technology solutions
   - Use market tags (retail, grocery_retail, enterprise, smb) when they SERVE those markets

3. **For multi-industry companies:**
   - Focus on their PRIMARY value proposition and main revenue sources
   - Include secondary industries only if they represent significant market opportunity

4. **Comprehensive but accurate:**
   - Include ALL relevant tags that have clear evidence in the transcript
   - Aim for 7-10 tags to provide complete industry coverage
   - Only exclude tags if there's truly no evidence

COMMON MISTAKES TO AVOID:
- Do NOT use "wellness" or "healthtech" just because they mention healthy eating or nutrition
- Do NOT use "fintech" just because they process payments - use only if financial services is their core business
- Do NOT use generic "retail" when specific "grocery_retail" applies
- Do NOT use "martech" or "adtech" for companies that sell data insights - use "data_analytics" instead
- Do NOT assume industries based on context - only use what's explicitly described

⚠️ LOOK FOR THESE COMMON MISSED PATTERNS:
- Companies that provide analytics dashboards or sell data insights should be tagged as "data_analytics"
- Companies that work with influencers for brands should be tagged as "influencer" AND "data_analytics" (if they provide performance data)
- Companies that serve specific retail verticals should use the specific tag, not generic "retail"
- Technology companies serving businesses should include the appropriate target market tag (enterprise/smb)
- Companies that mention "food creators", "food influencers", or "recipe content" should be tagged as "foodtech" AND "creator" AND "influencer"
- Companies that "revolutionize grocery shopping" or provide "food technology" should be tagged as "foodtech"

TRANSCRIPT PHRASE EXAMPLES:
- "We provide analytics dashboards to brands" = data_analytics
- "We help brands understand which influencers perform" = data_analytics, influencer
- "We work with grocery retailers" = grocery_retail
- "We sell data insights to CPG brands" = data_analytics
- "We connect social media content to shopping" = social_commerce
- "We build campaign management software" = martech
- "We provide programmatic advertising platform" = adtech
- "We work with food creators" = foodtech, creator
- "We revolutionize grocery shopping" = foodtech, grocery_retail
- "Food influencers promote recipes" = foodtech, influencer, creator

INDUSTRY INVESTMENT THESIS CONSIDERATIONS:
- Large addressable markets: grocery_retail ($10T), martech ($200B+), social_commerce (growing 3x)
- Network effects: social_commerce, influencer, creator platforms
- Data moats: martech, adtech, data_analytics companies
- Recurring revenue potential: martech, adtech, data_analytics SaaS models
- Scalability: Technology tags generally more scalable than pure service models

${commonTags ? `STRICT APPROVED INDUSTRY TAGS (use only these):\n${commonTags.join(', ')}\n\n` : ''}Focus on:
- Their primary technology solution and core value proposition
- The main industries/verticals they serve or disrupt
- Market opportunities they're addressing (size, growth, disruption potential)
- Technology categories that drive their competitive advantage

${basePrompt}Return only a comma-separated list of 7-10 industry tags that match EXACTLY from the strict approved list above. Include ALL relevant tags that have clear evidence in the transcript - be comprehensive but accurate. No additional text:`
        break

      case 'business_model':
        prompt = `You are a venture capital analyst expert at evaluating startup business models from an investor perspective. Based on the following pitch transcript, suggest up to 8 relevant business model tags that best describe how the company operates, generates revenue, and creates value.

INVESTOR PERSPECTIVE: Consider business models through a VC lens focusing on:
- Revenue diversification and multiple income streams
- Network effects and multi-sided markets
- Scalability and unit economics
- Customer acquisition and monetization strategies
- Platform dynamics and ecosystem effects

For this analysis, suggest business model tags that best describe how the company operates and generates revenue.

CRITICAL: This is a STRICT taxonomy. You must ONLY use tags from the approved list below. DO NOT create new tags. DO NOT use variations or similar words. DO NOT invent tags. If you cannot find suitable tags from the approved list, use fewer tags rather than inventing new ones. The tags must match EXACTLY as provided.

REQUIRED EVIDENCE: Only use business model tags when there is clear evidence in the transcript:

REVENUE MODELS (recognize different ways companies describe these):
- subscription: Use if they mention "recurring revenue", "monthly subscription", "annual subscription", "subscription model", "subscription-based pricing", "recurring billing", OR describe charging customers regularly (e.g., "pay us $X per month", "monthly fees", "recurring payments")
- freemium: Only if they mention "free tier", "free version", "freemium model", "paid upgrade", or "premium features"
- transaction_fee: Use ONLY if they process payments on their own platform and charge fees for payment processing (like Stripe, PayPal). Do NOT use if they earn commissions from referring customers to other platforms.
- affiliate: Use if they earn commissions/cuts by referring customers to other platforms or partner networks. This includes "take a cut", "commission from retailers", "referral fees", "earn from partner transactions", OR when customers pay the partner (not them) but they get a percentage.
- advertising: Use if they mention "advertising revenue", "ad revenue", "monetize through ads", "advertising model", "sponsored content", OR describe earning from brand partnerships/promotions
- saas: Only if they mention "software-as-a-service", "SaaS", "software subscription", "cloud software", "enterprise software", OR describe providing software tools/dashboards to business customers
- licensing: Only if they mention "licensing revenue", "license our technology", "IP licensing", or "licensing fees"

BUSINESS TYPES (VC perspective - look for multi-sided models and network effects):
- marketplace: Use if they connect multiple parties (creators/retailers/consumers), facilitate transactions, create two-sided or multi-sided markets, or enable network effects between parties
- social_network: Only if they mention "social network", "social connections", "community building", "social features", or "social platform"
- aggregator: Use if they bring together content/services from multiple sources, create single interface for fragmented market, or aggregate supply/demand
- direct_to_consumer: Only if they mention "direct-to-consumer", "sell directly", "bypass retailers", "direct sales", or "D2C"
- d2c: Same as direct_to_consumer - only if they explicitly mention "D2C" or "direct-to-consumer model"

CUSTOMER SEGMENTS (only use if clearly described):
- b2b: Use if they mention "B2B", "business-to-business", "sell to businesses", "business customers", "enterprise clients", "corporate clients", OR describe selling services/products to companies
- b2c: Only if they mention "B2C", "business-to-consumer", "sell to consumers", "consumer customers", AND consumers pay them directly (not just affiliate/data revenue)
- b2b2c: Use if they mention "B2B2C", "work with businesses to serve consumers", "partner with retailers", "help businesses serve customers", OR describe working with business partners to reach end consumers
- peer_to_peer: Only if they mention "P2P", "peer-to-peer", "users transact with each other", or "facilitate user-to-user transactions"

SPECIALIZED MODELS (VC perspective - recognize revenue diversification):
- data_monetization: Use if they mention "monetize data", "sell data insights", "data as revenue", "data analytics revenue", "building data sets", "data intelligence", OR describe collecting valuable data and selling insights/analytics to partners
- affiliate: Use if they mention "affiliate", "earn from referrals", "affiliate revenue", "commission from partners", "referral fees", OR describe earning money by directing customers to other platforms/partners (customers pay the partner, not them)
- white_label: Only if they mention "white-label", "white label", "private-label", "rebrand our solution", or "white-label model"
- franchise: Only if they mention "franchise", "franchising", "franchise model", "franchise revenue", or "franchise system"

CRITICAL TAG SELECTION RULES:
1. **Choose the MOST SPECIFIC tag** when multiple options apply:
   - Use "transaction_fee" ONLY if they process payments themselves (like a payment processor)
   - Use "affiliate" if they refer customers to other platforms and earn commissions (most common)
   - Use "advertising" for brand partnership revenue

2. **For B2B vs B2C vs B2B2C:**
   - Use "b2b" if they sell directly to businesses
   - Use "b2c" ONLY if consumers pay them directly
   - Use "b2b2c" if they work with businesses to serve consumers (most common for marketplaces and multi-sided businesses)

3. **For subscription recognition:**
   - Look for ANY mention of regular/recurring payments, not just the word "subscription"
   - Examples: "pay us monthly", "recurring fees", "annual contracts", "monthly billing"

4. **For data monetization:**
   - Look for mentions of building data sets, providing analytics, or selling insights
   - Examples: "building data", "data intelligence", "analytics platform", "insights to brands"

COMMON MISTAKES TO AVOID:
- Do NOT use "transaction_fee" for referral/commission revenue - use "affiliate" instead
- Do NOT use both "affiliate" AND "transaction_fee" - they are mutually exclusive in most cases
- Do NOT use "transaction_fee" unless they actually process payments on their own platform
- Do NOT use "b2c" if consumers don't pay them directly - use "b2b2c" if consumers pay through business partners
- Do NOT use "saas" unless they specifically mention software subscriptions or dashboards
- Do NOT use "marketplace" unless they specifically connect buyers and sellers
- Do NOT miss "subscription" just because they don't use the exact word - look for recurring payment descriptions
- Do NOT miss "data_monetization" just because they don't say "monetize data" - look for data/analytics revenue descriptions

TRANSCRIPT PHRASE EXAMPLES:
- "We work with grocery retailers to serve consumers" = b2b2c (NOT b2c)
- "We get a commission when consumers shop at partner retailers" = affiliate, b2b2c
- "We provide analytics dashboards to brands for $4000/month" = subscription, data_monetization, b2b, saas
- "We're building the largest data set and selling insights" = data_monetization, b2b
- "We connect creators with retailers and earn referral fees" = marketplace, affiliate, b2b2c
- "Brands pay us monthly for performance data" = subscription, data_monetization, b2b
- "We process payments and charge 2.9% per transaction" = transaction_fee (rare - only for payment processors)
- "Retailers pay us when we send them customers" = affiliate

⚠️ LOOK FOR THESE COMMON MISSED PATTERNS:
- Companies that charge monthly fees but don't use the word "subscription"
- Companies that collect data and provide insights but don't explicitly say "monetize data"
- Multi-sided platforms that should be tagged as both "marketplace" and "b2b2c"
- Revenue from brand partnerships that should be tagged as "advertising" or "data_monetization"

QUALITY OVER QUANTITY: It's better to return 6-8 highly accurate tags than 10 questionable ones. Only include tags with strong evidence.

${commonTags ? `STRICT APPROVED BUSINESS MODEL TAGS (use only these):\n${commonTags.join(', ')}\n\n` : ''}Focus on:
- Multiple revenue streams they describe (VCs love diversified revenue)
- How they actually generate money (not just what they do)
- Customer payment patterns they mention
- Data/analytics revenue they describe
- Platform dynamics and network effects

${basePrompt}Return only a comma-separated list of 6-8 business model tags that match EXACTLY from the strict approved list above, prioritizing the most specific and accurate tags. No additional text:`
        break

      case 'keywords':
        prompt = `You are an expert at extracting relevant keywords from startup pitch transcripts. Based on the following pitch transcript, suggest up to 20 relevant keyword tags that describe how the company delivers value.

TARGET MIX: Aim for approximately 7 existing approved keywords + 13 new extracted keywords/acronyms.

GUIDELINES FOR KEYWORDS:
- FIRST PRIORITY: Identify existing approved keywords from the list below that relate to concepts mentioned in the transcript
- SECOND PRIORITY: Extract startup/business acronyms mentioned in the transcript or convert spelled-out terms to standard acronyms
- THIRD PRIORITY: Extract new relevant keywords directly from actual phrases/terms used in the transcript
- For NEW keywords: Extract actual phrases, terms, or concepts mentioned in the transcript that describe technology approaches, delivery models, growth strategies, or operational characteristics
- Convert extracted phrases to underscore_case format (e.g., "machine learning" → "machine_learning", "real time data" → "real_time_data")
- DO NOT suggest any terms that describe industries (like fintech, healthtech) or business models (like marketplace, saas, b2b)
- Focus on HOW the company operates based on what they actually say in the transcript

ACRONYM DETECTION & CONVERSION:
Look for common startup/business acronyms in the transcript OR convert spelled-out terms to their standard acronym form:

FINANCIAL & BUSINESS METRICS:
- "Customer Acquisition Cost" OR "CAC" → CAC
- "Customer Lifetime Value" OR "CLV" OR "LTV" → LTV
- "Return on Ad Spend" OR "ROAS" → ROAS
- "Return on Investment" OR "ROI" → ROI
- "Monthly Recurring Revenue" OR "MRR" → MRR
- "Annual Recurring Revenue" OR "ARR" → ARR
- "Average Order Value" OR "AOV" → AOV
- "Cost Per Click" OR "CPC" → CPC
- "Cost Per Acquisition" OR "CPA" → CPA
- "Cost Per Mille" OR "CPM" → CPM
- "Gross Merchandise Value" OR "GMV" → GMV
- "Total Addressable Market" OR "TAM" → TAM
- "Serviceable Addressable Market" OR "SAM" → SAM
- "Net Promoter Score" OR "NPS" → NPS
- "Key Performance Indicator" OR "KPI" → KPI

GROWTH & MARKETING:
- "Product-Led Growth" OR "PLG" → PLG
- "Search Engine Optimization" OR "SEO" → SEO
- "Search Engine Marketing" OR "SEM" → SEM
- "Pay-Per-Click" OR "PPC" → PPC
- "User-Generated Content" OR "UGC" → UGC
- "Conversion Rate Optimization" OR "CRO" → CRO
- "Click-Through Rate" OR "CTR" → CTR
- "Cost Per Lead" OR "CPL" → CPL
- "Marketing Qualified Lead" OR "MQL" → MQL
- "Sales Qualified Lead" OR "SQL" → SQL

TECHNOLOGY & DEVELOPMENT:
- "Application Programming Interface" OR "API" → API
- "Software as a Service" OR "SaaS" → SaaS
- "Business to Business" OR "B2B" → B2B
- "Business to Consumer" OR "B2C" → B2C
- "Minimum Viable Product" OR "MVP" → MVP
- "User Experience" OR "UX" → UX
- "User Interface" OR "UI" → UI
- "Customer Relationship Management" OR "CRM" → CRM
- "Enterprise Resource Planning" OR "ERP" → ERP
- "Point of Sale" OR "POS" → POS

FUNDING & INVESTMENT:
- "Venture Capital" OR "VC" → VC
- "Angel Investor" OR "AI" → AI (only if context is clear about investors, not artificial intelligence)
- "Series A" OR "Series B" OR "Series C" → series_a, series_b, series_c
- "Initial Public Offering" OR "IPO" → IPO
- "Due Diligence" OR "DD" → DD
- "Term Sheet" OR "TS" → TS

CRITICAL ACRONYM RULES:
1. **Convert spelled-out terms to acronyms** when the standard acronym is commonly used in startup/VC contexts
2. **Use the acronym form as the keyword** even if only the spelled-out version appears in transcript
3. **Only use acronyms that are standard in startup/business contexts** - don't create new acronyms
4. **Be case-sensitive** - use proper acronym capitalization (CAC, not cac)
5. **Context matters** - "AI" could mean Artificial Intelligence or Angel Investor depending on context

${commonTags ? `EXISTING APPROVED KEYWORDS (prioritize finding matches from this list):\n${commonTags.join(', ')}\n\n` : ''}MAPPING EXAMPLES - How to match transcript concepts to existing keywords:
If transcript mentions → Use existing keyword:
- "artificial intelligence", "AI", "machine learning", "neural networks", "ai-powered" → AI
- "machine learning", "ML", "deep learning", "neural networks", "algorithms" → machine_learning
- "personalized recommendations", "tailored content", "customized experience", "personalization" → personalization
- "user-generated content", "UGC", "community content", "user content", "recipe sharing" → user_generated_content
- "recommendation engine", "recommendation system", "suggestions", "recommender system" → recommendation_engine
- "predictive modeling", "forecasting", "trend analysis", "predictive analytics" → predictive_analytics
- "big data", "large datasets", "data processing", "massive data", "data analytics" → big_data
- "mobile app", "iOS", "Android", "smartphone", "mobile-first" → mobile_app
- "web-based", "web platform", "browser-based", "online platform" → web_based
- "on-demand", "on demand", "instant access", "immediate availability" → on_demand
- "API", "API-first", "API integration", "third-party connections" → api_first
- "cloud", "cloud-native", "cloud infrastructure", "distributed systems" → cloud_native
- "network effects", "viral growth", "exponential growth" → network_effects
- "product-led growth", "PLG", "self-service growth" → product_led_growth
- "sales-led growth", "enterprise sales", "direct sales" → sales_led_growth
- "community-led growth", "community building", "user community" → community_led_growth
- "supply chain", "supply chain optimization", "logistics optimization" → supply_chain_optimization
- "inventory management", "stock tracking", "inventory control" → inventory_management
- "logistics", "fulfillment", "delivery optimization" → logistics
- "white glove", "white-glove service", "concierge service" → white_glove
- "self-service", "self serve", "DIY", "do it yourself" → self_service
- "managed service", "fully managed", "done-for-you" → managed_service
- "omnichannel", "multi-channel", "cross-channel" → omnichannel
- "subscription", "recurring revenue", "monthly billing" → subscription_based
- "freemium", "free tier", "free version" → freemium_model
- "usage-based pricing", "pay-per-use", "consumption-based" → usage_based_pricing

CRITICAL MATCHING RULE: Only use existing keywords when they are EXPLICITLY mentioned or clearly described in the transcript. Do NOT make assumptions based on industry, business type, or implied needs.

REQUIRED EVIDENCE: For each existing keyword, you must have clear evidence from the transcript:
- AI, machine_learning: Only if transcript mentions "AI", "artificial intelligence", "machine learning", "algorithms", "smart features", "automated recommendations"
- personalization, recommendation_engine: Only if transcript mentions "personalized", "tailored", "customized", "recommendations", "suggestion engine"
- user_generated_content: Only if transcript mentions "user-generated", "community content", "user content", "recipe sharing", "user reviews"
- supply_chain_optimization, inventory_management: Only if transcript mentions "supply chain", "logistics", "inventory", "fulfillment", "warehouse"
- community_led_growth: Only if transcript mentions "community building", "social sharing", "viral growth", "community-driven"
- mobile_app: Only if transcript mentions "mobile app", "iOS", "Android", "smartphone app", "mobile application"
- omnichannel: Only if transcript mentions "omnichannel", "multi-channel", "cross-channel"
- data_play: Only if transcript mentions "data monetization", "data business", "data insights", "data analytics"

DO NOT ASSUME: Just because it's a food/grocery company doesn't mean it has supply chain/inventory management. Just because it has web + mobile doesn't mean it's omnichannel. Only use keywords that are actually discussed in the transcript.

EXTRACTION STRATEGY:
1. FIRST: Carefully scan the transcript and identify 5-9 existing approved keywords that match concepts, technologies, or approaches mentioned (be generous with conceptual matches as shown in examples above)
2. SECOND: Look for 4-6 startup/business acronyms in the transcript OR convert spelled-out terms to standard acronyms (e.g., "Customer Acquisition Cost" → CAC, "Return on Ad Spend" → ROAS)
3. THIRD: Extract 6-8 specific phrases/terms from the transcript that describe:
   - Technology approaches they mention (e.g., "artificial intelligence", "predictive analytics")
   - How they deliver their service (e.g., "white_glove_service", "self_serve_platform")
   - Growth or operational strategies they describe (e.g., "viral_mechanics", "network_effects")
   - Unique processes or methodologies they mention
   - Specific technical terms or jargon they use

CRITICAL: Be very generous in matching existing approved keywords to transcript concepts - if the transcript mentions ANY concept that relates to an existing keyword, include that existing keyword!

${basePrompt}Return only a comma-separated list of up to 20 keywords (target: ~7 existing + ~13 new from transcript). No additional text:`
        break

      default:
        const error = new Error(`Unknown prompt type: ${type}`)
        Sentry.captureException(error, {
          tags: { 
            error_type: 'invalid_prompt_type',
            function: 'generatePrompt'
          },
          extra: { 
            promptType: type,
            transcriptLength: transcript.length
          }
        })
        throw error
    }

    // Track successful prompt generation
    Sentry.addBreadcrumb({
      message: `AI prompt generated for ${type}`,
      level: 'info',
      data: { 
        promptType: type,
        transcriptLength: transcript.length,
        promptLength: prompt.length,
        hasCommonTags: !!commonTags
      }
    })

    return prompt

  } catch (error) {
    // Track prompt generation failures
    Sentry.captureException(error, {
      tags: { 
        error_type: 'prompt_generation_failed',
        function: 'generatePrompt'
      },
      extra: { 
        promptType: type,
        transcriptLength: transcript?.length || 0
      }
    })
    throw error
  }
} 