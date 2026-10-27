export const customerEnquiryStatuses = [
  "new",
  "contacted",
  "quoted",
  "won",
  "lost",
  "closed",
  "spam",
] as const;

export type CustomerEnquiryStatus = (typeof customerEnquiryStatuses)[number];

export const customerEnquiryStatusLabels: Record<CustomerEnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
  closed: "Closed",
  spam: "Spam",
};

export const supplierEnquiryStatuses = [
  "new",
  "contacted",
  "negotiating",
  "accepted",
  "rejected",
  "closed",
] as const;

export type SupplierEnquiryStatus = (typeof supplierEnquiryStatuses)[number];

export const supplierEnquiryStatusLabels: Record<SupplierEnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  negotiating: "Negotiating",
  accepted: "Accepted",
  rejected: "Rejected",
  closed: "Closed",
};

export const enquirySources = [
  "website",
  "whatsapp",
  "phone",
  "email",
  "walk_in",
  "manual",
] as const;

export type EnquirySource = (typeof enquirySources)[number];

export const enquirySourceLabels: Record<EnquirySource, string> = {
  website: "Website",
  whatsapp: "WhatsApp",
  phone: "Phone",
  email: "Email",
  walk_in: "Walk-in",
  manual: "Manual",
};

export const adminRoleLabels = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  viewer: "Viewer",
} as const;
