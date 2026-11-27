import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender, Component, ElementRef, EventEmitter, inject, Input,
  NgZone, Output, PLATFORM_ID, ViewChild,
  type OnChanges, type OnDestroy, type SimpleChanges,
} from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import {
  ntMountHeader, ntRenderHeader,
  type NtHeaderActivation, type NtHeaderConfig, type NtHeaderController,
  type NtHeaderNavigation,
} from '@neetechs/ui';

/** Angular 20 reference adapter. The design system owns all header markup and DOM behavior. */
@Component({
  selector: 'nt-global-header',
  standalone: true,
  // Angular must not hydrate DOM owned by the framework-independent controller.
  host: { ngSkipHydration: 'true' },
  template: '<div #headerHost [innerHTML]="initialMarkup"></div>',
  styles: [':host, :host > div { display: contents; }'],
})
export class NtGlobalHeaderComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) config!: NtHeaderConfig;
  @Input() navigate?: (navigation: NtHeaderNavigation) => boolean;
  @Output() readonly headerAction = new EventEmitter<NtHeaderActivation>();
  @ViewChild('headerHost', { static: true }) private host!: ElementRef<HTMLElement>;

  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly zone = inject(NgZone);
  private readonly sanitizer = inject(DomSanitizer);
  private controller: NtHeaderController | undefined;
  private destroyed = false;
  protected initialMarkup: SafeHtml | null = null;

  private readonly renderRef = afterNextRender(() => {
    if (!this.browser || this.destroyed || this.controller) return;
    this.controller = this.zone.runOutsideAngular(() => ntMountHeader(
      this.host.nativeElement,
      this.config,
      {
        onAction: activation => this.zone.run(() => this.headerAction.emit(activation)),
        onNavigate: navigation => this.zone.run(() => this.navigate?.(navigation) ?? false),
      },
    ));
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['config'] || this.destroyed) return;
    if (this.controller) {
      const controller = this.controller;
      this.zone.runOutsideAngular(() => controller.update(this.config));
      return;
    }
    // Only the library's escaped, URL-validated renderer output is trusted.
    // Never accept raw HTML from the application or an API here. Angular's
    // sanitizer would otherwise strip the controller's data attributes.
    this.initialMarkup = this.sanitizer.bypassSecurityTrustHtml(ntRenderHeader(this.config));
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.renderRef.destroy();
    const controller = this.controller;
    this.controller = undefined;
    if (controller) this.zone.runOutsideAngular(() => controller.destroy());
  }
}
