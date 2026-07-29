import { EChart } from './EChart.jsx';
import { buildBar3DOption } from './bar3dOption.js';

export function CompletionFunnel3D({ steps = [] }) {
  const resolvedColors = steps.map((_, index) => {
    const t = index / Math.max(1, steps.length - 1);
    return blend('#1f6f64', '#f7c948', t);
  });
  const option = buildBar3DOption({
    categories: steps.map((step) => step.label),
    values: steps.map((step) => step.percent),
    colors: resolvedColors,
    valueName: 'Percent',
    tooltipFormatter: (params) => `${steps[params.value[0]]?.label}: ${steps[params.value[0]]?.count} videos · ${params.value[2]}%`,
  });

  return (
    <div className="chart-block">
      <div className="chart-title">Completion funnel</div>
      <EChart option={option} />
    </div>
  );
}

function blend(colorA, colorB, t) {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const mix = a.map((channel, index) => Math.round(channel + (b[index] - channel) * t));
  return `rgb(${mix.join(',')})`;
}

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
}
