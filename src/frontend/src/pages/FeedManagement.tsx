import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CalendarDays,
  Loader2,
  PackagePlus,
  Settings2,
  TrendingDown,
  Wheat,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAddFeedStock,
  useGetFeedHistory,
  useGetFeedStocks,
  useRecordFeedConsumption,
  useUpdateFeedStock,
} from "../hooks/useQueries";
import { useAuth } from "../lib/AuthContext";
import { useLang } from "../lib/LanguageContext";

function formatDate(time: bigint) {
  return new Date(Number(time) / 1_000_000).toLocaleDateString();
}

type DialogMode = "add" | "consume" | "settings" | null;

interface FeedActionState {
  feedType: string;
  mode: DialogMode;
  quantity: string;
  notes: string;
  dailyPerCow: string;
  totalStockDirect: string;
}

const INITIAL_ACTION: FeedActionState = {
  feedType: "",
  mode: null,
  quantity: "",
  notes: "",
  dailyPerCow: "",
  totalStockDirect: "",
};

export default function FeedManagement() {
  const { lang } = useLang();
  const { currentUser, canEdit } = useAuth();
  const changedBy = currentUser?.name ?? "Unknown";

  const { data: feedStocks = [], isLoading: loadingStocks } =
    useGetFeedStocks();
  const { data: feedHistory = [], isLoading: loadingHistory } =
    useGetFeedHistory();
  const { data: allCows = [] } = useGetFeedCows();

  const addStockMut = useAddFeedStock();
  const consumeMut = useRecordFeedConsumption();
  const updateMut = useUpdateFeedStock();

  const [action, setAction] = useState<FeedActionState>(INITIAL_ACTION);

  const totalCows = allCows.length;

  const hi = lang === "hi";

  // Compute derived fields per stock
  const stocksWithCalc = feedStocks.map((stock) => {
    const dailyNeed =
      stock.dailyPerCow > 0 && totalCows > 0
        ? stock.dailyPerCow * totalCows
        : null;
    const daysRemaining =
      dailyNeed && dailyNeed > 0 ? stock.totalStock / dailyNeed : null;
    const isLow =
      stock.totalStock === 0 || (daysRemaining !== null && daysRemaining < 10);
    return { ...stock, dailyNeed, daysRemaining, isLow };
  });

  const lowStocks = stocksWithCalc.filter((s) => s.isLow);

  function openDialog(feedType: string, mode: "add" | "consume" | "settings") {
    const existing = feedStocks.find((s) => s.feedType === feedType);
    setAction({
      feedType,
      mode,
      quantity: "",
      notes: "",
      dailyPerCow: existing?.dailyPerCow.toString() ?? "",
      totalStockDirect: existing?.totalStock.toString() ?? "",
    });
  }

  function closeDialog() {
    setAction(INITIAL_ACTION);
  }

  async function handleSubmit() {
    const qty = Number.parseFloat(action.quantity);
    if (action.mode === "add" || action.mode === "consume") {
      if (!qty || qty <= 0) {
        toast.error(hi ? "मान्य मात्रा दर्ज करें" : "Enter a valid quantity");
        return;
      }
    }
    try {
      if (action.mode === "add") {
        await addStockMut.mutateAsync({
          feedType: action.feedType,
          quantity: qty,
          notes: action.notes,
          recordedBy: changedBy,
        });
        toast.success(
          hi ? "स्टॉक सफलतापूर्वक जोड़ा गया" : "Stock added successfully",
        );
      } else if (action.mode === "consume") {
        await consumeMut.mutateAsync({
          feedType: action.feedType,
          quantity: qty,
          notes: action.notes,
          recordedBy: changedBy,
        });
        toast.success(hi ? "उपयोग दर्ज किया गया" : "Consumption recorded");
      } else if (action.mode === "settings") {
        const dpc = Number.parseFloat(action.dailyPerCow);
        const ts = Number.parseFloat(action.totalStockDirect);
        if (!dpc || dpc <= 0) {
          toast.error(
            hi ? "प्रति गाय दैनिक खपत दर्ज करें" : "Enter daily per cow value",
          );
          return;
        }
        await updateMut.mutateAsync({
          feedType: action.feedType,
          totalStock: Number.isNaN(ts) ? 0 : ts,
          dailyPerCow: dpc,
          updatedBy: changedBy,
        });
        toast.success(hi ? "सेटिंग्स सहेजी गईं" : "Settings saved");
      }
      closeDialog();
    } catch {
      toast.error(hi ? "कुछ गलत हुआ" : "Something went wrong");
    }
  }

  const isPending =
    addStockMut.isPending || consumeMut.isPending || updateMut.isPending;

  const feedTypes = [
    {
      type: "wet",
      labelHi: "गीला चारा",
      labelEn: "Wet Feed (Gila Chara)",
      emoji: "🌿",
      color: "emerald",
    },
    {
      type: "dry",
      labelHi: "सूखा चारा",
      labelEn: "Dry Feed (Sukha Chara)",
      emoji: "🌾",
      color: "amber",
    },
  ];

  const sortedHistory = [...feedHistory].sort((a, b) =>
    Number(b.date - a.date),
  );

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Wheat className="h-6 w-6 text-primary" />
          {hi ? "चारा प्रबंधन" : "Feed Management"}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {hi
            ? `कुल ${totalCows} गायें • गीला और सूखा चारा इन्वेंटरी`
            : `${totalCows} total cows • Wet & Dry feed inventory`}
        </p>
      </motion.div>

      {/* Low stock banner */}
      {lowStocks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6"
          data-ocid="feed.error_state"
        >
          <Alert
            variant="destructive"
            className="border-red-400 bg-red-50 text-red-800"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-semibold">
              {hi ? "⚠️ स्टॉक कम चेतावनी" : "⚠️ Low Stock Warning"}
            </AlertTitle>
            <AlertDescription>
              {lowStocks.map((s) => {
                const label =
                  s.feedType === "wet"
                    ? hi
                      ? "गीला चारा"
                      : "Wet Feed"
                    : hi
                      ? "सूखा चारा"
                      : "Dry Feed";
                const days =
                  s.daysRemaining !== null ? Math.floor(s.daysRemaining) : 0;
                return (
                  <span key={s.feedType} className="block">
                    {hi
                      ? `${label}: केवल ${days} दिन का स्टॉक बचा है!`
                      : `${label}: Only ${days} days of stock remaining!`}
                  </span>
                );
              })}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Feed type cards */}
      {loadingStocks ? (
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8"
          data-ocid="feed.loading_state"
        >
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {feedTypes.map((ft, idx) => {
            const stock = stocksWithCalc.find((s) => s.feedType === ft.type);
            const totalStock = stock?.totalStock ?? 0;
            const dpc = stock?.dailyPerCow ?? 0;
            const dailyNeed = stock?.dailyNeed ?? null;
            const daysRemaining = stock?.daysRemaining ?? null;
            const isLow = stock?.isLow ?? false;

            const isWet = ft.type === "wet";
            const cardBg = isWet
              ? "bg-emerald-50 border-emerald-200"
              : "bg-amber-50 border-amber-200";
            const headerBg = isWet
              ? "bg-emerald-600 text-white"
              : "bg-amber-600 text-white";
            const metaColor = isWet ? "text-emerald-700" : "text-amber-700";

            return (
              <motion.div
                key={ft.type}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                data-ocid={`feed.card.${idx + 1}`}
              >
                <Card
                  className={`border-2 shadow-card overflow-hidden ${cardBg} ${
                    isLow ? "ring-2 ring-red-400 ring-offset-1" : ""
                  }`}
                >
                  <CardHeader className={`py-3 px-5 ${headerBg} rounded-none`}>
                    <CardTitle className="flex items-center justify-between text-base font-bold">
                      <span className="flex items-center gap-2">
                        <span className="text-xl">{ft.emoji}</span>
                        {hi ? ft.labelHi : ft.labelEn}
                      </span>
                      {isLow && (
                        <Badge
                          variant="destructive"
                          className="text-xs bg-red-600 border-red-700 text-white animate-pulse"
                        >
                          {hi ? "स्टॉक कम!" : "Low Stock!"}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-4 pb-5 px-5 space-y-4">
                    {/* Main stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-white/60">
                        <div
                          className={`text-3xl font-bold font-display ${metaColor}`}
                        >
                          {totalStock.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {hi ? "कुल स्टॉक (kg)" : "Total Stock (kg)"}
                        </div>
                      </div>
                      <div
                        className={`rounded-xl p-3 text-center shadow-sm ${
                          isLow
                            ? "bg-red-100 border border-red-200"
                            : "bg-white border border-white/60"
                        }`}
                      >
                        <div
                          className={`text-3xl font-bold font-display ${
                            isLow ? "text-red-600" : metaColor
                          }`}
                        >
                          {daysRemaining !== null
                            ? Math.floor(daysRemaining)
                            : "N/A"}
                        </div>
                        <div
                          className={`text-xs mt-0.5 ${
                            isLow
                              ? "text-red-500 font-semibold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {hi ? "दिन शेष" : "Days Remaining"}
                        </div>
                      </div>
                    </div>

                    {/* Secondary stats */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div
                        className={`flex flex-col p-2 rounded-lg bg-white/70 ${metaColor}`}
                      >
                        <span className="text-xs text-muted-foreground">
                          {hi ? "प्रति गाय / दिन" : "Per Cow / Day"}
                        </span>
                        <span className="font-semibold">
                          {dpc > 0 ? `${dpc} kg` : "N/A"}
                        </span>
                      </div>
                      <div
                        className={`flex flex-col p-2 rounded-lg bg-white/70 ${metaColor}`}
                      >
                        <span className="text-xs text-muted-foreground">
                          {hi ? "दैनिक जरूरत" : "Daily Need"}
                        </span>
                        <span className="font-semibold">
                          {dailyNeed !== null
                            ? `${dailyNeed.toFixed(1)} kg`
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Last updated */}
                    {stock && (
                      <div
                        className={`flex items-center gap-1.5 text-xs ${metaColor} opacity-70`}
                      >
                        <CalendarDays className="h-3 w-3" />
                        {hi ? "अंतिम अपडेट:" : "Last updated:"}{" "}
                        {formatDate(stock.lastUpdated)} &bull; {stock.updatedBy}
                      </div>
                    )}

                    {/* Action buttons */}
                    {canEdit && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                          size="sm"
                          className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs"
                          onClick={() => openDialog(ft.type, "add")}
                          data-ocid={`feed.primary_button.${idx + 1}`}
                        >
                          <PackagePlus className="h-3.5 w-3.5" />
                          {hi ? "स्टॉक जोड़ें" : "Add Stock"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1.5 border-orange-400 text-orange-700 hover:bg-orange-50 text-xs"
                          onClick={() => openDialog(ft.type, "consume")}
                          data-ocid={`feed.secondary_button.${idx + 1}`}
                        >
                          <TrendingDown className="h-3.5 w-3.5" />
                          {hi ? "उपयोग दर्ज करें" : "Record Consumption"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 text-muted-foreground hover:text-foreground text-xs"
                          onClick={() => openDialog(ft.type, "settings")}
                          data-ocid={`feed.edit_button.${idx + 1}`}
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                          {hi ? "सेटिंग्स" : "Settings"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* History table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">
          {hi ? "चारा इतिहास" : "Feed History"}
        </h2>

        {loadingHistory ? (
          <div className="space-y-2" data-ocid="feed.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : sortedHistory.length === 0 ? (
          <div
            data-ocid="feed.empty_state"
            className="text-center py-14 text-muted-foreground bg-card rounded-2xl border border-border"
          >
            <Wheat className="h-10 w-10 mx-auto mb-3 opacity-25" />
            <p className="font-medium">
              {hi ? "कोई इतिहास नहीं मिला" : "No feed history found"}
            </p>
            <p className="text-xs mt-1 opacity-60">
              {hi
                ? "स्टॉक जोड़ने या उपयोग दर्ज करने पर इतिहास दिखेगा"
                : "Add stock or record consumption to see history"}
            </p>
          </div>
        ) : (
          <div
            className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
            data-ocid="feed.table"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-semibold">
                    {hi ? "दिनांक" : "Date"}
                  </TableHead>
                  <TableHead className="font-semibold">
                    {hi ? "चारा प्रकार" : "Feed Type"}
                  </TableHead>
                  <TableHead className="font-semibold">
                    {hi ? "कार्य" : "Action"}
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    {hi ? "मात्रा (kg)" : "Qty (kg)"}
                  </TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">
                    {hi ? "नोट" : "Notes"}
                  </TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">
                    {hi ? "दर्ज किया" : "Recorded By"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHistory.map((h, idx) => {
                  const isAdd = h.action === "add" || h.action === "added";
                  const feedLabel =
                    h.feedType === "wet"
                      ? hi
                        ? "गीला चारा"
                        : "Wet Feed"
                      : hi
                        ? "सूखा चारा"
                        : "Dry Feed";
                  return (
                    <TableRow
                      key={h.id.toString()}
                      data-ocid={`feed.row.${idx + 1}`}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <TableCell className="text-sm">
                        {formatDate(h.date)}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-sm">
                          {h.feedType === "wet" ? "🌿" : "🌾"}
                          {feedLabel}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isAdd ? "default" : "secondary"}
                          className={
                            isAdd
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-orange-100 text-orange-800 border-orange-200"
                          }
                        >
                          {isAdd
                            ? hi
                              ? "जोड़ा गया"
                              : "Added"
                            : hi
                              ? "उपयोग हुआ"
                              : "Consumed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <span
                          className={
                            isAdd ? "text-green-700" : "text-orange-700"
                          }
                        >
                          {isAdd ? "+" : "-"}
                          {h.quantity} kg
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                        {h.notes || "—"}
                      </TableCell>
                      <TableCell className="text-sm hidden sm:table-cell">
                        {h.recordedBy}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      {/* Action Dialog */}
      <Dialog
        open={action.mode !== null}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="sm:max-w-md" data-ocid="feed.dialog">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              {action.mode === "add" && (
                <>
                  <PackagePlus className="h-5 w-5 text-green-600" />
                  {hi ? "स्टॉक जोड़ें" : "Add Stock"}
                </>
              )}
              {action.mode === "consume" && (
                <>
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                  {hi ? "उपयोग दर्ज करें" : "Record Consumption"}
                </>
              )}
              {action.mode === "settings" && (
                <>
                  <Settings2 className="h-5 w-5 text-primary" />
                  {hi ? "सेटिंग्स" : "Settings"}
                </>
              )}
              <span className="text-muted-foreground text-sm font-normal">
                —{" "}
                {action.feedType === "wet"
                  ? hi
                    ? "गीला चारा"
                    : "Wet Feed"
                  : hi
                    ? "सूखा चारा"
                    : "Dry Feed"}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {(action.mode === "add" || action.mode === "consume") && (
              <>
                <div className="space-y-1.5">
                  <Label data-ocid="feed.input">
                    {hi ? "मात्रा (kg)" : "Quantity (kg)"} *
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder={hi ? "मात्रा दर्ज करें" : "Enter quantity"}
                    value={action.quantity}
                    onChange={(e) =>
                      setAction((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                    data-ocid="feed.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{hi ? "नोट (वैकल्पिक)" : "Notes (optional)"}</Label>
                  <Textarea
                    placeholder={hi ? "कोई टिप्पणी..." : "Any notes..."}
                    value={action.notes}
                    onChange={(e) =>
                      setAction((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="resize-none"
                    rows={2}
                    data-ocid="feed.textarea"
                  />
                </div>
              </>
            )}

            {action.mode === "settings" && (
              <>
                <div className="space-y-1.5">
                  <Label>
                    {hi
                      ? "प्रति गाय दैनिक खपत (kg/गाय/दिन)"
                      : "Daily per cow (kg/cow/day)"}{" "}
                    *
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 5"
                    value={action.dailyPerCow}
                    onChange={(e) =>
                      setAction((prev) => ({
                        ...prev,
                        dailyPerCow: e.target.value,
                      }))
                    }
                    data-ocid="feed.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>
                    {hi
                      ? "कुल स्टॉक सेट करें (kg, वैकल्पिक)"
                      : "Set total stock directly (kg, optional)"}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder={hi ? "वर्तमान स्टॉक..." : "Current stock..."}
                    value={action.totalStockDirect}
                    onChange={(e) =>
                      setAction((prev) => ({
                        ...prev,
                        totalStockDirect: e.target.value,
                      }))
                    }
                    data-ocid="feed.input"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={isPending}
              data-ocid="feed.cancel_button"
            >
              {hi ? "रद्द करें" : "Cancel"}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className={`gap-2 ${
                action.mode === "add"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : action.mode === "consume"
                    ? "bg-orange-600 hover:bg-orange-700 text-white"
                    : ""
              }`}
              data-ocid="feed.submit_button"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {action.mode === "add"
                ? hi
                  ? "स्टॉक जोड़ें"
                  : "Add Stock"
                : action.mode === "consume"
                  ? hi
                    ? "दर्ज करें"
                    : "Record"
                  : hi
                    ? "सहेजें"
                    : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Local hook for getting cows (reusing from existing)
import { useQuery } from "@tanstack/react-query";
import type { Cow } from "../backend.d";
import { useActor } from "../hooks/useActor";

function useGetFeedCows() {
  const { actor, isFetching } = useActor();
  return useQuery<Cow[]>({
    queryKey: ["cows"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCows();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}
