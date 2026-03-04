import {
    Component, ChangeDetectionStrategy, inject, signal, input, output,
    OnInit, ViewChild, ElementRef, AfterViewChecked, ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClinicalIntelligenceService } from '../services/clinical-intelligence.service';
import { PatientStateService } from '../services/patient-state.service';
import { MarkdownService } from '../services/markdown.service';
import { PocketGallButtonComponent } from './shared/pocket-gall-button.component';
import { ClinicalIcons } from '../assets/clinical-icons';
import { SafeHtmlPipe } from '../pipes/safe-html.pipe';

export interface NodeAgentDialogData {
    nodeKey: string;
    nodeText: string;          // Plain text content of the node
    sectionTitle: string;      // Which section/lens this node belongs to
}

interface ChatEntry {
    role: 'user' | 'model' | 'system';
    text: string;
    html?: string;
    isStreaming?: boolean;
}

@Component({
    selector: 'app-node-agent-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, PocketGallButtonComponent, SafeHtmlPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    template: `
    <!-- Overlay backdrop -->
    <div class="fixed inset-0 z-50 flex items-end justify-end p-6 pointer-events-none">
        <!-- Dialog Panel -->
        <div class="node-agent-dialog pointer-events-auto flex flex-col"
             [class.node-agent-dialog--open]="isOpen()">

            <!-- Header -->
            <div class="node-agent-header">
                <div class="flex items-center gap-2 flex-1 min-w-0">
                    <!-- Pulse indicator -->
                    <span class="flex-shrink-0 flex h-2 w-2 relative">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#689F38] opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-[#689F38]"></span>
                    </span>
                    <span class="node-agent-title">Evidence Focus</span>
                    <span class="node-agent-section-chip">{{ data().sectionTitle }}</span>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                    @if (isLoading()) {
                        <div class="w-4 h-4 border-2 border-[#EEEEEE] border-t-[#689F38] rounded-full animate-spin"></div>
                    }
                    <pocket-gall-button
                        variant="ghost"
                        size="sm"
                        ariaLabel="Close"
                        icon="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                        (click)="close()">
                    </pocket-gall-button>
                </div>
            </div>

            <!-- Context Node Preview -->
            <div class="node-agent-context">
                <div class="node-agent-context-label">Clinical Claim in Focus</div>
                <div class="node-agent-context-text" [innerHTML]="contextHtml() | safeHtml"></div>
            </div>

            <!-- Chat Body -->
            <div class="node-agent-body" #chatBody>
                @for (entry of chatHistory(); track $index) {
                    <div class="node-agent-message" [class.node-agent-message--user]="entry.role === 'user'"
                         [class.node-agent-message--model]="entry.role === 'model'"
                         [class.node-agent-message--system]="entry.role === 'system'">
                        @if (entry.role === 'model' || entry.role === 'system') {
                            <div class="node-agent-avatar">
                                <svg viewBox="0 -960 960 960" fill="currentColor" width="14" height="14">
                                    <path d="M480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Z"/>
                                </svg>
                            </div>
                        }
                        <div class="node-agent-bubble rams-typography"
                             [innerHTML]="(entry.html || entry.text) | safeHtml">
                        </div>
                        @if (entry.isStreaming) {
                            <span class="node-agent-cursor"></span>
                        }
                    </div>
                }

                @if (isLoading() && chatHistory()[chatHistory().length - 1]?.role !== 'model') {
                    <div class="node-agent-message node-agent-message--model">
                        <div class="node-agent-avatar">
                            <svg viewBox="0 -960 960 960" fill="currentColor" width="14" height="14">
                                <path d="M480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Z"/>
                            </svg>
                        </div>
                        <div class="node-agent-bubble node-agent-bubble--thinking">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                }
            </div>

            <!-- Suggestion Pills -->
            @if (showSuggestions() && !isLoading()) {
                <div class="node-agent-suggestions">
                    @for (s of suggestedQuestions(); track s) {
                        <pocket-gall-button variant="outline" size="xs" [icon]="ClinicalIcons.Suggestion" (clicked)="sendSuggestion(s)">
                            {{ s }}
                        </pocket-gall-button>
                    }
                </div>
            }

            <!-- Input Row -->
            <div class="node-agent-input-container">
                @if (selectedFiles().length > 0) {
                    <div class="node-agent-file-preview">
                        @for (file of selectedFiles(); track $index) {
                            <div class="node-agent-file-chip">
                                <span class="node-agent-file-name" [title]="file.name">{{ file.name }}</span>
                                <button class="node-agent-file-remove" (click)="removeFile($index)">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                </button>
                            </div>
                        }
                    </div>
                }
                <div class="node-agent-input-row">
                    <button class="node-agent-attach" (click)="triggerFileInput()" [disabled]="isLoading()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    </button>
                    <input type="file" #fileInput (change)="onFileSelected($event)" multiple accept="image/*,video/*" class="hidden" style="display: none;">
                    <input #inputEl
                        class="node-agent-input"
                        type="text"
                        [(ngModel)]="userInput"
                        placeholder="Ask about this recommendation..."
                        (keydown.enter)="sendMessage()"
                        [disabled]="isLoading()">
                    <button class="node-agent-send" (click)="sendMessage()" [disabled]="isLoading() || (!userInput.trim() && selectedFiles().length === 0)">
                        <svg viewBox="0 -960 960 960" fill="currentColor" width="18" height="18">
                            <path d="M120-160v-240l320-80-320-80v-240l760 320-760 320Z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
    `,
    styles: [`
        .node-agent-dialog {
            width: 420px;
            max-height: 580px;
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 16px;
            box-shadow: 0 24px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04);
            transform: translateY(20px) scale(0.97);
            opacity: 0;
            transition: transform 0.24s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s ease;
            overflow: hidden;
        }
        .node-agent-dialog--open {
            transform: translateY(0) scale(1);
            opacity: 1;
        }

        /* Header */
        .node-agent-header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            border-bottom: 1px solid #F3F4F6;
            background: #FAFAFA;
            flex-shrink: 0;
        }
        .node-agent-title {
            font-family: inherit;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #1C1C1C;
        }
        .node-agent-section-chip {
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #689F38;
            background: #F0F7E8;
            border: 1px solid #C8E6C9;
            border-radius: 10px;
            padding: 2px 7px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 140px;
        }

        /* Context node */
        .node-agent-context {
            padding: 10px 16px;
            background: #F9FAFB;
            border-bottom: 1px solid #F3F4F6;
            flex-shrink: 0;
        }
        .node-agent-context-label {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #9CA3AF;
            margin-bottom: 4px;
        }
        .node-agent-context-text {
            font-size: 12px;
            color: #374151;
            line-height: 1.5;
            max-height: 60px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
        }
        .node-agent-context-text strong { font-weight: 600; color: #1C1C1C; }

        /* Chat body */
        .node-agent-body {
            flex: 1;
            overflow-y: auto;
            padding: 12px 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            min-height: 0;
            scroll-behavior: smooth;
        }
        .node-agent-message {
            display: flex;
            align-items: flex-start;
            gap: 8px;
        }
        .node-agent-message--user {
            flex-direction: row-reverse;
        }
        .node-agent-avatar {
            flex-shrink: 0;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #1C1C1C;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 2px;
        }
        .node-agent-bubble {
            font-size: 12.5px;
            line-height: 1.6;
            color: #374151;
            background: #F3F4F6;
            border-radius: 12px 12px 12px 2px;
            padding: 10px 13px;
            max-width: calc(100% - 36px);
        }
        .node-agent-message--user .node-agent-bubble {
            background: #1C1C1C;
            color: #FFFFFF;
            border-radius: 12px 12px 2px 12px;
        }
        .node-agent-message--system .node-agent-bubble {
            background: #F0F7E8;
            border: 1px solid #C8E6C9;
            color: #374151;
            font-size: 11.5px;
            border-radius: 8px;
            width: 100%;
        }

        /* Bubble typography (markdown content) */
        .node-agent-bubble.rams-typography h1,
        .node-agent-bubble.rams-typography h2,
        .node-agent-bubble.rams-typography h3 {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            margin-top: 10px;
            margin-bottom: 4px;
            color: #1C1C1C;
        }
        .node-agent-bubble.rams-typography h3:first-child { margin-top: 0; }
        .node-agent-bubble.rams-typography p { margin-bottom: 6px; }
        .node-agent-bubble.rams-typography ul,
        .node-agent-bubble.rams-typography ol { padding-left: 16px; margin-bottom: 6px; }
        .node-agent-bubble.rams-typography li { margin-bottom: 3px; }
        .node-agent-bubble.rams-typography strong { font-weight: 700; color: #1C1C1C; }
        .node-agent-bubble.rams-typography table { font-size: 11px; width: 100%; border-collapse: collapse; margin: 6px 0; }
        .node-agent-bubble.rams-typography th { background: #F3F4F6; padding: 5px 8px; border: 1px solid #E5E7EB; font-size: 9px; text-transform: uppercase; }
        .node-agent-bubble.rams-typography td { padding: 5px 8px; border: 1px solid #E5E7EB; }
        .node-agent-message--user .node-agent-bubble.rams-typography strong { color: #FFFFFF; }

        /* Thinking dots */
        .node-agent-bubble--thinking {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 12px 14px;
        }
        .node-agent-bubble--thinking span {
            display: inline-block;
            width: 5px;
            height: 5px;
            background: #9CA3AF;
            border-radius: 50%;
            animation: thinking-dot 1.2s infinite ease-in-out;
        }
        .node-agent-bubble--thinking span:nth-child(2) { animation-delay: 0.2s; }
        .node-agent-bubble--thinking span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes thinking-dot {
            0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
        }

        /* Streaming cursor */
        .node-agent-cursor {
            display: inline-block;
            width: 2px;
            height: 13px;
            background: #689F38;
            margin-left: 2px;
            vertical-align: middle;
            animation: cursor-blink 0.8s infinite;
        }
        @keyframes cursor-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        /* Suggestion pills */
        .node-agent-suggestions {
            padding: 8px 16px 4px;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            flex-shrink: 0;
            border-top: 1px solid #F3F4F6;
        }
        .node-agent-pill {
            font-family: 'Inter', system-ui, sans-serif;
            font-size: 8px;
            font-weight: 700;
            color: #1C1C1C;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            background: transparent;
            border: 0.5pt solid #1C1C1C;
            border-radius: 0;
            padding: 5px 10px;
            cursor: pointer;
            transition: all 0.15s ease;
            text-align: left;
            display: inline-flex;
            align-items: center;
        }
        .node-agent-pill:hover {
            background: #1C1C1C;
            color: #FFFFFF;
        }

        /* Input Row */
        .node-agent-input-container {
            border-top: 1px solid #F3F4F6;
            flex-shrink: 0;
            background: #FFFFFF;
        }
        .node-agent-file-preview {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            padding: 8px 12px 0;
        }
        .node-agent-file-chip {
            display: flex;
            align-items: center;
            gap: 4px;
            background: #F3F4F6;
            border: 1px solid #E5E7EB;
            border-radius: 4px;
            padding: 2px 6px;
            font-size: 10px;
            color: #374151;
            max-width: 150px;
        }
        .node-agent-file-name {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .node-agent-file-remove {
            background: none;
            border: none;
            color: #9CA3AF;
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .node-agent-file-remove:hover { color: #1C1C1C; }
        .node-agent-input-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 12px;
        }
        .node-agent-attach {
            flex-shrink: 0;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: transparent;
            color: #9CA3AF;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.15s, background 0.15s;
        }
        .node-agent-attach:hover:not(:disabled) {
            color: #1C1C1C;
            background: #F3F4F6;
        }
        .node-agent-attach:disabled { opacity: 0.4; cursor: not-allowed; }
        .node-agent-input {
            flex: 1;
            font-family: inherit;
            font-size: 12.5px;
            color: #1C1C1C;
            background: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 20px;
            padding: 8px 14px;
            outline: none;
            transition: border-color 0.15s;
        }
        .node-agent-input:focus { border-color: #689F38; }
        .node-agent-input:disabled { opacity: 0.6; cursor: not-allowed; }
        .node-agent-send {
            flex-shrink: 0;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: #1C1C1C;
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.15s, transform 0.1s;
        }
        .node-agent-send:hover:not(:disabled) { background: #333333; }
        .node-agent-send:active:not(:disabled) { transform: scale(0.95); }
        .node-agent-send:disabled { opacity: 0.4; cursor: not-allowed; }
    `]
})
export class NodeAgentDialogComponent implements OnInit, AfterViewChecked {
    protected readonly ClinicalIcons = ClinicalIcons;

    data = input.required<NodeAgentDialogData>();
    patientData = input<string>('');
    closed = output<void>();

    @ViewChild('chatBody') chatBodyRef!: ElementRef<HTMLDivElement>;
    @ViewChild('inputEl') inputElRef!: ElementRef<HTMLInputElement>;
    @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

    private intel = inject(ClinicalIntelligenceService);
    private state = inject(PatientStateService);
    private markdown = inject(MarkdownService);

    isOpen = signal(false);
    isLoading = signal(false);
    chatHistory = signal<ChatEntry[]>([]);
    showSuggestions = signal(true);
    selectedFiles = signal<File[]>([]);
    userInput = '';
    contextHtml = signal('');

    private shouldScrollToBottom = false;

    suggestedQuestions = signal<string[]>([]);

    ngOnInit() {
        // Animate in
        requestAnimationFrame(() => this.isOpen.set(true));

        // Render the context node as HTML
        const parser = this.markdown.parser();
        const rawText = this.data().nodeText;
        if (parser && rawText) {
            try { this.contextHtml.set((parser as any).parse(rawText)); }
            catch { this.contextHtml.set(`<p>${rawText}</p>`); }
        } else {
            this.contextHtml.set(`<p>${rawText}</p>`);
        }

        // Build contextual suggested questions
        this.suggestedQuestions.set(this.buildSuggestedQuestions());

        // Seed the initial message
        this.startSession();
    }

    ngAfterViewChecked() {
        if (this.shouldScrollToBottom) {
            this.scrollToBottom();
            this.shouldScrollToBottom = false;
        }
    }

    private buildSuggestedQuestions(): string[] {
        const section = this.data().sectionTitle.toLowerCase();
        if (section.includes('overview') || section.includes('summary')) {
            return [
                'What evidence supports this?',
                'Are there alternative approaches?',
                'What are the main risks?',
            ];
        }
        if (section.includes('protocol') || section.includes('functional') || section.includes('intervention')) {
            return [
                'What is the dosing rationale?',
                'Are there drug interaction concerns?',
                'What clinical trials support this?',
            ];
        }
        if (section.includes('monitoring') || section.includes('follow')) {
            return [
                'What outcomes should I track?',
                'How urgent is this follow-up?',
                'What are the warning signs?',
            ];
        }
        if (section.includes('education')) {
            return [
                'Simplify this for patient reading level',
                'What questions might the patient ask?',
                'Are there language barriers to consider?',
            ];
        }
        return [
            'What is the clinical rationale?',
            'What are the alternatives?',
            'Are there contraindications?',
        ];
    }

    private async startSession() {
        this.isLoading.set(true);
        try {
            const patientCtx = this.patientData();
            const nodeText = this.data().nodeText;
            const section = this.data().sectionTitle;

            const systemContext = `You are a focused clinical evidence assistant embedded in the Pocket Gall Clinical Intelligence Platform.
A clinician is reviewing a specific recommendation from the "${section}" section of an AI-generated care plan and wants to understand or challenge it.

Patient context is available. The recommendation under review is:
"""
${nodeText}
"""

Your role:
1. First, briefly explain the clinical rationale for this specific recommendation in 2-3 sentences.
2. Then cite any supporting evidence or clinical guidelines if applicable.
3. Then be ready to answer follow-up questions about alternatives, risks, drug interactions, or patient-specific nuances.
Keep responses concise and clinically precise. Use markdown for structure when helpful.`;

            await this.intel.ai.startChat(patientCtx, systemContext);

            // Auto-send the initial seeded question
            const seedQuestion = `Explain the clinical rationale for this recommendation: "${nodeText.slice(0, 200)}${nodeText.length > 200 ? '...' : ''}"`;
            const response = await this.intel.ai.sendMessage(seedQuestion);

            this.appendModelMessage(response);
        } catch (e: any) {
            this.appendModelMessage(`Unable to connect to the AI engine: ${e?.message ?? e}`);
        } finally {
            this.isLoading.set(false);
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
        const text = this.userInput.trim();
        const files = this.selectedFiles();
        if ((!text && files.length === 0) || this.isLoading()) return;

        this.userInput = '';
        this.selectedFiles.set([]);
        this.showSuggestions.set(false);

        // create message with text and file indicators for user UI
        let userDisplayHtml = text ? `<p>${text}</p>` : '';
        if (files.length > 0) {
            const fileNames = files.map(f => f.name).join(', ');
            userDisplayHtml += `<p style="font-size: 10px; color: #9CA3AF; margin-top: 4px;">📎 Attached: ${fileNames}</p>`;
        }

        this.appendUserMessage(text, userDisplayHtml);
        this.isLoading.set(true);
        this.shouldScrollToBottom = true;

        try {
            const response = await this.intel.ai.sendMessage(text, files);
            this.appendModelMessage(response);
        } catch (e: any) {
            this.appendModelMessage(`Error: ${e?.message ?? e}`);
        } finally {
            this.isLoading.set(false);
            this.shouldScrollToBottom = true;
        }
    }

    sendSuggestion(text: string) {
        this.userInput = text;
        this.sendMessage();
    }

    close() {
        this.isOpen.set(false);

        // Save the context of this discussion before closing
        const history = this.chatHistory()
            .filter(entry => entry.role === 'user' || entry.role === 'model')
            .map(entry => ({ role: entry.role as 'user' | 'model', text: entry.text }));

        if (history.length > 0) {
            this.intel.addRecentNode({
                nodeText: this.data().nodeText,
                sectionTitle: this.data().sectionTitle,
                transcript: history,
                timestamp: new Date()
            });
        }

        setTimeout(() => this.closed.emit(), 240);
    }

    private appendUserMessage(text: string, htmlOverride?: string) {
        const html = htmlOverride || `<p>${text}</p>`;
        this.chatHistory.update(h => [...h, { role: 'user', text, html }]);
        this.shouldScrollToBottom = true;
    }

    private appendModelMessage(md: string) {
        const parser = this.markdown.parser();
        let html = md;
        if (parser) {
            try { html = (parser as any).parse(md); } catch { html = `<p>${md}</p>`; }
        }
        this.chatHistory.update(h => [...h, { role: 'model', text: md, html }]);
        this.shouldScrollToBottom = true;
    }

    private scrollToBottom() {
        const el = this.chatBodyRef?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
    }
}
