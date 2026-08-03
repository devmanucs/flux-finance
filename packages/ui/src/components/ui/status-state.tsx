import {
  Alert02Icon,
  ArrowReloadHorizontalIcon,
  InboxIcon,
  SearchRemoveIcon,
  SquareLock02Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"

import { cn } from "@flux-finance/ui/lib/utils"
import { Button } from "@flux-finance/ui/components/ui/button"
import { Icon } from "@flux-finance/ui/components/ui/icon"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@flux-finance/ui/components/ui/empty"

type Tone = "neutral" | "destructive" | "warning"

const TONE_MEDIA_CLASS: Record<Tone, string> = {
  neutral: "bg-muted text-foreground",
  destructive: "bg-destructive/10 text-destructive",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
}

interface StatusStateProps extends React.ComponentProps<"div"> {
  icon: IconSvgElement
  tone?: Tone
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
}

/**
 * Base compartilhada por EmptyState/ErrorState/NotFoundState/UnauthorizedState.
 * Reaproveita os primitivos de `empty.tsx` (já usados pelo design system) em
 * vez de criar uma variante nova de "cartão vazio" pra cada caso.
 */
function StatusState({
  icon,
  tone = "neutral",
  title,
  description,
  action,
  className,
  ...props
}: StatusStateProps) {
  return (
    <Empty className={className} {...props}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className={TONE_MEDIA_CLASS[tone]}>
          <Icon icon={icon} />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}

interface EmptyStateProps extends Partial<Pick<StatusStateProps, "icon">> {
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

/** Estado "sem dados ainda" — deve ensinar a interface, não só avisar que está vazio. */
function EmptyState({ icon = InboxIcon, ...props }: EmptyStateProps) {
  return <StatusState icon={icon} tone="neutral" {...props} />
}

interface ErrorStateProps {
  icon?: IconSvgElement
  title?: string
  description?: React.ReactNode
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

/** Falha ao carregar dados (rede, 500, etc.) — sempre com saída de retry. */
function ErrorState({
  icon = Alert02Icon,
  title = "Não foi possível carregar",
  description = "Algo deu errado ao buscar esses dados. Tente novamente em instantes.",
  onRetry,
  retryLabel = "Tentar novamente",
  className,
}: ErrorStateProps) {
  return (
    <StatusState
      icon={icon}
      tone="destructive"
      title={title}
      description={description}
      className={cn("border-none p-8", className)}
      action={
        onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <Icon icon={ArrowReloadHorizontalIcon} />
            {retryLabel}
          </Button>
        )
      }
    />
  )
}

interface NotFoundStateProps {
  title?: string
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

/** 404 — recurso ou rota que não existe (ou foi excluída). */
function NotFoundState({
  title = "Não encontramos essa página",
  description = "O endereço pode estar errado, ou o que você procurava foi removido.",
  action,
  className,
}: NotFoundStateProps) {
  return (
    <StatusState
      icon={SearchRemoveIcon}
      tone="neutral"
      title={title}
      description={description}
      action={action}
      className={cn("border-none p-8", className)}
    />
  )
}

interface UnauthorizedStateProps {
  title?: string
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

/** 401/403 — sessão expirada ou sem permissão para ver este recurso. */
function UnauthorizedState({
  title = "Sem acesso a esse conteúdo",
  description = "Sua sessão pode ter expirado, ou você não tem permissão para ver isso.",
  action,
  className,
}: UnauthorizedStateProps) {
  return (
    <StatusState
      icon={SquareLock02Icon}
      tone="warning"
      title={title}
      description={description}
      action={action}
      className={cn("border-none p-8", className)}
    />
  )
}

export { EmptyState, ErrorState, NotFoundState, UnauthorizedState }
