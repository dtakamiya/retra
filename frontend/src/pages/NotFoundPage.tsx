import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="text-center animate-[scaleFadeIn_0.4s_ease-out]">
        <h1 className="text-7xl font-bold bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent mb-3">404</h1>
        <p className="text-gray-500 mb-8 text-sm">ページが見つかりません</p>
        <Link
          to="/"
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-sm shadow-indigo-200 inline-block"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}
