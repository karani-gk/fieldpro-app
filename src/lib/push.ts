// Web push for the technician app, through Firebase Cloud Messaging.
//
// The backend (services/push.py) sends to every token a user registered. This file gets the
// browser's FCM token and registers it. Without Firebase settings in .env.local the app simply
// runs without push: setUpPush says why and nothing else changes.

import type { TechApi } from "./api.ts";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export type PushState = "on" | "off" | "not-configured" | "unsupported" | "denied";

export function pushConfigured(): boolean {
  return Boolean(config.apiKey && config.projectId && config.messagingSenderId && config.appId && VAPID_KEY);
}

export async function setUpPush(api: TechApi, onMessage: (title: string, body: string) => void): Promise<PushState> {
  if (!pushConfigured()) return "not-configured";
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";
  // Loaded only when push is configured, so the app does not ship Firebase otherwise.
  const { initializeApp, getApps } = await import("firebase/app");
  const { getMessaging, getToken, onMessage: onForeground } = await import("firebase/messaging");
  const app = getApps()[0] ?? initializeApp(config);
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  await api.registerDevice(token);
  onForeground(messaging, (payload) => onMessage(payload.notification?.title ?? "fieldpro", payload.notification?.body ?? ""));
  return "on";
}
