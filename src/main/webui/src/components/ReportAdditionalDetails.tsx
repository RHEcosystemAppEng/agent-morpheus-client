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
  CardTitle,
  CardBody,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Title,
} from "@patternfly/react-core";
import type { ProductSummary } from "../generated-client/models/ProductSummary";
import FormattedTimestamp from "./FormattedTimestamp";
import NotAvailable from "./NotAvailable";
import MetadataDisplay from "./MetadataDisplay";

interface ReportAdditionalDetailsProps {
  product: ProductSummary;
  cardHeight: string;
}

const ReportAdditionalDetails: React.FC<ReportAdditionalDetailsProps> = ({
  product,
  cardHeight,
}) => {
  const completedAt = product.data?.completedAt;
  const metadata = product.data?.metadata;

  return (
    <Card style={{ height: cardHeight, overflowY: "auto" }}>
      <CardTitle>
        <Title headingLevel="h4" size="xl">
          Additional Details
        </Title>
      </CardTitle>
      <CardBody>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>Date Completed</DescriptionListTerm>
            <DescriptionListDescription>
              {completedAt ? (
                <FormattedTimestamp date={completedAt} />
              ) : (
                <NotAvailable />
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Metadata</DescriptionListTerm>
            <DescriptionListDescription>
              <MetadataDisplay metadata={metadata} />
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>
    </Card>
  );
};

export default ReportAdditionalDetails;

