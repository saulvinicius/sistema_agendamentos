export type Service = {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
};

export type BookingStatus = "confirmed" | "cancelled";

export type Booking = {
  id: string;
  name: string;
  phone: string;
  serviceId: string;
  date: string;
  time: string;
  createdAt: string;
  status: BookingStatus;
};

export type Settings = {
  shopName: string;
  tagline: string;
  ownerPin: string;
  openTime: string;
  closeTime: string;
  slotInterval: number;
  closedDays: number[];
  blockedSlots: string[];
  services: Service[];
};

export type Slot = {
  time: string;
  available: boolean;
  reason?: "booked" | "blocked" | "past" | "closed";
};
