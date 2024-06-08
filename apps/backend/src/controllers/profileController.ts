import { Request, Response } from "express";
import prisma from "../config/prisma.config";

export const getProfiles = async (req: Request, res: Response) => {
  try {
    const profiles = await prisma.profile.findMany();
    res.status(200).json(profiles);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
};
