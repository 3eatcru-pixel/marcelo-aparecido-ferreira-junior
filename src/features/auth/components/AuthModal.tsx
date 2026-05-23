import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '@/store/useAppStore';
import { auth, googleSignIn } from '@/lib/firebase/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Mail, Lock, User as UserIcon } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';

export function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen } = useAppStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await googleSignIn();
      if (result) {
        setAuthModalOpen(false);
      } else {
        // Returned null because it is redirecting or the popup request is in progress/cancelled/blocked-handled
        console.log("googleSignIn returned null (could be redirecting or popup closed).");
      }
    } catch (err: any) {
      console.error("Google Signin Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('Domínio não autorizado. Adicione a URL atual em Firebase Console > Authentication > Settings > Authorized domains.');
      } else if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user' || err.message?.includes('popup')) {
        setError('O popup do Google foi bloqueado. Estamos redirecionando você para o login seguro de página inteira, ou você pode clicar no link abaixo para abrir em uma nova guia.');
      } else {
        setError(`Falha ao entrar com Google: ${err.message || err.code}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (!username || username.length < 3) {
          throw new Error('O nome de usuário deve ter no mínimo 3 caracteres.');
        }
        
        // 1. Check if username is already taken BEFORE creating auth account
        const usernameLower = username.toLowerCase();
        const usernameRef = doc(db, 'usernames', usernameLower);
        const usernameSnap = await getDoc(usernameRef);
        
        if (usernameSnap.exists()) {
          throw new Error('Este nome de usuário já está em uso.');
        }

        // 2. Create Auth Account
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        
        // 3. Register Username
        try {
          await setDoc(usernameRef, { 
            uid: userCred.user.uid,
            email: email.toLowerCase()
          });
        } catch (usernameErr) {
          console.error("Failed to register username:", usernameErr);
          throw new Error('Conta criada, mas o nome de usuário não pôde ser reservado. Tente atualizá-lo depois.');
        }
        
        // 4. Create User Doc (it will be finalized by onSnapshot in App.tsx but we can precache it)
        try {
          await setDoc(doc(db, 'users', userCred.user.uid), {
            username: username,
            email: userCred.user.email,
            role: 'READER',
            createdAt: Date.now(),
            coins: 500
          }, { merge: true });
        } catch (userDocErr) {
          console.error("Failed to merge username into users collection:", userDocErr);
        }

      } else {
        // Login
        let resolvedEmail = email.trim();
        if (!resolvedEmail.includes('@')) {
          const usernameLower = resolvedEmail.toLowerCase();
          const usernameRef = doc(db, 'usernames', usernameLower);
          const usernameSnap = await getDoc(usernameRef);
          
          if (usernameSnap.exists()) {
            const data = usernameSnap.data();
            if (data && data.email) {
              resolvedEmail = data.email;
            } else {
              throw new Error('Este nome de usuário existe, mas não possui e-mail cadastrado de fallback nesta rota. Por favor, entre usando seu E-mail.');
            }
          } else {
            throw new Error('Nome de usuário não encontrado.');
          }
        }
        await signInWithEmailAndPassword(auth, resolvedEmail, password);
      }
      setAuthModalOpen(false);
    } catch (err: any) {
      console.error("Email Action Error:", err);
      let errMsg = err.message || 'Erro inesperado.';
      
      if (err.code === 'auth/email-already-in-use') {
        errMsg = 'Este e-mail já está em uso.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        errMsg = 'E-mail ou senha inválidos.';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = 'O formato do e-mail é inválido.';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'A senha deve ter no mínimo 6 caracteres.';
      }
      
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={setAuthModalOpen}>
      <DialogContent className="max-w-md w-full p-8 border-primary-purple/30 bg-black flex flex-col gap-6 shadow-2xl shadow-primary-purple/10" showCloseButton={false}>
        <DialogTitle className="sr-only">
          {mode === 'login' ? 'Entrar na MangaOS' : 'Junte-se à MangaOS'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {mode === 'login' ? 'Acesse sua biblioteca' : 'Crie sua conta'}
        </DialogDescription>
        
        <button 
          onClick={() => setAuthModalOpen(false)} 
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-2">
            {mode === 'login' ? 'Entrar na MangaOS' : 'Junte-se à MangaOS'}
          </h2>
          <p className="text-gray-400 text-sm">
            {mode === 'login' 
              ? 'Acesse sua biblioteca de aventuras epicas.' 
              : 'Crie sua conta para ler e publicar histórias.'}
          </p>
        </div>

          <div className="flex flex-col gap-4">
            <Button 
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white text-black hover:bg-gray-200 hover:text-black border-none py-6 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar com Google
            </Button>

            {isIframe && (
              <div className="p-3 bg-primary-purple/10 border border-primary-purple/20 rounded-lg text-xs leading-relaxed text-gray-300 text-center">
                <span className="text-neon-blue font-bold">💡 Nota sobre Sandbox / Iframe:</span> Os popups de autenticação do Google do navegador podem ser bloqueados pelo visualizador.
                <a 
                  href={window.location.href} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="block mt-2 font-bold text-primary-purple hover:text-purple-400 transition-colors uppercase tracking-wider text-[11px] underline"
                >
                  👉 Abrir App de Página Cheia em Nova Guia
                </a>
              </div>
            )}
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-4 text-xs text-gray-500 uppercase tracking-widest">ou</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <form onSubmit={handleEmailAction} className="flex flex-col gap-4">
              {mode === 'register' && (
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    placeholder="Nome de Usuário (Ex: aventureiro99)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s/g, '_'))}
                    className="pl-10 bg-black/40 border-white/10 focus:border-primary-purple text-white"
                    required
                  />
                </div>
              )}
              
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  type={mode === 'login' ? 'text' : 'email'}
                  placeholder={mode === 'login' ? 'E-mail ou Nome de Usuário' : 'Seu E-mail'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-black/40 border-white/10 focus:border-primary-purple text-white"
                  required
                />
              </div>
              
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-black/40 border-white/10 focus:border-primary-purple text-white"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary-purple to-blue-600 hover:from-primary-purple/80 hover:to-blue-600/80 text-white py-6 mt-2"
              >
                {isLoading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar Conta'}
              </Button>
            </form>
          </div>

          <div className="text-center mt-4 border-t border-white/5 pt-6">
            <p className="text-gray-400 text-sm">
              {mode === 'login' ? 'Ainda não é membro? ' : 'Já tem uma conta? '}
              <button 
                type="button"
                className="text-primary-purple hover:text-white transition-colors underline decoration-primary-purple/30 underline-offset-4"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                }}
              >
                {mode === 'login' ? 'Cadastre-se' : 'Faça login'}
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
}
