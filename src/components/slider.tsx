type SliderProps = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

export default function Slider({ value, onChange, min = 0, max = 100 }: SliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ width: '100%' }}
    />
  )
}
