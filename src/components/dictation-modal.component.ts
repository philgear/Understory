import { Component, ChangeDetectionStrategy, inject, signal, effect, OnDestroy, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DictationService } from '../services/dictation.service';

@Component({
  selector: 'app-dictation-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (dictation.isModalOpen()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm">
        <div class="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                   [class.bg-red-100]="dictation.isListening()"
                   [class.text-red-600]="dictation.isListening()"
                   [class.bg-gray-100]="!dictation.isListening()"
                   [class.text-gray-500]="!dictation.isListening()">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
              </div>
              <div>
                <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wide">Voice Dictation</h3>
                <p class="text-xs text-gray-500">
                  @if (dictation.isListening()) {
                    Listening... Speak clearly.
                  } @else {
                    Microphone paused. Review your text.
                  }
                </p>
              </div>
            </div>
            <button (click)="cancel()" class="text-gray-500 hover:text-gray-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <!-- Content -->
          <div class="p-6 relative">
            <textarea 
              id="dictationText"
              name="dictationText"
              aria-label="Dictation text"
              #textInput
              [value]="currentText()"
              (input)="updateText($event)"
              class="w-full h-64 p-4 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none text-base leading-relaxed text-gray-800 placeholder-gray-400"
              placeholder="Start speaking or type here..."
            ></textarea>
            
            @if (interimText()) {
              <div class="absolute bottom-8 left-8 right-8 text-gray-500 text-sm italic truncate pointer-events-none">
                {{ interimText() }}...
              </div>
            }

            @if (dictation.isListening()) {
              <div class="absolute bottom-8 right-8 flex gap-1">
                 <span class="w-2 h-2 bg-red-500 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                 <span class="w-2 h-2 bg-red-500 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                 <span class="w-2 h-2 bg-red-500 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
              </div>
            }
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div class="flex items-center gap-2">
               <button (click)="toggleListening()" 
                       class="px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-2"
                       [class.bg-white]="dictation.isListening()"
                       [class.border-gray-300]="dictation.isListening()"
                       [class.text-gray-700]="dictation.isListening()"
                       [class.hover:bg-gray-50]="dictation.isListening()"
                       [class.bg-red-600]="!dictation.isListening()"
                       [class.border-transparent]="!dictation.isListening()"
                       [class.text-white]="!dictation.isListening()"
                       [class.hover:bg-red-700]="!dictation.isListening()">
                  @if (dictation.isListening()) {
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    Pause
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                    Resume
                  }
               </button>
               @if (dictation.permissionError(); as error) {
                 <span class="text-xs text-red-600">{{ error }}</span>
               }
            </div>

            <div class="flex items-center gap-3">
              <button (click)="cancel()" class="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 uppercase tracking-wider transition-colors">
                Cancel
              </button>
              <button (click)="accept()" class="px-6 py-2 bg-[#1C1C1C] text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-[#333] transition-colors shadow-sm">
                Insert Text
              </button>
            </div>
          </div>

        </div>
      </div>
    }
  `
})
export class DictationModalComponent implements OnDestroy {
  dictation = inject(DictationService);
  currentText = signal('');
  interimText = signal('');

  constructor() {
    // Register to receive updates from the service
    this.dictation.registerResultHandler((text, isFinal) => {
      if (isFinal) {
        // Append final text
        const current = this.currentText();
        const needsSpace = current.length > 0 && !current.endsWith(' ');
        this.currentText.set(current + (needsSpace ? ' ' : '') + text);
        this.interimText.set('');
      } else {
        // Update interim text display
        this.interimText.set(text);
      }
    });

    // Reset text when modal opens
    effect(() => {
      if (this.dictation.isModalOpen()) {
        untracked(() => {
          this.currentText.set(this.dictation.initialText());
          this.interimText.set('');
        });
        this.dictation.startRecognition();
      }
    });
  }

  ngOnDestroy() {
    this.dictation.stopRecognition();
  }

  updateText(event: Event) {
    this.currentText.set((event.target as HTMLTextAreaElement).value);
  }

  toggleListening() {
    if (this.dictation.isListening()) {
      this.dictation.stopRecognition();
    } else {
      this.dictation.startRecognition();
    }
  }

  cancel() {
    this.dictation.cancel();
  }

  accept() {
    this.dictation.accept(this.currentText());
  }
}
