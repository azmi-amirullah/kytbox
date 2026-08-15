import { useState, useEffect } from 'react'
import {
  LuCheck,
  LuPalette,
  LuShare2,
  LuChevronRight,
  LuGlobe,
  LuSearch,
  LuImage,
} from 'react-icons/lu'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { updateAppearance, updateSeoSettings } from '../actions'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  THEME_LIST,
  type ButtonStyle,
  type ButtonShape,
  validateButtonStyle,
  validateButtonShape,
  type CustomThemeData,
} from '@/lib/theme'
import type { ThemeCategory } from '@/lib/theme/theme.types'

interface AppearanceEditorProps {
  initialTheme: string
  initialButtonStyle: string
  initialButtonShape: string
  initialSocialLinks: Record<string, string>
  initialCustomTheme?: CustomThemeData | null
  initialMetaTitle?: string
  initialMetaDescription?: string
  initialOgImageUrl?: string
  isLoading?: boolean
  onPreviewUpdate: (
    theme: string,
    style: string,
    shape: string,
    social: Record<string, string>,
    custom?: CustomThemeData | null,
  ) => void
}

function ColorPickerRow({
  label,
  colorKey,
  customTheme,
  onChange,
}: {
  label: string
  colorKey: keyof CustomThemeData
  customTheme: CustomThemeData
  onChange: (key: keyof CustomThemeData, value: string) => void
}) {
  const fullHex = customTheme[colorKey] || '#000000'
  const baseHex = fullHex.slice(0, 7).padEnd(7, '0')
  let alphaHex = 'ff'
  if (fullHex.length === 9) {
    alphaHex = fullHex.slice(7, 9)
  } else if (fullHex.length === 5) {
    alphaHex = fullHex.slice(4, 5).repeat(2)
  }
  const alphaPercent = Math.round((parseInt(alphaHex, 16) / 255) * 100) || 0

  return (
    <div className='flex flex-col gap-1.5'>
      <Label
        htmlFor={`${String(colorKey)}-hex`}
        className='text-xs font-semibold'
      >
        {label}
      </Label>
      <div className='flex items-center gap-2 border border-border/50 bg-card rounded-md p-1.5 shadow-sm'>
        <input
          type='color'
          value={baseHex}
          onChange={(e) => {
            const newAlpha = alphaPercent === 100 ? '' : alphaHex
            onChange(colorKey, e.target.value + newAlpha)
          }}
          className='w-7 h-7 cursor-pointer rounded bg-transparent border-0 p-0 shrink-0'
        />
        <Input
          id={`${String(colorKey)}-hex`}
          value={fullHex}
          onChange={(e) => onChange(colorKey, e.target.value)}
          className='h-7 flex-1 min-w-18.75 border-0 shadow-none focus-visible:ring-0 font-mono text-xs uppercase px-1'
          maxLength={9}
        />
        <div className='flex items-center gap-1 border-l pl-2'>
          <Input
            id={`${String(colorKey)}-alpha`}
            type='number'
            min={0}
            max={100}
            value={alphaPercent}
            onChange={(e) => {
              let perc = parseInt(e.target.value)
              if (isNaN(perc)) return // Don't crash on empty input
              perc = Math.max(0, Math.min(100, perc)) // Clamp between 0-100

              if (perc === 100) {
                onChange(colorKey, baseHex)
              } else {
                const newAlpha = Math.round((perc / 100) * 255)
                  .toString(16)
                  .padStart(2, '0')
                onChange(colorKey, baseHex + newAlpha)
              }
            }}
            className='h-7 w-12 border-0 shadow-none focus-visible:ring-0 font-mono text-xs px-1 text-center bg-transparent'
            autoComplete='off'
          />
          <span className='text-[10px] text-muted-foreground font-mono pr-1'>
            %
          </span>
        </div>
      </div>
    </div>
  )
}

const SOCIAL_PLATFORMS = [
  {
    id: 'instagram',
    label: 'Instagram',
    baseUrl: 'https://instagram.com/',
    placeholder: 'username',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    baseUrl: 'https://tiktok.com/@',
    placeholder: 'username',
  },
  {
    id: 'twitter',
    label: 'Twitter/X',
    baseUrl: 'https://x.com/',
    placeholder: 'username',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    baseUrl: 'https://youtube.com/@',
    placeholder: 'channel',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    baseUrl: 'https://linkedin.com/in/',
    placeholder: 'username',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    baseUrl: 'https://wa.me/',
    placeholder: 'phone number',
  },
]

function StatusIndicator({
  status,
}: {
  status: 'idle' | 'saving' | 'saved' | 'error'
}) {
  return (
    <div className='flex items-center gap-2 text-xs font-medium min-h-5'>
      {status === 'saving' && (
        <span className='text-muted-foreground animate-pulse'>Saving...</span>
      )}
      {status === 'saved' && (
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='text-green-600 dark:text-green-400 flex items-center gap-1.5'
        >
          <LuCheck className='w-3.5 h-3.5' />
          Saved
        </motion.span>
      )}
      {status === 'error' && (
        <span className='text-destructive'>Failed to save</span>
      )}
    </div>
  )
}

function SavingBar({
  status,
}: {
  status: 'idle' | 'saving' | 'saved' | 'error'
}) {
  return (
    <AnimatePresence>
      {status === 'saving' && (
        <div className='absolute top-0 left-0 right-0 h-1 bg-primary/20 z-10'>
          <motion.div
            className='h-full bg-primary'
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>
      )}
    </AnimatePresence>
  )
}

export default function AppearanceEditor({
  initialTheme,
  initialButtonStyle,
  initialButtonShape,
  initialSocialLinks,
  initialCustomTheme,
  initialMetaTitle = '',
  initialMetaDescription = '',
  initialOgImageUrl = '',
  isLoading,
  onPreviewUpdate,
}: AppearanceEditorProps) {
  const router = useRouter()
  const [themeName, setThemeName] = useState(initialTheme)
  const [buttonStyle, setButtonStyle] = useState<ButtonStyle>(
    validateButtonStyle(initialButtonStyle),
  )
  const [buttonShape, setButtonShape] = useState<ButtonShape>(
    validateButtonShape(initialButtonShape),
  )
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
    initialSocialLinks || {},
  )
  const [customTheme, setCustomTheme] = useState<CustomThemeData>(
    initialCustomTheme || {
      background: '#ffffff',
      textPrimary: '#000000',
      textSecondary: '#666666',
      elementBg: 'rgba(0,0,0,0.05)',
      elementBorder: 'rgba(0,0,0,0.1)',
      elementRing: 'rgba(0,0,0,0.05)',
      buttonBg: '#000000',
      buttonBorder: '#000000',
      buttonText: '#ffffff',
      footerBg: 'rgba(0,0,0,0.05)',
      footerBorder: 'rgba(0,0,0,0.1)',
      footerText: '#666666',
    },
  )
  const [metaTitle, setMetaTitle] = useState(initialMetaTitle)
  const [metaDescription, setMetaDescription] = useState(initialMetaDescription)
  const [ogImageUrl, setOgImageUrl] = useState(initialOgImageUrl)

  const initialCategory =
    initialTheme === 'custom'
      ? 'custom'
      : (THEME_LIST.find((t) => t.id === initialTheme)?.category ?? null)
  const [activeCategory, setActiveCategory] = useState<ThemeCategory | null>(
    initialCategory,
  )
  const [error, setError] = useState<string | null>(null)
  const [appearanceStatus, setAppearanceStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const [socialStatus, setSocialStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const [seoStatus, setSeoStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')

  const themeCategories: ThemeCategory[] = [
    'solid',
    'gradient',
    'soft',
    'custom',
  ]

  // Appearance Auto-save
  useEffect(() => {
    let isChanged = false
    if (themeName !== initialTheme) isChanged = true
    if (buttonStyle !== initialButtonStyle) isChanged = true
    if (buttonShape !== initialButtonShape) isChanged = true

    // Supabase JSONB reformats key order, so JSON.stringify is unreliable for equality checks.
    const isCustomThemeEqual = (
      a: CustomThemeData | null | undefined,
      b: CustomThemeData | null | undefined,
    ) => {
      if (!a && !b) return true
      if (!a || !b) return false
      const THEME_KEYS: Array<keyof CustomThemeData> = [
        'background',
        'textPrimary',
        'textSecondary',
        'elementBg',
        'elementBorder',
        'elementRing',
        'buttonBg',
        'buttonBorder',
        'buttonText',
        'footerBg',
        'footerBorder',
        'footerText',
      ]
      for (const k of THEME_KEYS) {
        if (a[k] !== b[k]) return false
      }
      return true
    }

    if (
      themeName === 'custom' &&
      !isCustomThemeEqual(customTheme, initialCustomTheme || null)
    ) {
      isChanged = true
    }

    if (!isChanged) {
      return
    }

    const timer = setTimeout(async () => {
      setAppearanceStatus('saving')
      const startTime = Date.now()

      const formData = new FormData()
      formData.append('themeName', themeName)
      formData.append('buttonStyle', buttonStyle)
      formData.append('buttonShape', buttonShape)
      formData.append('socialLinks', JSON.stringify(socialLinks))
      if (themeName === 'custom') {
        formData.append('customTheme', JSON.stringify(customTheme))
      }

      const result = await updateAppearance(formData)

      const elapsed = Date.now() - startTime
      const minDuration = 500
      if (elapsed < minDuration) {
        await new Promise((resolve) =>
          setTimeout(resolve, minDuration - elapsed),
        )
      }

      if (result.error) {
        setAppearanceStatus('error')
        setError(result.error)
      } else {
        setAppearanceStatus('saved')
        setError(null)
        router.refresh()
        setTimeout(() => setAppearanceStatus('idle'), 2000)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [
    themeName,
    buttonStyle,
    buttonShape,
    customTheme,
    initialTheme,
    initialButtonStyle,
    initialButtonShape,
    initialCustomTheme,
    socialLinks,
    router,
  ])

  // Social Links Auto-save
  useEffect(() => {
    const isSocialChanged =
      JSON.stringify(socialLinks) !== JSON.stringify(initialSocialLinks)

    if (!isSocialChanged) {
      return
    }

    const timer = setTimeout(async () => {
      setSocialStatus('saving')
      const startTime = Date.now()

      const formData = new FormData()
      formData.append('themeName', themeName)
      formData.append('buttonStyle', buttonStyle)
      formData.append('buttonShape', buttonShape)
      formData.append('socialLinks', JSON.stringify(socialLinks))
      if (themeName === 'custom') {
        formData.append('customTheme', JSON.stringify(customTheme))
      }

      const result = await updateAppearance(formData)

      const elapsed = Date.now() - startTime
      const minDuration = 500
      if (elapsed < minDuration) {
        await new Promise((resolve) =>
          setTimeout(resolve, minDuration - elapsed),
        )
      }

      if (result.error) {
        setSocialStatus('error')
        setError(result.error)
      } else {
        setSocialStatus('saved')
        setError(null)
        router.refresh()
        setTimeout(() => setSocialStatus('idle'), 2000)
      }
    }, 1000) // Longer debounce for typing

    return () => clearTimeout(timer)
  }, [
    socialLinks,
    initialSocialLinks,
    themeName,
    customTheme,
    buttonStyle,
    buttonShape,
    router,
  ])

  // SEO & Social Metadata Auto-save
  useEffect(() => {
    const isSeoChanged =
      metaTitle !== initialMetaTitle ||
      metaDescription !== initialMetaDescription ||
      ogImageUrl !== initialOgImageUrl

    if (!isSeoChanged) {
      return
    }

    const timer = setTimeout(async () => {
      setSeoStatus('saving')
      const startTime = Date.now()

      const formData = new FormData()
      formData.append('metaTitle', metaTitle)
      formData.append('metaDescription', metaDescription)
      formData.append('ogImageUrl', ogImageUrl)

      const result = await updateSeoSettings(formData)

      const elapsed = Date.now() - startTime
      const minDuration = 500
      if (elapsed < minDuration) {
        await new Promise((resolve) =>
          setTimeout(resolve, minDuration - elapsed),
        )
      }

      if (result.error) {
        setSeoStatus('error')
        setError(result.error)
      } else {
        setSeoStatus('saved')
        setError(null)
        router.refresh()
        setTimeout(() => setSeoStatus('idle'), 2000)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [
    metaTitle,
    metaDescription,
    ogImageUrl,
    initialMetaTitle,
    initialMetaDescription,
    initialOgImageUrl,
    router,
  ])

  // Debounced Custom Theme Preview Update
  useEffect(() => {
    if (themeName !== 'custom') return

    const timer = setTimeout(() => {
      onPreviewUpdate(
        'custom',
        buttonStyle,
        buttonShape,
        socialLinks,
        customTheme,
      )
    }, 300) // 300ms sweet spot for typing vs visual feedback

    return () => clearTimeout(timer)
  }, [
    customTheme,
    themeName,
    buttonStyle,
    buttonShape,
    socialLinks,
    onPreviewUpdate,
  ])

  const handleUpdate = (
    type: 'theme' | 'style' | 'shape' | 'social',
    value: string | Record<string, string>,
    overrideCustomTheme?: CustomThemeData,
  ) => {
    if (type === 'theme' && typeof value === 'string') {
      const themeId = value
      setThemeName(themeId)
      setAppearanceStatus('idle')
      onPreviewUpdate(
        themeId,
        buttonStyle,
        buttonShape,
        socialLinks,
        overrideCustomTheme !== undefined ? overrideCustomTheme : customTheme,
      )
    } else if (type === 'style' && typeof value === 'string') {
      const style = validateButtonStyle(value)
      setButtonStyle(style)
      setAppearanceStatus('idle')
      onPreviewUpdate(themeName, style, buttonShape, socialLinks)
    } else if (type === 'shape' && typeof value === 'string') {
      const shape = validateButtonShape(value)
      setButtonShape(shape)
      setAppearanceStatus('idle')
      onPreviewUpdate(themeName, buttonStyle, shape, socialLinks, customTheme)
    } else if (type === 'social' && typeof value === 'object') {
      const social = value
      const newSocial = { ...socialLinks, ...social }
      setSocialLinks(newSocial)
      setSocialStatus('idle')
      onPreviewUpdate(
        themeName,
        buttonStyle,
        buttonShape,
        newSocial,
        customTheme,
      )
    }
  }

  const handleCustomColorChange = (
    key: keyof CustomThemeData,
    color: string,
  ) => {
    const newCustom = { ...customTheme, [key]: color }
    setCustomTheme(newCustom)
    setAppearanceStatus('idle')
    setThemeName('custom')
    // Removed immediate onPreviewUpdate to prevent typing lag
  }

  const getPreviewButtonClass = (themeId: string) => {
    const theme = THEME_LIST.find((t) => t.id === themeId)
    if (!theme) return 'bg-white/15 border-white/25 text-white'
    const { colors } = theme
    return `${colors.buttonBg} ${colors.buttonBorder} ${colors.buttonText}`
  }

  const filteredThemes = activeCategory
    ? THEME_LIST.filter((t) => t.category === activeCategory)
    : []

  return (
    <div className='space-y-6'>
      <Card className='border-border bg-card shadow-sm relative overflow-hidden'>
        <SavingBar status={appearanceStatus} />

        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <div>
            <CardTitle className='text-lg flex items-center gap-2'>
              <LuPalette className='w-5 h-5 text-primary' />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize your Bio page&apos;s theme and button styles
            </CardDescription>
          </div>

          <StatusIndicator status={appearanceStatus} />
        </CardHeader>

        <CardContent className='space-y-6'>
          {/* Theme Selection with Categories */}
          <div className='space-y-4'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4'>
              <Label className='text-sm font-bold uppercase tracking-wider opacity-60'>
                Background Theme
              </Label>
              <div
                role='tablist'
                aria-label='Theme categories'
                className='flex bg-muted p-1 rounded-xl gap-1 w-fit overflow-x-auto no-scrollbar scroll-smooth'
              >
                {themeCategories.map((cat) => (
                  <button
                    type='button'
                    key={cat}
                    role='tab'
                    aria-selected={activeCategory === cat}
                    onClick={async () => {
                      setActiveCategory(cat)
                      // If they specifically click the custom tab, auto-switch the theme to custom
                      if (cat === 'custom') {
                        let currentCustom = customTheme

                        // If they haven't set a custom theme yet, give them a clean default slate
                        if (
                          !currentCustom ||
                          Object.keys(currentCustom).length === 0
                        ) {
                          currentCustom = {
                            background: '#ffffff',
                            textPrimary: '#000000',
                            textSecondary: '#666666',
                            elementBg: '#0000000d', // black/5
                            elementBorder: '#0000001a', // black/10
                            elementRing: '#00000033', // black/20
                            buttonBg: '#000000',
                            buttonBorder: '#000000',
                            buttonText: '#ffffff',
                            footerBg: '#0000000d',
                            footerBorder: '#0000001a',
                            footerText: '#666666',
                          }
                          setCustomTheme(currentCustom)
                        }

                        handleUpdate('theme', 'custom', currentCustom)
                      }
                    }}
                    className={cn(
                      'px-3 py-1 text-[10px] font-bold uppercase tracking-tight rounded-md transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      activeCategory === cat
                        ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {activeCategory === 'custom' ? (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border-2 border-border/50 bg-secondary/10 animate-in fade-in'>
                <ColorPickerRow
                  label='Background'
                  colorKey='background'
                  customTheme={customTheme}
                  onChange={handleCustomColorChange}
                />
                <ColorPickerRow
                  label='Text'
                  colorKey='textPrimary'
                  customTheme={customTheme}
                  onChange={handleCustomColorChange}
                />
                <ColorPickerRow
                  label='Button Fill'
                  colorKey='buttonBg'
                  customTheme={customTheme}
                  onChange={handleCustomColorChange}
                />
                <ColorPickerRow
                  label='Button Text'
                  colorKey='buttonText'
                  customTheme={customTheme}
                  onChange={handleCustomColorChange}
                />
              </div>
            ) : (
              <div
                key={activeCategory ?? 'empty'}
                className='grid grid-cols-2 sm:grid-cols-3 gap-3 animate-in fade-in duration-150'
              >
                {filteredThemes.length === 0
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className='flex flex-col items-center justify-center p-3 rounded-xl border-2 border-border/50 min-h-22.5 bg-secondary/50'
                      >
                        <div className='h-3 w-12 rounded mb-2 bg-muted/60 animate-pulse' />
                        <div className='w-full h-6 rounded bg-muted/60 animate-pulse' />
                      </div>
                    ))
                  : filteredThemes.map((theme) => (
                      <button
                        key={theme.id}
                        type='button'
                        onClick={() => handleUpdate('theme', theme.id)}
                        aria-label={`Select ${theme.name} theme`}
                        className={cn(
                          'relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all shadow-sm group min-h-22.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          theme.previewClass,
                          themeName === theme.id
                            ? 'border-primary ring-2 ring-primary/10'
                            : 'border-border/50 hover:border-foreground/30',
                        )}
                      >
                        <span className='text-[10px] font-bold uppercase tracking-tight mb-2 opacity-80'>
                          {theme.name}
                        </span>
                        <div
                          className={cn(
                            'w-full h-6 rounded flex items-center justify-center text-[8px] font-medium border shadow-sm',
                            getPreviewButtonClass(theme.id),
                          )}
                        >
                          Button
                        </div>
                        {themeName === theme.id && (
                          <div className='absolute -top-1 -right-1 bg-primary rounded-full p-1 shadow-lg z-10 ring-2 ring-background'>
                            <LuCheck className='w-3 h-3 text-primary-foreground' />
                          </div>
                        )}
                      </button>
                    ))}
              </div>
            )}
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
            {/* Button Shape Selection */}
            <div className='space-y-3'>
              <Label className='text-sm font-bold uppercase tracking-wider opacity-60'>
                Button Shape
              </Label>
              <div className='grid grid-cols-2 gap-2'>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className='flex flex-col items-center justify-center p-3 rounded-lg border-2 border-border/50 bg-secondary/50'
                      >
                        <div className='w-full h-8 rounded bg-muted/60 animate-pulse' />
                      </div>
                    ))
                  : (
                      [
                        {
                          id: 'rounded',
                          name: 'Rounded',
                          radius: 'rounded-xl',
                        },
                        { id: 'pill', name: 'Pill', radius: 'rounded-full' },
                        {
                          id: 'leaf',
                          name: 'Leaf',
                          radius: 'rounded-tr-2xl rounded-bl-2xl',
                        },
                        {
                          id: 'square',
                          name: 'Square',
                          radius: 'rounded-none',
                        },
                      ] as const
                    ).map((shape) => (
                      <button
                        key={shape.id}
                        type='button'
                        onClick={() => handleUpdate('shape', shape.id)}
                        className={cn(
                          'relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all bg-secondary/5',
                          buttonShape === shape.id
                            ? 'border-primary ring-2 ring-primary/5 bg-primary/5'
                            : 'border-border/50 hover:border-foreground/20',
                        )}
                      >
                        <div
                          className={cn(
                            'w-full py-2 px-2 text-[9px] font-bold text-center border bg-card text-card-foreground border-border shadow-sm',
                            shape.radius,
                          )}
                        >
                          {shape.name}
                        </div>
                        {buttonShape === shape.id && (
                          <div className='absolute -top-1 -right-1 bg-primary rounded-full p-0.5 shadow-md'>
                            <LuCheck className='w-2.5 h-2.5 text-primary-foreground' />
                          </div>
                        )}
                      </button>
                    ))}
              </div>
            </div>

            {/* Button Style Selection */}
            <div className='space-y-3'>
              <Label className='text-sm font-bold uppercase tracking-wider opacity-60'>
                Button Fill
              </Label>
              <div className='grid grid-cols-2 gap-2'>
                {isLoading
                  ? Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={i}
                        className='flex flex-col items-center justify-center p-3 rounded-lg border-2 border-border/50 bg-secondary/50'
                      >
                        <div className='w-full h-8 rounded bg-muted/60 animate-pulse' />
                      </div>
                    ))
                  : (
                      [
                        {
                          id: 'default',
                          name: 'Solid',
                          class: 'bg-card border-border shadow-sm',
                        },
                        {
                          id: 'transparent',
                          name: 'Transparent',
                          class: 'bg-transparent border-2 border-foreground/20',
                        },
                      ] as const
                    ).map((style) => (
                      <button
                        key={style.id}
                        type='button'
                        onClick={() => handleUpdate('style', style.id)}
                        className={cn(
                          'relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all bg-secondary/5',
                          buttonStyle === style.id
                            ? 'border-primary ring-2 ring-primary/5 bg-primary/5'
                            : 'border-border/50 hover:border-foreground/20',
                        )}
                      >
                        <div
                          className={cn(
                            'w-full py-2 px-2 text-[9px] font-bold text-center rounded border flex items-center justify-center h-8',
                            style.class,
                          )}
                        >
                          {style.name}
                        </div>
                        {buttonStyle === style.id && (
                          <div className='absolute -top-1 -right-1 bg-primary rounded-full p-0.5 shadow-md'>
                            <LuCheck className='w-2.5 h-2.5 text-primary-foreground' />
                          </div>
                        )}
                      </button>
                    ))}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className='p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center'>
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social Links Card */}
      <Card className='border-border bg-card shadow-sm relative overflow-hidden'>
        <SavingBar status={socialStatus} />
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <div>
            <CardTitle className='text-lg flex items-center gap-2'>
              <LuShare2 className='w-5 h-5 text-primary' />
              Social Profiles
            </CardTitle>
            <CardDescription>
              Add links to your primary social media profiles
            </CardDescription>
          </div>
          <StatusIndicator status={socialStatus} />
        </CardHeader>
        <CardContent className='grid sm:grid-cols-2 gap-4'>
          {SOCIAL_PLATFORMS.map((platform) => (
            <div key={platform.id} className='space-y-1.5'>
              <Label
                htmlFor={platform.id}
                className='text-[10px] font-bold uppercase tracking-wider opacity-60'
              >
                {platform.label}
              </Label>
              <div className='relative group'>
                <div className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-xs select-none'>
                  @
                </div>
                <Input
                  id={platform.id}
                  value={
                    socialLinks[platform.id]?.replace(platform.baseUrl, '') ||
                    ''
                  }
                  onChange={(e) =>
                    handleUpdate('social', {
                      [platform.id]: e.target.value
                        ? platform.baseUrl + e.target.value
                        : '',
                    })
                  }
                  placeholder={platform.placeholder}
                  disabled={isLoading}
                  className='h-9 text-xs pl-7 pr-8 bg-secondary/5 border-border/50 group-hover:border-foreground/30 transition-all focus-visible:ring-primary/20'
                />
                <div className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/30'>
                  <LuChevronRight className='w-3 h-3' />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* SEO & Social Media Metadata Card */}
      <Card className='border-border bg-card shadow-sm relative overflow-hidden'>
        <SavingBar status={seoStatus} />
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <div>
            <CardTitle className='text-lg flex items-center gap-2'>
              <LuGlobe className='w-5 h-5 text-primary' />
              SEO & Social Sharing Preview
            </CardTitle>
            <CardDescription>
              Customize how your bio profile appears in Google search engine results and social media cards.
            </CardDescription>
          </div>
          <StatusIndicator status={seoStatus} />
        </CardHeader>
        <CardContent className='space-y-5'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-4'>
              {/* Meta Title Field */}
              <div className='space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='meta-title' className='text-xs font-semibold'>
                    Custom Meta Title
                  </Label>
                  <span
                    className={cn(
                      'text-[10px] font-mono',
                      metaTitle.length > 60
                        ? 'text-amber-500 font-semibold'
                        : 'text-muted-foreground',
                    )}
                  >
                    {metaTitle.length}/120 {metaTitle.length > 60 ? '(>60 Rec.)' : ''}
                  </span>
                </div>
                <div className='relative'>
                  <LuSearch className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50' />
                  <Input
                    id='meta-title'
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder='e.g., Jane Doe — Founder & Tech Creator'
                    maxLength={120}
                    disabled={isLoading}
                    className='pl-9 text-xs h-9 bg-secondary/5 border-border/50 focus-visible:ring-primary/20'
                  />
                </div>
              </div>

              {/* Meta Description Field */}
              <div className='space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='meta-description' className='text-xs font-semibold'>
                    Custom Meta Description
                  </Label>
                  <span
                    className={cn(
                      'text-[10px] font-mono',
                      metaDescription.length > 160
                        ? 'text-amber-500 font-semibold'
                        : 'text-muted-foreground',
                    )}
                  >
                    {metaDescription.length}/300 {metaDescription.length > 160 ? '(>160 Rec.)' : ''}
                  </span>
                </div>
                <textarea
                  id='meta-description'
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder='e.g., Welcome to my bio link hub! Find my latest videos, podcasts, and newsletter.'
                  maxLength={300}
                  rows={3}
                  disabled={isLoading}
                  className='w-full rounded-md border border-border/50 bg-secondary/5 p-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-50'
                />
              </div>

              {/* OpenGraph Image URL Field */}
              <div className='space-y-1.5'>
                <Label htmlFor='og-image-url' className='text-xs font-semibold'>
                  Social Card Image URL (OG Image)
                </Label>
                <div className='relative'>
                  <LuImage className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50' />
                  <Input
                    id='og-image-url'
                    value={ogImageUrl}
                    onChange={(e) => setOgImageUrl(e.target.value)}
                    placeholder='https://example.com/banner.png'
                    disabled={isLoading}
                    className='pl-9 text-xs h-9 bg-secondary/5 border-border/50 focus-visible:ring-primary/20'
                  />
                </div>
                <p className='text-[10px] text-muted-foreground'>
                  Landscape ratio 1200×630px recommended. Defaults to profile picture if empty.
                </p>
              </div>
            </div>

            {/* Social Share Card Preview Box */}
            <div className='space-y-2 border border-border/60 rounded-xl p-3 bg-secondary/10 flex flex-col justify-between'>
              <div className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between'>
                <span>Social Card Live Preview</span>
                <span className='text-[10px] text-primary/80 font-mono'>Twitter / LinkedIn</span>
              </div>
              <div className='border border-border/70 rounded-lg overflow-hidden bg-background shadow-xs transition-all'>
                {ogImageUrl ? (
                  <div className='relative w-full h-32 bg-muted flex items-center justify-center overflow-hidden'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ogImageUrl}
                      alt='Social Share Preview'
                      className='w-full h-full object-cover'
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className='w-full h-24 bg-linear-to-r from-primary/10 via-secondary/20 to-primary/5 flex flex-col items-center justify-center gap-1 text-muted-foreground/60 p-2 text-center'>
                    <LuImage className='w-6 h-6 opacity-40' />
                    <span className='text-[11px]'>Using Default Profile Avatar</span>
                  </div>
                )}
                <div className='p-3 space-y-1'>
                  <p className='text-[10px] uppercase font-mono text-muted-foreground tracking-tight'>
                    kytbox.com
                  </p>
                  <p className='text-xs font-bold line-clamp-1 text-foreground'>
                    {metaTitle || 'Your Bio Profile Title'}
                  </p>
                  <p className='text-[11px] text-muted-foreground line-clamp-2 leading-tight'>
                    {metaDescription ||
                      'Your profile summary or bio description will be displayed here on social platforms.'}
                  </p>
                </div>
              </div>
              <div className='text-[10px] text-muted-foreground/70 italic text-center'>
                Preview changes automatically save as you type
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
