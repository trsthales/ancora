import React from 'react';
import { ShieldCheck, Anchor, Users, AlertTriangle } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Anchor className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-100">
                ⚓ Âncora — Painel de Moderação
              </h1>
              <p className="text-xs text-slate-400">
                Plataforma de apoio contínuo à recuperação e acolhimento
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Moderação Ativa
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-sm font-medium">Relatórios Pendentes</span>
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-slate-50">0</p>
            <p className="text-xs text-slate-500 mt-1">Nenhuma denúncia pendente</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-sm font-medium">Alertas de Crise SOS</span>
              <ShieldCheck className="w-5 h-5 text-teal-400" />
            </div>
            <p className="text-2xl font-bold text-slate-50">Normal</p>
            <p className="text-xs text-slate-500 mt-1">Monitoramento de palavras críticas ativo</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-sm font-medium">Pseudônimos Ativos</span>
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-slate-50">—</p>
            <p className="text-xs text-slate-500 mt-1">Segregação de identidade garantida</p>
          </div>
        </section>

        <section className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-3">
          <h2 className="text-lg font-semibold text-slate-200">Painel Inicializado</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            A infraestrutura base do Monorepo Âncora foi configurada com sucesso. A moderação atuará
            de acordo com as diretrizes éticas e de proteção contra gatilhos estabelecidas nas RFCs
            do projeto.
          </p>
        </section>
      </main>
    </div>
  );
}
