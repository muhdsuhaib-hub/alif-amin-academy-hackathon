import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import { toast } from 'sonner';
import DigitalMushaf from '../components/classroom/DigitalMushaf';
import QuranNavigator from '../components/classroom/QuranNavigator';
import GreenRoom from '../components/classroom/GreenRoom';
import { VideoStrip, MobileVideoRow, ControlDock, AVSettingsModal } from '../components/classroom/LiveKitRoom';
import { SessionReportModal, RateTeacherModal } from '../components/classroom/EndClassModals';
import Spinner from '../components/Spinner';
import { Hand, X, Send } from 'lucide-react';

const BACKEND = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND}/api`;
const WS_BASE = BACKEND.replace(/^http/, 'ws');

// ==================== WEBSOCKET HOOK ====================
function useClassroomWS(roomId, onMessage) {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;
    function connect() {
      const ws = new WebSocket(`${WS_BASE}/api/classroom/ws/${roomId}`);
      wsRef.current = ws;
      ws.onmessage = (e) => { try { onMessage(JSON.parse(e.data)); } catch {} };
      ws.onclose = () => { reconnectRef.current = setTimeout(connect, 2000); };
      ws.onerror = () => ws.close();
    }
    connect();
    return () => { clearTimeout(reconnectRef.current); wsRef.current?.close(); };
  }, [roomId]);

  const send = useCallback((msg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(msg));
  }, []);
  return send;
}

function useThrottledSend(send, delay = 50) {
  const lastRef = useRef(0);
  return useCallback((msg) => {
    const now = Date.now();
    if (now - lastRef.current >= delay) { lastRef.current = now; send(msg); }
  }, [send, delay]);
}

// ==================== CHAT DRAWER ====================
function ChatDrawer({ send, messages, onClose, isObserver }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = () => {
    if (!text.trim() || isObserver) return;
    send({ type: 'CHAT', text: text.trim(), timestamp: Date.now() });
    setText('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/80 backdrop-blur-xl" data-testid="chat-drawer">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white">Chat</h3>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg"><X className="w-4 h-4 text-white/40" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={`text-xs px-3 py-2 rounded-xl max-w-[85%] ${m.self ? 'ml-auto bg-emerald-600/20 text-emerald-300' : 'bg-white/5 text-white/80'}`}>
            {!m.self && <p className="font-semibold mb-0.5 text-white/50">{m.sender}</p>}
            <p>{m.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {isObserver ? (
        <div className="px-4 py-3 border-t border-white/5 text-center">
          <span className="text-[11px] text-white/30">Chat disabled in Observer mode</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 border-t border-white/5">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..." className="flex-1 h-9 px-3 rounded-xl bg-white/5 text-sm text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-white/20" data-testid="chat-input" />
          <button onClick={handleSend} className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-all" data-testid="chat-send">
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ==================== RAISE HAND TOAST ====================
function RaiseHandToast({ studentName, onLower }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-xl rounded-2xl border border-amber-300/30 shadow-xl" data-testid="raise-hand-toast">
      <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
        <Hand className="w-4 h-4 text-amber-600" />
      </div>
      <p className="text-sm font-medium text-slate-900 flex-1">{studentName} raised their hand</p>
      <button onClick={onLower} className="text-xs font-medium text-slate-500 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100 transition-all" data-testid="lower-hand-action">Lower</button>
    </div>
  );
}

// ==================== CLASSROOM PAGE ====================
export default function ClassroomPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [lkToken, setLkToken] = useState(null);
  const [lkUrl, setLkUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [joinConfig, setJoinConfig] = useState(null);

  // Real-time state
  const [currentChapter, setCurrentChapter] = useState(1);
  const [wordHighlights, setWordHighlights] = useState({});
  const [highlighterActive, setHighlighterActive] = useState(false);
  const [pointerPos, setPointerPos] = useState(null);
  const [recording, setRecording] = useState({ active: false, visible: false });
  const [chatMessages, setChatMessages] = useState([]);
  const [raisedHands, setRaisedHands] = useState({});
  const [myHandRaised, setMyHandRaised] = useState(false);
  const [observerIds, setObserverIds] = useState([]);

  // UI state
  const [showNavigator, setShowNavigator] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';
  const isObserver = joinConfig?.mode === 'observer';

  // WS message handler
  const handleWSMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'ROOM_STATE':
        if (msg.chapter) setCurrentChapter(msg.chapter);
        if (msg.wordHighlights) setWordHighlights(msg.wordHighlights);
        setRecording(msg.recording || { active: false, visible: false });
        break;
      case 'NAVIGATE':
        if (msg.chapter) setCurrentChapter(msg.chapter);
        break;
      case 'HIGHLIGHT_WORD': {
        const key = `${msg.verseKey}:${msg.wordPos}`;
        setWordHighlights(prev => {
          const next = { ...prev };
          if (msg.action === 'add') next[key] = true;
          else delete next[key];
          return next;
        });
        break;
      }
      case 'CLEAR_HIGHLIGHTS':
        setWordHighlights({});
        break;
      case 'POINTER_MOVE': setPointerPos({ x: msg.x, y: msg.y }); break;
      case 'RECORDING_STARTED': setRecording({ active: true, visible: msg.visible }); break;
      case 'RECORDING_STOPPED': setRecording({ active: false, visible: false }); break;
      case 'CHAT': setChatMessages(p => [...p, { text: msg.text, sender: msg.sender || 'Participant', self: false }]); break;
      case 'RAISE_HAND':
        setRaisedHands(p => ({ ...p, [msg.identity]: msg.name || 'Student' }));
        toast.custom(() => <RaiseHandToast studentName={msg.name || 'Student'} onLower={() => handleLowerHand(msg.identity)} />, { duration: 8000 });
        break;
      case 'LOWER_HAND':
        setRaisedHands(p => { const n = { ...p }; delete n[msg.identity]; return n; });
        if (msg.identity === user?.user_id) setMyHandRaised(false);
        break;
      case 'END_CLASS': setShowRatingModal(true); break;
      default: break;
    }
  }, [user]);

  const send = useClassroomWS(session?.meet_link_slug, handleWSMessage);
  const throttledSend = useThrottledSend(send, 50);

  // Init — fetch session + user data (but don't connect to LiveKit yet)
  useEffect(() => {
    async function init() {
      try {
        const meRes = await fetch(`${API}/auth/me`, { credentials: 'include' });
        if (!meRes.ok) { navigate('/auth'); return; }
        const meData = await meRes.json();
        setUser(meData.user || meData);

        const sRes = await fetch(`${API}/classroom/session/${sessionId}`, { credentials: 'include' });
        if (!sRes.ok) { toast.error('Session not found'); navigate(-1); return; }
        setSession(await sRes.json());
      } catch { toast.error('Failed to connect'); }
      finally { setLoading(false); }
    }
    init();
  }, [sessionId, navigate]);

  // Join from Green Room — request LiveKit token
  const handleJoinFromLobby = useCallback(async (config) => {
    setJoinConfig(config);
    try {
      let tData;
      if (config.mode === 'observer') {
        // Admin stealth join — restricted token, invisible identity
        const tRes = await fetch(`${API}/classroom/admin/stealth-join`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ room_name: session.meet_link_slug }),
        });
        if (tRes.ok) {
          tData = await tRes.json();
          setObserverIds(prev => [...prev, tData.identity]);
        } else {
          toast.error('Failed to join as observer');
          return;
        }
      } else {
        // Normal join
        const tRes = await fetch(`${API}/classroom/livekit/token`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ room_name: session.meet_link_slug }),
        });
        if (tRes.ok) {
          tData = await tRes.json();
        }
      }
      if (tData) {
        setLkToken(tData.token);
        setLkUrl(tData.server_url);
        setJoined(true);
      }
      // Teacher: go live
      if (user?.role === 'teacher') {
        await fetch(`${API}/classroom/session/${sessionId}/go-live`, { method: 'POST', credentials: 'include' });
      }
    } catch { toast.error('Failed to join room'); }
  }, [session, sessionId, user]);

  // Handlers
  const handleChapterChange = useCallback((chapter) => {
    setCurrentChapter(chapter);
    setWordHighlights({});
    if (isTeacher) send({ type: 'NAVIGATE', chapter });
  }, [isTeacher, send]);

  const handleHighlightWord = useCallback((verseKey, wordPos) => {
    const key = `${verseKey}:${wordPos}`;
    const isCurrentlyHighlighted = !!wordHighlights[key];
    const action = isCurrentlyHighlighted ? 'remove' : 'add';
    setWordHighlights(prev => {
      const next = { ...prev };
      if (action === 'add') next[key] = true;
      else delete next[key];
      return next;
    });
    send({ type: 'HIGHLIGHT_WORD', verseKey, wordPos, action });
  }, [wordHighlights, send]);

  const handleClearHighlights = useCallback(() => {
    setWordHighlights({});
    send({ type: 'CLEAR_HIGHLIGHTS' });
  }, [send]);

  const handlePointerMove = useCallback((pos) => {
    throttledSend({ type: 'POINTER_MOVE', x: pos.x, y: pos.y });
  }, [throttledSend]);

  const handleNavigate = useCallback((nav) => {
    if (nav.type === 'surah' && nav.chapter) {
      handleChapterChange(nav.chapter);
    }
    setShowNavigator(false);
  }, [handleChapterChange]);

  const handleChatSend = useCallback((msg) => {
    send({ ...msg, sender: user?.name || 'Me' });
    setChatMessages(p => [...p, { text: msg.text, sender: 'You', self: true }]);
  }, [send, user]);

  const handleRaiseHand = useCallback(() => {
    send({ type: 'RAISE_HAND', identity: user?.user_id, name: user?.name || 'Student' });
    setMyHandRaised(true);
    setRaisedHands(p => ({ ...p, [user?.user_id]: user?.name }));
  }, [send, user]);

  const handleLowerHand = useCallback((identity) => {
    const targetId = identity || user?.user_id;
    send({ type: 'LOWER_HAND', identity: targetId });
    setRaisedHands(p => { const n = { ...p }; delete n[targetId]; return n; });
    if (targetId === user?.user_id) setMyHandRaised(false);
  }, [send, user]);

  const handleStartRecording = useCallback(() => {
    toast.success('Recording initialized', { description: 'Cloud recording will be connected in a future update.' });
    setRecording({ active: true, visible: true });
    send({ type: 'RECORDING_STARTED', visible: true });
  }, [send]);

  // End Class — Admin routes to /admin/dashboard, NOT logout
  const handleEndClass = useCallback(() => {
    if (isAdmin) {
      navigate('/admin/dashboard');
    } else if (isTeacher) {
      setShowReportModal(true);
    } else {
      setShowRatingModal(true);
    }
  }, [isTeacher, isAdmin, navigate]);

  const handleReportSubmitted = useCallback(() => {
    setShowReportModal(false);
    send({ type: 'END_CLASS', teacherName: user?.name });
    toast.success('Class ended successfully');
    setTimeout(() => navigate('/teacher/dashboard'), 1500);
  }, [send, navigate, user]);

  const handleRatingSubmitted = useCallback(() => {
    setShowRatingModal(false);
    navigate('/student/dashboard');
  }, [navigate]);

  // Clear pointer after inactivity
  useEffect(() => {
    if (!pointerPos) return;
    const t = setTimeout(() => setPointerPos(null), 3000);
    return () => clearTimeout(t);
  }, [pointerPos]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900"><Spinner message="Loading classroom..." /></div>;

  // ==================== GREEN ROOM (PRE-JOIN) ====================
  if (!joined) {
    return <GreenRoom user={user} session={session} onJoin={handleJoinFromLobby} isAdmin={isAdmin} />;
  }

  // ==================== MAIN CLASSROOM LAYOUT ====================
  const roomContent = (
    <div className="h-screen flex flex-col bg-slate-900 overflow-hidden" data-testid="classroom-page">
      {/* CRITICAL: RoomAudioRenderer plays ALL remote audio tracks */}
      <RoomAudioRenderer />

      {/* Observer banner */}
      {isObserver && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-center flex-shrink-0" data-testid="observer-banner">
          <span className="text-[11px] font-medium text-amber-400">Observer Mode — You are invisible to participants</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Quran Navigator (Desktop slide-out) */}
        {showNavigator && isTeacher && (
          <div className="hidden md:block w-72 border-r border-white/5 bg-slate-900/90 backdrop-blur-xl flex-shrink-0 overflow-hidden">
            <QuranNavigator onNavigate={handleNavigate} onClose={() => setShowNavigator(false)} onClearHighlights={handleClearHighlights} />
          </div>
        )}

        {/* Center: Mushaf Stage (maximized) */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Mobile: Video row pinned top */}
          <div className="md:hidden flex-shrink-0 border-b border-white/5 bg-slate-800/50">
            <MobileVideoRow raisedHands={raisedHands} observerIds={observerIds} />
          </div>
          {/* Mushaf fills remaining viewport */}
          <div className="flex-1 overflow-hidden">
            <DigitalMushaf
              currentChapter={currentChapter}
              onChapterChange={handleChapterChange}
              isTeacher={isTeacher}
              highlighterActive={highlighterActive}
              wordHighlights={wordHighlights}
              onHighlightWord={handleHighlightWord}
              pointerPosition={!isTeacher ? pointerPos : null}
              onPointerMove={isTeacher ? handlePointerMove : undefined}
            />
          </div>
        </div>

        {/* Right Sidebar: Video Tiles + Chat Drawer (Desktop only, max 20% width) */}
        <div className="hidden md:flex flex-col flex-shrink-0 border-l border-white/5 bg-slate-900/80 transition-all duration-300"
          style={{ width: showChat ? '360px' : '240px' }}
        >
          {showChat ? (
            <div className="flex flex-1 overflow-hidden">
              {/* Video tiles (compressed) */}
              <div className="w-[120px] flex-shrink-0 border-r border-white/5 overflow-hidden">
                <VideoStrip raisedHands={raisedHands} observerIds={observerIds} />
              </div>
              {/* Chat drawer */}
              <div className="flex-1 overflow-hidden">
                <ChatDrawer send={handleChatSend} messages={chatMessages} onClose={() => setShowChat(false)} isObserver={isObserver} />
              </div>
            </div>
          ) : (
            <VideoStrip raisedHands={raisedHands} observerIds={observerIds} />
          )}
        </div>
      </div>

      {/* Mobile chat (slides from bottom) */}
      {showChat && (
        <div className="md:hidden fixed inset-x-0 bottom-0 top-1/2 z-40 rounded-t-3xl overflow-hidden shadow-2xl">
          <ChatDrawer send={handleChatSend} messages={chatMessages} onClose={() => setShowChat(false)} />
        </div>
      )}

      {/* Centralized Control Dock */}
      <ControlDock
        onEndClass={handleEndClass}
        isRecording={recording.active && recording.visible}
        isTeacher={isTeacher}
        isHandRaised={myHandRaised}
        onRaiseHand={handleRaiseHand}
        onLowerHand={() => handleLowerHand()}
        showChat={showChat}
        onToggleChat={() => setShowChat(!showChat)}
        showNavigator={showNavigator}
        onToggleNavigator={() => setShowNavigator(!showNavigator)}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onStartRecording={handleStartRecording}
        isObserver={isObserver}
        highlighterActive={highlighterActive}
        onToggleHighlighter={() => setHighlighterActive(!highlighterActive)}
      />

      {/* Settings Modal */}
      {showSettings && <AVSettingsModal onClose={() => setShowSettings(false)} />}

      {/* End Class Modals */}
      {showReportModal && <SessionReportModal sessionId={sessionId} onSubmitted={handleReportSubmitted} onClose={() => setShowReportModal(false)} />}
      {showRatingModal && <RateTeacherModal sessionId={sessionId} teacherName={session?.teacher_name} onSubmitted={handleRatingSubmitted} onClose={() => setShowRatingModal(false)} />}
    </div>
  );

  if (lkToken && lkUrl) {
    return (
      <LiveKitRoom
        token={lkToken}
        serverUrl={lkUrl}
        connect={true}
        video={joinConfig?.cameraEnabled ?? true}
        audio={joinConfig?.micEnabled ?? true}
        data-testid="livekit-room"
      >
        {roomContent}
      </LiveKitRoom>
    );
  }

  return roomContent;
}
