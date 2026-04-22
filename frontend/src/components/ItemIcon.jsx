import { useState } from 'react'
import { itemIconUrl } from '../lib/dataDragon.js'

export default function ItemIcon({ itemId, itemName, note, size = 40, orderIndex }) {
  const [err, setErr] = useState(false)

  return (
    <div className="relative group flex flex-col items-center">
      {orderIndex !== undefined && (
        <span className="absolute -top-1.5 -left-1.5 bg-gold text-navy text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center z-10 leading-none">
          {orderIndex + 1}
        </span>
      )}
      <div
        className="rounded border border-gold-dark/40 overflow-hidden bg-panel"
        style={{ width: size, height: size }}
      >
        {!err && itemId ? (
          <img
            src={itemIconUrl(itemId)}
            alt={itemName}
            width={size}
            height={size}
            className="object-cover"
            onError={() => setErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cream/30 text-xs text-center px-0.5">
            {itemName?.slice(0, 3) || '?'}
          </div>
        )}
      </div>
      {/* Tooltip */}
      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-50 hidden group-hover:block pointer-events-none">
        <div className="bg-navy-light border border-gold-dark rounded px-2 py-1 text-xs whitespace-nowrap max-w-[180px]">
          <div className="text-gold font-semibold">{itemName}</div>
          {note && <div className="text-cream/70 mt-0.5 whitespace-normal">{note}</div>}
        </div>
      </div>
    </div>
  )
}
