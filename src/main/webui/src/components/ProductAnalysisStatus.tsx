// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type { ProductSummary } from "../generated-client/models/ProductSummary";
import { getProductAnalysisStatus } from "../utils/findingDisplay";
import { CompletedBatchStatus, InProgressStatus } from "./Finding";

interface ProductAnalysisStatusProps {
  product: ProductSummary;
}

const ProductAnalysisStatus: React.FC<ProductAnalysisStatusProps> = ({ product }) => {
  const status = getProductAnalysisStatus(product);
  return status === "completed" ? <CompletedBatchStatus /> : <InProgressStatus />;
};

export default ProductAnalysisStatus;
