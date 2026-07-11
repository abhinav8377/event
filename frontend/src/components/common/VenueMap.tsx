"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import type { LatLngExpression } from "leaflet"
import { MapPin } from "lucide-react"

interface Props {
  latitude: number
  longitude: number
  venue: string
  city?: string
  height?: string
}

export default function VenueMap({ latitude, longitude, venue, city, height = "280px" }: Props) {
  const position: LatLngExpression = [latitude, longitude]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MapPin className="size-4 text-primary" aria-hidden="true" />
        Venue location
      </div>
      <div
        className="overflow-hidden rounded-xl border border-border"
        style={{ height, width: "100%" }}
      >
        <MapContainer
          center={position}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
          dragging={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{venue}</p>
                {city && <p className="text-muted-foreground">{city}</p>}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      <a
        href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-medium text-primary hover:underline"
      >
        Open in OpenStreetMap
      </a>
    </div>
  )
}
