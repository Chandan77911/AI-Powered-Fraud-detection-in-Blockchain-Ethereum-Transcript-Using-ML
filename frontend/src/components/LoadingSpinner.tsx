import { motion } from 'framer-motion'

export default function LoadingSpinner() {
  return (
    <motion.div className="flex flex-col items-center gap-6 py-20"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

      {/* Triple ring spinner */}
      <div className="relative" style={{ width: 88, height: 88 }}>
        <motion.div className="absolute inset-0 rounded-full"
          style={{ border: '2px solid rgba(98,126,234,0.15)', borderTopColor: '#627EEA' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div className="absolute inset-3 rounded-full"
          style={{ border: '2px solid rgba(79,195,247,0.15)', borderBottomColor: '#4FC3F7' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.7, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div className="absolute inset-6 rounded-full"
          style={{ border: '2px solid rgba(255,209,102,0.15)', borderLeftColor: '#FFD166' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.3, repeat: Infinity, ease: 'linear' }}
        />
        {/* Center dot */}
        <motion.div className="absolute inset-[35%] rounded-full"
          style={{ background: '#627EEA' }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7],
            boxShadow: ['0 0 8px rgba(98,126,234,0.4)', '0 0 20px rgba(98,126,234,0.8)', '0 0 8px rgba(98,126,234,0.4)'] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      </div>

      {/* Text */}
      <div className="text-center space-y-1.5">
        <motion.p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 14,
            letterSpacing: '0.12em', color: '#8B9FEF' }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity }}>
          ANALYZING ON-CHAIN PATTERNS
        </motion.p>
        <p className="font-mono" style={{ fontSize: 11, color: '#374151', letterSpacing: '0.08em' }}>
          XGBoost inference · 22 features
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {[0,1,2,3].map(i => (
          <motion.div key={i} className="rounded-full"
            style={{ width: 5, height: 5, background: '#627EEA' }}
            animate={{ opacity: [0.15, 0.9, 0.15], scale: [1, 1.5, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  )
}
