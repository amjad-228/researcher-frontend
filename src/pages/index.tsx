import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Sun, Moon, Sparkles, BookOpen, FileText, Layers, Brain, Info, Zap } from "lucide-react";

interface IndexData {
  index: string;
  estimated_pages?: {
    [key: string]: string;
  };
  academic_requirements?: {
    has_literature_review: boolean;
    has_methodology: boolean;
    has_citations: boolean;
  };
}

export default function Home() {
  const router = useRouter();
  const [title, setTitle] = useState("تأثير الذكاء الاصطناعي على العملية التعليمية");
  const [pages, setPages] = useState("10");
  const [citation, setCitation] = useState("APA");
  const [isAcademic, setIsAcademic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("ollama");
  const [darkMode, setDarkMode] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showFieldTip, setShowFieldTip] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);
  const [indexResult, setIndexResult] = useState<IndexData | null>(null);
  const [editingIndex, setEditingIndex] = useState(false);
  const [editedIndex, setEditedIndex] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    // تحميل خط Google Fonts للعربية
    const link = document.createElement('link');
    link.href = darkMode
      ? "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap"
      : "https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, [darkMode]);

  // جزيئات متحركة (Particles)
  useEffect(() => {
    const canvas = document.getElementById("particles-bg") as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let particles: any[] = [];
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2 + 1,
        dx: (Math.random() - 0.5) * 0.7,
        dy: (Math.random() - 0.5) * 0.7,
        o: Math.random() * 0.5 + 0.3
      });
    }
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      for (let p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
        ctx.fillStyle = darkMode ? `rgba(255,255,255,${p.o})` : `rgba(99,102,241,${p.o})`;
        ctx.shadowColor = darkMode ? "#fbbf24" : "#a5b4fc";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.closePath();
      }
    }
    function update() {
      for (let p of particles) {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > w) p.dx *= -1;
        if (p.y < 0 || p.y > h) p.dy *= -1;
      }
    }
    function animate() {
      draw();
      update();
      requestAnimationFrame(animate);
    }
    animate();
    return () => { particles = []; };
  }, [darkMode]);

  // Ripple Effect للأزرار
  const handleRipple = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const btn = e.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - btn.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${e.clientY - btn.getBoundingClientRect().top - radius}px`;
    circle.className = "ripple";
    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  };

  const handleSubmit = async (e?: any) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      if (cardRef.current) {
        cardRef.current.classList.add("animate-shake");
        setTimeout(() => cardRef.current?.classList.remove("animate-shake"), 600);
      }
      return alert("يرجى إدخال عنوان البحث");
    }
    setLoading(true);
    try {
      const params = {
        title,
        pages: parseInt(pages),
        citation_style: citation,
        is_academic: isAcademic,
        model
      };
      localStorage.setItem("indexParams", JSON.stringify(params));
      const res = await fetch("http://localhost:8000/generate_index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error("فشل في توليد الفهرس");
      const data = await res.json();
      if (typeof data.index === 'string' && data.index.startsWith('خطأ في الاتصال بـ Ollama')) {
        throw new Error(data.index);
      }
      const parsedData = JSON.parse(data.index);
      localStorage.setItem("currentIndex", JSON.stringify(parsedData));
      router.push("/index-view");
    } catch (error) {
      if (cardRef.current) {
        cardRef.current.classList.add("animate-shake");
        setTimeout(() => cardRef.current?.classList.remove("animate-shake"), 600);
      }
      alert(error instanceof Error ? error.message : "حدث خطأ أثناء توليد الفهرس");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditingIndex(true);
  };

  const handleSave = () => {
    if (indexResult) {
      setIndexResult({
        ...indexResult,
        index: editedIndex
      });
    }
    setEditingIndex(false);
  };

  return (
    <>
      <Head>
        <title>مساعد البحث الأكاديمي</title>
        <meta name="description" content="مساعد ذكي لتوليد الأبحاث الأكاديمية" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <main className={`min-h-screen transition-colors duration-700 font-[Cairo,sans-serif] relative overflow-hidden ${darkMode ? "bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-800" : "bg-gradient-to-br from-blue-100 via-pink-100 to-purple-100"}`} dir="rtl">
        {/* خلفية جزيئات متحركة */}
        <canvas id="particles-bg" className="fixed inset-0 w-full h-full z-0 pointer-events-none" />
        {/* زر الوضع الليلي مع Tooltip */}
        <div className="absolute top-6 left-6 z-50">
          <Button
            variant="ghost"
            size="icon"
            aria-label="تبديل الوضع الليلي/النهاري"
            className="rounded-full shadow-lg transition-transform hover:scale-110"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setDarkMode((d) => !d)}
          >
            <span className="relative block transition-transform duration-500">
              {darkMode ? <Sun className="h-6 w-6 text-yellow-300 animate-spin-slow" /> : <Moon className="h-6 w-6 text-gray-800 animate-pulse" />}
            </span>
          </Button>
          {showTooltip && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs rounded-lg px-3 py-1 shadow-lg animate-fade-in">
              {darkMode ? "الوضع النهاري" : "الوضع الليلي"}
            </div>
          )}
        </div>
        <div className="container mx-auto px-4 max-w-2xl flex flex-col items-center justify-center min-h-screen relative z-10">
          <div className="flex flex-col items-center mb-8 animate-fade-in-up">
            <Sparkles className="h-12 w-12 text-indigo-400 dark:text-yellow-300 animate-bounce mb-2" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-center bg-gradient-to-r from-indigo-500 via-pink-500 to-purple-500 bg-clip-text text-transparent dark:from-yellow-300 dark:via-pink-400 dark:to-purple-300 animate-gradient-x drop-shadow-lg animate-pulse-slow">
              مساعد البحث الأكاديمي الذكي
            </h1>
            <p className="mt-4 text-lg md:text-xl text-gray-700 dark:text-gray-200 text-center animate-fade-in delay-200">
              أنشئ فهرس بحث أكاديمي احترافي باللغة العربية بخطوات بسيطة وواجهة خرافية!
            </p>
          </div>
          <Card ref={cardRef} className="w-full p-4 md:p-8 rounded-3xl shadow-2xl bg-white/70 dark:bg-gray-900/80 backdrop-blur-2xl border-0 animate-fade-in-up delay-300 glass-card">
            <form className="space-y-6 md:space-y-8" onSubmit={handleSubmit}>
              <div className="space-y-2 relative">
                <Label className="text-right block text-xl md:text-2xl font-bold flex items-center gap-2" onMouseEnter={() => setShowFieldTip("title")} onMouseLeave={() => setShowFieldTip("")}>
                  <BookOpen className="inline-block h-8 w-8 text-indigo-400 dark:text-yellow-300 animate-float" />
                  عنوان البحث
                </Label>
                {showFieldTip === "title" && (
                  <div className="absolute right-0 -top-8 bg-black/80 text-white text-xs rounded-lg px-3 py-1 shadow-lg animate-fade-in">
                    أدخل عنوان البحث بدقة ووضوح
                  </div>
                )}
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="أدخل عنوان البحث"
                  className="text-right text-xl md:text-2xl py-4 px-6 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 transition focus:ring-2 focus:ring-pink-400"
                  dir="rtl"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2 relative">
                  <Label className="text-right block text-base md:text-lg font-semibold flex items-center gap-2" onMouseEnter={() => setShowFieldTip("pages")} onMouseLeave={() => setShowFieldTip("")}>
                    <Layers className="inline-block h-5 w-5 text-pink-400 dark:text-yellow-400 animate-float-slow" />
                    عدد الصفحات
                  </Label>
                  {showFieldTip === "pages" && (
                    <div className="absolute right-0 -top-8 bg-black/80 text-white text-xs rounded-lg px-3 py-1 shadow-lg animate-fade-in">
                      اختر عدد صفحات البحث
                    </div>
                  )}
                  <Select value={pages} onValueChange={setPages}>
                    <SelectTrigger className="text-right text-base md:text-lg py-2 px-4 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 transition focus:ring-2 focus:ring-pink-400">
                      <SelectValue placeholder="اختر عدد الصفحات" />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 15, 20, 25, 30].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} صفحات
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 relative">
                  <Label className="text-right block text-base md:text-lg font-semibold flex items-center gap-2" onMouseEnter={() => setShowFieldTip("citation")} onMouseLeave={() => setShowFieldTip("")}>
                    <FileText className="inline-block h-5 w-5 text-purple-400 dark:text-pink-300 animate-float" />
                    نمط التوثيق
                  </Label>
                  {showFieldTip === "citation" && (
                    <div className="absolute right-0 -top-8 bg-black/80 text-white text-xs rounded-lg px-3 py-1 shadow-lg animate-fade-in">
                      اختر نمط التوثيق المناسب
                    </div>
                  )}
                  <Select value={citation} onValueChange={setCitation}>
                    <SelectTrigger className="text-right text-base md:text-lg py-2 px-4 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 transition focus:ring-2 focus:ring-pink-400">
                      <SelectValue placeholder="اختر نمط التوثيق" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APA">APA</SelectItem>
                      <SelectItem value="MLA">MLA</SelectItem>
                      <SelectItem value="Chicago">Chicago</SelectItem>
                      <SelectItem value="Harvard">Harvard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2 relative">
                <Label className="text-right block text-base md:text-lg font-semibold flex items-center gap-2" onMouseEnter={() => setShowFieldTip("model")} onMouseLeave={() => setShowFieldTip("")}>
                  <Brain className="inline-block h-5 w-5 text-pink-400 dark:text-yellow-400 animate-float-slow" />
                  النموذج المستخدم
                </Label>
                {showFieldTip === "model" && (
                  <div className="absolute right-0 -top-8 bg-black/80 text-white text-xs rounded-lg px-3 py-1 shadow-lg animate-fade-in">
                    اختر النموذج الذي تفضله
                  </div>
                )}
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="text-right text-base md:text-lg py-2 px-4 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 transition focus:ring-2 focus:ring-pink-400">
                    <SelectValue placeholder="اختر النموذج" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ollama">Ollama (محلي)</SelectItem>
                    <SelectItem value="openai">OpenAI (سحابي)</SelectItem>
                    <SelectItem value="openrouter">OpenRouter (سحابي)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-end space-x-2 space-x-reverse">
                <Label htmlFor="academic-mode" className="text-right text-base md:text-lg font-semibold flex items-center gap-2" onMouseEnter={() => setShowFieldTip("academic")} onMouseLeave={() => setShowFieldTip("")}>
                  <Info className="inline-block h-5 w-5 text-indigo-400 dark:text-yellow-300 animate-float" />
                  بحث أكاديمي متقدم
                </Label>
                {showFieldTip === "academic" && (
                  <div className="absolute right-0 -top-8 bg-black/80 text-white text-xs rounded-lg px-3 py-1 shadow-lg animate-fade-in">
                    فعّل هذا الخيار إذا كنت تريد فهرس بحث أكاديمي متكامل
                  </div>
                )}
                <Switch
                  id="academic-mode"
                  checked={isAcademic}
                  onCheckedChange={setIsAcademic}
                  className="scale-110 md:scale-125"
                />
              </div>
              <Button
                className="w-full mt-4 text-xl py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-pink-500 to-purple-500 text-white font-bold shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300 dark:from-yellow-400 dark:via-pink-400 dark:to-purple-400 dark:text-gray-900 animate-fade-in-up focus:ring-4 focus:ring-pink-300 focus:ring-opacity-50 glow-on-hover"
                onClick={e => { handleRipple(e); handleSubmit(e); }}
                disabled={loading}
                type="submit"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2 animate-pulse">
                    <Zap className="h-6 w-6 animate-spin text-yellow-300" />
                    جاري التوليد...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="h-6 w-6 animate-bounce" />
                    إنشاء الفهرس
                  </span>
                )}
              </Button>
            </form>
          </Card>
        </div>
        <style jsx global>{`
          @keyframes fade-in-up {
            0% { opacity: 0; transform: translateY(40px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 1s cubic-bezier(0.23, 1, 0.32, 1);
          }
          .animate-fade-in {
            animation: fade-in 1.2s ease-in;
          }
          @keyframes fade-in {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          @keyframes gradient-x {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .animate-gradient-x {
            background-size: 200% 200%;
            animation: gradient-x 4s ease-in-out infinite;
          }
          @keyframes gradient-bg {
            0% { filter: blur(60px) brightness(1.1); }
            50% { filter: blur(80px) brightness(1.3); }
            100% { filter: blur(60px) brightness(1.1); }
          }
          .animate-gradient-bg {
            background: linear-gradient(120deg, #a5b4fc 0%, #f472b6 100%);
            width: 100vw; height: 100vh;
            animation: gradient-bg 8s ease-in-out infinite;
          }
          @keyframes float {
            0% { transform: translateY(0); }
            50% { transform: translateY(-16px); }
            100% { transform: translateY(0); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          .animate-float-slow {
            animation: float 5s ease-in-out infinite;
          }
          .glass-card {
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18);
            border-radius: 2rem;
            border: 1px solid rgba(255,255,255,0.18);
            backdrop-filter: blur(24px) saturate(180%);
            background: rgba(255,255,255,0.7);
          }
          .dark .glass-card {
            background: rgba(30, 41, 59, 0.85);
            border: 1px solid rgba(255,255,255,0.08);
          }
          .animate-pulse-slow {
            animation: pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          .glow-on-hover:hover {
            box-shadow: 0 0 24px 6px #f472b6, 0 0 48px 12px #a5b4fc;
            filter: brightness(1.1);
          }
          .ripple {
            position: absolute;
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            background-color: rgba(236, 72, 153, 0.4);
            pointer-events: none;
            z-index: 10;
          }
          @keyframes ripple {
            to {
              transform: scale(2.5);
              opacity: 0;
            }
          }
          .animate-shake {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
          }
          @keyframes shake {
            10%, 90% { transform: translateX(-2px); }
            20%, 80% { transform: translateX(4px); }
            30%, 50%, 70% { transform: translateX(-8px); }
            40%, 60% { transform: translateX(8px); }
          }
          /* تحسينات RTL */
          [dir="rtl"] .space-x-reverse > :not([hidden]) ~ :not([hidden]) {
            --tw-space-x-reverse: 1;
          }
          [dir="rtl"] .space-x-2 > :not([hidden]) ~ :not([hidden]) {
            --tw-space-x-reverse: 1;
          }
          [dir="rtl"] .mr-8 {
            margin-left: 2rem;
            margin-right: 0;
          }
          [dir="rtl"] .mr-12 {
            margin-left: 3rem;
            margin-right: 0;
          }
          [dir="rtl"] .mr-6 {
            margin-left: 1.5rem;
            margin-right: 0;
          }
          /* تحسينات الهاتف */
          @media (max-width: 768px) {
            .container {
              padding-left: 1rem;
              padding-right: 1rem;
            }
            .glass-card {
              border-radius: 1.5rem;
              padding: 1rem;
            }
            h1 {
              font-size: 2rem;
            }
            .text-xl {
              font-size: 1.25rem;
            }
            .text-2xl {
              font-size: 1.5rem;
            }
          }
        `}</style>
      </main>
    </>
  );
}
