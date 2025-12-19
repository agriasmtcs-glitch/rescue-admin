import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';

const HelpEditor = () => {
  const { t } = useTranslation();
  const [helpItems, setHelpItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [textHu, setTextHu] = useState('');
  const [textEn, setTextEn] = useState('');
  const [textSk, setTextSk] = useState('');
  const [textRo, setTextRo] = useState('');
  const [textPl, setTextPl] = useState('');
  const [textUk, setTextUk] = useState(''); // Új: Ukrán állapot
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    loadHelp();
    checkCurrentUserRole();
  }, []);

  const checkCurrentUserRole = async () => {
    try {
      setLoadingRole(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Ellenőrizzük a users táblában a szerepkört
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (data) {
          setCurrentUserRole(data.role);
        }
      }
    } catch (err) {
      console.error('Error fetching user role:', err.message);
    } finally {
      setLoadingRole(false);
    }
  };

  const loadHelp = async () => {
    try {
      const { data, error } = await supabase.from('help_content').select('*').order('section', { ascending: true });
      if (error) throw error;
      console.log('Loaded help content:', data);
      setHelpItems(data || []);
    } catch (err) {
      console.error('Error loading help content:', err);
    }
  };

  const createHelp = async (e) => {
    e.preventDefault();
    if (!['admin', 'coordinator'].includes(currentUserRole)) {
      alert(t('permission-denied'));
      return;
    }
    try {
      // Új szakasz nevének generálása vagy bekérése (egyszerűsítve)
      const sectionName = prompt("Add meg a szakasz nevét (pl. 'intro'):");
      if (!sectionName) return;

      const { error } = await supabase.from('help_content').insert({
        section: sectionName,
        text_hu: textHu,
        text_en: textEn,
        text_sk: textSk,
        text_ro: textRo,
        text_pl: textPl,
        text_uk: textUk // Új: Ukrán mentése
      });
      if (error) throw error;
      alert(t('help-create-success'));
      loadHelp();
      resetForm();
    } catch (err) {
      console.error('Error creating help entry:', err);
      alert(`${t('help-create-fail')} ${err.message}`);
    }
  };

  const updateHelp = async (e) => {
    e.preventDefault();
    if (!['admin', 'coordinator'].includes(currentUserRole)) {
      alert(t('permission-denied'));
      return;
    }
    try {
      const { error } = await supabase
        .from('help_content')
        .update({
          text_hu: textHu,
          text_en: textEn,
          text_sk: textSk,
          text_ro: textRo,
          text_pl: textPl,
          text_uk: textUk // Új: Ukrán frissítése
        })
        .eq('id', selectedItem.id);
      if (error) throw error;
      alert(t('help-update-success'));
      loadHelp();
      resetForm();
    } catch (err) {
      console.error('Error updating help entry:', err);
      alert(`${t('help-update-fail')} ${err.message}`);
    }
  };

  const deleteHelp = async (id) => {
    if (!['admin', 'coordinator'].includes(currentUserRole)) {
      alert(t('permission-denied'));
      return;
    }
    if (window.confirm(t('confirm-delete'))) {
      try {
        const { error } = await supabase.from('help_content').delete().eq('id', id);
        if (error) throw error;
        alert(t('help-delete-success'));
        loadHelp();
        resetForm();
      } catch (err) {
        console.error('Error deleting help entry:', err);
        alert(`${t('help-delete-fail')} ${err.message}`);
      }
    }
  };

  const selectItem = (item) => {
    setSelectedItem(item);
    setTextHu(item.text_hu || '');
    setTextEn(item.text_en || '');
    setTextSk(item.text_sk || '');
    setTextRo(item.text_ro || '');
    setTextPl(item.text_pl || '');
    setTextUk(item.text_uk || ''); // Új: Ukrán betöltése
  };

  const resetForm = () => {
    setSelectedItem(null);
    setTextHu('');
    setTextEn('');
    setTextSk('');
    setTextRo('');
    setTextPl('');
    setTextUk(''); // Új: Ukrán reset
  };

  if (loadingRole) return <div>{t('loading')}</div>;

  return (
    <section style={{ padding: '20px' }}>
      <h2>{t('help-editor-h2')}</h2>
      
      {['admin', 'coordinator'].includes(currentUserRole) ? (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>{t('help-table-section')}</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>{t('help-table-text-hu')}</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>{t('actions-label')}</th>
              </tr>
            </thead>
            <tbody>
              {helpItems.map((item) => (
                <tr key={item.id}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.section}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {item.text_hu ? item.text_hu.substring(0, 50) + '...' : ''}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <button 
                      style={{ marginRight: '5px', backgroundColor: '#ffc107', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' }}
                      onClick={() => selectItem(item)}
                    >
                      {t('edit-btn')}
                    </button>
                    <button 
                      style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' }}
                      onClick={() => deleteHelp(item.id)}
                    >
                      {t('delete-help-btn')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <form onSubmit={selectedItem ? updateHelp : createHelp} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '600px' }}>
            <div style={{ padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
              {selectedItem && <p><strong>Szerkesztés: {selectedItem.section}</strong></p>}
              
              <label style={{ fontWeight: 'bold', display: 'block', marginTop: '10px' }}>{t('text-hu-label')}</label>
              <textarea style={{ width: '100%', minHeight: '60px' }} value={textHu} onChange={(e) => setTextHu(e.target.value)} />
              
              <label style={{ fontWeight: 'bold', display: 'block', marginTop: '10px' }}>{t('text-en-label')}</label>
              <textarea style={{ width: '100%', minHeight: '60px' }} value={textEn} onChange={(e) => setTextEn(e.target.value)} />
              
              <label style={{ fontWeight: 'bold', display: 'block', marginTop: '10px' }}>{t('text-sk-label')}</label>
              <textarea style={{ width: '100%', minHeight: '60px' }} value={textSk} onChange={(e) => setTextSk(e.target.value)} />
              
              <label style={{ fontWeight: 'bold', display: 'block', marginTop: '10px' }}>{t('text-ro-label')}</label>
              <textarea style={{ width: '100%', minHeight: '60px' }} value={textRo} onChange={(e) => setTextRo(e.target.value)} />
              
              <label style={{ fontWeight: 'bold', display: 'block', marginTop: '10px' }}>{t('text-pl-label')}</label>
              <textarea style={{ width: '100%', minHeight: '60px' }} value={textPl} onChange={(e) => setTextPl(e.target.value)} />

              {/* ÚJ: Ukrán beviteli mező */}
              <label style={{ fontWeight: 'bold', display: 'block', marginTop: '10px' }}>Text UK (Ukrán):</label>
              <textarea style={{ width: '100%', minHeight: '60px' }} value={textUk} onChange={(e) => setTextUk(e.target.value)} />
            </div>
            
            <div style={{ marginTop: '10px' }}>
              <button 
                type="submit" 
                disabled={loadingRole}
                style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}
              >
                {selectedItem ? t('update-help-btn') : t('create-help-btn')}
              </button>
              
              {selectedItem && (
                <button 
                  type="button" 
                  onClick={resetForm}
                  style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  {t('cancel-btn')}
                </button>
              )}
            </div>
          </form>
        </>
      ) : (
        <p style={{ color: 'red' }}>{t('permission-denied')}</p>
      )}
    </section>
  );
};

export default HelpEditor;