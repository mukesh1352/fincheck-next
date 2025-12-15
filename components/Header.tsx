import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import SignOutButton from "./sign-out-button"

export default async function Header() {
  const session = await getServerSession(authOptions)

  return (
    <header className="border-b border-gray-200 bg-white">
      {/* Top row */}
      <div className="mx-auto max-w-6xl px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Brand / Sign out */}
          {session ? (
            <SignOutButton />
          ) : (
            <div className="text-sm font-semibold text-gray-950">
              Fincheck
            </div>
          )}

          {/* Auth actions */}
          {!session && (
            <div className="flex items-center gap-4 text-sm">
              <a
                href="/sign-in"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Login
              </a>
              <a
                href="/sign-up"
                className="rounded-md border border-gray-300 px-2.5 py-1 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                Sign up
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <nav className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-2">
          <ul className="flex gap-5 text-sm text-gray-600">
            <li>
              <a
                href="/image-loader"
                className="hover:text-gray-900 transition-colors"
              >
                Image Loader
              </a>
            </li>
            <li>
              <a
                href="/results"
                className="hover:text-gray-900 transition-colors"
              >
                Results
              </a>
            </li>
            <li>
              <a
                href="/predictions"
                className="hover:text-gray-900 transition-colors"
              >
                Predictions
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}
