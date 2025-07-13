"use server"
import { PrismaClient } from "@prisma/client";
import { env } from "process";
type Location = {
    coords: {
      latitude: number;
      longitude: number;
    };
  };

const radius=env.RADIUS ? parseFloat(env.RADIUS) : 0.0001; 
export async function getPosts(coords:Location){
  console.log("Radius:", radius);
    const prisma=new PrismaClient();
    try{
        console.log(coords);
       const posts = await prisma.post.findMany({
            where:{
                latitude:{gte:coords.coords.latitude-radius,lte:coords.coords.latitude+radius},
                longitude:{gte:coords.coords.longitude-radius,lte:coords.coords.longitude+radius}
            },
            include: {
                author: true, // Include author details
            },
        });
        console.log(posts);
        
        return posts;
  }catch(e){
    console.log(e);
    throw new Error("Failed to fetch posts");
  } finally {
    await prisma.$disconnect();
  }
  }