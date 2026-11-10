import { describe, expect, it } from 'vitest'
import { createTasksStore, demoTasks, STORAGE_KEY } from '@/store/tasks'

class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  get length() {
    return this.data.size
  }
  clear() {
    this.data.clear()
  }
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
}

describe('tasks store', () => {
  it('starts with demo tasks and persists changes', () => {
    const storage = new MemoryStorage()
    const store = createTasksStore(() => storage)
    expect(store.getState().tasks).toEqual(demoTasks())
    const task = store
      .getState()
      .addTask({ subjectId: 'X2', countermeasureId: 'CM-QUEUE', responsible: 'joint' })
    store.getState().updateTask(task.id, { status: 'in_progress', note: 'Notatka' })

    const reloaded = createTasksStore(() => storage)
    const restored = reloaded.getState().tasks.find((t) => t.id === task.id)!
    expect(restored.status).toBe('in_progress')
    expect(restored.note).toBe('Notatka')
    expect(reloaded.getState().recoveredFromInvalidStorage).toBe(false)
  })

  it('adding the same measure twice returns the existing task', () => {
    const store = createTasksStore(() => new MemoryStorage())
    const a = store.getState().addTask({ subjectId: 'X1', countermeasureId: 'CM-MEDIAN', responsible: 'PLK' })
    expect(a.id).toBe('T-X1-CM-MEDIAN')
    expect(store.getState().tasks).toHaveLength(demoTasks().length)
  })

  it.each([
    ['not JSON', '{oops'],
    ['wrong shape', JSON.stringify({ state: { tasks: [{ id: 1 }] }, version: 1 })],
    ['wrong version', JSON.stringify({ state: { tasks: [] }, version: 99 })],
    ['null state', JSON.stringify(null)],
  ])('corrupted storage (%s) falls back to demo data', (_label, raw) => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEY, raw)
    const store = createTasksStore(() => storage)
    expect(store.getState().tasks).toEqual(demoTasks())
    expect(store.getState().recoveredFromInvalidStorage).toBe(true)
  })

  it('works without storage and supports reset/remove', () => {
    const store = createTasksStore(() => undefined)
    store.getState().removeTask('T-X1-CM-MEDIAN')
    expect(store.getState().tasks.some((t) => t.id === 'T-X1-CM-MEDIAN')).toBe(false)
    store.getState().resetToDemo()
    expect(store.getState().tasks).toEqual(demoTasks())
  })

  it('survives a storage that throws on write', () => {
    const storage = new MemoryStorage()
    storage.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    const store = createTasksStore(() => storage)
    expect(() => store.getState().resetToDemo()).not.toThrow()
  })
})
