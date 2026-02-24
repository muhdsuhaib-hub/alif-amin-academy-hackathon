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
  Wifi, WifiOff, Signal, Highlighter,
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

// ==================== VIDEO TILE ====================
function ParticipantVideo({ track, name, isLocal, hasRaisedHand, isObserver }) {
  if (isObserver) return null;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-slate-800 border-2 transition-all duration-300 ${
        hasRaisedHand ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.25)]' : 'border-white/5'
      }`}
      style={{ aspectRatio: '16/9' }}
      data-testid={`video-tile-${isLocal ? 'local' : 'remote'}`}
    >
      {track?.publication?.track ? (
        <VideoTrack trackRef={track} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700/60 flex items-center justify-center text-white text-lg font-bold">
            {name?.charAt(0)?.toUpperCase() || '?'}
          </div>
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
        <div key={trackRef.participant.sid} className="flex-shrink-0 w-28 h-20 rounded-xl overflow-hidden bg-slate-800 border border-white/5 relative">
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
  showActivities, onToggleActivities,
}) {
  const { localParticipant } = useLocalParticipant();
  const [micOn, setMicOn] = useState(!isObserver);
  const [camOn, setCamOn] = useState(!isObserver);

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

  const btn = (active, danger) =>
    `p-3 rounded-2xl transition-all duration-200 border ${
      danger ? 'bg-red-500/15 border-red-400/20 text-red-500' :
      active ? 'bg-emerald-600/15 border-emerald-400/20 text-emerald-600' :
      'bg-white/60 border-white/30 text-slate-600 hover:bg-white/80'
    }`;

  return (
    <div
      className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/40 shadow-2xl"
      data-testid="control-dock"
    >
      {isRecording && (
        <div className="flex items-center gap-1.5 px-2 py-1 mr-1" data-testid="recording-indicator">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-semibold text-red-600 hidden sm:inline">REC</span>
        </div>
      )}

      {/* Mic */}
      <button onClick={toggleMic} className={btn(false, !micOn)} title={micOn ? 'Mute' : 'Unmute'} data-testid="dock-mic" disabled={isObserver}>
        {micOn ? <Mic className="w-4 h-4 md:w-5 md:h-5" /> : <MicOff className="w-4 h-4 md:w-5 md:h-5" />}
      </button>

      {/* Camera */}
      <button onClick={toggleCam} className={btn(false, !camOn)} title={camOn ? 'Camera Off' : 'Camera On'} data-testid="dock-cam" disabled={isObserver}>
        {camOn ? <Video className="w-4 h-4 md:w-5 md:h-5" /> : <VideoOff className="w-4 h-4 md:w-5 md:h-5" />}
      </button>

      {/* Settings */}
      <button onClick={onToggleSettings} className={btn(false, false)} title="Settings" data-testid="dock-settings">
        <Settings className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      <div className="w-px h-6 bg-slate-200 mx-0.5" />

      {/* Raise Hand (non-teacher) */}
      {!isTeacher && !isObserver && (
        <button
          onClick={isHandRaised ? onLowerHand : onRaiseHand}
          className={btn(isHandRaised, false)}
          title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
          data-testid="dock-hand"
        >
          <Hand className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      )}

      {/* Quran Navigator (teacher) */}
      {isTeacher && (
        <button onClick={onToggleNavigator} className={btn(showNavigator, false)} title="Quran Navigator" data-testid="dock-quran">
          <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      )}
      {/* Activities (teacher) */}
      {isTeacher && (
        <button onClick={onToggleActivities} className={btn(showActivities, false)} title="Activities" data-testid="dock-activities">
          <Layers className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      )}

      {/* Tajweed Highlighter (teacher) */}
      {isTeacher && (
        <button onClick={onToggleHighlighter} className={btn(highlighterActive, false)} title={highlighterActive ? 'Disable Highlighter' : 'Enable Highlighter'} data-testid="dock-highlighter">
          <Highlighter className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      )}

      {/* Chat */}
      <button onClick={onToggleChat} className={btn(showChat, false)} title="Chat" data-testid="dock-chat">
        <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      {/* Record (teacher only) */}
      {isTeacher && (
        <button onClick={onStartRecording} className={btn(isRecording, false)} title="Record" data-testid="dock-record">
          <Radio className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      )}

      <div className="w-px h-6 bg-slate-200 mx-0.5" />

      {/* End Class */}
      <button
        onClick={onEndClass}
        className="px-4 md:px-5 py-2.5 rounded-2xl bg-red-500 text-white text-xs md:text-sm font-semibold hover:bg-red-600 transition-all shadow-md"
        data-testid="dock-end-class"
      >
        <span className="hidden sm:inline">End Class</span>
        <PhoneOff className="w-4 h-4 sm:hidden" />
      </button>
    </div>
  );
}

export { VideoStrip, MobileVideoRow, ControlDock, AVSettingsModal, ParticipantVideo, RoomAudioRenderer };
