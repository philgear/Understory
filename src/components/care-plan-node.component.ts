import { Component, ChangeDetectionStrategy, inject, signal, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarePlanNode, CarePlanNodeItem } from './analysis-report.types';
import { DictationService } from '../services/dictation.service';
import { UnderstoryBadgeComponent } from './shared/understory-badge.component';
import { ClinicalIcons } from '../assets/clinical-icons';
import { BadgeSeverity } from './shared/understory-badge.component';

import { UnderstoryButtonComponent } from './shared/understory-button.component';
import { UnderstoryInputComponent } from './shared/understory-input.component';

@Component({
  selector: 'app-care-plan-node',
  standalone: true,
  imports: [CommonModule, UnderstoryBadgeComponent, UnderstoryButtonComponent, UnderstoryInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative group/node mb-4" [class.mb-2]="type() === 'list-item'">
      @if (type() === 'paragraph') {
        <p [innerHTML]="node().rawHtml" 
           [class.bracket-removed]="node().bracketState === 'removed'"
           [class.bracket-added]="node().bracketState === 'added'"
           (dblclick)="onDoubleClick()"></p>
      } @else if (type() === 'list-item') {
        <li class="relative group/item"
            [class.bracket-removed]="node().bracketState === 'removed'"
            [class.bracket-added]="node().bracketState === 'added'"
            (dblclick)="onDoubleClick()">
          <span [innerHTML]="listItemHtml()" class="block"></span>
        </li>
      }

      <!-- Suggestions & Proposals -->
      @if (node().suggestions?.length || node().proposedText) {
        <div class="mt-2 flex flex-col gap-2 no-print">
          @if (node().suggestions?.length) {
            <div class="flex flex-wrap gap-1.5 align-center">
              <span class="text-xs font-bold text-gray-400 uppercase tracking-widest mr-1 mt-1">Suggestions:</span>
              @for (sugg of node().suggestions; track sugg) {
                <understory-badge 
                  [label]="sugg" 
                  severity="info" 
                  [hasIcon]="true"
                  class="cursor-pointer hover:scale-105 transition-transform"
                  (click)="insertSuggestion(sugg)">
                  <div badge-icon [innerHTML]="ClinicalIcons.Suggestion"></div>
                </understory-badge>
              }
            </div>
          }
          
          @if (node().proposedText && !proposalAccepted()) {
            <div class="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-amber-700 uppercase tracking-widest">Proposed Improvement:</span>
                <understory-button (click)="acceptProposal()" 
                                  variant="primary"
                                  size="sm"
                                  icon="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z">
                  Accept Change
                </understory-button>
              </div>
              <p class="text-amber-900 italic">"{{ node().proposedText }}"</p>
            </div>
          }
        </div>
      }

      <!-- Verification Issues -->
      @if (node().verificationStatus !== 'verified' && node().verificationIssues?.length) {
        <div class="mt-2 p-3 rounded-lg border flex flex-col gap-2 no-print"
             [class.bg-red-50/50]="node().verificationStatus === 'error'"
             [class.border-red-100]="node().verificationStatus === 'error'"
             [class.bg-amber-50/50]="node().verificationStatus === 'warning'"
             [class.border-amber-100]="node().verificationStatus === 'warning'">
          
          <div class="flex items-center gap-2">
            <understory-badge 
              [label]="node().verificationStatus === 'error' ? 'Critical Accuracy Error' : 'Accuracy Warning'" 
              [severity]="node().verificationStatus === 'error' ? 'error' : 'warning'"
              [hasIcon]="true">
              <div badge-icon [innerHTML]="ClinicalIcons.Risk"></div>
            </understory-badge>
            <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Medical Audit Result</span>
          </div>

          <div class="pl-1 flex flex-col gap-1">
            @for (issue of node().verificationIssues; track issue.message) {
              <div class="flex items-start gap-2 text-xs">
                <span [class.text-red-600]="node().verificationStatus === 'error'" [class.text-amber-600]="node().verificationStatus === 'warning'">•</span>
                <span class="text-gray-700 leading-relaxed">{{ issue.message }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Hover Toolbar -->
      <div class="absolute -left-12 top-0 opacity-0 group-hover/node:opacity-100 group-hover/item:opacity-100 transition-opacity flex flex-col gap-1 z-10 no-print">
        <understory-button (click)="toggleBracket()" 
                          variant="ghost" 
                          size="sm" 
                          class="bg-white shadow-sm border border-gray-200"
                          ariaLabel="Finalize Action"
                          [icon]="ClinicalIcons.Verified">
        </understory-button>
        <understory-button (click)="onDoubleClick()" 
                          variant="ghost" 
                          size="sm" 
                          class="bg-white shadow-sm border border-gray-200"
                          ariaLabel="Add Note"
                          [icon]="ClinicalIcons.Assessment">
        </understory-button>
      </div>

      <!-- Note Editor -->
      @if (node().showNote) {
        <div class="mt-2 ml-4 p-3 bg-[#f9fbf7] border-l-2 border-[#416B1F] rounded-r-md">
          <understory-input
            type="textarea"
            [rows]="2"
            [placeholder]="'Add medical rationale...'"
            [value]="node().note || ''"
            (valueChange)="updateNote($event)">
          </understory-input>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    :host([role="listitem"]) { display: list-item; list-style: none; }
    .bracket-removed { text-decoration: line-through; opacity: 0.5; }
    .bracket-added { background-color: #f0fdf4; border-bottom: 1px solid #4ade80; }
  `]
})
export class CarePlanNodeComponent {
  node = input.required<CarePlanNode>();
  nodeItem = input<CarePlanNodeItem>({} as any);
  type = input<'paragraph' | 'list-item'>('paragraph');

  update = output<{ key: string, note?: string, bracketState?: 'normal' | 'added' | 'removed', acceptedProposal?: string }>();

  proposalAccepted = signal(false);
  listItemHtml = computed(() => this.node().rawHtml || (this.node() as any).html || '');

  private dictation = inject(DictationService);

  onDoubleClick() {
    this.update.emit({
      key: this.node().key,
      note: this.node().note || ''
    });
  }

  toggleBracket() {
    let next: 'normal' | 'added' | 'removed' = 'added';
    if (this.node().bracketState === 'added') next = 'removed';
    else if (this.node().bracketState === 'removed') next = 'normal';

    this.update.emit({ key: this.node().key, bracketState: next });
  }

  updateNote(text: string) {
    this.update.emit({ key: this.node().key, note: text });
  }

  insertSuggestion(sugg: string) {
    const currentNote = this.node().note || '';
    const newNote = currentNote ? `${currentNote}\n${sugg}` : sugg;
    this.update.emit({ key: this.node().key, note: newNote });
  }

  acceptProposal() {
    if (this.node().proposedText) {
      this.proposalAccepted.set(true);
      this.update.emit({
        key: this.node().key,
        acceptedProposal: this.node().proposedText
      });
    }
  }

  protected readonly ClinicalIcons = ClinicalIcons;
}
