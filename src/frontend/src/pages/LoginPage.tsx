import { Delete } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { User } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useAuth } from "../lib/AuthContext";
import { useLang } from "../lib/LanguageContext";

// Retry helper: retries an async fn up to `times` times with `delayMs` between attempts
async function withRetry<T>(
  fn: () => Promise<T>,
  times = 3,
  delayMs = 1200,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < times; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < times - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

export default function LoginPage() {
  const { login } = useAuth();
  const { actor } = useActor();
  const { lang } = useLang();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [adminReady, setAdminReady] = useState(false);
  const [matchedUsers, setMatchedUsers] = useState<User[]>([]);
  const [showUserPick, setShowUserPick] = useState(false);
  const ensureCalledRef = useRef(false);

  useEffect(() => {
    if (!actor || ensureCalledRef.current) return;
    ensureCalledRef.current = true;
    setAdminReady(false);
    // Retry ensureDefaultAdmin up to 3 times in case canister is slow on first wake
    withRetry(() => actor.ensureDefaultAdmin(), 3, 1500)
      .then(() => setAdminReady(true))
      .catch(() => setAdminReady(true)); // even on error, allow login attempt
  }, [actor]);

  async function handleDigit(d: string) {
    if (pin.length >= 6 || isLoading || !adminReady) return;
    const newPin = pin + d;
    setPin(newPin);
    setError("");
    if (newPin.length === 6) {
      setIsLoading(true);
      try {
        if (!actor) {
          setError(
            lang === "hi"
              ? "सर्वर से कनेक्ट नहीं हो पाया"
              : "Could not connect to server",
          );
          setPin("");
          setIsLoading(false);
          return;
        }

        // Use retry so transient canister errors don't block login
        let users: User[] = [];
        try {
          const res = await withRetry(
            () => (actor as any).getUsersByPin(newPin),
            3,
            1000,
          );
          users = Array.isArray(res) ? res : [];
        } catch {
          // fallback: try getUserByPin with retry
          try {
            const result = await withRetry(
              () => actor.getUserByPin(newPin),
              3,
              1000,
            );
            const user =
              Array.isArray(result) && result.length > 0 ? result[0] : result;
            if (user && (user as User).id !== undefined) {
              users = [user as User];
            }
          } catch {
            setError(
              lang === "hi"
                ? "सर्वर से कनेक्ट नहीं हो पाया, दोबारा कोशिश करें"
                : "Could not connect to server, please try again",
            );
            setPin("");
            setIsLoading(false);
            return;
          }
        }

        if (users.length === 0) {
          setError(
            lang === "hi" ? "गलत PIN / Wrong PIN" : "Wrong PIN / गलत PIN",
          );
          setPin("");
        } else if (users.length === 1) {
          const u = users[0];
          login({ id: u.id, name: u.name, role: u.role, pin: u.pin });
          toast.success(
            lang === "hi" ? `स्वागत है, ${u.name}!` : `Welcome, ${u.name}!`,
          );
        } else {
          setMatchedUsers(users);
          setShowUserPick(true);
        }
      } catch {
        setError(
          lang === "hi"
            ? "सर्वर से कनेक्ट नहीं हो पाया, दोबारा कोशिश करें"
            : "Could not connect, please try again",
        );
        setPin("");
      } finally {
        setIsLoading(false);
      }
    }
  }

  function handlePickUser(user: User) {
    login({ id: user.id, name: user.name, role: user.role, pin: user.pin });
    toast.success(
      lang === "hi" ? `स्वागत है, ${user.name}!` : `Welcome, ${user.name}!`,
    );
  }

  function handleBackFromPick() {
    setShowUserPick(false);
    setMatchedUsers([]);
    setPin("");
    setError("");
  }

  function handleBackspace() {
    setPin((p) => p.slice(0, -1));
    setError("");
  }

  const digitRows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "back"],
  ];

  const isReady = !!actor && adminReady;

  function roleLabel(role: string) {
    if (lang === "hi") {
      if (role === "admin") return "व्यवस्थापक";
      if (role === "editor") return "संपादक";
      return "देखने वाला";
    }
    if (role === "admin") return "Admin";
    if (role === "editor") return "Editor";
    return "Viewer";
  }

  function roleBadgeClass(role: string) {
    if (role === "admin") return "bg-orange-100 text-orange-700";
    if (role === "editor") return "bg-green-100 text-green-700";
    return "bg-gray-100 text-gray-600";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm"
      >
        {/* Logo + Name */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 bg-amber-100 border-4 border-amber-200 shadow-md">
            <img
              src="/assets/generated/gaushala-logo-transparent.dim_120x120.png"
              alt="Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground leading-tight">
            अन्नपूर्णा गौ आश्रम
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Annpurna Gau Aashram
          </p>
        </div>

        <AnimatePresence mode="wait">
          {showUserPick ? (
            <motion.div
              key="userpick"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-center text-sm font-semibold text-foreground mb-1">
                {lang === "hi" ? "आप कौन हैं?" : "Who are you?"}
              </p>
              <p className="text-center text-xs text-muted-foreground mb-5">
                {lang === "hi"
                  ? "एक ही PIN पर कई users हैं — अपना नाम चुनें"
                  : "Multiple users share this PIN — pick your name"}
              </p>
              <div className="space-y-3 mb-5">
                {matchedUsers.map((u) => (
                  <motion.button
                    key={u.id.toString()}
                    type="button"
                    data-ocid="login.button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handlePickUser(u)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-amber-800 text-sm">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">
                        {u.name}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeClass(u.role)}`}
                      >
                        {roleLabel(u.role)}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
              <button
                type="button"
                data-ocid="login.cancel_button"
                onClick={handleBackFromPick}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 py-2"
              >
                ← {lang === "hi" ? "वापस" : "Go back"}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="pinentry"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-center text-sm font-medium text-muted-foreground mb-4">
                {!isReady
                  ? lang === "hi"
                    ? "तैयार हो रहा है..."
                    : "Initializing..."
                  : lang === "hi"
                    ? "अपना 6 अंक का PIN डालें"
                    : "Enter your 6-digit PIN"}
              </p>

              <div className="flex justify-center gap-3 mb-6">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: pin.length === i + 1 ? [1, 1.3, 1] : 1,
                      backgroundColor:
                        pin.length > i
                          ? "oklch(0.52 0.14 50)"
                          : "oklch(0.88 0.03 75)",
                    }}
                    transition={{ duration: 0.2 }}
                    className="w-3.5 h-3.5 rounded-full"
                  />
                ))}
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    data-ocid="login.error_state"
                    className="text-center text-sm text-destructive font-medium mb-4"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {isLoading && (
                <p
                  data-ocid="login.loading_state"
                  className="text-center text-sm text-muted-foreground mb-4 animate-pulse"
                >
                  {lang === "hi" ? "जाँच हो रही है..." : "Checking..."}
                </p>
              )}

              {!isReady && !isLoading && (
                <p className="text-center text-xs text-muted-foreground mb-4 animate-pulse">
                  {lang === "hi" ? "कृपया प्रतीक्षा करें..." : "Please wait..."}
                </p>
              )}

              <div className="grid grid-cols-3 gap-3">
                {digitRows.flat().map((d, rowIdx) => {
                  const key = d === "" ? `empty-${rowIdx}` : d;
                  if (d === "") return <div key={key} />;
                  if (d === "back") {
                    return (
                      <motion.button
                        key="back"
                        type="button"
                        data-ocid="login.button"
                        whileTap={{ scale: 0.92 }}
                        onClick={handleBackspace}
                        disabled={pin.length === 0 || isLoading || !isReady}
                        className="h-14 rounded-2xl bg-orange-50 hover:bg-orange-100 border border-orange-200 flex items-center justify-center text-muted-foreground disabled:opacity-40 transition-colors"
                      >
                        <Delete className="h-5 w-5" />
                      </motion.button>
                    );
                  }
                  return (
                    <motion.button
                      key={d}
                      type="button"
                      data-ocid="login.button"
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handleDigit(d)}
                      disabled={isLoading || !isReady}
                      className="h-14 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-foreground font-semibold text-xl transition-colors disabled:opacity-40"
                    >
                      {d}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
