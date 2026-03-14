import { useEffect, useRef } from "react";
import VanillaTilt from "vanilla-tilt";

export function TiltCard({ children, options, className = "" }) {
  const tiltRef = useRef(null);

  useEffect(() => {
    const element = tiltRef.current;
    if (!element) return undefined;

    VanillaTilt.init(element, options || {
      max: 30,
      speed: 400,
      glare: true,
      "max-glare": 0.2,
      scale: 1.05,
    });

    return () => {
      if (element.vanillaTilt) {
        element.vanillaTilt.destroy();
      }
    };
  }, [options]);

  return (
    <div ref={tiltRef} className={className}>
      {children}
    </div>
  );
}
