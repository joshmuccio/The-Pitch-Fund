'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, X } from 'lucide-react'

type TagOption = {
  value: string
  label: string
  count: number
}

interface TagSelectorProps {
  value: string[] // Array of selected tag values
  onChange: (tags: string[]) => void
  placeholder?: string
  disabled?: boolean
  maxTags?: number
  showCount?: boolean
  tagType: 'industry' | 'business_model' | 'keywords'
  className?: string
}

export default function TagSelector({
  value = [],
  onChange,
  placeholder = 'Select tags...',
  disabled = false,
  maxTags = 10,
  showCount = true,
  tagType,
  className = ''
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [availableTags, setAvailableTags] = useState<TagOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch available tags from API
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/tags')
        
        if (!response.ok) {
          throw new Error('Failed to fetch tags')
        }
        
        const data = await response.json()
        let tags = []
        
        if (tagType === 'industry') {
          tags = data.industryTags
        } else if (tagType === 'business_model') {
          tags = data.businessModelTags
        } else if (tagType === 'keywords') {
          tags = data.keywords
        }
        
        setAvailableTags(tags || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching tags:', err)
        setError('Failed to load tags')
        setAvailableTags([])
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [tagType])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter tags based on search term
  const filteredTags = availableTags.filter(tag =>
    tag.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get selected tag objects (including new keywords not in database)
  const selectedTags = value.map(tagValue => {
    // First try to find in available tags
    const existingTag = availableTags.find(tag => tag.value === tagValue)
    if (existingTag) {
      return existingTag
    }
    
    // For keywords, create virtual tag for new keywords not in database
    if (tagType === 'keywords') {
      return {
        value: tagValue,
        label: tagValue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count: 0 // New keywords have no usage count
      }
    }
    
    // For other tag types, only show if it exists in database
    return null
  }).filter(Boolean) as TagOption[]

  // Handle tag selection
  const handleTagSelect = (tagValue: string) => {
    if (disabled) return
    
    if (value.includes(tagValue)) {
      // Remove tag
      onChange(value.filter(v => v !== tagValue))
    } else {
      // Add tag (if under max limit)
      if (value.length < maxTags) {
        onChange([...value, tagValue])
      }
    }
    
    setSearchTerm('')
    inputRef.current?.focus()
  }

  // Handle tag removal
  const handleTagRemove = (tagValue: string) => {
    if (disabled) return
    onChange(value.filter(v => v !== tagValue))
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchTerm('')
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredTags.length > 0 && searchTerm) {
        const firstMatch = filteredTags[0]
        if (!value.includes(firstMatch.value)) {
          handleTagSelect(firstMatch.value)
        }
      }
    }
  }

  const baseClasses = `relative w-full ${className}`
  const inputClasses = `w-full min-h-[42px] px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'
  }`

  return (
    <div className={baseClasses} ref={dropdownRef}>
      {/* Main input area */}
      <div
        className={inputClasses}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <div className="flex flex-wrap gap-1 items-center">
          {/* Selected tags */}
          {selectedTags.map((tag) => {
            const isNewKeyword = tagType === 'keywords' && tag.count === 0 && !availableTags.find(t => t.value === tag.value)
            return (
              <span
                key={tag.value}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  isNewKeyword 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-cobalt-pulse/20 text-cobalt-pulse'
                }`}
              >
                {tag.label}
                {isNewKeyword && (
                  <span className="text-green-400/80 text-[10px] font-bold">NEW</span>
                )}
                {showCount && tag.count > 0 && (
                  <span className={isNewKeyword ? "text-green-400/60" : "text-cobalt-pulse/60"}>({tag.count})</span>
                )}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTagRemove(tag.value)
                    }}
                    className="hover:text-red-400 transition-colors"
                    aria-label={`Remove ${tag.label} tag`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            )
          })}
          
          {/* Search input */}
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedTags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] bg-transparent outline-none text-platinum-mist placeholder-gray-400"
            disabled={disabled}
          />
          
          {/* Dropdown arrow */}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-pitch-black border border-gray-600 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
          {loading && (
            <div className="px-3 py-2 text-gray-400 text-sm">Loading tags...</div>
          )}
          
          {error && (
            <div className="px-3 py-2 text-red-400 text-sm">{error}</div>
          )}
          
          {!loading && !error && filteredTags.length === 0 && (
            <div className="px-3 py-2 text-gray-400 text-sm">
              {searchTerm ? 'No tags found' : 'No tags available'}
            </div>
          )}
          
          {!loading && !error && filteredTags.length > 0 && (
            <div className="py-1">
              {filteredTags.map((tag) => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => handleTagSelect(tag.value)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-800 transition-colors flex items-center justify-between ${
                    value.includes(tag.value) ? 'bg-cobalt-pulse/10 text-cobalt-pulse' : 'text-platinum-mist'
                  }`}
                  disabled={!value.includes(tag.value) && value.length >= maxTags}
                >
                  <span className="flex-1">{tag.label}</span>
                  {showCount && tag.count > 0 && (
                    <span className="text-xs text-gray-400">({tag.count})</span>
                  )}
                  {value.includes(tag.value) && (
                    <span className="text-xs text-cobalt-pulse ml-2">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
          
          {/* Max tags reached message */}
          {value.length >= maxTags && (
            <div className="px-3 py-2 text-xs text-orange-400 border-t border-gray-700">
              Maximum {maxTags} tags selected
            </div>
          )}
        </div>
      )}
    </div>
  )
} 