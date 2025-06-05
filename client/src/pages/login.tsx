import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sprout } from "lucide-react";

export default function Login() {
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiRequest("POST", "/api/auth/login", { password });
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('growtrack_session', data.sessionToken);
      setLocation('/');
      toast({
        title: "Welcome to GrowTrack",
        description: "Successfully authenticated",
      });
    },
    onError: () => {
      toast({
        title: "Authentication Failed",
        description: "Invalid password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      loginMutation.mutate(password);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8">
          <div className="text-center mb-6">
            <Sprout className="text-primary text-4xl mb-4 mx-auto h-12 w-12" />
            <h1 className="text-2xl font-bold text-gray-900">GrowTrack Access</h1>
            <p className="text-gray-600 mt-2">Enter shared password to continue</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Shared Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loginMutation.isPending}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-green-600 text-white"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Authenticating..." : "Access Farm"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
