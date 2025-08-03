"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Kritik Hata</h2>
            <p className="text-gray-300 mb-6">
              Uygulama başlatılırken bir hata oluştu
            </p>
            <button
              onClick={reset}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition-colors"
            >
              Uygulamayı Yeniden Başlat
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
