import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { NovelSidebar } from '../components/NovelSidebar';
import { 
  Search, Plus, User, MapPin, Box, Hash, Network, BookOpen, Clock, 
  ChevronLeft, Trash2, Calendar, Target, AlertCircle, Heart, Users, Sparkles
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { AICreatorApprovalGuard } from '@/features/aistudio/components/AICreatorApprovalGuard';

export function StoryBible() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAppStore();
  const [projectTitle, setProjectTitle] = useState("Bíblia da História");
  const [loading, setLoading] = useState(true);
  
  // Dynamic Bible Collections
  const [characters, setCharacters] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "characters" | "locations" | "concepts">("all");

  // Record Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"character" | "location" | "concept" | "timeline">("character");
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    role: "PRINCIPAL",
    subtitle: "",
    bio: "",
    desc: "",
    ability: "",
    date: ""
  });

  const [aiProposal, setAiProposal] = useState<{
    type: string;
    ability?: string;
    bio?: string;
    subtitle?: string;
    desc?: string;
    date?: string;
    text: string;
  } | null>(null);

  // Load Bible Data
  const loadBibleData = async () => {
    if (!id) return;

    if (id === "sandbox-test") {
      setLoading(true);
      try {
        const localData = localStorage.getItem("audtrilha_sandbox_bible_data");
        if (localData) {
          const parsed = JSON.parse(localData);
          setCharacters(parsed.characters || []);
          setLocations(parsed.locations || []);
          setConcepts(parsed.concepts || []);
          setTimeline(parsed.timeline || []);
        } else {
          const defaultChars = [
            { id: "char-1", name: "Hiro Shi", role: "PRINCIPAL", bio: "O herói relutante.", createdAt: Date.now() },
            { id: "char-2", name: "Elena Kra", role: "SECUNDARIO", bio: "A rebelde mecânica.", createdAt: Date.now() }
          ];
          const defaultLocs = [
            { id: "loc-1", title: "Cidadela de Neon", subtitle: "Capital de Ferro", desc: "A última metrópole habitável antes da borda do vazio estelar.", createdAt: Date.now() }
          ];
          const defaultCons = [
            { id: "con-1", title: "Sintonia Estelar", subtitle: "Sistema de Magias", desc: "Habilidade milenar para absorver radiações de supernovas no corpo.", createdAt: Date.now() }
          ];
          const defaultTime = [
            { id: "time-1", title: "A queda do sol eterno", date: "Ano 0", desc: "Estrela central entra em colapso total.", createdAt: Date.now() }
          ];
          setCharacters(defaultChars);
          setLocations(defaultLocs);
          setConcepts(defaultCons);
          setTimeline(defaultTime);
          localStorage.setItem("audtrilha_sandbox_bible_data", JSON.stringify({
            characters: defaultChars,
            locations: defaultLocs,
            concepts: defaultCons,
            timeline: defaultTime
          }));
        }
      } catch (e) {
        console.error("Local Bible load failed:", e);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      // 1. Load Characters
      const charSnap = await getDocs(collection(db, "projects", id, "characters"));
      const charList = charSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCharacters(charList);

      // 2. Load Locations
      const locSnap = await getDocs(collection(db, "projects", id, "locations"));
      const locList = locSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLocations(locList);

      // 3. Load Concepts
      const conSnap = await getDocs(collection(db, "projects", id, "concepts"));
      const conList = conSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setConcepts(conList);

      // 4. Load Timeline
      const timeSnap = await getDocs(collection(db, "projects", id, "timeline"));
      const timeList = timeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTimeline(timeList.sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0)));
    } catch (err) {
      console.error("Error fetching project Bible:", err);
    } finally {
      setLoading(false);
    }
  };

  // Seeding Default Bible when empty
  const seedDefaultBible = async () => {
    if (!id || id === "sandbox-test") return;
    try {
      const charCol = collection(db, "projects", id, "characters");
      const charSnap = await getDocs(charCol);
      if (charSnap.empty) {
        toast.info("Configurando Bíblia Inicial do Projeto...");
        await addDoc(collection(db, "projects", id, "locations"), {
          title: "Cidadela de Neon",
          subtitle: "Capital de Ferro",
          desc: "A última metrópole habitável antes da borda do vazio estelar.",
          x: "48%",
          y: "35%",
          createdAt: Date.now()
        });

        await addDoc(collection(db, "projects", id, "concepts"), {
          title: "Sintonia Estelar",
          subtitle: "Sistema de Magias",
          desc: "Habilidade milenar para absorver radiações de supernovas no corpo físico.",
          createdAt: Date.now()
        });

        await addDoc(collection(db, "projects", id, "timeline"), {
          title: "A queda do sol eterno",
          date: "Ano 0",
          desc: "Estrela central entra em colapso total, criando a cortina de fumaça cinza.",
          createdAt: Date.now()
        });

        await loadBibleData();
        toast.success("Bíblia inicial criada com sucesso!");
      }
    } catch (err) {
      console.error("Error seeding default project elements:", err);
    }
  };

  useEffect(() => {
    const loadProjectAndBible = async () => {
      if (!id || !currentUser) return;
      if (id === "sandbox-test") {
        setProjectTitle("Novel Studio Sandbox");
        await loadBibleData();
        return;
      }
      try {
        const docRef = doc(db, "projects", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProjectTitle(docSnap.data().title || "Sem título");
        }
        await loadBibleData();
      } catch (err) {
        console.error("Error loading project title", err);
      }
    };
    loadProjectAndBible().then(() => {
      seedDefaultBible();
    });
  }, [id, currentUser]);

  // Handle addition of standard elements
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const mainTitle = modalType === "character" ? formData.name : formData.title;
    if (!mainTitle.trim()) {
      toast.error("Por favor, preencha o título ou nome principal.");
      return;
    }

    if (id === "sandbox-test") {
      try {
        const currentData = JSON.parse(localStorage.getItem("audtrilha_sandbox_bible_data") || '{"characters":[],"locations":[],"concepts":[],"timeline":[]}');
        const customId = `local_${Date.now()}`;
        
        let newRecord: any = {};
        if (modalType === "character") {
          newRecord = {
            id: customId,
            name: formData.name.trim(),
            role: formData.role,
            ability: formData.ability.trim(),
            bio: formData.bio.trim(),
            createdAt: Date.now()
          };
          currentData.characters.push(newRecord);
          // Also sync to general character list
          localStorage.setItem("audtrilha_sandbox_characters", JSON.stringify(currentData.characters));
          toast.success(`Personagem "${formData.name}" adicionado.`);
        } else if (modalType === "location") {
          newRecord = {
            id: customId,
            title: formData.title.trim(),
            subtitle: formData.subtitle.trim() || "Local do Mundo",
            desc: formData.desc.trim(),
            x: `${Math.floor(Math.random() * 60) + 20}%`,
            y: `${Math.floor(Math.random() * 60) + 20}%`,
            createdAt: Date.now()
          };
          currentData.locations.push(newRecord);
          toast.success(`Localidade "${formData.title}" registrada.`);
        } else if (modalType === "concept") {
          newRecord = {
            id: customId,
            title: formData.title.trim(),
            subtitle: formData.subtitle.trim() || "Doutrina de Magia",
            desc: formData.desc.trim(),
            createdAt: Date.now()
          };
          currentData.concepts.push(newRecord);
          toast.success(`Lei/Conceito "${formData.title}" salvo.`);
        } else if (modalType === "timeline") {
          newRecord = {
            id: customId,
            title: formData.title.trim(),
            date: formData.date.trim() || "Século Desconhecido",
            desc: formData.desc.trim(),
            createdAt: Date.now()
          };
          currentData.timeline.push(newRecord);
          toast.success(`Evento cronológico "${formData.title}" salvo.`);
        }

        localStorage.setItem("audtrilha_sandbox_bible_data", JSON.stringify(currentData));
        setIsModalOpen(false);
        setFormData({
          name: "",
          title: "",
          role: "PRINCIPAL",
          subtitle: "",
          bio: "",
          desc: "",
          ability: "",
          date: ""
        });
        await loadBibleData();
      } catch (err) {
        console.error("Local add failed:", err);
        toast.error("Erro ao salvar rascunho localmente.");
      }
      return;
    }

    try {
      if (modalType === "character") {
        const charSlug = formData.name.trim().toLowerCase().split(' ')[0].replace(/[^a-z0-9]/g, '');
        const customId = `${id}_${charSlug}_${Date.now().toString().slice(-4)}`;
        await setDoc(doc(db, "projects", id, "characters", customId), {
          id: customId,
          name: formData.name.trim(),
          role: formData.role,
          ability: formData.ability.trim(),
          bio: formData.bio.trim(),
          createdAt: Date.now()
        });
        toast.success(`Personagem "${formData.name}" adicionado.`);
      } else if (modalType === "location") {
        await addDoc(collection(db, "projects", id, "locations"), {
          title: formData.title.trim(),
          subtitle: formData.subtitle.trim() || "Local do Mundo",
          desc: formData.desc.trim(),
          x: `${Math.floor(Math.random() * 60) + 20}%`,
          y: `${Math.floor(Math.random() * 60) + 20}%`,
          createdAt: Date.now()
        });
        toast.success(`Localidade "${formData.title}" registrada.`);
      } else if (modalType === "concept") {
        await addDoc(collection(db, "projects", id, "concepts"), {
          title: formData.title.trim(),
          subtitle: formData.subtitle.trim() || "Doutrina de Magia",
          desc: formData.desc.trim(),
          createdAt: Date.now()
        });
        toast.success(`Lei/Conceito "${formData.title}" salvo.`);
      } else if (modalType === "timeline") {
        await addDoc(collection(db, "projects", id, "timeline"), {
          title: formData.title.trim(),
          date: formData.date.trim() || "Século Desconhecido",
          desc: formData.desc.trim(),
          createdAt: Date.now()
        });
        toast.success(`Evento cronológico "${formData.title}" salvo.`);
      }

      setIsModalOpen(false);
      // Reset inputs
      setFormData({
        name: "",
        title: "",
        role: "PRINCIPAL",
        subtitle: "",
        bio: "",
        desc: "",
        ability: "",
        date: ""
      });
      loadBibleData();
    } catch (err) {
      console.error("Failed adding bible node:", err);
      toast.error("Erro interno ao propagar registro no Firestore.");
    }
  };

  // Delete records from active model
  const handleDeleteNode = async (type: "character" | "location" | "concept" | "timeline", recordId: string) => {
    if (!id) return;

    if (id === "sandbox-test") {
      try {
        const currentData = JSON.parse(localStorage.getItem("audtrilha_sandbox_bible_data") || '{"characters":[],"locations":[],"concepts":[],"timeline":[]}');
        if (type === "character") {
          currentData.characters = currentData.characters.filter((c: any) => c.id !== recordId);
          localStorage.setItem("audtrilha_sandbox_characters", JSON.stringify(currentData.characters));
        } else if (type === "location") {
          currentData.locations = currentData.locations.filter((l: any) => l.id !== recordId);
        } else if (type === "concept") {
          currentData.concepts = currentData.concepts.filter((c: any) => c.id !== recordId);
        } else if (type === "timeline") {
          currentData.timeline = currentData.timeline.filter((t: any) => t.id !== recordId);
        }

        localStorage.setItem("audtrilha_sandbox_bible_data", JSON.stringify(currentData));
        toast.success("Conteúdo expurgado do lore oficial.");
        await loadBibleData();
      } catch (err) {
        console.error("Local delete failed:", err);
        toast.error("Erro ao expurgar documento localmente.");
      }
      return;
    }

    try {
      const colName = type === "character" ? "characters" : type === "location" ? "locations" : type === "concept" ? "concepts" : "timeline";
      await deleteDoc(doc(db, "projects", id, colName, recordId));
      toast.success("Conteúdo expurgado do lore oficial.");
      loadBibleData();
    } catch (err) {
      console.error("Failed delete:", err);
      toast.error("Erro ao expurgar documento.");
    }
  };

  // Filter lists based on search
  const filteredChars = characters.filter(c => 
    (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.role || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.bio || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLocs = locations.filter(l => 
    (l.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.subtitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.desc || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConcepts = concepts.filter(c => 
    (c.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.subtitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.desc || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] -mx-6 -mt-6">
      <NovelSidebar />

      <div className="flex-1 flex flex-col min-w-0 bg-[#0B0B0F] overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-manga-border px-6 flex items-center justify-between shrink-0 bg-[#0E0E14] backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="hover:bg-white/5 p-1.5 rounded-lg text-gray-400 transition-colors">
               <ChevronLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-purple animate-pulse" /> Bíblia da História
            </h1>
            <div className="h-4 w-px bg-manga-border hidden sm:block" />
            <Badge variant="outline" className="hidden sm:flex border-white/10 text-muted-foreground bg-manga-card">
              {projectTitle}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Buscar lore..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-64 bg-manga-card border border-manga-border rounded-lg pl-9 pr-4 text-xs text-white focus:border-primary-purple focus:outline-none transition-colors" 
              />
            </div>
            
            <div className="relative">
              <Button 
                onClick={() => {
                  setModalType("location");
                  setIsModalOpen(true);
                }}
                className="h-9 bg-primary-purple hover:bg-neon-purple text-white font-bold px-4 text-xs gap-1 shadow-md shadow-primary-purple/20"
              >
                <Plus className="w-4 h-4" /> NOVO REGISTRO
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <Tabs defaultValue="wiki" className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6 shrink-0">
              <TabsList className="bg-manga-card border border-manga-border h-10 p-1">
                <TabsTrigger value="wiki" className="text-xs font-bold px-6 h-full data-[state=active]:bg-primary-purple data-[state=active]:text-white uppercase">Mundos & Registros</TabsTrigger>
                <TabsTrigger value="timeline" className="text-xs font-bold px-6 h-full data-[state=active]:bg-primary-purple data-[state=active]:text-white flex items-center gap-2 uppercase">
                  <Clock className="w-3.5 h-3.5" /> Linha do Tempo
                </TabsTrigger>
                <TabsTrigger value="graph" className="text-xs font-bold px-6 h-full data-[state=active]:bg-accent-blue/50 data-[state=active]:bg-primary-purple data-[state=active]:text-white flex items-center gap-2 uppercase">
                  <Network className="w-3.5 h-3.5" /> Teia de Relações
                </TabsTrigger>
              </TabsList>

              <div className="flex bg-black/40 border border-white/5 rounded-lg p-1 gap-1">
                <button 
                  onClick={() => setActiveCategory("all")}
                  className={`px-3 py-1 rounded text-[10px] font-black tracking-widest uppercase transition-all ${activeCategory === 'all' ? 'bg-[#7C3AED] text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Tudo
                </button>
                <button 
                  onClick={() => setActiveCategory("characters")}
                  className={`px-3 py-1 rounded text-[10px] font-black tracking-widest uppercase transition-all ${activeCategory === 'characters' ? 'bg-[#10B981] text-emerald-950 font-black' : 'text-gray-400 hover:text-white'}`}
                >
                  Personagens
                </button>
                <button 
                  onClick={() => setActiveCategory("locations")}
                  className={`px-3 py-1 rounded text-[10px] font-black tracking-widest uppercase transition-all ${activeCategory === 'locations' ? 'bg-[#06B6D4] text-cyan-950 font-black' : 'text-gray-400 hover:text-white'}`}
                >
                  Locais
                </button>
                <button 
                  onClick={() => setActiveCategory("concepts")}
                  className={`px-3 py-1 rounded text-[10px] font-black tracking-widest uppercase transition-all ${activeCategory === 'concepts' ? 'bg-[#F59E0B] text-amber-950 font-black' : 'text-gray-400 hover:text-white'}`}
                >
                  Conceitos
                </button>
              </div>
            </div>

            {/* TAB 1: LOCAL SEED / WIKI CODES */}
            <TabsContent value="wiki" className="m-0 border-none flex-1 flex flex-col gap-8 outline-none">
              
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
                  <div className="w-10 h-10 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
                  <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Sincronizando deuses & manuscritos do FireStore...</p>
                </div>
              ) : (
                <>
                  {/* Category: Characters */}
                  {(activeCategory === "all" || activeCategory === "characters") && (
                    <section className="flex flex-col gap-4 animate-in fade-in-50 duration-300">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-emerald-400" />
                          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Personagens Ativos</h2>
                          <Badge variant="secondary" className="ml-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{filteredChars.length}</Badge>
                        </div>
                      </div>
                      
                      {filteredChars.length === 0 ? (
                        <p className="text-xs text-gray-500 italic py-4">Nenhum guerreiro registrado sob os parâmetros de busca.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {filteredChars.map((char) => {
                            return (
                            <div key={char.id} className="relative bg-[#111118]/80 border border-white/5 rounded-xl overflow-hidden p-5 hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between h-[180px] group">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteNode("character", char.id); }}
                                  className="absolute top-4 right-4 text-gray-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  title="Expurgar Registro"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              
                              <div>
                                <h3 className="text-sm font-black text-white hover:text-emerald-400 transition-colors uppercase tracking-tight">{char.name}</h3>
                                <Badge className="bg-emerald-500/10 text-emerald-400 text-[9px] border border-emerald-500/20 rounded mt-1.5 uppercase tracking-widest font-black">
                                  {char.role}
                                </Badge>
                                <p className="text-xs text-gray-400 line-clamp-3 mt-3 leading-relaxed leading-tighter italic">
                                  "{char.bio || "Nenhum histórico bibliográfico anexado ainda."}"
                                </p>
                              </div>

                              <div className="flex items-center gap-1 mt-3 pt-2 border-t border-white/5 text-[10px] text-gray-500 uppercase font-mono tracking-widest">
                                <Target className="w-3.5 h-3.5 text-emerald-500" /> Habilidade: {char.ability || "Chama latente"}
                              </div>
                            </div>
                          )})}
                        </div>
                      )}
                    </section>
                  )}

                  {/* Category: Locations */}
                  {(activeCategory === "all" || activeCategory === "locations") && (
                    <section className="flex flex-col gap-4 animate-in fade-in-50 duration-300">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Locais Históricos</h2>
                        <Badge variant="secondary" className="ml-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{filteredLocs.length}</Badge>
                      </div>

                      {filteredLocs.length === 0 ? (
                        <p className="text-xs text-gray-500 italic py-4">Nenhuma localidade pendente.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {filteredLocs.map((loc) => (
                            <div key={loc.id} className="relative bg-[#111118]/80 border border-white/5 rounded-xl overflow-hidden p-5 hover:border-cyan-500/30 transition-all duration-300 flex flex-col justify-between h-[180px] group">
                              <button 
                                onClick={() => handleDeleteNode("location", loc.id)}
                                className="absolute top-4 right-4 text-gray-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                title="Expurgar Registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <div>
                                <h3 className="text-sm font-black text-white hover:text-cyan-400 transition-colors uppercase tracking-tight">{loc.title}</h3>
                                <span className="text-[10px] text-cyan-400 uppercase tracking-widest block font-bold mt-1">{loc.subtitle}</span>
                                <p className="text-xs text-gray-400 line-clamp-3 mt-3 leading-relaxed">
                                  {loc.desc || "A topografia desta fenda dimensional permanece inexplorada pelos cronistas."}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-white/5 text-[10px] text-gray-500 font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" /> Sincronizado no World Map
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  )}

                  {/* Category: Concepts */}
                  {(activeCategory === "all" || activeCategory === "concepts") && (
                    <section className="flex flex-col gap-4 mb-20 animate-in fade-in-50 duration-300">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                        <Hash className="w-4 h-4 text-amber-500" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Magia & Dogmas</h2>
                        <Badge variant="secondary" className="ml-2 bg-amber-500/10 text-amber-500 border border-amber-500/20">{filteredConcepts.length}</Badge>
                      </div>

                      {filteredConcepts.length === 0 ? (
                        <p className="text-xs text-gray-500 italic py-4">Nenhuma lei física ou mistério cósmico cadastrado.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {filteredConcepts.map((con) => (
                            <div key={con.id} className="relative bg-[#111118]/80 border border-white/5 rounded-xl overflow-hidden p-5 hover:border-amber-500/30 transition-all duration-300 flex flex-col justify-between h-[180px] group">
                              <button 
                                onClick={() => handleDeleteNode("concept", con.id)}
                                className="absolute top-4 right-4 text-gray-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                title="Expurgar Registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <div>
                                <h3 className="text-sm font-black text-white hover:text-amber-400 transition-colors uppercase tracking-tight">{con.title}</h3>
                                <span className="text-[10px] text-amber-500 uppercase tracking-widest block font-bold mt-1">{con.subtitle}</span>
                                <p className="text-xs text-gray-400 line-clamp-3 mt-3 leading-relaxed font-mono">
                                  {con.desc}
                                </p>
                              </div>

                              <div className="flex items-center gap-1 mt-3 pt-2 border-t border-white/5 text-[10px] text-amber-400/70 font-bold uppercase tracking-widest">
                                # Sistemas de Regras Ativos
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  )}
                </>
              )}
            </TabsContent>

            {/* TAB 2: RICH TIMELINE (FUNCTIONAL!) */}
            <TabsContent value="timeline" className="m-0 border-none flex-1 flex flex-col justify-between">
              <div className="h-full flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-1.5 uppercase font-bold text-xs tracking-widest text-[#7C3AED]">
                    <Clock className="w-4 h-4" /> Sequência Cronológica de Eventos
                  </div>
                  <Button 
                    onClick={() => {
                      setModalType("timeline");
                      setIsModalOpen(true);
                    }}
                    variant="outline"
                    className="h-7 border-[#7C3AED]/30 hover:border-[#7C3AED]/70 hover:bg-[#7C3AED]/10 text-xs text-[#7C3AED]"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Ponto no Tempo
                  </Button>
                </div>

                {timeline.length === 0 ? (
                  <div className="bg-[#111118]/80 border border-white/5 rounded-xl p-12 text-center max-w-md mx-auto my-10 flex flex-col items-center gap-3">
                    <Calendar className="w-8 h-8 text-gray-500" />
                    <p className="text-xs text-gray-400">Nenhum evento histórico cronometrado nesta Bíblia.</p>
                    <p className="text-[11px] text-gray-500">Crie eras, impérios e momentos de clímax clicando acima.</p>
                  </div>
                ) : (
                  <div className="relative border-l-2 border-primary-purple/30 ml-4 pl-8 py-4 space-y-8 flex-1">
                    {timeline.map((event, idx) => (
                      <div key={event.id} className="relative group">
                        {/* Dot */}
                        <span className="absolute -left-[41px] top-1.5 w-4 h-4 rounded-full border-2 border-primary-purple bg-[#0B0B0F] z-10 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 bg-primary-purple rounded-full scale-100 group-hover:scale-125 transition-transform" />
                        </span>

                        <div className="bg-[#111118] border border-white/5 rounded-2xl p-5 hover:border-primary-purple/40 max-w-2xl relative transition-colors">
                          <button 
                            onClick={() => handleDeleteNode("timeline", event.id)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remover Evento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-[#7C3AED]/10 text-[#A78BFA] border border-[#7C3AED]/20 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md font-mono">
                              {event.date}
                            </span>
                          </div>

                          <h3 className="text-sm font-black text-white hover:text-primary-purple transition-colors uppercase tracking-tight">{event.title}</h3>
                          <p className="text-xs text-gray-400 leading-relaxed mt-2 italic">
                            "{event.desc}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 3: CHARACTER INTERACTIVE RELATION MAP (GRAPH!) */}
            <TabsContent value="graph" className="m-0 border-none flex-1 flex flex-col">
              <div className="w-full border-b border-white/5 pb-2 mb-4 shrink-0">
                <div className="text-xs uppercase font-bold text-[#A78BFA] tracking-widest flex items-center gap-1.5">
                  <Network className="w-4 h-4 animate-pulse" /> Teia Dinâmica de Alianças e Rivalidades
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Conexões geradas automaticamente com base na hierarquia e nos papéis definidos nas fichas de personagens.</p>
              </div>

              {characters.length < 2 ? (
                <div className="bg-[#111118]/80 border border-white/5 rounded-2xl p-12 text-center max-w-sm mx-auto my-12 flex flex-col items-center gap-3">
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                  <p className="text-xs text-gray-300 font-bold">Personagens Insuficientes</p>
                  <p className="text-[11px] text-gray-500">Registre pelo menos 2 personagens na aba "Mundos & Registros" para que a teia de relações possa ser desenhada.</p>
                </div>
              ) : (() => {
                const protagonist = characters.find(c => c.role === "PRINCIPAL") || characters[0];
                const otherChars = characters.filter(c => c.id !== protagonist?.id);

                const computedNodes = characters.map((char) => {
                  if (characters.length === 2) {
                    const isProt = char.id === protagonist.id;
                    return { ...char, x: isProt ? 30 : 70, y: 50 };
                  }
                  if (char.id === protagonist?.id) {
                    return { ...char, x: 50, y: 50 };
                  }
                  const otherIndex = otherChars.findIndex(oc => oc.id === char.id);
                  const totalOthers = otherChars.length;
                  const angle = (otherIndex * 2 * Math.PI) / Math.max(1, totalOthers);
                  const x = 50 + 32 * Math.cos(angle);
                  const y = 50 + 26 * Math.sin(angle);
                  return { ...char, x, y };
                });

                const connections = computedNodes
                  .filter(node => node.id !== protagonist.id)
                  .map(node => {
                    let color = "#7C3AED"; 
                    let themeClass = "border-[#7C3AED]";
                    let bgBadge = "bg-[#7C3AED]/20 text-[#A78BFA] border-[#7C3AED]/30";
                    let label = "Interpolação Narrativa";

                    if (node.role === "ANTAGONISTA") {
                      color = "#EF4444";
                      themeClass = "border-red-500";
                      bgBadge = "bg-red-500/20 text-red-400 border-red-500/30";
                      label = "Rivalidade / Conflito Direto";
                    } else if (node.role === "CO-PROTAGONISTA") {
                      color = "#06B6D4";
                      themeClass = "border-cyan-500";
                      bgBadge = "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
                      label = "Aliança / Pacto de Destino";
                    } else if (node.role === "SECUNDÁRIO") {
                      color = "#10B981";
                      themeClass = "border-emerald-500";
                      bgBadge = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
                      label = "Suporte Narrativo / Mentor";
                    }

                    const isTwo = characters.length === 2;
                    const midX = isTwo ? 50 : 50 + (node.x - 50) * 0.55;
                    const midY = isTwo ? 45 : 50 + (node.y - 50) * 0.55;

                    return {
                      target: node,
                      color,
                      themeClass,
                      bgBadge,
                      label,
                      midX: `${midX}%`,
                      midY: `${midY}%`
                    };
                  });

                return (
                  <div className="flex-1 min-h-[500px] bg-black/40 border border-white/5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                    {/* Cyber grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
                    
                    {/* Dynamic Connection lines in SVG code */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                      {connections.map((conn, idx) => {
                        const targetX = `${conn.target.x}%`;
                        const targetY = `${conn.target.y}%`;
                        return (
                          <line 
                            key={idx}
                            x1="50%" 
                            y1="50%" 
                            x2={targetX} 
                            y2={targetY} 
                            stroke={conn.color} 
                            strokeWidth="2" 
                            strokeDasharray={conn.target.role === "ANTAGONISTA" ? "0" : "5,3"}
                            strokeOpacity="0.85"
                          />
                        );
                      })}
                    </svg>

                    {/* Nodes and Connection badget labels layered dynamically */}
                    <div className="absolute inset-0 z-10 w-full h-full">
                      {/* Protagonist Node centered or positioned left */}
                      <div 
                        style={{ left: `${characters.length === 2 ? 30 : 50}%`, top: "50%", transform: "translate(-50%, -50%)" }}
                        className="absolute w-44 bg-[#09090D] border-2 border-primary-purple rounded-2xl p-3.5 shadow-2xl flex flex-col items-center text-center scale-105"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary-purple/15 border border-[#7C3AED]/40 flex items-center justify-center mb-2 animate-pulse">
                          <User className="w-5 h-5 text-primary-purple" />
                        </div>
                        <span className="text-xs font-black text-white uppercase truncate w-full">{protagonist.name}</span>
                        <span className="text-[8px] bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/30 px-2 py-0.5 rounded-full mt-1.5 font-mono uppercase font-black">
                          {protagonist.role}
                        </span>
                      </div>

                      {/* Connections labels on middle-points */}
                      {connections.map((conn, idx) => (
                        <div 
                          key={idx}
                          style={{ left: conn.midX, top: conn.midY, transform: "translate(-50%, -50%)" }}
                          className={`absolute px-2.5 py-1 rounded-full text-[8.5px] font-black uppercase tracking-wider z-20 shadow-lg select-none ${conn.bgBadge}`}
                        >
                          {conn.label}
                        </div>
                      ))}

                      {/* Satellite Nodes */}
                      {computedNodes
                        .filter(node => node.id !== protagonist.id)
                        .map((node, idx) => {
                          let borderClass = "border-[#10B981]";
                          let roleBadgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                          if (node.role === "ANTAGONISTA") {
                            borderClass = "border-red-500";
                            roleBadgeClass = "bg-red-500/10 text-red-500 border-red-500/20";
                          } else if (node.role === "CO-PROTAGONISTA") {
                            borderClass = "border-cyan-500";
                            roleBadgeClass = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
                          } else if (node.role === "SECUNDÁRIO") {
                            borderClass = "border-emerald-500";
                            roleBadgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                          }

                          return (
                            <div 
                              key={node.id}
                              style={{ left: `${node.x}%`, top: `${node.y}%`, transform: "translate(-50%, -50%)" }}
                              className={`absolute w-40 bg-[#0F0F16] border ${borderClass} rounded-xl p-3 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-70 duration-300`}
                            >
                              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-1.5">
                                <Users className="w-4 h-4 text-gray-300" />
                              </div>
                              <span className="text-[11px] font-bold text-white uppercase truncate w-full">{node.name}</span>
                              <span className={`text-[7.5px] px-1.5 py-0.5 rounded mt-1 font-mono uppercase font-black ${roleBadgeClass}`}>
                                {node.role}
                              </span>
                            </div>
                          );
                        })}
                    </div>

                    <div className="p-4 bg-black/40 border-t border-white/5 text-[10px] text-gray-500 uppercase font-mono tracking-widest text-center mt-auto z-20">
                      Use poses de turnaround de 360° para manter os trajes das relações consistentes no Forge do AUDTRILHA.
                    </div>
                  </div>
                );
              })()}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* RECORD CREATOR MODAL LAYER (100% FUNCTIONAL OVERLAY) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-full max-w-md bg-[#0F0F16] border-white/10 p-6 shadow-2xl" showCloseButton={false}>
          <DialogHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-3 mb-4">
            <DialogTitle className="text-sm font-black uppercase tracking-widest text-[#7C3AED] flex items-center gap-2 m-0 p-0">
              <Plus className="w-4 h-4" /> Novo Registro de Lore
            </DialogTitle>
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="text-gray-400 hover:text-white text-xs font-bold font-mono tracking-widest bg-white/5 px-2.5 py-1 rounded cursor-pointer"
            >
              FECHAR
            </button>
          </DialogHeader>

            <form onSubmit={handleSaveRecord} className="space-y-4">
              {/* Dynamic AI Completer Helper */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    const identifier = modalType === "character" ? formData.name : formData.title;
                    if (!identifier.trim()) {
                      toast.error(`Por favor, insira pelo menos o ${modalType === "character" ? "Nome Completo" : "Título"} primeiro para a IA ter uma semente!`);
                      return;
                    }
                    const activeToast = toast.loading("IA AUDTRILHA compilando ficha literária...");
                    try {
                      let prompt = "";
                      let sysInst = "";
                      if (modalType === "character") {
                        prompt = `Gere detalhes completos de personagem para "${identifier}" com o papel narrativo "${formData.role}".`;
                        sysInst = `Você é o co-autor literário do AUDTRILHA. Retorne estritamente um JSON no formato: {"ability": "Uma habilidade única marcante", "bio": "Uma biografia cativante de 3 linhas detalhando suas motivações ocultas."} NOTA DA REGRA: Seja neutro e descritivo; não atribua nenhuma nova ação central aos personagens sem confirmação explícita do autor, não force o diálogo. Sem usar formatação de markdown externa.`;
                      } else if (modalType === "location") {
                        prompt = `Gere detalhes de local para a localidade "${identifier}".`;
                        sysInst = `Você é o cartógrafo do AUDTRILHA. Retorne estritamente um JSON no formato: {"subtitle": "Alcunha geográfica curta", "desc": "Uma descrição curta de 3 linhas sobre o clima, perigos secretos e atmosfera do local."} REGRA: Não atribua uma ação, morte ou acontecimento a personagens dentro desta localização sem ordem do autor. Mantenha neutro e ambiental. Sem usar formatação de markdown externa.`;
                      } else if (modalType === "concept") {
                        prompt = `Gere detalhes doutrinários para a regra/lei/magia da história intitulada "${identifier}".`;
                        sysInst = `Você é o co-autor metafísico do AUDTRILHA. Retorne estritamente um JSON no formato: {"subtitle": "Tag de subcategoria curta", "desc": "Um resumo de 3 linhas contendo as diretrizes ou efeitos desta lei de fantasia."} REGRA: Não invente seções definitivas sobre personagens utilizando essa magia sem a aprovação. Sem usar formatação de markdown externa.`;
                      } else {
                        prompt = `Gere detalhes cronológicos históricos para o marco temporal intitulado "${identifier}".`;
                        sysInst = `Você é o historiador galáctico do AUDTRILHA. Retorne estritamente um JSON no formato: {"date": "Era ou ano fictício estimado", "desc": "Um resumo de 3 linhas detalhando os acontecimentos catastróficos ou revolucionários deste marco."} REGRA: Seja fatual e descritivo neutro, não cite o destino final de personagens sem pedir confirmação. Sem usar formatação de markdown externa.`;
                      }

                      const response = await fetch('/api/ai/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: prompt, systemInstruction: sysInst })
                      });
                      const data = await response.json();
                      if (data.text) {
                        const cleaned = data.text.replace(/```json\n?|```/g, "").trim();
                        const parsed = JSON.parse(cleaned);
                        
                        let textSummary = "";
                        if (modalType === "character") {
                          textSummary = `Habilidade descrita: ${parsed.ability || "Não especificado"}\n\nBiografia sugerida:\n${parsed.bio || "Vazio"}`;
                        } else if (modalType === "location") {
                          textSummary = `Subtítulo cartográfico: ${parsed.subtitle || "Não especificado"}\n\nDescrição sugerida:\n${parsed.desc || "Vazio"}`;
                        } else if (modalType === "concept") {
                          textSummary = `Subcategoria sugerida: ${parsed.subtitle || "Não especificado"}\n\nEquilíbrio mágica:\n${parsed.desc || "Vazio"}`;
                        } else {
                          textSummary = `Era sugerida: ${parsed.date || "Não especificado"}\n\nHistórico sugerido:\n${parsed.desc || "Vazio"}`;
                        }

                        setAiProposal({
                          type: modalType,
                          ability: parsed.ability || "",
                          bio: parsed.bio || "",
                          subtitle: parsed.subtitle || "",
                          desc: parsed.desc || "",
                          date: parsed.date || "",
                          text: textSummary
                        });
                        toast.success("Ideias compiladas! Revise-as no painel de consentimento abaixo.");
                      } else {
                        throw new Error("Resposta em branco");
                      }
                    } catch (e) {
                      console.error(e);
                      toast.error("Instabilidade de rede ou limite de cota da IA. Preencha manualmente.");
                    } finally {
                      toast.dismiss(activeToast);
                    }
                  }}
                  className="px-3 py-1 bg-[#7C3AED]/20 border border-[#7C3AED]/30 rounded-xl text-[9px] font-bold text-[#A78BFA] hover:bg-[#7C3AED]/30 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 animate-pulse" /> Brainstorm com IA
                </button>
              </div>

              {/* Category Selector inside Modal */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Tipo de Registro</label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-black/40 border border-white/5 rounded-lg">
                  {(["location", "concept", "timeline"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setModalType(cat)}
                      className={`py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all ${modalType === cat ? 'bg-[#7C3AED] text-white shadow-inner' : 'text-gray-400 hover:text-white'}`}
                    >
                      {cat === "location" ? "Local" : cat === "concept" ? "Conceito" : "Era"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Inputs */}
              {modalType === "character" ? (
                <>
                  {/* Regra de Ouro Guideline */}
                  <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 text-[10px] leading-relaxed text-emerald-400 font-mono mb-3">
                    <span className="font-bold flex items-center gap-1 uppercase tracking-widest text-[8px] mb-1.5 text-emerald-300">
                      ✨ Diretriz de Design Progressivo:
                    </span>
                    <p className="text-[9.5px]">
                      Para este combatente/entidade, o pipeline visual no Manga Editor seguirá a ordem:
                    </p>
                    <ol className="list-decimal pl-4 mt-1 text-[9px] text-gray-300 space-y-0.5">
                      <li><strong>Corpo Inteiro:</strong> Fixar traje e cor sem forçar estudos 360° no início.</li>
                      <li><strong>Folhas de Expressão:</strong> Detalhar alma e rostos de sentimentos múltiplos.</li>
                      <li><strong>Projeção 360° (Galeria):</strong> Reservada para a visualização virtual e showcase em 3D.</li>
                    </ol>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Nome Completo</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Alistair"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Papel Narrativo</label>
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                    >
                      <option value="PRINCIPAL" className="bg-[#0F0F16]">PRINCIPAL / PROTAGONISTA</option>
                      <option value="CO-PROTAGONISTA" className="bg-[#0F0F16]">CO-PROTAGONISTA</option>
                      <option value="ANTAGONISTA" className="bg-[#0F0F16]">ANTAGONISTA</option>
                      <option value="SECUNDÁRIO" className="bg-[#0F0F16]">SECUNDÁRIO / RECORRENTE</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Poder / Habilidade</label>
                    <input 
                      type="text"
                      placeholder="Ex: Alquimia Cinza"
                      value={formData.ability}
                      onChange={(e) => setFormData({ ...formData, ability: e.target.value })}
                      className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Biografia / Histórico Secreto</label>
                    <textarea 
                      placeholder="Anote as motivações psicológicas, segredos e histórico deste personagem..."
                      rows={3}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7C3AED] resize-none leading-relaxed"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Título / Identificador</label>
                    <input 
                      type="text"
                      required
                      placeholder={modalType === "location" ? "Ex: Cidadela de Neon" : modalType === "concept" ? "Ex: Sintonia Estelar" : "Ex: O Grande Impacto"}
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>

                  {modalType !== "timeline" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Subcategoria / Tag</label>
                      <input 
                        type="text"
                        placeholder="Ex: Capital de Ferro ou Sistema de Magia"
                        value={formData.subtitle}
                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                        className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7C3AED]"
                      />
                    </div>
                  )}

                  {modalType === "timeline" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Ano / Era na História</label>
                      <input 
                        type="text"
                        required
                        placeholder="Ex: Ano 42 d.C. ou Século das Chamas"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7C3AED]"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Descrição Completa</label>
                    <textarea 
                      placeholder="Descreva detalhadamente o local, regra mágica ou evento..."
                      rows={4}
                      value={formData.desc}
                      onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                      className="bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7C3AED] resize-none leading-relaxed"
                    />
                  </div>
                </>
              )}

              {aiProposal && (
                <div className="border border-amber-500/20 bg-amber-500/5 p-3 rounded-xl mt-2">
                  <AICreatorApprovalGuard
                    text={aiProposal.text}
                    title="Aprovação de Registro — Bíblia de Lore"
                    alwaysAskOnUncertainty={true}
                    onApprove={(finalText) => {
                      setFormData(prev => ({
                        ...prev,
                        ability: aiProposal.ability || prev.ability,
                        bio: aiProposal.bio || prev.bio,
                        subtitle: aiProposal.subtitle || prev.subtitle,
                        desc: aiProposal.desc || prev.desc,
                        date: aiProposal.date || prev.date
                      }));
                      setAiProposal(null);
                      toast.success("Diretrizes de lore aprovadas e inseridas no rascunho!");
                    }}
                    onReject={() => {
                      setAiProposal(null);
                    }}
                    mode="editor"
                  />
                </div>
              )}

              <footer className="pt-2">
                <Button 
                  type="submit"
                  className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black uppercase tracking-widest h-10 shadow-lg shadow-primary-purple/20 transition-all"
                >
                  Confirmar Cadastro
                </Button>
              </footer>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
