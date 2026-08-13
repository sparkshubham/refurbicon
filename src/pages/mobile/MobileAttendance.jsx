import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { CalendarDays, Camera, Home, RefreshCw } from 'lucide-react';
import api, { fmtDay, fmtTime, statusBadge } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

function FaceCheckIn() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [camState, setCamState] = useState('idle'); // idle | requesting | ready | denied | unsupported
  const [camError, setCamError] = useState('');

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    setCamError('');
    setMsg('');

    if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      setCamState('unsupported');
      setCamError('Camera needs HTTPS or localhost. Open http://localhost:5173/m');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCamState('unsupported');
      setCamError('Camera API not supported in this browser.');
      return;
    }

    setCamState('requesting');
    stopCamera();

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        });
      } catch {
        // Fallback if facingMode is rejected on some desktops
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.muted = true;
        video.setAttribute('playsinline', 'true');
        try {
          await video.play();
        } catch {
          // Autoplay can fail; srcObject is still set and usually visible
        }
      }
      setCamState('ready');
    } catch (err) {
      stopCamera();
      setCamState('denied');
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setCamError('Camera permission blocked. Allow camera for this site, then tap Allow Camera again.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setCamError('No camera found on this device.');
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setCamError('Camera is in use by another app. Close it and try again.');
      } else {
        setCamError(err?.message || 'Could not open camera.');
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  async function checkIn() {
    setLoading(true);
    setMsg('');
    try {
      if (camState !== 'ready') {
        await startCamera();
      }
      await api.post('/attendance/check-in', { faceMatched: camState === 'ready' || streamRef.current != null });
      setMsg('Check-in successful');
    } catch (e) {
      setMsg(e.response?.data?.message || 'Check-in failed (link employee profile to user)');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mobile-top">
        <h2 className="brand-font" style={{ margin: 0 }}>Face Attendance</h2>
        <p style={{ opacity: 0.85, marginBottom: 0 }}>Align your face in the circle</p>
        <div className={`face-frame${camState === 'ready' ? ' live' : ''}`}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={camState === 'ready' ? 'cam-video visible' : 'cam-video'}
          />
          {camState !== 'ready' && (
            <div className="cam-fallback">
              {camState === 'requesting' && 'Requesting camera…'}
              {camState === 'idle' && 'Camera preview'}
              {camState === 'denied' && 'Camera blocked'}
              {camState === 'unsupported' && 'Camera unavailable'}
            </div>
          )}
        </div>
      </div>
      <div className="mobile-card">
        {camState !== 'ready' && (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}
            onClick={startCamera}
            disabled={camState === 'requesting'}
          >
            <RefreshCw size={18} /> {camState === 'requesting' ? 'Opening camera…' : 'Allow Camera'}
          </button>
        )}
        {camError && <p className="cam-hint error">{camError}</p>}
        {camState === 'ready' && <p className="cam-hint ok">Camera ready — align your face, then check in.</p>}
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          disabled={loading}
          onClick={checkIn}
        >
          <Camera size={18} /> {loading ? 'Marking...' : 'Mark Check-In'}
        </button>
        {msg && (
          <p style={{ marginTop: 12, textAlign: 'center', color: msg.includes('success') ? 'var(--success)' : 'var(--danger)' }}>
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}

function TodayStatus() {
  const [data, setData] = useState(null);
  const load = () => api.get('/attendance/my').then((r) => setData(r.data.data)).catch(() => setData({ error: true }));
  useEffect(() => { load(); }, []);

  async function checkOut() {
    await api.post('/attendance/check-out', {});
    load();
  }

  if (!data) return <div className="loading">Loading...</div>;
  if (data.error) {
    return (
      <div className="mobile-card" style={{ marginTop: 24 }}>
        <p>No employee profile linked to this login. Use staff@refurbicon.com / staff123</p>
      </div>
    );
  }

  const t = data.today;
  return (
    <div>
      <div className="mobile-top">
        <h2 className="brand-font" style={{ margin: 0 }}>Today</h2>
        <p style={{ opacity: 0.85 }}>{data.employee?.firstName} {data.employee?.lastName}</p>
      </div>
      <div className="mobile-card">
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span className={`badge ${statusBadge(t?.status || 'ABSENT')}`} style={{ fontSize: 14, padding: '8px 14px' }}>
            {t?.status?.replaceAll('_', ' ') || 'ABSENT'}
          </span>
        </div>
        <div className="spec-grid">
          <div className="spec-item"><span>Check-in</span><strong>{fmtTime(t?.checkIn)}</strong></div>
          <div className="spec-item"><span>Check-out</span><strong>{fmtTime(t?.checkOut)}</strong></div>
          <div className="spec-item"><span>Shift</span><strong>{data.employee?.shiftStart} - {data.employee?.shiftEnd}</strong></div>
          <div className="spec-item"><span>Hours</span><strong>{t?.workingHours ?? '—'}</strong></div>
        </div>
        {t?.checkIn && !t?.checkOut && (
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={checkOut}>
            Mark Check-Out
          </button>
        )}
      </div>
    </div>
  );
}

function History() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get('/attendance/my').then((r) => setRows(r.data.data.history || [])).catch(() => {});
  }, []);

  return (
    <div>
      <div className="mobile-top">
        <h2 className="brand-font" style={{ margin: 0 }}>Attendance History</h2>
      </div>
      <div style={{ padding: 16 }}>
        {rows.map((r) => (
          <div key={r.id} className="mobile-card" style={{ margin: '0 0 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{fmtDay(r.date)}</strong>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>{fmtTime(r.checkIn)} - {fmtTime(r.checkOut)}</div>
              </div>
              <span className={`badge ${statusBadge(r.status)}`}>{r.status.replaceAll('_', ' ')}</span>
            </div>
          </div>
        ))}
        {!rows.length && <div className="empty">No history yet</div>}
      </div>
    </div>
  );
}

export default function MobileAttendance() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="mobile-shell">
      <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <strong>REFURBICON</strong>
        <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/login'); }}>Logout ({user?.name?.split(' ')[0]})</button>
      </div>
      <Routes>
        <Route index element={<FaceCheckIn />} />
        <Route path="today" element={<TodayStatus />} />
        <Route path="history" element={<History />} />
      </Routes>
      <nav className="mobile-nav">
        <NavLink to="/m" end className={({ isActive }) => (isActive ? 'active' : '')}><div><Camera size={18} style={{ display: 'block', margin: '0 auto 4px' }} />Face</div></NavLink>
        <NavLink to="/m/today" className={({ isActive }) => (isActive ? 'active' : '')}><div><Home size={18} style={{ display: 'block', margin: '0 auto 4px' }} />Today</div></NavLink>
        <NavLink to="/m/history" className={({ isActive }) => (isActive ? 'active' : '')}><div><CalendarDays size={18} style={{ display: 'block', margin: '0 auto 4px' }} />History</div></NavLink>
      </nav>
    </div>
  );
}
