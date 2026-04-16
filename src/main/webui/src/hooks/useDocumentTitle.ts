import { useEffect } from "react";

/**
 * Sets `document.title` while this component is mounted; updates when `title` changes.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
