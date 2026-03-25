"use client";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/firebase";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface TemplateField {
  name: string;
  label: string;
  type: string;
}

interface Template {
  id: string;
  name: string;
  fieldsJson: string;
}

export default function NewContractPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Core fields
  const [contractNo, setContractNo] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    async function fetchTemplates() {
      const snap = await getDocs(collection(db, "contract_templates"));
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Template));
      setTemplates(data);
    }
    fetchTemplates();
  }, []);

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      try {
        const parsedFields = JSON.parse(template.fieldsJson || "[]");
        setFields(parsedFields);
        // Reset form data
        const initialData: Record<string, string> = {};
        parsedFields.forEach((f: TemplateField) => {
          initialData[f.name] = "";
        });
        setFormData(initialData);
      } catch (error) {
        console.error("Error parsing fields", error);
      }
    } else {
      setSelectedTemplate(null);
      setFields([]);
    }
  };

  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedTemplate) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "contracts"), {
        contractNo,
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        companyName,
        dataJson: JSON.stringify(formData),
        createdBy: profile.uid,
        creatorName: profile.displayName,
        createdAt: serverTimestamp(),
        status: "completed",
      });
      router.push("/contracts");
    } catch (error) {
      console.error("Error creating contract:", error);
      alert("Failed to create contract.");
    } finally {
      setLoading(false);
    }
  };

  if (!profile || (profile.role !== "super_admin" && profile.role !== "sale_admin")) {
    return <div>Access Denied</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Contract</h1>
        <p className="text-slate-500">Fill in the details to generate a new contract.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contract Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="template">Select Template</Label>
                <select
                  id="template"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  required
                >
                  <option value="">-- Select a template --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractNo">Contract Number</Label>
                <Input id="contractNo" value={contractNo} onChange={(e) => setContractNo(e.target.value)} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="companyName">Company Name (Partner)</Label>
                <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
              </div>
            </div>

            {fields.length > 0 && (
              <div className="space-y-4 rounded-md border p-4 bg-slate-50">
                <h3 className="font-medium text-lg">Dynamic Fields</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {fields.map((field) => (
                    <div key={field.name} className={`space-y-2 ${field.type === "textarea" ? "md:col-span-2" : ""}`}>
                      <Label htmlFor={field.name}>{field.label}</Label>
                      {field.type === "textarea" ? (
                        <Textarea
                          id={field.name}
                          value={formData[field.name] || ""}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          required
                        />
                      ) : (
                        <Input
                          id={field.name}
                          type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                          value={formData[field.name] || ""}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          required
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !selectedTemplate}>
                {loading ? "Generating..." : "Generate & Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
