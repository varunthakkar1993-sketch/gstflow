export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold">GSTFlow</div>
          <div className="flex gap-6 items-center">
            <a href="#features" className="hover:text-gray-600">Features</a>
            <a href="/login" className="hover:text-gray-600">Login</a>
            <a href="/signup" className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800">
              Start Free
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          GSTFlow
        </h1>
        <p className="text-3xl text-gray-600 mb-8">
          Beautiful GST Invoices for Indian Freelancers & Businesses
        </p>
        <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto">
          Create professional invoices with UPI QR code, automatic GST calculations, and modern design — in seconds.
        </p>

        <div className="flex gap-4 justify-center mb-16">
          <a href="/signup" className="bg-black hover:bg-gray-800 text-white px-10 py-4 rounded-2xl text-lg font-medium transition">
            Start Creating Invoices →
          </a>
          <button className="border border-gray-400 hover:bg-gray-100 px-8 py-4 rounded-2xl text-lg font-medium transition">
            Watch 1-min Demo
          </button>
        </div>
      </div>

      {/* Features */}
      <div id="features" className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Built for Real Indian Use Cases</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-2xl font-semibold mb-3">GST Compliant</h3>
              <p className="text-gray-600">Automatic CGST, SGST, IGST calculations + HSN/SAC codes</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">📱</div>
              <h3 className="text-2xl font-semibold mb-3">UPI QR Code</h3>
              <p className="text-gray-600">Get paid faster with instant UPI payments</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🎨</div>
              <h3 className="text-2xl font-semibold mb-3">Modern & Clean</h3>
              <p className="text-gray-600">Professional designs that impress clients</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
