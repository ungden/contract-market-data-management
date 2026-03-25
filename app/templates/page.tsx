"use client";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/firebase";
import { collection, addDoc, getDocs, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface TemplateField {
  name: string;
  label: string;
  type: string;
}

interface Template {
  id: string;
  name: string;
  type: string;
  description: string;
  fieldsJson: string;
}

export default function TemplatesPage() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<TemplateField[]>([{ name: "", label: "", type: "text" }]);

  const fetchTemplates = async () => {
    const snap = await getDocs(collection(db, "contract_templates"));
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Template));
    setTemplates(data);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleAddField = () => {
    setFields([...fields, { name: "", label: "", type: "text" }]);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, key: keyof TemplateField, value: string) => {
    const newFields = [...fields];
    newFields[index][key] = value;
    setFields(newFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "contract_templates"), {
        name,
        type,
        description,
        fieldsJson: JSON.stringify(fields),
        createdAt: serverTimestamp(),
      });
      setOpen(false);
      setName("");
      setType("");
      setDescription("");
      setFields([{ name: "", label: "", type: "text" }]);
      fetchTemplates();
    } catch (error) {
      console.error("Error adding template:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteDoc(doc(db, "contract_templates", id));
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  if (!profile || (profile.role !== "super_admin" && profile.role !== "sale_admin")) {
    return <div>Access Denied</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contract Templates</h1>
          <p className="text-slate-500">Manage templates for generating contracts.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Document Type</Label>
                  <Input id="type" placeholder="e.g., Sales Contract, Quote" value={type} onChange={(e) => setType(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div className="space-y-4 rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Template Fields</h3>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddField}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Field
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <div key={index} className="flex items-end gap-2">
                    <div className="flex-1 space-y-2">
                      <Label>Field Key (e.g., company_name)</Label>
                      <Input value={field.name} onChange={(e) => handleFieldChange(index, "name", e.target.value)} required />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label>Display Label</Label>
                      <Input value={field.label} onChange={(e) => handleFieldChange(index, "label", e.target.value)} required />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label>Type</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.type}
                        onChange={(e) => handleFieldChange(index, "type", e.target.value)}
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="textarea">Long Text</option>
                      </select>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveField(index)} disabled={fields.length === 1}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Template"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Fields Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No templates found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => {
                  const fieldsCount = JSON.parse(template.fieldsJson || "[]").length;
                  return (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{template.type}</TableCell>
                      <TableCell>{template.description}</TableCell>
                      <TableCell>{fieldsCount}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
