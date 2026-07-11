export {};

// Kakao Maps JS SDK — 공식 타입 패키지가 없어 직접 사용하는 부분만 최소 선언한다.
declare global {
  namespace kakao.maps {
    class LatLng {
      constructor(lat: number, lng: number);
    }

    class Map {
      constructor(container: HTMLElement, options: { center: LatLng; level?: number });
      setCenter(latlng: LatLng): void;
    }

    class Marker {
      constructor(options: { position: LatLng; map?: Map });
      setMap(map: Map | null): void;
    }

    function load(callback: () => void): void;
  }

  interface Window {
    kakao: typeof kakao;
  }
}
