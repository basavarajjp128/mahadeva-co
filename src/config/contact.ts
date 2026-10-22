type ContactDetails = {
  whatsappNumber: string | null;
  phone: string | null;
  email: string | null;
  businessAddress: string | null;
};

export const contactDetails: ContactDetails = {
  whatsappNumber: null,
  phone: null,
  email: null,
  businessAddress: null,
};

export function getWhatsAppHref(message?: string): string | null {
  const number = contactDetails.whatsappNumber?.replace(/\D/g, "");

  if (!number || !/^[1-9]\d{7,14}$/.test(number)) {
    return null;
  }

  const safeMessage = typeof message === "string" && message.trim() ? message.trim() : null;
  return `https://wa.me/${number}${safeMessage ? `?text=${encodeURIComponent(safeMessage)}` : ""}`;
}
