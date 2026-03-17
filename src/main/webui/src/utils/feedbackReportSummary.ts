/**
 * Builds a plain-text summary of a report for use as AI response context in feedback.
 * Matches the format used by the legacy Report page (getReportSummary) so the backend
 * receives the same kind of context: name, image, and per-vuln label, reason, summary, checklist.
 */

import type { FullReport } from "../types/FullReport";

export function getReportSummaryForFeedback(report: FullReport): string {
  if (!report?.input) {
    return "Empty report";
  }

  const lines: string[] = [];
  const name = report.metadata?.product_id ?? report._id ?? "Report";
  const image = report.input.image;

  lines.push(`Name: ${name}`);
  lines.push("");
  if (image?.name) {
    lines.push(`Image: ${image.name}`);
    if (image.tag) {
      lines.push(`Tag: ${image.tag}`);
    }
    lines.push("");
  }

  const analysis = report.output?.analysis ?? [];
  for (const vuln of analysis) {
    lines.push(`Vulnerability: ${vuln.vuln_id ?? ""}`);
    lines.push("");

    if (vuln.justification?.label) {
      lines.push(`Label: ${vuln.justification.label}`);
      lines.push("");
    }
    if (vuln.justification?.reason) {
      lines.push(`Reason: ${vuln.justification.reason}`);
    }
    lines.push("");
    if (vuln.summary) {
      lines.push(`Summary: ${vuln.summary}`);
      lines.push("");
    }
    lines.push("Checklist:");
    if (vuln.checklist?.length) {
      for (const item of vuln.checklist) {
        if (item.input) lines.push(`Q: ${item.input}`);
        if (item.response) lines.push(`A: ${item.response}`);
      }
    }
    lines.push("---");
  }

  return lines.join("\n");
}
