import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

// image-resize.ts의 MAX_DIMENSION과 같은 값. 네이티브 단계에서 미리 줄여두면
// base64 문자열 크기가 크게 줄어 메모리/전송 부담이 적어진다.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 88;

/**
 * 네이티브 앱에서 사진 1장을 촬영하거나 앨범에서 골라 File로 돌려준다.
 *
 * 결과를 base64로 받는 이유:
 * capacitor.config.ts의 server.url이 배포된 웹 주소(https://campus-eats-lime.vercel.app)를
 * 가리키고 있어서, 웹뷰의 출처(origin)와 Capacitor가 만들어주는 로컬 파일 URL의 출처가 서로 다르다.
 * 그래서 CameraResultType.Uri로 받은 webPath를 fetch하면 CORS로 막힐 수 있다.
 * base64는 출처와 무관하게 항상 안전하다.
 *
 * 한 번에 1장만 받는 것도 같은 이유다. 앨범 다중 선택(Camera.pickImages)은
 * base64를 주지 않아 webPath를 읽어야 하므로 위와 같은 제약을 받는다.
 */
export async function takeNativePhoto(): Promise<File> {
  const photo = await Camera.getPhoto({
    // Prompt로 두면 OS가 "사진 촬영 / 앨범에서 선택" 시트를 직접 띄워준다.
    source: CameraSource.Prompt,
    resultType: CameraResultType.Base64,
    quality: JPEG_QUALITY,
    width: MAX_DIMENSION,
    correctOrientation: true,
    promptLabelHeader: "사진 첨부",
    promptLabelPicture: "사진 촬영",
    promptLabelPhoto: "앨범에서 선택",
    promptLabelCancel: "취소",
  });

  if (!photo.base64String) {
    throw new Error("사진 데이터를 읽지 못했습니다.");
  }

  return base64ToFile(photo.base64String, photo.format);
}

/** 사용자가 촬영/선택을 취소한 경우. 에러 문구를 띄우지 않고 조용히 넘어가야 한다. */
export function isCameraCancelled(error: unknown): boolean {
  const message = errorMessage(error);
  return message.includes("cancel") || message.includes("no image picked");
}

/** 카메라/사진 권한이 거부된 경우. 설정에서 권한을 켜달라고 안내해야 한다. */
export function isCameraPermissionDenied(error: unknown): boolean {
  const message = errorMessage(error);
  return message.includes("denied") || message.includes("permission");
}

function errorMessage(error: unknown): string {
  return (error instanceof Error ? error.message : String(error ?? "")).toLowerCase();
}

function base64ToFile(base64: string, format: string): File {
  const type = mimeTypeOf(format);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  const extension = type.split("/")[1];
  // 파일명이 겹쳐도 업로드 토큰의 addRandomSuffix가 처리하지만, 구분이 쉽도록 시각을 붙인다.
  return new File([bytes], `review-${Date.now()}.${extension}`, { type });
}

function mimeTypeOf(format: string): string {
  if (format === "png") return "image/png";
  if (format === "webp") return "image/webp";
  // heic 등 나머지는 Camera 플러그인이 jpeg로 돌려준다.
  return "image/jpeg";
}
