import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';

const MapComponent = () => {
  const { t } = useTranslation();
  const [markers, setMarkers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMarkers();
  }, []);

  const loadMarkers = async () => {
    try {
      const { data, error } = await supabase.from('markers').select('*');
      if (error) throw error;
      setMarkers(data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading markers:', err);
      setError(t('error-loading-markers', 'Failed to load markers: ') + err.message);
    }
  };

  return (
    <section>
      <h2>{t('map-h2')}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <MapContainer center={[47.4979, 19.0402]} zoom={13} style={{ height: '500px' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
        {markers.map(marker => {
          if (marker.lat_lng && marker.lat_lng.coordinates && Array.isArray(marker.lat_lng.coordinates)) {
            const [lng, lat] = marker.lat_lng.coordinates;
            if (typeof lat === 'number' && typeof lng === 'number') {
              return (
                <Marker key={marker.id} position={[lat, lng]}>
                  <Popup>Marker ID: {marker.id}<br />Type: {marker.type || 'N/A'}</Popup>
                </Marker>
              );
            }
          }
          return null;
        })}
      </MapContainer>
    </section>
  );
};

export default MapComponent;