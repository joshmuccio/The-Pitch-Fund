# ✅ Form Validation

This guide shows you how to implement and debug form validation in The Pitch Fund application.

## Quick Reference

| Task | Solution |
|------|----------|
| Add new field validation | Add to schema in `src/lib/validation-schemas.ts` |
| Fix validation not triggering | Check Zod schema and useForm setup |
| Debug validation errors | Use browser dev tools and console.log for temporary debugging, or `log.debug()` for terminal logging |
| Handle conditional validation | Use Zod's `.refine()` method |
| Format currency inputs | Use `react-currency-input-field` |

---

## Setting Up Form Validation

### 1. Define Your Schema

Add validation rules to `src/lib/validation-schemas.ts`:

```typescript
import { z } from 'zod'

export const companyFormSchema = z.object({
  // Required text field
  company_name: z.string()
    .min(1, 'Company name is required')
    .max(100, 'Company name must be less than 100 characters'),
  
  // Email validation
  email: z.string()
    .email('Please enter a valid email address'),
  
  // Currency validation
  investment_amount: z.number()
    .positive('Investment amount must be positive')
    .min(1000, 'Minimum investment is $1,000'),
  
  // Date validation
  investment_date: z.string()
    .min(1, 'Investment date is required')
    .refine(date => {
      const parsed = new Date(date)
      return parsed instanceof Date && !isNaN(parsed.getTime())
    }, 'Please enter a valid date'),
  
  // Enum validation
  investment_instrument: z.enum(['safe', 'note', 'equity'], {
    errorMap: () => ({ message: 'Please select an investment instrument' })
  }),
  
  // Optional fields
  website_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  
  // Array validation (Three-Tag System)
  industry_tags: z.array(z.string()).optional(),
  business_model_tags: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
})

export type CompanyFormData = z.infer<typeof companyFormSchema>
```

### 2. Set Up Your Form Component

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { companyFormSchema, type CompanyFormData } from '@/lib/validation-schemas'

export default function CompanyForm() {
  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      company_name: '',
      email: '',
      investment_amount: 0,
      investment_date: '',
      investment_instrument: 'safe',
      website_url: '',
      industry_tags: [],
      business_model_tags: [],
      keywords: [],
    },
  })

  const { handleSubmit, formState: { errors } } = form

  const onSubmit = async (data: CompanyFormData) => {
    try {
      // Your form submission logic
      console.log('Form data:', data) // Browser console only
      // OR use terminal logger: log.info('[Form] Submitting data:', JSON.stringify(data))
    } catch (error) {
      console.error('Form submission error:', error)
      // OR use terminal logger: log.error('[Form] Submission failed:', error.message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

### 3. Add Field Validation

```tsx
// Text input with validation
<div>
  <label htmlFor="company_name">Company Name *</label>
  <input
    id="company_name"
    {...form.register('company_name')}
    className={errors.company_name ? 'border-red-500' : ''}
  />
  {errors.company_name && (
    <span className="text-red-500 text-sm">{errors.company_name.message}</span>
  )}
</div>

// Email input with validation
<div>
  <label htmlFor="email">Email *</label>
  <input
    id="email"
    type="email"
    {...form.register('email')}
    className={errors.email ? 'border-red-500' : ''}
  />
  {errors.email && (
    <span className="text-red-500 text-sm">{errors.email.message}</span>
  )}
</div>

// Select dropdown with validation
<div>
  <label htmlFor="investment_instrument">Investment Instrument *</label>
  <select
    id="investment_instrument"
    {...form.register('investment_instrument')}
    className={errors.investment_instrument ? 'border-red-500' : ''}
  >
    <option value="">Select instrument</option>
    <option value="safe">SAFE</option>
    <option value="note">Note</option>
    <option value="equity">Equity</option>
  </select>
  {errors.investment_instrument && (
    <span className="text-red-500 text-sm">{errors.investment_instrument.message}</span>
  )}
</div>
```

---

## Handling Complex Validation

### Currency Input Validation

```tsx
import CurrencyInput from 'react-currency-input-field'

// In your form component
<div>
  <label htmlFor="investment_amount">Investment Amount *</label>
  <CurrencyInput
    id="investment_amount"
    name="investment_amount"
    placeholder="$0"
    defaultValue={form.watch('investment_amount')}
    decimalsLimit={2}
    prefix="$"
    onValueChange={(value, name, values) => {
      form.setValue('investment_amount', values?.float ?? 0)
    }}
    className={errors.investment_amount ? 'border-red-500' : ''}
  />
  {errors.investment_amount && (
    <span className="text-red-500 text-sm">{errors.investment_amount.message}</span>
  )}
</div>
```

### Conditional Validation

```typescript
// Schema with conditional validation
export const investmentSchema = z.object({
  investment_instrument: z.enum(['safe', 'note', 'equity']),
  conversion_cap: z.number().optional(),
  post_money_valuation: z.number().optional(),
}).refine(data => {
  // For SAFE/Note, require conversion cap
  if (['safe', 'note'].includes(data.investment_instrument)) {
    return data.conversion_cap && data.conversion_cap > 0
  }
  // For Equity, require post-money valuation
  if (data.investment_instrument === 'equity') {
    return data.post_money_valuation && data.post_money_valuation > 0
  }
  return true
}, {
  message: 'Please provide appropriate valuation information',
  path: ['conversion_cap'] // or dynamically determine path
})
```

### Dynamic Fields Validation

```typescript
// For arrays of founders
export const foundersSchema = z.object({
  founders: z.array(
    z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Valid email required'),
      role: z.enum(['founder', 'cofounder']),
      bio: z.string().optional(),
    })
  ).min(1, 'At least one founder is required'),
})

// In your component
{fields.map((field, index) => (
  <div key={field.id}>
    <h3>Founder {index + 1}</h3>
    <input
      {...form.register(`founders.${index}.name`)}
      placeholder="Full Name"
    />
    {errors.founders?.[index]?.name && (
      <span className="text-red-500">
        {errors.founders[index].name.message}
      </span>
    )}
    
    <input
      {...form.register(`founders.${index}.email`)}
      type="email"
      placeholder="Email"
    />
    {errors.founders?.[index]?.email && (
      <span className="text-red-500">
        {errors.founders[index].email.message}
      </span>
    )}
  </div>
))}
```

---

## Debugging Validation Issues

### Common Problems & Solutions

**Problem:** Validation doesn't trigger on submit

**Solution:**
```typescript
// Check form setup
const form = useForm({
  resolver: zodResolver(yourSchema), // Make sure this is correct
  mode: 'onSubmit', // or 'onChange' for real-time validation
})

// Check submit handler
const onSubmit = async (data: YourFormData) => {
  // This only runs if validation passes
  console.log('Valid data:', data)
}

// Make sure you're using handleSubmit
<form onSubmit={handleSubmit(onSubmit)}>
```

**Problem:** Errors don't display

**Solution:**
```typescript
// Check error object structure
console.log('Form errors:', form.formState.errors)

// Ensure proper error display
{errors.fieldName && (
  <span className="text-red-500">{errors.fieldName.message}</span>
)}

// For nested errors (like arrays)
{errors.founders?.[0]?.name && (
  <span className="text-red-500">{errors.founders[0].name.message}</span>
)}
```

**Problem:** Validation runs too often (performance issues)

**Solution:**
```typescript
// Control when validation runs
const form = useForm({
  resolver: zodResolver(yourSchema),
  mode: 'onSubmit', // Only validate on submit
  // mode: 'onChange', // Validate on every change
  // mode: 'onBlur', // Validate when field loses focus
})
```

### Debug Validation Step-by-Step

1. **Check schema definition:**
   ```typescript
   // Test your schema directly
   const result = companyFormSchema.safeParse({
     company_name: 'Test Company',
     email: 'invalid-email',
     investment_amount: 1000,
   })
   
   if (!result.success) {
     console.log('Validation errors:', result.error.issues)
   }
   ```

2. **Check form data:**
   ```typescript
   // In your component
   const watchedData = form.watch()
   console.log('Current form data:', watchedData)
   ```

3. **Check form state:**
   ```typescript
   const { errors, isValid, isSubmitting } = form.formState
   console.log('Form state:', { errors, isValid, isSubmitting })
   ```

---

## Best Practices

### Schema Organization

```typescript
// Break down complex schemas
const founderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  role: z.enum(['founder', 'cofounder']),
})

const companySchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  founders: z.array(founderSchema).min(1, 'At least one founder required'),
})

// Reuse schemas
export const createInvestmentSchema = companySchema.extend({
  investment_amount: z.number().positive(),
  investment_date: z.string().min(1),
})
```

### Error Messages

```typescript
// Use descriptive error messages
const schema = z.object({
  investment_amount: z.number({
    required_error: 'Investment amount is required',
    invalid_type_error: 'Investment amount must be a number',
  })
  .positive('Investment amount must be greater than 0')
  .min(1000, 'Minimum investment is $1,000'),
})

// Custom error messages for enums
const instrumentSchema = z.enum(['safe', 'note', 'equity'], {
  errorMap: (issue, ctx) => {
    if (issue.code === 'invalid_enum_value') {
      return { message: 'Please select a valid investment instrument' }
    }
    return { message: ctx.defaultError }
  },
})
```

### Performance Optimization

```typescript
// Use React.memo for expensive form components
const FormField = React.memo(({ label, error, ...props }) => (
  <div>
    <label>{label}</label>
    <input {...props} />
    {error && <span className="text-red-500">{error.message}</span>}
  </div>
))

// Use debounced validation for expensive operations
const debouncedValidation = useMemo(
  () => debounce(async (value: string) => {
    // Expensive validation like API calls
    const isValid = await validateWithAPI(value)
    return isValid
  }, 500),
  []
)
```

---

## Testing Form Validation

### Unit Tests

```typescript
// Test schema validation
describe('companyFormSchema', () => {
  it('should validate correct data', () => {
    const validData = {
      company_name: 'Test Company',
      email: 'test@example.com',
      investment_amount: 50000,
    }
    
    const result = companyFormSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })
  
  it('should reject invalid email', () => {
    const invalidData = {
      company_name: 'Test Company',
      email: 'invalid-email',
      investment_amount: 50000,
    }
    
    const result = companyFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    expect(result.error.issues[0].message).toContain('email')
  })
})
```

### Integration Tests

```typescript
// Test form submission
it('should show validation errors on invalid submit', async () => {
  render(<CompanyForm />)
  
  // Submit without filling required fields
  fireEvent.click(screen.getByText('Submit'))
  
  // Check for error messages
  await waitFor(() => {
    expect(screen.getByText('Company name is required')).toBeInTheDocument()
  })
})
```

---

## Integration with Supabase

### Type Safety

```typescript
// Use generated Supabase types
import type { Database } from '@/types/supabase.types'

type Company = Database['public']['Tables']['companies']['Insert']

// Create schema that matches Supabase types
export const companySchema = z.object({
  company_name: z.string().min(1),
  founded_year: z.number().int().min(1900).max(new Date().getFullYear()),
  country: z.string().min(1),
  // ... other fields matching Supabase schema
}) satisfies z.ZodType<Partial<Company>>
```

### Database Validation

```typescript
// Client-side validation
const result = companySchema.safeParse(formData)
if (!result.success) {
  // Handle validation errors
  return
}

// Server-side validation (in API route)
export async function POST(request: Request) {
  const body = await request.json()
  
  // Validate again on server
  const validatedData = companySchema.parse(body)
  
  // Insert into Supabase
  const { error } = await supabase
    .from('companies')
    .insert(validatedData)
  
  if (error) {
    // Handle database errors
    return Response.json({ error: error.message }, { status: 400 })
  }
}
```

---

**Need more specific help?** Check:
- [Troubleshooting Guide](troubleshooting.md) for common form issues
- [Database Schema](../reference/database-schema.md) for field requirements
- [Zod documentation](https://zod.dev/) for advanced schema features 