export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import bcrypt from "bcrypt"
import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db()

    const existing = await db.collection("users").findOne({ username })
    if (existing) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await db.collection("users").insertOne({
      username,
      passwordHash,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
