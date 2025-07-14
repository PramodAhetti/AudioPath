'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home } from 'lucide-react';
import haversine from 'haversine-distance';

import getLocation from '../actions/getLocation';
import { getPosts } from '../actions/getPosts';
import { getPostsbycategoryLocation } from '../actions/getPostsbycategory_Location';
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
  const [audioDistance, setAudioDistance] = useState<number>(5); // Distance in meters

  const avatar = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYmkp9a2rrD1Sskb9HLt5mDaTt4QaIs8CcBg&s';
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
 // 🔇 Stop current speech immediately
  window.speechSynthesis.cancel();


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

    document.querySelectorAll('.category-button').forEach((btn) => {
      btn.classList.remove('bg-green-500', 'text-white');
      btn.classList.add('bg-white', 'text-black');
    });

    element.classList.remove('bg-white', 'text-black');
    element.classList.add('bg-green-500', 'text-white');
  };

  // Fetch location and all posts
  useEffect(() => {
    const fetchLocationAndPosts = async () => {
      try {
        const location = await getLocation();
        setUserLocation(location);

        const posts: Post[] = await getPosts(location);
        setPosts(posts);
        const uniqueCategories = Array.from(new Set(posts.map((post) => post.category)));
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching location or posts:', error);
      }
    };

    fetchLocationAndPosts();
  }, []);

  // Refresh location every 5 seconds
  useEffect(() => {
    const updateLocation = async () => {
      const newLocation = await getLocation();
      setUserLocation(newLocation);
    };

    const interval = setInterval(updateLocation, 5000); // Changed to 5 seconds as per original intent
    return () => clearInterval(interval);
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  // Audio trigger based on cached location and distance
  useEffect(() => {
    if (!userLocation || !posts.length) return;

    const currentLoc = {
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
    };

    // Filter for un-spoken posts that are within the audio distance
    const eligiblePosts = posts.filter(
      (post) => !spokenPostIds.has(post.id) && haversine(currentLoc, { latitude: post.latitude, longitude: post.longitude }) <= audioDistance
    );

    // Sort eligible posts by distance, closest first
    eligiblePosts.sort((a, b) => {
      const distanceA = haversine(currentLoc, { latitude: a.latitude, longitude: a.longitude });
      const distanceB = haversine(currentLoc, { latitude: b.latitude, longitude: b.longitude });
      return distanceA - distanceB;
    });

    // Speak the nearest eligible post if one exists
    if (eligiblePosts.length > 0 && currentCategory!==null) {
      const nearestPost = eligiblePosts[0];
      const nearestDistance = haversine(currentLoc, { latitude: nearestPost.latitude, longitude: nearestPost.longitude });

      console.log(`Speaking post: ${nearestPost.content} at distance: ${nearestDistance}`);
      speak(nearestPost.content);
      setSpokenPostIds((prev) => new Set(prev.add(nearestPost.id))); // Add to spoken set
    } else {
      console.log(`No new posts to speak within ${audioDistance} meters.`);
    }

    // You might want to consider the interval for this effect carefully.
    // If you want to continuously check and speak new posts as you move,
    // you could keep it as a `setInterval` or re-evaluate on `userLocation` change.
    // For now, let's keep it simpler and rely on `userLocation` updates to trigger.

    // If you want to re-check every 2 seconds for new nearby posts, you can put this
    // logic inside a `setInterval`. However, ensure you manage cleanup correctly.
    // Let's refine this to be triggered by location updates primarily.
  }, [userLocation, posts, spokenPostIds, audioDistance]); // Dependencies: userLocation, posts, spokenPostIds, audioDistance

  // Draw canvas
  useEffect(() => {
    if (!canvasRef.current || !userLocation || !posts.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 2; // Pixels per meter

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // User dot
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Posts
    ctx.fillStyle = 'red';
    posts.forEach((post) => {
      const latDiff = (post.latitude - userLocation.coords.latitude) * 111320;
      const lonDiff = (post.longitude - userLocation.coords.longitude) * 111320 * Math.cos(userLocation.coords.latitude * (Math.PI / 180));
      const x = centerX + lonDiff * scale;
      const y = centerY - latDiff * scale;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    ctx.strokeStyle = 'white';
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
        <Image
          src={avatar}
          width={40}
          height={40}
          alt="avatar"
          style={{ borderRadius: 20 }}
        />
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center flex-1 space-y-4">
        <h1 className="text-2xl font-semibold">Location-Based Audio Guide with Map</h1>

        {userLocation ? (
          <div className="text-center text-white/90 space-y-4 w-full">
            <p>
              {userLocation.coords.latitude.toFixed(4)}, {userLocation.coords.longitude.toFixed(4)}
            </p>

            {/* Category buttons */}
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

            {/* Distance control */}
            <div className="flex flex-col items-center text-sm mt-4">
              <label htmlFor="distance" className="mb-1 text-white/70">
                Trigger distance: {audioDistance} meter(s)
              </label>
              <input
                id="distance"
                type="range"
                min={0}
                max={50}
                step={0.3}
                value={audioDistance}
                onChange={(e) => setAudioDistance(Number(e.target.value))}
                className="w-48"
              />
            </div>

            {/* Canvas Map */}
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              className="border border-white/20 rounded-md mx-auto mt-4"
            />
          </div>
        ) : (
          <p className="text-white/60">Getting location...</p>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs py-6 text-white/50">
        Walk into a zone to hear its message.
      </footer>
    </div>
  );
}