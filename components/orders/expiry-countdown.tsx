'use client'

import { useEffect, useState } from 'react'
import { Clock, AlertCircle } from 'lucide-react'

interface ExpiryCountdownProps {
  expiresAt: string
  className?: string
}

interface TimeRemaining {
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

function calculateRemaining(targetIso: string): TimeRemaining {
  const target = new Date(targetIso).getTime()
  const now = Date.now()
  const diffMs = target - now

  if (diffMs <= 0 || Number.isNaN(diffMs)) {
    return { hours: 0, minutes: 0, seconds: 0, isExpired: true }
  }

  const totalSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { hours, minutes, seconds, isExpired: false }
}

export function ExpiryCountdown({ expiresAt, className }: ExpiryCountdownProps) {
  const [remaining, setRemaining] = useState<TimeRemaining>(() => calculateRemaining(expiresAt))

  useEffect(() => {
    // Jalankan kalkulasi setiap detik
    const timer = setInterval(() => {
      const next = calculateRemaining(expiresAt)
      setRemaining(next)
      if (next.isExpired) {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [expiresAt])

  if (remaining.isExpired) {
    return (
      <div
        role="alert"
        className={`flex items-center gap-2 rounded-md bg-stone-100 px-3 py-2 text-xs font-medium text-stone-700 ${
          className ?? ''
        }`}
      >
        <AlertCircle className="size-4 shrink-0 text-stone-500" />
        <span>Batas waktu pembayaran telah berakhir.</span>
      </div>
    )
  }

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div
      role="timer"
      aria-live="polite"
      className={`flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-900 ${
        className ?? ''
      }`}
    >
      <Clock className="size-4 shrink-0 text-amber-700 animate-pulse" />
      <div>
        <span className="font-semibold">Sisa waktu pembayaran: </span>
        <span className="tabular-nums font-mono font-bold text-amber-950">
          {remaining.hours} jam {pad(remaining.minutes)} menit {pad(remaining.seconds)} detik
        </span>
      </div>
    </div>
  )
}
