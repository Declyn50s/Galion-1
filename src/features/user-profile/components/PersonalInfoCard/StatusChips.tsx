import React from 'react'

interface Props {
  statuses: { value: string; label: string; icon?: string; percentage?: number }[]
}

const StatusChips: React.FC<Props> = ({ statuses }) => {
  if (!statuses?.length) return null

  return (
    <div className="mt-4 flex flex-wrap gap-2 justify-center">
      {statuses.map((s) => (
        <div
          key={s.value}
          className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-md text-sm"
        >
          {s.icon && <span className="text-xs">{s.icon}</span>}
          <span>{s.label}</span>
          {typeof s.percentage === 'number' && (
            <span className="font-medium">({s.percentage}%)</span>
          )}
        </div>
      ))}
    </div>
  )
}

export default StatusChips