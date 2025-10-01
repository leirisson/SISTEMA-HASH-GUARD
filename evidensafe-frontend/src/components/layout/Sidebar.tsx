import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Users, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Shield,
  BarChart3
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuthStore } from '../../store/authStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthStore();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      roles: ['USER', 'SUPER', 'ADMIN']
    },
    {
      title: 'Evidências',
      icon: FileText,
      path: '/evidence',
      roles: ['USER', 'SUPER', 'ADMIN']
    },
    {
      title: 'Relatórios',
      icon: BarChart3,
      path: '/reports',
      roles: ['SUPER', 'ADMIN']
    },
    {
      title: 'Usuários',
      icon: Users,
      path: '/users',
      roles: ['ADMIN']
    },
    {
      title: 'Configurações',
      icon: Settings,
      path: '/settings',
      roles: ['USER', 'SUPER', 'ADMIN']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || 'USER')
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-500';
      case 'SUPER': return 'bg-blue-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full bg-card border-r transition-all duration-300 animate-slide-up",
        "lg:translate-x-0 lg:static lg:z-auto",
        collapsed ? "w-16" : "w-64",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between card-responsive border-b">
            {!collapsed && (
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-primary" />
                <span className="font-bold text-responsive-base">EvidenSafe</span>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex hover-lift"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* User info */}
          {!collapsed && (
            <div className="card-responsive border-b">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-medium",
                  getRoleColor(user?.role || 'USER')
                )}>
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-responsive-sm font-medium truncate">
                    {user?.name || 'Usuário'}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {user?.role || 'USER'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 spacing-mobile card-responsive">
            <ul className="space-y-2">
              {filteredMenuItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => window.innerWidth < 1024 && onClose()}
                    className={({ isActive }) => cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 hover-lift",
                      "hover:bg-accent hover:text-accent-foreground",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-modern" 
                        : "text-muted-foreground hover:text-foreground",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && (
                      <span className="text-responsive-sm font-medium">
                        {item.title}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="card-responsive border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                {collapsed ? 'v1.0' : 'EvidenSafe v1.0.0'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}