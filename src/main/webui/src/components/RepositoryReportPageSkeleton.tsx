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
  Grid,
  GridItem,
  Skeleton,
} from "@patternfly/react-core";
import SkeletonCard from "./SkeletonCard";

/**
 * Skeleton loading state for the repository report page
 * Matches the structure of RepositoryReportPage content
 */
const RepositoryReportPageSkeleton: React.FC = () => {
  return (
    <Grid hasGutter>
      <GridItem>
        <Skeleton width="50%" screenreaderText="Loading title" />
      </GridItem>
      <GridItem>
        <SkeletonCard
          widths={["40%", "60%", "45%"]}
          screenreaderText="Loading details card"
        />
      </GridItem>
      <GridItem>
        <SkeletonCard
          lines={4}
          widths={["70%", "65%", "80%", "55%"]}
          screenreaderText="Loading checklist card"
        />
      </GridItem>
      <GridItem>
        <SkeletonCard
          widths={["35%", "50%", "45%", "40%"]}
          lines={4}
          screenreaderText="Loading additional details card"
        />
      </GridItem>
    </Grid>
  );
};

export default RepositoryReportPageSkeleton;

