import { useState } from "preact/hooks";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { PageLayout } from "../components/ui/PageLayout";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { Icon } from "../components/ui/Icon";

interface PasswordPageProps {
  error?: string;
}

export function PasswordPage({ error }: PasswordPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");

  const handleSubmit = (e: Event) => {
    if (!password.trim()) {
      e.preventDefault();
      return;
    }
    setIsLoading(true);
  };

  return (
    <PageLayout centered maxWidth="sm">
      {isLoading && (
        <LoadingOverlay message="Verifying..." submessage="Please wait" />
      )}

      <PageHeader
        icon="receipt"
        title="Receipt Wrangler"
        subtitle="Enter password to continue"
      />

      {error && (
        <Alert variant="error" class="mb-6 animate-fade-in">
          {error}
        </Alert>
      )}

      <form
        method="POST"
        action="/auth"
        onSubmit={handleSubmit}
        class="animate-slide-up"
      >
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
