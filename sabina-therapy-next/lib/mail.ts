type BookingEmailPayload = {
  to: string;
  subject: string;
  body: string;
};

export async function sendMockEmail(payload: BookingEmailPayload) {
  console.log("[MockEmail]", JSON.stringify(payload, null, 2));
}
