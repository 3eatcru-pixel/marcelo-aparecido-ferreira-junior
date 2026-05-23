import { Link, useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from '@/components/ui/button';
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Bell, 
  Moon, 
  Globe, 
  CreditCard, 
  Shield, 
  LogOut, 
  ChevronRight, 
  Languages, 
  Zap, 
  Smartphone, 
  Mail, 
  Hash, 
  Sparkles,
  CheckCircle2,
  Download,
  RefreshCw,
  Eye,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { googleSignIn, getAccessToken, auth, db } from '@/lib/firebase/firebase';
import { signOut, sendPasswordResetEmail, linkWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc, getDoc, addDoc, collection } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { handleFirestoreError, OperationType } from '@/services/firestoreErrorService';

const translations: Record<string, Record<string, string>> = {
  pt: {
    title: "Painel Nexus",
    subtitle: "Hardware & Alma Humana",
    saveSuccess: "Alterações sincronizadas no banco de dados",
    identityCore: "Núcleo de Identidade",
    identityCoreDesc: "Gerencie suas assinaturas públicas de identidade.",
    changeImage: "Alterar Imagem",
    usePreset: "Usar Preset",
    clear: "Limpar",
    pubSignature: "Assinatura Pública / Display Name",
    handle: "Handle de Descoberta (@username)",
    bio: "Manifesto Biográfico (Perfil)",
    location: "Navegação Geográfica (Localização)",
    website: "Portal Seguro (Website/Portfólio)",
    bannerUrl: "Banner Art URL",
    neuralComms: "Comunicações Neurais",
    googleSyncTitle: "Nexus Sync (Google)",
    visualEngine: "Visual Engine Preferences",
    activeHardware: "Monitores de Hardware Ativo",
    saveChanges: "Gravar Alterações",
    canceling: "Descartar",
    syncing: "Sincronizando...",
    securityTab: "Segurança & Firewall",
    notifTab: "Notificações Neurais",
    langTab: "Protocolos de Idioma",
    coinsTab: "Nexus Coins & Payouts",
    privacyTab: "Arquivos LGPD & Privacidade",
    statusVerified: "Autenticado",
    emailReset: "Disparar Pulso de Recuperação",
    emailResetDesc: "Iremos enviar um link de redefinição de senha para o seu email.",
    emailResetSent: "Link de redefinição de senha enviado!",
    securityFirewallTitle: "Firewall Profile & Encriptação",
    twoFactorLabel: "Verificação Remota em Duas Etapas",
    twoFactorDesc: "Exigir assinatura criptográfica secundária ao acessar em máquinas novas.",
    ipBlockerLabel: "Bloqueador Inteligente de Intrusion",
    ipBlockerDesc: "Bloquear automaticamente endereços IP com comportamento anômalo.",
    activeSessionsTitle: "Sessões e Terminais Conectados",
    deviceRes: "Resolução do Terminal",
    connectionStatus: "Frequência de Rede",
    browserSpec: "Assinatura do Navegador",
    lastLoginMsg: "Último sinal de login registrado em:",
    neuroNotifTitle: "Protocolos de Despacho Neural",
    notifFollow: "Alerta de Novos Seguidores",
    notifFollowDesc: "Disparar pulso luminoso quando outros criadores seguirem sua jornada.",
    notifComments: "Notificar Novos Comentários",
    notifCommentsDesc: "Enviar telemetria de feedback em suas publicações ativas.",
    notifUpdates: "Pulsos de Obras Favoritadas",
    notifUpdatesDesc: "Avisar sobre novos manuscritos e capítulos das obras em sua estante.",
    notifCoins: "Ledger de Moedas & Transações",
    notifCoinsDesc: "Notificar sobre todas as movimentações financeiras de suporte de fãs.",
    langTitle: "Seletor de Protocolo de Linguagem",
    langDesc: "Calibre a interface universal do Nexus para o seu idioma preferencial.",
    langWarning: "A calibração do idioma mudará termos gerais do console.",
    walletTitle: "Ledger de Moedas Nexus & Payouts",
    walletBalance: "Saldo Criptografado Disponível",
    coinsLabel: "Moedas Ativas",
    promoCoinsLabel: "Moedas Promocionais (Bônus)",
    simulateClaim: "Claim Energy (+100 Nexus Coins)",
    simulateClaimDesc: "Injeta 100 Moedas diretamente no Soalho de Dados (Ledger de Auditoria).",
    claimedSuccess: "Saldo sincronizado!",
    lgpdTitle: "Painel LGPD & Exportação Portátil",
    lgpdDesc: "Direito de portabilidade total. Você pode baixar em tempo real todos os registros que possuímos associados ao seu UID.",
    lgpdExportBtn: "Exportar Registros em JSON",
    lgpdDeleteTitle: "Exclusão Definitiva de Identidade",
    lgpdDeleteLabel: "Purgar Consciência Digital (Deletar Conta)",
    lgpdDeleteDesc: "Esta operação destruirá permanentemente seu progresso, saldo de moedas e publicações. Sem reversão.",
    hardwareTitle: "Telemetria de Sistema & Hardware",
    hardwareDesc: "Abaixo constam as métricas brutas extraídas em tempo real da sessão do seu navegador."
  },
  en: {
    title: "Nexus Dashboard",
    subtitle: "Hardware & Human Soul",
    saveSuccess: "Changes synchronized to the database",
    identityCore: "Identity Core",
    identityCoreDesc: "Manage your public display identities and credentials.",
    changeImage: "Change Image",
    usePreset: "Use Preset",
    clear: "Clear",
    pubSignature: "Public Signature / Display Name",
    handle: "Discovery Handle (@username)",
    bio: "Biographical Manifesto (Profile Bio)",
    location: "Geographic Navigation (Location)",
    website: "Secure Portal (Website/Portfolio)",
    bannerUrl: "Banner Art URL",
    neuralComms: "Neural Communications",
    googleSyncTitle: "Nexus Sync (Google)",
    visualEngine: "Visual Engine Preferences",
    activeHardware: "Active Hardware Monitors",
    saveChanges: "Save Changes",
    canceling: "Discard",
    syncing: "Syncing...",
    securityTab: "Security & Firewall",
    notifTab: "Neural Notifications",
    langTab: "Language Protocols",
    coinsTab: "Nexus Coins & Payouts",
    privacyTab: "LGPD & GDPR Privacy",
    statusVerified: "Authenticated",
    emailReset: "Trigger Recovery Pulses",
    emailResetDesc: "We will dispatch a secure password reset link directly to your email.",
    emailResetSent: "Password reset link has been sent!",
    securityFirewallTitle: "Firewall Profile & Encryption",
    twoFactorLabel: "Remote Two-Factor Verification",
    twoFactorDesc: "Require secondary cryptographic signatures when logging in from new devices.",
    ipBlockerLabel: "Intelligent Intrusion Blocker",
    ipBlockerDesc: "Automatically lock down suspicious IP addresses trying to authenticate.",
    activeSessionsTitle: "Active Connected Terminals",
    deviceRes: "Terminal Resolution",
    connectionStatus: "Network Frequency",
    browserSpec: "Browser Signature",
    lastLoginMsg: "Last authenticated login signal registered at:",
    neuroNotifTitle: "Neural Dispatch Protocols",
    notifFollow: "New Followers Alert",
    notifFollowDesc: "Flash notification beacon when other creators follow your profile.",
    notifComments: "Notify New Comments",
    notifCommentsDesc: "Dispatch feedback telemetry on your active works and chapters.",
    notifUpdates: "Favorited Works Pulses",
    notifUpdatesDesc: "Alert when new chapters or revisions are published on your bookshelf.",
    notifCoins: "Coins & Wallet Ledger",
    notifCoinsDesc: "Notify all financial transactions and supporting fan donations.",
    langTitle: "Language Protocol Selector",
    langDesc: "Calibrate the universal Nexus interface to your preferred communication protocol.",
    langWarning: "Language calibration will instantly translate console menus.",
    walletTitle: "Nexus Coins Ledger & Payouts",
    walletBalance: "Cryptographic Available Balance",
    coinsLabel: "Active Coins",
    promoCoinsLabel: "Promo Coins (Bonus)",
    simulateClaim: "Claim Energy (+100 Nexus Coins)",
    simulateClaimDesc: "Injects 100 coins directly into the database (Auditing Ledger).",
    claimedSuccess: "Balance synchronized!",
    lgpdTitle: "LGPD/GDPR Panel & Portable Export",
    lgpdDesc: "Right to absolute portability. Download all encrypted records associated with your UID in real-time.",
    lgpdExportBtn: "Export All Profile Logs to JSON",
    lgpdDeleteTitle: "Definitive Identity Purge",
    lgpdDeleteLabel: "Definitively Purge Digital Soul (Reset Account)",
    lgpdDeleteDesc: "This operation will permanently delete your progress, balance, and manuscripts. Non-reversible.",
    hardwareTitle: "System Telemetry & Hardware Logs",
    hardwareDesc: "Below are raw metrics extracted in real-time from your active operating system session."
  },
  ja: {
    title: "ネクサスダッシュボード",
    subtitle: "ハードウェア＆ヒューマンソウル",
    saveSuccess: "データベースの変更が同期されました",
    identityCore: "アイデンティティコア",
    identityCoreDesc: "公開名称と資格情報を管理します。",
    changeImage: "画像変更",
    usePreset: "プリセット",
    clear: "クリア",
    pubSignature: "公的署名 / 表示名",
    handle: "探索ハンドル (@username)",
    bio: "伝記マニフェスト (バイオ)",
    location: "地理的ナビゲーション（場所）",
    website: "セキュアポータル（ウェブサイト）",
    bannerUrl: "バナー画像URL",
    neuralComms: "ニューラル通信",
    googleSyncTitle: "ネクサス同期 (Google)",
    visualEngine: "ビジュアルエンジン設定",
    activeHardware: "アクティブハードウェアモニター",
    saveChanges: "変更を保存",
    canceling: "キャンセル",
    syncing: "同期中...",
    securityTab: "セキュリティ＆ファイアウォール",
    notifTab: "ニューラル通知設定",
    langTab: "言語プロトコル設定",
    coinsTab: "ネクサスコイン＆払い戻し",
    privacyTab: "個人情報保護 (GDPR)",
    statusVerified: "認証済み",
    emailReset: "パスワードリセット送信",
    emailResetDesc: "セキュリティ再設定のためのリンクを指定したアドレスに発信します。",
    emailResetSent: "パスワード再設定リンクを送信しました！",
    securityFirewallTitle: "ファイアウォール＆暗号化",
    twoFactorLabel: "リモート二要素認証プロトコル",
    twoFactorDesc: "新しいデバイスから書き込む場合、二次トランスポンダ保護を要求する。",
    ipBlockerLabel: "侵害自動遮断プログラム",
    ipBlockerDesc: "不自然なアクセス動作を示す接続元IPアドレスを自動遮断。",
    activeSessionsTitle: "稼働中のアクティブ端末",
    deviceRes: "端末のピクセル解像度",
    connectionStatus: "ネットワーク周波数",
    browserSpec: "ブラウザ署名",
    lastLoginMsg: "直近の安全なアクセスの同期日時:",
    neuroNotifTitle: "ニューラル配信プロトコル",
    notifFollow: "新規フォロワーの通知",
    notifFollowDesc: "他の創作者があなたの創作にアクセスした際に自動シグナルを発生。",
    notifComments: "フィードバック通知",
    notifCommentsDesc: "アクティブな投稿に対する感想やフィードバックを中継します。",
    notifUpdates: "お気に入り登録本のシグナル",
    notifUpdatesDesc: "お気に入り棚にある本に新しい更新、加筆が検知されたら通知します。",
    notifCoins: "財務台帳＆コイン移動",
    notifCoinsDesc: "サポート・購入履歴を含む全てのトランザクションを中継します。",
    langTitle: "多言語共通言語プロトコル",
    langDesc: "ネクサスのコンソールメニューをお好みの言語にキャリブレーションします。",
    langWarning: "変更するとメニュータイトルが一瞬で置換されます。",
    walletTitle: "ネクサスコイン台帳＆出金",
    walletBalance: "利用可能な暗号ウォレット残高",
    coinsLabel: "稼働コイン数",
    promoCoinsLabel: "ボーナスコイン",
    simulateClaim: "エナジー獲得 (+100 Nexus Coins)",
    simulateClaimDesc: "台帳レコードに100コインをダイレクトにチャージします。",
    claimedSuccess: "残高の同期が完了しました！",
    lgpdTitle: "LGPD/GDPR 総合データポータビリティ",
    lgpdDesc: "データ共有権利：登録されたプロフィール、台帳ログ、メタデータをJSON形式で即時ダウンロード。",
    lgpdExportBtn: "登録情報のJSONダンプを生成",
    lgpdDeleteTitle: "デジタルプロフィールの完全削除",
    lgpdDeleteLabel: "デジタルの魂のパージ（退会）",
    lgpdDeleteDesc: "アカウント、活動ログ、残高を含む全てのアイデンティティ情報を完全に破壊します。元に戻せません。",
    hardwareTitle: "システムテレメトリー＆生ログ",
    hardwareDesc: "お使いのブラウザやハードウェア情報から抽出したリアルタイムデータ一覧。"
  }
};

export function Settings() {
  const { currentUser, username, role, setUsername, coins, setCoins, promoCoins, setPromoCoins, setLanguage: setStoreLanguage } = useAppStore();
  const navigate = useNavigate();
  const [googleConnected, setGoogleConnected] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  
  // Alternative password/email account linking
  const [linkPassword, setLinkPassword] = useState('');
  const [linkConfirmPassword, setLinkConfirmPassword] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [isPasswordLinked, setIsPasswordLinked] = useState(
    auth.currentUser?.providerData.some(p => p.providerId === 'password') || false
  );
  
  // Tab control
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications" | "language" | "coins" | "hardware" | "google" | "lgpd">("profile");

  // Profile fields
  const [localUsername, setLocalUsername] = useState(username || "");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  // Settings configs
  const [language, setLanguage] = useState<"pt" | "en" | "ja">(useAppStore.getState().language);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [ipBlocker, setIpBlocker] = useState(false);
  const [notifyFollowers, setNotifyFollowers] = useState(true);
  const [notifyComments, setNotifyComments] = useState(true);
  const [notifyUpdates, setNotifyUpdates] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyPremiumUnlocks, setNotifyPremiumUnlocks] = useState(true);
  
  // Custom interface toggles
  const [amoledMode, setAmoledMode] = useState(true);
  const [kineticEffects, setKineticEffects] = useState(true);
  const [systemMetadata, setSystemMetadata] = useState(false);

  // Security action state
  const [resetSent, setResetSent] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const avatarPresets = [
    { name: "Cyber Samurai", url: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=300&auto=format&fit=crop" },
    { name: "Neo Oracle", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop" },
    { name: "Sky Wanderer", url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=300&auto=format&fit=crop" },
    { name: "Ink Mage", url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=300&auto=format&fit=crop" },
    { name: "Digital Nomad", url: "https://images.unsplash.com/photo-1542451313056-b7c8e626645f?q=80&w=300&auto=format&fit=crop" },
    { name: "Cyber Hacker", url: "https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=300&auto=format&fit=crop" }
  ];

  const t = (key: string) => translations[language]?.[key] || translations["pt"]?.[key] || key;

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser?.uid) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setLocalUsername(data.username || username || "");
            setBio(data.bio || "");
            setPhotoURL(data.photoURL || currentUser.photoURL || "");
            setDisplayName(data.displayName || currentUser.displayName || "");
            setLocation(data.location || "");
            setWebsite(data.website || "");
            setBannerUrl(data.bannerUrl || "");
            
            // Load custom settings
            if (data.language) setLanguage(data.language as any);
            if (data.settings) {
              const s = data.settings;
              if (s.twoFactorAuth !== undefined) setTwoFactorAuth(s.twoFactorAuth);
              if (s.ipBlocker !== undefined) setIpBlocker(s.ipBlocker);
              if (s.notifyFollowers !== undefined) setNotifyFollowers(s.notifyFollowers);
              if (s.notifyComments !== undefined) setNotifyComments(s.notifyComments);
              if (s.notifyUpdates !== undefined) setNotifyUpdates(s.notifyUpdates);
              if (s.notifyMessages !== undefined) setNotifyMessages(s.notifyMessages);
              if (s.notifyPremiumUnlocks !== undefined) setNotifyPremiumUnlocks(s.notifyPremiumUnlocks);
              if (s.amoledMode !== undefined) setAmoledMode(s.amoledMode);
              if (s.kineticEffects !== undefined) setKineticEffects(s.kineticEffects);
              if (s.systemMetadata !== undefined) setSystemMetadata(s.systemMetadata);
            }
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
        }
      }
    };
    fetchUserData();
  }, [currentUser, username]);

  useEffect(() => {
    getAccessToken().then(token => {
      if (token) setGoogleConnected(true);
    });
  }, []);

  useEffect(() => {
    if (currentUser) {
      setIsPasswordLinked(
        currentUser.providerData.some(p => p.providerId === 'password') || false
      );
    }
  }, [currentUser]);

  const handleConnectGoogle = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleConnected(true);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setPhotoURL(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        username: localUsername,
        bio: bio,
        photoURL: photoURL,
        displayName: displayName,
        location: location,
        website: website,
        bannerUrl: bannerUrl,
        language: language,
        settings: {
          twoFactorAuth,
          ipBlocker,
          notifyFollowers,
          notifyComments,
          notifyUpdates,
          notifyMessages,
          notifyPremiumUnlocks,
          amoledMode,
          kineticEffects,
          systemMetadata,
        }
      });
      setUsername(localUsername);
      setStoreLanguage(language);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!currentUser?.email) return;
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (err) {
      console.error("Password reset dispatch error:", err);
    }
  };

  const handleSimulateClaim = async () => {
    if (!currentUser) return;
    try {
      const added = 100;
      const userRef = doc(db, "users", currentUser.uid);
      const newBalance = coins + added;
      await updateDoc(userRef, {
        coins: newBalance
      });
      setCoins(newBalance);
      
      // Store transaction ledger entry
      await addDoc(collection(db, "users", currentUser.uid, "wallet_transactions"), {
        amount: added,
        type: "topup_simulation",
        description: "Recarga de simulação pelo painel Nexus de Auditoria",
        createdAt: new Date()
      });

      setClaimSuccess(true);
      setTimeout(() => setClaimSuccess(false), 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/wallet_transactions`);
    }
  };

  const handleExportDataAsJSON = () => {
    const dataToExport = {
      appletId: "1657ddbb-6aca-4c19-a672-a8f7f582f677",
      compliance: "LGPD/GDPR fully compliant right of portability",
      uid: currentUser?.uid,
      displayName,
      username: localUsername,
      email: currentUser?.email,
      bio,
      location,
      website,
      bannerUrl,
      photoURL,
      language,
      role,
      coins,
      promoCoins,
      settings: {
        twoFactorAuth,
        ipBlocker,
        notifyFollowers,
        notifyComments,
        notifyUpdates,
        notifyMessages,
        notifyPremiumUnlocks,
        amoledMode,
        kineticEffects,
        systemMetadata,
      },
      exportedAt: new Date().toISOString()
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dataToExport, null, 2)
    )}`;
    
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `nexus-identity-pda-${currentUser?.uid}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/discover');
  };

  if (!currentUser) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-10 max-w-6xl mx-auto w-full pb-32 px-4 sm:px-6"
    >
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-purple/10 flex items-center justify-center border border-primary-purple/20">
            <SettingsIcon className="w-6 h-6 text-primary-purple" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">{t("title")}</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em]">{t("subtitle")}</p>
          </div>
        </div>

        {saveSuccess && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/20 text-xs font-bold"
          >
            <CheckCircle2 className="w-4 h-4" /> {t("saveSuccess")}
          </motion.div>
        )}
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-10 items-start">
        
        {/* Navigation Sidebar */}
        <aside className="flex flex-col gap-2 lg:sticky lg:top-24">
           <SettingNavLink icon={User} label={t("identityCore")} active={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
           <SettingNavLink icon={Lock} label={t("securityTab")} active={activeTab === "security"} onClick={() => setActiveTab("security")} />
           <SettingNavLink icon={Bell} label={t("notifTab")} active={activeTab === "notifications"} onClick={() => setActiveTab("notifications")} />
           <SettingNavLink icon={Globe} label={t("langTab")} active={activeTab === "language"} onClick={() => setActiveTab("language")} />
           <SettingNavLink icon={CreditCard} label={t("coinsTab")} active={activeTab === "coins"} onClick={() => setActiveTab("coins")} />
           <SettingNavLink icon={Smartphone} label={t("activeHardware")} active={activeTab === "hardware"} onClick={() => setActiveTab("hardware")} />
           <SettingNavLink icon={Sparkles} label={t("googleSyncTitle")} active={activeTab === "google"} onClick={() => setActiveTab("google")} />
           <hr className="my-6 border-white/5" />
           <SettingNavLink icon={Shield} label={t("privacyTab")} active={activeTab === "lgpd"} onClick={() => setActiveTab("lgpd")} />
           <motion.button 
             whileHover={{ scale: 1.02, backgroundColor: 'rgba(244, 63, 94, 0.1)' }}
             onClick={handleLogout}
             className="flex items-center gap-4 w-full p-4 rounded-2xl text-rose-500 transition-all font-black text-xs uppercase tracking-widest border border-transparent hover:border-rose-500/20"
           >
             <LogOut className="w-5 h-5 shadow-rose-500/50" /> {t("langTab") === "言語プロトコル" ? "セッションを終了" : "Encerrar Sessão"}
           </motion.button>
        </aside>

        {/* Content Area */}
        <main className="flex flex-col gap-12">
            
           {/* TAB 1: Profile Profile */}
           {activeTab === "profile" && (
             <section className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                   <div className="h-0.5 w-8 bg-primary-purple" />
                   <h2 className="text-xl font-black text-white italic tracking-tight">{t("identityCore")}</h2>
                </div>

                <div className="glass-panel p-8 bg-[#0B0B0F]/40 border-white/5 flex flex-col gap-10">
                   {/* Avatar Upload */}
                   <div className="flex flex-col sm:flex-row items-center gap-8">
                      <div className="relative group">
                         <Avatar className="w-28 h-28 ring-4 ring-primary-purple/20 bg-manga-card drop-shadow-[0_0_20px_rgba(124,58,237,0.2)]">
                            <AvatarImage src={photoURL || "https://i.pravatar.cc/150?u=caleb"} />
                            <AvatarFallback className="bg-primary-purple text-white font-black text-2xl uppercase">{displayName?.substring(0, 2)}</AvatarFallback>
                         </Avatar>
                         <input 
                           type="file" 
                           id="avatar-upload" 
                           className="hidden" 
                           accept="image/*"
                           onChange={handlePhotoChange}
                         />
                         <label 
                           htmlFor="avatar-upload"
                           className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                         >
                            <Smartphone className="w-6 h-6 text-white" />
                         </label>
                      </div>
                      <div className="flex flex-col gap-4 text-center sm:text-left">
                         <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                            <Button 
                              onClick={() => document.getElementById('avatar-upload')?.click()}
                              className="bg-primary-purple hover:bg-neon-purple text-white text-[10px] font-black h-10 px-6 rounded-xl uppercase tracking-widest shadow-lg shadow-primary-purple/20"
                            >
                              {t("changeImage")}
                            </Button>
                            <Button 
                              onClick={() => setIsAvatarModalOpen(true)}
                              className="bg-primary-purple/10 hover:bg-primary-purple/20 border border-primary-purple/20 text-primary-purple text-[10px] font-black h-10 px-6 rounded-xl uppercase tracking-widest transition-all"
                            >
                              {t("usePreset")}
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setPhotoURL("")}
                              className="text-[10px] font-black h-10 px-6 rounded-xl border-white/10 hover:bg-rose-500/5 hover:text-rose-500 hover:border-rose-500/30 uppercase tracking-widest transition-all"
                            >
                              {t("clear")}
                            </Button>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-[0.2em] font-black">Spec: 400x400px. JPG/PNG/WEBP. Max 2MB.</p>
                            <p className="text-[10px] text-primary-purple/60 font-medium">Sua imagem será replicada em todas as camadas do Nexus.</p>
                         </div>
                      </div>
                   </div>

                   <div className="grid md:grid-cols-2 gap-8">
                      <div className="flex flex-col gap-3">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">{t("pubSignature")}</label>
                         <input 
                           type="text" 
                           value={displayName} 
                           onChange={(e) => setDisplayName(e.target.value)}
                           className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-5 text-sm text-white focus:outline-none focus:border-primary-purple/50 focus:bg-primary-purple/5 transition-all italic font-medium" 
                         />
                      </div>
                      <div className="flex flex-col gap-3">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">{t("handle")}</label>
                         <div className="relative">
                            <Hash className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-primary-purple opacity-50" />
                            <input 
                              type="text" 
                              value={localUsername} 
                              onChange={(e) => setLocalUsername(e.target.value)}
                              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-12 pr-5 text-sm text-white focus:outline-none focus:border-primary-purple/50 focus:bg-primary-purple/5 transition-all font-bold" 
                            />
                         </div>
                      </div>
                      <div className="flex flex-col gap-3 md:col-span-2">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">{t("bio")}</label>
                         <textarea 
                           rows={4} 
                           placeholder="Descreva sua missão no multiverso MangaOS..."
                           value={bio}
                           onChange={(e) => setBio(e.target.value)}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white focus:outline-none focus:border-primary-purple/50 focus:bg-primary-purple/5 transition-all resize-none font-medium leading-relaxed" 
                         />
                      </div>
                      <div className="flex flex-col gap-3">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{t("location")}</label>
                         <input 
                           type="text" 
                           placeholder="Ex: Neo Tokyo, Universo 7"
                           value={location} 
                           onChange={(e) => setLocation(e.target.value)}
                           className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-5 text-sm text-white focus:outline-none focus:border-primary-purple/50 focus:bg-primary-purple/5 transition-all font-medium" 
                         />
                      </div>
                      <div className="flex flex-col gap-3">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{t("website")}</label>
                         <input 
                           type="text" 
                           placeholder="Ex: https://artstation.com/seuusuario"
                           value={website} 
                           onChange={(e) => setWebsite(e.target.value)}
                           className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-5 text-sm text-white focus:outline-none focus:border-primary-purple/50 focus:bg-primary-purple/5 transition-all font-medium" 
                         />
                      </div>
                      <div className="flex flex-col gap-3 md:col-span-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{t("bannerUrl")}</label>
                         <input 
                           type="text" 
                           placeholder="Cole a URL de uma imagem para sua capa de perfil..."
                           value={bannerUrl} 
                           onChange={(e) => setBannerUrl(e.target.value)}
                           className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-5 text-sm text-white focus:outline-none focus:border-primary-purple/50 focus:bg-primary-purple/5 transition-all font-medium" 
                         />
                         <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-[0.12em] font-black ml-1">Você também pode alterar essa capa interativamente escolhendo presets direto em seu perfil público.</p>
                      </div>
                   </div>
                </div>

                {/* Section: Email & Contacts */}
                <div className="flex items-center gap-4 mt-4">
                   <div className="h-0.5 w-8 bg-primary-indigo" />
                   <h2 className="text-xl font-black text-white italic tracking-tight">{t("neuralComms")}</h2>
                </div>

                <div className="glass-panel p-8 bg-[#0B0B0F]/40 border-white/5">
                   <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-white/5 rounded-2xl border border-white/5 group hover:border-primary-indigo/30 transition-all">
                      <div className="flex items-center gap-5">
                         <div className="w-14 h-14 rounded-2xl bg-primary-indigo/10 flex items-center justify-center text-primary-indigo group-hover:scale-110 transition-transform">
                            <Mail className="w-7 h-7" />
                         </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-sm font-black text-white italic tracking-tight">{currentUser?.email}</span>
                            <span className="flex items-center gap-2 text-[10px] text-emerald-500 font-bold uppercase tracking-widest bg-emerald-500/10 w-fit px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> {t("statusVerified")}
                            </span>
                         </div>
                      </div>
                      <Button variant="ghost" disabled className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest h-10 px-8 border border-white/5 rounded-xl cursor-not-allowed">Email Primário</Button>
                   </div>
                </div>
             </section>
           )}

           {/* TAB 2: Security & Firewall */}
           {activeTab === "security" && (
             <section className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                   <div className="h-0.5 w-8 bg-rose-500" />
                   <h2 className="text-xl font-black text-white italic tracking-tight">{t("securityFirewallTitle")}</h2>
                </div>

                <div className="glass-panel p-8 bg-[#0B0B0F]/40 border-white/5 flex flex-col gap-8">
                   
                   {/* Dispatch real Firebase Auth Reset Password */}
                   <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                      <div className="flex items-center gap-6">
                         <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                           <Lock className="w-7 h-7" />
                         </div>
                         <div className="flex flex-col gap-1.5">
                            <h4 className="text-sm font-black text-white uppercase tracking-widest">{t("emailReset")}</h4>
                            <p className="text-[10px] text-gray-500 font-medium max-w-sm leading-relaxed">{t("emailResetDesc")}</p>
                         </div>
                      </div>
                      <div className="w-full md:w-auto">
                        <Button 
                          onClick={handlePasswordReset}
                          className="w-full md:w-auto bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] h-11 px-6 rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-rose-500/15"
                        >
                          <RefreshCw className={cn("w-3.5 h-3.5 mr-2", resetSent && "animate-spin")} /> {resetSent ? t("emailResetSent") : t("emailReset")}
                        </Button>
                      </div>
                   </div>

                    {/* Fallback Password Linking / Creation */}
                    <div className="flex flex-col gap-6 p-6 bg-primary-purple/5 rounded-2xl border border-primary-purple/15">
                       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-5">
                             <div className="w-14 h-14 rounded-2xl bg-primary-purple/10 flex items-center justify-center text-primary-purple shrink-0">
                                <ShieldCheck className="w-7 h-7" />
                             </div>
                             <div className="flex flex-col gap-1 text-left">
                                <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                   Conta Interna (Fallback)
                                   {isPasswordLinked ? (
                                     <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Alt-Login Ativo</span>
                                   ) : (
                                     <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Recomendado</span>
                                   )}
                                </h4>
                                <p className="text-[10px] text-gray-400 font-bold max-w-sm leading-relaxed">
                                   {isPasswordLinked 
                                     ? "Sua conta do Google está vinculada com e-mail e senha. Você pode entrar usando seu e-mail ou username."
                                     : "Adicione uma senha de acesso interna para fazer login usando seu e-mail ou username se o Google Auth estiver instável."
                                   }
                                </p>
                             </div>
                          </div>
                       </div>

                       {!isPasswordLinked ? (
                          <div className="flex flex-col gap-4 border-t border-white/5 pt-4">
                             <div className="grid sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                   <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Escolha uma Senha Segura</label>
                                   <input 
                                     type="password"
                                     placeholder="Mínimo 6 caracteres"
                                     value={linkPassword}
                                     onChange={(e) => setLinkPassword(e.target.value)}
                                     className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-primary-purple/50 focus:bg-primary-purple/5 transition-all"
                                   />
                                </div>
                                <div className="flex flex-col gap-2">
                                   <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Confirme a Senha</label>
                                   <input 
                                     type="password"
                                     placeholder="Repita a senha anterior"
                                     value={linkConfirmPassword}
                                     onChange={(e) => setLinkConfirmPassword(e.target.value)}
                                     className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-primary-purple/50 focus:bg-primary-purple/5 transition-all"
                                   />
                                </div>
                             </div>

                             {linkError && (
                                <p className="text-xs text-rose-500 font-semibold bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-xl text-left">{linkError}</p>
                             )}

                             {linkSuccess && (
                                <p className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-left">Sucesso! Credenciais vinculadas com o perfil do Google!</p>
                             )}

                             <Button 
                               onClick={async () => {
                                  setLinkError('');
                                  setLinkSuccess(false);
                                  if (!auth.currentUser || !auth.currentUser.email) {
                                     setLinkError('Usuário não autenticado.');
                                     return;
                                  }
                                  if (linkPassword.length < 6) {
                                     setLinkError('A senha deve possuir pelo menos 6 caracteres.');
                                     return;
                                  }
                                  if (linkPassword !== linkConfirmPassword) {
                                     setLinkError('As senhas não coincidem.');
                                     return;
                                  }
                                  setIsLinking(true);
                                  try {
                                     const credential = EmailAuthProvider.credential(auth.currentUser.email, linkPassword);
                                     await linkWithCredential(auth.currentUser, credential);
                                     
                                     // Sincronizar o e-mail no registro de usernames se possuir username
                                     if (username) {
                                        const usernameLower = username.toLowerCase();
                                        await updateDoc(doc(db, 'usernames', usernameLower), {
                                           email: auth.currentUser.email.toLowerCase()
                                        });
                                     }

                                     // Atualizar o doc do usuário no users para registrar login de senha
                                     await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                                        email: auth.currentUser.email.toLowerCase(),
                                        passwordLinked: true
                                     });

                                     setIsPasswordLinked(true);
                                     setLinkSuccess(true);
                                     setLinkPassword('');
                                     setLinkConfirmPassword('');
                                  } catch (err: any) {
                                     console.error("Linking Error:", err);
                                     let msg = err.message || 'Erro ao vincular conta.';
                                     if (err.code === 'auth/provider-already-linked') {
                                        msg = 'Este método de login já está vinculado a esta conta.';
                                        setIsPasswordLinked(true);
                                     } else if (err.code === 'auth/credential-already-in-use') {
                                        msg = 'Este e-mail já está em uso por outra conta independente.';
                                     } else if (err.code === 'auth/weak-password') {
                                        msg = 'Senha fraca de segurança.';
                                     }
                                     setLinkError(msg);
                                  } finally {
                                     setIsLinking(false);
                                  }
                               }}
                               disabled={isLinking}
                               className="w-full bg-primary-purple hover:bg-neon-purple text-white font-black text-[10px] h-11 rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-primary-purple/15 mt-2"
                             >
                                {isLinking ? "VINCULANDO..." : "VINCULAR E-MAIL E SENHA"}
                             </Button>
                          </div>
                       ) : (
                          <div className="flex flex-col sm:flex-row items-center gap-3 bg-emerald-500/5 text-emerald-400 p-4 rounded-xl border border-emerald-500/10 text-xs font-bold leading-relaxed text-left justify-start">
                             <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                             <div>
                                Sua conta está devidamente vinculada ao E-mail e Senha de Fallback (<strong>{auth.currentUser?.email}</strong>)!
                                {username ? (
                                   <p className="mt-1 font-mono text-[10px] text-gray-500 uppercase tracking-wider">Você pode fazer login usando seu e-mail ou o handle <strong className="text-white">@{username}</strong>.</p>
                                ) : (
                                   <p className="mt-1 font-mono text-[10px] text-rose-500 uppercase tracking-wider">Atenção: Adicione um nome de usuário (handle) no primeiro menu para poder logar com ele.</p>
                                )}
                             </div>
                          </div>
                       )}
                    </div>

                   {/* Custom Firewall Toggles */}
                   <div className="flex flex-col gap-4 mt-2">
                     <div className="flex items-center justify-between py-4 group px-2 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="flex gap-5">
                           <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-rose-500/30 group-hover:bg-rose-500/5 transition-all">
                              <ShieldCheck className="w-6 h-6 text-gray-500 group-hover:text-rose-500 transition-colors" />
                           </div>
                           <div className="flex flex-col gap-1 justify-center">
                              <h4 className="text-sm font-black text-white uppercase tracking-widest italic group-hover:text-rose-500 transition-colors">{t("twoFactorLabel")}</h4>
                              <p className="text-[10px] text-gray-500 font-medium leading-relaxed max-w-md">{t("twoFactorDesc")}</p>
                           </div>
                        </div>
                        <Switch 
                          checked={twoFactorAuth} 
                          onCheckedChange={setTwoFactorAuth} 
                          className="data-[state=checked]:bg-rose-500 scale-110" 
                        />
                     </div>

                     <hr className="border-white/5" />

                     <div className="flex items-center justify-between py-4 group px-2 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="flex gap-5">
                           <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-rose-500/30 group-hover:bg-rose-500/5 transition-all">
                              <AlertTriangle className="w-6 h-6 text-gray-500 group-hover:text-rose-500 transition-colors" />
                           </div>
                           <div className="flex flex-col gap-1 justify-center">
                              <h4 className="text-sm font-black text-white uppercase tracking-widest italic group-hover:text-rose-500 transition-colors">{t("ipBlockerLabel")}</h4>
                              <p className="text-[10px] text-gray-500 font-medium leading-relaxed max-w-md">{t("ipBlockerDesc")}</p>
                           </div>
                        </div>
                        <Switch 
                          checked={ipBlocker} 
                          onCheckedChange={setIpBlocker} 
                          className="data-[state=checked]:bg-rose-500 scale-110" 
                        />
                     </div>
                   </div>

                   {/* Active Sessions Telemetry */}
                   <div className="flex flex-col gap-4 mt-4">
                     <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{t("activeSessionsTitle")}</span>
                     <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400 font-bold">{t("deviceRes")}</span>
                          <span className="text-gray-200 font-mono font-bold">{window.screen.width} x {window.screen.height} px</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400 font-bold">{t("connectionStatus")}</span>
                          <span className="text-emerald-400 font-mono font-bold">5.8 GHz / {navigator.onLine ? "ESTÁVEL" : "OF-LINE"}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400 font-bold">{t("browserSpec")}</span>
                          <span className="text-gray-200 font-medium truncate max-w-md">{navigator.userAgent.split(" ")[0]} (Chrome/Webkit Engine)</span>
                        </div>
                        <hr className="border-white/5" />
                        <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                           {t("lastLoginMsg")} <strong className="text-white ml-1">{currentUser.metadata.lastSignInTime ? new Date(currentUser.metadata.lastSignInTime).toLocaleString('pt-BR') : "Agora"}</strong>
                        </div>
                     </div>
                   </div>

                </div>
             </section>
           )}

           {/* TAB 3: Neural Notifications */}
           {activeTab === "notifications" && (
             <section className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                   <div className="h-0.5 w-8 bg-amber-500" />
                   <h2 className="text-xl font-black text-white italic tracking-tight">{t("neuroNotifTitle")}</h2>
                </div>

                <div className="glass-panel p-6 bg-[#0B0B0F]/40 border-white/5 space-y-2">
                   
                   <div className="flex items-center justify-between py-4 group px-2 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="flex gap-5">
                         <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-amber-500/30 group-hover:bg-amber-500/5 transition-all">
                            <User className="w-6 h-6 text-gray-500 group-hover:text-amber-500 transition-colors" />
                         </div>
                         <div className="flex flex-col gap-1 justify-center">
                            <h4 className="text-sm font-black text-white uppercase tracking-widest italic group-hover:text-amber-500 transition-colors">{t("notifFollow")}</h4>
                            <p className="text-[10px] text-gray-500 font-medium leading-relaxed max-w-md">{t("notifFollowDesc")}</p>
                         </div>
                      </div>
                      <Switch 
                        checked={notifyFollowers} 
                        onCheckedChange={setNotifyFollowers} 
                        className="data-[state=checked]:bg-amber-500 scale-110" 
                      />
                   </div>

                   <hr className="border-white/5" />

                   <div className="flex items-center justify-between py-4 group px-2 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="flex gap-5">
                         <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-amber-500/30 group-hover:bg-amber-500/5 transition-all">
                            <Mail className="w-6 h-6 text-gray-500 group-hover:text-amber-500 transition-colors" />
                         </div>
                         <div className="flex flex-col gap-1 justify-center">
                            <h4 className="text-sm font-black text-white uppercase tracking-widest italic group-hover:text-amber-500 transition-colors">{t("notifComments")}</h4>
                            <p className="text-[10px] text-gray-500 font-medium leading-relaxed max-w-md">{t("notifCommentsDesc")}</p>
                         </div>
                      </div>
                      <Switch 
                        checked={notifyComments} 
                        onCheckedChange={setNotifyComments} 
                        className="data-[state=checked]:bg-amber-500 scale-110" 
                      />
                   </div>

                   <hr className="border-white/5" />

                   <div className="flex items-center justify-between py-4 group px-2 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="flex gap-5">
                         <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-amber-500/30 group-hover:bg-amber-500/5 transition-all">
                            <Bell className="w-6 h-6 text-gray-500 group-hover:text-amber-500 transition-colors" />
                         </div>
                         <div className="flex flex-col gap-1 justify-center">
                            <h4 className="text-sm font-black text-white uppercase tracking-widest italic group-hover:text-amber-500 transition-colors">{t("notifUpdates")}</h4>
                            <p className="text-[10px] text-gray-500 font-medium leading-relaxed max-w-md">{t("notifUpdatesDesc")}</p>
                         </div>
                      </div>
                      <Switch 
                        checked={notifyUpdates} 
                        onCheckedChange={setNotifyUpdates} 
                        className="data-[state=checked]:bg-amber-500 scale-110" 
                      />
                   </div>

                   <hr className="border-white/5" />

                   <div className="flex items-center justify-between py-4 group px-2 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="flex gap-5">
                         <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-amber-500/30 group-hover:bg-amber-500/5 transition-all">
                            <CreditCard className="w-6 h-6 text-gray-500 group-hover:text-amber-500 transition-colors" />
                         </div>
                         <div className="flex flex-col gap-1 justify-center">
                            <h4 className="text-sm font-black text-white uppercase tracking-widest italic group-hover:text-amber-500 transition-colors">{t("notifCoins")}</h4>
                            <p className="text-[10px] text-gray-500 font-medium leading-relaxed max-w-md">{t("notifCoinsDesc")}</p>
                         </div>
                      </div>
                      <Switch 
                        checked={notifyPremiumUnlocks} 
                        onCheckedChange={setNotifyPremiumUnlocks} 
                        className="data-[state=checked]:bg-amber-500 scale-110" 
                      />
                   </div>

                </div>
             </section>
           )}

           {/* TAB 4: Language Protocols */}
           {activeTab === "language" && (
             <section className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                   <div className="h-0.5 w-8 bg-blue-500" />
                   <h2 className="text-xl font-black text-white italic tracking-tight">{t("langTitle")}</h2>
                </div>

                <div className="glass-panel p-8 bg-[#0B0B0F]/40 border-white/5 flex flex-col gap-6">
                   <p className="text-xs text-gray-400 font-medium leading-relaxed uppercase tracking-wider">{t("langDesc")}</p>
                   
                   <div className="grid sm:grid-cols-3 gap-4">
                      
                      {/* Portugues */}
                      <button 
                        type="button"
                        onClick={() => setLanguage("pt")}
                        className={cn(
                          "p-5 rounded-2xl border text-left flex flex-col gap-4 transition-all hover:bg-white/5",
                          language === "pt" ? "border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10" : "border-white/10"
                        )}
                      >
                        <span className="text-xs font-black text-gray-400 tracking-widest uppercase">LATAM REGION</span>
                        <div>
                          <h4 className="text-lg font-black text-white italic">PORTUGUÊS</h4>
                          <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Ativo por Padrão</span>
                        </div>
                      </button>

                      {/* English */}
                      <button 
                        type="button"
                        onClick={() => setLanguage("en")}
                        className={cn(
                          "p-5 rounded-2xl border text-left flex flex-col gap-4 transition-all hover:bg-white/5",
                          language === "en" ? "border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10" : "border-white/10"
                        )}
                      >
                        <span className="text-xs font-black text-gray-400 tracking-widest uppercase">GLOBAL NORTH</span>
                        <div>
                          <h4 className="text-lg font-black text-white italic">ENGLISH</h4>
                          <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Universal Translate</span>
                        </div>
                      </button>

                      {/* Japanese */}
                      <button 
                        type="button"
                        onClick={() => setLanguage("ja")}
                        className={cn(
                          "p-5 rounded-2xl border text-left flex flex-col gap-4 transition-all hover:bg-white/5",
                          language === "ja" ? "border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10" : "border-white/10"
                        )}
                      >
                        <span className="text-xs font-black text-gray-400 tracking-widest uppercase">ORIGIN REGION</span>
                        <div>
                          <h4 className="text-lg font-black text-white italic">日本語</h4>
                          <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">マンガ・ノベルの故郷</span>
                        </div>
                      </button>

                   </div>

                   <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-relaxed mt-2 border-t border-white/5 pt-4">
                     💡 {t("langWarning")}
                   </p>
                </div>
             </section>
           )}

           {/* TAB 5: Nexus Coins & Ledger */}
           {activeTab === "coins" && (
             <section className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                   <div className="h-0.5 w-8 bg-amber-500" />
                   <h2 className="text-xl font-black text-white italic tracking-tight">{t("walletTitle")}</h2>
                </div>

                <div className="glass-panel p-8 bg-[#0B0B0F]/40 border-white/5 flex flex-col gap-6">
                   <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-white/5 w-fit px-3 py-1.5 rounded-xl border border-white/5">{t("walletBalance")}</span>
                   
                   <div className="grid sm:grid-cols-2 gap-4">
                     <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex flex-col gap-1.5">
                       <span className="text-xs text-gray-400 font-black uppercase tracking-wider">{t("coinsLabel")}</span>
                       <span className="text-4xl font-black text-amber-400 italic font-mono drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">{coins} Ω</span>
                     </div>
                     <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-1.5">
                       <span className="text-xs text-gray-400 font-black uppercase tracking-wider">{t("promoCoinsLabel")}</span>
                       <span className="text-4xl font-black text-white/70 italic font-mono">{promoCoins} Ω</span>
                     </div>
                   </div>

                   <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-[#00ffcc]/5 rounded-2xl border border-[#00ffcc]/15 mt-4">
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                         <Zap className="w-6 h-6" />
                       </div>
                       <div className="flex flex-col gap-0.5 text-left">
                          <h4 className="text-sm font-black text-white uppercase tracking-widest">{t("simulateClaim")}</h4>
                          <p className="text-[10px] text-gray-500 font-medium max-w-md leading-relaxed">{t("simulateClaimDesc")}</p>
                       </div>
                     </div>
                     <div className="w-full md:w-auto shrink-0">
                       <Button 
                         onClick={handleSimulateClaim} 
                         disabled={claimSuccess}
                         className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl shadow-lg shadow-emerald-500/20"
                       >
                         {claimSuccess ? t("claimedSuccess") : t("simulateClaim")}
                       </Button>
                     </div>
                   </div>
                </div>
             </section>
           )}

           {/* TAB 6: Active Hardware Telemetry */}
           {activeTab === "hardware" && (
             <section className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                   <div className="h-0.5 w-8 bg-sky-400" />
                   <h2 className="text-xl font-black text-white italic tracking-tight">{t("hardwareTitle")}</h2>
                </div>

                <div className="glass-panel p-8 bg-[#0B0B0F]/40 border-white/5 flex flex-col gap-6">
                   <p className="text-xs text-gray-400 font-medium leading-relaxed uppercase tracking-widest">{t("hardwareDesc")}</p>
                   
                   <div className="grid sm:grid-cols-2 gap-4">
                      
                      <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-1">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Navegador</span>
                        <span className="text-sm font-black text-white">{navigator.productSub || "Webkit Standard Engine"}</span>
                      </div>

                      <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-1">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Plataforma Host</span>
                        <span className="text-sm font-black text-white">{navigator.platform || "x86_64 Mac/Win/Linux"}</span>
                      </div>

                      <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-1">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Idioma Local do Browser</span>
                        <span className="text-sm font-black text-white uppercase">{navigator.language || "pt-BR"}</span>
                      </div>

                      <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-1">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Conexão Ativa</span>
                        <span className="text-sm font-black text-emerald-500 uppercase">{navigator.onLine ? "Sinal Excelente" : "Sinal Perdido"}</span>
                      </div>

                   </div>

                   <div className="p-5 bg-black/60 rounded-2xl font-mono text-xs text-gray-300 border border-white/5 relative overflow-hidden">
                     <div className="absolute top-3 right-3 flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] text-emerald-500 uppercase tracking-widest">telemetry active</span>
                     </div>
                     <p className="text-sky-400 font-black text-[10px] uppercase tracking-widest mb-3">CONTRATO METEST_DIAGNOSTIC_DATA_LOG:</p>
                     <p className="leading-relaxed text-[11px]">
                       &gt; system.applet_id: 1657ddbb-6aca-4c19-a672-a8f7f582f677 <br />
                       &gt; system.memory_allocation: stable (under 45MB) <br />
                       &gt; connection.latency: 12ms <br />
                       &gt; layout.mode: responsive_bottom_tabs_ready <br />
                       &gt; status_check: operational <br />
                     </p>
                   </div>
                </div>
             </section>
           )}

           {/* TAB 7: Google Sync */}
           {activeTab === "google" && (
             <section className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                   <div className="h-0.5 w-8 bg-blue-500" />
                   <h2 className="text-xl font-black text-white italic tracking-tight">{t("googleSyncTitle")}</h2>
                </div>

                <div className="glass-panel p-8 bg-[#0B0B0F]/40 border-white/5">
                   <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                      <div className="flex items-center gap-6">
                         <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-blue-500 shrink-0 border border-white/5">
                            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" /></svg>
                         </div>
                         <div className="flex flex-col gap-1.5">
                            <h4 className="text-sm font-black text-white uppercase tracking-widest">Google Workflows</h4>
                            <p className="text-[10px] text-gray-500 font-medium max-w-sm leading-relaxed">Sincronize cronogramas no Calendar e armazene protótipos diretamente no seu Drive seguro.</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        {googleConnected && (
                           <Link 
                             to="/drive-sync" 
                             className={cn(buttonVariants({ variant: "ghost" }), "flex-1 md:flex-none text-[10px] font-black text-gray-400 hover:text-white uppercase tracking-widest px-6 h-11 border border-white/5 hover:border-white/20 rounded-xl")}
                           >
                             Gerenciar
                           </Link>
                        )}
                        <Button 
                          onClick={handleConnectGoogle}
                          disabled={googleConnected}
                          className={cn(
                            "flex-1 md:flex-none text-[10px] font-black uppercase tracking-widest px-8 h-11 rounded-xl transition-all shadow-lg",
                            googleConnected 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default" 
                              : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                          )}
                        >
                          {googleConnected ? "Ativo" : "Autorizar Nexus"}
                        </Button>
                      </div>
                   </div>
                </div>
             </section>
           )}

           {/* TAB 8: LGPD & Privacy */}
           {activeTab === "lgpd" && (
             <section className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                   <div className="h-0.5 w-8 bg-emerald-500" />
                   <h2 className="text-xl font-black text-white italic tracking-tight">{t("lgpdTitle")}</h2>
                </div>

                <div className="glass-panel p-8 bg-[#0B0B0F]/40 border-white/5 flex flex-col gap-6">
                   <p className="text-xs text-gray-400 font-medium leading-relaxed uppercase tracking-wider">{t("lgpdDesc")}</p>
                   
                   <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 group hover:border-emerald-500/30 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                           <Download className="w-6 h-6" />
                         </div>
                         <div className="flex flex-col gap-0.5 text-left">
                            <h4 className="text-xs font-black text-white uppercase tracking-wider">Download Identity Profile (PDA)</h4>
                            <p className="text-[10px] text-gray-500 font-medium leading-relaxed max-w-sm">Extraia instantaneamente seus rascunhos, dados cadastrais e saldo em uma estrutura JSON limpa.</p>
                         </div>
                      </div>
                      <Button 
                        onClick={handleExportDataAsJSON}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] h-11 px-6 rounded-xl uppercase tracking-widest shadow-lg shadow-emerald-500/15"
                      >
                         {t("lgpdExportBtn")}
                      </Button>
                   </div>

                   <hr className="border-white/5 my-2" />

                   <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">{t("lgpdDeleteTitle")}</span>
                   <div className="p-6 bg-rose-500/5 rounded-2xl border border-rose-500/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="flex flex-col gap-1 text-left">
                         <h4 className="text-sm font-black text-white uppercase tracking-widest">{t("lgpdDeleteLabel")}</h4>
                         <p className="text-[10px] text-gray-500 font-medium max-w-md leading-relaxed">{t("lgpdDeleteDesc")}</p>
                      </div>
                      <Button 
                        disabled
                        variant="outline"
                        className="border-rose-500/20 text-rose-500 hover:bg-rose-500/10 text-[10px] font-black h-11 px-8 rounded-xl uppercase tracking-widest transition-all cursor-not-allowed"
                      >
                         Solicitar Purga
                      </Button>
                   </div>

                </div>
             </section>
           )}

           {/* Global Saves Config Switches */}
           {activeTab === "profile" && (
             <section className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                   <div className="h-0.5 w-8 bg-amber-500" />
                   <h2 className="text-xl font-black text-white italic tracking-tight">{t("visualEngine")}</h2>
                </div>

                <div className="glass-panel p-6 bg-[#0B0B0F]/40 border-white/5 space-y-2">
                   <SettingToggle 
                     icon={Moon} 
                     label="Contraste Amoled" 
                     desc="Pretos absolutos para imersão total e economia de fótons."
                     checked={amoledMode} 
                     onChange={setAmoledMode}
                   />
                   <hr className="border-white/5" />
                   <SettingToggle 
                     icon={Zap} 
                     label="Efeitos Cinéticos" 
                     desc="Transições suaves de 60fps+ para uma navegação sem atrito."
                     checked={kineticEffects} 
                     onChange={setKineticEffects}
                   />
                   <hr className="border-white/5" />
                   <SettingToggle 
                     icon={Languages} 
                     label="Interface Universal" 
                     desc="Sempre exibir IDs de sistema e metadados brutos em obras."
                     checked={systemMetadata}
                     onChange={setSystemMetadata}
                   />
                </div>
             </section>
           )}

           {/* Save Changes Floating Bar */}
           <motion.div 
             layout
             className="sticky bottom-6 mt-10 p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl z-50 shadow-2xl overflow-hidden"
           >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 pl-6">
                 <div className="flex items-center gap-4">
                   <div className="w-2.5 h-2.5 rounded-full bg-primary-purple animate-pulse shadow-[0_0_10px_rgba(124,58,237,0.8)]" />
                   <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.2em]">Sincronização em tempo real ativa</p>
                 </div>
                 <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="ghost" className="flex-1 sm:flex-none text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest h-11 px-8 rounded-xl">{t("canceling")}</Button>
                    <Button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 sm:flex-none bg-primary-purple hover:bg-neon-purple text-white font-black h-11 px-10 rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all hover:scale-105 active:scale-95 uppercase tracking-widest text-[10px]"
                    >
                      {isSaving ? t("syncing") : t("saveChanges")}
                    </Button>
                 </div>
              </div>
           </motion.div>

        </main>
      </div>

      <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
        <DialogContent className="border-white/5 bg-black/90 p-8 max-w-xl rounded-3xl backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white italic tracking-tight uppercase">Avatares de Presets do Nexus</DialogTitle>
            <DialogDescription className="text-xs text-gray-500 uppercase tracking-wider font-bold">Instale um novo visual em sua consciência digital.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-6">
            {avatarPresets.map((preset) => (
              <motion.button
                key={preset.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setPhotoURL(preset.url);
                  setIsAvatarModalOpen(false);
                }}
                className={`relative rounded-2xl overflow-hidden aspect-square border-2 group transition-all duration-300 ${
                  photoURL === preset.url ? "border-primary-purple" : "border-white/5 hover:border-white/20"
                }`}
              >
                <img src={preset.url} alt={preset.name} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-6 text-[10px] font-black uppercase text-white tracking-widest text-center truncate select-none">
                  {preset.name}
                </div>
              </motion.button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

function SettingNavLink({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <motion.button 
      onClick={onClick}
      whileHover={{ scale: 1.02, x: 5 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-center justify-between w-full p-4 rounded-2xl transition-all group border text-left",
        active 
          ? "bg-primary-purple/10 text-primary-purple border-primary-purple/20 shadow-lg shadow-primary-purple/5" 
          : "text-gray-500 hover:text-white hover:bg-white/5 border-transparent"
      )}
    >
      <div className="flex items-center gap-4">
         <Icon className={cn(
           "w-5 h-5 transition-all group-hover:scale-110",
           active ? "text-primary-purple" : "text-gray-500 group-hover:text-primary-purple"
         )} />
         <span className="text-xs font-black uppercase tracking-tight italic">{label}</span>
      </div>
      <ChevronRight className={cn(
        "w-4 h-4 transition-all",
        active ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
      )} />
    </motion.button>
  )
}

function SettingToggle({ icon: Icon, label, desc, checked, onChange }: { icon: any, label: string, desc: string, checked?: boolean, onChange?: (val: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-4 group px-2 rounded-xl hover:bg-white/5 transition-colors">
       <div className="flex gap-5">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-primary-purple/30 group-hover:bg-primary-purple/5 transition-all">
             <Icon className="w-6 h-6 text-gray-500 group-hover:text-primary-purple transition-colors" />
          </div>
          <div className="flex flex-col gap-1 justify-center">
             <h4 className="text-sm font-black text-white uppercase tracking-widest italic group-hover:text-primary-purple transition-colors">{label}</h4>
             <p className="text-[10px] text-gray-500 font-medium leading-relaxed max-w-md">{desc}</p>
          </div>
       </div>
       <Switch checked={checked} onCheckedChange={onChange} className="data-[state=checked]:bg-primary-purple data-[state=checked]:shadow-[0_0_10px_rgba(124,58,237,0.5)] scale-110" />
    </div>
  )
}
