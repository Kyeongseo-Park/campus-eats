import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

export type PushCallbacks = {
  /** 앱을 보고 있는 중에 알림이 도착했을 때. OS 알림이 안 뜨므로 화면 안에서 알려줘야 한다. */
  onForegroundMessage: (title: string, body: string) => void;
  /** 알림을 탭해서 앱이 열렸을 때. 알림 데이터에 url이 있으면 그 화면으로 보낸다. */
  onNotificationTap: (url: string) => void;
};

/**
 * 푸시 알림 권한을 요청하고 기기 토큰을 서버에 등록한다.
 * 정리(cleanup) 함수를 돌려주므로, 화면이 사라질 때 반드시 호출해 리스너를 해제해야 한다.
 *
 * 네이티브가 아니거나 권한이 거부되면 아무것도 등록하지 않고 조용히 끝난다.
 */
export async function startPushNotifications(callbacks: PushCallbacks): Promise<() => void> {
  const handles: PluginListenerHandle[] = [];
  const cleanup = () => {
    for (const handle of handles) {
      void handle.remove();
    }
    handles.length = 0;
  };

  if (!Capacitor.isNativePlatform()) return cleanup;

  // 이미 거부한 사용자에게 매번 다시 묻지 않도록 현재 상태를 먼저 확인한다.
  let permission = (await PushNotifications.checkPermissions()).receive;
  if (permission === "prompt" || permission === "prompt-with-rationale") {
    permission = (await PushNotifications.requestPermissions()).receive;
  }
  if (permission !== "granted") return cleanup;

  handles.push(
    await PushNotifications.addListener("registration", (token) => {
      void registerToken(token.value).catch((error) => {
        console.warn("푸시 토큰을 서버에 등록하지 못했습니다.", error);
      });
    }),
  );

  handles.push(
    await PushNotifications.addListener("registrationError", (error) => {
      console.warn("푸시 등록에 실패했습니다.", error);
    }),
  );

  handles.push(
    await PushNotifications.addListener("pushNotificationReceived", (notification) => {
      callbacks.onForegroundMessage(notification.title ?? "새 알림", notification.body ?? "");
    }),
  );

  handles.push(
    await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const url = action.notification.data?.url;
      if (typeof url === "string" && url.startsWith("/")) {
        callbacks.onNotificationTap(url);
      }
    }),
  );

  // 리스너를 모두 붙인 뒤에 등록해야 registration 이벤트를 놓치지 않는다.
  await PushNotifications.register();

  return cleanup;
}

/** 로그아웃 등으로 이 기기에 더 이상 알림을 보내지 않을 때 호출한다. */
export async function stopPushNotifications(token: string): Promise<void> {
  await fetch("/api/push/register", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

async function registerToken(token: string): Promise<void> {
  const response = await fetch("/api/push/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, platform: Capacitor.getPlatform() }),
  });

  if (!response.ok) {
    throw new Error(`푸시 토큰 등록 실패 (${response.status})`);
  }
}
