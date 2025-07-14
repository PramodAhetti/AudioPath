'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, Settings, X } from 'lucide-react'; // Import Settings and X icons
import haversine from 'haversine-distance';

// Assuming these actions exist in your project
import getLocation from '../actions/getLocation';
import { getPosts } from '../actions/getPosts';
import { getPostsbycategoryLocation } from '../actions/getPostsbycategory_Location';
// import { useSession } from 'next-auth/react'; // Uncomment if you are using NextAuth

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
  // const session = useSession(); // Uncomment if you are using NextAuth
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [spokenPostIds, setSpokenPostIds] = useState<Set<string>>(new Set());
  const [audioDistance, setAudioDistance] = useState<number>(5); // Distance in meters
  const [locationInterval, setLocationInterval] = useState<number>(1000); // Default to 1 second
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false); // State for dropdown visibility

  const avatar = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYmkp9a2rrD1Sskb9HLt5mDaTt4QaIs8CcBg&s';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsDropdownRef = useRef<HTMLDivElement>(null); // Ref for click outside detection

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

    // Fetch posts for the selected category using the current user location
    if (userLocation) {
      const postsByCategory = await getPostsbycategoryLocation(userLocation, selectedCategory);
      setPosts(postsByCategory);
    } else {
      console.warn("User location not available, cannot fetch category-specific posts.");
    }
    setSpokenPostIds(new Set()); // Reset spoken posts when category changes
    speak(`You selected the category: ${selectedCategory}`);

    document.querySelectorAll('.category-button').forEach((btn) => {
      btn.classList.remove('bg-green-500', 'text-white');
      btn.classList.add('bg-white', 'text-black');
    });

    element.classList.remove('bg-white', 'text-black');
    element.classList.add('bg-green-500', 'text-white');
  };

  // Fetch initial location and all posts
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const location = await getLocation();
        setUserLocation(location);

        const allPosts: Post[] = await getPosts(location);
        setPosts(allPosts);
        const uniqueCategories = Array.from(new Set(allPosts.map((post) => post.category)));
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching initial location or posts:', error);
      }
    };

    fetchInitialData();
  }, []);

  // Refresh location at the specified interval
  useEffect(() => {
    const updateLocation = async () => {
      const newLocation = await getLocation();
      setUserLocation(newLocation);
    };

    const intervalId = setInterval(updateLocation, locationInterval);
    return () => clearInterval(intervalId); // Cleanup on unmount or interval change
  }, [locationInterval]); // Re-run effect if locationInterval changes

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

    // Speak the nearest eligible post if one exists and a category is selected
    if (eligiblePosts.length > 0 && currentCategory !== null) {
      const nearestPost = eligiblePosts[0];
      const nearestDistance = haversine(currentLoc, { latitude: nearestPost.latitude, longitude: nearestPost.longitude });

      console.log(`Speaking post: ${nearestPost.content} at distance: ${nearestDistance.toFixed(2)} meters`);
      speak(nearestPost.content);
      setSpokenPostIds((prev) => new Set(prev.add(nearestPost.id))); // Add to spoken set
    } else if (currentCategory === null && userLocation) { // Only log this if location is available
      console.log("Please select a category to enable audio guide.");
    } else if (userLocation) { // Only log this if location is available
      console.log(`No new posts to speak within ${audioDistance} meters in the current category.`);
    }

  }, [userLocation, posts, spokenPostIds, audioDistance, currentCategory]); // Dependencies: userLocation, posts, spokenPostIds, audioDistance, currentCategory

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
    // Draw horizontal grid lines
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    // Draw vertical grid lines
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
      const latDiffMeters = (post.latitude - userLocation.coords.latitude) * 111320;
      const lonDiffMeters = (post.longitude - userLocation.coords.longitude) * 111320 * Math.cos(userLocation.coords.latitude * (Math.PI / 180));

      const x = centerX + lonDiffMeters * scale;
      const y = centerY - latDiffMeters * scale; // Negative for north (up on map)

      // Only draw posts that are within the visible canvas area (plus some buffer)
      if (x > -50 && x < width + 50 && y > -50 && y < height + 50) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Scale bar
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(20, height - 20);
    ctx.lineTo(20 + 50 * scale, height - 20); // 50 meters represented by 50 * scale pixels
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText('50 meters', 20, height - 30);
  }, [userLocation, posts]); // Redraw when userLocation or posts change

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };

    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen]);

  return (
    <div className="h-screen flex flex-col justify-between bg-black text-white px-4 relative"> {/* Added relative for dropdown positioning */}
      {/* Header */}
      <header className="flex justify-between items-center py-4">
        <Link href="/">
          <Home className="w-8 h-8 text-white" />
        </Link>
        <div className="relative" ref={settingsDropdownRef}> {/* Parent for settings dropdown */}
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="p-2 rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Settings"
          >
            {isSettingsOpen ? (
              <X className="w-8 h-8 text-white" /> // 'X' icon when open
            ) : (
              <Settings className="w-8 h-8 text-white" /> // Settings icon when closed
            )}
          </button>

          {isSettingsOpen && (
            <div className="absolute top-full right-0 mt-2 w-52 bg-gray-700 border border-gray-600 rounded-md shadow-lg p-4 z-10">
              <h3 className="text-lg font-semibold mb-3 text-white">Settings</h3>

              {/* Audio Trigger Distance Control */}
              <div className="flex flex-col items-center text-sm mb-4">
                <label htmlFor="audioDistance" className="mb-1 text-white/70">
                  Audio Trigger Distance: {audioDistance.toFixed(1)} meter(s)
                </label>
                <input
                  id="audioDistance"
                  type="range"
                  min={0}
                  max={50}
                  step={0.5}
                  value={audioDistance}
                  onChange={(e) => setAudioDistance(Number(e.target.value))}
                  className="w-full h-2 bg-gray-500 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Location Update Interval Control */}
              <div className="flex flex-col items-center text-sm mb-2">
                <label htmlFor="locationInterval" className="mb-1 text-white/70">
                  Location Update Interval: {locationInterval / 1000} second(s)
                </label>
                <input
                  id="locationInterval"
                  type="range"
                  min={500}
                  max={10000}
                  step={200}
                  value={locationInterval}
                  onChange={(e) => setLocationInterval(Number(e.target.value))}
                  className="w-full h-2 bg-gray-500 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
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
              Current Location: {userLocation.coords.latitude.toFixed(4)}, {userLocation.coords.longitude.toFixed(4)}
            </p>

            {/* Category buttons */}
            <div className="flex flex-wrap justify-center items-center gap-2">
              {categories.map((cat, index) => (
                <div
                  key={index}
                  onClick={changeCurrentCategory}
                  className={`category-button border rounded-md px-3 py-2 text-sm font-medium cursor-pointer
                    ${currentCategory === cat ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-green-500 hover:text-white'}`
                  }
                >
                  {cat}
                </div>
              ))}
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