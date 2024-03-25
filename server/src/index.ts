import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { init } from "@instantdb/admin";


const CLERK_PUBLISHABLE_KEY= "pk_test_d2VhbHRoeS1zZXJ2YWwtNjguY2xlcmsuYWNjb3VudHMuZGV2JA"
const CLERK_SECRET_KEY = "sk_test_KMWciingaXl6ezxUiyoHDVsWMjpGzqpJUSwqFonVXM"; 

// --------------
// Set up Supabase

const supabaseUrl = "https://botzmwiesosjfdcvwxdm.supabase.co";
const anonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvdHptd2llc29zamZkY3Z3eGRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkxMjc0OTAsImV4cCI6MjAyNDcwMzQ5MH0.cGm5UoYy355vDahc-k1Oq5elWJM1FCY8gIebdDsWr7Y";

const supabase = createClient(supabaseUrl, anonKey);

// --------------
// Set up Instant

const APP_ID = "17dde164-c2d2-4c36-ab52-68b6507df371";
// Note: 👇 Note, this should be saved as a secret.
const ADMIN_TOKEN = "f6e4dd43-dc3b-4c9b-9eea-100fba35d315";
// (This is just a demo app; keeping the secret in source control
// to make it easier for you to repro :))
const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

// ----------------
// Set up a basic express server

const app = express();
const port = 3030;

app.use(cors());
app.use(bodyParser.json());

// ---------------------- 
// 👇👇👇 1. Aand this is the crux of the
// the work. Our goal: 
// - Given a Supabase access token, 
// - Verify it with Supabase,
// - Then create an Instant token for the user.
app.post("/signin", async (req, res) => {
  // 1. Verify the Supabase access token
  const { supabaseAccessToken } = req.body;
  const { data } = await supabase.auth.getUser(supabaseAccessToken);
  const { user } = data;
  if (!user) {
    return res.status(401).send("Invalid access token");
  }
  // 2. Create an Instant token
  const instantToken = await db.auth.createToken(user.email!);
  // 3. Send the Instant token to the client
  res.send({ instantToken });
});

// ------ 
// Start the server

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
