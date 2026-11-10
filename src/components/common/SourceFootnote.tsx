import { sourceById } from '@/data'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

export function SourceFootnote({ sourceId, className }: { sourceId: string; className?: string }) {
  const source = sourceById(sourceId)
  if (!source)
    return <span className={cn('text-xs text-muted-foreground', className)}>Źródło: {sourceId}</span>
  return (
    <span className={cn('text-xs text-muted-foreground', className)}>
      Źródło:{' '}
      <a href={source.url} target="_blank" rel="noreferrer" className="underline">
        {source.shortTitle ?? source.publisher}
      </a>
      {source.kind === 'dataset' ? `, stan na ${formatDate(source.retrievedAt)}` : ''}
    </span>
  )
}

export function SourceLink({ url }: { url: string }) {
  let host = url
  try {
    host = new URL(url).hostname.replace(/^www\./, '')
  } catch {
    // keep raw value
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="break-all underline">
      {host}
    </a>
  )
}
