/**
 * Content size validation utilities for embeddings
 * Prevents uploading documents larger than 16KB to maintain database performance
 */

// Constants
export const MAX_CONTENT_SIZE_BYTES = 16384; // 16KB
export const WARNING_THRESHOLD_BYTES = 12288; // 12KB (75% of limit)
export const MAX_CONTENT_SIZE_KB = MAX_CONTENT_SIZE_BYTES / 1024;
export const WARNING_THRESHOLD_KB = WARNING_THRESHOLD_BYTES / 1024;

/**
 * Calculate the byte size of a string
 * Uses UTF-8 encoding length calculation
 */
export function getContentSizeBytes(content: string): number {
  if (!content) return 0;
  return new Blob([content]).size;
}

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get size category for content
 */
export function getSizeCategory(sizeBytes: number): {
  category: string;
  level: 'safe' | 'warning' | 'error';
  color: string;
} {
  if (sizeBytes === 0) {
    return { category: 'Empty', level: 'safe', color: 'gray' };
  } else if (sizeBytes <= 1024) {
    return { category: 'Small (≤1KB)', level: 'safe', color: 'green' };
  } else if (sizeBytes <= 4096) {
    return { category: 'Medium (≤4KB)', level: 'safe', color: 'blue' };
  } else if (sizeBytes <= 8192) {
    return { category: 'Large (≤8KB)', level: 'safe', color: 'yellow' };
  } else if (sizeBytes <= WARNING_THRESHOLD_BYTES) {
    return { category: 'Large (≤12KB)', level: 'warning', color: 'orange' };
  } else if (sizeBytes <= MAX_CONTENT_SIZE_BYTES) {
    return { category: 'Very Large (≤16KB)', level: 'warning', color: 'red' };
  } else {
    return { category: 'OVERSIZED (>16KB)', level: 'error', color: 'red' };
  }
}

/**
 * Validation result interface
 */
export interface ContentValidationResult {
  isValid: boolean;
  sizeBytes: number;
  sizeFormatted: string;
  category: ReturnType<typeof getSizeCategory>;
  message: string;
  suggestions: string[];
}

/**
 * Validate content size for embeddings
 */
export function validateContentSize(content: string): ContentValidationResult {
  const sizeBytes = getContentSizeBytes(content);
  const sizeFormatted = formatBytes(sizeBytes);
  const category = getSizeCategory(sizeBytes);
  
  let message = '';
  const suggestions: string[] = [];
  
  if (sizeBytes > MAX_CONTENT_SIZE_BYTES) {
    message = `Content is too large (${sizeFormatted}). Maximum allowed size is ${MAX_CONTENT_SIZE_KB}KB.`;
    suggestions.push(
      'Split the content into smaller chunks',
      'Store large documents externally (S3, CDN) and reference by URL',
      'Summarize the content before creating embeddings',
      'Remove redundant or less important information'
    );
  } else if (sizeBytes > WARNING_THRESHOLD_BYTES) {
    message = `Content is approaching the size limit (${sizeFormatted} of ${MAX_CONTENT_SIZE_KB}KB max).`;
    suggestions.push(
      'Consider splitting large content for better performance',
      'Review content for potential size reduction'
    );
  } else if (sizeBytes > 8192) {
    message = `Content size: ${sizeFormatted}. This is acceptable but consider optimization for better performance.`;
    suggestions.push('Content is large but within acceptable limits');
  } else {
    message = `Content size: ${sizeFormatted}. Optimal size for embedding processing.`;
  }
  
  return {
    isValid: sizeBytes <= MAX_CONTENT_SIZE_BYTES,
    sizeBytes,
    sizeFormatted,
    category,
    message,
    suggestions
  };
}

/**
 * Pre-process content for chunking if it's too large
 * Splits content into chunks under the size limit
 */
export function chunkContent(content: string, maxChunkSize: number = WARNING_THRESHOLD_BYTES): string[] {
  if (getContentSizeBytes(content) <= maxChunkSize) {
    return [content];
  }
  
  const chunks: string[] = [];
  let currentChunk = '';
  
  // Split by paragraphs first, then sentences if needed
  const paragraphs = content.split(/\n\s*\n/);
  
  for (const paragraph of paragraphs) {
    const paragraphSize = getContentSizeBytes(paragraph);
    
    if (paragraphSize > maxChunkSize) {
      // Paragraph is too large, split by sentences
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      
      for (const sentence of sentences) {
        const testChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;
        
        if (getContentSizeBytes(testChunk) > maxChunkSize) {
          if (currentChunk) {
            chunks.push(currentChunk);
            currentChunk = sentence;
          } else {
            // Single sentence is too large, truncate it
            chunks.push(sentence.substring(0, maxChunkSize));
          }
        } else {
          currentChunk = testChunk;
        }
      }
    } else {
      const testChunk = currentChunk + (currentChunk ? '\n\n' : '') + paragraph;
      
      if (getContentSizeBytes(testChunk) > maxChunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = paragraph;
        } else {
          chunks.push(paragraph);
        }
      } else {
        currentChunk = testChunk;
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

/**
 * React hook for real-time content size validation
 */
export function useContentSizeValidation(content: string) {
  const validation = validateContentSize(content);
  
  return {
    ...validation,
    isOverLimit: !validation.isValid,
    isWarning: validation.category.level === 'warning',
    isError: validation.category.level === 'error',
    percentage: (validation.sizeBytes / MAX_CONTENT_SIZE_BYTES) * 100,
  };
}

/**
 * Example monitoring queries for database
 */
export const MONITORING_QUERIES = {
  // Get size distribution statistics
  getSizeStats: () => `SELECT * FROM get_embedding_size_stats();`,
  
  // Find large content approaching limit
  getLargeContent: () => `
    SELECT id, company_id, size_kb, size_category 
    FROM embedding_size_monitor 
    WHERE content_size_bytes > ${WARNING_THRESHOLD_BYTES}
    ORDER BY content_size_bytes DESC;
  `,
  
  // Monitor average content sizes
  getAverageSize: () => `
    SELECT 
      AVG(content_size_bytes) as avg_bytes,
      COUNT(*) as total_embeddings,
      MAX(content_size_bytes) as max_size
    FROM embeddings;
  `,
  
  // Find content by size category
  getBySizeCategory: (category: string) => `
    SELECT * FROM embedding_size_monitor 
    WHERE size_category = '${category}';
  `
};

export default {
  validateContentSize,
  getContentSizeBytes,
  formatBytes,
  getSizeCategory,
  chunkContent,
  useContentSizeValidation,
  MAX_CONTENT_SIZE_BYTES,
  WARNING_THRESHOLD_BYTES,
  MAX_CONTENT_SIZE_KB,
  WARNING_THRESHOLD_KB,
  MONITORING_QUERIES
}; 