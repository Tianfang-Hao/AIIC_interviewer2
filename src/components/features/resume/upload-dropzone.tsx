'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

type UploadState = 'idle' | 'selected' | 'uploading' | 'success' | 'error';

export function UploadDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return '仅支持 PDF 和 DOCX 格式';
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
      return '仅支持 PDF 和 DOCX 格式';
    }
    if (file.size > MAX_FILE_SIZE) {
      return '文件大小不能超过 10MB';
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setState('error');
        return;
      }
      setSelectedFile(file);
      setError('');
      setState('selected');
    },
    [validateFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleUpload = useCallback(() => {
    if (!selectedFile) return;

    setState('uploading');
    setProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setState('success');
        setProgress(100);
        // Redirect to resumes list after a brief delay
        setTimeout(() => {
          router.push('/resumes');
          router.refresh();
        }, 1500);
      } else {
        let message = '上传失败，请重试';
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.error) {
            message = response.error;
          }
        } catch {
          // Use default message
        }
        setError(message);
        setState('error');
      }
    });

    xhr.addEventListener('error', () => {
      setError('网络错误，请检查网络连接后重试');
      setState('error');
    });

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  }, [selectedFile, router]);

  const handleReset = useCallback(() => {
    setState('idle');
    setSelectedFile(null);
    setProgress(0);
    setError('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>上传简历</CardTitle>
        <CardDescription>支持 PDF 和 DOCX 格式，文件大小不超过 10MB</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (state === 'idle' || state === 'error') {
              inputRef.current?.click();
            }
          }}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
            isDragging && 'border-primary bg-primary/5',
            state === 'idle' &&
              'cursor-pointer border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
            state === 'error' &&
              'cursor-pointer border-destructive/50 bg-destructive/5',
            state === 'selected' && 'border-primary/50 bg-primary/5',
            state === 'uploading' && 'border-primary/50 bg-primary/5',
            state === 'success' && 'border-green-500/50 bg-green-50 dark:bg-green-950/20'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleInputChange}
            className="hidden"
          />

          {/* Idle state */}
          {state === 'idle' && (
            <>
              <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="mb-1 text-sm font-medium">
                拖拽文件到此处，或点击选择文件
              </p>
              <p className="text-xs text-muted-foreground">
                支持 PDF、DOCX 格式，最大 10MB
              </p>
            </>
          )}

          {/* File selected state */}
          {state === 'selected' && selectedFile && (
            <>
              <FileText className="mb-3 h-10 w-10 text-primary" />
              <p className="mb-1 text-sm font-medium">{selectedFile.name}</p>
              <p className="mb-4 text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
              <div className="flex gap-2">
                <Button onClick={handleUpload} size="sm">
                  开始上传
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  variant="outline"
                  size="sm"
                >
                  重新选择
                </Button>
              </div>
            </>
          )}

          {/* Uploading state */}
          {state === 'uploading' && (
            <>
              <Upload className="mb-3 h-10 w-10 animate-pulse text-primary" />
              <p className="mb-3 text-sm font-medium">正在上传...</p>
              {/* Progress bar */}
              <div className="mb-1 h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{progress}%</p>
            </>
          )}

          {/* Success state */}
          {state === 'success' && (
            <>
              <CheckCircle className="mb-3 h-10 w-10 text-green-600 dark:text-green-400" />
              <p className="mb-1 text-sm font-medium text-green-700 dark:text-green-300">
                上传成功！
              </p>
              <p className="text-xs text-muted-foreground">
                正在跳转到简历列表...
              </p>
            </>
          )}

          {/* Error state */}
          {state === 'error' && (
            <>
              <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
              <p className="mb-1 text-sm font-medium text-destructive">
                {error}
              </p>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                <X className="mr-1 h-3 w-3" />
                重试
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
