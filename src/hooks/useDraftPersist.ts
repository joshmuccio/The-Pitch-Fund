import { useEffect, useState, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { useFormContext, FieldValues } from 'react-hook-form';

export function useDraftPersist<T extends FieldValues>(key: string, delay = 700) {
  const { watch, reset } = useFormContext<T>();
  const values = watch();                              // ① live form data
  const [debounced] = useDebounce(values, delay);      // ② debounce
  const [isSaving, setIsSaving] = useState(false);     // ③ track draft saving state
  const lastSavedData = useRef<string | null>(null);   // ④ track last saved data
  const processingRef = useRef(false);                 // ⑤ prevent concurrent processing

  /* LOAD once on mount */
  useEffect(() => {
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as T;
        console.log('✅ [useDraftPersist] Restored from draft');
        reset(parsed, { keepDirty: true });
        lastSavedData.current = cached; // Store the loaded data as last saved
      } catch (error) {
        console.error('❌ [useDraftPersist] Error loading draft data:', error);
        // Clear corrupted data
        localStorage.removeItem(key);
      }
    }
  }, [key, reset]);

  /* SAVE only when debounced values actually change */
  useEffect(() => {
    if (!debounced || processingRef.current) {
      return;
    }

    // Check if QuickPaste is in progress - if so, skip auto-save
    if (localStorage.getItem('quickPasteInProgress')) {
      console.log('⏸️ [useDraftPersist] Skipping auto-save - QuickPaste in progress');
      return;
    }

    try {
      const newDataString = JSON.stringify(debounced);
      
      // Only process if data has actually changed
      if (newDataString !== lastSavedData.current) {
        console.log('💾 [useDraftPersist] Saving draft changes...');
        
        processingRef.current = true;
        setIsSaving(true);
        localStorage.setItem(key, newDataString);
        lastSavedData.current = newDataString;
        
        // Show saving indicator briefly
        const timer = setTimeout(() => {
          setIsSaving(false);
          processingRef.current = false;
          console.log('✅ [useDraftPersist] Save complete');
        }, 500);
        
        return () => {
          clearTimeout(timer);
          processingRef.current = false;
        };
      }
    } catch (error) {
      console.error('❌ [useDraftPersist] Error saving draft data:', error);
      setIsSaving(false);
      processingRef.current = false;
    }
  }, [key, debounced]);

  /* CLEAR draft data */
  const clearDraft = () => {
    localStorage.removeItem(key);
    lastSavedData.current = null;
    setIsSaving(false);
    processingRef.current = false;
  };

  return { clearDraft, isSaving };
} 