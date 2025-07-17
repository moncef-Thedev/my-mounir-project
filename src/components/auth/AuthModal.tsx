import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  });

  const { signIn, signUp, resetPassword, loading } = useAuth();
  const { t, isRTL } = useLanguage();

  // Update mode when initialMode changes
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      resetForm();
    }
  }, [isOpen, initialMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'register') {
      if (formData.password !== formData.confirmPassword) {
        return;
      }
      const result = await signUp(formData.email, formData.password, formData.fullName);
      if (result.success) {
        onClose();
      }
    } else if (mode === 'login') {
      const result = await signIn(formData.email, formData.password);
      if (result.success) {
        onClose();
      }
    } else if (mode === 'reset') {
      const result = await resetPassword(formData.email);
      if (result.success) {
        setMode('login');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      fullName: '',
      confirmPassword: ''
    });
    setShowPassword(false);
  };

  const switchMode = (newMode: 'login' | 'register' | 'reset') => {
    setMode(newMode);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'login' && t('auth.login')}
            {mode === 'register' && t('auth.register')}
            {mode === 'reset' && t('auth.reset_password')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.full_name')}
              </label>
              <div className="relative">
                <User className={`absolute top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className={`w-full py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                  placeholder={t('auth.full_name')}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.email')}
            </label>
            <div className="relative">
              <Mail className={`absolute top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className={`w-full py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                placeholder={t('auth.email')}
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className={`absolute top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className={`w-full py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isRTL ? 'pr-10 pl-12' : 'pl-10 pr-12'}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ${isRTL ? 'left-3' : 'right-3'}`}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.confirm_password')}
              </label>
              <div className="relative">
                <Lock className={`absolute top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className={`w-full py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                  placeholder="••••••••"
                />
              </div>
              {formData.password !== formData.confirmPassword && formData.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{t('auth.passwords_dont_match')}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('common.loading') : (
              <>
                {mode === 'login' && t('auth.sign_in')}
                {mode === 'register' && t('auth.sign_up')}
                {mode === 'reset' && t('auth.send_reset_link')}
              </>
            )}
          </button>
        </form>

        <div className="px-6 pb-6 space-y-3">
          {mode === 'login' && (
            <>
              <button
                onClick={() => switchMode('reset')}
                className="w-full text-blue-700 hover:text-blue-800 text-sm"
              >
                {t('auth.forgot_password')}
              </button>
              <div className="text-center text-sm text-gray-600">
                {t('auth.no_account')}{' '}
                <button
                  onClick={() => switchMode('register')}
                  className="text-blue-700 hover:text-blue-800 font-medium"
                >
                  {t('auth.register')}
                </button>
              </div>
            </>
          )}

          {mode === 'register' && (
            <div className="text-center text-sm text-gray-600">
              {t('auth.have_account')}{' '}
              <button
                onClick={() => switchMode('login')}
                className="text-blue-700 hover:text-blue-800 font-medium"
              >
                {t('auth.login')}
              </button>
            </div>
          )}

          {mode === 'reset' && (
            <div className="text-center text-sm text-gray-600">
              <button
                onClick={() => switchMode('login')}
                className="text-blue-700 hover:text-blue-800 font-medium"
              >
                {t('auth.back_to_login')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;