import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { SliderCaptcha } from '../../components/Common/SliderCaptcha';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [err, setErr] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');

    if (!showCaptcha) {
      setShowCaptcha(true);
      return;
    }

    if (!captchaToken) {
      setErr('请完成滑块验证');
      return;
    }

    try {
      const { user } = await login(email, password, captchaToken);
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (e: any) {
      setErr(e.response?.data?.error || '登录失败');
      setCaptchaToken('');
      setShowCaptcha(false);
    }
  };

  const handleCaptchaSuccess = (token: string) => {
    setCaptchaToken(token);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl p-xl">
        <div className="text-center mb-lg">
          <div className="w-12 h-12 mx-auto rounded-xl bg-primary-container flex items-center justify-center mb-md">
            <span className="material-symbols-outlined text-on-primary-container">description</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface">项目日报系统</h1>
          <p className="text-on-surface-variant mt-1">登录以管理您的日报</p>
        </div>

        {err && (
          <div className="bg-error-container text-on-error-container px-md py-sm rounded-lg mb-md text-sm">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              placeholder="请输入邮箱"
              required
            />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => {
                if (!showCaptcha && email && password) setShowCaptcha(true);
              }}
              className="w-full border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              placeholder="请输入密码"
              required
            />
          </div>

          {showCaptcha && (
            <div className="flex justify-center">
              <SliderCaptcha onSuccess={handleCaptchaSuccess} />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-primary text-on-primary h-10 rounded font-medium hover:bg-inverse-surface transition-colors disabled:opacity-50"
            disabled={showCaptcha && !captchaToken}
          >
            {showCaptcha ? '登录' : '下一步'}
          </button>
        </form>

        <div className="mt-lg p-md bg-surface-container rounded-lg text-xs text-on-surface-variant">
          <div className="font-semibold mb-1">测试账号：</div>
          <div>管理员：admin@example.com / Admin@123</div>
          <div>负责人：zhang@example.com / Test@123</div>
          <div>成员：wang@example.com / Test@123</div>
        </div>
      </div>
    </div>
  );
}
