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

import { Progress, ProgressSize } from "@patternfly/react-core";
import NotAvailable from "./NotAvailable";

interface IntelReliabilityScoreProps {
  score: number | string | null | undefined;
}

/**
 * Component to display Intel Reliability Score with progress bar and confidence level
 */
const IntelReliabilityScore: React.FC<IntelReliabilityScoreProps> = ({
  score,
}) => {
  const isDefined = score !== null && score !== undefined;
  const numeric = Number(score);
  const isNumeric = !Number.isNaN(numeric);

  if (!isDefined || !isNumeric) {
    return <NotAvailable />;
  }

  const confidenceLevel =
    numeric >= 80 ? "high" : numeric >= 50 ? "medium" : "low";

  return (
    <div>
      {isNumeric && (
        <div style={{ marginTop: "0.5rem", maxWidth: "20%" }}>
          <Progress 
            value={numeric} 
            size={ProgressSize.sm}
            aria-label={`Intel Reliability Score: ${numeric}%`}
          />
        </div>
      )}
      <div style={{ marginTop: "0.5rem" }}>
        This score indicates {confidenceLevel} confidence.
      </div>
    </div>
  );
};

export default IntelReliabilityScore;

