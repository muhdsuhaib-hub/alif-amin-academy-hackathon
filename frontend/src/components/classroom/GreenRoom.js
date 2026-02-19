import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, Settings, ChevronDown, Monitor } from 'lucide-react';

function MicLevelMeter({ stream }) {
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!stream) return;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.7;
    source.connect(analyser);
    analyserRef.current = analyser;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas || !analyserRef.current) return;
      const ctx = canvas.getContext('2d');
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      const avg = data.slice(0, 32).reduce((a, b) => a + b, 0) / 32;
      const level = Math.min(1, avg / 128);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 5;
      const barW = 6;
      const gap = 3;
      const totalW = bars * barW + (bars - 1) * gap;
      const startX = (canvas.width - totalW) / 2;
      for (let i = 0; i < bars; i++) {
        const threshold = (i + 1) / bars;
        const active = level >= threshold * 0.6;
        const h = 8 + i * 5;
        const x = startX + i * (barW + gap);
        const y = canvas.height - h;
        ctx.fillStyle = active ? '#10b981' : '#e2e8f0';
        ctx.beginPath();
        ctx.roundRect(x, y, barW, h, 3);
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      audioCtx.close();
    };
  }, [stream]);

  return <canvas ref={canvasRef} width={60} height={40} className="mx-auto" />;
}

export default function GreenRoom({ user, session, onJoin, isAdmin }) {
  const [devices, setDevices] = useState({ cameras: [], mics: [] });
  const [selectedCam, setSelectedCam] = useState('');
  const [selectedMic, setSelectedMic] = useState('');
  const [camOn, setCamOn] = useState(!isAdmin);
  const [micOn, setMicOn] = useState(!isAdmin);
  const [stream, setStream] = useState(null);
  const [joining, setJoining] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const videoRef = useRef(null);

  // Admin observer choice
  const [adminMode, setAdminMode] = useState(null); // null | 'observer' | 'participant'

  const getStream = useCallback(async (camId, micId, camEnabled, micEnabled) => {
    try {
      const constraints = {};
      if (camEnabled) constraints.video = camId ? { deviceId: { exact: camId } } : true;
      if (micEnabled) constraints.audio = micId ? { deviceId: { exact: micId } } : true;
      if (!constraints.video && !constraints.audio) return null;
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      return s;
    } catch (e) {
      console.warn('getUserMedia failed:', e);
      return null;
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        // Request permissions first
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        tempStream.getTracks().forEach(t => t.stop());

        const devs = await navigator.mediaDevices.enumerateDevices();
        const cameras = devs.filter(d => d.kind === 'videoinput');
        const mics = devs.filter(d => d.kind === 'audioinput');
        setDevices({ cameras, mics });
        if (cameras.length) setSelectedCam(cameras[0].deviceId);
        if (mics.length) setSelectedMic(mics[0].deviceId);
      } catch (e) {
        console.warn('Device enumeration failed:', e);
      }
    }
    if (!isAdmin || adminMode === 'participant') init();
  }, [isAdmin, adminMode]);

  // Start preview stream
  useEffect(() => {
    if (isAdmin && adminMode !== 'participant') return;
    let active = true;
    (async () => {
      stream?.getTracks().forEach(t => t.stop());
      const s = await getStream(selectedCam, selectedMic, camOn, micOn);
      if (active && s) {
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      }
    })();
    return () => { active = false; };
  }, [selectedCam, selectedMic, camOn, micOn, isAdmin, adminMode]);

  // Cleanup
  useEffect(() => () => stream?.getTracks().forEach(t => t.stop()), []);

  const handleJoin = async () => {
    setJoining(true);
    stream?.getTracks().forEach(t => t.stop());
    const mode = isAdmin ? (adminMode || 'observer') : 'participant';
    onJoin({
      cameraEnabled: mode === 'observer' ? false : camOn,
      micEnabled: mode === 'observer' ? false : micOn,
      cameraDeviceId: selectedCam,
      micDeviceId: selectedMic,
      mode,
    });
  };

  const selectCls = 'h-10 w-full rounded-xl bg-white/60 border border-white/30 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none';

  // Admin: Show observer/participant choice first
  if (isAdmin && !adminMode) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900" data-testid="admin-mode-select">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 max-w-sm w-full mx-4 text-center">
          <Monitor className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
          <h2 className="text-xl font-bold text-white mb-2">Join as Admin</h2>
          <p className="text-sm text-white/50 mb-6">
            {session?.teacher_name} & {session?.student_name}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setAdminMode('observer')}
              className="w-full h-12 rounded-2xl bg-slate-800/80 border border-white/10 text-white font-semibold text-sm hover:bg-slate-700/80 transition-all"
              data-testid="join-observer-btn"
            >
              Join as Observer
              <span className="block text-[10px] text-white/40 font-normal mt-0.5">Camera & mic disabled. Invisible to participants.</span>
            </button>
            <button
              onClick={() => setAdminMode('participant')}
              className="w-full h-12 rounded-2xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-600 transition-all"
              data-testid="join-participant-btn"
            >
              Join as Participant
              <span className="block text-[10px] text-white/80 font-normal mt-0.5">Full camera & mic access.</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isObserver = isAdmin && adminMode === 'observer';

  return (
    <div className="h-screen flex items-center justify-center bg-slate-900" data-testid="green-room">
      <div className="max-w-lg w-full mx-4">
        {/* Session info */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">Ready to join?</h1>
          <p className="text-sm text-white/50 mt-1">
            {session?.teacher_name} & {session?.student_name}
          </p>
        </div>

        {/* Camera Preview */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-800 aspect-video mb-4 border border-white/5" data-testid="camera-preview">
          {camOn && !isObserver ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/30">
              <VideoOff className="w-12 h-12 mb-2" />
              <p className="text-sm">{isObserver ? 'Observer mode — camera off' : 'Camera is off'}</p>
            </div>
          )}
          {/* Mic level meter */}
          {!isObserver && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-xl px-3 py-1.5">
              {micOn && stream ? (
                <MicLevelMeter stream={stream} />
              ) : (
                <div className="flex items-center gap-1.5 text-white/40 text-xs">
                  <MicOff className="w-3.5 h-3.5" />Muted
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls Row */}
        {!isObserver && (
          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              onClick={() => setCamOn(!camOn)}
              className={`p-3.5 rounded-2xl transition-all ${camOn ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-red-500/20 text-red-400'}`}
              data-testid="greenroom-cam-toggle"
            >
              {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMicOn(!micOn)}
              className={`p-3.5 rounded-2xl transition-all ${micOn ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-red-500/20 text-red-400'}`}
              data-testid="greenroom-mic-toggle"
            >
              {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-3.5 rounded-2xl bg-white/10 text-white hover:bg-white/15 transition-all"
              data-testid="greenroom-settings-btn"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Device Settings (expandable) */}
        {showSettings && !isObserver && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 mb-4 space-y-3" data-testid="device-settings">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Camera</label>
              <div className="relative">
                <select value={selectedCam} onChange={e => setSelectedCam(e.target.value)} className={selectCls} data-testid="camera-select">
                  {devices.cameras.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Camera'}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Microphone</label>
              <div className="relative">
                <select value={selectedMic} onChange={e => setSelectedMic(e.target.value)} className={selectCls} data-testid="mic-select">
                  {devices.mics.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Microphone'}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Join Button */}
        <button
          onClick={handleJoin}
          disabled={joining}
          className="w-full h-14 rounded-2xl bg-emerald-600 text-white font-bold text-base hover:bg-emerald-500 transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-emerald-600/20"
          data-testid="join-now-btn"
        >
          {joining ? 'Joining...' : isObserver ? 'Join as Observer' : 'Join Now'}
        </button>
      </div>
    </div>
  );
}
