import { MongoClient, Db } from "mongodb"

const uri = process.env.MONGODB_URI!

if (!uri) {
  throw new Error("Please define MONGODB_URI in .env")
}

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export default async function connectDB(): Promise<Db> {
  if (cachedDb) return cachedDb

  const client = cachedClient ?? new MongoClient(uri)
  if (!cachedClient) {
    cachedClient = await client.connect()
  }

  cachedDb = cachedClient.db()
  return cachedDb
}
