export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
import connectDB from "@/lib/mongodb"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) {
          return null
        }

        const db = await connectDB()

        const user = await db
          .collection("users")
          .findOne({ username: credentials.username })

        if (!user) return null

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash // ✅ MATCHES SIGNUP
        )

        if (!valid) return null

        return {
          id: user._id.toString(),
          name: user.username,
        }
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
