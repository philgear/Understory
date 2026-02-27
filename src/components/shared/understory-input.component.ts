import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'understory-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col gap-1.5 w-full">
      @if (label()) {
        <label [for]="id()" class="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">
          {{ label() }}
        </label>
      }
      
      <div class="relative group">
        @if (icon()) {
          <div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors h-4 w-4 flex items-center justify-center" [innerHTML]="icon()"></div>
        }
        
        @if (type() === 'textarea') {
          <textarea
            [id]="id()"
            [placeholder]="placeholder()"
            [disabled]="disabled()"
            [ngModel]="value()"
            (ngModelChange)="onModelChange($event)"
            [class]="inputClasses()"
            [rows]="rows()"
          ></textarea>
        } @else {
          <input
            [id]="id()"
            [type]="type()"
            [placeholder]="placeholder()"
            [disabled]="disabled()"
            [ngModel]="value()"
            (ngModelChange)="onModelChange($event)"
            [class]="inputClasses()"
            class="input-base"
          />
        }
        
        @if (error()) {
          <div class="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
        }
      </div>
      
      @if (error() || hint()) {
        <p [class]="error() ? 'text-red-500' : 'text-gray-400'" class="text-xs font-medium tracking-wide ml-1">
          {{ error() || hint() }}
        </p>
      }
    </div>
  `,
  styles: [`
    .input-base {
      width: 100%;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: #111827;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(8px);
    }

    .input-base:focus {
      outline: none;
      border-color: #689F38;
      background: #FFFFFF;
      box-shadow: 0 0 0 4px rgba(104, 159, 56, 0.1);
    }

    .input-base:disabled {
      background: #F9FAFB;
      cursor: not-allowed;
      border-color: #F3F4F6;
      color: #9CA3AF;
    }

    .input-error {
      border-color: #FCA5A5;
      background: #FFF5F5;
    }
    
    .input-error:focus {
      border-color: #EF4444;
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
    }

    .has-icon {
      padding-left: 2.5rem;
    }

    .variant-minimal {
      background: transparent;
      border-color: transparent;
      padding-left: 0;
      padding-right: 0;
      backdrop-filter: none;
      font-size: 14px;
    }

    .variant-minimal:focus {
      background: transparent;
      border-color: transparent;
      box-shadow: none;
    }

    input.input-base {
      padding: 0.75rem 1rem;
    }

    textarea.input-base {
      padding: 1rem;
      resize: vertical;
      min-height: 100px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnderstoryInputComponent {
  id = input<string>(`input-${Math.random().toString(36).substr(2, 9)}`);
  label = input<string>('');
  placeholder = input<string>('');
  type = input<'text' | 'email' | 'password' | 'textarea' | 'number'>('text');
  variant = input<'default' | 'minimal'>('default');
  disabled = input<boolean>(false);
  error = input<string>('');
  hint = input<string>('');
  icon = input<string>('');
  rows = input<number>(4);

  value = input<string>('');
  valueChange = output<string>();

  onModelChange(val: string) {
    this.valueChange.emit(val);
  }

  inputClasses(): string {
    return [
      this.error() ? 'input-error' : '',
      this.icon() ? 'has-icon' : '',
      this.variant() === 'minimal' ? 'variant-minimal' : ''
    ].join(' ');
  }
}
