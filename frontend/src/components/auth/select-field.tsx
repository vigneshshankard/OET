import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface SelectFieldProps {
  id: string
  label: string
  placeholder: string
  required?: boolean
  error?: string
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
}

export default function SelectField({
  id,
  label,
  placeholder,
  required = false,
  error,
  value,
  onValueChange,
  options
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label 
        htmlFor={id} 
        className="text-sm font-medium"
        style={{ color: '#36454F' }}
      >
        {label}
        {required && <span style={{ color: '#FF0000' }}>*</span>}
      </Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={`${error ? 'border-red-500 focus:border-red-500' : 'focus:border-teal-500'}`}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm" style={{ color: '#FF0000' }}>
          {error}
        </p>
      )}
    </div>
  )
}