
import React from 'react';

// --- BUTTON ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    icon?: React.ElementType;
}
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', icon: Icon, children, ...props }) => {
    const base = "flex items-center justify-center gap-2 rounded font-bold uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed";
    const styles = {
        primary: "bg-[#D0F224] text-black hover:bg-[#c0e020] shadow-lg",
        secondary: "bg-[#111] border border-[#333] text-white hover:text-[#D0F224] hover:border-[#D0F224]",
        ghost: "text-[#666] hover:text-white hover:bg-[#222]"
    };
    return (
        <button className={`${base} ${styles[variant]} ${className}`} {...props}>
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {children}
        </button>
    );
};

// --- SECTION ---
export const Section: React.FC<{ label: string; icon?: React.ElementType; children: React.ReactNode }> = ({ label, icon: Icon, children }) => (
  <div className="p-4 border-b border-[#222]">
    <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-[#666] uppercase tracking-wider">
      {Icon && <Icon className="w-3 h-3 text-[#D0F224]" />} {label}
    </div>
    {children}
  </div>
);

// --- SELECT ---
export const Select: React.FC<{ value: string; options: string[]; onChange: (v: string) => void; disabled?: boolean; label?: string }> = 
({ value, options, onChange, disabled, label }) => (
  <div className="mb-2">
    {label && <span className="block text-[9px] font-bold text-[#555] uppercase mb-1">{label}</span>}
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      disabled={disabled}
      className="w-full bg-[#050505] border border-[#333] text-gray-200 text-xs rounded p-2 outline-none focus:border-[#D0F224]"
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

// --- TOGGLE ---
export const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = 
({ label, checked, onChange, disabled }) => (
    <label className="flex items-center justify-between cursor-pointer group p-2 rounded hover:bg-[#111] transition-colors border border-transparent hover:border-[#222]">
        <span className="text-[11px] font-bold text-[#888] group-hover:text-white uppercase tracking-wide">{label}</span>
        <div className={`w-4 h-4 rounded border flex items-center justify-center ${checked ? 'bg-[#D0F224] border-[#D0F224]' : 'border-[#444] bg-black'}`}>
             <input type="checkbox" className="hidden" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
             {checked && <div className="w-2 h-2 bg-black rounded-sm"></div>}
        </div>
    </label>
);

// --- INPUT ---
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input className="w-full bg-[#050505] border border-[#333] text-white text-xs rounded p-2 outline-none focus:border-[#D0F224] font-bold" {...props} />
);
