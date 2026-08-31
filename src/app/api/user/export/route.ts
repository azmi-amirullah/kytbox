import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, exportRateLimit } from '@/lib/upstash/redis';
import { extractUserData, generateExportZip } from '@/features/settings/data-export';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: 5 export requests per hour per user
    const rateLimit = await checkRateLimit(exportRateLimit, user.id);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many export requests. Please try again later.' },
        { status: 429 },
      );
    }

    const exportData = await extractUserData(user.id, supabase);
    const zipBytes = await generateExportZip(exportData);

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `kytbox-export-${dateStr}.zip`;

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(zipBytes);
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[GDPR Data Export Error]:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
