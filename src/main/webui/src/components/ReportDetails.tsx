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
  Grid,
  GridItem,
  Title,
} from "@patternfly/react-core";
import { Link } from "react-router";
import type { ProductSummary } from "../generated-client/models/ProductSummary";
import { getRepositoriesAnalyzedFromProduct } from "../utils/repositoriesAnalyzed";

interface ReportDetailsProps {
  product: ProductSummary;
  cveId: string;
  cardHeight: string;
}

const ReportDetails: React.FC<ReportDetailsProps> = ({ product, cveId, cardHeight }) => {
  const name = product.data?.name || "";
  const { getDisplay, submittedCount } = getRepositoriesAnalyzedFromProduct(product);
  const repositoriesAnalyzed = getDisplay();
  const numExcluded =
    product.summary?.statusCounts?.["excluded"] ??
    product.data?.submissionFailures?.length ??
    0;
  const numSubmitted = submittedCount;
  const excludedValue = `${numExcluded}/${numSubmitted}`;
  const productId = product.data?.id;

  return (
    <Card style={{ height: cardHeight, overflowY: "auto" }}>
      <CardTitle>
        <Title headingLevel="h4" size="xl">
          Report Details
        </Title>
      </CardTitle>
      <CardBody>
        <Grid hasGutter>
          <GridItem span={6}>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>CVE Analyzed</DescriptionListTerm>
                <DescriptionListDescription>{cveId}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Report name</DescriptionListTerm>
                <DescriptionListDescription>{name}</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </GridItem>
          <GridItem span={6}>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>
                  Number of repositories analyzed
                </DescriptionListTerm>
                <DescriptionListDescription>
                  {repositoriesAnalyzed}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Excluded components</DescriptionListTerm>
                <DescriptionListDescription>
                  {productId && numExcluded > 0 ? (
                    <Link to={`/reports/product/excluded-components/${productId}/${cveId}`}>
                      {excludedValue}
                    </Link>
                  ) : (
                    excludedValue
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </GridItem>
        </Grid>
      </CardBody>
    </Card>
  );
};

export default ReportDetails;
