// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import type { ReactElement } from "react";
import {
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from "@patternfly/react-core";
import type { RpmTargetPackage } from "../types/FullReport";
import NotAvailable from "./NotAvailable";
import { formatRpmPackageNvr } from "../utils/rpmReport";

/** Replaces repository URL / commit snapshot rows for RPM package checker reports. */
export function RpmTargetPackageArtifactDetails({
  targetPackage,
  rpmPackageUrl,
}: {
  targetPackage: RpmTargetPackage | undefined;
  /** `report.info.checker_context.artifacts.source_url`, trimmed — see {@link getRpmPackageSourceUrl}. */
  rpmPackageUrl?: string;
}): ReactElement {
  const nvr = formatRpmPackageNvr(targetPackage);
  return (
    <>
      <DescriptionListGroup>
        <DescriptionListTerm>Package</DescriptionListTerm>
        <DescriptionListDescription>
          {nvr ?? <NotAvailable />}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Architecture</DescriptionListTerm>
        <DescriptionListDescription>
          {targetPackage?.arch?.trim() ? (
            targetPackage.arch
          ) : (
            <NotAvailable />
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>RPM package URL</DescriptionListTerm>
        <DescriptionListDescription>
          {rpmPackageUrl ? (
            <a href={rpmPackageUrl} target="_blank" rel="noopener noreferrer">
              {rpmPackageUrl}
            </a>
          ) : (
            <NotAvailable />
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </>
  );
}
