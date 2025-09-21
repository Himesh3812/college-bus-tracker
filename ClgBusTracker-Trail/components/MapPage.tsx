import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';

import type { BusStop, UserDetails } from '../types';
import Notification from './Notification';
import { BusIcon } from './icons/BusIcon';

interface MapPageProps {
  userDetails: UserDetails;
  busStops: BusStop[];
  onLogout: () => void;
}

// Haversine formula to calculate distance between two lat/lng points in kilometers
const calculateDistance = (coords1: [number, number], coords2: [number, number]): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(coords2[0] - coords1[0]);
  const dLon = toRad(coords2[1] - coords1[1]);
  const lat1 = toRad(coords1[0]);
  const lat2 = toRad(coords2[0]);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};


const ChangeView: React.FC<{ center: LatLngExpression; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const MapPage: React.FC<MapPageProps> = ({ userDetails, busStops, onLogout }) => {
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [etas, setEtas] = useState<{ [key: string]: string }>({});

  const AVERAGE_BUS_SPEED_KMPH = 40; // Average speed in km/h
  const SIMULATION_SPEED_MULTIPLIER = 100; // Simulate bus movement 100x faster than real-time

  const busPosition = busStops[currentStopIndex].coords;
  const routeCoordinates = useMemo(() => busStops.map(stop => stop.coords), [busStops]);

  // Calculate the simulated time to travel between each stop
  const travelTimes = useMemo(() => {
    const times = [];
    for (let i = 0; i < busStops.length - 1; i++) {
        const distance = calculateDistance(busStops[i].coords, busStops[i+1].coords); // in km
        const realTimeSeconds = (distance / AVERAGE_BUS_SPEED_KMPH) * 3600;
        const simulationTimeMs = (realTimeSeconds / SIMULATION_SPEED_MULTIPLIER) * 1000;
        times.push(Math.max(2000, simulationTimeMs)); // Ensure at least a 2-second delay
    }
    return times;
  }, [busStops]);

  // Effect for simulating bus movement from stop to stop
  useEffect(() => {
    if (currentStopIndex >= travelTimes.length) {
      // Reached the final destination, stop moving.
      return;
    }

    const timer = setTimeout(() => {
        setCurrentStopIndex(prev => prev + 1);
    }, travelTimes[currentStopIndex]);

    return () => clearTimeout(timer);
  }, [currentStopIndex, travelTimes]);

  // Effect for calculating ETAs and handling notifications
  useEffect(() => {
    const now = new Date();
    let cumulativeTimeMs = 0;
    const newEtas: { [key: string]: string } = {};

    // Set status for stops already passed
    for(let i = 0; i < currentStopIndex; i++) {
      newEtas[busStops[i].name] = 'Arrived';
    }

    // Set status for the current stop
    newEtas[busStops[currentStopIndex].name] = 'At Stop';
    
    // Calculate ETAs for all upcoming stops
    for (let i = currentStopIndex; i < travelTimes.length; i++) {
        // Revert simulation time to real-world time for ETA calculation
        cumulativeTimeMs += (travelTimes[i] * SIMULATION_SPEED_MULTIPLIER);
        const etaDate = new Date(now.getTime() + cumulativeTimeMs);
        newEtas[busStops[i + 1].name] = etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    setEtas(newEtas);

    // Trigger notification when the bus is one stop away
    const boardingStopIndex = busStops.findIndex(stop => stop.name === userDetails.boardingStopName);
    if (boardingStopIndex > 0 && currentStopIndex === boardingStopIndex - 1) {
      setNotificationMessage(`The bus is approaching your stop: ${userDetails.boardingStopName}.`);
      setShowNotification(true);
    }
  }, [currentStopIndex, userDetails.boardingStopName, busStops, travelTimes]);

  const mapCenter: LatLngExpression = [17.85, 83.35]; // A central point for the route
  const zoomLevel = 10;

  return (
    <div className="relative w-full h-full">
      <MapContainer center={mapCenter} zoom={zoomLevel} scrollWheelZoom={true} className="w-full h-full">
        <ChangeView center={busPosition} zoom={14} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={routeCoordinates} color="blue" weight={5} opacity={0.7} />
        {busStops.map((stop, index) => (
          <Marker key={index} position={stop.coords}>
            <Popup>
              <b>{stop.name}</b> <br /> Stop {index + 1}
              {etas[stop.name] && <><br /><b>ETA: {etas[stop.name]}</b></>}
            </Popup>
            <Tooltip
              permanent
              direction="right"
              offset={[10, 0]}
              className="stop-label-tooltip"
            >
              {stop.name}
            </Tooltip>
          </Marker>
        ))}
        <Marker position={busPosition} icon={BusIcon}>
          <Popup>
            <b>College Bus</b>
            <br />
            Location: {busStops[currentStopIndex].name}
            {currentStopIndex < busStops.length - 1 ? (
              <>
                <br />
                Next Stop: {busStops[currentStopIndex + 1].name}
              </>
            ) : (
               <>
                <br />
                At final destination.
               </>
            )}
          </Popup>
        </Marker>
      </MapContainer>
      
      <div className="absolute top-4 left-4 z-[1000] bg-white p-4 rounded-lg shadow-lg">
        <h2 className="font-bold text-lg">Bus Tracker</h2>
        <p className="text-sm text-gray-600">Roll No: {userDetails.rollNumber}</p>
        <p className="text-sm text-gray-600">Boarding: {userDetails.boardingStopName}</p>
         <div className="mt-2 text-sm">
            <p><b>Current Location:</b> {busStops[currentStopIndex].name}</p>
        </div>
      </div>
      
      <button 
        onClick={onLogout}
        className="absolute top-4 right-4 z-[1000] bg-red-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-red-600 transition-colors"
      >
        Logout
      </button>

      {showNotification && (
        <Notification
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
        />
      )}
    </div>
  );
};

// Set a default icon path for Leaflet markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export default MapPage;