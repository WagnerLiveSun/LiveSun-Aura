import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import RegisterClient from "./pages/RegisterClient";
import ClientAnamnese from "./pages/ClientAnamnese";
import ClientScheduling from "./pages/ClientScheduling";
import ClientDashboard from "./pages/ClientDashboard";
import ClientHistory from "./pages/ClientHistory";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/entrar"} component={Login} />
      <Route path={"/esqueci-senha"} component={ForgotPassword} />
      <Route path={"/redefinir-senha"} component={ResetPassword} />
      <Route path={"/cadastrar"} component={RegisterClient} />
      <Route path={"/cliente-dashboard"} component={ClientDashboard} />
      <Route path={"/cliente-anamnese"} component={ClientAnamnese} />
      <Route path={"/cliente-agendamento"} component={ClientScheduling} />
      <Route path={"/cliente-historico"} component={ClientHistory} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
