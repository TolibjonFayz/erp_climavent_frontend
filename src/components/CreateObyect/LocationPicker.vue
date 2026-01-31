<template>
  <div class="location-picker">
    <div class="map-container">
      <div ref="mapContainer" class="map"></div>

      <!-- Current Location Button -->
      <button @click="getCurrentLocation" class="current-location-btn" :disabled="loading">
        <svg
          v-if="!loading"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <div v-else class="spinner"></div>
        {{ loading ? $t('joylashuvolinmoqda') : $t('meningjoylashuvim') }}
      </button>
    </div>

    <!-- Location Link Input -->
    <div class="location-input-container">
      <label for="location-link" class="input-label">
        {{ $t('joylashuvhavoalasinikiritish') }}
      </label>
      <div class="input-wrapper">
        <input
          id="location-link"
          v-model="locationLink"
          type="text"
          placeholder="https://maps.google.com/... yoki https://yandex.com/maps/..."
          class="location-input"
          @paste="handlePaste"
          @keyup.enter="parseLocationLink"
        />
        <button @click="parseLocationLink" :disabled="!locationLink || parsing" class="parse-btn">
          {{ parsing ? $t('tahlilqilinmoqda') : $t('tanlash') }}
        </button>
      </div>
      <p v-if="linkError" class="error-message">{{ linkError }}</p>
    </div>

    <!-- Selected Location Display -->
    <div v-if="selectedLocation" class="selected-location">
      <h3>{{ $t('tanlanganjoylashuv') }}:</h3>
      <p>
        <strong>{{ $t('Koordinatalar') }}:</strong> {{ selectedLocation.lng.toFixed(6) }},
        {{ selectedLocation.lat.toFixed(6) }}
      </p>
      <p v-if="selectedLocation.address">
        <strong>{{ $t('Manzil') }}:</strong> {{ selectedLocation.address }}
      </p>
      <p v-if="selectedLocation.accuracy" class="accuracy-info">
        <strong>{{ $t('Aniqlik') }}:</strong> ±{{ Math.round(selectedLocation.accuracy) }}m
        <span v-if="selectedLocation.accuracy < 50" class="accuracy-good"
          >📍 {{ $t('yuqoriAniqlik') }}</span
        >
        <span v-else-if="selectedLocation.accuracy < 100" class="accuracy-medium"
          >📍 {{ $t('ortachaAniqlik') }}</span
        >
        <span v-else class="accuracy-low">📍 {{ $t('pastAniqlik') }}</span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// Props
const props = defineProps({
  accessToken: {
    type: String,
    required: true,
  },
  initialCenter: {
    type: Object,
    // Default to Tashkent, Uzbekistan
    default: () => ({ lng: 69.2401, lat: 41.2995 }),
  },
  initialZoom: {
    type: Number,
    default: 12,
  },
})

// Emits
const emit = defineEmits(['location-selected', 'current-location', 'link-parsed'])

// Reactive data
const mapContainer = ref(null)
const selectedLocation = ref(null)
const loading = ref(false)
const locationLink = ref('')
const parsing = ref(false)
const linkError = ref('')
let map = null
let marker = null

// Initialize map
const initMap = () => {
  if (!window.mapboxgl) {
    console.error('Mapbox GL JS is not loaded')
    return
  }

  window.mapboxgl.accessToken = props.accessToken

  // Force Tashkent as the initial center, ignore prop
  map = new window.mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [69.2401, 41.2995], // Tashkent coordinates
    zoom: props.initialZoom,
  })

  map.on('load', () => {
    map.on('click', onMapClick)
    map.addControl(new window.mapboxgl.NavigationControl(), 'top-right')
  })
}

const onMapClick = async (e) => {
  const { lng, lat } = e.lngLat
  selectedLocation.value = {
    lng,
    lat,
    address: null,
  }

  if (marker) {
    marker.remove()
  }

  marker = new window.mapboxgl.Marker({ color: '#3b82f6' }).setLngLat([lng, lat]).addTo(map)

  try {
    const address = await reverseGeocode(lng, lat)
    if (selectedLocation.value) {
      selectedLocation.value.address = address
    }
  } catch (error) {
    console.error('Error getting address:', error)
  }

  // Emit event
  emit('location-selected', { lng, lat, address: selectedLocation.value.address })
}

// Get current location
const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    alert('Brauzeringizda geolokatsiya qo‘llab-quvvatlanmaydi.')
    return
  }

  loading.value = true

  // First check if geolocation permission is granted
  if (navigator.permissions) {
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'denied') {
        loading.value = false
        alert('Joylashuvga ruxsat berilmagan. Brauzer sozlamalaridan joylashuvga ruxsat bering.')
        return
      }
    })
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { longitude, latitude, accuracy } = position.coords

      // Update map center
      map.flyTo({
        center: [longitude, latitude],
        zoom: 16,
        duration: 1000,
      })

      // Update selected location
      selectedLocation.value = {
        lng: longitude,
        lat: latitude,
        address: null,
        accuracy: accuracy,
      }

      // Remove existing marker
      if (marker) {
        marker.remove()
      }

      // Add current location marker with popup
      marker = new window.mapboxgl.Marker({
        color: '#ef4444',
        scale: 1.2,
      })
        .setLngLat([longitude, latitude])
        .addTo(map)

      // Add accuracy circle if accuracy is available
      if (accuracy && accuracy < 1000) {
        const accuracyCircle = {
          id: 'accuracy-circle',
          type: 'circle',
          source: {
            type: 'geojson',
            data: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
          },
          paint: {
            'circle-radius': {
              base: 1.75,
              stops: [
                [12, accuracy * 0.1],
                [22, accuracy * 0.5],
              ],
            },
            'circle-color': '#ef4444',
            'circle-opacity': 0.1,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ef4444',
            'circle-stroke-opacity': 0.3,
          },
        }

        // Remove existing accuracy circle
        if (map.getLayer('accuracy-circle')) {
          map.removeLayer('accuracy-circle')
          map.removeSource('accuracy-circle')
        }

        map.addLayer(accuracyCircle)
      }

      // Try to get address
      try {
        const address = await reverseGeocode(longitude, latitude)
        if (selectedLocation.value) {
          selectedLocation.value.address = address
        }
      } catch (error) {
        console.error('Manzil olishda xatolik:', error)
      }

      loading.value = false

      // Emit event
      emit('current-location', {
        lng: longitude,
        lat: latitude,
        address: selectedLocation.value.address,
        accuracy: accuracy,
      })
    },
    (error) => {
      loading.value = false
      console.error('Geolokatsiya xatosi:', error)

      let errorMessage = 'Joylashuvni aniqlab bo‘lmadi. '

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage +=
            'Joylashuvga ruxsat berilmadi. Iltimos, ruxsat bering va qayta urinib ko‘ring.'
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage +=
            'Joylashuv ma’lumoti mavjud emas. GPS yoki internet ulanishini tekshiring.'
          break
        case error.TIMEOUT:
          errorMessage += 'Joylashuv so‘rovi vaqti tugadi. Qayta urinib ko‘ring.'
          break
        default:
          errorMessage += 'Noma’lum xatolik yuz berdi. Qayta urinib ko‘ring.'
          break
      }

      alert(errorMessage)
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    },
  )

  // Also try to watch position for continuous updates
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { longitude, latitude } = position.coords

      // Only update if location has changed significantly (more than 10 meters)
      if (selectedLocation.value) {
        const distance = getDistanceFromLatLonInM(
          selectedLocation.value.lat,
          selectedLocation.value.lng,
          latitude,
          longitude,
        )

        if (distance > 10) {
          console.log('Location updated:', { longitude, latitude })

          // Update marker position
          if (marker) {
            marker.setLngLat([longitude, latitude])
          }

          selectedLocation.value.lng = longitude
          selectedLocation.value.lat = latitude
        }
      }
    },
    (error) => {
      console.log('Watch position error:', error)
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 30000,
    },
  )

  // Clear watch after 30 seconds
  setTimeout(() => {
    navigator.geolocation.clearWatch(watchId)
  }, 30000)
}

// Parse location link
const parseLocationLink = async () => {
  if (!locationLink.value.trim()) return

  parsing.value = true
  linkError.value = ''

  try {
    let coords = null
    const url = locationLink.value.trim()

    // First try to extract coordinates directly
    coords = extractCoordinatesFromLink(url)

    // If no coordinates found and it's a short URL, try alternative methods
    if (!coords && isShortUrl(url)) {
      console.log('Qisqa havola qayta ishlanmoqda:', url)
      coords = await handleShortUrl(url)
    }

    if (coords) {
      const { lat, lng } = coords

      // Update map center
      map.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 1500,
      })

      // Update selected location
      selectedLocation.value = {
        lng,
        lat,
        address: null,
        fromLink: true,
      }

      // Remove existing marker
      if (marker) {
        marker.remove()
      }

      // Add new marker
      marker = new window.mapboxgl.Marker({ color: '#8b5cf6' }).setLngLat([lng, lat]).addTo(map)

      // Try to get address
      try {
        const address = await reverseGeocode(lng, lat)
        if (selectedLocation.value) {
          selectedLocation.value.address = address
        }
      } catch (error) {
        console.error('Manzil olishda xatolik:', error)
      }

      // Clear the input
      locationLink.value = ''

      // Emit event
      emit('link-parsed', { lng, lat, address: selectedLocation.value.address })
    } else {
      linkError.value =
        'Havoladan koordinatalar olinmadi. Iltimos, boshqa formatdagi havolani yoki to‘liq havolani kiriting.'
    }
  } catch (error) {
    console.error('Joylashuv havolasini tahlil qilishda xatolik:', error)
    linkError.value = 'Joylashuv havolasini tahlil qilishda xatolik. Qayta urinib ko‘ring.'
  }

  parsing.value = false
}

// Add this helper function to expand short URLs by following redirects
const expandShortUrlByRedirect = async (shortUrl) => {
  // Use a CORS proxy that preserves redirects and exposes the final URL
  // We'll use corsproxy.io for this
  try {
    const response = await fetch('https://corsproxy.io/?' + encodeURIComponent(shortUrl), {
      method: 'GET',
      redirect: 'follow',
    })
    // Try to get the final URL from the response (if CORS proxy exposes it)
    // Some proxies put the final URL in response.url, some in headers
    if (response.url && response.url !== shortUrl) {
      return response.url
    }
    // Fallback: try to parse from HTML (look for canonical or og:url)
    const text = await response.text()
    const canonicalMatch = text.match(/<link rel="canonical" href="([^"]+)"/)
    if (canonicalMatch) {
      return canonicalMatch[1]
    }
    const ogUrlMatch = text.match(/property="og:url" content="([^"]+)"/)
    if (ogUrlMatch) {
      return ogUrlMatch[1]
    }
    return null
  } catch (e) {
    return null
  }
}

// Update handleShortUrl to use the new function for Google Maps short URLs
const handleShortUrl = async (shortUrl) => {
  // Special handling for Google Maps short URLs
  if (shortUrl.includes('maps.app.goo.gl') || shortUrl.includes('goo.gl/maps')) {
    // Try to expand the short URL to get the real URL with coordinates
    const expandedUrl = await expandShortUrlByRedirect(shortUrl)
    if (expandedUrl) {
      const coords = extractCoordinatesFromLink(expandedUrl)
      if (coords) {
        return coords
      }
    }
    // If still not found, try to fetch the HTML and extract coordinates from there
    try {
      const response = await fetch('https://corsproxy.io/?' + encodeURIComponent(shortUrl))
      const text = await response.text()
      // Try to find a google maps URL with coordinates in the HTML
      const urlMatch = text.match(/https:\/\/www\.google\.[^"' ]+\/maps[^\s"'<>]+/)
      if (urlMatch) {
        const coords = extractCoordinatesFromLink(urlMatch[0])
        if (coords) {
          return coords
        }
      }
    } catch (e) {
      // ignore
    }
    linkError.value =
      'Google Maps qisqa havolalari uchun, havolani brauzerda oching va manzil satridan to‘liq havolani nusxa oling.'
    return null
  }

  // Strategy 2: Try different CORS proxies
  const corsProxies = [
    'https://corsproxy.io/?',
    'https://cors-anywhere.herokuapp.com/',
    'https://api.codetabs.com/v1/proxy?quest=',
  ]

  for (const proxy of corsProxies) {
    try {
      const response = await fetch(proxy + encodeURIComponent(shortUrl), {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      })

      if (response.ok) {
        const text = await response.text()
        const coords = extractCoordinatesFromLink(text)
        if (coords) {
          return coords
        }
      }
    } catch (e) {
      console.log(`Proxy ${proxy} ishlamadi:`, e)
      continue
    }
  }

  // Strategy 3: Manual URL reconstruction for known patterns
  if (shortUrl.includes('yandex.uz/maps/-/')) {
    // For Yandex short URLs, we can try to reconstruct based on common patterns
    linkError.value =
      'Yandex qisqa havolalari uchun, havolani brauzerda oching va manzil satridan to‘liq havolani nusxa oling.'
    return null
  }

  if (shortUrl.includes('maps.app.goo.gl')) {
    linkError.value =
      'Google Maps qisqa havolalari uchun, havolani brauzerda oching va manzil satridan to‘liq havolani nusxa oling.'
    return null
  }

  return null
}

// Extract place ID from Google Maps URLs
const extractPlaceId = (url) => {
  const match = url.match(/\/maps\/place\/([^/]+)/i)
  return match ? match[1] : null
}

// Check if URL is a short URL that needs expansion
const isShortUrl = (url) => {
  const shortUrlPatterns = [
    /goo\.gl\/maps/,
    /maps\.app\.goo\.gl/,
    /yandex\.uz\/maps/,
    /yandex\.ru\/maps\/.*\/\w+$/,
    /ya\.cc/,
    /bit\.ly/,
    /tinyurl\.com/,
    /t\.co/,
  ]

  return shortUrlPatterns.some((pattern) => pattern.test(url))
}

// Expand short URLs to get the full URL with coordinates
const expandShortUrl = async (shortUrl) => {
  // This function is now replaced by handleShortUrl
  // Keeping it for backward compatibility
  return await handleShortUrl(shortUrl)
}

// Extract coordinates from various map links
const extractCoordinatesFromLink = (link) => {
  const url = link.trim()

  // Google Maps patterns
  const googlePatterns = [
    // https://maps.google.com/?q=40.7128,-74.0060
    /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    // https://www.google.com/maps/@40.7128,-74.0060,15z
    /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    // https://maps.google.com/maps?ll=40.7128,-74.0060
    /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    // https://goo.gl/maps/... (after redirect, contains coordinates)
    /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
    // Place ID format: extract from URL if has coordinates
    /place\/[^/]*\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    // New Google Maps format: https://maps.google.com/?q=41.311158,69.240562
    /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    // Data format in expanded URLs
    /data=.*?(-?\d+\.?\d{6,}),(-?\d+\.?\d{6,})/,
    // Center parameter
    /[?&]center=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
  ]

  // Yandex Maps patterns
  const yandexPatterns = [
    // https://yandex.com/maps/?ll=37.617700,55.755800&z=10
    /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    // https://maps.yandex.ru/?ll=37.617700,55.755800
    /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    // https://yandex.ru/maps/213/moscow/?ll=37.617700~55.755800
    /ll=(-?\d+\.?\d*)~(-?\d+\.?\d*)/,
    // https://maps.yandex.com/10758/tashkent/?ll=69.240562,41.311158&z=12
    /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    // Yandex short URL expanded format
    /yandex.*?ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/i,
    // Alternative Yandex format
    /maps.*?(-?\d+\.?\d{6,}),(-?\d+\.?\d{6,})/,
  ]

  // Try Google Maps patterns
  for (const pattern of googlePatterns) {
    const match = url.match(pattern)
    if (match) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng }
      }
    }
  }

  // Try Yandex Maps patterns
  for (const pattern of yandexPatterns) {
    const match = url.match(pattern)
    if (match) {
      let lng = parseFloat(match[1])
      let lat = parseFloat(match[2])

      // For some Yandex formats, coordinates might be swapped
      if (Math.abs(lng) > 180 || Math.abs(lat) > 90) {
        ;[lat, lng] = [lng, lat]
      }

      if (isValidCoordinate(lat, lng)) {
        return { lat, lng }
      }
    }
  }

  // Try to find any coordinate-like patterns in the URL (more flexible)
  const genericPatterns = [
    /(-?\d+\.?\d{4,}),(-?\d+\.?\d{4,})/g,
    /(-?\d{1,3}\.\d{6,}),(-?\d{1,3}\.\d{6,})/g,
    /lat[=:]\s*(-?\d+\.?\d+).*?lng[=:]\s*(-?\d+\.?\d+)/gi,
    /lng[=:]\s*(-?\d+\.?\d+).*?lat[=:]\s*(-?\d+\.?\d+)/gi,
  ]

  for (const pattern of genericPatterns) {
    let match
    while ((match = pattern.exec(url)) !== null) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng }
      }
    }
  }

  return null
}

// Validate coordinates
const isValidCoordinate = (lat, lng) => {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

// Handle paste event
const handlePaste = (event) => {
  // Clear any previous errors
  linkError.value = ''

  // Auto-parse after a short delay
  setTimeout(() => {
    if (locationLink.value.trim()) {
      parseLocationLink()
    }
  }, 100)
}

// Helper function to calculate distance between two points
const getDistanceFromLatLonInM = (lat1, lon1, lat2, lon2) => {
  const R = 6371000 // Radius of the earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // Distance in meters
  return d
}

// Reverse geocoding
const reverseGeocode = async (lng, lat) => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${props.accessToken}`,
    )
    const data = await response.json()

    if (data.features && data.features.length > 0) {
      return data.features[0].place_name
    }
    return null
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}

// Lifecycle hooks
onMounted(() => {
  // Load Mapbox GL JS
  if (!window.mapboxgl) {
    const script = document.createElement('script')
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'
    script.onload = initMap
    document.head.appendChild(script)

    // Load CSS
    const link = document.createElement('link')
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  } else {
    initMap()
  }
})

onUnmounted(() => {
  if (map) {
    map.remove()
  }
})

// Expose methods for parent component
defineExpose({
  getSelectedLocation: () => selectedLocation.value,
  clearSelection: () => {
    selectedLocation.value = null
    locationLink.value = ''
    linkError.value = ''
    if (marker) {
      marker.remove()
      marker = null
    }
  },
  setLocationFromLink: (link) => {
    locationLink.value = link
    parseLocationLink()
  },
})
</script>

<style scoped>
.location-picker {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.map-container {
  position: relative;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.map {
  width: 100%;
  height: 100%;
}

.current-location-btn {
  position: absolute;
  bottom: 30px;
  right: 10px;
  background: white;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  z-index: 1000;
}

.current-location-btn:hover:not(:disabled) {
  background: #f9fafb;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.current-location-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.selected-location {
  margin-top: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.selected-location h3 {
  margin: 0 0 8px 0;
  color: #1e293b;
  font-size: 18px;
}

.selected-location p {
  margin: 4px 0;
  color: #475569;
  font-size: 14px;
}

.accuracy-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.accuracy-good {
  color: #16a34a;
  font-size: 12px;
}

.accuracy-medium {
  color: #ca8a04;
  font-size: 12px;
}

.accuracy-low {
  color: #dc2626;
  font-size: 12px;
}

.location-input-container {
  margin-top: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.input-label {
  display: block;
  margin-bottom: 8px;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
}

.input-wrapper {
  display: flex;
  gap: 8px;
}

.location-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  transition: border-color 0.2s;
}

.location-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.location-input::placeholder {
  color: #9ca3af;
}

.parse-btn {
  padding: 10px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.parse-btn:hover:not(:disabled) {
  background: #2563eb;
}

.parse-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.error-message {
  margin-top: 8px;
  color: #dc2626;
  font-size: 13px;
  font-weight: 500;
}
</style>
