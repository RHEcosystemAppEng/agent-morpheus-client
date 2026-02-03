import { useMemo } from "react";
import { Card, CardTitle, CardBody, Title } from "@patternfly/react-core";
import type { SbomReport } from "../generated-client/models/SbomReport";
import DonutChartWrapper from "./DonutChartWrapper";

interface ReportCveStatusPieChartProps {
  product: SbomReport;
  cveId: string;
}

const ReportCveStatusPieChart: React.FC<ReportCveStatusPieChartProps> = ({
  product,
  cveId,
}) => {
  const chartData = useMemo(() => {
    const statusCounts = product.cveStatusCounts || {};

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
