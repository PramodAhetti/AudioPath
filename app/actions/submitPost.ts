// filepath: /home/macahetti/workspace/Locial/app/actions/submitPost.ts
"use server"
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authoptions";
import { PrismaClient } from "@prisma/client";

export async function submitPost(message: string,location:any) {
  const prisma = new PrismaClient();
  try {
    const session = await getServerSession(authOptions);
    let author;

    if (session?.user?.email) {
      author = await prisma.user.findUnique({
        where: {
          email: session.user.email,
        },
      });

      if (!author) {
        throw new Error("User not found");
      }
    } else {
      throw new Error("Login required");
  }
  console.log(message,location);
    const post = await prisma.post.create({
      data: {
        content: message,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        authorId: author.id,
      },
    });
    return { message: "Post is saved", post };
  } catch (e) {
    console.log(e);
    throw new Error("Failed to save post");
  } finally {
    await prisma.$disconnect();
  }
}
