import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import CropDetail from "@/pages/crop-detail";
import Login from "@/pages/login";
import AuthGuard from "@/components/auth-guard";
import NotFound from "@/pages/not-found";
import GrowAreasPage from "@/pages/grow-areas";

// Add authorization header to all requests
queryClient.setDefaultOptions({
  queries: {
    ...queryClient.getDefaultOptions().queries,
    queryFn: async ({ queryKey }) => {
      const sessionToken = localStorage.getItem('growtrack_session');
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        headers: sessionToken ? {
          'Authorization': `Bearer ${sessionToken}`
        } : {},
      });

      if (res.status === 401) {
        localStorage.removeItem('growtrack_session');
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }

      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }

      return await res.json();
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/crop/:id" component={CropDetail} />
      <Route path="/grow-areas">
        <AuthGuard>
          <GrowAreasPage />
        </AuthGuard>
      </Route>
      <Route path="/">
        <AuthGuard>
          <Dashboard />
        </AuthGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
