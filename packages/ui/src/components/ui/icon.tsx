import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react"

import { cn } from "@flux-finance/ui/lib/utils"

/**
 * Wrapper padrão para ícones Hugeicons do app: engrossa o traço em relação
 * ao 1.5 default da biblioteca para ganhar presença em telas de estado
 * (empty/erro) e navegação, sem precisar tocar nos componentes gerados
 * pelo shadcn em `components/ui/*`.
 */
function Icon({ className, strokeWidth = 2, ...props }: HugeiconsIconProps) {
  return (
    <HugeiconsIcon
      strokeWidth={strokeWidth}
      className={cn("shrink-0", className)}
      {...props}
    />
  )
}

export { Icon }
