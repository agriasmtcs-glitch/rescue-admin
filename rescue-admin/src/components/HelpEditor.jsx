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
      const role = user.user_metadata?.role;
      setCurrentUserRole(role);
    }
  } catch (err) {
    console.error('Error fetching user role:', err.message);
  } finally {
    setLoadingRole(false);
  }
};

  const loadHelp = async () => {
    try {
      const { data, error } = await supabase.from('help_content').select('*');
      if (error) throw error;
      console.log('Loaded help content:', data);
      setHelpItems(data || []);
    } catch (err) {
      console.error('Error loading help content:', err);
      alert(t('error-loading-help') + ': ' + err.message);
    }
  };

  const createHelp = async (e) => {
    e.preventDefault();
    
    if (!['admin', 'coordinator'].includes(currentUserRole)) {
      alert(t('permission-denied'));
      return;
    }

    if (loadingRole) {
      alert(t('loading-role-please-wait'));
      return;
    }

    try {
      const helpData = {
        text_hu: textHu || null,
        text_en: textEn || null,
        text_sk: textSk || null,
        text_ro: textRo || null,
        text_pl: textPl || null
      };
      console.log('Inserting help content:', helpData);
      const { data, error } = await supabase.from('help_content').insert(helpData).select();
      if (error) throw error;
      console.log('Insert successful, returned data:', data);
      alert(t('help-create-success'));
      loadHelp();
      resetForm();
    } catch (err) {
      console.error('Error inserting help content:', err);
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
      const helpData = {
        text_hu: textHu,
        text_en: textEn,
        text_sk: textSk,
        text_ro: textRo,
        text_pl: textPl
      };
      console.log('Updating help content:', helpData, 'ID:', selectedItem.id);
      const { data, error } = await supabase.from('help_content').update(helpData).eq('id', selectedItem.id).select();
      if (error) throw error;
      console.log('Update successful, returned data:', data);
      alert(t('help-update-success'));
      loadHelp();
      resetForm();
    } catch (err) {
      console.error('Error updating help content:', err);
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
        console.log('Deleting help content, ID:', id);
        const { error } = await supabase.from('help_content').delete().eq('id', id);
        if (error) throw error;
        alert(t('help-delete-success'));
        loadHelp();
      } catch (err) {
        console.error('Error deleting help content:', err);
        alert(`${t('help-delete-fail')} ${err.message}`);
      }
    }
  };

  const selectItem = (item) => {
    setSelectedItem(item);
    setTextHu(item.text_hu);
    setTextEn(item.text_en);
    setTextSk(item.text_sk);
    setTextRo(item.text_ro);
    setTextPl(item.text_pl);
  };

  const resetForm = () => {
    setSelectedItem(null);
    setTextHu('');
    setTextEn('');
    setTextSk('');
    setTextRo('');
    setTextPl('');
  };

  return (
    <section>
      <h2>{t('help-editor-h2')}</h2>
      
      {loadingRole ? (
        <p>{t('loading-role-please-wait')}</p>
      ) : ['admin', 'coordinator'].includes(currentUserRole) ? (
        <>
          <table>
            <thead>
              <tr>
                <th>{t('help-table-text-hu')}</th>
                <th>{t('actions-label')}</th>
              </tr>
            </thead>
            <tbody>
              {helpItems.map(item => (
                <tr key={item.id}>
                  <td>{item.text_hu}</td>
                  <td>
                    <button onClick={() => selectItem(item)}>{t('update-help-btn')}</button>
                    <button className="delete-btn" onClick={() => deleteHelp(item.id)}>{t('delete-help-btn')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <form onSubmit={selectedItem ? updateHelp : createHelp}>
            <label>{t('text-hu-label')}</label>
            <textarea value={textHu} onChange={(e) => setTextHu(e.target.value)} />
            
            <label>{t('text-en-label')}</label>
            <textarea value={textEn} onChange={(e) => setTextEn(e.target.value)} />
            
            <label>{t('text-sk-label')}</label>
            <textarea value={textSk} onChange={(e) => setTextSk(e.target.value)} />
            
            <label>{t('text-ro-label')}</label>
            <textarea value={textRo} onChange={(e) => setTextRo(e.target.value)} />
            
            <label>{t('text-pl-label')}</label>
            <textarea value={textPl} onChange={(e) => setTextPl(e.target.value)} />
            
            <button type="submit" disabled={loadingRole}>
              {selectedItem ? t('update-help-btn') : t('create-help-btn')}
            </button>
            
            {selectedItem && (
              <button type="button" onClick={resetForm}>{t('cancel-btn')}</button>
            )}
          </form>
        </>
      ) : (
        <p>{t('permission-denied')}</p>
      )}
    </section>
  );
};

export default HelpEditor;