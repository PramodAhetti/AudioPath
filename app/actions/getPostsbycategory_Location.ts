"use server"
import { PrismaClient } from "@prisma/client";
import { env } from "process";
type Location = {
    coords: {
      latitude: number;
      longitude: number;
    };
  };

let radius=env.RADIUS ? parseFloat(env.RADIUS) : 0.001; 
radius=radius*10;
export async function getPostsbycategoryLocation(coords:Location,category: string){
  console.log("Radius:", radius);
  console.log("Category:", category);
    const prisma=new PrismaClient();
    try{
        console.log(coords);
       const posts = await prisma.post.findMany({
            where:{
                category: category,
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

    console.log("error",e);
    throw new Error("Failed to fetch posts");
  } finally {
    await prisma.$disconnect();
  }
  }