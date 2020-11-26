import { useState, useCallback, useEffect, useRef } from 'react'
import { Plugins } from '../register'
import { dequal } from 'dequal'

function sanitize<Settings extends object>(type: string, value: any, settings?: Settings) {
  const { sanitizer } = Plugins[type]
  if (sanitizer) return sanitizer(value, settings)
  return value
}

function format<Settings extends object>(type: string, value: any, settings?: Settings) {
  const { formatter } = Plugins[type]
  if (formatter) return formatter(value, settings)
  return value
}

function validate<Settings extends object>(type: string, value: any, settings?: Settings) {
  const { validator } = Plugins[type]
  if (validator) return validator(value, settings)
  return true
}

type Props<V, Settings> = {
  type: string
  value: V
  settings?: Settings
  set: (v: V) => void
}

export function useTwixUpdate<V, Settings extends object>({ value, type, settings, set }: Props<V, Settings>) {
  // the last correct registered value
  const lastCorrectValue = useRef(value)

  // the value used by the panel vs the value
  const [_value, _setValue] = useState(format(type, value, settings))
  const setFormat = useCallback(v => _setValue(format(type, v, settings)), [type, settings])

  const onUpdate = useCallback(
    (displayValue: any) => {
      // if new value is equivalent to previous value do nothing
      if (!validate(type, displayValue, settings)) {
        setFormat(lastCorrectValue.current)
        return
      }
      const newValue = sanitize(type, displayValue, settings)
      if (dequal(newValue, lastCorrectValue.current)) return

      lastCorrectValue.current = newValue
      setFormat(newValue)
      set(newValue)
    },
    [type, settings, setFormat, set]
  )

  useEffect(() => {
    if (!dequal(value, lastCorrectValue.current)) setFormat(value)
  }, [value, setFormat])

  return { displayedValue: _value, onChange: _setValue, onUpdate }
}
