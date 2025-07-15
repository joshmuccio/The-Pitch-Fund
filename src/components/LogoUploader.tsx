'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { upload } from '@vercel/blob/client'

interface LogoUploaderProps {
  onUploadSuccess: (url: string) => void
  onUploadError?: (error: string) => void
  currentLogoUrl?: string
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

export default function LogoUploader({
  onUploadSuccess,
  onUploadError,
  currentLogoUrl,
  disabled = false,
  className = ''
}: LogoUploaderProps) {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    dragActive: false,
    previewUrl: currentLogoUrl || null,
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

  const uploadFile = async (file: File) => {
    console.log('🎨 [LogoUploader] Starting upload:', file.name, `(${file.type})`)

    const validationError = validateFile(file)
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }))
      onUploadError?.(validationError)
      return
    }

    // Determine if we should try vectorization (supports PNG, JPEG, GIF, BMP, TIFF)
    const supportedForVectorization = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp', 'image/tiff']
    const shouldVectorize = supportedForVectorization.includes(file.type)
    const loadingMessage = shouldVectorize ? 'Creating scalable logo...' : 'Uploading logo...'

    setState(prev => ({ 
      ...prev, 
      uploading: true, 
      error: null,
      previewUrl: URL.createObjectURL(file),
      loadingMessage
    }))

    try {
              if (shouldVectorize) {
        // Try vectorization first
        console.log('🎨 [LogoUploader] Creating scalable SVG logo...')
        
        const formData = new FormData()
        formData.append('file', file)

        const vectorizeResponse = await fetch('/api/vectorize-and-upload', {
          method: 'POST',
          body: formData
        })

        const vectorizeResult = await vectorizeResponse.json()

        if (vectorizeResponse.ok && vectorizeResult.success) {
          console.log('✅ [LogoUploader] Scalable SVG logo created successfully:', vectorizeResult.url)
          console.log(`📊 [LogoUploader] File optimized: ${vectorizeResult.originalSize}B → ${vectorizeResult.svgSize}B`)
          
          setState(prev => ({ 
            ...prev, 
            uploading: false,
            previewUrl: vectorizeResult.url
          }))
          onUploadSuccess(vectorizeResult.url)
          return
        } else {
          // Vectorization failed, fallback to original image upload
          console.log('⚠️ [LogoUploader] SVG conversion failed, uploading original image:', vectorizeResult.error)
        }
      }

      // Fallback to original upload flow (for non-PNG files or when vectorization fails)
      console.log('🎨 [LogoUploader] Using standard upload flow...')
      const blob = await upload(`logos/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload-logo',
      })

      console.log('✅ [LogoUploader] Standard upload successful:', blob.url)
      setState(prev => ({ 
        ...prev, 
        uploading: false,
        previewUrl: blob.url
      }))
      onUploadSuccess(blob.url)

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
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }, [disabled])

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setState(prev => ({ 
      ...prev, 
      previewUrl: null, 
      error: null 
    }))
    onUploadSuccess('') // Clear the logo URL
  }

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer
          ${state.dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${state.error ? 'border-red-500 bg-red-50' : ''}
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
          disabled={disabled}
        />

        {state.uploading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
            <p className="text-sm text-gray-600">{state.loadingMessage}</p>
          </div>
        ) : state.previewUrl ? (
          <div className="flex flex-col items-center">
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
            <p className="text-sm text-gray-600 text-center">
              Click to replace or drag and drop a new image
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <ImageIcon className="h-6 w-6 text-gray-400" />
              </div>
            </div>
            
            <div className="flex items-center justify-center mb-2">
              <Upload className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                Upload company logo
              </span>
            </div>
            
            <p className="text-xs text-gray-500 text-center">
              Drag and drop or click to select
              <br />
              Supports JPG, PNG, GIF, BMP, TIFF, SVG, WebP (max 5MB)
              <br />
              <span className="text-blue-600">Images automatically converted to scalable, CSS-styleable SVG</span>
            </p>
          </div>
        )}
      </div>

      {state.error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex justify-between items-start">
            <p className="text-sm text-red-700">{state.error}</p>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 