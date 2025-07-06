# Investment Wizard & Auto-Save System Guide

## Overview

The Investment Wizard is a modern, multi-step form system for creating and managing investment records. It features automatic draft persistence, data loss prevention, and seamless integration with the QuickPaste system.

## Architecture

### Core Components

```
src/app/admin/investments/new/
├── components/
│   └── InvestmentWizard.tsx        # Main wizard container
├── steps/
│   ├── AngelListStep.tsx          # Step 1: Auto-populatable fields
│   └── AdditionalInfoStep.tsx     # Step 2: Manual entry fields
└── page.tsx                       # Route handler
```

### Key Features

- **2-Step Wizard Process**: Logical separation of auto-populatable vs manual fields
- **Auto-Save System**: Debounced localStorage persistence with visual feedback
- **Data Loss Prevention**: Browser navigation guards and unsaved changes warnings
- **Form Recovery**: Automatic restoration of draft data on page reload
- **QuickPaste Integration**: Seamless AngelList memo parsing and form population

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
- Conversion Cap (USD) * (SAFE/Note only)
- Discount Percent * (SAFE/Note only)
- Post-Money Valuation ($) * (Equity only)
- Pro-Rata Rights (checkbox)
- Country of Incorporation *
- Incorporation Type *

**Features**:
- QuickPaste panel for automatic field population
- Conditional field validation based on instrument type
- Currency formatting with react-currency-input-field
- Auto-generated company slug from name

### Step 2: Additional Information 📋

**Purpose**: Manual entry fields not available in AngelList memos

**Fields**:
- Tagline *
- Website URL *
- Industry Tags
- Pitch Episode URL
- Founder Email *
- Founder Name
- Founder LinkedIn
- Founder Role
- Founder Gender
- Founder Bio
- Reason for Investing *

**Features**:
- Rich text areas for descriptions
- URL validation for links
- Email validation for founder contact

## Auto-Save System

### useDraftPersist Hook

```typescript
const { clearDraft, isSaving } = useDraftPersist<CompanyFormValues>(
  'investmentWizardDraft', 
  700 // debounce delay in ms
);
```

**Key Features**:
- **Debounced Saving**: 700ms delay prevents excessive localStorage writes
- **Smart Change Detection**: Only saves when form data actually changes
- **Conflict Prevention**: Prevents concurrent saves and data corruption
- **Visual Feedback**: Real-time status indicators

### Status Indicators

```typescript
// Auto-saving (green pulsing dot)
{isDraftSaving && (
  <div className="flex items-center gap-2 text-green-400 text-sm">
    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
    Auto-saving...
  </div>
)}

// Draft saved (blue pulsing dot)
{draftSaved && !isDraftSaving && (
  <div className="flex items-center gap-2 text-blue-400 text-sm">
    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
    Draft saved!
  </div>
)}

// Unsaved changes (amber pulsing dot)
{formState.isDirty && !isAnySaving && !draftSaved && (
  <div className="flex items-center gap-2 text-amber-400 text-sm">
    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
    Unsaved changes
  </div>
)}
```

## Data Loss Prevention

### Protection Features

1. **Browser Leave Guard**: Prevents accidental tab/window closing
2. **Router Navigation Guard**: Intercepts in-app navigation attempts
3. **Cancel Confirmation**: Warns before losing unsaved changes
4. **Draft Recovery**: Automatically restores form data on reload

### Implementation

```typescript
// Browser leave protection
useEffect(() => {
  const hasUnsavedChanges = formState.isDirty && !isAnySaving
  
  if (!hasUnsavedChanges) return
  
  const handler = (e: BeforeUnloadEvent) => {
    e.preventDefault()
    e.returnValue = '' // Chrome requires returnValue to be set
  }
  
  window.addEventListener('beforeunload', handler)
  return () => window.removeEventListener('beforeunload', handler)
}, [formState.isDirty, isAnySaving])

// Router navigation guard
useEffect(() => {
  const hasUnsavedChanges = formState.isDirty && !isAnySaving
  
  if (!hasUnsavedChanges) return
  
  const originalPush = router.push
  router.push = (href: string, options?: any) => {
    if (formState.isDirty && !isAnySaving) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.'
      )
      if (!confirmLeave) return Promise.resolve(false)
    }
    return originalPush.call(router, href, options)
  }
  
  return () => {
    router.push = originalPush
  }
}, [formState.isDirty, isAnySaving, router])
```

## Enhanced Form Schema

### New Required Fields

```typescript
// 5 new required fields added to companySchema
round_size_usd: z.number().positive('Round size is required and must be positive'),
reason_for_investing: z.string().min(1, 'Reason for investing is required').max(4000),
country_of_incorp: z.string().min(1, 'Country of incorporation is required').length(2),
incorporation_type: z.enum(['c_corp', 's_corp', 'llc', 'bcorp', 'gmbh', 'ltd', 'plc', 'other']),
founder_email: z.string().email('Must be a valid email address').optional().or(z.literal(''))
```

### Conditional Validation

```typescript
// SAFE/Note instruments require conversion cap and discount
if (requiresSafeFields) {
  if (!data.conversion_cap_usd || data.conversion_cap_usd <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Conversion cap is required for SAFE and convertible note investments',
      path: ['conversion_cap_usd']
    })
  }
}

// Equity instruments require post-money valuation
if (data.instrument === 'equity') {
  if (!data.post_money_valuation || data.post_money_valuation <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Post-money valuation is required for equity investments',
      path: ['post_money_valuation']
    })
  }
}
```

## QuickPaste Integration

### Simplified Implementation

```typescript
const handlePaste = (text: string) => {
  try {
    const extracted = parseQuickPaste(text);
    
    // Clear the draft cache to prevent conflicts
    localStorage.removeItem('investmentFormData');
    
    // Get current form values and merge with extracted data
    const currentValues = getValues();
    const mergedValues = { ...currentValues, ...extracted };
    
    // Apply all values using reset() method
    reset(mergedValues, { 
      keepDefaultValues: false,
      keepDirty: false,
      keepTouched: false,
      keepErrors: false
    });
    
  } catch (error) {
    console.error('QuickPaste: Error parsing text:', error);
  }
};
```

### Key Improvements

- **Clean Architecture**: Removed complex DOM manipulation
- **Standard React Patterns**: Uses react-hook-form reset() method
- **Draft Cache Clearing**: Prevents conflicts with auto-save system
- **Improved Reliability**: Eliminated race conditions

## Dependencies

### New Packages

```json
{
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
    // Save investment data
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

### Custom Draft Persistence

```typescript
import { useDraftPersist } from '@/hooks/useDraftPersist';

function CustomForm() {
  const { clearDraft, isSaving } = useDraftPersist<FormData>(
    'customFormDraft',
    500 // custom debounce delay
  );

  // Use clearDraft() on successful submission
  const handleSubmit = async (data: FormData) => {
    await saveData(data);
    clearDraft(); // Clear draft after successful save
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {isSaving && <div>Saving draft...</div>}
    </form>
  );
}
```

## Testing

### Protection Features Testing

1. **Browser Leave Protection**:
   - Fill out form fields
   - Try to close browser tab → Should show "Leave site?" confirmation

2. **Router Navigation Protection**:
   - Fill out form fields
   - Try to navigate to another page → Should show confirmation dialog

3. **Cancel Button Protection**:
   - Fill out form fields
   - Click Cancel button → Should show confirmation dialog

4. **Auto-Save Functionality**:
   - Fill out form fields
   - Watch for "Auto-saving..." indicator
   - Refresh page → Form should restore with saved data

### Visual Indicators Testing

- **Auto-saving**: Green pulsing dot with "Auto-saving..." text
- **Draft saved**: Blue pulsing dot with "Draft saved!" text (shows for 3 seconds)
- **Unsaved changes**: Amber pulsing dot with "Unsaved changes" text

## Best Practices

### Form State Management

- Always use `formState.isDirty` to check for unsaved changes
- Combine `saving` and `isDraftSaving` states for accurate UI feedback
- Clear draft data on successful submission to prevent stale data

### Error Handling

- Implement graceful degradation for localStorage unavailability
- Provide clear error messages for validation failures
- Log errors to console for debugging in development

### Performance

- Use debounced saving to prevent excessive localStorage writes
- Only save when form data actually changes
- Implement smart change detection to avoid unnecessary operations

## Troubleshooting

### Common Issues

1. **Draft not saving**: Check if localStorage is available and not full
2. **Form not restoring**: Verify draft key matches between save and load
3. **Validation errors**: Ensure all required fields are properly validated
4. **Navigation not blocked**: Check if `formState.isDirty` is properly tracked

### Debug Logging

Enable comprehensive logging by checking browser console:

```typescript
console.log('✅ [useDraftPersist] Restored from draft');
console.log('💾 [useDraftPersist] Saving draft changes...');
console.log('🔄 [InvestmentWizard] Protection Active - form has unsaved changes');
```

## Future Enhancements

- **Multi-tab synchronization**: Sync draft data across browser tabs
- **Offline support**: Queue form submissions when offline
- **Advanced validation**: Real-time field validation with debouncing
- **Form analytics**: Track completion rates and abandonment points
- **Accessibility improvements**: Enhanced screen reader support and keyboard navigation 