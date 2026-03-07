export const VR_REALTIME_ENABLED = false;

export type VrControlEventType = "PLAY" | "PAUSE" | "SEEK" | "CHANGE_SCENARIO" | "END_SESSION";

export type VrControlEvent = {
  type: VrControlEventType;
  time?: number;
  scenarioId?: string;
};

export function vrSessionRoom(sessionId: string): string {
  return `vr-session:${sessionId}`;
}
