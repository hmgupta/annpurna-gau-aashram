import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  KeyRound,
  Loader2,
  Shield,
  Trash2,
  UserPlus,
  Users,
  Wifi,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { User } from "../backend.d";
import {
  useChangeUserPin,
  useCreateUser,
  useDeleteUser,
  useGetAllUsers,
  useGetOnlineUsers,
} from "../hooks/useQueries";
import { useAuth } from "../lib/AuthContext";
import { useLang } from "../lib/LanguageContext";

const MAX_USERS = 50;
const defaultForm = { name: "", role: "viewer", pin: "" };

function roleBadgeClass(role: string) {
  if (role === "admin")
    return "bg-orange-100 text-orange-700 border-orange-200";
  if (role === "editor") return "bg-green-100 text-green-700 border-green-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}

function roleLabel(role: string, lang: string) {
  if (lang === "hi") {
    if (role === "admin") return "व्यवस्थापक";
    if (role === "editor") return "संपादक";
    return "देखने वाला";
  }
  if (role === "admin") return "Admin";
  if (role === "editor") return "Editor";
  return "Viewer";
}

function capacityColor(count: number): string {
  if (count >= MAX_USERS) return "text-red-600";
  if (count >= 40) return "text-amber-600";
  return "text-green-600";
}

function progressBarColor(count: number): string {
  if (count >= MAX_USERS) return "bg-red-500";
  if (count >= 40) return "bg-amber-500";
  return "bg-green-500";
}

export default function AdminPage() {
  const { lang } = useLang();
  const { currentUser, isAdmin } = useAuth();
  const { data: users = [], isLoading } = useGetAllUsers();
  const { data: onlineUserIds = [] } = useGetOnlineUsers();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const changeUserPin = useChangeUserPin();

  const [form, setForm] = useState(defaultForm);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [pinError, setPinError] = useState("");

  // Change PIN dialog state
  const [changePinTarget, setChangePinTarget] = useState<User | null>(null);
  const [newPin, setNewPin] = useState("");
  const [newPinError, setNewPinError] = useState("");

  const onlineCount = onlineUserIds.length;
  const userCount = users.length;
  const isAtCapacity = userCount >= MAX_USERS;
  const capacityPercent = Math.min((userCount / MAX_USERS) * 100, 100);

  function isOnline(userId: bigint): boolean {
    return onlineUserIds.some((id) => id === userId);
  }

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>{lang === "hi" ? "केवल व्यवस्थापक के लिए" : "Admin only"}</p>
      </div>
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (isAtCapacity) return;
    if (form.pin.length !== 6 || !/^\d{6}$/.test(form.pin)) {
      setPinError(
        lang === "hi" ? "6 अंकों का PIN चाहिए" : "PIN must be 6 digits",
      );
      return;
    }
    // Check PIN uniqueness
    const duplicate = users.find((u) => u.pin === form.pin);
    if (duplicate) {
      setPinError(
        lang === "hi"
          ? `यह PIN पहले से "${duplicate.name}" को दिया गया है`
          : `This PIN is already assigned to "${duplicate.name}"`,
      );
      return;
    }
    setPinError("");
    try {
      await createUser.mutateAsync({
        name: form.name,
        role: form.role,
        pin: form.pin,
      });
      toast.success(lang === "hi" ? "उपयोगकर्ता बनाया गया" : "User created");
      setForm(defaultForm);
    } catch {
      toast.error(lang === "hi" ? "कुछ गलत हुआ" : "Error occurred");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteUser.mutateAsync(deleteTarget.id);
      toast.success(lang === "hi" ? "उपयोगकर्ता हटाया गया" : "User deleted");
      setDeleteTarget(null);
    } catch {
      toast.error(lang === "hi" ? "कुछ गलत हुआ" : "Error occurred");
    }
  }

  function openChangePinDialog(user: User) {
    setChangePinTarget(user);
    setNewPin("");
    setNewPinError("");
  }

  function closeChangePinDialog() {
    setChangePinTarget(null);
    setNewPin("");
    setNewPinError("");
  }

  async function handleChangePin() {
    if (!changePinTarget) return;
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setNewPinError(
        lang === "hi" ? "6 अंकों का PIN चाहिए" : "PIN must be 6 digits",
      );
      return;
    }
    // Check PIN uniqueness (exclude the user whose PIN is being changed)
    const duplicate = users.find(
      (u) => u.pin === newPin && u.id !== changePinTarget.id,
    );
    if (duplicate) {
      setNewPinError(
        lang === "hi"
          ? `यह PIN पहले से "${duplicate.name}" को दिया गया है`
          : `This PIN is already assigned to "${duplicate.name}"`,
      );
      return;
    }
    setNewPinError("");
    try {
      await changeUserPin.mutateAsync({
        id: changePinTarget.id,
        newPin,
        changedBy: currentUser?.name ?? "Admin",
      });
      toast.success(
        lang === "hi" ? "PIN बदला गया" : "PIN changed successfully",
      );
      closeChangePinDialog();
    } catch {
      toast.error(lang === "hi" ? "कुछ गलत हुआ" : "Error occurred");
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          {lang === "hi"
            ? "व्यवस्थापक पैनल / Admin Panel"
            : "Admin Panel / व्यवस्थापक पैनल"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === "hi" ? "उपयोगकर्ता प्रबंधन" : "User Management"}
        </p>
      </div>

      {/* Online Summary Card */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <Wifi className="h-5 w-5 text-green-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-green-800 text-sm">
            {lang === "hi"
              ? `अभी ऑनलाइन: ${onlineCount} | कुल: ${userCount}/${MAX_USERS}`
              : `Currently Online: ${onlineCount} | Total: ${userCount}/${MAX_USERS}`}
          </p>
          <p className="text-xs text-green-600">
            {lang === "hi"
              ? "हर 3 मिनट में अपडेट होता है"
              : "Updates every 3 minutes"}
          </p>
        </div>
        <div className="ml-auto flex flex-col items-end gap-0.5">
          <span className="text-2xl font-bold text-green-700">
            {onlineCount}
          </span>
          <span className="text-xs text-green-600">
            {lang === "hi" ? "ऑनलाइन" : "online"}
          </span>
        </div>
      </div>

      {/* Capacity Indicator */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {lang === "hi" ? "उपयोगकर्ता क्षमता" : "User Capacity"}
            </span>
          </div>
          <span className={`text-sm font-bold ${capacityColor(userCount)}`}>
            {userCount}/{MAX_USERS} {lang === "hi" ? "उपयोगकर्ता" : "Users"}
          </span>
        </div>
        <div className="relative h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${progressBarColor(userCount)}`}
            initial={{ width: 0 }}
            animate={{ width: `${capacityPercent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        {isAtCapacity && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2"
            data-ocid="admin.capacity.error_state"
          >
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs font-medium">
              {lang === "hi"
                ? "अधिकतम 50 उपयोगकर्ता हो सकते हैं"
                : "Maximum 50 users reached"}
            </span>
          </motion.div>
        )}
        {!isAtCapacity && userCount >= 40 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2"
          >
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs font-medium">
              {lang === "hi"
                ? `सीमा के पास: केवल ${MAX_USERS - userCount} स्थान शेष`
                : `Approaching limit: only ${MAX_USERS - userCount} slot${MAX_USERS - userCount !== 1 ? "s" : ""} remaining`}
            </span>
          </motion.div>
        )}
      </div>

      {/* Create User Form */}
      <div
        className={`bg-card border rounded-2xl p-6 shadow-sm mb-8 ${
          isAtCapacity ? "border-red-200 opacity-60" : "border-border"
        }`}
      >
        <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <UserPlus className="h-5 w-5 text-primary" />
          {lang === "hi" ? "नया उपयोगकर्ता बनाएं" : "Create New User"}
        </h2>
        {isAtCapacity ? (
          <div
            data-ocid="admin.create_form.error_state"
            className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700"
          >
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              {lang === "hi"
                ? "अधिकतम 50 उपयोगकर्ता सीमा पूरी हो गई है। नया उपयोगकर्ता बनाने के लिए पहले किसी को हटाएं।"
                : "Maximum 50 user limit reached. Delete an existing user to create a new one."}
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleCreate}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div className="space-y-1.5">
              <Label>{lang === "hi" ? "नाम" : "Name"} *</Label>
              <Input
                data-ocid="admin.user.input"
                required
                placeholder={lang === "hi" ? "उपयोगकर्ता का नाम" : "User name"}
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{lang === "hi" ? "भूमिका" : "Role"}</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}
              >
                <SelectTrigger data-ocid="admin.user.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    {lang === "hi" ? "व्यवस्थापक (Admin)" : "Admin (व्यवस्थापक)"}
                  </SelectItem>
                  <SelectItem value="editor">
                    {lang === "hi" ? "संपादक (Editor)" : "Editor (संपादक)"}
                  </SelectItem>
                  <SelectItem value="viewer">
                    {lang === "hi" ? "देखने वाला (Viewer)" : "Viewer (देखने वाला)"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{lang === "hi" ? "6 अंक PIN" : "6-digit PIN"} *</Label>
              <Input
                data-ocid="admin.pin.input"
                required
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••••"
                value={form.pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setForm((p) => ({ ...p, pin: val }));
                  setPinError("");
                }}
              />
              {pinError && (
                <p
                  data-ocid="admin.pin.error_state"
                  className="text-xs text-destructive"
                >
                  {pinError}
                </p>
              )}
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                data-ocid="admin.user.submit_button"
                disabled={createUser.isPending || isAtCapacity}
                className="w-full gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {createUser.isPending
                  ? lang === "hi"
                    ? "बना रहे हैं..."
                    : "Creating..."
                  : lang === "hi"
                    ? "बनाएं"
                    : "Create User"}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Users List */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold text-foreground">
            {lang === "hi" ? "सभी उपयोगकर्ता" : "All Users"}
          </h2>
          <span
            className={`ml-auto text-sm font-semibold ${capacityColor(userCount)}`}
          >
            {userCount}/{MAX_USERS}
          </span>
          {onlineCount > 0 && (
            <Badge
              className="bg-green-100 text-green-700 border-green-200 gap-1"
              variant="outline"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
              {onlineCount} {lang === "hi" ? "ऑनलाइन" : "online"}
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3" data-ocid="admin.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div
            data-ocid="admin.empty_state"
            className="p-8 text-center text-muted-foreground"
          >
            <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>{lang === "hi" ? "कोई उपयोगकर्ता नहीं" : "No users found"}</p>
          </div>
        ) : (
          <div className="divide-y divide-border" data-ocid="admin.table">
            {users.map((user, idx) => {
              const online = isOnline(user.id);
              return (
                <motion.div
                  key={user.id.toString()}
                  data-ocid={`admin.item.${idx + 1}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-accent/40 flex items-center justify-center">
                      <span className="font-bold text-accent-foreground text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm flex items-center gap-1.5">
                      {user.name}
                      {currentUser?.id === user.id && (
                        <span className="text-xs text-muted-foreground">
                          ({lang === "hi" ? "आप" : "You"})
                        </span>
                      )}
                      {online && (
                        <span className="text-xs text-green-600 font-normal">
                          • {lang === "hi" ? "ऑनलाइन" : "online"}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID: {user.id.toString()}
                    </p>
                  </div>
                  <Badge
                    className={`text-xs border ${roleBadgeClass(user.role)} bg-opacity-100`}
                    variant="outline"
                  >
                    {roleLabel(user.role, lang)}
                  </Badge>
                  {/* Change PIN button -- available for all users including self */}
                  <Button
                    variant="ghost"
                    size="icon"
                    data-ocid={`admin.change_pin_button.${idx + 1}`}
                    onClick={() => openChangePinDialog(user)}
                    title={lang === "hi" ? "PIN बदलें" : "Change PIN"}
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 flex-shrink-0"
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>
                  {currentUser?.id !== user.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      data-ocid={`admin.delete_button.${idx + 1}`}
                      onClick={() => setDeleteTarget(user)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="admin.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {lang === "hi" ? "उपयोगकर्ता हटाएं?" : "Delete User?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lang === "hi"
                ? `"${deleteTarget?.name}" को हटा दिया जाएगा। यह पूर्ववत नहीं किया जा सकता।`
                : `"${deleteTarget?.name}" will be permanently deleted.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="admin.cancel_button">
              {lang === "hi" ? "रद्द करें" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="admin.confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {lang === "hi" ? "हटाएं" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change PIN Dialog */}
      <Dialog
        open={!!changePinTarget}
        onOpenChange={(o) => !o && closeChangePinDialog()}
      >
        <DialogContent
          data-ocid="admin.change_pin.dialog"
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              {lang === "hi" ? "PIN बदलें" : "Change PIN"}
              {changePinTarget && (
                <span className="font-normal text-muted-foreground text-base ml-1">
                  — {changePinTarget.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-pin">
                {lang === "hi" ? "नया 6 अंक PIN" : "New 6-digit PIN"} *
              </Label>
              <Input
                id="new-pin"
                data-ocid="admin.change_pin.input"
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••••"
                value={newPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setNewPin(val);
                  setNewPinError("");
                }}
                autoFocus
              />
              {newPinError && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="admin.change_pin.error_state"
                >
                  {newPinError}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-ocid="admin.change_pin.cancel_button"
              onClick={closeChangePinDialog}
              disabled={changeUserPin.isPending}
            >
              {lang === "hi" ? "रद्द करें" : "Cancel"}
            </Button>
            <Button
              data-ocid="admin.change_pin.save_button"
              onClick={handleChangePin}
              disabled={changeUserPin.isPending}
              className="gap-2"
            >
              {changeUserPin.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              {changeUserPin.isPending
                ? lang === "hi"
                  ? "सहेज रहे हैं..."
                  : "Saving..."
                : lang === "hi"
                  ? "सहेजें"
                  : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
