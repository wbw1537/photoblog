# Photoblog

A photo management app integrated with blog.

## Dev

Install dependencies

  ```sh
  npm ci
  ```

Run the app

  ```sh
  npx tsx src/index.ts
  ```

Check lint

  ```sh
  npm lint
  ```

Prisma migration after model change
  
  ```sh
  npx prisma migrate dev --name init
  npx prisma generate
  ```