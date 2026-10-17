import { CapacitorHttp } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import { isNative } from './native'

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
export const TASHKENT = { lat: 41.2995, lng: 69.2401 }

/** Hozirgi joylashuv { lat, lng, accuracy }. Ruxsat so'raladi. */
export async function currentPosition() {
  if (isNative) {
    const perm = await Geolocation.checkPermissions().catch(() => null)
    if (perm?.location !== 'granted') {
      const req = await Geolocation.requestPermissions({ permissions: ['location'] })
      if (req.location !== 'granted' && req.coarseLocation !== 'granted') {
        throw Object.assign(new Error('denied'), { code: 'denied' })
      }
    }
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 })
    return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }
  }
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(Object.assign(new Error('unsupported'), { code: 'unsupported' }))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) =>
        reject(Object.assign(new Error(err.message), { code: err.code === 1 ? 'denied' : 'failed' })),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    )
  })
}

/** Koordinata → manzil matni (Mapbox, sayt bilan bir xil) */
export async function reverseGeocode(lng, lat) {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`,
    )
    const data = await res.json()
    return data.features?.[0]?.place_name || null
  } catch {
    return null
  }
}

const valid = (lat, lng) =>
  !Number.isNaN(lat) && !Number.isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180

/** Google / Yandex xarita havolasidan koordinata (saytdagi LocationPicker qoidalari) */
export function coordsFromLink(link) {
  const url = String(link || '').trim()
  const google = [
    /[?&]q=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/,
    /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
    /[?&]center=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /[?&]query=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
  ]
  for (const re of google) {
    const m = url.match(re)
    if (m && valid(+m[1], +m[2])) return { lat: +m[1], lng: +m[2] }
  }
  // Yandex: ll=uzunlik,kenglik (yoki ~ bilan)
  const yandex = [/[?&]ll=(-?\d+\.?\d*)(?:,|%2C|~)(-?\d+\.?\d*)/i, /[?&]pt=(-?\d+\.?\d*)(?:,|%2C)(-?\d+\.?\d*)/i]
  for (const re of yandex) {
    const m = url.match(re)
    if (m) {
      let lng = +m[1]
      let lat = +m[2]
      if (Math.abs(lat) > 90) [lat, lng] = [lng, lat]
      if (valid(lat, lng)) return { lat, lng }
    }
  }
  // Oddiy "41.31, 69.24" ko'rinishi
  const plain = url.match(/(-?\d{1,3}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/)
  if (plain && valid(+plain[1], +plain[2])) return { lat: +plain[1], lng: +plain[2] }
  return null
}

const SHORT_LINK = /maps\.app\.goo\.gl|goo\.gl\/maps|yandex\.[a-z]+\/maps\/-\/|ya\.cc/i

/** Havoladan koordinata: qisqa havolalar telefonda to'g'ridan-to'g'ri ochib ko'riladi */
export async function resolveLink(link) {
  const direct = coordsFromLink(link)
  if (direct) return direct
  const url = String(link || '').trim().match(/https?:\/\/\S+/)?.[0]
  if (!url || !SHORT_LINK.test(url)) return null
  try {
    if (isNative) {
      // Ilovada CORS yo'q — yo'naltirishlarni o'zimiz kuzatamiz
      const res = await CapacitorHttp.get({ url, responseType: 'text' })
      return (
        coordsFromLink(res.url || '') ||
        coordsFromLink(
          String(res.data || '').match(/https:\/\/www\.google\.[^"'\s]+\/maps[^"'\s<>]+/)?.[0] ||
            '',
        )
      )
    }
    const res = await fetch('https://corsproxy.io/?' + encodeURIComponent(url))
    if (res.url && res.url !== url) {
      const c = coordsFromLink(res.url)
      if (c) return c
    }
    const text = await res.text()
    return coordsFromLink(text.match(/https:\/\/www\.google\.[^"'\s]+\/maps[^"'\s<>]+/)?.[0] || '')
  } catch {
    return null
  }
}
