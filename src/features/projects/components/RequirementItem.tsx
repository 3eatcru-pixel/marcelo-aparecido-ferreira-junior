import { RequirementItemProps } from "../types";

export function RequirementItem({ label, status }: RequirementItemProps) {
  const getStatusColor = () => {
    if (status === "Concluído" || status === "Homologado") return "text-emerald-500";
    if (status === "Em Progresso" || status === "Desenvolvendo") return "text-amber-500";
    if (status === "Planejado") return "text-blue-400";
    return "text-gray-500";
  };

  const getDot = () => {
    if (status === "Concluído" || status === "Homologado") return "bg-emerald-500";
    if (status === "Em Progresso" || status === "Desenvolvendo") return "bg-amber-500 animate-pulse";
    if (status === "Planejado") return "bg-blue-400";
    return "bg-gray-600";
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 text-sm">
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDot()}`} />
        <span className="text-gray-300 text-xs">{label}</span>
      </div>
      <span className={`font-bold text-[10px] uppercase tracking-wider ${getStatusColor()}`}>{status}</span>
    </div>
  );
}
