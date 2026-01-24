import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export const getProfileByUsername = cache(async (username: string) => {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  return profile;
});
