'use client'

import AdminDashboard from '../admin-dashboard';

// Prevent prerendering
export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return <AdminDashboard />;
} 