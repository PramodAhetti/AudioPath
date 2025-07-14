'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home } from 'lucide-react';
import haversine from 'haversine-distance';

import getLocation from '../actions/getLocation';
import { getPosts } from '../actions/getPosts';
import { getPostsbycategoryLocation } from '../actions/getPostsbycategory_Location';
import DisplayPosts from '../component/displayPosts';
import { useSession } from 'next-auth/react';

// Type definition for a post
type Post = {
  id: string;
  authorId: string;
  category: string;
  content: string;
  latitude: number;
  longitude: number;
  time: string;
};

type Location = {
  coords: {
    latitude: number;
    longitude: number;
  };
};

export default function LocationCategoryAudio() {
  const session = useSession();
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [spokenPostIds, setSpokenPostIds] = useState<Set<string>>(new Set());
  const avatar = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYmkp9a2rrD1Sskb9HLt5mDaTt4QaIs8CcBg&s';
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Speak a given message using Web Speech API
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    window.speechSynthesis.speak(utterance);
  };

  const changeCurrentCategory = async (e: React.MouseEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const selectedCategory = element.textContent;
    setCurrentCategory(selectedCategory);
    const postsByCategory = await getPostsbycategoryLocation(userLocation, selectedCategory);
    setPosts(postsByCategory);
    setSpokenPostIds(new Set()); // Reset spoken posts when category changes
    speak(`You selected the category: ${selectedCategory}`);

    // Update category button styles
    document.querySelectorAll('.category-button').forEach((btn) => {
      btn.classList.remove('bg-green-500', 'text-white');
      btn.classList.add('bg-white', 'text-black');
    });
    element.classList.remove('bg-white', 'text-black');
    element.classList.add('bg-green-500', 'text-white');
  };

  // Fetch initial location and posts
  useEffect(() => {
    const fetchLocationAndPosts = async () => {
      try {
        const location = await getLocation();
        setUserLocation(location);

        const posts: Post[] = await getPosts(location);
        const uniqueCategories = Array.from(new Set(posts.map((post) => post.category)));
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching location or posts:', error);
      }
    };

    fetchLocationAndPosts();
  }, []);

  // Periodically check for nearby posts to speak
  useEffect(() => {
    const interval = setInterval(() => {
      if (!navigator.geolocation || !posts.length) return;

      navigator.geolocation.getCurrentPosition((pos) => {
        const currentLoc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };

        posts.forEach((post) => {
          const postLoc = {
            latitude: post.latitude,
            longitude: post.longitude,
          };

          const distance = haversine(currentLoc, postLoc); // meters

          if (distance <= 50 && !spokenPostIds.has(post.id)) {
            speak(post.content);
            setSpokenPostIds((prev) => new Set(prev.add(post.id)));
          }
        });
      });
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [posts, spokenPostIds]);

  // Draw visualization on canvas
  useEffect(() => {
    if (!canvasRef.current || !userLocation || !posts.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 2; // Pixels per meter (adjust for visualization)

    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw user (blue dot)
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Draw posts (red dots)
    ctx.fillStyle = 'red';
    posts.forEach((post) => {
      const postLoc = { latitude: post.latitude, longitude: post.longitude };
      const userLoc = { latitude: userLocation.coords.latitude, longitude: userLocation.coords.longitude };
      const distance = haversine(userLoc, postLoc); // meters

      // Convert lat/lon differences to canvas coordinates
      const latDiff = (post.latitude - userLocation.coords.latitude) * 111320; // Approx meters per degree latitude
      const lonDiff = (post.longitude - userLocation.coords.longitude) * 111320 * Math.cos(userLocation.coords.latitude * (Math.PI / 180)); // Approx meters per degree longitude
      const x = centerX + lonDiff * scale;
      const y = centerY - latDiff * scale; // Invert y-axis for canvas

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw scale
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, height - 20);
    ctx.lineTo(20 + 50 * scale, height - 20);
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText('50 meters', 20, height - 30);
  }, [userLocation, posts]);

  return (
    <div className="h-screen flex flex-col justify-between bg-black text-white px-4">
      {/* Header */}
      <header className="flex justify-between items-center py-4">
        <Link href="/">
          <Home className="w-8 h-8 text-white" />
        </Link>
        <Image src={avatar} width={40} height={40} alt="avatar" style={{ borderRadius: 20 }} />
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center flex-1 space-y-4">
        <h1 className="text-2xl font-semibold">Location-Based Audio Guide with Map</h1>

        {userLocation ? (
          <div className="text-center text-white/90 space-y-4 w-full">
            <p>
              {userLocation.coords.latitude.toFixed(4)}, {userLocation.coords.longitude.toFixed(4)}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-2">
              {categories.map((cat, index) => (
                <div
                  key={index}
                  onClick={changeCurrentCategory}
                  className="category-button bg-white text-black border rounded-md px-3 py-2 text-sm font-medium hover:bg-green-500 hover:text-white cursor-pointer"
                >
                  {cat}
                </div>
              ))}
            </div>
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              className="border border-white/20 rounded-md mx-auto"
            />
          </div>
        ) : (
          <p className="text-white/60">Getting location...</p>
        )}
      </main>

      <footer className="text-center text-xs py-6 text-white/50">
        Walk into a zone to hear its message.
      </footer>
    </div>
  );
}