'use client'
import { Trash } from "lucide-react";
import React, { useState } from "react";
import { deletePost } from "../session"; 
import {Toaster,toast} from 'sonner';

export default function Delete({id}){
   async function click(){
      try{
         id = parseInt(id, 10); 
          await deletePost(id);
          toast.success('post deleted successfully')
      }catch(error){
         toast.error('error')
      }
   }
 return (
   <>
   <Toaster theme="dark" richColors position="top"/>
   <Trash onClick={click}  className="text-base pt-2 text-red-600 cursor-pointer" /> 
   </>
 )
}
 
 