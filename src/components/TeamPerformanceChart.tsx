import { TrendingUp } from 'lucide-react';

interface TeamMemberTrend {
  id: string;
  name: string;
  color: string;
  data: Array<{ month: string; average: number }>;
}

interface TeamPerformanceChartProps {
  memberTrends: TeamMemberTrend[];
}

const COLORS = [
  'rgb(59, 130, 246)',
  'rgb(16, 185, 129)',
  'rgb(249, 115, 22)',
  'rgb(236, 72, 153)',
  'rgb(14, 165, 233)',
  'rgb(234, 179, 8)',
  'rgb(239, 68, 68)',
];

const LEVEL_LABELS: Record<number, string> = {
  1: 'Associate',
  2: 'Level 1',
  3: 'Level 2',
  4: 'Senior',
  5: 'Lead',
};

export default function TeamPerformanceChart({ memberTrends }: TeamPerformanceChartProps) {
  if (!memberTrends || memberTrends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <TrendingUp className="w-8 h-8 text-slate-300" />
        <p className="text-slate-500 text-sm text-center">No maturity assessment data available</p>
      </div>
    );
  }

  const now = new Date();
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
  }

  const width = 560;
  const height = 220;
  const padding = { top: 16, right: 24, bottom: 32, left: 72 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minY = 1;
  const maxY = 5;

  const getX = (index: number) => {
    if (months.length === 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (months.length - 1)) * chartWidth;
  };

  const getY = (value: number) => {
    const normalized = (value - minY) / (maxY - minY);
    return height - padding.bottom - normalized * chartHeight;
  };

  const preparedTrends = memberTrends.map((member, idx) => {
    const dataByMonth = new Map(member.data.map(d => [d.month, d.average]));
    const fullData = months.map(month => ({
      month,
      average: dataByMonth.get(month) ?? null
    }));
    return {
      ...member,
      color: member.color || COLORS[idx % COLORS.length],
      fullData
    };
  });

  const buildLinePath = (points: Array<{ x: number; y: number }>) => {
    if (points.length === 0) return '';
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ');
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-slate-50 rounded-lg p-2" style={{ height: '260px' }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {[1, 2, 3, 4, 5].map((value) => {
            const y = getY(value);
            return (
              <g key={value}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={value === 1 ? 'rgb(203, 213, 225)' : 'rgb(226, 232, 240)'}
                  strokeWidth="1"
                  strokeDasharray={value === 1 ? undefined : '4,4'}
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="9.5"
                  fill="rgb(100, 116, 139)"
                >
                  {LEVEL_LABELS[value]}
                </text>
              </g>
            );
          })}

          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            stroke="rgb(203, 213, 225)"
            strokeWidth="1"
          />

          {months.map((month, idx) => {
            const x = getX(idx);
            const showLabel = months.length <= 6 || idx % 2 === 0;
            return (
              <text
                key={idx}
                x={x}
                y={height - 10}
                textAnchor="middle"
                fontSize="9"
                fill="rgb(100, 116, 139)"
                opacity={showLabel ? 1 : 0}
              >
                {month.split(' ')[0]}
              </text>
            );
          })}

          {preparedTrends.map((member) => {
            const validPoints = member.fullData
              .map((point, idx) => point.average !== null
                ? { x: getX(idx), y: getY(point.average), average: point.average, month: point.month }
                : null
              )
              .filter((p): p is { x: number; y: number; average: number; month: string } => p !== null);

            const linePath = buildLinePath(validPoints);

            return (
              <g key={member.id}>
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke={member.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.9"
                  />
                )}

                {validPoints.map((point, idx) => (
                  <g key={idx}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="5"
                      fill="white"
                      stroke={member.color}
                      strokeWidth="2.5"
                    />
                    <title>{`${member.name}\n${point.month}\n${LEVEL_LABELS[Math.round(point.average)] ?? point.average.toFixed(1)}`}</title>
                  </g>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
        {preparedTrends.map((member) => {
          const lastPoint = [...member.data].reverse()[0];
          const lastLevel = lastPoint ? LEVEL_LABELS[Math.round(lastPoint.average)] ?? lastPoint.average.toFixed(1) : null;
          return (
            <div key={member.id} className="flex items-center gap-2">
              <div
                className="w-3 h-0.5 rounded-full"
                style={{ backgroundColor: member.color, height: '3px', width: '16px' }}
              />
              <div
                className="w-2 h-2 rounded-full border-2 bg-white"
                style={{ borderColor: member.color }}
              />
              <span className="text-xs text-slate-700">
                {member.name}
                {lastLevel && (
                  <span className="ml-1 font-semibold text-slate-500">({lastLevel})</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
