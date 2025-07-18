'use client'

import React, { useState, useEffect } from 'react'
import { type SelectedVc } from './MarketingInfoStep'

// Investment tracking data structure
export interface VcInvestment {
  vcId: string
  vcName: string
  firmName: string | null
  isInvested: boolean
  investmentAmount: number | null
  investmentDate: string | null // ISO date string
}

interface InvestmentTrackingStepProps {
  selectedVcs: SelectedVc[]
  onInvestmentDataChange: (investmentData: VcInvestment[]) => void
  customErrors?: Record<string, any>
}

export default function InvestmentTrackingStep({ 
  selectedVcs, 
  onInvestmentDataChange,
  customErrors = {} 
}: InvestmentTrackingStepProps) {
  const [investmentData, setInvestmentData] = useState<VcInvestment[]>([])

  // Initialize investment data when selectedVcs changes
  useEffect(() => {
    const initialData = selectedVcs.map(vc => ({
      vcId: vc.id,
      vcName: vc.name,
      firmName: vc.firm_name,
      isInvested: false,
      investmentAmount: null,
      investmentDate: null
    }))
    setInvestmentData(initialData)
  }, [selectedVcs])

  // Notify parent component when investment data changes
  useEffect(() => {
    onInvestmentDataChange(investmentData)
  }, [investmentData, onInvestmentDataChange])

  const handleInvestmentToggle = (vcId: string) => {
    setInvestmentData(prev => prev.map(item => 
      item.vcId === vcId 
        ? { 
            ...item, 
            isInvested: !item.isInvested,
            // Clear amount and date if unchecking
            investmentAmount: !item.isInvested ? item.investmentAmount : null,
            investmentDate: !item.isInvested ? item.investmentDate : null
          }
        : item
    ))
  }

  const handleAmountChange = (vcId: string, amount: string) => {
    const numericAmount = amount === '' ? null : parseFloat(amount)
    setInvestmentData(prev => prev.map(item => 
      item.vcId === vcId 
        ? { ...item, investmentAmount: numericAmount }
        : item
    ))
  }

  const handleDateChange = (vcId: string, date: string) => {
    setInvestmentData(prev => prev.map(item => 
      item.vcId === vcId 
        ? { ...item, investmentDate: date || null }
        : item
    ))
  }

  const totalInvested = investmentData
    .filter(item => item.isInvested && item.investmentAmount)
    .reduce((sum, item) => sum + (item.investmentAmount || 0), 0)

  const investorCount = investmentData.filter(item => item.isInvested).length

  if (selectedVcs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-platinum-mist mb-2">No VCs Selected</h3>
          <p className="text-gray-400 mb-4">
            You need to select VCs in the previous step before you can track investments.
          </p>
          <p className="text-sm text-gray-500">
            Go back to Step 3 to select the VCs who were featured in this episode.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-600 pb-4">
        <h3 className="text-xl font-semibold text-platinum-mist mb-2">💰 Investment Tracking</h3>
        <p className="text-gray-400">
          Track which VCs from this episode actually invested in the company and the investment amounts.
        </p>
      </div>

      {/* Summary */}
      {investorCount > 0 && (
        <div className="bg-green-600/10 border border-green-600 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-400">Investment Summary</div>
              <div className="text-xs text-green-300 mt-1">
                {investorCount} investor{investorCount !== 1 ? 's' : ''} • 
                ${totalInvested.toLocaleString()} total
              </div>
            </div>
            <div className="text-2xl text-green-400">
              {investorCount > 0 ? '✅' : '💭'}
            </div>
          </div>
        </div>
      )}

      {/* Investment Tracking Table */}
      <div className="border border-gray-600 rounded-lg overflow-hidden">
        <div className="bg-gray-700/50 px-4 py-3 border-b border-gray-600">
          <h4 className="font-medium text-platinum-mist">VCs Featured in Episode</h4>
          <p className="text-sm text-gray-400 mt-1">
            Check the box if the VC invested, then enter the investment amount and date.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/30 border-b border-gray-600">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Invested?
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  VC / Investor
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Investment Amount (USD)
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Investment Date
                </th>
              </tr>
            </thead>
            <tbody>
              {investmentData.map((investment, index) => (
                <tr 
                  key={investment.vcId}
                  className={`border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors ${
                    investment.isInvested ? 'bg-green-600/5' : ''
                  }`}
                >
                  {/* Investment Checkbox */}
                  <td className="px-4 py-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={investment.isInvested}
                        onChange={() => handleInvestmentToggle(investment.vcId)}
                        className="w-5 h-5 rounded border-gray-600 bg-pitch-black text-green-600 focus:ring-green-500 focus:ring-offset-0"
                      />
                      <span className="ml-2 text-sm">
                        {investment.isInvested ? '✅ Yes' : '⭕ No'}
                      </span>
                    </label>
                  </td>

                  {/* VC Information */}
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-medium text-platinum-mist">{investment.vcName}</div>
                      {investment.firmName && (
                        <div className="text-sm text-gray-400">{investment.firmName}</div>
                      )}
                    </div>
                  </td>

                  {/* Investment Amount */}
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-2">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder={investment.isInvested ? "50000" : ""}
                        value={investment.investmentAmount || ''}
                        onChange={(e) => handleAmountChange(investment.vcId, e.target.value)}
                        disabled={!investment.isInvested}
                        className={`w-32 px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none text-sm ${
                          investment.isInvested 
                            ? 'border-gray-600' 
                            : 'border-gray-700 bg-gray-800/50 text-gray-500 cursor-not-allowed'
                        }`}
                      />
                    </div>
                    {investment.isInvested && !investment.investmentAmount && (
                      <div className="text-xs text-orange-400 mt-1">
                        Amount required when invested
                      </div>
                    )}
                  </td>

                  {/* Investment Date */}
                  <td className="px-4 py-4">
                    <input
                      type="date"
                      value={investment.investmentDate || ''}
                      onChange={(e) => handleDateChange(investment.vcId, e.target.value)}
                      disabled={!investment.isInvested}
                      className={`w-40 px-3 py-2 bg-pitch-black border rounded text-platinum-mist focus:border-cobalt-pulse focus:outline-none text-sm ${
                        investment.isInvested 
                          ? 'border-gray-600' 
                          : 'border-gray-700 bg-gray-800/50 text-gray-500 cursor-not-allowed'
                      }`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation Errors */}
      {customErrors.investment_tracking && (
        <div className="bg-red-600/10 border border-red-600 rounded p-3">
          <div className="text-sm text-red-400">
            {customErrors.investment_tracking}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-600/10 border border-blue-600 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-400 text-xl">💡</div>
          <div>
            <div className="font-medium text-blue-400 mb-1">Investment Tracking Tips</div>
            <ul className="text-sm text-blue-300 space-y-1">
              <li>• Only check VCs who actually invested in the company</li>
              <li>• Investment amounts should be in USD</li>
              <li>• Investment date is when the money was transferred, not when the deal was announced</li>
              <li>• This data will be used to track VC performance and generate portfolio analytics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 