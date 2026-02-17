import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
} from '@livekit/components-react';
import { Track, RoomEvent } from 'livekit-client';
import '@livekit/components-styles';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// ==================== VIDEO TILE ====================
function ParticipantVideo({ track, name, isLocal }) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-black/80 backdrop-blur-xl border border-white/10 aspect-video"
      data-testid={`video-tile-${isLocal ? 'local' : 'remote'}`}
    >
      <VideoTrack trackRef={track} className="w-full h-full object-cover" />
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
        <span className="text-white text-xs font-medium">
          {name}{isLocal ? ' (You)' : ''}
        </span>
      </div>
    </div>
  );
}

// ==================== VIDEO STRIP ====================
function VideoStrip() {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  );
  const { localParticipant } = useLocalParticipant();

  if (!tracks.length) {
    return (
      <div className="flex items-center justify-center h-full text-ink-tertiary text-sm">
        Waiting for participants...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto p-3" data-testid="video-strip">
      {tracks.map((trackRef) => (
        <ParticipantVideo
          key={trackRef.participant.sid}
          track={trackRef}
          name={trackRef.participant.name || trackRef.participant.identity}
          isLocal={trackRef.participant.sid === localParticipant?.sid}
        />
      ))}
    </div>
  );
}

// ==================== CONTROL BAR ====================
function ControlBar({ onEndClass, isRecording, isTeacher }) {
  const { localParticipant } = useLocalParticipant();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const toggleMic = useCallback(async () => {
    if (!localParticipant) return;
    await localParticipant.setMicrophoneEnabled(!micOn);
    setMicOn(!micOn);
  }, [localParticipant, micOn]);

  const toggleCam = useCallback(async () => {
    if (!localParticipant) return;
    await localParticipant.setCameraEnabled(!camOn);
    setCamOn(!camOn);
  }, [localParticipant, camOn]);

  const btnBase = 'p-3 rounded-2xl transition-all duration-200 backdrop-blur-xl border';

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-white/70 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl"
      data-testid="control-bar"
    >
      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-1.5 px-3 py-1 mr-2" data-testid="recording-indicator">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-red-600">REC</span>
        </div>
      )}

      {/* Mic */}
      <button
        onClick={toggleMic}
        className={`${btnBase} ${micOn ? 'bg-white/60 border-white/30 text-ink' : 'bg-red-500/15 border-red-300/30 text-red-600'}`}
        title={micOn ? 'Mute' : 'Unmute'}
        data-testid="toggle-mic"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          {micOn ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l22 22M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6M17 16.95A7 7 0 015 12v-2m14 0v2c0 .76-.12 1.5-.35 2.18M12 19v4M8 23h8" />
          )}
        </svg>
      </button>

      {/* Camera */}
      <button
        onClick={toggleCam}
        className={`${btnBase} ${camOn ? 'bg-white/60 border-white/30 text-ink' : 'bg-red-500/15 border-red-300/30 text-red-600'}`}
        title={camOn ? 'Camera Off' : 'Camera On'}
        data-testid="toggle-cam"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          {camOn ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.2 3H4.8A1.8 1.8 0 003 4.8v10.4A1.8 1.8 0 004.8 17h10.4a1.8 1.8 0 001.8-1.8V4.8A1.8 1.8 0 0015.2 3zM21 7l-4 3v4l4 3V7z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l22 22M21 7l-4 3v1.5M16 16H4.8A1.8 1.8 0 013 14.2V5.5M6 3h9.2A1.8 1.8 0 0117 4.8v.7" />
          )}
        </svg>
      </button>

      <div className="w-px h-6 bg-black/10 mx-1" />

      {/* End Class */}
      <button
        onClick={onEndClass}
        className="px-5 py-2.5 rounded-2xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all shadow-md"
        data-testid="end-class-btn"
      >
        End Class
      </button>
    </div>
  );
}

// ==================== MAIN EXPORTS ====================
export { VideoStrip, ControlBar, ParticipantVideo };
