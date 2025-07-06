/* src/components/QuickPastePanel.tsx */
import { useFormContext } from 'react-hook-form';
import { parseQuickPaste } from '@/lib/parseQuickPaste';

export default function QuickPastePanel() {
  const { setValue, getValues, reset } = useFormContext();

  const handlePaste = (text: string) => {
    try {
      const extracted = parseQuickPaste(text);
      
      console.log('QuickPaste: Extracted data:', extracted);
      
      // Log currency field values and their types
      const currencyFields = ['investment_amount', 'round_size_usd', 'conversion_cap_usd', 'post_money_valuation'];
      currencyFields.forEach(field => {
        if (extracted[field] !== undefined) {
          console.log(`QuickPaste: ${field} = ${extracted[field]} (type: ${typeof extracted[field]})`);
        }
      });
      
      // Clear the draft cache to prevent conflicts with auto-save
      localStorage.removeItem('investmentWizardDraft');
      
      // Temporarily disable auto-save by setting a flag
      localStorage.setItem('quickPasteInProgress', 'true');
      
      // Get current form values and merge with extracted data
      const currentValues = getValues();
      const mergedValues = { ...currentValues, ...extracted };
      
      console.log('QuickPaste: Merged values for currency fields:');
      currencyFields.forEach(field => {
        if (mergedValues[field] !== undefined) {
          console.log(`QuickPaste: ${field} = ${mergedValues[field]} (type: ${typeof mergedValues[field]})`);
        }
      });
      
      // Apply all values using reset() which properly updates all form fields
      reset(mergedValues, { 
        keepDefaultValues: false,
        keepDirty: false,
        keepTouched: false,
        keepErrors: false
      });
      
      console.log('QuickPaste: Form updated successfully');
      
      // Re-enable auto-save after 2 seconds to give CurrencyInput time to format
      setTimeout(() => {
        localStorage.removeItem('quickPasteInProgress');
        console.log('QuickPaste: Auto-save re-enabled');
      }, 2000);
      
    } catch (error) {
      console.error('QuickPaste: Error parsing text:', error);
      // Make sure to clean up the flag even on error
      localStorage.removeItem('quickPasteInProgress');
    }
  };

  return (
    <div className="bg-pitch-black/50 p-4 rounded-lg border border-gray-700 mb-6">
      <h3 className="text-lg font-semibold text-platinum-mist mb-3">
        Quick Paste
      </h3>
      <p className="text-sm text-gray-400 mb-3">
        Paste your investment data and we'll automatically fill out the form fields.
      </p>
      <textarea
        className="w-full h-32 p-3 bg-pitch-black border border-gray-600 rounded text-platinum-mist resize-none focus:border-cobalt-pulse focus:outline-none"
        placeholder="Paste your investment data here..."
        onChange={(e) => {
          if (e.target.value.trim()) {
            handlePaste(e.target.value);
            e.target.value = ''; // Clear the textarea
          }
        }}
      />
    </div>
  );
} 