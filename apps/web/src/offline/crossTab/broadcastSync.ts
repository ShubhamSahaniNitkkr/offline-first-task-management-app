import { BROADCAST_CHANNEL_NAME } from '@oftmp/shared';

type CrossTabMessage = { type: 'QUEUE_CHANGED'; count: number };

let channel: BroadcastChannel | null = null;

export function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!channel) {
    channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
  return channel;
}

export function broadcastQueueChanged(count: number) {
  getBroadcastChannel()?.postMessage({ type: 'QUEUE_CHANGED', count } satisfies CrossTabMessage);
}

export function subscribeCrossTab(handler: (message: CrossTabMessage) => void) {
  const bc = getBroadcastChannel();
  if (!bc) return () => {};

  const listener = (event: MessageEvent<CrossTabMessage>) => handler(event.data);
  bc.addEventListener('message', listener);
  return () => bc.removeEventListener('message', listener);
}
