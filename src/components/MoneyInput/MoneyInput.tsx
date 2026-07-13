import { forwardRef, type ChangeEvent } from 'react'
import { Input, type InputProps } from '../Input'
import { formatMoneyInputValue } from '../../lib/moneyInput'

export interface MoneyInputProps extends Omit<InputProps, 'type' | 'onChange' | 'inputMode'> {
  value: string
  onValueChange: (value: string) => void
  allowDecimals?: boolean
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onValueChange, allowDecimals = false, ...props }, ref) => {
    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      onValueChange(formatMoneyInputValue(event.target.value, allowDecimals))
    }

    return (
      <Input
        ref={ref}
        type="text"
        inputMode={allowDecimals ? 'decimal' : 'numeric'}
        autoComplete="off"
        value={value}
        onChange={handleChange}
        {...props}
      />
    )
  },
)

MoneyInput.displayName = 'MoneyInput'
