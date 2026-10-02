import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isCloudStoreConfigured } from '@/lib/store';
import { createBackup, listBackups } from '@/lib/backup';

async function requireAdmin() {
  const session = await getSession();
  return session?.role === 'scheduler';
}

// List stored backups (admin only)
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden: Only administrators can view backups.' }, { status: 403 });
  }
  try {
    return NextResponse.json({ enabled: isCloudStoreConfigured, backups: await listBackups() });
  } catch (err) {
    console.error('Failed to list backups:', err);
    return NextResponse.json({ error: 'Could not load the list of backups.' }, { status: 500 });
  }
}

// Create a backup right now (admin only)
export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden: Only administrators can create backups.' }, { status: 403 });
  }
  try {
    const backup = await createBackup('manual');
    return NextResponse.json({ success: true, backup });
  } catch (err) {
    console.error('Failed to create backup:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not create a backup.' },
      { status: 500 }
    );
  }
}
