import { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, Clock, ChevronDown, ChevronUp, RefreshCw, Activity, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoadmapGeneratorProps } from "../types";

interface Task {
  text: string;
  completed: boolean;
}

interface Phase {
  title: string;
  status: string;
  tasks: Task[];
  total: number;
  completed: number;
  percent: number;
}

export function RoadmapGenerator({ onNavigateAI }: RoadmapGeneratorProps) {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0); // expand first phase by default

  const fetchRoadmap = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/admin/roadmap/state");
      if (response.ok) {
        const data = await response.json();
        if (data.phases && Array.isArray(data.phases)) {
          setPhases(data.phases);
        } else {
          setError(true);
        }
      } else {
        setError(true);
      }
    } catch (e) {
      console.error("Error loading dynamic roadmap:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const totalTasks = phases.reduce((acc, p) => acc + (p.total || 0), 0);
  const completedTasks = phases.reduce((acc, p) => acc + (p.completed || 0), 0);
  const globalPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      {/* Top Header Card */}
      <div className="glass-panel p-8 border border-primary-purple/30 bg-primary-purple/5 relative overflow-hidden rounded-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-purple/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-purple animate-pulse" />
              <span className="text-xs uppercase font-extrabold text-primary-purple tracking-widest">Nexus Orquestrador</span>
            </div>
            <h3 className="text-xl font-bold text-white leading-none">Roadmap Estratégico Dinâmico</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Mapeamento em tempo real do progresso físico indexado em <code className="text-primary-purple px-1 bg-white/5 rounded">roadmap.md</code>. 
              Sincronize com o Nexus AI para impulsionar tomadas de decisão e sprints técnicas para Web e Android.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-black/60 p-4 rounded-xl border border-white/10 shrink-0">
            <div className="flex flex-col text-right">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Conclusão Geral</span>
              <span className="text-xl font-extrabold text-white">{globalPercent}%</span>
              <span className="text-[8px] text-emerald-400">{completedTasks}/{totalTasks} checklists ok</span>
            </div>
            <div className="w-1.5 h-12 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="bg-primary-purple h-full transition-all duration-1000"
                style={{ height: `${globalPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-white/5">
          <Button 
            className="bg-primary-purple hover:bg-neon-purple text-white text-xs font-bold h-10 px-5 rounded-lg shadow-lg shadow-primary-purple/20 transition-all active:scale-95"
            onClick={() => {
              localStorage.setItem('ai_context_doc_active', JSON.stringify({
                name: "Análise de Roadmap Geral",
                content: `Considere o progresso físico atual do applet: ${globalPercent}% concluído (${completedTasks}/${totalTasks} tarefas completas). 
Abaixo está o status modular:
${phases.map(p => `- ${p.title}: ${p.percent}% (${p.completed}/${p.total} tarefas, Status: ${p.status})`).join("\n")}

Por favor, analise esses gargalos e formule o escopo estratégico para a próxima sprint técnico-operativa focando especialmente nos itens marcados como não-concluídos.`
              }));
              onNavigateAI("ai_support");
            }}
          >
            <Sparkles className="w-3.5 h-3.5 mr-2" />
            Analisar Backlog com Nexus AI
          </Button>

          <Button 
            variant="outline"
            className="border-white/10 hover:bg-white/5 text-gray-400 hover:text-white text-xs font-bold h-10 px-4 rounded-lg flex items-center gap-2"
            onClick={fetchRoadmap}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Sincronizar Arquivos
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          <div className="h-16 w-full bg-white/5 animate-pulse rounded-xl border border-white/10"></div>
          <div className="h-16 w-full bg-white/5 animate-pulse rounded-xl border border-white/10 [animation-delay:0.1s]"></div>
          <div className="h-16 w-full bg-white/5 animate-pulse rounded-xl border border-white/10 [animation-delay:0.2s]"></div>
        </div>
      ) : error ? (
        <div className="glass-panel p-8 border-amber-500/20 bg-amber-500/5 text-center flex flex-col items-center gap-2 rounded-2xl border">
          <Activity className="w-10 h-10 text-amber-500 animate-pulse" />
          <p className="text-sm font-bold text-white">Erro ao ler os metadados do Roadmap</p>
          <p className="text-xs text-gray-400 max-w-sm">Verifique se o arquivo `/src/projetos/documentacao/roadmap.md` existe e está formatado com cabeçalhos e listas de tarefas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Phases Grid */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            {phases.map((phase, idx) => {
              const isOpen = expandedIndex === idx;
              const isCompleted = phase.status === "Concluído";
              const inProgress = phase.status === "Em Progresso";

              return (
                <div 
                  key={idx}
                  className={`glass-panel border border-white/5 bg-black/40 hover:bg-neutral-900/40 rounded-xl overflow-hidden transition-all duration-300 ${
                    isOpen ? "border-primary-purple/20 bg-primary-purple/5" : ""
                  }`}
                >
                  <div 
                    className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                    onClick={() => setExpandedIndex(isOpen ? null : idx)}
                  >
                    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] uppercase font-mono text-gray-500 font-bold">FASE {idx + 1}</span>
                        <Badge className={`text-[9px] font-bold tracking-tight rounded-md border-0 ${
                          isCompleted ? "bg-emerald-500/10 text-emerald-400" :
                          inProgress ? "bg-amber-500/10 text-amber-400 animate-pulse" :
                          "bg-white/10 text-gray-400"
                        }`}>
                          {phase.status.toUpperCase()}
                        </Badge>
                      </div>
                      <h4 className="font-extrabold text-white text-sm truncate">{phase.title}</h4>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex flex-col text-right text-xs">
                        <span className="font-bold text-white">{phase.percent}%</span>
                        <span className="text-[9px] text-gray-500">{phase.completed}/{phase.total} done</span>
                      </div>
                      <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                        <div 
                          className={`h-full transition-all duration-500 ${isCompleted ? "bg-emerald-400" : "bg-primary-purple"}`}
                          style={{ width: `${phase.percent}%` }}
                        ></div>
                      </div>
                      <div>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-white/5 px-5 py-4 bg-black/20 animate-in slide-in-from-top-1 duration-200">
                      {phase.tasks.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">Nenhuma tarefa listada nesta fase.</p>
                      ) : (
                        <div className="flex flex-col gap-2.5">
                          {phase.tasks.map((task, tIdx) => (
                            <div key={tIdx} className="flex items-start gap-2.5">
                              {task.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <Clock className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
                              )}
                              <span className={`text-xs ${task.completed ? "text-gray-400 line-through decoration-white/10" : "text-gray-200"}`}>
                                {task.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sidebar Insights */}
          <div className="flex flex-col gap-4">
            <div className="glass-panel p-6 border border-white/5 bg-black/40 rounded-xl">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary-purple animate-pulse" /> Insights de Gestão
              </h4>
              <div className="flex flex-col gap-4 text-xs leading-relaxed text-gray-400">
                <p>
                  O gráfico de progresso demonstra excelente nível modular e responsabilidade de código. A maior parte das funcionalidades de rascunhos e estúdios foi unificada em Sandbox.
                </p>
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col gap-1.5">
                  <span className="text-[10px] text-gray-500 uppercase font-extrabold uppercase leading-none">Ponto de Atenção</span>
                  <p className="text-amber-400/90 leading-normal text-[11px] font-medium">
                    A Fase 4 (Monetização Avançada) requer atenção no desenvolvimento do gateway de pagamentos real. Toda lógica financeira foi blindada para aceitar apenas operações originadas no backend.
                  </p>
                </div>
                <div className="p-3 bg-primary-purple/10 border border-primary-purple/20 rounded-xl flex flex-col gap-1.5">
                  <span className="text-[10px] text-primary-purple uppercase font-extrabold leading-none">Estratégia Android</span>
                  <p className="text-gray-300 leading-normal text-[11px]">
                    Todas as especificações (sprints e checkpoints) já foram indexadas pelo console e estão prontas para transpilação em Jetpack Compose nativo com sincronização offline baseada em Room DB.
                  </p>
                </div>
                <Button 
                  variant="outline"
                  className="w-full text-xs font-bold h-10 border-white/10 hover:border-primary-purple/50 flex items-center justify-center gap-2 text-white"
                  onClick={() => {
                    localStorage.setItem('ai_context_doc_active', JSON.stringify({
                      name: "Orientações de Portabilidade Android",
                      content: `Preciso de um plano passo-a-passo e arquitetural para implantar os layouts e views Web do AUDTRILHA no app nativo Android em Kotlin usando Jetpack Compose, garantindo a fidelidade visual das réguas e touch bounds.`
                    }));
                    onNavigateAI("ai_support");
                  }}
                >
                  Ver Requisitos Android <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
