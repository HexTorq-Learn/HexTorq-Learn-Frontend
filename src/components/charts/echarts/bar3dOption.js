// Shared bar3D option builder — one category axis of bars rising on Z, colored per-bar.
export function buildBar3DOption({ categories, values, colors, valueName = 'Value', tooltipFormatter }) {
  return {
    tooltip: {
      formatter: tooltipFormatter || ((params) => `${categories[params.value[0]]}: ${params.value[2]}`),
    },
    visualMap: colors ? undefined : {
      show: false,
      dimension: 2,
      min: Math.min(0, ...values),
      max: Math.max(1, ...values),
      inRange: { color: ['#6fb5a6', '#1f6f64'] },
    },
    xAxis3D: { type: 'category', data: categories, axisLabel: { rotate: 20 } },
    yAxis3D: { type: 'category', data: [valueName] },
    zAxis3D: { type: 'value' },
    grid3D: {
      boxWidth: 100,
      boxDepth: 40,
      viewControl: { autoRotate: true, autoRotateSpeed: 4, distance: 180 },
      light: { main: { intensity: 1.2, shadow: true }, ambient: { intensity: 0.35 } },
    },
    series: [{
      type: 'bar3D',
      data: values.map((value, index) => ({
        value: [index, 0, value],
        itemStyle: colors ? { color: colors[index] } : undefined,
      })),
      shading: 'lambert',
      bevelSize: 0.2,
    }],
  };
}
