import { ThemeToggle } from './ThemeToggle';
import { Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <div className="flex items-center justify-between py-1 mb-2">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-1">
        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
        </button>
        <ThemeToggle />
      </div>
    </div>
  );
}
