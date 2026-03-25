"use client";

import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MapPin, Users, TrendingUp, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    contracts: 0,
    visits: 0,
    templates: 0,
  });

  useEffect(() => {
    if (!loading && !profile) {
      router.push("/login");
    }
  }, [profile, loading, router]);

  useEffect(() => {
    async function fetchStats() {
      if (!profile) return;

      try {
        // Fetch contracts count
        let contractsQuery = collection(db, "contracts");
        if (profile.role === "market_staff") {
          // Market staff shouldn't see this, but just in case
          contractsQuery = query(collection(db, "contracts"), where("createdBy", "==", profile.uid)) as any;
        }
        const contractsSnap = await getDocs(contractsQuery);
        
        // Fetch visits count
        let visitsQuery = collection(db, "market_visits");
        if (profile.role === "market_staff") {
          visitsQuery = query(collection(db, "market_visits"), where("staffId", "==", profile.uid)) as any;
        }
        const visitsSnap = await getDocs(visitsQuery);

        // Fetch templates count
        const templatesSnap = await getDocs(collection(db, "contract_templates"));

        setStats({
          contracts: contractsSnap.size,
          visits: visitsSnap.size,
          templates: templatesSnap.size,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    }

    fetchStats();
  }, [profile]);

  if (loading || !profile) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-slate-500">Welcome back, {profile.displayName}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(profile.role === "super_admin" || profile.role === "sale_admin" || profile.role === "manager") && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
              <FileText className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.contracts}</div>
              <p className="text-xs text-slate-500">Generated contracts</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Visits</CardTitle>
            <MapPin className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.visits}</div>
            <p className="text-xs text-slate-500">Recorded visits</p>
          </CardContent>
        </Card>

        {(profile.role === "super_admin" || profile.role === "sale_admin") && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
              <Settings className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.templates}</div>
              <p className="text-xs text-slate-500">Available for generation</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
