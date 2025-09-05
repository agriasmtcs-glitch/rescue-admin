import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';

const UserManagement = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('searcher');
  const [active, setActive] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState(null); // Track which row is being edited
  const [editValues, setEditValues] = useState({}); // Store temporary edit values

  useEffect(() => {
    checkCurrentUserRole();
  }, []);

  const checkCurrentUserRole = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const role = user.user_metadata?.role;
    setCurrentUserRole(role);
    if (['admin', 'coordinator'].includes(role)) {
      loadUsers();
    }
  }
  setLoading(false);
};

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    if (!['admin', 'coordinator'].includes(currentUserRole)) {
      alert(t('permission-denied'));
      return;
    }
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone_number: phone, role }
        }
      });
      if (authError) throw authError;
      const { error } = await supabase.from('users').insert({
        id: authData.user.id,
        full_name: fullName,
        phone_number: phone,
        role,
        email,
        active
      });
      if (error) throw error;
      alert(t('user-create-success'));
      loadUsers();
      resetForm();
    } catch (err) {
      alert(`${t('user-create-fail')} ${err.message}`);
    }
  };

  const updateUser = async (e) => {
    e.preventDefault();
    if (!['admin', 'coordinator'].includes(currentUserRole)) {
      alert(t('permission-denied'));
      return;
    }
    try {
      const updates = { full_name: fullName, phone_number: phone, role, active };
      if (password) {
        const { error: pwError } = await supabase.auth.updateUser({ password });
        if (pwError) throw pwError;
      }
      const { error } = await supabase.from('users').update(updates).eq('id', selectedUser.id);
      if (error) throw error;
      alert(t('user-update-success'));
      loadUsers();
      resetForm();
    } catch (err) {
      alert(`${t('user-update-fail')} ${err.message}`);
    }
  };

  const updateUserInline = async (userId) => {
    if (!['admin', 'coordinator'].includes(currentUserRole)) {
      alert(t('permission-denied'));
      return;
    }
    try {
      const updates = {
        full_name: editValues[userId]?.full_name || users.find(u => u.id === userId).full_name,
        phone_number: editValues[userId]?.phone_number || users.find(u => u.id === userId).phone_number,
        role: editValues[userId]?.role || users.find(u => u.id === userId).role,
        active: editValues[userId]?.active ?? users.find(u => u.id === userId).active
      };
      const { error } = await supabase.from('users').update(updates).eq('id', userId);
      if (error) throw error;
      alert(t('user-update-success'));
      loadUsers();
      setEditingRow(null); // Exit edit mode
      setEditValues(prev => {
        const newValues = { ...prev };
        delete newValues[userId];
        return newValues;
      });
    } catch (err) {
      alert(`${t('user-update-fail')} ${err.message}`);
    }
  };

  const deleteUser = async (id) => {
    if (!['admin', 'coordinator'].includes(currentUserRole)) {
      alert(t('permission-denied'));
      return;
    }
    if (window.confirm(t('confirm-delete'))) {
      try {
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) throw error;
        alert(t('user-delete-success'));
        loadUsers();
      } catch (err) {
        alert(`${t('user-delete-fail')} ${err.message}`);
      }
    }
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setFullName(user.full_name);
    setPhone(user.phone_number);
    setEmail(user.email);
    setRole(user.role);
    setActive(user.active);
    setPassword('');
  };

  const resetForm = () => {
    setSelectedUser(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setRole('searcher');
    setActive(true);
  };

  const startEditing = (user) => {
    setEditingRow(user.id);
    setEditValues({
      ...editValues,
      [user.id]: {
        full_name: user.full_name,
        phone_number: user.phone_number,
        role: user.role,
        active: user.active
      }
    });
  };

  const handleEditChange = (userId, field, value) => {
    setEditValues({
      ...editValues,
      [userId]: {
        ...editValues[userId],
        [field]: value
      }
    });
  };

  if (loading) {
    return <div>{t('loading')}</div>;
  }

  if (!['admin', 'coordinator'].includes(currentUserRole)) {
    return <p>{t('permission-denied')}</p>;
  }

  return (
    <section>
      <h2>{t('users-manager-h2')}</h2>
      <table>
        <thead>
          <tr>
            <th>{t('user-table-id')}</th>
            <th>{t('user-table-email')}</th>
            <th>{t('user-table-fullname')}</th>
            <th>{t('user-table-phone')}</th>
            <th>{t('user-table-role')}</th>
            <th>{t('user-table-active')}</th>
            <th>{t('actions-label')}</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.email}</td>
              <td>
                {editingRow === user.id ? (
                  <input
                    value={editValues[user.id]?.full_name || user.full_name}
                    onChange={(e) => handleEditChange(user.id, 'full_name', e.target.value)}
                  />
                ) : (
                  user.full_name
                )}
              </td>
              <td>
                {editingRow === user.id ? (
                  <input
                    value={editValues[user.id]?.phone_number || user.phone_number}
                    onChange={(e) => handleEditChange(user.id, 'phone_number', e.target.value)}
                  />
                ) : (
                  user.phone_number
                )}
              </td>
              <td>
                {editingRow === user.id ? (
                  <select
                    value={editValues[user.id]?.role || user.role}
                    onChange={(e) => handleEditChange(user.id, 'role', e.target.value)}
                  >
                    <option value="searcher">{t('role-searcher')}</option>
                    <option value="coordinator">{t('role-coordinator')}</option>
                    <option value="admin">{t('role-admin')}</option>
                  </select>
                ) : (
                  user.role
                )}
              </td>
              <td>
                {editingRow === user.id ? (
                  <select
                    value={editValues[user.id]?.active ?? user.active}
                    onChange={(e) => handleEditChange(user.id, 'active', e.target.value === 'true')}
                  >
                    <option value={true}>{t('yes')}</option>
                    <option value={false}>{t('no')}</option>
                  </select>
                ) : (
                  user.active ? t('yes') : t('no')
                )}
              </td>
              <td>
                {editingRow === user.id ? (
                  <>
                    <button onClick={() => updateUserInline(user.id)}>{t('save-btn')}</button>
                    <button onClick={() => setEditingRow(null)}>{t('cancel-btn')}</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEditing(user)}>{t('edit-btn')}</button>
                    <button onClick={() => selectUser(user)}>{t('update-user-btn')}</button>
                    <button className="delete-btn" onClick={() => deleteUser(user.id)}>{t('discard-btn')}</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>{selectedUser ? t('update-user-h3') : t('create-user-h3')}</h3>
      <form onSubmit={selectedUser ? updateUser : createUser}>
        <label>{t('full-name-label')}</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <label>{t('phone-label')}</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <label>{t('email-label')}</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required={!selectedUser} disabled={!!selectedUser} />
        <label>{t('password-label')}</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!selectedUser} />
        <label>{t('role-label')}</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="searcher">{t('role-searcher')}</option>
          <option value="coordinator">{t('role-coordinator')}</option>
          <option value="admin">{t('role-admin')}</option>
        </select>
        <label>{t('active-label')}</label>
        <select value={active} onChange={(e) => setActive(e.target.value === 'true')}>
          <option value={true}>{t('yes')}</option>
          <option value={false}>{t('no')}</option>
        </select>
        <button type="submit">{selectedUser ? t('update-user-btn') : t('create-user-btn')}</button>
        {selectedUser && <button type="button" onClick={resetForm}>{t('cancel-btn')}</button>}
      </form>
    </section>
  );
};

export default UserManagement;