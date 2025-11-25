import { LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/context/AuthContext';

export default function UserMenu() {
  const { user, logout } = useAuth();

  return (
    <div className="border-t border-sidebar-border p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm">
          <p className="font-medium text-sidebar-foreground">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-sidebar-foreground/60">@{user?.username}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={logout}
        className="w-full justify-start text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Выйти
      </Button>
    </div>
  );
}
