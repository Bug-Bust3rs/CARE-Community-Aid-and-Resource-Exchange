import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import validator from "validator";
import { Prisma, PrismaClient } from "@prisma/client";
import { sendEmail } from "../lib/emailService";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import { createToken } from "../lib/tokenConfig";

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: "All fields must be filled" });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Email is not valid" });
  }
  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(400).json({ message: "Email already in use" });
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: { name, email, password: hash, phone },
      });

      const token = createToken(newUser.id);
      return { user: newUser, token };
    });
    await sendEmail(user.user.id);
    return res
      .status(200)
      .json({ success: true, message: "Verification email sent" });
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(400).json({ message: error.message, success: false });
    } else {
      return res
        .status(500)
        .json({ message: "Registration failed.", success: false });
    }
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.query;
  const { userId } = req.params;
  if (!token || typeof token !== "string")
    return res.status(400).send("Token not provided or invalid");

  const verificationToken = await prisma.oTP.findFirst({
    where: { otp: token },
  });
  if (!verificationToken)
    return res.status(404).json({ success: false, message: "Invalid token" });

  if (verificationToken.expiresAt < new Date())
    return res
      .status(400)
      .json({ success: false, message: "Token has expired" });

  if (verificationToken.authorId !== userId) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  await prisma.user.update({
    where: { id: verificationToken.authorId },
    data: { isVerified: true },
  });

  await prisma.oTP.delete({ where: { id: verificationToken.id } });

  res
    .status(200)
    .send({
      success: true,
      message: "Verified User! Our frontend page will be ready soon!",
    });
};





export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw Error("All fields must be filled");
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error("Invalid credentials");
    }
    if (!user.isVerified) {
      config.EMAIL_SERVICE === "RESEND"
        ? await sendEmail(user.id)
        : await sendEmailwithNodemailer(user.id);
      // await sendEmail(user.user.id);              //For Resend Mailer
      // await sendEmailwithNodemailer(user.id); //For NodeMailer
      return res.status(200).json({
        success: true,
        message: "At First Verify Your Email,A Verification email sent.",
      });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new Error("Invalid credentials");
    }
    const token = createToken(user.id);

    return res.status(200).json({
      message: "Login successful!",
      success: true,
      token: token,
      email: user.email,
      id: user.id,
    });
  } catch (error) {
    console.error("Login error:", error.message);
    if (error.message === "Invalid credentials") {
      return res
        .status(401)
        .json({ message: "Invalid email or password.", success: false });
    } else {
      return res.status(500).json({ message: "Login failed.", success: false });
    }
  }
};