import { useMemo } from "react";
import {
  Card,
  CardTitle,
  CardBody,
  Title,
  EmptyState,
  EmptyStateBody,
} from "@patternfly/react-core";
import t_global_color_status_success_100 from "@patternfly/react-tokens/dist/esm/t_global_color_status_success_100";
import t_global_color_nonstatus_red_400 from "@patternfly/react-tokens/dist/esm/t_global_color_nonstatus_red_400";
import t_global_color_status_danger_200 from "@patternfly/react-tokens/dist/esm/t_global_color_status_danger_200";
import t_global_color_nonstatus_gray_200 from "@patternfly/react-tokens/dist/esm/t_global_color_nonstatus_gray_200";
import t_global_color_nonstatus_gray_300 from "@patternfly/react-tokens/dist/esm/t_global_color_nonstatus_gray_300";
import t_global_color_nonstatus_gray_400 from "@patternfly/react-tokens/dist/esm/t_global_color_nonstatus_gray_400";
import type { ProductSummary } from "../generated-client/models/ProductSummary";
import DonutChartWrapper from "./DonutChartWrapper";

interface ReportComponentStatesPieChartProps {
  product: ProductSummary;
}

// State ordering: states appear in this order when present in data
const STATE_ORDER = [
  "completed",
  "expired",
  "failed",
  "queued",
  "sent",
  "pending",
] as const;

// Color mapping for each component state
const STATE_COLORS: Record<string, string> = {
  completed: t_global_color_status_success_100.var,
  expired: t_global_color_status_danger_200.var,
  failed: t_global_color_nonstatus_red_400.var,
  queued: t_global_color_nonstatus_gray_300.var,
  sent: t_global_color_nonstatus_gray_400.var,
  pending: t_global_color_nonstatus_gray_200.var,
};

const ReportComponentStatesPieChart: React.FC<
  ReportComponentStatesPieChartProps
> = ({ product }) => {
  const chartData = useMemo(() => {
    const statusCounts = product.summary?.statusCounts || {};
    const baseData = Object.entries(statusCounts).map(([x, y]) => ({ x, y: y as number }));        
    const sortedData = [...baseData].sort((a, b) => {
      const indexA = STATE_ORDER.indexOf(a.x.toLowerCase() as typeof STATE_ORDER[number]);
      const indexB = STATE_ORDER.indexOf(b.x.toLowerCase() as typeof STATE_ORDER[number]);
      
      // If both are in the predefined list, sort by their order
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only A is in the list, A comes first
      if (indexA !== -1) return -1;
      // If only B is in the list, B comes first
      if (indexB !== -1) return 1;
      // If neither is in the list, maintain original order (append at end)
      return 0;
    });
    
    return sortedData;
  }, [product]);

  const colors = useMemo(() => {
    // Map each data point to its corresponding color based on state name
    return chartData.map((d): string => {
      // Normalize state name for lookup (case-insensitive)
      const normalizedState = d.x.toLowerCase();
      
      // Look up color for normalized state name
      return STATE_COLORS[normalizedState] || "#8A8D90"; // Default to light gray for unknown states
    });
  }, [chartData]);

  const total = useMemo(() => {
    // Total should include all submitted components
    const statusCounts = product.summary?.statusCounts || {};
    return Object.values(statusCounts).reduce((sum: number, count: number) => sum + count, 0) || chartData.reduce((sum, d) => sum + d.y, 0);
  }, [chartData, product.summary?.statusCounts]);
  
  const legendData = useMemo(
    () => chartData.map((d) => ({ name: `${d.x}: ${d.y}` })),
    [chartData]
  );

  if (chartData.length === 0) {
    return (
      <Card>
        <CardTitle>
          <Title headingLevel="h4" size="xl">
            Repository analysis distribution
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
          Repository analysis distribution
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
