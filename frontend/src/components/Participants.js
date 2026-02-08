import React from 'react';
import { Mic, MicOff, Video, VideoOff, Hand } from 'lucide-react';

const Participants = ({ participants, currentUser, isTeacher }) => {
  return (
    <div className="p-4 space-y-3">
      {/* Current User */}
      <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/30 rounded-xl">
        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center font-bold">
          {currentUser.username[0]}
        </div>
        <div className="flex-1">
          <p className="font-medium text-white">{currentUser.username} (أنت)</p>
          <p className="text-xs text-primary">{isTeacher ? 'معلم' : 'طالب'}</p>
        </div>
        <div className="flex gap-1">
          <Mic className="w-4 h-4 text-gray-400" />
          <Video className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Other Participants */}
      {participants.map((participant) => (
        <div
          key={participant.userId}
          className="flex items-center gap-3 p-3 bg-dark-light rounded-xl"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center font-bold text-white">
            {participant.username[0]}
          </div>
          <div className="flex-1">
            <p className="font-medium text-white">{participant.username}</p>
            <p className="text-xs text-gray-400">طالب</p>
          </div>
          <div className="flex gap-1 items-center">
            {participant.isHandRaised && (
              <Hand className="w-4 h-4 text-warning" />
            )}
            <Mic className="w-4 h-4 text-gray-400" />
            <Video className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      ))}

      {participants.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          لا يوجد مشاركون آخرون
        </div>
      )}
    </div>
  );
};

export default Participants;