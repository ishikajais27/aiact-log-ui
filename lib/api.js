'use client'
import { useCallback, useEffect, useState } from 'react'

/* Requests go to /api/*; next.config.js proxies them to BACKEND_URL on the server.
   The backend holds every secret (incl. GROQ_API_KEY); the frontend sends none. */
export async function api(path, { method = 'GET', params, body } = {}) {
  const q =
    params && Object.keys(params).length
      ? '?' + new URLSearchParams(params)
      : ''
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  const r = await fetch(`/api${path}${q}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  let data = null
  try {
    data = await r.json()
  } catch {}
  if (!r.ok) {
    const d = data?.detail
    throw new Error(
      typeof d === 'string'
        ? d
        : Array.isArray(d)
          ? d.map((x) => x.msg).join('; ')
          : `HTTP ${r.status}`,
    )
  }
  return data
}

export function useApi(path, params) {
  const [s, set] = useState({ data: null, error: null, loading: true })
  const pk = JSON.stringify(params || {})
  const reload = useCallback(async () => {
    set((x) => ({ ...x, loading: true }))
    try {
      set({
        data: await api(path, { params: JSON.parse(pk) }),
        error: null,
        loading: false,
      })
    } catch (e) {
      set({ data: null, error: e.message, loading: false })
    }
  }, [path, pk])
  useEffect(() => {
    reload()
  }, [reload])
  return { ...s, reload }
}

export function useAction() {
  const [s, set] = useState({ loading: false, data: null, error: null })
  const run = async (fn) => {
    set({ loading: true, data: null, error: null })
    try {
      set({ loading: false, data: await fn(), error: null })
    } catch (e) {
      set({ loading: false, data: null, error: e.message })
    }
  }
  return [s, run]
}

export const fmt = (x, d = 3) =>
  x === null || x === undefined || Number.isNaN(x) ? '—' : Number(x).toFixed(d)
export const short = (x, n = 10) => (x ? String(x).slice(0, n) + '…' : '—')
