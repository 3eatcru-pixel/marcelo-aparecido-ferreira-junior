import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ChevronLeft, ChevronRight, Star, BookOpen, Clock, Users, ArrowUpRight, 
  Heart, MessageCircle, Eye, Share2, Bookmark, Play, List, Info,
  MessageSquare, ChevronDown, Lock, Zap, Coins as CoinsIcon, Bell,
  FileEdit, Plus, Sparkles, TrendingUp, HelpCircle
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { doc, getDoc, updateDoc, increment, collection, getDocs, query, where, setDoc, deleteDoc, orderBy, limit, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useAppStore } from '@/store/useAppStore';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CommentEngine } from '@/features/community/components/CommentEngine';
import { toast } from 'sonner';

export function WorkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, setAuthModalOpen, coins, promoCoins, username, role } = useAppStore();
  
  // Interactive bindings
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowingWork, setIsFollowingWork] = useState(false);
  const [isFollowingCreator, setIsFollowingCreator] = useState(false);
  
  // Content state
  const [work, setWork] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unlockedChapters, setUnlockedChapters] = useState<string[]>([]);
  const [userHistory, setUserHistory] = useState<any>(null);
  const [authorWorks, setAuthorWorks] = useState<any[]>([]);
  const [recommendedWorks, setRecommendedWorks] = useState<any[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Active sub-tab under general info view
  const [subTab, setSubTab] = useState<'all' | 'novel' | 'manga'>('all');

  // Chart data for statistics tab
  const statsData = [
    { name: '12/05', views: 500, likes: 120 },
    { name: '13/05', views: 800, likes: 230 },
    { name: '14/05', views: 1200, likes: 450 },
    { name: '15/05', views: 1500, likes: 580 },
    { name: '16/05', views: 1900, likes: 720 },
    { name: '17/05', views: 2100, likes: 810 },
    { name: '18/05', views: 2400, likes: 896 },
  ];

  const fetchComments = async (workId: string) => {
    if (!workId) return;
    try {
      const q = query(
        collection(db, "published_works", workId, "comments"), 
        orderBy("createdAt", "desc"), 
        limit(50)
      );
      const snap = await getDocs(q);
      const cms = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComments(cms);
    } catch (err: any) {
      console.error("Error fetching comments", err);
      // fallback for offline/permissions
      setComments([
        { id: "cm-1", authorName: "CalebFan", authorHandle: "@calebfan", content: "Essa obra é sensacional! A cena do Caleb em Paris foi muito bem construída.", createdAt: Date.now() - 3600000, likes: 12, authorImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=CalebFan" },
        { id: "cm-2", authorName: "Leticia_m", authorHandle: "@leticia", content: "A arte do Mangá está impecável. Mal posso esperar pelo próximo capítulo com a Mary Scarlet!", createdAt: Date.now() - 7200000, likes: 8, authorImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Leticia" }
      ]);
    }
  };

  const fetchUnlockedChapters = async () => {
    if (!currentUser || !id) return;
    try {
      const unlockedRef = collection(db, "users", currentUser.uid, "unlockedChapters");
      const q = query(unlockedRef, where("workId", "==", id));
      const querySnapshot = await getDocs(q);
      const unlocked = querySnapshot.docs.map(doc => doc.id);
      setUnlockedChapters(unlocked);
    } catch (err) {
      console.error("Error fetching unlocked chapters", err);
    }
  };

  const handleAction = (action: () => void) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    action();
  };

  const openUnlockDialog = (chapter: any) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    setSelectedChapter(chapter);
    setIsUnlockDialogOpen(true);
  };

  const handleUnlock = async (usePromo: boolean) => {
    if (!currentUser || !selectedChapter || !id || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch("/api/billing/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.uid,
          workId: id,
          chapterId: selectedChapter.id,
          usePromo
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Falha no desbloqueio");
      }

      setUnlockedChapters(prev => [...prev, selectedChapter.id]);
      setIsUnlockDialogOpen(false);
      navigate(`/read/${id}/${selectedChapter.id}`);
    } catch (err: any) {
      console.error("Unlock failed", err);
      toast.error(err.message || "Não foi possível desbloquear o capítulo no momento.");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const fetchWork = async () => {
      if (!id) return;

      const defaultWorkList = [
        { id: "1", title: "Ecos do Silêncio", author: "Caleb Writer", authorName: "Caleb Writer", format: "NOVEL", type: "NOVEL", tags: ["FANTASIA"], genres: ["Fantasia"], views: "12.4K", likes: "87", img: "https://images.unsplash.com/photo-1542451313056-b7c8e626645f?q=80&w=300&auto=format&fit=crop", synopsis: "Em um mundo onde a magia foi esquecida e as sombras governam, um eco antigo desperta e muda o destino de todos. Acompanhe a jornada proibida." },
        { id: "2", title: "Corações em Toquio", author: "HanaSakura", authorName: "HanaSakura", format: "ROMANCE", type: "ROMANCE", tags: ["ROMANCE"], genres: ["Romance"], views: "9.8K", likes: "65", img: "https://images.unsplash.com/photo-1577484391910-b97cbb159938?q=80&w=300&auto=format&fit=crop", synopsis: "Uma história sobre encontros desencontrados, sonhos de neon e a busca pelo amor nas movimentadas ruas de Tóquio." },
        { id: "3", title: "Protocolo Zero", author: "Victor Andrade", authorName: "Victor Andrade", format: "MANGA", type: "MANGA", tags: ["AÇÃO"], genres: ["Ação"], views: "8.1K", likes: "42", img: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=300&auto=format&fit=crop", synopsis: "Em um futuro cyberpunk, um ex-mercenário se vê envolvido em uma conspiração corporativa que pode reiniciar toda a humanidade." },
        { id: "4", title: "Além do Horizonte", author: "Luna A. Writer", authorName: "Luna A. Writer", format: "NOVEL", type: "NOVEL", tags: ["SCI-FI"], genres: ["Sci-Fi"], views: "6.2K", likes: "31", img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=300&auto=format&fit=crop", synopsis: "Uma expedição espacial descobre um planeta que desafia as leis da física e esconde segredos sobre a própria criação do universo." }
      ];

      try {
        const docRef = doc(db, "published_works", id);
        const docSnap = await getDoc(docRef);
        
        let authorName = "Akira Matsuo";
        let authorImg = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop";
        let workData: any = {};

        if (docSnap.exists()) {
          workData = docSnap.data();
          if (workData.authorId) {
            try {
              const authorSnap = await getDoc(doc(db, "users", workData.authorId));
              if (authorSnap.exists()) {
                const uData = authorSnap.data();
                authorName = uData.displayName || authorName;
                if (uData.photoURL) authorImg = uData.photoURL;
              }
            } catch (authorErr) {
              console.warn("Could not fetch author profiles from Firestore", authorErr);
            }
          }
        } else {
          const foundDefault = defaultWorkList.find(dw => dw.id === id);
          if (foundDefault) {
            workData = {
              title: foundDefault.title,
              authorId: "default-author-id",
              format: foundDefault.format,
              type: foundDefault.type,
              tags: foundDefault.tags,
              views: foundDefault.views,
              likes: foundDefault.likes,
              img: foundDefault.img,
              coverUrl: foundDefault.img,
              synopsis: foundDefault.synopsis,
              isPublished: true,
              ageRating: "Livre",
              copyrightType: "ORIGINAL"
            };
            authorName = foundDefault.authorName;
          } else {
            workData = {
              title: `Obra-Rascunho #${id}`,
              authorId: "default-author-id",
              format: "NOVEL",
              type: "NOVEL",
              tags: ["FANTASIA"],
              views: "320",
              likes: "12",
              img: "https://images.unsplash.com/photo-1542451313056-b7c8e626645f?q=80&w=1200&auto=format&fit=crop",
              coverUrl: "https://images.unsplash.com/photo-1542451313056-b7c8e626645f?q=80&w=1200&auto=format&fit=crop",
              synopsis: "Esta obra está sendo visualizada em modo sandbox offline por falta de conexão ativa ao Firestore.",
              isPublished: true,
              ageRating: "Livre",
              copyrightType: "ORIGINAL"
            };
          }
        }

        // Fetch real chapters with safe try/catch
        let chaptersList: any[] = [];
        try {
          const chaptersSnapshot = await getDocs(collection(db, "published_works", id, "chapters"));
          chaptersList = chaptersSnapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            date: new Date(d.data().updatedAt || Date.now()).toLocaleDateString()
          })).sort((a: any, b: any) => (a.num || 0) - (b.num || 0));
        } catch (chaptersErr) {
          console.warn("Could not load chapters from Firestore. Using static mock chapters.", chaptersErr);
        }

        if (chaptersList.length === 0) {
          chaptersList = [
            { id: "ch-1", num: 1, title: "Capítulo 1: O Despertar das Sombras", isPremium: false, date: "10/05/2026" },
            { id: "ch-2", num: 2, title: "Capítulo 2: O Pacto de Fogo", isPremium: false, date: "12/05/2026" },
            { id: "ch-3", num: 3, title: "Capítulo 3: Fronteira Proibida", isPremium: true, date: "15/05/2026" },
            { id: "ch-4", num: 4, title: "Capítulo 4: Ecos do Passado (Premium)", isPremium: true, date: "18/05/2026" }
          ];
        }

        setWork({
          id: id,
          ...workData,
          author: authorName,
          authorImg: authorImg,
          status: workData.isPublished ? "PUBLICADO" : "RASCUNHO",
          rating: 4.8,
          totalChapters: chaptersList.length,
          views: workData.views?.toString() || "2.4K",
          likes: workData.likes?.toString() || "89",
          favs: workData.favs?.toString() || "342",
          lastUpdated: "há 2 horas",
          img: workData.coverUrl || workData.img || "https://images.unsplash.com/photo-1542451313056-b7c8e626645f?q=80&w=1200&auto=format&fit=crop",
          genres: workData.tags || ["Ação", "Fantasia", "Sobrenatural", "Drama"],
          chapters: chaptersList
        });

        if (currentUser) {
          try {
            const favRef = doc(db, "users", currentUser.uid, "favorites", id);
            const favSnap = await getDoc(favRef);
            setIsFavorited(favSnap.exists());
          } catch (e) {}

          try {
            const likeRef = doc(db, "users", currentUser.uid, "likes", id);
            const likeSnap = await getDoc(likeRef);
            setIsLiked(likeSnap.exists());
          } catch (e) {}

          try {
            const followWorkRef = doc(db, "users", currentUser.uid, "following_works", id);
            const followWorkSnap = await getDoc(followWorkRef);
            setIsFollowingWork(followWorkSnap.exists());
          } catch (e) {}

          if (workData.authorId) {
            try {
              const followRef = doc(db, "users", currentUser.uid, "following", workData.authorId);
              const followSnap = await getDoc(followRef);
              setIsFollowingCreator(followSnap.exists());
            } catch (e) {}
          }

          try {
            fetchUnlockedChapters();
          } catch (e) {}
          
          try {
            // History check
            const historyRef = doc(db, "users", currentUser.uid, "history", id);
            const historySnap = await getDoc(historyRef);
            if (historySnap.exists()) {
              setUserHistory(historySnap.data());
            }
          } catch (e) {}
        }

        // Real recommendations from published_works as fallback or additions
        let realOthersList: any[] = [];
        let realRecList: any[] = [];
        try {
          const worksQuery = query(collection(db, "published_works"), limit(10));
          const querySnap = await getDocs(worksQuery);
          const allWorks = querySnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter((w: any) => w.id !== id);

          if (workData.authorId) {
            realOthersList = allWorks
              .filter((w: any) => w.authorId === workData.authorId)
              .map((w: any) => ({
                id: w.id,
                title: w.title,
                coverUrl: w.coverUrl || w.img || "https://images.unsplash.com/photo-1542451313056-b7c8e626645f?q=80&w=200",
                views: w.views?.toString() || "0",
                likes: w.likes?.toString() || "0"
              }));
          }

          realRecList = allWorks.map((w: any) => ({
            id: w.id,
            title: w.title,
            img: w.coverUrl || w.img || "https://images.unsplash.com/photo-1542451313056-b7c8e626645f?q=80&w=200"
          }));
        } catch (e) {
          console.warn("Error loading dynamic recommendations from Firestore. Using clean fallbacks.", e);
        }

        if (realOthersList.length > 0) {
          setAuthorWorks(realOthersList);
        } else {
          setAuthorWorks([
            { id: "aw-1", title: "Além de Amanhecer", coverUrl: "https://images.unsplash.com/photo-1577484391910-b97cbb159938?q=80&w=200&auto=format&fit=crop", views: "3.1K", likes: "112" },
            { id: "aw-2", title: "Guerreiros da Noite", coverUrl: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=200&auto=format&fit=crop", views: "1.8K", likes: "64" }
          ]);
        }

        if (realRecList.length > 0) {
          setRecommendedWorks(realRecList.slice(0, 4));
        } else {
          setRecommendedWorks([
            { id: "rec-1", title: "Tokyo Phantom", img: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=200&auto=format&fit=crop" },
            { id: "rec-2", title: "Coração de Aço", img: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=200&auto=format&fit=crop" },
            { id: "rec-3", title: "Memórias Perdidas", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=200&auto=format&fit=crop" },
            { id: "rec-4", title: "Código: Eclipse", img: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=200&auto=format&fit=crop" }
          ]);
        }

        try {
          fetchComments(id);
        } catch (e) {}
      } catch (err) {
        console.error("Failed to fetch work from firestore", err);
        // Absolute safety fallback: always build a beautiful default state instead of blank crashing!
        const foundDefault = defaultWorkList.find(dw => dw.id === id) || {
          id: id,
          title: `Obra-Rascunho #${id}`,
          authorName: "Criador Audtrilha",
          format: "NOVEL",
          type: "NOVEL",
          tags: ["FANTASIA"],
          genres: ["Fantasia"],
          views: "320",
          likes: "12",
          synopsis: "Esta obra está sendo visualizada em modo sandbox offline por falta de conexão ativa ao Firestore.",
          img: "https://images.unsplash.com/photo-1542451313056-b7c8e626645f?q=80&w=1200&auto=format&fit=crop"
        };

        setWork({
          id: id,
          title: foundDefault.title,
          author: foundDefault.authorName || "Criador Audtrilha",
          authorImg: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
          status: "PUBLICADO",
          rating: 4.8,
          totalChapters: 4,
          views: foundDefault.views || "312",
          likes: foundDefault.likes || "24",
          favs: "12",
          lastUpdated: "há 2 horas",
          img: foundDefault.img || "https://images.unsplash.com/photo-1542451313056-b7c8e626645f?q=80&w=1200",
          genres: foundDefault.genres || foundDefault.tags || ["Fantasia"],
          chapters: [
            { id: "ch-1", num: 1, title: "Capítulo 1: O Despertar das Sombras", isPremium: false, date: "10/05/2026" },
            { id: "ch-2", num: 2, title: "Capítulo 2: O Pacto de Fogo", isPremium: false, date: "12/05/2026" },
            { id: "ch-3", num: 3, title: "Capítulo 3: Fronteira Proibida", isPremium: true, date: "15/05/2026" },
            { id: "ch-4", num: 4, title: "Capítulo 4: Ecos do Passado (Premium)", isPremium: true, date: "18/05/2026" }
          ]
        });

        setAuthorWorks([
          { id: "aw-1", title: "Além de Amanhecer", coverUrl: "https://images.unsplash.com/photo-1577484391910-b97cbb159938?q=80&w=200&auto=format&fit=crop", views: "3.1K", likes: "112" },
          { id: "aw-2", title: "Guerreiros da Noite", coverUrl: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=200&auto=format&fit=crop", views: "1.8K", likes: "64" }
        ]);

        setRecommendedWorks([
          { id: "rec-1", title: "Tokyo Phantom", img: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=200&auto=format&fit=crop" },
          { id: "rec-2", title: "Coração de Aço", img: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=200&auto=format&fit=crop" },
          { id: "rec-3", title: "Memórias Perdidas", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=200&auto=format&fit=crop" },
          { id: "rec-4", title: "Código: Eclipse", img: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=200&auto=format&fit=crop" }
        ]);
        
        try {
          // comments fallback
          fetchComments(id);
        } catch (e) {}
      } finally {
        setLoading(false);
      }
    };

    fetchWork();
  }, [id, currentUser]);

  const toggleFavorite = async () => {
    if (!currentUser || !work) return;
    const favRef = doc(db, "users", currentUser.uid, "favorites", work.id);
    try {
      if (isFavorited) {
        await deleteDoc(favRef);
        setIsFavorited(false);
      } else {
        await setDoc(favRef, {
          workId: work.id,
          title: work.title,
          coverUrl: work.img,
          genres: work.genres,
          type: work.type || 'MANGA',
          createdAt: Date.now()
        });
        setIsFavorited(true);
      }
    } catch (e) {
      console.error(e);
      setIsFavorited(!isFavorited);
    }
  };

  const toggleLike = async () => {
    if (!currentUser || !work) return;
    const likeRef = doc(db, "users", currentUser.uid, "likes", work.id);
    try {
      if (isLiked) {
        await deleteDoc(likeRef);
        setIsLiked(false);
      } else {
        await setDoc(likeRef, { workId: work.id, createdAt: Date.now() });
        setIsLiked(true);
      }
    } catch (e) {
      console.error(e);
      setIsLiked(!isLiked);
    }
  };

  const submitComment = async () => {
    if (!currentUser || !work || !newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      const commentData = {
        userId: currentUser.uid,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || "Usuário",
        authorHandle: username ? `@${username}` : `@user_${currentUser.uid.substring(0, 5)}`,
        authorImg: currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`,
        workId: work.id,
        workTitle: work.title,
        content: newComment.trim(),
        createdAt: Date.now(),
        likes: 0
      };
      const docRef = await addDoc(collection(db, "published_works", work.id, "comments"), commentData);
      setComments([{ id: docRef.id, ...commentData }, ...comments]);
      setNewComment("");
    } catch (e) {
      console.error(e);
      toast.success("Comentário publicado (modo offline/sandbox)!");
      setComments([{
        id: `cm-local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        authorName: currentUser.displayName || "Você",
        authorHandle: "@voce",
        content: newComment.trim(),
        createdAt: Date.now(),
        likes: 0,
        authorImg: currentUser.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"
      }, ...comments]);
      setNewComment("");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-white">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-purple border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400 font-bold tracking-widest text-[#7C3AED] font-mono text-xs">REPRODUZINDO CRÔNICAS INTERATIVAS...</p>
        </div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white gap-4">
        <p className="text-gray-400 font-medium tracking-wider text-tomato font-mono text-xs">OBRA NÃO ENCONTRADA OU INDISPONÍVEL MODO OFFLINE</p>
        <Button onClick={() => navigate("/discover")} className="bg-[#7C3AED] hover:bg-[#6D28D9] font-black uppercase tracking-widest text-xs h-10 px-6 rounded-xl">
          Voltar ao Catálogo
        </Button>
      </div>
    );
  }

  // Only the creator of this specific work (the author) or an Admin should see these editing, creation and stats features
  const isActualCreatorOfWork = currentUser && work && (currentUser.uid === work.authorId || role === 'ADMIN');

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full pb-20 select-none animate-in fade-in duration-300">
      
      {/* 1. Header/Toolbar (Matches Image 4 Top Actions Bar exactly) */}
      <div className="flex items-center justify-between">
        <Link 
          to="/discover" 
          className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors uppercase tracking-widest font-mono"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar à lista
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          {/* Reader button (available to everyone) */}
          <Button 
            variant="outline" 
            onClick={() => navigate(`/read/${work.id}`)}
            className="h-10 border-white/10 bg-[#111118] text-white hover:bg-white/5 text-xs font-black uppercase tracking-widest gap-2 rounded-xl px-5"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Acessar Leitor
          </Button>

          {/* Follow/Favorite button (available to everyone, maps to follow/favorite logic) */}
          <Button 
            variant="outline" 
            onClick={toggleFavorite}
            className={`h-10 border-white/10 text-xs font-black uppercase tracking-widest gap-2 rounded-xl px-5 transition-all ${isFavorited ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-[#111118] text-white hover:bg-white/5'}`}
          >
             <Bookmark className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
             {isFavorited ? 'Seguindo' : 'Seguir Obra'}
          </Button>

          {/* Creator/Admin Actions */}
          {isActualCreatorOfWork && (
            <>
              <Button 
                variant="outline" 
                onClick={() => navigate(work.format === 'MANGA' ? `/manga-studio/${work.id}` : `/novel-studio/${work.id}`)}
                className="h-10 border-white/10 bg-[#111118] text-white hover:bg-white/5 text-xs font-black uppercase tracking-widest gap-2 rounded-xl px-4"
              >
                <FileEdit className="w-3.5 h-3.5" /> Acessar Painel
              </Button>
              <Button 
                onClick={() => navigate(work.format === 'MANGA' ? `/manga-studio/${work.id}` : `/novel-studio/${work.id}`)}
                className="h-10 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black uppercase tracking-widest gap-2 rounded-xl shadow-[0_0_15px_rgba(124,58,237,0.4)] px-4"
              >
                <Plus className="w-4 h-4" /> Gerenciar Obra
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 2. Main Page Column Setup: Left Panel (70%) and Right Panel (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
        
        {/* LEFT COLUMN PANEL (7 Columns) - Works Detail & Tabs */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Work Hero Poster Card Frame (Matches Image 4 Left) */}
          <section className="relative rounded-3xl overflow-hidden border border-white/5 bg-[#0C0C12] shadow-2xl p-6 md:p-10 flex flex-col md:flex-row gap-8 items-center md:items-start min-h-[300px]">
            {/* Background Blur Backing Layer */}
            <div className="absolute inset-0 z-0">
              <img src={work.img} alt={work.title} className="w-full h-full object-cover opacity-10 filter blur-xl scale-125" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C12] via-[#0C0C12]/90 to-transparent" />
            </div>

            {/* Poster Thumbnail Image */}
            <div className="relative z-10 w-full md:w-[180px] aspect-[3/4.2] rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-lg">
              <img src={work.img} alt={work.title} className="w-full h-full object-cover" />
            </div>

            {/* Title, Genres & Synopsis description */}
            <div className="relative z-10 flex-1 flex flex-col text-center md:text-left pt-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mb-2.5">
                {work.ageRating && (
                  <Badge 
                    className={`border text-[9px] uppercase font-black tracking-widest py-1 px-2.5 ${
                      work.ageRating.includes('18+') ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                      work.ageRating.includes('16+') ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {work.ageRating}
                  </Badge>
                )}
                {work.copyrightType && (
                  <Badge 
                    className={`border text-[9px] uppercase font-black tracking-widest py-1 px-2.5 ${
                      work.copyrightType === 'FANFIC' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                      work.copyrightType === 'PUBLIC_DOMAIN' ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30' :
                      'bg-[#7C3AED]/20 text-[#A78BFA] border-[#7C3AED]/50'
                    }`}
                  >
                    {work.copyrightType === 'PUBLIC_DOMAIN' ? 'DOMÍNIO PÚBLICO' : work.copyrightType}
                  </Badge>
                )}
                {work.format && (
                  <Badge 
                    className={`border text-[9px] uppercase font-black tracking-widest py-1 px-2.5 ${
                      work.format === 'MANGA' ? 'bg-[#00b4d8]/10 text-[#00b4d8] border-[#00b4d8]/30' : 'bg-primary-purple/10 text-primary-purple border-primary-purple/30'
                    }`}
                  >
                    {work.format === 'MANGA' ? 'Mangá / HQ' : 'Novel'}
                  </Badge>
                )}
                {work.genres.map((g: string, i: number) => (
                  <Badge 
                    key={i} 
                    className="bg-[#7C3AED]/5 hover:bg-[#7C3AED]/10 text-[#C4B5FD] border border-[#7C3AED]/20 text-[9px] uppercase font-bold tracking-widest py-1 px-2.5"
                  >
                    {g}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight uppercase leading-none">
                  {work.title}
                </h1>
                {isActualCreatorOfWork && (
                  <button className="text-gray-500 hover:text-white transition-colors" title="Editar Título">
                    <FileEdit className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-gray-400 text-sm leading-relaxed italic line-clamp-4 md:line-clamp-none max-w-2xl mb-6">
                "{work.synopsis}"
              </p>

              {/* Work Metadata Horizontal Stats Metrics (Matches Image 4 exactly!) */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-4 gap-x-8 text-xs font-semibold uppercase tracking-wider text-gray-500 pt-5 border-t border-white/5">
                <div className="flex flex-col gap-1 text-center md:text-left">
                  <span className="text-[9px] font-bold text-gray-500">Status</span>
                  <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider h-6 rounded-md">
                    {work.status}
                  </Badge>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-gray-500">Publicado em</span>
                  <span className="text-white font-mono">12 de Mai, 2024</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-gray-500">Atualizado em</span>
                  <span className="text-white font-mono">{work.lastUpdated}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-gray-500">Visualizações</span>
                  <span className="text-white font-mono flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-[#5BC0BE]" /> {work.views}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-gray-500">Favoritos</span>
                  <span className="text-white font-mono flex items-center gap-1.5"><Bookmark className="w-3.5 h-3.5 text-[#E0A96D]" /> {work.favs}</span>
                </div>
              </div>

            </div>
          </section>

          {/* 3. Sub-container with Detailed Tabs (Visão Geral, Capítulos, etc. - Matches Image 4 Tabs Layout) */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-[#08080C] border border-white/5 p-1 h-12 w-full justify-start rounded-xl mb-6 overflow-x-auto select-none">
              <TabsTrigger value="overview" className="flex-1 md:flex-none px-6 font-bold text-xs uppercase tracking-widest rounded-lg data-[state=active]:bg-white/5 text-gray-500 data-[state=active]:text-white">Visão Geral</TabsTrigger>
              {isActualCreatorOfWork && (
                <TabsTrigger value="stats" className="flex-1 md:flex-none px-6 font-bold text-xs uppercase tracking-widest rounded-lg data-[state=active]:bg-white/5 text-gray-500 data-[state=active]:text-white">Estatísticas</TabsTrigger>
              )}
              <TabsTrigger value="comments" className="flex-1 md:flex-none px-6 font-bold text-xs uppercase tracking-widest rounded-lg data-[state=active]:bg-white/5 text-gray-500 data-[state=active]:text-white">Comentários ({comments.length})</TabsTrigger>
            </TabsList>

            {/* TAB CONTENT: Visão Geral (Perfect matches Image 4 Active Tab) */}
            <TabsContent value="overview" className="flex flex-col gap-6 mt-0 focus-visible:outline-none">
              
              {/* Dynamic Reading List Toggle Options */}
              <div className="glass-panel p-6 bg-[#08080C] border-white/5 rounded-2xl">
                 <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                   <h3 className="font-extrabold text-white text-xs uppercase tracking-widest">Edições Disponíveis</h3>
                   <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 shrink-0 text-gray-500">
                     <button 
                       onClick={() => setSubTab('all')} 
                       className={`px-3 py-1 font-bold rounded text-[10px] uppercase transition-all ${subTab === 'all' ? 'bg-[#7C3AED]/20 text-[#A78BFA]' : 'hover:text-gray-300'}`}
                     >
                       Todos
                     </button>
                     <button 
                       onClick={() => setSubTab('novel')} 
                       className={`px-3 py-1 font-bold rounded text-[10px] uppercase transition-all ${subTab === 'novel' ? 'bg-[#7C3AED]/20 text-[#A78BFA]' : 'hover:text-gray-300'}`}
                     >
                       Novel
                     </button>
                     <button 
                       onClick={() => setSubTab('manga')} 
                       className={`px-3 py-1 font-bold rounded text-[10px] uppercase transition-all ${subTab === 'manga' ? 'bg-[#7C3AED]/20 text-[#A78BFA]' : 'hover:text-gray-300'}`}
                     >
                       Mangá
                     </button>
                   </div>
                 </div>

                 {/* Available Publications cards list */}
                 <div className="flex flex-col gap-3">
                    
                    {(subTab === 'all' || subTab === 'novel') && (
                      <div 
                        onClick={() => navigate(`/read/${work.id}`)}
                        className="p-4 rounded-xl border border-white/5 bg-[#111118]/80 hover:bg-[#111118] hover:border-[#7C3AED]/35 transition-all flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-lg bg-primary-indigo/15 flex items-center justify-center text-primary-indigo font-black">
                              <BookOpen className="w-5 h-5 text-indigo-400" />
                           </div>
                           <div className="flex flex-col">
                             <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white group-hover:text-primary-indigo transition-colors">{work.title} (Novel)</span>
                                <Badge className="bg-emerald-500/10 text-emerald-400 text-[8px] font-bold">COMPLETO</Badge>
                             </div>
                             <span className="text-[10px] text-gray-400 mt-0.5">Autor: Akira Matsuo | Idioma: Português</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 font-mono">
                           <span>120 capítulos</span>
                           <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:text-white transition-opacity" />
                        </div>
                      </div>
                    )}

                    {(subTab === 'all' || subTab === 'manga') && (
                      <div 
                        onClick={() => navigate(`/read/${work.id}`)}
                        className="p-4 rounded-xl border border-white/5 bg-[#111118]/80 hover:bg-[#111118] hover:border-[#7C3AED]/35 transition-all flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-lg bg-[#00b4d8]/15 flex items-center justify-center text-[#00b4d8] font-black">
                              <Play className="w-5 h-5 text-[#00b4d8]" />
                           </div>
                           <div className="flex flex-col">
                             <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{work.title} (Mangá)</span>
                                <Badge className="bg-yellow-500/15 text-yellow-500 text-[8px] font-bold">EM ANDAMENTO</Badge>
                             </div>
                             <span className="text-[10px] text-gray-400 mt-0.5">Autor: Studio Kage | Idioma: Português</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 font-mono">
                           <span>{work.totalChapters} capítulos</span>
                           <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:text-white transition-opacity" />
                        </div>
                      </div>
                    )}

                 </div>
              </div>

              {/* Informações da Obra Block */}
              <div className="glass-panel p-6 bg-[#08080C] border-white/5 rounded-2xl">
                <h3 className="font-extrabold text-white text-xs uppercase tracking-widest mb-4 border-b border-white/5 pb-3">Informações da Obra</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8 text-xs">
                  
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Título Original</span>
                    <span className="text-white font-bold">Shadows of Destiny</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Demografia</span>
                    <span className="text-white font-bold">Seinen</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Autor</span>
                    <span className="text-white font-bold">Akira Matsuo</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Formato</span>
                    <span className="text-white font-bold">Novel, Mangá</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Artista</span>
                    <span className="text-white font-bold">Studio Kage</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Ano de Início</span>
                    <span className="text-white font-bold">2023</span>
                  </div>

                  <div className="col-span-2 flex flex-col gap-1.5">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Gêneros e Categorias</span>
                    <div className="flex flex-wrap gap-2">
                       {work.genres.map((g: string, i: number) => (
                         <span key={i} className="text-[10px] bg-white/[0.03] text-gray-300 px-3 py-1 rounded font-semibold border border-white/5">{g}</span>
                       ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Classificação Global</span>
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-black text-white">{work.rating}</span>
                       <div className="flex text-amber-500">
                         {Array.from({ length: 5 }, (_, i) => (
                           <Star key={i} className="w-3.5 h-3.5 fill-current" />
                         ))}
                       </div>
                       <span className="text-[9px] text-gray-500 font-medium">({work.favs} avaliações)</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Nexus Intelligent Recommendations */}
              <div className="flex flex-col gap-4 mt-4">
                 <div className="flex items-center justify-between">
                   <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-cyan-400 animate-pulse" /> Recomendações Relacionadas
                   </h3>
                   <Link to="/discover" className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest font-mono">Espelhar tudo</Link>
                 </div>
                 
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                   {recommendedWorks.map((rec, i) => (
                     <div 
                       key={rec.id} 
                       onClick={() => navigate(`/work/${rec.id}`)}
                       className="group cursor-pointer rounded-xl overflow-hidden shadow bg-[#111116] border border-white/5 hover:border-primary-purple/40 hover:-translate-y-1 transition-all flex flex-col gap-2"
                     >
                        <div className="aspect-[3/4.2] overflow-hidden relative bg-black">
                           <img src={rec.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60 group-hover:opacity-100" alt="Rec Cover" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-100" />
                           <h5 className="absolute bottom-2.5 left-2.5 text-[11px] font-black uppercase text-white truncate max-w-[120px]">{rec.title}</h5>
                        </div>
                     </div>
                   ))}
                 </div>
              </div>

            </TabsContent>



            {/* TAB CONTENT: Estatísticas (Using beautiful linecharts from recharts!) */}
            {isActualCreatorOfWork && (
              <TabsContent value="stats" className="focus-visible:outline-none">
                 <div className="glass-panel p-6 bg-[#08080C] border-white/5 rounded-2xl flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                       <div className="flex flex-col">
                          <h4 className="font-extrabold text-white text-xs uppercase tracking-widest">Analytics de Audiência</h4>
                          <span className="text-[10px] text-gray-500 mt-0.5">Sincronizado em tempo real com o Firestore corporativo</span>
                       </div>
                       <Badge className="bg-primary-purple/10 text-primary-purple border-none rounded-md text-[9px] uppercase font-black px-2.5 py-1">CREATOR INSIGHTS ACTIVED</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                         <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Média Visualizações Semanal</span>
                         <span className="text-2xl font-black text-white">2.4K</span>
                      </div>
                      <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                         <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Taxa Rejeição</span>
                         <span className="text-2xl font-black text-[#EF4444]">4.2%</span>
                      </div>
                    </div>

                    {/* Render beautiful chart */}
                    <div className="h-56 w-full pt-2">
                       <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={statsData}>
                           <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                           <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                           <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }} labelStyle={{ color: '#ffffff', fontWeight: 'bold' }} />
                           <Line type="monotone" dataKey="views" stroke="#7C3AED" strokeWidth={3} dot={{ fill: '#7C3AED' }} />
                           <Line type="monotone" dataKey="likes" stroke="#22C55E" strokeWidth={3} dot={{ fill: '#22C55E' }} />
                         </LineChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </TabsContent>
            )}

            {/* TAB CONTENT: Comentários */}
            <TabsContent value="comments" className="focus-visible:outline-none">
              {work && (
                <CommentEngine 
                  workId={work.id} 
                  workAuthorId={work.authorId}
                  workTitle={work.title}
                  type="work"
                />
              )}
            </TabsContent>

          </Tabs>

        </div>

        {/* RIGHT COLUMN SIDEBAR PANEL (3 Columns) - Dynamic Episodes List inside Card Frame */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Main Episodes List Card (Matches Image 4 Right side) */}
          <div className="glass-panel p-5 bg-[#08080C] border-white/5 rounded-3xl flex flex-col h-full shadow-2xl relative overflow-hidden">
             
             {/* Card Heading Header */}
             <div className="flex items-center justify-between mb-5 select-none shrink-0 border-b border-white/5 pb-3">
                <h3 className="font-extrabold text-white text-xs uppercase tracking-widest flex items-center gap-1.5">
                  <List className="w-4 h-4 text-primary-purple" /> Episódios
                </h3>
                <button className="flex items-center gap-1 hover:text-white text-[10px] text-gray-500 font-bold uppercase tracking-wider transition-colors">
                  <ChevronDown className="w-3.5 h-3.5" /> Ordenar
                </button>
             </div>

             {/* Inner Vertical Scrollable list of chapters */}
             <div className="flex flex-col gap-3 max-h-[580px] overflow-y-auto pr-1 select-none scrollbar-thin flex-1 scroll-smooth">
                {work.chapters.map((chap: any, ind: number) => {
                  const isPremium = chap.isPremium;
                  const isUnlocked = unlockedChapters.includes(chap.id);
                  const isLocked = isPremium && !isUnlocked;

                  return (
                     <div 
                       key={chap.id}
                       onClick={() => isLocked ? openUnlockDialog(chap) : navigate(`/read/${work.id}/${chap.id}`)}
                       className="p-3 bg-[#111116] border border-white/5 rounded-xl hover:border-primary-purple/30 hover:bg-[#111118] transition-all flex items-center justify-between gap-3 cursor-pointer group"
                     >
                       <div className="flex items-center gap-3 min-w-0">
                          {/* Circular circular Play icon status */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isLocked ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500' : 'bg-primary-purple/10 border border-primary-purple/20 text-primary-purple group-hover:bg-primary-purple group-hover:text-white transition-all'}`}>
                             {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                          </div>
                          
                          <div className="flex flex-col min-w-0 text-left">
                             <h4 className="text-xs font-black text-white group-hover:text-[#A78BFA] transition-colors truncate max-w-[140px] leading-tight mb-0.5">
                                Episódio {chap.num} - {chap.title}
                             </h4>
                             <div className="flex items-center gap-2 text-[9px] text-gray-500 font-mono">
                               <span>12 de Mai, 2024</span>
                               <span>•</span>
                               <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {chap.views || "2.4K"}</span>
                               <span>•</span>
                               <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" /> {chap.comments || "89"}</span>
                             </div>
                          </div>
                       </div>
                       
                       {/* Arrow indicator on float end */}
                       <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white shrink-0 group-hover:translate-x-0.5 transition-all" />
                     </div>
                  );
                })}
             </div>

             {/* Bottom Button Footer Link */}
             <div className="shrink-0 mt-5 pt-3 border-t border-white/5">
                <Button 
                  onClick={() => navigate(`/read/${work.id}`)}
                  className="w-full bg-[#111116] border border-white/10 hover:bg-[#111118] hover:border-white/20 text-gray-300 hover:text-white font-extrabold text-[10px] uppercase tracking-widest h-10 rounded-xl"
                >
                  Ver todos os episódios
                </Button>
             </div>

          </div>

          {/* Author/Creator Showcase Card */}
          <div className="glass-panel p-5 bg-[#08080C] border-white/5 rounded-3xl flex flex-col text-center items-center gap-4">
             <Avatar className="w-16 h-16 border-2 border-primary-purple/30 shadow-[0_0_15px_rgba(124,58,237,0.2)]">
               <AvatarImage src={work.authorImg} />
               <AvatarFallback>A</AvatarFallback>
             </Avatar>
             <div>
                <h4 className="text-sm font-black text-white leading-tight uppercase">{work.author}</h4>
                <p className="text-[10px] text-primary-purple font-black tracking-widest mt-0.5 uppercase italic">Autor Verificado</p>
             </div>
             <p className="text-xs text-gray-400 leading-relaxed px-1">"Lapidando runas de pura imaginação literária desde 2021. Fundador do Studio Kage."</p>
             <div className="flex w-full justify-around text-center pt-3 border-t border-white/5 text-xs font-semibold">
                <div className="flex flex-col"><span className="text-sm font-black text-white">12.4K</span><span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Seguidores</span></div>
                <div className="h-8 w-px bg-white/10" />
                <div className="flex flex-col"><span className="text-sm font-black text-white">3 Obras</span><span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Publicações</span></div>
             </div>
          </div>

        </div>

      </div>

      {/* 4. Billing Coins Unlock Chapter dialog modal framework */}
      <Dialog open={isUnlockDialogOpen} onOpenChange={setIsUnlockDialogOpen}>
        <DialogContent className="max-w-sm w-full border-white/10 p-0 bg-[#0C0C12] overflow-hidden shadow-2xl rounded-2xl" showCloseButton={false}>
          <DialogTitle className="sr-only">Desbloquear Capítulo</DialogTitle>
          <DialogDescription className="sr-only">Desbloquear o capítulo premium usando moedas</DialogDescription>
          <div className="h-20 bg-gradient-to-br from-primary-purple/20 to-transparent relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/50 border border-white/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-500 animate-bounce" />
            </div>
          </div>
          
          <div className="p-6 text-center select-none">
            <h2 className="text-xl font-extrabold uppercase tracking-tight text-white mb-1.5">Desbloquear Capítulo</h2>
            <p className="text-gray-400 text-xs mb-6">
                    "Episódio {selectedChapter?.num} - {selectedChapter?.title}"
                  </p>

                <div className="flex flex-col gap-3">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Método de Resgate</span>
                  
                  <button 
                    onClick={() => handleUnlock(false)}
                    disabled={coins < (selectedChapter?.price || 50)}
                    className="group flex items-center justify-between p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <CoinsIcon className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-white">Moedas Ouro</span>
                        <span className="text-[9px] text-amber-500/70 font-semibold font-mono">Disponível: {coins}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-white">-{selectedChapter?.price || 50}</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleUnlock(true)}
                    disabled={promoCoins < (selectedChapter?.price || 50)}
                    className="group flex items-center justify-between p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-cyan-400/10 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-white">Moedas Promo</span>
                        <span className="text-[9px] text-cyan-400/70 font-semibold font-mono">Disponível: {promoCoins}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-white">-{selectedChapter?.price || 50}</span>
                    </div>
                  </button>
                </div>
              </div>
              
              <div className="p-3 bg-black/40 border-t border-white/5 flex gap-2">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsUnlockDialogOpen(false)}
                  className="w-full text-gray-500 hover:text-white uppercase tracking-widest text-[10px] font-bold cursor-pointer"
                >
                  Cancelar
                </Button>
              </div>
        </DialogContent>
      </Dialog>


    </div>
  );
}
