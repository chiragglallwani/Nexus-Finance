'use client'

import { motion } from 'motion/react'

const MetricCard = ({ label, value }: { label: string; value: string }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-surface-container-low border-outline-variant/10 group cursor-default rounded-xl border p-6"
  >
    <div className="text-primary mb-1 origin-left text-2xl font-bold transition-transform group-hover:scale-105">
      {value}
    </div>
    <div className="text-on-surface-variant text-[10px] font-medium tracking-[0.2em] uppercase">
      {label}
    </div>
  </motion.div>
)

export default MetricCard
