import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, ChevronRight, ChevronLeft, Sparkles, CheckCircle2,
  Building2, Users, HeartHandshake, BookMarked, Plus, GraduationCap,
} from 'lucide-react'
import { useOnboarding } from '@/store/useOnboarding'

// ─── Tour step definitions ────────────────────────────────────────────────────

interface TourStep {
  id: string
  target?: string        // [data-tour="..."] selector (if absent → center modal)
  route?: string         // navigate to this route before showing
  title: string
  description: string
  icon: React.ElementType
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
}

const STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Добро пожаловать в CRM Риэлтора!',
    description: 'Давайте быстро познакомимся с основными разделами. Тур займёт около минуты — вы узнаете, где что находится и как добавить первый объект.',
    icon: Sparkles,
  },
  {
    id: 'properties',
    target: 'nav-properties',
    route: '/properties',
    title: 'Объекты недвижимости',
    description: 'Здесь хранятся все ваши объекты: квартиры, дома, участки, коммерческая недвижимость. Фильтрация по типу, статусу, цене и площади.',
    icon: Building2,
    tooltipSide: 'right',
  },
  {
    id: 'clients',
    target: 'nav-clients',
    route: '/clients',
    title: 'Клиенты',
    description: 'База клиентов — покупатели, арендаторы и собственники. Воронка продаж, бюджеты, запросы и история взаимодействия.',
    icon: Users,
    tooltipSide: 'right',
  },
  {
    id: 'deals',
    target: 'nav-deals',
    route: '/deals',
    title: 'Сделки',
    description: 'Управляйте сделками: отслеживайте статус, комиссию, привязанных клиентов и объекты. Вся история одной сделки в одном месте.',
    icon: HeartHandshake,
    tooltipSide: 'right',
  },
  {
    id: 'collections',
    target: 'nav-collections',
    route: '/collections',
    title: 'Подборки для клиентов',
    description: 'Создавайте персональные подборки объектов и делитесь ссылкой с клиентом. Система автоматически предложит подходящие объекты по параметрам.',
    icon: BookMarked,
    tooltipSide: 'right',
  },
  {
    id: 'add-property',
    target: 'add-property',
    route: '/properties',
    title: 'Добавить объект',
    description: 'Нажмите эту кнопку чтобы добавить первый объект. Заполните тип, адрес, цену и площадь — объект сразу появится в базе.',
    icon: Plus,
    tooltipSide: 'bottom',
  },
  {
    id: 'done',
    title: 'Вы готовы к работе!',
    description: 'Теперь вы знаете основы CRM. Начните с добавления объектов и клиентов. Повторить обучение можно в любое время через Настройки.',
    icon: CheckCircle2,
  },
]

// ─── Spotlight helpers ────────────────────────────────────────────────────────

interface Rect { top: number; left: number; width: number; height: number }

function getTargetRect(target: string): Rect | null {
  // Find visible element (sidebar hidden on mobile, bottom nav hidden on desktop)
  const all = document.querySelectorAll(`[data-tour="${target}"]`)
  for (const el of Array.from(all)) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) return r
  }
  return null
}

// ─── Overlay with SVG cutout ─────────────────────────────────────────────────

const PAD = 8

function SpotlightOverlay({ rect }: { rect: Rect }) {
  const r = {
    x: rect.left - PAD,
    y: rect.top - PAD,
    w: rect.width + PAD * 2,
    h: rect.height + PAD * 2,
  }
  return (
    <>
      {/* SVG overlay with hole */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 9998 }}
      >
        <defs>
          <mask id="onboarding-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="10" fill="black" />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(15,23,42,0.72)"
          mask="url(#onboarding-mask)"
        />
      </svg>

      {/* Pulsing ring around target */}
      <div
        className="fixed pointer-events-none"
        style={{
          zIndex: 9999,
          top: r.y,
          left: r.x,
          width: r.w,
          height: r.h,
          borderRadius: 10,
          boxShadow: '0 0 0 3px rgba(99,102,241,0.8), 0 0 0 6px rgba(99,102,241,0.3)',
          animation: 'onboarding-pulse 2s ease-in-out infinite',
        }}
      />
    </>
  )
}

// ─── Tooltip card ─────────────────────────────────────────────────────────────

interface TooltipProps {
  step: TourStep
  stepIndex: number
  totalSteps: number
  rect: Rect | null
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
}

function TooltipCard({ step, stepIndex, totalSteps, rect, onNext, onPrev, onSkip }: TooltipProps) {
  const Icon = step.icon
  const isFirst = stepIndex === 0
  const isLast = stepIndex === totalSteps - 1
  const isCentered = !rect

  // Calculate position relative to spotlight target
  const style: React.CSSProperties = { zIndex: 10000, position: 'fixed', maxWidth: 320 }

  if (rect && !isCentered) {
    const side = step.tooltipSide ?? 'auto'
    const vp = { w: window.innerWidth, h: window.innerHeight }
    const tooltipW = 320
    const tooltipH = 220 // approximate

    if (side === 'right' || (side === 'auto' && rect.left + rect.width + tooltipW + 20 < vp.w)) {
      style.left = rect.left + rect.width + PAD + 12
      style.top = Math.min(
        Math.max(rect.top - 20, 12),
        vp.h - tooltipH - 12
      )
    } else if (side === 'bottom' || rect.top + rect.height + tooltipH + 20 < vp.h) {
      style.top = rect.top + rect.height + PAD + 12
      style.left = Math.min(
        Math.max(rect.left - tooltipW / 2 + rect.width / 2, 12),
        vp.w - tooltipW - 12
      )
    } else {
      style.bottom = vp.h - rect.top + PAD + 12
      style.left = Math.min(
        Math.max(rect.left - tooltipW / 2 + rect.width / 2, 12),
        vp.w - tooltipW - 12
      )
    }
  } else {
    // Centered
    style.top = '50%'
    style.left = '50%'
    style.transform = 'translate(-50%, -50%)'
    style.maxWidth = 400
  }

  return (
    <div
      className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 w-full"
      style={style}
    >
      {/* Progress dots */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === stepIndex ? 'w-5 bg-indigo-600' : i < stepIndex ? 'w-1.5 bg-indigo-200' : 'w-1.5 bg-slate-200'
              }`}
            />
          ))}
        </div>
        <button
          onClick={onSkip}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Закрыть"
        >
          <X size={15} />
        </button>
      </div>

      {/* Icon + Title */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
          <Icon size={20} className="text-indigo-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-base leading-snug">{step.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{stepIndex + 1} / {totalSteps}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 leading-relaxed mb-5">{step.description}</p>

      {/* Buttons */}
      <div className="flex items-center gap-2">
        {!isFirst && (
          <button
            onClick={onPrev}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={15} />
            Назад
          </button>
        )}
        <button
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          {isLast ? (
            <>
              <CheckCircle2 size={15} />
              Начать работу
            </>
          ) : (
            <>
              Далее
              <ChevronRight size={15} />
            </>
          )}
        </button>
      </div>

      {!isFirst && !isLast && (
        <button
          onClick={onSkip}
          className="w-full mt-2 text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
        >
          Пропустить обучение
        </button>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OnboardingTour() {
  const { isActive, currentStep, next, prev, finish, skip } = useOnboarding()
  const navigate = useNavigate()
  const [rect, setRect] = useState<Rect | null>(null)
  const rafRef = useRef<number>(0)

  const step = STEPS[currentStep]

  // Navigate + find target element when step changes
  useEffect(() => {
    if (!isActive || !step) return

    let cancelled = false

    async function prepare() {
      // Navigate if needed
      if (step.route) navigate(step.route)

      // Wait a tick for render, then find element
      await new Promise((r) => setTimeout(r, step.route ? 200 : 50))
      if (cancelled) return

      if (step.target) {
        const r = getTargetRect(step.target)
        setRect(r)
      } else {
        setRect(null)
      }
    }

    prepare()
    return () => { cancelled = true }
  }, [isActive, currentStep, step?.id]) // eslint-disable-line

  // Keep rect updated on scroll/resize
  useEffect(() => {
    if (!isActive || !step?.target) return

    function update() {
      const r = getTargetRect(step.target!)
      setRect(r)
      rafRef.current = requestAnimationFrame(update)
    }
    rafRef.current = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isActive, step?.target])

  if (!isActive || !step) return null

  function handleNext() {
    if (currentStep >= STEPS.length - 1) finish()
    else next()
  }

  function handlePrev() {
    prev()
  }

  return (
    <>
      {/* CSS animation */}
      <style>{`
        @keyframes onboarding-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Dark overlay (only when there's a spotlight) */}
      {rect && <SpotlightOverlay rect={rect} />}

      {/* Full dim when centered (no spotlight target) */}
      {!rect && (
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm"
          style={{ zIndex: 9998 }}
          onClick={skip}
        />
      )}

      {/* Tooltip */}
      <TooltipCard
        step={step}
        stepIndex={currentStep}
        totalSteps={STEPS.length}
        rect={rect}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={skip}
      />
    </>
  )
}

// ─── Restart button (for Sidebar / Settings) ─────────────────────────────────

export function OnboardingRestartButton({ variant = 'sidebar' }: { variant?: 'sidebar' | 'settings' }) {
  const { start } = useOnboarding()

  if (variant === 'settings') {
    return (
      <button
        onClick={start}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
          <GraduationCap size={18} className="text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-indigo-900">Пройти обучение</p>
          <p className="text-xs text-indigo-500">Интерактивный тур по разделам CRM</p>
        </div>
        <ChevronRight size={16} className="text-indigo-400 ml-auto shrink-0" />
      </button>
    )
  }

  return (
    <button
      onClick={start}
      title="Пройти обучение"
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors text-sm w-full"
    >
      <GraduationCap size={16} />
      <span className="text-xs font-medium">Обучение</span>
    </button>
  )
}
