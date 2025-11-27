import { PasswordPage } from '@/shared/pages/PasswordPage';
import { UploadPage } from '@/shared/pages/UploadPage';
import { ReviewPage } from '@/shared/pages/ReviewPage';
import { DonePage } from '@/shared/pages/DonePage';
import { ErrorPage } from '@/shared/pages/ErrorPage';
import type { PageData } from '@/shared/types';

interface AppProps {
  pageData: PageData;
}

export function App({ pageData }: AppProps) {
  switch (pageData.page) {
    case 'password':
      return <PasswordPage error={pageData.error} />;
    case 'upload':
      return <UploadPage error={pageData.error} />;
    case 'review':
      return (
        <ReviewPage
          receipt={pageData.receipt!}
          imageData={pageData.imageData || []}
          previousInstructions={pageData.previousInstructions}
          receiptText={pageData.receiptText}
          error={pageData.error}
        />
      );
    case 'done':
      return <DonePage receipt={pageData.receipt!} />;
    case 'error':
      return <ErrorPage error={pageData.error || 'An error occurred'} />;
    default:
      return <PasswordPage error={pageData.error} />;
  }
}
