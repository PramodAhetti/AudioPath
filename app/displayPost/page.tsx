'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import  getLocation  from '../actions/getLocation';
import { Home } from 'lucide-react';
import { getPosts } from '../actions/getPosts';

// Dummy location zones with messages and categories
type posts={
  id:String, 
  authorId:  String
  category:  String,
  content :  String,
  latitude:  number ,
  longitude: number,
  time    :  String
}

export default function LocationCategoryAudio() {
  const [userLocation, setUserLocation] = useState<any>(null);
  const [category,setCategory]=useState<Array<string>>([]);
  const avatar = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYmkp9a2rrD1Sskb9HLt5mDaTt4QaIs8CcBg&s';

  // Check if user is in a zone

  // Speak zone message using Web Speech API
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    window.speechSynthesis.cancel(); // stop previous speech
    window.speechSynthesis.speak(utterance);
  };

  // Watch user location
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const location = await getLocation();
        setUserLocation(location);

        // Fetch posts based on user location
        const posts = await getPosts(location);
        await setCategory(posts.map((post:posts) => post.category)); // 
        // Check if user is in a zone and speak the message
      } catch (error) {
        console.error('Error fetching location or posts:', error);
      }
    };

    fetchLocation();

  }, []);

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

        {userLocation? (
          <div className="text-center text-white/90 space-y-2">
            <p>
                {userLocation.coords.latitude.toFixed(4)}, {userLocation.coords.longitude.toFixed(4)}
            </p>
            <div className='flex flex-row w-full items-center justify-center'>
           {category.map((cat, index) => (
            <div className='bg-white  text-black border rounded-md m-1 p-1 flex justify-center items-center w-1/2' key={index}>{cat}</div>
           ))}
           </div> 
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

