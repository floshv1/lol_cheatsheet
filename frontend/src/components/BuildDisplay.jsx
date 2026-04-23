import { useState, useRef } from 'react'
import ItemIcon from './ItemIcon.jsx'
import ItemAutocomplete from './ItemAutocomplete.jsx'
import { getItemData } from '../lib/dataDragon.js'

const SLOTS = ['starter', 'core', 'situational', 'boots']
const SLOT_LABELS = { starter: 'Starter', core: 'Core', situational: 'Situational', boots: 'Boots' }
const STARTER_BUDGET = 500

function slotGold(items) {
  const data = getItemData()
  if (!data) return null
  return items.reduce((sum, i) => sum + (data[i.item_id]?.gold?.total || 0), 0)
}

export default function BuildDisplay({ items, buildId, onAdd, onDelete, onReorder, editable = false }) {
  const [adding, setAdding] = useState(null)
  const [note, setNote]     = useState('')
  const [saving, setSaving] = useState(false)
  const [dragOver, setDragOver] = useState(null) // {slot, idx}
  const dragSrc = useRef(null) // {slot, idx}

  const bySlot = slot => items.filter(i => i.slot === slot).sort((a, b) => a.order_index - b.order_index)

  async function handleAdd(slot, item) {
    if (saving) return
    const savedNote = note // capture before reset
    setSaving(true)
    setAdding(null)
    setNote('')
    try {
      await onAdd({ item_name: item.name, item_id: item.id, slot, order_index: bySlot(slot).length, note: savedNote })
    } catch (err) {
      console.error('Failed to add item:', err)
    } finally {
      setSaving(false)
    }
  }

  // In read-only mode, skip slots that have no items
  const visibleSlots = editable ? SLOTS : SLOTS.filter(s => bySlot(s).length > 0)

  if (!editable && visibleSlots.length === 0) {
    return <div className="text-cream/30 text-sm">No items yet.</div>
  }

  return (
    <div className="flex flex-col gap-4">
      {visibleSlots.map(slot => {
        const slotItems = bySlot(slot)
        return (
          <div key={slot}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-cream/50 uppercase tracking-wide">{SLOT_LABELS[slot]}</span>
              {slot === 'starter' && slotItems.length > 0 && (() => {
                const gold = slotGold(slotItems)
                if (gold === null) return null
                const over = gold > STARTER_BUDGET
                return (
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${over ? 'bg-danger/20 text-danger' : 'bg-gold/10 text-gold/70'}`}>
                    {gold}g{over ? ` (+${gold - STARTER_BUDGET})` : ` / ${STARTER_BUDGET}g`}
                  </span>
                )
              })()}
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              {slotItems.map((item, idx) => {
                const isOver = dragOver?.slot === slot && dragOver?.idx === idx
                return (
                  <div
                    key={item.id}
                    className={`relative group/item transition-transform ${editable ? 'cursor-grab active:cursor-grabbing' : ''} ${isOver ? 'scale-110 ring-2 ring-gold rounded' : ''}`}
                    draggable={editable && !!onReorder}
                    onDragStart={e => { dragSrc.current = { slot, idx }; e.dataTransfer.effectAllowed = 'move' }}
                    onDragOver={e => { e.preventDefault(); setDragOver({ slot, idx }) }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={() => {
                      setDragOver(null)
                      if (!dragSrc.current) return
                      const { slot: fromSlot, idx: fromIdx } = dragSrc.current
                      dragSrc.current = null
                      if (fromSlot !== slot || fromIdx === idx) return
                      const reordered = [...slotItems]
                      const [moved] = reordered.splice(fromIdx, 1)
                      reordered.splice(idx, 0, moved)
                      onReorder(reordered.map((it, i) => ({ id: it.id, order_index: i })))
                    }}
                    onDragEnd={() => { dragSrc.current = null; setDragOver(null) }}
                  >
                    <ItemIcon
                      itemId={item.item_id}
                      itemName={item.item_name}
                      note={item.note}
                      size={56}
                      orderIndex={idx}
                    />
                    {editable && (
                      <button
                        onClick={() => onDelete(item.id)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-white text-[10px] hidden group-hover/item:flex items-center justify-center z-20"
                      >×</button>
                    )}
                  </div>
                )
              })}

              {editable && adding === slot ? (
                <div className="flex flex-col gap-1">
                  <ItemAutocomplete onSelect={item => handleAdd(slot, item)} />
                  <input
                    className="bg-panel border border-gold-dark/30 rounded px-2 py-1 text-xs text-cream w-40"
                    placeholder="Note (optional)"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                  />
                  <button onClick={() => { setAdding(null); setNote('') }} className="text-xs text-cream/40 hover:text-cream">cancel</button>
                </div>
              ) : editable ? (
                <button
                  onClick={() => setAdding(slot)}
                  disabled={saving}
                  className="w-14 h-14 border border-dashed border-gold-dark/40 rounded flex items-center justify-center text-cream/30 hover:text-gold hover:border-gold transition-colors text-xl disabled:opacity-40"
                >+</button>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
