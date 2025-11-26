import { PasswordPage } from "./pages/PasswordPage";
import { UploadPage } from "./pages/UploadPage";
import { ReviewPage } from "./pages/ReviewPage";
import { DonePage } from "./pages/DonePage";
import { ErrorPage } from "./pages/ErrorPage";
import type { PageData } from "./types";

export function App() {
  const pageData: PageData = window.__PAGE_DATA__ || { page: "password" };

  switch (pageData.page) {
    case "password":
      return <PasswordPage error={pageData.error} />;
    case "upload":
      return <UploadPage error={pageData.error} />;
    case "review":
      return (
        <ReviewPage
          receipt={pageData.receipt!}
          imageData={pageData.imageData || []}
          previousInstructions={pageData.previousInstructions}
          receiptText={pageData.receiptText}
          error={pageData.error}
        />
      );
    case "done":
      return <DonePage receipt={pageData.receipt!} />;
    case "error":
      return <ErrorPage error={pageData.error || "An error occurred"} />;
    default:
      return <PasswordPage error={pageData.error} />;
  }
}
