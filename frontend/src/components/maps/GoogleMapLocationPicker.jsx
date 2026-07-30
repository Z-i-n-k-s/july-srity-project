import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, ExternalLink, LocateFixed, MapPin, Search } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const SCRIPT_ID = "google-maps-javascript-api";
const DEFAULT_CENTER = { lat: 23.685, lng: 90.3563 };
let mapsPromise;

function loadGoogleMaps(apiKey) {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (!apiKey) return Promise.reject(new Error("Google Maps API key is not configured."));
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google.maps), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Maps could not load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error("Google Maps could not load."));
    document.head.appendChild(script);
  });

  return mapsPromise;
}

function asNumber(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatCoordinate(value) {
  const number = asNumber(value);
  return number === null ? "" : number.toFixed(6);
}

export function GoogleMapLocationPreview({ location, latitude, longitude, className = "" }) {
  const query = useMemo(() => {
    const lat = asNumber(latitude);
    const lng = asNumber(longitude);
    if (lat !== null && lng !== null) return `${lat},${lng}`;
    return location || "Bangladesh";
  }, [latitude, longitude, location]);

  return (
    <div className={`overflow-hidden rounded-2xl border border-white/10 bg-black/20 ${className}`}>
      <iframe
        title="Google Maps location preview"
        src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`}
        className="h-64 w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

export default function GoogleMapLocationPicker({ address, latitude, longitude, onChange, error }) {
  const { pick } = useLanguage();
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const selectCoordinatesRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [locating, setLocating] = useState(false);
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY?.trim();

  const coordinates = useMemo(() => {
    const lat = asNumber(latitude);
    const lng = asNumber(longitude);
    return lat !== null && lng !== null ? { lat, lng } : null;
  }, [latitude, longitude]);

  const updateMarker = (position, shouldPan = true) => {
    if (!mapRef.current || !window.google?.maps) return;

    if (!markerRef.current) {
      markerRef.current = new window.google.maps.Marker({
        map: mapRef.current,
        position,
        draggable: true,
      });
      markerRef.current.addListener("dragend", () => {
        const next = markerRef.current.getPosition();
        if (next) selectCoordinatesRef.current?.({ lat: next.lat(), lng: next.lng() });
      });
    } else {
      markerRef.current.setPosition(position);
    }

    if (shouldPan) {
      mapRef.current.panTo(position);
      if ((mapRef.current.getZoom() || 0) < 14) mapRef.current.setZoom(15);
    }
  };

  const selectCoordinates = (position) => {
    updateMarker(position);

    const finish = (resolvedAddress) => onChange({
      address: resolvedAddress || address,
      latitude: formatCoordinate(position.lat),
      longitude: formatCoordinate(position.lng),
    });

    if (!geocoderRef.current) {
      finish(address);
      return;
    }

    geocoderRef.current.geocode({ location: position }, (results, status) => {
      finish(status === "OK" ? results?.[0]?.formatted_address : address);
    });
  };
  selectCoordinatesRef.current = selectCoordinates;

  useEffect(() => {
    let active = true;

    if (!apiKey) {
      setMapError(pick(
        "Add REACT_APP_GOOGLE_MAPS_API_KEY to enable click-to-pin selection. Address search, current location and Google Maps preview remain available.",
        "ক্লিক করে পিন বসাতে REACT_APP_GOOGLE_MAPS_API_KEY যোগ করুন। ঠিকানা, বর্তমান অবস্থান ও গুগল ম্যাপস প্রিভিউ ব্যবহার করা যাবে।",
      ));
      return undefined;
    }

    loadGoogleMaps(apiKey).then(() => {
      if (!active || !mapElementRef.current) return;
      const center = coordinates || DEFAULT_CENTER;
      const map = new window.google.maps.Map(mapElementRef.current, {
        center,
        zoom: coordinates ? 15 : 7,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        gestureHandling: "cooperative",
      });
      mapRef.current = map;
      geocoderRef.current = new window.google.maps.Geocoder();
      map.addListener("click", (event) => {
        if (event.latLng) selectCoordinatesRef.current?.({ lat: event.latLng.lat(), lng: event.latLng.lng() });
      });
      if (coordinates) updateMarker(coordinates, false);
      setMapReady(true);
      setMapError("");
    }).catch((loadError) => active && setMapError(loadError.message));

    return () => { active = false; };
    // Initialise once. Later coordinate changes are synchronised below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  useEffect(() => {
    if (mapReady && coordinates) updateMarker(coordinates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, coordinates?.lat, coordinates?.lng]);

  const searchAddress = () => {
    if (!address?.trim()) return;
    if (!geocoderRef.current) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`, "_blank", "noopener,noreferrer");
      return;
    }

    geocoderRef.current.geocode({ address: address.trim(), region: "bd" }, (results, status) => {
      const location = status === "OK" ? results?.[0]?.geometry?.location : null;
      if (!location) {
        setMapError(pick("Location not found. Add a nearby landmark or road.", "স্থান পাওয়া যায়নি। কাছের পরিচিত স্থান বা রাস্তা লিখুন।"));
        return;
      }
      setMapError("");
      selectCoordinates({ lat: location.lat(), lng: location.lng() });
    });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapError(pick("This browser does not support location access.", "এই ব্রাউজারে অবস্থান ব্যবহারের সুবিধা নেই।"));
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        selectCoordinates({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (geoError) => {
        setLocating(false);
        setMapError(geoError.message || pick("Unable to access your current location.", "বর্তমান অবস্থান পাওয়া যায়নি।"));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  };

  const mapQuery = coordinates ? `${coordinates.lat},${coordinates.lng}` : address?.trim();

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
      <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-white"><MapPin className="h-4 w-4 text-archive-rose" />{pick("Pin the location on Google Maps", "গুগল ম্যাপে স্থানটি পিন করুন")}</p>
          <p className="mt-1 text-xs leading-5 text-archive-muted">{pick("Search the typed address, use the device location, or click the map to place the marker.", "লিখিত ঠিকানা খুঁজুন, ডিভাইসের অবস্থান ব্যবহার করুন অথবা ম্যাপে ক্লিক করে পিন বসান।")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={searchAddress} className="focus-ring inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-archive-paper hover:border-archive-amber/30"><Search className="h-4 w-4" />{pick("Find address", "ঠিকানা খুঁজুন")}</button>
          <button type="button" onClick={useCurrentLocation} disabled={locating} className="focus-ring inline-flex items-center gap-2 rounded-lg border border-archive-teal/20 bg-archive-teal/[0.07] px-3 py-2 text-xs font-semibold text-archive-teal disabled:opacity-60">{locating ? <Crosshair className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}{pick("Use current location", "বর্তমান অবস্থান")}</button>
        </div>
      </div>

      {apiKey ? (
        <div ref={mapElementRef} className="h-72 w-full bg-ink-800" aria-label={pick("Interactive Google Map", "ইন্টার‌্যাক্টিভ গুগল ম্যাপ")} />
      ) : mapQuery ? (
        <GoogleMapLocationPreview location={address} latitude={latitude} longitude={longitude} className="rounded-none border-0" />
      ) : (
        <div className="grid h-56 place-items-center bg-[radial-gradient(circle_at_center,rgba(215,154,84,.12),transparent_64%)] p-6 text-center"><div><MapPin className="mx-auto h-8 w-8 text-archive-amber" /><p className="mt-3 text-sm font-semibold text-white">{pick("Add an address to preview the map", "ম্যাপ দেখতে একটি ঠিকানা লিখুন")}</p></div></div>
      )}

      <div className="flex flex-col gap-3 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs leading-5 text-archive-muted">
          {coordinates ? <span>{pick("Selected coordinates", "নির্বাচিত স্থানাঙ্ক")}: {formatCoordinate(coordinates.lat)}, {formatCoordinate(coordinates.lng)}</span> : <span>{pick("No coordinate pin selected yet.", "এখনও কোনো স্থানাঙ্ক পিন নির্বাচন করা হয়নি।")}</span>}
          {(error || mapError) && <p className="mt-1 text-red-300">{error || mapError}</p>}
        </div>
        {mapQuery && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noreferrer" className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-lg text-xs font-semibold text-archive-amber">{pick("Open in Google Maps", "গুগল ম্যাপে খুলুন")} <ExternalLink className="h-4 w-4" /></a>}
      </div>
    </div>
  );
}
