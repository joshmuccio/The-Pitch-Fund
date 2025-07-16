'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, Loader2, ExternalLink, Zap } from 'lucide-react'
import { upload } from '@vercel/blob/client'

interface LogoUploaderProps {
  onUploadSuccess: (originalUrl: string) => void
  onSvgUploadSuccess?: (svgUrl: string) => void
  onUploadError?: (error: string) => void
  currentLogoUrl?: string
  currentSvgUrl?: string
  disabled?: boolean
  className?: string
}

interface UploadState {
  uploading: boolean
  vectorizing: boolean
  dragActive: boolean
  previewUrl: string | null
  svgUrl: string | null
  error: string | null
  loadingMessage: string
}

export default function LogoUploader({
  onUploadSuccess,
  onSvgUploadSuccess,
  onUploadError,
  currentLogoUrl,
  currentSvgUrl,
  disabled = false,
  className = ''
}: LogoUploaderProps) {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    vectorizing: false,
    dragActive: false,
    previewUrl: currentLogoUrl || null,
    svgUrl: currentSvgUrl || null,
    error: null,
    loadingMessage: 'Uploading logo...'
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a valid image file (JPG, PNG, GIF, BMP, TIFF, SVG, or WebP)'
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return 'File size must be less than 5MB'
    }

    return null
  }

  const uploadOriginalFile = async (file: File) => {
    console.log('🎨 [LogoUploader] Starting original upload:', file.name, `(${file.type})`)

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
      loadingMessage: 'Uploading original logo...'
    }))

    try {
      // Upload original file to Vercel Blob
      const blob = await upload(`logos/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload-logo',
      })

      console.log('✅ [LogoUploader] Original upload successful:', blob.url)
      setState(prev => ({ 
        ...prev, 
        uploading: false,
        previewUrl: blob.url,
        svgUrl: null // Clear any previous SVG
      }))
      onUploadSuccess(blob.url)

      // Auto-trigger vectorization if it's a supported format
      const supportedForVectorization = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp', 'image/tiff']
      if (supportedForVectorization.includes(file.type)) {
        setTimeout(() => vectorizeImage(blob.url), 500) // Small delay for better UX
      }

    } catch (error) {
      console.error('❌ [LogoUploader] Upload failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setState(prev => ({ 
        ...prev, 
        uploading: false, 
        error: errorMessage,
        previewUrl: currentLogoUrl || null
      }))
      onUploadError?.(errorMessage)
    }
  }

  const vectorizeImage = async (imageUrl: string) => {
    console.log('🎨 [LogoUploader] Starting vectorization for:', imageUrl)

    setState(prev => ({ 
      ...prev, 
      vectorizing: true, 
      error: null,
      loadingMessage: 'Creating scalable SVG version...'
    }))

    try {
      const response = await fetch('/api/vectorize-logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        console.log('✅ [LogoUploader] Vectorization successful:', result.svgUrl)
        console.log(`📊 [LogoUploader] File optimized: ${result.originalSize}B → ${result.svgSize}B (${result.conversionRatio}% reduction)`)
        
        setState(prev => ({ 
          ...prev, 
          vectorizing: false,
          svgUrl: result.svgUrl
        }))
        onSvgUploadSuccess?.(result.svgUrl)
      } else {
        console.log('⚠️ [LogoUploader] Vectorization failed:', result.error)
        setState(prev => ({ 
          ...prev, 
          vectorizing: false,
          error: `SVG creation failed: ${result.error}`
        }))
      }
    } catch (error) {
      console.error('❌ [LogoUploader] Vectorization failed:', error)
      setState(prev => ({ 
        ...prev, 
        vectorizing: false,
        error: 'SVG creation failed: ' + (error instanceof Error ? error.message : 'Unknown error')
      }))
    }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return
    uploadOriginalFile(files[0])
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
    if (!disabled && !state.uploading && !state.vectorizing) {
      fileInputRef.current?.click()
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setState(prev => ({ 
      ...prev, 
      previewUrl: null,
      svgUrl: null,
      error: null
    }))
    onUploadSuccess('')
    onSvgUploadSuccess?.('')
  }

  const isLoading = state.uploading || state.vectorizing

  return (
    <div className={`w-full mb-2 ${className}`}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer
          ${state.dragActive ? 'border-cobalt-pulse bg-cobalt-pulse/10' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isLoading ? 'pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center">
          {state.previewUrl ? (
            <div className="relative mb-4">
              <img 
                src={state.previewUrl} 
                alt="Logo preview" 
                className="max-h-32 max-w-full object-contain rounded" 
              />
              <button
                onClick={handleRemove}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center mb-4">
              {isLoading ? (
                <Loader2 className="h-12 w-12 text-cobalt-pulse animate-spin mb-2" />
              ) : (
                <Upload className="h-12 w-12 text-gray-400 mb-2" />
              )}
            </div>
          )}

          {isLoading ? (
            <div className="text-center">
              <p className="text-sm font-medium text-cobalt-pulse">{state.loadingMessage}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-cobalt-pulse h-2 rounded-full animate-pulse w-3/4"></div>
              </div>
            </div>
          ) : state.previewUrl ? (
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600 text-center">
                Click to replace or drag and drop a new image
              </p>
              
              {/* Original Logo Info */}
              <div className="text-xs text-gray-500">
                <p>✅ Original logo uploaded</p>
              </div>

              {/* SVG Status */}
              {state.svgUrl ? (
                <div className="bg-green-50 border border-green-200 rounded p-2 text-xs">
                  <p className="text-green-700 font-medium">✅ SVG version created!</p>
                  <a 
                    href={state.svgUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-800 underline inline-flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Test SVG <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ) : state.previewUrl && !state.vectorizing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    vectorizeImage(state.previewUrl!)
                  }}
                  className="text-xs bg-cobalt-pulse text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors inline-flex items-center gap-1"
                  type="button"
                >
                  <Zap className="h-3 w-3" />
                  Create SVG Version
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-600 text-center">
              Click to upload or drag and drop an image
            </p>
          )}

          {state.error && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {state.error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 