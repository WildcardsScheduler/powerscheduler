import { NextResponse } from 'next/server';
import { safeEqual } from '@/lib/auth';
import { createBackup } from '@/lib/backup';

// Daily backup, triggered by Vercel Cron (see vercel.json). Vercel sends
// "Authorization: Bearer <CRON_SECRET>" when the CRON_SECRET env var is set.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization') || '';
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const backup = await createBackup('cron');
    return NextResponse.json({ success: true, backup });
  } catch (err) {
    console.error('Scheduled backup failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Backup failed' },
      { status: 500 }
    );
  }
}
