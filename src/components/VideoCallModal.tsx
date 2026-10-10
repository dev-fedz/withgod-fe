import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';

declare global {
  interface Window {
    Peer: any;
  }
}

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  callerTitle: string;
  avatarColor?: string;
  isGroup?: boolean;
  isCaller?: boolean;
  callType?: 'video' | 'audio';
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  callerTitle,
  avatarColor = '#D97706',
  isGroup = false,
  isCaller = true,
  callType = 'video',
}) => {
  const [callState, setCallState] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [callDuration, setCallDuration] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(callType === 'audio');
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [statusText, setStatusText] = useState(isCaller ? 'Calling...' : 'Connecting...');
  const [mediaError, setMediaError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<any>(null);
  const activeCallRef = useRef<any>(null);
  const durationTimerRef = useRef<any>(null);
  const dialIntervalRef = useRef<any>(null);
  const ringtoneAudioContextRef = useRef<AudioContext | null>(null);
  const ringtoneOscillatorRef = useRef<any>(null);

  // Play synthetic pleasant ringing tone using Web Audio API
  const startRingtone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      ringtoneAudioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);

      // Simple periodic beeping
      const now = ctx.currentTime;
      for (let i = 0; i < 20; i++) {
        gain.gain.setValueAtTime(0.05, now + i * 2.5);
        gain.gain.setValueAtTime(0, now + i * 2.5 + 1.2);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      ringtoneOscillatorRef.current = osc;
    } catch (e) {
      // Audio autoplay policy might block before user interaction
    }
  };

  const stopRingtone = () => {
    try {
      if (ringtoneOscillatorRef.current) {
        ringtoneOscillatorRef.current.stop();
        ringtoneOscillatorRef.current.disconnect();
        ringtoneOscillatorRef.current = null;
      }
      if (ringtoneAudioContextRef.current) {
        ringtoneAudioContextRef.current.close();
        ringtoneAudioContextRef.current = null;
      }
    } catch (e) {}
  };

  // Dynamically load PeerJS library
  const loadPeerJsScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.Peer) {
        resolve();
        return;
      }
      const existing = document.getElementById('peerjs-script');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        return;
      }
      const script = document.createElement('script');
      script.id = 'peerjs-script';
      script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    });
  };

  // Call duration counter
  useEffect(() => {
    if (isOpen && callState === 'connected') {
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [isOpen, callState]);

  // Main lifecycle
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    setCallState(isCaller ? 'ringing' : 'connected');
    setStatusText(isCaller ? 'Ringing...' : 'Connecting...');
    setCallDuration(0);
    setMediaError(null);

    if (isCaller) {
      startRingtone();
    }

    const cleanRoom = conversationId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 24);
    const myPeerId = isCaller ? `wg_${cleanRoom}_u1` : `wg_${cleanRoom}_u2`;
    const targetPeerId = isCaller ? `wg_${cleanRoom}_u2` : `wg_${cleanRoom}_u1`;

    const setupMediaAndPeer = async () => {
      try {
        await loadPeerJsScript();
        if (isCancelled) return;

        // Request camera & microphone
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
          });
        } catch (err: any) {
          console.warn('[VideoCall] Could not get full media, falling back to audio only:', err);
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        }

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Initialize PeerJS
        const peer = new window.Peer(myPeerId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
            ],
          },
        });
        peerRef.current = peer;

        peer.on('open', (id: string) => {
          console.log('[VideoCall] PeerJS open with ID:', id);

          if (isCaller) {
            // Dial target peer periodically until connected
            const dial = () => {
              if (activeCallRef.current || isCancelled) return;
              try {
                const call = peer.call(targetPeerId, stream);
                if (call) {
                  activeCallRef.current = call;
                  call.on('stream', (rStream: MediaStream) => {
                    handleConnectedStream(rStream);
                  });
                  call.on('close', () => {
                    handleEndCall();
                  });
                }
              } catch (e) {}
            };

            dial();
            dialIntervalRef.current = setInterval(dial, 3000);
          }
        });

        peer.on('call', (incomingCall: any) => {
          console.log('[VideoCall] Received incoming call');
          activeCallRef.current = incomingCall;
          incomingCall.answer(stream);
          incomingCall.on('stream', (rStream: MediaStream) => {
            handleConnectedStream(rStream);
          });
          incomingCall.on('close', () => {
            handleEndCall();
          });
        });

        peer.on('error', (err: any) => {
          console.warn('[VideoCall] PeerJS error:', err);
          // If ID is already taken (e.g. from rapid reload), target peer is ready to connect
          if (err?.type === 'unavailable-id') {
            console.log('[VideoCall] ID in use, attempting to answer or dial...');
          }
        });
      } catch (err: any) {
        console.error('[VideoCall] Setup error:', err);
        setMediaError(err?.message || 'Could not access camera or microphone.');
      }
    };

    setupMediaAndPeer();

    return () => {
      isCancelled = true;
      cleanupMedia();
    };
  }, [isOpen, conversationId, isCaller, callType]);

  const handleConnectedStream = (rStream: MediaStream) => {
    stopRingtone();
    if (dialIntervalRef.current) {
      clearInterval(dialIntervalRef.current);
      dialIntervalRef.current = null;
    }
    remoteStreamRef.current = rStream;
    setCallState('connected');
    setStatusText('Connected');

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = rStream;
      remoteVideoRef.current.play().catch(() => {});
    }

    const videoTracks = rStream.getVideoTracks();
    if (videoTracks.length > 0 && videoTracks[0].enabled) {
      setHasRemoteVideo(true);
    }

    videoTracks.forEach((t) => {
      t.onmute = () => setHasRemoteVideo(false);
      t.onunmute = () => setHasRemoteVideo(true);
    });
  };

  const cleanupMedia = () => {
    stopRingtone();
    if (dialIntervalRef.current) {
      clearInterval(dialIntervalRef.current);
      dialIntervalRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (activeCallRef.current) {
      try {
        activeCallRef.current.close();
      } catch (e) {}
      activeCallRef.current = null;
    }
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {}
      peerRef.current = null;
    }
  };

  const handleEndCall = async () => {
    cleanupMedia();
    setCallState('ended');
    try {
      await api.endChatCall(conversationId);
    } catch (e) {}
    onClose();
  };

  const handleToggleAudio = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const nextMuted = !isAudioMuted;
      audioTracks.forEach((t) => {
        t.enabled = !nextMuted;
      });
      setIsAudioMuted(nextMuted);
    }
  };

  const handleToggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      const nextMuted = !isVideoMuted;
      videoTracks.forEach((t) => {
        t.enabled = !nextMuted;
      });
      setIsVideoMuted(nextMuted);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl h-[580px] bg-stone-950 rounded-3xl overflow-hidden border border-stone-800 shadow-2xl flex flex-col justify-between">
        {/* Remote Video or Fallback Stage */}
        <div className="absolute inset-0 flex items-center justify-center bg-stone-900">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${hasRemoteVideo ? 'block' : 'hidden'}`}
          />

          {(!hasRemoteVideo || callState === 'ringing') && (
            <div className="flex flex-col items-center justify-center text-center p-6 z-10">
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl font-extrabold shadow-lg mb-4 ring-8 ring-stone-800/60"
                style={{ backgroundColor: avatarColor }}
              >
                {isGroup ? <Users className="w-12 h-12" /> : (callerTitle || 'C').substring(0, 1).toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">{callerTitle}</h2>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800/90 text-xs font-medium text-stone-300">
                {callState === 'connected' ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {formatTimer(callDuration)}
                  </span>
                ) : (
                  <span>{statusText}</span>
                )}
              </div>
              {mediaError && (
                <p className="mt-3 text-xs text-rose-400 flex items-center gap-1 bg-rose-950/60 px-3 py-1.5 rounded-lg border border-rose-800">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {mediaError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Local Floating Video (PiP top right) */}
        <div className="absolute top-4 right-4 z-20 w-32 h-44 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl bg-stone-800">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover -scale-x-100 ${isVideoMuted ? 'hidden' : 'block'}`}
          />
          {isVideoMuted && (
            <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 text-[10px] gap-1 bg-stone-900">
              <VideoOff className="w-6 h-6 text-rose-400" />
              <span>Camera Off</span>
            </div>
          )}
          <span className="absolute bottom-1 left-2 text-[10px] font-semibold text-white/80 bg-black/40 px-1.5 py-0.5 rounded">
            You
          </span>
        </div>

        {/* Top Header Controls / Info */}
        <div className="relative z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center gap-2 text-white">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              {callType === 'video' ? 'Video Call' : 'Voice Call'}
            </span>
          </div>
          {callState === 'connected' && (
            <span className="text-xs font-mono text-stone-300 bg-black/50 px-2.5 py-1 rounded-full">
              {formatTimer(callDuration)}
            </span>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="relative z-20 p-6 flex items-center justify-center gap-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          {/* Mute Audio */}
          <button
            type="button"
            onClick={handleToggleAudio}
            className={`w-13 h-13 rounded-full flex items-center justify-center text-white transition-all shadow-md ${
              isAudioMuted ? 'bg-rose-600 hover:bg-rose-700' : 'bg-stone-800/90 hover:bg-stone-700'
            }`}
            title={isAudioMuted ? 'Unmute' : 'Mute'}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* End Call */}
          <button
            type="button"
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
            title="End Call"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          {/* Toggle Video */}
          <button
            type="button"
            onClick={handleToggleVideo}
            className={`w-13 h-13 rounded-full flex items-center justify-center text-white transition-all shadow-md ${
              isVideoMuted ? 'bg-rose-600 hover:bg-rose-700' : 'bg-stone-800/90 hover:bg-stone-700'
            }`}
            title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
