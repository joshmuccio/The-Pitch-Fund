# Investment Wizard & Auto-Save System Guide

## Overview

The Investment Wizard is a modern, multi-step form system for creating and managing investment records. It features automatic draft persistence with toast notifications, smart auto-save behavior, and seamless integration with the QuickPaste system.

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
- **Smart Auto-Save System**: Debounced localStorage persistence with toast notifications
- **Draft Persistence**: Automatic restoration of draft data that survives page refreshes
- **Toast Notifications**: Clean, non-intrusive feedback using react-hot-toast
- **QuickPaste Integration**: Enhanced AngelList memo parsing with persistent text display
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
- Conversion Cap (USD) * (SAFE/Note only)
- Discount Percent * (SAFE/Note only)
- Post-Money Valuation ($) * (Equity only)
- Pro-Rata Rights (checkbox)
- Country of Incorporation *
- Incorporation Type *

**Features**:
- Enhanced QuickPaste panel with persistent text display
- Conditional field validation based on instrument type
- Currency formatting with controlled `CurrencyInput` components
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

## Data Persistence Without Popups

### Simplified Approach

The system no longer uses intrusive navigation guards or leave-page confirmations. Instead:

- **Draft persistence survives page refreshes** - Users can safely navigate away
- **Toast notifications** provide clean feedback
- **Smart restoration** detects and restores actual user data
- **No annoying popups** for navigation or browser close events

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

function CustomForm() {
  const { clearDraft, isSaving, hasUnsavedChanges } = useDraftPersist<FormData>(
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

### Auto-Save Functionality Testing

1. **Smart Auto-Save**:
   - Load empty form → Should not auto-save until user interacts
   - Type in any field → Should start auto-saving after 700ms
   - Watch for toast notifications confirming saves

2. **Draft Restoration**:
   - Fill out form fields and wait for auto-save
   - Refresh page → Should restore data with "Draft data restored" toast
   - Clear form → Should show confirmation and reload with empty form

3. **QuickPaste Enhanced UX**:
   - Paste AngelList memo text
   - Text should remain visible for comparison
   - Click "Process" button → Should populate fields and show success toast
   - Click "Clear" button → Should clear textarea

### Toast Notifications Testing

- **Draft saved**: Green toast appears after form changes are saved
- **Draft restored**: Blue toast appears when draft data is loaded on page refresh
- **Draft cleared**: Green toast appears when form is successfully cleared
- **QuickPaste success**: Success toast when memo is processed
- **Errors**: Red toast for any processing errors

## Best Practices

### Form State Management

- Use `hasUnsavedChanges` to check for unsaved changes instead of `formState.isDirty`
- Combine `saving` and `isSaving` states for accurate UI feedback
- Clear draft data on successful submission to prevent stale data

### Toast Notifications

- Use consistent toast IDs to prevent duplicate notifications
- Keep messages concise and actionable
- Use appropriate toast types (success, error, loading)

### Performance

- Use debounced saving to prevent excessive localStorage writes
- Only save when form data actually changes and user has interacted
- Implement smart change detection to avoid unnecessary operations

## Troubleshooting

### Common Issues

1. **Draft not saving**: Check if user has interacted with form and localStorage is available
2. **Form not restoring**: Verify draft key matches and data contains actual values
3. **Toast notifications not showing**: Ensure Toaster component is added to layout
4. **QuickPaste not working**: Check for parsing errors in console logs

### Debug Logging

Enable comprehensive logging by checking browser console:

```typescript
console.log('✅ [useDraftPersist] Restored from draft');
console.log('💾 [useDraftPersist] Saving draft changes...');
console.log('👤 [useDraftPersist] User interaction detected - enabling auto-save');
console.log('🔄 [InvestmentWizard] Protection Active - form has unsaved changes');
```

## Future Enhancements

- **Multi-tab synchronization**: Sync draft data across browser tabs
- **Offline support**: Queue form submissions when offline
- **Advanced validation**: Real-time field validation with debouncing
- **Form analytics**: Track completion rates and abandonment points
- **Accessibility improvements**: Enhanced screen reader support and keyboard navigation 