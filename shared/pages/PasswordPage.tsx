import { useState } from 'preact/hooks';

import { LoadingOverlay } from '@/shared/components/LoadingOverlay';
import { Alert } from '@/shared/components/ui/Alert';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Input } from '@/shared/components/ui/Input';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { PageLayout } from '@/shared/components/ui/PageLayout';

interface PasswordPageProps {
  error?: string;
}

export function PasswordPage({ error }: PasswordPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');

  const handleSubmit = (e: Event) => {
    if (!password.trim()) {
      e.preventDefault();
      return;
    }
    setIsLoading(true);
  };

  return (
    <PageLayout centered maxWidth="sm">
      {isLoading && <LoadingOverlay message="Verifying..." submessage="Please wait" />}

      <PageHeader icon="receipt" title="Receipt Wrangler" subtitle="Enter password to continue" />

      {error && (
        <Alert variant="error" class="animate-fade-in mb-6">
          {error}
        </Alert>
      )}

      <form method="POST" action="/auth" onSubmit={handleSubmit} class="animate-slide-up">
        <Card class="mb-4">
          <Input
            type="password"
            name="password"
            label="Password"
            value={password}
            onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
            required
            autoFocus
            placeholder="Enter password"
          />
        </Card>

        <Button type="submit" disabled={isLoading}>
          <Icon name="lock" />
          Continue
        </Button>
      </form>
    </PageLayout>
  );
}
