import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isValidBackupId, readBackup } from '@/lib/backup';

// Fetch one backup's full contents (admin only) — used to download or restore it
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== 'scheduler') {
    return NextResponse.json({ error: 'Forbidden: Only administrators can read backups.' }, { status: 403 });
  }

  const { id } = await params;
  if (!isValidBackupId(id)) {
    return NextResponse.json({ error: 'Invalid backup id.' }, { status: 400 });
  }

  try {
    const data = await readBackup(id);
    if (!data) return NextResponse.json({ error: 'Backup not found (it may have expired).' }, { status: 404 });
    return NextResponse.json({ id, data });
  } catch (err) {
    console.error('Failed to read backup:', err);
    return NextResponse.json({ error: 'Could not read this backup.' }, { status: 500 });
  }
}
