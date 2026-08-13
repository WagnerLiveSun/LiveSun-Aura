import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  // Redirect to login page when user is not authenticated
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      // Clear the session storage
      try {
        sessionStorage.removeItem("session-storage");
      } catch {}
      utils.auth.me.setData(undefined, null);
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    // PRIORIDADE 1: Ler do localStorage (persiste across reloads)
    let storedUser: typeof meQuery.data = null;
    try {
      storedUser = JSON.parse(
        localStorage.getItem("app-runtime-user-info") ?? "null"
      ) as typeof meQuery.data;
    } catch {
      // JSON corrompido no localStorage - ignorar e usar a query
      storedUser = null;
    }

    // PRIORIDADE 2: Usar dados da query TrPC como fonte de verdade
    // Mas apenas se nao houver dados stored (evita overwrite em cada focus)
    const user = storedUser !== null ? storedUser : meQuery.data ?? null;

    // Sincronizar localStorage com dados atuais da query APENAS quando user vem da query
    // Isso evita loop de setItem a cada focus
    if (storedUser === null && meQuery.data !== null) {
      localStorage.setItem(
        "app-runtime-user-info",
        JSON.stringify(meQuery.data)
      );
    }

    return {
      user,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(user ?? meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    localStorage.getItem("app-runtime-user-info"),
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;

    // Redirect to login page
    if (redirectPath) {
      window.location.href = redirectPath;
    } else {
      window.location.href = "/entrar";
    }
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
