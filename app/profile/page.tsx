'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    businessName: '',
    ownerName: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    upiId: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolder: '',
  });

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { window.location.href = '/login'; return; }
      setUser(currentUser);
      const snap = await getDoc(doc(db, 'profiles', currentUser.uid));
      if (snap.exists()) setProfile(snap.data() as any);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    await setDoc(doc(db, 'profiles', user.uid), profile);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold">GSTFlow</div>
          <div className="flex gap-6 text-sm">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/editor" className="hover:underline">New Invoice</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Business Profile</h1>
        <p className="text-gray-500 mb-8">This info auto-fills every invoice you create.</p>

        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-8">

          <div>
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Business Details</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Business Name</label>
                <input name="businessName" value={profile.businessName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" placeholder="Acme Technologies" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Owner / Freelancer Name</label>
                <input name="ownerName" value={profile.ownerName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" placeholder="Varun Thakkar" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">GSTIN</label>
                <input name="gstin" value={profile.gstin} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" placeholder="29AAABC1234D1Z5" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input name="phone" value={profile.phone} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" placeholder="+91 98765 43210" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Email</label>
                <input name="email" value={profile.email} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" placeholder="you@business.com" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Address</label>
                <input name="address" value={profile.address} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" placeholder="123, Street Name, Area" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <input name="city" value={profile.city} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" placeholder="Mumbai" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">State</label>
                <input name="state" value={profile.state} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" placeholder="Maharashtra" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Pincode</label>
                <input name="pincode" value={profile.pincode} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" placeholder="400001" />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Payment Details</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">UPI ID</label>
                <input name="upiId" value={profile.upiId} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" placeholder="yourname@okaxis" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bank Name</label>
                <input name="bankName" value={profile.bankName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" placeholder="HDFC Bank" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Account Holder Name</label>
                <input name="accountHolder" value={profile.accountHolder} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" placeholder="Varun Thakkar" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Account Number</label>
                <input name="accountNumber" value={profile.accountNumber} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" placeholder="XXXXXXXXXXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">IFSC Code</label>
                <input name="ifscCode" value={profile.ifscCode} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl" placeholder="HDFC0001234" />
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="w-full bg-black text-white py-4 rounded-2xl text-lg font-medium hover:bg-gray-800 disabled:opacity-70">
            {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
