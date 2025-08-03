"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Bir hata oluştu</h2>
        <p className="text-gray-300 mb-6">
          Uygulama beklenmeyen bir hata ile karşılaştı
        </p>
        <button
          onClick={reset}
          className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  );
}
