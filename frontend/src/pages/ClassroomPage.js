import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import { toast } from 'sonner';
import DigitalMushaf from '../components/classroom/DigitalMushaf';
import QuranNavigator from '../components/classroom/QuranNavigator';
import { VideoStrip, ControlBar } from '../components/classroom/LiveKitRoom';
import Spinner from '../components/Spinner';
import {
  BookOpen,
  Puzzle,
  PanelLeftOpen,
  PanelLeftClose,
  MessageSquare,
  X,
  Send,
} from 'lucide-react';

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

      ws.onmessage = (e) => {
        try {
          onMessage(JSON.parse(e.data));
        } catch { /* ignore parse errors */ }
      };

      ws.onclose = () => {
        reconnectRef.current = setTimeout(connect, 2000);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [roomId]);

  const send = useCallback((msg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return send;
}

// ==================== POINTER THROTTLE ====================
function useThrottledSend(send, delay = 50) {
  const lastRef = useRef(0);
  return useCallback(
    (msg) => {
      const now = Date.now();
      if (now - lastRef.current >= delay) {
        lastRef.current = now;
        send(msg);
      }
    },
    [send, delay]
  );
}

// ==================== CHAT PANEL ====================
function ChatPanel({ send, messages, onClose }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    send({ type: 'CHAT', text: text.trim(), timestamp: Date.now() });
    setText('');
  };

  return (
    <div className="flex flex-col h-full bg-white/50 backdrop-blur-xl" data-testid="chat-panel">
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
        <h3 className="text-sm font-semibold text-ink">Chat</h3>
        <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-lg">
          <X className="w-4 h-4 text-ink-tertiary" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={`text-xs px-3 py-2 rounded-xl max-w-[85%] ${m.self ? 'ml-auto bg-brand/10 text-brand' : 'bg-surface-subtle text-ink'}`}>
            {!m.self && <p className="font-semibold mb-0.5 text-ink-secondary">{m.sender}</p>}
            <p>{m.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 p-3 border-t border-black/5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 h-9 px-3 rounded-xl bg-surface-subtle text-sm border-none focus:outline-none focus:ring-2 focus:ring-brand/20"
          data-testid="chat-input"
        />
        <button onClick={handleSend} className="p-2 rounded-xl bg-brand text-white hover:bg-brand-light transition-all" data-testid="chat-send">
          <Send className="w-4 h-4" />
        </button>
      </div>
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

  // Real-time state
  const [currentPage, setCurrentPage] = useState(1);
  const [highlights, setHighlights] = useState([]);
  const [pointerPos, setPointerPos] = useState(null);
  const [recording, setRecording] = useState({ active: false, visible: false });
  const [chatMessages, setChatMessages] = useState([]);

  // UI state
  const [showNavigator, setShowNavigator] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';

  // WS message handler
  const handleWSMessage = useCallback(
    (msg) => {
      switch (msg.type) {
        case 'ROOM_STATE':
          setCurrentPage(msg.page || 1);
          setHighlights(msg.highlights || []);
          setRecording(msg.recording || { active: false, visible: false });
          break;
        case 'POINTER_MOVE':
          setPointerPos({ x: msg.x, y: msg.y });
          break;
        case 'PAGE_CHANGE':
          setCurrentPage(msg.page);
          break;
        case 'HIGHLIGHT_SYNC':
          setHighlights(msg.highlights || []);
          break;
        case 'RECORDING_STARTED':
          setRecording({ active: true, visible: msg.visible });
          break;
        case 'RECORDING_STOPPED':
          setRecording({ active: false, visible: false });
          break;
        case 'CHAT':
          setChatMessages((p) => [...p, { text: msg.text, sender: msg.sender || 'Participant', self: false }]);
          break;
        default:
          break;
      }
    },
    []
  );

  const send = useClassroomWS(session?.meet_link_slug, handleWSMessage);
  const throttledSend = useThrottledSend(send, 50);

  // Init: fetch session + LiveKit token
  useEffect(() => {
    async function init() {
      try {
        // Get current user
        const meRes = await fetch(`${API}/auth/me`, { credentials: 'include' });
        if (!meRes.ok) { navigate('/auth'); return; }
        const meData = await meRes.json();
        // /api/auth/me returns user object directly, not wrapped in { user: ... }
        setUser(meData.user || meData);

        // Get session details
        const sRes = await fetch(`${API}/classroom/session/${sessionId}`, { credentials: 'include' });
        if (!sRes.ok) { toast.error('Session not found'); navigate(-1); return; }
        const sData = await sRes.json();
        setSession(sData);

        // Get LiveKit token
        const tRes = await fetch(`${API}/classroom/livekit/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ room_name: sData.meet_link_slug }),
        });
        if (tRes.ok) {
          const tData = await tRes.json();
          setLkToken(tData.token);
          setLkUrl(tData.server_url);
        }

        // Mark as live if teacher
        if (meData.user.role === 'teacher') {
          await fetch(`${API}/classroom/session/${sessionId}/go-live`, {
            method: 'POST',
            credentials: 'include',
          });
        }
      } catch (e) {
        toast.error('Failed to connect to classroom');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [sessionId, navigate]);

  // Teacher: page change → broadcast
  const handlePageChange = useCallback(
    (page) => {
      setCurrentPage(page);
      if (isTeacher) send({ type: 'PAGE_CHANGE', page });
    },
    [isTeacher, send]
  );

  // Teacher: pointer move → broadcast (throttled)
  const handlePointerMove = useCallback(
    (pos) => {
      throttledSend({ type: 'POINTER_MOVE', x: pos.x, y: pos.y });
    },
    [throttledSend]
  );

  // Teacher: highlight → broadcast
  const handleHighlight = useCallback(
    (hl) => {
      send({ type: 'HIGHLIGHT', verseKey: hl.verseKey, color: hl.color });
    },
    [send]
  );

  // Navigation from drawer
  const handleNavigate = useCallback(
    (nav) => {
      let page = 1;
      if (nav.type === 'page') page = nav.page;
      else if (nav.type === 'juz') page = Math.round((nav.juz - 1) * 20.13 + 1);
      handlePageChange(page);
      setShowNavigator(false);
    },
    [handlePageChange]
  );

  // Chat send
  const handleChatSend = useCallback(
    (msg) => {
      send({ ...msg, sender: user?.name || 'Me' });
      setChatMessages((p) => [...p, { text: msg.text, sender: 'You', self: true }]);
    },
    [send, user]
  );

  // End class
  const handleEndClass = useCallback(() => {
    toast.success('Class ended');
    navigate(isTeacher ? '/teacher/dashboard' : '/student/dashboard');
  }, [navigate, isTeacher]);

  // Clear pointer after inactivity
  useEffect(() => {
    if (!pointerPos) return;
    const t = setTimeout(() => setPointerPos(null), 3000);
    return () => clearTimeout(t);
  }, [pointerPos]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F5F5F7]"><Spinner message="Entering classroom..." /></div>;

  const roomContent = (
    <div className="h-screen flex flex-col bg-[#F5F5F7] overflow-hidden" data-testid="classroom-page">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/70 backdrop-blur-xl border-b border-black/5 z-40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h1 className="text-sm font-semibold text-ink truncate">
            {session?.teacher_name || 'Teacher'} & {session?.student_name || 'Student'}
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          {isTeacher && (
            <button
              onClick={() => setShowNavigator(!showNavigator)}
              className={`p-2 rounded-xl transition-all ${showNavigator ? 'bg-brand text-white' : 'hover:bg-black/5 text-ink-secondary'}`}
              title="Quran Navigator"
              data-testid="nav-toggle"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-2 rounded-xl transition-all ${showChat ? 'bg-brand text-white' : 'hover:bg-black/5 text-ink-secondary'}`}
            title="Chat"
            data-testid="chat-toggle"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigator Drawer (Teacher only) */}
        {showNavigator && isTeacher && (
          <div className="w-72 border-r border-black/5 bg-white/60 backdrop-blur-xl flex-shrink-0 overflow-hidden">
            <QuranNavigator onNavigate={handleNavigate} onClose={() => setShowNavigator(false)} />
          </div>
        )}

        {/* Left: Mushaf Stage (75% desktop) */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Mobile: Video Strip Horizontal */}
          <div className="md:hidden flex-shrink-0 h-28 border-b border-black/5 bg-black/5 overflow-x-auto">
            <div className="flex gap-2 p-2 h-full">
              <VideoStrip />
            </div>
          </div>

          {/* Mushaf */}
          <div className="flex-1 overflow-hidden">
            <DigitalMushaf
              currentPage={currentPage}
              onPageChange={handlePageChange}
              isTeacher={isTeacher}
              pointerPosition={!isTeacher ? pointerPos : null}
              highlights={highlights}
              onPointerMove={isTeacher ? handlePointerMove : undefined}
              onHighlight={isTeacher ? handleHighlight : undefined}
            />
          </div>
        </div>

        {/* Right: Video Strip (25% desktop) / Chat */}
        <div className="hidden md:flex flex-col w-[280px] flex-shrink-0 border-l border-black/5 bg-black/3">
          {showChat ? (
            <ChatPanel
              send={handleChatSend}
              messages={chatMessages}
              onClose={() => setShowChat(false)}
            />
          ) : (
            <VideoStrip />
          )}
        </div>
      </div>

      {/* Control Bar */}
      <ControlBar
        onEndClass={handleEndClass}
        isRecording={recording.active && recording.visible}
        isTeacher={isTeacher}
      />
    </div>
  );

  // Wrap with LiveKit if token available
  if (lkToken && lkUrl) {
    return (
      <LiveKitRoom
        token={lkToken}
        serverUrl={lkUrl}
        connect={true}
        video={true}
        audio={true}
        data-testid="livekit-room"
      >
        {roomContent}
      </LiveKitRoom>
    );
  }

  // No LiveKit — still render classroom with Mushaf + WS sync
  return roomContent;
}
