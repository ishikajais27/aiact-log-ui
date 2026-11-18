'use client'
import { useCallback, useEffect, useState } from 'react'

const KEY = 'auditKey'
export const getKey = () =>
  typeof window === 'undefined' ? '' : sessionStorage.getItem(KEY) || ''
export const setKey = (k) => sessionStorage.setItem(KEY, k)

export async function api(path, { method = 'GET', params, body } = {}) {
  const q =
    params && Object.keys(params).length
      ? '?' + new URLSearchParams(params)
      : ''
  const headers = {}
  const k = getKey()
  if (k) headers['X-API-Key'] = k
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
  if (!r.ok)
    throw new Error(
      typeof data?.detail === 'string' ? data.detail : `HTTP ${r.status}`,
    )
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
