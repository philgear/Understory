import { Directive, ElementRef, OnInit, OnDestroy, Renderer2, Input } from '@angular/core';

@Directive({
    selector: '[appReveal]',
    standalone: true
})
export class RevealDirective implements OnInit, OnDestroy {
    @Input() revealDelay = 0; // Optional delay in ms
    @Input() revealThreshold = 0.1; // Intersection threshold

    private observer: IntersectionObserver | null = null;

    constructor(private el: ElementRef, private renderer: Renderer2) { }

    ngOnInit() {
        // Add initial pre-reveal class
        this.renderer.addClass(this.el.nativeElement, 'reveal-hidden');

        // Check if InteractionObserver is supported (SSR safety)
        if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {

                        // Apply delay if specified either via Input or CSS variable
                        if (this.revealDelay > 0) {
                            setTimeout(() => {
                                this.renderer.addClass(this.el.nativeElement, 'reveal-visible');
                                this.renderer.removeClass(this.el.nativeElement, 'reveal-hidden');
                            }, this.revealDelay);
                        } else {
                            this.renderer.addClass(this.el.nativeElement, 'reveal-visible');
                            this.renderer.removeClass(this.el.nativeElement, 'reveal-hidden');
                        }

                        // Stop observing once revealed
                        this.observer?.unobserve(this.el.nativeElement);
                    }
                });
            }, {
                root: null, // Use viewport
                threshold: this.revealThreshold, // Percentage of element visible
                rootMargin: '0px 0px -50px 0px' // Check slightly before it enters fully
            });

            this.observer.observe(this.el.nativeElement);
        } else {
            // Fallback if no IntersectionObserver
            this.renderer.addClass(this.el.nativeElement, 'reveal-visible');
            this.renderer.removeClass(this.el.nativeElement, 'reveal-hidden');
        }
    }

    ngOnDestroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}
