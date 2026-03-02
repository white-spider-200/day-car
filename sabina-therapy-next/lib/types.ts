export type DoctorDTO = {
  id: string;
  slug: string;
  specialty: string;
  bio: string;
  languages: string[];
  location: string;
  fees: number;
  photoUrl: string;
  isTopDoctor: boolean;
  isApproved: boolean;
  user: { name: string };
  verification?: {
    verificationBadge: boolean;
    licenseNumber: string;
  } | null;
};

export type SlotDTO = {
  id: string;
  startAt: string;
  endAt: string;
  isBooked: boolean;
};

export type AppointmentDTO = {
  id: string;
  status: "requested" | "confirmed" | "canceled" | "completed";
  startAt: string;
  endAt: string;
  doctorId: string;
  patientId: string;
  doctorName?: string;
  patientName?: string;
  zoomProvider?: string | null;
};
