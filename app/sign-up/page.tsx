"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

export default function SignUpPage() {
  const [error, setError] = useState("")

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    const formData = new FormData(e.currentTarget)
    const username = formData.get("username")
    const password = formData.get("password")

    const res = await fetch("/api/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error)
      return
    }

    await signIn("credentials", {
      username,
      password,
      callbackUrl: "/",
    })
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-12">
      <h1 className="text-lg font-semibold">Create account</h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input name="username" required placeholder="Username" className="w-full border px-3 py-2 text-sm rounded-md" />
        <input name="password" type="password" required placeholder="Password" className="w-full border px-3 py-2 text-sm rounded-md" />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button className="w-full bg-gray-900 text-white py-2 rounded-md text-sm">
          Sign up
        </button>
      </form>
    </main>
  )
}
