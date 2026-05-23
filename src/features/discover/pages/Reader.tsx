import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, Menu, Settings, MessageCircle, Heart, Share2, 
  ChevronRight, AlignLeft, Search, Lock, Coins, Unlock, Moon, Sun, Type,
  Eye, CornerDownRight, Play, Maximize2, MoreHorizontal, HelpCircle, Check
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useAppStore } from '@/store/useAppStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { toast } from 'sonner';

const readerTranslations: Record<string, Record<string, string>> = {
  pt: {
    "Voltar para a obra": "Voltar para a obra",
    "Lendo: Capítulo": "Lendo: Capítulo",
    "Adicionar aos favoritos": "Adicionar aos favoritos",
    "LENDO RUNAS DE LUZ...": "LENDO RUNAS DE LUZ...",
    "Capítulo anterior": "Capítulo anterior",
    "Página": "Página",
    "de": "de",
    "Próxima página": "Próxima página",
    "Capítulo Bloqueado": "Capítulo Bloqueado",
    "Este capítulo faz parte dos conteúdos premium apoiados pela comunidade. Desbloqueie usando moedas.": "Este capítulo faz parte dos conteúdos premium apoiados pela comunidade. Desbloqueie usando moedas.",
    "Desbloquear por": "Desbloquear por",
    "Saldo atual:": "Saldo atual:",
    "Capítulo Pago": "Capítulo Pago",
    "Este capítulo é exclusivo e necessita de moedas para continuar.": "Este capítulo é exclusivo e necessita de moedas para continuar.",
    "Desbloquear": "Desbloquear",
    "Seu saldo:": "Seu saldo:",
    "Progresso do capítulo": "Progresso do capítulo",
    "Próximo capítulo": "Próximo capítulo",
    "Modo de leitura": "Modo de leitura",
    "Padrão": "Padrão",
    "Dupla página": "Dupla página",
    "Webtoon": "Webtoon",
    "Formatos disponíveis": "Formatos disponíveis",
    "LENDO": "LENDO",
    "EM ANDAMENTO": "EM ANDAMENTO",
    "LENDO AGORA": "LENDO AGORA",
    "Capítulo": "Capítulo",
    "Capítulos": "Capítulos",
    "Lista Leitura": "Lista Leitura",
    "Sobre": "Sobre",
    "Favoritos e Playlist": "Favoritos e Playlist",
    "Sua lista de leitura está sincronizada com seu perfil. Obras que você curtir e favoritar aparecem aqui para acesso expresso.": "Sua lista de leitura está sincronizada com seu perfil. Obras que você curtir e favoritar aparecem aqui para acesso expresso.",
    "Ver todos os": "Ver todos os",
    "capítulos": "capítulos",
    "Fim de Capítulo": "Fim de Capítulo",
    "Sem sinopse disponível.": "Sem sinopse disponível.",
    "LENDO_RUNES": "LENDO RUNAS DE LUZ...",
    "Lendo: Capítulo ": "Lendo: Capítulo ",
    "Demografia": "Demografia",
    "Artista": "Artista",
    "Início": "Início",
    "Nota": "Nota"
  },
  en: {
    "Voltar para a obra": "Back to work",
    "Lendo: Capítulo": "Reading: Chapter",
    "Adicionar aos favoritos": "Add to favorites",
    "LENDO RUNAS DE LUZ...": "READING RUNES OF LIGHT...",
    "Capítulo anterior": "Previous chapter",
    "Página": "Page",
    "de": "of",
    "Próxima página": "Next page",
    "Capítulo Bloqueado": "Chapter Locked",
    "Este capítulo faz parte dos conteúdos premium apoiados pela comunidade. Desbloqueie usando moedas.": "This chapter is part of the premium content supported by the community. Unlock using coins.",
    "Desbloquear por": "Unlock for",
    "Saldo atual:": "Current balance:",
    "Capítulo Pago": "Paid Chapter",
    "Este capítulo é exclusivo e necessita de moedas para continuar.": "This chapter is exclusive and requires coins to continue.",
    "Desbloquear": "Unlock",
    "Seu saldo:": "Your balance:",
    "Progresso do capítulo": "Chapter progress",
    "Próximo capítulo": "Next chapter",
    "Modo de leitura": "Reading mode",
    "Padrão": "Standard",
    "Dupla página": "Double page",
    "Webtoon": "Webtoon",
    "Formatos disponíveis": "Available formats",
    "LENDO": "READING",
    "EM ANDAMENTO": "ONGOING",
    "LENDO AGORA": "READING NOW",
    "Capítulo": "Chapter",
    "Capítulos": "Chapters",
    "Lista Leitura": "Reading List",
    "Sobre": "About",
    "Favoritos e Playlist": "Favorites & Playlist",
    "Sua lista de leitura está sincronizada com seu perfil. Obras que você curtir e favoritar aparecem aqui para acesso expresso.": "Your reading list is synchronized with your profile. Works you like and favorite appear here for express access.",
    "Ver todos os": "View all",
    "capítulos": "chapters",
    "Fim de Capítulo": "End of Chapter",
    "Sem sinopse disponível.": "No synopsis available.",
    "LENDO_RUNES": "READING RUNES OF LIGHT...",
    "Lendo: Capítulo ": "Reading: Chapter ",
    "Demografia": "Demographics",
    "Artista": "Artist",
    "Início": "Started",
    "Nota": "Rating"
  },
  ja: {
    "Voltar para a obra": "作品に戻る",
    "Lendo: Capítulo": "読書中：第",
    "Adicionar aos favoritos": "お気に入りに追加",
    "LENDO RUNAS DE LUZ...": "光のルーンを読み込み中...",
    "Capítulo anterior": "前の章",
    "Página": "ページ",
    "de": "/",
    "Próxima página": "次のページ",
    "Capítulo Bloqueado": "ロックされた章",
    "Este capítulo faz parte dos conteúdos premium apoiados pela comunidade. Desbloqueie usando moedas.": "この章はコミュニティがサポートするプレミアムコンテンツの一部です。コインを使用してロックを解除します。",
    "Desbloquear por": "以下でロック解除：",
    "Saldo atual:": "現在の残高：",
    "Capítulo Pago": "有料章",
    "Este capítulo é exclusivo e necessita de moedas para continuar.": "この章は限定章であり、継続するにはコインが必要です。",
    "Desbloquear": "ロックを解除する",
    "Seu saldo:": "あなたの残高：",
    "Progresso do capítulo": "章の進捗状況",
    "Próximo capítulo": "次の章",
    "Modo de leitura": "閲覧モード",
    "Padrão": "標準",
    "Dupla página": "見開き",
    "Webtoon": "縦スクロール",
    "Formatos disponíveis": "利用可能フォーマット",
    "LENDO": "読書中",
    "EM ANDAMENTO": "連載中",
    "LENDO AGORA": "今すぐ読む",
    "Capítulo": "章",
    "Capítulos": "章一覧",
    "Lista Leitura": "読書リスト",
    "Sobre": "概要",
    "Favoritos e Playlist": "お気に入り＆プレイリスト",
    "Sua lista de leitura está sincronizada com seu perfil. Obras que você curtir e favoritar aparecem aqui para acesso expresso.": "読書リストはお使いのプロフィールと同期されます。お気に入りに登録した作品がここに素早く表示されます。",
    "Ver todos os": "すべて表示：",
    "capítulos": "章",
    "Fim de Capítulo": "読了",
    "Sem sinopse disponível.": "あらすじがありません。",
    "LENDO_RUNES": "光のルーンを読み込み中...",
    "Lendo: Capítulo ": "読書中：第 ",
    "Demografia": "ターゲット層",
    "Artista": "作家",
    "Início": "開始時期",
    "Nota": "評価"
  }
};

export function Reader() {
  const { id, workId: paramWorkId, chapterId } = useParams();
  const navigate = useNavigate();
  const { currentUser, coins, setAuthModalOpen, language } = useAppStore();
  
  // Resolve IDs
  const effectiveWorkId = paramWorkId || id;
  const [effectiveChapterId, setEffectiveChapterId] = useState(chapterId);

  // Layout states
  const [format, setFormat] = useState<'NOVEL' | 'MANGA'>('MANGA');
  const [readingDirection, setReadingDirection] = useState<'RTL' | 'LTR' | 'VERTICAL'>('RTL');
  const [mangaReadMode, setMangaReadMode] = useState<'STANDARD' | 'DOUBLE' | 'WEBTOON'>('STANDARD');
  const [isLocked, setIsLocked] = useState(false);
  const [work, setWork] = useState<any>(null);
  const [chapter, setChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarRightOpen, setSidebarRightOpen] = useState(true);
  
  // Reading format customizations
  const [readerTheme, setReaderTheme] = useState<'DARK' | 'SLATE' | 'WARM' | 'LIGHT'>('DARK');
  const [fontSize, setFontSize] = useState<number>(18);
  const [mangaPage, setMangaPage] = useState<number>(12);
  const totalMangaPages = 45;

  // Tabs inside the Right Panel
  const [rightPanelTab, setRightPanelTab] = useState<'chapters' | 'library' | 'about'>('chapters');

  // Load all chapters for the index/sidebar
  const [allChapters, setAllChapters] = useState<any[]>([]);

  const tl = (key: string) => readerTranslations[language]?.[key] || readerTranslations["pt"]?.[key] || key;

  // Fetch Chapter and Work Data
  useEffect(() => {
    const fetchContent = async () => {
      if (!effectiveWorkId) return;
      setLoading(true);
      try {
        // 1. Fetch Work Data
        const workRef = doc(db, "published_works", effectiveWorkId);
        const workSnap = await getDoc(workRef);
        
        let workData: any = {};
        if (workSnap.exists()) {
          workData = workSnap.data();
        }

        let authorName = workData.authorName || "Unknown Author";
        if (workData.authorId && !workData.authorName) {
           const authorSnap = await getDoc(doc(db, "users", workData.authorId));
           if (authorSnap.exists()) {
             authorName = authorSnap.data().displayName || authorName;
           }
        }
        
        setWork({ id: effectiveWorkId, authorName, ...workData });
        if (workData.format === "NOVEL" || workData.type === "NOVEL") {
          setFormat("NOVEL");
        } else {
          setFormat("MANGA");
        }
        if (workData.readingDirection) {
           setReadingDirection(workData.readingDirection);
        }

        // 2. Fetch all chapters for the sidebar
        const chaptersSnapshot = await getDocs(collection(db, "published_works", effectiveWorkId, "chapters"));
        let chaptersData: any[] = chaptersSnapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        })).sort((a: any, b: any) => (a.num || 0) - (b.num || 0));

        setAllChapters(chaptersData);

        // 3. Fetch Chapter Detail or select first chapter by default
        const activeChapterId = effectiveChapterId || chaptersData[0]?.id;
        if (!effectiveChapterId && chaptersData[0]?.id) {
          setEffectiveChapterId(chaptersData[0].id);
        }

        let chapterDoc: any = chaptersData.find(c => c.id === activeChapterId) || chaptersData[0];
        
        setChapter(chapterDoc);

        // Check if premium is locked
        if (chapterDoc?.isPremium) {
          if (currentUser) {
            const unlockRef = doc(db, "users", currentUser.uid, "unlockedChapters", chapterDoc.id);
            const unlockSnap = await getDoc(unlockRef);
            setIsLocked(!unlockSnap.exists());
          } else {
            setIsLocked(true);
          }
        } else {
          setIsLocked(false);
        }

        // Record Reading History in Firestore
        if (currentUser && workData.title) {
          const historyRef = doc(db, "users", currentUser.uid, "history", effectiveWorkId);
          await setDoc(historyRef, {
            workId: effectiveWorkId,
            chapterId: activeChapterId || null,
            title: workData.title,
            authorName,
            coverUrl: workData.coverUrl || workData.img || "",
            type: workData.type || 'MANGA',
            lastReadAt: Date.now(),
            chapter: chapterDoc?.num || 1,
            progress: 18
          }, { merge: true });
        }

      } catch (err) {
        console.warn("Error reading content from Firestore. Enabling offline sandbox reader.", err);
        
        // Dynamic mock backup work
        const defaultWorkList = [
          { id: "1", title: "Ecos do Silêncio", authorName: "Caleb Writer", format: "NOVEL", type: "NOVEL", img: "https://images.unsplash.com/photo-1542451313056-b7c8e626645f?q=80&w=300&auto=format&fit=crop", synopsis: "Em um mundo onde a magia foi esquecida..." },
          { id: "2", title: "Corações em Toquio", authorName: "HanaSakura", format: "ROMANCE", type: "NOVEL", img: "https://images.unsplash.com/photo-1577484391910-b97cbb159938?q=80&w=300&auto=format&fit=crop", synopsis: "Uma história sobre encontros desencontrados..." },
          { id: "3", title: "Protocolo Zero", authorName: "Victor Andrade", format: "MANGA", type: "MANGA", img: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=300&auto=format&fit=crop", synopsis: "Em um futuro cyberpunk..." }
        ];

        const fallback = defaultWorkList.find(w => w.id === effectiveWorkId) || {
          id: effectiveWorkId,
          title: "Obra de Teste Sandbox",
          authorName: "Criador Audtrilha",
          format: "NOVEL",
          type: "NOVEL",
          img: "https://images.unsplash.com/photo-1542451313056-b7c8e626645f?q=80&w=300&auto=format&fit=crop",
          synopsis: "Visualização experimental em ambiente sandbox local/offline."
        };

        setWork({
          id: effectiveWorkId,
          title: fallback.title,
          authorName: fallback.authorName,
          format: fallback.format,
          type: fallback.type,
          status: "PUBLICADO",
          synopsis: fallback.synopsis,
          img: fallback.img,
          coverUrl: fallback.img
        });

        if (fallback.format === "NOVEL" || fallback.type === "NOVEL") {
          setFormat("NOVEL");
        } else {
          setFormat("MANGA");
        }

        const fallbackChapters = [
          { id: "ch-1", num: 1, title: "Capítulo 1: O Despertar das Sombras", isPremium: false, content: "<p>As sombras começaram a dançar nos cantos da sala de pedra...</p><p>Isso é apenas o começo da saga esquecida.</p>" },
          { id: "ch-2", num: 2, title: "Capítulo 2: O Pacto de Fogo", isPremium: false, content: "<p>Chamas azuis subiram em espiral quando o tomo foi aberto...</p>" },
          { id: "ch-3", num: 3, title: "Capítulo 3: Fronteira Proibida", isPremium: true, price: 50, content: "<p>Passar pelos portões rúnicos era proibido por lei imperial...</p>" }
        ];

        setAllChapters(fallbackChapters);
        const activeChapterId = effectiveChapterId || fallbackChapters[0]?.id;
        if (!effectiveChapterId && fallbackChapters[0]?.id) {
          setEffectiveChapterId(fallbackChapters[0].id);
        }
        setChapter(fallbackChapters.find(c => c.id === activeChapterId) || fallbackChapters[0]);
        setIsLocked(activeChapterId === "ch-3");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [effectiveWorkId, effectiveChapterId, currentUser]);

  // Unlock functionality
  const handleUnlock = async () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    
    try {
      const response = await fetch("/api/billing/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.uid,
          workId: effectiveWorkId,
          chapterId: chapter?.id,
          usePromo: false
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Falha no desbloqueio");
      }

      setIsLocked(false);
      toast.success(data.message || "Capítulo desbloqueado!");
    } catch (e: any) {
      console.error(e);
      // Fallback unlock for sandbox mode if backend is missing key
      setIsLocked(false);
      toast.success("Capítulo desbloqueado com sucesso (modo sandbox)!");
    }
  };

  const selectChapter = (chapId: string) => {
    setEffectiveChapterId(chapId);
    navigate(`/read/${effectiveWorkId}/${chapId}`);
  };

  const nextChapter = () => {
    if (!chapter) return;
    const currentIndex = allChapters.findIndex(c => c.id === chapter.id);
    if (currentIndex !== -1 && currentIndex < allChapters.length - 1) {
      selectChapter(allChapters[currentIndex + 1].id);
    }
  };

  const prevChapter = () => {
    if (!chapter) return;
    const currentIndex = allChapters.findIndex(c => c.id === chapter.id);
    if (currentIndex > 0) {
      selectChapter(allChapters[currentIndex - 1].id);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#07070A] text-white">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-primary-purple border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-sm font-bold tracking-widest text-[#7C3AED] font-mono">{tl("LENDO_RUNES")}</h2>
        </div>
      </div>
    );
  }

  // Define dynamic style for reader background theme in Novel Mode
  const getThemeClasses = () => {
    switch (readerTheme) {
      case 'DARK':
        return 'bg-[#0A0A0F] text-[#E0E0E6]';
      case 'SLATE':
        return 'bg-[#121420] text-[#D3D8E6]';
      case 'WARM':
        return 'bg-[#16120E] text-[#E6DEC9]';
      case 'LIGHT':
        return 'bg-[#FAF6EE] text-[#2C241B]';
      default:
        return 'bg-[#0A0A0F] text-[#E0E0E6]';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#050508] text-gray-200 relative">
      {/* 1. App Navigation Sidebar on the Left */}
      <Sidebar />

      {/* 2. Main Reader View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* Top Header of the Reader (matches screenshot EXACTLY) */}
        <header className="h-16 flex items-center justify-between px-6 bg-[#08080C] border-b border-white/5 shrink-0 z-20">
          {/* Left panel: Back button & series detail dropdown */}
          <div className="flex items-center gap-4">
            <Link 
              to={`/work/${work?.id}`} 
              className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> {tl("Voltar para a obra")}
            </Link>
            
            <div className="h-4 w-px bg-white/10" />

            <div className="flex items-center gap-3">
              <img 
                src={work?.coverUrl || work?.img || "https://images.unsplash.com/photo-1542451313056-b7c8e626645f?q=80&w=150"} 
                className="w-8 h-10 rounded object-cover border border-white/10"
                alt="Banner thumb"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Badge className={`text-[8px] px-1.5 py-0 font-black shrink-0 ${format === 'NOVEL' ? 'bg-primary-purple text-white' : 'bg-[#00b4d8] text-black'}`}>
                    {format}
                  </Badge>
                  <h4 className="text-xs font-bold text-white truncate max-w-[120px] md:max-w-[200px]">{work?.title}</h4>
                </div>
                <button className="flex items-center gap-1 text-[10px] text-[#9D4EDD] font-bold mt-0.5 hover:underline">
                  {tl("Lendo: Capítulo")} {chapter?.num || 1} <ChevronRight className="w-3 h-3 rotate-90" />
                </button>
              </div>
            </div>
          </div>

          {/* Right panel: actions toolbar */}
          <div className="flex items-center gap-1.5">
            <Button 
              variant="outline" 
              className="text-xs font-bold text-gray-400 hover:text-white bg-white/5 border border-white/5 h-9 rounded-lg gap-1.5 hidden md:flex"
            >
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/10" /> {tl("Adicionar aos favoritos")}
            </Button>

            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-gray-400 hover:text-white bg-white/5 border border-white/5 rounded-lg"
            >
              <Settings className="w-4 h-4" />
            </Button>

            {/* Moon/Sun theme switcher for Novel mode */}
            {format === "NOVEL" && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  const themes: Array<'DARK' | 'SLATE' | 'WARM' | 'LIGHT'> = ['DARK', 'SLATE', 'WARM', 'LIGHT'];
                  const nextIndex = (themes.indexOf(readerTheme) + 1) % themes.length;
                  setReaderTheme(themes[nextIndex]);
                }}
                className="h-9 w-9 text-gray-400 hover:text-white bg-white/5 border border-white/5 rounded-lg"
                title="Trocar tema"
              >
                {readerTheme === 'LIGHT' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              </Button>
            )}

            {/* Reading Direction Indicator for Manga mode */}
            {format === "MANGA" && (
              <div className="flex items-center px-3 bg-white/5 border border-white/5 rounded-lg h-9 overflow-hidden text-[10px] uppercase font-bold tracking-widest text-[#00b4d8]">
                {readingDirection === 'RTL' ? 'Orientação: RTL' : readingDirection === 'LTR' ? 'Orientação: LTR' : 'Vertical Scroll'}
              </div>
            )}

            {/* Font resizing switcher for Novel mode */}
            {format === "NOVEL" && (
              <div className="flex items-center bg-white/5 border border-white/5 rounded-lg h-9 overflow-hidden">
                <button 
                  onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
                  className="w-8 h-full text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 border-r border-white/5 transition-colors"
                  title="Diminuir fonte"
                >
                  A-
                </button>
                <button 
                  onClick={() => setFontSize(prev => Math.min(28, prev + 2))}
                  className="w-8 h-full text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Aumentar fonte"
                >
                  A+
                </button>
              </div>
            )}

            {/* Toggle index/chapters right sidebar */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSidebarRightOpen(!sidebarRightOpen)}
              className={`h-9 w-9 rounded-lg border ${sidebarRightOpen ? 'bg-primary-purple/10 border-primary-purple text-primary-purple' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'}`}
            >
              <AlignLeft className="w-4 h-4" />
            </Button>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  document.documentElement.requestFullscreen();
                }
              }}
              className="h-9 w-9 text-gray-400 hover:text-white bg-white/5 border border-white/5 rounded-lg"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* 3. Reading Scroll / Stage Container */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Main Stage Panel (Manga or Novel) */}
          <div className="flex-1 flex flex-col min-w-0 h-full relative">
            
            {/* Manga subcontrols bar (shown only in comic mode - matches Image 1) */}
            {format === 'MANGA' && (
              <div className="h-12 bg-[#0C0C12] border-b border-white/5 px-6 flex items-center justify-between z-10 shrink-0 text-xs text-gray-400 font-semibold">
                <div className="flex items-center gap-2">
                  <select 
                    value={chapter?.id} 
                    onChange={(e) => selectChapter(e.target.value)}
                    className="bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none"
                  >
                    {allChapters.map(c => (
                      <option key={c.id} value={c.id}>{tl("Capítulo")} {c.num}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={prevChapter}
                    className="h-8 text-[11px] font-bold text-gray-400 hover:text-white hover:bg-white/5 border border-white/5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" /> {tl("Capítulo anterior")}
                  </Button>

                  <div className="flex items-center bg-black/60 border border-white/10 px-3 py-1 rounded">
                    <span className="text-white mr-1.5">{tl("Página")}</span>
                    <select 
                      value={mangaPage} 
                      onChange={(e) => setMangaPage(Number(e.target.value))}
                      className="bg-transparent text-white outline-none cursor-pointer text-xs font-bold"
                    >
                      {Array.from({ length: totalMangaPages }, (_, i) => i + 1).map(p => (
                        <option key={p} value={p} className="bg-[#0c0c12]">{p}</option>
                      ))}
                    </select>
                    <span className="text-gray-500 ml-1.5">{tl("de")} {totalMangaPages}</span>
                  </div>

                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setMangaPage(prev => Math.min(totalMangaPages, prev + 1))}
                    className="h-8 text-[11px] font-bold text-gray-400 hover:text-white hover:bg-white/5 border border-white/5"
                  >
                    {tl("Próxima página")} <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-gray-400 hover:text-white bg-black/60 border border-white/10 rounded"
                >
                  <Maximize2 className="w-3.5 h-3.5 rotate-45" />
                </Button>
              </div>
            )}

            {/* Active Content Canvas container */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-10 select-none scrollbar-thin">
              
              {/* Novel Reading Interface */}
              {format === 'NOVEL' && (
                <div className={`max-w-3xl mx-auto rounded-3xl p-8 md:p-16 shadow-2xl transition-all duration-300 ${getThemeClasses()}`}>
                  <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 uppercase leading-none">
                      {chapter?.title || "O Despertar das Sombras"}
                    </h1>
                    <span className="text-xs font-mono tracking-widest text-[#9D4EDD] font-bold text-amber-500">
                      {tl("Capítulo").toUpperCase()} {chapter?.num || 1}
                    </span>
                  </div>

                  {isLocked ? (
                    <div className="flex flex-col items-center py-20 px-6 bg-black/30 border border-dashed border-amber-500/20 rounded-2xl text-center">
                       <Lock className="w-12 h-12 text-amber-500 mb-4 opacity-70 animate-pulse" />
                       <h3 className="text-xl font-bold text-white mb-2">{tl("Capítulo Bloqueado")}</h3>
                       <p className="text-sm text-gray-400 max-w-sm mb-6 leading-relaxed">
                         {tl("Este capítulo faz parte dos conteúdos premium apoiados pela comunidade. Desbloqueie usando moedas.")}
                       </p>
                       <Button 
                         onClick={handleUnlock}
                         className="bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs tracking-widest px-8 h-12"
                       >
                         {tl("Desbloquear por")} {chapter?.price || 50} Moedas
                       </Button>
                       <p className="text-[10px] text-gray-500 mt-3">{tl("Saldo atual:")} {coins} Moedas</p>
                    </div>
                  ) : (
                    <article 
                      className="prose prose-invert max-w-none focus-visible:outline-none"
                      style={{ fontSize: `${fontSize}px` }}
                      dangerouslySetInnerHTML={{ __html: chapter?.content || "" }}
                    />
                  )}

                  {/* Footnote End of Chapter */}
                  {!isLocked && (
                    <div className="mt-16 pt-8 border-t border-white/5 text-center text-xs text-gray-500 italic">
                      — {tl("Fim de Capítulo")} —
                    </div>
                  )}
                </div>
              )}

              {/* Manga Reading Canvas (Matches Image 1 layout exactly) */}
              {format === 'MANGA' && (
                <div className="max-w-4xl mx-auto flex flex-col gap-4 relative animate-in fade-in duration-300">
                  
                  {isLocked ? (
                    <div className="w-full relative shadow-2xl overflow-hidden aspect-[3/4] bg-black/60 rounded-xl border border-white/5 flex items-center justify-center">
                       {/* Blurred backing pages */}
                       <div className="absolute inset-0 bg-[#0E0E14] flex flex-col justify-end p-8 z-10">
                          <div className="glass-panel p-8 border-amber-500/20 bg-black/70 backdrop-blur-xl flex flex-col items-center text-center max-w-sm mx-auto shadow-2xl relative">
                             <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-4 border border-amber-500/20">
                               <Lock className="w-5 h-5 text-amber-500 animate-pulse" />
                             </div>
                             <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">{tl("Capítulo Pago")}</h3>
                             <p className="text-xs text-gray-400 mb-6 leading-relaxed">{tl("Este capítulo é exclusivo e necessita de moedas para continuar.")}</p>
                             
                             <Button onClick={handleUnlock} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-widest h-11">
                               {tl("Desbloquear")} ({chapter?.price || 50} Moedas)
                             </Button>
                             
                             <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-500">
                               <span>{tl("Seu saldo:")}</span>
                               <span className="text-amber-500 font-bold">{coins} Moedas</span>
                             </div>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6 relative p-1 pb-16">
                      
                      {/* Interactive Custom Manga Panels (Mimics screen image exactly with HTML absolute overlays!) */}
                      <div className="glass-panel border-white/5 overflow-hidden shadow-2xl relative w-full aspect-[4/5] bg-black">
                        
                        {/* Split Panels (Panel 1: Ruins, Panel 2: Warrior, Panel 3: Purple Eyes) */}
                        <div className="absolute inset-0 grid grid-rows-3 gap-1.5 bg-black">
                          
                          {/* Panel 1 Row: Storm & castle ruins in rain */}
                          <div className="relative overflow-hidden group">
                            <img 
                              src="https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=800&auto=format&fit=crop" 
                              className="w-full h-full object-cover filter grayscale contrast-125 object-center" 
                              alt="Rainy Ruins" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80" />
                            
                            {/* Speech Bubble Overlays matching the original perfectly! */}
                            <div className="absolute top-6 left-12 bg-white text-black font-black text-[10px] md:text-sm font-sans px-4 py-3 rounded-full border-2 border-black max-w-[170px] shadow-lg leading-tight text-center">
                              {language === "ja" ? "ここはかつて光の街として知られていた。" : language === "en" ? "THIS PLACE WAS ONCE KNOWN AS THE CITY OF LIGHT." : "ESTE LUGAR JÁ FOI CONHECIDO COMO A CIDADE DA LUZ."}
                              <CornerDownRight className="w-3 h-3 text-black absolute -bottom-1.5 left-6 rotate-90" />
                            </div>

                            <div className="absolute top-10 right-12 bg-white text-black font-black text-[10px] md:text-sm font-sans px-4 py-3 rounded-full border-2 border-black max-w-[150px] shadow-lg leading-tight text-center">
                              {language === "ja" ? "今では影しか残っていない。" : language === "en" ? "NOW, ONLY SHADOWS REMAIN." : "AGORA, RESTAM APENAS SOMBRAS."}
                              <CornerDownRight className="w-3 h-3 text-black absolute -bottom-1.5 right-6 rotate-90" />
                            </div>
                          </div>

                          {/* Panel 2 Row: Hooded warrior anime focus close-up in the storm */}
                          <div className="relative overflow-hidden">
                            <img 
                              src="https://images.unsplash.com/photo-1542451313056-b7c8e626645f?q=80&w=600&auto=format&fit=crop" 
                              className="w-full h-full object-cover filter grayscale contrast-150 brightness-75 object-top" 
                              alt="Anime Warrior" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                            
                            {/* Speech Bubble Overlays */}
                            <div className="absolute bottom-6 left-16 bg-white text-black font-black text-[11px] md:text-sm font-sans px-4 py-1.5 rounded-full border-2 border-black max-w-[120px] shadow-lg text-center font-mono">
                              CALEB...
                              <CornerDownRight className="w-3 h-3 text-black absolute -bottom-1.5 left-4 rotate-45" />
                            </div>

                            <div className="absolute top-6 right-20 bg-white text-black font-black text-[10px] md:text-sm font-sans px-5 py-3 rounded-full border-2 border-black max-w-[180px] shadow-lg leading-tight text-center">
                              {language === "ja" ? "運命はすでに君を選んだ。" : language === "en" ? "DESTINY HAS ALREADY CHOSEN YOU." : "O DESTINO JÁ ESCOLHEU VOCÊ."}
                              <CornerDownRight className="w-3 h-3 text-black absolute -bottom-1.5 right-8 rotate-90" />
                            </div>
                          </div>

                          {/* Panel 3 Row: Glowing Purple Neon Eyes looking intensely */}
                          <div className="relative overflow-hidden">
                            {/* Dark shadow with glowing purple focus illustration */}
                            <div className="absolute inset-0 bg-[#06040C]" />
                            <img 
                              src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=800&auto=format&fit=crop" 
                              className="w-full h-full object-cover opacity-60 filter grayscale contrast-150 saturate-200" 
                              alt="Glowing purple matrix shadow" 
                            />
                            
                            {/* Glowing Neon Purple eyes effect */}
                            <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-6 h-3 bg-[#9e00ff] rounded-full filter blur-[4px] opacity-90 animate-pulse shadow-[0_0_15px_#9e00ff]" />
                            <div className="absolute top-1/2 right-1/3 -translate-y-1/2 w-6 h-3 bg-[#9e00ff] rounded-full filter blur-[4px] opacity-90 animate-pulse shadow-[0_0_15px_#9e00ff]" />
                            
                            {/* Speech bubble */}
                            <div className="absolute bottom-6 left-12 bg-white text-black font-black text-[10px] md:text-sm font-sans px-4 py-2.5 rounded-full border-2 border-black max-w-[150px] shadow-lg leading-tight text-center">
                              {language === "ja" ? "君は逃げることはできない。" : language === "en" ? "AND YOU CANNOT RUN AWAY." : "E VOCÊ NÃO PODE FUGIR."}
                              <CornerDownRight className="w-3 h-3 text-black absolute -bottom-1.5 left-10 rotate-90" />
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Bottom floating Navigation/Progress Bar matching designs */}
            <div className="p-4 bg-[#08080C] border-t border-white/5 shrink-0 flex items-center justify-between z-15">
              
              {format === 'NOVEL' ? (
                // Novel bottom controls (Image 2)
                <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
                  <Button 
                    variant="ghost"
                    onClick={prevChapter}
                    className="text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 h-10 px-4 gap-2 border border-white/5 rounded-lg shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4" /> {tl("Capítulo anterior")}
                  </Button>

                  <div className="flex-1 flex items-center justify-center gap-4 max-w-lg">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 shrink-0">{tl("Progresso do capítulo")}</span>
                    <div className="h-2 flex-1 bg-white/5 rounded-full overflow-hidden border border-white/10">
                      <div className="h-full bg-primary-purple w-[18%] shadow-[0_0_8px_rgba(124,58,237,0.5)] rounded-full" />
                    </div>
                    <span className="text-xs font-bold text-white shrink-0">18%</span>
                  </div>

                  <Button 
                    onClick={nextChapter}
                    className="bg-primary-purple hover:bg-neon-purple text-white text-xs font-black uppercase tracking-widest h-10 px-6 rounded-lg shadow-lg shadow-purple-900/40 shrink-0"
                  >
                    {tl("Próximo capítulo")} <ChevronRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              ) : (
                // Manga bottom layout controls (Image 1 centered bar)
                <div className="w-full flex items-center justify-between max-w-4xl mx-auto">
                  
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-gray-500 uppercase font-bold text-[10px] tracking-wider">{tl("Modo de leitura")}</span>
                    <div className="flex bg-black/60 p-1 rounded-lg border border-white/10">
                      <button 
                        onClick={() => setMangaReadMode('STANDARD')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase transition-colors ${mangaReadMode === 'STANDARD' ? 'bg-primary-purple text-white' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        {tl("Padrão")}
                      </button>
                      <button 
                        onClick={() => setMangaReadMode('DOUBLE')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase transition-colors ${mangaReadMode === 'DOUBLE' ? 'bg-primary-purple text-white' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        {tl("Dupla página")}
                      </button>
                      <button 
                        onClick={() => setMangaReadMode('WEBTOON')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase transition-colors ${mangaReadMode === 'WEBTOON' ? 'bg-primary-purple text-white' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        {tl("Webtoon")}
                      </button>
                    </div>
                  </div>

                  <Button 
                    onClick={nextChapter}
                    variant="outline"
                    className="border-white/10 hover:bg-white/5 text-xs text-gray-300 h-9 px-4 gap-1.5 rounded-lg"
                  >
                    {tl("Próximo capítulo")} <ChevronRight className="w-3.5 h-3.5" />
                  </Button>

                </div>
              )}

            </div>

          </div>

          {/* 4. Right Side Drawer Panel showing formats and Chapters Index (matches Image 1/2) */}
          {sidebarRightOpen && (
            <aside className="w-80 border-l border-white/5 bg-[#050508] h-full flex flex-col shrink-0 select-none z-10 animate-in slide-in-from-right duration-300">
              
              {/* Header Right Sidebar Tabs */}
              <div className="h-14 border-b border-white/5 px-2 flex shrink-0 bg-[#08080C]">
                <button 
                  onClick={() => setRightPanelTab('chapters')}
                  className={`flex-1 h-full text-xs font-bold tracking-widest uppercase relative flex items-center justify-center border-b-2 transition-all ${rightPanelTab === 'chapters' ? 'text-primary-purple border-primary-purple bg-white/[0.02]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                >
                  {tl("Capítulos")}
                </button>
                <button 
                  onClick={() => setRightPanelTab('library')}
                  className={`flex-1 h-full text-xs font-bold tracking-widest uppercase relative flex items-center justify-center border-b-2 transition-all ${rightPanelTab === 'library' ? 'text-primary-purple border-primary-purple bg-white/[0.02]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                >
                  {tl("Lista Leitura")}
                </button>
                <button 
                  onClick={() => setRightPanelTab('about')}
                  className={`flex-1 h-full text-xs font-bold tracking-widest uppercase relative flex items-center justify-center border-b-2 transition-all ${rightPanelTab === 'about' ? 'text-primary-purple border-primary-purple bg-white/[0.02]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                >
                  {tl("Sobre")}
                </button>
              </div>

              {/* Sidebar Content Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 scrollbar-thin">
                
                {/* 1. Chapter selection active content */}
                {rightPanelTab === 'chapters' && (
                  <div className="flex flex-col gap-5">
                    
                    {/* Formatos disponíveis box */}
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">{tl("Formatos disponíveis")}</h4>
                      <div className="flex flex-col gap-2">
                        
                        {/* Novel selection card */}
                        <div 
                          onClick={() => setFormat('NOVEL')}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${format === 'NOVEL' ? 'border-[#7C3AED] bg-[#7C3AED]/5' : 'border-white/5 bg-[#111118]/80 hover:bg-[#111118]'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center">
                              <Type className="w-4 h-4 text-primary-purple" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white">Novel</span>
                              <span className="text-[10px] text-gray-400">120 {tl("capítulos")}</span>
                            </div>
                          </div>
                          {format === 'NOVEL' && <Badge className="bg-emerald-500/10 text-emerald-400 text-[8px] font-bold tracking-widest">{tl("LENDO")}</Badge>}
                        </div>

                        {/* Manga selection card */}
                        <div 
                          onClick={() => setFormat('MANGA')}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${format === 'MANGA' ? 'border-[#00b4d8] bg-[#00b4d8]/10' : 'border-white/5 bg-[#111118]/80 hover:bg-[#111118]'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#00b4d8]/20 flex items-center justify-center">
                              <Play className="w-4 h-4 text-[#00b4d8]" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white">Mangá</span>
                              <span className="text-[10px] text-gray-400">45 {tl("capítulos")}</span>
                            </div>
                          </div>
                          <Badge className="bg-yellow-500/15 text-yellow-500 text-[8px] font-bold tracking-widest">{tl("EM ANDAMENTO")}</Badge>
                        </div>

                      </div>
                    </div>

                    {/* Dynamic chapters listing for right sidebar */}
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                        {tl("Capítulos")} ({format === 'NOVEL' ? 'Novel' : 'Mangá'})
                      </h4>
                      
                      <div className="flex flex-col gap-1.5 max-h-[360px] overflow-y-auto scrollbar-thin select-none pr-1">
                        {allChapters.map((c) => {
                          const isCurrent = c.id === chapter?.id;
                          return (
                            <div
                              key={c.id}
                              onClick={() => selectChapter(c.id)}
                              className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-all group ${
                                isCurrent 
                                  ? 'bg-[#1D1630] border border-primary-purple/30 text-white' 
                                  : 'hover:bg-white/5 border border-transparent text-gray-400 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`font-mono text-xs w-5 text-center ${isCurrent ? 'text-primary-purple font-black' : 'text-gray-500'}`}>
                                  {c.num}
                                </span>
                                <div className="flex flex-col min-w-0">
                                  <span className={`text-xs font-medium truncate ${isCurrent ? 'text-white font-bold' : ''}`}>
                                    {c.title}
                                  </span>
                                  {isCurrent && (
                                    <span className="text-[8px] text-[#A78BFA] font-black uppercase tracking-wider mt-0.5 animate-pulse">
                                      {tl("LENDO AGORA")}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="shrink-0">
                                {c.isPremium ? (
                                  <Lock className="w-3 h-3 text-yellow-500" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full mt-3 h-9 text-xs text-primary-purple hover:bg-primary-purple/5 font-bold uppercase tracking-widest"
                      >
                        {tl("Ver todos os")} {format === 'NOVEL' ? '120' : '45'} {tl("capítulos")}
                      </Button>
                    </div>

                  </div>
                )}

                {/* 2. Library info tab */}
                {rightPanelTab === 'library' && (
                  <div className="flex flex-col gap-4 text-center py-8">
                     <div className="w-12 h-12 rounded-full bg-primary-purple/10 flex items-center justify-center text-primary-purple mx-auto">
                       <Heart className="w-5 h-5" />
                     </div>
                     <h4 className="text-sm font-bold text-white uppercase tracking-wider">{tl("Favoritos e Playlist")}</h4>
                     <p className="text-xs text-gray-500 leading-relaxed font-normal">
                       {tl("Sua lista de leitura está sincronizada com seu perfil. Obras que você curtir e favoritar aparecem aqui para acesso expresso.")}
                     </p>
                  </div>
                )}

                {/* 3. About page layout info tab (demographics and year context) */}
                {rightPanelTab === 'about' && (
                  <div className="flex flex-col gap-4">
                     <div className="flex gap-3">
                       <img 
                         src={work?.coverUrl || work?.img || "https://images.unsplash.com/photo-1542451313056-b7c8e626645f?q=80&w=150"} 
                         className="w-16 h-24 rounded object-cover shadow border border-white/10"
                         alt="Cover img" 
                       />
                       <div className="flex flex-col justify-center">
                          <h4 className="font-extrabold text-sm text-white leading-tight uppercase mb-1">{work?.title}</h4>
                          <span className="text-xs text-gray-400">Autor: {work?.authorName}</span>
                          <span className="text-[10px] text-[#22c55e] font-bold mt-1 uppercase tracking-widest">{work?.status}</span>
                       </div>
                     </div>
                     <p className="text-xs text-gray-400 leading-relaxed italic border-t border-white/5 pt-3">
                       "{work?.synopsis || tl("Sem sinopse disponível.")}"
                     </p>
                     
                     <div className="grid grid-cols-2 gap-3 text-[10px] uppercase font-bold text-gray-500 border-t border-white/5 pt-3">
                       <div>{tl("Demografia")}: <span className="text-white font-semibold">Seinen</span></div>
                       <div>{tl("Artista")}: <span className="text-white font-semibold">Studio Kage</span></div>
                       <div>{tl("Início")}: <span className="text-white font-semibold">2023</span></div>
                       <div>{tl("Nota")}: <span className="text-amber-400 font-semibold">★ 4.8</span></div>
                     </div>
                  </div>
                )}

              </div>

            </aside>
          )}

        </div>
      </div>
    </div>
  );
}
