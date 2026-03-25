"use client";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/firebase";
import { collection, getDocs, query, orderBy, where, deleteDoc, doc } from "firebase/firestore";
import { Download, Plus, Trash2, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { format } from "date-fns";

interface MarketVisit {
  id: string;
  staffId: string;
  staffName: string;
  visitDate: any;
  area: string;
  shopName: string;
  address: string;
  contactPerson: string;
  notes: string;
  photoUrl: string;
  gpsLat: number;
  gpsLng: number;
  createdAt: any;
}

export default function MarketVisitsPage() {
  const { profile } = useAuth();
  const [visits, setVisits] = useState<MarketVisit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisits = async () => {
    if (!profile) return;
    try {
      let q = query(collection(db, "market_visits"), orderBy("visitDate", "desc"));
      if (profile.role === "market_staff") {
        q = query(collection(db, "market_visits"), where("staffId", "==", profile.uid), orderBy("visitDate", "desc"));
      }
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MarketVisit));
      setVisits(data);
    } catch (error) {
      console.error("Error fetching visits:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [profile]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      await deleteDoc(doc(db, "market_visits", id));
      fetchVisits();
    } catch (error) {
      console.error("Error deleting visit:", error);
    }
  };

  const exportToExcel = async () => {
    try {
      const { utils, writeFile } = await import("xlsx");
      const exportData = visits.map((v) => ({
        "Date": v.visitDate?.toDate ? format(v.visitDate.toDate(), "yyyy-MM-dd HH:mm") : "",
        "Staff Name": v.staffName,
        "Area": v.area || "",
        "Shop Name": v.shopName,
        "Address": v.address || "",
        "Contact": v.contactPerson || "",
        "Notes": v.notes || "",
        "GPS": v.gpsLat && v.gpsLng ? `${v.gpsLat}, ${v.gpsLng}` : "",
      }));

      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Market Visits");
      writeFile(wb, `Market_Visits_${format(new Date(), "yyyyMMdd")}.xlsx`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export Excel file.");
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Visits</h1>
          <p className="text-slate-500">Record and review field data.</p>
        </div>
        <div className="flex space-x-2">
          {(profile.role === "super_admin" || profile.role === "manager" || profile.role === "sale_admin") && (
            <Button variant="outline" onClick={exportToExcel} disabled={visits.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          )}
          <Link href="/market-visits/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Visit
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Shop Name</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Loading visits...
                  </TableCell>
                </TableRow>
              ) : visits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No market visits found.
                  </TableCell>
                </TableRow>
              ) : (
                visits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell className="whitespace-nowrap">
                      {visit.visitDate?.toDate ? format(visit.visitDate.toDate(), "MMM dd, yyyy HH:mm") : "N/A"}
                    </TableCell>
                    <TableCell>{visit.staffName}</TableCell>
                    <TableCell className="font-medium">{visit.shopName}</TableCell>
                    <TableCell>{visit.area}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{visit.notes}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {visit.gpsLat && visit.gpsLng && (
                        <a
                          href={`https://maps.google.com/?q=${visit.gpsLat},${visit.gpsLng}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button variant="ghost" size="sm" title="View on Map">
                            <MapPin className="h-4 w-4 text-indigo-500" />
                          </Button>
                        </a>
                      )}
                      {(profile.role === "super_admin" || profile.role === "manager") && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(visit.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
