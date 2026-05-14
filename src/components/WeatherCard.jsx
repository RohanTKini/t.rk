import { useEffect, useRef, useState } from 'react';

/* Open-Meteo weather codes → label + emoji icon. No API key required. */
const WEATHER_CODES = {
  0:  { label: 'Clear sky',          icon: '☀️' },
  1:  { label: 'Mostly clear',       icon: '🌤️' },
  2:  { label: 'Partly cloudy',      icon: '⛅' },
  3:  { label: 'Overcast',           icon: '☁️' },
  45: { label: 'Foggy',              icon: '🌫️' },
  48: { label: 'Rime fog',           icon: '🌫️' },
  51: { label: 'Light drizzle',      icon: '🌦️' },
  53: { label: 'Drizzle',            icon: '🌦️' },
  55: { label: 'Heavy drizzle',      icon: '🌧️' },
  56: { label: 'Freezing drizzle',   icon: '🌧️' },
  57: { label: 'Freezing drizzle',   icon: '🌧️' },
  61: { label: 'Light rain',         icon: '🌦️' },
  63: { label: 'Rain',               icon: '🌧️' },
  65: { label: 'Heavy rain',         icon: '🌧️' },
  66: { label: 'Freezing rain',      icon: '🌧️' },
  67: { label: 'Freezing rain',      icon: '🌧️' },
  71: { label: 'Light snow',         icon: '🌨️' },
  73: { label: 'Snow',               icon: '❄️' },
  75: { label: 'Heavy snow',         icon: '❄️' },
  77: { label: 'Snow grains',        icon: '🌨️' },
  80: { label: 'Light showers',      icon: '🌦️' },
  81: { label: 'Showers',            icon: '🌧️' },
  82: { label: 'Heavy showers',      icon: '⛈️' },
  85: { label: 'Snow showers',       icon: '🌨️' },
  86: { label: 'Heavy snow showers', icon: '❄️' },
  95: { label: 'Thunderstorm',       icon: '⛈️' },
  96: { label: 'Storm w/ hail',      icon: '⛈️' },
  99: { label: 'Severe storm',       icon: '⛈️' }
};

function formatNow() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function WeatherCard() {
  const [coords, setCoords]     = useState(null);   // { lat, lng, accuracy }
  const [place, setPlace]       = useState('');     // pretty location label
  const [weather, setWeather]   = useState(null);   // { temp, code, wind, humidity, feels, updatedAt }
  const [status, setStatus]     = useState('idle'); // idle | locating | loading | ready | denied | error
  const [error, setError]       = useState('');
  const watchIdRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const lastFetchedKeyRef = useRef('');

  /* --- 1. Subscribe to geolocation. Re-fires whenever the device moves. --- */
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setStatus('error');
      setError('Geolocation not supported on this device');
      return;
    }
    setStatus('locating');

    const onPos = (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      setCoords(prev => {
        if (prev && Math.abs(prev.lat - latitude) < 0.0005 && Math.abs(prev.lng - longitude) < 0.0005) {
          return prev;
        }
        return { lat: latitude, lng: longitude, accuracy };
      });
    };
    const onErr = (err) => {
      setStatus(err.code === 1 ? 'denied' : 'error');
      setError(err.message || 'Location unavailable');
    };
    const opts = { enableHighAccuracy: false, maximumAge: 60000, timeout: 15000 };

    navigator.geolocation.getCurrentPosition(onPos, onErr, opts);
    try {
      watchIdRef.current = navigator.geolocation.watchPosition(onPos, onErr, opts);
    } catch { /* watchPosition unsupported */ }

    return () => {
      if (watchIdRef.current != null) {
        try { navigator.geolocation.clearWatch(watchIdRef.current); } catch {}
      }
    };
  }, []);

  /* --- 2. When coords change, fetch weather + reverse-geocode in parallel. --- */
  useEffect(() => {
    if (!coords) return;
    const key = `${coords.lat.toFixed(3)}|${coords.lng.toFixed(3)}`;
    if (lastFetchedKeyRef.current === key && weather) return;
    lastFetchedKeyRef.current = key;

    let cancelled = false;
    setStatus(prev => prev === 'ready' ? prev : 'loading');

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;
    const geoUrl     = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=10&addressdetails=1`;

    Promise.allSettled([
      fetch(weatherUrl).then(r => r.json()),
      fetch(geoUrl, { headers: { 'Accept-Language': 'en' } }).then(r => r.json()).catch(() => null)
    ]).then(([w, g]) => {
      if (cancelled) return;

      if (w.status === 'fulfilled' && w.value && w.value.current) {
        const c = w.value.current;
        setWeather({
          temp: Math.round(c.temperature_2m),
          feels: Math.round(c.apparent_temperature),
          code: c.weather_code,
          humidity: c.relative_humidity_2m,
          wind: Math.round(c.wind_speed_10m),
          updatedAt: formatNow()
        });
        setStatus('ready');
      } else {
        setStatus('error');
        setError('Could not load weather');
      }

      if (g.status === 'fulfilled' && g.value) {
        const a = g.value.address || {};
        const label =
          a.suburb || a.neighbourhood || a.village || a.town || a.city_district ||
          a.city || a.county || a.state || g.value.display_name || '';
        const region = a.state || a.country || '';
        setPlace(region && label && region !== label ? `${label}, ${region}` : (label || region || ''));
      }
    });

    /* Auto-refresh every 10 minutes while card is mounted. */
    clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = setInterval(() => {
      lastFetchedKeyRef.current = '';
      setCoords(c => c ? { ...c } : c);
    }, 10 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(refreshTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords]);

  function manualRefresh() {
    if (!('geolocation' in navigator)) return;
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        lastFetchedKeyRef.current = '';
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
      },
      (err) => { setStatus(err.code === 1 ? 'denied' : 'error'); setError(err.message || 'Location unavailable'); },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  const meta = weather ? (WEATHER_CODES[weather.code] || { label: 'Conditions', icon: '🌡️' }) : null;

  return (
    <div className="weather-card">
      <div className="weather-head">
        <div className="weather-eyebrow">
          <span className="weather-pulse"></span>
          Live weather · your location
        </div>
        <button className="weather-refresh" onClick={manualRefresh} title="Refresh location & weather" aria-label="Refresh">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>
      </div>

      {status === 'ready' && weather && (
        <div className="weather-body">
          <div className="weather-icon" aria-hidden="true">{meta.icon}</div>
          <div className="weather-main">
            <div className="weather-temp">
              {weather.temp}<span className="weather-unit">°C</span>
            </div>
            <div className="weather-cond">{meta.label}</div>
            <div className="weather-place" title={place}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span>{place || 'Locating area…'}</span>
            </div>
          </div>
          <div className="weather-stats">
            <div className="weather-stat">
              <span className="weather-stat-key">Feels</span>
              <span className="weather-stat-val">{weather.feels}°</span>
            </div>
            <div className="weather-stat">
              <span className="weather-stat-key">Humidity</span>
              <span className="weather-stat-val">{weather.humidity}%</span>
            </div>
            <div className="weather-stat">
              <span className="weather-stat-key">Wind</span>
              <span className="weather-stat-val">{weather.wind} km/h</span>
            </div>
            <div className="weather-stat">
              <span className="weather-stat-key">Updated</span>
              <span className="weather-stat-val">{weather.updatedAt}</span>
            </div>
          </div>
        </div>
      )}

      {(status === 'locating' || status === 'loading') && (
        <div className="weather-loading">
          <div className="weather-skeleton-icon"></div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="weather-skeleton-line" style={{ width: '40%' }}></div>
            <div className="weather-skeleton-line" style={{ width: '70%' }}></div>
            <div className="weather-skeleton-line" style={{ width: '55%' }}></div>
          </div>
        </div>
      )}

      {(status === 'denied' || status === 'error') && (
        <div className="weather-empty">
          <div className="weather-empty-icon">📡</div>
          <div className="weather-empty-text">
            <strong>{status === 'denied' ? 'Location blocked' : 'Weather unavailable'}</strong>
            <p>{status === 'denied'
              ? 'Allow location access in your browser settings, then tap refresh to see live weather.'
              : (error || 'Try refreshing in a moment.')}</p>
          </div>
          <button className="btn btn-primary" onClick={manualRefresh} style={{ padding: '9px 16px', fontSize: 12.5 }}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
