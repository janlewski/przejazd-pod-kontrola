import { create } from 'zustand'
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware'
import { TasksState } from '@/domain/schemas'
import type { ResponsibleParty, Task, TaskStatus } from '@/domain/types'

export const STORAGE_KEY = 'przejazd-pod-kontrola:tasks'
const VERSION = 1

/** Demonstration tasks for fictional cases (DANE FIKCYJNE). */
export function demoTasks(): Task[] {
  const at = '2026-11-01T09:00:00.000Z'
  return [
    {
      id: 'T-X1-CM-MEDIAN',
      subjectId: 'X1',
      countermeasureId: 'CM-MEDIAN',
      status: 'implemented',
      responsible: 'road_authority',
      note: 'Separatory zamontowane 15.06.2026. Ocena po 4 miesiącach.',
      updatedAt: at,
    },
    {
      id: 'T-X6-CM-REDLIGHT',
      subjectId: 'X6',
      countermeasureId: 'CM-REDLIGHT',
      status: 'implemented',
      responsible: 'joint',
      note: 'System uruchomiony 1.04.2026. Zmiana metody liczenia naruszeń.',
      updatedAt: at,
    },
    {
      id: 'T-X3-CM-VEG',
      subjectId: 'X3',
      countermeasureId: 'CM-VEG',
      status: 'in_progress',
      responsible: 'joint',
      note: 'Uzgodnienie wycinki z właścicielem działki.',
      updatedAt: at,
    },
    {
      id: 'T-X8-CM-QUEUE',
      subjectId: 'X8',
      countermeasureId: 'CM-QUEUE',
      status: 'planned',
      responsible: 'joint',
      note: 'Analiza koordynacji z sygnalizacją na rondzie.',
      updatedAt: at,
    },
  ]
}

type TasksStore = {
  tasks: Task[]
  /** Set when stored data was unreadable or invalid and demo data was restored. */
  recoveredFromInvalidStorage: boolean
  addTask: (input: { subjectId: string; countermeasureId: string; responsible: ResponsibleParty }) => Task
  updateTask: (id: string, patch: Partial<Pick<Task, 'status' | 'responsible' | 'note'>>) => void
  removeTask: (id: string) => void
  resetToDemo: () => void
}

type Persisted = { tasks: Task[] }

/**
 * localStorage wrapper that validates with Zod on read. Unparseable or invalid data
 * never reaches the UI: it is reported and replaced by demo data.
 */
export function createValidatedStorage(
  getStorage: () => Storage | undefined,
  onInvalid: () => void,
): PersistStorage<Persisted> {
  return {
    getItem: (name) => {
      const storage = getStorage()
      const raw = storage?.getItem(name)
      if (raw == null) return null
      try {
        const parsed = JSON.parse(raw) as StorageValue<unknown>
        const state = TasksState.safeParse(parsed?.state)
        if (!state.success || parsed.version !== VERSION) throw new Error('invalid')
        return { state: state.data, version: parsed.version }
      } catch {
        storage?.removeItem(name)
        onInvalid()
        return null
      }
    },
    setItem: (name, value) => {
      try {
        getStorage()?.setItem(name, JSON.stringify(value))
      } catch {
        // Storage full or unavailable: keep working in memory.
      }
    },
    removeItem: (name) => getStorage()?.removeItem(name),
  }
}

function browserStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}

export function createTasksStore(getStorage: () => Storage | undefined = browserStorage) {
  let invalid = false
  const store = create<TasksStore>()(
    persist(
      (set, get) => ({
        tasks: demoTasks(),
        recoveredFromInvalidStorage: false,
        addTask: ({ subjectId, countermeasureId, responsible }) => {
          const existing = get().tasks.find(
            (t) => t.subjectId === subjectId && t.countermeasureId === countermeasureId,
          )
          if (existing) return existing
          const task: Task = {
            id: `T-${subjectId}-${countermeasureId}`,
            subjectId,
            countermeasureId,
            status: 'planned',
            responsible,
            note: '',
            updatedAt: new Date().toISOString(),
          }
          set((s) => ({ tasks: [...s.tasks, task] }))
          return task
        },
        updateTask: (id, patch) =>
          set((s) => ({
            tasks: s.tasks.map((t) =>
              t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
            ),
          })),
        removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
        resetToDemo: () => set({ tasks: demoTasks(), recoveredFromInvalidStorage: false }),
      }),
      {
        name: STORAGE_KEY,
        version: VERSION,
        storage: createValidatedStorage(getStorage, () => {
          invalid = true
        }),
        partialize: (s) => ({ tasks: s.tasks }),
      },
    ),
  )
  // Synchronous storage hydrates during create(), so the flag is final here.
  if (invalid) store.setState({ recoveredFromInvalidStorage: true })
  return store
}

export const useTasks = createTasksStore()

export const TASK_STATUSES: TaskStatus[] = ['planned', 'in_progress', 'implemented', 'verified']
