'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { CardNewsResponse } from '@/components/lib/types';

interface ResearchFormProps {
  apiKey: string;
  onGenerate: (data: CardNewsResponse) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export function ResearchForm({ apiKey, onGenerate, onLoadingChange }: ResearchFormProps) {
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    // Validate inputs
    const trimmedTopic = topic.trim();
    const trimmedAudience = audience.trim();

    if (!trimmedTopic || !trimmedAudience) {
      setError('주제와 타깃 독자를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    onLoadingChange?.(true);

    try {
      const response = await fetch('/api/anthropic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: trimmedTopic,
          audience: trimmedAudience,
          apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '카드뉴스 생성에 실패했습니다.');
      }

      const data: CardNewsResponse = await response.json();
      onGenerate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">카드뉴스 생성</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="topic">주제</Label>
          <Textarea
            id="topic"
            placeholder="예: 건강한 식습관의 중요성"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isLoading}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="audience">타깃 독자</Label>
          <Textarea
            id="audience"
            placeholder="예: 30대 직장인, 건강에 관심 있는 일반인"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            disabled={isLoading}
            rows={3}
          />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Progress value={undefined} className="h-2" />
          <p className="text-sm text-muted-foreground">생성 중...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isLoading || !topic.trim() || !audience.trim()}
        className="w-full"
        size="lg"
      >
        {isLoading ? '생성 중...' : '생성하기'}
      </Button>
    </div>
  );
}
