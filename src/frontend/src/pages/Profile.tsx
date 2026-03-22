import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Edit2, Loader2, MapPin, Phone, Save, X } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../lib/AuthContext";
import { useLang } from "../lib/LanguageContext";

const PROFILE_KEY = "gaushala_profile";

interface GaushaalaProfile {
  name: string;
  nameHindi: string;
  description: string;
  descriptionHindi: string;
  phone: string;
  address: string;
  logoBase64: string;
}

const DEFAULT_PROFILE: GaushaalaProfile = {
  name: "Annpurna Gau Aashram",
  nameHindi: "अन्नपूर्णा गाय आश्रम",
  description: "A sacred shelter dedicated to the care and welfare of cows.",
  descriptionHindi: "गायों की देखभाल और कल्याण के लिए समर्पित एक पवित्र आश्रम।",
  phone: "",
  address: "",
  logoBase64: "",
};

function loadProfile(): GaushaalaProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function saveProfile(p: GaushaalaProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  window.dispatchEvent(new Event("gaushala_profile_updated"));
}

export function loadProfileLogo(): string {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return "";
    const p = JSON.parse(raw) as GaushaalaProfile;
    return p.logoBase64 || "";
  } catch {
    return "";
  }
}

export default function Profile() {
  const { lang } = useLang();
  const { isAdmin } = useAuth();
  const [profile, setProfile] = useState<GaushaalaProfile>(loadProfile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<GaushaalaProfile>(profile);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const quickLogoRef = useRef<HTMLInputElement>(null);

  const hi = lang === "hi";

  function startEdit() {
    setDraft({ ...profile });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setDraft((prev) => ({
        ...prev,
        logoBase64: ev.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  }

  function handleQuickLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const logoBase64 = ev.target?.result as string;
      const updated = { ...profile, logoBase64 };
      saveProfile(updated);
      setProfile(updated);
      setDraft(updated);
      toast.success(hi ? "लोगो बदला गया ✓" : "Logo updated ✓");
    };
    reader.readAsDataURL(file);
    // reset input so same file can be selected again
    e.target.value = "";
  }

  function triggerFileInput() {
    if (editing) fileRef.current?.click();
  }

  async function handleSave() {
    setSaving(true);
    try {
      saveProfile(draft);
      setProfile(draft);
      setEditing(false);
      toast.success(hi ? "प्रोफ़ाइल सहेजी गई ✓" : "Profile saved successfully ✓");
    } catch {
      toast.error(hi ? "कुछ गलत हुआ" : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const displayDesc = hi
    ? profile.descriptionHindi || profile.description
    : profile.description;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-xl font-bold text-foreground">
            {hi ? "गौशाला प्रोफ़ाइल" : "Gaushala Profile"}
          </h1>
          {isAdmin && !editing && (
            <Button
              data-ocid="profile.edit_button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={startEdit}
            >
              <Edit2 className="h-4 w-4" />
              {hi ? "संपादित करें" : "Edit"}
            </Button>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
          {/* Top banner */}
          <div
            className="h-28 w-full"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.18 50) 0%, oklch(0.58 0.22 30) 100%)",
            }}
          />

          <div className="px-6 pb-6">
            {/* Logo circle */}
            <div className="-mt-14 mb-4 flex items-end justify-between">
              <div className="relative">
                <button
                  type="button"
                  className="w-24 h-24 rounded-full border-4 border-card overflow-hidden shadow-lg flex items-center justify-center bg-amber-50 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ cursor: editing ? "pointer" : "default" }}
                  onClick={triggerFileInput}
                  data-ocid={editing ? "profile.upload_button" : undefined}
                  tabIndex={editing ? 0 : -1}
                  aria-label={
                    editing ? (hi ? "लोगो बदलें" : "Change logo") : undefined
                  }
                >
                  {(editing ? draft.logoBase64 : profile.logoBase64) ? (
                    <img
                      src={editing ? draft.logoBase64 : profile.logoBase64}
                      alt="logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">🐄</span>
                  )}

                  {editing && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-7 w-7 text-white" />
                    </div>
                  )}
                </button>

                {/* Quick logo change button for admin in view mode */}
                {isAdmin && !editing && (
                  <button
                    type="button"
                    data-ocid="profile.upload_button"
                    onClick={() => quickLogoRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center shadow-md border-2 border-card hover:bg-primary/90 transition-colors"
                    aria-label={hi ? "लोगो बदलें" : "Change logo"}
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <input
                  ref={quickLogoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleQuickLogoChange}
                />
              </div>

              {editing && (
                <div className="flex gap-2 mb-1">
                  <Button
                    data-ocid="profile.cancel_button"
                    variant="ghost"
                    size="sm"
                    onClick={cancelEdit}
                    className="gap-1.5"
                  >
                    <X className="h-4 w-4" />
                    {hi ? "रद्द" : "Cancel"}
                  </Button>
                  <Button
                    data-ocid="profile.save_button"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="gap-1.5"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {hi ? "सहेजें" : "Save"}
                  </Button>
                </div>
              )}
            </div>

            {/* View Mode */}
            {!editing ? (
              <div className="space-y-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    {profile.name}
                  </h2>
                  <p className="text-muted-foreground text-sm font-medium">
                    {profile.nameHindi}
                  </p>
                </div>

                {displayDesc && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {displayDesc}
                  </p>
                )}

                <div className="flex flex-col gap-2 pt-1">
                  {profile.phone && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  {profile.address && (
                    <div className="flex items-start gap-2 text-sm text-foreground">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span>{profile.address}</span>
                    </div>
                  )}
                </div>

                {!profile.phone && !profile.address && isAdmin && (
                  <p className="text-xs text-muted-foreground italic">
                    {hi
                      ? "संपर्क जानकारी जोड़ने के लिए 'संपादित करें' पर क्लिक करें"
                      : "Click 'Edit' to add contact information"}
                  </p>
                )}
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="name"
                      className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                    >
                      {hi ? "नाम (English)" : "Name (English)"}
                    </Label>
                    <Input
                      id="name"
                      data-ocid="profile.input"
                      value={draft.name}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="Gaushala name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="nameHindi"
                      className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                    >
                      {hi ? "नाम (हिन्दी)" : "Name (Hindi)"}
                    </Label>
                    <Input
                      id="nameHindi"
                      data-ocid="profile.input"
                      value={draft.nameHindi}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, nameHindi: e.target.value }))
                      }
                      placeholder="गौशाला का नाम"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="desc"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    {hi ? "विवरण (English)" : "Description (English)"}
                  </Label>
                  <Textarea
                    id="desc"
                    data-ocid="profile.textarea"
                    value={draft.description}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="About the gaushala..."
                    rows={2}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="descHindi"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    {hi ? "विवरण (हिन्दी)" : "Description (Hindi)"}
                  </Label>
                  <Textarea
                    id="descHindi"
                    data-ocid="profile.textarea"
                    value={draft.descriptionHindi}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        descriptionHindi: e.target.value,
                      }))
                    }
                    placeholder="गौशाला के बारे में..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="phone"
                      className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                    >
                      {hi ? "फ़ोन नंबर" : "Phone Number"}
                    </Label>
                    <Input
                      id="phone"
                      data-ocid="profile.input"
                      value={draft.phone}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="+91 XXXXX XXXXX"
                      type="tel"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="address"
                      className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                    >
                      {hi ? "पता" : "Address"}
                    </Label>
                    <Textarea
                      id="address"
                      data-ocid="profile.textarea"
                      value={draft.address}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, address: e.target.value }))
                      }
                      placeholder={
                        hi ? "गौशाला का पता..." : "Gaushala address..."
                      }
                      rows={2}
                    />
                  </div>
                </div>

                {/* Image upload hint */}
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 flex items-center gap-2">
                  <Camera className="h-4 w-4 flex-shrink-0" />
                  {hi
                    ? "लोगो बदलने के लिए ऊपर के गोले पर क्लिक करें"
                    : "Click the circle above to change the logo image"}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer credit */}
        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-muted-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
