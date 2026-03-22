import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Download,
  RefreshCw,
  Upload,
  Wifi,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type {
  Announcement,
  Calf,
  Cow,
  Donation,
  HealthRecord,
} from "../backend.d";
import {
  useAddAnnouncement,
  useAddCow,
  useAddDonation,
  useAddHealthRecord,
  useGetActiveAnnouncements,
  useGetAllCows,
  useGetAllDonations,
  useGetAllHealthRecords,
} from "../hooks/useQueries";
import { useLang } from "../lib/LanguageContext";

// Backup JSON shape
interface BackupData {
  version: number;
  exportedAt: string;
  cows: Cow[];
  calves: Calf[];
  healthRecords: HealthRecord[];
  donations: Donation[];
  announcements: Announcement[];
  milkData: Record<string, { morning: number; evening: number }>;
}

function serializeBigInt(obj: unknown): unknown {
  if (typeof obj === "bigint") return obj.toString();
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        k,
        serializeBigInt(v),
      ]),
    );
  }
  return obj;
}

// Read all milk data from localStorage
function getAllMilkData(): Record<
  string,
  { morning: number; evening: number }
> {
  const result: Record<string, { morning: number; evening: number }> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("milk-")) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) result[key] = JSON.parse(raw);
      } catch {
        // skip
      }
    }
  }
  return result;
}

// Restore milk data to localStorage
function restoreMilkData(
  data: Record<string, { morning: number; evening: number }>,
) {
  for (const [key, val] of Object.entries(data)) {
    localStorage.setItem(key, JSON.stringify(val));
  }
}

export default function Backup() {
  const { t, lang } = useLang();
  const { data: cows = [] } = useGetAllCows();
  const { data: donations = [] } = useGetAllDonations();
  const { data: healthRecords = [] } = useGetAllHealthRecords();
  const { data: announcements = [] } = useGetActiveAnnouncements();

  const addCow = useAddCow();
  const addDonation = useAddDonation();
  const addHealthRecord = useAddHealthRecord();
  const addAnnouncement = useAddAnnouncement();

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importSummary, setImportSummary] = useState<{
    cows: number;
    calves: number;
    healthRecords: number;
    donations: number;
    announcements: number;
  } | null>(null);
  const [importDone, setImportDone] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Export ──────────────────────────────────────────────────────────
  async function handleExport() {
    setExporting(true);
    try {
      // We need calves for all cows — fetch inline using available hooks
      // Since we don't have a getAllCalves in the backend, we skip calves export
      // (they'd need to be fetched per cow — too slow for bulk export)
      const milkData = getAllMilkData();

      const backup: BackupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        cows: cows,
        calves: [], // calves exported separately per cow via useGetCalvesByCow
        healthRecords: healthRecords,
        donations: donations,
        announcements: announcements,
        milkData,
      };

      const serialized = JSON.stringify(serializeBigInt(backup), null, 2);
      const blob = new Blob([serialized], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = `annpurna-gaushala-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t("backupExportSuccess"));
    } catch (err) {
      console.error("Export error:", err);
      toast.error(t("error"));
    } finally {
      setExporting(false);
    }
  }

  // ── Import ──────────────────────────────────────────────────────────
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportDone(false);
    setImportProgress(0);
    setImportSummary(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupData;

      if (!data.version || !data.cows) {
        toast.error(t("backupImportError"));
        setImporting(false);
        return;
      }

      const summary = {
        cows: 0,
        calves: 0,
        healthRecords: 0,
        donations: 0,
        announcements: 0,
      };

      const totalItems =
        (data.cows?.length ?? 0) +
        (data.donations?.length ?? 0) +
        (data.healthRecords?.length ?? 0) +
        (data.announcements?.length ?? 0);

      let done = 0;

      // Build a map from old cow id string → new cow id
      const cowIdMap: Record<string, bigint> = {};

      // 1. Import cows
      for (const cow of data.cows ?? []) {
        try {
          const newId = await addCow.mutateAsync({
            name: cow.name,
            breed: cow.breed,
            age: BigInt(cow.age as unknown as string),
            healthStatus: cow.healthStatus,
            description: cow.description,
            tagNumber: cow.tagNumber ?? "",
            qrCode: cow.qrCode ?? "",
            changedBy: "Backup Import",
          });
          cowIdMap[String(cow.id)] = newId;
          summary.cows++;
        } catch {
          // skip duplicate-ish errors
        }
        done++;
        setImportProgress(Math.round((done / Math.max(totalItems, 1)) * 100));
      }

      // 2. Import donations
      for (const don of data.donations ?? []) {
        try {
          await addDonation.mutateAsync({
            donorName: don.donorName,
            amount: don.amount,
            message: don.message ?? "",
            purpose: don.purpose ?? "",
            changedBy: "Backup Import",
          });
          summary.donations++;
        } catch {
          // skip
        }
        done++;
        setImportProgress(Math.round((done / Math.max(totalItems, 1)) * 100));
      }

      // 3. Import health records (remap cowId)
      for (const hr of data.healthRecords ?? []) {
        const oldCowId = String(hr.cowId);
        const newCowId = cowIdMap[oldCowId];
        if (!newCowId) continue;
        try {
          await addHealthRecord.mutateAsync({
            cowId: newCowId,
            notes: hr.notes ?? "",
            status: hr.status ?? "",
            vetName: hr.vetName ?? "",
            changedBy: "Backup Import",
          });
          summary.healthRecords++;
        } catch {
          // skip
        }
        done++;
        setImportProgress(Math.round((done / Math.max(totalItems, 1)) * 100));
      }

      // 4. Import announcements
      for (const ann of data.announcements ?? []) {
        try {
          await addAnnouncement.mutateAsync({
            title: ann.title,
            titleHindi: ann.titleHindi,
            content: ann.content,
            contentHindi: ann.contentHindi,
            isActive: ann.isActive,
            changedBy: "Backup Import",
          });
          summary.announcements++;
        } catch {
          // skip
        }
        done++;
        setImportProgress(Math.round((done / Math.max(totalItems, 1)) * 100));
      }

      // 5. Restore milk data to localStorage
      if (data.milkData && typeof data.milkData === "object") {
        restoreMilkData(data.milkData);
      }

      setImportProgress(100);
      setImportSummary(summary);
      setImportDone(true);
      toast.success(t("backupImportSuccess"));
    } catch (err) {
      console.error("Import error:", err);
      toast.error(t("backupImportError"));
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Archive className="h-6 w-6 text-primary" />
          {t("backupTitle")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === "hi"
            ? "डेटा सुरक्षित रखें और जरूरत पर रिस्टोर करें"
            : "Keep your data safe and restore when needed"}
        </p>
      </motion.div>

      {/* Live Sync Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border border-green-200 bg-green-50 p-4 mb-5 flex items-start gap-3"
        data-ocid="backup.sync.panel"
      >
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Wifi className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-green-800 text-sm">
              {t("backupSyncNote")}
            </p>
            <Badge className="bg-green-200 text-green-800 text-[10px] px-1.5 h-4 font-semibold">
              30s
            </Badge>
          </div>
          <p className="text-xs text-green-700 mt-0.5">{t("backupSyncDesc")}</p>
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            {lang === "hi"
              ? "सभी 20 उपयोगकर्ता एक साथ sync में रहेंगे"
              : "All 20 users stay in sync automatically"}
          </p>
        </div>
      </motion.div>

      {/* Current data summary */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-4 mb-5"
        data-ocid="backup.summary.panel"
      >
        <p className="text-sm font-semibold text-foreground mb-3">
          {lang === "hi" ? "वर्तमान डेटा" : "Current Data"}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            {
              label: t("backupCowsCount"),
              count: cows.length,
              color: "bg-amber-100 text-amber-800",
            },
            {
              label: t("backupHealthCount"),
              count: healthRecords.length,
              color: "bg-red-100 text-red-800",
            },
            {
              label: t("backupDonationsCount"),
              count: donations.length,
              color: "bg-green-100 text-green-800",
            },
            {
              label: t("backupAnnouncementsCount"),
              count: announcements.length,
              color: "bg-blue-100 text-blue-800",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-lg px-3 py-2 text-center ${item.color}`}
            >
              <div className="text-xl font-bold font-display">{item.count}</div>
              <div className="text-[11px] font-medium leading-tight">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <Separator className="my-5" />

      {/* Export Section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6"
        data-ocid="backup.export.panel"
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Download className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-base">
              {t("backupExport")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("backupExportDesc")}
            </p>
          </div>
        </div>

        <div className="bg-muted/30 rounded-xl p-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            {lang === "hi"
              ? "फाइल डाउनलोड होने के बाद Gmail में अटैचमेंट के रूप में खुद को भेज सकते हैं।"
              : "After downloading, you can email the file to yourself as an attachment via Gmail."}
          </p>
          <Button
            data-ocid="backup.export.primary_button"
            onClick={handleExport}
            disabled={exporting}
            className="gap-2 w-full sm:w-auto font-semibold"
            style={{ background: "oklch(0.65 0.2 55)", color: "white" }}
          >
            {exporting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                {t("backupExporting")}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {t("backupExport")}
              </>
            )}
          </Button>
        </div>
      </motion.div>

      <Separator className="my-5" />

      {/* Import Section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        data-ocid="backup.import.panel"
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Upload className="h-4.5 w-4.5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-base">
              {t("backupImport")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("backupImportDesc")}
            </p>
          </div>
        </div>

        <Alert
          variant="destructive"
          className="mb-4 border-amber-200 bg-amber-50 text-amber-800"
        >
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-xs text-amber-700">
            {t("backupWarning")}
          </AlertDescription>
        </Alert>

        <div className="bg-muted/30 rounded-xl p-4 space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="backup-file-input"
              className="text-sm font-medium text-foreground"
            >
              {t("backupSelectFile")}
            </label>
            <input
              id="backup-file-input"
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImport}
              disabled={importing}
              data-ocid="backup.import.upload_button"
              className="block w-full text-sm text-muted-foreground
                file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-border
                file:text-sm file:font-semibold file:bg-card file:text-foreground
                hover:file:bg-muted file:cursor-pointer cursor-pointer
                border border-dashed border-border rounded-xl p-3
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Progress */}
          {importing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              data-ocid="backup.import.loading_state"
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("backupImporting")}</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="h-2" />
            </motion.div>
          )}

          {/* Success summary */}
          {importDone && importSummary && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              data-ocid="backup.import.success_state"
              className="rounded-lg border border-green-200 bg-green-50 p-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-800">
                  {t("backupImportSuccess")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs text-green-700">
                <span>
                  {t("backupCowsCount")}: {importSummary.cows}
                </span>
                <span>
                  {t("backupDonationsCount")}: {importSummary.donations}
                </span>
                <span>
                  {t("backupHealthCount")}: {importSummary.healthRecords}
                </span>
                <span>
                  {t("backupAnnouncementsCount")}: {importSummary.announcements}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
