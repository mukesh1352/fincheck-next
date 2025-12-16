"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

type ChartItem = {
  model: string
  confidence: number
}

type Props = {
  data: ChartItem[]
}

export default function ChartSection({ data }: Props) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Model Confidence Comparison
      </h2>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
          />

          <XAxis
            dataKey="model"
            tick={{ fill: "#374151", fontSize: 12 }}
          />

          <YAxis
            domain={[0, 1]}
            tick={{ fill: "#374151", fontSize: 12 }}
            tickFormatter={(v: number) =>
              `${Math.round(v * 100)}%`
            }
          />

<Tooltip
  formatter={(value: unknown): string => {
    if (typeof value === "number") {
      return `${Math.round(value * 100)}%`
    }

    if (typeof value === "string") {
      return value
    }

    return ""
  }}
  contentStyle={{
    backgroundColor: "#111827",
    borderRadius: "12px",
    border: "none",
    color: "#fff",
    fontSize: "12px",
  }}
  labelStyle={{ color: "#9ca3af" }}
/>



          <Bar
            dataKey="confidence"
            fill="#2563eb"
            radius={[10, 10, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
