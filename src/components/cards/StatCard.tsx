type StatCardProps = {
  label: string
  value: string | number
  accent?: string
}

export function StatCard({ label, value, accent = 'text-slate-900' }: StatCardProps) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  )
}
