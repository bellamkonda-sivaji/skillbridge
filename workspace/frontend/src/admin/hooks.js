import { useCallback, useEffect, useRef, useState } from 'react'
import { EMPTY_PAGE } from './api'

/**
 * Drives a paged list endpoint: holds filters, debounces the search box, and
 * resets to page 0 whenever a filter other than the page itself changes.
 * Late responses are dropped so a slow request cannot overwrite a newer one.
 */
export function usePagedList(fetcher, initialFilters = {}, { size = 25, debounce = 350 } = {}) {
  const [filters, setFilters] = useState({ q: '', ...initialFilters })
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const seq = useRef(0)
  const first = useRef(true)

  /**
   * The fetcher lives in a ref rather than in the dependency list.
   *
   * Callers naturally write `usePagedList((params) => getThing(id, params))`, which is a new
   * function on every render. With that function as a dependency, `load` was rebuilt every
   * render, the effect re-ran, the state it set caused another render, and the list refetched
   * forever - which on screen looks like a modal blinking between skeleton and content.
   *
   * A ref keeps the newest fetcher available without making identity a reason to reload. What
   * a reload actually depends on is the page, the size and the filters, and those are listed.
   */
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const load = useCallback(() => {
    const mine = ++seq.current
    setLoading(true); setError('')
    const params = { page, size }
    for (const [k, v] of Object.entries(filters)) {
      if (v !== '' && v !== null && v !== undefined) params[k] = v
    }
    fetcherRef.current(params)
      .then((d) => {
        if (mine !== seq.current) return
        setData(d && Array.isArray(d.content) ? d : { ...EMPTY_PAGE, content: Array.isArray(d) ? d : [] })
      })
      .catch(() => { if (mine === seq.current) setError('We could not load that list.') })
      .finally(() => { if (mine === seq.current) setLoading(false) })
  }, [page, size, filters])

  useEffect(() => {
    // Only the free-text box needs debouncing; a dropdown should feel instant.
    if (first.current) { first.current = false; load(); return undefined }
    const t = setTimeout(load, filters.q ? debounce : 0)
    return () => clearTimeout(t)
  }, [load]) // eslint-disable-line react-hooks/exhaustive-deps

  const setFilter = (k, v) => { setPage(0); setFilters((f) => ({ ...f, [k]: v })) }
  const reset = () => { setPage(0); setFilters({ q: '', ...initialFilters }) }

  return {
    rows: data?.content || [],
    meta: data || EMPTY_PAGE,
    filters, setFilter, reset,
    page, setPage,
    loading, error, reload: load,
  }
}

/** One-shot loader for a detail endpoint. */
export function useResource(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true); setError('')
    fetcher()
      .then(setData)
      .catch((e) => setError(e?.response?.data?.message || 'We could not load this.'))
      .finally(() => setLoading(false))
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])
  return { data, setData, error, loading, reload: load }
}
