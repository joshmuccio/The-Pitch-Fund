/* src/components/Step2QuickPastePanel.tsx */
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { parseDiligenceBlob, type Step2AutoPopulateField, type AddressNormalizationResult } from '@/lib/parseFounderDiligence';
import { Step2FormValues } from '@/app/admin/schemas/companySchema';
import { toast } from 'react-hot-toast';

interface Step2QuickPastePanelProps {
  onParseComplete?: (failedFields: Set<Step2AutoPopulateField>, addressNormalization?: AddressNormalizationResult) => void;
}

export default function Step2QuickPastePanel({ onParseComplete }: Step2QuickPastePanelProps) {
  const { setValue, getValues, formState } = useFormContext<Step2FormValues>();
  const [pastedText, setPastedText] = useState('');
  const [isProcessed, setIsProcessed] = useState(false);
  const [lastFailedFields, setLastFailedFields] = useState<Set<Step2AutoPopulateField>>(new Set());
  const [addressNormalization, setAddressNormalization] = useState<AddressNormalizationResult | null>(null);

  // Function to show appropriate feedback for address normalization
  const showAddressNormalizationFeedback = (result: AddressNormalizationResult) => {
    switch (result.method) {
      case 'mapbox':
        if (result.needsReview) {
          toast('⚠️ Address normalized with Mapbox, but confidence is low - please review fields manually.', {
            duration: 6000,
            style: {
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fcd34d'
            },
            icon: '🗺️'
          });
        } else {
          toast.success('✅ Address successfully normalized with Mapbox geocoding!', {
            duration: 4000,
            icon: '🗺️'
          });
        }
        break;
        
      case 'regex':
        toast('📍 Address parsed with pattern matching - please review and correct manually.', {
          duration: 5000,
          style: {
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fcd34d'
          },
          icon: '🔧'
        });
        break;
        
      case 'fallback':
        toast('⚠️ Could not parse address structure - please enter address details manually.', {
          duration: 6000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fecaca'
          },
          icon: '❌'
        });
        break;
    }
  };

  const handlePaste = async (text: string) => {
    if (!text.trim()) return;

    try {
      console.log('🔍 [Step2QuickPaste] Raw input text length:', text.length);
      console.log('🔍 [Step2QuickPaste] Raw input first 500 chars:', text.substring(0, 500));
      console.log('🔍 [Step2QuickPaste] Raw input last 500 chars:', text.substring(text.length - 500));
      
      const parseResult = await parseDiligenceBlob(text);
      const { extractedData, successfullyParsed, failedToParse, addressNormalization: addrResult } = parseResult;
      
      console.log('Step2QuickPaste: Extracted data:', extractedData);
      console.log('Step2QuickPaste: Successfully parsed fields:', Array.from(successfullyParsed));
      console.log('Step2QuickPaste: Failed to parse fields:', Array.from(failedToParse));
      console.log('Step2QuickPaste: Form state before update - isDirty:', formState.isDirty);
      
      // Clear the draft cache to prevent conflicts with auto-save
      localStorage.removeItem('investmentWizardDraft');
      
      // Temporarily disable auto-save by setting a flag
      localStorage.setItem('quickPasteInProgress', 'true');
      
      // Get current form values and merge with extracted data
      const currentValues = getValues();
      const mergedValues = { ...currentValues, ...extractedData };
      
      console.log('Step2QuickPaste: Setting individual field values...');
      
      // Handle company fields
      if (extractedData.legal_name) {
        setValue('legal_name', extractedData.legal_name, { 
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true 
        });
      }
      
      // Handle HQ location fields
      const hqFields = ['hq_address_line_1', 'hq_city', 'hq_state', 'hq_zip_code', 'hq_country'] as const;
      hqFields.forEach(field => {
        if (extractedData[field]) {
          setValue(field, extractedData[field], { 
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true 
          });
        }
      });
      
      // Handle founders array - this is the key difference from Step 1
      if (extractedData.founders && extractedData.founders.length > 0) {
        console.log('Step2QuickPaste: Setting founders array:', extractedData.founders);
        setValue('founders', extractedData.founders, { 
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
      setLastFailedFields(failedToParse);
      setAddressNormalization(addrResult || null);
      
      // Show address normalization feedback
      if (addrResult) {
        showAddressNormalizationFeedback(addrResult);
      }
      
      // Notify parent about parsing completion
      if (onParseComplete) {
        onParseComplete(failedToParse, addrResult || undefined);
      }
      
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
    setLastFailedFields(new Set());
    setAddressNormalization(null);
    
    // Clear the failed fields from parent when clearing the paste
    if (onParseComplete) {
      onParseComplete(new Set(), undefined);
    }
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
        Includes intelligent address normalization with Mapbox.
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
        onBlur={async (e) => {
          if (e.target.value.trim() && !isProcessed) {
            await handlePaste(e.target.value);
          }
        }}
      />
      {pastedText && !isProcessed && (
        <div className="mt-2">
          <button
            onClick={async () => await handlePaste(pastedText)}
            className="text-sm bg-cobalt-pulse hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
          >
            Process Data
          </button>
        </div>
      )}
    </div>
  );
} 