import type { Metadata } from "next";
import type { ReactNode } from "react";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Admin",
};

export default function AdminAuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="admin-auth">
      <section className="admin-auth__intro">
        <p className="admin-eyebrow">{brand.name}</p>
        <h1>Copra operations, in one place.</h1>
        <p>
          Manage the catalogue, keep stock levels current and follow up on every buying and selling
          enquiry.
        </p>
        <ul className="admin-auth__points">
          <li>Update products, prices and grades</li>
          <li>Track stock against a low-stock threshold</li>
          <li>Move enquiries through your workflow</li>
        </ul>
      </section>
      <section className="admin-auth__card">{children}</section>
    </main>
  );
}
