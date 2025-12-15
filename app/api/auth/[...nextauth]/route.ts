export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import NextAuth, { type NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
import clientPromise from "@/lib/mongodb"

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) return null

        const client = await clientPromise
        const db = client.db()

        const user = await db.collection("users").findOne({
          username: credentials.username,
        })

        if (!user) return null

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!valid) return null

        return {
          id: user._id.toString(),
          name: user.username,
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
