import { Injectable, signal } from '@angular/core';

declare var webkitSpeechRecognition: any;

@Injectable({
  providedIn: 'root'
})
export class DictationService {
  readonly isListening = signal(false);
  readonly isModalOpen = signal(false);
  readonly permissionError = signal<string | null>(null);
  readonly initialText = signal('');

  private recognition: any;
  private onAcceptCallback: ((text: string) => void) | null = null;
  private resultCallback: ((text: string, isFinal: boolean) => void) | null = null;

  constructor() {
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition() {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      this.permissionError.set("Voice dictation is not supported in this browser.");
      return;
    }

    this.recognition = new SpeechRecognitionAPI();
    this.recognition.continuous = true;
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = true;

    this.recognition.onstart = () => {
      this.permissionError.set(null);
      this.isListening.set(true);
    };

    this.recognition.onend = () => {
      this.isListening.set(false);
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        this.permissionError.set('Microphone access denied.');
      } else if (event.error === 'no-speech') {
        // Ignore
      } else {
        this.permissionError.set(`Error: ${event.error}`);
      }
      this.isListening.set(false);
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      
      if (this.resultCallback) {
        if (final) this.resultCallback(final, true);
        if (interim) this.resultCallback(interim, false);
      }
    };
  }

  openDictationModal(initialText: string = '', onAccept: (text: string) => void) {
    this.initialText.set(initialText);
    this.onAcceptCallback = onAccept;
    this.isModalOpen.set(true);
    // We don't auto-start here, let the modal component handle starting via user action or auto-start logic
  }

  startRecognition() {
    if (!this.recognition) return;
    try {
      this.recognition.start();
    } catch (e) {
      // Already started
    }
  }

  stopRecognition() {
    if (!this.recognition) return;
    this.recognition.stop();
  }

  cancel() {
    this.stopRecognition();
    this.isModalOpen.set(false);
    this.onAcceptCallback = null;
    this.resultCallback = null;
  }

  accept(finalText: string) {
    this.stopRecognition();
    if (this.onAcceptCallback) {
      this.onAcceptCallback(finalText);
    }
    this.isModalOpen.set(false);
    this.onAcceptCallback = null;
    this.resultCallback = null;
  }

  registerResultHandler(callback: (text: string, isFinal: boolean) => void) {
    this.resultCallback = callback;
  }
}
