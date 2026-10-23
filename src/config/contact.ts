type ContactDetails = {
  whatsappNumber: string | null;
  phone: string | null;
  email: string | null;
  businessAddress: string | null;
};

export const contactDetails: ContactDetails = {
  // Public business WhatsApp number supplied by the business owner.
  whatsappNumber: "+91 8971475042",
  phone: null,
  // Add a verified public business email before enabling email enquiries.
  email: null,
  businessAddress: null,
};

export function buildWhatsAppHref(numberValue: string | null, message?: string): string | null {
  const number = numberValue?.replace(/\D/g, "");

  if (!number || !/^[1-9]\d{7,14}$/.test(number)) {
    return null;
  }

  const safeMessage = typeof message === "string" && message.trim() ? message.trim() : null;
  return `https://wa.me/${number}${safeMessage ? `?text=${encodeURIComponent(safeMessage)}` : ""}`;
}

export function getWhatsAppHref(message?: string): string | null {
  return buildWhatsAppHref(contactDetails.whatsappNumber, message);
}

export function buildMailtoHref(emailValue: string | null, message?: string): string | null {
  const email = emailValue?.trim();
  if (
    !email ||
    email.length > 254 ||
    !/^[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/.test(email)
  ) {
    return null;
  }

  const subject = encodeURIComponent("Wholesale Copra Enquiry");
  const body = encodeURIComponent(
    message?.trim() || "Hello, I would like to request a quotation from SRI MAHADEVA & CO.",
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

export function getMailtoHref(message?: string): string | null {
  return buildMailtoHref(contactDetails.email, message);
}

export function getTelHref(): string | null {
  const number = contactDetails.phone?.replace(/\D/g, "");
  if (!number || !/^[1-9]\d{7,14}$/.test(number)) return null;
  return `tel:+${number}`;
}
