import { createBrowserRouter } from 'react-router-dom'

import { AdminLayout } from '@/layouts/AdminLayout'
import { AppRootLayout } from '@/layouts/AppRootLayout'
import { UserLayout } from '@/layouts/UserLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { AdminAdoptionDetailPage } from '@/pages/admin/AdminAdoptionDetailPage'
import { AdminAdoptionsPage } from '@/pages/admin/AdminAdoptionsPage'
import { AdminAnnouncementEditPage } from '@/pages/admin/AdminAnnouncementEditPage'
import { AdminAnnouncementsPage } from '@/pages/admin/AdminAnnouncementsPage'
import { AdminArticleEditPage } from '@/pages/admin/AdminArticleEditPage'
import { AdminArticlesPage } from '@/pages/admin/AdminArticlesPage'
import { AdminCatEditPage } from '@/pages/admin/AdminCatEditPage'
import { AdminCatsPage } from '@/pages/admin/AdminCatsPage'
import { AdminHomePage } from '@/pages/admin/AdminHomePage'
import { AdminMePage } from '@/pages/admin/AdminMePage'
import { AdminSosDetailPage } from '@/pages/admin/AdminSosDetailPage'
import { AdminSosPage } from '@/pages/admin/AdminSosPage'
import { AdminUserDetailPage } from '@/pages/admin/AdminUserDetailPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { LandingRedirect } from '@/pages/shared/LandingRedirect'
import { NotFoundPage } from '@/pages/shared/NotFoundPage'
import { AdoptApplyPage } from '@/pages/user/AdoptApplyPage'
import { ArticleDetailPage } from '@/pages/user/ArticleDetailPage'
import { CatDetailPage } from '@/pages/user/CatDetailPage'
import { CatProfilePage } from '@/pages/user/CatProfilePage'
import { EditProfilePage } from '@/pages/user/EditProfilePage'
import { HomeAltPage } from '@/pages/user/HomeAltPage'
import { HomePage } from '@/pages/user/HomePage'
import { KepuPage } from '@/pages/user/KepuPage'
import { LeaderboardPage } from '@/pages/user/LeaderboardPage'
import { NewCatPage } from '@/pages/user/NewCatPage'
import { PublishPage } from '@/pages/user/PublishPage'
import { RewardsPage } from '@/pages/user/RewardsPage'
import { SosReportPage } from '@/pages/user/SosReportPage'
import { UserCenterPage } from '@/pages/user/UserCenterPage'
import { UserMePage } from '@/pages/user/UserMePage'
import { RequireRole } from '@/router/guards'
import { UserRole } from '@/types/enums'

const userAccessibleRoles = [UserRole.User, UserRole.Guest]

export const router = createBrowserRouter([
  {
    element: <AppRootLayout />,
    children: [
      { index: true, element: <LandingRedirect /> },
      { path: '/login', element: <LoginPage /> },
      {
        path: '/user',
        element: (
          <RequireRole allow={userAccessibleRoles}>
            <UserLayout />
          </RequireRole>
        ),
        children: [
          { path: 'home', element: <HomePage /> },
          { path: 'home-alt', element: <HomeAltPage /> },
          { path: 'cats/:id', element: <CatDetailPage /> },
          { path: 'cats/:id/profile', element: <CatProfilePage /> },
          {
            path: 'publish',
            element: (
              <RequireRole allow={[UserRole.User]}>
                <PublishPage />
              </RequireRole>
            ),
          },
          {
            path: 'new-cat',
            element: (
              <RequireRole allow={[UserRole.User]}>
                <NewCatPage />
              </RequireRole>
            ),
          },
          {
            path: 'sos/report',
            element: (
              <RequireRole allow={[UserRole.User]}>
                <SosReportPage />
              </RequireRole>
            ),
          },
          {
            path: 'leaderboard',
            element: (
              <RequireRole allow={[UserRole.User]}>
                <LeaderboardPage />
              </RequireRole>
            ),
          },
          {
            path: 'adopt/apply',
            element: (
              <RequireRole allow={[UserRole.User]}>
                <AdoptApplyPage />
              </RequireRole>
            ),
          },
          {
            path: 'rewards',
            element: (
              <RequireRole allow={[UserRole.User]}>
                <RewardsPage />
              </RequireRole>
            ),
          },
          { path: 'kepu', element: <KepuPage /> },
          { path: 'articles/:id', element: <ArticleDetailPage /> },
          {
            path: 'me',
            element: (
              <RequireRole allow={[UserRole.User]}>
                <UserMePage />
              </RequireRole>
            ),
          },
          {
            path: 'me-center',
            element: (
              <RequireRole allow={[UserRole.User]}>
                <UserCenterPage />
              </RequireRole>
            ),
          },
          {
            path: 'me/edit',
            element: (
              <RequireRole allow={[UserRole.User]}>
                <EditProfilePage />
              </RequireRole>
            ),
          },
        ],
      },
      {
        path: '/admin',
        element: (
          <RequireRole allow={[UserRole.Admin]}>
            <AdminLayout />
          </RequireRole>
        ),
        children: [
          { path: 'home', element: <AdminHomePage /> },
          { path: 'cats', element: <AdminCatsPage /> },
          { path: 'cats/:id/edit', element: <AdminCatEditPage /> },
          { path: 'adoptions', element: <AdminAdoptionsPage /> },
          { path: 'adoptions/:id', element: <AdminAdoptionDetailPage /> },
          { path: 'sos', element: <AdminSosPage /> },
          { path: 'sos/:id', element: <AdminSosDetailPage /> },
          { path: 'announcements', element: <AdminAnnouncementsPage /> },
          { path: 'announcements/:id/edit', element: <AdminAnnouncementEditPage /> },
          { path: 'articles', element: <AdminArticlesPage /> },
          { path: 'articles/:id/edit', element: <AdminArticleEditPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'users/:id', element: <AdminUserDetailPage /> },
          { path: 'me', element: <AdminMePage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
