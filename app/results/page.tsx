import Link from "next/link"
import connectDB from "@/lib/mongodb"

export const dynamic = "force-dynamic"

export default async function ResultsPage() {
  const db = await connectDB()
  const docs = await db
    .collection("model_results")
    .find()
    .sort({ createdAt: -1 })
    .toArray()

  return (
    <div className="p-8 space-y-2">
      <h1 className="text-2xl font-bold">Results</h1>
      {docs.map(d => (
        <Link
          key={d._id.toString()}
          href={`/results/${d._id}`}
          className="block underline"
        >
          {new Date(d.createdAt).toLocaleString()}
        </Link>
      ))}
    </div>
  )
}
