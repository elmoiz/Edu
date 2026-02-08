import { create } from 'zustand';

export const useRoomStore = create((set, get) => ({
  currentRoom: null,
  participants: [],
  messages: [],
  isConnecting: false,
  isConnected: false,
  localStream: null,
  remoteStreams: new Map(),
  screenStream: null,
  isScreenSharing: false,
  isMuted: false,
  isVideoOff: false,
  isHandRaised: false,
  activePoll: null,
  whiteboardData: null,

  setCurrentRoom: (room) => set({ currentRoom: room }),
  
  addParticipant: (participant) => set((state) => ({
    participants: [...state.participants, participant]
  })),
  
  removeParticipant: (userId) => set((state) => ({
    participants: state.participants.filter(p => p.userId !== userId)
  })),
  
  updateParticipant: (userId, updates) => set((state) => ({
    participants: state.participants.map(p => 
      p.userId === userId ? { ...p, ...updates } : p
    )
  })),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),

  setLocalStream: (stream) => set({ localStream: stream }),
  
  addRemoteStream: (userId, stream) => set((state) => ({
    remoteStreams: new Map(state.remoteStreams).set(userId, stream)
  })),
  
  removeRemoteStream: (userId) => set((state) => {
    const newStreams = new Map(state.remoteStreams);
    newStreams.delete(userId);
    return { remoteStreams: newStreams };
  }),

  toggleMute: () => set((state) => {
    if (state.localStream) {
      state.localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    return { isMuted: !state.isMuted };
  }),

  toggleVideo: () => set((state) => {
    if (state.localStream) {
      state.localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    return { isVideoOff: !state.isVideoOff };
  }),

  toggleHandRaise: () => set((state) => ({ isHandRaised: !state.isHandRaised })),

  setScreenStream: (stream) => set({ screenStream: stream, isScreenSharing: !!stream }),

  setActivePoll: (poll) => set({ activePoll: poll }),
  
  updatePoll: (poll) => set({ activePoll: poll }),

  reset: () => set({
    currentRoom: null,
    participants: [],
    messages: [],
    isConnecting: false,
    isConnected: false,
    localStream: null,
    remoteStreams: new Map(),
    screenStream: null,
    isScreenSharing: false,
    isMuted: false,
    isVideoOff: false,
    isHandRaised: false,
    activePoll: null,
    whiteboardData: null
  })
}));