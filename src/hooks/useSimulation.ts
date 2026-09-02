import { useSyncExternalStore, useRef, useCallback } from 'react';
import { simulation } from '@/engine/simulationEngine';

export function useSimulation() {
  const subscribe   = useCallback((cb: () => void) => simulation.subscribe(cb), []);
  const getSnapshot = useCallback(() => simulation, []);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useClock() {
  const subscribe = useCallback((cb: () => void) => {
    const id = setInterval(cb, 1000);
    return () => clearInterval(id);
  }, []);
  const getSnapshot = useCallback(() => Math.floor(Date.now() / 1000), []);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function usePreviousValue<T>(value: T): T | undefined {
  const ref  = useRef<T>();
  const prev = ref.current;
  ref.current = value;
  return prev;
}
