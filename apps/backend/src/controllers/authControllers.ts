import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import validator from "validator";
import { createToken } from "../lib/tokenConfig";
import { Prisma, PrismaClient } from "@prisma/client";



const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password || !phone) {
    throw Error("All fields must be filled");
  }
  if (!validator.isEmail(email)) {
    throw Error("Email is not valid");
  }
  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      throw Error("Email already in use");
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: { name , email, password: hash , phone },
      });
      const token = createToken(newUser.id);
      return { user: newUser, token };
    });
    // config.EMAIL_SERVICE === "RESEND"
    //   ? await sendEmail(user.user.id)
    //   : await sendEmailwithNodemailer(user.user.id);
    // await sendEmail(user.user.id);              //For Resend Mailer
    // await sendEmailwithNodemailer(user.user.id); //For NodeMailer
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
