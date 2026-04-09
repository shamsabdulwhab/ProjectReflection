import { useState, type KeyboardEvent } from 'react'

type EditableTitleProps = {
  initialValue?: string
  placeholder?: string
  onChange?: (value: string) => void
  className?: string
}

export default function EditableTitle({
  initialValue = 'Group Name',
  placeholder = 'Enter group name',
  onChange,
  className,
}: EditableTitleProps) {
  const [value, setValue] = useState(initialValue)
  const [editing, setEditing] = useState(false)

  function finish() {
    const next = value.trim() || initialValue
    setValue(next)
    setEditing(false)
    onChange?.(next)
  }

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
      {value}
    </h1>
  )
}

