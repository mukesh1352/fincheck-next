import connectDB from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = await connectDB()
  const doc = await db
    .collection("model_results")
    .findOne({ _id: new ObjectId(id) })

  return NextResponse.json(doc)
}
