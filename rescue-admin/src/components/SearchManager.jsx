import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap, LayersControl, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import MapPicker from './MapPicker';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map zooming to bounds
const MapBounds = ({ missingPersons, markers }) => {
  const map = useMap();
  useEffect(() => {
    const validLocations = missingPersons.filter(p => p.location?.lat && p.location?.lng);
    const validMarkers = markers.filter(m => (m.type === 'polygon' && m.lat_lng?.coordinates) || (m.latitude && m.longitude));
   
    if (validLocations.length > 0 || validMarkers.length > 0) {
      const bounds = [
        ...validLocations.map(p => [p.location.lat, p.location.lng]),
        ...validMarkers.flatMap(m => {
          if (m.type === 'polygon' && m.lat_lng?.coordinates) {
            return m.lat_lng.coordinates.map(coord => [parseFloat(coord[1]), parseFloat(coord[0])]);
          }
          return [[parseFloat(m.latitude), parseFloat(m.longitude)]];
        })
      ];
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView([47.4979, 19.0402], 13); // Default to Budapest
    }
  }, [missingPersons, markers, map]);
  return null;
};

// Segédfüggvény távolságszámításhoz (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Föld sugara méterben
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Távolság méterben
};

const SearchManager = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [missingPersons, setMissingPersons] = useState([]);
  const [eventParticipants, setEventParticipants] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventName, setEventName] = useState('');
  const [eventStatus, setEventStatus] = useState('active');
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
  const [currentUserRole, setCurrentUserRole] = useState('searcher');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [mapLayers, setMapLayers] = useState({
    openstreetmap: true,
    turistautak: false,
    satellite: false
  });
  const [userTracks, setUserTracks] = useState([]);
  const [showProbZones, setShowProbZones] = useState(true);

  const behaviorCategories = [
    { value: 'child1-3', label: t('behavior-child1-3') },
    { value: 'child4-6', label: t('behavior-child4-6') },
    { value: 'hiker', label: t('behavior-hiker') },
    { value: 'despondent', label: t('behavior-despondent') },
    { value: 'hunter', label: t('behavior-hunter') },
    { value: 'elderly', label: t('behavior-elderly') },
    { value: 'default', label: t('behavior-default') }
  ];

  const cache = useRef(new Map());
  const tracksByUserRef = useRef({});

  useEffect(() => {
    if (selectedPerson) {
      const changesDetected =
        name !== selectedPerson.name ||
        age !== selectedPerson.age?.toString() ||
        height !== selectedPerson.height_cm?.toString() ||
        clothing !== selectedPerson.clothing ||
        behaviorCategory !== selectedPerson.behavior_category ||
        probZones !== JSON.stringify(selectedPerson.prob_zones || {}) ||
        lat !== selectedPerson.location?.lat?.toString() ||
        lng !== selectedPerson.location?.lng?.toString();
      
      setHasChanges(changesDetected);
    }
  }, [name, age, height, clothing, behaviorCategory, probZones, lat, lng, selectedPerson]);

  useEffect(() => {
    loadEvents();
    checkCurrentUser();
    const eventChannel = supabase
      .channel('search_events_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'search_events'
      }, () => {
        loadEvents();
      })
      .subscribe();
    const missingPersonsChannel = supabase
      .channel('missing_persons_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'missing_persons'
      }, () => {
        if (selectedEvent) loadMissingPersons(selectedEvent.id);
      })
      .subscribe();
    const participantsChannel = supabase
      .channel('event_participants_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_participants'
      }, () => {
        if (selectedEvent) loadEventParticipants(selectedEvent.id);
      })
      .subscribe();
    const mapMarkersChannel = supabase
      .channel('map_markers_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'map_markers'
      }, () => {
        if (selectedEvent) loadMarkers(selectedEvent.id);
      })
      .subscribe();
    const polygonsChannel = supabase
      .channel('polygons_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'polygons'
      }, () => {
        if (selectedEvent) loadMarkers(selectedEvent.id);
      })
      .subscribe();
    const gpsTracksChannel = supabase
      .channel('gps_tracks_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'gps_tracks'
      }, () => {
        if (selectedEvent) loadMarkers(selectedEvent.id);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(eventChannel);
      supabase.removeChannel(missingPersonsChannel);
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(mapMarkersChannel);
      supabase.removeChannel(polygonsChannel);
      supabase.removeChannel(gpsTracksChannel);
    };
  }, [selectedEvent]);

  const checkCurrentUser = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting user:', userError);
        setCurrentUserRole('searcher');
        return;
      }
      
      if (user) {
        setCurrentUserId(user.id);
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (userDataError) {
          console.error('Error fetching user role:', userDataError);
          setCurrentUserRole('searcher');
        } else {
          setCurrentUserRole(userData?.role || 'searcher');
        }
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      setCurrentUserRole('searcher');
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const cacheKey = 'events';
      const cached = cache.current.get(cacheKey);
      
      if (cached) {
        setEvents(cached);
        setLoading(false);
        return;
      }

      console.log('Loading events from Supabase...');
      
      const { data, error } = await supabase
        .from('search_events')
        .select('*');

      if (error) {
        console.error('Supabase error:', error);
        
        const { data: simpleData, error: simpleError } = await supabase
          .from('search_events')
          .select('id, name, status, start_time');
        
        if (simpleError) {
          console.error('Simple query also failed:', simpleError);
          throw simpleError;
        }
        
        console.log('Events loaded with simple query:', simpleData);
        setEvents(simpleData || []);
        cache.current.set(cacheKey, simpleData || []);
      } else {
        console.log('Events loaded successfully:', data);
        setEvents(data || []);
        cache.current.set(cacheKey, data || []);
      }
    } catch (err) {
      console.error('Error loading events:', err);
      setError(t('error-loading-events'));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMissingPersons = async (eventId) => {
    try {
      const cacheKey = `missing-persons-${eventId}`;
      const cached = cache.current.get(cacheKey);
      
      if (cached) {
        setMissingPersons(cached);
        return;
      }

      const { data, error } = await supabase
        .from('missing_persons')
        .select('*')
        .eq('event_id', eventId);
      
      if (error) throw error;
      
      setMissingPersons(data || []);
      cache.current.set(cacheKey, data || []);
    } catch (err) {
      console.error('Error loading missing persons:', err);
      setError(t('error-loading-missing-persons'));
    }
  };

  const loadEventParticipants = async (eventId) => {
    try {
      const cacheKey = `event-participants-${eventId}`;
      const cached = cache.current.get(cacheKey);
      
      if (cached) {
        setEventParticipants(cached);
        return;
      }

      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          *,
          user:users(full_name, phone_number, role)
        `)
        .eq('event_id', eventId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      
      setEventParticipants(data || []);
      cache.current.set(cacheKey, data || []);
    } catch (err) {
      console.error('Error loading event participants:', err);
      setError(t('error-loading-participants'));
    }
  };

  const loadMarkers = async (eventId) => {
    try {
      const cacheKey = `markers-${eventId}`;
      const cached = cache.current.get(cacheKey);
     
      if (cached) {
        setMarkers(cached);
        processUserTracks(cached);
        return;
      }

      const [
        { data: mapMarkers, error: mapMarkersError },
        { data: polygons, error: polygonsError },
        { data: gpsTracks, error: gpsTracksError }
      ] = await Promise.all([
        supabase
          .from('map_markers')
          .select(`
            *,
            user:users(full_name, phone_number)
          `)
          .eq('event_id', eventId),
        supabase
          .from('polygons')
          .select(`
            *,
            user:users(full_name, phone_number)
          `)
          .eq('event_id', eventId),
        supabase
          .from('gps_tracks')
          .select(`
            *,
            user:users(full_name, phone_number)
          `)
          .eq('event_id', eventId)
          .order('created_at', { ascending: true }) 
      ]);
      
      if (mapMarkersError || polygonsError || gpsTracksError) {
        console.error('Supabase error:', mapMarkersError || polygonsError || gpsTracksError);
        throw mapMarkersError || polygonsError || gpsTracksError;
      }
      
      const allMarkers = [
        ...(mapMarkers || []).map(m => ({
          ...m,
          type: 'map_marker',
          lat_lng: m.latitude && m.longitude ? { coordinates: [m.longitude, m.latitude] } : null
        })),
        ...(polygons || []).map(m => {
          let coordinates = null;
          if (m.coordinates) {
            try {
              const cleanCoords = m.coordinates.trim().replace(/\s+/g, '');
              coordinates = JSON.parse(cleanCoords);
            } catch (e) {
              try {
                const coordMatches = m.coordinates.match(/\[[^\]]+\]/g);
                if (coordMatches) {
                  coordinates = coordMatches.map(coordPair => {
                    const numbers = coordPair.match(/-?\d+\.\d+/g);
                    if (numbers && numbers.length === 2) {
                      return [parseFloat(numbers[0]), parseFloat(numbers[1])];
                    }
                    return null;
                  }).filter(Boolean);
                }
              } catch (fallbackError) {
                console.error('Fallback parsing also failed:', fallbackError);
              }
            }
          }
          return {
            ...m,
            type: 'polygon',
            lat_lng: coordinates ? { coordinates } : null
          };
        }),
        ...(gpsTracks || []).map(m => ({
          ...m,
          type: 'gps_track',
          lat_lng: m.latitude && m.longitude ? { coordinates: [m.longitude, m.latitude] } : null
        }))
      ];
      
      console.log('All markers with user data:', allMarkers);
      setMarkers(allMarkers || []);
      cache.current.set(cacheKey, allMarkers || []);
      processUserTracks(allMarkers || []);
    } catch (err) {
      console.error('Error loading markers:', err);
      setError(t('error-loading-markers'));
    }
  };

  // --- OKOSÍTOTT NYOMVONAL FELDOLGOZÁS (IDŐBÉLYEGEKKEL) ---
  const processUserTracks = (markersData) => {
    const tracksByUser = {};
    const GAP_THRESHOLD_MS = 60 * 1000; 
    const ACCURACY_THRESHOLD = 50; 
    const MAX_DISTANCE_JUMP = 300; 

    let gpsTracks = markersData.filter(m => m.type === 'gps_track');

    gpsTracks.sort((a, b) => {
      return new Date(a.created_at) - new Date(b.created_at);
    });

    gpsTracks.forEach(marker => {
      if (marker.accuracy && parseFloat(marker.accuracy) > ACCURACY_THRESHOLD) {
        return; 
      }

      if (!marker.user_id || !marker.latitude || !marker.longitude) return;

      const userId = marker.user_id;
      const lat = parseFloat(marker.latitude);
      const lng = parseFloat(marker.longitude);
      const currentTime = new Date(marker.created_at).getTime();

      if (!isNaN(lat) && !isNaN(lng)) {
        if (!tracksByUser[userId]) {
          tracksByUser[userId] = {
            segments: [[]], 
            segmentTimes: [{ start: currentTime, end: currentTime }], // Szakasz idők
            lastTime: currentTime,
            lastLat: lat,
            lastLng: lng,
            userInfo: marker.user
          };
          tracksByUser[userId].segments[0].push([lat, lng]);
          return;
        }

        const userData = tracksByUser[userId];
        const currentSegments = userData.segments;
        const currentTimes = userData.segmentTimes;
        
        const timeDiff = currentTime - userData.lastTime;
        const distDiff = calculateDistance(userData.lastLat, userData.lastLng, lat, lng);

        if ((timeDiff > GAP_THRESHOLD_MS || distDiff > MAX_DISTANCE_JUMP) && currentSegments[currentSegments.length - 1].length > 0) {
          currentSegments.push([]); 
          currentTimes.push({ start: currentTime, end: currentTime }); // Új időszakasz
        }

        currentSegments[currentSegments.length - 1].push([lat, lng]);
        currentTimes[currentTimes.length - 1].end = currentTime; // Végidő frissítése

        userData.lastTime = currentTime;
        userData.lastLat = lat;
        userData.lastLng = lng;
      }
    });

    tracksByUserRef.current = tracksByUser;
    setUserTracks(Object.values(tracksByUser));
  };

  // ... (A többi függvény változatlan: createEvent, updateEvent, stb.) ...
  // Másold ide a többi függvényt az előző file-ból, vagy hagyd őket változatlanul
  // (Csak a return blokk és a processUserTracks változott jelentősen)
  
  const createEvent = async (e) => {
    e.preventDefault();
    if (!['admin', 'coordinator'].includes(currentUserRole)) {
      alert(t('permission-denied'));
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.from('search_events').insert({
        name: eventName,
        status: eventStatus,
        start_time: new Date().toISOString(),
        coordinator_id: currentUserId,
      });
      if (error) throw error;
      alert(t('event-create-success'));
      cache.current.delete('events');
      loadEvents();
      resetEventForm();
    } catch (err) {
      console.error('Error creating event:', err);
      alert(`${t('event-create-fail')} ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (e) => {
    e.preventDefault();
    if (!['admin', 'coordinator'].includes(currentUserRole)) {
      alert(t('permission-denied'));
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase
        .from('search_events')
        .update({ name: eventName, status: eventStatus })
        .eq('id', editingEvent.id);
      if (error) throw error;
      alert(t('event-update-success'));
      cache.current.delete('events');
      loadEvents();
      resetEventForm();
    } catch (err) {
      console.error('Error updating event:', err);
      alert(`${t('event-update-fail')} ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id) => {
    if (!['admin', 'coordinator'].includes(currentUserRole)) {
      alert(t('permission-denied'));
      return;
    }
   
    if (window.confirm(t('confirm-delete'))) {
      try {
        setLoading(true);
       
        const { error: missingError } = await supabase
          .from('missing_persons')
          .delete()
          .eq('event_id', id);
       
        if (missingError && missingError.code !== '42P01') {
          console.error('Error deleting missing persons:', missingError);
        }
       
        const { error: participantsError } = await supabase
          .from('event_participants')
          .delete()
          .eq('event_id', id);
       
        if (participantsError && participantsError.code !== '42P01') {
          console.error('Error deleting participants:', participantsError);
        }
       
        try {
          const [
            { error: mapMarkersError },
            { error: polygonsError },
            { error: gpsTracksError }
          ] = await Promise.all([
            supabase.from('map_markers').delete().eq('event_id', id),
            supabase.from('polygons').delete().eq('event_id', id),
            supabase.from('gps_tracks').delete().eq('event_id', id)
          ]);
         
          if (mapMarkersError && mapMarkersError.code !== '42P01') {
            console.error('Error deleting map markers:', mapMarkersError);
          }
          if (polygonsError && polygonsError.code !== '42P01') {
            console.error('Error deleting polygons:', polygonsError);
          }
          if (gpsTracksError && gpsTracksError.code !== '42P01') {
            console.error('Error deleting GPS tracks:', gpsTracksError);
          }
        } catch (markersErr) {
          console.warn('Marker tables might not exist:', markersErr);
        }
       
        const { error } = await supabase
          .from('search_events')
          .delete()
          .eq('id', id);
       
        if (error) {
          if (error.code === '42501') {
            alert(t('permission-denied-delete'));
          } else {
            throw error;
          }
        } else {
          alert(t('event-delete-success'));
          cache.current.delete('events');
          loadEvents();
          if (selectedEvent?.id === id) {
            setSelectedEvent(null);
            setMissingPersons([]);
            setEventParticipants([]);
            setMarkers([]);
          }
        }
      } catch (err) {
        console.error('Error deleting event:', err);
        alert(`${t('event-delete-fail')} ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const joinEvent = async (eventId) => {
    try {
      setLoading(true);
      
      const { data: existingParticipants, error: checkError } = await supabase
        .from('event_participants')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', currentUserId);
      
      if (checkError) throw checkError;
      
      if (existingParticipants && existingParticipants.length > 0) {
        const { error } = await supabase
          .from('event_participants')
          .update({
            left_at: null,
            pause_status: false,
            joined_at: new Date().toISOString()
          })
          .eq('event_id', eventId)
          .eq('user_id', currentUserId);
        
        if (error) throw error;
        alert(t('event-rejoin-success'));
      } else {
        const { error } = await supabase.from('event_participants').insert({
          event_id: eventId,
          user_id: currentUserId,
          joined_at: new Date().toISOString(),
          pause_status: false,
          left_at: null
        });
        if (error) throw error;
        alert(t('event-join-success'));
      }
      
      cache.current.delete(`event-participants-${eventId}`);
      loadEventParticipants(eventId);
    } catch (err) {
      console.error('Error joining event:', err);
      alert(`${t('event-join-fail')} ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const leaveEvent = async (eventId) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('event_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('event_id', eventId)
        .eq('user_id', currentUserId);
      
      if (error) throw error;
      alert(t('event-leave-success'));
      cache.current.delete(`event-participants-${eventId}`);
      loadEventParticipants(eventId);
    } catch (err) {
      console.error('Error leaving event:', err);
      alert(`${t('event-leave-fail')} ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateParticipantStatus = async (participant, newStatus) => {
    try {
      setLoading(true);
      const updates = {};
      
      if (newStatus === 'paused') {
        updates.pause_status = true;
      } else if (newStatus === 'active') {
        updates.pause_status = false;
      } else if (newStatus === 'left') {
        updates.left_at = new Date().toISOString();
      }
      
      let query = supabase
        .from('event_participants')
        .update(updates);
      
      if (participant.id) {
        query = query.eq('id', participant.id);
      } else {
        query = query
          .eq('event_id', participant.event_id)
          .eq('user_id', participant.user_id);
      }
      
      const { error } = await query;
      
      if (error) throw error;
      alert(t('participant-status-update-success'));
      cache.current.delete(`event-participants-${selectedEvent.id}`);
      loadEventParticipants(selectedEvent.id);
    } catch (err) {
      console.error('Error updating participant status:', err);
      alert(`${t('participant-status-update-fail')} ${err.message}`);
    } finally {
      setLoading(false);
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
      const { data } = supabase.storage.from('photos').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
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
    if (!selectedEvent) {
      alert(t('select-event-first'));
      return;
    }
    try {
      setLoading(true);
      let finalPhotoUrl = photoUrl;
      if (photoFile) {
        finalPhotoUrl = await uploadPhoto();
      }
      const { error } = await supabase.from('missing_persons').insert({
        event_id: selectedEvent.id,
        name: name || null,
        age: age ? parseInt(age) : null,
        height_cm: height ? parseInt(height) : null,
        clothing: clothing || null,
        photo_url: finalPhotoUrl || null,
        behavior_category: behaviorCategory || null,
        prob_zones: probZones ? JSON.parse(probZones) : null,
        location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
      });
      if (error) throw error;
      alert(t('missing-create-success'));
      cache.current.delete(`missing-persons-${selectedEvent.id}`);
      loadMissingPersons(selectedEvent.id);
      resetPersonForm();
    } catch (err) {
      console.error('Error creating missing person:', err);
      alert(`${t('missing-create-fail')} ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateMissing = async (e) => {
    e.preventDefault();
    if (!['admin', 'coordinator'].includes(currentUserRole)) {
      alert(t('permission-denied'));
      return;
    }
    if (!selectedPerson) {
      alert(t('select-person-first'));
      return;
    }
    
    try {
      setLoading(true);
      
      const updates = {};
      
      if (name !== selectedPerson.name) {
        updates.name = name || null;
      }
      
      const currentAge = selectedPerson.age ? parseInt(selectedPerson.age) : null;
      const newAge = age ? parseInt(age) : null;
      if (newAge !== currentAge) {
        updates.age = newAge;
      }
      
      const currentHeight = selectedPerson.height_cm ? parseInt(selectedPerson.height_cm) : null;
      const newHeight = height ? parseInt(height) : null;
      if (newHeight !== currentHeight) {
        updates.height_cm = newHeight;
      }
      
      if (clothing !== selectedPerson.clothing) {
        updates.clothing = clothing || null;
      }
      
      if (behaviorCategory !== selectedPerson.behavior_category) {
        updates.behavior_category = behaviorCategory || null;
        updates.prob_zones = null;
      }
      
      if (probZones !== JSON.stringify(selectedPerson.prob_zones || {}) && !updates.prob_zones) {
        try {
          if (probZones) {
            updates.prob_zones = JSON.parse(probZones);
            for (const zoneKey in updates.prob_zones) {
              const zone = updates.prob_zones[zoneKey];
              if (!Array.isArray(zone) || zone.length < 3) {
                throw new Error('Invalid zone: minimum 3 points required');
              }
              let area = 0;
              for (let i = 0; i < zone.length - 1; i++) {
                const p1 = zone[i];
                const p2 = zone[i + 1];
                if (typeof p1.lat !== 'number' || typeof p1.lng !== 'number' ||
                    p1.lat < -90 || p1.lat > 90 || p1.lng < -180 || p1.lng > 180) {
                  throw new Error(`Invalid coordinates in zone ${zoneKey}: lat=${p1.lat}, lng=${p1.lng}`);
                }
                area += p1.lng * p2.lat - p2.lng * p1.lat;
              }
              area = Math.abs(area) / 2 * (111.32 ** 2);
              if (area > 100) {
                throw new Error(`Zone ${zoneKey} area too large: ${area} km², max allowed: 100 km²`);
              }
            }
          }
        } catch (err) {
          console.error('Error parsing or validating prob_zones:', err);
          alert(t('invalid-prob-zones'));
          return;
        }
      }
      
      const currentLat = selectedPerson.location?.lat;
      const currentLng = selectedPerson.location?.lng;
      const newLat = lat ? parseFloat(lat) : null;
      const newLng = lng ? parseFloat(lng) : null;
      
      if (newLat !== currentLat || newLng !== currentLng) {
        updates.location = newLat && newLng ? { lat: newLat, lng: newLng } : null;
      }
      
      let finalPhotoUrl = selectedPerson.photo_url;
      if (photoFile) {
        finalPhotoUrl = await uploadPhoto();
        updates.photo_url = finalPhotoUrl || null;
      }
      
      if (Object.keys(updates).length === 0 && !photoFile) {
        alert(t('no-changes-detected'));
        return;
      }
      
      const { error } = await supabase
        .from('missing_persons')
        .update(updates)
        .eq('id', selectedPerson.id);
      
      if (error) throw error;
      
      alert(t('missing-update-success'));
      cache.current.delete(`missing-persons-${selectedEvent.id}`);
      loadMissingPersons(selectedEvent.id);
      resetPersonForm();
      
    } catch (err) {
      console.error('Error updating missing person:', err);
      alert(`${t('missing-update-fail')} ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteMissing = async (id) => {
    if (!['admin', 'coordinator'].includes(currentUserRole)) {
      alert(t('permission-denied'));
      return;
    }
    if (window.confirm(t('confirm-delete'))) {
      try {
        setLoading(true);
        const { error } = await supabase.from('missing_persons').delete().eq('id', id);
        if (error) throw error;
        alert(t('missing-delete-success'));
        cache.current.delete(`missing-persons-${selectedEvent.id}`);
        loadMissingPersons(selectedEvent.id);
        resetPersonForm();
      } catch (err) {
        console.error('Error deleting missing person:', err);
        alert(`${t('missing-delete-fail')} ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const selectEvent = (event) => {
    console.log('Selected event:', event);
    setSelectedEvent(event);
    loadMissingPersons(event.id);
    loadEventParticipants(event.id);
    loadMarkers(event.id);
    resetPersonForm();
  };

  const selectEventForEdit = (event) => {
    setEditingEvent(event);
    setEventName(event.name);
    setEventStatus(event.status);
  };

  const selectPerson = (person) => {
    setSelectedPerson(person);
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

  const resetEventForm = () => {
    setEditingEvent(null);
    setEventName('');
    setEventStatus('active');
  };

  const resetPersonForm = () => {
    setSelectedPerson(null);
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

  const handleLayerChange = (layerName) => {
    const newLayers = {
      openstreetmap: false,
      turistautak: false,
      satellite: false
    };
    newLayers[layerName] = true;
    setMapLayers(newLayers);
  };

  const handleNumberChange = (value, setter) => {
    if (value === '' || /^\d+$/.test(value)) {
      setter(value);
    }
  };

  const handleFloatChange = (value, setter) => {
    if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
      setter(value);
    }
  };

  const getFieldStatus = (currentValue, originalValue) => {
    if (currentValue !== originalValue) {
      return <span className="text-green-600 text-sm"> {t('field-changed')}</span>;
    }
    return <span className="text-gray-400 text-sm"> {t('field-unchanged')}</span>;
  };

  const renderProbZones = (probZones) => {
    if (!probZones || !showProbZones) {
      return null;
    }
    try {
      const zones = typeof probZones === 'string' ? JSON.parse(probZones) : probZones;
      const zoneKeys = ['zone95', 'zone75', 'zone50', 'zone25'];
      const zoneColors = ['#0000FF', '#008000', '#FFA500', '#FF0000'];
      const zoneLabels = [
        t('zone-95'),
        t('zone-75'),
        t('zone-50'),
        t('zone-25')
      ];
      return zoneKeys.map((key, index) => {
        const zone = zones[key];
        if (!zone) return null;
        if (Array.isArray(zone) && zone.every(coord => typeof coord.lat === 'number' && typeof coord.lng === 'number')) {
          return (
            <Polygon
              key={`${key}-${index}`}
              positions={zone.map(coord => [coord.lat, coord.lng])}
              color={zoneColors[index]}
              fillOpacity={0.3}
              weight={2}
            >
              <Popup>{zoneLabels[index]}</Popup>
            </Polygon>
          );
        }
        return null;
      }).filter(Boolean);
    } catch (err) {
      console.error('Error processing prob_zones:', err, probZones);
      return null;
    }
  };

  const getParticipantStatus = (participant) => {
    if (participant.left_at) return 'left';
    if (participant.pause_status) return 'paused';
    return 'active';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'left': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getParticipantName = (participant) => {
    if (participant.user_name) return participant.user_name;
    if (participant.user?.full_name) return participant.user.full_name;
    if (participant.name) return participant.name;
    return 'N/A';
  };

  const getParticipantPhone = (participant) => {
    if (participant.user_phone) return participant.user_phone;
    if (participant.user?.phone_number) return participant.user.phone_number;
    if (participant.phone_number) return participant.phone_number;
    if (participant.phone) return participant.phone;
    return 'N/A';
  };

  const getParticipantEmail = (participant) => {
    if (participant.user_email) return participant.user_email;
    if (participant.user?.email) return participant.user.email;
    if (participant.email) return participant.email;
    return 'N/A';
  };

  const getParticipantRole = (participant) => {
    if (participant.user_role) return participant.user_role;
    if (participant.user?.role) return participant.user.role;
    if (participant.role) return participant.role;
    return 'N/A';
  };

  const getRandomColor = (seed) => {
    const colors = [
      '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
      '#FF8000', '#8000FF', '#0080FF', '#FF0080', '#80FF00', '#00FF80'
    ];
    return colors[seed % colors.length];
  };

  if (!currentUserId) {
    return <div>{t('loading')}</div>;
  }

  return (
    <section className="p-4">
      <h2 className="text-2xl font-bold mb-4">{t('search-manager-h2')}</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button 
            className="ml-4 text-red-900 underline"
            onClick={() => setError(null)}
          >
            {t('dismiss')}
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          {t('loading')}...
        </div>
      )}

      {['admin', 'coordinator'].includes(currentUserRole) ? (
        <>
          {/* ... Table and Forms ... */}
          <h3 className="text-xl font-semibold mb-2">{t('events-h2')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">{t('event-table-name')}</th>
                  <th className="border p-2">{t('event-table-status')}</th>
                  <th className="border p-2">{t('event-table-starttime')}</th>
                  <th className="border p-2">{t('actions-label')}</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-100">
                    <td className="border p-2">{event.name}</td>
                    <td className="border p-2">{event.status}</td>
                    <td className="border p-2">{new Date(event.start_time).toLocaleString()}</td>
                    <td className="border p-2">
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded mr-2 mb-1"
                        onClick={() => selectEvent(event)}
                      >
                        {t('select-event-btn')}
                      </button>
                      <button
                        className="bg-green-500 text-white px-2 py-1 rounded mr-2 mb-1"
                        onClick={() => joinEvent(event.id)}
                      >
                        {t('join-event-btn')}
                      </button>
                      {['admin', 'coordinator'].includes(currentUserRole) && (
                        <>
                          <button
                            className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 mb-1"
                            onClick={() => selectEventForEdit(event)}
                          >
                            {t('update-event-btn')}
                          </button>
                          <button
                            className="bg-red-500 text-white px-2 py-1 rounded mb-1"
                            onClick={() => deleteEvent(event.id)}
                          >
                            {t('delete-event-btn')}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form onSubmit={editingEvent ? updateEvent : createEvent} className="mb-8">
            <label className="block mb-2">{t('event-name-label')}</label>
            <input
              className="border p-2 w-full mb-2"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
            />
            <label className="block mb-2">{t('event-status-label')}</label>
            <select
              className="border p-2 w-full mb-2"
              value={eventStatus}
              onChange={(e) => setEventStatus(e.target.value)}
            >
              <option value="active">{t('status-active')}</option>
              <option value="paused">{t('status-paused')}</option>
              <option value="completed">{t('status-completed')}</option>
            </select>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              type="submit"
              disabled={loading}
            >
              {editingEvent ? t('update-event-btn') : t('create-event-btn')}
            </button>
            {editingEvent && (
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded ml-2"
                type="button"
                onClick={resetEventForm}
                disabled={loading}
              >
                {t('cancel-btn')}
              </button>
            )}
          </form>

          {selectedEvent && (
            <>
              <h3 className="text-xl font-semibold mb-2">{t('map-h2')}</h3>
              
              <div className="mb-4 flex flex-col space-y-2">
                <div className="flex space-x-2">
                  <button
                    className={`px-3 py-1 rounded ${mapLayers.openstreetmap ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => handleLayerChange('openstreetmap')}
                  >
                    OpenStreetMap
                  </button>
                  <button
                    className={`px-3 py-1 rounded ${mapLayers.turistautak ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => handleLayerChange('turistautak')}
                  >
                    Turistautak
                  </button>
                  <button
                    className={`px-3 py-1 rounded ${mapLayers.satellite ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => handleLayerChange('satellite')}
                  >
                    Műhold
                  </button>
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showProbZones}
                    onChange={(e) => setShowProbZones(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span>{t('show-prob-zones')}</span>
                </label>
                <button
                  className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
                  onClick={() => {
                    if (selectedEvent) {
                      cache.current.delete(`markers-${selectedEvent.id}`);
                      cache.current.delete(`event-participants-${selectedEvent.id}`);
                      loadMarkers(selectedEvent.id);
                      loadEventParticipants(selectedEvent.id);
                    }
                  }}
                  disabled={loading || !selectedEvent}
                >
                  {t('refresh-map-and-participants')}
                </button>
              </div>
              <MapContainer
                center={[47.4979, 19.0402]}
                zoom={10}
                style={{ height: '400px', width: '100%', marginBottom: '20px' }}
              >
                <LayersControl position="topright">
                  <LayersControl.BaseLayer checked={mapLayers.openstreetmap} name={t('openstreetmap-layer') || 'OpenStreetMap'}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      maxZoom={19}
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer checked={mapLayers.turistautak} name={t('turistautak-layer') || 'Turistautak'}>
                    <TileLayer
                      attribution='&copy; turistautak.hu'
                      url="http://terkep.turistautak.hu/tiles/turistautak-domborzattal/{z}/{x}/{y}.png"
                      maxZoom={17}
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer checked={mapLayers.satellite} name={t('satellite-layer') || 'Műhold'}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
                      url="https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=YOUR_MAPTILER_KEY"
                      maxZoom={19}
                    />
                  </LayersControl.BaseLayer>
                </LayersControl>
                
                <MapBounds missingPersons={missingPersons} markers={markers} />
                
                {missingPersons.map((person) => {
                  if (person.location?.lat && person.location?.lng) {
                    return (
                      <Marker
                        key={`person-${person.id}`}
                        position={[person.location.lat, person.location.lng]}
                        icon={L.icon({
                          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                          iconSize: [25, 41],
                          iconAnchor: [12, 41],
                          popupAnchor: [1, -34],
                          shadowSize: [41, 41]
                        })}
                      >
                        <Popup>
                          <div>
                            <h3 className="font-bold">{person.name}</h3>
                            <p>{t('age')}: {person.age}</p>
                            <p>{t('clothing')}: {person.clothing}</p>
                            {person.photo_url && (
                              <img
                                src={person.photo_url}
                                alt={person.name}
                                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                              />
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    );
                  }
                  return null;
                })}
                
                {markers
                  .filter(m => m.type === 'map_marker' && m.lat_lng?.coordinates)
                  .map((marker) => {
                    try {
                      const lat = parseFloat(marker.lat_lng.coordinates[1]);
                      const lng = parseFloat(marker.lat_lng.coordinates[0]);
                     
                      if (isNaN(lat) || isNaN(lng)) {
                        console.error('Invalid coordinates for marker:', marker);
                        return null;
                      }
                     
                      return (
                        <Marker
                          key={`marker-${marker.id}`}
                          position={[lat, lng]}
                        >
                          <Popup>
                            <div>
                              <p className="font-bold">{t('marker')}</p>
                              <p>{t('recorded-by')}: {marker.user?.full_name || 'N/A'}</p>
                              <p>{t('recording-time')}: {marker.created_at ? new Date(marker.created_at).toLocaleString() : 'N/A'}</p>
                              <p>{t('description')}: {marker.description || 'N/A'}</p>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    } catch (err) {
                      console.error('Error rendering marker:', err, marker);
                      return null;
                    }
                  })}
                
                {/* --- JAVÍTOTT GPS NYOMVONAL RAJZOLÁS IDŐBÉLYEGGEL --- */}
                {userTracks.map((userData, userIndex) => {
                  const segments = userData.segments;
                  const segmentTimes = userData.segmentTimes; // IDŐBÉLYEGEK
                  const userColor = getRandomColor(userIndex); 

                  return segments.map((segment, segIndex) => {
                    if (segment && segment.length > 0) {
                      const times = segmentTimes[segIndex];
                      const startTimeStr = times ? new Date(times.start).toLocaleTimeString() : 'N/A';
                      const endTimeStr = times ? new Date(times.end).toLocaleTimeString() : 'N/A';

                      return (
                        <Polyline
                          key={`track-${userIndex}-${segIndex}`}
                          positions={segment}
                          color={userColor}
                          weight={4}
                          opacity={0.7}
                        >
                          <Popup>
                            <div>
                              <p className="font-bold">{t('gps-track')}</p>
                              <p>{t('recorded-by')}: {userData.userInfo?.full_name || 'N/A'}</p>
                              {/* IDŐTARTAM KIÍRÁSA */}
                              <p style={{fontWeight: 'bold'}}>
                                {t('time')}: {startTimeStr} - {endTimeStr}
                              </p>
                              <p>{t('section')}: {segIndex + 1}</p>
                            </div>
                          </Popup>
                        </Polyline>
                      );
                    }
                    return null;
                  });
                })}
      
                {missingPersons.map((person) => renderProbZones(person.prob_zones))}
                
                {markers
                  .filter(m => m.type === 'polygon' && m.lat_lng?.coordinates)
                  .map((polygon, index) => {
                    try {
                      const coords = polygon.lat_lng.coordinates.map(coord => [parseFloat(coord[1]), parseFloat(coord[0])]);
                      if (coords.every(coord => coord.length === 2 && !isNaN(coord[0]) && !isNaN(coord[1]))) {
                        return (
                          <Polygon
                            key={`polygon-${polygon.id}-${index}`}
                            positions={coords}
                            color="#800080"
                            fillOpacity={0.3}
                            weight={2}
                          >
                            <Popup>
                              <div>
                                <p className="font-bold">{t('polygon')}</p>
                                <p>{t('recorded-by')}: {polygon.user?.full_name || 'N/A'}</p>
                                <p>{t('recording-time')}: {polygon.created_at ? new Date(polygon.created_at).toLocaleString() : 'N/A'}</p>
                                <p>{t('description')}: {polygon.description || 'N/A'}</p>
                              </div>
                            </Popup>
                          </Polygon>
                        );
                      }
                      console.warn('Invalid polygon data:', polygon);
                      return null;
                    } catch (err) {
                      console.error('Error rendering polygon:', err, polygon);
                      return null;
                    }
                  })}
              </MapContainer>
            </>
          )}

          {selectedEvent && (
            <>
              <h3 className="text-xl font-semibold mb-2">
                {t('participants-h2')} - {selectedEvent.name}
              </h3>
              <div className="mb-4">
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                  onClick={() => joinEvent(selectedEvent.id)}
                  disabled={loading}
                >
                  {t('join-event-btn')}
                </button>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded"
                  onClick={() => leaveEvent(selectedEvent.id)}
                  disabled={loading}
                >
                  {t('leave-event-btn')}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse mb-4">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border p-2">{t('participant-table-name')}</th>
                      <th className="border p-2">{t('participant-table-phone')}</th>
                      <th className="border p-2">{t('participant-table-joined')}</th>
                      <th className="border p-2">{t('participant-table-left')}</th>
                      <th className="border p-2">{t('actions-label')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventParticipants.map((participant) => (
                      <tr key={participant.id || `${participant.event_id}-${participant.user_id}`} className="hover:bg-gray-100">
                        <td className="border p-2">{getParticipantName(participant)}</td>
                        <td className="border p-2">{getParticipantPhone(participant)}</td>
                        <td className="border p-2">
                          {participant.joined_at ? new Date(participant.joined_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="border p-2">
                          {participant.left_at ? new Date(participant.left_at).toLocaleString() : '-'}
                        </td>
                        <td className="border p-2">
                          {participant.left_at ? (
                            <button
                              className="bg-green-500 text-white px-2 py-1 rounded mr-2 mb-1"
                              onClick={() => joinEvent(selectedEvent.id)}
                              disabled={loading}
                            >
                              {t('rejoin-participant-btn')}
                            </button>
                          ) : (
                            <>
                              <button
                                className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 mb-1"
                                onClick={() => updateParticipantStatus(participant, 'paused')}
                                disabled={loading || participant.pause_status}
                              >
                                {t('pause-participant-btn')}
                              </button>
                              <button
                                className="bg-green-500 text-white px-2 py-1 rounded mr-2 mb-1"
                                onClick={() => updateParticipantStatus(participant, 'active')}
                                disabled={loading || !participant.pause_status}
                              >
                                {t('resume-participant-btn')}
                              </button>
                              <button
                                className="bg-red-500 text-white px-2 py-1 rounded mb-1"
                                onClick={() => updateParticipantStatus(participant, 'left')}
                                disabled={loading}
                              >
                                {t('leave-participant-btn')}
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {selectedEvent && (
            <>
              <h3 className="text-xl font-semibold mb-2">
                {t('missing-persons-editor-h2')} - {selectedEvent.name}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse mb-4">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border p-2">{t('missing-table-name')}</th>
                      <th className="border p-2">{t('missing-table-age')}</th>
                      <th className="border p-2">{t('missing-table-height')}</th>
                      <th className="border p-2">{t('missing-table-clothing')}</th>
                      <th className="border p-2">{t('missing-table-photo')}</th>
                      <th className="border p-2">{t('missing-table-behavior')}</th>
                      <th className="border p-2">{t('missing-table-location')}</th>
                      <th className="border p-2">{t('actions-label')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missingPersons.map((person) => (
                      <tr key={person.id} className="hover:bg-gray-100">
                        <td className="border p-2">{person.name}</td>
                        <td className="border p-2">{person.age}</td>
                        <td className="border p-2">{person.height_cm}</td>
                        <td className="border p-2">{person.clothing}</td>
                        <td className="border p-2">
                          {person.photo_url && (
                            <img
                              src={person.photo_url}
                              alt={person.name}
                              style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                              onClick={() => window.open(person.photo_url, '_blank')}
                              className="cursor-pointer"
                            />
                          )}
                        </td>
                        <td className="border p-2">{t(`behavior-${person.behavior_category || 'default'}`)}</td>
                        <td className="border p-2">
                          {person.location && (
                            <span>
                              {person.location.lat}, {person.location.lng}
                            </span>
                          )}
                        </td>
                        <td className="border p-2">
                          <button
                            className="bg-blue-500 text-white px-2 py-1 rounded mr-2 mb-1"
                            onClick={() => selectPerson(person)}
                            disabled={loading}
                          >
                            {t('update-missing-btn')}
                          </button>
                          <button
                            className="bg-red-500 text-white px-2 py-1 rounded mb-1"
                            onClick={() => deleteMissing(person.id)}
                            disabled={loading}
                          >
                            {t('delete-missing-btn')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <form onSubmit={selectedPerson ? updateMissing : createMissing} className="mb-8">
                <label className="block mb-2">
                  {t('name-label')}
                  {getFieldStatus(name, selectedPerson?.name || '')}
                </label>
                <input
                  className="border p-2 w-full mb-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <label className="block mb-2">{t('age-label')}</label>
                <input
                  className="border p-2 w-full mb-2"
                  type="number"
                  value={age}
                  onChange={(e) => handleNumberChange(e.target.value, setAge)}
                  min="0"
                  max="150"
                />
                <label className="block mb-2">{t('height-label')}</label>
                <input
                  className="border p-2 w-full mb-2"
                  type="number"
                  value={height}
                  onChange={(e) => handleNumberChange(e.target.value, setHeight)}
                  min="0"
                  max="300"
                />
                <label className="block mb-2">{t('clothing-label')}</label>
                <input
                  className="border p-2 w-full mb-2"
                  value={clothing}
                  onChange={(e) => setClothing(e.target.value)}
                />
                <label className="block mb-2">{t('photo-label')}</label>
                <input
                  className="border p-2 w-full mb-2"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                />
                {photoUrl && (
                  <div className="mb-2">
                    <img
                      src={photoUrl}
                      alt="Preview"
                      style={{ width: '200px', height: '200px', objectFit: 'contain' }}
                    />
                  </div>
                )}
                {uploading && <p>{t('uploading')}</p>}
                <label className="block mb-2">{t('behavior-category-label')}</label>
                <select
                  className="border p-2 w-full mb-2"
                  value={behaviorCategory}
                  onChange={(e) => setBehaviorCategory(e.target.value)}
                >
                  <option value="">{t('select-behavior-category')}</option>
                  {behaviorCategories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <label className="block mb-2">{t('prob-zones-label')}</label>
                <textarea
                  className="border p-2 w-full mb-2"
                  value={probZones}
                  onChange={(e) => setProbZones(e.target.value)}
                  placeholder='{"zone1": [{"lat": 47.5, "lng": 19.0}, {"lat": 47.6, "lng": 19.1}], "zone2": [{"lat": 47.4, "lng": 19.2}, {"lat": 47.5, "lng": 19.3}]}'
                />
                <label className="block mb-2">{t('location-label')}</label>
                <MapPicker
                  onLocationSelected={handleLocationSelected}
                  initialLat={lat ? parseFloat(lat) : null}
                  initialLng={lng ? parseFloat(lng) : null}
                />
                <label className="block mb-2">{t('location-lat-label')}</label>
                <input
                  className="border p-2 w-full mb-2"
                  type="text"
                  value={lat}
                  onChange={(e) => handleFloatChange(e.target.value, setLat)}
                  placeholder="47.4979"
                  step="any"
                />
                <label className="block mb-2">{t('location-lng-label')}</label>
                <input
                  className="border p-2 w-full mb-2"
                  type="text"
                  value={lng}
                  onChange={(e) => handleFloatChange(e.target.value, setLng)}
                  placeholder="19.0402"
                  step="any"
                />
                <button
                  className={`px-4 py-2 rounded ${
                    hasChanges || photoFile
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  type="submit"
                  disabled={(!hasChanges && !photoFile) || uploading || loading}
                >
                  {selectedPerson ? t('update-missing-btn') : t('create-missing-btn')}
                </button>
                {selectedPerson && (
                  <button
                    className="bg-gray-500 text-white px-4 py-2 rounded ml-2"
                    type="button"
                    onClick={resetPersonForm}
                    disabled={loading}
                  >
                    {t('cancel-btn')}
                  </button>
                )}
                {hasChanges && (
                  <div className="mt-2 text-sm text-green-600">
                    {t('changes-detected')}
                  </div>
                )}
              </form>
            </>
          )}
        </>
      ) : (
        <p className="text-red-500">{t('permission-denied')}</p>
      )}
    </section>
  );
};

export default SearchManager;