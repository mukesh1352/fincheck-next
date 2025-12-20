"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import GraphCard from "../GraphCard"
import { ChartItem } from "./types"
import { METRIC_META } from "./metricMeta"

export default function MetricBar({
  dataKey,
  data,
  selectedModel,
}: {
  dataKey: keyof ChartItem
  data: ChartItem[]
  selectedModel: string
}) {
  const meta = METRIC_META[dataKey]

  const sorted = [...data].sort((a, b) => {
    const va = a[dataKey] as number
    const vb = b[dataKey] as number
    return meta.higherIsBetter ? vb - va : va - vb
  })

  const bestModel = sorted[0]?.model

  const bestReason = meta.higherIsBetter
    ? `Highest ${meta.label}`
    : `Lowest ${meta.label}`

  return (
    <GraphCard
      title={meta.label}
      description={meta.description}
      userHint={meta.userHint}
      bestLabel={bestModel}
      bestReason={bestReason}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <XAxis
            dataKey="model"
            angle={-15}
            textAnchor="end"
            interval={0}
            height={60}
          />
          <YAxis />
          <Tooltip />
          <Bar dataKey={dataKey as string}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  selectedModel !== "ALL" &&
                  entry.model === selectedModel
                    ? "#22c55e"
                    : "#60a5fa"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </GraphCard>
  )
}
