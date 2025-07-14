'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home } from 'lucide-react';
import haversine from 'haversine-distance';

import getLocation from '../actions/getLocation';
import { getPosts } from '../actions/getPosts';
import { getPostsbycategoryLocation } from '../actions/getPostsbycategory_Location';

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
  const [userLocation, setUserLocation] = useState<Location| null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [spokenPostIds, setSpokenPostIds] = useState<Set<string>>(new Set());
  const avatar = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYmkp9a2rrD1Sskb9HLt5mDaTt4QaIs8CcBg&s';

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

    element.classList.remove('bg-gray-300');
    element.classList.add('bg-green-500');
  };

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
    }, 5000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [posts, spokenPostIds]);

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
        <h1 className="text-2xl font-semibold">Location-Based Audio Guide</h1>

        {userLocation ? (
          <div className="text-center text-white/90 space-y-2">
            <p>
              {userLocation.coords.latitude.toFixed(4)}, {userLocation.coords.longitude.toFixed(4)}
            </p>
            <div className="flex flex-wrap justify-center items-center">
              {categories.map((cat, index) => (
                <div
                  key={index}
                  onClick={changeCurrentCategory}
                  className="bg-white text-black border rounded-md m-1 px-3 py-2 text-sm font-medium hover:bg-green-500 hover:text-white cursor-pointer"
                >
                  {cat}
                </div>
              ))}
            </div>
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
