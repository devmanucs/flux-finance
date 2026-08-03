"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@flux-finance/ui/components/ui/button"
import { Icon } from "@flux-finance/ui/components/ui/icon"
import { cn } from "@flux-finance/ui/lib/utils"

function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  // next-themes só resolve o tema real após montar no client; até lá,
  // renderizamos um placeholder do mesmo tamanho pra não piscar/mudar layout.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn("rounded-full", className)}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      disabled={!mounted}
    >
      {mounted ? (
        <Icon icon={isDark ? Moon02Icon : Sun01Icon} />
      ) : (
        <span className="size-4" aria-hidden />
      )}
    </Button>
  )
}

export { ThemeToggle }
