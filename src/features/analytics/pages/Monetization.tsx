import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Wallet,
  Landmark,
  ChevronRight,
  Download,
  Coins,
  ShoppingCart,
  Zap,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { doc, updateDoc, collection, getDocs, addDoc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { toast } from "sonner";

export function Monetization() {
  const { role, currentUser, setAuthModalOpen } = useAppStore();
  const [activeTab, setActiveTab] = useState<"wallet" | "dashboard">(role === 'CREATOR' || role === 'ADMIN' ? "dashboard" : "wallet");

  return (
    <div className="flex flex-col gap-8 max-w-[1200px] mx-auto w-full pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl ${activeTab === "wallet" ? "bg-yellow-500/20" : "bg-emerald-500/20"}`}
          >
            {activeTab === "wallet" ? (
              <Coins className="w-8 h-8 text-yellow-500" />
            ) : (
              <DollarSign className="w-8 h-8 text-emerald-500" />
            )}
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {activeTab === "wallet" ? "Carteira (Coins)" : "Painel do Autor"}
            </h1>
            <p className="text-sm text-gray-400">
              {activeTab === "wallet"
                ? "Compre moedas para desbloquear capítulos."
                : "Gerencie seus ganhos e saques via PIX."}
            </p>
          </div>
        </div>

        <div className="flex bg-black/40 p-1 rounded-md border border-white/5">
          <button
            onClick={() => setActiveTab("wallet")}
            className={`px-4 py-1.5 text-xs font-bold rounded-sm transition-colors ${activeTab === "wallet" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"}`}
          >
            Carteira (Leitor)
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-1.5 text-xs font-bold rounded-sm transition-colors ${activeTab === "dashboard" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"}`}
          >
            Painel do Autor
          </button>
        </div>
      </div>

      {activeTab === "wallet" ? <WalletView /> : <AuthorDashboard />}
    </div>
  );
}

function WalletView() {
  const { coins, promoCoins, lastBonusClaimAt, setLastBonusClaimAt, currentUser, setAuthModalOpen, setCoins, setPromoCoins } = useAppStore();
  const [customAmount, setCustomAmount] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [basePricePerCoin, setBasePricePerCoin] = useState(0.05);
  const [dailyBonusAmount, setDailyBonusAmount] = useState(50);
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDocs(collection(db, "settings"));
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setPackages(data.coinPackages || []);
          if (data.basePricePerCoin) {
            setBasePricePerCoin(data.basePricePerCoin);
          }
          if (data.dailyBonusAmount) {
            setDailyBonusAmount(data.dailyBonusAmount);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const calculatedCoins = Math.floor(customAmount / basePricePerCoin);

  const handleBuy = async (amount: number, label: string) => {
    if (!currentUser) {
      toast.error("Você precisa estar autenticado para comprar pacotes de moedas.");
      setAuthModalOpen(true);
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate payment gateway delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        coins: coins + amount
      });
      setCoins(coins + amount);

      // Log transaction
      await addDoc(collection(db, "transactions"), {
        userId: currentUser.uid,
        type: 'BUY_GOLD',
        amount: amount,
        label: `Compra: ${label}`,
        createdAt: Date.now()
      });

      toast.success(`🎉 Sucesso! Adicionamos ${amount.toLocaleString()} moedas de Ouro na sua carteira.`);
    } catch (e) {
      console.error("Erro ao processar compra.", e);
      toast.error("Não foi possível processar a aquisição de moedas.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBonus = async () => {
    if (!currentUser) {
      toast.error("Você precisa estar autenticado para resgatar bônus diários.");
      setAuthModalOpen(true);
      return;
    }
    
    // Check cooldown (24h)
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;
    const lastClaim = lastBonusClaimAt || 0;
    
    if (now - lastClaim < cooldown) {
      const remaining = cooldown - (now - lastClaim);
      const hours = Math.ceil(remaining / (1000 * 60 * 60));
      toast.info(`O bônus diário já foi coletado hoje. Retorne em aproximadamente ${hours} horas.`);
      return;
    }
    
    setIsProcessing(true);
    try {
      const amount = dailyBonusAmount;
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        promoCoins: (promoCoins || 0) + amount,
        lastBonusClaimAt: now
      });
      setPromoCoins((promoCoins || 0) + amount);
      setLastBonusClaimAt(now);

      // Log transaction
      await addDoc(collection(db, "transactions"), {
        userId: currentUser.uid,
        type: 'BONUS_DAILY',
        amount: amount,
        label: 'Bônus Diário Recarregado',
        createdAt: now
      });
      toast.success(`🎁 Parabéns! +${amount} moedas azuis (Promo) creditadas na sua conta.`);
    } catch (e) {
      console.error("Erro ao coletar bônus.", e);
      toast.error("Não foi possível processar o resgate de bônus.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
        {/* Card Moedas Pagas */}
        <div className="glass-panel p-8 border-yellow-500/30 bg-yellow-500/5 relative overflow-hidden flex flex-col items-center justify-center text-center group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-yellow-500/20 transition-all"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500/60 mb-2">
            Saldo de Moedas (Ouro)
          </span>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.3)] animate-pulse-slow">
              <Coins className="w-8 h-8 text-yellow-500" />
            </div>
            <span className="text-6xl font-black text-white tracking-tighter">{coins.toLocaleString()}</span>
          </div>
          <p className="text-xs text-gray-400 max-w-[280px] italic">
            Moedas adquiridas. Use para desbloquear qualquer capítulo e apoiar diretamente seus autores favoritos.
          </p>
        </div>

        {/* Card Moedas Promo */}
        <div className="glass-panel p-8 border-blue-500/30 bg-blue-500/5 relative overflow-hidden flex flex-col items-center justify-center text-center group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-blue-500/20 transition-all"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/60 mb-2">
            Saldo Promocional (Azul)
          </span>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)]">
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
            <span className="text-6xl font-black text-white tracking-tighter">{promoCoins.toLocaleString()}</span>
          </div>
          <div className="flex flex-col gap-3 items-center">
             <p className="text-xs text-gray-400 max-w-[280px] italic">
              Ganhe lendo ou em missões. Use para ler capítulos selecionados.
            </p>
            <Button 
              size="sm"
              onClick={handleBonus}
              disabled={isProcessing}
              className="bg-blue-500/20 hover:bg-blue-400 hover:text-white text-blue-400 border border-blue-500/30 rounded-full h-8 px-6 text-[10px] font-black tracking-widest uppercase transition-all"
            >
              Coletar Bônus Diário (+{dailyBonusAmount})
            </Button>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="flex items-center gap-4 mb-8">
           <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Recarregar Moedas</h2>
           <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
        </div>

        {/* Valor Customizado */}
        <div className="glass-panel p-6 border-white/10 bg-black/40 mb-8 flex flex-col lg:flex-row items-center gap-8 justify-between relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          
          <div className="flex flex-col">
            <h3 className="font-bold text-white text-xl uppercase italic tracking-tight flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-yellow-500" /> Valor Flexível
            </h3>
            <p className="text-sm text-gray-500 font-medium">
              A partir de R$ 1,00 • <span className="text-yellow-500/80 font-bold">1 Moeda = R$ {basePricePerCoin.toFixed(3)}</span>
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 w-full lg:w-auto">
            <div className="flex flex-col items-center">
              <div className="relative flex items-center">
                <span className="absolute left-4 text-yellow-500 font-black text-xl">
                  R$
                </span>
                <input
                  type="number"
                  min="1"
                  disabled={isProcessing}
                  value={customAmount}
                  onChange={(e) =>
                    setCustomAmount(Math.max(1, Number(e.target.value)))
                   }
                  className="bg-black/60 border-2 border-white/10 rounded-2xl pl-14 pr-4 py-4 h-16 text-white font-black text-2xl focus:outline-none focus:border-yellow-500 w-56 text-center disabled:opacity-50 transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-col items-center leading-none">
                 <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Você Recebe</span>
                 <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span className="text-3xl font-black text-white">{calculatedCoins.toLocaleString()}</span>
                 </div>
              </div>
              <Button 
                onClick={() => handleBuy(calculatedCoins, `R$ ${customAmount}`)}
                disabled={isProcessing}
                className="h-14 px-12 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase italic tracking-widest rounded-2xl w-full md:w-auto shadow-lg shadow-yellow-500/20 active:scale-95 transition-all"
              >
                {isProcessing ? "Processando..." : "Comprar Agora"}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
           <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.2em] italic">
             Sugestões com Bônus Neural
           </h3>
           <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase text-[9px] font-black tracking-widest px-3">
             Melhor Custo-Benefício
           </Badge>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm">Sincronizando ofertas da central...</p>
        ) : packages.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <CoinPackage 
               coins={500} 
               price="R$ 25,00" 
               onBuy={() => handleBuy(500, "500 Moedas")} 
               basePricePerCoin={basePricePerCoin}
            />
            <CoinPackage 
               coins={1500} 
               price="R$ 70,00" 
               popular 
               bonus="+100 Bônus"
               onBuy={() => handleBuy(1500, "1500 Moedas")} 
               basePricePerCoin={basePricePerCoin}
            />
            <CoinPackage 
               coins={3000} 
               price="R$ 130,00" 
               bonus="+300 Bônus"
               onBuy={() => handleBuy(3000, "3000 Moedas")} 
               basePricePerCoin={basePricePerCoin}
            />
            <CoinPackage 
               coins={10000} 
               price="R$ 400,00" 
               bonus="+2000 Bônus"
               onBuy={() => handleBuy(10000, "10000 Moedas")} 
               basePricePerCoin={basePricePerCoin}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {packages.map((pkg: any) => (
              <CoinPackage 
                key={pkg.id}
                coins={pkg.coins} 
                price={`R$ ${pkg.price.toFixed(2)}`} 
                bonus={pkg.bonus}
                onBuy={() => handleBuy(pkg.coins, `Pacote: ${pkg.name}`)} 
                basePricePerCoin={basePricePerCoin}
                disabled={isProcessing} 
              />
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel p-6 mt-4 border-white/5">
        <h2 className="text-lg font-black text-white mb-6 uppercase italic tracking-tighter">
          Histórico de Fluxo Neural
        </h2>
        <TransactionHistory />
      </div>
    </div>
  );
}

function TransactionHistory() {
  const { currentUser } = useAppStore();
  const [txs, setTxs] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchTxs = async () => {
      const q = query(collection(db, "transactions"), where("userId", "==", currentUser.uid));
      const snap = await getDocs(q);
      setTxs(snap.docs.map(d => d.data()).sort((a: any, b: any) => b.createdAt - a.createdAt));
    };
    fetchTxs();
  }, [currentUser]);

  if (txs.length === 0) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest italic">Nenhuma pulsação registrada.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-center">
        <thead className="text-[10px] text-gray-500 uppercase tracking-[0.2em] border-b border-white/10">
          <tr>
            <th className="px-4 py-4 font-black">Data</th>
            <th className="px-4 py-4 font-black">Identificador</th>
            <th className="px-4 py-4 font-black text-right">Magnitude</th>
          </tr>
        </thead>
        <tbody>
          {txs.map((tx, idx) => (
            <tr key={idx} className="border-b border-white/5 hover:bg-white/5 group transition-colors">
              <td className="px-4 py-5 text-[11px] text-gray-500 font-mono">
                {new Date(tx.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-5 font-bold text-white uppercase italic tracking-tight">
                {tx.label}
              </td>
              <td className={`px-4 py-5 text-right font-black text-lg ${tx.type.startsWith('BUY') || tx.type.startsWith('BONUS') ? 'text-emerald-400' : 'text-rose-400'}`}>
                {tx.type.startsWith('BUY') || tx.type.startsWith('BONUS') ? '+' : '-'} {tx.amount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CoinPackage({ coins, price, bonus, popular, onBuy, disabled, basePricePerCoin }: any) {
  const numericPrice = parseFloat(price.replace('R$ ', '').replace(',', '.'));
  const unitPrice = numericPrice / coins;
  const savings = basePricePerCoin ? Math.round((1 - (unitPrice / basePricePerCoin)) * 100) : 0;

  return (
    <div
      onClick={() => !disabled && onBuy()}
      className={`glass-panel p-6 border flex flex-col gap-4 relative transition-all hover:-translate-y-2 cursor-pointer group active:scale-95 ${popular ? "border-yellow-500/40 bg-yellow-500/5 shadow-2xl shadow-yellow-500/10" : "border-white/5 hover:border-white/20"} ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
    >
      {popular && (
        <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-black text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full whitespace-nowrap shadow-[0_0_20px_rgba(234,179,8,0.4)] z-10 animate-pulse">
          ALTA DEMANDA
        </div>
      )}

      {savings > 0 && (
        <div className="absolute top-2 left-2 bg-emerald-500 text-black text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
           -{savings}% OFF
        </div>
      )}

      <div className="flex flex-col items-center justify-center text-center mt-4">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-xl ${popular ? 'bg-yellow-500/10' : 'bg-white/5'}`}>
            <Coins
              className={`w-6 h-6 ${popular ? "text-yellow-500" : "text-gray-400 group-hover:text-white transition-colors"}`}
            />
          </div>
          <span className="text-3xl font-black text-white tracking-tighter">{coins.toLocaleString()}</span>
        </div>
        
        <div className="flex flex-col gap-1 mb-4">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">
             Unidade: R$ {unitPrice.toFixed(2)}
          </span>
          {bonus && (
             <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{bonus}</span>
          )}
        </div>
      </div>

      <div className="mt-auto">
        <div className="text-center mb-3">
           <span className="text-xl font-black text-white">{price}</span>
        </div>
        <Button
          disabled={disabled}
          className={`w-full h-11 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all ${popular ? "bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/20" : "bg-white/5 border border-white/10 hover:bg-white/10 text-white"}`}
        >
          {disabled ? "..." : "SELECIONAR"}
        </Button>
      </div>
    </div>
  );
}

function AuthorDashboard() {
  const { currentUser } = useAppStore();
  const [earnings, setEarnings] = useState<number>(1240.50);
  const [pixKey, setPixKey] = useState<string>("***.456.789-**");
  const [pixType, setPixType] = useState<string>("CPF");
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const [payoutsList, setPayoutsList] = useState<any[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(true);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [inputPixKey, setInputPixKey] = useState<string>("");
  const [inputPixType, setInputPixType] = useState<string>("CPF");
  const [isSavingPix, setIsSavingPix] = useState(false);
  const [isEditingPixInline, setIsEditingPixInline] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // 1. Listen to User profile (earnings and registered PIX key/type)
    const userRef = doc(db, "users", currentUser.uid);
    const unsubUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile(data);
        if (data.creatorEarnings !== undefined) {
          setEarnings(data.creatorEarnings);
        } else {
          // pre-populate with default 1240.50 on first creator access if not set
          setEarnings(1240.50);
        }
        if (data.pixKey) {
          setPixKey(data.pixKey);
          setInputPixKey(data.pixKey);
        } else {
          setInputPixKey("");
        }
        if (data.pixType) {
          setPixType(data.pixType);
          setInputPixType(data.pixType);
        }
      }
    });

    // 2. Listen to real payouts submitted by this creator
    const payoutsQuery = query(
      collection(db, "payouts"),
      where("authorId", "==", currentUser.uid)
    );
    const unsubPayouts = onSnapshot(payoutsQuery, (snap) => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        dateStr: new Date(d.data().createdAt || Date.now()).toLocaleDateString()
      })).sort((a: any, b: any) => b.createdAt - a.createdAt);
      setPayoutsList(list);
      setLoadingPayouts(false);
    }, (err) => {
      console.error(err);
      setLoadingPayouts(false);
    });

    return () => {
      unsubUser();
      unsubPayouts();
    };
  }, [currentUser]);

  const handleSavePixInfo = async () => {
    if (!currentUser) return;
    setIsSavingPix(true);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        pixKey: inputPixKey,
        pixType: inputPixType
      });
      setPixKey(inputPixKey);
      setPixType(inputPixType);
      setIsEditingPixInline(false);
      toast.success("Dados de PIX atualizados com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar chave PIX.");
    } finally {
      setIsSavingPix(false);
    }
  };

  const handleRequestWithdraw = async () => {
    if (!currentUser) return;
    const amount = parseFloat(withdrawAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Por favor, insira um valor válido de saque.");
      return;
    }
    
    if (amount > earnings) {
      toast.error("Saldo de ganhos disponível insuficiente para esse valor.");
      return;
    }

    if (!pixKey || pixKey === "***.456.789-**") {
      toast.error("Por favor, registre uma Chave PIX antes de efetuar o saque.");
      return;
    }

    setIsProcessing(true);
    try {
      // Create billing request payout
      await addDoc(collection(db, "payouts"), {
        authorId: currentUser.uid,
        authorName: currentUser.displayName || userProfile?.displayName || "Autor",
        pixKey: pixKey,
        pixType: pixType,
        amount: amount,
        status: "PENDING",
        createdAt: Date.now()
      });

      // Deduct from creator earnings balance in database
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        creatorEarnings: Math.max(0, earnings - amount)
      });

      // Log transaction
      await addDoc(collection(db, "transactions"), {
        userId: currentUser.uid,
        type: 'WITHDRAW_REQUEST',
        amount: amount,
        label: `Saque Solicitação (PIX - ${pixType})`,
        createdAt: Date.now()
      });

      setIsWithdrawModalOpen(false);
      setWithdrawAmount("");
      toast.success("🎉 Solicitação de saque PIX enviada com sucesso! Aguarde o processamento operacional.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar solicitação de saque.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="glass-panel p-6 flex flex-col gap-4 border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>

          <div className="flex items-center justify-between text-gray-400">
            <span className="text-sm font-semibold uppercase tracking-widest">
              Saldo Disponível
            </span>
            <Wallet className="w-5 h-5 text-emerald-500" />
          </div>

          <div className="flex items-end gap-3 z-10">
            <span className="text-4xl font-black text-white">R$ {earnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>

          <p className="text-xs text-gray-400 z-10 w-3/4">
            Seu fundo já descontando a taxa de 10% da plataforma. Disponível
            para saque imediato.
          </p>

          <Button 
            onClick={() => {
              if (!pixKey || pixKey === "***.456.789-**") {
                toast.error("Por favor registre seus dados bancários (Chave PIX) antes.");
                setIsEditingPixInline(true);
              } else {
                setIsWithdrawModalOpen(true);
              }
            }}
            className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] z-10"
          >
            Sacar via PIX
          </Button>
        </div>

        <StatCard
          title="Ganhos este Mês"
          value={`R$ ${(earnings * 0.6).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend="+15%"
          positive
          icon={TrendingUp}
          desc="Comparado ao mês anterior"
        />
        <StatCard
          title="Capítulos Desbloqueados"
          value="3,420"
          trend="+5%"
          positive
          icon={ArrowUpRight}
          desc="Nas últimas 30 dias"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mt-4">
        {/* Works breakdown */}
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Ganhos por Obra</h2>
            <Button
              variant="ghost"
              className="text-xs text-gray-400 hover:text-white"
            >
              Ver tudo
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            <WorkEarningItem
              title="Neon Genesis: A Queda"
              type="NOVEL"
              amount="R$ 520,30"
              unlocks="1,450"
            />
            <WorkEarningItem
              title="Ecos do Silêncio"
              type="NOVEL"
              amount="R$ 180,40"
              unlocks="620"
            />
            <WorkEarningItem
              title="Sombras de Aether"
              type="MANGA"
              amount="R$ 139,80"
              unlocks="450"
            />
          </div>
        </div>

        {/* Info & Rules */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 border-white/5 bg-black/40">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-primary-purple" /> Dados Bancários
            </h3>

            {isEditingPixInline ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Tipo de Chave</span>
                  <select
                    value={inputPixType}
                    onChange={(e) => setInputPixType(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white"
                  >
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                    <option value="EMAIL">E-mail</option>
                    <option value="TELEFONE">Telefone</option>
                    <option value="ALEATORIA">Chave Aleatória</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Chave PIX</span>
                  <input
                    type="text"
                    value={inputPixKey}
                    onChange={(e) => setInputPixKey(e.target.value)}
                    placeholder="Sua chave de recebimento"
                    className="bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <Button 
                    size="sm"
                    onClick={handleSavePixInfo}
                    disabled={isSavingPix}
                    className="bg-emerald-500 text-black font-bold text-xs h-8 flex-1"
                  >
                    {isSavingPix ? "Salvando..." : "Salvar"}
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingPixInline(false)}
                    className="border-white/10 text-gray-400 text-xs h-8"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-widest">
                    Chave PIX
                  </span>
                  <div className="text-sm text-gray-200 bg-black/40 border border-white/10 rounded px-3 py-2 font-mono">
                    {pixKey}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-widest">
                    Tipo
                  </span>
                  <div className="text-sm text-gray-200 bg-black/40 border border-white/10 rounded px-3 py-2">
                    {pixType}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsEditingPixInline(true)}
                  className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 mt-2 text-xs"
                >
                  Alterar Chave PIX
                </Button>
              </div>
            )}
          </div>

          <div className="glass-panel p-6 border-white/5 bg-primary-indigo/5">
            <h3 className="text-sm font-bold text-primary-indigo mb-2">
              Compreendendo seus Ganhos
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Os leitores compram "Moedas" na plataforma e usam para desbloquear
              seus capítulos. Cada moeda corresponde a um valor. A plataforma
              retém apenas 10% do valor da transação, garantindo que o autor
              receba a maior parte do lucro!
            </p>
            <div className="flex items-center text-xs text-indigo-400 font-semibold hover:text-indigo-300 cursor-pointer">
              Ler Termos de Monetização{" "}
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Payout History */}
      <div className="glass-panel p-6 mt-4">
        <h2 className="text-lg font-bold text-white mb-6">Últimos Saques</h2>
        {loadingPayouts ? (
          <p className="text-center py-6 text-gray-500 text-xs">Carregando histórico de transferências...</p>
        ) : payoutsList.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-white/5 rounded-xl">
            <p className="text-gray-500 text-xs italic">Nenhum saque solicitado ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Chave PIX</th>
                  <th className="px-4 py-3 font-semibold">Valor</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {payoutsList.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 bg-black/20">
                    <td className="px-4 py-4 text-gray-300">{p.dateStr || new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-gray-300 font-mono text-xs">
                      {p.pixKey} ({p.pixType})
                    </td>
                    <td className="px-4 py-4 text-white font-bold">R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-4">
                      <Badge className={
                        p.status === 'PENDING' ? 'bg-amber-500/20 text-amber-500 border-none' : 
                        p.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-500 border-none' : 
                        'bg-red-500/20 text-red-500 border-none'
                      }>
                        {p.status === "PENDING" ? "Pendente" : p.status === "PAID" ? "Efetivado" : p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PIX Withdraw Dialog Modal */}
      <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
        <DialogContent className="max-w-sm w-full border-white/10 p-6 bg-[#0C0C12] overflow-hidden shadow-2xl rounded-2xl" showCloseButton={false}>
          <DialogTitle className="sr-only">Solicitar Saque PIX</DialogTitle>
          <DialogDescription className="sr-only">Digite o valor que deseja receber via PIX.</DialogDescription>
          <h3 className="text-lg font-extrabold uppercase tracking-tight text-white mb-2">Solicitar Saque PIX</h3>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Digite o valor que deseja receber. O pagamento é processado e auditado para a chave PIX registrada: <span className="text-emerald-400 font-mono">{pixKey}</span>.
          </p>
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-black">Valor do Saque (R$)</label>
              <input 
                type="number" 
                step="0.01"
                max={earnings}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`Máximo R$ ${earnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white mt-1 outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleRequestWithdraw}
              disabled={isProcessing}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs h-10 flex-1 uppercase cursor-pointer"
            >
              {isProcessing ? "PROCESSANDO..." : "Confirmar Saque"}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsWithdrawModalOpen(false)}
              disabled={isProcessing}
              className="border-white/10 text-gray-400 text-xs h-10 uppercase cursor-pointer"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatCard({ title, value, trend, positive, icon: Icon, desc }: any) {
  return (
    <div className="glass-panel p-6 flex flex-col gap-4 border-white/5 relative overflow-hidden">
      <div className="flex items-center justify-between text-gray-400 z-10">
        <span className="text-sm font-semibold uppercase tracking-widest">
          {title}
        </span>
        <Icon className="w-5 h-5 text-gray-500" />
      </div>

      <div className="flex items-end gap-3 z-10 mt-2">
        <span className="text-3xl font-bold text-white">{value}</span>
        <span
          className={`text-sm font-bold mb-1 ${positive ? "text-emerald-500" : "text-rose-500"}`}
        >
          {trend}
        </span>
      </div>

      <p className="text-xs text-gray-500 uppercase tracking-widest z-10 mt-1">
        {desc}
      </p>
    </div>
  );
}

function WorkEarningItem({ title, type, amount, unlocks }: any) {
  const isNovel = type === "NOVEL";
  return (
    <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-white text-base">{title}</h3>
          <Badge
            className={`text-[9px] font-bold tracking-widest border-none px-2 py-0 ${isNovel ? "bg-primary-purple/20 text-primary-purple" : "bg-neon-blue/20 text-cyan-400"}`}
          >
            {type}
          </Badge>
        </div>
        <span className="text-xs text-gray-500">
          {unlocks} desbloqueios de capítulos
        </span>
      </div>
      <span className="text-lg font-black text-emerald-400">{amount}</span>
    </div>
  );
}
