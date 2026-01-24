'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  LuUser,
  LuMail,
  LuFileText,
  LuCamera,
  LuTrash2,
  LuLoader,
  LuCheck,
  LuInfo,
} from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  updateProfile,
  uploadAvatar,
  removeAvatar,
  checkUsername,
} from './actions';
import { getAvatarUrl } from '@/lib/avatar';

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

interface SettingsFormProps {
  profile: Profile;
  email: string;
}

export default function SettingsForm({ profile, email }: SettingsFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Username availability
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken'
  >('idle');
  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check username availability with debounce
  useEffect(() => {
    // Skip if same as current username
    if (username.toLowerCase() === profile.username.toLowerCase()) {
      queueMicrotask(() => setUsernameStatus('idle'));
      return;
    }

    // Clear previous timeout
    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }

    // Validate format first (UKIT spec: a-z, 0-9, hyphen)
    if (username.length < 3 || !/^[a-z0-9-]+$/.test(username)) {
      queueMicrotask(() => setUsernameStatus('idle'));
      return;
    }

    queueMicrotask(() => setUsernameStatus('checking'));

    // Debounce: check after 500ms of no typing
    usernameTimeoutRef.current = setTimeout(async () => {
      const result = await checkUsername(username);
      setUsernameStatus(result.available ? 'available' : 'taken');
    }, 500);

    return () => {
      if (usernameTimeoutRef.current) {
        clearTimeout(usernameTimeoutRef.current);
      }
    };
  }, [username, profile.username, profile.id]);

  const currentAvatarUrl = getAvatarUrl(avatarUrl);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append('username', username);
    formData.append('displayName', displayName);
    formData.append('bio', bio);

    const result = await updateProfile(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    }
    setIsLoading(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    // Client-side compression using canvas
    const compressedFile = await compressImage(file, 200, 0.8);

    const formData = new FormData();
    formData.append('avatar', compressedFile);

    const result = await uploadAvatar(formData);

    if (result.error) {
      setError(result.error);
    } else if (result.url) {
      setAvatarUrl(result.url);
      router.refresh();
    }
    setIsUploading(false);
  }

  async function handleRemoveAvatar() {
    setIsUploading(true);
    setError(null);

    const result = await removeAvatar();

    if (result.error) {
      setError(result.error);
    } else {
      setAvatarUrl(null);
      router.refresh();
    }
    setIsUploading(false);
  }

  return (
    <div className='space-y-6'>
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Profile Picture</CardTitle>
          <CardDescription>Upload a profile picture</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-6'>
            <div className='relative'>
              <div className='w-24 h-24 rounded-full overflow-hidden bg-muted ring-2 ring-border flex items-center justify-center'>
                {currentAvatarUrl ? (
                  <Image
                    src={currentAvatarUrl}
                    alt='Avatar'
                    width={96}
                    height={96}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <span className='text-muted-foreground text-3xl font-semibold'>
                    {(displayName || profile.username).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {isUploading && (
                <div className='absolute inset-0 flex items-center justify-center bg-background/80 rounded-full'>
                  <LuLoader className='w-6 h-6 animate-spin' />
                </div>
              )}
            </div>
            <div className='flex flex-col gap-2'>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                onChange={handleAvatarUpload}
                className='hidden'
              />
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <LuCamera className='w-4 h-4 mr-2' />
                Upload Photo
              </Button>
              {avatarUrl && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleRemoveAvatar}
                  disabled={isUploading}
                  className='text-destructive hover:text-destructive'
                >
                  <LuTrash2 className='w-4 h-4 mr-2' />
                  Remove
                </Button>
              )}
              <p className='text-xs text-muted-foreground'>
                Max 2MB. Will be resized to 200x200.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Profile Information</CardTitle>
          <CardDescription>Update your public profile details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Email (read-only) */}
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <div className='relative'>
                <LuMail className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  id='email'
                  value={email}
                  disabled
                  className='pl-9 bg-muted'
                />
              </div>
            </div>

            {/* Username */}
            <div className='space-y-1'>
              <Label htmlFor='username' className='gap-0.5'>
                Username<span className='text-destructive'>*</span>
              </Label>
              <div className='flex'>
                <span className='inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm'>
                  ukit.app/
                </span>
                <div className='relative flex-1'>
                  <Input
                    id='username'
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder='username'
                    className='rounded-l-none pr-9'
                    required
                    minLength={3}
                    maxLength={20}
                    pattern='[a-z0-9-]+'
                  />
                  {/* Status indicator */}
                  <div className='absolute right-3 top-2.5'>
                    {usernameStatus === 'checking' && (
                      <LuLoader className='h-4 w-4 animate-spin text-muted-foreground' />
                    )}
                    {usernameStatus === 'available' && (
                      <LuCheck className='h-4 w-4 text-green-500' />
                    )}
                    {usernameStatus === 'taken' && (
                      <LuInfo className='h-4 w-4 text-destructive' />
                    )}
                  </div>
                </div>
              </div>
              {usernameStatus === 'taken' ? (
                <p className='text-xs text-destructive px-1'>
                  Username already taken
                </p>
              ) : (
                <p className='text-xs text-muted-foreground px-1'>
                  This is your public page URL
                </p>
              )}
            </div>

            {/* Display Name */}
            <div className='space-y-2'>
              <Label htmlFor='displayName' className='gap-0.5'>
                Display Name<span className='text-destructive'>*</span>
              </Label>
              <div className='relative'>
                <LuUser className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  id='displayName'
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder='Your Name'
                  className='pl-9'
                  required
                  maxLength={50}
                />
              </div>
            </div>

            {/* Bio */}
            <div className='space-y-2'>
              <Label htmlFor='bio'>Bio</Label>
              <div className='relative'>
                <LuFileText className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                <Textarea
                  id='bio'
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder='Tell us about yourself...'
                  className='pl-9 min-h-[100px] resize-none'
                  maxLength={160}
                />
              </div>
              <p className='text-xs text-muted-foreground text-right'>
                {bio.length}/160
              </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className='p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center'
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className='p-3 rounded-md bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm text-center flex items-center justify-center gap-2'
              >
                <LuCheck className='w-4 h-4' />
                Profile updated successfully
              </motion.div>
            )}

            {/* Submit Button */}
            <Button type='submit' disabled={isLoading} className='w-full'>
              {isLoading ? (
                <>
                  <LuLoader className='mr-2 h-4 w-4 animate-spin' />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper: Compress image client-side
async function compressImage(
  file: File,
  maxSize: number,
  quality: number,
): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = maxSize;
        canvas.height = maxSize;

        const ctx = canvas.getContext('2d')!;

        // Draw image centered and cropped to square
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, maxSize, maxSize);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality,
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
