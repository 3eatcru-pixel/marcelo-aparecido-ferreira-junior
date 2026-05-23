import { FolderHeart, Plus, MoreVertical, BookOpen, Share2, Search, Filter, Loader2, X, Lock, Globe, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query, doc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';

export function Collections() {
  const { currentUser } = useAppStore();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Custom dialog state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newVisibility, setNewVisibility] = useState<"Pública" | "Privada">("Privada");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchCollections = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, "users", currentUser.uid, "collections"),
          orderBy("updatedAt", "desc")
        );
        const snap = await getDocs(q);
        setCollections(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching collections:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, [currentUser]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!newTitle.trim()) {
      toast.warning("Por favor, digite um nome para a coleção.");
      return;
    }

    setIsSaving(true);
    try {
      const colRef = collection(db, "users", currentUser.uid, "collections");
      const newCol = {
        title: newTitle.trim(),
        desc: newDesc.trim() || "Uma nova coleção para minhas histórias favoritas.",
        visibility: newVisibility,
        count: 0,
        imgs: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(colRef, newCol);
      setCollections(prev => [{ id: docRef.id, ...newCol }, ...prev]);
      toast.success("Coleção criada com sucesso!");
      
      // Reset state
      setNewTitle("");
      setNewDesc("");
      setNewVisibility("Privada");
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Falha ao criar coleção.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "collections", id));
      setCollections(prev => prev.filter(c => c.id !== id));
      toast.success("Coleção removida com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao remover coleção.");
    }
  };

  const filteredCollections = collections.filter(c => 
    (c.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="flex h-screen items-center justify-center text-primary-purple">
      <Loader2 className="w-12 h-12 animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full pb-20 pt-12 relative">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderHeart className="w-8 h-8 text-emerald-500" />
          <h1 className="text-3xl font-bold text-white tracking-tight">Coleções</h1>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-primary-purple hover:bg-neon-purple text-white font-bold h-10 px-6 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
          <Plus className="w-4 h-4 mr-2" /> NOVA COLEÇÃO
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
         <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar em suas coleções..." 
              className="w-full h-10 bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 text-sm focus:outline-none focus:border-primary-purple transition-all" 
             />
         </div>
         <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest"><Filter className="w-3.5 h-3.5 mr-2" /> Filtrar</Button>
            <Button variant="ghost" className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest">A-Z</Button>
         </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCollections.map(col => (
          <CollectionCard key={col.id} collection={col} onDelete={handleDeleteCollection} />
        ))}

        {/* Empty State / Create New */}
        <div onClick={() => setIsModalOpen(true)} className="border-2 border-dashed border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 hover:border-primary-purple/20 transition-all cursor-pointer group min-h-[350px]">
           <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-primary-purple transition-all group-hover:scale-110">
              <Plus className="w-8 h-8" />
           </div>
           <div className="flex flex-col gap-1">
             <h3 className="text-lg font-bold text-gray-300">Nova Pasta</h3>
             <p className="text-xs text-gray-500 max-w-[200px]">Crie uma coleção para organizar suas histórias favoritas por gênero ou humor.</p>
           </div>
        </div>
      </div>

      {/* Modern state-powered Modal Dialogue */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-full max-w-md p-6 bg-[#0B0B0F] border-white/10 rounded-3xl shadow-2xl flex flex-col gap-6" showCloseButton={false}>
          <DialogTitle className="sr-only">Criar Nova Coleção</DialogTitle>
          <DialogDescription className="sr-only">Crie uma nova coleção para salvar obras</DialogDescription>
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <FolderHeart className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Criar Nova Coleção</h3>
            </div>
            <Button 
              type="button"
              variant="ghost" 
              size="icon" 
              onClick={() => setIsModalOpen(false)}
              className="w-8 h-8 text-gray-400 hover:text-white rounded-full hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleCreateCollection} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Título da Pasta</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Favoritos de Fantasia, Romance Escuro..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary-purple focus:ring-1 focus:ring-primary-purple transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Descrição Opcional</label>
                <textarea 
                  placeholder="Descreva o propósito ou vibe desta pasta..."
                  value={newDesc}
                  rows={2}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary-purple focus:ring-1 focus:ring-primary-purple resize-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Visibilidade</label>
                <div className="grid grid-cols-2 gap-3">
                   <button 
                     type="button"
                     onClick={() => setNewVisibility("Privada")}
                     className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer select-none transition-all ${newVisibility === "Privada" ? 'border-primary-purple bg-primary-purple/10 text-white' : 'border-white/5 bg-white/[0.02] text-gray-500 hover:border-white/10 hover:text-gray-300'}`}
                   >
                      <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                      <div className="text-left flex flex-col">
                         <span className="text-[10px] font-bold uppercase">Privada</span>
                         <span className="text-[8px] opacity-60">Só você visualiza</span>
                      </div>
                   </button>

                   <button 
                     type="button"
                     onClick={() => setNewVisibility("Pública")}
                     className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer select-none transition-all ${newVisibility === "Pública" ? 'border-primary-purple bg-primary-purple/10 text-white' : 'border-white/5 bg-white/[0.02] text-gray-500 hover:border-white/10 hover:text-gray-300'}`}
                   >
                      <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="text-left flex flex-col">
                         <span className="text-[10px] font-bold uppercase">Pública</span>
                         <span className="text-[8px] opacity-60">Visível no perfil</span>
                      </div>
                   </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-white/5 justify-end">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 font-bold hover:text-white text-[10px] uppercase h-9 px-4 rounded-xl cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-primary-purple hover:bg-neon-purple text-white font-bold text-[10px] uppercase h-9 px-6 rounded-xl shadow-[0_0_15px_rgba(124,58,237,0.4)] cursor-pointer"
                >
                  {isSaving ? "Salvando..." : "Criar Coleção"}
                </Button>
              </div>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CollectionCard({ collection, onDelete }: { collection: any; onDelete: (id: string) => void }) {
  const updatedStr = collection.updatedAt?.toDate ? new Date(collection.updatedAt.toDate()).toLocaleDateString() : 'Recentemente';
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  return (
    <div className="flex flex-col gap-4 group">
      <div className="aspect-[1.5/1] bg-black/40 rounded-3xl overflow-hidden relative glass-panel border-white/5 group-hover:border-primary-purple/30 transition-all p-4 flex flex-col justify-end">
        
        {/* Layered Images Preview */}
        <div className="absolute top-6 left-6 right-6 bottom-16 flex justify-center">
           {collection.imgs && collection.imgs.length > 0 ? collection.imgs.map((img: string, i: number) => (
             <div 
               key={i} 
               className="w-24 aspect-[2/3] rounded-lg border-2 border-[#0B0B0F] shadow-2xl overflow-hidden absolute transition-transform duration-500 group-hover:scale-110"
               style={{ 
                 left: `${50 + (i - (collection.imgs.length - 1) / 2) * 20}%`, 
                 transformOrigin: 'bottom center',
                 transform: `translateX(-50%) rotate(${(i - (collection.imgs.length - 1) / 2) * 10}deg) scale(${1 - i * 0.1})`,
                 zIndex: 10 - i 
               }}
             >
                 <img src={img} className="w-full h-full object-cover" />
              </div>
           )) : (
             <div className="w-24 aspect-[2/3] rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center text-gray-700">
               <Plus className="w-8 h-8" />
             </div>
           )}
        </div>

        <div className="relative z-20 flex items-center justify-between w-full">
           <Badge className={`text-[9px] font-bold tracking-widest border-none ${collection.visibility === 'Pública' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
             {collection.visibility}
           </Badge>
           <span className="text-xs font-mono font-bold text-white bg-black/60 backdrop-blur px-2 py-0.5 rounded-md flex items-center gap-1.5">
             <BookOpen className="w-3 h-3 text-primary-purple" /> {collection.count || 0}
           </span>
        </div>
      </div>

      <div className="flex items-start justify-between px-2">
        <div className="flex flex-col flex-1 min-w-0 pr-2">
          <h3 className="text-lg font-bold text-white group-hover:text-primary-purple transition-colors truncate uppercase tracking-tight leading-tight">{collection.title}</h3>
          <p className="text-xs text-gray-500 line-clamp-1 mt-1 italic font-medium leading-relaxed">"{collection.desc}"</p>
          <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-2">Editada {updatedStr}</span>
        </div>
        <div className="flex gap-1 items-center shrink-0">
           {confirmDelete ? (
             <div className="flex items-center gap-1.5 bg-rose-500/10 p-1 rounded-xl border border-rose-500/20">
               <Button 
                 variant="ghost" 
                 size="xs" 
                 onClick={() => setConfirmDelete(false)} 
                 className="h-7 text-[8px] px-2 font-black uppercase text-gray-400 hover:text-white"
               >
                 NÃO
               </Button>
               <Button 
                 onClick={() => {
                   onDelete(collection.id);
                   setConfirmDelete(false);
                 }} 
                 className="h-7 text-[8px] px-3 font-black uppercase bg-rose-600 text-white hover:bg-rose-700 rounded-lg"
               >
                 EXCLUIR
               </Button>
             </div>
           ) : (
             <>
               <Button 
                 variant="ghost" 
                 size="icon" 
                 onClick={() => {
                   navigator.clipboard.writeText(window.location.origin + `/user/collections/${collection.id}`);
                   toast.success("Link da coleção copiado!");
                 }}
                 className="w-8 h-8 rounded-full text-gray-600 hover:text-white hover:bg-white/5"
               >
                 <Share2 className="w-4 h-4" />
               </Button>
               <Button 
                 variant="ghost" 
                 size="icon" 
                 onClick={() => setConfirmDelete(true)}
                 className="w-8 h-8 rounded-full text-gray-600 hover:text-rose-400 hover:bg-rose-500/5"
               >
                 <Trash2 className="w-4 h-4" />
               </Button>
             </>
           )}
        </div>
      </div>
    </div>
  );
}

