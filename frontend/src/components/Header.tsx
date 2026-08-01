import { motion } from 'framer-motion'
import { Activity, Shield } from 'lucide-react'
import EthLogo3D from './EthLogo3D'

export default function Header() {
  return (
    <header className="relative w-full border-b" style={{
      borderColor: 'rgba(37,37,56,0.8)',
      background: 'rgba(14,14,26,0.92)',
      backdropFilter: 'blur(24px)',
    }}>
      {/* Top purple accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, transparent, #627EEA, #4FC3F7, #627EEA, transparent)' }}
      />

      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo + Title */}
        <motion.div className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <EthLogo3D size={42} />

          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18,
              letterSpacing: '0.08em', margin: 0, lineHeight: 1.2 }}>
              <span style={{
                background: 'linear-gradient(135deg, #627EEA, #8B9FEF)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>ETHEREUM</span>
              <span style={{ color: '#F1F5F9', marginLeft: 8 }}>FRAUD SENTINEL</span>
            </h1>
            <p className="font-mono" style={{ fontSize: 10, letterSpacing: '0.12em',
              color: '#64748B', margin: 0 }}>
              ON-CHAIN ANOMALY DETECTION · XGBOOST v3 · 94.7% ACC
            </p>
          </div>
        </motion.div>

        {/* Right: status */}
        <motion.div className="flex items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Live dot */}
          <div className="hidden sm:flex items-center gap-2">
            <motion.div className="h-1.5 w-1.5 rounded-full"
              style={{ background: '#06D6A0' }}
              animate={{ opacity: [1, 0.2, 1], boxShadow: ['0 0 6px #06D6A0', '0 0 2px #06D6A0', '0 0 6px #06D6A0'] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            <span className="font-mono" style={{ fontSize: 11, color: '#06D6A0', letterSpacing: '0.1em' }}>LIVE</span>
          </div>

          {/* Shield indicator */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5"
            style={{ background: 'rgba(98,126,234,0.08)', border: '1px solid rgba(98,126,234,0.2)' }}>
            <Shield size={12} style={{ color: '#627EEA' }} />
            <span className="font-mono" style={{ fontSize: 11, color: '#627EEA', letterSpacing: '0.08em' }}>
              PROTECTED
            </span>
          </div>

          {/* Network pill */}
          <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
            style={{ background: 'rgba(14,14,26,0.8)', border: '1px solid rgba(37,37,56,0.9)' }}>
            <Activity size={12} style={{ color: '#4FC3F7' }} />
            <span className="font-mono" style={{ fontSize: 11, color: '#64748B', letterSpacing: '0.08em' }}>MAINNET</span>
          </div>
        </motion.div>
      </div>
    </header>
  )
}
