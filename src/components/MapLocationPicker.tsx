import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

interface MapLocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onConfirmLocation: (location: {
    latitude: number;
    longitude: number;
    formattedAddress: string;
    city?: string;
    area?: string;
    pincode?: string;
  }) => void;
}

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  isOpen,
  onClose,
  initialLat = 31.4429,
  initialLng = 76.7118,
  initialAddress = '',
  onConfirmLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [currentLat, setCurrentLat] = useState<number>(initialLat);
  const [currentLng, setCurrentLng] = useState<number>(initialLng);
  const [formattedAddress, setFormattedAddress] = useState<string>(initialAddress || 'Main Bazaar, Ghumarwin, Himachal Pradesh');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [isLocating, setIsLocating] = useState(false);

  // Himachal Pradesh default centers
  const quickAreas = [
    { name: 'Ghumarwin Bazaar', lat: 31.4429, lng: 76.7118 },
    { name: 'Bilaspur Main', lat: 31.3417, lng: 76.7578 },
    { name: 'Sundernagar Chowk', lat: 31.5323, lng: 76.8927 },
  ];

  // Reverse geocoding function
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (resp.ok) {
        const data = await resp.json();
        if (data.display_name) {
          setFormattedAddress(data.display_name);
        }
      }
    } catch {
      // Fallback description if network is offline
      setFormattedAddress(`Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Fix default marker icon assets
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | LocalMarket Geo-Engine',
        maxZoom: 19,
      }).addTo(map);

      // Custom pulse pin
      const marker = L.marker([currentLat, currentLng], {
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setCurrentLat(pos.lat);
        setCurrentLng(pos.lng);
        reverseGeocode(pos.lat, pos.lng);
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        setCurrentLat(e.latlng.lat);
        setCurrentLng(e.latlng.lng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Invalidate size once modal animation stabilizes
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    } else {
      mapInstanceRef.current.setView([currentLat, currentLng], 15);
      markerRef.current?.setLatLng([currentLat, currentLng]);
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 250);
    }

    return () => {
      // Keep map cached or cleanup
    };
  }, [isOpen]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const q = encodeURIComponent(`${searchQuery}, Himachal Pradesh, India`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=5`);
      if (res.ok) {
        const results = await res.json();
        setSearchResults(results);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: { display_name: string; lat: string; lon: string }) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setCurrentLat(lat);
    setCurrentLng(lng);
    setFormattedAddress(result.display_name);
    setSearchResults([]);
    setSearchQuery('');

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16);
      markerRef.current.setLatLng([lat, lng]);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentLat(lat);
        setCurrentLng(lng);
        reverseGeocode(lat, lng);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 17);
          markerRef.current.setLatLng([lat, lng]);
        }
        setIsLocating(false);
      },
      (err) => {
        alert('Could not retrieve current GPS coordinates. Please select your store on the map.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSelectQuickArea = (area: { name: string; lat: number; lng: number }) => {
    setCurrentLat(area.lat);
    setCurrentLng(area.lng);
    reverseGeocode(area.lat, area.lng);
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([area.lat, area.lng], 16);
      markerRef.current.setLatLng([area.lat, area.lng]);
    }
  };

  const handleConfirm = () => {
    // Extract postal code or city if present
    const pincodeMatch = formattedAddress.match(/\b\d{6}\b/);
    const pincode = pincodeMatch ? pincodeMatch[0] : '';

    onConfirmLocation({
      latitude: parseFloat(currentLat.toFixed(6)),
      longitude: parseFloat(currentLng.toFixed(6)),
      formattedAddress,
      pincode
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col max-h-[92vh] overflow-hidden z-10 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-secondary">pin_drop</span>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Select Store Location on Map
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Search shop address, drag pin, or use current location to tag storefront coordinates.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Search Bar & Quick Controls */}
        <div className="p-4 border-b border-outline-variant/20 bg-surface-container-lowest space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search shop name, market, chowk, or town (e.g. Ghumarwin Bazaar)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm text-body-sm focus:outline-none focus:border-secondary"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold hover:bg-neutral-800 transition disabled:opacity-50 shrink-0"
            >
              {isSearching ? 'Searching...' : 'Search Area'}
            </button>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="px-3.5 py-2 bg-secondary-container text-on-secondary-container rounded-lg font-label-md text-label-md font-bold hover:opacity-90 transition flex items-center gap-1 shrink-0"
              title="Detect device GPS location"
            >
              <span className="material-symbols-outlined text-[18px]">my_location</span>
              <span className="hidden sm:inline">{isLocating ? 'Locating...' : 'My Location'}</span>
            </button>
          </form>

          {/* Autocomplete Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 overflow-hidden shadow-md max-h-48 overflow-y-auto">
              {searchResults.map((r, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectSearchResult(r)}
                  className="p-2.5 hover:bg-surface-container cursor-pointer border-b border-outline-variant/20 last:border-b-0 text-body-sm font-medium text-on-surface flex items-start gap-2"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5">location_on</span>
                  <span className="truncate">{r.display_name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick cluster shortcut chips */}
          <div className="flex items-center gap-2 overflow-x-auto text-[12px] pt-1">
            <span className="text-on-surface-variant font-semibold shrink-0">Quick Jumps:</span>
            {quickAreas.map((q) => (
              <button
                key={q.name}
                type="button"
                onClick={() => handleSelectQuickArea(q)}
                className="px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface font-medium border border-outline-variant/30 shrink-0 transition"
              >
                {q.name}
              </button>
            ))}
          </div>
        </div>

        {/* Map Container */}
        <div className="relative flex-1 min-h-[340px] w-full bg-surface-container">
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />
          <div className="absolute bottom-3 left-3 z-10 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-md border border-outline-variant/30 text-xs font-semibold text-on-surface pointer-events-none">
            💡 Tip: Click anywhere or drag the blue pin to mark your shop entrance.
          </div>
        </div>

        {/* Footer / Selected Location Details */}
        <div className="p-4 bg-surface-container-low border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm uppercase font-bold text-secondary">
                Selected Store Location:
              </span>
              <span className="text-[12px] text-on-surface-variant font-mono">
                Lat: {currentLat.toFixed(5)}, Lng: {currentLng.toFixed(5)}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface font-medium truncate mt-0.5" title={formattedAddress}>
              {formattedAddress}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-on-surface hover:bg-surface-container transition font-label-md text-label-md"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-neutral-800 text-on-primary font-label-md text-label-md font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Confirm Location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
