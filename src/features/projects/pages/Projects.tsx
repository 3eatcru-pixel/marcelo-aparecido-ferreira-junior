import {
  FileText,
  GitMerge,
  Layout,
  Database,
  CheckSquare,
  Plus,
  TrendingUp,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProjectsProps, ProjectDoc, ModuleStatusItem } from "../types";
import { TabButton } from "../components/TabButton";
import { DocsTab } from "../components/DocsTab";
import { DocViewer } from "../components/DocViewer";
import { RoadmapGenerator } from "../components/RoadmapGenerator";

export function Projects({ onNavigate }: ProjectsProps) {
  const navigate = useNavigate();
  const handleNavigateAI = onNavigate || (() => navigate("/admin"));
  
  const [activeTab, setActiveTab] = useState("docs");
  const [selectedDoc, setSelectedDoc] = useState<ProjectDoc | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocCat, setNewDocCat] = useState("documentacao");
  const [refreshKey, setRefreshKey] = useState(0);

  // Status indexer for audit conformity
  const [moduleStatus] = useState<ModuleStatusItem[]>([
    { label: "Auth & Onboarding", status: "Concluído" },
    { label: "Reader (Novel + Manga)", status: "Concluído" },
    { label: "Novel Studio", status: "Concluído" },
    { label: "Manga Studio", status: "Concluído" },
    { label: "Character Forge", status: "Concluído" },
    { label: "AI Studio (Nexus)", status: "Concluído" },
    { label: "Comunidade & Social", status: "Concluído" },
    { label: "Monetização (Coins)", status: "Concluído" },
    { label: "Analytics", status: "Concluído" },
    { label: "Admin Hub", status: "Concluído" },
    { label: "Gateway de Pagamento", status: "Planejado" },
    { label: "Notificações Push", status: "Planejado" },
    { label: "Android App", status: "Futuro" },
    { label: "Mensagens Diretas", status: "Futuro" },
  ]);

  const completedCount = moduleStatus.filter(m => m.status === "Concluído").length;
  const inProgressCount = moduleStatus.filter(m => m.status === "Em Progresso").length;
  const modularPercent = Math.round(((completedCount + inProgressCount * 0.5) / moduleStatus.length) * 100);

  const handleCreate = async () => {
    if (!newDocName) return;
    const fileName = newDocName.toLowerCase().replace(/\s+/g, '_') + '.md';
    const filePath = `${newDocCat}/${fileName}`;
    
    try {
      const response = await fetch("/api/admin/docs/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath,
          content: `# ${newDocName}\n\n[Adicione conteúdo aqui...]`
        })
      });
      if (response.ok) {
        setIsCreating(false);
        setNewDocName("");
        setRefreshKey(prev => prev + 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (selectedDoc) {
    return (
      <div className={onNavigate ? "" : "max-w-[1600px] mx-auto w-full px-4 md:px-8 pt-8"}>
        <DocViewer doc={selectedDoc} onBack={() => setSelectedDoc(null)} onNavigateAI={handleNavigateAI} />
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-8 w-full pb-12 ${onNavigate ? "" : "max-w-[1600px] mx-auto px-4 md:px-8 pt-8"}`}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col">
          <h2 className="text-3xl font-black text-white tracking-tight">
            Hub de Projetos
          </h2>
          <p className="text-sm text-gray-400">Documentação modular, UX/UI e Validação Android.</p>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-4 bg-primary-purple/10 p-4 rounded-2xl border border-primary-purple/20">
              <div className="flex flex-col text-right">
                  <span className="text-[10px] text-primary-purple font-black uppercase tracking-widest leading-none mb-1">Status Modular</span>
                  <span className={`font-bold text-lg leading-none ${
                    modularPercent >= 80 ? "text-emerald-400" :
                    modularPercent >= 50 ? "text-amber-400" : "text-red-400"
                  }`}>{modularPercent}% OK</span>
                  <span className="text-[9px] text-gray-600 leading-none mt-0.5">{completedCount}/{moduleStatus.length} módulos</span>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-primary-purple/30 border-t-primary-purple flex items-center justify-center animate-spin-slow">
                  <TrendingUp className="w-4 h-4 text-primary-purple" />
              </div>
           </div>

           <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl h-12 pl-10 pr-4 text-sm text-white focus:border-primary-purple/50 outline-none w-[180px] lg:w-[250px] transition-all"
                />
              </div>
              <Button 
                onClick={() => setIsCreating(true)}
                className="bg-primary-purple hover:bg-neon-purple text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-primary-purple/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo
              </Button>
           </div>
        </div>
      </div>

      {isCreating && (
        <div className="glass-panel p-6 border-primary-purple/30 bg-primary-purple/5 animate-in slide-in-from-top-4 duration-500">
           <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">Criar Novo Documento de Projeto</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-1.5">
                 <label className="text-[10px] text-gray-500 font-bold uppercase">Nome do Documento</label>
                 <input 
                   type="text" 
                   value={newDocName}
                   onChange={e => setNewDocName(e.target.value)}
                   placeholder="Ex: Novo Requisito Android"
                   className="bg-black/60 border border-white/10 rounded-lg h-10 px-4 text-sm text-white outline-none focus:border-primary-purple/50"
                 />
              </div>
              <div className="flex flex-col gap-1.5">
                 <label className="text-[10px] text-gray-500 font-bold uppercase">Categoria</label>
                 <select 
                   value={newDocCat}
                   onChange={e => setNewDocCat(e.target.value)}
                   className="bg-black/60 border border-white/10 rounded-lg h-10 px-4 text-sm text-white outline-none focus:border-primary-purple/50"
                 >
                   <option value="documentacao">Documentação</option>
                   <option value="requisitos">Requisitos</option>
                   <option value="wireframes">UX/UI</option>
                   <option value="fluxos">Fluxos</option>
                   <option value="prototipos">Protótipos</option>
                   <option value="testes">Testes & QA</option>
                 </select>
              </div>
           </div>
           <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-white">Cancelar</Button>
              <Button size="sm" onClick={handleCreate} className="bg-primary-purple hover:bg-neon-purple text-white">Criar Documento</Button>
           </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto scrollbar-none">
        <TabButton
          active={activeTab === "docs"}
          onClick={() => setActiveTab("docs")}
          icon={FileText}
        >
          Documentos
        </TabButton>
        <TabButton
          active={activeTab === "requisitos"}
          onClick={() => setActiveTab("requisitos")}
          icon={Database}
        >
          Requisitos
        </TabButton>
        <TabButton
          active={activeTab === "flows"}
          onClick={() => setActiveTab("flows")}
          icon={GitMerge}
        >
          Fluxos
        </TabButton>
        <TabButton
          active={activeTab === "wireframes"}
          onClick={() => setActiveTab("wireframes")}
          icon={Layout}
        >
          UX/UI
        </TabButton>
        <TabButton
          active={activeTab === "prototypes"}
          onClick={() => setActiveTab("prototypes")}
          icon={Layout}
        >
          Protótipos
        </TabButton>
        <TabButton
          active={activeTab === "tests"}
          onClick={() => setActiveTab("tests")}
          icon={CheckSquare}
        >
          Testes & QA
        </TabButton>
        <TabButton
          active={activeTab === "roadmap"}
          onClick={() => setActiveTab("roadmap")}
          icon={TrendingUp}
        >
          Roadmap AI
        </TabButton>
      </div>

      {(activeTab === "docs" || activeTab === "requisitos" || activeTab === "wireframes" || activeTab === "tests" || activeTab === "flows" || activeTab === "prototypes") && (
        <DocsTab 
          onSelectDoc={setSelectedDoc} 
          query={searchQuery} 
          category={
            activeTab === "docs" ? "documentacao" : 
            activeTab === "requisitos" ? "requisitos" : 
            activeTab === "wireframes" ? "wireframes" : 
            activeTab === "flows" ? "fluxos" :
            activeTab === "prototypes" ? "prototipos" :
            "testes"
          } 
          refreshKey={refreshKey}
          moduleStatus={moduleStatus}
        />
      )}

      {activeTab === "roadmap" && <RoadmapGenerator onNavigateAI={handleNavigateAI} />}
    </div>
  );
}
