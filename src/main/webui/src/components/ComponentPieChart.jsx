
import { ChartPie } from '@patternfly/react-charts/dist/esm/victory';

const COLORS = {
  completed: 'forestgreen',
  expired: 'grey',
  failed: 'tomato',
  queued: 'orange',
  sent: 'purple',
  pending: 'teal',
  'not scanned': 'lightgrey'
};

const STATE_LABELS = {
  completed: "Completed",
  expired: "Expired",
  failed: "Failed",
  queued: "Queued",
  sent: "Sent",
  pending: "Pending",
  "not scanned": "Not Scanned"
};

const countComponentStates = (componentStates) => {
  const stateCounts = {};
  if (componentStates && Array.isArray(componentStates)) {
    componentStates.forEach(state => {
      const stateKey = state.toLowerCase();
      stateCounts[stateKey] = (stateCounts[stateKey] || 0) + 1;
    });
  }
  return stateCounts;
};

const createChartData = (stateCounts, notScannedCount) => {
  const data = Object.entries(stateCounts).map(([state, count]) => ({
    x: state.charAt(0).toUpperCase() + state.slice(1),
    y: count
  }));

  // Add not scanned segment if applicable
  if (typeof notScannedCount === 'number' && notScannedCount >= 0) {
    data.push({
      x: 'Not Scanned',
      y: notScannedCount
    });
  }

  return data;
};

const createLegendData = (data) => {
  return Object.entries(STATE_LABELS).map(([stateKey, stateLabel]) => {
    const dataItem = data.find(item => item.x.toLowerCase() === stateKey.toLowerCase());
    const count = dataItem ? dataItem.y : 0;
    return {
      name: `${stateLabel}: ${count}`,
      symbol: { fill: COLORS[stateKey] || 'grey' }
    };
  });
};

const createColorScale = (data) => {
  return data.map(item => COLORS[item.x.toLowerCase()] || 'grey');
};

const ComponentStatesPieChart = ({ componentStates = [], submittedCount = 0 }) => {
  const stateCounts = countComponentStates(componentStates);
  const notScannedCount = Math.max(0, submittedCount - componentStates.length);
  const chartData = createChartData(stateCounts, notScannedCount);
  const legendData = createLegendData(chartData);
  const colorScale = createColorScale(chartData);
  const total = chartData.reduce((sum, item) => sum + item.y, 0);

  if (chartData.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '230px' }}>
        <span>No component states data available</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <div style={{
        position: 'absolute',
        left: '10px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '14px',
      }}>
        Total Submitted: {submittedCount}
      </div>

      <ChartPie
        ariaDesc="Component states distribution pie chart"
        ariaTitle="Component States Distribution"
        constrainToVisibleArea={true}
        data={chartData}
        height={230}
        width={550}
        labels={({ datum }) => `${datum.x}: ${datum.y} (${Math.round((datum.y / total) * 100)}%)`}
        legendData={legendData}
        legendOrientation="vertical"
        legendPosition="right"
        padding={{
          bottom: 20,
          left: 50,
          right: 100,
          top: 20
        }}
        colorScale={colorScale}
      />
    </div>
  );
};

export default ComponentStatesPieChart;
