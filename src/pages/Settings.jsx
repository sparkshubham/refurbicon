import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function SettingsPage() {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/settings').then((r) => setForm(r.data.data));
  }, []);

  async function save() {
    const { data } = await api.put('/settings', form);
    setForm(data.data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!form) return <div className="loading">Loading settings...</div>;

  return (
    <div className="card card-pad" style={{ maxWidth: 640 }}>
      <h3 className="section-title">Company Settings</h3>
      <p className="section-sub">Configure organization defaults</p>
      {['companyName', 'companyEmail', 'companyPhone', 'companyAddress', 'currency', 'timezone'].map((k) => (
        <div className="form-group" key={k}>
          <label style={{ textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</label>
          <input className="input" value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
        </div>
      ))}
      <button className="btn btn-primary" onClick={save}>Save Settings</button>
      {saved && <span style={{ marginLeft: 12, color: 'var(--success)' }}>Saved</span>}
    </div>
  );
}
