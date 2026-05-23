import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Wand2, FileSearch, MessageSquare, BookOpen, RefreshCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ProjectDoc {
  name: string;
  path: string;
  category: string;
}

interface AppStructure {
  features?: string[];
  [key: string]: unknown;
}

export function AdminAISupport() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Olá! Sou o assistente de inteligência da MangaOS Hub. Tenho acesso aos documentos internos de arquitetura, visão de produto e requisitos. Como posso auxiliar no desenvolvimento do ecossistema hoje?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [projectDocs, setProjectDocs] = useState<ProjectDoc[]>([]);
  const [appStructure, setAppStructure] = useState<AppStructure | null>(null);
  const [docsError, setDocsError] = useState(false);
  const [activeDocName, setActiveDocName] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDocsError(false);
    Promise.all([
      fetch("/api/admin/docs").then(res => {
        if (!res.ok) throw new Error("Docs endpoint unavailable");
        return res.json();
      }),
      fetch("/api/admin/system/structure").then(res => {
        if (!res.ok) throw new Error("Structure endpoint unavailable");
        return res.json();
      })
    ]).then(([docs, structure]) => {
      setProjectDocs(docs);
      setAppStructure(structure);
    }).catch(err => {
      console.error("Error loading system context:", err);
      setDocsError(true);
    });

    // Check for active context document
    const activeDocRaw = localStorage.getItem('ai_context_doc_active');
    if (activeDocRaw) {
      try {
        const parsed = JSON.parse(activeDocRaw);
        if (parsed && parsed.name) {
          setActiveDocName(parsed.name);
        }
      } catch {
        console.warn("Malformed active doc parsing");
      }
    }

    // Check for context from other components (DocViewer → AI navigation)
    const context = localStorage.getItem('ai_context_doc');
    if (context) {
      try {
        const { name } = JSON.parse(context);
        setMessages(prev => [...prev, {
          role: "assistant",
          content: `Carreguei o documento "${name}" na minha memória. Posso ajudá-lo a analisar os requisitos, sugerir melhorias ou planejar a implementação técnica baseada nele.`
        }]);
      } catch {
        console.warn("Malformed ai_context_doc in localStorage");
      } finally {
        localStorage.removeItem('ai_context_doc');
      }
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (overrideInput?: string, mode: "chat" | "technical" = "chat") => {
    const messageToSend = overrideInput || input.trim();
    if (!messageToSend || isLoading) return;

    if (!overrideInput) setInput("");
    setMessages(prev => [...prev, { role: "user", content: messageToSend }]);
    setIsLoading(true);

    try {
      let systemInstruction = `Você é o co-piloto executivo da MangaOS (AUDTRILHA).
      Contexto: O projeto é um Web App (React + Vite + shadcn/ui + Firestore) que será adaptado para Android (Jetpack Compose).
      Estrutura de arquivos do App: ${JSON.stringify(appStructure)}.
      Documentos de projeto disponíveis (${projectDocs.length} docs): ${projectDocs.map(d => `${d.category}/${d.name}`).join(", ")}.`;

      // Inject active document context and CLEAN it after consumption
      const activeDocRaw = localStorage.getItem('ai_context_doc_active');
      if (activeDocRaw) {
        try {
          const { name, content: docContent } = JSON.parse(activeDocRaw);
          // Increase context: use up to 6000 chars (approx 1500 tokens)
          const truncated = docContent.length > 6000
            ? docContent.substring(0, 6000) + "\n\n[...documento truncado por limite de contexto]"
            : docContent;
          systemInstruction += `\n\nCONTEÚDO DO DOCUMENTO ATIVO (${name}):\n${truncated}`;
        } catch {
          console.warn("Malformed ai_context_doc_active in localStorage");
        } finally {
          // Always clean after first use to avoid stale context pollution
          localStorage.removeItem('ai_context_doc_active');
          setActiveDocName(null);
        }
      }

      if (mode === "technical") {
        systemInstruction += `\nFOCO TÉCNICO: Analise a estrutura de arquivos fornecida e a viabilidade desta feature para Android usando Jetpack Compose. Identifique se o código atual segue os padrões de modularidade propostos nas pastas 'features/'. Considere a arquitetura Min-Firestore + Google Drive.`;
      } else {
        systemInstruction += `\nFOCO CORPORATIVO: Ajude na tomada de decisão, roadmap e visão de produto. Use a estrutura de pastas para entender quais módulos já estão implementados. Respeite as regras de negócio do AUDTRILHA (READER/CREATOR/ADMIN roles, billing via backend only).`;
      }

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageToSend,
          systemInstruction
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (data.text) {
        setMessages(prev => [...prev, { role: "assistant", content: data.text }]);
      } else {
        throw new Error("Resposta inválida da IA");
      }
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Erro na conexão com o Nexus AI. Verifique se o servidor backend está ativo em `/api/ai/chat`."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    { text: "Resuma a visão do produto", icon: Sparkles, mode: "chat" as const },
    { text: "Analise viabilidade Android", icon: Wand2, mode: "technical" as const },
    { text: "Sugira novas funcionalidades", icon: MessageSquare, mode: "chat" as const },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[750px]">
      {/* Sidebar for Docs Context */}
      <div className="hidden lg:flex flex-col w-64 glass-panel p-4 border-white/5 bg-black/40 overflow-y-auto">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <BookOpen className="w-3 h-3" /> Memória do Projeto
        </h3>

        {/* Error state */}
        {docsError && (
          <div className="p-3 mb-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-400 leading-tight">
              Servidor offline. Docs não carregados. A IA operará sem contexto de arquivos.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {projectDocs.length > 0 ? (
            projectDocs.map((doc, idx) => (
              <div
                key={idx}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-[10px] text-gray-400 flex items-center gap-2 hover:bg-white/10 transition-colors cursor-default"
                title={doc.path}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary-purple/50 shrink-0"></div>
                <span className="truncate">{doc.name.replace('.md', '')}</span>
                <span className="text-[8px] text-gray-600 uppercase ml-auto shrink-0">{doc.category.slice(0, 3)}</span>
              </div>
            ))
          ) : !docsError ? (
            <div className="p-4 border border-dashed border-white/10 rounded-xl text-[10px] text-gray-500 text-center">
              Carregando índices...
            </div>
          ) : null}
        </div>

        <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-3">
          <div className="p-3 bg-primary-purple/10 rounded-xl border border-primary-purple/20">
            <p className="text-[10px] text-primary-purple font-medium leading-tight">
              {docsError
                ? "⚠️ Backend offline. Contexto de arquivos indisponível."
                : `Nexus AI indexando ${projectDocs.length} documentos em tempo real.`
              }
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-[10px] border-white/10 h-8 font-bold uppercase tracking-widest hover:border-primary-purple/50"
            onClick={() => handleSend("Analise a estrutura de arquivos src/ atual. A organização por features está correta? O que pode ser melhorado para facilitar a migração Android?", "technical")}
          >
            Analisar SRC
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-[10px] border-white/10 h-8 font-bold uppercase tracking-widest hover:border-emerald-500/50"
            onClick={() => handleSend("Sugira 3 melhorias imediatas para o aplicativo baseadas nos requisitos e na estrutura atual.", "chat")}
          >
            Sugestões de App
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col glass-panel p-0 overflow-hidden border-white/5 bg-black/40">
        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-purple/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary-purple" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Nexus Admin Assistant</h2>
              <p className="text-[10px] text-gray-500 tracking-tight">INTELIGÊNCIA CORPORATIVA AUDTRILHA</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!docsError && projectDocs.length > 0 && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono">
                {projectDocs.length} DOCS
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-white"
              onClick={() => setMessages([{ role: "assistant", content: "Memória reiniciada. Como posso ajudar?" }])}
              title="Reiniciar conversa"
            >
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
        >
          <AnimatePresence initial={false}>
            {messages.map((m, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-4 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                    m.role === "user" ? "bg-white text-black" : "bg-primary-purple text-white"
                  }`}>
                    {m.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={`flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">
                      {m.role === "user" ? "Administrador" : "Nexus AI"}
                    </span>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                      ? "bg-white/10 text-white border border-white/20 rounded-tr-none shadow-xl"
                      : "bg-primary-purple/10 text-gray-200 border border-primary-purple/20 rounded-tl-none shadow-lg"
                    }`}>
                      {m.content}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-4 max-w-[85%]">
                <div className="w-10 h-10 rounded-xl bg-primary-purple text-white flex items-center justify-center shadow-lg animate-pulse">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="p-4 rounded-2xl rounded-tl-none bg-white/5 border border-white/10 flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-purple animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-purple animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-purple animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">Analisando contexto...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 flex flex-col gap-4 bg-white/5">
          {activeDocName && (
            <div className="flex items-center justify-between px-4 py-2 bg-primary-purple/15 border border-primary-purple/20 rounded-xl animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary-purple animate-pulse" />
                <p className="text-xs text-gray-300">
                  Focado no documento: <span className="font-extrabold text-white font-mono">{activeDocName.replace('.md', '').replace(/_/g, ' ').toUpperCase()}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('ai_context_doc_active');
                  setActiveDocName(null);
                }}
                className="text-[9px] font-black uppercase text-gray-400 hover:text-red-400 transition-colors"
              >
                Limpar Memória
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s.text, s.mode)}
                className="px-4 py-2 bg-white/5 hover:bg-primary-purple/20 border border-white/10 hover:border-primary-purple/50 rounded-xl text-xs text-gray-400 hover:text-white transition-all flex items-center gap-2 group"
              >
                <s.icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-primary-purple" />
                {s.text}
              </button>
            ))}
          </div>

          <div className="flex gap-3 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Pergunte sobre requisitos, roadmap ou regras de negócio..."
              className="bg-black/60 border-white/10 text-white pr-28 h-12 rounded-xl focus:border-primary-purple/50 focus:ring-0 placeholder:text-gray-600"
            />
            <Button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="absolute right-1 top-1 h-10 px-5 bg-primary-purple hover:bg-neon-purple text-white shadow-xl font-bold uppercase text-[10px] tracking-widest transition-all hover:scale-105 active:scale-95"
            >
              {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : "Enviar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
