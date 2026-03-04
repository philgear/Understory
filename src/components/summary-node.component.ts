import {
  Component, ChangeDetectionStrategy, inject, signal, input, output,
  computed, OnDestroy, ViewChild, ElementRef, AfterViewChecked,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SummaryNode, SummaryNodeItem } from './analysis-report.types';
import { DictationService } from '../services/dictation.service';
import { PocketGallBadgeComponent } from './shared/pocket-gall-badge.component';
import { ClinicalIcons } from '../assets/clinical-icons';
import { PocketGallButtonComponent } from './shared/pocket-gall-button.component';
import { PocketGallInputComponent } from './shared/pocket-gall-input.component';
import { ClinicalIntelligenceService } from '../services/clinical-intelligence.service';
import { MarkdownService } from '../services/markdown.service';
import { RichMediaService, RichMediaCard } from '../services/rich-media.service';
import { Medical3DViewerComponent } from './medical-3d-viewer.component';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClaimUnit {
  id: string;
  type: 'paragraph' | 'list-item' | 'heading' | 'other';
  text: string; // plain text for drilling
  html: string; // rendered HTML for display
}

interface InlineChatEntry {
  role: 'user' | 'model';
  text: string;
  html?: string;
  claims?: ClaimUnit[];    // parsed claim units for model messages
  richCards?: RichMediaCard[]; // resolved rich media cards
}

interface BracketedClaim {
  id: string;
  text: string;
  drillContext?: string; // what breadcrumb level it came from
}

// ─── Helper: Parse HTML → ClaimUnits ─────────────────────────────────────────

function parseHtmlToClaims(html: string): ClaimUnit[] {
  const claims: ClaimUnit[] = [];
  let idx = 0;

  // Split at block-level HTML boundaries
  // Capture content of <p>, <li>, <h2>, <h3>, <h4> as claim units
  const blockPattern = /<(p|li|h2|h3|h4)([^>]*)>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const innerHtml = match[3].trim();
    const innerText = innerHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!innerText || innerText.length < 8) continue;

    let type: ClaimUnit['type'] = 'other';
    if (tag === 'p') type = 'paragraph';
    else if (tag === 'li') type = 'list-item';
    else if (tag === 'h2' || tag === 'h3' || tag === 'h4') type = 'heading';

    claims.push({
      id: `claim-${Date.now()}-${idx++}`,
      type,
      text: innerText.slice(0, 300),
      html: innerHtml,
    });
  }

  // Fallback: if no block tags found, treat whole response as one claim
  if (claims.length === 0) {
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.length > 0) {
      claims.push({ id: `claim-${Date.now()}-0`, type: 'paragraph', text, html });
    }
  }

  return claims;
}

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-summary-node',
  standalone: true,
  imports: [CommonModule, FormsModule, PocketGallBadgeComponent, PocketGallButtonComponent, PocketGallInputComponent, Medical3DViewerComponent, SafeHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: [`
        :host { display: block; }
        .bracket-removed { text-decoration: line-through; opacity: 0.5; }
        .bracket-added   { background-color: #f0fdf4; border-bottom: 1px solid #4ade80; }

        /* ─── Evidence Popover ─────────────────── */
        .evidence-popover {
            position: absolute; left: 0; top: calc(100% + 5px); z-index: 40;
            width: 260px; background: #1C1C1C; color: #F9FAFB;
            border-radius: 10px; padding: 11px 13px;
            box-shadow: 0 12px 28px rgba(0,0,0,.2), 0 0 0 1px rgba(255,255,255,.06);
            pointer-events: none; opacity: 0; transform: translateY(4px);
            transition: opacity .13s, transform .13s;
        }
        .evidence-popover::before {
            content:''; position:absolute; top:-5px; left:22px;
            width:10px; height:10px; background:#1C1C1C;
            transform:rotate(45deg); border-radius:2px 0 0 0;
        }
        .node-wrapper:hover .evidence-popover { opacity:1; pointer-events:auto; transform:translateY(0); }
        .node-wrapper.has-inline-chat .evidence-popover { display:none; }
        .evidence-label { font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:.12em; color:#9CA3AF; margin-bottom:5px; }
        .evidence-hint  { font-size:11px; line-height:1.5; color:#D1D5DB; margin-bottom:8px; }
        .evidence-status-row { display:flex; align-items:center; gap:6px; padding-top:7px; border-top:1px solid rgba(255,255,255,.08); }
        .evidence-status-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
        .evidence-status-dot--verified   { background:#22C55E; }
        .evidence-status-dot--warning    { background:#F59E0B; }
        .evidence-status-dot--error      { background:#EF4444; }
        .evidence-status-dot--unverified { background:#6B7280; }
        .evidence-status-text { font-size:10px; color:#9CA3AF; }

        /* ─── Hover Toolbar ─────────────────────── */
        .node-toolbar {
            opacity:0;
            display:flex; flex-direction:row; gap:6px; z-index:20;
            padding: 0;
            max-height: 0;
            overflow: hidden;
            transition: opacity .2s ease-out .4s, max-height .2s ease-out .4s, padding .2s ease-out .4s;
        }
        .node-wrapper:hover .node-toolbar {
            opacity:1;
            max-height: 40px;
            padding: 6px 0;
            transition-delay: 0s;
        }

        /* ─── Inline Chat ────────────────────────── */
        .inline-chat {
            margin-top:8px; border-radius:10px;
            border:1px solid #E5E7EB; background:#FAFAFA; overflow:hidden;
            animation: chat-expand .2s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes chat-expand {
            from { opacity:0; transform:translateY(-6px) scaleY(.96); }
            to   { opacity:1; transform:translateY(0) scaleY(1); }
        }

        /* Chat header — always visible, sticky within the right panel scroll */
        .inline-chat-header {
            display:flex; align-items:center; gap:7px; padding:8px 12px;
            background:#F3F4F6; border-bottom:1px solid #E5E7EB;
        }
        .inline-chat-title { flex:1; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#6B7280; }
        .inline-chat-section { font-size:9px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:#689F38; background:#F0F7E8; border:1px solid #C8E6C9; border-radius:10px; padding:2px 7px; }

        /* ─── Breadcrumb ─────────────────────────── */
        .breadcrumb-bar {
            display:flex; align-items:center; gap:4px; flex-wrap:wrap;
            padding:5px 12px; background:#F8F8F8; border-bottom:1px solid #E5E7EB;
        }
        .breadcrumb-item {
            font-size:9px; font-weight:600; color:#9CA3AF;
            cursor:pointer; border:none; background:none; padding:1px 0;
            max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
            transition:color .12s;
        }
        .breadcrumb-item:hover  { color:#374151; }
        .breadcrumb-item.active { color:#689F38; cursor:default; }
        .breadcrumb-sep { font-size:9px; color:#D1D5DB; flex-shrink:0; }

        /* Chat body: no internal scroll — parent right-panel handles all scrolling */
        .inline-chat-body { padding:10px 12px; display:flex; flex-direction:column; gap:8px; }

        /* ─── Messages ───────────────────────────── */
        .inline-msg { display:flex; gap:7px; align-items:flex-start; }
        .inline-msg--user { flex-direction:row-reverse; }
        .inline-avatar {
            flex-shrink:0; width:20px; height:20px; border-radius:50%;
            background:#1C1C1C; color:white;
            display:flex; align-items:center; justify-content:center; margin-top:1px;
        }
        .inline-bubble {
            font-size:11.5px; line-height:1.6; color:#374151;
            background:#FFFFFF; border:1px solid #E5E7EB;
            border-radius:8px 8px 8px 2px; padding:6px 10px; width: 100%;
            max-width:calc(100% - 30px);
        }
        .inline-msg--user .inline-bubble {
            background:#1C1C1C; color:#FFFFFF; border-color:transparent;
            border-radius:8px 8px 2px 8px;
        }

        /* ─── Claim Units (AI response parsing) ──── */
        .claim-unit {
            position:relative; border-radius:6px;
            padding:4px 6px 4px 8px; margin:2px 0;
            transition:background .12s;
            border-left:2px solid transparent;
        }
        .claim-unit:hover { background:#F0F7E8; border-left-color:#C8E6C9; }
        .claim-unit--heading { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#1C1C1C; border-left:none; background:transparent !important; padding-top:8px; }

        /* Claim micro-toolbar (appears on hover) */
        .claim-toolbar {
            position:absolute; right:4px; top:50%; transform:translateY(-50%);
            display:flex; gap:2px; align-items:center;
            opacity:0; transition:opacity .1s; pointer-events:none;
        }
        .claim-unit:hover .claim-toolbar { opacity:1; pointer-events:auto; }
        .claim-action {
            width:20px; height:20px; border-radius:4px; border:none;
            background:rgba(255,255,255,.9); cursor:pointer;
            display:flex; align-items:center; justify-content:center;
            box-shadow:0 1px 3px rgba(0,0,0,.12); transition:all .1s;
            flex-shrink:0;
        }
        .claim-action:hover { transform:scale(1.12); }
        .claim-action--bracket { color:#689F38; }
        .claim-action--bracket:hover { background:#F0F7E8; }
        .claim-action--drill   { color:#3B82F6; }
        .claim-action--drill:hover   { background:#EFF6FF; }
        .claim-action--bracketed { color:#FFFFFF !important; background:#689F38 !important; cursor:default; }

        /* Claim unit content padding when toolbar is shown */
        .claim-unit:hover .claim-content { padding-right:46px; }
        .claim-content { display:block; }

        /* ─── Bracketed Claims Panel ─────────────── */
        .bracketed-panel {
            padding:7px 12px; background:#F0F7E8;
            border-top:1px solid #C8E6C9;
            animation: chat-expand .15s ease;
        }
        .bracketed-panel-label { font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:.12em; color:#689F38; margin-bottom:6px; display:flex; align-items:center; gap:5px; }
        .bracketed-claim-item {
            display:flex; align-items:flex-start; gap:6px;
            padding:4px 0; border-bottom:1px solid rgba(104,159,56,.15);
        }
        .bracketed-claim-item:last-child { border-bottom:none; }
        .bracketed-claim-text { flex:1; font-size:10.5px; line-height:1.5; color:#374151; }
        .bracketed-claim-source { font-size:8px; color:#9CA3AF; margin-top:1px; }
        .bracketed-claim-remove {
            flex-shrink:0; width:14px; height:14px; border-radius:3px; border:none;
            background:none; color:#9CA3AF; cursor:pointer; display:flex;
            align-items:center; justify-content:center; transition:color .1s;
        }
        .bracketed-claim-remove:hover { color:#EF4444; }

        /* ─── Drill context banner ───────────────── */
        .drill-banner {
            display:flex; align-items:center; gap:6px;
            padding:6px 12px; background:#EFF6FF; border-top:1px solid #BFDBFE;
            border-bottom:1px solid #BFDBFE; font-size:10px; color:#374151;
        }
        .drill-banner-label { font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#3B82F6; }
        .drill-banner-text { flex:1; font-style:italic; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .drill-banner-clear { font-size:8px; font-weight:600; color:#3B82F6; cursor:pointer; border:none; background:none; padding:0; }

        /* ─── Suggestion pills ───────────────────── */
        .inline-pills { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 12px 0; border-top: 1px solid #F3F4F6; }
        .inline-pill {
            font-family: 'Inter', system-ui, sans-serif;
            font-size: 8px; font-weight: 700; color: #1C1C1C;
            text-transform: uppercase; letter-spacing: 0.1em;
            background: transparent; border: 0.5pt solid #1C1C1C; border-radius: 0;
            padding: 4px 8px; cursor: pointer; transition: all 0.15s;
            display: inline-flex; align-items: center; gap: 5px;
        }
        .inline-pill:hover { background: #1C1C1C; color: #FFFFFF; }

        /* ─── Thinking dots ──────────────────────── */
        .thinking-dots { display:flex; gap:3px; align-items:center; padding:4px 0; }
        .thinking-dots span { display:inline-block; width:5px; height:5px; background:#9CA3AF; border-radius:50%; animation:dot-pulse 1.2s infinite ease-in-out; }
        .thinking-dots span:nth-child(2) { animation-delay:.2s; }
        .thinking-dots span:nth-child(3) { animation-delay:.4s; }
        @keyframes dot-pulse { 0%,80%,100%{transform:scale(.8);opacity:.4}40%{transform:scale(1);opacity:1} }

        /* ─── Input row ──────────────────────────── */
        .inline-input-container { border-top:1px solid #E5E7EB; background:#FAFAFA; border-radius: 0 0 10px 10px; }
        .inline-file-preview { display:flex; flex-wrap:wrap; gap:5px; padding:6px 10px 0; }
        .inline-file-chip { display:flex; align-items:center; gap:4px; background:#F3F4F6; border:1px solid #D1D5DB; border-radius:4px; padding:2px 6px; font-size:9px; color:#374151; max-width:140px; }
        .inline-file-name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .inline-file-remove { background:none; border:none; color:#9CA3AF; cursor:pointer; padding:0; display:flex; align-items:center; justify-content:center; }
        .inline-file-remove:hover { color:#EF4444; }
        .inline-input-row { display:flex; gap:6px; padding:7px 10px; align-items:center; }
        .inline-attach { flex-shrink:0; width:28px; height:28px; border-radius:50%; background:transparent; color:#9CA3AF; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:color .13s, background .13s; }
        .inline-attach:hover:not(:disabled) { color:#1C1C1C; background:#E5E7EB; }
        .inline-attach:disabled { opacity:.35; cursor:not-allowed; }
        .inline-input {
            flex:1; font-family:inherit; font-size:11.5px; color:#1C1C1C;
            background:#FFFFFF; border:1px solid #E5E7EB; border-radius:16px;
            padding:6px 12px; outline:none; transition:border-color .13s;
        }
        .inline-input:focus { border-color:#689F38; }
        .inline-send {
            flex-shrink:0; width:28px; height:28px; border-radius:50%;
            background:#1C1C1C; color:white; border:none; cursor:pointer;
            display:flex; align-items:center; justify-content:center; transition:background .13s;
        }
        .inline-send:hover:not(:disabled) { background:#333; }
        .inline-send:disabled { opacity:.35; cursor:not-allowed; }

        /* ─── Markdown in bubbles ────────────────── */
        .inline-bubble h2,.inline-bubble h3,.inline-bubble h4 { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; margin:8px 0 3px; color:#1C1C1C; }
        .inline-bubble h2:first-child,.inline-bubble h3:first-child,.inline-bubble h4:first-child { margin-top:0; }
        .inline-bubble p { margin-bottom:4px; }
        .inline-bubble ul,.inline-bubble ol { padding-left:14px; margin-bottom:4px; }
        .inline-bubble li { margin-bottom:2px; }
        .inline-bubble strong { font-weight:700; color:#1C1C1C; }
        .inline-msg--user .inline-bubble strong { color:#FFFFFF; }
    `],
  template: `
    <div class="relative node-wrapper group/node mb-4"
         [class.has-inline-chat]="showChat()"
         [class.mb-2]="type() === 'list-item'">

      <!-- ─── Main Node Content ──────────────── -->
      @if (type() === 'paragraph') {
        <p [innerHTML]="node().rawHtml | safeHtml"
           [class.bracket-removed]="node().bracketState === 'removed'"
           [class.bracket-added]="node().bracketState === 'added'"
           (dblclick)="onDoubleClick()"></p>
      } @else if (type() === 'list-item') {
        <div [class.bracket-removed]="node().bracketState === 'removed'"
             [class.bracket-added]="node().bracketState === 'added'"
             (dblclick)="onDoubleClick()">
          <span [innerHTML]="listItemHtml() | safeHtml" class="block"></span>
        </div>
      }

      <!-- ─── Evidence Popover ───────────────── -->
      <div class="evidence-popover no-print">
        <div class="evidence-label">Clinical Evidence</div>
        <div class="evidence-hint">
          @if (node().verificationIssues?.length) {
            {{ node().verificationIssues![0].message }}
          } @else {
            Hover to inspect · Click <strong style="color:#fff">Ask Agent</strong> to explore evidence inline.
          }
        </div>
        @if (node().verificationStatus) {
          <div class="evidence-status-row">
            <span class="evidence-status-dot"
              [class.evidence-status-dot--verified]="node().verificationStatus === 'verified'"
              [class.evidence-status-dot--warning]="node().verificationStatus === 'warning'"
              [class.evidence-status-dot--error]="node().verificationStatus === 'error'"
              [class.evidence-status-dot--unverified]="!node().verificationStatus || node().verificationStatus === 'unverified'">
            </span>
            <span class="evidence-status-text">
              {{ node().verificationStatus === 'verified' ? 'Verified against patient data'
               : node().verificationStatus === 'warning' ? 'Accuracy concern flagged'
               : node().verificationStatus === 'error' ? 'Critical accuracy error'
               : 'Verification pending' }}
            </span>
          </div>
        }
      </div>

      <!-- ─── Hover Toolbar ─────────────────── -->
      <div class="node-toolbar no-print">
        <pocket-gall-button (click)="toggleBracket()" variant="ghost" size="sm"
          class="bg-white shadow-sm border border-gray-200" ariaLabel="Finalize"
          [icon]="ClinicalIcons.Verified">
        </pocket-gall-button>
        <pocket-gall-button (click)="onDoubleClick()" variant="ghost" size="sm"
          class="bg-white shadow-sm border border-gray-200" ariaLabel="Add Note"
          [icon]="ClinicalIcons.Assessment">
        </pocket-gall-button>
        <pocket-gall-button (click)="toggleChat()" variant="ghost" size="sm"
          class="bg-white shadow-sm border border-gray-200"
          [class.text-green-600]="!showChat()" [class.text-gray-400]="showChat()"
          [ariaLabel]="showChat() ? 'Close Agent' : 'Ask Agent'"
          [icon]="showChat() ? ClinicalIcons.Clear : ClinicalIcons.EvidenceFocus">
        </pocket-gall-button>
      </div>

      <!-- ─── Suggestions & Proposals ─────────── -->
      @if (node().suggestions?.length || node().proposedText) {
        <div class="mt-2 flex flex-col gap-2 no-print">
          @if (node().suggestions?.length) {
            <div class="flex flex-wrap gap-1.5 align-center">
              <span class="text-xs font-bold text-gray-400 uppercase tracking-widest mr-1 mt-1">Suggestions:</span>
              @for (sugg of node().suggestions; track sugg) {
                <pocket-gall-badge [label]="sugg" severity="info" [hasIcon]="true"
                  class="cursor-pointer hover:scale-105 transition-transform"
                  (click)="insertSuggestion(sugg)">
                  <div badge-icon [innerHTML]="ClinicalIcons.Suggestion | safeHtml"></div>
                </pocket-gall-badge>
              }
            </div>
          }
          @if (node().proposedText && !proposalAccepted()) {
            <div class="bg-amber-50 border border-amber-100 rounded-sm p-3 text-sm">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-amber-700 uppercase tracking-widest">Proposed Improvement:</span>
                <pocket-gall-button (click)="acceptProposal()" variant="primary" size="sm"
                  icon="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z">
                  Accept Change
                </pocket-gall-button>
              </div>
              <p class="text-amber-900 italic">"{{ node().proposedText }}"</p>
            </div>
          }
        </div>
      }

      <!-- ─── Verification Issues ───────────── -->
      @if (node().verificationStatus !== 'verified' && node().verificationIssues?.length) {
        <div class="mt-2 p-3 rounded-sm border flex flex-col gap-2 no-print"
             [class.bg-red-50/50]="node().verificationStatus === 'error'"
             [class.border-red-100]="node().verificationStatus === 'error'"
             [class.bg-amber-50/50]="node().verificationStatus === 'warning'"
             [class.border-amber-100]="node().verificationStatus === 'warning'">
          <div class="flex items-center gap-2">
            <pocket-gall-badge
              [label]="node().verificationStatus === 'error' ? 'Critical Accuracy Error' : 'Accuracy Warning'"
              [severity]="node().verificationStatus === 'error' ? 'error' : 'warning'" [hasIcon]="true">
              <div badge-icon [innerHTML]="ClinicalIcons.Risk | safeHtml"></div>
            </pocket-gall-badge>
            <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Medical Audit Result</span>
          </div>
          <div class="pl-1 flex flex-col gap-1">
            @for (issue of node().verificationIssues; track issue.message) {
              <div class="flex items-start gap-2 text-xs">
                <span [class.text-red-600]="node().verificationStatus === 'error'"
                      [class.text-amber-600]="node().verificationStatus === 'warning'">•</span>
                <span class="text-gray-700 leading-relaxed">{{ issue.message }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- ─── Note Editor ────────────────────── -->
      @if (node().showNote) {
        <div class="mt-2 ml-4 p-3 bg-[#f9fbf7] border-l-2 border-[#416B1F] rounded-r-sm">
          <pocket-gall-input type="textarea" [rows]="2" [placeholder]="'Add medical rationale...'"
            [value]="node().note || ''" (valueChange)="updateNote($event)">
          </pocket-gall-input>
        </div>
      }

      <!-- ─── Print-Only: Evidence Trail (Dieter Rams) ─── -->
      @if (bracketedClaims().length > 0) {
        <div class="print-only evidence-trail-print">
          <div class="et-header">
            <span class="et-label">AI Evidence Trail</span>
            <span class="et-count">{{ bracketedClaims().length }} claim{{ bracketedClaims().length > 1 ? 's' : '' }} bracketed</span>
          </div>
          <ol class="et-list">
            @for (claim of bracketedClaims(); track claim.id; let i = $index) {
              <li class="et-item">
                <span class="et-num">{{ i + 1 }}</span>
                <div class="et-content">
                  <span class="et-text">{{ claim.text }}</span>
                  @if (claim.drillContext) {
                    <span class="et-drill">↳ Drilled from: {{ claim.drillContext }}</span>
                  }
                </div>
              </li>
            }
          </ol>
        </div>
      }

      <!-- ─── Inline Agent Chat ──────────────── -->
      @if (showChat()) {
        <div class="inline-chat no-print" #chatContainer>

          <!-- Header -->
          <div class="inline-chat-header">
            <span class="flex items-center justify-center bg-[#F0F7E8] text-[#689F38] rounded-sm p-0.5 border border-[#C8E6C9]" [innerHTML]="ClinicalIcons.EvidenceFocus | safeHtml"></span>
            <span class="inline-chat-title ml-1">Evidence Focus</span>
            <span class="inline-chat-section">{{ sectionTitle() }}</span>
            @if (chatIsLoading()) {
              <div class="w-3 h-3 border-2 border-gray-300 border-t-[#689F38] rounded-sm animate-spin ml-auto"></div>
            }
          </div>

          <!-- Breadcrumb trail -->
          @if (drillStack().length > 0) {
            <div class="breadcrumb-bar">
              <button class="breadcrumb-item" (click)="popToRoot()">Overview</button>
              @for (crumb of drillStack(); track $index; let last = $last) {
                <span class="breadcrumb-sep">›</span>
                <button class="breadcrumb-item" [class.active]="last"
                        (click)="popToLevel($index)">
                  {{ crumb.slice(0, 28) }}{{ crumb.length > 28 ? '…' : '' }}
                </button>
              }
            </div>
          }

          <!-- Active drill context banner -->
          @if (activeDrillText()) {
            <div class="drill-banner">
              <span class="drill-banner-label">Drilling into</span>
              <span class="drill-banner-text">{{ activeDrillText() }}</span>
              <button class="drill-banner-clear" (click)="popToRoot()">✕ Clear</button>
            </div>
          }

          <!-- Messages -->
          <div class="inline-chat-body" #chatBody>
            @for (msg of chatHistory(); track $index) {

              @if (msg.role === 'user') {
                <div class="inline-msg inline-msg--user">
                  <div class="inline-bubble" [innerHTML]="(msg.html || msg.text) | safeHtml"></div>
                </div>
              } @else {
                <!-- Model message: render as interactive claim units -->
                <div class="inline-msg">
                  <div class="inline-avatar">
                    <svg viewBox="0 -960 960 960" fill="currentColor" width="11" height="11">
                      <path d="M480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Z"/>
                    </svg>
                  </div>
                  <div class="inline-bubble" style="padding: 2px 8px;">
                    @if (msg.claims && msg.claims.length > 0) {
                      @for (claim of msg.claims; track claim.id) {
                        <div class="claim-unit" [class.claim-unit--heading]="claim.type === 'heading'">
                          <span class="claim-content" [innerHTML]="(claim.type === 'list-item'
                            ? '• ' + claim.html
                            : claim.html) | safeHtml"></span>
                          @if (claim.type !== 'heading') {
                            <div class="claim-toolbar">
                              <!-- Bracket / extract button -->
                              @if (isBracketed(claim.id)) {
                                <button class="claim-action claim-action--bracketed" title="Bracketed into plan">
                                  <svg viewBox="0 -960 960 960" fill="currentColor" width="8" height="8">
                                    <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
                                  </svg>
                                </button>
                              } @else {
                                <button class="claim-action claim-action--bracket"
                                        title="Bracket this claim into care plan"
                                        (click)="bracketClaim(claim)">
                                  <svg viewBox="0 -960 960 960" fill="currentColor" width="9" height="9">
                                    <path d="M440-280h80v-160h160v-80H520v-160h-80v160H280v80h160v160Z"/>
                                  </svg>
                                </button>
                              }
                              <!-- Drill deeper button -->
                              <button class="claim-action claim-action--drill"
                                      title="Drill deeper into this claim"
                                      [disabled]="chatIsLoading()"
                                      (click)="drillInto(claim)">
                                <svg viewBox="0 -960 960 960" fill="currentColor" width="9" height="9">
                                  <path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/>
                                </svg>
                              </button>
                            </div>
                          }
                        </div>
                      }
                    } @else {
                      <div [innerHTML]="(msg.html || msg.text) | safeHtml"></div>
                    }

                    <!-- ─── Rich Media Cards ──────────────────────── -->
                    @if (msg.richCards && msg.richCards.length > 0) {
                      <div class="rm-panel">
                        @for (card of msg.richCards; track card.query) {

                          <!-- 3D Model -->
                          @if (card.kind === 'model-3d' && card.models?.length) {
                            <div class="rm-card rm-card--model">
                              <div class="rm-card-header">
                                <svg viewBox="0 -960 960 960" fill="currentColor" width="12" height="12"><path d="M440-183v-274L200-596v274l240 139Zm80 0 240-139v-274L520-457v274Zm-40-343 237-137-237-137-237 137 237 137ZM160-252q-19-11-29.5-29T120-321v-318q0-22 10.5-40t29.5-29l280-161q19-11 40-11t40 11l280 161q19 11 29.5 29t10.5 40v318q0 22-10.5 40T800-252L520-91q-19 11-40 11t-40-11L160-252Z"/></svg>
                                <span class="rm-card-title">{{ card.models[0].name }}</span>
                                <span class="rm-card-badge">3D Model</span>
                              </div>
                              <div class="rm-model-frame-wrap">
                                @defer (on viewport; prefetch on idle) {
                                  <app-medical-3d-viewer 
                                    [threejsId]="card.models[0].threejsId"
                                    [severity]="card.severity"
                                    [afflictionHighlight]="card.afflictionHighlight"
                                    [particles]="card.particles"
                                    class="rm-model-frame">
                                  </app-medical-3d-viewer>
                                } @placeholder {
                                  <div class="h-[200px] w-full flex items-center justify-center bg-[#FDFDFD] border border-[#EEEEEE] rounded-sm">
                                    <div class="w-6 h-6 rounded-sm border-2 border-gray-300 border-t-black animate-spin"></div>
                                  </div>
                                }
                              </div>
                              <div class="rm-card-footer">Interactive Volume · Procedural Generation</div>
                            </div>
                          }

                          <!-- Image Gallery -->
                          @if (card.kind === 'image-gallery') {
                            <div class="rm-card rm-card--gallery">
                              <div class="rm-card-header">
                                <svg viewBox="0 -960 960 960" fill="currentColor" width="12" height="12"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-800v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Z"/></svg>
                                <span class="rm-card-title">Medical Illustrations: {{ card.query }}</span>
                                <span class="rm-card-badge">Wikimedia</span>
                              </div>
                              @if (card.loading) {
                                <div class="rm-loading">Searching Wikimedia Commons…</div>
                              } @else if (card.images?.length) {
                                <div class="rm-gallery-strip">
                                  @for (img of card.images; track img.url) {
                                    <a [href]="img.descriptionUrl" target="_blank" rel="noopener" class="rm-gallery-item">
                                      <img [src]="img.thumbUrl" [alt]="img.title" class="rm-gallery-img" loading="lazy">
                                      <span class="rm-gallery-caption">{{ img.title | slice:0:40 }}</span>
                                    </a>
                                  }
                                </div>
                              } @else {
                                <div class="rm-empty">No illustrations found for "{{ card.query }}"</div>
                              }
                              <div class="rm-card-footer">Public domain · Wikimedia Commons</div>
                            </div>
                          }

                          <!-- PubMed Citations -->
                          @if (card.kind === 'pubmed-refs') {
                            <div class="rm-card rm-card--pubmed">
                              <div class="rm-card-header">
                                <svg viewBox="0 -960 960 960" fill="currentColor" width="12" height="12"><path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/></svg>
                                <span class="rm-card-title">Research: {{ card.query }}</span>
                                <span class="rm-card-badge">PubMed</span>
                              </div>
                              @if (card.loading) {
                                <div class="rm-loading">Searching PubMed…</div>
                              } @else if (card.citations?.length) {
                                <div class="rm-citations">
                                  @for (cite of card.citations; track cite.pmid) {
                                    <a [href]="cite.url" target="_blank" rel="noopener" class="rm-citation">
                                      <div class="rm-citation-title">{{ cite.title }}</div>
                                      <div class="rm-citation-meta">{{ cite.authors }} · <em>{{ cite.journal }}</em> · {{ cite.year }}</div>
                                      <div class="rm-citation-pmid">PMID {{ cite.pmid }} ↗</div>
                                    </a>
                                  }
                                </div>
                              } @else {
                                <div class="rm-empty">No results found</div>
                              }
                              <div class="rm-card-footer">NIH National Library of Medicine</div>
                            </div>
                          }

                          <!-- PHIL Image -->
                          @if (card.kind === 'phil-image' && card.philImages?.length) {
                            <div class="rm-card rm-card--phil">
                              <div class="rm-card-header">
                                <svg viewBox="0 -960 960 960" fill="currentColor" width="12" height="12"><path d="M480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Z"/></svg>
                                <span class="rm-card-title">{{ card.philImages[0].title }}</span>
                                <span class="rm-card-badge">CDC PHIL</span>
                              </div>
                              <div class="rm-gallery-strip">
                                @for (img of card.philImages; track img.id) {
                                  <div class="rm-gallery-item">
                                    <img [src]="img.thumbUrl" [alt]="img.title" class="rm-gallery-img" loading="lazy"
                                         (error)="img.thumbUrl = img.url">
                                    <span class="rm-gallery-caption">{{ img.credit }}</span>
                                  </div>
                                }
                              </div>
                              <div class="rm-card-footer">Public domain · CDC Public Health Image Library</div>
                            </div>
                          }

                        }
                      </div>
                    }
                  </div>
                </div>
              }
            }

            @if (chatIsLoading()) {
              <div class="inline-msg">
                <div class="inline-avatar">
                  <svg viewBox="0 -960 960 960" fill="currentColor" width="11" height="11">
                    <path d="M480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Z"/>
                  </svg>
                </div>
                <div class="inline-bubble">
                  <div class="thinking-dots"><span></span><span></span><span></span></div>
                </div>
              </div>
            }
          </div>

          <!-- Suggestion pills (shown once after first response) -->
          @if (showSuggestions() && !chatIsLoading() && chatHistory().length > 0 && drillStack().length === 0) {
            <div class="inline-pills">
              @for (s of suggestionPills(); track s) {
                <pocket-gall-button variant="outline" size="xs" [icon]="ClinicalIcons.Suggestion" (clicked)="sendPill(s)">
                  {{ s }}
                </pocket-gall-button>
              }
              <!-- Rich media action pills -->
              <pocket-gall-button variant="secondary" size="xs" [icon]="ClinicalIcons.Image" (clicked)="requestImage()">
                Request Image
              </pocket-gall-button>
              <pocket-gall-button variant="secondary" size="xs" [icon]="ClinicalIcons.Model3D" (clicked)="request3DModel()">
                3D Model
              </pocket-gall-button>
              <pocket-gall-button variant="secondary" size="xs" [icon]="ClinicalIcons.Research" (clicked)="requestResearch()">
                Research
              </pocket-gall-button>
            </div>
          }

          <!-- Bracketed claims panel -->
          @if (bracketedClaims().length > 0) {
            <div class="bracketed-panel">
              <div class="bracketed-panel-label">
                <svg viewBox="0 -960 960 960" fill="currentColor" width="10" height="10">
                  <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
                </svg>
                {{ bracketedClaims().length }} Claim{{ bracketedClaims().length === 1 ? '' : 's' }} Bracketed into Plan
              </div>
              @for (claim of bracketedClaims(); track claim.id) {
                <div class="bracketed-claim-item">
                  <div class="flex-1">
                    <div class="bracketed-claim-text">{{ claim.text }}</div>
                    @if (claim.drillContext) {
                      <div class="bracketed-claim-source">from: {{ claim.drillContext.slice(0, 40) }}…</div>
                    }
                  </div>
                  <button class="bracketed-claim-remove" title="Remove" (click)="removeClaim(claim.id)">
                    <svg viewBox="0 -960 960 960" fill="currentColor" width="8" height="8">
                      <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360Z"/>
                    </svg>
                  </button>
                </div>
              }
            </div>
          }

          <!-- Input -->
          <div class="inline-input-container">
            @if (selectedFiles().length > 0) {
              <div class="inline-file-preview">
                @for (file of selectedFiles(); track $index) {
                  <div class="inline-file-chip">
                    <span class="inline-file-name" [title]="file.name">{{ file.name }}</span>
                    <button class="inline-file-remove" (click)="removeFile($index)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                }
              </div>
            }
            <div class="inline-input-row">
              <button class="inline-attach" (click)="triggerFileInput()" [disabled]="chatIsLoading()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </button>
              <input type="file" #fileInput (change)="onFileSelected($event)" multiple accept="image/*,video/*" class="hidden" style="display: none;">
              <input #chatInput class="inline-input" type="text"
                [(ngModel)]="chatInputText"
                [placeholder]="drillStack().length > 0 ? 'Ask about this specific claim…' : 'Ask a follow-up…'"
                (keydown.enter)="sendMessage()"
                [disabled]="chatIsLoading()">
              <button class="inline-send" (click)="sendMessage()"
                      [disabled]="chatIsLoading() || (!chatInputText.trim() && selectedFiles().length === 0)">
                <svg viewBox="0 -960 960 960" fill="currentColor" width="14" height="14">
                  <path d="M120-160v-240l320-80-320-80v-240l760 320-760 320Z"/>
                </svg>
              </button>
            </div>
          </div>
          <!-- Scroll anchor: scrollIntoView here to avoid inner scroll trap -->
          <div #chatBottom style="height:1px"></div>
        </div>
      }
    </div>
    `,
})
export class SummaryNodeComponent implements AfterViewChecked {
  node = input.required<SummaryNode>();
  nodeItem = input<SummaryNodeItem>({} as any);
  type = input<'paragraph' | 'list-item'>('paragraph');
  sectionTitle = input<string>('');

  update = output<{ key: string; note?: string; bracketState?: 'normal' | 'added' | 'removed'; acceptedProposal?: string }>();
  dictationToggle = output<void>();
  askAgent = output<{ nodeKey: string; nodeText: string; sectionTitle: string }>();

  @ViewChild('chatBottom') chatBottomRef!: ElementRef<HTMLDivElement>;
  @ViewChild('chatInput') chatInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('chatContainer') chatContainerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  private intel = inject(ClinicalIntelligenceService);
  private markdown = inject(MarkdownService);
  private dictation = inject(DictationService);
  private richMedia = inject(RichMediaService);
  private sanitizer = inject(DomSanitizer);

  safeEmbedUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  proposalAccepted = signal(false);
  listItemHtml = computed(() => this.node().rawHtml || (this.node() as any).html || '');

  // ─── Inline chat ─────────────────────────────
  showChat = signal(false);
  chatHistory = signal<InlineChatEntry[]>([]);
  chatIsLoading = signal(false);
  showSuggestions = signal(true);
  selectedFiles = signal<File[]>([]);
  chatInputText = '';

  // ─── Claim bracketing ────────────────────────
  bracketedClaims = signal<BracketedClaim[]>([]);
  bracketedIds = signal<Set<string>>(new Set());

  // ─── Drill stack (breadcrumb) ─────────────────
  drillStack = signal<string[]>([]);
  activeDrillText = computed(() => {
    const stack = this.drillStack();
    return stack.length > 0 ? stack[stack.length - 1] : null;
  });

  private sessionStarted = false;
  private needsScroll = false;

  suggestionPills = computed<string[]>(() => {
    const s = this.sectionTitle().toLowerCase();
    if (s.includes('overview') || s.includes('summary'))
      return ['What evidence supports this?', 'Alternative approaches?', 'Key risks?'];
    if (s.includes('protocol') || s.includes('functional') || s.includes('intervention'))
      return ['Dosing rationale?', 'Drug interactions?', 'Supporting trials?'];
    if (s.includes('monitoring') || s.includes('follow'))
      return ['What outcomes to track?', 'Warning signs?', 'How urgent?'];
    if (s.includes('education'))
      return ['Simplify for patient', 'Expected patient questions?'];
    return ['Clinical rationale?', 'Alternatives?', 'Contraindications?'];
  });

  ngAfterViewChecked() {
    if (this.needsScroll) { this.scrollBottom(); this.needsScroll = false; }
  }

  // ─── isBracketed ─────────────────────────────
  isBracketed(claimId: string): boolean {
    return this.bracketedIds().has(claimId);
  }

  // ─── Bracket a claim ─────────────────────────
  bracketClaim(claim: ClaimUnit) {
    if (this.isBracketed(claim.id)) return;
    const drill = this.activeDrillText();
    const newClaim: BracketedClaim = { id: claim.id, text: claim.text, drillContext: drill ?? undefined };
    this.bracketedClaims.update(c => [...c, newClaim]);
    this.bracketedIds.update(s => new Set([...s, claim.id]));
    // Push to node notes as well
    const existingNote = this.node().note || '';
    const noteAddition = `[Bracketed claim] ${claim.text}`;
    this.update.emit({ key: this.node().key, note: existingNote ? `${existingNote}\n${noteAddition}` : noteAddition });
  }

  removeClaim(claimId: string) {
    this.bracketedClaims.update(c => c.filter(x => x.id !== claimId));
    this.bracketedIds.update(s => { const n = new Set(s); n.delete(claimId); return n; });
  }

  // ─── Drill deeper into a claim ───────────────
  async drillInto(claim: ClaimUnit) {
    if (this.chatIsLoading()) return;
    this.drillStack.update(s => [...s, claim.text.slice(0, 50)]);
    const prompt = `Go deeper on this specific clinical claim: "${claim.text}"\n\nProvide detailed evidence, supporting guidelines, clinical studies, or specific contraindications relevant to this single statement. Be precise and evidence-based.`;
    await this._sendPrompt(prompt);
  }

  // ─── Pop back to root ─────────────────────────
  popToRoot() { this.drillStack.set([]); }

  // ─── Pop to a specific breadcrumb level ───────
  popToLevel(idx: number) {
    this.drillStack.update(s => s.slice(0, idx + 1));
  }

  // ─── Toggle chat open/closed ──────────────────
  toggleChat() {
    if (this.showChat()) {
      this.showChat.set(false);
    } else {
      this.showChat.set(true);
      if (!this.sessionStarted) { this.sessionStarted = true; this.startInlineSession(); }
    }
  }

  private async startInlineSession() {
    this.chatIsLoading.set(true);
    try {
      const nodeText = this.listItemHtml().replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const section = this.sectionTitle();
      const patient = this.intel.lastPatientData() ?? '';
      const context = `You are a focused clinical evidence assistant embedded in the PocketGall Clinical Intelligence Platform.
A clinician is reviewing a specific recommendation from the "${section}" section of an AI-generated care plan.

The recommendation under review:
"""
${nodeText.slice(0, 400)}${nodeText.length > 400 ? '...' : ''}
"""

Patient context is available. Your role:
1. Briefly explain the clinical rationale (2-3 sentences).
2. Cite supporting evidence or guidelines if applicable.
3. Answer follow-up questions about alternatives, risks, or nuances.
Keep responses concise and clinically precise. Use short paragraphs and bullet lists for structure.

VISUAL GROUNDING: When the user asks for images, a 3D model, or research (e.g. "show me an image", "3D model of", "find research on"), respond with a \`\`\`rich-media\`\`\` JSON block BEFORE your prose explanation. Format:
\`\`\`rich-media
{ "cards": [{ "kind": "model-3d"|"image-gallery"|"pubmed-refs"|"phil-image", "query": "<anatomical or clinical term>", "severity": "green"|"yellow"|"red", "afflictionHighlight": "<anatomical part>", "particles": true|false }] }
\`\`\`
Only include a rich-media block when the user explicitly requests visual or research content. Use kind "model-3d" for 3D anatomy. Include severity, afflictionHighlight, and particles if relevant. For "image-gallery" use medical illustrations, "pubmed-refs" for clinical research, and "phil-image" for CDC health photographs.`;

      await this.intel.ai.startChat(patient, context);
      const seedQ = `Explain the clinical rationale for this recommendation: "${nodeText.slice(0, 200)}${nodeText.length > 200 ? '...' : ''}"`;
      const response = await this.intel.ai.sendMessage(seedQ);
      this._appendModel(response);
    } catch (e: any) {
      this._appendModel(`Unable to connect: ${e?.message ?? e}`);
    } finally {
      this.chatIsLoading.set(false);
      this.needsScroll = true;
      setTimeout(() => this.chatInputRef?.nativeElement?.focus(), 50);
    }
  }

  triggerFileInput() {
    this.fileInputRef?.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const filesToAdd = Array.from(input.files);
      this.selectedFiles.update(current => [...current, ...filesToAdd]);
      input.value = '';
    }
  }

  removeFile(index: number) {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
  }

  async sendMessage() {
    const text = this.chatInputText.trim();
    const files = this.selectedFiles();
    if ((!text && files.length === 0) || this.chatIsLoading()) return;

    this.chatInputText = '';
    this.selectedFiles.set([]);
    this.showSuggestions.set(false);

    // create message with text and file indicators for user UI
    let userDisplayHtml = text ? `<p>${text}</p>` : '';
    if (files.length > 0) {
      const fileNames = files.map(f => f.name).join(', ');
      userDisplayHtml += `<p style="font-size: 9px; color: #9CA3AF; margin-top: 4px;">📎 Attached: ${fileNames}</p>`;
    }

    this._appendUser(text, userDisplayHtml);
    await this._sendPrompt(text, files);
  }

  sendPill(text: string) { this.chatInputText = text; this.sendMessage(); }

  private async _sendPrompt(prompt: string, files: File[] = []) {
    this.chatIsLoading.set(true);
    this.needsScroll = true;
    try {
      const response = await this.intel.ai.sendMessage(prompt, files);
      this._appendModel(response);
    } catch (e: any) {
      this._appendModel(`Error: ${e?.message ?? e}`);
    } finally {
      this.chatIsLoading.set(false);
      this.needsScroll = true;
    }
  }

  private _appendUser(text: string, htmlOverride?: string) {
    const html = htmlOverride || `<p>${text}</p>`;
    this.chatHistory.update(h => [...h, { role: 'user', text, html }]);
    this.needsScroll = true;
  }

  private _appendModel(md: string) {
    // ─── Parse out any rich-media fenced block ───────────────────────────────
    const richMediaRegex = /```rich-media\s*([\s\S]*?)```/i;
    const match = md.match(richMediaRegex);
    let richCards: RichMediaCard[] | undefined;
    let cleanMd = md;

    if (match) {
      cleanMd = md.replace(richMediaRegex, '').trim();
      try {
        const parsed = JSON.parse(match[1].trim());
        const rawCards: Array<{ kind: string; query: string; severity?: string; afflictionHighlight?: string; particles?: boolean }> = parsed.cards ?? [];
        richCards = rawCards
          .filter(c => ['model-3d', 'image-gallery', 'pubmed-refs', 'phil-image'].includes(c.kind))
          .map(c => ({
            kind: c.kind as any,
            query: c.query,
            severity: c.severity as any,
            afflictionHighlight: c.afflictionHighlight,
            particles: c.particles,
            loading: true
          }));
      } catch { /* malformed JSON — ignore block */ }
    }

    let html = cleanMd;
    const parser = this.markdown.parser();
    if (parser) { try { html = (parser as any).parse(cleanMd); } catch { html = `<p>${cleanMd}</p>`; } }
    const claims = parseHtmlToClaims(html);

    const entry: InlineChatEntry = { role: 'model', text: cleanMd, html, claims, richCards };
    this.chatHistory.update(h => [...h, entry]);
    this.needsScroll = true;

    // Now resolve cards asynchronously and patch the last message when they arrive
    if (richCards && richCards.length > 0) {
      Promise.all(richCards.map(card => this.richMedia.resolveCard(card))).then(resolved => {
        this.chatHistory.update(h => {
          const next = [...h];
          const last = next[next.length - 1];
          if (last && last.role === 'model') {
            next[next.length - 1] = { ...last, richCards: resolved };
          }
          return next;
        });
        this.needsScroll = true;
      });
    }
  }

  private scrollBottom() {
    // Scroll the outer right-panel to bring the bottom of the chat into view,
    // rather than scrolling an inner container (which creates a scroll trap).
    this.chatBottomRef?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ─── Rich media pill actions ──────────────────
  requestImage() {
    const topic = this.sectionTitle() || 'this clinical topic';
    this.chatInputText = `Show me medical images of ${topic}`;
    this.sendMessage();
  }

  request3DModel() {
    const nodeText = this.listItemHtml().replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
    const anatomy = nodeText || this.sectionTitle() || 'relevant anatomy';
    this.chatInputText = `Show me a 3D anatomical model related to: ${anatomy}`;
    this.sendMessage();
  }

  requestResearch() {
    const topic = this.sectionTitle() || 'this clinical recommendation';
    this.chatInputText = `Find clinical research on ${topic}`;
    this.sendMessage();
  }

  // ─── Existing node interactions ───────────────
  onDoubleClick() { this.update.emit({ key: this.node().key, note: this.node().note || '' }); }

  toggleBracket() {
    let next: 'normal' | 'added' | 'removed' = 'added';
    if (this.node().bracketState === 'added') next = 'removed';
    else if (this.node().bracketState === 'removed') next = 'normal';
    this.update.emit({ key: this.node().key, bracketState: next });
  }

  updateNote(text: string) { this.update.emit({ key: this.node().key, note: text }); }

  insertSuggestion(sugg: string) {
    const note = this.node().note ? `${this.node().note}\n${sugg}` : sugg;
    this.update.emit({ key: this.node().key, note });
  }

  acceptProposal() {
    if (this.node().proposedText) {
      this.proposalAccepted.set(true);
      this.update.emit({ key: this.node().key, acceptedProposal: this.node().proposedText });
    }
  }

  protected readonly ClinicalIcons = ClinicalIcons;
}
