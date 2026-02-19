import { useState, useEffect } from 'react';
import { LuCheck, LuPalette, LuShare2, LuChevronRight } from 'react-icons/lu';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { updateAppearance } from '../actions';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { THEME_LIST, type ButtonStyle, type ButtonShape } from '@/lib/theme';
import type { ThemeCategory } from '@/lib/theme/theme.types';

interface AppearanceEditorProps {
  initialTheme: string;
  initialButtonStyle: string;
  initialButtonShape: string;
  initialSocialLinks: Record<string, string>;
  isLoading?: boolean;
  onPreviewUpdate: (
    theme: string,
    style: string,
    shape: string,
    social: Record<string, string>,
  ) => void;
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
];

function StatusIndicator({
  status,
}: {
  status: 'idle' | 'saving' | 'saved' | 'error';
}) {
  return (
    <div className='flex items-center gap-2 text-xs font-medium min-h-[20px]'>
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
  );
}

function SavingBar({
  status,
}: {
  status: 'idle' | 'saving' | 'saved' | 'error';
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
  );
}

export default function AppearanceEditor({
  initialTheme,
  initialButtonStyle,
  initialButtonShape,
  initialSocialLinks,
  isLoading,
  onPreviewUpdate,
}: AppearanceEditorProps) {
  const router = useRouter();
  const [themeName, setThemeName] = useState(initialTheme);
  const [buttonStyle, setButtonStyle] = useState<ButtonStyle>(
    (initialButtonStyle as ButtonStyle) ?? 'default',
  );
  const [buttonShape, setButtonShape] = useState<ButtonShape>(
    (initialButtonShape as ButtonShape) ?? 'rounded',
  );
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
    initialSocialLinks || {},
  );

  const initialCategory =
    THEME_LIST.find((t) => t.id === initialTheme)?.category ?? null;
  const [activeCategory, setActiveCategory] = useState<ThemeCategory | null>(
    initialCategory,
  );
  const [prevCategory, setPrevCategory] = useState(initialCategory);
  if (initialCategory !== prevCategory) {
    setPrevCategory(initialCategory);
    if (initialCategory) setActiveCategory(initialCategory);
  }
  const [error, setError] = useState<string | null>(null);
  const [appearanceStatus, setAppearanceStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const [socialStatus, setSocialStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');

  const themeCategories: ThemeCategory[] = ['solid', 'gradient', 'soft'];

  // Appearance Auto-save
  useEffect(() => {
    if (
      themeName === initialTheme &&
      buttonStyle === initialButtonStyle &&
      buttonShape === initialButtonShape
    ) {
      return;
    }

    const timer = setTimeout(async () => {
      setAppearanceStatus('saving');
      const startTime = Date.now();

      const formData = new FormData();
      formData.append('themeName', themeName);
      formData.append('buttonStyle', buttonStyle);
      formData.append('buttonShape', buttonShape);
      formData.append('socialLinks', JSON.stringify(socialLinks));

      const result = await updateAppearance(formData);

      const elapsed = Date.now() - startTime;
      const minDuration = 500;
      if (elapsed < minDuration) {
        await new Promise((resolve) =>
          setTimeout(resolve, minDuration - elapsed),
        );
      }

      if (result.error) {
        setAppearanceStatus('error');
        setError(result.error);
      } else {
        setAppearanceStatus('saved');
        setError(null);
        router.refresh();
        setTimeout(() => setAppearanceStatus('idle'), 2000);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    themeName,
    buttonStyle,
    buttonShape,
    initialTheme,
    initialButtonStyle,
    initialButtonShape,
    socialLinks,
    router,
  ]);

  // Social Links Auto-save
  useEffect(() => {
    const isSocialChanged =
      JSON.stringify(socialLinks) !== JSON.stringify(initialSocialLinks);

    if (!isSocialChanged) {
      return;
    }

    const timer = setTimeout(async () => {
      setSocialStatus('saving');
      const startTime = Date.now();

      const formData = new FormData();
      formData.append('themeName', themeName);
      formData.append('buttonStyle', buttonStyle);
      formData.append('buttonShape', buttonShape);
      formData.append('socialLinks', JSON.stringify(socialLinks));

      const result = await updateAppearance(formData);

      const elapsed = Date.now() - startTime;
      const minDuration = 500;
      if (elapsed < minDuration) {
        await new Promise((resolve) =>
          setTimeout(resolve, minDuration - elapsed),
        );
      }

      if (result.error) {
        setSocialStatus('error');
        setError(result.error);
      } else {
        setSocialStatus('saved');
        setError(null);
        router.refresh();
        setTimeout(() => setSocialStatus('idle'), 2000);
      }
    }, 1000); // Longer debounce for typing

    return () => clearTimeout(timer);
  }, [
    socialLinks,
    initialSocialLinks,
    themeName,
    buttonStyle,
    buttonShape,
    router,
  ]);

  const handleUpdate = (
    type: 'theme' | 'style' | 'shape' | 'social',
    value: string | Record<string, string>,
  ) => {
    if (type === 'theme') {
      const themeId = value as string;
      setThemeName(themeId);
      setAppearanceStatus('idle');
      onPreviewUpdate(themeId, buttonStyle, buttonShape, socialLinks);
    } else if (type === 'style') {
      const style = value as ButtonStyle;
      setButtonStyle(style);
      setAppearanceStatus('idle');
      onPreviewUpdate(themeName, style, buttonShape, socialLinks);
    } else if (type === 'shape') {
      const shape = value as ButtonShape;
      setButtonShape(shape);
      setAppearanceStatus('idle');
      onPreviewUpdate(themeName, buttonStyle, shape, socialLinks);
    } else if (type === 'social') {
      const social = value as Record<string, string>;
      const newSocial = { ...socialLinks, ...social };
      setSocialLinks(newSocial);
      setSocialStatus('idle');
      onPreviewUpdate(themeName, buttonStyle, buttonShape, newSocial);
    }
  };

  const getPreviewButtonClass = (themeId: string) => {
    const theme = THEME_LIST.find((t) => t.id === themeId);
    if (!theme) return 'bg-white/15 border-white/25 text-white';
    const { colors } = theme;
    return `${colors.buttonBg} ${colors.buttonBorder} ${colors.buttonText}`;
  };

  const filteredThemes = activeCategory
    ? THEME_LIST.filter((t) => t.category === activeCategory)
    : [];

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
            <div className='flex items-center justify-between'>
              <Label className='text-sm font-bold uppercase tracking-wider opacity-60'>
                Background Theme
              </Label>
              <div className='flex bg-muted p-1 rounded-lg gap-1'>
                {themeCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      'px-3 py-1 text-[10px] font-bold uppercase tracking-tight rounded-md transition-all cursor-pointer',
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

            <div
              key={activeCategory ?? 'empty'}
              className='grid grid-cols-2 sm:grid-cols-3 gap-3 animate-in fade-in duration-150'
            >
              {filteredThemes.length === 0
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className='flex flex-col items-center justify-center p-3 rounded-xl border-2 border-border/50 min-h-[90px] bg-secondary/50'
                    >
                      <Skeleton className='h-3 w-12 rounded mb-2' />
                      <Skeleton className='w-full h-6 rounded' />
                    </div>
                  ))
                : filteredThemes.map((theme) => (
                    <button
                      key={theme.id}
                      type='button'
                      onClick={() => handleUpdate('theme', theme.id)}
                      className={cn(
                        'relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all shadow-sm group min-h-[90px] cursor-pointer',
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
                        <Skeleton className='w-full h-8 rounded' />
                      </div>
                    ))
                  : [
                      {
                        id: 'rounded' as ButtonShape,
                        name: 'Rounded',
                        radius: 'rounded-xl',
                      },
                      {
                        id: 'pill' as ButtonShape,
                        name: 'Pill',
                        radius: 'rounded-full',
                      },
                      {
                        id: 'leaf' as ButtonShape,
                        name: 'Leaf',
                        radius: 'rounded-tr-2xl rounded-bl-2xl',
                      },
                      {
                        id: 'square' as ButtonShape,
                        name: 'Square',
                        radius: 'rounded-none',
                      },
                    ].map((shape) => (
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
                        <Skeleton className='w-full h-8 rounded' />
                      </div>
                    ))
                  : [
                      {
                        id: 'default' as ButtonStyle,
                        name: 'Solid',
                        class: 'bg-card border-border shadow-sm',
                      },
                      {
                        id: 'transparent' as ButtonStyle,
                        name: 'Transparent',
                        class: 'bg-transparent border-2 border-foreground/20',
                      },
                    ].map((style) => (
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
    </div>
  );
}
