import type { ChartItem } from "./types"

export const METRIC_META: Record<
  keyof ChartItem,
  {
    label: string
    description: string        // short tooltip
    userHint: string           // non-technical explanation
    higherIsBetter: boolean
  }
> = {
  model: {
    label: "Model",
    description: "",
    userHint: "",
    higherIsBetter: true,
  },

  confidence_percent: {
    label: "Confidence (%)",
    description:
      "How sure the model is about its prediction.",
    userHint:
      "Higher confidence means the model is more certain about its decision.",
    higherIsBetter: true,
  },

  latency_ms: {
    label: "Latency (ms)",
    description:
      "Time taken to process one image.",
    userHint:
      "Lower latency means faster response, which is better for real-time applications.",
    higherIsBetter: false,
  },

  entropy: {
    label: "Prediction Uncertainty",
    description:
      "Measures how uncertain the model is.",
    userHint:
      "Lower uncertainty means the model is more decisive and reliable.",
    higherIsBetter: false,
  },

  stability: {
    label: "Prediction Stability",
    description:
      "Consistency of model outputs.",
    userHint:
      "Lower values indicate more stable and reliable predictions.",
    higherIsBetter: false,
  },

  ram_delta_mb: {
    label: "Memory Usage (MB)",
    description:
      "Extra memory used during inference.",
    userHint:
      "Lower memory usage is better for deployment on limited hardware.",
    higherIsBetter: false,
  },
}
