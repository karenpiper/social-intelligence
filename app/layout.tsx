import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Social Intelligence Dashboard',
  description: 'Monitor AI industry discourse across social platforms',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
