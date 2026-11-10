import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { z } from 'zod'
import { SourceRef } from '../../src/domain/schemas.ts'

export const ROOT = path.resolve(import.meta.dirname, '../..')
export const SOURCES_PATH = path.join(ROOT, 'src/data/sources.json')

const SourcesFile = z.array(SourceRef)

export function upsertSource(entry: z.infer<typeof SourceRef>): void {
  const parsed = SourceRef.parse(entry)
  const current = fs.existsSync(SOURCES_PATH)
    ? SourcesFile.parse(JSON.parse(fs.readFileSync(SOURCES_PATH, 'utf8')))
    : []
  const next = current.filter((s) => s.id !== parsed.id)
  next.push(parsed)
  next.sort((a, b) => a.id.localeCompare(b.id))
  writeJson(SOURCES_PATH, next)
}

export function writeJson(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function argValue(name: string): string | undefined {
  const prefix = `--${name}=`
  return process.argv.find((a) => a.startsWith(prefix))?.slice(prefix.length)
}

export function isMain(moduleUrl: string): boolean {
  return process.argv[1] !== undefined && moduleUrl === pathToFileURL(process.argv[1]).href
}
