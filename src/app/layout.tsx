import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { ClientLayout } from "./client-layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinDash - Seu Dashboard Financeiro",
  description: "Acompanhe o dólar, ibovespa e suas reservas financeiras.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body suppressHydrationWarning>
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}




