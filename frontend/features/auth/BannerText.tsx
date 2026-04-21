'use client'

import Logo from '@/components/common/logo'
import MetricCard from '@/components/common/MetricCard'
import { motion } from 'motion/react'

function BannerText() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative z-10 max-w-xl"
    >
      <Logo />

      <h1 className="text-on-surface mt-12 mb-6 text-[3.5rem] leading-[1.05] font-bold tracking-tight">
        Quantum velocity for institutional{' '}
        <span className="text-primary italic">capital.</span>
      </h1>

      <p className="text-on-surface-variant mb-16 max-w-md text-xl leading-relaxed font-light">
        Experience the next generation of treasury management. Real-time
        liquidity, automated runway analysis, and sovereign-grade security.
      </p>

      <div className="grid grid-cols-2 gap-6">
        <MetricCard label="Assets Verified" value="$4.2B+" />
        <MetricCard label="Encryption" value="128-bit" />
      </div>
    </motion.div>
  )
}

export default BannerText
