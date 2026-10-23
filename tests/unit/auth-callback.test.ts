// @vitest-environment node
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const auth = {
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn(),
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth }),
}))

const { GET } = await import("@/app/auth/callback/route")

const ORIGIN = "http://localhost:3000"

async function call(query: string) {
  const response = await GET(new NextRequest(`${ORIGIN}/auth/callback${query}`))
  return { status: response.status, location: response.headers.get("location") }
}

beforeEach(() => {
  auth.exchangeCodeForSession.mockReset().mockResolvedValue({ error: null })
  auth.verifyOtp.mockReset().mockResolvedValue({ error: null })
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("GET /auth/callback", () => {
  it("code valid -> sesi dibuat, redirect ke next", async () => {
    const result = await call("?code=abc&next=%2Freset-password")
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith("abc")
    expect(result).toEqual({ status: 307, location: `${ORIGIN}/reset-password` })
  })

  it("tanpa next -> default /account", async () => {
    expect((await call("?code=abc")).location).toBe(`${ORIGIN}/account`)
  })

  it.each(["//evil.com", "https://evil.com", "/\\evil"])("next berbahaya %j diabaikan -> /account", async (next) => {
    const result = await call(`?code=abc&next=${encodeURIComponent(next)}`)
    expect(result.location).toBe(`${ORIGIN}/account`)
  })

  it("token_hash + type recovery -> verifyOtp lalu redirect", async () => {
    const result = await call("?token_hash=th&type=recovery&next=%2Freset-password")
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: "th", type: "recovery" })
    expect(result.location).toBe(`${ORIGIN}/reset-password`)
  })

  it("type tidak dikenal tidak diproses", async () => {
    const result = await call("?token_hash=th&type=bukan-tipe")
    expect(auth.verifyOtp).not.toHaveBeenCalled()
    expect(result.location).toBe(`${ORIGIN}/login?error=link_invalid`)
  })

  it("kode kedaluwarsa -> /login?error=link_invalid", async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ error: { code: "flow_state_not_found", status: 400 } })
    expect((await call("?code=lama")).location).toBe(`${ORIGIN}/login?error=link_invalid`)
  })

  it("tanpa parameter -> /login?error=link_invalid", async () => {
    expect((await call("")).location).toBe(`${ORIGIN}/login?error=link_invalid`)
  })

  it("respons tidak boleh di-cache bersama", async () => {
    const response = await GET(new NextRequest(`${ORIGIN}/auth/callback?code=abc`))
    expect(response.headers.get("cache-control")).toBe("private, no-store")
  })
})
