# Clerk Auth Example 

How do you integrate clerk auth with Instant? This repo gives you an example to do just that! 

To run everything: 

```
cd server
yarn 
yarn dev
```

```
cd frontend
yarn 
yarn dev
```

Now load the page on http://localhost:5173 and get playin :) 

There's two files to understand: 

1. [server/src/index.ts](https://github.com/stopachka/clerk_auth_example/blob/main/server/src/index.ts#L44-L48)
   1. This creates an endpoint that generates instant tokens
2. [frontend/src/App.tsx](https://github.com/stopachka/clerk_auth_example/blob/main/frontend/src/App.tsx#L61-L72)
   1. This handles sync between Clerk and Instant!
