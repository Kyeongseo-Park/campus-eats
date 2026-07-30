import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { REVIEW_IMAGE_ALLOWED_TYPES, REVIEW_IMAGE_MAX_SIZE_MB } from "@/lib/constants";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const user = await getCurrentUser();
        if (!user) {
          throw new Error("로그인이 필요합니다.");
        }

        return {
          allowedContentTypes: [...REVIEW_IMAGE_ALLOWED_TYPES],
          addRandomSuffix: true,
          maximumSizeInBytes: REVIEW_IMAGE_MAX_SIZE_MB * 1024 * 1024,
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
