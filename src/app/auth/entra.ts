import { PublicClientApplication, type AccountInfo } from "@azure/msal-browser";

// Entra External ID는 authority의 서브도메인이 known authority 목록에
// 명시돼있어야 리다이렉트를 신뢰함 (그냥 authority만 넣으면 안 됨)
const authority = import.meta.env.VITE_ENTRA_AUTHORITY as string;

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID as string,
    authority,
    knownAuthorities: [new URL(authority).host],
    redirectUri: "/",
    postLogoutRedirectUri: "/login",
  },
  cache: {
    cacheLocation: "localStorage",
  },
});

const scopes = ["openid", "profile", "email"];

let initialized: Promise<void> | null = null;
function ensureInitialized(): Promise<void> {
  if (!initialized) initialized = msalInstance.initialize();
  return initialized;
}

// 앱 시작 시 1회 호출. 로그인 리다이렉트 후 돌아온 경우 그 결과를 처리해서
// 활성 계정으로 등록하고, 아니면 이미 저장된 세션이 있는지 확인함.
export async function handleRedirect(): Promise<AccountInfo | null> {
  await ensureInitialized();
  const result = await msalInstance.handleRedirectPromise();
  // TODO(debug): 로그인 흐름 원인 파악되면 이 로그 제거
  console.log("[entra] handleRedirectPromise result:", result);
  console.log("[entra] current URL at check time:", window.location.href);
  if (result?.account) {
    msalInstance.setActiveAccount(result.account);
    return result.account;
  }
  const existing = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0] ?? null;
  console.log("[entra] fallback existing account:", existing, "all accounts:", msalInstance.getAllAccounts());
  if (existing) msalInstance.setActiveAccount(existing);
  return existing;
}

// Microsoft가 호스팅하는 로그인 화면으로 이동. 신규 사용자를 위한 "회원가입" /
// "비밀번호를 잊으셨나요" 링크도 그 화면 안에 이미 포함되어 있음 (User Flow 설정에서 켜짐).
export async function signIn(): Promise<void> {
  await ensureInitialized();
  await msalInstance.loginRedirect({ scopes });
}

export async function signOut(): Promise<void> {
  await ensureInitialized();
  await msalInstance.logoutRedirect();
}

// api.ts가 매 요청 전에 호출해서 항상 유효한 ID 토큰을 확보하는 용도.
// 세션이 없거나 만료되어 갱신 불가하면 null.
export async function getIdToken(): Promise<string | null> {
  await ensureInitialized();
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];
  if (!account) return null;
  try {
    const result = await msalInstance.acquireTokenSilent({ scopes, account });
    return result.idToken;
  } catch {
    return null;
  }
}
