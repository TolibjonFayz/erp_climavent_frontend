<template>
  <div class="location-picker">
    <div ref="mapContainer" class="map-container"></div>
    <div v-if="selectedLocation" class="location-info">
      <h3>Tanlangan manzil</h3>
      <p v-if="selectedLocation.address"><strong>Manzil:</strong> {{ selectedLocation.address }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  accessToken: {
    type: String,
    required: true,
  },
  initialCenter: {
    type: Array,
    default: () => [69.2401, 41.2995],
  },
  initialZoom: {
    type: Number,
    default: 10,
  },
  showGeocoding: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['location-selected'])

const mapContainer = ref(null)
const selectedLocation = ref(null)

let map = null
let marker = null

onMounted(() => {
  const script = document.createElement('script')
  script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'
  script.onload = initializeMap
  document.head.appendChild(script)

  const link = document.createElement('link')
  link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css'
  link.rel = 'stylesheet'
  document.head.appendChild(link)
})

const initializeMap = () => {
  mapboxgl.accessToken = props.accessToken

  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v11',
    center: props.initialCenter,
    zoom: props.initialZoom,
    language: 'ru',
  })

  map.on('click', handleMapClick)

  map.addControl(new mapboxgl.NavigationControl())
}

const handleMapClick = async (e) => {
  const { lng, lat } = e.lngLat

  selectedLocation.value = {
    lng,
    lat,
    address: null,
  }

  if (marker) {
    marker.remove()
  }

  marker = new mapboxgl.Marker({
    color: '#3B82F6',
    draggable: true,
  })
    .setLngLat([lng, lat])
    .addTo(map)

  marker.on('dragend', handleMarkerDrag)

  if (props.showGeocoding) {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${props.accessToken}&language=ru`,
      )
      const data = await response.json()
      if (data.features && data.features.length > 0) {
        selectedLocation.value.address = data.features[0].place_name
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    }
  }

  emit('location-selected', selectedLocation.value)
}

const handleMarkerDrag = async () => {
  const lngLat = marker.getLngLat()

  selectedLocation.value = {
    lng: lngLat.lng,
    lat: lngLat.lat,
    address: null,
  }

  if (props.showGeocoding) {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${props.accessToken}&language=ru`,
      )
      const data = await response.json()
      if (data.features && data.features.length > 0) {
        selectedLocation.value.address = data.features[0].place_name
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    }
  }

  emit('location-selected', selectedLocation.value)
}

onUnmounted(() => {
  if (map) {
    map.remove()
  }
})
</script>

<style scoped>
.location-picker {
  width: 100%;
  height: 100%;
  position: relative;
  margin-bottom: 20px;
}

.map-container {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.location-info {
  margin-top: 16px;
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.location-info h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.location-info p {
  margin: 8px 0;
  color: #6b7280;
  font-size: 14px;
}
</style>
