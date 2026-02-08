import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { useRoomStore } from '../store/roomStore';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';
import toast from 'react-hot-toast';
import VideoPlayer from '../components/VideoPlayer';
import Chat from '../components/Chat';
import Controls from '../components/Controls';
import Participants from '../components/Participants';
import Whiteboard from '../components/Whiteboard';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Classroom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const { user } = useAuthStore();
  const {
    currentRoom,
    setCurrentRoom,
    participants,
    messages,
    isMuted,
    isVideoOff,
    isHandRaised,
    localStream,
    remoteStreams,
    addMessage,
    addParticipant,
    removeParticipant,
    updateParticipant,
    toggleHandRaise,
    reset
  } = useRoomStore();

  const [activeTab, setActiveTab] = useState('chat');
  const [isLoading, setIsLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const { initLocalStream, connectToNewUser } = useWebRTC(socket, roomId);
  const streamInitialized = useRef(false);

  useEffect(() => {
    if (!socket) return;

    const initialize = async () => {
      try {
        // Get room info
        const response = await axios.get(`${API_URL}/rooms/${roomId}`);
        setCurrentRoom(response.data);
        setIsTeacher(response.data.teacher._id === user._id);

        // Initialize local stream
        if (!streamInitialized.current) {
          const stream = await initLocalStream();
          streamInitialized.current = true;

          // Join room
          socket.emit('join-room', { roomId });

          // Setup socket listeners
          socket.on('joined-room', ({ room, isTeacher: teacherStatus }) => {
            setIsLoading(false);
            toast.success('تم الانضمام إلى الجلسة بنجاح');
          });

          socket.on('user-joined', ({ userId, username, socketId }) => {
            addParticipant({ userId, username, socketId });
            toast(`${username} انضم إلى الجلسة`, { icon: '👋' });
            
            // Connect to new user
            if (localStream) {
              connectToNewUser(socketId, localStream);
            }
          });

          socket.on('user-left', ({ userId, username }) => {
            removeParticipant(userId);
            toast(`${username} غادر الجلسة`, { icon: '👋' });
          });

          socket.on('new-message', (message) => {
            addMessage(message);
          });

          socket.on('hand-toggled', ({ userId, username, isRaised }) => {
            updateParticipant(userId, { isHandRaised: isRaised });
            if (isRaised) {
              toast(`${username} رفع اليد ✋`);
            }
          });

          socket.on('room-ended', () => {
            toast('تم إنهاء الجلسة من قبل المعلم');
            handleLeave();
          });

          socket.on('error', ({ message }) => {
            toast.error(message);
            navigate('/dashboard');
          });
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
        toast.error('فشل في الاتصال بالجلسة');
        navigate('/dashboard');
      }
    };

    initialize();

    return () => {
      if (socket) {
        socket.off('joined-room');
        socket.off('user-joined');
        socket.off('user-left');
        socket.off('new-message');
        socket.off('hand-toggled');
        socket.off('room-ended');
        socket.off('error');
      }
      // Don't reset here to preserve state during navigation
    };
  }, [socket, roomId, user]);

  const handleLeave = () => {
    if (socket) {
      socket.disconnect();
    }
    reset();
    navigate('/dashboard');
  };

  const handleHandRaise = () => {
    if (socket) {
      socket.emit('toggle-hand', { isRaised: !isHandRaised });
      toggleHandRaise();
    }
  };

  const handleSendMessage = (content) => {
    if (socket && content.trim()) {
      socket.emit('send-message', { content, type: 'text' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">جاري الاتصال بالجلسة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-dark flex flex-col">
      {/* Header */}
      <header className="bg-dark-card border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLeave}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-light rounded-lg transition-colors"
          >
            ← خروج
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">{currentRoom?.title}</h1>
            <p className="text-xs text-gray-400">{currentRoom?.subject} • {currentRoom?.grade}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-dark-light px-3 py-1.5 rounded-lg">
            <div className="w-2 h-2 bg-danger rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">{participants.length + 1} مشارك</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-dark-card m-4 rounded-2xl overflow-hidden relative">
            {/* Teacher Video (Main) */}
            <div className="absolute inset-0 flex items-center justify-center">
              {remoteStreams.size > 0 ? (
                Array.from(remoteStreams.entries()).map(([userId, stream]) => (
                  <VideoPlayer
                    key={userId}
                    stream={stream}
                    isMain={true}
                    username="المعلم"
                  />
                ))
              ) : (
                <div className="text-center">
                  <div className="w-24 h-24 bg-dark-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">👨‍🏫</span>
                  </div>
                  <p className="text-gray-400">في انتظار المعلم...</p>
                </div>
              )}
            </div>

            {/* Local Video (Picture in Picture) */}
            {localStream && (
              <div className="absolute bottom-4 right-4 w-48 h-36 bg-dark rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl">
                <VideoPlayer
                  stream={localStream}
                  isMuted={true}
                  isLocal={true}
                  username={user.username}
                />
                {(isMuted || isVideoOff) && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    {isMuted && <span className="text-2xl">🔇</span>}
                    {isVideoOff && <span className="text-2xl">📷</span>}
                  </div>
                )}
              </div>
            )}

            {/* Hand Raise Indicator */}
            {isHandRaised && (
              <div className="absolute top-4 right-4 bg-warning text-dark font-bold px-4 py-2 rounded-full animate-bounce-slow flex items-center gap-2">
                ✋ تم رفع اليد
              </div>
            )}
          </div>

          {/* Controls */}
          <Controls
            onLeave={handleLeave}
            onHandRaise={handleHandRaise}
            isHandRaised={isHandRaised}
            isTeacher={isTeacher}
          />
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-dark-card border-r border-gray-700 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'chat' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'
              }`}
            >
              الدردشة
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'participants' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'
              }`}
            >
              المشاركون
            </button>
            <button
              onClick={() => setActiveTab('whiteboard')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'whiteboard' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'
              }`}
            >
              السبورة
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' && (
              <Chat
                messages={messages}
                onSendMessage={handleSendMessage}
                currentUser={user}
              />
            )}
            {activeTab === 'participants' && (
              <Participants
                participants={participants}
                currentUser={user}
                isTeacher={isTeacher}
              />
            )}
            {activeTab === 'whiteboard' && (
              <Whiteboard socket={socket} roomId={roomId} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Classroom;