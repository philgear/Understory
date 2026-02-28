import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MarkdownService {
    parser = signal<any>(null);

    constructor() {
        this.loadMarked();
    }

    private async loadMarked() {
        try {
            const { marked } = await import('marked');
            this.parser.set(marked);
        } catch (e) {
            console.error('Failed to load marked dynamically', e);
        }
    }
}
