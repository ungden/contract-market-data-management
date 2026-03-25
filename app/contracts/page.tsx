"use client";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { db } from "@/firebase";
import { collection, getDocs, query, orderBy, where, deleteDoc, doc } from "firebase/firestore";
import { FileDown, FileText, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { format } from "date-fns";

interface Contract {
  id: string;
  contractNo: string;
  templateName: string;
  companyName: string;
  status: string;
  createdAt: any;
  createdBy: string;
  creatorName: string;
  dataJson: string;
}

export default function ContractsPage() {
  const { profile } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContracts = async () => {
    if (!profile) return;
    try {
      let q = query(collection(db, "contracts"), orderBy("createdAt", "desc"));
      if (profile.role === "market_staff") {
        q = query(collection(db, "contracts"), where("createdBy", "==", profile.uid), orderBy("createdAt", "desc"));
      }
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Contract));
      setContracts(data);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [profile]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contract?")) return;
    try {
      await deleteDoc(doc(db, "contracts", id));
      fetchContracts();
    } catch (error) {
      console.error("Error deleting contract:", error);
    }
  };

  const downloadWord = async (contract: Contract) => {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
      const { saveAs } = await import("file-saver");
      
      const data = JSON.parse(contract.dataJson || "{}");
      
      // Basic document generation
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: contract.templateName.toUpperCase(),
                heading: HeadingLevel.HEADING_1,
                alignment: "center",
              }),
              new Paragraph({
                text: `Contract No: ${contract.contractNo}`,
                alignment: "center",
                spacing: { after: 400 },
              }),
              ...Object.entries(data).map(([key, value]) => {
                return new Paragraph({
                  children: [
                    new TextRun({ text: `${key}: `, bold: true }),
                    new TextRun({ text: String(value) }),
                  ],
                  spacing: { after: 200 },
                });
              }),
              new Paragraph({
                text: "Signatures",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 800, after: 400 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Party A", bold: true }),
                  new TextRun({ text: "\t\t\t\t\t\t" }),
                  new TextRun({ text: "Party B", bold: true }),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${contract.contractNo}_${contract.companyName}.docx`);
    } catch (error) {
      console.error("Error generating docx:", error);
      alert("Failed to generate Word document.");
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
          <p className="text-slate-500">Manage and generate contracts.</p>
        </div>
        {(profile.role === "super_admin" || profile.role === "sale_admin") && (
          <Link href="/contracts/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Contract
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract No</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    Loading contracts...
                  </TableCell>
                </TableRow>
              ) : contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No contracts found.
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.contractNo}</TableCell>
                    <TableCell>{contract.companyName}</TableCell>
                    <TableCell>{contract.templateName}</TableCell>
                    <TableCell>{contract.creatorName}</TableCell>
                    <TableCell>
                      {contract.createdAt?.toDate ? format(contract.createdAt.toDate(), "MMM dd, yyyy") : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={contract.status === "completed" ? "default" : "secondary"}>
                        {contract.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => downloadWord(contract)}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Word
                      </Button>
                      {(profile.role === "super_admin" || profile.role === "sale_admin") && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(contract.id)}>
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
