"use client"
import { signOut } from "next-auth/react"

export default function SignOutButton() {
  return (
    <button onClick={() => signOut()} className="font-semibold">
      Fincheck
    </button>
  )
}
