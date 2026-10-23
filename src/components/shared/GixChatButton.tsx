import { motion } from 'framer-motion'
import { MouseIcon } from 'lucide-react'

export function GixChatButton() {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-white shadow-lg hover:shadow-xl transition-transform"
    >
      <MouseIcon className="h-5 w-5" />
      Ask Gix
    </motion.button>
  )
}