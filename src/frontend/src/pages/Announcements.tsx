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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Megaphone, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAddAnnouncement,
  useGetActiveAnnouncements,
} from "../hooks/useQueries";
import { useAuth } from "../lib/AuthContext";
import { useLang } from "../lib/LanguageContext";
import { formatTime } from "../utils/timeUtils";

const defaultForm = {
  title: "",
  titleHindi: "",
  content: "",
  contentHindi: "",
  isActive: true,
};

export default function Announcements({ changedBy }: { changedBy: string }) {
  const { t, lang } = useLang();
  const { canEdit } = useAuth();
  const { data: announcements = [], isLoading } = useGetActiveAnnouncements();
  const addAnnouncement = useAddAnnouncement();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await addAnnouncement.mutateAsync({
        title: form.title,
        titleHindi: form.titleHindi,
        content: form.content,
        contentHindi: form.contentHindi,
        isActive: form.isActive,
        changedBy,
      });
      toast.success(t("announcementAdded"));
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
            <Megaphone className="h-6 w-6 text-primary" />
            {t("announcements")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lang === "hi"
              ? `${announcements.length} सक्रिय घोषणाएं`
              : `${announcements.length} active announcements`}
          </p>
        </div>
        {canEdit && (
          <Button
            data-ocid="announcement.add_button"
            onClick={() => setDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("addAnnouncement")}
          </Button>
        )}
      </div>

      {/* Announcement Cards */}
      {isLoading ? (
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          data-ocid="announcement.loading_state"
        >
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div
          data-ocid="announcement.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{t("noAnnouncements")}</p>
          <Button
            onClick={() => setDialogOpen(true)}
            variant="outline"
            className="mt-4 gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("addAnnouncement")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((ann, idx) => (
            <motion.div
              key={ann.id.toString()}
              data-ocid={`announcement.item.${idx + 1}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07 }}
              className="bg-card border border-border rounded-2xl p-5 shadow-card hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {/* Decorative top accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary/40 rounded-t-2xl" />

              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="h-4.5 w-4.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-foreground line-clamp-1">
                    {lang === "hi" ? ann.titleHindi || ann.title : ann.title}
                  </h3>
                  {lang === "hi" && ann.title && ann.titleHindi && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {ann.title}
                    </p>
                  )}
                </div>
                {ann.isActive && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium flex-shrink-0">
                    {lang === "hi" ? "सक्रिय" : "Active"}
                  </span>
                )}
              </div>

              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                {lang === "hi" ? ann.contentHindi || ann.content : ann.content}
              </p>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {formatTime(ann.date, lang)}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Announcement Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {t("addAnnouncement")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("title")} (English) *</Label>
                <Input
                  data-ocid="announcement.form.input"
                  required
                  placeholder="Announcement title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("titleHindi")}</Label>
                <Input
                  placeholder="घोषणा शीर्षक"
                  value={form.titleHindi}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, titleHindi: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("content")} (English) *</Label>
              <Textarea
                required
                placeholder="Announcement content..."
                value={form.content}
                onChange={(e) =>
                  setForm((p) => ({ ...p, content: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("contentHindi")}</Label>
              <Textarea
                placeholder="घोषणा की सामग्री..."
                value={form.contentHindi}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contentHindi: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                data-ocid="announcement.form.switch"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
              />
              <Label className="cursor-pointer">{t("isActive")}</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                data-ocid="announcement.form.cancel_button"
                onClick={() => setDialogOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                data-ocid="announcement.form.submit_button"
                disabled={addAnnouncement.isPending}
              >
                {addAnnouncement.isPending ? t("saving") : t("addAnnouncement")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
