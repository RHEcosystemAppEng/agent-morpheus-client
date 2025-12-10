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

interface ReportComponentStatesPieChartProps {
  productSummary: ProductSummary;
}

const ReportComponentStatesPieChart: React.FC<
  ReportComponentStatesPieChartProps
> = ({ productSummary }) => {
  const chartData = useMemo(() => {
    const componentStates = productSummary.summary.componentStates || {};
    const baseData = Object.entries(componentStates).map(([x, y]) => ({ x, y }));
    
    // Calculate "None Scanned" count
    const scannedTotal = baseData.reduce((sum, d) => sum + d.y, 0);
    const submittedCount = productSummary.data.submittedCount || 0;
    const noneScannedCount = submittedCount - scannedTotal;
    
    // Add "None Scanned" slice if count > 0
    if (noneScannedCount > 0) {
      return [...baseData, { x: "None Scanned", y: noneScannedCount }];
    }
    
    return baseData;
  }, [productSummary]);

  const colors = useMemo(() => {
    const colorPalette = [
      "#06c",
      "#3e8635",
      "#f0ab00",
      "#c9190b",
      "#6753ac",
      "#009596",
      "#8a8d90", // Gray for "None Scanned"
    ];
    return colorPalette.slice(0, chartData.length);
  }, [chartData.length]);

  const total = useMemo(() => {
    // Total should include all submitted components
    return productSummary.data.submittedCount || chartData.reduce((sum, d) => sum + d.y, 0);
  }, [chartData, productSummary.data.submittedCount]);
  
  const legendData = useMemo(
    () => chartData.map((d) => ({ name: `${d.x}: ${d.y}` })),
    [chartData]
  );

  if (chartData.length === 0) {
    return (
      <Card>
        <CardTitle>
          <Title headingLevel="h4" size="xl">
            Component Scan States
          </Title>
        </CardTitle>
        <CardBody>
          <EmptyState>
            <EmptyStateBody>No component state data available</EmptyStateBody>
          </EmptyState>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>
        <Title headingLevel="h4" size="xl">
          Component Scan States
        </Title>
      </CardTitle>
      <CardBody>
        <DonutChartWrapper
          ariaDesc="Component scan states"
          ariaTitle="Component scan states"
          data={chartData}
          colorScale={colors}
          legendData={legendData}
          title={`${total}`}
          subTitle="States"
          total={total}
        />
      </CardBody>
    </Card>
  );
};

export default ReportComponentStatesPieChart;
