// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { NewRpmReportRequest } from "../generated-client/models/NewRpmReportRequest";

/** Shown when the package string cannot be split into nonempty name, version, and release (RPM-style split from the right). */
export const RPM_PACKAGE_NVR_FORMAT_ERROR_MESSAGE =
  "Enter the package as name-version-release (for example openssl-3.0.7-5.el9), with hyphens separating all three parts.";

export type RpmArchChoice = NewRpmReportRequest["arch"];

export const DEFAULT_RPM_ARCH: RpmArchChoice = "x86_64";

export const RPM_ARCH_CHOICES: readonly RpmArchChoice[] = ["x86_64", "amd64", "aarch64", "arm64", "ppc64le", "s390x"];

export function isRpmArchChoice(value: string | undefined): value is RpmArchChoice {
  return value !== undefined && RPM_ARCH_CHOICES.includes(value as RpmArchChoice);
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
  return { name, version, release };
}

/** Blur-only: empty yields no format error ("Required" is enforced on submit). */
export function validateRpmPackageNvrBlur(raw: string): string | null {
  const t = raw.trim();
  if (t === "") {
    return null;
  }
  return parseTrimmedRpmNvr(t) ? null : RPM_PACKAGE_NVR_FORMAT_ERROR_MESSAGE;
}
