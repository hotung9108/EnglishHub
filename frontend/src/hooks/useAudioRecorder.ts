import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseAudioRecorderOptions {
  /**
   * Time slice in milliseconds for MediaRecorder data collection.
   * Default: 1000ms.
   */
  timeSlice?: number;
}

export interface UseAudioRecorderResult {
  isRecording: boolean;
  isPaused: boolean;
  recordingDuration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  audioMimeType: string;
  backendMimeType: 'audio/webm' | 'audio/wav' | 'audio/mpeg';
  permissionError: string | null;
  isSupported: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
}

/**
 * Normalizes recorded MIME types to the strict allowlist expected by backend
 * ('audio/webm' | 'audio/wav' | 'audio/mpeg').
 */
export function getBackendMimeType(recordedType: string): 'audio/webm' | 'audio/wav' | 'audio/mpeg' {
  const lower = (recordedType || '').toLowerCase();
  if (lower.startsWith('audio/wav') || lower.startsWith('audio/x-wav')) {
    return 'audio/wav';
  }
  if (lower.startsWith('audio/mpeg') || lower.startsWith('audio/mp3')) {
    return 'audio/mpeg';
  }
  return 'audio/webm';
}

function getBestSupportedMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return 'audio/webm';
  }
  const candidateTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/wav',
  ];
  for (const type of candidateTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}): UseAudioRecorderResult {
  const { timeSlice = 1000 } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/webm');
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeUrlRef = useRef<string | null>(null);

  const isSupported = typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined';

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopMediaStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const revokeActiveUrl = useCallback(() => {
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setPermissionError(null);

    if (!isSupported) {
      const err = 'Trình duyệt của bạn không hỗ trợ ghi âm trực tiếp (MediaRecorder). Vui lòng dùng trình duyệt Chrome, Edge hoặc Firefox bản mới nhất.';
      setPermissionError(err);
      throw new Error(err);
    }

    // Clean previous active recording URL
    revokeActiveUrl();
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
    } catch (err: unknown) {
      let friendlyMsg = 'Không thể truy cập microphone. Vui lòng kiểm tra lại thiết bị.';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          friendlyMsg = 'Bạn đã từ chối quyền truy cập microphone. Vui lòng cho phép quyền microphone trên trình duyệt để ghi âm.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          friendlyMsg = 'Không tìm thấy thiết bị microphone nào kết nối với máy tính.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          friendlyMsg = 'Microphone đang bị ứng dụng khác chiếm giữ. Vui lòng đóng ứng dụng đó và thử lại.';
        }
      }
      setPermissionError(friendlyMsg);
      throw new Error(friendlyMsg, { cause: err });
    }

    const preferredType = getBestSupportedMimeType();
    const recorderOptions: MediaRecorderOptions = preferredType ? { mimeType: preferredType } : {};

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, recorderOptions);
    } catch {
      recorder = new MediaRecorder(stream);
    }
    mediaRecorderRef.current = recorder;

    const actualMimeType = recorder.mimeType || preferredType || 'audio/webm';
    setAudioMimeType(actualMimeType);

    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      stopMediaStream();
      clearTimer();
      setIsRecording(false);
      setIsPaused(false);

      const finalBlob = new Blob(chunksRef.current, { type: actualMimeType });
      setAudioBlob(finalBlob);

      const objectUrl = URL.createObjectURL(finalBlob);
      activeUrlRef.current = objectUrl;
      setAudioUrl(objectUrl);
    };

    recorder.start(timeSlice);
    setIsRecording(true);
    setIsPaused(false);

    // Duration timer
    clearTimer();
    timerRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
  }, [isSupported, revokeActiveUrl, timeSlice, clearTimer, stopMediaStream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopMediaStream();
    clearTimer();
    setIsRecording(false);
    setIsPaused(false);
  }, [clearTimer, stopMediaStream]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      clearTimer();
    }
  }, [clearTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      clearTimer();
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
  }, [clearTimer]);

  const resetRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopMediaStream();
    clearTimer();
    revokeActiveUrl();

    chunksRef.current = [];
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    setIsRecording(false);
    setIsPaused(false);
    setPermissionError(null);
  }, [clearTimer, revokeActiveUrl, stopMediaStream]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      clearTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore
        }
      }
      stopMediaStream();
      revokeActiveUrl();
    };
  }, [clearTimer, revokeActiveUrl, stopMediaStream]);

  return {
    isRecording,
    isPaused,
    recordingDuration,
    audioBlob,
    audioUrl,
    audioMimeType,
    backendMimeType: getBackendMimeType(audioMimeType),
    permissionError,
    isSupported,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  };
}
