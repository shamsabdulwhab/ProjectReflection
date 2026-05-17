import { useState, type KeyboardEvent } from 'react'

type EditableTitleProps = {
  initialValue?: string
  placeholder?: string
  onChange?: (value: string) => void
  className?: string
}

export default function EditableTitle({
  placeholder = 'Enter session name',
  initialValue = '',
  onChange,
  className,
}: EditableTitleProps) {
  const [value, setValue] = useState(initialValue)
  const [editing, setEditing] = useState(false)

  function finish() {
    const next = value.trim()
    setValue(next)
    setEditing(false)
    onChange?.(next)
  }

  const display = value.trim()

  return editing ? (
    <input
      className={className}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={finish}
      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Escape') finish()
      }}
      placeholder={placeholder}
      autoFocus
    />
  ) : (
    <h1 className={className} onClick={() => setEditing(true)}>
      {display || <span style={{ opacity: 0.45 }}>{placeholder}</span>}
    </h1>
  )
}
