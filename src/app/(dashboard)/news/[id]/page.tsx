'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { News } from '@/types';
import { newsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import NewsForm from '@/components/forms/NewsForm';
import { useAuth } from '@/context/AuthContext';

export default function NewsDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const newsId = params.id as string;
  const isEdit = searchParams.get('edit') === 'true';

  useEffect(() => {
    fetchNews();
  }, [newsId]);

  const fetchNews = async () => {
    try {
      const data = await newsAPI.getById(newsId);
      setNews(data);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this news item?')) {
      try {
        await newsAPI.delete(newsId);
        router.push('/dashboard/news');
      } catch (error) {
        console.error('Error deleting news:', error);
      }
    }
  };

  const handleUpdateSuccess = () => {
    router.push('/dashboard/news');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!news) {
    return <div>News not found</div>;
  }

  if (isEdit && user?.role === 'ADMIN') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Edit News</h1>
          <Button variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <NewsForm 
            news={news} 
            onSuccess={handleUpdateSuccess}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">{news.title}</h1>
        {user?.role === 'ADMIN' && (
          <div className="space-x-2">
            <Button onClick={() => router.push(`/dashboard/news/${news.id}?edit=true`)}>
              Edit
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="prose max-w-none">
          <p className="text-gray-600 whitespace-pre-wrap">{news.content}</p>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Published: {new Date(news.publishedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}