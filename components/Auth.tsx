import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

const Auth: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
                setLoading(false);
            }
        } else {
            const { error, data } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                setError(error.message);
                setLoading(false);
            } else {
                setLoading(false);
                if (data.session) {
                    // Immediate login successful
                } else if (data.user) {
                    setMessage("Account created! Please check your email for confirmation.");
                    setIsLogin(true); // Switch back to login
                }
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-5xl h-[600px] bg-white rounded-[40px] shadow-2xl overflow-hidden flex">

                {/* Visual Side */}
                <div className="hidden lg:flex flex-1 bg-primary relative flex-col justify-between p-12 text-white">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1548839140-29a749e1cf4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/60 rounded-full blur-3xl opacity-50"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-50"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-lg">
                                <i className="fa-solid fa-droplet text-xl"></i>
                            </div>
                            <span className="text-2xl font-black tracking-tighter">HydroFlow</span>
                        </div>
                        <p className="text-white/80 font-medium">Water Distribution Management ERP</p>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
                            <p className="font-bold text-lg">"Streamlining our fleet and delivery operations has never been easier."</p>
                            <div className="mt-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/60 flex items-center justify-center font-bold">JD</div>
                                <div>
                                    <p className="text-sm font-bold">John Doe</p>
                                    <p className="text-xs text-blue-200">Operations Manager</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Login Form Side */}
                <div className="flex-1 p-12 flex flex-col justify-center relative">
                    <div className="max-w-sm mx-auto w-full">
                        <h2 className="text-3xl font-black text-slate-800 mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                        <p className="text-slate-500 mb-8 font-medium">{isLogin ? 'Please sign in to access your dashboard.' : 'Enter your details to get started.'}</p>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3 animate-pulse">
                                <i className="fa-solid fa-circle-exclamation"></i>
                                {error}
                            </div>
                        )}
                        {message && (
                            <div className="mb-6 p-4 bg-accent/10 text-accent rounded-2xl text-sm font-bold flex items-center gap-3 animate-pulse">
                                <i className="fa-solid fa-check-circle"></i>
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                                <div className="relative">
                                    <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-primary focus:bg-white transition-all"
                                        placeholder="admin@hydroflow.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
                                <div className="relative">
                                    <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-primary focus:bg-white transition-all"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:bg-secondary hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (isLogin ? 'Sign In to Dashboard' : 'Create Account')}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-slate-400 text-sm font-bold">
                                {isLogin ? "Don't have an account?" : "Already have an account?"}
                                <button
                                    type="button"
                                    onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }}
                                    className="text-primary hover:underline ml-1"
                                >
                                    {isLogin ? "Create Account" : "Sign In"}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
