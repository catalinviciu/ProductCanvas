import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Home } from "lucide-react";
import { useLocation } from "wouter";
import { useCallback, useMemo, memo } from "react";

export const UserProfileMenu = memo(() => {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const getInitials = useCallback((firstName?: string, lastName?: string, email?: string) => {
    if (firstName || lastName) {
      return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  }, []);

  const displayName = useMemo(() => {
    if (!user) return "User";
    return user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.email || "User";
  }, [user?.firstName, user?.lastName, user?.email]);

  const handleHomeClick = useCallback(() => {
    if (location !== "/") {
      setLocation("/");
    }
  }, [location, setLocation]);

  const handleLogoutClick = useCallback(() => {
    window.location.href = '/api/logout';
  }, []);

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.profileImageUrl || undefined} alt={displayName} />
          <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
            {getInitials(user.firstName, user.lastName, user.email)}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:block">
          {user.firstName || "User"}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {user.email && (
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={handleHomeClick}>
          <Home className="mr-2 h-4 w-4" />
          <span>Home</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
          onClick={handleLogoutClick}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

UserProfileMenu.displayName = 'UserProfileMenu';