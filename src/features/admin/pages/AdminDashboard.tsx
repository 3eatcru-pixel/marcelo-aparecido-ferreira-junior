import {
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowRight,
  Shield,
  Settings,
  CreditCard,
  Building,
  Megaphone,
  Plus,
  Monitor,
  FolderOpen,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useState, lazy, Suspense } from "react";

// Lazy-loaded administrative sub-modules
const Projects = lazy(() => import("@/features/projects/pages/Projects").then(m => ({ default: m.Projects })));
const AdminAISupport = lazy(() => import("../components/AdminAISupport").then(m => ({ default: m.AdminAISupport })));
const AdminAnalytics = lazy(() => import("../components/sections/AdminAnalytics").then(m => ({ default: m.AdminAnalytics })));
const AdminPayouts = lazy(() => import("../components/sections/AdminPayouts").then(m => ({ default: m.AdminPayouts })));
const AdminCampaigns = lazy(() => import("../components/sections/AdminCampaigns").then(m => ({ default: m.AdminCampaigns })));
const AdminBanners = lazy(() => import("../components/sections/AdminBanners").then(m => ({ default: m.AdminBanners })));
const AdminCompany = lazy(() => import("../components/sections/AdminCompany").then(m => ({ default: m.AdminCompany })));
const AdminUsers = lazy(() => import("../components/sections/AdminUsers").then(m => ({ default: m.AdminUsers })));
const AdminTransactions = lazy(() => import("../components/sections/AdminTransactions").then(m => ({ default: m.AdminTransactions })));

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("ai_support");

  const tabs = [
    { id: "ai_support", label: "Corporativo", icon: Sparkles, color: "text-blue-400" },
    { id: "analytics", label: "Métricas Gerais", icon: TrendingUp, color: "text-emerald-500" },
    { id: "projects", label: "Hub de Projetos", icon: FolderOpen, color: "text-amber-400" },
    { id: "payouts", label: "Pagamentos", icon: DollarSign, color: "text-emerald-400" },
    { id: "campaigns", label: "Campanhas", icon: Megaphone, color: "text-rose-400" },
    { id: "banners", label: "Banners Hero", icon: Monitor, color: "text-primary-purple" },
    { id: "company", label: "Painel da Empresa", icon: Building, color: "text-indigo-400" },
    { id: "users", label: "Usuários", icon: Users, color: "text-cyan-400" },
    { id: "transactions", label: "Transações", icon: CreditCard, color: "text-gray-400" },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full pb-12 px-4 md:px-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
          <Shield className="w-8 h-8 text-red-500" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
            Admin <span className="text-red-500">Console</span>
          </h1>
          <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">
            Sovereign Control Layer v2.0
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="glass-panel p-2 flex flex-col gap-1 sticky top-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all group ${
                  activeTab === tab.id
                    ? "bg-white/10 text-white border border-white/10 shadow-lg shadow-black/20"
                    : "text-gray-500 hover:text-gray-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? tab.color : 'text-gray-500 group-hover:text-gray-300'}`} />
                  {tab.label}
                </div>
                {activeTab === tab.id && (
                  <ChevronRight className="w-3 h-3 text-gray-600" />
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Suspense fallback={
              <div className="glass-panel p-8 flex flex-col gap-3 items-center justify-center text-center">
                <div className="w-6 h-6 border-2 border-primary-purple/30 border-t-primary-purple rounded-full animate-spin"></div>
                <span className="text-xs text-gray-400 font-mono tracking-widest uppercase">Carregando Módulo do Admin...</span>
              </div>
            }>
              {activeTab === "ai_support" && <AdminAISupport />}
              {activeTab === "analytics" && <AdminAnalytics />}
              {activeTab === "payouts" && <AdminPayouts />}
              {activeTab === "campaigns" && <AdminCampaigns />}
              {activeTab === "banners" && <AdminBanners />}
              {activeTab === "company" && <AdminCompany />}
              {activeTab === "projects" && <Projects onNavigate={setActiveTab} />}
              {activeTab === "users" && <AdminUsers />}
              {activeTab === "transactions" && <AdminTransactions />}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
