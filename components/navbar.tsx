"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Car, Home, LayoutDashboard, LogIn, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isAuthPage) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <Car className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-xl hidden sm:block">ParkEasy</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/">
            <Button
              variant={pathname === "/" ? "default" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </Link>

          {!isLoading && (
            <>
              {user ? (
                <>
                  <Link href="/dashboard">
                    <Button
                      variant={pathname === "/dashboard" ? "default" : "ghost"}
                      size="sm"
                      className="gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <User className="w-4 h-4" />
                        <span className="hidden sm:inline">{user.name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem disabled className="text-muted-foreground">
                        {user.email}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout} className="text-destructive">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Link href="/login">
                  <Button size="sm" className="gap-2">
                    <LogIn className="w-4 h-4" />
                    <span className="hidden sm:inline">Login</span>
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
