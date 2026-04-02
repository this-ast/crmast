import { type ReactNode, useState, useRef } from 'react'
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
  const [dragY, setDragY]         = useState(0)
  const [startY, setStartY]       = useState(0)
  const [dragging, setDragging]   = useState(false)
  const [fromHandle, setFromHandle] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  function onHandleTouchStart(e: React.TouchEvent) {
    setStartY(e.touches[0].clientY)
    setDragging(true)
    setFromHandle(true)
  }

  function onPanelTouchStart(e: React.TouchEvent) {
    if (fromHandle) return
    // Never drag when touching interactive elements — prevents accidental close
    // while filling forms (especially on iOS where keyboard raises viewport)
    const target = e.target as Element
    if (target.closest('input, textarea, select, button, a, label, [role="button"], [role="combobox"], [role="listbox"], [role="option"]')) return
    if (scrollRef.current && scrollRef.current.scrollTop > 4) return
    setStartY(e.touches[0].clientY)
    setDragging(true)
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging) return
    const dy = e.touches[0].clientY - startY
    if (dy > 0) setDragY(dy * 0.55)
  }

  function onTouchEnd() {
    setDragging(false)
    setFromHandle(false)
    if (dragY > 150) {
      onClose()
    }
    setDragY(0)
  }

  const progress   = Math.min(dragY / 300, 1)
  const panelStyle = {
    transform:  `translateY(${dragY}px)`,
    opacity:    1 - progress * 0.35,
    transition: dragging ? 'none' : 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
  }
  const backdropOpacity = Math.max(0, 1 - progress * 0.75)

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50" transition>
      {/* Backdrop */}
      <TransitionChild
        enter="transition duration-[280ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition duration-[220ms] ease-[cubic-bezier(0.4,0,1,1)]"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          style={{ opacity: backdropOpacity }}
          aria-hidden="true"
        />
      </TransitionChild>

      {/* Modal container — sheet on mobile, centered on desktop */}
      <div className="fixed inset-0 flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 overflow-y-auto">
        <TransitionChild
          enter="transition duration-[380ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-[0.93]"
          enterTo="opacity-100 translate-y-0 sm:scale-100"
          leave="transition duration-[220ms] ease-[cubic-bezier(0.4,0,1,1)]"
          leaveFrom="opacity-100 translate-y-0 sm:scale-100"
          leaveTo="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-[0.96]"
        >
          <div
            className="w-full contents sm:block"
            style={panelStyle}
            onTouchStart={onPanelTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <DialogPanel
              className={`w-full ${sizeClasses[size]} bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92dvh] flex flex-col`}
            >
              {/* Drag handle — mobile only */}
              <div
                className="flex justify-center pt-3 pb-1 sm:hidden cursor-grab active:cursor-grabbing touch-none"
                onTouchStart={onHandleTouchStart}
              >
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
              <div ref={scrollRef} className="flex-1 overflow-y-auto">
                {children}
              </div>
            </DialogPanel>
          </div>
        </TransitionChild>
      </div>
    </Dialog>
  )
}
