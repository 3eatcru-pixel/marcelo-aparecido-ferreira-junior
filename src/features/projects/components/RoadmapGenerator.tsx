import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoadmapGeneratorProps } from "../types";

export function RoadmapGenerator({ onNavigateAI }: RoadmapGeneratorProps) {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      <div className="glass-panel p-10 border-primary-purple/30 bg-primary-purple/5 flex flex-col items-center text-center">
        <Sparkles className="w-12 h-12 text-primary-purple mb-4 animate-pulse" />
        <h3 className="text-xl font-bold text-white mb-2">Nexus AI: Gerador de Roadmap</h3>
        <p className="text-gray-400 max-w-lg mb-8 text-sm">
          A inteligência artificial irá analisar todos os seus documentos de requisitos e fluxos 
          para sugerir as próximas 3 sprints de desenvolvimento Web e Android.
        </p>
        <Button 
          className="bg-primary-purple hover:bg-neon-purple text-white px-8 h-12 rounded-full font-bold shadow-lg shadow-primary-purple/20 transition-all hover:scale-105"
          onClick={() => {
            localStorage.setItem('ai_context_doc_active', JSON.stringify({
              name: "Nexus Roadmap",
              content: "Por favor, gere um Roadmap detalhado com 3 sprints, dividindo as tarefas em Web (React) e Mobile (Jetpack Compose), considerando os requisitos e documentos de projeto indexados."
            }));
            onNavigateAI("ai_support");
          }}
        >
          Gerar Roadmap Estratégico
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-50">
        <div className="glass-panel p-6 border-white/5 flex flex-col gap-4">
          <Badge className="bg-white/10 text-gray-500 w-fit">Sprint 1</Badge>
          <div className="h-4 w-full bg-white/5 rounded"></div>
          <div className="h-4 w-2/3 bg-white/5 rounded"></div>
        </div>
        <div className="glass-panel p-6 border-white/5 flex flex-col gap-4">
          <Badge className="bg-white/10 text-gray-500 w-fit">Sprint 2</Badge>
          <div className="h-4 w-full bg-white/5 rounded"></div>
          <div className="h-4 w-2/3 bg-white/5 rounded"></div>
        </div>
        <div className="glass-panel p-6 border-white/5 flex flex-col gap-4">
          <Badge className="bg-white/10 text-gray-500 w-fit">Sprint 3</Badge>
          <div className="h-4 w-full bg-white/5 rounded"></div>
          <div className="h-4 w-2/3 bg-white/5 rounded"></div>
        </div>
      </div>
    </div>
  );
}
