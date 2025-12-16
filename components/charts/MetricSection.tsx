"use client"

import MetricBarChart from "./MetricBarChart"
import { METRICS } from "./metrics"

export default function MetricSection({ data }: { data: any[] }) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {METRICS.map((m) => (
        <MetricBarChart
          key={m.key}
          title={m.title}
          description={m.desc}
          data={data}
          dataKey={m.key}
          unit={m.unit}
          higherIsBetter={m.higher}
        />
      ))}
    </div>
  )
}
