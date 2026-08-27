import { useState } from "react";
import { signIn } from "../auth/entra";

export function Login() {
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    await signIn(); // Microsoft 로그인 화면으로 이동 (회원가입/비밀번호 찾기 링크 포함)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo-layout.png" alt="로고" className="w-48 h-48 object-contain mx-auto mb-2" />
          <p className="text-gray-500 text-sm mt-1">영양제 추천 서비스</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">로그인</h2>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors text-sm"
          >
            {loading ? "이동 중..." : "이메일로 로그인 / 회원가입"}
          </button>
        </div>
      </div>
    </div>
  );
}
