type JsonPreviewProps = {
  value: unknown
}

export function JsonPreview({ value }: JsonPreviewProps) {
  return (
    <pre className="max-h-60 overflow-auto rounded-2xl bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}
