import { type ReactNode } from 'react'
import {
  Dialog, DialogPanel, DialogTitle,
  TransitionChild,
} from '@headlessui/react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const sizeClasses = {
  sm:    'sm:max-w-sm',
  md:    'sm:max-w-md',
  lg:    'sm:max-w-lg',
  xl:    'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
}

export default function Modal({ isOpen, onClose, title, children, size = 'lg' }: ModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50" transition>
      {/* Backdrop */}
      <TransitionChild
        enter="transition-opacity duration-200 ease-out"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-150 ease-in"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      </TransitionChild>

      {/* Modal container — sheet on mobile, centered on desktop */}
      <div className="fixed inset-0 flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 overflow-y-auto">
        <TransitionChild
          enter="transition duration-250 ease-out"
          enterFrom="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
          enterTo="opacity-100 translate-y-0 sm:scale-100"
          leave="transition duration-150 ease-in"
          leaveFrom="opacity-100 translate-y-0 sm:scale-100"
          leaveTo="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
        >
          <DialogPanel
            className={`w-full ${sizeClasses[size]} bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92dvh] flex flex-col`}
          >
            {/* Drag handle — mobile only */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>

            {title && (
              <div className="flex items-center justify-between px-5 py-3 sm:px-6 sm:py-4 border-b border-slate-100 shrink-0">
                <DialogTitle className="text-base font-semibold text-slate-900">
                  {title}
                </DialogTitle>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  )
}
