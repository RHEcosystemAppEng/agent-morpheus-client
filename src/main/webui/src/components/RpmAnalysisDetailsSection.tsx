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
  Card,
  CardBody,
  CardTitle,
  Content,
  Title,
} from "@patternfly/react-core";
import ReactMarkdown from "react-markdown";
import NotAvailable from "./NotAvailable";

interface RpmAnalysisDetailsSectionProps {
  detailsMarkdown?: string | null;
}

const RpmAnalysisDetailsSection: React.FC<RpmAnalysisDetailsSectionProps> = ({
  detailsMarkdown,
}) => (
  <Card>
    <CardTitle>
      <Title headingLevel="h4" size="xl">
        Analysis Details
      </Title>
    </CardTitle>
    <CardBody>
      {detailsMarkdown?.trim() ? (
        <Content>
          <ReactMarkdown>{detailsMarkdown.trim()}</ReactMarkdown>
        </Content>
      ) : (
        <NotAvailable />
      )}
    </CardBody>
  </Card>
);

export default RpmAnalysisDetailsSection;
