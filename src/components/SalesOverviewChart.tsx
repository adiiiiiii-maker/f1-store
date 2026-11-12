import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { Order, Product, CATEGORIES } from '../types';

interface SalesOverviewChartProps {
  orders: Order[];
  products: Product[];
}

export const SalesOverviewChart: React.FC<SalesOverviewChartProps> = ({ orders, products }) => {
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // 1. High-level aggregates
  const approvedOrders = orders.filter(o => o.status === 'APPROVED');
  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const rejectedOrders = orders.filter(o => o.status === 'REJECTED');

  const totalEarnings = approvedOrders.reduce((sum, o) => sum + o.amount, 0);
  const pendingValidationsAmount = pendingOrders.reduce((sum, o) => sum + o.amount, 0);
  const totalVolume = orders.reduce((sum, o) => sum + o.amount, 0);
  const averageOrderValue = approvedOrders.length > 0 ? Math.round(totalEarnings / approvedOrders.length) : 0;
  const approvalRate = orders.length > 0 ? Math.round((approvedOrders.length / orders.length) * 100) : 0;

  // 2. Timeline Aggregates for the last 7 days
  const timelineData = useMemo(() => {
    const days: { dateLabel: string; fullDate: string; approved: number; pending: number; count: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const dateLabel = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString('en-US', { weekday: 'short' });

      // Match orders created on this date
      const daysOrders = orders.filter(o => {
        const orderDate = o.createdAt.split('T')[0];
        return orderDate === dateString;
      });

      const dayApproved = daysOrders
        .filter(o => o.status === 'APPROVED')
        .reduce((sum, o) => sum + o.amount, 0);

      const dayPending = daysOrders
        .filter(o => o.status === 'PENDING')
        .reduce((sum, o) => sum + o.amount, 0);

      days.push({
        dateLabel,
        fullDate: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        approved: dayApproved,
        pending: dayPending,
        count: daysOrders.length
      });
    }

    return days;
  }, [orders]);

  // If there are zero orders or values are zero across the 7 days, provide a baseline scale
  const maxDataValue = Math.max(
    ...timelineData.map(d => Math.max(d.approved, d.pending)),
    50000 // minimum scale reference
  );

  // SVG Chart Dimensions
  const svgWidth = 680;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingY = 30;
  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingY * 2;

  // Coordinate computation
  const pointsApproved = timelineData.map((d, index) => {
    const x = paddingX + (index / (timelineData.length - 1)) * graphWidth;
    const y = svgHeight - paddingY - (d.approved / maxDataValue) * graphHeight;
    return { x, y, data: d };
  });

  const pointsPending = timelineData.map((d, index) => {
    const x = paddingX + (index / (timelineData.length - 1)) * graphWidth;
    const y = svgHeight - paddingY - (d.pending / maxDataValue) * graphHeight;
    return { x, y, data: d };
  });

  // Build SVG Path strings
  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    return points.reduce((acc, point, i, arr) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      const prev = arr[i - 1];
      const cpX = (prev.x + point.x) / 2;
      return `${acc} C ${cpX} ${prev.y}, ${cpX} ${point.y}, ${point.x} ${point.y}`;
    }, '');
  };

  const approvedPathD = createSmoothPath(pointsApproved);
  const pendingPathD = createSmoothPath(pointsPending);

  // Area under approved curve
  const approvedAreaD = pointsApproved.length > 0
    ? `${approvedPathD} L ${pointsApproved[pointsApproved.length - 1].x} ${svgHeight - paddingY} L ${pointsApproved[0].x} ${svgHeight - paddingY} Z`
    : '';

  // Category breakdown
  const categoryStats = useMemo(() => {
    return CATEGORIES.map(cat => {
      const catOrders = approvedOrders.filter(o => o.category === cat);
      const catEarnings = catOrders.reduce((sum, o) => sum + o.amount, 0);
      const catPending = pendingOrders.filter(o => o.category === cat).reduce((sum, o) => sum + o.amount, 0);
      const percentage = totalEarnings > 0 ? Math.round((catEarnings / totalEarnings) * 100) : 0;
      return {
        category: cat,
        earnings: catEarnings,
        pending: catPending,
        count: catOrders.length,
        percentage
      };
    });
  }, [approvedOrders, pendingOrders, totalEarnings]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Summary Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#16c784]/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-[#16c784] font-bold uppercase tracking-widest">
              FINANCIAL TELEMETRY
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-[10px] font-mono text-[#e5c98b] font-semibold">
              Live Bank UTR Audit
            </span>
          </div>
          <h3 className="font-brand text-xl sm:text-2xl font-black text-white gold-gradient-text">
            SALES OVERVIEW & SETTLEMENTS
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#041d14] border border-[#16c784]/40 text-xs font-mono text-[#16c784]">
            <span className="w-2 h-2 rounded-full bg-[#16c784] animate-pulse" />
            <span>Real-time Ledger Active</span>
          </span>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earnings Card */}
        <div className="p-5 rounded-2xl glass-card border border-[#16c784]/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#16c784]/15 rounded-full blur-xl group-hover:bg-[#16c784]/25 transition-all" />
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Total Earnings
            </span>
            <div className="p-2 rounded-xl bg-[#08291e] border border-[#16c784]/30 text-[#16c784]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-[#16c784] font-mono tabular-nums tracking-tight">
            ₹{totalEarnings.toLocaleString('en-IN')}
          </div>

          <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-slate-400">
            <span className="text-emerald-400 font-bold">{approvedOrders.length}</span>
            <span>Settled / Approved Orders</span>
          </div>
        </div>

        {/* Pending Validations Card */}
        <div className="p-5 rounded-2xl glass-card border border-[#e5c98b]/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#e5c98b]/15 rounded-full blur-xl group-hover:bg-[#e5c98b]/25 transition-all" />

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Pending Validations
            </span>
            <div className="p-2 rounded-xl bg-[#1b1509] border border-[#e5c98b]/30 text-[#e5c98b]">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-[#e5c98b] font-mono tabular-nums tracking-tight">
            ₹{pendingValidationsAmount.toLocaleString('en-IN')}
          </div>

          <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-slate-400">
            <span className="text-amber-400 font-bold">{pendingOrders.length}</span>
            <span>Awaiting 12-Digit UTR Review</span>
          </div>
        </div>

        {/* Total Pipeline Volume */}
        <div className="p-5 rounded-2xl glass-card border border-[#16c784]/20 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Gross Volume
            </span>
            <div className="p-2 rounded-xl bg-[#041d14] border border-[#16c784]/20 text-slate-300">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums tracking-tight">
            ₹{totalVolume.toLocaleString('en-IN')}
          </div>

          <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-slate-400">
            <span>{orders.length} Total Submissions</span>
          </div>
        </div>

        {/* Approval Rate / Average Value */}
        <div className="p-5 rounded-2xl glass-card border border-[#16c784]/20 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Avg Order Value
            </span>
            <div className="p-2 rounded-xl bg-[#041d14] border border-[#16c784]/20 text-[#16c784]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-[#16c784] font-mono tabular-nums tracking-tight">
            ₹{averageOrderValue.toLocaleString('en-IN')}
          </div>

          <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-slate-400">
            <span className="text-[#16c784] font-bold">{approvalRate}%</span>
            <span>Settlement rate</span>
          </div>
        </div>
      </div>

      {/* 3. The Sales & Validations Line Chart */}
      <div className="p-6 rounded-3xl glass-card border border-[#16c784]/30 shadow-2xl relative overflow-hidden">
        
        {/* Chart Header & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h4 className="font-brand text-base sm:text-lg font-bold text-white gold-gradient-text">
              7-Day Sales & Validation Trajectory
            </h4>
            <p className="text-xs text-slate-400 font-mono">
              Visualizing daily revenue inflow against pending UTR submissions.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1.5 rounded-full bg-[#16c784] shadow-[0_0_8px_#16c784]" />
              <span className="text-slate-200 font-semibold">Total Earnings (Approved)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1.5 rounded-full bg-[#e5c98b] shadow-[0_0_8px_#e5c98b]" />
              <span className="text-slate-200 font-semibold">Pending Validations</span>
            </div>
          </div>
        </div>

        {/* SVG Line Chart Container */}
        <div className="w-full overflow-x-auto scrollbar-none">
          <div className="min-w-[620px] relative">
            
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                {/* Area Gradient under Approved line */}
                <linearGradient id="approvedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16c784" stopOpacity="0.35" />
                  <stop offset="70%" stopColor="#16c784" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#16c784" stopOpacity="0.0" />
                </linearGradient>

                {/* Line Glow filter */}
                <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Horizontal grid lines & Y-axis labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = svgHeight - paddingY - ratio * graphHeight;
                const valueLabel = Math.round(ratio * maxDataValue);
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="rgba(22, 199, 132, 0.12)"
                      strokeDasharray={i === 0 ? 'none' : '3 3'}
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 3.5}
                      textAnchor="end"
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      ₹{valueLabel >= 1000 ? `${Math.round(valueLabel / 1000)}k` : valueLabel}
                    </text>
                  </g>
                );
              })}

              {/* X-Axis base line */}
              <line
                x1={paddingX}
                y1={svgHeight - paddingY}
                x2={svgWidth - paddingX}
                y2={svgHeight - paddingY}
                stroke="rgba(22, 199, 132, 0.3)"
                strokeWidth="1.5"
              />

              {/* Area fill for Approved Earnings */}
              {approvedAreaD && (
                <path d={approvedAreaD} fill="url(#approvedAreaGrad)" />
              )}

              {/* Line 1: Approved Earnings (Neon Emerald) */}
              {approvedPathD && (
                <path
                  d={approvedPathD}
                  fill="none"
                  stroke="#16c784"
                  strokeWidth="3"
                  strokeLinecap="round"
                  filter="url(#emeraldGlow)"
                />
              )}

              {/* Line 2: Pending Validations (Champagne Gold) */}
              {pendingPathD && (
                <path
                  d={pendingPathD}
                  fill="none"
                  stroke="#e5c98b"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                />
              )}

              {/* Data points for Approved */}
              {pointsApproved.map((pt, i) => (
                <circle
                  key={`app-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredPointIndex === i ? 6 : 4}
                  fill="#03140e"
                  stroke="#16c784"
                  strokeWidth="2.5"
                  className="transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredPointIndex(i)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                />
              ))}

              {/* Data points for Pending */}
              {pointsPending.map((pt, i) => (
                <circle
                  key={`pend-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredPointIndex === i ? 5.5 : 3.5}
                  fill="#03140e"
                  stroke="#e5c98b"
                  strokeWidth="2"
                  className="transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredPointIndex(i)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                />
              ))}

              {/* X-Axis Date Labels */}
              {timelineData.map((d, index) => {
                const x = paddingX + (index / (timelineData.length - 1)) * graphWidth;
                const isHovered = hoveredPointIndex === index;
                return (
                  <text
                    key={index}
                    x={x}
                    y={svgHeight - 8}
                    textAnchor="middle"
                    fill={isHovered ? '#16c784' : '#94a3b8'}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight={isHovered ? 'bold' : 'normal'}
                  >
                    {d.dateLabel}
                  </text>
                );
              })}
            </svg>

            {/* Floating Interactive Tooltip */}
            {hoveredPointIndex !== null && (
              <div
                className="absolute z-20 pointer-events-none p-3 rounded-xl bg-[#03140e]/95 border border-[#16c784] shadow-[0_0_20px_rgba(22,199,132,0.35)] text-xs font-mono transform -translate-x-1/2 -translate-y-full"
                style={{
                  left: `${(pointsApproved[hoveredPointIndex].x / svgWidth) * 100}%`,
                  top: `${Math.min(pointsApproved[hoveredPointIndex].y, pointsPending[hoveredPointIndex].y) - 14}px`
                }}
              >
                <div className="text-[#e5c98b] font-bold pb-1 border-b border-[#16c784]/20 mb-1.5 flex items-center justify-between gap-3">
                  <span>{timelineData[hoveredPointIndex].fullDate}</span>
                  <span className="text-[10px] text-slate-400">({timelineData[hoveredPointIndex].dateLabel})</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#16c784]" />
                      <span>Approved:</span>
                    </span>
                    <span className="font-bold text-[#16c784]">
                      ₹{timelineData[hoveredPointIndex].approved.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#e5c98b]" />
                      <span>Pending:</span>
                    </span>
                    <span className="font-bold text-[#e5c98b]">
                      ₹{timelineData[hoveredPointIndex].pending.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart Footer Insight */}
        <div className="mt-4 pt-4 border-t border-[#16c784]/15 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-mono gap-2">
          <span>✦ Hover over data points to inspect date-specific revenue breakdowns.</span>
          <span className="text-[#16c784]">All values denominated in Indian Rupees (₹)</span>
        </div>
      </div>

      {/* 4. Category Performance Breakdown */}
      <div className="p-6 rounded-3xl glass-card border border-[#16c784]/25 shadow-lg">
        <h4 className="font-brand text-base sm:text-lg font-bold text-white gold-gradient-text mb-4">
          Tier-Grade Allocation Performance
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {categoryStats.map(stat => (
            <div
              key={stat.category}
              className="p-4 rounded-2xl bg-[#041a12] border border-[#16c784]/20 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#e5c98b] font-bold block mb-1">
                  {stat.category}
                </span>
                <div className="text-lg font-black text-[#16c784] font-mono">
                  ₹{stat.earnings.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {stat.count} orders approved
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 pt-2 border-t border-[#16c784]/15">
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>Share of Total</span>
                  <span className="text-white font-bold">{stat.percentage}%</span>
                </div>
                <div className="w-full bg-[#020d09] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#16c784] to-[#e5c98b] rounded-full"
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
