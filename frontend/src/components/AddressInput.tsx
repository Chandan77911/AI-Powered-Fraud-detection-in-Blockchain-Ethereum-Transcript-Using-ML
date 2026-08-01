import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Zap, AlertCircle } from 'lucide-react'
import { FRAUD_ADDRESS, SAFE_ADDRESS } from '../types'

interface Props {
  onAnalyze: (address: string) => void
  onSwitchToManual: () => void
  isLoading: boolean
  errorMsg?: string
}

export default function AddressInput({ onAnalyze, onSwitchToManual, isLoading, errorMsg }: Props) {
  const [address, setAddress] = useState('')

  const handleSubmit = () => {
    const trimmed = address.trim()
    if (!trimmed.match(/^0x[0-9a-fA-F]{40}$/)) return
    onAnalyze(trimmed)
  }

  const isValid = address.trim().match(/^0x[0-9a-fA-F]{40}$/)

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Address input row */}
      <div
        className="flex items-center gap-0 rounded-xl overflow-hidden"
        style={{
          background: 'rgba(19,19,31,0.9)',
          border: '1px solid rgba(98,126,234,0.25)',
          boxShadow: '0 0 30px rgba(98,126,234,0.06)',
        }}
      >
        <div className="flex items-center gap-2 px-4" style={{ color: '#627EEA' }}>
          <Search size={15} />
        </div>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Paste wallet address: 0x..."
          className="flex-1 bg-transparent outline-none font-mono py-4 pr-2"
          style={{
            fontSize: 13,
            color: '#8B9FEF',
            letterSpacing: '0.04em',
          }}
        />
        <motion.button
          onClick={handleSubmit}
          disabled={isLoading || !isValid}
          className="flex items-center gap-2 px-5 py-4 font-mono transition-all"
          style={{
            fontSize: 12,
            letterSpacing: '0.12em',
            color: isValid ? '#8B9FEF' : '#374151',
            background: isValid ? 'rgba(98,126,234,0.12)' : 'transparent',
            borderLeft: '1px solid rgba(98,126,234,0.2)',
            cursor: isValid ? 'pointer' : 'default',
          }}
          whileHover={isValid ? { background: 'rgba(98,126,234,0.2)' } : {}}
          whileTap={isValid ? { scale: 0.98 } : {}}
        >
          <Zap size={13} />
          {isLoading ? 'SCANNING...' : 'SCAN'}
        </motion.button>
      </div>

      {/* Error */}
      {errorMsg && (
        <motion.div
          className="flex items-center gap-2 rounded-lg px-4 py-2.5"
          style={{ background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.2)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <AlertCircle size={13} style={{ color: '#FF6B6B', flexShrink: 0 }} />
          <span className="font-mono" style={{ fontSize: 11, color: '#FF6B6B' }}>{errorMsg}</span>
        </motion.div>
      )}

      {/* Quick fill & mode toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono" style={{ fontSize: 10, color: '#374151', letterSpacing: '0.1em' }}>
            EXAMPLES:
          </span>
          <button
            onClick={() => setAddress(FRAUD_ADDRESS)}
            className="rounded-lg px-3 py-1.5 font-mono transition-all"
            style={{ fontSize: 11, color: '#FF6B6B', background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.25)' }}
            onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(255,107,107,0.12)' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = 'rgba(255,107,107,0.06)' }}
          >
            ⚠ High-Risk
          </button>
          <button
            onClick={() => setAddress(SAFE_ADDRESS)}
            className="rounded-lg px-3 py-1.5 font-mono transition-all"
            style={{ fontSize: 11, color: '#06D6A0', background: 'rgba(6,214,160,0.06)', border: '1px solid rgba(6,214,160,0.25)' }}
            onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(6,214,160,0.12)' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = 'rgba(6,214,160,0.06)' }}
          >
            ✓ Safe
          </button>
        </div>
        <button
          onClick={onSwitchToManual}
          className="font-mono transition-all"
          style={{ fontSize: 10, color: '#374151', letterSpacing: '0.08em', background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => { (e.target as HTMLElement).style.color = '#627EEA' }}
          onMouseLeave={e => { (e.target as HTMLElement).style.color = '#374151' }}
        >
          ↳ Enter features manually
        </button>
      </div>
    </motion.div>
  )
}
