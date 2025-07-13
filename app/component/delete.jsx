'use client'
import { Trash } from "lucide-react";
import React, { useState } from "react";
import {Toaster,toast} from 'sonner';

export default function Delete({id}){

 return (
   <>
   <Toaster theme="dark" richColors position="top"/>
   <Trash  className="text-base pt-2 text-red-600 cursor-pointer" /> 
   </>
 )
}
 
 