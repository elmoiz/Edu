import React, { useEffect, useRef } from 'react';

const VideoPlayer = ({ stream, isMuted = false, isLocal = false, username, isMain = false }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`relative ${isMain ? 'w-full h-full' : 'w-full h-full'}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted || isLocal}
        className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
      />
      <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
        {username} {isLocal && '(أنت)'}
      </div>
    </div>
  );
};

export default VideoPlayer;