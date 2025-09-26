import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FormFieldProps {
  id: string
  label: string
  type: string
  placeholder: string
  required?: boolean
  error?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function FormField({
  id,
  label,
  type,
  placeholder,
  required = false,
  error,
  value,
  onChange
}: FormFieldProps) {
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
      <Input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
        className={`${error ? 'border-red-500 focus:border-red-500' : 'focus:border-teal-500'}`}
      />
      {error && (
        <p className="text-sm" style={{ color: '#FF0000' }}>
          {error}
        </p>
      )}
    </div>
  )
}