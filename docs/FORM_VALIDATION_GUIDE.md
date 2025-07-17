# Form Validation Guide

This document outlines the **Zod-exclusive validation implementation** for The Pitch Fund admin forms.

## 🎯 **Recent Update: Enhanced URL Validation & Manual Input Highlighting (January 2025)**

### **✅ Enhanced URL Validation System**

The Investment Wizard now includes **domain-specific URL validation** and **visual feedback for manual input requirements**:

#### **New Validation Features:**
- ✅ **Pitch Episode URL Domain Validation**: Ensures URLs are from `thepitch.show` domain
- ✅ **Manual Input Highlighting**: Orange borders for fields that couldn't be auto-populated
- ✅ **Real-time URL Validation**: Automatic URL checking with visual status indicators
- ✅ **Smart Visual Feedback**: Color-coded borders (red for errors, orange for manual input needed)

#### **Domain-Specific Validation:**
```typescript
// Pitch Episode URL must be from thepitch.show domain
const pitchEpisodeUrlSchema = z.string().optional().or(z.literal(''))
  .refine((url) => {
    if (!url || url.trim() === '') return true; // Allow empty
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname.toLowerCase().includes('thepitch.show');
    } catch {
      return false; // Invalid URL format
    }
  }, {
    message: 'Pitch episode URL must be from thepitch.show domain'
  });
```

#### **Manual Input Highlighting System:**
```typescript
// Visual feedback system for QuickPaste results
const getFieldClasses = (fieldName: string) => {
  const hasError = formError || customError
  const needsManualInput = fieldsNeedingManualInput.has(fieldName)
  
  let borderClass = 'border-gray-600' // default
  
  if (hasError) {
    borderClass = 'border-red-500' // error (highest priority)
  } else if (needsManualInput) {
    borderClass = 'border-orange-400 bg-orange-50/5' // needs manual input
  }
  
  return `${baseClasses} ${borderClass}`
}
```

#### **Enhanced Visual States:**
- 🔴 **Red borders** - Validation errors (highest priority)
- 🟠 **Orange borders** - Fields that couldn't be auto-populated and need manual input
- 🟢 **Green borders** - Valid URLs (during URL validation)
- 🔵 **Blue borders** - URLs currently being validated
- ⚪ **Gray borders** - Default/normal field state

### **URL Validation Coverage:**
The system now validates URLs across all steps with domain-specific rules:

| Field | Validation Type | Domain Requirements |
|-------|----------------|-------------------|
| `website_url` | Format + API check | Any valid domain |
| `company_linkedin_url` | Format + API check | Any valid domain |
| `founders[].linkedin_url` | Format + API check | Any valid domain |
| `pitch_episode_url` | Format + API check + **Domain** | **Must be thepitch.show** |

## 🚀 **VC Form Validation Implementation Example**

### **VcSchema Definition** (`src/lib/validation-schemas.ts`)

```typescript
import { z } from 'zod'

// VC validation schema with required/optional field separation
export const VcSchema = z.object({
  // Required fields
  name: z.string().min(1, 'VC name is required').max(255, 'VC name too long'),
  firm_name: z.string().min(1, 'Firm name is required').max(255, 'Firm name too long'),
  role_title: z.string().min(1, 'Role/title is required').max(255, 'Role/title too long'),
  bio: z.string().min(1, 'Bio is required').max(2000, 'Bio too long (max 2000 characters)'),
  profile_image_url: z.string().url('Must be a valid URL').min(1, 'Profile image is required'),
  thepitch_profile_url: z.string().url('Must be a valid URL').min(1, 'ThePitch.show profile URL is required'),

  // Optional fields (website and social media fields below bio)
  linkedin_url: urlSchema.optional(),
  twitter_url: urlSchema.optional(),
  instagram_url: urlSchema.optional(),
  youtube_url: urlSchema.optional(),
  website_url: urlSchema.optional(),
  podcast_url: urlSchema.optional(),
})

export type VcFormData = z.infer<typeof VcSchema>
```

### **React Hook Form Integration** (`VcEditModal.tsx`)

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { VcSchema, type VcFormData } from '@/lib/validation-schemas'

export default function VcEditModal() {
  // Setup form with Zod validation
  const form = useForm<VcFormData>({
    resolver: zodResolver(VcSchema),
    defaultValues: {
      name: '',
      firm_name: '',
      role_title: '',
      bio: '',
      profile_image_url: '',
      linkedin_url: '',
      twitter_url: '',
      instagram_url: '',
      youtube_url: '',
      website_url: '',
      podcast_url: '',
      thepitch_profile_url: ''
    }
  })

  const { register, handleSubmit, formState: { errors }, setValue, watch } = form
  
  // Submit handler with validated data
  const handleSave = async (data: VcFormData) => {
    // Data is already validated by Zod schema
    console.log('Validated VC data:', data)
    
    // Clean up empty optional fields
    const payload = {
      ...data,
      linkedin_url: data.linkedin_url?.trim() || null,
      twitter_url: data.twitter_url?.trim() || null,
      // ... other optional fields
    }
    
    // Submit to API
    const response = await fetch('/api/vcs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  return (
    <form onSubmit={handleSubmit(handleSave)}>
      {/* Required field with validation */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Name *
        </label>
        <input
          type="text"
          {...register('name')}
          className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
            errors.name ? 'border-red-500' : 'border-gray-600'
          }`}
          placeholder="Charles Hudson"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">⚠ {errors.name.message}</p>
        )}
      </div>

      {/* Optional field without required validation */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          LinkedIn URL
        </label>
        <input
          type="url"
          {...register('linkedin_url')}
          className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
            errors.linkedin_url ? 'border-red-500' : 'border-gray-600'
          }`}
          placeholder="https://linkedin.com/in/..."
        />
        {errors.linkedin_url && (
          <p className="text-red-500 text-sm mt-1">⚠ {errors.linkedin_url.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={Object.keys(errors).length > 0}
        className="bg-cobalt-pulse hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50"
      >
        {isNew ? 'Create VC' : 'Update VC'}
      </button>
    </form>
  )
}
```

### **Key Features of VC Form Validation**

- ✅ **Clear Required vs Optional**: Required fields marked with asterisks (*)
- ✅ **Real-time validation**: Immediate feedback for format errors
- ✅ **URL validation integration**: Visual states for URL validation status
- ✅ **Auto-scraping support**: ThePitch.show URL triggers auto-population
- ✅ **Professional image upload**: Integration with ProfileImageUploader component
- ✅ **Consistent error styling**: Red borders and error messages across all fields

## 🎯 **Recent Update: Validation Standardization (January 2025)**

### **✅ Zod-Exclusive Validation System**

The investment wizard now uses **Zod exclusively** for all form validation, with HTML5 validation completely removed to prevent conflicts and ensure consistent user experience.

#### **Key Changes Made:**
- ❌ **Removed HTML5 validation attributes**: `required`, `pattern`, `minLength`, `maxLength`, `min`, `max`
- ✅ **Standardized error styling**: All form fields now use consistent red border highlighting
- ✅ **Unified error detection**: `errors.fieldName || customErrors.fieldName` across all steps
- ✅ **Single validation source**: Only Zod schemas control validation logic
- 🔄 **Real-time validation**: Format/type validation as you type without premature required field errors

#### **Benefits:**
- 🚫 **No more browser popups**: Eliminates "Please fill out this field" messages
- 🔄 **Consistent experience**: Same validation behavior across all 3 wizard steps
- 🎨 **Visual consistency**: Red borders and ⚠ error messages for all invalid fields
- 🛡️ **No conflicts**: Single validation system prevents competing validation logic

#### **Before vs After:**
```typescript
// ❌ BEFORE: Conflicting validation systems
<input
  type="text"
  required                    // Browser validation
  minLength={10}              // Browser validation
  pattern="https?://.+"       // Browser validation
  className={`... ${errors.field ? 'border-red-500' : 'border-gray-600'}`}
/>

// ✅ AFTER: Zod-exclusive validation with manual input highlighting
<input
  type="text"
  className={getFieldClasses('field')} // Smart visual feedback
/>
```

### **Three-Step Wizard Structure**

The investment wizard now consists of three properly validated steps:

1. **Step 1: ⚡ AngelList Fields** - Auto-populatable investment data
2. **Step 2: 📋 Company & Founders** - Company details and founder information
3. **Step 3: 🎯 Marketing & Pitch** - Marketing information and pitch details

Each step uses **consistent validation patterns** with the same error display component and styling.

## 🔄 **Dual Validation System**

The investment wizard uses a **sophisticated dual validation approach** that provides excellent user experience:

### **1. Real-Time Validation (Partial Schema)**
- **Purpose**: Validates format, type, and length as you type
- **Schema**: `partialCompanySchema` - forgiving, format-focused validation
- **Behavior**: Shows errors for invalid formats (bad email, invalid URL, text too long) but doesn't enforce required fields
- **Trigger**: `onChange` - validates immediately as user types

```typescript
// Real-time validation examples
email: z.string().email('Must be a valid email').optional() // ✅ Format validation
website_url: z.string().url('Must be a valid URL').optional() // ✅ URL validation  
name: z.string().max(255, 'Company name too long').optional() // ✅ Length validation
```

### **2. Step Navigation Validation (Strict Schema)**
- **Purpose**: Enforces all requirements before allowing step progression
- **Schema**: `step1Schema`, `step2Schema`, `step3Schema` - strict, requirement-focused
- **Behavior**: Shows errors for missing required fields and invalid data
- **Trigger**: Manual - when user clicks "Next" button

```typescript
// Step validation examples  
email: z.string().email('Must be a valid email').min(1, 'Email is required') // ✅ Required + format
website_url: z.string().url('Must be a valid URL').min(1, 'Website URL is required') // ✅ Required + format
name: z.string().min(1, 'Company name is required').max(255, 'Company name too long') // ✅ Required + length
```

### **3. Final Submission Validation (Complete Schema)**
- **Purpose**: Final validation before database submission
- **Schema**: `companySchema` - complete validation with all business rules
- **Behavior**: Comprehensive validation including conditional requirements
- **Trigger**: Form submission

### **Benefits of Dual Validation**
1. **No Premature Errors**: Users don't see "field required" errors while typing in Step 1 for Step 3 fields
2. **Immediate Format Feedback**: Invalid emails, URLs, or overly long text are caught instantly
3. **Clear Progress Requirements**: Users know exactly what's needed to proceed to the next step
4. **Type Safety**: All validation goes through Zod with full TypeScript integration
5. **Consistent Experience**: Same error styling and behavior across all three steps

## ✅ **Implementation Complete**

### **1. Zod Schemas** (`src/app/admin/schemas/companySchema.ts`)

```typescript
// Step-specific validation schemas
export const step1Schema = z.object({
  name: z.string().min(1, 'Company name is required').max(255),
  investment_date: z.string().min(1, 'Investment date is required'),
  investment_amount: z.number().positive('Investment amount is required'),
  // ... other Step 1 fields
})

export const step2Schema = z.object({
  legal_name: z.string().min(1, 'Legal entity name is required'),
  founders: z.array(founderSchema).min(1, 'At least one founder is required'),
  // ... other Step 2 fields
})

export const step3Schema = z.object({
  tagline: z.string().min(1, 'Tagline is required'),
  website_url: z.string().url('Must be a valid URL').min(1, 'Website URL is required'),
  // ... other Step 3 fields
})

// Combined form schema with conditional validation
export const companySchema = step1Schema.merge(step2Schema).merge(step3Schema)
```

### **2. Consistent Error Display**

All three steps now use the same error display component:

```typescript
const ErrorDisplay = ({ fieldName }: { fieldName: string }) => {
  // Prioritize custom errors from step validation
  const customError = customErrors[fieldName]
  const formError = errors[fieldName as keyof FormValues]
  
  // Show custom error if it exists, otherwise show form error
  const error = customError || formError
  if (!error) return null
  
  // Handle different error types consistently
  let message: string = ''
  if (typeof error === 'string') {
    message = error
  } else if (Array.isArray(error) && error.length > 0) {
    message = error[0]
  } else if (error && typeof error === 'object' && 'message' in error) {
    message = error.message
  } else {
    message = 'Invalid value'
  }
  
  return (
    <div className="text-red-400 text-xs mt-1 flex items-center gap-1">
      <span className="text-red-400">⚠</span>
      {message}
    </div>
  )
}
```

### **3. Unified Border Styling**

All form fields use consistent error styling:

```typescript
// Standard pattern across all steps
className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
  errors.fieldName || customErrors.fieldName ? 'border-red-500' : 'border-gray-600'
}`}
```

### **4. Validation Features**

#### **Step-Specific Validation**
- ✅ **Step 1**: Investment data and company basics
- ✅ **Step 2**: Company details and founder information (with dynamic founder management)
- ✅ **Step 3**: Marketing and pitch information

#### **Conditional Validation**
- ✅ **Investment Instruments**: SAFE/Note vs Equity field requirements
- ✅ **Founder Fields**: Dynamic validation for 1-3 founders
- ✅ **Required vs Optional**: Clear distinction with asterisks (*)

#### **Data Types**
- ✅ **URLs**: Valid URL format validation with auto-validation system
- ✅ **Emails**: Valid email format for founders
- ✅ **Numbers**: Currency and numeric validation
- ✅ **Enums**: Dropdown validation for structured data
- ✅ **Arrays**: Dynamic founder array validation

#### **Enhanced URL Validation System**
The form includes an **auto-validation system** that checks URLs in real-time:

**Features:**
- ✅ **Auto-validation on Step 2**: Automatically validates company LinkedIn URL and website URL when navigating to Step 2
- ✅ **Visual feedback**: Loading indicators, success checkmarks, and error states
- ✅ **Real-time validation**: URL validation on blur for immediate feedback
- ✅ **Comprehensive coverage**: Validates all URL fields including company website and LinkedIn profile

**URL Fields Validated:**
- `company_linkedin_url` - Company LinkedIn profile URL
- `website_url` - Company website URL
- `founders[].linkedin_url` - Individual founder LinkedIn profile URLs
- `pitch_episode_url` - Link to The Pitch episode (optional)

## 🛠️ **How It Works**

### **Real-Time Validation Flow**
```typescript
// Form setup with partial schema for real-time validation
const formMethods = useForm({
  resolver: zodResolver(partialCompanySchema), // Forgiving real-time validation
  mode: 'onChange', // Validate as user types
  reValidateMode: 'onChange'
})

// Real-time validation examples
const emailError = errors.email // "Must be a valid email" (if format invalid)
const nameError = errors.name   // "Company name too long" (if > 255 chars)
// No premature "field required" errors shown
```

### **Step Navigation Validation Flow**
```typescript
// 1. User attempts to proceed to next step
const handleNext = async () => {
  // 2. Validate current step using strict step-specific schema
  const validationResult = await validateStep(currentStep, formData)
  
  // 3. Handle validation results
  if (validationResult.isValid) {
    // Clear errors and proceed
    setCustomErrors({})
    setStep(currentStep + 1)
  } else {
    // Show step-specific errors with visual feedback
    setCustomErrors(validationResult.errors)
    // Red borders appear automatically via className logic
  }
}
```

### **Visual Feedback System**
```typescript
// Dual error detection: real-time + step validation
const hasError = errors.fieldName || customErrors.fieldName
const borderColor = hasError ? 'border-red-500' : 'border-gray-600'

// Error priority:
// 1. Step validation errors (customErrors) - shown on navigation attempts
// 2. Real-time validation errors (errors) - shown while typing
if (hasError) {
  return <ErrorDisplay fieldName="fieldName" />
}
```

### **Error Message Priority**
```typescript
const ErrorDisplay = ({ fieldName }) => {
  const customError = customErrors[fieldName]     // Step validation error
  const formError = errors[fieldName]             // Real-time validation error
  
  // Step validation errors take priority
  const error = customError || formError
  
  // Examples:
  // Real-time: "Must be a valid email" (while typing)
  // Step nav:  "Email is required" (clicking Next with empty field)
}
```

## 📋 **Validation Rules Reference**

### **Step 1: AngelList Fields**
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| `name` | string | 1-255 chars | ✅ |
| `investment_date` | date | valid date | ✅ |
| `investment_amount` | number | positive | ✅ |
| `instrument` | enum | SAFE/Note/Equity | ✅ |
| `stage_at_investment` | enum | 'pre_seed' \| 'seed' | ✅ |
| `round_size_usd` | number | positive | ✅ |
| `conversion_cap_usd` | number | positive (SAFE/Note) | ❌ |
| `discount_percent` | number | 0-100 (SAFE/Note) | ❌ |
| `post_money_valuation` | number | positive (Equity) | ❌ |
| `country_of_incorp` | string | ISO country code | ✅ |
| `incorporation_type` | enum | legal entity types | ✅ |
| `reason_for_investing` | string | 1-4000 chars | ✅ |
| `description_raw` | string | 1-5000 chars | ✅ |

### **Step 2: Company & Founders**
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| `legal_name` | string | 1-255 chars | ✅ |
| `company_linkedin_url` | string | valid URL | ✅ |
| `hq_address_line_1` | string | 1-255 chars | ✅ |
| `hq_address_line_2` | string | 1-255 chars | ❌ |
| `hq_city` | string | 1-100 chars | ✅ |
| `hq_state` | string | 1-100 chars | ✅ |
| `hq_zip_code` | string | 1-20 chars | ✅ |
| `hq_country` | string | ISO country code | ✅ |
| `founders[].first_name` | string | 1-100 chars | ✅ |
| `founders[].last_name` | string | 1-100 chars | ✅ |
| `founders[].email` | string | valid email | ✅ |
| `founders[].title` | string | 1-200 chars | ✅ |
| `founders[].linkedin_url` | string | valid URL | ✅ |
| `founders[].sex` | enum | 'male' \| 'female' | ✅ |
| `founders[].role` | enum | 'founder' \| 'cofounder' | ✅ |
| `founders[].bio` | string | max 1000 chars | ❌ |

### **VC Management Form**
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| `name` | string | 1-255 chars | ✅ |
| `firm_name` | string | 1-255 chars | ✅ |
| `role_title` | string | 1-255 chars | ✅ |
| `bio` | string | 1-2000 chars | ✅ |
| `profile_image_url` | string | valid URL | ✅ |
| `thepitch_profile_url` | string | valid URL | ✅ |
| `linkedin_url` | string | valid URL | ❌ |
| `twitter_url` | string | valid URL | ❌ |
| `instagram_url` | string | valid URL | ❌ |
| `tiktok_url` | string | valid URL | ❌ |
| `youtube_url` | string | valid URL | ❌ |
| `website_url` | string | valid URL | ❌ |
| `podcast_url` | string | valid URL | ❌ |

#### **VC Form Features**
- ✅ **Auto-scraping integration**: Auto-populate fields from ThePitch.show profile URLs
- ✅ **Real-time URL validation**: Visual feedback for all social media and website URLs
- ✅ **Required field enforcement**: Name, firm, role, bio, profile image, and ThePitch profile URL are mandatory
- ✅ **Profile image upload**: Integration with ProfileImageUploader component for seamless image management
- ✅ **Visual validation states**: Green checkmarks for valid URLs, loading spinners during validation, red borders for errors

### **Step 3: Marketing & Pitch**
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| `tagline` | string | 1-200 chars | ✅ |
| `website_url` | string | valid URL | ✅ |
| `industry_tags` | string | comma-separated | ❌ |
| `business_model_tags` | string | comma-separated | ❌ |
| `keywords` | string | comma-separated | ❌ |
| `pitch_episode_url` | string | valid URL + **thepitch.show domain** | ❌ |

#### **Three-Tag System**
Step 3 implements a standardized three-tag taxonomy for consistent portfolio categorization:
- **Industry Tags**: Technology sectors and target markets (97 standardized tags) - Enhanced VC-focused analysis with GPT-4o
- **Business Model Tags**: Revenue models and business types (29 standardized tags)
- **Keywords**: Operational characteristics and technology approaches (72+ standardized tags)

Each tag type has AI-powered generation capabilities that analyze the pitch transcript to suggest appropriate tags. Industry tags use GPT-4o with enhanced VC analyst persona for superior reasoning about market opportunities and investment thesis alignment.

## 🚀 **Enhanced QuickPaste Integration**

### **Manual Input Detection System**

The QuickPaste system now provides detailed feedback about which fields need manual attention:

#### **ParseResult Interface**
```typescript
interface ParseResult {
  extractedData: Record<string, any>;
  successfullyParsed: Set<AutoPopulateField>;
  failedToParse: Set<AutoPopulateField>;
}

// Enhanced parseQuickPaste function
export function parseQuickPaste(raw: string): ParseResult {
  // Returns detailed parsing results instead of just extracted data
  return {
    extractedData: out,
    successfullyParsed,
    failedToParse
  };
}
```

#### **Visual Feedback Integration**
```typescript
// QuickPaste completion callback
const handleQuickPasteComplete = (failedFields: Set<string>) => {
  setFieldsNeedingManualInput(failedFields)
  // Orange borders automatically appear for failed fields
}

// Smart highlighting that auto-clears when user types
useEffect(() => {
  fieldsNeedingManualInput.forEach(fieldName => {
    const fieldValue = getNestedValue(watchedValues, fieldName)
    if (fieldValue !== undefined && fieldValue !== '' && fieldValue !== null) {
      // Remove orange highlighting when user provides input
      updatedNeedsManualInput.delete(fieldName)
    }
  })
}, [watchedValues, fieldsNeedingManualInput])
```

#### **User Experience Flow**
1. **User pastes AngelList data** → QuickPaste processes the text
2. **System highlights results** → Shows "🔶 3 field(s) need manual input"
3. **Orange borders appear** → On fields that couldn't be parsed
4. **User fills in fields** → Orange highlighting automatically disappears
5. **Real-time feedback** → Immediate visual confirmation of completed fields

### **Auto-Populate Field Coverage**
```typescript
const AUTO_POPULATE_FIELDS = [
  'name', 'slug', 'investment_date', 'investment_amount', 'instrument',
  'round_size_usd', 'stage_at_investment', 'conversion_cap_usd', 'discount_percent',
  'post_money_valuation', 'has_pro_rata_rights', 'country_of_incorp',
  'incorporation_type', 'reason_for_investing', 'co_investors',
  'founder_name', 'description_raw'
] as const;
```

## 🚀 **Usage Examples**

### **Consistent Form Field Pattern**
```typescript
// Standard pattern used across all three steps
<input
  type="text"
  {...register('fieldName')}
  className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
    errors.fieldName || customErrors.fieldName ? 'border-red-500' : 'border-gray-600'
  }`}
  placeholder="Enter value..."
/>
<ErrorDisplay fieldName="fieldName" />
```

### **Step Validation Integration**
```typescript
// Validate current step before proceeding
const result = await validateStep(currentStep, formData)
if (!result.isValid) {
  // Show errors with consistent styling
  setCustomErrors(result.errors)
  // Red borders appear automatically
}
```

### **TypeScript Integration**
```typescript
import type { Step1FormValues, Step2FormValues, Step3FormValues } from '@/app/admin/schemas/companySchema'

// Fully typed step data
const handleStepData = (data: Step1FormValues) => {
  // TypeScript knows these fields are validated
  console.log(data.investment_amount) // number
  console.log(data.instrument) // 'safe_post' | 'safe_pre' | 'convertible_note' | 'equity'
}
```

## 🔧 **Analytics & Tracking**

Form validation errors are tracked for analytics:
```typescript
track('admin_company_form_validation_error', { 
  action: company ? 'edit' : 'create',
  company_name: formData.name,
  step: currentStep,
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
    component: 'InvestmentWizard',
    operation: 'stepValidation',
    step: currentStep
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
    component: 'InvestmentWizard',
    operation: 'saveCompanyAndFounders',
    step: 'final_submission'
  },
  extra: {
    company_name: formData.name,
    founder_count: formData.founders?.length || 0,
    company_id: company?.id
  }
});
```

## 🎯 **Benefits Achieved**

1. **Consistent Experience**: Same validation behavior across all 3 wizard steps
2. **No Browser Conflicts**: Eliminated HTML5 validation popup conflicts
3. **Visual Clarity**: Red borders and error messages for all invalid fields
4. **Type Safety**: Full TypeScript integration with inferred types
5. **User Experience**: Clear, immediate feedback without browser popups
6. **Data Integrity**: Consistent validation before database saves
7. **Developer Experience**: Single validation system, easy to maintain
8. **Analytics**: Track validation errors for form improvements
9. **Performance**: Client-side validation prevents unnecessary API calls
10. **Accessibility**: Consistent error messaging for screen readers

The investment wizard now provides **enterprise-grade, consistent validation** across all three steps while maintaining excellent user experience! 🎉 