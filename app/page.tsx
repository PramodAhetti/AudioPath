import React, { useState } from 'react';
import Link from 'next/link';
import { AlignJustify, MapPin, MessageCircle } from 'lucide-react';
import GoogleLog from './component/loginGoogle';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authoptions';
import Image from 'next/image';
import { buttonGroupClasses } from '@mui/material';
const LandingPage = async () => {
  const user = await getServerSession(authOptions);
  let button = <GoogleLog></GoogleLog>;

  if (user) {
    button = <Link href={'/Near'} className="text-center flex justify-center items-center flex-col text-sm  w-full row-start-7 row-end-8 md-2 col-start-2 col-end-8 text-white rounded-md font-semibold border bg-gradient-to-r from-purple-500 to-blue-400" >Get Started</Link>
  }
  console.log("button", button)
  return (

    <div className='w-full h-screen grid grid-rows-12 grid-cols-12'>
      <nav className='p-2 row-start-1 col-start-1 col-end-13 flex flex-row justify-between items-center m-2'>
        <div className='flex flex-row items-center justify-center'>
          <Image width={30} alt='Logo' height={30} src='/bg.png' className='aspect-square m-2 rounded-full border border-white'></Image>
          <h1 className='text-xl font-extrabold text-center row-start-5 row-end-7 col-start-2 col-end-12'>AudioPath</h1>
        </div>
        <AlignJustify size={30}></AlignJustify>
      </nav>
      <p className='text-white row-start-3 row-end-6 text-5xl  font-normal text-left col-start-1 col-end-13 m-5'>Discover Share and Connect.</p>
      <div className='mb-10 text-center text-sm row-start-9 col-start-2 text-gray-400 col-end-12 flex flex-row justify-evenly items-center'>
        <p className='text-left text-sm'>
          <span className='font-bold text-white'>AudioPath</span>connects people within a neighborhood to share news, events, and updates. It fosters community engagement and local connections.</p>
      </div>
      {button}

      <div className="row-start-10 p-2 items-center flex flex-col mt-4 row-end-13 col-start-1 col-end-13">
        <Image width={300} alt='image' height={300} src='/image-asset.gif' className='rounded-md border border-white border-solid transform rotate-12 m-2'></Image>

        <div className="about-section p-6 m-8 text-left text-white bg-gradient-to-r from-purple-500 to-blue-400 rounded-lg shadow-lg">
          <h2 className="text-2xl font-extrabold mb-4">About AudioPath</h2>
          <p className="text-sm mb-4">
            At Audio Path, we&apos;re dedicated to building stronger communities. Our platform connects you with neighbors to share local news, events, and updates in real time.
          </p>
          <p className="text-sm">
            Whether you&apos;re exploring local happenings or engaging with nearby users, Local Social makes staying connected easy and fun. Join us in strengthening your community today!
          </p>


        </div>

        <footer className="w-full mt-7 p-4 text-center text-sm text-zinc-500 border-t border-gray-200">
          <p>&copy; 2025 Locial. All rights reserved.</p>
        </footer>
      </div>

    </div>

  )
};

export default LandingPage;