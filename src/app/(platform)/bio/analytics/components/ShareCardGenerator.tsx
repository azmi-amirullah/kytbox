'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  LuDownload,
  LuPalette,
  LuShare2,
} from 'react-icons/lu'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  ModalHeader,
} from '@/components/ui/dialog'
import type { AnalyticsShareCardProps } from '@/features/bio'
import type {
  AnalyticsData,
  CountryAnalytics,
  DateRange,
} from '@/types/analytics'
import type { CustomThemeData } from '@/lib/theme'

export const SHARE_CARD_SIZE = 1080

export interface ShareCardPalette {
  start: string
  middle: string
  end: string
  text: string
  mutedText: string
  accent: string
  card: string
  accentText: string
}

const FONT_FAMILY = 'Inter, ui-sans-serif, system-ui, sans-serif'

const LIGHT_PALETTE: ShareCardPalette = {
  start: '#ffffff',
  middle: '#f8fafc',
  end: '#e0e7ff',
  text: '#0f172a',
  mutedText: '#475569',
  accent: '#6366f1',
  card: 'rgba(255, 255, 255, 0.72)',
  accentText: '#ffffff',
}

const DARK_PALETTE: ShareCardPalette = {
  start: '#0f172a',
  middle: '#1e1b4b',
  end: '#312e81',
  text: '#f8fafc',
  mutedText: '#cbd5e1',
  accent: '#a78bfa',
  card: 'rgba(255, 255, 255, 0.12)',
  accentText: '#1e1b4b',
}

const BIO_PALETTES: Record<string, ShareCardPalette> = {
  default: LIGHT_PALETTE,
  dark: DARK_PALETTE,
  gradient: {
    start: '#4f46e5',
    middle: '#7e22ce',
    end: '#0f172a',
    text: '#ffffff',
    mutedText: '#e0e7ff',
    accent: '#c4b5fd',
    card: 'rgba(255, 255, 255, 0.14)',
    accentText: '#312e81',
  },
  peach: {
    start: '#fb923c',
    middle: '#e11d48',
    end: '#be185d',
    text: '#ffffff',
    mutedText: '#ffe4e6',
    accent: '#fed7aa',
    card: 'rgba(255, 255, 255, 0.16)',
    accentText: '#9a3412',
  },
  deepsea: {
    start: '#14b8a6',
    middle: '#1d4ed8',
    end: '#0f172a',
    text: '#ffffff',
    mutedText: '#ccfbf1',
    accent: '#99f6e4',
    card: 'rgba(255, 255, 255, 0.14)',
    accentText: '#134e4a',
  },
  emerald: {
    start: '#10b981',
    middle: '#15803d',
    end: '#134e4a',
    text: '#ffffff',
    mutedText: '#d1fae5',
    accent: '#a7f3d0',
    card: 'rgba(255, 255, 255, 0.14)',
    accentText: '#065f46',
  },
  lavender: {
    start: '#ddd6fe',
    middle: '#c4b5fd',
    end: '#e879f9',
    text: '#1e1b4b',
    mutedText: '#4c1d95',
    accent: '#7c3aed',
    card: 'rgba(255, 255, 255, 0.48)',
    accentText: '#ffffff',
  },
  latte: {
    start: '#fff7ed',
    middle: '#fffbeb',
    end: '#d6d3d1',
    text: '#292524',
    mutedText: '#57534e',
    accent: '#c2410c',
    card: 'rgba(255, 255, 255, 0.55)',
    accentText: '#ffffff',
  },
  midnight: {
    start: '#0f172a',
    middle: '#1e3a8a',
    end: '#1e1b4b',
    text: '#ffffff',
    mutedText: '#dbeafe',
    accent: '#93c5fd',
    card: 'rgba(255, 255, 255, 0.14)',
    accentText: '#172554',
  },
  sunset: {
    start: '#fbbf24',
    middle: '#f97316',
    end: '#dc2626',
    text: '#ffffff',
    mutedText: '#ffedd5',
    accent: '#fef3c7',
    card: 'rgba(255, 255, 255, 0.16)',
    accentText: '#9a3412',
  },
  rosegold: {
    start: '#fda4af',
    middle: '#f472b6',
    end: '#c026d3',
    text: '#3b0764',
    mutedText: '#701a75',
    accent: '#a21caf',
    card: 'rgba(255, 255, 255, 0.42)',
    accentText: '#ffffff',
  },
  ocean: {
    start: '#38bdf8',
    middle: '#06b6d4',
    end: '#1d4ed8',
    text: '#082f49',
    mutedText: '#164e63',
    accent: '#0369a1',
    card: 'rgba(255, 255, 255, 0.42)',
    accentText: '#ffffff',
  },
  charcoal: {
    start: '#27272a',
    middle: '#171717',
    end: '#1c1917',
    text: '#ffffff',
    mutedText: '#d4d4d8',
    accent: '#facc15',
    card: 'rgba(255, 255, 255, 0.12)',
    accentText: '#422006',
  },
}

const COLOR_SCHEMES = [
  { id: 'bio', label: 'Bio theme' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
] as const

type ShareCardColorScheme = (typeof COLOR_SCHEMES)[number]['id']

function normalizeCanvasColor(
  value: string | undefined,
  fallback: string,
): string {
  const candidate = value?.trim() ?? ''
  return /^#[0-9a-f]{3}(?:[0-9a-f]{3}|[0-9a-f]{5})?$/i.test(candidate)
    ? candidate
    : fallback
}

function getCustomPalette(customTheme: CustomThemeData): ShareCardPalette {
  return {
    start: normalizeCanvasColor(customTheme.background, '#0f172a'),
    middle: normalizeCanvasColor(customTheme.elementBg, '#334155'),
    end: normalizeCanvasColor(customTheme.buttonBg, '#6366f1'),
    text: normalizeCanvasColor(customTheme.textPrimary, '#ffffff'),
    mutedText: normalizeCanvasColor(customTheme.textSecondary, '#cbd5e1'),
    accent: normalizeCanvasColor(customTheme.buttonBorder, '#a78bfa'),
    card: 'rgba(255, 255, 255, 0.14)',
    accentText: normalizeCanvasColor(customTheme.buttonText, '#ffffff'),
  }
}

export function getShareCardPalette(
  scheme: ShareCardColorScheme,
  themeName: string | null | undefined,
  customTheme: CustomThemeData | null | undefined,
): ShareCardPalette {
  if (scheme === 'light') return LIGHT_PALETTE
  if (scheme === 'dark') return DARK_PALETTE
  if (themeName === 'custom' && customTheme)
    return getCustomPalette(customTheme)
  return BIO_PALETTES[themeName || 'default'] || LIGHT_PALETTE
}

function formatNumber(value: number): string {
  return Number.isFinite(value)
    ? new Intl.NumberFormat('en-US').format(Math.max(0, Math.round(value)))
    : '0'
}

function getDateRangeText(range: DateRange): string {
  switch (range) {
    case '24h':
      return 'Last 24 hours'
    case '7d':
      return 'Last 7 days'
    case '30d':
      return 'Last 30 days'
    case 'lifetime':
      return 'All time'
  }
}

function getCountryDisplay(country: CountryAnalytics | undefined): {
  flag: string
  name: string
} {
  const rawCountry = country?.country?.trim()
  if (!rawCountry || rawCountry === 'Unknown') {
    return { flag: '🌐', name: 'No country data' }
  }

  const countryCode = rawCountry.toUpperCase()
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return { flag: '🌐', name: rawCountry }
  }

  const flag = String.fromCodePoint(
    ...countryCode.split('').map((char) => 127397 + char.charCodeAt(0)),
  )

  try {
    const name =
      new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode) ||
      countryCode
    return { flag, name }
  } catch {
    return { flag, name: countryCode }
  }
}

function getDisplayUsername(username: string): string {
  const cleanUsername = username.trim().replace(/^@+/, '')
  return cleanUsername ? `@${cleanUsername}` : '@creator'
}

function drawFittedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  initialSize: number,
  color: string,
  weight = 600,
): void {
  const safeText = text || '—'
  let fontSize = initialSize
  context.fillStyle = color
  context.textAlign = 'left'

  while (fontSize > 20) {
    context.font = `${weight} ${fontSize}px ${FONT_FAMILY}`
    if (context.measureText(safeText).width <= maxWidth) {
      context.fillText(safeText, x, y)
      return
    }
    fontSize -= 2
  }

  context.font = `${weight} ${fontSize}px ${FONT_FAMILY}`
  let fittedText = safeText
  while (
    fittedText.length > 1 &&
    context.measureText(`${fittedText}…`).width > maxWidth
  ) {
    fittedText = fittedText.slice(0, -1)
  }
  context.fillText(`${fittedText}…`, x, y)
}

function fillRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const safeRadius = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.arcTo(x + width, y, x + width, y + height, safeRadius)
  context.arcTo(x + width, y + height, x, y + height, safeRadius)
  context.arcTo(x, y + height, x, y, safeRadius)
  context.arcTo(x, y, x + width, y, safeRadius)
  context.closePath()
  context.fill()
}

function drawMetric(
  context: CanvasRenderingContext2D,
  label: string,
  value: string,
  detail: string,
  x: number,
  y: number,
  width: number,
  palette: ShareCardPalette,
): void {
  context.fillStyle = palette.card
  fillRoundedRect(context, x, y, width, 190, 28)

  context.font = `700 20px ${FONT_FAMILY}`
  context.fillStyle = palette.mutedText
  context.fillText(label.toUpperCase(), x + 28, y + 42)

  drawFittedText(
    context,
    value,
    x + 28,
    y + 102,
    width - 56,
    38,
    palette.text,
    700,
  )

  context.font = `500 20px ${FONT_FAMILY}`
  context.fillStyle = palette.mutedText
  context.fillText(detail, x + 28, y + 148)
}

export function drawShareCard(
  canvas: HTMLCanvasElement,
  {
    data,
    username,
    dateRange,
    palette,
  }: {
    data: AnalyticsData
    username: string
    dateRange: DateRange
    palette: ShareCardPalette
  },
): void {
  const context = canvas.getContext('2d')
  if (!context) return

  canvas.width = SHARE_CARD_SIZE
  canvas.height = SHARE_CARD_SIZE
  context.clearRect(0, 0, SHARE_CARD_SIZE, SHARE_CARD_SIZE)

  const background = context.createLinearGradient(
    0,
    0,
    SHARE_CARD_SIZE,
    SHARE_CARD_SIZE,
  )
  background.addColorStop(0, palette.start)
  background.addColorStop(0.5, palette.middle)
  background.addColorStop(1, palette.end)
  context.fillStyle = background
  context.fillRect(0, 0, SHARE_CARD_SIZE, SHARE_CARD_SIZE)

  context.globalAlpha = 0.16
  context.fillStyle = palette.accent
  context.beginPath()
  context.arc(920, 120, 240, 0, Math.PI * 2)
  context.fill()
  context.beginPath()
  context.arc(80, 1010, 300, 0, Math.PI * 2)
  context.fill()
  context.globalAlpha = 1

  const padding = 88
  const contentWidth = SHARE_CARD_SIZE - padding * 2
  const columnGap = 24
  const metricWidth = (contentWidth - columnGap) / 2
  const topLink = data.topLinks[0]
  const topCountry = getCountryDisplay(data.countries[0])

  context.textAlign = 'left'
  context.font = `800 24px ${FONT_FAMILY}`
  context.fillStyle = palette.accent
  context.fillText('KYTBOX  /  CREATOR ANALYTICS', padding, 96)

  drawFittedText(
    context,
    `${getDisplayUsername(username)}'s Bio Stats`,
    padding,
    220,
    contentWidth,
    66,
    palette.text,
    800,
  )

  context.font = `500 24px ${FONT_FAMILY}`
  context.fillStyle = palette.mutedText
  context.fillText('Your links, making an impact.', padding, 270)

  context.fillStyle = palette.accent
  context.fillRect(padding, 316, 120, 8)

  drawMetric(
    context,
    'Total clicks',
    formatNumber(data.totalClicks),
    'tracked link visits',
    padding,
    370,
    metricWidth,
    palette,
  )
  drawMetric(
    context,
    'Top link',
    topLink?.title || 'No clicks yet',
    topLink
      ? `${formatNumber(topLink.clicks)} clicks`
      : 'Share your links to start',
    padding + metricWidth + columnGap,
    370,
    metricWidth,
    palette,
  )
  drawMetric(
    context,
    'Top country',
    `${topCountry.flag} ${topCountry.name}`,
    data.countries[0]
      ? `${formatNumber(data.countries[0].click_count)} clicks`
      : 'Waiting for visitors',
    padding,
    584,
    metricWidth,
    palette,
  )
  drawMetric(
    context,
    'Date range',
    getDateRangeText(dateRange),
    'analytics snapshot',
    padding + metricWidth + columnGap,
    584,
    metricWidth,
    palette,
  )

  context.fillStyle = palette.card
  context.fillRect(padding, 846, contentWidth, 2)

  context.font = `700 24px ${FONT_FAMILY}`
  context.fillStyle = palette.text
  context.fillText('Powered by Kytbox', padding, 912)

  context.font = `500 22px ${FONT_FAMILY}`
  context.fillStyle = palette.mutedText
  context.fillText(
    `kytbox.com/${getDisplayUsername(username).slice(1)}`,
    padding,
    952,
  )

  context.textAlign = 'right'
  context.font = `700 22px ${FONT_FAMILY}`
  context.fillStyle = palette.accent
  context.fillText('SHARE YOUR MOMENT', SHARE_CARD_SIZE - padding, 912)
  context.textAlign = 'left'
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }
      reject(new Error('The browser could not create a PNG from the canvas.'))
    }, 'image/png')
  })
}

export default function ShareCardGenerator({
  data,
  username,
  themeName,
  customTheme,
  dateRange,
  isDisabled,
}: AnalyticsShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [open, setOpen] = useState(false)
  const [scheme, setScheme] = useState<ShareCardColorScheme>('bio')
  const [isDownloading, setIsDownloading] = useState(false)
  const palette = useMemo(
    () => getShareCardPalette(scheme, themeName, customTheme),
    [customTheme, scheme, themeName],
  )

  const drawConfigRef = useRef({ data, username, dateRange, palette })
  drawConfigRef.current = { data, username, dateRange, palette }

  const setCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas
    if (!canvas) return
    drawShareCard(canvas, drawConfigRef.current)
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return
    drawShareCard(canvasRef.current, { data, username, dateRange, palette })
  }, [data, dateRange, palette, username])

  const handleDownload = async () => {
    if (!canvasRef.current) return
    setIsDownloading(true)
    try {
      const blob = await canvasToPng(canvasRef.current)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `kytbox-${getDisplayUsername(username).slice(1)}-stats.png`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
      toast.success('Your Bio stats card was downloaded.')
    } catch (error) {
      console.error('Failed to download analytics share card:', error)
      toast.error('Could not download the stats card. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <>
      <Button
        type='button'
        variant='outline'
        onClick={() => setOpen(true)}
        disabled={isDisabled}
        className='w-full sm:w-auto gap-2'
      >
        <LuShare2 className='h-4 w-4' />
        Share Stats
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto p-4 sm:p-6'>
          <ModalHeader
            title={
              <span className='flex items-center gap-2'>
                <LuShare2 className='h-5 w-5 text-primary' />
                Share your bio stats
              </span>
            }
            description='Preview your Instagram-ready card, then download it as a PNG.'
            onClose={() => setOpen(false)}
          />

          <div className='flex justify-center rounded-2xl bg-muted/40 p-2 sm:p-4'>
            <canvas
              ref={setCanvasRef}
              width={SHARE_CARD_SIZE}
              height={SHARE_CARD_SIZE}
              role='img'
              aria-label={`Analytics share card for ${getDisplayUsername(username)}`}
              className='h-auto w-full max-w-130 rounded-xl shadow-lg'
            />
          </div>

          <fieldset className='space-y-2'>
            <legend className='flex items-center gap-2 text-sm font-medium'>
              <LuPalette className='h-4 w-4 text-muted-foreground' />
              Color scheme
            </legend>
            <div className='grid grid-cols-3 gap-2'>
              {COLOR_SCHEMES.map((colorScheme) => {
                const schemePalette = getShareCardPalette(
                  colorScheme.id,
                  themeName,
                  customTheme,
                )
                const isSelected = scheme === colorScheme.id

                return (
                  <button
                    key={colorScheme.id}
                    type='button'
                    aria-pressed={isSelected}
                    onClick={() => setScheme(colorScheme.id)}
                    className={`flex min-h-12 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <span
                      aria-hidden='true'
                      className='h-5 w-5 shrink-0 rounded-full border border-white/40 shadow-sm'
                      style={{
                        background: `linear-gradient(135deg, ${schemePalette.start}, ${schemePalette.end})`,
                      }}
                    />
                    <span className='truncate'>{colorScheme.label}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <DialogFooter className='flex justify-end'>
            <Button
              type='button'
              onClick={handleDownload}
              disabled={isDownloading}
              className='w-full gap-2 sm:w-auto'
            >
              <LuDownload className='h-4 w-4' />
              {isDownloading ? 'Generating...' : 'Download PNG'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
