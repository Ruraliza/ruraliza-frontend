import { Component, input } from '@angular/core';

export type IconName =
  | 'clock' | 'play' | 'check' | 'x' | 'dash'
  | 'plus' | 'home' | 'list' | 'farm' | 'user' | 'search' | 'briefcase' | 'menu'
  | 'map-pin' | 'crosshair' | 'arrow-left' | 'arrow-right' | 'alert' | 'logout' | 'money' | 'sprout' | 'swap'
  | 'download' | 'bell' | 'wifi-off' | 'refresh' | 'share' | 'book' | 'award' | 'printer' | 'circle';

// Conjunto pequeno de ícones SVG inline: 24px, traço 1.75px, cor do texto (currentColor).
// Decorativo por padrão; passe `label` quando o ícone for o único conteúdo com significado.
@Component({
  selector: 'app-icon',
  host: {
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()'
  },
  styles: `:host { display: inline-block; flex: none; line-height: 0; } svg { width: 100%; height: 100%; }`,
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" focusable="false">
      @switch (name()) {
        @case ('clock') { <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /> }
        @case ('play') { <path d="M8 5.5v13l10-6.5z" /> }
        @case ('check') { <path d="M5 12.5l4.5 4.5L19 7.5" /> }
        @case ('x') { <path d="M6 6l12 12M18 6L6 18" /> }
        @case ('dash') { <path d="M6 12h12" /> }
        @case ('plus') { <path d="M12 5v14M5 12h14" /> }
        @case ('home') { <path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" /> }
        @case ('list') { <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" /> }
        @case ('farm') { <path d="M3 21V10l9-6 9 6v11M9 21v-6h6v6M3 21h18" /> }
        @case ('user') { <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /> }
        @case ('search') { <circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /> }
        @case ('briefcase') { <rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" /> }
        @case ('menu') { <path d="M4 7h16M4 12h16M4 17h16" /> }
        @case ('map-pin') { <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /> }
        @case ('crosshair') { <circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /> }
        @case ('arrow-left') { <path d="M19 12H5M11 6l-6 6 6 6" /> }
        @case ('arrow-right') { <path d="M5 12h14M13 6l6 6-6 6" /> }
        @case ('alert') { <circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5v.01" /> }
        @case ('swap') { <path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" /> }
        @case ('download') { <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" /> }
        @case ('bell') { <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" /> }
        @case ('wifi-off') { <path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.8M14.5 10.3A10 10 0 0 1 19 13M2 9.5a15 15 0 0 1 4.5-2.9M11 5.1A15 15 0 0 1 22 9.5M12 20h.01" /> }
        @case ('refresh') { <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" /> }
        @case ('share') { <path d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" /> }
        @case ('logout') { <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4" /> }
        @case ('money') { <rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 9.5v.01M18 14.5v.01" /> }
        @case ('book') { <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" /> }
        @case ('award') { <circle cx="12" cy="9" r="6" /><path d="M8.5 13.9 7 21l5-2.5 5 2.5-1.5-7.1" /> }
        @case ('printer') { <path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z" /> }
        @case ('circle') { <circle cx="12" cy="12" r="8" /> }
        @case ('sprout') { <path d="M12 21v-9M12 12C12 8 9 5 4 5c0 4 3 7 8 7zM12 14c0-3.5 2.5-6 7-6 0 3.5-2.5 6-7 6z" /> }
      }
    </svg>
  `
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(24);
  readonly label = input<string>('');
}
