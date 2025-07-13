'use server'

import { PrismaClient } from "@prisma/client"
const prisma=new PrismaClient();

export async function deletePost(id: number) {
  await prisma.post.delete({
    where: { id }, // 👌 Correct for id: Int
  });

  return { message: "Post deleted successfully" };
}
