'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Link from 'next/link';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const q = query(collection(db, "invoices"), where("userId", "==", currentUser.uid), orderBy("createdAt", "desc"));
          const querySnapshot = await getDocs(q);
          const userInvoices = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setInvoices(userInvoices);
        } catch (err: any) {
          console.error("Firestore error:", err?.message);
          setInvoices([]);
        }
      } else {
        window.location.href = '/login';
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold">GSTFlow</div>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">Welcome back, {user?.email?.split('@')[0]}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/editor" className="block">
            <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition cursor-pointer">
              <h3 className="font-semibold text-xl mb-4">Create New Invoice</h3>
              <button className="w-full bg-black text-white py-4 rounded-xl hover:bg-gray-800">Start Fresh Invoice</button>
            </div>
          </Link>

          <Link href="/templates" className="block">
            <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition cursor-pointer">
              <h3 className="font-semibold text-xl mb-4">Browse Templates</h3>
              <button className="block w-full text-center border border-gray-300 py-4 rounded-xl hover:bg-gray-50">View All Templates →</button>
            </div>
          </Link>

          <div className="bg-white p-8 rounded-2xl shadow-sm border">
            <h3 className="font-semibold text-xl mb-4">My Invoices ({invoices.length})</h3>
            {invoices.length === 0 ? (
              <p className="text-gray-500">No invoices yet.<br/>Create one from the left panel!</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-auto">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex justify-between text-sm border-b pb-3">
                    <div>
                      <span className="font-medium">{inv.invoiceNumber}</span><br />
                      <span className="text-gray-500">{inv.clientName}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">₹ {inv.total}</span><br />
                      <span className="text-gray-500 text-xs">{inv.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
