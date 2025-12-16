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
import GraphCard from "@/components/GraphCard"

type MetricBarChartProps = {
  title: string
  description: string
  data: {
    model: string
    [key: string]: number | string
  }[]
  dataKey: string
  unit?: string
  higherIsBetter?: boolean
}

export default function MetricBarChart({
  title,
  description,
  data,
  dataKey,
  unit,
  higherIsBetter = true,
}: MetricBarChartProps) {
  /* ---------------- FIND BEST MODEL ---------------- */

  const sorted = [...data].filter(
    (d) => typeof d[dataKey] === "number"
  )

  const bestItem =
    sorted.length === 0
      ? null
      : sorted.reduce((best, curr) => {
          const currVal = curr[dataKey] as number
          const bestVal = best[dataKey] as number

          return higherIsBetter
            ? currVal > bestVal
              ? curr
              : best
            : currVal < bestVal
            ? curr
            : best
        })

  /* ---------------- UI ---------------- */

  return (
    <GraphCard title={title}>
      <p className="mb-1 text-xs text-gray-500">
        {description}
      </p>

      {bestItem && (
        <p className="mb-3 text-xs font-medium text-emerald-700">
          🏆 Best Model:{" "}
          <span className="font-semibold">
            {bestItem.model}
          </span>
        </p>
      )}

      <ResponsiveContainer width="100%" height={340}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 10, bottom: 60 }}
        >
          <XAxis
            dataKey="model"
            angle={-25}
            textAnchor="end"
            interval={0}
            height={70}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            width={60}
          />
        <Tooltip
  formatter={(value) => {
    if (typeof value !== "number") return value ?? ""

    return unit
      ? `${value.toFixed(2)} ${unit}`
      : value.toFixed(2)
  }}
/>


          <Bar dataKey={dataKey} radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  bestItem &&
                  entry.model === bestItem.model
                    ? "#10b981" // emerald (best)
                    : "#000000" // normal
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <p className="mt-2 text-xs text-gray-600">
        {higherIsBetter
          ? "Higher is better ↑"
          : "Lower is better ↓"}
      </p>
    </GraphCard>
  )
}
