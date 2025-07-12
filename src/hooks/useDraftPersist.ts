import { useEffect, useState, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { useFormContext, FieldValues } from 'react-hook-form';
import toast from 'react-hot-toast';

// Extend Window interface to include our custom property
declare global {
  interface Window {
    __formMountTime?: number;
  }
}

export function useDraftPersist<T extends FieldValues>(key: string, delay = 700) {
  const { watch, reset, formState } = useFormContext<T>();
  const values = watch();                              // ① live form data
  const [debounced] = useDebounce(values, delay);      // ② debounce
  const [isSaving, setIsSaving] = useState(false);     // ③ track draft saving state
  const lastSavedData = useRef<string | null>(null);   // ④ track last saved data
  const processingRef = useRef(false);                 // ⑤ prevent concurrent processing
  const isRestoringRef = useRef(false);                // ⑥ track if we're restoring from draft
  const hasUserInteractedRef = useRef(false);          // ⑦ track if user has actually made changes
  const hasActualDataRef = useRef(false);              // ⑧ track if we restored actual user data

  /* LOAD once on mount */
  useEffect(() => {
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as T;
        
        // Check if the cached data has any meaningful values (not just default values)
        const hasActualData = Object.entries(parsed).some(([key, value]) => {
          // Skip checking these default/system fields
          if (['has_pro_rata_rights', 'fund', 'stage_at_investment', 'instrument', 'status', 'founder_role'].includes(key)) {
            return false;
          }
          // Check if value is meaningful (not empty string, null, undefined, or 0)
          return value !== null && value !== undefined && value !== '' && value !== 0;
        });
        
        // Mark that we're restoring from draft
        isRestoringRef.current = true;
        hasActualDataRef.current = hasActualData;
        
        if (hasActualData) {
          // Reset with draft data - don't rely on keepDirty since it's unreliable
          reset(parsed, { keepDirty: false });
          // Set the user interaction flag since there's actual data
          localStorage.setItem('userHasInteracted', 'true');
          hasUserInteractedRef.current = true;
          
          // Show toast notification for restored data
          toast.success('Draft data restored', { id: 'draft-restored' });
        } else {
          // Reset with default values and clear interaction flags
          reset(parsed, { keepDirty: false });
          localStorage.removeItem('userHasInteracted');
          hasUserInteractedRef.current = false;
        }
        
        lastSavedData.current = cached; // Store the loaded data as last saved
        
        // Clear the restoring flag after a short delay to allow form to settle
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 100);
        
      } catch (error) {
        console.error('❌ [useDraftPersist] Error loading draft data:', error);
        // Clear corrupted data
        localStorage.removeItem(key);
        localStorage.removeItem('userHasInteracted');
      }
    } else {
      // No cached data exists, so clear any stale interaction flags
      localStorage.removeItem('userHasInteracted');
      hasUserInteractedRef.current = false;
      hasActualDataRef.current = false;
    }
  }, [key, reset]);

  /* Track when user actually interacts with the form */
  useEffect(() => {
    // Check if user has already interacted (including via QuickPaste)
    if (localStorage.getItem('userHasInteracted')) {
      hasUserInteractedRef.current = true;
      return;
    }
    
    if (formState.isDirty && !isRestoringRef.current && !hasUserInteractedRef.current) {
      // Check if this is happening during initial form setup
      // If we're within the first 2 seconds of component mount, it's likely initialization
      const now = Date.now();
      const timeSinceMount = now - (window.__formMountTime || 0);
      
      if (!window.__formMountTime) {
        window.__formMountTime = now;
        return; // Skip this first trigger
      }
      
      if (timeSinceMount < 2000) {
        return; // Skip initialization
      }
      
      hasUserInteractedRef.current = true;
      localStorage.setItem('userHasInteracted', 'true');
    }
  }, [formState.isDirty, formState.dirtyFields]);

  /* Helper function to clean data before saving to localStorage */
  const cleanDataForStorage = (data: any) => {
    const cleaned = { ...data };
    
    // Convert null values to undefined (they'll be omitted in JSON)
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === null) {
        cleaned[key] = undefined;
      }
      // Also handle NaN values
      if (typeof cleaned[key] === 'number' && isNaN(cleaned[key])) {
        cleaned[key] = undefined;
      }
    });
    
    return cleaned;
  };

  /* SAVE only when debounced values actually change AND user has interacted */
  useEffect(() => {
    if (!debounced || processingRef.current) {
      return;
    }

    // Check if user has interacted either through direct input, QuickPaste, or restored actual data
    const hasInteracted = hasUserInteractedRef.current || localStorage.getItem('userHasInteracted') || hasActualDataRef.current;
    if (!hasInteracted) {
      return;
    }

    // Only save if the form has been modified by the user (is dirty) OR we have actual restored data
    if (!formState.isDirty && !hasActualDataRef.current) {
      return;
    }

    // Don't save while restoring from draft
    if (isRestoringRef.current) {
      return;
    }

    // Check if QuickPaste is in progress - if so, skip auto-save
    if (localStorage.getItem('quickPasteInProgress')) {
      return;
    }

    try {
      const cleanedData = cleanDataForStorage(debounced);
      const newDataString = JSON.stringify(cleanedData);
      
      // Only process if data has actually changed
      if (newDataString !== lastSavedData.current) {
        processingRef.current = true;
        setIsSaving(true);
        localStorage.setItem(key, newDataString);
        lastSavedData.current = newDataString;
        
        // Show toast notification
        toast.success('Draft saved', { id: 'draft-saved' });
        
        // Show saving indicator briefly
        const timer = setTimeout(() => {
          setIsSaving(false);
          processingRef.current = false;
        }, 500);
        
        return () => {
          clearTimeout(timer);
          processingRef.current = false;
        };
      }
    } catch (error) {
      console.error('❌ [useDraftPersist] Error saving draft data:', error);
      toast.error('Failed to save draft');
      setIsSaving(false);
      processingRef.current = false;
    }
  }, [key, debounced, formState.isDirty]);

  /* CLEAR draft data */
  const clearDraft = () => {
    localStorage.removeItem(key);
    localStorage.removeItem('userHasInteracted'); // Clear user interaction flag
    lastSavedData.current = null;
    setIsSaving(false);
    processingRef.current = false;
    hasUserInteractedRef.current = false; // Reset user interaction tracking
    hasActualDataRef.current = false; // Reset actual data tracking
    
    // Show toast notification
    toast.success('Draft cleared', { id: 'draft-cleared' });
  };

  // Return whether we have unsaved changes (either dirty form or restored actual data)
  const hasUnsavedChanges = formState.isDirty || hasActualDataRef.current || localStorage.getItem('userHasInteracted');

  return { clearDraft, isSaving, hasUnsavedChanges };
} 