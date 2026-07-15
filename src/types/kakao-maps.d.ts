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
      constructor(options: { position: LatLng; map?: Map; image?: MarkerImage });
      setMap(map: Map | null): void;
      setPosition(latlng: LatLng): void;
      setImage(image: MarkerImage): void;
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

    class Size {
      constructor(width: number, height: number);
    }

    class Point {
      constructor(x: number, y: number);
    }

    class MarkerImage {
      constructor(src: string, size: Size, options?: { offset?: Point });
    }

    // 클러스터 클릭 이벤트 핸들러에 전달되는 클러스터 객체 — 필요한 부분만 선언.
    class Cluster {
      getCenter(): LatLng;
      getSize(): number;
    }

    class MarkerClusterer {
      constructor(options: {
        map?: Map;
        averageCenter?: boolean;
        minLevel?: number;
        gridSize?: number;
        disableClickZoom?: boolean;
        calculator?: number[];
        styles?: Array<Partial<CSSStyleDeclaration>>;
      });
      addMarker(marker: Marker): void;
      addMarkers(markers: Marker[]): void;
      removeMarker(marker: Marker): void;
      removeMarkers(markers: Marker[]): void;
      clear(): void;
      redraw(): void;
    }

    namespace event {
      function addListener(
        target: object,
        type: string,
        handler: (...args: never[]) => void
      ): void;
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
