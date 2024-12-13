'use client';

import React from 'react';
// Use the mux-video custom element for renditions and audio tracks support.
import MuxVideoElement, { Attributes as MuxVideoElementAttrs } from '@mux/mux-video';
import { MuxMediaProps } from '@mux/playback-core';
import { camelCase } from '../../utils.js';

type MuxVideoElementType = Element & {
  getTemplateHTML?(attrs: Record<string, any>): string;
  shadowRootOptions?: { mode: 'open' | 'closed'; delegatesFocus: boolean };
};

const Element = MuxVideoElement as unknown as MuxVideoElementType;

export type MuxVideoProps = MuxMediaProps & Omit<React.ComponentProps<'video'>, 'autoPlay'>;

const MuxVideo = React.forwardRef<HTMLElement | undefined, MuxVideoProps>((allProps, ref) => {
  let { children, suppressHydrationWarning, ...props } = allProps;
  const elementRef = React.useRef<HTMLElement | null>(null);

  for (let name in props) {
    if (name[0] === 'o' && name[1] === 'n') {
      const useCapture = name.endsWith('Capture');
      const eventName = name.slice(2, useCapture ? name.length - 7 : undefined).toLowerCase();
      const callback = (props as MuxVideoProps)[name as keyof MuxVideoProps];

      React.useEffect(() => {
        const eventTarget = elementRef?.current;
        if (!eventTarget || typeof callback !== 'function') return;

        eventTarget.addEventListener(eventName, callback, useCapture);

        return () => {
          eventTarget.removeEventListener(eventName, callback, useCapture);
        };
      }, [elementRef?.current, callback]);
    }
  }

  const attrs = propsToAttrs(props);

  // Only render the custom element template HTML on the server..
  // The custom element will render itself on the client.
  if (typeof window === 'undefined' && Element?.getTemplateHTML && Element?.shadowRootOptions) {
    const { mode, delegatesFocus } = Element.shadowRootOptions;

    const templateShadowRoot = React.createElement('template', {
      shadowrootmode: mode,
      shadowrootdelegatesfocus: delegatesFocus,
      dangerouslySetInnerHTML: {
        __html: Element.getTemplateHTML(attrs),
      },
    });

    children = [templateShadowRoot, children];
  }

  return React.createElement('mux-video', {
    ...attrs,
    ref: React.useCallback(
      (node: HTMLElement) => {
        elementRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref !== null) {
          ref.current = node;
        }
      },
      [ref]
    ),
    children,
    suppressHydrationWarning,
  });
});

export default MuxVideo;

const ReactPropToAttrNameMap: Record<string, string> = {
  className: 'class',
  classname: 'class',
  htmlFor: 'for',
  viewBox: 'viewBox',
};

// Add mapping from MuxVideoElement prop names to attribute names.
// e.g. playbackId to playback-id
for (let [constant, attrName] of Object.entries(MuxVideoElementAttrs)) {
  const propName = camelCase(constant);
  ReactPropToAttrNameMap[propName] = attrName;
}

function propsToAttrs(props = {}) {
  let attrs: Record<string, any> = {};
  for (let [propName, propValue] of Object.entries(props)) {
    let attrName = toAttrName(propName, propValue);
    if (attrName) attrs[attrName] = toAttrValue(propValue);
  }
  return attrs;
}

function toAttrName(propName: string, propValue: unknown) {
  if (ReactPropToAttrNameMap[propName]) return ReactPropToAttrNameMap[propName];
  if (typeof propValue == 'undefined') return undefined;
  if (typeof propValue === 'boolean' && !propValue) return undefined;
  if (propName.startsWith('on') && typeof propValue === 'function') return undefined;
  if (/[A-Z]/.test(propName)) return propName.toLowerCase();
  return propName;
}

function toAttrValue(propValue: unknown) {
  if (typeof propValue === 'boolean') return '';
  if (Array.isArray(propValue)) return propValue.join(' ');
  return propValue;
}
