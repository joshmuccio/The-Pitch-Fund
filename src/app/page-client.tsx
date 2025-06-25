'use client';

import * as React from 'react';
import { PlasmicHomepage } from "../components/plasmic/the_pitch_fund/PlasmicHomepage";

// Client component for the Homepage
export function ClientHomepage(props: any) {
  return <PlasmicHomepage {...props} />;
}

// Also export as default for compatibility
export default ClientHomepage; 