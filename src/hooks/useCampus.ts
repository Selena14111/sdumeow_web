import { useAppStore } from '@/store'

export function useCampus() {
  const campus = useAppStore((state) => state.campus)
  const setCampus = useAppStore((state) => state.setCampus)

  return { campus, setCampus }
}
