import type { ComponentType } from 'react';
import { BadgesPage } from '@admin/pages/badges';
import { CourseEditPage, CourseNewPage, CoursesPage } from '@admin/pages/courses';
import { DashboardPage } from '@admin/pages/dashboard';
import {
  DestinationDetailPage,
  DestinationEditPage,
  DestinationNewPage,
  DestinationsPage,
} from '@admin/pages/destinations';
import { ReportsPage } from '@admin/pages/reports';
import { StampsPage } from '@admin/pages/stamps';
import { UserDetailPage, UsersPage } from '@admin/pages/users';

/** 위에서부터 맞춰 봅니다. 'new'가 ':id'보다 먼저 와야 합니다. */
export const ROUTES: { pattern: string; Page: ComponentType }[] = [
  { pattern: '/dashboard', Page: DashboardPage },
  { pattern: '/destinations', Page: DestinationsPage },
  { pattern: '/destinations/new', Page: DestinationNewPage },
  { pattern: '/destinations/:id', Page: DestinationDetailPage },
  { pattern: '/destinations/:id/edit', Page: DestinationEditPage },
  { pattern: '/courses', Page: CoursesPage },
  { pattern: '/courses/new', Page: CourseNewPage },
  { pattern: '/courses/:id/edit', Page: CourseEditPage },
  { pattern: '/stamps', Page: StampsPage },
  { pattern: '/badges', Page: BadgesPage },
  { pattern: '/users', Page: UsersPage },
  { pattern: '/users/:id', Page: UserDetailPage },
  { pattern: '/reports', Page: ReportsPage },
];
