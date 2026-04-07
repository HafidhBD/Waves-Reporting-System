import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { uploadToSynology } from '@/lib/synology-storage';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'لم يتم تحديد ملف' }, { status: 400 });
    }

    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760');
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'حجم الملف كبير جداً' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}-${safeName}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    // Backup to Synology NAS (non-blocking)
    uploadToSynology(fileName, buffer).catch((err) =>
      console.error('[Synology] Background backup failed:', err)
    );

    return NextResponse.json({
      fileName,
      fileUrl: `/api/uploads/${fileName}`,
      fileType: file.type,
      fileSize: file.size,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء رفع الملف' }, { status: 500 });
  }
}
