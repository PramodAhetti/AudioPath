"use client"
import Box from '@mui/joy/Box';
import Slider from '@mui/joy/Slider';


import Link from "next/link";
import { MapPin, Plus, Home, SendHorizonal, Edit3, Trash2 } from 'lucide-react';
import { useSession } from "next-auth/react";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from 'next/navigation';
import Image from "next/image";
import Alert from '@mui/material/Alert';

export default function HomeAndNearLayout(){
  type Location = {
    coords: {
      latitude: number,
      longitude: number
    }
  };
function valueText(value: number) {
  return `${value}°C`;
}


  const handleChange = async(event: Event, value: number | number[]) => {
    try{
        let radius:number=value as number;
        const multiplier=0.000009;
        const location=await getCurLocation();
        radius=(multiplier*(10)^radius);
        console.log(multiplier*(10)^radius)
        const response = await axios.post('/api/post/all', { location,radius });
        console.log(response.data.data)
        setPosts(response.data.data);
    }catch(error){
         <Alert severity="error">error</Alert>
        console.error('Error fetching posts:', error);
    }
  };
  const user = useSession();
  const router = useRouter();
  const postRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [avatar,setavatar]=useState<string>("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYmkp9a2rrD1Sskb9HLt5mDaTt4QaIs8CcBg&s");
  const getCurLocation=() => {
    return new Promise((resolve,reject)=>{
       if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve(position);       // Resolve the promise with the position
          },
          (error) => {
            console.error('Error getting location:', error);
            reject(error);           // Reject the promise if there's an error
          }
        );
       }else{
          reject(new Error("Browser doesnt support GPS"))
       }
    })
  };

  const submitPost = async () => {
    
    const message = postRef.current?.value;
    console.log('message :', message);

    try {
      const location=await getCurLocation();
      const authorIdResponse = await axios.get('/api/users/new');
      const authorId = authorIdResponse.data?.data?.id;

      const result = await axios.post('/api/post/new', { authorId, message, location });
      if (postRef.current) {
        postRef.current.value = '';
      }
      console.log('Post submitted successfully:', result.data);
    } catch (error) {
      <Alert severity="error">error</Alert> 
    }
  };

  useEffect(() => {
    const fetchUserAndPosts = async () => {
      if (user) {
        try {
          if(user.data?.user?.image){
            setavatar(user.data.user.image);
          }
          await axios.get('/api/users/new');
        } catch (error) {
          console.error('Error fetching user info:', error);
        }
      } else {
        <Alert severity="error">Login in</Alert>
        router.push('/');
      }

      
      try {
        const location=await getCurLocation();
        console.log(location)
        const response = await axios.post('/api/post/all', { location });
        console.log(response.data.data)
        setPosts(response.data.data);
      } catch (error) {
        <Alert severity="error">error</Alert>
        console.error('Error fetching posts:', error);
      }
    };

    fetchUserAndPosts();
  }, [user,router]);

  return (
    <div className='h-screen w-full grid grid-cols-12 bg-zinc-800 grid-rows-12'>
      <header className="row-start-1 row-end-2 col-start-1 col-end-13 m-4 flex justify-between items-center space-x-2">
        <Link href='/'><Home className="w-8 h-8 text-white" /></Link>
        <Image
         src={avatar} 
         width={40}
         height={40}
         alt='avatar'
         style={{
          borderRadius:20
         }}
        />
      </header>
     

      <div className="flex row-start-12 row-end-13 col-start-1 m-3 col-end-13 justify-between items-center">
       <div className='flex flex-col items-center'> 
        <input 
          placeholder="Enter a post" 
          ref={postRef} 
          className="p-2 w-5/6 bg-white border text-black border-black rounded-md"
        />   
        <Slider onChange={(handleChange)} defaultValue={3} max={10} />
       </div>
        <SendHorizonal onClick={submitPost} className="text-white w-8 h-8" />
      </div>

      <div className='col-start-1 overflow-x-auto text-wrap col-end-13 row-start-2 row-end-12 flex flex-col m-3 text-black rounded-md'>
        {posts.map((data) => (
          (user.data?.user?.email==data.author.email)?(

          <div key={data.id} className='text-xs w-fit bg-emerald-200 self-end flex flex-col m-2 rounded-md'>
            <span className='bg-lime-200 p-1 font-bold w-fit rounded-lg border border-black m-1'> 
              {data.author.email.split('@')[0]}
            </span>
            <div className='flex justify-between p-1 items-center'>
              <p className='text-sm'>{data.content}</p>
            </div>
            <div className='flex justify-between'>
              <h1 className='text-xs p-2 text-zinc-500'>{data.time.slice(4, 15)}</h1>
              <Trash2 className='text-base pt-2 text-red-600 cursor-pointer' />
            </div>
          </div>
 
          ):(

          <div key={data.id} className='text-xs w-fit flex flex-col bg-white m-2 rounded-md'>
            <span className='bg-lime-200 p-1 font-bold w-fit rounded-lg border border-black m-1'> 
              {data.author.email.split('@')[0]}
            </span>
            <div className='flex justify-between p-1 items-center'>
              <p className='text-sm'>{data.content}</p>
            </div>
            <div className='flex justify-between'>
              <h1 className='text-xs p-2 text-zinc-500'>{data.time.slice(4, 15)}</h1>
              <Trash2 className='text-base pt-2 text-red-600 cursor-pointer' />
            </div>
          </div>
 
          )
       ))}
      </div>
    </div>
  );
}