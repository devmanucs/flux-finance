"use client"

import * as React from "react"

import { cn } from "@flux-finance/ui/lib/utils"
import { Button } from "@flux-finance/ui/components/ui/button"
import { Input } from "@flux-finance/ui/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@flux-finance/ui/components/ui/popover"

const COLOR_PRESETS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#94a3b8",
  "#0f172a",
] as const

function ColorPicker({
  id,
  value,
  onChange,
  className,
  "aria-invalid": ariaInvalid,
}: {
  id?: string
  value?: string | null
  onChange: (value: string) => void
  className?: string
  "aria-invalid"?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const current = value && value.length > 0 ? value : "#94a3b8"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        render={
          <Button
            type="button"
            variant="outline"
            className={cn("w-full justify-start font-normal", className)}
            aria-invalid={ariaInvalid}
          />
        }
      >
        <span
          className="size-4 shrink-0 rounded-full border border-border"
          style={{ backgroundColor: current }}
          aria-hidden
        />
        <span className="font-mono uppercase">{current}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-5 gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-label={`Selecionar ${preset}`}
                className={cn(
                  "size-8 rounded-full border border-border transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  current.toLowerCase() === preset.toLowerCase() && "ring-2 ring-ring"
                )}
                style={{ backgroundColor: preset }}
                onClick={() => {
                  onChange(preset)
                  setOpen(false)
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={current}
              onChange={(event) => onChange(event.target.value)}
              className="h-9 w-12 cursor-pointer p-1"
              aria-label="Seletor de cor"
            />
            <Input
              value={current}
              onChange={(event) => onChange(event.target.value)}
              className="font-mono uppercase"
              placeholder="#000000"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { ColorPicker, COLOR_PRESETS }
