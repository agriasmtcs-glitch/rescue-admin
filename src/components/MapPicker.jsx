import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ onLocationSelected, initialPosition }) {
  const [position, setPosition] = useState(initialPosition);

  const map = useMapEvents({
    click(e) {
      const newPosition = e.latlng;
      setPosition(newPosition);
      onLocationSelected(newPosition);
      map.flyTo(newPosition, map.getZoom());
    },
  });

  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
      map.flyTo(initialPosition, map.getZoom());
    }
  }, [initialPosition, map]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Kiválasztott hely</Popup>
    </Marker>
  );
}

const MapPicker = ({ onLocationSelected, initialLat, initialLng }) => {
  const [selectedPosition, setSelectedPosition] = useState(null);

  useEffect(() => {
    if (initialLat && initialLng) {
      setSelectedPosition([initialLat, initialLng]);
    }
  }, [initialLat, initialLng]);

  const handleLocationSelected = (latlng) => {
    setSelectedPosition([latlng.lat, latlng.lng]);
    onLocationSelected(latlng);
  };

  return (
    <div style={{ height: '400px', width: '100%', marginBottom: '20px' }}>
      <MapContainer
        center={selectedPosition || [47.4979, 19.0402]} // Budapest alapértelmezettként
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker 
          onLocationSelected={handleLocationSelected} 
          initialPosition={selectedPosition} 
        />
      </MapContainer>
      {selectedPosition && (
        <div style={{ marginTop: '10px' }}>
          <strong>Kiválasztott koordináták:</strong><br />
          Szélesség: {selectedPosition[0].toFixed(6)}<br />
          Hosszúság: {selectedPosition[1].toFixed(6)}
        </div>
      )}
    </div>
  );
};

export default MapPicker;