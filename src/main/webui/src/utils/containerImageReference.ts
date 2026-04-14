import type { FullReportImage } from "../types/FullReport";

/**
 * Builds a container image reference suitable for `podman pull <ref>` / `docker pull <ref>`.
 * Omits source-based reports (git URL in {@code name}) and HTTP(S) URLs that are not image registries.
 */
export function podmanPullImageReference(
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

/**
 * Best-effort HTTPS URL for opening a container image reference in the browser
 * (registry UI or root path); link text remains the pull reference from {@link podmanPullImageReference}.
 */
export function containerImageBrowseUrl(pullReference: string): string {
  const t = pullReference.trim();
  if (/^https?:\/\//i.test(t)) {
    return t;
  }
  let base = t.includes("@") ? (t.split("@")[0] ?? t) : t;
  const colonIdx = base.lastIndexOf(":");
  if (colonIdx > 0) {
    const after = base.slice(colonIdx + 1);
    if (/^[A-Za-z0-9._-]+$/.test(after) && !after.includes("/")) {
      base = base.slice(0, colonIdx);
    }
  }
  if (base.startsWith("quay.io/")) {
    return `https://quay.io/repository/${base.slice("quay.io/".length)}`;
  }
  if (!base.includes("/")) {
    return `https://hub.docker.com/_/${encodeURIComponent(base)}`;
  }
  return `https://${base}`;
}
