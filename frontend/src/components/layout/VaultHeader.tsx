import React from 'react';
import { Search, Bell, Shield } from 'lucide-react';
import { IdentityBadge } from '../ui/IdentityBadge';

export function VaultHeader() {
    return (
        <header className="h-20 glass-panel border-b-0 sticky top-0 z-40 px-8 flex items-center justify-between m-4 rounded-2xl ml-[17rem]">
            <div className="flex items-center gap-4 w-96 group">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-cyan/50 group-focus-within:text-cyber-cyan transition-colors" />
                    <input
                        type="text"
                        placeholder="Search secrets, policies, or leases..."
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-cyber-cyan/50 focus:ring-1 focus:ring-cyber-cyan/50 transition-all placeholder:text-gray-500 backdrop-blur-sm"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                    <Shield className="w-3 h-3 text-amber-500" />
                    <span className="text-xs font-medium text-amber-500">Root Token Active</span>
                </div>

                <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors text-gray-400 hover:text-cyber-cyan group">
                    <Bell className="w-5 h-5 group-hover:animate-pulse" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-cyber-purple rounded-full shadow-[0_0_8px_rgba(124,58,237,0.8)] animate-pulse" />
                </button>

                <div className="h-8 w-px bg-white/10" />

                <IdentityBadge />
            </div>
        </header>
    );
}

