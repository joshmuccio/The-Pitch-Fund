/* src/components/QuickPastePanel.tsx */
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { parseQuickPaste } from '@/lib/parseQuickPaste';

export default function QuickPastePanel() {
  const { setValue, getValues, reset, formState } = useFormContext();
  const [pastedText, setPastedText] = useState('');
  const [isProcessed, setIsProcessed] = useState(false);

  const handlePaste = (text: string) => {
    if (!text.trim()) return;

    try {
      const extracted = parseQuickPaste(text);
      
      console.log('QuickPaste: Extracted data:', extracted);
      console.log('QuickPaste: Form state before update - isDirty:', formState.isDirty);
      
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
      
      // Try a different approach - use setValue for each field individually
      console.log('QuickPaste: Setting individual field values...');
      Object.entries(extracted).forEach(([key, value]) => {
        setValue(key as any, value, { 
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true 
        });
      });
      
      console.log('QuickPaste: Form state after setValue calls - isDirty:', formState.isDirty);
      
      // Force the form to be dirty by making a small change
      setTimeout(() => {
        console.log('QuickPaste: Form state after timeout - isDirty:', formState.isDirty);
        if (!formState.isDirty) {
          console.log('QuickPaste: Form not dirty, forcing dirty state...');
          // Make a tiny change to force dirty state
          const currentCompanyName = getValues('company_name');
          setValue('company_name', currentCompanyName + ' ', { shouldDirty: true });
          setValue('company_name', currentCompanyName, { shouldDirty: true });
        }
      }, 100);
      
      console.log('QuickPaste: Form updated successfully');
      setIsProcessed(true);
      
      // Enable user interaction tracking after QuickPaste
      setTimeout(() => {
        localStorage.removeItem('quickPasteInProgress');
        // Mark that user has interacted with the form (via QuickPaste)
        localStorage.setItem('userHasInteracted', 'true');
        console.log('QuickPaste: Auto-save re-enabled and user interaction marked');
        console.log('QuickPaste: Final form state - isDirty:', formState.isDirty);
      }, 1000);
      
    } catch (error) {
      console.error('QuickPaste: Error parsing text:', error);
      // Make sure to clean up the flags even on error
      localStorage.removeItem('quickPasteInProgress');
    }
  };

  const handleClear = () => {
    setPastedText('');
    setIsProcessed(false);
  };

  return (
    <div className="bg-pitch-black/50 p-4 rounded-lg border border-gray-700 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-platinum-mist flex items-center gap-2">
          ⚡ Quick-Paste
        </h3>
        {pastedText && (
          <button
            onClick={handleClear}
            className="text-sm text-gray-400 hover:text-platinum-mist transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <p className="text-sm text-gray-400 mb-3">
        Paste AngelList investment text to auto-populate form fields.
        {isProcessed && (
          <span className="text-green-400 ml-2">✅ Data processed successfully!</span>
        )}
      </p>
      <textarea
        className="w-full h-32 p-3 bg-pitch-black border border-gray-600 rounded text-platinum-mist resize-none focus:border-cobalt-pulse focus:outline-none"
        placeholder="Paste your investment data here..."
        value={pastedText}
        onChange={(e) => {
          setPastedText(e.target.value);
          setIsProcessed(false);
        }}
        onBlur={(e) => {
          if (e.target.value.trim() && !isProcessed) {
            handlePaste(e.target.value);
          }
        }}
      />
      {pastedText && !isProcessed && (
        <div className="mt-2">
          <button
            onClick={() => handlePaste(pastedText)}
            className="text-sm bg-cobalt-pulse hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
          >
            Process Data
          </button>
        </div>
      )}
    </div>
  );
} 