"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "./ui/button"

export function ThemeToggle({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={`rounded-md h-8 w-8 ${className}`}
      {...props}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 hover:text-sidebar-accent" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 hover:text-sidebar-accent" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
} 