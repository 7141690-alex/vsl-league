import { supabase } from './supabase'

const VISITOR_ID_KEY = 'vsl_visitor_id'
const SESSION_ID_KEY = 'vsl_session_id'
const SESSION_STARTED_KEY = 'vsl_session_started'

function getStorageValue(storage, key) {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function setStorageValue(storage, key, value) {
  try {
    storage.setItem(key, value)
  } catch {
    // Ignore storage failures (private mode, disabled cookies, etc.)
  }
}

function getOrCreateId(storage, key) {
  const existing = getStorageValue(storage, key)
  if (existing) return existing
  const newId = globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`
  setStorageValue(storage, key, newId)
  return newId
}

function getNavigationMetrics() {
  const navEntry = globalThis.performance?.getEntriesByType?.('navigation')?.[0]
  if (!navEntry) return null

  return {
    type: navEntry.type,
    redirect_count: navEntry.redirectCount,
    dns_ms: Math.round(navEntry.domainLookupEnd - navEntry.domainLookupStart),
    tcp_ms: Math.round(navEntry.connectEnd - navEntry.connectStart),
    tls_ms: navEntry.secureConnectionStart > 0
      ? Math.round(navEntry.connectEnd - navEntry.secureConnectionStart)
      : null,
    request_ms: Math.round(navEntry.responseStart - navEntry.requestStart),
    response_ms: Math.round(navEntry.responseEnd - navEntry.responseStart),
    dom_interactive_ms: Math.round(navEntry.domInteractive),
    dom_complete_ms: Math.round(navEntry.domComplete),
    load_event_ms: Math.round(navEntry.loadEventEnd),
  }
}

function getConnectionInfo() {
  const connection = globalThis.navigator?.connection
    || globalThis.navigator?.mozConnection
    || globalThis.navigator?.webkitConnection

  if (!connection) return null

  return {
    effective_type: connection.effectiveType ?? null,
    downlink_mbps: connection.downlink ?? null,
    rtt_ms: connection.rtt ?? null,
    save_data: connection.saveData ?? null,
  }
}

function getUtmParams(searchParams) {
  const knownParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'yclid']
  const utm = {}
  for (const key of knownParams) {
    const value = searchParams.get(key)
    if (value) utm[key] = value
  }
  return utm
}

function buildEventPayload(eventType, context = {}) {
  const visitorId = getOrCreateId(globalThis.localStorage, VISITOR_ID_KEY)
  const sessionId = getOrCreateId(globalThis.sessionStorage, SESSION_ID_KEY)
  const url = new URL(globalThis.location.href)
  const nowIso = new Date().toISOString()

  return {
    event_type: eventType,
    visitor_id: visitorId,
    session_id: sessionId,
    page_key: context.pageKey || 'unknown',
    league: context.league || null,
    season_id: context.seasonId || null,
    referrer: globalThis.document?.referrer || null,
    url: url.href,
    path: `${url.pathname}${url.search}${url.hash}`,
    metadata: {
      tracked_at: nowIso,
      context,
      utm: getUtmParams(url.searchParams),
      locale: {
        language: globalThis.navigator?.language ?? null,
        languages: globalThis.navigator?.languages ?? [],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      display: {
        screen_width: globalThis.screen?.width ?? null,
        screen_height: globalThis.screen?.height ?? null,
        color_depth: globalThis.screen?.colorDepth ?? null,
        viewport_width: globalThis.innerWidth ?? null,
        viewport_height: globalThis.innerHeight ?? null,
        pixel_ratio: globalThis.devicePixelRatio ?? null,
      },
      device: {
        user_agent: globalThis.navigator?.userAgent ?? null,
        platform: globalThis.navigator?.platform ?? null,
        vendor: globalThis.navigator?.vendor ?? null,
        hardware_concurrency: globalThis.navigator?.hardwareConcurrency ?? null,
        device_memory_gb: globalThis.navigator?.deviceMemory ?? null,
        max_touch_points: globalThis.navigator?.maxTouchPoints ?? null,
        cookie_enabled: globalThis.navigator?.cookieEnabled ?? null,
        do_not_track: globalThis.navigator?.doNotTrack ?? null,
        online: globalThis.navigator?.onLine ?? null,
        is_standalone_pwa: globalThis.matchMedia?.('(display-mode: standalone)')?.matches
          || globalThis.navigator?.standalone === true,
      },
      performance: getNavigationMetrics(),
      connection: getConnectionInfo(),
    },
  }
}

async function insertAnalytics(payload) {
  const { error } = await supabase.from('site_visit_events').insert(payload)
  if (error) {
    // Keep analytics fully non-blocking for end-users.
    console.warn('[analytics] insert failed', error.message)
  }
}

export function trackSessionStart(context = {}) {
  const alreadyStarted = getStorageValue(globalThis.sessionStorage, SESSION_STARTED_KEY)
  if (alreadyStarted) return

  setStorageValue(globalThis.sessionStorage, SESSION_STARTED_KEY, '1')
  void insertAnalytics(buildEventPayload('session_start', context))
}

export function trackPageView(context = {}) {
  void insertAnalytics(buildEventPayload('page_view', context))
}
