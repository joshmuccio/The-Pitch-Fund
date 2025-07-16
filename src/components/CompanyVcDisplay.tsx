'use client'

import VcRelationships from './VcRelationships'

interface CompanyVcDisplayProps {
  companyId: string
  mode?: 'full' | 'compact' | 'minimal'
  showEpisodeContext?: boolean
  showManageButton?: boolean
  className?: string
}

export default function CompanyVcDisplay(props: CompanyVcDisplayProps) {
  return <VcRelationships {...props} />
} 