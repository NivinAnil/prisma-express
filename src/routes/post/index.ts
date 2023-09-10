import express from "express";
import { adminAuth, auth } from "../../middleware/auth";
import { response } from "../../middleware/response";
import prisma from "../../dep";
import { Post } from "@prisma/client";
const postRoute = express.Router();

// getall post for lazy loading
postRoute.get("/post", async (req, res) => {
  try {
    const { page = 0, size = 10 } = req.query;
    const posts = await prisma.post.findMany({
      skip: Number(page) * Number(size),
      take: Number(size),
    });
    const total = await prisma.post.count();
    response(res, { posts, total }, null, "Get all post success", 200);
  } catch (error: any) {
    response(res, null, error.message, "Get all post failed", 400);
  }
});

// create a post
postRoute.post("/post", async (req, res) => {
  const { authorId, content, published, title }: Post = req.body;

  try {
    const post = await prisma.post.create({
      data: {
        content,
        title,
        authorId,
        published,
      },
    });
    response(res, post, null, "Create post success", 200);
  } catch (error: any) {
    response(res, null, error, "Failed creating post", 400);
  }
});

// get my posts
postRoute.get("/post/my", auth, async (req: any, res) => {
  try {
    const { page = 0, size = 10 } = req.query;
    let posts: any[] = await prisma.post.findMany({
      where: {
        authorId: req.user.id,
      },
      skip: Number(page) * Number(size),
      take: Number(size),
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        likedBy: {
          select: {
            id: true,
          },
        },
      },
    });
    // add total likes for each post
    posts.forEach((post) => {
      post["totalLikes"] = post.likedBy.length;
    });
    const total = await prisma.post.count({
      where: {
        authorId: req.user.id,
      },
    });

    response(res, { posts, total }, null, "Get all post success", 200);
  } catch (error: any) {
    response(res, null, error.message, "Get all post failed", 400);
  }
});

// get post by id
postRoute.get("/post/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id: id },
    });
    if (!post) {
      response(res, null, "Post not found", "Get post failed", 400);
    } else {
      response(res, post, null, "Get post success", 200);
    }
  } catch (error: any) {
    response(res, null, error.message, "Get post failed", 400);
  }
});

// like togle post
postRoute.post("/post/like/:id", auth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id: id },
      select: {
        likedBy: true,
      },
    });
    if (!post) {
      response(res, null, "Post not found", "Get post failed", 400);
    } else {
      // if liked by have user id then remove it
      if (post.likedBy.map((like) => like.id).includes(req.user.id)) {
        await prisma.post.update({
          where: { id: id },
          data: {
            likedBy: {
              disconnect: {
                id: req.user.id,
              },
            },
          },
        });
        response(res, "LIKED", null, "Like post success", 200);
      }
      // if liked by not have user id then add it
      else {
        await prisma.post.update({
          where: { id: id },
          data: {
            likedBy: {
              connect: {
                id: req.user.id,
              },
            },
          },
        });
        response(res, "UNLIKE", null, "unLike post success", 200);
      }
    }
  } catch (error: any) {
    response(res, null, error.message, "Like post failed", 400);
  }
});

// get post by author id
postRoute.get("/post/author/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 0, size = 10 } = req.query;
    const posts = await prisma.post.findMany({
      where: {
        authorId: id,
      },
      skip: Number(page) * Number(size),
      take: Number(size),
    });
    const total = await prisma.post.count({
      where: {
        authorId: id,
      },
    });
    response(res, { posts, total }, null, "Get all post success", 200);
  } catch (error: any) {
    response(res, null, error.message, "Get all post failed", 400);
  }
});

module.exports = postRoute;
