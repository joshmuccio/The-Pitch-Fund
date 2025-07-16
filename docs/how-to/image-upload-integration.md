# How to Integrate Image Upload & SVG Conversion

This guide shows how to integrate the image upload and SVG conversion system into your forms and components.

## Quick Integration

### 1. Add Component to Form

```typescript
import { LogoUploader } from '@/components/LogoUploader'

function CompanyForm() {
  const [logoUrl, setLogoUrl] = useState('')
  const [svgUrl, setSvgUrl] = useState('')

  return (
    <form>
      {/* Other form fields */}
      
      <LogoUploader
        currentLogoUrl={logoUrl}
        currentSvgUrl={svgUrl}
        onUploadSuccess={(url) => setLogoUrl(url)}
        onSvgUploadSuccess={(url) => setSvgUrl(url)}
      />
    </form>
  )
}
```

### 2. Add to Schema (Zod)

```typescript
// Required validation
const schema = z.object({
  logo_url: z.string().url('Must be a valid URL').min(1, 'Company logo is required'),
  svg_logo_url: z.string().url('Must be a valid URL').optional().or(z.literal(''))
})

// Optional validation (for real-time)
const partialSchema = z.object({
  logo_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  svg_logo_url: z.string().url('Must be a valid URL').optional().or(z.literal(''))
})
```

### 3. React Hook Form Integration

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

function FormWithUpload() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      logo_url: '',
      svg_logo_url: ''
    }
  })

  const { setValue, watch } = form
  const logoUrl = watch('logo_url')
  const svgUrl = watch('svg_logo_url')

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <LogoUploader
        currentLogoUrl={logoUrl}
        currentSvgUrl={svgUrl}
        onUploadSuccess={(url) => setValue('logo_url', url, { shouldValidate: true })}
        onSvgUploadSuccess={(url) => setValue('svg_logo_url', url, { shouldValidate: true })}
      />
    </form>
  )
}
```

## Advanced Integration

### Custom Upload Handling

```typescript
async function handleCustomUpload(file: File) {
  try {
    // Step 1: Upload original image
    const uploadResponse = await fetch('/api/upload-logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pathname: `logos/${file.name}`,
        contentType: file.type
      })
    })

    const { url: originalUrl } = await uploadResponse.json()
    
    // Step 2: Convert to SVG
    const vectorizeResponse = await fetch('/api/vectorize-logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: originalUrl })
    })

    const { svgUrl } = await vectorizeResponse.json()

    return { originalUrl, svgUrl }
  } catch (error) {
    console.error('Upload failed:', error)
    throw error
  }
}
```

### Database Save Logic

```typescript
// Form submission
async function saveCompany(data: CompanyFormData) {
  const companyData = {
    ...data,
    logo_url: data.logo_url || null,
    svg_logo_url: data.svg_logo_url || null
  }

  const { data: company, error } = await supabase
    .from('companies')
    .insert(companyData)
    .select()
    .single()

  if (error) throw error
  return company
}
```

## Component Props Reference

### LogoUploader Props

```typescript
interface LogoUploaderProps {
  currentLogoUrl?: string        // Current original image URL
  currentSvgUrl?: string         // Current SVG URL
  onUploadSuccess: (url: string) => void       // Called when original upload completes
  onSvgUploadSuccess: (url: string) => void    // Called when SVG conversion completes
  className?: string             // Additional CSS classes
  disabled?: boolean             // Disable the uploader
}
```

## Error Handling

### Component Level

```typescript
function FormWithErrorHandling() {
  const [uploadError, setUploadError] = useState('')

  const handleUploadError = (error: string) => {
    setUploadError(error)
    // Clear error after 5 seconds
    setTimeout(() => setUploadError(''), 5000)
  }

  return (
    <div>
      {uploadError && (
        <div className="text-red-600 mb-4">{uploadError}</div>
      )}
      
      <LogoUploader
        onUploadSuccess={(url) => {
          setUploadError('')
          setLogoUrl(url)
        }}
        onError={handleUploadError}
      />
    </div>
  )
}
```

### API Level Error Handling

```typescript
async function safeUpload(file: File) {
  try {
    const result = await handleCustomUpload(file)
    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}
```

## Testing

### Manual Testing Checklist

1. **File Types**: Test PNG, JPEG, GIF, BMP, TIFF
2. **File Sizes**: Test under 5MB limit and over limit
3. **Network Issues**: Test with slow/interrupted connections
4. **SVG Quality**: Verify SVG renders correctly in browsers
5. **Error Recovery**: Test retry functionality

### Test Files

```typescript
// Generate test files for different scenarios
const testFiles = {
  small: new File([new ArrayBuffer(1000)], 'small.png', { type: 'image/png' }),
  large: new File([new ArrayBuffer(6000000)], 'large.png', { type: 'image/png' }),
  invalid: new File([new ArrayBuffer(1000)], 'invalid.txt', { type: 'text/plain' })
}
```

## Performance Tips

### Optimize Upload Experience

1. **Show Progress**: Use loading states during upload
2. **Validate Early**: Check file size/type before upload
3. **Cache Results**: Store URLs to avoid re-upload
4. **Lazy Load**: Only load uploader when needed

### Production Considerations

1. **CDN Caching**: Vercel Blob provides global CDN
2. **Error Monitoring**: Sentry tracks all upload failures
3. **Rate Limiting**: Handled at platform level
4. **Security**: Files stored in secure Vercel Blob storage

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Upload fails | File too large | Check 5MB limit |
| SVG not showing | XML syntax error | Check browser dev tools |
| Slow uploads | Network issues | Add retry logic |
| Component not updating | State management | Use proper setValue calls |

### Debug Mode

```typescript
// Enable debug logging
const DEBUG_UPLOADS = process.env.NODE_ENV === 'development'

function debugLog(message: string, data?: any) {
  if (DEBUG_UPLOADS) {
    console.log(`[LogoUploader] ${message}`, data)
  }
}
``` 