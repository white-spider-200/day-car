import { AppointmentStatus } from "@prisma/client";

const toClientMap: Record<AppointmentStatus, "requested" | "confirmed" | "canceled" | "completed"> = {
  REQUESTED: "requested",
  CONFIRMED: "confirmed",
  CANCELED: "canceled",
  COMPLETED: "completed"
};

const fromClientMap: Record<"requested" | "confirmed" | "canceled" | "completed", AppointmentStatus> = {
  requested: AppointmentStatus.REQUESTED,
  confirmed: AppointmentStatus.CONFIRMED,
  canceled: AppointmentStatus.CANCELED,
  completed: AppointmentStatus.COMPLETED
};

export function toClientStatus(status: AppointmentStatus) {
  return toClientMap[status];
}

export function fromClientStatus(status: "requested" | "confirmed" | "canceled" | "completed") {
  return fromClientMap[status];
}
