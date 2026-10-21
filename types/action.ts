/**
 * Hasil standar Server Action (§10.4).
 * Semua Server Action mengembalikan tipe ini.
 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | {
      ok: false
      error: { code: string; message: string; fieldErrors?: Record<string, string[]> }
    }
