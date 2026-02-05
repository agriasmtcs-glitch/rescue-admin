import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Nagyobb ikon a hiányzó személyekhez
const personIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapPicker = ({ onLocationSelected, initialPosition, bounds }) => {
  const [position, setPosition] = useState(initialPosition);
  const mapRef = useRef();

  const MapEvents = () => {
    const map = useMapEvents({
      click(e) {
        const newPosition = e.latlng;
        setPosition(newPosition);
        onLocationSelected(newPosition);
        map.flyTo(newPosition, map.getZoom());
      },
    });
    return null;
  };

  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
      if (mapRef.current) {
        mapRef.current.flyTo(initialPosition, 13);
      }
    }
  }, [initialPosition]);

  useEffect(() => {
    if (bounds && mapRef.current) {
      mapRef.current.fitBounds(bounds);
    }
  }, [bounds]);

  return (
    <div style={{ height: '400px', width: '100%', marginBottom: '20px' }}>
      <MapContainer
        center={position || [47.4979, 19.0402]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents />
        {position && (
          <Marker position={position}>
            <Popup>Kiválasztott hely</Popup>
          </Marker>
        )}
      </MapContainer>
      {position && (
        <div style={{ marginTop: '10px' }}>
          <strong>Kiválasztott koordináták:</strong><br />
          Szélesség: {position.lat.toFixed(6)}<br />
          Hosszúság: {position.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
};

const MissingPersonsEditor = () => {
  const { t } = useTranslation();
  const [missingPersons, setMissingPersons] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [eventId, setEventId] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [clothing, setClothing] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [behaviorCategory, setBehaviorCategory] = useState('');
  const [probZones, setProbZones] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showLargeImage, setShowLargeImage] = useState(false);
  const [mapBounds, setMapBounds] = useState(null);

  useEffect(() => {
    loadMissing();
    checkCurrentUserRole();
  }, []);

  useEffect(() => {
    calculateMapBounds();
  }, [missingPersons]);

  const checkCurrentUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const role = user.user_metadata?.role;
      setCurrentUserRole(role);
    }
  };

  const calculateMapBounds = () => {
    if (missingPersons.length > 0) {
      const validLocations = missingPersons.filter(p => p.location && p.location.lat && p.location.lng);
      
      if (validLocations.length > 0) {
        const lats = validLocations.map(p => p.location.lat);
        const lngs = validLocations.map(p => p.location.lng);
        
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        
        setMapBounds([[minLat, minLng], [maxLat, maxLng]]);
      }
    }
  };

  const loadMissing = async () => {
    try {
      const { data, error } = await supabase.from('missing_persons').select('*');
      if (error) throw error;
      setMissingPersons(data || []);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile) return null;
    
    try {
      setUploading(true);
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `missing_persons/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, photoFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      alert('Error uploading image: ' + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const createMissing = async (e) => {
    e.preventDefault();
    
    if (!['admin', 'coordinator'].includes(currentUserRole)) {
      alert(t('permission-denied'));
      return;
    }

    try {
      let finalPhotoUrl = photoUrl;
      if (photoFile) {
        finalPhotoUrl = await uploadPhoto();
      }

      const { error } = await supabase.from('missing_persons').insert({
        event_id: eventId || null,
        name: name || null,
        age: age ? parseInt(age) : null,
        height_cm: height ? parseInt(height) : null,
        clothing: clothing || null,
        photo_url: finalPhotoUrl || null,
        behavior_category: behaviorCategory || null,
        prob_zones: probZones ? JSON.parse(probZones) : null,
        location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null
      });
      
      if (error) throw error;
      alert(t('missing-create-success'));
      loadMissing();
      resetForm();
    } catch (err) {
      alert(`${t('missing-create-fail')} ${err.message}`);
    }
  };

  const updateMissing = async (e) => {
    e.preventDefault();
    
    if (!['admin', 'coordinator'].includes(currentUserRole)) {
      alert(t('permission-denied'));
      return;
    }

    try {
      let finalPhotoUrl = photoUrl;
      if (photoFile) {
        finalPhotoUrl = await uploadPhoto();
      }

      const updateData = {
        event_id: eventId,
        name,
        age: age ? parseInt(age) : null,
        height_cm: height ? parseInt(height) : null,
        clothing,
        behavior_category: behaviorCategory,
        prob_zones: probZones ? JSON.parse(probZones) : null,
        location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null
      };

      // Csak akkor frissítjük a fotót, ha van új érték
      if (finalPhotoUrl) {
        updateData.photo_url = finalPhotoUrl;
      }

      const { error } = await supabase
        .from('missing_persons')
        .update(updateData)
        .eq('id', selectedPerson.id);
      
      if (error) throw error;
      alert(t('missing-update-success'));
      loadMissing();
      resetForm();
    } catch (err) {
      alert(`${t('missing-update-fail')} ${err.message}`);
    }
  };

  const deleteMissing = async (id) => {
    if (!['admin', 'coordinator'].includes(currentUserRole)) {
      alert(t('permission-denied'));
      return;
    }

    if (window.confirm(t('confirm-delete'))) {
      try {
        const { error } = await supabase.from('missing_persons').delete().eq('id', id);
        if (error) throw error;
        alert(t('missing-delete-success'));
        loadMissing();
      } catch (err) {
        alert(`${t('missing-delete-fail')} ${err.message}`);
      }
    }
  };

  const selectPerson = (person) => {
    setSelectedPerson(person);
    setEventId(person.event_id || '');
    setName(person.name || '');
    setAge(person.age || '');
    setHeight(person.height_cm || '');
    setClothing(person.clothing || '');
    setPhotoUrl(person.photo_url || '');
    setBehaviorCategory(person.behavior_category || '');
    setProbZones(person.prob_zones ? JSON.stringify(person.prob_zones) : '');
    setLat(person.location?.lat || '');
    setLng(person.location?.lng || '');
    setPhotoFile(null);
  };

  const resetForm = () => {
    setSelectedPerson(null);
    setEventId('');
    setName('');
    setAge('');
    setHeight('');
    setClothing('');
    setPhotoFile(null);
    setPhotoUrl('');
    setBehaviorCategory('');
    setProbZones('');
    setLat('');
    setLng('');
  };

  const handleLocationSelected = (latlng) => {
    setLat(latlng.lat);
    setLng(latlng.lng);
  };

  const handleImageClick = (url) => {
    setPhotoUrl(url);
    setShowLargeImage(true);
  };

  return (
    <section style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>{t('missing-persons-editor-h2')}</h2>
      
      {showLargeImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowLargeImage(false)}
        >
          <img 
            src={photoUrl} 
            alt="Nagyított kép" 
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
          />
        </div>
      )}
      
      {['admin', 'coordinator'].includes(currentUserRole) ? (
        <>
          <div style={{ marginBottom: '30px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>{t('missing-table-name')}</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>{t('missing-table-age')}</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>{t('missing-table-height')}</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>{t('missing-table-clothing')}</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>{t('missing-table-photo')}</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>{t('missing-table-behavior')}</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>{t('missing-table-location')}</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>{t('actions-label')}</th>
                </tr>
              </thead>
              <tbody>
                {missingPersons.map(person => (
                  <tr key={person.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '10px' }}>{person.name}</td>
                    <td style={{ padding: '10px' }}>{person.age}</td>
                    <td style={{ padding: '10px' }}>{person.height_cm}</td>
                    <td style={{ padding: '10px' }}>{person.clothing}</td>
                    <td style={{ padding: '10px' }}>
                      {person.photo_url && (
                        <img 
                          src={person.photo_url} 
                          alt={person.name} 
                          style={{ width: '50px', height: '50px', objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => handleImageClick(person.photo_url)}
                        />
                      )}
                    </td>
                    <td style={{ padding: '10px' }}>{person.behavior_category}</td>
                    <td style={{ padding: '10px' }}>
                      {person.location && (
                        <span>{person.location.lat?.toFixed(4)}, {person.location.lng?.toFixed(4)}</span>
                      )}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <button 
                        style={{ marginRight: '5px', padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '3px' }}
                        onClick={() => selectPerson(person)}
                      >
                        {t('update-missing-btn')}
                      </button>
                      <button 
                        style={{ padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '3px' }}
                        onClick={() => deleteMissing(person.id)}
                      >
                        {t('delete-missing-btn')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h3 style={{ marginBottom: '15px' }}>{selectedPerson ? t('update-missing-btn') : t('create-missing-btn')}</h3>
              <form onSubmit={selectedPerson ? updateMissing : createMissing} style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>{t('event-id-label')}</label>
                  <input 
                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    value={eventId} 
                    onChange={(e) => setEventId(e.target.value)} 
                    required 
                  />
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>{t('name-label')}</label>
                  <input 
                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>{t('age-label')}</label>
                  <input 
                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    type="number" 
                    value={age} 
                    onChange={(e) => setAge(e.target.value)} 
                  />
                </div>
                
               <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>{t('height-label')}</label>
                  <input 
                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    type="number" 
                    min="0"
                    max="299"   /* Explicit módon engedélyezzük a 100 feletti értékeket */
                    step="1"
                    value={height} 
                    onChange={(e) => setHeight(e.target.value)} 
                  />
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>{t('clothing-label')}</label>
                  <input 
                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    value={clothing} 
                    onChange={(e) => setClothing(e.target.value)} 
                  />
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>{t('photo-label')}</label>
                  <input 
                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setPhotoFile(e.target.files[0])} 
                  />
                  {uploading && <p>{t('uploading')}</p>}
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>{t('behavior-category-label')}</label>
                  <input 
                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    value={behaviorCategory} 
                    onChange={(e) => setBehaviorCategory(e.target.value)} 
                  />
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>{t('prob-zones-label')}</label>
                  <textarea 
                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box', minHeight: '80px' }}
                    value={probZones} 
                    onChange={(e) => setProbZones(e.target.value)}
                    placeholder='{"zone1": "description", "zone2": "description"}'
                  />
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>{t('location-lat-label')}</label>
                  <input 
                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    type="number" 
                    step="any" 
                    value={lat} 
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="47.4979"
                  />
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>{t('location-lng-label')}</label>
                  <input 
                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    type="number" 
                    step="any" 
                    value={lng} 
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="19.0402"
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={uploading}
                  style={{ padding: '10px 15px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', marginRight: '10px' }}
                >
                  {selectedPerson ? t('update-missing-btn') : t('create-missing-btn')}
                </button>
                
                {selectedPerson && (
                  <button 
                    type="button" 
                    onClick={resetForm}
                    style={{ padding: '10px 15px', backgroundColor: '#9e9e9e', color: 'white', border: 'none', borderRadius: '4px' }}
                  >
                    {t('cancel-btn')}
                  </button>
                )}
              </form>
            </div>
            
            <div>
              <h3 style={{ marginBottom: '15px' }}>{t('location-label')}</h3>
              <MapPicker 
                onLocationSelected={handleLocationSelected} 
                initialPosition={lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null}
                bounds={mapBounds}
              />
              
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>{t('map-h2')}</h3>
                <div style={{ height: '400px', width: '100%' }}>
                  <MapContainer
                    bounds={mapBounds}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {missingPersons.map(person => {
                      if (person.location && person.location.lat && person.location.lng) {
                        return (
                          <Marker
                            key={person.id}
                            position={[person.location.lat, person.location.lng]}
                            icon={personIcon}
                          >
                            <Popup>
                              <div>
                                <strong>{person.name}</strong><br />
                                {person.age && `${t('missing-table-age')}: ${person.age}`}<br />
                                {person.clothing && `${t('missing-table-clothing')}: ${person.clothing}`}<br />
                                {person.photo_url && (
                                  <img 
                                    src={person.photo_url} 
                                    alt={person.name} 
                                    style={{ width: '100px', marginTop: '5px', cursor: 'pointer' }}
                                    onClick={() => handleImageClick(person.photo_url)}
                                  />
                                )}
                              </div>
                            </Popup>
                          </Marker>
                        );
                      }
                      return null;
                    })}
                  </MapContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p>{t('permission-denied')}</p>
      )}
    </section>
  );
};

export default MissingPersonsEditor;