import { describe, it, expect } from 'vitest';

describe('FE-91: Speaking Audio File Upload (.mp3, .wav) alongside Mic (UC017)', () => {
  it('validates audio file format and size limits', () => {
    const MAX_AUDIO_SIZE = 25 * 1024 * 1024;
    const validateAudioFile = (filename: string, size: number) => {
      if (size > MAX_AUDIO_SIZE) {
        return { valid: false, error: 'File size exceeds 25MB' };
      }
      const isValidExt = /\.(mp3|wav|m4a|webm|mp4)$/i.test(filename);
      if (!isValidExt) {
        return { valid: false, error: 'Unsupported format' };
      }
      return { valid: true, error: null };
    };

    expect(validateAudioFile('recording.mp3', 5 * 1024 * 1024).valid).toBe(true);
    expect(validateAudioFile('recording.wav', 12 * 1024 * 1024).valid).toBe(true);
    expect(validateAudioFile('recording.m4a', 20 * 1024 * 1024).valid).toBe(true);
    expect(validateAudioFile('document.docx', 1 * 1024 * 1024).valid).toBe(false);
    expect(validateAudioFile('huge_audio.mp3', 30 * 1024 * 1024).valid).toBe(false);
  });
});
