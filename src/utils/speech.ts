let cachedVoice: SpeechSynthesisVoice | null | undefined;
let voicesReadyPromise: Promise<SpeechSynthesisVoice[] | null> | null = null;

function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}

function selectJapaneseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return (
    voices.find(voice => /ja[-_]?jp/i.test(voice.lang) || /japanese/i.test(voice.name)) ||
    voices.find(voice => /^ja/i.test(voice.lang)) ||
    voices[0] ||
    null
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function loadVoices(): Promise<SpeechSynthesisVoice[] | null> {
  if (!isSpeechSynthesisSupported()) {
    return Promise.resolve(null);
  }

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    return Promise.resolve(voices);
  }

  if (voicesReadyPromise) {
    return voicesReadyPromise;
  }

  voicesReadyPromise = new Promise(resolve => {
    let timeoutId: number | null = null;

    const handleVoicesChanged = () => {
      const loadedVoices = window.speechSynthesis.getVoices();
      if (loadedVoices.length > 0) {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
        resolve(loadedVoices);
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    timeoutId = window.setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      const loadedVoices = window.speechSynthesis.getVoices();
      if (loadedVoices.length > 0) {
        resolve(loadedVoices);
      } else {
        voicesReadyPromise = null;
        resolve(null);
      }
    }, 1000);
  });

  return voicesReadyPromise;
}

export async function speakJapanese(text: string): Promise<void> {
  if (!isSpeechSynthesisSupported()) {
    return;
  }

  const cleanedText = text.replace(/〜/g, '').trim();
  if (!cleanedText) {
    return;
  }

  const voices = await loadVoices();
  if (voices && voices.length > 0 && !cachedVoice) {
    cachedVoice = selectJapaneseVoice(voices);
  }

  if (window.speechSynthesis.paused || window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    await new Promise<void>((resolve) => window.setTimeout(resolve, 40));
  }

  const utterance = new SpeechSynthesisUtterance(cleanedText);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.98;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  if (cachedVoice) {
    utterance.voice = cachedVoice;
  }

  window.speechSynthesis.speak(utterance);
}
