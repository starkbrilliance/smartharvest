import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [, setLocation] = useLocation();
  
  const sessionToken = localStorage.getItem('growtrack_session');
  
  useEffect(() => {
    if (!sessionToken) {
      setLocation('/login');
    }
  }, [sessionToken, setLocation]);

  if (!sessionToken) {
    return null;
  }

  return <>{children}</>;
}
