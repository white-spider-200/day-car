import type { VrControlEvent } from "@/lib/vr-realtime";

export type VrRealtimePublisher = {
  publishToSession: (sessionId: string, event: VrControlEvent) => Promise<void>;
};

class NoopVrRealtimePublisher implements VrRealtimePublisher {
  async publishToSession(_sessionId: string, _event: VrControlEvent): Promise<void> {
    // Phase 1: realtime transport is disabled by default.
  }
}

export const vrRealtimePublisher: VrRealtimePublisher = new NoopVrRealtimePublisher();
