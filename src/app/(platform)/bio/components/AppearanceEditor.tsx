'use client';

import { useState } from 'react';
import { LuCheck, LuPalette, LuLoader } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { motion } from 'framer-motion';
import { updateAppearance } from '../actions';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { THEME_LIST, type ButtonStyle, type ButtonShape } from '@/lib/theme';

interface AppearanceEditorProps {
  initialTheme: string;
  initialButtonStyle: string;
  initialButtonShape: string;
  onPreviewUpdate: (theme: string, style: string, shape: string) => void;
}

export default function AppearanceEditor({
  initialTheme,
  initialButtonStyle,
  initialButtonShape,
  onPreviewUpdate,
}: AppearanceEditorProps) {
  const router = useRouter();
  const [themeName, setThemeName] = useState(initialTheme);
  const [buttonStyle, setButtonStyle] = useState<ButtonStyle>(
    (initialButtonStyle as ButtonStyle) || 'default',
  );
  const [buttonShape, setButtonShape] = useState<ButtonShape>(
    (initialButtonShape as ButtonShape) || 'rounded',
  );
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = (type: 'theme' | 'style' | 'shape', value: string) => {
    if (type === 'theme') {
      setThemeName(value);
      onPreviewUpdate(value, buttonStyle, buttonShape);
    } else if (type === 'style') {
      setButtonStyle(value as ButtonStyle);
      onPreviewUpdate(themeName, value, buttonShape);
    } else {
      setButtonShape(value as ButtonShape);
      onPreviewUpdate(themeName, buttonStyle, value);
    }
  };

  async function handleSave() {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append('themeName', themeName);
    formData.append('buttonStyle', buttonStyle);
    formData.append('buttonShape', buttonShape);

    const result = await updateAppearance(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    }
    setIsLoading(false);
  }

  // Get preview button class based on theme - uses centralized config
  const getPreviewButtonClass = (themeId: string) => {
    const theme = THEME_LIST.find((t) => t.id === themeId);
    if (!theme) return 'bg-white/15 border-white/25 text-white';
    const { colors } = theme;
    return `${colors.buttonBg} ${colors.buttonBorder} ${colors.buttonText}`;
  };

  return (
    <Card className='border-border bg-card shadow-sm'>
      <CardHeader>
        <CardTitle className='text-lg flex items-center gap-2'>
          <LuPalette className='w-5 h-5 text-primary' />
          Appearance
        </CardTitle>
        <CardDescription>
          Customize your Bio page&apos;s theme and button styles
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4 md:space-y-6'>
        {/* Theme Selection */}
        <div className='space-y-2 sm:space-y-3'>
          <Label className='text-sm font-bold uppercase tracking-wider opacity-60'>
            Background Theme
          </Label>
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3'>
            {THEME_LIST.map((theme) => (
              <button
                key={theme.id}
                type='button'
                onClick={() => handleUpdate('theme', theme.id)}
                className={cn(
                  'relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border-2 transition-all shadow-sm group min-h-[80px] sm:min-h-[100px]',
                  theme.previewClass,
                  themeName === theme.id
                    ? 'border-border ring-2 ring-primary/20'
                    : 'border-border hover:border-foreground/30',
                )}
              >
                <span className='text-[10px] font-bold uppercase tracking-tight mb-2 opacity-80'>
                  {theme.name}
                </span>
                <div
                  className={cn(
                    'w-full h-8 rounded-lg flex items-center justify-center text-[9px] font-medium border',
                    getPreviewButtonClass(theme.id),
                  )}
                >
                  Text
                </div>
                {themeName === theme.id && (
                  <div className='absolute top-1 right-1 bg-green-500 rounded-full p-1 shadow-lg z-10'>
                    <LuCheck className='w-3.5 h-3.5 text-white' />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Button Shape Selection */}
        <div className='space-y-2 sm:space-y-3'>
          <Label className='text-sm font-bold uppercase tracking-wider opacity-60'>
            Button Shape
          </Label>
          <div className='grid grid-cols-2 gap-3'>
            {[
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
                  'relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all bg-secondary/10',
                  buttonShape === shape.id
                    ? 'border-border ring-2 ring-primary/20'
                    : 'border-border hover:border-foreground/30',
                )}
              >
                <div
                  className={cn(
                    'w-full py-2 px-3 text-[10px] font-bold text-center border bg-card text-card-foreground border-border',
                    shape.radius,
                  )}
                >
                  Shape
                </div>
                <span className='text-[10px] uppercase tracking-wider font-bold mt-2 opacity-60'>
                  {shape.name}
                </span>
                {buttonShape === shape.id && (
                  <div className='absolute top-1 right-1 bg-green-500 rounded-full p-1 shadow-lg'>
                    <LuCheck className='w-3.5 h-3.5 text-white' />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Button Style Selection (Fill) */}
        <div className='space-y-2 sm:space-y-3'>
          <Label className='text-sm font-bold uppercase tracking-wider opacity-60'>
            Button Style (Fill)
          </Label>
          <div className='grid grid-cols-2 gap-4'>
            {[
              {
                id: 'default' as ButtonStyle,
                name: 'Solid',
                class: 'bg-card border-border shadow-sm',
              },
              {
                id: 'outline' as ButtonStyle,
                name: 'Transparent',
                class: 'bg-transparent border-2 border-foreground/20',
              },
            ].map((style) => (
              <button
                key={style.id}
                type='button'
                onClick={() => handleUpdate('style', style.id)}
                className={cn(
                  'relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all',
                  buttonStyle === style.id
                    ? 'border-border ring-2 ring-primary/20 bg-primary/5'
                    : 'border-border bg-secondary/10 hover:border-foreground/30',
                )}
              >
                <div
                  className={cn(
                    'w-full py-2.5 px-3 text-[10px] font-bold text-center rounded-lg border flex items-center justify-center h-10',
                    style.class,
                  )}
                >
                  Button
                </div>
                <span className='text-[10px] uppercase tracking-wider font-bold mt-2 opacity-60'>
                  {style.name}
                </span>
                {buttonStyle === style.id && (
                  <div className='absolute top-1 right-1 bg-green-500 rounded-full p-1 shadow-lg'>
                    <LuCheck className='w-3.5 h-3.5 text-white' />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className='p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center'>
            {error}
          </div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className='p-3 rounded-md bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs text-center flex items-center justify-center gap-2'
          >
            <LuCheck className='w-3 h-3' />
            Appearance updated
          </motion.div>
        )}

        {/* Save Button */}
        <div className='pt-2'>
          <Button
            onClick={handleSave}
            disabled={
              isLoading ||
              (themeName === initialTheme &&
                buttonStyle === initialButtonStyle &&
                buttonShape === initialButtonShape)
            }
            className='w-full font-bold uppercase tracking-wider text-xs'
          >
            {isLoading ? (
              <>
                <LuLoader className='mr-2 h-3 w-3 animate-spin' />
                Saving...
              </>
            ) : (
              'Save Appearance'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
