import "dotenv/config";
import {
  ClerkExpressWithAuth,
  LooseAuthProp,
  WithAuthProp,
} from "@clerk/clerk-sdk-node";
import Clerk from "@clerk/clerk-sdk-node/esm/instance";
import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { init } from "@instantdb/admin";

// --------------
// Set up Clerk!

const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

// --------------
// Set up Instant

const db = init({
  appId: process.env.INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

// ----- 
// Basic Server

const app: Application = express();

app.use(cors());
app.use(bodyParser.json());

declare global {
  namespace Express {
    interface Request extends LooseAuthProp {}
  }
}

app.post(
  "/signin",
  ClerkExpressWithAuth({}),
  async (req: WithAuthProp<Request>, res: Response) => {
    // 👇👇👇
    const user = await clerk.users.getUser(req.auth.userId!);
    const email = user.emailAddresses[0].emailAddress;
    const instantToken = await db.auth.createToken(email);
    return res.json({ instantToken });
  }
);

const PORT = 3030;
app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});
