import { useState, useEffect } from "react";
import { Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DocCard } from "./DocCard";
import { RequirementItem } from "./RequirementItem";
import { DocsTabProps, ProjectDoc } from "../types";

export function DocsTab({ onSelectDoc, query, category, refreshKey, moduleStatus }: DocsTabProps) {
  const [docs, setDocs] = useState<ProjectDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/docs")
      .then(res => {
        if (!res.ok) throw new Error("Docs unavailable");
        return res.json();
      })
      .then((data: ProjectDoc[]) => {
        setDocs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [refreshKey]);

  const filteredDocs = docs.filter(d =>
    (category ? d.category === category : true) &&
    (d.name.toLowerCase().includes(query.toLowerCase()) ||
     d.category.toLowerCase().includes(query.toLowerCase()))
  );

  // Dynamic QA stats from checklist docs
  const totalCenarios = filteredDocs.length;
  const drafts = filteredDocs.filter(d => d.name.includes('draft')).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-white">
            {category === 'testes' ? "Casos de Teste & Validações" : "Documentos Essenciais"}
          </h2>
          {category === 'testes' && (
            <Badge className="bg-emerald-500/10 text-emerald-400 border-none px-3 py-1">
              QA STATUS: READY
            </Badge>
          )}
        </div>

        {category === 'testes' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="glass-panel p-4 border-white/5 bg-white/5 flex flex-col gap-1">
              <span className="text-[10px] text-gray-500 uppercase font-bold">Total Cenários</span>
              <span className="text-xl font-bold text-white">{totalCenarios}</span>
            </div>
            <div className="glass-panel p-4 border-white/5 bg-white/5 flex flex-col gap-1">
              <span className="text-[10px] text-gray-500 uppercase font-bold">Aguardando Validação</span>
              <span className="text-xl font-bold text-amber-500">{drafts || 1}</span>
            </div>
            <div className="glass-panel p-4 border-white/5 bg-white/5 flex flex-col gap-1">
              <span className="text-[10px] text-emerald-500 uppercase font-bold">Aprovados</span>
              <span className="text-xl font-bold text-emerald-400">{Math.max(0, totalCenarios - (drafts || 1))}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            <div className="h-16 w-full bg-white/5 animate-pulse rounded-xl"></div>
            <div className="h-16 w-full bg-white/5 animate-pulse rounded-xl [animation-delay:0.2s]"></div>
            <div className="h-16 w-full bg-white/5 animate-pulse rounded-xl [animation-delay:0.4s]"></div>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-8 border border-dashed border-white/10 rounded-xl text-center text-xs text-gray-500">
            Nenhum documento encontrado nesta categoria.
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredDocs.map((doc, idx) => (
              <DocCard
                key={idx}
                title={doc.name.replace('.md', '').replace(/_/g, ' ').toUpperCase()}
                date="Sincronizado"
                type={doc.category.toUpperCase()}
                onClick={() => onSelectDoc(doc)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="glass-panel p-6 border-white/5 bg-black/40">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-500" /> Status por Módulo
          </h3>
          <div className="flex flex-col gap-2">
            {moduleStatus.map((item, idx) => (
              <RequirementItem key={idx} label={item.label} status={item.status} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
