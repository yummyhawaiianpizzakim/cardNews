'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type DesignToken } from '@/components/lib/types';

interface ImageUploadProps {
  /** Called when image is uploaded and analyzed with design token */
  onAnalyze: (base64Image: string, designToken: DesignToken) => void;
  /** Claude API key */
  apiKey: string;
  /** Currently analyzing */
  isAnalyzing?: boolean;
}

export function ImageUpload({ onAnalyze, apiKey, isAnalyzing = false }: ImageUploadProps) {
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (DSGN-01)
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('JPG 또는 PNG 파일만 업로드할 수 있습니다.');
      return;
    }

    setError(null);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setReferenceImage(base64);
      // Trigger analysis (will be handled by parent or DesignTokenExtractor)
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeClick = () => {
    if (referenceImage && apiKey) {
      onAnalyze(referenceImage, null as any); // Will trigger parent to call extractor
    } else if (!referenceImage) {
      setError('이미지를 먼저 업로드해 주세요.');
    } else if (!apiKey) {
      setError('API 키가 필요합니다.');
    }
  };

  const handleReplaceImage = () => {
    setReferenceImage(null);
    setError(null);
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">레퍼런스 이미지</h3>
            <p className="text-sm text-muted-foreground">
              디자인을 적용할 레퍼런스 이미지를 업로드하세요.
            </p>
          </div>

          {!referenceImage ? (
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="text-center space-y-2">
                <div className="text-4xl">📷</div>
                <p className="text-sm font-medium">파일 선택</p>
                <p className="text-xs text-muted-foreground">JPG, PNG (최대 5MB)</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview (DSGN-01 미리보기 필수) */}
              <div className="relative">
                <img
                  src={referenceImage}
                  alt="Reference image"
                  className="w-full max-w-md mx-auto rounded-lg border"
                />
                <Badge variant="outline" className="absolute top-2 right-2">
                  미리보기
                </Badge>
              </div>

              <div className="flex gap-2 justify-center">
                {/* 이미지 변경 (DSGN-01 이미지 변경 가능) */}
                <Button variant="outline" onClick={handleReplaceImage}>
                  이미지 변경
                </Button>
                <Button onClick={handleAnalyzeClick} disabled={isAnalyzing || !apiKey}>
                  {isAnalyzing ? '분석 중...' : '디자인 추출'}
                </Button>
              </div>

              {/* 진행 상태 (DSGN-01 진행 상태 텍스트) */}
              {isAnalyzing && (
                <p className="text-sm text-center text-muted-foreground">
                  분석 중...
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
