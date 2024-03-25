import { useEffect, useState } from "react";
import { Session, createClient } from "@supabase/supabase-js";
import { id, init, tx } from "@instantdb/react";

function App() {
  const { isLoading, session } = useSupabaseSession();
  if (isLoading) {
    return null;
  }
  if (!session) {
    return <SupabaseLogin />;
  }
  return <AuthorizedApp />;
}

// --------
// Instant Setup

const db = init({
  appId: "17dde164-c2d2-4c36-ab52-68b6507df371",
});

// --------
// Supabase Setup

const supabaseUrl = "https://botzmwiesosjfdcvwxdm.supabase.co";
const anonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvdHptd2llc29zamZkY3Z3eGRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkxMjc0OTAsImV4cCI6MjAyNDcwMzQ5MH0.cGm5UoYy355vDahc-k1Oq5elWJM1FCY8gIebdDsWr7Y";

const supabase = createClient(supabaseUrl, anonKey);

// --------
// Time to sync auth!

// --------
// 👇👇👇 This is the crux of things
// When supabase auth state changes, we sync it with Instant.
supabase.auth.onAuthStateChange(async (event, session) => {
  switch (event) {
    case "SIGNED_IN":
      const instantUser = await getInstantUser();
      if (instantUser?.email === session?.user.email) return;
      const instantToken = await getInstantToken(session!);
      await db.auth.signInWithToken(instantToken);
      console.log("🔑 Signing in with token");
      break;
    case "SIGNED_OUT":
      console.log("🔑 Signing out");
      db.auth.signOut();
      break;
    default:
      break;
  }
});

async function getInstantUser() {
  // Note: this is a hidden API. We'll make this public soon :)
  return await db._core._reactor.getCurrentUser();
}

async function getInstantToken(session: Session) {
  const res = await fetch("http://localhost:3030/signin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ supabaseAccessToken: session.access_token }),
  });
  const json = await res.json();
  return json.instantToken;
}

// --------
// Supabase hooks

function useSupabaseSession() {
  const [state, setState] = useState<{
    isLoading: boolean;
    session: Session | null;
  }>({ isLoading: true, session: null });
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ isLoading: false, session });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ isLoading: false, session });
    });

    return () => subscription.unsubscribe();
  }, []);
  return state;
}

// ----------
// Components

function SupabaseLogin() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="space-y-2">
        <div>
          <h1 className="font-bold">Welcome!</h1>
          <h3>Sign in, powered by supabase auth :)</h3>
        </div>
        <form
          className="space-y-2"
          onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const email = (e.target as any).email.value;
            const ret = await supabase.auth.signInWithOtp({ email });
            if (ret.error) {
              window.alert(ret.error.message);
              return;
            }
            window.alert(
              "✅ Nice, sent you an email! Click the link in your email to sign in."
            );
          }}
        >
          <input
            className="block bg-gray-100 p-2 w-full"
            name="email"
            type="email"
            required
            placeholder="Enter your email"
          />
          <button className="block bg-gray-200 font-bold w-full p-2">
            Send OTP
          </button>
        </form>
      </div>
    </div>
  );
}

// -------------
// Aalright, we are logged in! Here's a quick Instant update to show files.

function AuthorizedApp() {
  const { isLoading, error, data } = db.useQuery({ files: {} });
  if (isLoading) {
    return <div>Loading...</div>
  }
  if (error) {
    return <div>Error: {error.message}</div>
  }
  return (
    <div className="h-full flex items-center justify-center">
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-lg">Instant + Supabase</h1>
          <h3 className="font-bold text-lg">Files (open another tab to see changes live)</h3>
          <ul className="ml-2 list-disc">
            {data.files.map((file: any) => (
              <li key={file.id} className="flex space-between">
                <span>{file.name}</span>
                <button
                  className="ml-2"
                  onClick={() => db.transact(tx.files[file.id].delete())}>
                  🗑️
                </button>
              </li>
            ))}
          </ul>
          <button
            className="block bg-gray-200 font-bold w-full p-2"
            onClick={() => {
              db.transact(tx.files[id()].update({ name: "New File" }))
            }}>
            Add a file!
          </button>
        </div>
        <button
          className="block bg-gray-200 font-bold w-full p-2"
          onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
    </div>
  )
}

export default App;
