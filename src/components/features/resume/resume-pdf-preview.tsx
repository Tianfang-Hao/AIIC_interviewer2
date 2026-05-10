'use client';

import { PDFViewer } from '@react-pdf/renderer';
import { ResumePDFTemplate } from '@/components/features/resume/resume-pdf-template';
import type { ParsedResume } from '@/lib/ai/resume-parser';

interface PDFPreviewProps {
  data: ParsedResume;
}

export default function ResumePDFPreview({ data }: PDFPreviewProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <PDFViewer
        width="100%"
        height={700}
        showToolbar={true}
        style={{ border: 'none' }}
      >
        <ResumePDFTemplate data={data} />
      </PDFViewer>
    </div>
  );
}
