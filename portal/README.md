
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Student Registration Backend

The app uses Mongoose and a local MongoDB database named `placement_portal`. The default connection is `mongodb://127.0.0.1:27017/placement_portal`. Copy `.env.example` to `.env.local` to override `MONGODB_URI`.

Start MongoDB, then start the app from this directory:

```bash
npm run dev
```

The app is configured with the `/phdplacement` base path. Student profile and fee data are read from the `students` collection. Coordinator announcements are stored in `announcements`; student read/bookmark state is stored on the student document. Coordinators update CV review and fee states through `PATCH /api/students/[rollNumber]/review`.

Profile photos and CV PDFs are stored outside `public/` under `uploads/students/<roll_number>/`. Filenames use `<roll_number>_profile.<ext>` and `<roll_number>_cv1.pdf` through `<roll_number>_cv3.pdf`. The `uploads/` directory must be writable and is ignored by Git. For multi-instance or deployed environments, move file storage to shared object storage.

The current UI still uses the app's demo role selector rather than production authentication. The student API is seeded for demo roll number `240101010`; replace the demo identity and cookie-based role checks with the institution's authenticated user/session before exposing this backend to real users.
