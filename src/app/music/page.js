"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function MusicStudio() {
  const [user, setUser] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSong, setGeneratedSong] = useState(null);
  const [generatedSongs, setGeneratedSongs] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    getUser();
    fetchGeneratedSongs();
  }, []);

  async function getUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
  }

  async function fetchGeneratedSongs() {
    if (!user) return;

    const { data, error } = await supabase
      .from("music_projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setGeneratedSongs(data);
    }
  }

  async function generateSong() {
    if (!prompt.trim()) {
      alert("Lütfen bir prompt girin!");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          model: "V4_5",
          duration: 180,
        }),
      });

      if (!response.ok) {
        throw new Error("Şarkı üretimi başarısız");
      }

      const data = await response.json();
      setGeneratedSong(data);

      // Şarkıyı veritabanına kaydet
      if (user) {
        const { error } = await supabase.from("music_projects").insert({
          user_id: user.id,
          title: `AI Şarkı - ${prompt.substring(0, 30)}...`,
          prompt: prompt,
          audio_url: data.audio_url,
          lyrics: data.lyrics,
          duration: data.duration,
          model: "v4",
          status: "completed",
        });

        if (!error) {
          fetchGeneratedSongs();
        }
      }
    } catch (error) {
      console.error("Şarkı üretimi hatası:", error);
      alert("Şarkı üretimi başarısız oldu. Lütfen tekrar deneyin.");
    } finally {
      setIsGenerating(false);
    }
  }

  // Müzik çalar fonksiyonları
  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (audioRef.current) {
      audioRef.current.currentTime = percent * audioRef.current.duration;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-cyan-900/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-40 w-1 h-1 bg-purple-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce"></div>
        <div className="absolute top-60 right-1/3 w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/40 backdrop-blur-2xl border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-cyan-500/25">
                  <span className="text-3xl">🎵</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-3xl blur opacity-25 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
                  AI MÜZİK STÜDYOSU
                </h1>
                <p className="text-cyan-300 text-sm font-medium tracking-wide">
                  SUNO AI İLE PROFESYONEL MÜZİK ÜRETİMİ
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-cyan-300 text-sm font-medium">Hoş geldin</p>
                <p className="text-white font-semibold">{user?.email}</p>
              </div>
              <button
                onClick={() => supabase.auth.signOut()}
                className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 hover:border-red-500/60 px-6 py-3 rounded-2xl transition-all duration-300 text-sm font-bold hover:shadow-lg hover:shadow-red-500/25"
              >
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Sol Panel - Şarkı Oluşturma */}
          <div className="lg:col-span-1">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative bg-black/60 backdrop-blur-2xl border border-cyan-500/20 rounded-3xl p-10 shadow-2xl">
                <div className="flex items-center space-x-4 mb-10">
                  <div className="w-14 h-14 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-xl">
                    <span className="text-2xl">🎵</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white">
                      ŞARKI OLUŞTUR
                    </h2>
                    <p className="text-cyan-300 text-sm font-medium tracking-wide">
                      Birkaç kelime yaz, AI şarkı yapsın
                    </p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-bold mb-4 text-cyan-300 tracking-wide">
                      PROMPT
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Örnek: Köşedeki çiçekçi seni sordu bu akşam, Selam söyledi tazeymiş gülleri, Yokluğun gibi..."
                      className="w-full h-48 bg-black/40 border border-cyan-500/30 rounded-2xl p-6 text-white placeholder-cyan-300/50 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 text-sm leading-relaxed font-medium"
                    />
                    <p className="text-xs text-cyan-300/70 mt-2">
                      AI bu kelimelerden beat, vokal ve söz üretecek
                    </p>
                  </div>

                  <button
                    onClick={generateSong}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed py-6 px-8 rounded-2xl font-black text-xl transition-all duration-300 shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105 disabled:transform-none tracking-wide"
                  >
                    {isGenerating ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-4"></div>
                        ŞARKI ÜRETİLİYOR...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span className="text-3xl mr-4">🎵</span>
                        ŞARKI OLUŞTUR
                      </div>
                    )}
                  </button>
                </div>

                {/* Müzik Çalar */}
                {generatedSong && (
                  <div className="mt-10 bg-black/40 rounded-2xl p-8 border border-cyan-500/20">
                    <h3 className="font-black mb-6 text-xl text-white tracking-wide">
                      ŞU AN ÇALIYOR
                    </h3>

                    {/* Audio Element */}
                    <audio
                      ref={audioRef}
                      src={generatedSong.audio_url}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleTimeUpdate}
                      onEnded={() => setIsPlaying(false)}
                      style={{ display: "none" }}
                    />

                    <div className="flex items-center space-x-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 via-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-xl">
                        <span className="text-3xl">🎵</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-xl text-white">
                          {generatedSong.title}
                        </p>
                        <p className="text-sm text-cyan-300 font-medium">
                          {generatedSong.duration}
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center space-x-4">
                      <button
                        onClick={() => {
                          if (audioRef.current) {
                            audioRef.current.currentTime = Math.max(
                              0,
                              audioRef.current.currentTime - 10
                            );
                          }
                        }}
                        className="bg-black/40 hover:bg-black/60 p-4 rounded-xl transition-colors border border-cyan-500/20"
                      >
                        ⏮️
                      </button>
                      <button
                        onClick={isPlaying ? pauseAudio : playAudio}
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 p-4 rounded-xl transition-all duration-300 shadow-lg"
                      >
                        {isPlaying ? "⏸️" : "▶️"}
                      </button>
                      <button
                        onClick={() => {
                          if (audioRef.current) {
                            audioRef.current.currentTime = Math.min(
                              audioRef.current.duration,
                              audioRef.current.currentTime + 10
                            );
                          }
                        }}
                        className="bg-black/40 hover:bg-black/60 p-4 rounded-xl transition-colors border border-cyan-500/20"
                      >
                        ⏭️
                      </button>
                      <div
                        className="flex-1 bg-black/40 rounded-full h-3 border border-cyan-500/20 cursor-pointer"
                        onClick={handleSeek}
                      >
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              duration > 0 ? (currentTime / duration) * 100 : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-cyan-300 font-medium">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sağ Panel - Üretilen Şarkılar ve Sözler */}
          <div className="lg:col-span-1">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative bg-black/60 backdrop-blur-2xl border border-purple-500/20 rounded-3xl p-10 shadow-2xl">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 rounded-2xl flex items-center justify-center shadow-xl">
                    <span className="text-2xl">🎼</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white">
                      ÜRETİLEN ŞARKILAR
                    </h2>
                    <p className="text-purple-300 text-sm font-medium tracking-wide">
                      Son oluşturduğun şarkılar
                    </p>
                  </div>
                </div>

                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {generatedSongs.length > 0 ? (
                    generatedSongs.map((song, index) => (
                      <div
                        key={song.id}
                        className="bg-black/40 hover:bg-black/60 rounded-2xl p-6 transition-all duration-300 border border-purple-500/20 hover:border-purple-500/40 cursor-pointer group"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 via-pink-400 to-cyan-400 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                            🌹
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-white">
                              {song.title}
                            </h3>
                            <p className="text-sm text-purple-300 mt-2 font-medium">
                              {song.prompt.substring(0, 50)}...
                            </p>
                            <div className="flex items-center space-x-3 mt-3">
                              <span className="text-xs bg-purple-600/50 px-3 py-1 rounded-full font-bold">
                                v{song.model}
                              </span>
                              <span className="text-xs text-purple-300 font-medium">
                                {song.duration}
                              </span>
                            </div>
                          </div>
                          <button className="text-sm bg-cyan-600/50 hover:bg-cyan-600/70 px-4 py-2 rounded-lg transition-colors font-medium">
                            YAYINLA
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16">
                      <div className="text-8xl mb-6">🎵</div>
                      <p className="text-purple-300 text-xl font-bold tracking-wide">
                        Henüz şarkı üretilmedi
                      </p>
                      <p className="text-sm text-purple-400 mt-3 font-medium">
                        İlk şarkınızı oluşturmak için sol paneli kullanın
                      </p>
                    </div>
                  )}
                </div>

                {/* Şarkı Sözleri */}
                {generatedSong?.lyrics && (
                  <div className="mt-8 bg-black/40 rounded-2xl p-6 border border-purple-500/20">
                    <h3 className="font-bold mb-4 text-lg text-white">
                      ŞARKI SÖZLERİ
                    </h3>
                    <div className="whitespace-pre-line text-sm leading-relaxed text-purple-200 font-medium">
                      {generatedSong.lyrics}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
