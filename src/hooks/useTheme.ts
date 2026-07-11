// src/hooks/useTheme.ts
// Read/write the `data-theme` attribute on <html>. Persists the user's
// choice in localStorage. The initial value is set by the inline
// script in index.html (before React mounts) to avoid a flash of
// wrong theme.
import { useEffect, useState, useCallback } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

function readCurrentTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr === 'light' || attr === 'dark') return attr
  return 'light'
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(readCurrentTheme)

  // Keep state in sync if some other code (devtools, another tab) mutates
  // the attribute. Cheap because attribute change is rare.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const next = readCurrentTheme()
      setTheme((prev) => (prev === next ? prev : next))
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [])

  const toggle = useCallback(() => {
    const next: Theme = readCurrentTheme() === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage may be unavailable (private mode, quota); the toggle
      // still works for the current session.
    }
    setTheme(next)
  }, [])

  return [theme, toggle]
}
