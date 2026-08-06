// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { NewRpmReportRequest } from "../generated-client/models/NewRpmReportRequest";
import { CVE_ID_PATTERN } from "./requestAnalysisValidation";

/** Shown when the package string cannot be split into nonempty name, version, and release (RPM-style split from the right). */
export const RPM_PACKAGE_NVR_FORMAT_ERROR_MESSAGE =
  "Enter the package as name-version-release (for example openssl-3.0.7-5.el9), with hyphens separating all three parts.";

/**
 * Aligned with backend {@code NotCveIdAsRpmNvrValidator.MESSAGE} — CVE pasted into Package N-V-R.
 */
export const RPM_PACKAGE_NVR_CVE_ID_ERROR_MESSAGE =
  "A CVE ID was entered in the Package N-V-R field. Enter the package as name-version-release and put the CVE ID in the CVE ID field.";

export type RpmArchChoice = NewRpmReportRequest["arch"];

export const DEFAULT_RPM_ARCH: RpmArchChoice = "x86_64";

export const RPM_ARCH_CHOICES: readonly RpmArchChoice[] = [
  "x86_64",
  "amd64",
  "aarch64",
  "arm64",
  "ppc64le",
  "s390x",
  "i686",
];

export function isRpmArchChoice(value: string | undefined): value is RpmArchChoice {
  return value !== undefined && RPM_ARCH_CHOICES.includes(value as RpmArchChoice);
}

/** RPM Name: alphanumerics and -, _, ., + (rpm-spec.5). */
const RPM_NAME_PATTERN = /^[a-zA-Z0-9._+-]+$/;

/** RPM Version/Release: alphanumerics, ., _, +, ~, ^ — no hyphen (rpm-version.7). */
const RPM_VERSION_RELEASE_PATTERN = /^[a-zA-Z0-9._+~^]+$/;

function isValidRpmName(value: string): boolean {
  return RPM_NAME_PATTERN.test(value);
}

function isValidRpmVersionOrRelease(value: string): boolean {
  return RPM_VERSION_RELEASE_PATTERN.test(value);
}

/**
 * {@code true} when the trimmed value matches an official CVE id (case-insensitive),
 * i.e. a CVE was pasted into Package N-V-R instead of name-version-release.
 */
export function isCveIdAsPackageNvr(raw: string): boolean {
  const t = raw.trim();
  if (t === "") {
    return false;
  }
  return CVE_ID_PATTERN.test(t.toUpperCase());
}

/** Parses a trimmed RPM N-V-R: release after last hyphen, version before that, name is the leading remainder (may contain hyphens). */
export function parseTrimmedRpmNvr(
  trimmed: string
): { name: string; version: string; release: string } | null {
  const lastHyphen = trimmed.lastIndexOf("-");
  if (lastHyphen <= 0) {
    return null;
  }
  const remainder = trimmed.slice(0, lastHyphen);
  const release = trimmed.slice(lastHyphen + 1).trim();
  const secondHyphen = remainder.lastIndexOf("-");
  if (secondHyphen < 0) {
    return null;
  }
  const name = remainder.slice(0, secondHyphen).trim();
  const version = remainder.slice(secondHyphen + 1).trim();
  if (name === "" || version === "" || release === "") {
    return null;
  }
  if (!isValidRpmName(name) || !isValidRpmVersionOrRelease(version) || !isValidRpmVersionOrRelease(release)) {
    return null;
  }
  return { name, version, release };
}

/**
 * Blur/submit format check for Package N-V-R.
 * Empty yields no format error ("Required" is enforced on submit).
 * Rejects CVE ids pasted into this field (backend {@code @NotCveIdAsRpmNvr}).
 */
export function validateRpmPackageNvrBlur(raw: string): string | null {
  const t = raw.trim();
  if (t === "") {
    return null;
  }
  if (isCveIdAsPackageNvr(t)) {
    return RPM_PACKAGE_NVR_CVE_ID_ERROR_MESSAGE;
  }
  return parseTrimmedRpmNvr(t) ? null : RPM_PACKAGE_NVR_FORMAT_ERROR_MESSAGE;
}
