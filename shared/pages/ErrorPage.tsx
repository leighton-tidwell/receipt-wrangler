import { PageLayout } from '@/shared/components/ui/PageLayout';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Icon } from '@/shared/components/ui/Icon';

interface ErrorPageProps {
  error: string;
}

export function ErrorPage({ error }: ErrorPageProps) {
  return (
    <PageLayout centered>
      <PageHeader icon="error" iconVariant="error" title="Something went wrong" />

      <Card class="mb-6 animate-slide-up">
        <div class="flex items-start gap-3">
          <Icon name="error" class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p class="text-slate-600 text-sm">{error}</p>
        </div>
      </Card>

      <a href="/upload" class="block animate-slide-up stagger-1">
        <Button>
          <Icon name="arrowLeft" />
          Try Again
        </Button>
      </a>
    </PageLayout>
  );
}
