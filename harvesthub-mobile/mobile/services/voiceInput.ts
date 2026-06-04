import * as Speech from 'expo-speech';

export interface VoiceInputOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  onResult?: (text: string) => void;
  onError?: (error: Error) => void;
}

class VoiceInputService {
  private isListening: boolean = false;
  private options: VoiceInputOptions = {};

  // Check if speech recognition is available on this device
  isAvailable(): boolean {
    // Note: expo-speech is primarily for TTS (text-to-speech)
    // For STT (speech-to-text) on mobile, we need a different approach
    // This is a simplified implementation
    return true;
  }

  // Start voice input
  async startListening(options: VoiceInputOptions = {}): Promise<void> {
    // Note: True speech-to-text requires native modules
    // This implementation provides a mock for demo purposes
    // In production, consider using:
    // - react-native-voice (for bare React Native)
    // - expo-speech-recognition (if available)
    // - Web Speech API (for web)

    this.options = options;
    this.isListening = true;

    // For demo purposes, we'll show an alert explaining the feature
    // In a real implementation, this would integrate with native speech recognition
    throw new Error(
      'Голосовой ввод требует нативного модуля речевого распознавания. ' +
        'Для production используйте: @react-native-voice/voice или expo-speech-recognition'
    );
  }

  // Stop listening
  stopListening(): void {
    this.isListening = false;
  }

  // Get listening state
  getIsListening(): boolean {
    return this.isListening;
  }

  // For demo purposes - simulate voice input with predefined texts
  simulateVoiceInput(field: 'name' | 'description'): string {
    const demoTexts = {
      name: [
        'Свежие помидоры',
        'Огурцы тепличные',
        'Морковь молодая',
        'Картофель новый урожай',
        'Лук репчатый',
      ],
      description: [
        'Вкусные спелые помидоры прямо с грядки',
        'Свежие хрустящие огурцы',
        'Сладкая молодая морковь без химии',
        'Крупный картофель отличного качества',
        'Ароматный свежий лук',
      ],
    };

    const texts = demoTexts[field];
    const randomIndex = Math.floor(Math.random() * texts.length);
    return texts[randomIndex];
  }
}

export const voiceInputService = new VoiceInputService();

// Alternative: Simple text-to-speech for accessibility
export const speakText = (text: string, options?: Speech.SpeechOptions): void => {
  Speech.speak(text, {
    language: 'ru-RU',
    pitch: 1,
    rate: 1,
    ...options,
  });
};

export const stopSpeaking = (): void => {
  Speech.stop();
};
