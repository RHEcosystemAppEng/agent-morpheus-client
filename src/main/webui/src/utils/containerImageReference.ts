import type { FullReportImage } from "../types/FullReport";

/**
 * Builds a container image reference suitable for `podman pull`, `docker pull`, or any OCI-compatible pull.
 * Returns {@code undefined} for source-based reports (git URL in {@code name}) and bare HTTP(S) URLs that are not registry references.
 */
export function getPullImageReference(
  image: FullReportImage | undefined
): string | undefined {
  if (!image) {
    return undefined;
  }
  const name = image.name?.trim();
  if (!name) {
    return undefined;
  }
  /** Source-based reports store a git URL in {@code name}; not a container image reference. */
  if (image.analysis_type === "source" || /^https?:\/\//i.test(name)) {
    return undefined;
  }
  const tag = image.tag?.trim() ?? "";
  if (!tag) {
    return name;
  }
  if (/^sha256:[a-fA-F0-9]+$/i.test(tag)) {
    return `${name}@${tag}`;
  }
  return `${name}:${tag}`;
}
