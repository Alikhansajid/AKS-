'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export default function AdminScraperPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScrape = async () => {
    if (!url) {
      toast.error('Please provide a valid URL');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/scrape?url=${encodeURIComponent(url)}`,
        { credentials: 'include' }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Scrape failed');

      toast.success(`Scraped ${data.scrapedProducts} products successfully!`);
      setUrl('');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Scraping failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen p-6 text-gray-200"
      style={{ backgroundColor: '#18181b' }}
    >
      <h1 className="text-3xl font-bold text-amber-500 mb-6">
        Scrape Products
      </h1>

      <div className="space-y-4">
        {/* URL Input */}
        <div>
          <label className="block mb-1 text-gray-400">Product Page URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL to scrape"
            className="w-full px-3 py-2 bg-gray-900 text-white rounded border border-gray-700 focus:outline-none"
          />
        </div>

        {/* Scrape Button */}
        <button
          onClick={handleScrape}
          disabled={loading}
          className={`w-full py-2 rounded ${
            loading
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-amber-500 hover:bg-amber-600'
          } text-white`}
        >
          {loading ? 'Scraping...' : 'Scrape & Save'}
        </button>

        {/* Back Button */}
        <button
          onClick={() => router.push('/admin')}
          className="w-full py-2 mt-2 bg-gray-700 hover:bg-gray-800 rounded text-white"
        >
          Back to Admin
        </button>
      </div>
    </div>
  );
}
