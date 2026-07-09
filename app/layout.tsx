import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "fortn — API",
  description: "Backend de API do app fortn",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
