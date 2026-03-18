import { type ReactNode } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
}

export default function Modal({ isOpen, onClose, title, children, size = 'lg' }: ModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal container */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            className={`w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-2xl`}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <DialogTitle className="text-base font-semibold text-slate-900">
                  {title}
                </DialogTitle>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            {children}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
