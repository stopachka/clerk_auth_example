import { useEffect, useRef } from "react";

import { id, init, tx } from "@instantdb/react";

import {
  ClerkProvider,
  useAuth,
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/clerk-react";

// --------
// Instant Setup

const db = init({
  appId: "17dde164-c2d2-4c36-ab52-68b6507df371",
});

// ----
// Clerk Config

const CLERK_PUBLISHABLE_KEY =
  "pk_test_d2VhbHRoeS1zZXJ2YWwtNjguY2xlcmsuYWNjb3VudHMuZGV2JA";

function App() {
  const page = window.location.pathname;
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      {page === "/afterSignIn" ? (
        <SyncInstantWithClerk />
      ) : (
        <header>
          <SignedOut>
            <SignInButton redirectUrl="/afterSignIn" />
          </SignedOut>
          <SignedIn>
            <AuthorizedApp />
          </SignedIn>
        </header>
      )}
    </ClerkProvider>
  );
}

async function getInstantToken(clerkToken: string) {
  const res = await fetch("http://localhost:3030/signin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + clerkToken,
    },
  });
  const json = await res.json();
  return json.instantToken;
}

// ---
// 👇👇👇

function SyncInstantWithClerk() {
  const { getToken } = useAuth();
  useEffectOnce(async () => {
    const clerkToken = await getToken();
    // We could handle errors here, if the token doesn't exist
    const instantToken = await getInstantToken(clerkToken!);
    // Similarly, we could handle errors if this doesn't succeed
    await db.auth.signInWithToken(instantToken);
    window.location.href = "/";
  });
  return <div>Loading...</div>;
}

function useEffectOnce(cb: () => void) {
  const hasRun = useRef(false);
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    cb();
  }, []);
}

// -------------
// Aalright, we are logged in! Here's a quick Instant update to show files.

function AuthorizedApp() {
  const { signOut } = useAuth();
  const { isLoading, error, data } = db.useQuery({ files: {} });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  return (
    <div className="h-full flex items-center justify-center">
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-lg">Instant + Supabase</h1>
          <h3 className="font-bold text-lg">
            Files (open another tab to see changes live)
          </h3>
          <ul className="ml-2 list-disc">
            {data.files.map((file: any) => (
              <li key={file.id} className="flex space-between">
                <span>{file.name}</span>
                <button
                  className="ml-2"
                  onClick={() => db.transact(tx.files[file.id].delete())}
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
          <button
            className="block bg-gray-200 font-bold w-full p-2"
            onClick={() => {
              db.transact(tx.files[id()].update({ name: "New File" }));
            }}
          >
            Add a file!
          </button>
        </div>
        <button
          className="block bg-gray-200 font-bold w-full p-2"
          onClick={() => {
            db.auth.signOut();
            signOut();
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default App;
