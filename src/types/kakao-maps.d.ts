export {};

// Kakao Maps JS SDK — 공식 타입 패키지가 없어 직접 사용하는 부분만 최소 선언한다.
declare global {
  namespace kakao.maps {
    class LatLng {
      constructor(lat: number, lng: number);
    }

    class LatLngBounds {
      constructor();
      extend(latlng: LatLng): void;
    }

    class Map {
      constructor(container: HTMLElement, options: { center: LatLng; level?: number });
      setCenter(latlng: LatLng): void;
      panTo(latlng: LatLng): void;
      panBy(dx: number, dy: number): void;
      setBounds(
        bounds: LatLngBounds,
        paddingTop?: number,
        paddingRight?: number,
        paddingBottom?: number,
        paddingLeft?: number
      ): void;
      setLevel(level: number, options?: { anchor?: LatLng; animate?: boolean }): void;
      getLevel(): number;
    }

    class Marker {
      constructor(options: { position: LatLng; map?: Map });
      setMap(map: Map | null): void;
      setPosition(latlng: LatLng): void;
    }

    class CustomOverlay {
      constructor(options: {
        position: LatLng;
        content: HTMLElement;
        map?: Map;
        zIndex?: number;
        yAnchor?: number;
        clickable?: boolean;
      });
      setMap(map: Map | null): void;
    }

    function load(callback: () => void): void;
  }

  // 주소 → 좌표 변환(Geocoder)은 기본 SDK가 아니라 `&libraries=services`로 별도 로드해야 한다.
  namespace kakao.maps.services {
    interface AddressSearchResult {
      address_name: string;
      x: string;
      y: string;
    }

    class Geocoder {
      addressSearch(address: string, callback: (result: AddressSearchResult[], status: string) => void): void;
    }

    const Status: { OK: string; ZERO_RESULT: string; ERROR: string };
  }

  interface Window {
    kakao: typeof kakao;
  }
}
