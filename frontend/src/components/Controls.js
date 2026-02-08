import React from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MonitorUp, 
  Hand, 
  PhoneOff,
  MoreHorizontal
} from 'lucide-react';
import { useRoomStore } from '../store/roomStore';

const Controls = ({ onLeave, onHandRaise, isHandRaised, isTeacher }) => {
  const { isMuted, isVideoOff, toggleMute, toggleVideo } = useRoomStore();

  return (
    <div className="bg-dark-card border-t border-gray-700 px-4 py-3 flex items-center justify-center gap-4">
      <button
        onClick={toggleMute}
        className={`p-3 rounded-full transition-all ${
          isMuted ? 'bg-danger text-white' : 'bg-dark-light text-white hover:bg-gray-600'
        }`}
        title={isMuted ? 'إلغاء الكتم' : 'كتم الميكروفون'}
      >
        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </button>

      <button
        onClick={toggleVideo}
        className={`p-3 rounded-full transition-all ${
          isVideoOff ? 'bg-danger text-white' : 'bg-dark-light text-white hover:bg-gray-600'
        }`}
        title={isVideoOff ? 'تشغيل الكاميرا' : 'إيقاف الكاميرا'}
      >
        {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
      </button>

      <button
        className="p-3 rounded-full bg-dark-light text-white hover:bg-gray-600 transition-all"
        title="مشاركة الشاشة"
      >
        <MonitorUp className="w-6 h-6" />
      </button>

      <button
        onClick={onHandRaise}
        className={`p-3 rounded-full transition-all ${
          isHandRaised ? 'bg-warning text-dark' : 'bg-dark-light text-white hover:bg-gray-600'
        }`}
        title="رفع اليد"
      >
        <Hand className="w-6 h-6" />
      </button>

      {isTeacher && (
        <button
          className="p-3 rounded-full bg-dark-light text-white hover:bg-gray-600 transition-all"
          title="المزيد"
        >
          <MoreHorizontal className="w-6 h-6" />
        </button>
      )}

      <button
        onClick={onLeave}
        className="p-3 rounded-full bg-danger text-white hover:bg-red-600 transition-all"
        title="مغادرة الجلسة"
      >
        <PhoneOff className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Controls;