import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import * as Sentry from '@sentry/nextjs'

// Configure this route to run on Edge Runtime for better performance
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// Initialize Sentry for edge runtime
Sentry.captureException(new Error("Edge tags API initialized"))

type TagAnalytics = {
  tag_type: string
  tag_value: string
  usage_count: number
}

type TagWithMetadata = {
  value: string
  label: string
  count: number
}

type KeywordResult = {
  value: string
  label: string
  count: number
}

export async function GET() {
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
      console.error('Error fetching industry tags:', industryError)
      return NextResponse.json({ error: 'Failed to fetch industry tags' }, { status: 500 })
    }
    
    // Get all valid business model tags
    const { data: businessModelTags, error: businessError } = await supabase
      .rpc('get_valid_business_model_tags')
    
    if (businessError) {
      console.error('Error fetching business model tags:', businessError)
      return NextResponse.json({ error: 'Failed to fetch business model tags' }, { status: 500 })
    }
    
    // Get all valid keywords (returns table with value, label, count)
    const { data: keywordResults, error: keywordsError } = await supabase
      .rpc('get_valid_keywords')
    
    if (keywordsError) {
      console.error('Error fetching keywords:', keywordsError)
      return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 })
    }
    
    // Get tag usage analytics
    const { data: tagAnalytics, error: analyticsError } = await supabase
      .from('tag_analytics')
      .select('tag_type, tag_value, usage_count')
      .order('usage_count', { ascending: false })
    
    if (analyticsError) {
      console.error('Error fetching tag analytics:', analyticsError)
      return NextResponse.json({ error: 'Failed to fetch tag analytics' }, { status: 500 })
    }
    
    // Group analytics by tag type
    const industryAnalytics = (tagAnalytics as TagAnalytics[])?.filter((t: TagAnalytics) => t.tag_type === 'industry') || []
    const businessModelAnalytics = (tagAnalytics as TagAnalytics[])?.filter((t: TagAnalytics) => t.tag_type === 'business_model') || []
    const keywordAnalytics = (tagAnalytics as TagAnalytics[])?.filter((t: TagAnalytics) => t.tag_type === 'keywords') || []
    
    // Transform tags into objects with metadata
    const industryTagsWithMetadata: TagWithMetadata[] = (industryTags as string[])?.map((tag: string) => ({
      value: tag,
      label: tag.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      count: industryAnalytics.find((a: TagAnalytics) => a.tag_value === tag)?.usage_count || 0
    })) || []
    
    const businessModelTagsWithMetadata: TagWithMetadata[] = (businessModelTags as string[])?.map((tag: string) => ({
      value: tag,
      label: tag.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      count: businessModelAnalytics.find((a: TagAnalytics) => a.tag_value === tag)?.usage_count || 0
    })) || []
    
    // Keywords already come with metadata from the database function
    const keywordsWithMetadata: TagWithMetadata[] = (keywordResults as KeywordResult[])?.map((keyword: KeywordResult) => ({
      value: keyword.value,
      label: keyword.label,
      count: keyword.count
    })) || []
    
    // Sort by usage (most popular first) and then alphabetically
    const sortTags = (tags: TagWithMetadata[]) => {
      return tags.sort((a, b) => {
        if (a.count !== b.count) {
          return b.count - a.count // Most used first
        }
        return a.label.localeCompare(b.label) // Alphabetical for same usage
      })
    }
    
    return NextResponse.json({
      industryTags: sortTags(industryTagsWithMetadata),
      businessModelTags: sortTags(businessModelTagsWithMetadata),
      keywords: sortTags(keywordsWithMetadata),
      analytics: {
        totalCompanies: industryAnalytics.reduce((sum: number, tag: TagAnalytics) => sum + tag.usage_count, 0),
        industryTagsUsed: industryAnalytics.length,
        businessModelTagsUsed: businessModelAnalytics.length,
        keywordsUsed: keywordAnalytics.length,
        mostPopularIndustryTag: industryAnalytics[0]?.tag_value || null,
        mostPopularBusinessModelTag: businessModelAnalytics[0]?.tag_value || null,
        mostPopularKeyword: keywordAnalytics[0]?.tag_value || null
      }
    })
    
  } catch (error) {
    console.error('Error in tags API:', error)
    Sentry.captureException(error, {
      tags: { route: 'api/tags', error_type: 'internal_server_error' }
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 