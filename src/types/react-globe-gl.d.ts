declare module 'react-globe.gl' {
  import { ForwardRefExoticComponent, RefAttributes } from 'react';

  interface GlobeMethods {
    pointOfView(
      pov?: { lat?: number; lng?: number; altitude?: number },
      transitionMs?: number,
    ): { lat: number; lng: number; altitude: number };
    scene(): unknown;
    camera(): unknown;
    renderer(): unknown;
    controls(): unknown;
  }

  interface GlobeProps {
    [key: string]: unknown;
  }

  const Globe: ForwardRefExoticComponent<
    GlobeProps & RefAttributes<GlobeMethods>
  >;
  export default Globe;
}
