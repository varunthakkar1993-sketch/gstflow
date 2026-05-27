'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';

const templates = [
  { id: 1, name: "Freelance Service Invoice", icon: "💼" },
  { id: 2, name: "GST Tax Invoice", icon: "📄" },
  { id: 3, name: "Quotation / Estimate", icon: "📝" },
  { id: 4, name: "Payment Receipt", icon: "✅" },
  { id: 5, name: "Proforma Invoice", icon: "📋" },
  { id: 6, name: "Consulting Invoice", icon: "💡" },
];

export default function Templates() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) window.location.href = '/login';
      else setUser(currentUser);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between">
          <div className="text-2xl font-bold">GSTFlow</div>
          <a href="/dashboard" className="text-black hover:underline">← Back to Dashboard</a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-4">Choose a Template</h1>
        <p className="text-gray-600 mb-10">Start with one of our ready-made professional templates</p>

        <div className="grid md:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white border rounded-2xl p-8 hover:shadow-lg transition cursor-pointer">
              <div className="text-5xl mb-6">{template.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{template.name}</h3>
              <button className="w-full mt-4 bg-black text-white py-3 rounded-xl hover:bg-gray-800">
                Use This Template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
