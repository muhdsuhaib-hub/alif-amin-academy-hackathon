import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  VideoTrack,
  AudioTrack,
  RoomAudioRenderer,
  useTracks,
  useLocalParticipant,
  useConnectionQualityIndicator,
} from '@livekit/components-react';
import { Track, ConnectionQuality } from 'livekit-client';
import '@livekit/components-styles';
import {
  Mic, MicOff, Video, VideoOff, Settings, Hand, BookOpen, Layers,
  MessageSquare, Radio, PhoneOff, ChevronDown, X,
  Wifi, WifiOff, Signal, Highlighter, MoreVertical
} from 'lucide-react';

// ==================== CONNECTION QUALITY BADGE ====================
function ConnectionBadge({ participant }) {
  let quality;
  try {
    const indicator = useConnectionQualityIndicator({ participant });
    quality = indicator?.quality;
  } catch {
    quality = undefined;
  }
  if (quality === undefined || quality === null) return null;

  const config = {
    [ConnectionQuality.Excellent]: { color: 'text-emerald-400', bars: 3 },
    [ConnectionQuality.Good]: { color: 'text-emerald-400', bars: 2 },
    [ConnectionQuality.Poor]: { color: 'text-amber-400', bars: 1 },
    [ConnectionQuality.Lost]: { color: 'text-red-400', bars: 0 },
  };
  const c = config[quality] || config[ConnectionQuality.Good];

  return (
    <div className={`flex items-end gap-px ${c.color}`} title={`Connection: ${quality}`} data-testid="connection-badge">
      {[1, 2, 3].map(i => (
        <div key={i} className={`w-[3px] rounded-sm transition-all ${i <= c.bars ? 'bg-current' : 'bg-white/20'}`} style={{ height: `${4 + i * 3}px` }} />
      ))}
    </div>
  );
}

// ==================== DEBOUNCED PRESENCE HOOK ====================
function useDebouncedDisconnect(participant, delayMs = 3000) {
  const [isDisconnected, setIsDisconnected] = useState(false);
  const timerRef = useRef(null);

  // Always call the hook unconditionally — pass a dummy if no participant
  const { quality } = useConnectionQualityIndicator({ participant: participant || {} });

  useEffect(() => {
    if (!participant) { setIsDisconnected(false); return; }
    if (quality === ConnectionQuality.Lost) {
      timerRef.current = setTimeout(() => setIsDisconnected(true), delayMs);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      setIsDisconnected(false);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [quality, delayMs, participant]);

  return participant ? isDisconnected : false;
}

// ==================== VIDEO TILE ====================
function ParticipantVideo({ track, name, isLocal, hasRaisedHand, isObserver }) {
  const peerDisconnected = useDebouncedDisconnect(track?.participant);

  if (isObserver) return null;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-slate-800 border-2 transition-all duration-300 ${
        hasRaisedHand ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.25)]' : 'border-white/5'
      }`}
      style={{ aspectRatio: '4/3' }}
      data-testid={`video-tile-${isLocal ? 'local' : 'remote'}`}
    >
      {track?.publication?.track ? (
        <VideoTrack trackRef={track} className={`w-full h-full object-center transition-all duration-500 ${!isLocal && peerDisconnected ? 'blur-sm scale-105' : ''}`} />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700/60 flex items-center justify-center text-white text-lg font-bold">
            {name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        </div>
      )}

      {/* Reconnecting overlay — only for remote peers, after 3s debounce */}
      {!isLocal && peerDisconnected && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm text-white rounded-2xl" data-testid="reconnecting-overlay">
          <svg className="w-8 h-8 mb-3 animate-spin text-white/60" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm font-medium text-white/80">Connection Lost</p>
          <p className="text-[11px] text-white/40 mt-0.5">Waiting to reconnect...</p>
        </div>
      )}

      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 flex items-center justify-between">
        <span className="text-white text-[11px] font-medium truncate max-w-[70%]">
          {name}{isLocal ? ' (You)' : ''}
        </span>
        <div className="flex items-center gap-1.5">
          {hasRaisedHand && <Hand className="w-3.5 h-3.5 text-amber-400 animate-bounce" />}
          <ConnectionBadge participant={track?.participant} />
        </div>
      </div>
    </div>
  );
}

// ==================== VIDEO STRIP (Sidebar) ====================
function VideoStrip({ raisedHands = {}, observerIds = [] }) {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  );
  const { localParticipant } = useLocalParticipant();

  // Filter out observers: match by observerIds OR identity starting with admin_
  const visibleTracks = tracks.filter(t => {
    const id = t.participant.identity;
    if (observerIds.includes(id)) return false;
    if (id.startsWith('admin_')) return false;
    return true;
  });

  if (!visibleTracks.length) {
    return (
      <div className="flex items-center justify-center h-full text-white/30 text-sm p-4">
        Waiting for participants...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 h-full overflow-y-auto p-2" data-testid="video-strip">
      {visibleTracks.map((trackRef) => {
        const identity = trackRef.participant.identity;
        return (
          <ParticipantVideo
            key={trackRef.participant.sid}
            track={trackRef}
            name={trackRef.participant.name || identity}
            isLocal={trackRef.participant.sid === localParticipant?.sid}
            hasRaisedHand={!!raisedHands[identity]}
          />
        );
      })}
    </div>
  );
}

// ==================== MOBILE VIDEO ROW ====================
function MobileVideoRow({ raisedHands = {}, observerIds = [] }) {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  );
  const { localParticipant } = useLocalParticipant();
  // Filter out observers: match by observerIds OR identity starting with admin_
  const visibleTracks = tracks.filter(t => {
    const id = t.participant.identity;
    if (observerIds.includes(id)) return false;
    if (id.startsWith('admin_')) return false;
    return true;
  });

  return (
    <div className="flex gap-2 p-2 overflow-x-auto flex-shrink-0" data-testid="mobile-video-row">
      {visibleTracks.map((trackRef) => (
        <div key={trackRef.participant.sid} className="flex-shrink-0 w-36 h-28 rounded-xl overflow-hidden bg-slate-800 border border-white/5 relative">
          {trackRef?.publication?.track ? (
            <VideoTrack trackRef={trackRef} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/30 text-xs font-bold">
              {(trackRef.participant.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1.5 py-0.5">
            <span className="text-[9px] text-white/80 truncate block">
              {trackRef.participant.name || trackRef.participant.identity}
              {trackRef.participant.sid === localParticipant?.sid ? ' (You)' : ''}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== A/V SETTINGS MODAL ====================
function AVSettingsModal({ onClose }) {
  const [devices, setDevices] = useState({ cameras: [], mics: [], speakers: [] });
  const [selectedCam, setSelectedCam] = useState('');
  const [selectedMic, setSelectedMic] = useState('');

  React.useEffect(() => {
    (async () => {
      const devs = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        cameras: devs.filter(d => d.kind === 'videoinput'),
        mics: devs.filter(d => d.kind === 'audioinput'),
        speakers: devs.filter(d => d.kind === 'audiooutput'),
      });
    })();
  }, []);

  const selectCls = 'h-10 w-full rounded-xl bg-slate-100 border-none px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none';

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()} data-testid="av-settings-modal">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Audio & Video Settings</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Camera</label>
            <div className="relative">
              <select value={selectedCam} onChange={e => setSelectedCam(e.target.value)} className={selectCls} data-testid="settings-camera-select">
                {devices.cameras.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Camera'}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Microphone</label>
            <div className="relative">
              <select value={selectedMic} onChange={e => setSelectedMic(e.target.value)} className={selectCls} data-testid="settings-mic-select">
                {devices.mics.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Microphone'}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          {devices.speakers.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Speaker</label>
              <div className="relative">
                <select className={selectCls} data-testid="settings-speaker-select">
                  {devices.speakers.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Speaker'}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== CENTRALIZED CONTROL DOCK ====================
function ControlDock({
  onEndClass, isRecording, isTeacher, isHandRaised, onRaiseHand, onLowerHand,
  showChat, onToggleChat, showNavigator, onToggleNavigator, onToggleSettings,
  onStartRecording, isObserver, highlighterActive, onToggleHighlighter,
  showActivities, onToggleActivities, isTimeExpired,
}) {
  const { localParticipant } = useLocalParticipant();
  const [micOn, setMicOn] = useState(!isObserver);
  const [camOn, setCamOn] = useState(!isObserver);
  const [showMoreMenu, setShowMoreMenu] = useState(false); // New state for mobile menu

  const toggleMic = useCallback(async () => {
    if (!localParticipant || isObserver) return;
    await localParticipant.setMicrophoneEnabled(!micOn);
    setMicOn(!micOn);
  }, [localParticipant, micOn, isObserver]);

  const toggleCam = useCallback(async () => {
    if (!localParticipant || isObserver) return;
    await localParticipant.setCameraEnabled(!camOn);
    setCamOn(!camOn);
  }, [localParticipant, camOn, isObserver]);

  // Added extraClass parameter to hide buttons on mobile
  const btn = (active, danger, extraClass = '') =>
    `p-3 rounded-2xl transition-all duration-200 border flex items-center justify-center ${
      danger ? 'bg-red-500/15 border-red-400/20 text-red-500' :
      active ? 'bg-emerald-600/15 border-emerald-400/20 text-emerald-600' :
      'bg-white/60 border-white/30 text-slate-600 hover:bg-white/80'
    } ${extraClass}`;

  return (
    <div
      className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/40 shadow-2xl w-[95vw] sm:w-auto overflow-visible"
      data-testid="control-dock"
    >
      {isRecording && (
        <div className="flex items-center gap-1.5 px-2 py-1 mr-1" data-testid="recording-indicator">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-semibold text-red-600 hidden sm:inline">REC</span>
        </div>
      )}

      {/* === PRIMARY CONTROLS (Always Visible) === */}
      <button onClick={toggleMic} className={btn(false, !micOn)} title={micOn ? 'Mute' : 'Unmute'} disabled={isObserver}>
        {micOn ? <Mic className="w-4 h-4 md:w-5 md:h-5" /> : <MicOff className="w-4 h-4 md:w-5 md:h-5" />}
      </button>

      <button onClick={toggleCam} className={btn(false, !camOn)} title={camOn ? 'Camera Off' : 'Camera On'} disabled={isObserver}>
        {camOn ? <Video className="w-4 h-4 md:w-5 md:h-5" /> : <VideoOff className="w-4 h-4 md:w-5 md:h-5" />}
      </button>

      <button onClick={onToggleChat} className={btn(showChat, false)} title="Chat">
        <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      {!isTeacher && !isObserver && (
        <button onClick={isHandRaised ? onLowerHand : onRaiseHand} className={btn(isHandRaised, false)} title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}>
          <Hand className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      )}

      <div className="w-px h-6 bg-slate-200 mx-0.5" />

      {/* === SECONDARY CONTROLS (Desktop Only - Hidden on Mobile) === */}
      {isTeacher && (
        <>
          <button onClick={onToggleNavigator} className={btn(showNavigator, false, 'hidden md:flex')} title="Quran Navigator">
            <BookOpen className="w-5 h-5" />
          </button>
          <button onClick={onToggleActivities} className={btn(showActivities, false, 'hidden md:flex')} title="Activities">
            <Layers className="w-5 h-5" />
          </button>
          <button onClick={onToggleHighlighter} className={btn(highlighterActive, false, 'hidden md:flex')} title="Highlighter">
            <Highlighter className="w-5 h-5" />
          </button>
          <button onClick={onStartRecording} className={btn(isRecording, false, 'hidden md:flex')} title="Record">
            <Radio className="w-5 h-5" />
          </button>
        </>
      )}
      <button onClick={onToggleSettings} className={btn(false, false, 'hidden md:flex')} title="Settings">
        <Settings className="w-5 h-5" />
      </button>

      {/* === THE "MORE" MENU (Mobile Only) === */}
      <div className="relative md:hidden">
        <button onClick={() => setShowMoreMenu(!showMoreMenu)} className={btn(showMoreMenu, false)} title="More Options">
          <MoreVertical className="w-4 h-4" />
        </button>

        {showMoreMenu && (
          <div className="absolute bottom-full mb-3 right-[-40px] w-48 bg-white/95 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl overflow-hidden py-1 flex flex-col z-50">
            {isTeacher && (
              <>
                <button onClick={() => { onToggleNavigator(); setShowMoreMenu(false); }} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-100 transition-colors">
                  <BookOpen className="w-4 h-4" /> Navigator
                </button>
                <button onClick={() => { onToggleActivities(); setShowMoreMenu(false); }} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-100 transition-colors">
                  <Layers className="w-4 h-4" /> Activities
                </button>
                <button onClick={() => { onToggleHighlighter(); setShowMoreMenu(false); }} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-100 transition-colors">
                  <Highlighter className="w-4 h-4" /> Highlighter
                </button>
                <button onClick={() => { onStartRecording(); setShowMoreMenu(false); }} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-100 transition-colors">
                  <Radio className="w-4 h-4" /> Record
                </button>
                <div className="h-px bg-slate-200 my-1 mx-3" />
              </>
            )}
            <button onClick={() => { onToggleSettings(); setShowMoreMenu(false); }} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-100 transition-colors">
              <Settings className="w-4 h-4" /> Settings
            </button>
          </div>
        )}
      </div>

      <div className="w-px h-6 bg-slate-200 mx-0.5" />

      {/* === END CLASS (Always Visible) === */}
      <button
        onClick={onEndClass}
        disabled={isTeacher && !isTimeExpired}
        title={isTeacher && !isTimeExpired ? 'Available once class time expires' : 'End Class'}
        className={`px-4 md:px-5 py-2.5 rounded-2xl text-xs md:text-sm font-semibold transition-all shadow-md ${
          isTeacher && !isTimeExpired
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
            : 'bg-red-500 text-white hover:bg-red-600'
        }`}
        data-testid="end-class-btn"
      >
        <span className="hidden sm:inline">End Class</span>
        <PhoneOff className="w-4 h-4 sm:hidden" />
      </button>
    </div>
  );
}

export { VideoStrip, MobileVideoRow, ControlDock, AVSettingsModal, ParticipantVideo, RoomAudioRenderer };
