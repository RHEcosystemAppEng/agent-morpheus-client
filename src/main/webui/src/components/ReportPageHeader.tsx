// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { Link } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  Grid,
  GridItem,
  Title,
} from "@patternfly/react-core";
import type { ProductSummary } from "../generated-client/models/ProductSummary";
import ProductAnalysisStatus from "./ProductAnalysisStatus";

interface ReportPageHeaderProps {
  breadcrumbText: string;
  product: ProductSummary;
}

const ReportPageHeader: React.FC<ReportPageHeaderProps> = ({
  breadcrumbText,
  product,
}) => (
  <Grid hasGutter>
    <GridItem>
      <Breadcrumb>
        <BreadcrumbItem>
          <Link to="/reports">Reports</Link>
        </BreadcrumbItem>
        <BreadcrumbItem isActive>{breadcrumbText}</BreadcrumbItem>
      </Breadcrumb>
    </GridItem>
    <GridItem>
      <Title headingLevel="h1" size="2xl">
        <strong>Report:</strong> {breadcrumbText}
      </Title>
    </GridItem>
    <GridItem style={{ marginTop: "-0.25rem" }}>
      <ProductAnalysisStatus product={product} />
    </GridItem>
  </Grid>
);

export default ReportPageHeader;
