'use server'

import { PrismaClient } from "@prisma/client"
const prisma=new PrismaClient();


export async function deletePost(id:string){
            
    await prisma.post.delete({where:{
                id
            }})
        
         

}