import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  const username = process.env.E2E_TEST_USERNAME || 'test';
  console.log(`Looking up user for username: ${username}...`);

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', username)
    .single();

  if (profileErr || !profile) {
    console.error('Could not find test profile:', profileErr?.message);
    return;
  }

  const userId = profile.id;
  console.log(`Found test profile id: ${userId} (${profile.username})`);

  // 1. Clean test links: any link starting with E2E, DnD, Toggle, Root, Folder, Pin, Analytics, Future, Past, Active, etc.
  const { data: allLinks, error: linksErr } = await supabase
    .from('links')
    .select('id, title, is_folder')
    .eq('user_id', userId);

  if (linksErr) {
    console.error('Error fetching links:', linksErr);
  } else {
    console.log(`Total links currently in account: ${allLinks.length}`);
    const testLinkIds = allLinks
      .filter((l) => {
        const t = l.title || '';
        return (
          t.startsWith('E2E') ||
          t.startsWith('DnD') ||
          t.startsWith('Toggle Test') ||
          t.startsWith('Root Link') ||
          t.startsWith('Folder Logic') ||
          t.startsWith('Pin ') ||
          t.startsWith('Analytics Link') ||
          t.startsWith('Future Item') ||
          t.startsWith('Past Expiry') ||
          t.startsWith('Active Window') ||
          /\d{10,}/.test(t)
        );
      })
      .map((l) => l.id);

    console.log(`Found ${testLinkIds.length} test links to clean up.`);
    if (testLinkIds.length > 0) {
      const { error: delErr } = await supabase
        .from('links')
        .delete()
        .in('id', testLinkIds);
      if (delErr) {
        console.error('Error deleting test links:', delErr);
      } else {
        console.log(`Successfully deleted ${testLinkIds.length} test links!`);
      }
    }
  }

  // 2. Clean test cashflow books & entries
  const { data: cashflowBooks } = await supabase
    .from('cashflows')
    .select('id, title')
    .eq('user_id', userId);

  if (cashflowBooks && cashflowBooks.length > 0) {
    const testBookIds = cashflowBooks
      .filter((b) => (b.title || '').startsWith('E2E') || /\d{10,}/.test(b.title || ''))
      .map((b) => b.id);
    if (testBookIds.length > 0) {
      console.log(`Found ${testBookIds.length} test cashflow books to clean up.`);
      await supabase.from('cashflow_entries').delete().in('cashflow_id', testBookIds);
      await supabase.from('cashflows').delete().in('id', testBookIds);
      console.log(`Successfully cleaned ${testBookIds.length} test cashflow books.`);
    }
  }

  // 3. Clean test lists / boards
  const { data: lists } = await supabase
    .from('lists')
    .select('id, title')
    .eq('user_id', userId);

  if (lists && lists.length > 0) {
    const testListIds = lists
      .filter((l) => (l.title || '').startsWith('E2E') || (l.title || '').startsWith('Sprint Board') || /\d{10,}/.test(l.title || ''))
      .map((l) => l.id);
    if (testListIds.length > 0) {
      console.log(`Found ${testListIds.length} test lists to clean up.`);
      await supabase.from('list_cards').delete().in('list_id', testListIds);
      await supabase.from('list_columns').delete().in('list_id', testListIds);
      await supabase.from('lists').delete().in('id', testListIds);
      console.log(`Successfully cleaned ${testListIds.length} test lists.`);
    }
  }

  console.log('Cleanup finished!');
}

cleanup().catch(console.error);
