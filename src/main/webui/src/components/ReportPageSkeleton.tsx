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

import {
  PageSection,
  Grid,
  GridItem,
  Skeleton,
  Card,
  CardBody,
} from "@patternfly/react-core";
import SkeletonCard from "./SkeletonCard";

/**
 * Skeleton loading state for the report page
 * Matches the structure of ReportPage content
 */
const ReportPageSkeleton: React.FC = () => {
  return (
    <>
      <PageSection>
        <Grid hasGutter>
          <GridItem>
            <Skeleton width="15%" screenreaderText="Loading breadcrumb" />
          </GridItem>
          <GridItem>
            <Skeleton width="40%" screenreaderText="Loading title" />
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        <Grid hasGutter>
          <GridItem span={6}>
            <SkeletonCard
              widths={["30%", "50%", "45%"]}
              screenreaderText="Loading card content"
            />
          </GridItem>
          <GridItem span={6}>
            <SkeletonCard
              widths={["35%", "60%", "40%"]}
              screenreaderText="Loading card content"
            />
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        <Grid hasGutter>
          <GridItem span={6}>
            <Card>
              <CardBody>
                <Skeleton height="200px" screenreaderText="Loading chart" />
              </CardBody>
            </Card>
          </GridItem>
          <GridItem span={6}>
            <Card>
              <CardBody>
                <Skeleton height="200px" screenreaderText="Loading chart" />
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        <Skeleton height="300px" screenreaderText="Loading table" />
      </PageSection>
    </>
  );
};

export default ReportPageSkeleton;

