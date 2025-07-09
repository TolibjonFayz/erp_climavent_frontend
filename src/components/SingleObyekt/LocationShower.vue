<template>
  <div class="location-display">
    <div class="map-container">
      <div ref="mapContainer" class="map"></div>

      <!-- Loading overlay -->
      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
        <p>Xarita yuklanmoqda...</p>
      </div>
    </div>

    <!-- Location Info Display -->
    <div v-if="displayLocation" class="location-info">
      <h3>Joylashuv:</h3>
      <p>
        <strong>Koordinatalar:</strong> {{ displayLocation.lng.toFixed(6) }},
        {{ displayLocation.lat.toFixed(6) }}
      </p>
      <p v-if="displayLocation.address"><strong>Manzil:</strong> {{ displayLocation.address }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

// Props
const props = defineProps({
  accessToken: {
    type: String,
    required: true,
  },
  latitude: {
    type: [Number, String],
    default: null,
  },
  longitude: {
    type: [Number, String],
    default: null,
  },
  zoom: {
    type: Number,
    default: 15,
  },
  showAddress: {
    type: Boolean,
    default: true,
  },
})

// Reactive data
const mapContainer = ref(null)
const displayLocation = ref(null)
const loading = ref(true)
let map = null
let marker = null

// Initialize map
const initMap = () => {
  if (!window.mapboxgl) {
    console.error('Mapbox GL JS is not loaded')
    loading.value = false
    return
  }

  window.mapboxgl.accessToken = props.accessToken

  // Use provided coordinates or default to Tashkent
  const defaultCenter = [69.2401, 41.2995] // Tashkent coordinates
  let initialCenter = defaultCenter

  // Check if we have valid coordinates
  if (props.latitude && props.longitude) {
    const lat = parseFloat(props.latitude)
    const lng = parseFloat(props.longitude)

    if (isValidCoordinate(lat, lng)) {
      initialCenter = [lng, lat]
    }
  }

  map = new window.mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: initialCenter,
    zoom: props.zoom,
  })

  map.on('load', () => {
    loading.value = false
    // Add navigation controls
    map.addControl(new window.mapboxgl.NavigationControl(), 'top-right')

    // Show location if coordinates are provided
    if (props.latitude && props.longitude) {
      showLocation(parseFloat(props.longitude), parseFloat(props.latitude))
    }
  })

  map.on('error', (e) => {
    console.error('Map error:', e)
    loading.value = false
  })
}

// Show location on map
const showLocation = async (lng, lat) => {
  if (!map || !isValidCoordinate(lat, lng)) {
    console.error('Invalid coordinates or map not ready')
    return
  }

  // Update map center
  map.flyTo({
    center: [lng, lat],
    zoom: props.zoom,
    duration: 1000,
  })

  // Update display location
  displayLocation.value = {
    lng,
    lat,
    address: null,
  }

  // Remove existing marker
  if (marker) {
    marker.remove()
  }

  // Add new marker
  marker = new window.mapboxgl.Marker({
    color: '#3b82f6',
    scale: 1.2,
  })
    .setLngLat([lng, lat])
    .addTo(map)

  // Try to get address if showAddress is enabled
  if (props.showAddress) {
    try {
      const address = await reverseGeocode(lng, lat)
      if (displayLocation.value) {
        displayLocation.value.address = address
      }
    } catch (error) {
      console.error('Error getting address:', error)
    }
  }
}

// Validate coordinates
const isValidCoordinate = (lat, lng) => {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
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

// Watch for coordinate changes
watch(
  () => [props.latitude, props.longitude],
  ([newLat, newLng]) => {
    if (map && newLat && newLng) {
      const lat = parseFloat(newLat)
      const lng = parseFloat(newLng)

      if (isValidCoordinate(lat, lng)) {
        showLocation(lng, lat)
      }
    }
  },
  { immediate: false },
)

// Lifecycle hooks
onMounted(() => {
  // Load Mapbox GL JS
  if (!window.mapboxgl) {
    const script = document.createElement('script')
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'
    script.onload = initMap
    script.onerror = () => {
      console.error('Failed to load Mapbox GL JS')
      loading.value = false
    }
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
  getDisplayLocation: () => displayLocation.value,
  updateLocation: (lat, lng) => {
    if (isValidCoordinate(lat, lng)) {
      showLocation(lng, lat)
    }
  },
})
</script>

<style scoped>
.location-display {
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

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-overlay p {
  margin-top: 12px;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
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

.location-info {
  margin-top: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.location-info h3 {
  margin: 0 0 8px 0;
  color: #1e293b;
  font-size: 18px;
}

.location-info p {
  margin: 4px 0;
  color: #475569;
  font-size: 14px;
}
</style>
