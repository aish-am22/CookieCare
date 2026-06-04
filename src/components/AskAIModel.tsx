import React, { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Folder, 
  FolderPlus, 
  Globe, 
  Plus, 
  Trash2, 
  User, 
  Scale, 
  ShieldAlert, 
  Check, 
  FileText, 
  BookmarkCheck, 
  Download, 
  Copy, 
  Columns, 
  ExternalLink, 
  X, 
  BookOpen, 
  Sparkles, 
  RefreshCw, 
  HelpCircle, 
  FileCode, 
  ArrowRight,
  History,
  Search,
  Upload,
  ChevronRight,
  Printer,
  AlertCircle,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  Info,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { apiUrl } from "../config";
import { LegalDocument } from "../types";

interface AskAIModelProps {
  documents: LegalDocument[];
  activeDocument: LegalDocument | null;
  authToken: string;
}

interface KBFolder {
  id: string;
  name: string;
  files: Array<{
    name: string;
    type: "PDF" | "DOCX" | "XLSX" | "PPTX" | "Image" | "TXT";
    size: string;
  }>;
}

interface Source {
  id: string;
  title: string;
  citation: string;
  jurisdiction: string;
  documentType: string;
  officialCopy: string;
  facts?: string;
  principles?: string;
  arguments?: string;
  decision?: string;
}

interface HistoryItem {
  id: string;
  query: string;
  date: string;
  format: string;
  questionToAsk: string;
  dbSources: string[];
  urls: string[];
  foldersSelected: string[];
  outputContent: string;
  sources: Source[];
}

export default function AskAIModel({ documents, activeDocument, authToken }: AskAIModelProps) {
  const [viewState, setViewState] = useState<"hub" | "rephrase_modal" | "understanding_phase" | "display_answer">("hub");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<"Brief Summary" | "Full IRAC" | "CREAC">("Full IRAC");
  
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);

  const [activeDossier, setActiveDossier] = useState<HistoryItem | null>(null);

  const [selectedDbSources, setSelectedDbSources] = useState<string[]>(["India › Direct Tax"]);
  const [folders, setFolders] = useState<KBFolder[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [webUrls, setWebUrls] = useState<string[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);

  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [modalSubTab, setModalSubTab] = useState<"database" | "folder" | "web">("database");
  
  const [newFolderName, setNewFolderName] = useState("");
  const [newUrlInput, setNewUrlInput] = useState("");

  const [rephrasePromptOriginal, setRephrasePromptOriginal] = useState("");
  const [rephraseOptions, setRephraseOptions] = useState<string[]>([]);
  const [selectedRephraseOption, setSelectedRephraseOption] = useState("");

  const [stepperStage, setStepperStage] = useState<"searching" | "streaming" | "done">("searching");
  const [stepperMessage, setStepperMessage] = useState("");
  const [detailedAnswerText, setDetailedAnswerText] = useState("");
  const [activeMatchedSources, setActiveMatchedSources] = useState<Source[]>([]);
  const [isSynthesizingAnswer, setIsSynthesizingAnswer] = useState(false);

  const [activeViewSource, setActiveViewSource] = useState<Source | null>(null);
  const [activeDeepDiveSource, setActiveDeepDiveSource] = useState<Source | null>(null);

  const [isCopied, setIsCopied] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);

  const dbCategories = [
    { country: "India", items: ["Direct Taxes", "Indirect Taxes", "Corporate Laws", "General Laws", "General Chat"] },
    { country: "United States", items: ["US Federal and state legal research", "General Legal Chat"] },
    { country: "General Legal Chat", items: ["General legal chat spanning over 20 jurisdictions"] }
  ];

  const handleSeeExamples = () => {
    setSearchQuery("Assess double tax relief guidelines under Section 90 of the Income Tax Act.");
  };

  const handleOpenSourceModal = () => setSourceModalOpen(true);

  const handleToggleDbSource = (sourceName: string) => {
    setSelectedDbSources(prev => 
      prev.includes(sourceName) ? prev.filter(s => s !== sourceName) : [...prev, sourceName]
    );
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newF: KBFolder = { id: "folder_" + Date.now(), name: newFolderName.trim(), files: [] };
    setFolders([...folders, newF]);
    setSelectedFolderIds(prev => [...prev, newF.id]);
    setNewFolderName("");
  };

  const handleAddNewUrl = () => {
    if (!newUrlInput.trim()) return;
    let url = newUrlInput.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    if (!webUrls.includes(url)) {
      setWebUrls([...webUrls, url]);
      setSelectedUrls([...selectedUrls, url]);
    }
    setNewUrlInput("");
  };

  const handleRemoveUrl = (url: string) => {
    setWebUrls(webUrls.filter(u => u !== url));
    setSelectedUrls(selectedUrls.filter(u => u !== url));
  };

  const handleAskDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (selectedFormat === "Brief Summary") {
      setRephrasePromptOriginal(searchQuery);
      // In a real app, this would be an AI call to get rephrased options.
      // For now, we use the query and some structural variations as placeholders.
      setRephraseOptions([
        searchQuery,
        `Provide a concise legal summary regarding: ${searchQuery}`,
        `Explain the core statutory provisions and case law relevant to: ${searchQuery}`,
      ]);
      setSelectedRephraseOption(searchQuery);
      setViewState("rephrase_modal");
    } else {
      triggerAdvisoryComputation(searchQuery);
    }
  };

  const triggerAdvisoryComputation = async (queryToExecute: string) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setViewState("understanding_phase");
    setStepperStage("searching");
    setStepperMessage("Initializing legal knowledge base search...");
    setDetailedAnswerText("");
    setActiveMatchedSources([]);
    setIsSynthesizingAnswer(true);

    try {
      const response = await fetch(apiUrl("/api/lawyer/ask"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          prompt: queryToExecute,
          jurisdiction: selectedDbSources,
          outputFormat: selectedFormat,
          documents: selectedFolderIds // Mapping selected folders as context
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error("Advisory system failed to respond.");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("Stream reader failed.");

      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine.startsWith("data: ")) continue;

          const dataStr = cleanLine.replace("data: ", "");
          if (dataStr === "[DONE]") {
            setStepperStage("done");
            setIsSynthesizingAnswer(false);
            continue;
          }

          try {
            const data = JSON.parse(dataStr);
            if (data.step) {
              setStepperStage("searching");
              setStepperMessage(data.message);
            } else if (data.sources) {
              setActiveMatchedSources(data.sources);
              setViewState("display_answer");
              setStepperStage("streaming");
            } else if (data.text) {
              setDetailedAnswerText(prev => prev + data.text);
              if (viewState !== "display_answer") setViewState("display_answer");
            } else if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            // Partial JSON or unexpected format
          }
        }
      }

      // Add to local history after completion
      const newItem: HistoryItem = {
        id: "hist_" + Date.now(),
        query: queryToExecute,
        date: new Date().toLocaleString(),
        format: selectedFormat,
        questionToAsk: queryToExecute,
        dbSources: selectedDbSources,
        urls: selectedUrls,
        foldersSelected: selectedFolderIds,
        outputContent: detailedAnswerText,
        sources: activeMatchedSources
      };
      setHistoryList(prev => [newItem, ...prev]);
      setActiveDossier(newItem);

    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error(err);
      setViewState("hub");
      alert(err.message || "An error occurred during legal research.");
    } finally {
      setIsSynthesizingAnswer(false);
    }
  };

  const handleOpenOldHistory = (item: HistoryItem) => {
    setActiveDossier(item);
    setSearchQuery(item.query);
    setSelectedFormat(item.format as any);
    setSelectedDbSources(item.dbSources);
    setSelectedFolderIds(item.foldersSelected);
    setDetailedAnswerText(item.outputContent);
    setActiveMatchedSources(item.sources);
    setViewState("display_answer");
    setHistoryOpen(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(detailedAnswerText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = (format: "Word" | "PDF") => {
    setExportMessage(`Exporting as ${format}...`);
    setTimeout(() => {
      setExportMessage("");
      const blob = new Blob([detailedAnswerText], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Legal_Research_${Date.now()}.${format === "Word" ? "doc" : "pdf"}`;
      link.click();
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden font-sans">
      <div className="absolute inset-0 pointer-events-none opacity-[0.35]" style={{ backgroundSize: "20px 20px", backgroundImage: "linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)" }} />

      <header className="px-8 py-4 border-b border-gray-200 bg-white/90 backdrop-blur-sm flex justify-between items-center z-10 shrink-0">
        <div>
          {viewState === "display_answer" ? (
            <button onClick={() => setViewState("hub")} className="flex items-center text-xs font-mono uppercase font-bold tracking-wider text-gray-500 hover:text-black transition gap-1.5 cursor-pointer">
              &larr; Back to Ask
            </button>
          ) : (
            <div>
              <h2 className="text-xl font-display font-extrabold text-gray-900 tracking-tight">Ask AI Lawyer</h2>
              <p className="text-xs text-gray-500 font-mono">Precision legal research and advisory</p>
            </div>
          )}
        </div>
        <button onClick={() => setHistoryOpen(!historyOpen)} className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 hover:border-black bg-white text-xs font-mono font-bold transition shadow-sm rounded-md cursor-pointer">
          <History className="w-3.5 h-3.5" />
          <span>History</span>
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden relative z-10">
        {viewState === "hub" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 overflow-y-auto">
            <div className="text-center max-w-2xl mb-12">
              <h1 className="text-3xl md:text-4xl font-display font-black text-gray-900 leading-tight tracking-tight">Real-time Legal Intelligence.</h1>
              <h3 className="text-2xl font-display font-bold text-gray-900 mt-1">Sourced from actual statutes and your documents.</h3>
            </div>
            <div className="w-full max-w-3xl bg-white border border-gray-200 shadow-xl rounded-xl p-5 border-t-4 border-t-black">
              <form onSubmit={handleAskDispatch} className="flex flex-col gap-4">
                <div className="relative">
                  <textarea value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Enter your legal query..." className="w-full h-32 pr-24 text-sm resize-none focus:outline-none font-sans leading-relaxed text-gray-800" />
                  <div className="absolute right-0 bottom-1.5 flex items-center gap-2 p-1.5">
                    <button type="button" onClick={handleOpenSourceModal} className="px-3 py-1.5 text-xs font-mono font-bold bg-white border border-gray-200 rounded hover:border-black flex items-center gap-1 cursor-pointer transition">
                      <Plus className="w-3 h-3" />
                      <span>Source</span>
                      {(selectedDbSources.length + selectedFolderIds.length) > 0 && <span className="bg-black text-white px-1.5 py-0.2 rounded-full text-[9px] font-bold">{selectedDbSources.length + selectedFolderIds.length}</span>}
                    </button>
                    <select value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value as any)} className="px-3 py-1.5 text-xs font-mono font-bold bg-white border border-gray-200 rounded hover:border-black cursor-pointer shadow-sm">
                      <option value="Brief Summary">Brief Summary</option>
                      <option value="Full IRAC">IRAC</option>
                      <option value="CREAC">CREAC</option>
                    </select>
                    <button type="submit" disabled={!searchQuery.trim()} className="px-4.5 py-1.5 text-xs font-mono font-bold bg-black text-white hover:bg-gray-800 rounded transition flex items-center gap-1.5 disabled:opacity-30 cursor-pointer shadow-md">
                      <span>Ask</span>
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <button onClick={handleSeeExamples} className="mt-4 text-xs font-mono text-gray-500 hover:text-black transition underline cursor-pointer">See examples</button>
          </div>
        )}

        {viewState === "rephrase_modal" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
            <div className="w-full max-w-2xl bg-white border-2 border-black shadow-2xl p-6 relative">
              <div className="flex items-start gap-4 mb-5 border-b border-gray-100 pb-4">
                <Search className="w-6 h-6 text-black" />
                <h3 className="text-base font-bold text-gray-900">Choose the most relevant question to ask</h3>
              </div>
              <div className="space-y-3 mb-6">
                {rephraseOptions.map((opt, i) => (
                  <label key={i} className={`flex items-start gap-3.5 p-3.5 border text-xs cursor-pointer transition ${selectedRephraseOption === opt ? "border-black bg-gray-50 font-semibold" : "border-gray-200 hover:border-gray-400 bg-white"}`}>
                    <input type="radio" name="rephrase_opt" value={opt} checked={selectedRephraseOption === opt} onChange={() => setSelectedRephraseOption(opt)} className="mt-0.5 accent-black" />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button onClick={() => setViewState("hub")} className="px-4 py-2 border border-gray-200 text-xs font-mono font-bold uppercase cursor-pointer">Cancel</button>
                <button onClick={() => triggerAdvisoryComputation(selectedRephraseOption)} className="px-5 py-2 bg-black text-white text-xs font-mono font-bold uppercase cursor-pointer transition">Select & Ask</button>
              </div>
            </div>
          </div>
        )}

        {viewState === "understanding_phase" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
            <div className="w-full max-w-lg bg-white border-2 border-black p-6 shadow-2xl text-center">
              <Loader2 className="w-10 h-10 text-black animate-spin mx-auto mb-4" />
              <h3 className="text-sm font-bold font-mono uppercase text-gray-900">{stepperMessage}</h3>
              <p className="text-xs text-gray-500 mt-2">Connecting to secure RAG infrastructure...</p>
              <button onClick={() => { if (abortControllerRef.current) abortControllerRef.current.abort(); setViewState("hub"); }} className="mt-6 px-4 py-2 border border-red-200 text-red-600 text-xs font-mono font-bold uppercase cursor-pointer">Cancel</button>
            </div>
          </div>
        )}

        {viewState === "display_answer" && (
          <div className="flex-1 flex overflow-hidden h-full">
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
              <div className="px-6 py-2 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-gray-400 uppercase">
                  <FileCode className="w-4 h-4" />
                  <span>Research Dossier</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleCopy} className="px-2.5 py-1.5 border border-gray-200 bg-white text-[11px] font-mono font-bold text-gray-700 cursor-pointer transition flex items-center gap-1">
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                    <span>{isCopied ? "Copied!" : "Copy"}</span>
                  </button>
                  <button onClick={() => handleDownload("PDF")} className="px-2.5 py-1.5 border border-gray-200 bg-white text-[11px] font-mono font-bold text-gray-700 cursor-pointer transition flex items-center gap-1">
                    <Download className="w-3.5 h-3.5 text-gray-400" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 selection:bg-slate-200">
                <div className="max-w-2xl mx-auto prose prose-sm">
                  {detailedAnswerText.split("\n\n").map((para, i) => (
                    para.startsWith("### ")
                      ? <h3 key={i} className="text-sm font-bold font-mono text-black uppercase tracking-wider bg-gray-100 border-l-4 border-l-black px-3.5 py-1.5 mt-6 first:mt-0">{para.replace("### ", "")}</h3>
                      : <p key={i} className="text-sm leading-relaxed text-gray-800 my-4 whitespace-pre-wrap">{para}</p>
                  ))}
                  {isSynthesizingAnswer && <div className="flex items-center gap-2 font-mono text-xs text-gray-500 animate-pulse"><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Streaming analysis...</span></div>}
                </div>
              </div>
            </div>
            <aside className="w-80 border-l border-gray-200 bg-gray-50/50 flex flex-col h-full overflow-hidden shrink-0">
              <div className="px-5 py-4 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
                <h4 className="text-xs font-bold font-mono uppercase text-black">Sources</h4>
                <span className="bg-black text-white px-2 py-0.5 text-[9px] font-mono font-extrabold uppercase">{activeMatchedSources.length} Hit</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeMatchedSources.map((src) => (
                  <div key={src.id} className="bg-white border border-gray-200 hover:border-black p-4 rounded-lg shadow-sm transition">
                    <span className="bg-gray-100 text-gray-800 text-[8px] font-mono px-1.5 py-0.5 uppercase font-bold">{src.documentType}</span>
                    <h5 className="text-xs font-extrabold text-gray-900 mt-2 line-clamp-2">{src.title}</h5>
                    <div className="mt-3 flex justify-between items-center">
                      <button onClick={() => setActiveViewSource(src)} className="text-[10px] font-mono font-bold text-gray-500 hover:text-black cursor-pointer transition flex items-center gap-1"><ExternalLink className="w-3 h-3" /><span>View</span></button>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}
      </div>

      {sourceModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-black w-full max-w-3xl h-[480px] flex flex-col shadow-2xl">
            <div className="p-4 border-b-2 border-black flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono uppercase text-gray-500">Select sources</h3>
              <button onClick={() => setSourceModalOpen(false)} className="p-1 cursor-pointer hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex border-b border-gray-200 px-4 bg-gray-50">
              {["database", "folder", "web"].map(tab => (
                <button key={tab} onClick={() => setModalSubTab(tab as any)} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase cursor-pointer border-b-2 transition ${modalSubTab === tab ? "border-black text-black" : "border-transparent text-gray-500"}`}>{tab}</button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {modalSubTab === "database" && (
                <div className="space-y-4">
                  {dbCategories.map((cat, i) => (
                    <div key={i} className="p-3 bg-white border border-gray-100">
                      <div className="text-[10px] font-mono font-bold text-gray-400 uppercase mb-2">{cat.country}</div>
                      <div className="grid grid-cols-2 gap-2">
                        {cat.items.map(it => {
                          const combined = `${cat.country} › ${it}`;
                          const isSel = selectedDbSources.includes(combined);
                          return <button key={it} onClick={() => handleToggleDbSource(combined)} className={`p-2.5 text-xs border text-left flex justify-between items-center transition cursor-pointer ${isSel ? "bg-black text-white border-black" : "bg-gray-50 border-gray-200"}`}><span>{it}</span>{isSel && <Check className="w-3 h-3" />}</button>;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {modalSubTab === "folder" && (
                <div className="space-y-4 text-center py-10 text-gray-400 text-xs font-mono">
                  <Folder className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p>Folder context integration active in legal-review vault.</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t-2 border-black bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setSourceModalOpen(false)} className="px-5 py-2 bg-black text-white text-xs font-mono font-bold uppercase cursor-pointer">Done</button>
            </div>
          </div>
        </div>
      )}

      {activeViewSource && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-black w-full max-w-2xl h-[520px] flex flex-col shadow-2xl">
            <div className="p-4 border-b-2 border-black bg-black text-white flex justify-between items-center">
              <h3 className="text-xs font-bold font-mono uppercase">{activeViewSource.title}</h3>
              <button onClick={() => setActiveViewSource(null)} className="bg-white text-black p-1 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 font-mono text-xs text-gray-800 whitespace-pre-wrap">{activeViewSource.officialCopy}</div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end"><button onClick={() => setActiveViewSource(null)} className="px-4 py-2 bg-black text-white text-xs font-mono font-bold cursor-pointer">Close</button></div>
          </div>
        </div>
      )}

      {historyOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
          <div className="bg-white w-full max-w-sm h-full flex flex-col shadow-2xl border-l-2 border-black">
            <div className="p-4 border-b-2 border-black flex justify-between items-center bg-gray-50">
              <h3 className="text-xs font-bold font-mono uppercase">Research History</h3>
              <button onClick={() => setHistoryOpen(false)} className="cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {historyList.length === 0 ? <p className="text-gray-400 text-xs font-mono text-center mt-10">No recent queries.</p> : historyList.map(item => (
                <div key={item.id} onClick={() => handleOpenOldHistory(item)} className="p-3 border border-gray-200 hover:border-black cursor-pointer transition">
                  <span className="text-[9px] font-mono text-gray-400">{item.date}</span>
                  <p className="text-xs font-bold text-gray-900 line-clamp-2 mt-1">{item.query}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
