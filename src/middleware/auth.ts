// Auth middleware with JWT for express
// Path: src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { response } from "./response";
const prisma = new PrismaClient();

// add admin check

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new Error("Please authenticate token not found");
    }
    console.log(token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    console.log("decoded===>", decoded);

    const user = await prisma.user.findUnique({
      where: {
        id: (decoded as any).id,
      },
    });

    if (!user) {
      throw new Error("Please authenticate user not found");
    }
    console.log("user===>", user);

    (req as any).user = user;

    next();
  } catch (error: any) {
    response(res, null, error.message, "Please authenticate", 401);
  }
};

export const adminAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new Error("Please authenticate token not found");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    console.log("decoded===>", decoded);

    const user = await prisma.user.findUnique({
      where: {
        id: (decoded as any).id,
      },
    });

    if (!user) {
      throw new Error("Please authenticate user not found");
    }

    if (user.role !== "ADMIN") {
      throw new Error("User not admin");
    }

    (req as any).user = user;

    next();
  } catch (error: any) {
    response(res, null, error.message, "Please authenticate", 401);
  }
};
