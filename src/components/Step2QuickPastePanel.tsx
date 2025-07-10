/* src/components/Step2QuickPastePanel.tsx */
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { parseDiligenceBlob } from '@/lib/parseFounderDiligence';
import { Step2FormValues } from '@/app/admin/schemas/companySchema';

export default function Step2QuickPastePanel() {
  const { setValue, getValues, formState } = useFormContext<Step2FormValues>();
  const [pastedText, setPastedText] = useState('');
  const [isProcessed, setIsProcessed] = useState(false);

  const handlePaste = (text: string) => {
    if (!text.trim()) return;

    try {
      console.log('🔍 [Step2QuickPaste] Raw input text length:', text.length);
      console.log('🔍 [Step2QuickPaste] Raw input first 500 chars:', text.substring(0, 500));
      console.log('🔍 [Step2QuickPaste] Raw input last 500 chars:', text.substring(text.length - 500));
      
      const extracted = parseDiligenceBlob(text);
      
      console.log('Step2QuickPaste: Extracted data:', extracted);
      console.log('Step2QuickPaste: Form state before update - isDirty:', formState.isDirty);
      
      // Clear the draft cache to prevent conflicts with auto-save
      localStorage.removeItem('investmentWizardDraft');
      
      // Temporarily disable auto-save by setting a flag
      localStorage.setItem('quickPasteInProgress', 'true');
      
      // Get current form values and merge with extracted data
      const currentValues = getValues();
      const mergedValues = { ...currentValues, ...extracted };
      
      console.log('Step2QuickPaste: Setting individual field values...');
      
      // Handle company fields
      if (extracted.legal_name) {
        setValue('legal_name', extracted.legal_name, { 
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true 
        });
      }
      
      // Handle HQ location fields
      const hqFields = ['hq_address_line_1', 'hq_city', 'hq_state', 'hq_zip_code', 'hq_country'] as const;
      hqFields.forEach(field => {
        if (extracted[field]) {
          setValue(field, extracted[field], { 
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true 
          });
        }
      });
      
      // Handle founders array - this is the key difference from Step 1
      if (extracted.founders && extracted.founders.length > 0) {
        console.log('Step2QuickPaste: Setting founders array:', extracted.founders);
        setValue('founders', extracted.founders, { 
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true 
        });
      }
      
      console.log('Step2QuickPaste: Form state after setValue calls - isDirty:', formState.isDirty);
      
      // Force the form to be dirty by making a small change
      setTimeout(() => {
        console.log('Step2QuickPaste: Form state after timeout - isDirty:', formState.isDirty);
        if (!formState.isDirty) {
          console.log('Step2QuickPaste: Form not dirty, forcing dirty state...');
          // Make a tiny change to force dirty state using a Step 2 field
          const currentLegalName = getValues('legal_name');
          setValue('legal_name', (currentLegalName || '') + ' ', { shouldDirty: true });
          setValue('legal_name', currentLegalName || '', { shouldDirty: true });
        }
      }, 100);
      
      console.log('Step2QuickPaste: Form updated successfully');
      setIsProcessed(true);
      
      // Enable user interaction tracking after QuickPaste
      setTimeout(() => {
        localStorage.removeItem('quickPasteInProgress');
        // Mark that user has interacted with the form (via QuickPaste)
        localStorage.setItem('userHasInteracted', 'true');
        console.log('Step2QuickPaste: Auto-save re-enabled and user interaction marked');
        console.log('Step2QuickPaste: Final form state - isDirty:', formState.isDirty);
      }, 1000);
      
    } catch (error) {
      console.error('Step2QuickPaste: Error parsing text:', error);
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
          🏢 Company & Founder Quick-Paste
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
        Paste founder diligence data to auto-populate company HQ location and founder details (up to 3 founders).
        {isProcessed && (
          <span className="text-green-400 ml-2">✅ Data processed successfully!</span>
        )}
      </p>
      <textarea
        className="w-full h-32 p-3 bg-pitch-black border border-gray-600 rounded text-platinum-mist resize-none focus:border-cobalt-pulse focus:outline-none"
        placeholder="Paste your founder diligence data here..."
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