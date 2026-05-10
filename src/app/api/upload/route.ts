import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ error: '请选择文件' }, { status: 400 });
    }

    // Validate file type
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return Response.json(
        { error: '仅支持 PDF 和 DOCX 格式' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: '仅支持 PDF 和 DOCX 格式' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: '文件大小不能超过 10MB' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Sanitize filename to prevent path traversal
    const baseName = path.basename(file.name).replace(/[^a-zA-Z0-9.\u4e00-\u9fff_-]/g, '_');
    const timestamp = Date.now();
    const uniqueName = `${timestamp}-${baseName}`;
    const filePath = path.join(uploadsDir, uniqueName);

    // Verify the resolved path is within uploads directory
    if (!filePath.startsWith(uploadsDir + path.sep) && filePath !== uploadsDir) {
      return Response.json({ error: '文件名无效' }, { status: 400 });
    }

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create resume record in database
    const resume = await prisma.resume.create({
      data: {
        userId: session.user.id,
        fileName: file.name,
        fileUrl: `/uploads/${uniqueName}`,
      },
    });

    return Response.json(resume, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: '上传失败，请重试' }, { status: 500 });
  }
}
