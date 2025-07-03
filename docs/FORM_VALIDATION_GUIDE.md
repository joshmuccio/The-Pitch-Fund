# Form Validation Guide

This document outlines the zod schema validation implementation for The Pitch Fund admin forms.

## ✅ **Implementation Complete**

### **1. Zod Schemas** (`src/lib/validation-schemas.ts`)

```typescript
// Company validation with portfolio analytics
export const CompanySchema = z.object({
  // Required fields
  name: z.string().min(1, 'Company name is required').max(255),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  
  // Portfolio analytics (NEW)
  country: z.string().length(2).regex(/^[A-Z]{2}$/),
  stage_at_investment: z.enum(['pre_seed', 'seed']),
  pitch_season: z.number().int().positive(),
  
  // Financial metrics with proper validation
  annual_revenue_usd: z.number().positive().optional(),
  users: z.number().int().min(0).optional(),
  // ... and more
})

// Combined form schema
export const CompanyFormSchema = CompanySchema.merge(FounderSchema)
```

### **2. Validation Features**

#### **Portfolio Analytics Validation**
- ✅ **Country**: ISO-3166-1 alpha-2 codes (e.g., 'US', 'GB')
- ✅ **Investment Stage**: Enum validation for 'pre_seed' | 'seed' 
- ✅ **Podcast Season**: Positive integers only (≥ 1)

#### **Business Rules Enforced**
- ✅ **URLs**: Valid URL format or empty
- ✅ **Email**: Valid email format for founders
- ✅ **Numbers**: Positive values for financial metrics
- ✅ **Text Length**: Reasonable limits on all text fields
- ✅ **Slugs**: Lowercase, alphanumeric + hyphens only

### **3. UI Integration**

#### **Error Display Component**
```typescript
const ErrorDisplay = ({ fieldName }: { fieldName: string }) => {
  const errors = validationErrors[fieldName]
  if (!errors || errors.length === 0) return null
  
  return (
    <div className="mt-1">
      {errors.map((error, index) => (
        <p key={index} className="text-red-400 text-xs">{error}</p>
      ))}
    </div>
  )
}
```

#### **Visual Feedback**
- ❌ **Red borders** on invalid fields
- 📝 **Specific error messages** below each field
- 🔄 **Real-time validation** on form submit

## 🛠️ **How It Works**

### **Form Submission Flow**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // 1. Prepare form data (convert strings to numbers, etc.)
  const preparedData = prepareFormDataForValidation(formData)
  
  // 2. Validate with zod
  const validationResult = CompanyFormSchema.safeParse(preparedData)
  
  // 3. Handle validation errors
  if (!validationResult.success) {
    setValidationErrors(parseZodErrors(validationResult.error))
    return
  }
  
  // 4. Use validated data for database operations
  const validatedData = validationResult.data
  // ... save to database
}
```

### **Data Transformation**
The `prepareFormDataForValidation()` helper:
- ✅ Converts string numbers to actual numbers
- ✅ Converts empty strings to undefined
- ✅ Normalizes country codes to uppercase
- ✅ Handles edge cases in form data

## 📋 **Validation Rules Reference**

### **Company Fields**
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| `name` | string | 1-255 chars | ✅ |
| `slug` | string | lowercase, alphanumeric+hyphens | ✅ |
| `country` | string | ISO-3166-1 alpha-2 | ❌ |
| `stage_at_investment` | enum | 'pre_seed' \| 'seed' | ✅ |
| `pitch_season` | number | positive integer | ❌ |
| `instrument` | enum | 'safe_post' \| 'safe_pre' \| 'convertible_note' \| 'equity' | ✅ |
| `conversion_cap_usd` | number | positive (SAFE/note only) | ❌ |
| `discount_percent` | number | 0-100 (SAFE/note only) | ❌ |
| `post_money_valuation` | number | positive (equity only) | ❌ |
| `annual_revenue_usd` | number | positive | ❌ |
| `users` | number | non-negative integer | ❌ |
| `founded_year` | number | 1800 - (current year + 10) | ❌ |

### **Founder Fields**
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| `founder_email` | string | valid email format | ✅ |
| `founder_name` | string | max 255 chars | ❌ |
| `founder_linkedin_url` | string | valid URL | ❌ |
| `founder_role` | enum | 'solo_founder' \| 'cofounder' | ✅ |
| `founder_bio` | string | max 1000 chars | ❌ |

## 🚀 **Usage Examples**

### **In React Components**
```typescript
import { CompanyFormSchema, prepareFormDataForValidation } from '@/lib/validation-schemas'

// Validate form data
const result = CompanyFormSchema.safeParse(prepareFormDataForValidation(formData))

if (result.success) {
  // Use result.data - it's fully typed and validated
  await saveToDatabase(result.data)
} else {
  // Display result.error.errors to user
  setValidationErrors(parseErrors(result.error))
}
```

### **TypeScript Integration**
```typescript
import type { CompanyFormData } from '@/lib/validation-schemas'

// Fully typed validated data
const handleValidatedData = (data: CompanyFormData) => {
  // TypeScript knows these fields are validated
  console.log(data.country) // string | undefined
  console.log(data.stage_at_investment) // 'pre_seed' | 'seed'
  console.log(data.pitch_season) // number | undefined
}
```

## 🚀 **Investment Instrument Conditional Validation**

### **Conditional Field Logic**
The form dynamically shows/hides fields based on the selected investment instrument:

```typescript
import { useWatch } from 'react-hook-form';

const instrument = useWatch({ control, name: 'instrument' });
const isSafeLike = ['safe_post', 'safe_pre', 'convertible_note'].includes(instrument);
const isEquityLike = instrument === 'equity';

// Conditional rendering in form
{isSafeLike && (
  <>
    <Input {...register('conversion_cap_usd')} label="Valuation cap (USD)" />
    <Input {...register('discount_percent')} label="Discount %" />
  </>
)}

{isEquityLike && (
  <Input {...register('post_money_valuation')} label="Post-money valuation (USD)" />
)}
```

### **Investment Instrument Types**
- **SAFE (Post-Money)**: Conversion cap and discount fields available
- **SAFE (Pre-Money)**: Conversion cap and discount fields available  
- **Convertible Note**: Conversion cap and discount fields available
- **Priced Equity**: Post-money valuation field available

### **Data Integrity**
Database constraints ensure:
- SAFEs/Notes cannot have post-money valuations
- Equity deals cannot have conversion caps or discounts
- Proper field validation prevents inconsistent data entry

## 🔧 **Analytics & Tracking**

Form validation errors are tracked for analytics:
```typescript
track('admin_company_form_validation_error', { 
  action: company ? 'edit' : 'create',
  company_name: formData.name,
  error_fields: Object.keys(errors).join(', '),
  location: 'admin_dashboard' 
});
```

### **Sentry Error Monitoring Integration**

Form validation failures and database errors are automatically tracked in Sentry for production debugging:

#### **Validation Error Tracking**
```typescript
// Report validation errors to Sentry for monitoring
Sentry.captureMessage('Admin form validation failed', {
  level: 'warning',
  tags: {
    component: 'CompanyFounderForm',
    operation: 'formValidation',
    action: company ? 'edit' : 'create'
  },
  extra: {
    company_name: formData.name,
    validation_errors: errors,
    error_count: Object.keys(errors).length
  }
});
```

#### **Database Error Tracking**
```typescript
// Report database save failures to Sentry
Sentry.captureException(error, {
  tags: {
    component: 'CompanyFounderForm',
    operation: 'saveCompanyAndFounder',
    action: company ? 'edit' : 'create'
  },
  extra: {
    company_name: formData.name,
    has_founder_data: !!formData.founder_email,
    company_id: company?.id
  }
});
```

#### **Client-Side Error Handling**
```typescript
// Enhanced ErrorBoundary with Sentry integration
import * as Sentry from '@sentry/nextjs';

componentDidCatch(error: Error, errorInfo: any) {
  Sentry.captureException(error, {
    tags: {
      component: 'ErrorBoundary',
      environment: process.env.NODE_ENV,
    },
    extra: {
      errorInfo,
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    }
  });
}
```

### **Error Monitoring Benefits**
- **Production Debugging**: Real-time error reports with full context
- **Form Optimization**: Track common validation failures to improve UX
- **Performance Monitoring**: Identify slow form submissions and database operations
- **Quality Assurance**: Catch edge cases and validation issues in production

## 🎯 **Benefits Achieved**

1. **Type Safety**: Full TypeScript integration with inferred types
2. **User Experience**: Immediate, specific error feedback
3. **Data Integrity**: Consistent validation before database saves
4. **Developer Experience**: Easy to extend and maintain
5. **Analytics**: Track validation errors for form improvements
6. **Performance**: Client-side validation prevents unnecessary API calls

The form now provides enterprise-grade validation for all portfolio analytics fields while maintaining excellent user experience! 🎉 