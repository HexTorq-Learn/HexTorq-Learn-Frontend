import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, RadarChart as EChartsRadarChart, ScatterChart, HeatmapChart } from 'echarts/charts';
import {
  GridComponent, TooltipComponent, TitleComponent, VisualMapComponent, CalendarComponent, LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import 'echarts-gl';

echarts.use([
  BarChart, EChartsRadarChart, ScatterChart, HeatmapChart,
  GridComponent, TooltipComponent, TitleComponent, VisualMapComponent, CalendarComponent, LegendComponent,
  CanvasRenderer,
]);

export function EChart({ option, height = 320, style }) {
  const holderRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    chartRef.current = echarts.init(holderRef.current);
    const resize = () => chartRef.current?.resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      chartRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

  return <div ref={holderRef} style={{ width: '100%', height, ...style }} />;
}
