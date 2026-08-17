export {};

// Kakao JS SDK(카카오톡 공유하기) — 공식 타입 패키지가 없어 직접 사용하는 부분만 최소 선언한다.
// window.Kakao(대문자)는 카카오맵 SDK의 window.kakao(소문자, src/types/kakao-maps.d.ts)와
// 별개의 전역 객체다.
declare global {
  namespace Kakao {
    interface ShareLink {
      webUrl: string;
      mobileWebUrl: string;
    }

    interface FeedTemplate {
      objectType: "feed";
      content: {
        title: string;
        description: string;
        imageUrl: string;
        imageWidth?: number;
        imageHeight?: number;
        link: ShareLink;
      };
      buttons?: { title: string; link: ShareLink }[];
    }

    namespace Share {
      function sendDefault(template: FeedTemplate): void;
    }
  }

  interface Window {
    Kakao: {
      init(appKey: string): void;
      isInitialized(): boolean;
      Share: typeof Kakao.Share;
    };
  }
}
