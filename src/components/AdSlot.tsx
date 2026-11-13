import React, { useEffect, useRef } from 'react';

interface AdSlotProps {
  htmlCode: string;
  className?: string;
}

/**
 * Dedicated AdSlot component for proper React execution of Adsterra and external ad scripts.
 * Renders non-script HTML containers (e.g. <div id="container-...">) FIRST, then dynamically
 * creates and executes inline & external <script> elements in order inside useEffect.
 * Cleans up injected DOM/scripts on unmount or re-render to prevent duplicate ad stacking.
 */
export const AdSlot: React.FC<AdSlotProps> = ({ htmlCode, className = '' }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous DOM & scripts before re-injecting
    container.innerHTML = '';

    const trimmed = htmlCode?.trim();
    if (!trimmed) return;

    const template = document.createElement('template');
    template.innerHTML = trimmed;
    const fragment = template.content;

    // Collect scripts in order and detach them from the HTML fragment first
    const extractedScripts = Array.from(fragment.querySelectorAll('script'));
    extractedScripts.forEach((scriptEl) => scriptEl.parentNode?.removeChild(scriptEl));

    // 1. Mount container <div> and non-script markup FIRST so ad scripts find their target nodes
    container.appendChild(fragment);

    // 2. Dynamically create & append scripts in exact order (inline atOptions first, then external src)
    const injectedScripts: HTMLScriptElement[] = [];

    extractedScripts.forEach((oldScript) => {
      const newScript = document.createElement('script');

      // Copy all attributes (src, async, data-cfasync, type, etc.)
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });

      // Preserve explicit async behavior; default to false for sequential execution of inline + external pairs
      newScript.async = oldScript.hasAttribute('async');

      if (!oldScript.src && oldScript.textContent) {
        newScript.textContent = oldScript.textContent;
      }

      container.appendChild(newScript);
      injectedScripts.push(newScript);
    });

    return () => {
      injectedScripts.forEach((s) => {
        if (s.parentNode) {
          s.parentNode.removeChild(s);
        }
      });
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [htmlCode]);

  if (!htmlCode || !htmlCode.trim()) return null;

  return <div ref={containerRef} className={className} />;
};
