// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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

