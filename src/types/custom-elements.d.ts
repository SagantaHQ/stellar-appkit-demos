import type { StellarAppKit } from '@saganta/stellar-appkit';
import type React from 'react';

// Type declaration for the <stellar-appkit-modal> custom element so
// TypeScript/JSX recognizes it when rendered as a raw element.
// In React 19, the JSX namespace is under React.JSX, not global JSX.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'stellar-appkit-modal': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          mode?: string;
          theme?: string;
          branding?: string;
          'logo-src'?: string;
          title?: string;
          'auto-retry-network'?: string;
          'stellar-expert-avatars'?: string;
          'explorer-url'?: string;
          animation?: string;
          'animation-open'?: string;
          'animation-close'?: string;
          ref?: React.Ref<any>;
          style?: React.CSSProperties;
        },
        HTMLElement & {
          client: StellarAppKit | null;
          open?: () => Promise<void>;
          close?: (skipAnimation?: boolean) => void;
        }
      >;
    }
  }
}

export {};
