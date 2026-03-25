"use client";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/firebase";
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

export default function NewMarketVisitPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Form state
  const [shopName, setShopName] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [notes, setNotes] = useState("");
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGpsLoading(false);
      },
      (error) => {
        console.error("Error getting location", error);
        alert("Unable to retrieve your location");
        setGpsLoading(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "market_visits"), {
        staffId: profile.uid,
        staffName: profile.displayName,
        visitDate: Timestamp.now(),
        shopName,
        area,
        address,
        contactPerson,
        notes,
        gpsLat: gps?.lat || null,
        gpsLng: gps?.lng || null,
        createdAt: serverTimestamp(),
      });
      router.push("/market-visits");
    } catch (error) {
      console.error("Error creating market visit:", error);
      alert("Failed to save visit record.");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Record Visit</h1>
        <p className="text-slate-500">Enter details of your market visit.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visit Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shopName">Shop / Customer Name *</Label>
              <Input id="shopName" value={shopName} onChange={(e) => setShopName(e.target.value)} required />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="area">Area / Route</Label>
                <Input id="area" value={area} onChange={(e) => setArea(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input id="contactPerson" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes / Feedback</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
            </div>

            <div className="space-y-2 rounded-md border p-4 bg-slate-50">
              <div className="flex items-center justify-between">
                <Label>Location (GPS)</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleGetLocation} disabled={gpsLoading}>
                  {gpsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                  {gps ? "Update Location" : "Get Location"}
                </Button>
              </div>
              {gps && (
                <p className="text-sm text-slate-600 mt-2">
                  Lat: {gps.lat.toFixed(6)}, Lng: {gps.lng.toFixed(6)}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !shopName}>
                {loading ? "Saving..." : "Submit Record"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
