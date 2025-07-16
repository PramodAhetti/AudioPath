"use client";
import { ListChecks, Send, Home } from "lucide-react";
import { submitPost } from "../actions/submitPost";
import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";

export default function NewPostPage() {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [status, setStatus] = useState("");

  const avatar = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYmkp9a2rrD1Sskb9HLt5mDaTt4QaIs8CcBg&s";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    // Get current position
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = position.coords;
        const loc = { coords: { latitude: coords.latitude, longitude: coords.longitude } };
        setLocation(loc);

        try {
          const result = await submitPost(category, message, loc);
          setStatus("✅ Post submitted!");
          setMessage("");
          setCategory("");
        } catch (err) {
          console.error(err);
          setStatus("❌ Failed to submit post.");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error(error);
        setStatus("❌ Could not access location.");
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="h-screen flex flex-col justify-between bg-black text-white px-4">
      {/* Header */}
      <header className="flex justify-between items-center py-4">
        <Link href="/">
          <Home className="w-8 h-8 text-white" />
        </Link>
        <Image src={avatar} width={40} height={40} alt="avatar" style={{ borderRadius: 20 }} />
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 mt-10">
        <div className="flex items-center border border-white/30 rounded px-3 py-2 bg-white/10 focus-within:ring-2 focus-within:ring-white">
          <ListChecks className="text-white/70 mr-2" />
          <input
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full bg-transparent outline-none text-sm placeholder:text-white/60 text-white"
          />
        </div>

        <div className="flex items-center border border-white/30 rounded px-3 py-2 bg-white/10 focus-within:ring-2 focus-within:ring-white">
          <ListChecks className="text-white/70 mr-2" />
          <input
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Enter category (e.g. Food, Event)"
            className="w-full bg-transparent outline-none text-sm placeholder:text-white/60 text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-purple-300 text-black font-semibold rounded py-2 px-4 hover:bg-gray-100 transition disabled:opacity-50"
        >
          <Send size={16} />
          {loading ? "Submitting..." : "Submit Post"}
        </button>
      </form>

      {/* Status */}
      <div className="text-sm mt-4 text-center text-white/80">{status}</div>

      <footer className="text-center text-xs py-6 text-white/60">
        Your location is used to tag the post
      </footer>
    </div>
  );
}
