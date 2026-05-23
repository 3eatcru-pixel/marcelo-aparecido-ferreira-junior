import { LucideIcon } from "lucide-react";

export interface ProjectDoc {
  name: string;
  path: string;
  category: string;
}

export interface ProjectsProps {
  onNavigate?: (tab: string) => void;
}

export interface DocViewerProps {
  doc: ProjectDoc;
  onBack: () => void;
  onNavigateAI: (tab: string) => void;
}

export interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  children: React.ReactNode;
}

export interface ModuleStatusItem {
  label: string;
  status: string;
}

export interface DocsTabProps {
  onSelectDoc: (doc: ProjectDoc) => void;
  query: string;
  category: string;
  refreshKey: number;
  moduleStatus: ModuleStatusItem[];
}

export interface ChecklistItem {
  id: number;
  text: string;
  checked: boolean;
}

export interface DocCardProps {
  title: string;
  date: string;
  type: string;
  onClick: () => void;
}

export interface RequirementItemProps {
  label: string;
  status: string;
}

export interface RoadmapGeneratorProps {
  onNavigateAI: (tab: string) => void;
}
