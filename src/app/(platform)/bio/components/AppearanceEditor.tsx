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
  const [buttonStyle, setButtonStyle] = useState(initialButtonStyle);
  const [buttonShape, setButtonShape] = useState(initialButtonShape);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = (type: 'theme' | 'style' | 'shape', value: string) => {
    if (type === 'theme') {
      setThemeName(value);
      onPreviewUpdate(value, buttonStyle, buttonShape);
    } else if (type === 'style') {
      setButtonStyle(value);
      onPreviewUpdate(themeName, value, buttonShape);
    } else {
      setButtonShape(value);
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
      <CardContent className='space-y-6'>
        {/* Theme Selection */}
        <div className='space-y-3'>
          <Label className='text-sm font-bold uppercase tracking-wider opacity-60'>
            Background Theme
          </Label>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
            {[
              {
                id: 'default',
                name: 'Clean Light',
                class: 'bg-background border-border text-foreground',
              },
              {
                id: 'dark',
                name: 'Deep Dark',
                class: 'bg-neutral-950 border-neutral-800 text-white',
              },
              {
                id: 'gradient',
                name: 'Premium Glow',
                class:
                  'bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-900 border-transparent text-white',
              },
              {
                id: 'peach',
                name: 'Peach Sunset',
                class:
                  'bg-gradient-to-br from-orange-400 via-rose-500 to-pink-600 border-transparent text-white',
              },
              {
                id: 'deepsea',
                name: 'Deep Sea',
                class:
                  'bg-gradient-to-br from-teal-500 via-blue-700 to-slate-900 border-transparent text-white',
              },
              {
                id: 'emerald',
                name: 'Emerald Lake',
                class:
                  'bg-gradient-to-br from-emerald-500 via-green-700 to-teal-900 border-transparent text-white',
              },
              {
                id: 'lavender',
                name: 'Soft Lavender',
                class:
                  'bg-gradient-to-br from-violet-200 via-purple-300 to-fuchsia-400 border-transparent text-neutral-800',
              },
              {
                id: 'latte',
                name: 'Creamy Latte',
                class:
                  'bg-gradient-to-br from-orange-50 via-amber-50 to-stone-200 border-transparent text-neutral-800',
              },
              {
                id: 'cyber',
                name: 'Cyber Violet',
                class:
                  'bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950 border-transparent text-white',
              },
            ].map((theme) => (
              <button
                key={theme.id}
                type='button'
                onClick={() => handleUpdate('theme', theme.id)}
                className={`
                  relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all
                  ${themeName === theme.id ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-border/50'}
                  ${theme.class} shadow-sm group min-h-[100px]
                `}
              >
                <span className='text-[10px] font-bold uppercase tracking-tight mb-2 opacity-80'>
                  {theme.name}
                </span>
                <div
                  className={`w-full h-8 rounded-lg flex items-center justify-center text-[9px] font-medium border ${
                    theme.id === 'default'
                      ? 'bg-card border-border text-card-foreground shadow-sm'
                      : theme.id === 'lavender' || theme.id === 'latte'
                        ? 'bg-black/5 border-black/10 text-neutral-900 shadow-sm'
                        : 'bg-white/15 border-white/25 text-white shadow-lg shadow-black/20'
                  }`}
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
        <div className='space-y-3'>
          <Label className='text-sm font-bold uppercase tracking-wider opacity-60'>
            Button Shape
          </Label>
          <div className='grid grid-cols-2 gap-3'>
            {[
              { id: 'rounded', name: 'Rounded', radius: 'rounded-xl' },
              { id: 'square', name: 'Square', radius: 'rounded-none' },
            ].map((shape) => (
              <button
                key={shape.id}
                type='button'
                onClick={() => handleUpdate('shape', shape.id)}
                className={`
                  relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all bg-secondary/10
                  ${buttonShape === shape.id ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-border/50'}
                `}
              >
                <div
                  className={`w-full py-2 px-3 text-[10px] font-bold text-center border bg-card text-card-foreground border-border ${shape.radius}`}
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
        <div className='space-y-3'>
          <Label className='text-sm font-bold uppercase tracking-wider opacity-60'>
            Button Style (Fill)
          </Label>
          <div className='grid grid-cols-2 gap-4'>
            {[
              {
                id: 'default',
                name: 'Solid Fill',
                class: 'bg-card border-border shadow-sm',
              },
              {
                id: 'outline',
                name: 'Outline',
                class: 'bg-transparent border-2 border-foreground/20',
              },
            ].map((style) => (
              <button
                key={style.id}
                type='button'
                onClick={() => handleUpdate('style', style.id)}
                className={`
                  relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all
                  ${buttonStyle === style.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-transparent bg-secondary/10 hover:border-border/50'}
                `}
              >
                <div
                  className={`w-full py-2.5 px-3 text-[10px] font-bold text-center rounded-lg border flex items-center justify-center h-10 ${style.class}`}
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
