import express, { Express, Request, Response, NextFunction } from "express";
import { config } from "./config/config";
import CheckError from "./lib/checkError";
import errorHandler from "./middleware/errorMiddleware";

const app: Express = express();

app.get("/", (req, res) => {
  res.status(200).json({ success: true });
});

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  next(new CheckError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`[⚡] Server Is Running on http://localhost:${config.PORT}`);
});
