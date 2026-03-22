import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingState {
  isActive: boolean
  currentStep: number
  hasCompleted: boolean
  start: () => void
  next: () => void
  prev: () => void
  goTo: (step: number) => void
  finish: () => void
  skip: () => void
}

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      isActive: false,
      currentStep: 0,
      hasCompleted: false,

      start: () => set({ isActive: true, currentStep: 0 }),
      next: () => set((s) => ({ currentStep: s.currentStep + 1 })),
      prev: () => set((s) => ({ currentStep: Math.max(0, s.currentStep - 1) })),
      goTo: (step) => set({ currentStep: step }),
      finish: () => set({ isActive: false, currentStep: 0, hasCompleted: true }),
      skip: () => set({ isActive: false, currentStep: 0, hasCompleted: true }),
    }),
    { name: 'crm_onboarding' }
  )
)
