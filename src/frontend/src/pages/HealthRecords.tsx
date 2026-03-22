import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { HeartPulse, Plus, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAddHealthRecord,
  useGetAllCows,
  useGetAllHealthRecords,
  useGetHealthRecordsByCow,
} from "../hooks/useQueries";
import { useAuth } from "../lib/AuthContext";
import { useLang } from "../lib/LanguageContext";
import { formatTime } from "../utils/timeUtils";

interface HealthRecordsProps {
  cowIdFilter: bigint | null;
  onClearFilter: () => void;
  changedBy: string;
}

const defaultForm = {
  cowId: "",
  notes: "",
  status: "Healthy",
  vetName: "",
};

export default function HealthRecords({
  cowIdFilter,
  onClearFilter,
  changedBy,
}: HealthRecordsProps) {
  const { t, lang } = useLang();
  const { canEdit } = useAuth();
  const { data: cows = [] } = useGetAllCows();
  const { data: allRecords = [], isLoading: allLoading } =
    useGetAllHealthRecords();
  const { data: filteredRecords = [], isLoading: filteredLoading } =
    useGetHealthRecordsByCow(cowIdFilter);
  const addRecord = useAddHealthRecord();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const records = cowIdFilter !== null ? filteredRecords : allRecords;
  const isLoading = cowIdFilter !== null ? filteredLoading : allLoading;

  const filteredCow =
    cowIdFilter !== null ? cows.find((c) => c.id === cowIdFilter) : null;

  function getCowName(cowId: bigint): string {
    return cows.find((c) => c.id === cowId)?.name ?? `#${cowId}`;
  }

  function getStatusClass(status: string) {
    const s = status.toLowerCase();
    if (s === "healthy") return "status-healthy";
    if (s === "sick") return "status-sick";
    return "status-recovering";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await addRecord.mutateAsync({
        cowId: BigInt(form.cowId),
        notes: form.notes,
        status: form.status,
        vetName: form.vetName,
        changedBy,
      });
      toast.success(t("healthAdded"));
      setDialogOpen(false);
      setForm(defaultForm);
    } catch {
      toast.error(t("error"));
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-primary" />
            {t("healthRecords")}
          </h1>
          {filteredCow && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">
                {t("filteredByCow")}:{" "}
                <span className="font-medium text-foreground">
                  {filteredCow.name}
                </span>
              </span>
              <button
                type="button"
                onClick={onClearFilter}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-full border border-border hover:bg-muted transition-colors"
                data-ocid="health.toggle"
              >
                <X className="h-3 w-3" />
                {t("clearFilter")}
              </button>
            </div>
          )}
        </div>
        {canEdit && (
          <Button
            data-ocid="health.add_button"
            onClick={() => {
              setForm({ ...defaultForm, cowId: cowIdFilter?.toString() ?? "" });
              setDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("addHealthRecord")}
          </Button>
        )}
      </div>

      {/* Records List */}
      {isLoading ? (
        <div className="space-y-3" data-ocid="health.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div
          data-ocid="health.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <HeartPulse className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{t("noHealthRecords")}</p>
          <Button
            onClick={() => setDialogOpen(true)}
            variant="outline"
            className="mt-4 gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("addHealthRecord")}
          </Button>
        </div>
      ) : (
        <div data-ocid="health.table" className="space-y-3">
          {records.map((record, idx) => (
            <motion.div
              key={record.id.toString()}
              data-ocid={`health.item.${idx + 1}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-card border border-border rounded-xl p-4 shadow-xs hover:shadow-card transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-accent/40 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-accent-foreground">
                        {getCowName(record.cowId).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        {getCowName(record.cowId)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(record.date, lang)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-xs px-2.5 py-0.5 rounded-full font-medium ml-auto sm:ml-0",
                        getStatusClass(record.status),
                      )}
                    >
                      {record.status}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{record.notes}</p>
                  {record.vetName && (
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      <span className="font-medium">{t("vetName")}:</span>{" "}
                      {record.vetName}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Record Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {t("addHealthRecord")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("selectCow")} *</Label>
              <Select
                value={form.cowId}
                onValueChange={(v) => setForm((p) => ({ ...p, cowId: v }))}
                required
              >
                <SelectTrigger data-ocid="health.form.select">
                  <SelectValue placeholder={t("selectCow")} />
                </SelectTrigger>
                <SelectContent>
                  {cows.map((c) => (
                    <SelectItem key={c.id.toString()} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("status")}</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Healthy">{t("healthy")}</SelectItem>
                  <SelectItem value="Sick">{t("sick")}</SelectItem>
                  <SelectItem value="Recovering">{t("recovering")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("vetName")}</Label>
              <Input
                placeholder={t("vetName")}
                value={form.vetName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, vetName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("notes")} *</Label>
              <Textarea
                required
                placeholder={t("notes")}
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                data-ocid="health.form.cancel_button"
                onClick={() => setDialogOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                data-ocid="health.form.submit_button"
                disabled={addRecord.isPending || !form.cowId}
              >
                {addRecord.isPending ? t("saving") : t("addHealthRecord")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
