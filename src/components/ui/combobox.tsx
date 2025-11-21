import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  loading?: boolean
  onSearch?: (searchTerm: string) => void
  searchTerm?: string
}

/**
 * Componente Combobox reutilizável com funcionalidade de autocomplete
 * Baseado no Command component do shadcn/ui
 */
export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Selecione uma opção...",
  searchPlaceholder = "Pesquisar...",
  emptyText = "Nenhuma opção encontrada.",
  disabled = false,
  className,
  loading = false,
  onSearch,
  searchTerm,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState(searchTerm || "")

  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled || loading}
        >
          {loading ? (
            "Carregando..."
          ) : selectedOption ? (
            selectedOption.label
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={(value) => {
              setSearchValue(value);
              if (onSearch) {
                onSearch(value);
              }
            }}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {(onSearch ? options : options.filter((option) =>
                option.label.toLowerCase().includes(searchValue.toLowerCase())
              )).map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  onSelect={(currentValue) => {
                    if (currentValue === value) {
                      onValueChange("")
                    } else {
                      onValueChange(currentValue)
                    }
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Hook para transformar arrays de objetos em opções do Combobox
 */
export function useComboboxOptions<T extends Record<string, any>>(
  items: T[],
  valueKey: keyof T,
  labelKey: keyof T,
  disabledKey?: keyof T
): ComboboxOption[] {
  return React.useMemo(() => {
    return items.map((item) => ({
      value: String(item[valueKey]),
      label: String(item[labelKey]),
      disabled: disabledKey ? Boolean(item[disabledKey]) : false,
    }))
  }, [items, valueKey, labelKey, disabledKey])
}