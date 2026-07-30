import { MiniBar } from '../../ui/MiniBar.jsx';

export function CompletionFunnel({ steps = [] }) {
  return (
    <div className="chart-block">
      <div className="chart-title">Completion funnel</div>
      <div className="funnel-pyramid">
        {steps.map((step) => (
          <MiniBar key={step.key} label={step.label} value={step.percent} max={100} detail={`${step.count} videos · ${step.percent}%`} />
        ))}
      </div>
    </div>
  );
}
