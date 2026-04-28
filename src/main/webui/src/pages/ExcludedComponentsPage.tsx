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

import { useMemo } from "react";
import { useParams, Link } from "react-router";
import {
  PageSection,
  Breadcrumb,
  BreadcrumbItem,
  Title,
  Grid,
  GridItem,
  Alert,
  AlertVariant,
  Skeleton,
} from "@patternfly/react-core";
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  TableText,
} from "@patternfly/react-table";
import { useReport } from "../hooks/useReport";
import { getErrorMessage } from "../utils/errorHandling";
import TableEmptyState from "../components/TableEmptyState";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import {
  pageTitleExcludedComponents,
  pageTitleExcludedInvalidParams,
  pageTitleExcludedLoadError,
} from "./pageTitles";

const COLUMN_NAMES = {
  component: "Component",
  packageUrl: "Package URL",
  error: "Error",
};

const ExcludedComponentsPageSkeleton: React.FC = () => (
  <>
    <PageSection>
      <Grid hasGutter>
        <GridItem>
          <Skeleton width="20%" screenreaderText="Loading breadcrumb" />
        </GridItem>
        <GridItem>
          <Skeleton width="30%" screenreaderText="Loading title" />
        </GridItem>
        <GridItem>
          <Skeleton width="80%" height="1.5rem" screenreaderText="Loading subtitle" />
        </GridItem>
      </Grid>
    </PageSection>
    <PageSection>
      <Skeleton height="200px" screenreaderText="Loading table" />
    </PageSection>
  </>
);

const ExcludedComponentsPage: React.FC = () => {
  const { productId, cveId } = useParams<{ productId: string; cveId: string }>();
  const { data, loading, error } = useReport(productId);

  const documentTitle = useMemo(() => {
    if (!productId || !cveId) {
      return pageTitleExcludedInvalidParams();
    }
    if (loading) {
      return pageTitleExcludedComponents(productId, cveId);
    }
    if (error) {
      return pageTitleExcludedLoadError(productId, cveId);
    }
    if (!data) {
      return pageTitleExcludedLoadError(productId, cveId);
    }
    const productName = data.data?.name ?? productId;
    return pageTitleExcludedComponents(productName, cveId);
  }, [productId, cveId, loading, error, data]);

  useDocumentTitle(documentTitle);

  if (loading) {
    return <ExcludedComponentsPageSkeleton />;
  }

  if (!productId || !cveId) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.warning} title="Invalid page">
          Invalid page parameters. Expected /reports/product/excluded-components/:productId/:cveId.
        </Alert>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.danger} title="Error loading product">
          {getErrorMessage(error)}
        </Alert>
      </PageSection>
    );
  }

  if (!data) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.danger} title="Product not found">
          Unexpected error: API returned no data.
        </Alert>
      </PageSection>
    );
  }

  const productName = data.data?.name ?? "";
  const breadcrumbText = `${productName} / ${cveId}`;
  const submissionFailures = data.data?.submissionFailures ?? [];

  return (
    <>
      <PageSection>
        <Grid hasGutter>
          <GridItem>
            <Breadcrumb>
              <BreadcrumbItem>
                <Link to="/reports">Reports</Link>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <Link to={`/reports/product/${productId}/${cveId}`}>
                  {breadcrumbText}
                </Link>
              </BreadcrumbItem>
              <BreadcrumbItem isActive>Excluded components</BreadcrumbItem>
            </Breadcrumb>
          </GridItem>
          <GridItem>
            <Title headingLevel="h1" size="2xl">
              Excluded components
            </Title>
          </GridItem>
          <GridItem>
            <Title headingLevel="h2" size="md">
              Components that were excluded from analysis due to technical errors or scope definitions
            </Title>
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        {submissionFailures.length === 0 ? (
          <TableEmptyState
            columnCount={3}
            titleText="No excluded components"
          />
        ) : (
          <Table aria-label="Excluded components table">
            <Thead>
              <Tr>
                <Th width={20}>{COLUMN_NAMES.component}</Th>
                <Th width={30}>{COLUMN_NAMES.packageUrl}</Th>
                <Th>{COLUMN_NAMES.error}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {submissionFailures.map((failure, index) => (
                <Tr key={`${failure.name}-${failure.version}-${index}`}>
                  <Td dataLabel={COLUMN_NAMES.component}>
                    <TableText wrapModifier="truncate">
                      {failure.name} {failure.version}
                    </TableText>
                  </Td>
                  <Td dataLabel={COLUMN_NAMES.packageUrl}>
                    <TableText wrapModifier="truncate">{failure.image}</TableText>
                  </Td>
                  <Td dataLabel={COLUMN_NAMES.error}>
                    <TableText wrapModifier="truncate">{failure.error}</TableText>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </PageSection>
    </>
  );
};

export default ExcludedComponentsPage;
