/* src/components/QuickPastePanel.tsx */
import { useFormContext } from 'react-hook-form';
import { parseQuickPaste } from '@/lib/parseQuickPaste';

export default function QuickPastePanel() {
  const { setValue, getValues } = useFormContext();

  const handlePaste = (text: string) => {
    try {
      const extracted = parseQuickPaste(text);
      
      // Apply extracted data to form
      Object.entries(extracted).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          setValue(key as any, value, { shouldValidate: false });
        }
      });
    } catch (error) {
      console.error('QuickPaste: Error during parsing:', error);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        className="w-full h-72 rounded-lg bg-graphite-gray p-4 text-platinum-mist border border-gray-600 focus:border-cobalt-pulse focus:outline-none resize-none"
        placeholder="Paste AngelList memo here…"
        onBlur={e => {
          const text = e.target.value.trim();
          if (text) {
            handlePaste(text);
          }
        }}
      />
      <div className="text-xs text-gray-400">
        <p>💡 <strong>Tip:</strong> After pasting, click outside the text area to auto-populate the form fields.</p>
        <p>📋 <strong>Supported fields:</strong> Investment amount, instrument, round size, conversion cap, discount, pro-rata rights, country, incorporation type, founders, description, and investment reason.</p>
      </div>
    </div>
  );
} 