import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { PageLayout } from '@/shared/components/ui/PageLayout';

interface ErrorPageProps {
  error: string;
}

export function ErrorPage({ error }: ErrorPageProps) {
  return (
    <PageLayout centered>
      <PageHeader icon="error" iconVariant="error" title="Something went wrong" />

      <Card class="animate-slide-up mb-6">
        <div class="flex items-start gap-3">
          <Icon name="error" class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <p class="text-sm text-slate-600">{error}</p>
        </div>
      </Card>

      <a href="/upload" class="animate-slide-up stagger-1 block">
        <Button>
          <Icon name="arrowLeft" />
          Try Again
        </Button>
      </a>
    </PageLayout>
  );
}
