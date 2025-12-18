import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';

const Login = () => {
  const { t } = useTranslation();
  
  // Csak a bejelentkezéshez szükséges állapotok maradtak
  const [email, setEmail] = useState(localStorage.getItem('email') || '');
  const [password, setPassword] = useState(localStorage.getItem('password') || '');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveCredentials, setSaveCredentials] = useState(localStorage.getItem('save_credentials') === 'true');
  const [showResendButton, setShowResendButton] = useState(false);

  const validateEmail = (email) => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);

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
      // Megjegyzés: Jelszót localStorage-ban tárolni nem a legbiztonságosabb, 
      // de a kényelmi funkció miatt meghagytam a kérésednek megfelelően.
      localStorage.setItem('password', password);
      localStorage.setItem('save_credentials', 'true');
    } else {
      localStorage.removeItem('email');
      localStorage.removeItem('password');
      localStorage.setItem('save_credentials', 'false');
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
      // Sikeres belépés esetén az App.jsx automatikusan átirányít
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
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '20px' }}>{t('login-header')}</h2>
      
      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '10px', 
          borderRadius: '5px', 
          marginBottom: '15px' 
        }}>
          {error}
        </div>
      )}
      
      <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t('login-email')}</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        
        <div style={{ textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t('login-password')}</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
          <input type="checkbox" checked={saveCredentials} onChange={(e) => setSaveCredentials(e.target.checked)} />
          {t('login-save-credentials')}
        </label>
        
        <button 
          type="button" 
          onClick={login} 
          disabled={isLoading}
          style={{
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          {isLoading ? 'Belépés folyamatban...' : t('login-login')}
        </button>

        {showResendButton && (
          <button 
            type="button" 
            onClick={resendConfirmationEmail} 
            disabled={isLoading}
            style={{
              padding: '8px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '5px'
            }}
          >
            {t('login-resend-email')}
          </button>
        )}
      </form>
    </div>
  );
};

export default Login;