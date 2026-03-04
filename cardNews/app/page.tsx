import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">AI 카드뉴스 자동 제작</h1>
        <p className="text-muted-foreground mb-8">
          주제를 입력하면 AI가 리서치부터 카피 작성, 품질 검수, 구조 검토, 최종 이미지 출력까지 전 과정을 자동화합니다.
        </p>
        <Link href="/card-news">
          <Button size="lg">카드뉴스 만들기 시작하기</Button>
        </Link>
      </div>
    </main>
  );
}
