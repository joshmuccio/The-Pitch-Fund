'use client';

import { useEffect } from 'react';
import { ErrorHandler } from '../lib/error-handler';

export function ErrorHandlerInit() {
  useEffect(() => {
    ErrorHandler.init();
  }, []);

  return null;
} 