"use client"

import { useCallback, useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
import type { LatLngExpression, LeafletMouseEvent } from "leaflet"
import { MapPin } from "lucide-react"

const DEFAULT_CENTER: LatLngExpression = [20.5937, 78.9629]
const DEFAULT_ZOOM = 5

interface Props {
  latitude: number | null
  longitude: number | null
  onChange: (lat: number, lng: number) => void
  height?: string
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onChange(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function FlyToMarker({ center }: { center: LatLngExpression }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, 15, { duration: 1.2 })
  }, [center, map])
  return null
}

export default function VenueMapPicker({ latitude, longitude, onChange, height = "350px" }: Props) {
  const hasCoords = latitude != null && longitude != null
  const position: LatLngExpression = hasCoords ? [latitude!, longitude!] : DEFAULT_CENTER
  const zoom = hasCoords ? 15 : DEFAULT_ZOOM

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MapPin className="size-4 text-primary" aria-hidden="true" />
        Venue location on map
      </div>
      <p className="text-xs text-muted-foreground">
        Click on the map to drop a pin at the event venue location.
      </p>
      <div
        className="overflow-hidden rounded-xl border border-border"
        style={{ height, width: "100%" }}
      >
        <MapContainer
          center={position}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onChange={onChange} />
          {hasCoords && (
            <>
              <Marker position={position} />
              <FlyToMarker center={position} />
            </>
          )}
        </MapContainer>
      </div>
      {hasCoords && (
        <p className="text-xs text-muted-foreground">
          Pinned at {latitude!.toFixed(5)}, {longitude!.toFixed(5)}
        </p>
      )}
    </div>
  )
}
