const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.88;

export function isHeic(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.(heic|heif)$/i.test(file.name)
  );
}

let heic2anyModulePromise: Promise<typeof import("heic2any")> | null = null;

function loadHeic2any() {
  if (!heic2anyModulePromise) {
    heic2anyModulePromise = import("heic2any");
  }
  return heic2anyModulePromise;
}

/**
 * heic2any(WASM, 수 MB)를 파일 선택 전에 미리 받아둬서, 실제 HEIC 변환 시
 * 다운로드 대기 없이 디코딩만 하면 되도록 한다. 사진 첨부 버튼이 보이는 시점에
 * 호출하면 사용자가 파일을 고르는 동안 백그라운드에서 받아진다.
 */
export function preloadHeicConverter() {
  loadHeic2any().catch(() => {});
}

/**
 * 사파리 외 대부분의 브라우저는 HEIC/HEIF를 네이티브로 디코딩하지 못하므로,
 * heic2any(WASM)로 먼저 JPEG로 변환한다. 이후 리사이즈 로직에서 그대로 이어서 처리된다.
 */
async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await loadHeic2any()).default;
  const result = await heic2any({ blob: file, toType: "image/jpeg", quality: JPEG_QUALITY });
  const blob = Array.isArray(result) ? result[0] : result;
  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}

/**
 * 업로드 전 브라우저에서 이미지를 긴 변 기준 MAX_DIMENSION 이하로 축소하고
 * JPEG로 재인코딩해 용량을 줄인다. 84x84 썸네일/라이트박스 표시 용도라
 * 화면상 화질 차이는 거의 없다.
 */
export async function resizeImageForUpload(file: File): Promise<File> {
  if (isHeic(file)) {
    try {
      file = await convertHeicToJpeg(file);
    } catch (error) {
      console.warn("HEIC 변환에 실패했습니다.", error);
      return file;
    }
  }

  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  // 브라우저가 디코딩하지 못하는 포맷이면 리사이즈를 건너뛰고 원본을 그대로 반환한다.
  // 원본 자체의 형식/용량 검증은 호출부에서 처리한다.
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));

    if (scale === 1 && file.type === "image/jpeg") {
      bitmap.close();
      return file;
    }

    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob || blob.size >= file.size) {
      return file;
    }

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch (error) {
    console.warn("이미지 리사이즈에 실패해 원본을 그대로 업로드합니다.", error);
    return file;
  }
}
