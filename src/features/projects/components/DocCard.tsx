import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DocCardProps } from "../types";

export function DocCard({ title, date, type, onClick }: DocCardProps) {
  return (
    <div 
      onClick={onClick}
      className="glass-panel p-4 flex items-center justify-between border-white/5 hover:border-primary-purple/50 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-primary-purple/20 transition-colors">
          <FileText className="w-5 h-5 text-gray-400 group-hover:text-primary-purple" />
        </div>
        <div className="flex flex-col">
          <h4 className="font-bold text-sm text-white group-hover:text-primary-purple transition-colors">{title}</h4>
          <span className="text-[10px] text-gray-500 group-hover:text-gray-400">{date}</span>
        </div>
      </div>
      <Badge className="bg-white/5 text-gray-500 group-hover:text-gray-300 border-none uppercase text-[8px] tracking-widest font-bold">
        {type}
      </Badge>
    </div>
  );
}
