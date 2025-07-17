'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, Settings, X, Volume2 } from 'lucide-react'; // Import Volume2 icon
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
  const [audioDistance, setAudioDistance] = useState<number>(10); // Distance in meters
  const [curMsg, setCurMsg] = useState<string>("Hi"); // Default to 1 second
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false); // State for dropdown visibility
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false); // New state for audio activity
  const [isLoading, setIsLoading] = useState<boolean>(true); // New state for loading
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);


  const avatar = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYmkp9a2rrD1Sskb9HLt5mDaTt4QaIs8CcBg&s';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsDropdownRef = useRef<HTMLDivElement>(null); // Ref for click outside detection

  const speak = (text: string) => {
    // Stop any ongoing speech before starting a new one
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.onstart = () => {setCurMsg(text); setIsSpeaking(true);}; 
    utterance.onend = () => {setIsSpeaking(false)};
    utterance.onerror = () => setIsSpeaking(false); // Handle errors too

    window.speechSynthesis.speak(utterance);
    
  };

  const changeCurrentCategory = async (e: React.MouseEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const selectedCategory = element.textContent;
    if (!selectedCategory) return; // Ensure selectedCategory is not null

    setCurrentCategory(selectedCategory);

    // Fetch posts for the selected category using the current user location
    if (userLocation) {
      setIsLoading(true); // Start loading for new category posts
      const postsByCategory = await getPostsbycategoryLocation(userLocation, selectedCategory);
      setPosts(postsByCategory);
      setIsLoading(false); // End loading
    } else {
      console.warn("User location not available, cannot fetch category-specific posts.");
    }
    setSpokenPostIds(new Set()); // Reset spoken posts when category changes
    speak(`You selected the category: ${selectedCategory}`);

    document.querySelectorAll('.category-button').forEach((btn) => {
      btn.classList.remove('bg-green-500', 'text-white');
      btn.classList.add('bg-gray-800', 'text-gray-300', 'hover:bg-green-600', 'hover:text-white');
    });

    element.classList.remove('bg-gray-800', 'text-gray-300', 'hover:bg-green-600', 'hover:text-white');
    element.classList.add('bg-green-500', 'text-white');
  };

  // Fetch initial location and all posts
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const location = await getLocation();
        setUserLocation(location);

        const allPosts: Post[] = await getPosts(location);
        setPosts(allPosts);
        const uniqueCategories = Array.from(new Set(allPosts.map((post) => post.category)));
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching initial location or posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Refresh location at the specified interval
useEffect(() => {
    // Check if Geolocation API is supported
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    const successCallback = (position: GeolocationPosition) => { // Add GeolocationPosition type hint
      console.log('Current position:', position);
      setUserLocation({
        coords:{
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        }
      });
      setError(null); // Clear any previous errors
    };

    const errorCallback = (err: GeolocationPositionError) => { // Add GeolocationPositionError type hint
      setError(`Error (${err.code}): ${err.message}`);
      console.error(`ERROR(${err.code}): ${err.message}`);
    };

    const options = {
      enableHighAccuracy: true, // Use GPS if available
      timeout: 10000,           // Maximum time (ms) to wait for a position
      maximumAge: 0,            // Don't use a cached position
    };

    // Start watching the position
    const id = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      options
    );
    // No need to set watchId in state if it's only used for cleanup in this same effect
    // setWatchId(id); // <--- REMOVE THIS LINE IF YOU ONLY USE 'id' for the cleanup

    // Cleanup function: Clear the watch when the component unmounts
    return () => {
      if (id) { // Use 'id' directly from this effect's scope
        navigator.geolocation.clearWatch(id);
        console.log('Location watch cleared.');
      }
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount
// Re-run effect if locationInterval changes

  // Audio trigger based on cached location and distance
  useEffect(() => {
    if (!userLocation || !posts.length || currentCategory === null) {
      if (currentCategory === null && userLocation) {
        console.log("Please select a category to enable audio guide.");
      }
      return;
    }

    const currentLoc = {
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
    };

    // Filter for un-spoken posts that are within the audio distance AND match the current category
    const eligiblePosts = posts.filter(
      (post) =>
        !spokenPostIds.has(post.id) &&
        haversine(currentLoc, { latitude: post.latitude, longitude: post.longitude }) <= audioDistance &&
        post.category === currentCategory
    );

    // Sort eligible posts by distance, closest first
    eligiblePosts.sort((a, b) => {
      const distanceA = haversine(currentLoc, { latitude: a.latitude, longitude: a.longitude });
      const distanceB = haversine(currentLoc, { latitude: b.latitude, longitude: b.longitude });
      return distanceA - distanceB;
    });

    // Speak the nearest eligible post if one exists
    if (eligiblePosts.length > 0) {
      const nearestPost = eligiblePosts[0];
      const nearestDistance = haversine(currentLoc, { latitude: nearestPost.latitude, longitude: nearestPost.longitude });

      console.log(`Speaking post: ${nearestPost.content} at distance: ${nearestDistance.toFixed(2)} meters`);
      speak(nearestPost.content);
      setSpokenPostIds((prev) => new Set(prev.add(nearestPost.id))); // Add to spoken set
    } else if (userLocation && currentCategory) { // Only log if active
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
    const scale = 2; // Pixels per meter (e.g., 2 pixels per meter)
    const viewRadiusMeters = Math.min(width, height) / (2 * scale); // Max radius viewable from center

    ctx.clearRect(0, 0, width, height); // Clear canvas for redraw
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 0.5;
    // Draw grid lines (every 25 meters, for example)
    const gridSpacingPixels = 25 * scale;
    for (let x = centerX % gridSpacingPixels - gridSpacingPixels; x < width; x += gridSpacingPixels) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = centerY % gridSpacingPixels - gridSpacingPixels; y < height; y += gridSpacingPixels) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // User dot
    ctx.fillStyle = 'cyan'; // Changed user dot color
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2); // Slightly larger user dot
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    ctx.stroke(); // Add a border to user dot

    // Draw audio trigger distance circle
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)'; // Green transparent circle
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, audioDistance * scale, 0, Math.PI * 2);
    ctx.stroke();

    // Posts
    posts.forEach((post) => {
      const latDiffMeters = (post.latitude - userLocation.coords.latitude) * 111320;
      const lonDiffMeters = (post.longitude - userLocation.coords.longitude) * 111320 * Math.cos(userLocation.coords.latitude * (Math.PI / 180));

      const x = centerX + lonDiffMeters * scale;
      const y = centerY - latDiffMeters * scale; // Negative for north (up on map)

      const distanceToPost = haversine(
        { latitude: userLocation.coords.latitude, longitude: userLocation.coords.longitude },
        { latitude: post.latitude, longitude: post.longitude }
      );

      // Only draw posts within a reasonable viewing distance on the canvas
      if (distanceToPost < viewRadiusMeters * 1.5) { // Draw posts a bit beyond the visible radius
        ctx.beginPath();
        if (post.category === currentCategory) {
          ctx.fillStyle = spokenPostIds.has(post.id) ? 'rgba(255, 0, 0, 0.3)' : 'red'; // Dim if spoken, red if active
        } else {
          ctx.fillStyle = 'gray'; // Dim other categories
        }
        ctx.arc(x, y, 4, 0, 2 * Math.PI); // Slightly larger post dots
        ctx.fill();

        // Optional: Add post ID for debugging on canvas
        // ctx.fillStyle = 'white';
        // ctx.font = '8px Arial';
        // ctx.fillText(post.id.substring(0, 4), x + 5, y - 5);
      }
    });

    // Scale bar
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, height - 20);
    ctx.lineTo(20 + 50 * scale, height - 20); // 50 meters represented by 50 * scale pixels
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText('50m', 25 + 50 * scale, height - 20); // Label for scale bar
  }, [userLocation, posts, currentCategory, spokenPostIds, audioDistance]); // Redraw when userLocation or posts change

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
    <div className="h-screen flex flex-col bg-black text-white px-4 py-2 relative overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center py-4 px-2">
        <Link href="/" className="p-2 rounded-full hover:bg-gray-800 transition-colors">
          <Home className="w-7 h-7 text-white" />
        </Link>
        <div className="relative z-20" ref={settingsDropdownRef}>
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="p-2 rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600 transition-colors"
            aria-label="Settings"
          >
            {isSettingsOpen ? (
              <X className="w-7 h-7 text-white" />
            ) : (
              <Settings className="w-7 h-7 text-white" />
            )}
          </button>

          {isSettingsOpen && (
            <div className="fixed left-0 t-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 animate-fade-in-down">
              <h3 className="text-lg font-semibold mb-4 text-white border-b border-gray-700 pb-2">Settings</h3>

              {/* Audio Trigger Distance Control */}
              <div className="flex flex-col mb-4">
                <label htmlFor="audioDistance" className="mb-2 text-sm text-gray-300 font-medium flex justify-between items-center">
                  Audio Trigger Distance: <span className="font-bold text-white">{audioDistance.toFixed(1)} m</span>
                </label>
                <input
                  id="audioDistance"
                  type="range"
                  min={1}
                  max={50}
                  step={0.5}
                  value={audioDistance}
                  onChange={(e) => setAudioDistance(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg"
                  style={{'--webkit-slider-thumb-bg': '#4CAF50'} as React.CSSProperties} // Custom thumb color
                />
              </div>

              {/* Location Update Interval Control */}
              
            </div>
          )}
        </div>
        <Image
          src={avatar}
          width={40}
          height={40}
          alt="avatar"
          className="rounded-full border-2 border-gray-700"
        />
      </header>

      <hr className="border-gray-700 my-2" />

      {/* Main Content */}
      <main className="flex flex-col items-center flex-1 py-4 px-2 overflow-y-auto">
        <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-100">
         {curMsg} 
        </h1>

        {isLoading && !userLocation ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
            <p className="text-lg">Fetching your location...</p>
          </div>
        ) : !userLocation ? (
          <p className="text-gray-400 text-lg mt-4">Location not available. Please enable location services.</p>
        ) : (
          <div className="w-full max-w-lg space-y-6">
            <div className="bg-gray-800 p-4 rounded-lg shadow-md flex justify-between items-center text-sm font-mono text-gray-300">
              <span>Lat: {userLocation.coords.latitude.toFixed(5)}</span>
              <span>Lon: {userLocation.coords.longitude.toFixed(5)}</span>
              {isSpeaking && (
                <Volume2 className="w-5 h-5 text-green-400 animate-pulse" />
              )}
            </div>

            {/* Current Category Display */}
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2 text-gray-200">
                {currentCategory ? (
                  <>
                    Active Category: <span className="text-green-400 font-bold">{currentCategory}</span>
                  </>
                ) : (
                  <span className="text-yellow-500 text-sm">Please select a category</span>
                )}
              </h2>
            </div>

            {/* Category buttons */}
            <div className="flex flex-wrap justify-center items-center gap-3 p-3 bg-gray-800 rounded-lg shadow-md">
              {categories.length > 0 ? (
                categories.map((cat, index) => (
                  <div
                    key={index}
                    onClick={changeCurrentCategory}
                    className={`category-button px-5 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105
                      ${currentCategory === cat ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`
                    }
                  >
                    {cat}
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No categories found yet.</p>
              )}
            </div>

            {/* Canvas Map */}
            <div className="w-full flex flex-row justify-center  bg-gray-800 border-2 border-gray-700 rounded-xl shadow-lg aspect-square">
              <canvas
                ref={canvasRef}
                width={300}
                height={300}
                className="rounded-xl border border-white"
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs py-4 text-gray-500 border-t border-gray-800 mt-auto">
        Walk into a zone to hear its message.
      </footer>

      {/* Tailwind CSS for custom range slider thumb */}
      <style jsx>{`
        .range-lg::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--webkit-slider-thumb-bg, #4CAF50);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 5px rgba(0,0,0,0.3);
          margin-top: -6px; /* Adjust to vertically center the thumb */
        }
        .range-lg::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--webkit-slider-thumb-bg, #4CAF50);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 5px rgba(0,0,0,0.3);
        }

        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.2s ease-out forwards;
        }

        .loader {
          border-top-color: #3498db; /* Blue color for the top border */
          -webkit-animation: spin 1s linear infinite;
          animation: spin 1s linear infinite;
        }

        @-webkit-keyframes spin {
          0% { -webkit-transform: rotate(0deg); }
          100% { -webkit-transform: rotate(360deg); }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}