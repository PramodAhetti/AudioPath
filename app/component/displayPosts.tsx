'use client'
import React from "react";
import Delete from "../component/delete";

type Post = {
  id: string;
  content: string;
  author: {
    email: string;
  };
  latitude: number;
  longitude: number;
  time: string;
};

type Props = {
  posts: Post[];
  user_email: string
};

const DisplayPosts: React.FC<Props> = ({ posts, user_email }) => {
  return (
    <div className="col-start-1 overflow-x-auto text-wrap col-end-13 row-start-2 row-end-12 flex flex-col m-3 text-black rounded-md">
      {posts.map((data) =>
        user_email=== data.author.email ? (
          <div
            key={data.id}
            className="text-xs w-fit bg-emerald-200 self-end flex flex-col m-2 rounded-md"
          >

            <div className="flex flex-col justify-between p-1">
            <div className="flex flex-col justify-start pt-2">
            <span className="bg-lime-200 p-1 font-bold w-fit rounded-lg border border-black m-1">
              {data.author.email.split("@")[0]}
            </span>
              <p className="text-sm m-1">{data.content}</p>
            </div>
 </div>
            <div className="flex justify-between">
              <h1 className="text-xs p-2 text-zinc-500">
                {data.time}
              </h1>
              <Delete id={data.id}></Delete>
            </div>
          </div>
        ) : (
          <div
            key={data.id}
            className="text-xs w-fit flex flex-col bg-gray-300 m-2 rounded-md"
          >

            <div className="flex flex-col justify-between p-1">
           
              <div className="flex flex-col justify-start pt-2">
            <span className="bg-lime-200 p-1 font-bold w-fit rounded-lg border border-black m-1"> {data.author.email.split("@")[0]}
            </span>
              <p className="text-sm m-1"> { data.content}</p>
              </div>
            </div>
            <div className="flex justify-between">
              <h1 className="text-xs p-2 text-zinc-500">
                {data.time.slice(4, 15)}
              </h1>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default DisplayPosts;