import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sun, Moon, Save, RefreshCw, Download, Edit, Check, X, Info, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

export default function IndexView() {
  const router = useRouter();
  const [indexData, setIndexData] = useState<IndexData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [qualityScores, setQualityScores] = useState({
    arabic: 0,
    structure: 0,
    academic: 0
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQualityInfo, setShowQualityInfo] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedIndex = localStorage.getItem("currentIndex");
    if (savedIndex) {
      try {
        const parsedData = JSON.parse(savedIndex);
        setIndexData(parsedData);
        setEditedContent(parsedData.index);
        // تقييم جودة الفهرس
        evaluateIndexQuality(parsedData.index);
      } catch (error) {
        console.error("Error parsing index data:", error);
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const evaluateIndexQuality = (content: string) => {
    // تقييم جودة اللغة العربية
    const arabicScore = evaluateArabicQuality(content);
    // تقييم الهيكل
    const structureScore = evaluateStructure(content);
    // تقييم الأكاديمية
    const academicScore = evaluateAcademicQuality(content);

    setQualityScores({
      arabic: arabicScore,
      structure: structureScore,
      academic: academicScore
    });
  };

  const evaluateArabicQuality = (content: string) => {
    // منطق تقييم جودة اللغة العربية
    const arabicPattern = /[\u0600-\u06FF]/g;
    const arabicWords = content.match(arabicPattern)?.length || 0;
    const totalWords = content.split(/\s+/).length;
    return Math.min(100, Math.round((arabicWords / totalWords) * 100));
  };

  const evaluateStructure = (content: string) => {
    // منطق تقييم الهيكل
    const hasMainSections = /^\d+\.\s/.test(content);
    const hasSubSections = /^\d+\.\d+\.\s/.test(content);
    const hasProperFormatting = content.includes("المقدمة") && content.includes("الخاتمة");
    return hasMainSections && hasSubSections && hasProperFormatting ? 100 : 75;
  };

  const evaluateAcademicQuality = (content: string) => {
    // منطق تقييم الأكاديمية
    const academicTerms = ["منهجية", "دراسات سابقة", "إطار نظري", "تحليل", "نتائج"];
    const score = academicTerms.reduce((acc, term) => {
      return acc + (content.includes(term) ? 20 : 0);
    }, 0);
    return Math.min(100, score);
  };

  const handleSave = () => {
    if (indexData) {
      const updatedData = {
        ...indexData,
        index: editedContent
      };
      setIndexData(updatedData);
      localStorage.setItem("currentIndex", JSON.stringify(updatedData));
      setIsEditing(false);
      evaluateIndexQuality(editedContent);
    }
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      const params = JSON.parse(localStorage.getItem("indexParams") || "{}");
      const res = await fetch("http://localhost:8000/generate_index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error("فشل في إعادة توليد الفهرس");
      const data = await res.json();
      const parsedData = JSON.parse(data.index);
      setIndexData(parsedData);
      setEditedContent(parsedData.index);
      localStorage.setItem("currentIndex", JSON.stringify(parsedData));
      evaluateIndexQuality(parsedData.index);
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء إعادة توليد الفهرس");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!indexData) return;
    const content = `# فهرس البحث\n\n${indexData.index}`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "فهرس_البحث.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getQualityIcon = (score: number) => {
    if (score >= 80) return "✨";
    if (score >= 60) return "👍";
    return "⚠️";
  };

  return (
    <>
      <Head>
        <title>عرض الفهرس</title>
        <meta name="description" content="عرض وتحرير فهرس البحث" />
      </Head>
      <main className={`min-h-screen transition-colors duration-700 font-[Cairo,sans-serif] relative overflow-hidden ${darkMode ? "bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-800" : "bg-gradient-to-br from-blue-100 via-pink-100 to-purple-100"}`} dir="rtl">
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

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex flex-col space-y-6">
            {/* مؤشرات الجودة */}
            <Card className="p-6 bg-white/70 dark:bg-gray-900/80 backdrop-blur-2xl border-0 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">تقييم جودة الفهرس</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowQualityInfo(!showQualityInfo)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Info className="h-5 w-5" />
                </Button>
              </div>
              {showQualityInfo && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm text-blue-700 dark:text-blue-200">
                  <p>يتم تقييم جودة الفهرس بناءً على ثلاثة معايير:</p>
                  <ul className="list-disc mr-6 mt-2 space-y-1">
                    <li>جودة اللغة العربية: تقييم سلامة اللغة ووضوحها</li>
                    <li>الهيكل: تقييم تنظيم الفهرس وترتيبه</li>
                    <li>الأكاديمية: تقييم مدى ملاءمة الفهرس للبحث الأكاديمي</li>
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">جودة اللغة العربية</h3>
                    <span className="text-2xl">{getQualityIcon(qualityScores.arabic)}</span>
                  </div>
                  <div className={`text-3xl font-bold ${getQualityColor(qualityScores.arabic)}`}>
                    {qualityScores.arabic}%
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">الهيكل</h3>
                    <span className="text-2xl">{getQualityIcon(qualityScores.structure)}</span>
                  </div>
                  <div className={`text-3xl font-bold ${getQualityColor(qualityScores.structure)}`}>
                    {qualityScores.structure}%
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">الأكاديمية</h3>
                    <span className="text-2xl">{getQualityIcon(qualityScores.academic)}</span>
                  </div>
                  <div className={`text-3xl font-bold ${getQualityColor(qualityScores.academic)}`}>
                    {qualityScores.academic}%
                  </div>
                </div>
              </div>
            </Card>

            {/* محتوى الفهرس */}
            <Card className="p-6 bg-white/70 dark:bg-gray-900/80 backdrop-blur-2xl border-0 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">محتوى الفهرس</h2>
                <div className="flex items-center space-x-2 space-x-reverse">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                        className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X className="h-4 w-4 ml-2" />
                        إلغاء
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSave}
                        className="text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300"
                      >
                        <Check className="h-4 w-4 ml-2" />
                        حفظ
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Edit className="h-4 w-4 ml-2" />
                        تعديل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegenerate}
                        disabled={isGenerating}
                        className="text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300"
                      >
                        <RefreshCw className={`h-4 w-4 ml-2 ${isGenerating ? "animate-spin" : ""}`} />
                        إعادة توليد
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <Download className="h-4 w-4 ml-2" />
                        تحميل
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-[500px] text-right text-lg p-4 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 transition focus:ring-2 focus:ring-pink-400"
                  dir="rtl"
                />
              ) : (
                <div
                  ref={contentRef}
                  className="prose prose-lg dark:prose-invert max-w-none p-6 bg-white dark:bg-gray-800 rounded-xl shadow-inner"
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-6" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mt-8 mb-4" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-purple-700 dark:text-purple-400 mt-6 mb-3" {...props} />,
                      p: ({ node, ...props }) => <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc mr-6 space-y-2 text-gray-700 dark:text-gray-300" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal mr-6 space-y-2 text-gray-700 dark:text-gray-300" {...props} />,
                      li: ({ node, ...props }) => <li className="mb-2" {...props} />,
                    }}
                  >
                    {indexData?.index || ""}
                  </ReactMarkdown>
                </div>
              )}
            </Card>

            {/* توزيع الصفحات */}
            {indexData?.estimated_pages && (
              <Card className="p-6 bg-white/70 dark:bg-gray-900/80 backdrop-blur-2xl border-0 rounded-2xl shadow-xl">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">توزيع الصفحات المقترح</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(indexData.estimated_pages).map(([section, pages]) => (
                    <div
                      key={section}
                      className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow"
                    >
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">{section}</h3>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{pages}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* متطلبات البحث الأكاديمي */}
            {indexData?.academic_requirements && (
              <Card className="p-6 bg-white/70 dark:bg-gray-900/80 backdrop-blur-2xl border-0 rounded-2xl shadow-xl">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">متطلبات البحث الأكاديمي</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {indexData.academic_requirements.has_literature_review && (
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">دراسات سابقة</h3>
                      <p className="text-gray-600 dark:text-gray-400">تحليل شامل للدراسات السابقة</p>
                    </div>
                  )}
                  {indexData.academic_requirements.has_methodology && (
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">منهجية البحث</h3>
                      <p className="text-gray-600 dark:text-gray-400">وصف تفصيلي لمنهجية البحث</p>
                    </div>
                  )}
                  {indexData.academic_requirements.has_citations && (
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">توثيق ومراجع</h3>
                      <p className="text-gray-600 dark:text-gray-400">توثيق كامل للمراجع المستخدمة</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>

        <style jsx global>{`
          .prose {
            max-width: none;
          }
          .prose h1 {
            color: #1e40af;
            font-size: 2.25rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
          }
          .prose h2 {
            color: #3730a3;
            font-size: 1.875rem;
            font-weight: 600;
            margin-top: 2rem;
            margin-bottom: 1rem;
          }
          .prose h3 {
            color: #5b21b6;
            font-size: 1.5rem;
            font-weight: 600;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
          }
          .prose p {
            color: #374151;
            font-size: 1.125rem;
            line-height: 1.75;
            margin-bottom: 1rem;
          }
          .prose ul {
            list-style-type: disc;
            margin-right: 1.5rem;
            margin-bottom: 1rem;
          }
          .prose ol {
            list-style-type: decimal;
            margin-right: 1.5rem;
            margin-bottom: 1rem;
          }
          .prose li {
            margin-bottom: 0.5rem;
          }
          .dark .prose h1 {
            color: #93c5fd;
          }
          .dark .prose h2 {
            color: #a5b4fc;
          }
          .dark .prose h3 {
            color: #c4b5fd;
          }
          .dark .prose p {
            color: #d1d5db;
          }
          .dark .prose ul,
          .dark .prose ol {
            color: #d1d5db;
          }
          @keyframes spin-slow {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          .animate-spin-slow {
            animation: spin-slow 3s linear infinite;
          }
          @keyframes fade-in {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-in-out;
          }
          /* تحسينات RTL */
          [dir="rtl"] .space-x-reverse > :not([hidden]) ~ :not([hidden]) {
            --tw-space-x-reverse: 1;
          }
          [dir="rtl"] .space-x-2 > :not([hidden]) ~ :not([hidden]) {
            --tw-space-x-reverse: 1;
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
            .prose h1 {
              font-size: 1.875rem;
            }
            .prose h2 {
              font-size: 1.5rem;
            }
            .prose h3 {
              font-size: 1.25rem;
            }
            .prose p {
              font-size: 1rem;
            }
          }
        `}</style>
      </main>
    </>
  );
} 