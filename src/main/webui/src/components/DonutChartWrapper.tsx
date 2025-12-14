import { ChartDonut, ChartLegend, ChartLabel } from '@patternfly/react-charts/victory';

interface DonutChartWrapperProps {
  data?: Array<{ x: string; y: number }>;
  colorScale?: string[];
  legendData?: Array<{ name: string }>;
  title?: string;
  subTitle?: string;
  ariaTitle?: string;
  ariaDesc?: string;
  total?: number;
}

const DonutChartWrapper: React.FC<DonutChartWrapperProps> = ({
  data = [],
  colorScale = [],
  legendData = [],
  title = '',
  subTitle = '',
  ariaTitle,
  ariaDesc,
  total = 0
}) => {
  return (
    <div style={{ width: '400px', height: '150px' }}>
      <ChartDonut
        ariaDesc={ariaDesc}
        ariaTitle={ariaTitle}
        constrainToVisibleArea
        data={data}
        height={150}
        width={400}
        padding={{ right: 240, left: 0, top: 0, bottom: 0 }}
        legendData={legendData}
        legendComponent={
          <ChartLegend
            symbolSpacer={8}
            rowGutter={{ top: 2, bottom: 2 }}
            gutter={2}
            borderPadding={{ top: 0, bottom: 0, left: 24, right: 2 }}
            labelComponent={<ChartLabel />}
            style={{ labels: { fontSize: 16 } }}
          />
        }
        legendAllowWrap={false}
        colorScale={colorScale}
        legendOrientation="vertical"
        title={title}
        subTitle={subTitle}
        labels={({ datum }: { datum: { x: string; y: number } }) =>
          `${datum.x}: ${datum.y} (${Math.round((datum.y / total) * 100)}%)`
        }
      />
    </div>
  );
};

export default DonutChartWrapper;

