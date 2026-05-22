'use client';

import { StatusMensagem } from '../tipos';

interface Props {
  status: StatusMensagem;
}

// Ícone de status da mensagem:
// pendente  → relógio
// enviada   → 1 check
// entregue  → 2 checks cinzas
// lida      → 2 checks roxos
export function IconeStatusMensagem({ status }: Props) {
  if (status === 'pendente') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="status-icone pendente">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12,6 12,12 16,14" />
      </svg>
    );
  }

  if (status === 'enviada') {
    return (
      <svg width="15" height="11" viewBox="0 0 20 14" fill="none" className="status-icone enviada">
        <polyline points="2,7 7,12 18,2" stroke="#6b7280" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (status === 'entregue') {
    return (
      <svg width="19" height="11" viewBox="0 0 26 14" fill="none" className="status-icone entregue">
        <polyline points="2,7 7,12 18,2"  stroke="#6b7280" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="8,7 13,12 24,2" stroke="#6b7280" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // lida — roxo
  return (
    <svg width="19" height="11" viewBox="0 0 26 14" fill="none" className="status-icone lida">
      <polyline points="2,7 7,12 18,2"  stroke="#a78bfa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="8,7 13,12 24,2" stroke="#a78bfa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
