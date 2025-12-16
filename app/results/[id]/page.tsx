"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

export default function ResultPage() {
  const { id } = useParams()
  const [doc, setDoc] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/results/${id}`)
      .then(r => r.json())
      .then(setDoc)
  }, [id])

  if (!doc) return <p className="p-8">Loading...</p>

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Inference Results</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(doc.data, null, 2)}
      </pre>
    </div>
  )
}
