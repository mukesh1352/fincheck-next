import { ChartItem } from "./types"

export const METRIC_META: Record<
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
      "End-to-end inference time per image. Lower latency is better.",
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
      "Measures uncertainty in output distribution. Lower entropy indicates more confident predictions.",
    higherIsBetter: false,
  },

  stability: {
    label: "Logit Stability",
    description:
      "Standard deviation of logits. Lower values indicate more stable outputs.",
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
      "Time penalty when model is loaded for the first time. Lower is better.",
    higherIsBetter: false,
  },
}
