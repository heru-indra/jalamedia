// src/app/layout.tsx

import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Eventara — Platform Event Organizer Indonesia",
    template: "%s — Eventara",
  },
  description: "Platform event organizer terpercaya. Buat, kelola, dan publish event profesional dengan mudah.",
  keywords: ["event organizer", "eventara", "buat event", "tiket event", "indonesia"],
  openGraph: {
    title:       "Eventara",
    description: "Platform event organizer terpercaya untuk profesional Indonesia.",
    locale:      "id_ID",
    type:        "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}