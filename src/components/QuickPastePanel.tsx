/* src/components/QuickPastePanel.tsx */
import { useFormContext } from 'react-hook-form';
import { parseQuickPaste } from '@/lib/parseQuickPaste';

export default function QuickPastePanel() {
  const { setValue, getValues, reset } = useFormContext();

  const handlePaste = (text: string) => {
    try {
      const extracted = parseQuickPaste(text);
      
      console.log('QuickPaste: Extracted data:', extracted);
      
      // Clear the draft cache to prevent conflicts
      localStorage.removeItem('investmentFormData');
      
      // Get current form values and merge with extracted data
      const currentValues = getValues();
      const mergedValues = { ...currentValues, ...extracted };
      
      // Apply all values using reset() which properly updates all form fields
      reset(mergedValues, { 
        keepDefaultValues: false,
        keepDirty: false,
        keepTouched: false,
        keepErrors: false
      });
      
      console.log('QuickPaste: Form updated successfully');
      
    } catch (error) {
      console.error('QuickPaste: Error parsing text:', error);
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