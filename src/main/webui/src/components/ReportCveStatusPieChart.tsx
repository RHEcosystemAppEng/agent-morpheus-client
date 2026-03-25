import { useMemo } from "react";
import {
  Card,
  CardBody,
  CardTitle,
  EmptyState,
  EmptyStateBody,
  Title,
} from "@patternfly/react-core";
import t_global_color_status_success_100 from "@patternfly/react-tokens/dist/esm/t_global_color_status_success_100";
import t_chart_global_warning_color_100 from "@patternfly/react-tokens/dist/esm/t_chart_global_warning_color_100";
import type { ProductSummary } from "../generated-client/models/ProductSummary";
import DonutChartWrapper from "./DonutChartWrapper";
import t_global_color_nonstatus_red_400 from "@patternfly/react-tokens/dist/esm/t_global_color_nonstatus_red_400";
import {
  getJustificationCount,
  JUSTIFICATION_API,
} from "../utils/justificationStatus";

interface ReportCveStatusPieChartProps {
  product: ProductSummary;
  cveId: string;
  cardHeight: string;
}

const ReportCveStatusPieChart: React.FC<ReportCveStatusPieChartProps> = ({
  product,
  cveId,
  cardHeight,
}) => {
  const chartData = useMemo(() => {
    const statusCounts = product.summary?.justificationStatusCounts || {};
    const vulnerableCount = getJustificationCount(
      statusCounts,
      JUSTIFICATION_API.VULNERABLE
    );
    const notVulnerableCount = getJustificationCount(
      statusCounts,
      JUSTIFICATION_API.NOT_VULNERABLE
    );
    const uncertainCount = getJustificationCount(
      statusCounts,
      JUSTIFICATION_API.UNCERTAIN
    );
    return [
      { x: "vulnerable", y: vulnerableCount },
      { x: "not_vulnerable", y: notVulnerableCount },
      { x: "uncertain", y: uncertainCount },
    ];
  }, [product, cveId]);

  const computeColors = (slices: Array<{ x: string; y: number }>) => {
    const red = t_global_color_nonstatus_red_400.var;
    const green = t_global_color_status_success_100.var;
    const orange = t_chart_global_warning_color_100.var;
    return slices.map((d) => {
      if (d.x === "vulnerable") return red;
      if (d.x === "not_vulnerable") return green;
      return orange;
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
    <Card style={{ height: cardHeight, overflowY: "auto" }}>
      <CardTitle>
        <Title headingLevel="h4" size="xl">
          Findings
        </Title>
      </CardTitle>
      <CardBody>
        {total === 0 ? (
          <EmptyState>
            <EmptyStateBody>No completed analysis</EmptyStateBody>
          </EmptyState>
        ) : (
          <DonutChartWrapper
            ariaDesc="Findings by justification status"
            ariaTitle="Findings by justification status"
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
