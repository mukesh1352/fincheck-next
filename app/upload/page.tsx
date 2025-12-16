"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit() {
    if (!file) return
    setLoading(true)

    try {
      const fd = new FormData()
      fd.append("image", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      })

      // 🔒 Handle backend failure safely
      if (!res.ok) {
        const text = await res.text()
        console.error("Upload failed:", text)
        alert("Upload failed. Check backend logs.")
        return
      }

      const data = await res.json()

      if (!data?.id) {
        throw new Error("No ID returned from API")
      }

      router.push(`/results/${data.id}`)
    } catch (err) {
      console.error(err)
      alert("Something went wrong while uploading.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Upload Image</h1>

      <input
        type="file"
        onChange={e => setFile(e.target.files?.[0] || null)}
      />

      <button
        onClick={submit}
        disabled={loading}
        className="px-4 py-2 bg-black text-white rounded"
      >
        {loading ? "Processing..." : "Run Models"}
      </button>
    </div>
  )
}
