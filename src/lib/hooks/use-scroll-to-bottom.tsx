import { useEffect, useRef, type RefObject } from 'react';

export function useScrollToBottom(): [
  RefObject<HTMLDivElement>,
  RefObject<HTMLDivElement>,
] {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const pendingScrollRef = useRef(false);
  const lastHeightRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (!container || !end) return;

    // Initial scroll to bottom - use requestAnimationFrame for smoother initial load
    requestAnimationFrame(() => {
      end.scrollIntoView({ behavior: 'instant', block: 'end' });
      // Store the initial height after scroll
      lastHeightRef.current = container.scrollHeight;
    });

    // Track if user has manually scrolled up
    const handleScroll = () => {
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // If user is scrolled up, mark as manually scrolling
      isUserScrollingRef.current = distanceFromBottom > 100;
    };

    // Handle mutations
    const observer = new MutationObserver((mutations) => {
      if (!container || !end || pendingScrollRef.current) return;

      // Check if mutation is related to expand/collapse
      const isToggleSection = mutations.some((mutation) => {
        // Check if the target or parent is a motion-div (expanded content)
        let target = mutation.target as HTMLElement;
        let isExpand = false;

        while (target && target !== container) {
          if (target.classList?.contains('motion-div')) {
            isExpand = true;
            break;
          }
          target = target.parentElement as HTMLElement;
        }
        return isExpand;
      });

      // Don't scroll for expand/collapse actions
      if (isToggleSection) return;

      // Only auto-scroll if user hasn't manually scrolled up
      if (!isUserScrollingRef.current) {
        pendingScrollRef.current = true;

        // Check if this is a significant content change
        const heightDifference = Math.abs(
          container.scrollHeight - lastHeightRef.current,
        );

        // Use instant behavior for small changes (typing) and smooth for large changes (new messages)
        const behavior = heightDifference > 50 ? 'smooth' : 'instant';

        // Use requestAnimationFrame to batch scrolling and prevent jank
        requestAnimationFrame(() => {
          end.scrollIntoView({ behavior, block: 'end' });
          // Update last height after scroll
          lastHeightRef.current = container.scrollHeight;

          // Clear pending flag after a short delay to prevent rapid scrolling
          setTimeout(() => {
            pendingScrollRef.current = false;
          }, 100);
        });
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Add scroll event listener
    container.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return [containerRef, endRef] as [
    RefObject<HTMLDivElement>,
    RefObject<HTMLDivElement>,
  ];
}
