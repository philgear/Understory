import { Component, ChangeDetectionStrategy, inject, signal, effect, OnDestroy, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DictationService } from '../services/dictation.service';

import { UnderstoryButtonComponent } from './shared/understory-button.component';
import { UnderstoryInputComponent } from './shared/understory-input.component';

@Component({
  selector: 'app-dictation-modal',
  standalone: true,
  imports: [CommonModule, UnderstoryButtonComponent, UnderstoryInputComponent],
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
            <understory-button 
              variant="ghost" 
              size="sm"
              (click)="cancel()" 
              icon="M18 6L6 18M6 6l12 12">
            </understory-button>
          </div>

          <!-- Content -->
          <div class="p-6 relative">
            <understory-input
              type="textarea"
              [value]="currentText()"
              (valueChange)="updateTextManual($event)"
              [rows]="10"
              placeholder="Start speaking or type here..."
              class="w-full">
            </understory-input>
            
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
               <understory-button 
                 (click)="toggleListening()" 
                 [variant]="dictation.isListening() ? 'secondary' : 'danger'"
                 size="sm"
                 [icon]="dictation.isListening() ? 'M6 4h4v16H6V4zm8 0h4v16h-4V4z' : 'M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zM17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z'">
                 {{ dictation.isListening() ? 'Pause' : 'Resume' }}
               </understory-button>
               @if (dictation.permissionError(); as error) {
                 <span class="text-xs text-red-600">{{ error }}</span>
               }
            </div>

            <div class="flex items-center gap-3">
               <understory-button 
                 variant="ghost" 
                 size="sm" 
                 (click)="cancel()">
                 Cancel
               </understory-button>
               <understory-button 
                 variant="primary" 
                 size="sm" 
                 (click)="accept()">
                 Insert Text
               </understory-button>
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

  updateTextManual(text: string) {
    this.currentText.set(text);
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
