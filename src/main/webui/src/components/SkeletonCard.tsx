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

import { Card, CardBody, Skeleton, Stack, StackItem } from "@patternfly/react-core";

interface SkeletonCardProps {
  /** Number of skeleton lines to display */
  lines?: number;
  /** Width percentages for each skeleton line */
  widths?: string[];
  /** Screen reader text for accessibility */
  screenreaderText?: string;
}

/**
 * Reusable skeleton card component for loading states
 */
const SkeletonCard: React.FC<SkeletonCardProps> = ({
  lines = 3,
  widths = ["30%", "50%", "45%"],
  screenreaderText = "Loading card content",
}) => {
  return (
    <Card>
      <CardBody>
        <Stack hasGutter>
          {Array.from({ length: lines }).map((_, index) => (            
            <StackItem key={index} aria-hidden="true">
              <Skeleton
                width={widths[index] || "50%"}
                screenreaderText={screenreaderText}
              />
              </StackItem>
            ))}
        </Stack>        
      </CardBody>
    </Card>
  );
};

export default SkeletonCard;

