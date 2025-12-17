"use client"

import { ChartItem } from "../charts/metrics/types"
import MetricBar from "./metrics/MetricBar"

export default function ChartSection({
  data,
}: {
  data: ChartItem[]
}) {
  return (
    <div className="space-y-10">
      <MetricBar dataKey="confidence" data={data} />
      <MetricBar dataKey="latency_ms" data={data} />
      <MetricBar dataKey="throughput" data={data} />
      <MetricBar dataKey="entropy" data={data} />
      <MetricBar dataKey="stability" data={data} />
      <MetricBar dataKey="ram_mb" data={data} />
      <MetricBar dataKey="cold_start_ms" data={data} />
    </div>
  )
}
