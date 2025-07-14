
// Simplified audio utilities focused on iOS Safari compatibility

export const detectIOSSafari = () => {
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const webkit = /AppleWebKit/.test(ua);
  const safari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
  return iOS && webkit && safari;
};

export const getSupportedMimeType = () => {
  if (detectIOSSafari()) {
    // Force iOS Safari to use MP4/AAC which creates .m4a compatible files
    console.log('iOS Safari detected: forcing audio/mp4 format');
    return 'audio/mp4';
  }
  
  // For other browsers, prefer webm but check support
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/wav'];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
      console.log(`Using MIME type: ${type}`);
      return type;
    }
  }
  
  console.log('Fallback to audio/wav');
  return 'audio/wav';
};

export const getFileExtension = (mimeType) => {
  if (mimeType.includes('mp4')) return 'm4a';  // iOS Safari MP4 -> .m4a
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'audio'; // fallback
};

export const createCompatibleAudioElement = (src) => {
  const audio = new Audio();
  
  if (detectIOSSafari()) {
    // iOS Safari optimizations
    audio.preload = 'metadata';
    audio.playsInline = true; // Important for iOS
    // Don't set crossOrigin for same-origin files as it can cause issues
  }
  
  if (src) {
    audio.src = src;
  }
  return audio;
};

// Simple audio loading with better error handling
export const loadAndPlayAudio = (audioUrl) => {
  return new Promise((resolve, reject) => {
    const audio = createCompatibleAudioElement(audioUrl);
    
    const cleanup = () => {
      audio.removeEventListener('canplaythrough', onCanPlay);
      audio.removeEventListener('error', onError);
    };
    
    const onCanPlay = () => {
      cleanup();
      resolve(audio);
    };
    
    const onError = (e) => {
      cleanup();
      console.error('Audio loading failed:', e);
      reject(new Error('Audio loading failed'));
    };
    
    audio.addEventListener('canplaythrough', onCanPlay);
    audio.addEventListener('error', onError);
    
    // Start loading
    audio.load();
  });
};
