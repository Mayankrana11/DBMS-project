import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap
} from "react-leaflet";
import { useState, useEffect } from "react";

// 🔥 auto zoom + move
function MapUpdater({ pickup, drop, route }) {
  const map = useMap();

  useEffect(() => {
    if (pickup && !drop) {
      map.setView(pickup, 13);
    }

    if (pickup && drop) {
      map.fitBounds([pickup, drop]);
    }
  }, [pickup, drop]);

  return null;
}

function MapView({ pickup, drop, setRouteData }) {
  const [route, setRoute] = useState([]);

  useEffect(() => {
    if (!pickup || !drop) return;

    const fetchRoute = async () => {
      const url = `https://router.project-osrm.org/route/v1/driving/${pickup[1]},${pickup[0]};${drop[1]},${drop[0]}?overview=full&geometries=geojson`;

      const res = await fetch(url);
      const data = await res.json();

      const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      setRoute(coords);

      const distance = (data.routes[0].distance / 1000).toFixed(2);
      const duration = (data.routes[0].duration / 60).toFixed(0);

      setRouteData({ distance, duration });
    };

    fetchRoute();
  }, [pickup, drop]);

  return (
    <MapContainer
      center={[28.6139, 77.2090]}
      zoom={13}
      className="h-[300px] w-full rounded-lg"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <MapUpdater pickup={pickup} drop={drop} route={route} />

      {pickup && <Marker position={pickup} />}
      {drop && <Marker position={drop} />}
      {route.length > 0 && <Polyline positions={route} color="blue" />}
    </MapContainer>
  );
}

export default MapView;