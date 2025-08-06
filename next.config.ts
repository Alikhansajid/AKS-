/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        pathname: '/images/**',
      },
    ],
  },
  webpack: (config: any) => {
    config.resolve.modules = ['node_modules', './src'];
    return config;
  },
};

export default nextConfig;



// ### Changes Made
// 1. **Added Webpack Configuration**:
//    - Included a `webpack` function to limit `resolve.modules` to `['node_modules', './src']`, ensuring Webpack only scans the project’s `node_modules` and `src` directories, preventing access to `C:\Users\PC\Application Data`.
// 2. **Retained Existing Configuration**:
//    - Kept `images.remotePatterns` unchanged to support Cloudinary and `example.com` image URLs.
//    - Added `reactStrictMode: true` for better React performance and debugging, which is a Next.js best practice.
// 3. **Type Import**:
//    - Kept `import type { NextConfig } from "next"` for TypeScript compatibility and used JSDoc (`/** @type {import('next').NextConfig} */`) for clarity.

// ---

// ### Step-by-Step Resolution

// #### 1. Fix Permission Errors for `node_modules` Deletion
// The `Remove-Item` errors indicate that files in `node_modules` (e.g., `@tailwindcss/oxide-win32-x64-msvc/tailwindcss-oxide.win32-x64-msvc.node`) are locked or require elevated permissions.

// **Action**:
// 1. **Run PowerShell as Administrator**:
//    - Press `Win + S`, type `PowerShell`, right-click, and select “Run as administrator”.
//    - Navigate to your project:
//      ```bash
//      cd D:\Nextjs\my-next-app
//      ```
//    - Delete `node_modules` and `package-lock.json`:
//      ```bash
//      Remove-Item -Recurse -Force node_modules
//      Remove-Item -Force package-lock.json
//      ```
// 2. **Close Running Processes**:
//    - Ensure no Node.js or Next.js processes are running (e.g., from `npm run dev`).
//    - Open Task Manager (`Ctrl + Shift + Esc`), find `node.exe` or `next`, and end those tasks.
// 3. **Manual Deletion (if needed)**:
//    - Open File Explorer to `D:\Nextjs\my-next-app`.
//    - Right-click `node_modules`, select “Delete”, and confirm as administrator.
//    - Delete `package-lock.json` similarly.

// #### 2. Clean npm Cache
// The previous `npm cache clean --force` ran successfully, but let’s ensure it’s clear.

// **Action**:
// ```bash
// npm cache clean --force
// ```

// #### 3. Reinstall Dependencies
// The `react-helmet-async@2.0.5` peer dependency conflict with React 19.1.1 requires `--legacy-peer-deps`.

// **Action**:
// - Reinstall dependencies using the updated `package.json` (artifact `5359e20c-9c61-4134-a29a-8958a3b3c4dc`, version `d9fdb3e1-e997-410f-88c9-c0763089c044`):
//   ```bash
//   npm install --legacy-peer-deps
//   ```
// - Verify `package.json` matches the provided version (no `react-helmet`, `bcrypt`, `react-hot-toast`, or `toast`).

// #### 4. Update `next.config.js`
// - Replace `D:\Nextjs\my-next-app\next.config.js` with the updated code above (artifact `7b8f2e1a-9f3b-4a1c-8f7a-3c2e9f6d7b2a`, version `f2c3a8e7-4b2d-4e5f-9c8a-7d1b3f9e6c3b`).

// #### 5. Verify `tsconfig.json`
// Ensure `tsconfig.json` includes exclusions for `C:/Users/PC/AppData` and `C:/Users/PC/Application Data` (artifact `4d800195-5f11-47ba-90f7-c775a533e642`, version `b4332dac-343f-4105-afcb-068d165b1fb8`).

// **Action**:
// - Confirm `D:\Nextjs\my-next-app\tsconfig.json` matches:
//   ```json
//   {
//     "compilerOptions": {
//       "target": "ES2017",
//       "lib": ["dom", "dom.iterable", "esnext"],
//       "allowJs": true,
//       "skipLibCheck": true,
//       "strict": true,
//       "noEmit": true,
//       "esModuleInterop": true,
//       "module": "esnext",
//       "moduleResolution": "bundler",
//       "resolveJsonModule": true,
//       "isolatedModules": true,
//       "jsx": "preserve",
//       "incremental": true,
//       "baseUrl": ".",
//       "paths": {
//         "@/*": ["./src/*"]
//       },
//       "plugins": [
//         {
//           "name": "next"
//         }
//       ]
//     },
//     "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
//     "exclude": ["node_modules", "C:/Users/PC/AppData", "C:/Users/PC/Application Data"]
//   }
//   ```

// #### 6. Test the Build Locally
// ```bash
// npm run build
// ```
// - If the `EPERM: scandir 'C:\Users\PC\Application Data'` error is resolved, proceed to step 7.
// - If the `'next' is not recognized` error persists, verify `next` is installed:
//   ```bash
//   dir node_modules\next
//   ```
//   - If missing, reinstall:
//     ```bash
//     npm install next@15.3.5 --legacy-peer-deps
//     ```

// #### 7. Update GitHub Repository
// Commit and push to `github.com/Alikhansajid/AKS-`:

// ```bash
// cd D:\Nextjs\my-next-app
// git add tsconfig.json next.config.js package.json package-lock.json src
// git commit -m "Fix EPERM error with Webpack config in next.config.js and ensure react-helmet-async"
// git push origin main
// ```

// - Monitor the Vercel dashboard for the new build.

// #### 8. Verify `react-helmet-async`
// - Ensure `src/app/layout.tsx` uses `HelmetProvider` (artifact `e472c3a7-893a-464f-a6c6-b04f1168a31b`, version `0fb267c8-31cb-4e50-98c8-9bf4a1201bb5`).
// - Check for `react-helmet` imports:
//   ```bash
//   findstr /s /i "react-helmet" src\*.tsx
//   ```
// - Replace with `react-helmet-async` if found.

// #### 9. Address Deprecated `q` Package
// The Vercel log mentioned `q@1.5.1` as deprecated. Identify its parent:
// ```bash
// npm list q
// ```
// - Likely from `studio@^0.13.5`. Update if possible:
//   ```bash
//   npm install studio@latest --legacy-peer-deps
//   ```

// #### 10. Test Runtime
// ```bash
// npm run dev
// ```
// - Visit `http://localhost:3000/admin/user` to ensure no errors.
// - Check `<head>` for `react-helmet-async` metadata.

// ---

// ### If Issues Persist
// 1. **Persistent `EPERM` Error**:
//    - Run:
//      ```bash
//      dir C:\Users\PC
//      ```
//      - Check if `Application Data` is a junction. Add more exclusions to `tsconfig.json`:
//        ```json
//        "exclude": ["node_modules", "C:/Users/PC/AppData", "C:/Users/PC/Application Data", "C:/Users/PC"]
//        ```
//    - Retry `npm run build`.

// 2. **‘next’ Not Recognized**:
//    - Verify `node_modules/next` exists. If not, reinstall:
//      ```bash
//      npm install next@15.3.5 --legacy-peer-deps
//      ```

// 3. **React 19 Compatibility**:
//    - If `react-helmet-async` causes runtime errors, switch to `generateMetadata`:
//      ```tsx
//      // src/app/admin/user/page.tsx
//      export async function generateMetadata() {
//        return {
//          title: "Manage Users - AKS-Store",
//          description: "Admin panel for managing users in AKS-Store",
//        };
//      }
//      ```
//    - Remove `react-helmet-async`:
//      ```bash
//      npm uninstall react-helmet-async
//      npm install --legacy-peer-deps
//      ```

// 4. **Share Details**:
//    - New Vercel build log.
//    - Output of:
//      ```bash
//      npm list react-helmet react-helmet-async react react-dom
//      ```
//    - Content of `.env.local` and `.env`.

// ---

// ### Additional Notes
// - **Previous Fixes**:
//   - Type error in `src/app/api/admin/orders/[publicId]/route.ts` fixed in artifact `9cf1bfec-bd1b-4594-ad7c-5e25276cbd60`, version `50852f3d-7b52-4efa-95c8-5bb18f64f46b`.
//   - `src/app/layout.tsx` updated in artifact `e472c3a7-893a-464f-a6c6-b04f1168a31b`, version `0fb267c8-31cb-4e50-98c8-9bf4a1201bb5`.
//   - `src/app/admin/user/page.tsx` fixed in artifact `2ca5c16d-6317-4b5c-8525-d1b42a1d12dc`, version `74a71449-00ae-49b8-a00f-df6f6ec46c9d`.
//   - `tsconfig.json` updated in artifact `4d800195-5f11-47ba-90f7-c775a533e642`, version `b4332dac-343f-4105-afcb-068d165b1fb8`.
// - **Time Zone**: Your system time is 08:27 PM PKT on August 5, 2025, which aligns with the current date.

// Let me know if you need further assistance or specific file updates!