import { renderToString } from "preact-render-to-string";
import { App } from "../../shared/App.js";
import type { PageData } from "../../shared/types.js";

export function renderAppToString(pageData: PageData): string {
  return renderToString(<App pageData={pageData} />);
}
