import { TabButtonProps } from "../types";

export function TabButton({ active, onClick, icon: Icon, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
        active
          ? "bg-primary-purple/20 text-primary-purple"
          : "text-gray-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  );
}
