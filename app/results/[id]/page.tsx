"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams } from "next/navigation"
import ChartSection from "@/components/charts/ChartSection"
import type { ChartItem } from "@/components/charts/metrics/types"

type ResultDoc = {
  data: Record<
    string,
    {
      confidence_percent?: number
      latency_ms?: number
      entropy?: number
      stability?: number
      ram_mb?: number
    }
  >
}

const MODEL_ORDER = [
  "baseline_mnist.pth",
  "kd_mnist.pth",
  "lrf_mnist.pth",
  "pruned_mnist.pth",
  "quantized_mnist.pth",
  "ws_mnist.pth",
]

export default function ResultPage() {
  const params = useParams()
  const id = typeof params?.id === "string" ? params.id : null

  const [doc, setDoc] = useState<ResultDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedModel, setSelectedModel] = useState("ALL")

  useEffect(() => {
    if (!id) return
    fetch(`/api/results/${id}`)
      .then((r) => r.json())
      .then(setDoc)
      .finally(() => setLoading(false))
  }, [id])

  const chartData: ChartItem[] = useMemo(() => {
    if (!doc?.data) return []
    return MODEL_ORDER.map((model) => {
      const v = doc.data[model] ?? {}
      return {
        model,
        confidence_percent: v.confidence_percent ?? 0,
        latency_ms: v.latency_ms ?? 0,
        entropy: v.entropy ?? 0,
        stability: v.stability ?? 0,
        ram_delta_mb: v.ram_mb ?? 0,
      }
    })
  }, [doc])

  const recommendedModel = [...chartData].sort(
    (a, b) => a.latency_ms - b.latency_ms
  )[0]?.model

  if (loading) return <p className="p-8">Loading…</p>

  return (
    <div className="mx-auto max-w-7xl p-8 space-y-12">

      {/* 🔹 USER RECOMMENDATION */}
      <div className="rounded-xl bg-blue-50 border p-5">
        <h2 className="font-semibold text-blue-800">
          ✅ Recommended Model
        </h2>
        <p className="text-sm text-blue-700 mt-1">
          <strong>{recommendedModel}</strong> is recommended because it
          provides the fastest response time while maintaining high confidence.
        </p>
      </div>

      {/* 🔽 MODEL SELECTOR */}
      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        className="rounded-lg border px-3 py-2 text-sm"
      >
        <option value="ALL">Compare all models</option>
        {MODEL_ORDER.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      {selectedModel === "ALL" && (
        <ChartSection data={chartData} selectedModel={selectedModel} />
      )}

      {/* 🔍 RAW OUTPUT */}
      <div className="rounded-xl border bg-gray-50 p-6">
        <h3 className="font-semibold mb-2">
          Raw Model Output (for transparency)
        </h3>
        <pre className="bg-white rounded p-4 text-xs overflow-auto">
          {JSON.stringify(doc?.data, null, 2)}
        </pre>
      </div>
    </div>
  )
}
