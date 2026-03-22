import { Skeleton } from "@/components/ui/skeleton";
import { History } from "lucide-react";
import { motion } from "motion/react";
import { useGetAllChangeLogs } from "../hooks/useQueries";
import { useLang } from "../lib/LanguageContext";

function formatTimestamp(ts: bigint, lang: string): string {
  const ms = Number(ts / BigInt(1_000_000));
  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  if (lang === "hi") return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function actionLabel(action: string, lang: string): string {
  if (lang === "hi") {
    if (action === "add" || action === "create") return "जोड़ा";
    if (action === "edit" || action === "update") return "संपादित";
    if (action === "delete") return "हटाया";
    return action;
  }
  return action.charAt(0).toUpperCase() + action.slice(1);
}

function actionBadgeClass(action: string): string {
  if (action === "add" || action === "create")
    return "bg-green-50 text-green-700 border-green-200";
  if (action === "edit" || action === "update")
    return "bg-blue-50 text-blue-700 border-blue-200";
  if (action === "delete") return "bg-red-50 text-red-700 border-red-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
}

export default function ChangeLogPage() {
  const { lang } = useLang();
  const { data: logs = [], isLoading } = useGetAllChangeLogs();

  const sorted = [...logs].sort((a, b) => {
    if (a.timestamp > b.timestamp) return -1;
    if (a.timestamp < b.timestamp) return 1;
    return 0;
  });

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          {lang === "hi" ? "बदलाव का इतिहास" : "Change History"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === "hi"
            ? `${sorted.length} बदलाव दर्ज`
            : `${sorted.length} changes recorded`}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3" data-ocid="changelog.loading_state">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div
          data-ocid="changelog.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {lang === "hi" ? "कोई बदलाव नहीं" : "No changes recorded"}
          </p>
        </div>
      ) : (
        <div
          className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
          data-ocid="changelog.table"
        >
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    {lang === "hi" ? "समय" : "Time"}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    {lang === "hi" ? "उपयोगकर्ता" : "User"}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    {lang === "hi" ? "कार्य" : "Action"}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    {lang === "hi" ? "विवरण" : "Details"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((log, idx) => (
                  <motion.tr
                    key={log.id.toString()}
                    data-ocid={`changelog.item.${idx + 1}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(log.timestamp, lang)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground text-sm">
                        {log.userName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-medium ${actionBadgeClass(log.action)}`}
                      >
                        {actionLabel(log.action, lang)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <span className="font-medium">{log.entityName}</span>
                      {log.details && (
                        <span className="text-muted-foreground">
                          {" "}
                          — {log.details}
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border">
            {sorted.map((log, idx) => (
              <motion.div
                key={log.id.toString()}
                data-ocid={`changelog.item.${idx + 1}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                className="p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-foreground">
                    {log.userName}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium ${actionBadgeClass(log.action)}`}
                  >
                    {actionLabel(log.action, lang)}
                  </span>
                </div>
                <p className="text-sm text-foreground">
                  {log.entityName}
                  {log.details && (
                    <span className="text-muted-foreground">
                      {" "}
                      — {log.details}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTimestamp(log.timestamp, lang)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
