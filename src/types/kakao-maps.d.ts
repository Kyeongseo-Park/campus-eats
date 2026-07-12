// Kakao Maps JS SDK — minimal ambient types covering only what this app uses.
// https://apis.map.kakao.com/web/documentation/

declare global {
  interface Window {
    kakao: typeof kakao;
  }

  namespace kakao {
    namespace maps {
      function load(callback: () => void): void;

      class LatLng {
        constructor(lat: number, lng: number);
        getLat(): number;
        getLng(): number;
      }

      class Size {
        constructor(width: number, height: number);
      }

      class Point {
        constructor(x: number, y: number);
      }

      class MarkerImage {
        constructor(
          src: string,
          size: Size,
          options?: { offset?: Point },
        );
      }

      class Map {
        constructor(
          container: HTMLElement,
          options: { center: LatLng; level?: number },
        );
        setCenter(latlng: LatLng): void;
        getCenter(): LatLng;
        setLevel(level: number): void;
      }

      class Marker {
        constructor(options: {
          position: LatLng;
          map?: Map | null;
          image?: MarkerImage;
          zIndex?: number;
          title?: string;
        });
        setMap(map: Map | null): void;
        setImage(image: MarkerImage): void;
        setZIndex(zIndex: number): void;
      }

      namespace event {
        function addListener(
          target: Marker | Map,
          type: string,
          handler: (...args: unknown[]) => void,
        ): void;
        function removeListener(
          target: Marker | Map,
          type: string,
          handler: (...args: unknown[]) => void,
        ): void;
      }
    }
  }
}

export {};
