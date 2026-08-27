import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import type { AccountInfo } from "@azure/msal-browser";
import { handleRedirect, signOut as entraSignOut } from "./entra";
import { setCognitoId, clearAuth } from "../api";

interface AuthUser {
  cognitoId: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function toAuthUser(account: AccountInfo): AuthUser {
  const claims = (account.idTokenClaims ?? {}) as Record<string, unknown>;
  const emails = claims.emails as string[] | undefined;
  return {
    // Entra는 sub 대신 oid(테넌트 내 고정 사용자 식별자)를 쓰는 게 표준.
    // 기존 백엔드/DB가 이 값을 "cognito_id"라는 이름으로 계속 쓰고 있어서
    // 필드명은 그대로 두고, 값의 출처만 Entra로 바뀐 것.
    cognitoId: (claims.oid as string) ?? (claims.sub as string) ?? account.homeAccountId,
    email: emails?.[0] ?? (claims.email as string) ?? account.username,
    name: (claims.name as string) ?? undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 로그인 리다이렉트로 돌아온 직후거나, 이미 로그인된 세션이 있는 경우 둘 다 여기서 처리됨
  useEffect(() => {
    handleRedirect()
      .then((account) => {
        if (!account) return;
        const claims = (account.idTokenClaims ?? {}) as Record<string, unknown>;
        if (claims.iat) localStorage.setItem("last_login_at", String(claims.iat));

        const authUser = toAuthUser(account);
        setCognitoId(authUser.cognitoId);
        setUser(authUser);
      })
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    clearAuth();
    setUser(null);
    entraSignOut(); // Microsoft 로그아웃 페이지로 리다이렉트됨
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
