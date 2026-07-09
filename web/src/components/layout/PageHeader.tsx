import { ThemeToggle } from './ThemeToggle';

interface PageHeaderProps {
  title: string;
}

export function PageHeader({ title }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <ThemeToggle />
    </div>
  );
}
