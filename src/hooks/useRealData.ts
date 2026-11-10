import { useEffect, useState } from 'react'
import { loadRealData, type RealData } from '@/data'

type State =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: RealData; error: null }
  | { status: 'error'; data: null; error: Error }

export function useRealData(): State {
  const [state, setState] = useState<State>({ status: 'loading', data: null, error: null })
  useEffect(() => {
    let active = true
    loadRealData().then(
      (data) => active && setState({ status: 'ready', data, error: null }),
      (error: unknown) =>
        active &&
        setState({
          status: 'error',
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
        }),
    )
    return () => {
      active = false
    }
  }, [])
  return state
}
