import { UploadPage } from "./pages/UploadPage";
import { ReviewPage } from "./pages/ReviewPage";
import { DonePage } from "./pages/DonePage";
import { ErrorPage } from "./pages/ErrorPage";
import type { PageData } from "./types";

export function App() {
  const pageData: PageData = window.__PAGE_DATA__ || { page: "upload" };

  switch (pageData.page) {
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
    case "upload":
    default:
      return <UploadPage error={pageData.error} />;
  }
}
