import express from "express";
import { adminAuth, auth } from "../../middleware/auth";
import { response } from "../../middleware/response";
import prisma from "../../dep";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const user = express.Router();


/**
 * Description
 * @param {any} "/user"
 * @param {any} auth
 * @param {any} async(req
 * @param {any} res
 * @returns {any}
 */
user.get("/user", auth, async (req, res) => {
  try {
    const { page = 0, size = 10, email = "" } = req.query;
    let filter: any = {};
    if (email) {
      filter.email = {
        contains: email as string,
      };
    }

    const users = await prisma.user.findMany({
      where: {
        ...filter,
        role: {
          not: "ADMIN",
        },
      },
      skip: Number(page) * Number(size),
      take: Number(size),
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const total = await prisma.user.count({
      where: {
        ...filter,
        role: {
          not: "ADMIN",
        },
      },
    });
    response(res, { users, total }, null, "Get all user success", 200);
  } catch (error: any) {
    response(res, null, error.message, "Get all user failed", 400);
  }
});

user.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: id },
    });
    if (!user) {
      throw new Error("User not found");
    }
    response(res, user, null, "Get user by id success", 200);
  } catch (error: any) {
    response(res, null, error.message, "Get user by id failed", 400);
  }
});

// follow user
user.post("/user/follow/:id", auth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: id },
    });
    if (!user) {
      throw new Error("User not found");
    }
    const follow = await prisma.follows.findFirst({
      where: {
        followerId: req.user.id as string,
        followingId: id as string,
      },
    });
    if (follow) {
      throw new Error("User already follow");
    }
    const newFollow = await prisma.follows.create({
      data: {
        followerId: req.user.id,
        followingId: id,
      },
    });
    response(res, newFollow, null, "Follow user success", 200);
  } catch (error: any) {
    response(res, null, error.message, "Follow user failed", 400);
  }
});

// get my following array of objects
user.get("/user/my/following", auth, async (req: any, res) => {
  try {
    const { page = 0, size = 10 } = req.query;

    let follows = await prisma.follows.findMany({
      where: {
        followerId: req.user.id,
      },
      skip: Number(page) * Number(size),
      take: Number(size),
      select: {
        following: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    let _Follows: any[] = [];
    if (follows.length) {
      _Follows = follows.map((follow) => follow.following);
    }

    const total = await prisma.follows.count({
      where: {
        followerId: req.user.id,
      },
    });
    response(
      res,
      { following: _Follows, total },
      null,
      "Get all following success",
      200
    );
  } catch (error: any) {
    response(res, null, error.message, "Get all following failed", 400);
  }
});

// get my follower array of objects
user.get("/user/my/follower", auth, async (req: any, res) => {
  try {
    const { page = 0, size = 10 } = req.query;

    const follows = await prisma.follows.findMany({
      where: {
        followingId: req.user.id,
      },
      skip: Number(page) * Number(size),
      take: Number(size),
      select: {
        follower: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    let _Follows: any[] = [];
    if (follows.length) {
      _Follows = follows.map((follow) => follow.follower);
    }

    const total = await prisma.follows.count({
      where: {
        followingId: req.user.id,
      },
    });
    response(
      res,
      { followers: _Follows, total },
      null,
      "Get all follower success",
      200
    );
  } catch (error: any) {
    response(res, null, error.message, "Get all follower failed", 400);
  }
});

// un-follow user

user.delete("/user/unfollow/:id", auth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: id },
    });
    if (!user) {
      throw new Error("User not found");
    }
    const follow = await prisma.follows.findFirst({
      where: {
        followerId: req.user.id as string,
        followingId: id as string,
      },
    });
    if (!follow) {
      throw new Error("User not follow");
    }
    const deleteFollow = await prisma.follows.delete({
      where: {
        followerId_followingId: {
          followerId: req.user.id as string,
          followingId: id as string,
        },
      },
    });
    response(res, deleteFollow, null, "Unfollow user success", 200);
  } catch (error: any) {
    response(res, null, error.message, "Unfollow user failed", 400);
  }
});

// signup use salted password using bcrypt using a secret from env
user.post("/user/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    // check if user email already exist
    const user = await prisma.user.findFirst({
      where: { email: email },
    });
    console.log("user", email);

    if (user) {
      throw new Error("Email already exist");
    }
    // hash password using bcrypt

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async function (err, hash) {
        const user = await prisma.user.create({
          data: {
            role,
            name,
            email,
            password: hash,
          },
        });
        response(res, user, null, "Create user success", 200);
      });
    });
  } catch (error: any) {
    response(res, null, error.message, "Create user failed", 400);
  }
});

//signin compare password using bcrypt and send refresh token and access token in jwt
user.post("/user/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    // check if user email already exist
    const user = await prisma.user.findUnique({
      where: { email: email },
    });
    if (!user) {
      throw new Error("Email not found");
    }

    const result = await bcrypt.compare(password, user.password);

    if (!result) {
      throw new Error("Password not match");
    }

    // send refresh token and access token in jwt
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "10h" }
    );
    const refreshToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );
    response(res, { accessToken, refreshToken }, null, "Signin success", 200);
  } catch (error: any) {
    response(res, null, error.message, "Signin failed", 400);
  }
});

// refresh access token using refresh token
user.post("/user/refresh", async (req, res) => {
  try {
    const { refresh_token } = req.body;
    // check if user email already exist
    const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET as string);
    const access_token = jwt.sign(
      { id: (decoded as any).id, role: (decoded as any).role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
    response(
      res,
      { accessToken: access_token },
      null,
      "Refresh token success",
      200
    );
  } catch (error: any) {
    response(res, null, error.message, "Refresh token failed", 400);
  }
});

module.exports = user;
