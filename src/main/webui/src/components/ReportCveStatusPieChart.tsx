import { useMemo } from "react";
import { Card, CardTitle, CardBody, Title } from "@patternfly/react-core";
import t_global_color_status_success_100 from "@patternfly/react-tokens/dist/esm/t_global_color_status_success_100";
import t_global_color_nonstatus_gray_300 from "@patternfly/react-tokens/dist/esm/t_global_color_nonstatus_gray_300";
import type { ProductSummary } from "../generated-client/models/ProductSummary";
import DonutChartWrapper from "./DonutChartWrapper";
import t_global_color_nonstatus_red_400 from "@patternfly/react-tokens/dist/esm/t_global_color_nonstatus_red_400";

interface ReportCveStatusPieChartProps {
  product: ProductSummary;
  cveId: string;
}

const ReportCveStatusPieChart: React.FC<ReportCveStatusPieChartProps> = ({
  product,
  cveId,
}) => {
  const chartData = useMemo(() => {
    const statusCounts = product.summary?.justificationStatusCounts || {};

    let vulnerableCount = 0;
    let notVulnerableCount = 0;
    let unknownCount = 0;

    Object.entries(statusCounts).forEach(([statusKey, count]) => {
      const normalizedKey = statusKey.toUpperCase();
      const countValue = count as number;
      if (normalizedKey === "TRUE") {
        vulnerableCount += countValue;
      } else if (normalizedKey === "FALSE") {
        notVulnerableCount += countValue;
      } else {
        unknownCount += countValue;
      }
    });

    // Always include all 3 statuses, even if count is 0
    return [
      { x: "vulnerable", y: vulnerableCount },
      { x: "not_vulnerable", y: notVulnerableCount },
      { x: "uncertain", y: unknownCount },
    ];
  }, [product, cveId]);

  const computeColors = (slices: Array<{ x: string; y: number }>) => {
    const red = t_global_color_nonstatus_red_400.var;
    const green = t_global_color_status_success_100.var;
    const gray = t_global_color_nonstatus_gray_300.var;
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
      </CardBody>
    </Card>
  );
};

export default ReportCveStatusPieChart;
