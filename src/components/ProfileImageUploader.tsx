'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, User, Loader2, ExternalLink, Download } from 'lucide-react'
import { upload } from '@vercel/blob/client'

interface ProfileImageUploaderProps {
  onUploadSuccess: (imageUrl: string) => void
  onUploadError?: (error: string) => void
  currentImageUrl?: string
  disabled?: boolean
  className?: string
}

interface UploadState {
  uploading: boolean
  dragActive: boolean
  previewUrl: string | null
  error: string | null
  loadingMessage: string
}

export default function ProfileImageUploader({
  onUploadSuccess,
  onUploadError,
  currentImageUrl,
  disabled = false,
  className = ''
}: ProfileImageUploaderProps) {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    dragActive: false,
    previewUrl: currentImageUrl || null,
    error: null,
    loadingMessage: 'Uploading profile image...'
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a valid image file (JPG, PNG, GIF, or WebP)'
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return 'File size must be less than 5MB'
    }

    return null
  }

  const uploadFile = async (file: File) => {
    console.log('📸 [ProfileImageUploader] Starting profile image upload:', file.name, `(${file.type})`)

    const validationError = validateFile(file)
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }))
      onUploadError?.(validationError)
      return
    }

    setState(prev => ({ 
      ...prev, 
      uploading: true, 
      error: null,
      previewUrl: URL.createObjectURL(file),
      loadingMessage: 'Uploading profile image...'
    }))

    try {
      // Upload to Vercel Blob using the existing upload-logo endpoint
      const blob = await upload(`profile-images/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload-logo', // Reuse existing endpoint
      })

      console.log('✅ [ProfileImageUploader] Upload successful:', blob.url)
      setState(prev => ({ 
        ...prev, 
        uploading: false,
        previewUrl: blob.url
      }))
      onUploadSuccess(blob.url)

    } catch (error) {
      console.error('❌ [ProfileImageUploader] Upload failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setState(prev => ({ 
        ...prev, 
        uploading: false, 
        error: errorMessage,
        previewUrl: currentImageUrl || null
      }))
      onUploadError?.(errorMessage)
    }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return
    uploadFile(files[0])
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setState(prev => ({ ...prev, dragActive: true }))
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState(prev => ({ ...prev, dragActive: false }))
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState(prev => ({ ...prev, dragActive: false }))
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files)
    }
  }, [disabled])

  const handleClick = () => {
    if (!disabled && !state.uploading) {
      fileInputRef.current?.click()
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setState(prev => ({ 
      ...prev, 
      previewUrl: null,
      error: null
    }))
    onUploadSuccess('') // Clear the URL
  }

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = 'profile-image.jpg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('❌ [ProfileImageUploader] Download failed:', error)
    }
  }

  const isLoading = state.uploading
  const hasImage = state.previewUrl || currentImageUrl
  const displayUrl = state.previewUrl || currentImageUrl

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${state.dragActive ? 'border-cobalt-pulse bg-blue-900/10' : 'border-gray-600 hover:border-gray-500'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${hasImage ? 'bg-gray-800/50' : 'bg-gray-800/20'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled || isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-cobalt-pulse animate-spin" />
            <p className="text-sm text-gray-300">{state.loadingMessage}</p>
          </div>
        ) : hasImage ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img
                src={displayUrl || ''}
                alt="Profile preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-600"
              />
              <button
                onClick={handleRemove}
                className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-300">Profile image uploaded</p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (displayUrl) handleDownload(displayUrl)
                }}
                className="text-gray-400 hover:text-gray-300"
                type="button"
                title="Download image"
              >
                <Download className="w-4 h-4" />
              </button>
              {displayUrl && (
                <a
                  href={displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-gray-400 hover:text-gray-300"
                  title="View full size"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <p className="text-xs text-gray-400">Click to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">
                Upload Profile Image
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Drag & drop or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG, GIF, WebP up to 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-3 py-2 rounded text-sm">
          ⚠️ {state.error}
        </div>
      )}

      {/* Current URL Display (for debugging/reference) */}
      {displayUrl && (
        <div className="text-xs text-gray-500 break-all">
          <strong>URL:</strong> {displayUrl}
        </div>
      )}
    </div>
  )
} 