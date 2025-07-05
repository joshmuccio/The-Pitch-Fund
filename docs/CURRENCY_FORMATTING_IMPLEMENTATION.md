# Currency Formatting Implementation Guide

## Overview

This document details the implementation of currency formatting in The Pitch Fund's investment forms using the `react-currency-input-field` library.

## Features Implemented

### 💰 Currency Formatting
- **Dollar Sign Prefix**: All currency fields display with `$` prefix
- **Thousands Separators**: Automatic comma insertion (e.g., `$50,000`)
- **Decimal Precision**: Limited to 2 decimal places
- **Clean Database Storage**: Raw numeric values stored without formatting

### 🎯 Target Form
1. **UnifiedInvestmentForm.tsx** - Consolidated investment form workflow (replaces MultiStepInvestmentForm.tsx, InvestmentForm.tsx, and CompanyForm.tsx)

## Technical Implementation

### Dependencies
```json
{
  "react-currency-input-field": "^3.10.0"
}
```

### Import Statement
```typescript
import CurrencyInput from 'react-currency-input-field'
```

### Basic Implementation Pattern
```typescript
<CurrencyInput
  name="investment_amount"
  prefix="$"
  value={formData.investment_amount}
  onValueChange={(value, name, values) => {
    setFormData(prev => ({ ...prev, investment_amount: values?.value || '' }))
  }}
  decimalsLimit={2}
  className="w-full px-3 py-2 bg-pitch-black border border-gray-600 rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none"
  placeholder="e.g. $50,000"
/>
```

## Currency Fields Updated

### UnifiedInvestmentForm.tsx (Consolidated Form)
- **Investment Amount ($)** - Main investment field
- **Round Size (USD)** - Full target round size tracking
- **Conversion Cap (USD)** - For SAFEs and convertible notes (conditional)
- **Post-Money Valuation ($)** - For equity investments (conditional)

**Note**: This unified form consolidates all currency fields that were previously distributed across multiple forms (`MultiStepInvestmentForm.tsx`, `InvestmentForm.tsx`, and `CompanyForm.tsx`).

## Best Practices Implementation

### onValueChange Handler
```typescript
onValueChange={(value, name, values) => {
  // Use values?.float for numeric operations
  // Use values?.value for display/state management
  setFormData(prev => ({ 
    ...prev, 
    [name]: values?.float ?? 0  // For react-hook-form
    // OR
    [name]: values?.value || '' // For controlled components
  }))
}}
```

### Form Integration Patterns

#### 1. Controlled Components (useState)
```typescript
const [localAmount, setLocalAmount] = useState('')

<CurrencyInput
  value={localAmount}
  onValueChange={(value, name, values) => {
    setLocalAmount(values?.value || '')
    setValue('investment_amount', values?.float ?? 0)
  }}
/>
```

#### 2. React Hook Form Integration
```typescript
const { watch, setValue } = useForm()

<CurrencyInput
  value={watch('investment_amount')}
  onValueChange={(value, name, values) => {
    setValue('investment_amount', values?.float ?? 0)
  }}
/>
```

## Data Flow

### Display Flow
1. User types: `50000`
2. CurrencyInput formats: `$50,000`
3. Display shows: `$50,000.00`

### Storage Flow
1. CurrencyInput provides: `values.float = 50000`
2. Form state receives: `50000` (number)
3. Database stores: `50000` (clean numeric)

## Testing Checklist

### ✅ Basic Functionality
- [ ] Dollar sign prefix displays
- [ ] Thousands separators appear
- [ ] Decimal places limited to 2
- [ ] Placeholder text shows formatted example

### ✅ User Experience
- [ ] Typing experience is smooth
- [ ] Copy/paste works correctly
- [ ] Tab navigation functions
- [ ] Form validation works

### ✅ Data Integrity
- [ ] Form submission sends clean numeric values
- [ ] Database receives unformatted numbers
- [ ] Form rehydration displays formatted values
- [ ] Edge cases handled (empty, zero, large numbers)

### ✅ Form Integration
- [ ] UnifiedInvestmentForm currency fields work
- [ ] All conditional fields display correctly (SAFE/Note vs Equity)
- [ ] Form consolidation maintains all currency functionality

## Error Handling

### Type Safety
```typescript
// Handle potential undefined values
onValueChange={(value, name, values) => {
  const numericValue = values?.float ?? 0
  const stringValue = values?.value || ''
  
  // Type-safe assignment
  setFormData(prev => ({ 
    ...prev, 
    [name]: numericValue 
  }))
}}
```

### Validation Integration
```typescript
// Works with existing Zod validation
const schema = z.object({
  investment_amount: z.number().min(0).optional(),
  conversion_cap_usd: z.number().min(0).optional(),
  post_money_valuation: z.number().min(0).optional(),
})
```

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

### Mobile Support
- ✅ iOS Safari
- ✅ Android Chrome
- ✅ Responsive design maintained

## Performance Considerations

### Bundle Size
- **Library Size**: ~15KB gzipped
- **Tree Shaking**: Supported
- **Dependencies**: Minimal

### Runtime Performance
- **No Re-renders**: Optimized state updates
- **Debounced Input**: Smooth typing experience
- **Memory Usage**: Minimal overhead

## Troubleshooting

### Common Issues

#### 1. TypeScript Errors
```typescript
// ❌ Error: Argument of type 'number | undefined' not assignable
setValue('amount', values.float)

// ✅ Solution: Use nullish coalescing
setValue('amount', values?.float ?? 0)
```

#### 2. Form Submission Issues
```typescript
// ❌ Problem: String values in numeric fields
const formData = {
  investment_amount: "$50,000" // String with formatting
}

// ✅ Solution: Use values.float
const formData = {
  investment_amount: 50000 // Clean numeric value
}
```

#### 3. State Management
```typescript
// ❌ Problem: Uncontrolled component warnings
<CurrencyInput value={undefined} />

// ✅ Solution: Provide default values
<CurrencyInput value={formData.amount || ''} />
```

## Future Enhancements

### Potential Improvements
1. **Currency Selection**: Support for multiple currencies
2. **Regional Formatting**: Locale-specific number formatting
3. **Validation Messages**: Custom error messages for currency fields
4. **Accessibility**: Enhanced screen reader support

### Migration Notes
If upgrading `react-currency-input-field`:
1. Review breaking changes in release notes
2. Test all forms thoroughly
3. Update TypeScript types if needed
4. Verify browser compatibility

## Related Documentation

- [Form Validation Guide](./FORM_VALIDATION_GUIDE.md)
- [Database Schema](../DATABASE.md)
- [Environment Setup](../ENVIRONMENT_SETUP.md)
- [Testing Guide](../SETUP_GUIDE.md)

## Summary

The currency formatting implementation provides:
- **Professional UI**: Dollar signs and thousands separators
- **Data Integrity**: Clean numeric values in database
- **Type Safety**: Proper TypeScript integration
- **Performance**: Optimized for smooth user experience
- **Accessibility**: Maintains form accessibility standards

All investment forms now provide a polished, professional currency input experience while maintaining clean data storage and type safety. 