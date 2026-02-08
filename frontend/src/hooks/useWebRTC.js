import { useEffect, useRef, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import { useRoomStore } from '../store/roomStore';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Add your TURN server here for production
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'user',
    //   credential: 'pass'
    // }
  ]
};

export const useWebRTC = (socket, roomId) => {
  const peersRef = useRef({});
  const { setLocalStream, addRemoteStream, removeRemoteStream } = useRoomStore();

  const createPeer = useCallback((targetId, initiator) => {
    const peer = new SimplePeer({
      initiator,
      trickle: false,
      config: ICE_SERVERS
    });

    peer.on('signal', (signal) => {
      socket.emit('offer', { targetId, offer: signal });
    });

    peer.on('stream', (stream) => {
      addRemoteStream(targetId, stream);
    });

    peer.on('close', () => {
      removeRemoteStream(targetId);
      delete peersRef.current[targetId];
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      removeRemoteStream(targetId);
      delete peersRef.current[targetId];
    });

    return peer;
  }, [socket, addRemoteStream, removeRemoteStream]);

  const initLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Failed to get local stream:', err);
      throw err;
    }
  }, [setLocalStream]);

  useEffect(() => {
    if (!socket) return;

    const handleOffer = ({ offer, senderId }) => {
      const peer = createPeer(senderId, false);
      peer.signal(offer);
      peersRef.current[senderId] = peer;
    };

    const handleAnswer = ({ answer, senderId }) => {
      const peer = peersRef.current[senderId];
      if (peer) {
        peer.signal(answer);
      }
    };

    const handleIceCandidate = ({ candidate, senderId }) => {
      const peer = peersRef.current[senderId];
      if (peer) {
        peer.signal(candidate);
      }
    };

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    return () => {
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      
      // Cleanup peers
      Object.values(peersRef.current).forEach(peer => peer.destroy());
      peersRef.current = {};
    };
  }, [socket, createPeer]);

  const connectToNewUser = useCallback((userId, stream) => {
    const peer = createPeer(userId, true);
    peer.addStream(stream);
    peersRef.current[userId] = peer;
  }, [createPeer]);

  return { initLocalStream, connectToNewUser, peersRef };
};