'use client';

import { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { validateEmail, validateMobile, validateGSTIN, validatePincode, normalizeGSTIN } from '../../lib/validators';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState({
    businessName: '', ownerName: '', gstin: '', address: '',
    city: '', state: '', pincode: '', phone: '', email: '',
    upiId: '', bankName: '', accountNumber: '', ifscCode: '', accountHolder: '',
    logoBase64: '',
  });

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { window.location.href = '/login'; return; }
      setUser(currentUser);
      const snap = await getDoc(doc(db, 'profiles', currentUser.uid));
      if (snap.exists()) {
        const data = snap.data() as any;
        setProfile(data);
        if (data.logoBase64) setLogoPreview(data.logoBase64);
      }
    });
  }, []);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const fieldError = (name: string, value: string): string => {
    if (name === 'gstin') return validateGSTIN(value);
    if (name === 'phone') return validateMobile(value);
    if (name === 'email') return validateEmail(value);
    if (name === 'pincode') return validatePincode(value);
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
    const err = fieldError(name, value);
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) { alert('Logo must be under 500KB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setLogoPreview(base64);
      setProfile(prev => ({ ...prev, logoBase64: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {
      gstin: validateGSTIN(profile.gstin),
      phone: validateMobile(profile.phone),
      email: validateEmail(profile.email),
      pincode: validatePincode(profile.pincode),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setSaving(true);
    await setDoc(doc(db, 'profiles', user.uid), { ...profile, gstin: normalizeGSTIN(profile.gstin) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0f4ff; }
        .profile-root { display: flex; min-height: 100vh; font-family: 'DM Sans', sans-serif; }
        .sidebar { width: 240px; background: #0f1f5c; min-height: 100vh; display: flex; flex-direction: column; position: fixed; left: 0; top: 0; bottom: 0; z-index: 10; }
        .sidebar-logo { padding: 28px 24px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .sidebar-logo h1 { font-family: 'Lora', serif; font-size: 22px; color: #fff; font-weight: 600; }
        .sidebar-logo p { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px; letter-spacing: 0.5px; text-transform: uppercase; }
        .sidebar-nav { padding: 20px 12px; flex: 1; }
        .nav-label { font-size: 10px; color: rgba(255,255,255,0.3); letter-spacing: 1px; text-transform: uppercase; padding: 0 12px; margin-bottom: 8px; margin-top: 16px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; color: rgba(255,255,255,0.6); font-size: 13.5px; text-decoration: none; transition: all 0.15s; }
        .nav-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .nav-item.active { background: rgba(99,130,255,0.2); color: #fff; font-weight: 500; }
        .sidebar-footer { padding: 16px 12px; border-top: 1px solid rgba(255,255,255,0.08); }
        .user-chip { display: flex; align-items: center; gap: 10px; padding: 8px 12px; }
        .user-avatar { width: 32px; height: 32px; background: linear-gradient(135deg, #6382ff, #3b5bdb); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 600; flex-shrink: 0; }
        .user-email { font-size: 11.5px; color: rgba(255,255,255,0.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .main { margin-left: 240px; flex: 1; padding: 36px 40px; max-width: 860px; }
        .page-header { margin-bottom: 28px; }
        .page-header h2 { font-family: 'Lora', serif; font-size: 26px; color: #0f1f5c; font-weight: 600; }
        .page-header p { color: #6b7280; font-size: 14px; margin-top: 4px; }
        .card { background: #fff; border-radius: 12px; border: 1px solid #e5e9f5; overflow: hidden; margin-bottom: 20px; }
        .card-header { padding: 16px 24px; border-bottom: 1px solid #f0f4ff; display: flex; align-items: center; gap: 10px; }
        .card-header h3 { font-size: 14px; font-weight: 600; color: #0f1f5c; }
        .card-icon { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; }
        .card-body { padding: 20px 24px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-row.three { grid-template-columns: 1fr 1fr 1fr; }
        .form-row.single { grid-template-columns: 1fr; }
        .field { margin-bottom: 16px; }
        .field label { display: block; font-size: 12.5px; font-weight: 500; color: #374151; margin-bottom: 6px; }
        .field input { width: 100%; padding: 10px 14px; border: 1.5px solid #e5e9f5; border-radius: 8px; font-size: 14px; font-family: 'DM Sans', sans-serif; color: #111827; background: #fff; transition: border-color 0.15s; outline: none; }
        .field input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .field input.invalid { border-color: #dc2626; }
        .field-error { color: #dc2626; font-size: 12px; margin-top: 5px; }
        .logo-upload-area { border: 2px dashed #e5e9f5; border-radius: 10px; padding: 28px; text-align: center; cursor: pointer; transition: all 0.15s; }
        .logo-upload-area:hover { border-color: #2563eb; background: #f8faff; }
        .logo-preview { max-width: 160px; max-height: 70px; object-fit: contain; margin: 0 auto 12px; display: block; }
        .logo-upload-text { font-size: 13.5px; color: #374151; font-weight: 500; }
        .logo-upload-hint { font-size: 12px; color: #9ca3af; margin-top: 5px; }
        .logo-change-btn { font-size: 12.5px; color: #2563eb; margin-top: 10px; cursor: pointer; background: none; border: none; font-family: 'DM Sans', sans-serif; display: block; margin-left: auto; margin-right: auto; }
        .save-bar { display: flex; align-items: center; justify-content: space-between; background: #fff; border-radius: 12px; border: 1px solid #e5e9f5; padding: 16px 24px; }
        .save-hint { font-size: 13px; color: #9ca3af; }
        .btn-save { background: #2563eb; color: #fff; border: none; padding: 11px 28px; border-radius: 9px; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background 0.15s; }
        .btn-save:hover { background: #1d4ed8; }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-save.saved { background: #16a34a; }
      
        .field label { font-size: 13.5px; }
        .field input, .field textarea, .field select { font-size: 15px; }
        th { font-size: 12px; }
        td { font-size: 14px; }

        
        .menu-toggle { display: none; background: none; border: none; color: #ffffff; font-size: 30px; cursor: pointer; padding: 4px 8px; }
        @media (max-width: 768px) {
          .editor-root, .root, .profile-root { flex-direction: column !important; min-height: auto !important; }
          .editor-root, .root, .profile-root { flex-direction: column !important; min-height: auto !important; }
          .sidebar { width: 100% !important; min-height: auto !important; position: relative !important; flex-direction: row !important; flex-wrap: wrap !important; align-items: center; top: auto !important; bottom: auto !important; left: auto !important; height: auto !important; z-index: auto !important; }
          .sidebar-logo { padding: 14px 16px; border-bottom: none; }
          .sidebar-logo h1 { font-size: 18px; }
          .sidebar-logo p { display: none; }
          .sidebar-logo { display: flex !important; align-items: center; width: 100%; gap: 12px; padding: 12px 16px !important; }
          .sidebar-logo p { display: none; }
          .sidebar-logo img { height: 42px !important; }
          .menu-toggle { display: block !important; margin-left: auto; font-size: 32px; color: #ffffff !important; }
          .sidebar-nav { display: none !important; flex-direction: column; padding: 0 12px 12px; gap: 2px; width: 100%; }
          .sidebar-nav.nav-open { display: flex !important; }
          .nav-label { display: none; }
          .nav-item { padding: 12px 14px; font-size: 15px; white-space: nowrap; gap: 10px; }
          .nav-item svg { width: 14px; height: 14px; }
          .sidebar-footer { display: none; }
          .main { margin-left: 0 !important; padding: 16px !important; width: 100% !important; }
          .page-header { margin-bottom: 16px; }
          .page-header h2 { font-size: 22px; }
          .page-header p { font-size: 13px; }
          .editor-grid { grid-template-columns: 1fr; }
          .form-row { grid-template-columns: 1fr; }
          .summary-card { position: static; }
          .summary-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .stats-grid { grid-template-columns: 1fr; gap: 10px; }
          .content-grid { grid-template-columns: 1fr; }
          .controls { flex-direction: column; align-items: stretch; }
          .controls select, .controls button { width: 100%; }
          .card-body { padding: 16px; }
          .card-header { padding: 12px 16px; }
          table { font-size: 12px; }
          th { font-size: 10px; padding: 8px 10px; }
          td { font-size: 12.5px; padding: 10px; }
          .action-btns { gap: 8px; }
          .modal { width: 95vw; max-height: 90vh; overflow-y: auto; }
        }
      `}</style>

      <div className="profile-root">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <img src="/logo-white.svg" alt="Paavti" style={{ height: '38px' }} />
            <p>Business Manager</p>
            <button className="menu-toggle" onClick={() => setShowMenu(!showMenu)}>&#9776;</button>
          </div>
          <nav className={`sidebar-nav ${showMenu ? "nav-open" : ""}`}>
            <div className="nav-label">Main</div>
            <a href="/dashboard" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>Dashboard</a>
            <a href="/editor" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>New Invoice</a>
            <a href="/quote-editor" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>New Quote</a>
            <a href="/receipt-editor" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>New Receipt</a>
            <a href="/reports" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>Reports</a>
            <a href="/gstr1" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>GST Filing</a>
            <div className="nav-label">Documents</div>
            <a href="/dashboard" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>Invoices</a>
            <a href="/quotes" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Quotes</a>
            <a href="/expenses" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>Expenses</a>
            <a href="/clients" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Clients</a>
            <div className="nav-label">Settings</div>
            <a href="/profile" className="nav-item active"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Business Profile</a>
            <a href="/templates" className="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>Templates</a>
          </nav>
          <div className="sidebar-footer">
            <div className="user-chip">
              <div className="user-avatar">{user?.email?.[0]?.toUpperCase()}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
        </aside>

        <main className="main">
          <div className="page-header">
            <h2>Business Profile</h2>
            <p>This info auto-fills every invoice you create.</p>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-icon" style={{ background: '#eff6ff' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <h3>Business Logo</h3>
            </div>
            <div className="card-body">
              <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/png,image/jpeg,image/svg+xml" style={{ display: 'none' }} />
              <div className="logo-upload-area" onClick={() => fileInputRef.current?.click()}>
                {logoPreview ? (
                  <>
                    <img src={logoPreview} className="logo-preview" alt="Business logo" />
                    <button className="logo-change-btn" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                      Change logo
                    </button>
                  </>
                ) : (
                  <>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block' }}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <div className="logo-upload-text">Click to upload your business logo</div>
                    <div className="logo-upload-hint">PNG, JPG or SVG · Max 500KB · Appears on all invoices</div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-icon" style={{ background: '#eff6ff' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <h3>Business Details</h3>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="field"><label>Business Name</label><input name="businessName" value={profile.businessName} onChange={handleChange} placeholder="Acme Technologies Pvt Ltd" /></div>
                <div className="field"><label>Owner / Freelancer Name</label><input name="ownerName" value={profile.ownerName} onChange={handleChange} placeholder="Varun Thakkar" /></div>
              </div>
              <div className="form-row">
                <div className="field"><label>GSTIN</label><input name="gstin" value={profile.gstin} onChange={handleChange} placeholder="29AAABC1234D1Z5" className={errors.gstin ? 'invalid' : ''} />{errors.gstin && <div className="field-error">{errors.gstin}</div>}</div>
                <div className="field"><label>Phone</label><input name="phone" value={profile.phone} onChange={handleChange} placeholder="+91 98765 43210" className={errors.phone ? 'invalid' : ''} />{errors.phone && <div className="field-error">{errors.phone}</div>}</div>
              </div>
              <div className="form-row single">
                <div className="field"><label>Business Email</label><input name="email" value={profile.email} onChange={handleChange} placeholder="you@business.com" className={errors.email ? 'invalid' : ''} />{errors.email && <div className="field-error">{errors.email}</div>}</div>
              </div>
              <div className="form-row single">
                <div className="field"><label>Address</label><input name="address" value={profile.address} onChange={handleChange} placeholder="123, Street Name, Area" /></div>
              </div>
              <div className="form-row three">
                <div className="field"><label>City</label><input name="city" value={profile.city} onChange={handleChange} placeholder="Mumbai" /></div>
                <div className="field"><label>State</label><input name="state" value={profile.state} onChange={handleChange} placeholder="Maharashtra" /></div>
                <div className="field"><label>Pincode</label><input name="pincode" value={profile.pincode} onChange={handleChange} placeholder="400001" className={errors.pincode ? 'invalid' : ''} />{errors.pincode && <div className="field-error">{errors.pincode}</div>}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-icon" style={{ background: '#f0fdf4' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <h3>Payment Details</h3>
            </div>
            <div className="card-body">
              <div className="form-row single">
                <div className="field"><label>UPI ID</label><input name="upiId" value={profile.upiId} onChange={handleChange} placeholder="yourname@okaxis" /></div>
              </div>
              <div className="form-row">
                <div className="field"><label>Bank Name</label><input name="bankName" value={profile.bankName} onChange={handleChange} placeholder="HDFC Bank" /></div>
                <div className="field"><label>Account Holder Name</label><input name="accountHolder" value={profile.accountHolder} onChange={handleChange} placeholder="Varun Thakkar" /></div>
              </div>
              <div className="form-row">
                <div className="field"><label>Account Number</label><input name="accountNumber" value={profile.accountNumber} onChange={handleChange} placeholder="XXXXXXXXXXXX" /></div>
                <div className="field"><label>IFSC Code</label><input name="ifscCode" value={profile.ifscCode} onChange={handleChange} placeholder="HDFC0001234" /></div>
              </div>
            </div>
          </div>

          <div className="save-bar">
            <span className="save-hint">Changes apply to all future invoices.</span>
            <button onClick={handleSave} disabled={saving} className={`btn-save ${saved ? 'saved' : ''}`}>
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Profile'}
            </button>
          </div>
        </main>
      </div>
    </>
  );
}
