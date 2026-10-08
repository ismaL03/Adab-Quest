import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration } from 'react-router';
import { AppShell } from '@/components/AppShell';
import { Toaster } from '@/components/Toaster';
import { useThemeSync } from '@/components/useTheme';
import { Welcome } from '@/components/Welcome';
import HomePage from '@/pages/HomePage';

// Les écrans secondaires sont chargés à la demande (bundle initial plus léger).
const LessonPage = lazy(() => import('@/pages/LessonPage'));
const MushafPage = lazy(() => import('@/pages/MushafPage'));
const AlphabetPage = lazy(() => import('@/pages/AlphabetPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function PageFallback() {
  return (
    <div className="grid min-h-[60dvh] place-items-center" aria-busy="true">
      <span className="size-10 animate-spin rounded-full border-[3px] border-line-strong border-t-primary" />
    </div>
  );
}

function RootLayout() {
  useThemeSync();
  return (
    <>
      <div className="app-backdrop" />
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
      <Toaster />
      <Welcome />
      <ScrollRestoration />
    </>
  );
}

const router = createBrowserRouter(
  [
    {
      element: <RootLayout />,
      children: [
        {
          element: <AppShell />,
          children: [
            { index: true, element: <HomePage /> },
            { path: 'mushaf', element: <MushafPage /> },
            { path: 'alphabet', element: <AlphabetPage /> },
            { path: 'profil', element: <ProfilePage /> },
          ],
        },
        { path: 'lecon/:lessonId', element: <LessonPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
);

export default function App() {
  return <RouterProvider router={router} />;
}
