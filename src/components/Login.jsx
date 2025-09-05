import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';

const Login = () => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState(localStorage.getItem('email') || '');
  const [password, setPassword] = useState(localStorage.getItem('password') || '');
  const [fullName, setFullName] = useState(localStorage.getItem('full_name') || '');
  const [phone, setPhone] = useState(localStorage.getItem('phone_number') || '');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveCredentials, setSaveCredentials] = useState(localStorage.getItem('save_credentials') === 'true');
  const [showResendButton, setShowResendButton] = useState(false);

  const validateEmail = (email) => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
  const validatePhone = (phone) => /^\+?[1-9]\d{1,14}$/.test(phone);

  const resendConfirmationEmail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await supabase.auth.resend({ type: 'signup', email });
      setError(t('success-email-resent'));
    } catch (err) {
      setError(t('error-resend-email-failed') + ' ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToStorage = () => {
    if (saveCredentials) {
      localStorage.setItem('email', email);
      localStorage.setItem('password', password);
      localStorage.setItem('full_name', fullName);
      localStorage.setItem('phone_number', phone);
      localStorage.setItem('save_credentials', 'true');
    } else {
      localStorage.removeItem('email');
      localStorage.removeItem('password');
      localStorage.removeItem('full_name');
      localStorage.removeItem('phone_number');
      localStorage.setItem('save_credentials', 'false');
    }
  };

  const register = async () => {
    if (!validateEmail(email)) return setError(t('error-invalid-email'));
    if (password.length < 6) return setError(t('error-password-too-short'));
    if (!fullName) return setError(t('error-full-name-required'));
    if (!validatePhone(phone)) return setError(t('error-invalid-phone'));

    setIsLoading(true);
    setError(null);
    setShowResendButton(false);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phone,
            language: i18n.language,
            track_color: '#000000',
            role: 'searcher'
          }
        }
      });
      
      if (authError) throw authError;
      
      if (data.user) {
      // Felhasználó létrehozása a users táblában
      const { error: userError } = await supabase.from('users').insert({
        id: data.user.id,
        email: email,
        full_name: fullName,
        phone_number: phone,
        role: 'searcher',
        active: true
      });

      if (userError) throw userError;
      
      saveToStorage();
      setError(t('error-email-confirmation-required'));
      setShowResendButton(true);
    }
  } catch (err) {
    setError(t('error-registration-error') + ' ' + err.message);
  } finally {
    setIsLoading(false);
  }
};

  const login = async () => {
    if (!validateEmail(email)) return setError(t('error-invalid-email'));
    if (!password) return setError(t('error-password-required'));

    setIsLoading(true);
    setError(null);
    setShowResendButton(false);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      saveToStorage();
    } catch (err) {
      if (err.message.includes('Email not confirmed')) {
        setError(t('error-email-not-confirmed'));
        setShowResendButton(true);
      } else {
        setError(t('error-login-error') + ' ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px' }}>
      <h2>{t('login-header')}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form>
        <label>{t('login-email')}</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>{t('login-password')}</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <label>{t('login-full-name')}</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <label>{t('login-phone-number')}</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <label>
          <input type="checkbox" checked={saveCredentials} onChange={(e) => setSaveCredentials(e.target.checked)} />
          {t('login-save-credentials')}
        </label>
        <button type="button" onClick={register} disabled={isLoading}>{t('login-register')}</button>
        <button type="button" onClick={login} disabled={isLoading}>{t('login-login')}</button>
        {showResendButton && <button type="button" onClick={resendConfirmationEmail} disabled={isLoading}>{t('login-resend-email')}</button>}
      </form>
      {isLoading && <p>Loading...</p>}
    </div>
  );
};

export default Login;