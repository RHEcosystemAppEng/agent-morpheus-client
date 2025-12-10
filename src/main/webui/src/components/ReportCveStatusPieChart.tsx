import { useMemo } from "react";
import {
  Card,
  CardTitle,
  CardBody,
  Title,
  EmptyState,
  EmptyStateBody,
} from "@patternfly/react-core";
import { ProductSummary } from "../generated-client";
import DonutChartWrapper from "./DonutChartWrapper";

interface ReportCveStatusPieChartProps {
  productSummary: ProductSummary;
  cveId: string;
}

const ReportCveStatusPieChart: React.FC<ReportCveStatusPieChartProps> = ({
  productSummary,
  cveId,
}) => {
  const chartData = useMemo(() => {
    const cves = productSummary.summary.cves || {};
    const justifications = cves[cveId] || [];

    let vulnerableCount = 0;
    let notVulnerableCount = 0;
    let unknownCount = 0;

    justifications.forEach((justification) => {
      const status = justification.status?.toUpperCase() || "UNKNOWN";
      if (status === "TRUE") {
        vulnerableCount += 1;
      } else if (status === "FALSE") {
        notVulnerableCount += 1;
      } else {
        unknownCount += 1;
      }
    });

    const slices = [];
    if (vulnerableCount > 0) {
      slices.push({ x: "vulnerable", y: vulnerableCount });
    }
    if (notVulnerableCount > 0) {
      slices.push({ x: "not_vulnerable", y: notVulnerableCount });
    }
    if (unknownCount > 0) {
      slices.push({ x: "uncertain", y: unknownCount });
    }

    return slices;
  }, [productSummary, cveId]);

  const computeColors = (slices: Array<{ x: string; y: number }>) => {
    const red = "#C9190B";
    const green = "#3E8635";
    const gray = "#6A6E73";
    return slices.map((d) => {
      if (d.x === "vulnerable") return red;
      if (d.x === "not_vulnerable") return green;
      return gray;
    });
  };

  const toTitleCase = (s: string) => {
    if (!s) return "";
    return s
      .toString()
      .replace(/[_-]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  const colors = useMemo(() => computeColors(chartData), [chartData]);
  const total = useMemo(() => chartData.reduce((sum, d) => sum + d.y, 0), [chartData]);
  const legendData = useMemo(
    () => chartData.map((d) => ({ name: `${toTitleCase(d.x)}: ${d.y}` })),
    [chartData]
  );

  return (
    <Card>
      <CardTitle>
        <Title headingLevel="h4" size="xl">
          CVE Status Summary
        </Title>
      </CardTitle>
      <CardBody>
        {chartData.length === 0 ? (
          <EmptyState>
            <EmptyStateBody>No CVE incidents found for this CVE.</EmptyStateBody>
          </EmptyState>
        ) : (
          <DonutChartWrapper
            ariaDesc="CVE incidents by status"
            ariaTitle="CVE incidents by status"
            data={chartData}
            colorScale={colors}
            legendData={legendData}
            title={`${total}`}
            subTitle="Statuses"
            total={total}
          />
        )}
      </CardBody>
    </Card>
  );
};

export default ReportCveStatusPieChart;
