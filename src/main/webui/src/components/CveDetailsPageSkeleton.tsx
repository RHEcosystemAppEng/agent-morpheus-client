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

import React from "react";
import {
  PageSection,
  Grid,
  GridItem,
  Skeleton,
  Breadcrumb,
  BreadcrumbItem,
} from "@patternfly/react-core";
import SkeletonCard from "./SkeletonCard";

/**
 * Skeleton loading state for the CVE details page
 * Matches the structure of CveDetailsPage content
 */
const CveDetailsPageSkeleton: React.FC = () => {
  return (
    <>
      <PageSection>
        <Grid hasGutter>
          <GridItem>
            <Breadcrumb>
              <BreadcrumbItem>
                <Skeleton width="5rem" screenreaderText="Loading breadcrumb" />
              </BreadcrumbItem>
              <BreadcrumbItem>
                <Skeleton width="8rem" screenreaderText="Loading breadcrumb" />
              </BreadcrumbItem>
            </Breadcrumb>
          </GridItem>
          <GridItem>
            <Skeleton width="15rem" screenreaderText="Loading title" />
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        <Grid hasGutter>
          <GridItem span={6}>
            <SkeletonCard
              lines={3}
              widths={["40%", "60%", "45%"]}
              screenreaderText="Loading description card"
            />
          </GridItem>
          <GridItem span={6}>
            <SkeletonCard
              lines={6}
              widths={["35%", "50%", "45%", "40%", "45%", "50%"]}
              screenreaderText="Loading metadata card"
            />
          </GridItem>
          <GridItem span={6}>
            <SkeletonCard
              lines={3}
              widths={["50%", "65%", "55%"]}
              screenreaderText="Loading vulnerable packages card"
            />
          </GridItem>
          <GridItem span={6}>
            <SkeletonCard
              lines={3}
              widths={["45%", "60%", "50%"]}
              screenreaderText="Loading references card"
            />
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
};

export default CveDetailsPageSkeleton;
