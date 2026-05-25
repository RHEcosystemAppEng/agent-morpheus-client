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
import type { FullReportImage } from "../types/FullReport";
import NotAvailable from "./NotAvailable";
import { getPullImageReference } from "../utils/containerImageReference";

/** Base URL for .../commit/{ref} links: no trailing slash or `.git` suffix. */
function normalizeRepoBaseForCommitLink(repo: string): string {
  let s = repo;
  while (s.endsWith("/")) {
    s = s.slice(0, -1);
  }
  if (s.endsWith(".git")) {
    s = s.slice(0, -".git".length);
  }
  while (s.endsWith("/")) {
    s = s.slice(0, -1);
  }
  return s;
}

/**
 * **Repository URL** and **Image** rows for non-RPM repository reports (artifact block under **CVE**).
 */
export function ContainerRepositoryArtifactDetails({
  image,
}: {
  image: FullReportImage | undefined;
}): ReactElement {
  const sourceInfo = image?.source_info || [];
  const codeSource = Array.isArray(sourceInfo)
    ? sourceInfo.find((s) => s?.type === "code")
    : undefined;
  const codeRepository = codeSource?.git_repo;
  const codeRef = codeSource?.ref;
  const repositorySnapshotUrl =
    codeRepository && codeRef
      ? `${normalizeRepoBaseForCommitLink(codeRepository)}/commit/${codeRef}`
      : undefined;
  const imagePullRef = getPullImageReference(image);

  return (
    <>
      <DescriptionListGroup>
        <DescriptionListTerm>Repository URL</DescriptionListTerm>
        <DescriptionListDescription>
          {repositorySnapshotUrl ? (
            <a href={repositorySnapshotUrl} target="_blank" rel="noreferrer">
              {repositorySnapshotUrl}
            </a>
          ) : codeRepository ? (
            <a href={codeRepository} target="_blank" rel="noreferrer">
              {codeRepository}
            </a>
          ) : (
            <NotAvailable />
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Image</DescriptionListTerm>
        <DescriptionListDescription>
          {imagePullRef ?? <NotAvailable />}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </>
  );
}
