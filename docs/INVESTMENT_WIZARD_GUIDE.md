# Investment Wizard & Auto-Save System Guide

## Overview

The Investment Wizard is a modern, **three-step form system** for creating and managing investment records. It features automatic draft persistence with toast notifications, smart auto-save behavior, **Zod-exclusive validation**, and seamless integration with the QuickPaste system.

## 🎯 **Recent Update: Three-Step Structure & Validation Standardization**

### **✅ New Three-Step Architecture**

The Investment Wizard has been restructured into three logical steps with **standardized Zod-exclusive validation**:

1. **Step 1: ⚡ AngelList Fields** - Auto-populatable investment data
2. **Step 2: 📋 Company & Founders** - Company details and founder information
3. **Step 3: 🎯 Marketing & Pitch** - Marketing information and pitch details

### **🛡️ Validation Standardization**

- ❌ **Removed HTML5 validation**: No more browser popups or conflicting validation
- ✅ **Zod-exclusive validation**: Single source of truth for all validation logic
- ✅ **Dual validation system**: Real-time format validation + step-specific requirement validation
- ✅ **Consistent error styling**: Red borders and error messages across all steps
- ✅ **Unified error handling**: Same error display component for all three steps

## Architecture

### Core Components

```
src/app/admin/investments/new/
├── components/
│   └── InvestmentWizard.tsx        # Main wizard container
├── steps/
│   ├── AngelListStep.tsx          # Step 1: Auto-populatable fields
│   ├── AdditionalInfoStep.tsx     # Step 2: Company & founder details
│   └── MarketingInfoStep.tsx      # Step 3: Marketing & pitch information
├── schemas/
│   └── companySchema.ts           # Step-specific Zod schemas
└── page.tsx                       # Route handler
```

### Key Features

- **3-Step Wizard Process**: Logical separation of data types
- **Zod-Exclusive Validation**: No HTML5 validation conflicts
- **Smart Per-Step Validation**: Step-specific validation that prevents premature error display
- **Consistent Error Styling**: Red borders and ⚠ messages across all steps
- **Smart Auto-Save System**: Debounced localStorage persistence with toast notifications
- **Draft Persistence**: Automatic restoration of draft data that survives page refreshes
- **Toast Notifications**: Clean, non-intrusive feedback using react-hot-toast
- **QuickPaste Integration**: Enhanced AngelList memo parsing with persistent text display
- **Dynamic Founder Management**: Add/remove up to 3 founders with full validation
- **Clear Form Functionality**: Safe form reset with confirmation and page reload

## Form Steps

### Step 1: AngelList Fields ⚡

**Purpose**: Fields that can be auto-populated from AngelList investment memos

**Fields**:
- Company Name *
- Investment Date *
- Investment Amount ($) *
- Investment Instrument *
- Stage at Investment *
- Round Size (USD) *
- Conversion Cap (USD) (SAFE/Note only)
- Discount Percent (SAFE/Note only)
- Post-Money Valuation ($) (Equity only)
- Pro-Rata Rights (checkbox)
- Co-Investors
- Country of Incorporation *
- Incorporation Type *
- Founder Name
- Fund *
- Reason for Investing *
- Company Description *

**Features**:
- Enhanced QuickPaste panel with persistent text display
- Step-specific validation that only triggers on navigation attempts
- Conditional field validation based on instrument type
- Currency formatting with controlled `CurrencyInput` components
- Auto-generated company slug from name
- **Zod-exclusive validation** - no HTML5 conflicts

### Step 2: Company & Founders 📋

**Purpose**: Company details and founder information

**Fields**:
- Legal Entity Name *
- Company LinkedIn *
- Address Line 1 *
- Address Line 2
- City *
- State/Province *
- ZIP/Postal Code *
- Country *
- **Dynamic Founders (1-3)**:
  - First Name *
  - Last Name *
  - Email *
  - Title *
  - LinkedIn Profile *
  - Role (Founder/Co-Founder)
  - Sex * (Male/Female)
  - Bio

**Features**:
- Dynamic founder management with Add/Remove buttons
- Full validation for all founder fields
- Consistent error styling with red borders
- Step-specific validation before proceeding
- **No HTML5 validation conflicts**

### Step 3: Marketing & Pitch Information 🎯

**Purpose**: Marketing information and pitch details

**Fields**:
- Tagline *
- Website URL *
- Industry Tags
- Pitch Episode URL

**Features**:
- Clean, focused interface for marketing data
- URL validation for website and pitch episode
- Consistent error display with other steps
- **Zod-exclusive validation**

## Zod-Exclusive Validation System

### No HTML5 Validation Conflicts

The Investment Wizard now uses **Zod exclusively** for all validation, eliminating browser popup conflicts:

```typescript
// ❌ OLD: Conflicting validation systems
<input
  type="text"
  required                    // Browser validation
  minLength={10}              // Browser validation
  pattern="https?://.+"       // Browser validation
  className={`... ${errors.field ? 'border-red-500' : 'border-gray-600'}`}
/>

// ✅ NEW: Zod-exclusive validation
<input
  type="text"
  {...register('field')}
  className={`... ${errors.field || customErrors.field ? 'border-red-500' : 'border-gray-600'}`}
/>
```

### Step-Specific Validation Architecture

```typescript
// Step-specific schemas
export const step1Schema = z.object({
  name: z.string().min(1, 'Company name is required'),
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
  website_url: z.string().url('Must be a valid URL'),
  // ... other Step 3 fields
})
```

### Consistent Error Display

All three steps use the same error display component:

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

### Visual Consistency

All form fields use the same error styling pattern:

```typescript
// Standard pattern across all three steps
className={`w-full px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none ${
  errors.fieldName || customErrors.fieldName ? 'border-red-500' : 'border-gray-600'
}`}
```

## Smart Per-Step Validation System

### Custom Validation Architecture

The Investment Wizard implements a sophisticated validation system that prevents premature error display while ensuring data integrity at each step.

```typescript
// Custom step-specific validation state
const [stepErrors, setStepErrors] = useState<Record<string, any>>({});

// Handle next step with per-step validation
const handleNext = async () => {
  const currentStepFields = getStepFieldNames(step);
  const currentValues = getValues();
  
  // Use step-specific validation that doesn't affect touched state
  const validationResult = await validateStep(step, currentValues);
  
  if (validationResult.isValid) {
    // Clear any previous step errors and proceed
    setStepErrors({});
    setStep(step + 1);
  } else {
    // Set step-specific errors for display
    setStepErrors(validationResult.errors);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};
```

### Key Features

- **No Global Form Resolver**: Removed automatic validation to prevent premature error display
- **Step-Specific Validation**: Uses `validateStep()` function that validates only current step data
- **Custom Error State**: Manages errors independently from React Hook Form's touched state
- **Smart Error Display**: Shows validation errors only when appropriate (navigation attempts or user interaction)
- **Clean Navigation**: Moving between steps doesn't pollute form state or show premature errors
- **Zod-Exclusive Logic**: No HTML5 validation conflicts

### Validation Behavior

#### Step 1 → Step 2 Navigation
```typescript
// Validates only Step 1 fields using step-specific schema
const validationResult = await validateStep(0, formData);

if (validationResult.isValid) {
  // Proceed to Step 2 without affecting Step 2 field states
  setStep(1);
} else {
  // Show only Step 1 validation errors with red borders
  setStepErrors(validationResult.errors);
}
```

#### Step 2 → Step 3 Navigation
```typescript
// Validates Step 2 fields including dynamic founders array
const validationResult = await validateStep(1, formData);

if (validationResult.isValid) {
  // Proceed to Step 3
  setStep(2);
} else {
  // Show Step 2 validation errors including founder-specific errors
  setStepErrors(validationResult.errors);
}
```

#### Error Display Logic
```typescript
const ErrorDisplay = ({ fieldName }: { fieldName: string }) => {
  // Prioritize custom errors from step validation
  const customError = customErrors[fieldName];
  const formError = errors[fieldName as keyof FormValues];
  
  // Show custom error if it exists, otherwise show form error
  const error = customError || formError;
  if (!error) return null;
  
  // Consistent error message formatting
  let message: string = '';
  if (typeof error === 'string') {
    message = error;
  } else if (Array.isArray(error) && error.length > 0) {
    message = error[0];
  } else if (error && typeof error === 'object' && 'message' in error) {
    message = error.message;
  } else {
    message = 'Invalid value';
  }
  
  return (
    <div className="text-red-400 text-xs mt-1 flex items-center gap-1">
      <span className="text-red-400">⚠</span>
      {message}
    </div>
  );
};
```

## 🔄 **Real-Time Validation System**

### **Dual Validation Architecture**

The Investment Wizard uses a **sophisticated dual validation system** that provides the best user experience:

#### **1. Real-Time Validation (As You Type)**
```typescript
// Uses partialCompanySchema - forgiving, format-focused validation
resolver: zodResolver(partialCompanySchema)
mode: 'onChange' // Validates immediately as user types
```

**What it validates:**
- ✅ **Email format**: `"Must be a valid email"` (while typing invalid email)
- ✅ **URL format**: `"Must be a valid URL"` (while typing invalid URL)
- ✅ **Text length**: `"Company name too long"` (while typing > 255 characters)
- ✅ **Number format**: `"Investment amount must be positive"` (while typing negative numbers)
- ❌ **No premature required field errors**: Won't show "Email is required" while on Step 1

#### **2. Step Navigation Validation (On Next Button)**
```typescript
// Uses step1Schema, step2Schema, step3Schema - strict, requirement-focused
const validationResult = await validateStep(currentStep, formData)
```

**What it validates:**
- ✅ **All format validation** (same as real-time)
- ✅ **Required field validation**: `"Email is required"` (when trying to proceed without email)
- ✅ **Step-specific business rules**: Conditional validation based on investment type
- ✅ **Complete step requirements**: Ensures all necessary data before proceeding

#### **3. Visual Error Priority**
```typescript
// Error display logic - step validation takes priority
const error = customErrors[fieldName] || errors[fieldName]

// User experience:
// 1. User types invalid email → Shows "Must be a valid email" (real-time)
// 2. User clicks Next with empty email → Shows "Email is required" (step validation)
// 3. Step validation errors override real-time errors for clarity
```

### **Benefits for Users**
1. **Immediate Format Feedback**: See format errors as you type
2. **No Premature Errors**: Don't see "required" errors for other steps
3. **Clear Progress Requirements**: Know exactly what's needed to proceed
4. **Consistent Behavior**: Same validation patterns across all three steps
5. **Smart Error Messages**: Context-appropriate error messages

### **Technical Implementation**
```typescript
// Form setup with real-time validation
const formMethods = useForm({
  resolver: zodResolver(partialCompanySchema), // Real-time validation
  mode: 'onChange',
  reValidateMode: 'onChange'
})

// Step navigation validation
const handleNext = async () => {
  const validationResult = await validateStep(step, formData) // Step-specific validation
  if (validationResult.isValid) {
    setStep(step + 1) // Proceed to next step
  } else {
    setStepErrors(validationResult.errors) // Show step-specific errors
  }
}
```

### Benefits of Zod-Exclusive Validation

1. **No Browser Conflicts**: Eliminated "Please fill out this field" popups
2. **Consistent Experience**: Same validation behavior across all 3 steps
3. **Better Error Messages**: Custom, contextual error messages
4. **Visual Consistency**: Red borders and error messages for all invalid fields
5. **Developer Experience**: Single validation system, easier to maintain
6. **Type Safety**: Full TypeScript integration with Zod schemas
7. **Real-Time Format Validation**: Immediate feedback for format errors while typing

## Smart Auto-Save System

### useDraftPersist Hook

```typescript
const { clearDraft, isSaving, hasUnsavedChanges } = useDraftPersist<CompanyFormValues>(
  'investmentWizardDraft', 
  700 // debounce delay in ms
);
```

**Key Features**:
- **Smart Timing**: Only saves after user interaction is detected
- **Debounced Saving**: 700ms delay prevents excessive localStorage writes
- **Intelligent Change Detection**: Only saves when form data actually changes
- **Toast Notifications**: Clean feedback using react-hot-toast
- **Draft Restoration**: Automatic restoration with actual data detection
- **Three-Step Compatibility**: Works seamlessly across all wizard steps

### Auto-Save Behavior

```typescript
// Only save when user has actually interacted with the form
const hasInteracted = hasUserInteractedRef.current || 
                     localStorage.getItem('userHasInteracted') || 
                     hasActualDataRef.current;

if (!hasInteracted) {
  // Skip auto-save - no user interaction yet
  return;
}

// Only save if the form is dirty (has changes)
if (!formState.isDirty && !hasActualDataRef.current) {
  // Skip auto-save - form is not dirty and no actual data
  return;
}
```

### Toast Notifications

```typescript
// Draft saved notification
toast.success('Draft saved', { id: 'draft-saved' });

// Draft restored notification  
toast.success('Draft data restored', { id: 'draft-restored' });

// Draft cleared notification
toast.success('Draft cleared', { id: 'draft-cleared' });

// Error notification
toast.error('Failed to save draft');
```

## Enhanced QuickPaste System

### Improved User Experience

```typescript
const [quickPasteText, setQuickPasteText] = useState('');
const [isProcessing, setIsProcessing] = useState(false);

const handleProcess = () => {
  if (!quickPasteText.trim()) return;
  
  setIsProcessing(true);
  
  // Temporarily disable auto-save during QuickPaste
  localStorage.setItem('quickPasteInProgress', 'true');
  
  try {
    const extracted = parseQuickPaste(quickPasteText);
    
    // Apply extracted data to form
    Object.entries(extracted).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        setValue(key as keyof CompanyFormValues, value, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        });
      }
    });
    
    // Enable auto-save and mark user interaction
    localStorage.setItem('userHasInteracted', 'true');
    
    toast.success('Data populated from AngelList memo');
    
  } catch (error) {
    console.error('QuickPaste: Error parsing text:', error);
    toast.error('Failed to parse AngelList memo');
  } finally {
    setIsProcessing(false);
    // Re-enable auto-save after delay
    setTimeout(() => {
      localStorage.removeItem('quickPasteInProgress');
    }, 2000);
  }
};
```

### Key Features

- **Persistent Text Display**: Text remains visible for comparison after processing
- **Manual Processing**: Users click "Process" button instead of automatic onChange
- **Visual Feedback**: Processing state with loading indicators
- **Clear Button**: Easy way to clear the textarea
- **Auto-Save Protection**: Temporarily disables auto-save during processing
- **Three-Step Compatibility**: Works with the new wizard structure

## Clear Form Functionality

### Safe Form Reset

```typescript
const handleClearForm = () => {
  const confirmed = window.confirm(
    'Are you sure you want to clear the form? All entered data will be lost.'
  )
  
  if (confirmed) {
    clearDraft() // Clear draft and show toast notification
    reset({}) // Reset form to empty state
    setStep(0) // Reset to first step
    // Force a page reload to ensure complete reset
    window.location.reload()
  }
}
```

### Features

- **Confirmation Dialog**: Prevents accidental data loss
- **Complete Reset**: Page reload ensures clean state
- **Toast Notification**: Confirms action completion
- **No Navigation**: Stays on the same page with empty form
- **Step Reset**: Returns to Step 1 after clearing

## Data Persistence Without Popups

### Simplified Approach

The system no longer uses intrusive navigation guards or leave-page confirmations. Instead:

- **Draft persistence survives page refreshes** - Users can safely navigate away
- **Toast notifications** provide clean feedback
- **Smart restoration** detects and restores actual user data
- **No annoying popups** for navigation or browser close events
- **Three-step compatibility** - drafts work across all wizard steps

### Draft Restoration Logic

```typescript
// Check if cached data has meaningful values
const hasActualData = Object.entries(parsed).some(([key, value]) => {
  // Skip checking default/system fields
  if (['has_pro_rata_rights', 'fund', 'stage_at_investment', 'instrument', 'status', 'founder_role'].includes(key)) {
    return false;
  }
  // Check if value is meaningful
  return value !== null && value !== undefined && value !== '' && value !== 0;
});

if (hasActualData) {
  // Reset with draft data and enable auto-save
  reset(parsed, { keepDirty: false });
  localStorage.setItem('userHasInteracted', 'true');
  toast.success('Draft data restored', { id: 'draft-restored' });
} else {
  // Reset with default values and keep form clean
  reset(parsed, { keepDirty: false });
  localStorage.removeItem('userHasInteracted');
}
```

## Enhanced Form Schema

### Step-Specific Required Fields

```typescript
// Step 1: AngelList Fields
const step1RequiredFields = [
  'name', 'investment_date', 'investment_amount', 'instrument',
  'stage_at_investment', 'round_size_usd', 'country_of_incorp',
  'incorporation_type', 'reason_for_investing', 'description_raw', 'fund'
];

// Step 2: Company & Founders
const step2RequiredFields = [
  'legal_name', 'company_linkedin_url', 'hq_address_line_1',
  'hq_city', 'hq_state', 'hq_zip_code', 'hq_country',
  'founders[].first_name', 'founders[].last_name', 'founders[].email',
  'founders[].title', 'founders[].linkedin_url', 'founders[].sex'
];

// Step 3: Marketing & Pitch
const step3RequiredFields = [
  'tagline', 'website_url'
];
```

### Founder Schema with Sex Field

```typescript
export const founderSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Must be a valid email address'),
  title: z.string().min(1, 'Title is required'),
  linkedin_url: z.string().url('Must be a valid URL'),
  role: z.enum(['founder', 'cofounder']).default('founder'),
  sex: z.enum(['male', 'female'], { required_error: 'Sex is required' }),
  bio: z.string().max(1000, 'Bio must be less than 1000 characters').optional().or(z.literal(''))
});
```

### Conditional Validation

```typescript
// SAFE/Note instruments require conversion cap and discount
export const companySchema = step1Schema.merge(step2Schema).merge(step3Schema)
  .superRefine((data, ctx) => {
    const requiresSafeFields = ['safe_post', 'safe_pre', 'convertible_note'].includes(data.instrument);
    
    if (requiresSafeFields) {
      if (!data.conversion_cap_usd || data.conversion_cap_usd <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Conversion cap is required for SAFE and convertible note investments',
          path: ['conversion_cap_usd']
        });
      }
    }
    
    // Equity instruments require post-money valuation
    if (data.instrument === 'equity') {
      if (!data.post_money_valuation || data.post_money_valuation <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Post-money valuation is required for equity investments',
          path: ['post_money_valuation']
        });
      }
    }
  });
```

## Dependencies

### New Packages

```json
{
  "react-hot-toast": "^2.5.2",
  "use-debounce": "^10.0.5"
}
```

### Updated Packages

```json
{
  "react-currency-input-field": "^3.10.0",
  "react-hook-form": "^7.59.0",
  "zod": "^3.25.71"
}
```

## Usage Examples

### Basic Wizard Setup

```typescript
import InvestmentWizard from './components/InvestmentWizard';

export default function NewInvestmentPage() {
  const handleSave = async (data: CompanyFormValues) => {
    // Save investment data - now includes all three steps
    await saveInvestment(data);
  };

  const handleCancel = () => {
    // Navigate back or close
    router.push('/admin');
  };

  return (
    <InvestmentWizard
      onSave={handleSave}
      onCancel={handleCancel}
      saving={isLoading}
    />
  );
}
```

### Step-Specific Validation

```typescript
// Validate specific step before proceeding
const validateAndProceed = async (step: number) => {
  const result = await validateStep(step, getValues());
  
  if (result.isValid) {
    // Clear errors and proceed
    setCustomErrors({});
    setStep(step + 1);
  } else {
    // Show step-specific errors with red borders
    setCustomErrors(result.errors);
  }
};
```

### Toast Notifications Setup

```typescript
// Add to your app layout or main component
import { Toaster } from 'react-hot-toast';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1f2937',
              color: '#f9fafb',
            },
          }}
        />
      </body>
    </html>
  );
}
```

### Custom Draft Persistence

```typescript
import { useDraftPersist } from '@/hooks/useDraftPersist';

// Works seamlessly with three-step wizard
const { clearDraft, isSaving, hasUnsavedChanges } = useDraftPersist<CompanyFormValues>(
  'investmentWizardDraft',
  700
);
```

## Benefits Achieved

1. **Three-Step Organization**: Logical separation of data types
2. **Validation Consistency**: Same validation behavior across all steps
3. **No Browser Conflicts**: Eliminated HTML5 validation popups
4. **Visual Clarity**: Red borders and error messages for all invalid fields
5. **Type Safety**: Full TypeScript integration with step-specific schemas
6. **User Experience**: Clean, consistent feedback without browser popups
7. **Developer Experience**: Single validation system, easier to maintain
8. **Dynamic Founder Management**: Add/remove founders with full validation
9. **Draft Persistence**: Seamless auto-save across all three steps
10. **Analytics**: Track validation errors and user behavior per step

The Investment Wizard now provides a **modern, three-step experience** with **enterprise-grade Zod-exclusive validation** that's consistent, reliable, and user-friendly! 🎉 