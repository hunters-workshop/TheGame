import { Box } from '@metafam/ds';
import { useCallback, useEffect, useRef, useState } from 'react';

import { rain } from './rain';

/** Rain - Matrix rain effect
 * Used for the onboarding game but can be used for other things
 * @param blur - blur effect strength
 * @param masked - adjust z-index if we use a mask effect
 * @param top - top position of the container (to account for any vertical spacing of the parent)
 * @param effectOpacity - opacity of the rain effect - so we can make it very subtle or fade it out
 * @param z - z-index of the rain effect
 */
export function Rain({
  blur,
  masked,
  top,
  effectOpacity,
  z,
}: {
  blur?: boolean;
  masked?: boolean;
  top?: number;
  effectOpacity?: number;
  z?: number;
}): JSX.Element {
  const rainRef = useRef<HTMLDivElement>(null);
  // const prefersReducedMotion = usePrefersReducedMotion();
  const [noMotion, setNoMotion] = useState(false);
  const root = typeof window !== 'undefined' ? document.body : null;

  const initCallback = useCallback(() => {
    if (rainRef.current) {
      rain(rainRef, noMotion);
    }
  }, [noMotion]);

  useEffect(() => {
    initCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    initCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noMotion]);

  useEffect(() => {
    const mut = new MutationObserver(() => {
      if (root && root.classList.contains('no-motion')) {
        setNoMotion(true);
      } else {
        setNoMotion(false);
      }
    });
    if (typeof window !== 'undefined' && window.matchMedia !== undefined) {
      if (root) {
        mut.observe(root, {
          attributes: true,
        });
      }
    }

    return () => {
      mut.disconnect();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Box
        ref={rainRef}
        data-id="rain"
        position="absolute"
        top={top ?? 0}
        left={0}
        right={0}
        bottom={0}
        width="100%"
        height="100%"
        zIndex={z ?? 0}
        opacity={effectOpacity ?? 0.5}
        pointerEvents="none"
      >
        {blur ? (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            width="100%"
            height="100%"
            zIndex={z ? z + 2 : 2}
            backgroundColor="purpleTag30"
            backdropFilter="blur(7px)"
            pointerEvents="none"
          />
        ) : undefined}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          width="100%"
          height="100%"
          zIndex={z ? z + 5 : 5}
          pointerEvents="none"
          boxShadow="0 0 250px 100px black inset"
        />
        <Box
          as="canvas"
          data-id="rain-canvas"
          className="rain-canvas"
          position="absolute"
          zIndex={z ?? !masked ? 0 : 10}
          opacity={noMotion ? 0 : 1}
          transition="opacity 1s ease-in-out"
          pointerEvents="none"
          minH="100%"
          minW="100%"
        />
      </Box>
    </>
  );
}

// Rain.defaultProps = {
//   blur: false,
//   top: 0,
//   effectOpacity: 0.5,
//   z: 0
// }