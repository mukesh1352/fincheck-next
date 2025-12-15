"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

export default function SignInPage() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    const res = await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError("Invalid username or password")
      return
    }

    window.location.href = "/"
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-12">
      <h1 className="text-xl font-semibold tracking-tight">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Sign in to continue to Fincheck
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          name="username"
          required
          placeholder="Username"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />

        <input
          name="password"
          type="password"
          required
          placeholder="Password"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />

        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className="w-full rounded-md bg-gray-900 py-2 text-sm text-white
                     hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-gray-600">
        Don’t have an account?{" "}
        <a href="/sign-up" className="font-medium text-gray-900 hover:underline">
          Sign up
        </a>
      </p>
    </main>
  )
}
