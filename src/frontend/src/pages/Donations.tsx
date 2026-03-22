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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { HandCoins, IndianRupee, Plus, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAddDonation, useGetAllDonations } from "../hooks/useQueries";
import { useAuth } from "../lib/AuthContext";
import { useLang } from "../lib/LanguageContext";
import { formatCurrency, formatTime } from "../utils/timeUtils";

const defaultForm = { donorName: "", amount: "", message: "", purpose: "" };

export default function Donations({ changedBy }: { changedBy: string }) {
  const { t, lang } = useLang();
  const { canEdit } = useAuth();
  const { data: donations = [], isLoading } = useGetAllDonations();
  const addDonation = useAddDonation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const totalAmount = donations.reduce((s, d) => s + d.amount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await addDonation.mutateAsync({
        donorName: form.donorName,
        amount: Number.parseFloat(form.amount) || 0,
        message: form.message,
        purpose: form.purpose,
        changedBy,
      });
      toast.success(t("donationAdded"));
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
            <HandCoins className="h-6 w-6 text-primary" />
            {t("donations")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lang === "hi"
              ? `${donations.length} दान दर्ज`
              : `${donations.length} donations recorded`}
          </p>
        </div>
        {canEdit && (
          <Button
            data-ocid="donation.add_button"
            onClick={() => setDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("addDonation")}
          </Button>
        )}
      </div>

      {/* Total Card */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-primary text-primary-foreground rounded-2xl p-5 mb-6 shadow-card flex items-center justify-between"
      >
        <div>
          <p className="text-primary-foreground/70 text-sm font-medium">
            {t("totalReceived")}
          </p>
          <p className="font-display text-3xl font-bold mt-0.5">
            {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="w-14 h-14 rounded-full bg-primary-foreground/10 flex items-center justify-center">
          <TrendingUp className="h-7 w-7 text-primary-foreground" />
        </div>
      </motion.div>

      {/* Donations List */}
      {isLoading ? (
        <div className="space-y-3" data-ocid="donation.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : donations.length === 0 ? (
        <div
          data-ocid="donation.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <HandCoins className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{t("noDonations")}</p>
          <Button
            onClick={() => setDialogOpen(true)}
            variant="outline"
            className="mt-4 gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("addDonation")}
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div
            data-ocid="donation.table"
            className="hidden md:block bg-card rounded-2xl border border-border shadow-card overflow-hidden"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    {t("donorName")}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    {t("amount")}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    {t("purpose")}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    {t("message")}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    {t("date")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {donations.map((don, idx) => (
                  <motion.tr
                    key={don.id.toString()}
                    data-ocid={`donation.item.${idx + 1}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-accent/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-accent-foreground">
                            {don.donorName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-foreground">
                          {don.donorName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-primary flex items-center gap-0.5">
                        <IndianRupee className="h-3.5 w-3.5" />
                        {don.amount.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {don.purpose || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                      {don.message || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatTime(don.date, lang)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {donations.map((don, idx) => (
              <motion.div
                key={don.id.toString()}
                data-ocid={`donation.item.${idx + 1}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card border border-border rounded-xl p-4 shadow-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-accent/40 flex items-center justify-center">
                      <span className="text-sm font-bold text-accent-foreground">
                        {don.donorName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {don.donorName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(don.date, lang)}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-primary flex items-center gap-0.5">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {don.amount.toLocaleString("en-IN")}
                  </span>
                </div>
                {don.purpose && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">{t("purpose")}:</span>{" "}
                    {don.purpose}
                  </p>
                )}
                {don.message && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {don.message}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Add Donation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {t("addDonation")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("donorName")} *</Label>
              <Input
                data-ocid="donation.form.input"
                required
                placeholder={t("donorName")}
                value={form.donorName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, donorName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("amount")} *</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  required
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0"
                  className="pl-9"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amount: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("purpose")}</Label>
              <Input
                placeholder={
                  lang === "hi" ? "जैसे: चारा, दवाई..." : "e.g. Feed, Medicine..."
                }
                value={form.purpose}
                onChange={(e) =>
                  setForm((p) => ({ ...p, purpose: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("message")}</Label>
              <Textarea
                placeholder={
                  lang === "hi" ? "दानकर्ता का संदेश..." : "Donor's message..."
                }
                value={form.message}
                onChange={(e) =>
                  setForm((p) => ({ ...p, message: e.target.value }))
                }
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                data-ocid="donation.form.cancel_button"
                onClick={() => setDialogOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                data-ocid="donation.form.submit_button"
                disabled={addDonation.isPending}
              >
                {addDonation.isPending ? t("saving") : t("addDonation")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
