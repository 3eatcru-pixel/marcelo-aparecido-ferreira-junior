import { Button } from "@/components/ui/button";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import UnderlineExtension from "@tiptap/extension-underline";
import { NovelSidebar } from "../components/NovelSidebar";
import { AssistantSidebar } from "../components/AssistantSidebar";
import { ChaptersSidebar } from "../components/ChaptersSidebar";
import {
  Cloud,
  CheckCircle2,
  Search,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Quote,
  Undo,
  Redo,
  ChevronDown,
  Wand2,
  HardDrive,
  Maximize2,
  Minimize2,
  Target,
  Clock3,
  ChevronLeft,
  History,
  Palette,
  Type,
  BookOpen,
  Sparkles,
  Settings,
  Download,
  HelpCircle,
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { doc, getDoc, updateDoc, collection, addDoc, setDoc, increment, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { createDriveFile } from "@/lib/firebase/drive";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isAndroidEnvironment, triggerHaptic, reportNavigation } from "@/lib/android-bridge";

export function NovelEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAppStore();
  const [workTitle, setWorkTitle] = useState("Carregando...");
  const [workSubtitle, setWorkSubtitle] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [driveFolderId, setDriveFolderId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDrive, setIsSavingDrive] = useState(false);
  const [isPublishingChapter, setIsPublishingChapter] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "Você tem alterações não salvas no rascunho de sua história. Tem certeza que deseja sair?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (id) {
      reportNavigation(`/novel/editor/${id}`);
      triggerHaptic('light');
    }
  }, [id]);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [wordGoal, setWordGoal] = useState(2000);
  const [isChangingGoal, setIsChangingGoal] = useState(false);
  const [goalInputValue, setGoalInputValue] = useState("2000");
  const [showAssistant, setShowAssistant] = useState(true);
  // Chapter State
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [chapterTitle, setChapterTitle] = useState("");
  const [isMigrating, setIsMigrating] = useState(true);

  // Polished aesthetics preferences
  const [fontStyle, setFontStyle] = useState<'serif' | 'sans' | 'mono'>('serif');
  const [canvasTheme, setCanvasTheme] = useState<'ink' | 'charcoal' | 'sepia' | 'paper'>('ink');

  // WPM & Typing performance speeds
  const [sessionStartTime] = useState(Date.now());
  const [initialWordCount, setInitialWordCount] = useState<number | null>(null);
  const [sessionWpm, setSessionWpm] = useState(0);

  // Saved backups array for safe draft recovery
  const [backups, setBackups] = useState<Array<{ timestamp: number; html: string; wordCount: number }>>([]);
  const [showBackups, setShowBackups] = useState(false);

  // Find & Replace state
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [replaceCount, setReplaceCount] = useState<number | null>(null);

  // Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const handleFindReplaceAll = () => {
    if (!editor || editor.isDestroyed || !findText.trim()) {
      toast.error("Por favor, informe o termo para localizar.");
      return;
    }
    let html = "";
    try {
      html = editor.getHTML();
    } catch(err) {
      toast.error("Erro interno do editor, aguarde."); return;
    }
    const escaped = findText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    const matches = (html.match(regex) || []).length;
    
    if (matches === 0) {
      toast.info(`Nenhuma correspondência de "${findText}" encontrada.`);
      setReplaceCount(0);
      return;
    }

    const newHtml = html.replaceAll(findText, replaceText);
    editor.commands.setContent(newHtml);
    setReplaceCount(matches);
    toast.success(`Sucesso! Substituídas ${matches} ocorrências de "${findText}" por "${replaceText}".`);
    saveWork();
  };

  const handleExportFile = async (format: 'markdown' | 'pdf_html' | 'epub_xhtml' | 'docx_raw') => {
    if (!id || !editor || editor.isDestroyed) return;
    
    // Fetch all chapters to export the full manuscript
    toast.info("Iniciando exportação completa do manuscrito...");
    let fullHtmlContent = "";
    try {
      const chaptersSnapshot = await getDocs(query(collection(db, "projects", id, "draftChapters"), orderBy("order", "asc")));
      chaptersSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fullHtmlContent += `<h2>${data.title}</h2>\n${data.content}\n<br/><br/>\n`;
      });
    } catch(err) {
      console.error(err);
      toast.error("Erro ao ler os capítulos do projeto.");
      return;
    }

    if (!fullHtmlContent.trim()) {
      try { fullHtmlContent = editor.getHTML(); } catch(err) {}
    }

    let filename = `${workTitle || 'novels_manuscript'}`;
    let blob: Blob;

    if (format === 'markdown') {
      filename += '.md';
      const markdown = fullHtmlContent
        .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<em>(.*?)<\/em>/gi, '*$1*')
        .replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '');
      
      const fileHeader = `# ${workTitle}\n${workSubtitle ? `## ${workSubtitle}\n` : ''}\n---\n\n`;
      blob = new Blob([fileHeader + markdown], { type: 'text/markdown;charset=utf-8;' });
    } else if (format === 'pdf_html') {
      filename += '_print.html';
      const formattedHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${workTitle}</title>
          <style>
            body { line-height: 1.8; font-family: 'Georgia', serif; font-size: 16px; color: #111; max-width: 700px; margin: 40px auto; padding: 20px; text-align: justify; }
            h1 { text-align: center; text-transform: uppercase; font-size: 2.2rem; margin-bottom: 5px; }
            .subtitle { text-align: center; font-weight: normal; font-size: 1.2rem; color: #555; margin-bottom: 40px; }
            h2 { font-size: 1.6rem; color: #222; text-align: center; margin-top: 50px; margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
            p { text-indent: 2em; margin: 0 0 1.2em 0; }
            blockquote { border-left: 3px solid #ccc; padding-left: 15px; font-style: italic; color: #444; }
          </style>
        </head>
        <body>
          <h1>${workTitle}</h1>
          ${workSubtitle ? `<div class="subtitle">${workSubtitle}</div>` : ''}
          <hr style="border: 0; border-top: 1px solid #ccc; margin-bottom: 40px;">
          ${fullHtmlContent}
        </body>
        </html>
      `;
      blob = new Blob([formattedHTML], { type: 'text/html;charset=utf-8;' });
    } else if (format === 'docx_raw') {
      filename += '.doc';
      const docHeader = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>${workTitle}</title><style>body { font-family: 'Arial'; }</style></head>
      <body><h1>${workTitle}</h1>${fullHtmlContent}</body></html>`;
      blob = new Blob([docHeader], { type: 'application/msword' });
    } else {
      filename += '.epub.xhtml';
      const epubFrame = `<?xml version="1.0" encoding="utf-8"?>
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="pt">
        <head>
          <title>${workTitle}</title>
        </head>
        <body>
          <h2>${workTitle}</h2>
          ${fullHtmlContent}
        </body>
        </html>
      `;
      blob = new Blob([epubFrame], { type: 'application/xhtml+xml;charset=utf-8' });
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exportação concluída! Documento "${filename}" baixado com sucesso.`);
    setShowExportModal(false);
  };

  const saveWork = async (isManual = false) => {
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
      autoSaveTimeout.current = null;
    }
    if (!id || !editor || editor.isDestroyed || !activeChapterId) return;
    setIsSaving(true);
    try {
      let content = "";
      try {
        content = editor.getHTML();
      } catch (err) {
        console.warn("Skipping save: editor is an invalid state (likely unmounting).");
        return;
      }

      if (id === "sandbox-test") {
        // Save metadata
        const metadata = { title: workTitle, subtitle: workSubtitle };
        localStorage.setItem("audtrilha_novel_sandbox_work", JSON.stringify(metadata));

        // Save active chapter content back into sandbox chapters storage list
        const storedChapters = localStorage.getItem("audtrilha_novel_sandbox_chapters");
        if (storedChapters) {
          try {
            const list = JSON.parse(storedChapters);
            if (list && Array.isArray(list)) {
              const updated = list.map((c: any) => c.id === activeChapterId ? { ...c, content, title: chapterTitle } : c);
              localStorage.setItem("audtrilha_novel_sandbox_chapters", JSON.stringify(updated));
            }
          } catch (err) {
            console.error(err);
          }
        }
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        setIsSaving(false);
        if (isAndroidEnvironment()) {
          window.AndroidAudtrilha?.saveDraft(id, JSON.stringify({ title: workTitle, activeChapterId, content }));
        }
        triggerHaptic('light');
        if (isManual) {
          toast.success("✨ Rascunho salvo com sucesso localmente!");
        }
        return;
      }

      // Only title and subtitle update on main project
      await updateDoc(doc(db, "projects", id), {
        title: workTitle,
        subtitle: workSubtitle,
        updatedAt: Date.now()
      });
      // Content updates on chapter level
      await updateDoc(doc(db, "projects", id, "draftChapters", activeChapterId), {
        content: content,
        updatedAt: Date.now()
      });
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      if (isAndroidEnvironment()) {
        window.AndroidAudtrilha?.saveDraft(id, JSON.stringify({ title: workTitle, activeChapterId, content }));
      }
      triggerHaptic('light');
      if (isManual) {
        toast.success("✨ Rascunho salvo com sucesso no Firestore!");
      }
    } catch (error) {
      console.error("Error saving work:", error);
      if (isManual) {
        toast.error("Erro ao salvar o rascunho em nuvem.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const triggerLocalBackup = (htmlContent: string, currentWords: number) => {
    if (!id || !htmlContent || htmlContent === '<p></p>' || htmlContent === '') return;
    const now = Date.now();
    const newBackup = { timestamp: now, html: htmlContent, wordCount: currentWords };
    
    setBackups(prev => {
      // Keep unique and slice to max 5 snapshots
      const filtered = prev.filter(b => b.html !== htmlContent);
      const updated = [newBackup, ...filtered].slice(0, 5);
      localStorage.setItem(`draft_backups_${id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const restoreBackup = (html: string) => {
    if (!editor || editor.isDestroyed) return;
    editor.commands.setContent(html);
    toast.success("Rascunho recuperado com sucesso para o estágio selecionado!");
    setShowBackups(false);
    saveWork();
  };

  const saveToDrive = async () => {
    if (!editor || editor.isDestroyed) return;
    setIsSavingDrive(true);
    try {
      if (id === "sandbox-test") {
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.success(`🎉 "Novel Studio Sandbox" exportado com sucesso para o [Simulado] Google Drive!`);
        setIsSavingDrive(false);
        return;
      }

      let htmlContent = "";
      try { htmlContent = editor.getHTML(); } catch(err) {}

      const content = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${workTitle}</title>
          <style>
            body { font-family: 'Georgia', serif; line-height: 1.8; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; }
            h1 { text-align: center; color: #111; border-bottom: 1px solid #ccc; padding-bottom: 20px; }
            p { text-indent: 20px; font-size: 1.1rem; }
          </style>
        </head>
        <body>
          <h1>${workTitle}</h1>
          <div class="content">
            ${htmlContent}
          </div>
        </body>
        </html>
      `;

      await createDriveFile(`${workTitle} - Rascunho.html`, content, "text/html", driveFolderId);
      toast.success(`"${workTitle}" exportado com sucesso para o Google Drive!`);
    } catch (e) {
      console.error("Failed saving to Drive:", e);
      toast.error("Erro ao salvar no seu GDrive. Verifique suas permissões.");
    } finally {
      setIsSavingDrive(false);
    }
  };

  const publishChapter = async () => {
    if (!id || !editor || editor.isDestroyed) return;
    
    if (id === "sandbox-test") {
      setIsPublishingChapter(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("🎉 [SIMULADO] Capítulo do Sandbox publicado com sucesso no catálogo oficial do Audtrilha!");
      setIsPublishingChapter(false);
      return;
    }

    // Quality & Guidance: check word count minimum
    const words = editor.getText().split(/\s+/).filter(w => w).length || 0;
    if (words < 1500) {
      toast.warning(`Diretrizes de Qualidade do AUDTRILHA: Novels oficiais exigem pelo menos 1.500 palavras por capítulo publicado (Atualmente: ${words}).`);
      return;
    }

    setIsPublishingChapter(true);
    try {
      let content = "";
      try {
        content = editor.getHTML();
      } catch (err) {
        toast.error("Editor inválido. Tente novamente.");
        setIsPublishingChapter(false);
        return;
      }
      // Increments total chapter and adds a sub-collection inside published_works
      const workRef = doc(db, "published_works", id);
      const docSnap = await getDoc(workRef);
      if (docSnap.exists()) {
        const total = docSnap.data().totalChapters || 0;
        const newChapterNum = total + 1;
        
        // Add chapter to subcollection
        await addDoc(collection(db, `published_works/${id}/chapters`), {
          content: content,
          number: newChapterNum,
          title: chapterTitle || `Capítulo ${newChapterNum}`,
          createdAt: Date.now(),
          priceCoins: docSnap.data().tier === 'PAY_PER_CHAPTER' ? docSnap.data().priceCoins : 0,
          isPremium: docSnap.data().tier === 'PAY_PER_CHAPTER'
        });

        // Update total chapters in work
        await updateDoc(workRef, {
          totalChapters: increment(1),
          updatedAt: Date.now()
        });

        toast.success(`🎉 Capítulo ${newChapterNum} publicado com sucesso no catálogo oficial!`);
      } else {
        toast.error("Erro: Versão publicada para esta obra não foi encontrada.");
      }
    } catch(e) {
      console.error("Error publishing chapter:", e);
      toast.error("Não foi possível publicar o capítulo.");
    } finally {
      setIsPublishingChapter(false);
    }
  }

  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      Placeholder.configure({
        placeholder: "Comece a escrever seu capítulo...",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[550px] w-full",
      },
    },
    onUpdate: ({ editor }) => {
      try {
        const text = editor.getText();
        const currentWords = text.split(/\s+/).filter(w => w).length || 0;
        setWordCount(currentWords);
        const html = editor.getHTML();
        setHasUnsavedChanges(true);

        // Basic auto-save trigger with debounce
        if (autoSaveTimeout.current) {
          clearTimeout(autoSaveTimeout.current);
        }
        autoSaveTimeout.current = setTimeout(() => {
          saveWork();
          triggerLocalBackup(html, currentWords);
        }, 3000); // 3 seconds debounce
      } catch (err) {
        console.warn("Editor unmounted or missing properties during update.", err);
      }
    }
  });

  // Calculate word count manually when chapter is loaded
  useEffect(() => {
    if (editor && !editor.isDestroyed && activeChapterId) {
      try {
        const text = editor.getText();
        setWordCount(text.split(/\s+/).filter(w => w).length || 0);
      } catch (err) {}
    }
  }, [activeChapterId]);

  useEffect(() => {
    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
        autoSaveTimeout.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const loadWorkBase = async () => {
      if (!id) return;

      if (id === "sandbox-test") {
        const storedData = localStorage.getItem("audtrilha_novel_sandbox_work");
        if (storedData) {
          try {
            const parsed = JSON.parse(storedData);
            setWorkTitle(parsed.title || "Novel Studio Sandbox");
            setWorkSubtitle(parsed.subtitle || "Rascunho Rápido Offline");
          } catch (err) {
            console.error("Error parsing sandbox work metadata", err);
          }
        } else {
          setWorkTitle("Novel Studio Sandbox");
          setWorkSubtitle("Rascunho Rápido Offline");
        }
        return;
      }

      if (!currentUser) return;
      try {
        const docRef = doc(db, "projects", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setWorkTitle(data.title || "Sem título");
          setWorkSubtitle(data.subtitle || "");
          setDriveFolderId(data.driveFolderId || "");
          
          // Verify if we need to migrate currentDraft to chapters
          const chaptersQuery = await getDocs(collection(db, "projects", id, "draftChapters"));
          if (chaptersQuery.empty) {
             const initContent = data.currentDraft || "<p></p>";
             const newChapterRef = await addDoc(collection(db, "projects", id, "draftChapters"), {
               title: "Capítulo 1",
               order: 1,
               content: initContent,
               createdAt: Date.now()
             });
             setActiveChapterId(newChapterRef.id);
             setChapterTitle("Capítulo 1");
             if (editor) editor.commands.setContent(initContent);
          }
        }
      } catch (err) {
        console.error("Error loading work", err);
      }
    };
    loadWorkBase();
  }, [id, currentUser]);

  useEffect(() => {
    const loadChapterContent = async () => {
      if (!id || !activeChapterId || !editor) return;

      if (id === "sandbox-test") {
        const storedChapters = localStorage.getItem("audtrilha_novel_sandbox_chapters");
        if (storedChapters) {
          try {
            const list = JSON.parse(storedChapters);
            const chapter = list.find((c: any) => c.id === activeChapterId);
            if (chapter) {
              editor.commands.setContent(chapter.content || "<p></p>");
              setChapterTitle(chapter.title || "");
            }
          } catch (err) {
            console.error("Error reading chapters content of sandbox", err);
          }
        } else {
          const defaultText = "<p><strong>Paris, França — 20 de novembro de 1999.</strong></p><p><em>Naquela noite, saí em busca de uma nova pista, algo que me desse alguma resposta.</em></p><p>Caminhei por alguns becos escuros rumo à entrada de uma boate chamada <strong>Le Cabaret</strong>. Logo ao me aproximar, avistei dois seguranças na porta. Foi muito fácil forçar minha entrada, pois não havia movimento naquela noite.</p>";
          editor.commands.setContent(defaultText);
          setChapterTitle("Prólogo");
        }
        return;
      }

      try {
        const chapRef = doc(db, "projects", id, "draftChapters", activeChapterId);
        const chapSnap = await getDoc(chapRef);
        if (chapSnap.exists()) {
          editor.commands.setContent(chapSnap.data().content || "<p></p>");
          setChapterTitle(chapSnap.data().title || "");
        }
      } catch (err) {
        console.error("Error loading chapter", err);
      }
    };
    loadChapterContent();
  }, [id, activeChapterId, editor]);

  // Load backups list dynamically from storage
  useEffect(() => {
    if (id) {
      const stored = localStorage.getItem(`draft_backups_${id}`);
      if (stored) {
        setBackups(JSON.parse(stored));
      }
    }
  }, [id]);

  // Typing speed calculator WPM
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      try {
        const text = editor.getText();
        const currentWords = text.split(/\s+/).filter(w => w).length || 0;
        setInitialWordCount(currentWords);
      } catch(err) {}
    }
  }, [editor, activeChapterId]); // Re-initialize when chapter changes

  useEffect(() => {
    const interval = setInterval(() => {
      if (!editor || editor.isDestroyed || initialWordCount === null) return;
      try {
        const text = editor.getText();
        const currentWords = text.split(/\s+/).filter(w => w).length || 0;
        const written = Math.max(0, currentWords - initialWordCount);
        const elapsedMinutes = (Date.now() - sessionStartTime) / 60000;
        if (elapsedMinutes > 0.05) {
          setSessionWpm(Math.round(written / elapsedMinutes));
        }
      } catch (err) {}
    }, 4000);
    return () => clearInterval(interval);
  }, [editor, initialWordCount, sessionStartTime]);

  const progressPercent = Math.min(100, (wordCount / wordGoal) * 100);
  const estReadingTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleApplyGoal = () => {
    const parsed = parseInt(goalInputValue);
    if (!isNaN(parsed) && parsed > 0) {
      setWordGoal(parsed);
      setIsChangingGoal(false);
      toast.success(`Meta de palavras reconfigurada para ${parsed}!`);
    } else {
      toast.error("Por favor, insira um número inteiro válido.");
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-6 -mt-6 overflow-hidden select-none">
      {/* Micro Sidebar Tools */}
      {!isFocusMode && <NovelSidebar />}
      
      {/* Chapters Sidebar */}
      {!isFocusMode && id && (
         <ChaptersSidebar 
            projectId={id} 
            activeChapterId={activeChapterId} 
            onSelectChapter={(chapterId) => {
               if (activeChapterId !== chapterId && editor) {
                 saveWork(); // save current before switching
                 setActiveChapterId(chapterId);
               } else if (!activeChapterId) {
                 setActiveChapterId(chapterId);
               }
            }} 
         />
      )}

      {/* Main Editor Area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-500 relative",
        isFocusMode 
          ? (canvasTheme === 'sepia' ? 'bg-[#ebdcb4]' : canvasTheme === 'paper' ? 'bg-[#f0ede6]' : 'bg-[#050508]')
          : (canvasTheme === 'sepia' ? 'bg-[#eae3cb]' : canvasTheme === 'paper' ? 'bg-zinc-100' : 'bg-[#0E0E14]')
      )}>
        
        {/* Editor Top Bar */}
        {!isFocusMode && (
          <header className={cn(
            "h-14 border-b px-6 flex items-center justify-between shrink-0 transition-colors duration-300",
            (canvasTheme === 'sepia' || canvasTheme === 'paper') 
              ? "bg-[#faf9f6]/95 border-zinc-200 text-zinc-800 shadow-sm" 
              : "bg-[#0B0B0F]/95 border-manga-border text-white"
          )}>
            <div className="flex items-center gap-6">
               <button
                 onClick={() => saveWork(true)}
                 className="editor-save-button flex items-center gap-2 hover:bg-white/5 active:scale-95 transition-all p-1.5 rounded-lg cursor-pointer shrink-0"
                 title="Clique para salvar o rascunho manualmente"
               >
                 <CheckCircle2 className={cn("w-4 h-4", isSaving ? 'text-amber-500 animate-pulse' : 'text-emerald-500')} />
                 <span className={cn("text-xs font-semibold translate-y-[1px]", isSaving ? 'text-amber-500' : 'text-emerald-500')}>
                   {isSaving ? "SALVANDO..." : (lastSaved ? "SALVO CLOUD" : "PRONTO")}
                 </span>
               </button>
              <div className="h-4 w-px bg-current opacity-10" />
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-none">{wordCount}</span>
                  <span className="text-[10px] opacity-60 uppercase tracking-widest mt-0.5 font-medium">Palavras</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-none flex items-center gap-1">
                    <Clock3 className="w-3 h-3 text-primary-purple shrink-0" />
                    {estReadingTime} min
                  </span>
                  <span className="text-[10px] opacity-60 uppercase tracking-widest mt-0.5 font-medium">Leitura</span>
                </div>
                {sessionWpm > 0 && (
                  <div className="flex flex-col animate-fade-in">
                    <span className="text-xs font-bold leading-none text-emerald-500">{sessionWpm} WPM</span>
                    <span className="text-[10px] opacity-60 uppercase tracking-widest mt-0.5 font-medium">Digitação</span>
                  </div>
                )}
              </div>
            </div>

            {/* Hub Selector (Center) */}
            <div className="flex bg-black/10 p-1 rounded-full border border-black/5">
              <button 
                onClick={() => navigate(`/novel-studio/${id}`)}
                className="px-5 py-1 text-xs font-bold bg-primary-purple text-white rounded-full transition-colors cursor-pointer"
              >
                PROSA
              </button>
              <button 
                onClick={() => navigate(`/novel-studio/${id}/world`)}
                className="px-5 py-1 text-xs font-semibold text-muted-foreground hover:text-white rounded-full transition-colors cursor-pointer"
              >
                VISÃO
              </button>
              <button 
                onClick={() => navigate(`/novel-studio/${id}/bible`)}
                className="px-5 py-1 text-xs font-semibold text-muted-foreground hover:text-white rounded-full transition-colors cursor-pointer"
              >
                NEXO
              </button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsFocusMode(true)}
                variant="ghost"
                size="sm"
                className="h-8 text-xs font-medium cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5 mr-2" /> Tela Inteira
              </Button>
              <Button
                onClick={() => setShowFindReplace(!showFindReplace)}
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 rounded-full text-xs cursor-pointer border",
                  showFindReplace 
                    ? "bg-[#7C3AED]/20 border-[#7C3AED]/40 text-[#A78BFA]" 
                    : (canvasTheme === 'sepia' || canvasTheme === 'paper') ? "bg-white border-zinc-200 text-zinc-700" : "bg-[#0B0B0F] border-manga-border text-gray-300"
                )}
              >
                <Search className="w-3.5 h-3.5 mr-1" /> Localizar
              </Button>
              <Button
                onClick={() => setShowExportModal(true)}
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 rounded-full text-xs cursor-pointer border",
                  (canvasTheme === 'sepia' || canvasTheme === 'paper') ? "bg-white border-zinc-200 text-zinc-700" : "bg-[#0B0B0F] border-manga-border text-gray-300"
                )}
              >
                <Download className="w-3.5 h-3.5 mr-1" /> Exportar
              </Button>
              <Button
                onClick={() => setShowBackups(!showBackups)}
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 rounded-full text-xs cursor-pointer border",
                  (canvasTheme === 'sepia' || canvasTheme === 'paper') ? "bg-white border-zinc-200 text-zinc-700" : "bg-[#0B0B0F] border-manga-border text-gray-300"
                )}
              >
                <History className="w-3.5 h-3.5 mr-1" /> Histórico
              </Button>
              <Button
                onClick={saveToDrive}
                disabled={isSavingDrive}
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 rounded-full text-xs hidden lg:flex cursor-pointer border",
                  (canvasTheme === 'sepia' || canvasTheme === 'paper') ? "bg-white border-zinc-200 text-zinc-700" : "bg-[#0B0B0F] border-manga-border text-gray-300"
                )}
                title="Sincronizar com pasta segura do Google Drive"
              >
                <HardDrive className="w-3.5 h-3.5 mr-2" /> {isSavingDrive ? "Salvando..." : "Drive"}
              </Button>
              <Button
                onClick={publishChapter}
                disabled={isPublishingChapter}
                className="h-8 bg-emerald-500 hover:bg-emerald-600 rounded-full text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] text-white cursor-pointer"
              >
                {isPublishingChapter ? "PUBLICANDO..." : "PUBLICAR CAPÍTULO"}
              </Button>
              <Button 
                onClick={() => setShowAssistant(!showAssistant)}
                className={cn(
                  "h-8 rounded-full text-xs font-bold transition-all cursor-pointer",
                  showAssistant 
                    ? "bg-primary-purple hover:bg-neon-purple text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]" 
                    : (canvasTheme === 'sepia' || canvasTheme === 'paper') 
                      ? "bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800" 
                      : "bg-manga-card hover:bg-white/10 text-gray-300 border border-manga-border"
                )}
              >
                <Wand2 className="w-3.5 h-3.5 mr-2" /> {showAssistant ? "OCULTAR IA" : "COAUTOR IA"}
              </Button>
            </div>
          </header>
        )}

        {/* Floating Controls for Focus Mode */}
        {isFocusMode && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-black/60 rounded-full p-1.5 backdrop-blur-md border border-white/10 animate-fade-in shadow-2xl">
            <div className="flex items-center gap-1.5 px-3 py-1">
              <span className="text-[10px] font-bold tracking-widest text-[#9d4edd] uppercase">Foco Ativo</span>
              <span className="text-gray-400 text-xs">|</span>
              <span className="text-xs text-gray-300 font-semibold">{wordCount} Palavras</span>
            </div>
            
            {/* Tone options in Focus Mode */}
            <div className="w-px h-4 bg-white/10" />
            
            <button
              onClick={() => setFontStyle(fontStyle === 'serif' ? 'sans' : fontStyle === 'sans' ? 'mono' : 'serif')}
              className="p-1 px-2 hover:bg-white/10 rounded-full text-gray-300 text-[10px] uppercase font-bold transition-colors cursor-pointer"
              title="Mudar Fonte"
            >
              Fonte: {fontStyle}
            </button>
            
            <button
              onClick={() => setCanvasTheme(canvasTheme === 'ink' ? 'sepia' : canvasTheme === 'sepia' ? 'paper' : 'ink')}
              className="p-1 px-2 hover:bg-white/10 rounded-full text-gray-300 text-[10px] uppercase font-bold transition-colors cursor-pointer"
              title="Mudar Tema"
            >
              Tema
            </button>

            <div className="w-px h-4 bg-white/10" />

            <Button
              onClick={() => setIsFocusMode(false)}
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-full cursor-pointer px-3"
            >
              <Minimize2 className="w-3 h-3 mr-1" /> Sair
            </Button>
          </div>
        )}

        {/* Local Backups List Drawer */}
        {showBackups && (
          <div className="absolute top-14 right-6 w-96 bg-[#111118] border border-white/10 rounded-2xl shadow-2xl z-40 p-5 mt-2 animate-fade-in">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-primary-purple" />
                <h4 className="text-sm font-bold text-white">Snapshots Locais</h4>
                <Badge variant="outline" className="text-[9px] border-white/10 text-gray-400">Autosave</Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs text-gray-400 hover:text-white"
                onClick={() => setShowBackups(false)}
              >
                Fechar
              </Button>
            </div>
            
            <p className="text-[11px] text-gray-500 mb-4 font-normal">
              Backups automáticos criados a cada keystroke. Armazenados de forma isolada e segura em seu navegador.
            </p>

            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {backups.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500 italic">
                  Nenhum snapshot local gerado ainda. Digite algo para disparar.
                </div>
              ) : (
                backups.map((bk, i) => (
                  <div key={i} className="group bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 flex items-center justify-between hover:bg-white/[0.04] transition-all">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-200">
                        {new Date(bk.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {bk.wordCount} palavras • {new Date(bk.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => restoreBackup(bk.html)}
                      className="bg-primary-purple hover:bg-neon-purple text-white text-[10px] h-7 font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Restaurar
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Editor Writing Desk Canvas */}
        <div className={cn(
          "flex-1 overflow-y-auto scrollbar-thin transition-all duration-700 select-text p-10 lg:px-[18%]",
          isFocusMode ? 'pt-24 max-w-4xl mx-auto w-full' : 'pt-10'
        )}>
          
          {/* Chapter Details Panel */}
          <div className="mb-8">
            {!isFocusMode && (
              <Link to="/dashboard" className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground hover:text-white flex items-center gap-1 transition-colors mb-6 cursor-pointer">
                <ChevronLeft className="w-3 h-3" /> VOLTAR PARA DASHBOARD
              </Link>
            )}

            <div className="flex items-center justify-between gap-4 mb-4 select-none">
              <div className="flex items-center gap-3">
                {isChangingGoal ? (
                  <div className="flex items-center gap-2 bg-manga-accent/40 p-1 rounded-xl border border-white/5 animate-fade-in">
                    <input 
                      type="number"
                      className="w-16 h-7 bg-manga-bg border border-white/10 rounded-lg text-xs font-bold text-center text-white focus:outline-none"
                      value={goalInputValue}
                      onChange={(e) => setGoalInputValue(e.target.value)}
                    />
                    <Button 
                      size="sm" 
                      onClick={handleApplyGoal}
                      className="bg-emerald-500 text-white h-7 text-[10px] font-bold px-2.5 rounded-lg"
                    >
                      OK
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setIsChangingGoal(false)}
                      className="text-gray-400 hover:text-white h-7 text-[10px] px-2 rounded-lg"
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div 
                    onClick={() => {
                      setGoalInputValue(String(wordGoal));
                      setIsChangingGoal(true);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 border rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95",
                      (canvasTheme === 'sepia' || canvasTheme === 'paper')
                        ? "bg-white/60 border-zinc-200 text-zinc-700 hover:border-zinc-400"
                        : "bg-white/5 border-white/5 text-gray-300 hover:border-white/20"
                    )}
                    title="Clique para customizar a meta de palavras"
                  >
                    <Target className="w-3.5 h-3.5 text-primary-purple" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{wordGoal} Palavras</span>
                  </div>
                )}

                <span className="text-xs opacity-55 font-medium">Capítulo Progresso:</span>
              </div>
              
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest hover:underline cursor-pointer",
                progressPercent >= 100 ? "text-emerald-500" : "text-primary-purple"
              )}>
                {Math.round(progressPercent)}% Concluído
              </span>
            </div>

            {/* Glowing Goal Bar */}
            <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden mb-6 flex select-none">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  progressPercent >= 100 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                    : "bg-gradient-to-r from-[#7C3AED] to-[#9d4edd] shadow-[0_0_10px_rgba(124,58,237,0.5)]"
                )} 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>

            {/* Editable Title */}
            <h1
              className={cn(
                "text-3xl md:text-5xl font-black mb-4 outline-none empty:before:content-['TÍTULO_DA_NOVEL'] empty:before:opacity-30 uppercase tracking-tighter cursor-text select-text transition-colors duration-300",
                (canvasTheme === 'sepia' || canvasTheme === 'paper') ? "text-zinc-900 border-b border-zinc-200 pb-2 font-serif font-black" : "text-white"
              )}
              contentEditable
              suppressContentEditableWarning
              onBlur={async (e) => {
                const newTitle = e.currentTarget.textContent || "Sem título";
                setWorkTitle(newTitle);
                if (id) {
                  try {
                    await updateDoc(doc(db, "projects", id), {
                      title: newTitle,
                      updatedAt: Date.now()
                    });
                    setLastSaved(new Date());
                  } catch(e) {
                    console.error("Failed to save title", e);
                  }
                }
              }}
            >
              {workTitle === "Carregando..." ? "" : workTitle}
            </h1>

            {/* Editable Subtitle */}
            <p
              className={cn(
                "outline-none empty:before:content-['Adicione_um_subtítulo_opcional_da_história...'] empty:before:opacity-30 cursor-text select-text text-lg transition-colors duration-300",
                (canvasTheme === 'sepia' || canvasTheme === 'paper') ? "text-zinc-600 italic" : "text-muted-foreground font-medium"
              )}
              contentEditable
              suppressContentEditableWarning
              onBlur={async (e) => {
                const newSubtitle = e.currentTarget.textContent || "";
                setWorkSubtitle(newSubtitle);
                if (id) {
                  try {
                    await updateDoc(doc(db, "projects", id), {
                      subtitle: newSubtitle,
                      updatedAt: Date.now()
                    });
                    setLastSaved(new Date());
                  } catch(e) {
                     console.error("Failed to save subtitle", e);
                  }
                }
              }}
            >
              {workSubtitle}
            </p>
          </div>

          {/* Typography, Theme and Quick Formatting Toolbar */}
          <div className={cn(
            "sticky top-4 z-30 border rounded-2xl p-2 flex flex-col md:flex-row gap-3 items-center justify-between mb-8 shadow-2xl backdrop-blur-md select-none transition-all duration-300",
            (canvasTheme === 'sepia' || canvasTheme === 'paper')
              ? "bg-white/95 border-zinc-200 text-zinc-900 shadow-zinc-300/50"
              : "bg-[#111118]/95 border-manga-border text-white shadow-black/80"
          )}>
            {/* Standard Text Formatting */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg transition-all cursor-pointer",
                  editor?.isActive("bold")
                    ? "bg-primary-purple/20 text-primary-purple border border-primary-purple/30"
                    : "opacity-60 hover:opacity-100 hover:bg-black/10"
                )}
                onClick={() => editor?.chain().focus().toggleBold().run()}
                title="Negrito (Ctrl+B)"
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg transition-all cursor-pointer",
                  editor?.isActive("italic")
                    ? "bg-primary-purple/20 text-primary-purple border border-primary-purple/30"
                    : "opacity-60 hover:opacity-100 hover:bg-black/10"
                )}
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                title="Itálico (Ctrl+I)"
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg transition-all cursor-pointer",
                  editor?.isActive("underline")
                    ? "bg-primary-purple/20 text-primary-purple border border-primary-purple/30"
                    : "opacity-60 hover:opacity-100 hover:bg-black/10"
                )}
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                title="Sublinhado (Ctrl+U)"
              >
                <Underline className="w-4 h-4" />
              </Button>
              
              <div className="w-px h-5 bg-current opacity-10 mx-1" />

              {/* Tiptap Headings & Nodes */}
              <button
                onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                className={cn(
                  "h-8 px-2.5 rounded-lg text-xs font-black transition-all cursor-pointer",
                  editor?.isActive("heading", { level: 1 })
                    ? "bg-primary-purple/20 text-primary-purple border border-primary-purple/30 font-extrabold"
                    : "opacity-60 hover:opacity-100 hover:bg-black/10"
                )}
                title="Título Principal"
              >
                H1
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn(
                  "h-8 px-2.5 rounded-lg text-xs font-black transition-all cursor-pointer",
                  editor?.isActive("heading", { level: 2 })
                    ? "bg-primary-purple/20 text-primary-purple border border-primary-purple/30 font-extrabold"
                    : "opacity-60 hover:opacity-100 hover:bg-black/10"
                )}
                title="Subtítulo Principal"
              >
                H2
              </button>
              
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg transition-all cursor-pointer",
                  editor?.isActive("blockquote")
                    ? "bg-primary-purple/20 text-primary-purple border border-primary-purple/30"
                    : "opacity-60 hover:opacity-100 hover:bg-black/10"
                )}
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                title="Citação / Recuo"
              >
                <Quote className="w-3.5 h-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg transition-all cursor-pointer",
                  editor?.isActive("bulletList")
                    ? "bg-primary-purple/20 text-primary-purple border border-primary-purple/30"
                    : "opacity-60 hover:opacity-100 hover:bg-black/10"
                )}
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                title="Lista de Marcadores"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* Font & Aesthetic Setup options (Right aligned) */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Font Selector */}
              <div className="flex bg-black/10 p-0.5 rounded-xl border border-black/5">
                <button
                  onClick={() => {
                    setFontStyle('serif');
                    toast.success("Fonte literária de romance (Serif) ativada.");
                  }}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all flex items-center gap-1 cursor-pointer font-serif leading-none",
                    fontStyle === 'serif' ? "bg-primary-purple text-white shadow-sm" : "opacity-60 hover:opacity-100"
                  )}
                >
                  Serif
                </button>
                <button
                  onClick={() => {
                    setFontStyle('sans');
                    toast.success("Fonte limpa digital (Sans-Serif) ativada.");
                  }}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer font-sans leading-none",
                    fontStyle === 'sans' ? "bg-primary-purple text-white shadow-sm" : "opacity-60 hover:opacity-100"
                  )}
                >
                  Sans
                </button>
                <button
                  onClick={() => {
                    setFontStyle('mono');
                    toast.success("Fonte de digitação vintage (Monospace) ativada.");
                  }}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer font-mono leading-none",
                    fontStyle === 'mono' ? "bg-primary-purple text-white shadow-sm" : "opacity-60 hover:opacity-100"
                  )}
                >
                  Type
                </button>
              </div>

              {/* Theme Canvas selector */}
              <div className="flex bg-black/10 p-0.5 rounded-xl border border-black/5">
                {(['ink', 'charcoal', 'sepia', 'paper'] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => {
                      setCanvasTheme(theme);
                      toast.success(`Estilo de fundo definido para: ${theme.toUpperCase()}`);
                    }}
                    className={cn(
                      "w-6 h-6 rounded-lg transition-all cursor-pointer relative flex items-center justify-center border",
                      theme === 'ink' && "bg-[#0b0b0f] border-violet-500/20",
                      theme === 'charcoal' && "bg-[#1f1f2e] border-zinc-600/30",
                      theme === 'sepia' && "bg-[#f4ebd0] border-amber-900/10",
                      theme === 'paper' && "bg-[#faf9f6] border-zinc-300",
                      canvasTheme === theme ? "scale-110 shadow-md ring-1 ring-primary-purple" : "opacity-75 hover:opacity-100 scale-95"
                    )}
                    title={`Tema ${theme}`}
                  >
                    {canvasTheme === theme && (
                      <span className={cn(
                        "w-1 h-1 rounded-full",
                        (theme === 'sepia' || theme === 'paper') ? "bg-amber-950" : "bg-white"
                      )} />
                    )}
                  </button>
                ))}
              </div>

              {/* Undo / Redo */}
              <div className="w-px h-5 bg-current opacity-10 mx-1" />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => editor?.chain().focus().undo().run()}
                title="Desfazer"
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => editor?.chain().focus().redo().run()}
                title="Refazer"
              >
                <Redo className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Find & Replace Action Drawer */}
          {showFindReplace && (
            <div className={cn(
              "border rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-2xl animate-in slide-in-from-top-3 duration-250 select-none",
              (canvasTheme === 'sepia' || canvasTheme === 'paper')
                ? "bg-white/95 border-zinc-200 text-zinc-900 shadow-zinc-300"
                : "bg-[#111118]/95 border-manga-border text-white shadow-black"
            )}>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-black/20 px-3.5 py-2 rounded-xl border border-white/5 w-full sm:w-auto">
                  <span className="text-[9.5px] font-black tracking-wider text-muted-foreground font-mono uppercase">Lupa:</span>
                  <input
                    type="text"
                    value={findText}
                    onChange={(e) => {
                      setFindText(e.target.value);
                      setReplaceCount(null);
                    }}
                    placeholder="Termo para localizar..."
                    className="bg-transparent border-none outline-none text-xs w-full sm:w-44 text-current placeholder-gray-500 font-medium"
                  />
                </div>
                <div className="flex items-center gap-2 bg-black/20 px-3.5 py-2 rounded-xl border border-white/5 w-full sm:w-auto">
                  <span className="text-[9.5px] font-black tracking-wider text-emerald-400 font-mono uppercase">Mudar:</span>
                  <input
                    type="text"
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                    placeholder="Novo texto..."
                    className="bg-transparent border-none outline-none text-xs w-full sm:w-44 text-current placeholder-gray-500 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <Button
                  onClick={handleFindReplaceAll}
                  size="sm"
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold leading-normal px-4 h-9 rounded-xl"
                >
                  Substituir Todos
                </Button>
                <Button
                  onClick={() => {
                    setFindText("");
                    setReplaceText("");
                    setReplaceCount(null);
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-9 text-xs text-muted-foreground hover:text-white rounded-xl"
                >
                  Limpar
                </Button>
              </div>
            </div>
          )}

          {/* Polished Editor Interface Container */}
          <div className={cn(
            "rounded-2xl p-8 lg:p-12 min-h-[600px] border shadow-2xl transition-all duration-300",
            fontStyle === 'serif' && "font-serif tracking-normal text-lg",
            fontStyle === 'sans' && "font-sans tracking-tight text-[15px]",
            fontStyle === 'mono' && "font-mono text-sm",
            
            canvasTheme === 'ink' && "bg-[#0a0a0f]/60 text-gray-200 border-white/5 shadow-black/40",
            canvasTheme === 'charcoal' && "bg-[#15151f]/80 text-gray-100 border-white/5",
            canvasTheme === 'sepia' && "bg-[#f5ebd3] text-amber-950 border-amber-900/15 prose-p:text-amber-950 shadow-inner",
            canvasTheme === 'paper' && "bg-[#faf9f5] text-zinc-900 border-zinc-900/10 shadow-inner"
          )}>
            <EditorContent editor={editor} className="min-h-[550px] cursor-text select-text w-full" />
          </div>

        </div>
      </div>

      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="w-full max-w-md bg-[#0F0F16] border-white/10 p-6 shadow-2xl" showCloseButton={false}>
          <DialogHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-3 mb-4">
            <DialogTitle className="text-sm font-black uppercase tracking-widest text-[#7C3AED] flex items-center gap-2 m-0 p-0">
              <Download className="w-4 h-4" /> Exportar Manuscrito Oficial
            </DialogTitle>
            <button 
              onClick={() => setShowExportModal(false)}
              className="text-gray-400 hover:text-white text-xs font-bold font-mono tracking-widest bg-white/5 px-2.5 py-1 rounded cursor-pointer"
            >
              FECHAR
            </button>
          </DialogHeader>

          <DialogDescription className="text-xs text-gray-400 leading-relaxed mb-6">
            Gere e baixe seu texto atual formatado e empacotado sob demanda. Escolha o formato de saída editorial ideal para sua publicação ou testes locais:
          </DialogDescription>

          <div className="grid grid-cols-1 gap-3 mb-6">
            {[
              { id: 'markdown', title: 'Plain Prose Markdown (.md)', desc: 'Ideal para commits rápidos no GitHub, ler em leitores simples ou backups em texto limpo.', icon: FileText, color: 'text-[#A78BFA]' },
              { id: 'pdf_html', title: 'Imprimir / Layout de Livro (.html)', desc: 'Estruturado com Margens Geográficas e fontes serifadas pronto para impressão física ou PDF dinâmicos.', icon: BookOpen, color: 'text-cyan-400' },
              { id: 'docx_raw', title: 'Microsoft Word Document (.doc)', desc: 'Padrão corporativo e de submissões editoriais com codificação de caracteres integrada.', icon: Target, color: 'text-[#7C3AED]' },
              { id: 'epub_xhtml', title: 'XHTML eBook Container (.epub)', desc: 'Padrão oficial IDPF para publicação direta em aplicativos móveis e eReaders.', icon: Cloud, color: 'text-emerald-400' }
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => handleExportFile(fmt.id as any)}
                className="w-full bg-[#12121A] hover:bg-[#1a1a26] border border-white/5 rounded-xl p-3.5 text-left transition-all hover:scale-[1.01] flex items-start gap-3 group shrink-0 select-none cursor-pointer"
              >
                <div className={cn("p-2 rounded-lg bg-black/40 mt-0.5", fmt.color)}>
                  <fmt.icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-tight group-hover:text-[#A78BFA] transition-colors">{fmt.title}</h4>
                  <p className="text-[10px] text-gray-500 mt-1 leading-normal">{fmt.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="bg-black/30 border border-white/5 p-3 rounded-xl flex gap-2.5 items-center select-none">
            <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-[10px] text-gray-500 leading-normal">Seus textos são empacotados em tempo de execução no próprio navegador. Nenhuma cópia do seu manuscrito vaza para servidores de terceiros.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assistant Sidebar Area */}
      {!isFocusMode && showAssistant && <AssistantSidebar editor={editor} projectId={id} projectTitle={workTitle} activeChapterId={activeChapterId} />}
    </div>
  );
}
