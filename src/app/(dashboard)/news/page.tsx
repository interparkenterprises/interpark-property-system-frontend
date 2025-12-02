'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { News } from '@/types';
import { newsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const data = await newsAPI.getAll();
      setNews(data);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this news item?')) {
      try {
        await newsAPI.delete(id);
        fetchNews();
      } catch (error) {
        console.error('Error deleting news:', error);
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">News & Announcements</h1>
        {user?.role === 'ADMIN' && (
          <Link href="/news/create">
            <Button>Add News</Button>
          </Link>
        )}
      </div>

      <div className="space-y-6">
        {news.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-800">{item.title}</h2>
              <div className="flex space-x-2">
                <Link
                  href={`/news/${item.id}`}
                  className="text-primary-600 hover:text-primary-900 text-sm"
                >
                  View
                </Link>
                {user?.role === 'ADMIN' && (
                  <>
                    <Link
                      href={`/news/${item.id}?edit=true`}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
            <p className="text-gray-600 mb-4 whitespace-pre-wrap">{item.content}</p>
            <div className="text-sm text-gray-500">
              Published: {new Date(item.publishedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {news.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">No news items available.</p>
        </div>
      )}
    </div>
  );
}