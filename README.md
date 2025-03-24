# Photoblog

A photo management app integrated with blog.

## Dev

Install dependencies

For node:

  ```sh
  npm ci
  ```

For ImageMagick:
  ```sh
  brew install imagemagick
  ```

Run the app

  ```sh
  npx tsx src/index.ts
  ```

Check lint

  ```sh
  npm run lint
  ```

Prisma migration after model change
  
  ```sh
  npx prisma migrate dev --name init
  npx prisma generate
  ```
