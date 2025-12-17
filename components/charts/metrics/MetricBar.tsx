"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import GraphCard from "../GraphCard"
import { ChartItem } from "./types"

/* ---------------- METRIC SEMANTICS ---------------- */

const METRIC_INFO: Record<
  keyof ChartItem,
  {
    label: string
    description: string
    higherIsBetter: boolean
  }
> = {
  model: {
    label: "Model",
    description: "",
    higherIsBetter: true,
  },
  confidence: {
    label: "Confidence (%)",
    description:
      "Maximum softmax probability. Higher confidence indicates more certain predictions.",
    higherIsBetter: true,
  },
  latency_ms: {
    label: "Latency (ms)",
    description:
      "End-to-end inference time per image. Lower latency indicates faster models.",
    higherIsBetter: false,
  },
  throughput: {
    label: "Throughput (samples/sec)",
    description:
      "Number of images processed per second. Higher throughput is better.",
    higherIsBetter: true,
  },
  entropy: {
    label: "Prediction Entropy",
    description:
      "Uncertainty of the prediction distribution. Lower entropy indicates more confident outputs.",
    higherIsBetter: false,
  },
  stability: {
    label: "Stability",
    description:
      "Logit variability across classes. Lower values indicate more stable predictions.",
    higherIsBetter: false,
  },
  ram_mb: {
    label: "RAM Usage (MB)",
    description:
      "Additional memory consumed during inference. Lower memory usage is better.",
    higherIsBetter: false,
  },
  cold_start_ms: {
    label: "Cold Start Time (ms)",
    description:
      "Time penalty when the model is loaded for the first time. Lower is better.",
    higherIsBetter: false,
  },
}

/* ---------------- COMPONENT ---------------- */

export default function MetricBar({
  dataKey,
  data,
}: {
  dataKey: keyof ChartItem
  data: ChartItem[]
}) {
  const meta = METRIC_INFO[dataKey]

  // Determine best model for this metric
  const bestModel = [...data].sort((a, b) => {
    const va = a[dataKey] as number
    const vb = b[dataKey] as number
    return meta.higherIsBetter ? vb - va : va - vb
  })[0]?.model

  return (
    <GraphCard
      title={meta.label}
      description={`${meta.description} ${
        meta.higherIsBetter
          ? "Higher values are better."
          : "Lower values are better."
      }`}
      bestLabel={bestModel}
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <XAxis dataKey="model" hide />
          <YAxis />
          <Tooltip />
          <Bar dataKey={dataKey as string} />
        </BarChart>
      </ResponsiveContainer>
    </GraphCard>
  )
}
