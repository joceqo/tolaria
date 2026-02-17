import { useState } from 'react'

export function EditableValue({
  value,
  onSave,
  onCancel,
  isEditing,
  onStartEdit
}: {
  value: string
  onSave: (newValue: string) => void
  onCancel: () => void
  isEditing: boolean
  onStartEdit: () => void
}) {
  const [editValue, setEditValue] = useState(value)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(editValue)
    } else if (e.key === 'Escape') {
      setEditValue(value)
      onCancel()
    }
  }

  if (isEditing) {
    return (
      <input
        className="w-full rounded border border-ring bg-muted px-2 py-1 text-[13px] text-foreground outline-none focus:border-primary"
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onSave(editValue)}
        autoFocus
      />
    )
  }

  return (
    <span
      className="cursor-pointer rounded px-1 py-0.5 text-right text-secondary-foreground transition-colors hover:bg-muted"
      onClick={onStartEdit}
      title="Click to edit"
    >
      {value || '\u2014'}
    </span>
  )
}

export function EditableList({
  items,
  onSave,
  label,
}: {
  items: string[]
  onSave: (newItems: string[]) => void
  label: string
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newValue, setNewValue] = useState('')

  const handleStartEdit = (index: number) => {
    setEditingIndex(index)
    setEditValue(items[index])
  }

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      const newItems = [...items]
      if (editValue.trim()) {
        newItems[editingIndex] = editValue.trim()
      } else {
        newItems.splice(editingIndex, 1)
      }
      onSave(newItems)
      setEditingIndex(null)
    }
  }

  const handleDeleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    onSave(newItems)
  }

  const handleAddNew = () => {
    if (newValue.trim()) {
      onSave([...items, newValue.trim()])
      setNewValue('')
      setIsAddingNew(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, action: 'edit' | 'add') => {
    if (e.key === 'Enter') {
      if (action === 'edit') handleSaveEdit()
      else handleAddNew()
    } else if (e.key === 'Escape') {
      if (action === 'edit') {
        setEditingIndex(null)
        setEditValue('')
      } else {
        setIsAddingNew(false)
        setNewValue('')
      }
    }
  }

  return (
    <div className="flex w-full flex-col gap-1">
      {items.map((item, idx) => (
        <div key={idx} className="group/item flex items-center gap-1">
          {editingIndex === idx ? (
            <input
              className="w-full rounded border border-ring bg-muted px-2 py-1 text-[13px] text-foreground outline-none focus:border-primary"
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'edit')}
              onBlur={handleSaveEdit}
              autoFocus
            />
          ) : (
            <>
              <span
                className="flex-1 cursor-pointer truncate rounded px-1 py-0.5 text-[13px] text-secondary-foreground transition-colors hover:bg-muted"
                onClick={() => handleStartEdit(idx)}
                title="Click to edit"
              >
                {item}
              </span>
              <button
                className="border-none bg-transparent p-0 px-1 text-sm leading-none text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover/item:opacity-100"
                onClick={() => handleDeleteItem(idx)}
                title="Remove item"
              >
                &times;
              </button>
            </>
          )}
        </div>
      ))}
      {isAddingNew ? (
        <input
          className="w-full rounded border border-ring bg-muted px-2 py-1 text-[13px] text-foreground outline-none focus:border-primary"
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'add')}
          onBlur={handleAddNew}
          placeholder={`New ${label.toLowerCase()}...`}
          autoFocus
        />
      ) : (
        <button
          className="border-none bg-transparent p-0 py-1 text-left text-xs text-muted-foreground hover:text-secondary-foreground"
          onClick={() => setIsAddingNew(true)}
        >
          + Add item
        </button>
      )}
    </div>
  )
}
