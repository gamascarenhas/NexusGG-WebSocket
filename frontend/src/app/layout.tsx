import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NexusGG',
  description: 'Chat em tempo real — NexusGG',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
