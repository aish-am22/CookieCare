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

interface HistoryItem {
  id: string;
  query: string;
  date: string;
  format: "Brief Summary" | "Full IRAC" | "CREAC";
  questionToAsk: string;
  dbSources: string[];
  urls: string[];
  foldersSelected: string[];
  understanding: {
    issue: string;
    sourcing: string;
    laws: string[];
    provisions: string[];
    precedents: string[];
  };
  outputContent: string;
  sources: Array<{
    id: string;
    title: string;
    citation: string;
    jurisdiction: string;
    documentType: string;
    officialCopy: string;
    facts: string;
    principles: string;
    arguments: string;
    decision: string;
  }>;
}

export default function AskAIModel({ documents, activeDocument, authToken }: AskAIModelProps) {
  // Primary Navigation/View States
  // "hub" | "select_sources_modal" | "rephrase_modal" | "understanding_phase" | "display_answer"
  const [viewState, setViewState] = useState<"hub" | "rephrase_modal" | "understanding_phase" | "display_answer">("hub");
  
  // Research Query Inputs
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<"Brief Summary" | "Full IRAC" | "CREAC">("Full IRAC");
  
  // History list of queries
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([
    {
      id: "hist_1",
      query: "Can a demand raised by the income tax officer be stayed even if the addition is not disputed by assessee?",
      date: "2026-05-29 • 10:15 AM",
      format: "Full IRAC",
      questionToAsk: "Can an Income Tax Officer's demand be stayed under Section 220(6) of the Income Tax Act, 1961, even when the assessee has not disputed the underlying addition or assessment? What are the legal grounds and judicial precedents governing the grant of stay of demand in cases where the addition itself is not challenged by the assessee?",
      dbSources: ["India › Direct Tax"],
      urls: [],
      foldersSelected: [],
      understanding: {
        issue: "Discretion of Assessing Officer under Section 220(6) to grant stay on undisputed tax demands in cases of severe financial stringency.",
        sourcing: "CookieCare central direct taxation archives, CIT guidelines, Indian High Court rosters, and ITAT revenue judgments.",
        laws: ["Section 220(6) of the Income Tax Act, 1961", "Article 226 of the Constitution of India"],
        provisions: ["OM F.No. 404/72/93-ITCC relating to 20% deposit rules", "Inherent stay powers of High Court / ITAT Tribunal guidelines"],
        precedents: [
          "Sushen Mohan Gupta v. PCIT (2024 Delhi HC)",
          "M/s. V.V. Titanium Pigments v. Deputy CIT (2022)",
          "Harsh Dipak Shah v. Union of India (2022 SC)",
          "GBT India Private Limited v. ACIT (2022)"
        ]
      },
      outputContent: `### ISSUE
The core question pertains to whether an Assessing Officer (AO) can exercise discretionary power under Section 220(6) of the Income Tax Act, 1961, to grant a stay on recovery of tax demand, even in scenarios where the tax addition raised by the revenue authority has not been directly disputed or appealed by the assessee. Specifically, whether irreparable financial injury, procedural irregularities in raised assessments, or grave hardships present actionable grounds to trigger equitable stay reliefs.

### RULE
1. **Section 220(6) of the Income Tax Act, 1961** stipulates that where an assessee has presented an appeal under section 246 or section 246A, the Assessing Officer may, in their discretion and subject to such conditions as they may think fit, treat the assessee as not being in default in respect of the amount in dispute, so long as such appeal remains pending.
2. **Office Memorandum F.No. 404/72/93-ITCC** (as updated) provides administrative guidelines instructing AOs to standardly request 20% of the disputed demand as a pre-deposit pending disposal of first appeal. However, this OM does not dilute the judicial duty to evaluate individual hardships.
3. In **Sushen Mohan Gupta v. PCIT (2024 Delhi High Court)**, the court established that: "The AO cannot mechanically reject a stay application by citing the restrictive 20% deposit guideline. Discretion must be exercised with judicial temperance, carefully evaluating the three-parameter test: prima facie case, balance of convenience, and financial stringency."
4. In **M/s. V.V. Titanium Pigments v. Deputy CIT (2022)**, the court ruled that: "Financial stringency would include situations where discharging the arbitrary demand would physically compromise business viability, creating irreparable injury."
5. Under **Article 226 of the Constitution of India**, High Courts possess plenary constitutional powers to stay punitive demands where tax additions are procedurally suspect, regardless of strict statutory pre-conditions.

### APPLICATION
Applying these judicial principles to undisputed assessments:
- **Application to Disputed vs. Undisputed Demands**: Under a strict reading of Section 220(6), a presented appeal is a statutory precondition. However, when an assessee files a rectification application under Section 154, or where an appeal has been preferred against a parallel penalty but not the core addition itself, the demand is legally "undisputed" in part but remains highly contested in practice.
- **The Financial Stringency Standard**: Where the assessee exhibits absolute financial depletion (certified cash flow shortfalls, asset seizures, or bankruptcies), forcing a mechanical recovery acts as an abuse of administrative process. The High Court in *M/s. V.V. Titanium Pigments* confirmed that a stay is justified when the assessee illustrates severe financial hardship.
- **Assessing Officer Deficiencies**: If the physical officer raised assessments with absolute mathematical errors or hurried additions without offering reasonable hearings, the demand itself is procedurally invalid. Under *GBT India*, procedural irregularities by the Assessing Officer serve as a key buffer permitting a complete stay.

### CONCLUSION
While a strict appeal filing is normally a prerequisite under Section 220(6), Assessing Officers are legally empowered—and courts bound by natural justice will enforce—absolute stay of undisputed demands under equitable guidelines if the recovery threatens ruinous business collapse or is procedurally illegal. 

#### ACTIONABLE RECOMMENDATIONS
1. **Draft Formal Representations**: Submit an immediate detailed stay petition under Section 220(6) directly to the PCIT level, accompanied by a CA-certified Liquidity/Cash flow forensic audit to prove critical financial hardship.
2. **File Section 154 Rectification**: If the undisputed additions stem from mathematical or typographical mistakes, the file must be immediately corrected via Section 154, suspending subsequent demands automatically.
3. **Writ Petition Contingency**: If the Assessing Officer rejects stay relief and insists on a mechanical 20% deposit without looking at hardships, file a Writ of Certiorari under Article 226.

#### REGULATORY REFERENCES
- Section 220(6), Income Tax Act, 1961
- CBDT Instruction No. 1914 & OM Circulars 2016
- Article 226 High Court writ catalogs`,
      sources: [
        {
          id: "s1",
          title: "Sushen Mohan Gupta v. PCIT",
          citation: "2024 DHC 1420",
          jurisdiction: "Delhi High Court",
          documentType: "Court Copy",
          facts: "The assessee challenged a mechanical recovery order issued by the PCIT demanding a mandatory 20% pre-deposit under Circulars. The assessee showed that they were undergoing active liquidation procedures, and a 20% sweep would immediately shut down salaries.",
          principles: "Administrative guidelines are auxiliary and cannot override judicial evaluation of hardship. Assessing officers must evaluate balance of convenience, financial hardship, and prima facie merit.",
          arguments: "Revenue argued that CBDT OM Circulars bind the department to demand 20% minimum. Assessee counsel argued that statutory discretion under Section 220(6) cannot be bartered to a circular.",
          decision: "Set aside PCIT demand order. Instructed fresh, personalized hearing under Section 220(6).",
          officialCopy: `IN THE HIGH COURT OF DELHI AT NEW DELHI\nW.P. (C) No. 4930 of 2024\n\nSushen Mohan Gupta (Petitioner) v. Principal Commissioner of Income Tax (Respondent)\n\nBefore: Hon'ble Justice Dr. S. Muralidhar\n\nJUDGMENT:\n1. The petitioner seeks a writ in the nature of Mandamus to direct the respondent to stay recovery proceedings pending appeal, without insisting on the rigid 20% pre-deposit prescribed by CBDT memorandums.\n\n2. This court is of the firm view that the CBDT guidelines relating to the payment of 20% of the disputed demand are purely administrative. They do not—and legally cannot—extinguish the statutory discretion granted to the Assessing Officer under Section 220(6) of the Act. Rejections based purely on the failure to pay 20% without considering the petitioner's severe financial stringency is a failure of statutory duty.\n\n3. Ordered accordingly. The impugned recovery notice is stayed.`
        },
        {
          id: "s2",
          title: "M/s. V.V. Titanium Pigments v. Deputy CIT",
          citation: "2022 TAX LR 382",
          jurisdiction: "Madras High Court",
          documentType: "Supreme Precedent",
          facts: "A severe demand was raised over an undisputed arithmetic addition. The local deputy CIT rejected the stay on the grounds that the addition was undisputed and thus stayed proceedings could not apply.",
          principles: "Stay of recovery is an equitable buffer. Undisputed additions are subject to stay if they are shown to be raised under procedural oversight or when acute business insolvency is present.",
          arguments: "Petitioner demonstrated severe cash deficit. Revenue cited lack of formal appeal as a barrier.",
          decision: "Writ allowed. Full stay granted contingent on resolving numerical errors within 30 days.",
          officialCopy: `IN THE HIGH COURT OF JUDICATURE AT MADRAS\nCivil Writ Jurisdiction\n\nM/s. V.V. Titanium Pigments Ltd v. Deputy Commissioner of Income Tax\n\nHELD:\n\"We cannot subscribe to the view of the revenue that an undisputed demand is immune to stay. In rare and exceptional cases of catastrophic financial failure, forced recovery would stifle of the company's existence. The equity power of high courts encompasses and guarantees protection from unfair ruinous demands.\"\n\nPetition allowed.`
        },
        {
          id: "s3",
          title: "Harsh Dipak Shah v. Union of India",
          citation: "2022 SC 902",
          jurisdiction: "Supreme Court of India",
          documentType: "Official Copy",
          facts: "Severe assessment additions raised without matching double taxation treaty benefits. The assessee's bank accounts were frozen prior to appeal hearings.",
          principles: "Freezing of bank accounts prior to appeal resolution are coercive steps that violate Article 19(1)(g) if done without proving high risk of tax evasion.",
          arguments: "Revenue asserted the need to protect government revenue. Petitioner proven zero flight risk.",
          decision: "Directed unfreezing of accounts on nominal security deposit. Absolute stay on further recovery.",
          officialCopy: `SUPREME COURT OF INDIA\nCivil Appeal No. 902 of 2022\n\nHarsh Dipak Shah v. Union of India & Others\n\nDELIVERED BY:\nHon'ble Chief Justice of India\n\n\"The administrative overzealousness in freezing transactional bank accounts of running industries without demonstrating tax evasion intent is highly deprecated. Coercive recoveries prior to standard appellate reviews violate fair play.\"\n\nAppeal Allowed with costs.`
        },
        {
          id: "s4",
          title: "Section 220(6) statutory transcript",
          citation: "INC. TAX ACT 1961",
          jurisdiction: "Legislative Gazette",
          documentType: "Statute Copy",
          facts: "Legislative section text outlining the treatment of assessees in default when appeals are pending.",
          principles: "Gives statutory status to discretionary powers of Assessing Officers.",
          arguments: "N/A",
          decision: "N/A",
          officialCopy: `THE INCOME TAX ACT, 1961\nCHAPTER XVII - COLLECTION AND RECOVERY OF TAX\n\nSection 220 - When tax payable and when assessee deemed in default.\n\n(6) Where an assessee has presented an appeal under section 246 or section 246A, the Assessing Officer may, in his discretion and subject to such conditions as he may think fit, treat the assessee as not being in default in respect of the amount in dispute, so long as such appeal remains pending.\n\n[As amended by Finance Act, 2025]`
        }
      ]
    },
    {
      id: "hist_2",
      query: "GDPR breach liability limits for subprocessor contracts",
      date: "2026-05-28 • 4:30 PM",
      format: "CREAC",
      questionToAsk: "Under GDPR Article 28, how should subprocessor contractual breaches be structured regarding liability caps, indemnification exceptions, and standard GDPR Article 82 compliance checklists?",
      dbSources: ["United States › State Legal Research"],
      urls: [],
      foldersSelected: ["Privacy Policies & DPA"],
      understanding: {
        issue: "Limitations of liability in Article 28 subprocessor agreements versus administrative fines under GDPR.",
        sourcing: "European Data Protection Board guidelines, GDPR Article 82 dockets, list of standard corporate DPAs.",
        laws: ["GDPR Article 28", "GDPR Article 82"],
        provisions: ["Controller-Processor joint and several liability parameters", "Data Transfer standard contractual clauses"],
        precedents: ["CJEU CJ-311/18 (Schrems II)", "Standard DPA Liability precedents"]
      },
      outputContent: `### CONCLUSION
To maintain robust compliance and balanced corporate exposure, a subprocessor agreement must contain clear liability caps on general data breaches (standardly 2x annual contract fees). However, exceptions to this cap must be explicitly carved out for gross negligence, willful misconduct, and direct administrative fines levied under GDPR Article 82 to prevent catastrophic financial liabilities.

### RULE
1. **GDPR Article 28(4)** mandates that where a processor engages another processor, the same data protection obligations as set out in the contract between the controller and the processor shall be imposed on the subprocessor, and the processor remains fully liable to the controller for the performance of that subprocessor's obligations.
2. **GDPR Article 82 (Liability and compensation)** outlines joint and several liability, meaning controllers/processors may be held fully accountable for the entirety of damages to ensure effective compensation for the data subjects.

### EXPLANATION OF RULE
Under GDPR's joint and several liability framework, data subjects can sue any party in the chain (controller, processor, or subprocessor) for the full compensation of a breach. Consequently, even if a subprocessor caused the breach, the primary processor might pay 100% of the damages to the controller. An unlimited liability cap, or a cap that is too small, would create severe cashflow hazards.

### APPLICATION
- **General Indemnity Cap**: Limit the subprocessor's breach liability to a multiplier of annual spend (e.g. 2x contract value). This protects the supplier from business insolvency.
- **Carve-out exceptions**: Set unlimited caps or elevated "super-caps" (e.g., $5M or 5x annual spend) for specific direct damages including:
  - Third-party data subject claims under Article 82.
  - Breach of fundamental confidentiality covenants.
  - Direct administrative fines incurred by the controller directly due to the subprocessor's gross negligence.

### CONCLUSION
We conclude that establishing a dual-tier liability structure (a general cap paired with targeted super-caps for core GDPR breaches) provides a balanced safeguard. Utilize the GDPR Articles 28 compliance checklist for all future negotiations.`,
      sources: [
        {
          id: "s_gd01",
          title: "GDPR Article 28 Statutory Text",
          citation: "REGULATION (EU) 2016/679",
          jurisdiction: "European Union Council",
          documentType: "Statute Copy",
          facts: "General Data Protection Regulation Article 28 details specifying processor duties and subprocessor liability chains.",
          principles: "Processor is liable to controller for subprocessor failures.",
          arguments: "N/A",
          decision: "N/A",
          officialCopy: `REGULATION (EU) 2016/679 OF THE EUROPEAN PARLIAMENT AND OF THE COUNCIL\nArticle 28 - Processor\n\n4. Where a processor engages another processor for carrying out specific processing activities on behalf of the controller, the same data protection obligations as set out in the contract between the controller and the processor shall be imposed on that other processor...\n\nWhere that other processor fails to fulfil its data protection obligations, the initial processor shall remain fully liable to the controller for the performance of that other processor's obligations.`
        }
      ]
    }
  ]);

  // Current Active Query State (cloned from history or compiled on-the-fly)
  const [activeDossier, setActiveDossier] = useState<HistoryItem | null>(null);

  // Source selection states
  const [selectedDbSources, setSelectedDbSources] = useState<string[]>(["India › Direct Tax"]);
  const [folders, setFolders] = useState<KBFolder[]>([
    {
      id: "folder_1",
      name: "Privacy Policies & DPA",
      files: [
        { name: "gdpr_data_privacy_addendum.pdf", type: "PDF", size: "12.4 MB" },
        { name: "cookie_consent_tracker_policy.docx", type: "DOCX", size: "4.2 MB" }
      ]
    },
    {
      id: "folder_2",
      name: "Direct Taxes & Audits",
      files: [
        { name: "form_16_scrutiny_audit_2025.pdf", type: "PDF", size: "28.1 MB" }
      ]
    }
  ]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [webUrls, setWebUrls] = useState<string[]>([
    "https://mca.gov.in",
    "https://incometaxindia.gov.in"
  ]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>(["https://incometaxindia.gov.in"]);

  // Temporary source modal states
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [modalSubTab, setModalSubTab] = useState<"database" | "folder" | "web">("database");
  
  // Custom folder creation inside modal
  const [newFolderName, setNewFolderName] = useState("");
  const [newUrlInput, setNewUrlInput] = useState("");

  // Rephrasing view states
  const [rephrasePromptOriginal, setRephrasePromptOriginal] = useState("");
  const [rephraseOptions, setRephraseOptions] = useState<string[]>([]);
  const [selectedRephraseOption, setSelectedRephraseOption] = useState("");

  // Stepper Stage states
  const [stepperStage, setStepperStage] = useState<"division" | "sourcing" | "laws" | "precedents" | "done">("division");
  const [stopGenerationSignal, setStopGenerationSignal] = useState(false);

  // Output Detail states
  const [detailedAnswerText, setDetailedAnswerText] = useState("");
  const [activeMatchedSources, setActiveMatchedSources] = useState<HistoryItem["sources"]>([]);
  const [isSynthesizingAnswer, setIsSynthesizingAnswer] = useState(false);

  // Right Side Interactions State
  const [activeViewSource, setActiveViewSource] = useState<HistoryItem["sources"][0] | null>(null);
  const [activeDeepDiveSource, setActiveDeepDiveSource] = useState<HistoryItem["sources"][0] | null>(null);

  // General helpers
  const [isCopied, setIsCopied] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  // Select source modal tab lists
  const dbCategories = [
    { country: "India", items: ["Direct Taxes", "Indirect Taxes", "Corporate Laws", "General Laws", "General Chat"] },
    { country: "United States", items: ["US Federal and state legal research", "General Legal Chat"] },
    { country: "General Legal Chat (English-speaking)", items: ["General legal chat spanning over 20 English-speaking jurisdictions"] }
  ];

  // See examples helper
  const handleSeeExamples = () => {
    setSearchQuery("Can a demand raised by the income tax officer be stayed even if the addition is not disputed by assessee?");
  };

  // Launch modal
  const handleOpenSourceModal = () => {
    setSourceModalOpen(true);
  };

  // Toggle Database source selection
  const handleToggleDbSource = (sourceName: string) => {
    setSelectedDbSources(prev => 
      prev.includes(sourceName) 
        ? prev.filter(s => s !== sourceName) 
        : [...prev, sourceName]
    );
  };

  // Add custom folder
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newF: KBFolder = {
      id: "folder_" + Date.now(),
      name: newFolderName.trim(),
      files: []
    };
    setFolders([...folders, newF]);
    setSelectedFolderIds(prev => [...prev, newF.id]);
    setNewFolderName("");
  };

  // Add custom Web URL
  const handleAddNewUrl = () => {
    if (!newUrlInput.trim()) return;
    let url = newUrlInput.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }
    if (!webUrls.includes(url)) {
      setWebUrls([...webUrls, url]);
      setSelectedUrls([...selectedUrls, url]);
    }
    setNewUrlInput("");
  };

  // Remove registered URL
  const handleRemoveUrl = (url: string) => {
    setWebUrls(webUrls.filter(u => u !== url));
    setSelectedUrls(selectedUrls.filter(u => u !== url));
  };

  // Handle manual simulated file uploading
  const handleFileUpload = (folderId: string, fileName: string, fileType: "PDF" | "DOCX" | "XLSX" | "PPTX" | "Image" | "TXT", size: string) => {
    setFolders(prev => prev.map(f => {
      if (f.id === folderId) {
        return {
          ...f,
          files: [...f.files, { name: fileName, type: fileType, size }]
        };
      }
      return f;
    }));
    if (!selectedFolderIds.includes(folderId)) {
      setSelectedFolderIds(prev => [...prev, folderId]);
    }
  };

  // Initiate Query Dispatch (Checks summary route -> triggers rephrase layout if and when selected)
  const handleAskDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (selectedFormat === "Brief Summary") {
      // Show rephrase layout as specified in Image 5
      setRephrasePromptOriginal(searchQuery);
      setRephraseOptions([
        searchQuery,
        `Can an Income Tax Officer's demand be stayed under Section 220(6) of the Income Tax Act, 1961, even when the assessee has not disputed the underlying addition or assessment? What are the grounds regarding Article 226 stays?`,
        `What are the judicial precedents where high courts have granted stay of tax demand despite the assessee not disputing the addition, and what exceptional circumstances represent valid grounds?`,
        `Can severe financial/physical hardship alone serve as a legitimate ground for staying an income tax demand under Section 220(6), even in the absence of any appeal challenge on tax additions?`,
        `What is the scope of powers of the Income Tax Appellate Tribunal (ITAT) or High Courts under Article 226 to grant stay of demand when the assessee accepts the addition but suffers severe liquidity deprivation?`
      ]);
      setSelectedRephraseOption(searchQuery);
      setViewState("rephrase_modal");
    } else {
      // Direct streaming flow using selected query
      triggerAdvisoryComputation(searchQuery);
    }
  };

  // Run the full AI generation pipeline + Stepper Understanding stage
  const triggerAdvisoryComputation = (queryToExecute: string) => {
    setViewState("understanding_phase");
    setStepperStage("division");
    setStopGenerationSignal(false);
    setIsSynthesizingAnswer(true);

    // Dynamic understanding breakdown based on query key terms
    const isUndisputedTaxQuery = queryToExecute.toLowerCase().includes("stay") || queryToExecute.toLowerCase().includes("tax") || queryToExecute.toLowerCase().includes("officer");

    // Stepper animators representation
    setTimeout(() => {
      setStepperStage("sourcing");
      setTimeout(() => {
        setStepperStage("laws");
        setTimeout(() => {
          setStepperStage("precedents");
          setTimeout(() => {
            setStepperStage("done");
            
            // Once understanding is done, load and stream answer
            setViewState("display_answer");
            setIsSynthesizingAnswer(true);

            if (isUndisputedTaxQuery) {
              const baseDossier = historyList[0];
              setActiveDossier(baseDossier);
              streamCompletedText(baseDossier.outputContent, baseDossier.sources);
            } else {
              // Custom constructed response
              const customSources = [
                {
                  id: "cs1",
                  title: "Legislative Regulatory Gazette",
                  citation: "REV 2026/GZ.02",
                  jurisdiction: "General Jurisdiction",
                  documentType: "Statute Code",
                  facts: "Standard regulatory compliance frameworks establishing procedural safeguards and dispute rules.",
                  principles: "Procedural acts require transparent, prompt hearings.",
                  arguments: "N/A",
                  decision: "N/A",
                  officialCopy: `OFFICIAL REGULATORY TRANSCRIPT\n\nThis gazette governs the execution of compliance directives and audit stays. All officers are instructed to grant automatic buffers to client companies demonstrating operational and regional hardships.`
                }
              ];
              const customDossier: HistoryItem = {
                id: "cst_" + Date.now(),
                query: searchQuery,
                date: "Just Now",
                format: selectedFormat,
                questionToAsk: queryToExecute,
                dbSources: selectedDbSources,
                urls: selectedUrls,
                foldersSelected: selectedFolderIds,
                understanding: {
                  issue: `Evaluating compliance mandates relating to: ${queryToExecute}`,
                  sourcing: "Multi-jurisdiction corporate libraries and federal statutory gazettes.",
                  laws: ["Section 203 of Companies Act", "Standard corporate bylaws"],
                  provisions: ["Fiduciary duties parameters", "Audit limitations"],
                  precedents: ["Chevron U.S.A. v. NRDC", "Standard client protection frameworks"]
                },
                outputContent: `### ISSUE\nEvaluation of custom advisory inputs with respect to: "${queryToExecute}".\n\n### RULE\n1. Standard legal doctrines mandate that all administrative processes operate with explicit transparent hearings.\n2. Discretionary stay parameters apply globally when compliance sweeps present undue liabilities.\n\n### APPLICATION\n- Based on your selected database sources and knowledge folders, all documents must first be evaluated for standard indemnity thresholds.\n- If severe hard elements exist, immediate stays are warranted under general legal chat guidelines.\n\n### CONCLUSION\nWe recommend immediate filing of clarification briefs, setting up liability buffers, and referencing target statutory exemptions.`,
                sources: customSources
              };
              setActiveDossier(customDossier);
              streamCompletedText(customDossier.outputContent, customDossier.sources);
            }

          }, 1200);
        }, 1200);
      }, 1200);
    }, 1000);
  };

  // Stream text simulator
  const streamCompletedText = (fullText: string, sourcesToSync: HistoryItem["sources"]) => {
    setDetailedAnswerText("");
    setActiveMatchedSources(sourcesToSync);
    
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (stopGenerationSignal) {
        clearInterval(interval);
        setIsSynthesizingAnswer(false);
        return;
      }
      
      const chunkLength = Math.ceil(fullText.length / 40);
      const nextChunk = fullText.substring(currentIdx, currentIdx + chunkLength);
      setDetailedAnswerText(prev => prev + nextChunk);
      currentIdx += chunkLength;

      if (currentIdx >= fullText.length) {
        clearInterval(interval);
        setIsSynthesizingAnswer(false);
      }
    }, 45);
  };

  // Open old queries from history
  const handleOpenOldHistory = (item: HistoryItem) => {
    setActiveDossier(item);
    setSearchQuery(item.query);
    setSelectedFormat(item.format);
    setSelectedDbSources(item.dbSources);
    setSelectedFolderIds(item.foldersSelected);
    setDetailedAnswerText(item.outputContent);
    setActiveMatchedSources(item.sources);
    setViewState("display_answer");
    setHistoryOpen(false);
  };

  // Copy Markdown
  const handleCopy = () => {
    if (!detailedAnswerText) return;
    navigator.clipboard.writeText(detailedAnswerText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Print utility
  const handlePrint = () => {
    window.print();
  };

  // Simulated Document downloads
  const handleDownload = async (format: "Word" | "PDF") => {
    if (!detailedAnswerText) return;
    setExportMessage(`Packaging research dossier and downloading as ${format}...`);
    try {
      const exportFormat = format === "Word" ? "docx" : "pdf";
      const res = await fetch("/api/documents/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + authToken,
        },
        body: JSON.stringify({
          title: "CookieCare AI Research Dossier",
          contentType: "risk_report",
          content: detailedAnswerText,
          format: exportFormat,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Export failed");
      }
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `cookiecare_ai_dossier_${Date.now()}.${format === "Word" ? "doc" : "pdf"}`;
      link.click();
    } catch {
      const blob = new Blob([detailedAnswerText], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `cookiecare_ai_dossier_${Date.now()}.${format === "Word" ? "doc" : "txt"}`;
      link.click();
    } finally {
      setExportMessage("");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden font-sans">
      
      {/* 20px Drafting-style Coordinate Grid background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.35]"
        style={{
          backgroundSize: "20px 20px",
          backgroundImage: "linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)"
        }}
      />

      {/* HEADER BAR */}
      <header className="px-8 py-4 border-b border-gray-200 bg-white/90 backdrop-blur-sm flex justify-between items-center z-10 shrink-0">
        <div>
          {viewState === "display_answer" ? (
            <button 
              id="back-to-hub-btn"
              onClick={() => {
                setViewState("hub");
                setDetailedAnswerText("");
              }}
              className="flex items-center text-xs font-mono uppercase font-bold tracking-wider text-gray-500 hover:text-black transition gap-1.5"
            >
              &larr; Back to Ask
            </button>
          ) : (
            <div>
              <h2 className="text-xl font-display font-extrabold text-gray-900 tracking-tight">Ask</h2>
              <p className="text-xs text-gray-500 font-mono">Answers legal queries, questions of law, or questions of fact</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* History drawer trigger button */}
          <button 
            id="history-drawer-toggle"
            onClick={() => setHistoryOpen(!historyOpen)}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 hover:border-black bg-white text-xs font-mono font-bold transition shadow-sm rounded-md"
            title="Open Historical research queries docket"
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </div>
      </header>

      {/* COMPONENT CANVASES BODY */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        
        {/* VIEW 1: UNIFIED HUB STYLING (Image 1) */}
        {viewState === "hub" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 overflow-y-auto">
            
            {/* Display Hero Text */}
            <div className="text-center max-w-2xl mb-12 select-none">
              <h1 className="text-3xl md:text-4xl font-display font-black text-gray-900 leading-tight tracking-tight">
                Legal research that used to take hours.
              </h1>
              <h3 className="text-2xl font-display font-bold text-gray-900 mt-1">
                Now takes seconds. <span className="italic font-normal text-gray-600 block sm:inline">Ask anything.</span>
              </h3>
            </div>

            {/* Float Input query envelope */}
            <div className="w-full max-w-3xl bg-white border border-gray-200 shadow-xl rounded-xl p-5 border-t-4 border-t-black transition-all hover:shadow-2xl">
              <form onSubmit={handleAskDispatch} className="flex flex-col gap-4">
                
                <div className="relative">
                  <textarea
                    id="legal-primary-textarea"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search across the CookieCare database, your own files or URLs with explainable, source-backed responses."
                    className="w-full h-32 pr-24 text-sm resize-none focus:outline-none placeholder:text-gray-400 font-sans leading-relaxed text-gray-800"
                  />
                  
                  {/* Floating Action Badge tray bottom right */}
                  <div className="absolute right-0 bottom-1.5 flex items-center gap-2 p-1.5">
                    {/* Database active indicator icons */}
                    <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] font-mono text-gray-400 mr-2">
                      <BookmarkCheck className="w-3 h-3 text-emerald-500" />
                      <span>RAG V2 Active</span>
                    </div>

                    {/* Choose +Source Modal Button */}
                    <button
                      id="source-modal-trigger-btn"
                      type="button"
                      onClick={handleOpenSourceModal}
                      className="px-3 py-1.5 text-xs font-mono font-bold bg-white border border-gray-200 rounded hover:border-black hover:bg-gray-50 flex items-center gap-1 transition shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Source</span>
                      {(selectedDbSources.length + selectedFolderIds.length + selectedUrls.length) > 0 && (
                        <span className="bg-black text-white px-1.5 py-0.2 rounded-full text-[9px] font-bold">
                          {selectedDbSources.length + selectedFolderIds.length + selectedUrls.length}
                        </span>
                      )}
                    </button>

                    {/* Format selector */}
                    <div className="relative group">
                      <select
                        id="response-format-select"
                        value={selectedFormat}
                        onChange={(e) => setSelectedFormat(e.target.value as any)}
                        className="appearance-none px-3.5 pr-6 py-1.5 text-xs font-mono font-bold bg-white border border-gray-200 rounded hover:border-black focus:outline-none focus:ring-1 focus:ring-black cursor-pointer shadow-sm"
                      >
                        <option value="Brief Summary">Brief Summary</option>
                        <option value="Full IRAC">IRAC</option>
                        <option value="CREAC">CREAC</option>
                      </select>
                      <div className="pointer-events-none absolute right-2.5 top-2.5 w-1.5 h-1.5 border-r border-b border-gray-500 transform rotate-45" />
                    </div>

                    {/* Ask Button */}
                    <button
                      id="submit-advisory-ask-btn"
                      type="submit"
                      disabled={!searchQuery.trim()}
                      className="px-4.5 py-1.5 text-xs font-mono font-bold bg-black text-white hover:bg-gray-800 rounded transition flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none shadow-md cursor-pointer"
                    >
                      <span>Ask</span>
                      <Send className="w-3 h-3 text-white" />
                    </button>
                    
                  </div>
                </div>

                {/* Live Active Selected Sources Line */}
                {(selectedDbSources.length > 0 || selectedFolderIds.length > 0 || selectedUrls.length > 0) && (
                  <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mr-1">Consul Sources:</span>
                    
                    {selectedDbSources.map(s => (
                      <span key={s} className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10.5px] font-mono px-2 py-0.5 rounded flex items-center gap-1">
                        <BookmarkCheck className="w-3 h-3 text-emerald-600" />
                        <span>{s}</span>
                        <button type="button" onClick={() => handleToggleDbSource(s)} className="text-emerald-500 hover:text-emerald-800">&times;</button>
                      </span>
                    ))}

                    {selectedFolderIds.map(fid => {
                      const f = folders.find(fd => fd.id === fid);
                      if (!f) return null;
                      return (
                        <span key={fid} className="bg-amber-50 text-amber-800 border border-amber-100 text-[10.5px] font-mono px-2 py-0.5 rounded flex items-center gap-1">
                          <Folder className="w-3 h-3 text-amber-600" />
                          <span>Knowbase: {f.name} ({f.files.length} files)</span>
                          <button type="button" onClick={() => setSelectedFolderIds(selectedFolderIds.filter(id => id !== fid))} className="text-amber-500 hover:text-amber-800">&times;</button>
                        </span>
                      );
                    })}

                    {selectedUrls.map(url => (
                      <span key={url} className="bg-blue-50 text-blue-800 border border-blue-100 text-[10.5px] font-mono px-2 py-0.5 rounded flex items-center gap-1 max-w-[200px] truncate">
                        <Globe className="w-3 h-3 text-blue-500" />
                        <span className="truncate">{url}</span>
                        <button type="button" onClick={() => setSelectedUrls(selectedUrls.filter(u => u !== url))} className="text-blue-500 hover:text-blue-800">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </form>
            </div>

            {/* Small See Examples Action */}
            <button
              id="see-examples-btn"
              onClick={handleSeeExamples}
              className="mt-4 text-xs font-mono text-gray-500 hover:text-black transition underline select-none"
            >
              See examples
            </button>

          </div>
        )}

        {/* VIEW 2: BRIEF SUMMARY REPHRASING MODAL (Image 5) */}
        {viewState === "rephrase_modal" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
            <div className="w-full max-w-2xl bg-white border-2 border-black shadow-2xl p-6 rounded-none relative">
              
              <div className="flex items-start gap-4 mb-5 border-b border-gray-100 pb-4">
                <div className="bg-black text-white p-2 border border-black rounded-none">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-gray-900 leading-tight">Choose the most relevant question to ask</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    We have rephrased your original question and also provided you with some more options to help you phrase your question better. Choose the one most relevant to your query.
                  </p>
                </div>
              </div>

              {/* Radio stack option items */}
              <div className="space-y-3 mb-6">
                
                {/* 1. Original Option */}
                <label className={`flex items-start gap-3.5 p-3.5 border text-xs cursor-pointer transition ${
                  selectedRephraseOption === rephrasePromptOriginal 
                    ? "border-black bg-gray-50/50 fill-black font-semibold" 
                    : "border-gray-200 hover:border-gray-400 bg-white"
                }`}>
                  <input
                    type="radio"
                    name="rephrase_opt"
                    value={rephrasePromptOriginal}
                    checked={selectedRephraseOption === rephrasePromptOriginal}
                    onChange={() => setSelectedRephraseOption(rephrasePromptOriginal)}
                    className="mt-0.5 accent-black"
                  />
                  <div>
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wide block mb-0.5">Original Question</span>
                    <span className="text-gray-800 leading-relaxed">{rephrasePromptOriginal}</span>
                  </div>
                </label>

                {/* 2. Rephrased Option */}
                <label className={`flex items-start gap-3.5 p-3.5 border text-xs cursor-pointer transition ${
                  selectedRephraseOption === rephraseOptions[1] 
                    ? "border-black bg-gray-50/50 font-semibold" 
                    : "border-gray-200 hover:border-gray-400 bg-white"
                }`}>
                  <input
                    type="radio"
                    name="rephrase_opt"
                    value={rephraseOptions[1]}
                    checked={selectedRephraseOption === rephraseOptions[1]}
                    onChange={() => setSelectedRephraseOption(rephraseOptions[1] || "")}
                    className="mt-0.5 accent-black"
                  />
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-wide block mb-0.5">Rephrased Question (Added Context)</span>
                    <span className="text-gray-800 leading-relaxed">{rephraseOptions[1]}</span>
                  </div>
                </label>

                {/* Alternates */}
                {rephraseOptions.slice(2).map((opt, oIdx) => (
                  <label key={oIdx} className={`flex items-start gap-3.5 p-3.5 border text-xs cursor-pointer transition ${
                    selectedRephraseOption === opt 
                      ? "border-black bg-gray-50/50 font-semibold" 
                      : "border-gray-200 hover:border-gray-400 bg-white"
                  }`}>
                    <input
                      type="radio"
                      name="rephrase_opt"
                      value={opt}
                      checked={selectedRephraseOption === opt}
                      onChange={() => setSelectedRephraseOption(opt)}
                      className="mt-0.5 accent-black"
                    />
                    <div>
                      <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wide block mb-0.5">Option {oIdx + 1}</span>
                      <span className="text-gray-800 leading-relaxed">{opt}</span>
                    </div>
                  </label>
                ))}

              </div>

              {/* Confirm Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  id="cancel-rephrase-btn"
                  onClick={() => setViewState("hub")}
                  className="px-4 py-2 border border-gray-200 hover:border-black text-xs font-mono font-bold uppercase tracking-tight bg-white select-none transition"
                >
                  Cancel
                </button>

                <button
                  id="confirm-rephrase-ask-btn"
                  onClick={() => triggerAdvisoryComputation(selectedRephraseOption)}
                  className="px-5 py-2 bg-black text-white hover:bg-gray-800 border border-black text-xs font-mono font-bold uppercase tracking-tight select-none transition shadow-sm cursor-pointer"
                >
                  Select &amp; Ask
                </button>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 3: MULTI-STAGE UNDERSTANDING LOADING STEPPER BAR */}
        {viewState === "understanding_phase" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
            <div className="w-full max-w-lg bg-white border-2 border-black p-6 shadow-2xl relative select-none">
              
              <div className="flex items-center gap-3 mb-5">
                <Loader2 className="w-5 h-5 text-gray-900 animate-spin" />
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-gray-900">
                  Processing Research Pipeline...
                </h3>
              </div>

              <div className="space-y-4 mb-6">
                
                {/* Stage 1: Question Division */}
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold leading-none ${
                    stepperStage === "division" ? "bg-black text-white animate-pulse" : "bg-emerald-150 text-emerald-600 border border-emerald-300"
                  }`}>
                    {stepperStage === "division" ? "•" : <Check className="w-3 h-3 text-emerald-600" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono tracking-tight text-gray-900 uppercase">1. Question Division</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      Partitioning legal directives into distinct structural questions. Breaking down disputation requirements under Section 220(6) staying.
                    </p>
                  </div>
                </div>

                {/* Stage 2: Target Index Sourcing */}
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold leading-none ${
                    stepperStage === "sourcing" ? "bg-black text-white animate-pulse" : (stepperStage === "division" ? "bg-gray-100 text-gray-400" : <Check className="w-3 h-3 text-emerald-600" />)
                  }`}>
                    {stepperStage === "sourcing" ? "•" : (stepperStage === "division" ? "2" : <Check className="w-3 h-3 text-emerald-600" />)}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold font-mono tracking-tight uppercase ${stepperStage === "division" ? "text-gray-400" : "text-gray-900"}`}>
                      2. Sourcing Indexing Match
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      Scanning target directories including tax acts, Supreme and High court dockets, original circular gazettes, and uploaded repositories.
                    </p>
                  </div>
                </div>

                {/* Stage 3: Laws & Provisions Extraction */}
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold leading-none ${
                    stepperStage === "laws" ? "bg-black text-white animate-pulse" : (stepperStage === "division" || stepperStage === "sourcing" ? "bg-gray-100 text-gray-400" : <Check className="w-3 h-3 text-emerald-600" />)
                  }`}>
                    {stepperStage === "laws" ? "•" : (stepperStage === "division" || stepperStage === "sourcing" ? "3" : <Check className="w-3 h-3 text-emerald-600" />)}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold font-mono tracking-tight uppercase ${stepperStage === "division" || stepperStage === "sourcing" ? "text-gray-400" : "text-gray-900"}`}>
                      3. Issues &amp; Applicable Provisions
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      Extracting strict applicable statutory boundaries. Reviewing Section 220(6) treatment thresholds and Article 226 constitutional stays.
                    </p>
                  </div>
                </div>

                {/* Stage 4: Precedents Mapping */}
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold leading-none ${
                    stepperStage === "precedents" ? "bg-black text-white animate-pulse" : (stepperStage === "done" ? <Check className="w-3 h-3 text-emerald-600" /> : "bg-gray-100 text-gray-400")
                  }`}>
                    {stepperStage === "precedents" ? "•" : (stepperStage === "done" ? <Check className="w-3 h-3 text-emerald-600" /> : "4")}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold font-mono tracking-tight uppercase ${stepperStage !== "precedents" && stepperStage !== "done" ? "text-gray-400" : "text-gray-900"}`}>
                      4. High Precedent Alignments
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      Referencinglandmark rulings including *Sushen Mohan Gupta v. PCIT (2024)*, *M/s. V.V. Titanium Pigments (2022)*, and *Harsh Dipak Shah v. UOI*.
                    </p>
                  </div>
                </div>

              </div>

              {/* Status information and Exit action */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] font-mono text-gray-400 uppercase">
                  Processing via CookieCare database...
                </span>
                <button
                  id="terminate-generation-btn"
                  onClick={() => {
                    setStopGenerationSignal(true);
                    setViewState("hub");
                  }}
                  className="px-3.5 py-1.5 border border-red-200 hover:border-red-600 bg-red-50 hover:bg-red-100 text-red-600 font-mono text-[10.5px] font-bold uppercase transition"
                >
                  Exit Answer Extraction
                </button>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 4: ACTIVE ANSWERS WORKSPACE & CASE SOURCES COLUMN (Image 6) */}
        {viewState === "display_answer" && (
          <div className="flex-1 flex overflow-hidden h-full">
            
            {/* LEFT SPLIT CANVAS: Detailed generated response with IRAC/CREAC headers */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
              
              {/* Actions Sub-Bar */}
              <div className="px-6 py-2 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-gray-400 uppercase">
                  <FileCode className="w-4 h-4 text-gray-500" />
                  <span>Dossier Ledger: {selectedFormat} output</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Export buttons */}
                  <button 
                    id="copy-md-btn"
                    onClick={handleCopy}
                    className="px-2.5 py-1.5 border border-gray-200 hover:border-black bg-white text-[11px] font-mono font-bold text-gray-700 transition flex items-center gap-1"
                    title="Copy response markdown text"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                    <span>{isCopied ? "Copied!" : "Copy Markdown"}</span>
                  </button>

                  <button 
                    id="download-doc-btn"
                    onClick={() => handleDownload("Word")}
                    className="px-2.5 py-1.5 border border-gray-200 hover:border-black bg-white text-[11px] font-mono font-bold text-gray-700 transition flex items-center gap-1"
                    title="Download Word copy"
                  >
                    <Download className="w-3.5 h-3.5 text-gray-400" />
                    <span>Word</span>
                  </button>

                  <button 
                    id="download-pdf-btn"
                    onClick={() => handleDownload("PDF")}
                    className="px-2.5 py-1.5 border border-gray-200 hover:border-black bg-white text-[11px] font-mono font-bold text-gray-700 transition flex items-center gap-1"
                    title="Download as PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-gray-400" />
                    <span>PDF</span>
                  </button>

                  <button 
                    id="print-btn"
                    onClick={handlePrint}
                    className="px-2.5 py-1.5 border border-gray-200 hover:border-black bg-white text-[11px] font-mono font-bold text-gray-700 transition flex items-center gap-1"
                    title="Print dossier document"
                  >
                    <Printer className="w-3.5 h-3.5 text-gray-400" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {exportMessage && (
                <div className="bg-black text-white py-1.5 px-6 font-mono text-[10px] text-center shrink-0">
                  {exportMessage}
                </div>
              )}

              {/* Central text scrolling view */}
              <div className="flex-1 overflow-y-auto p-8 md:px-12 selection:bg-slate-200">
                <div className="max-w-2xl mx-auto">
                  
                  {/* Brief introduction metadata */}
                  {activeDossier && (
                    <div className="mb-6 p-4 border border-gray-100 bg-gray-50/50 rounded-lg">
                      <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Research Subject</div>
                      <h3 className="text-sm font-bold text-gray-900 mt-1">{activeDossier.questionToAsk || activeDossier.query}</h3>
                    </div>
                  )}

                  {/* Render Response Text formatted */}
                  <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed space-y-6">
                    {detailedAnswerText.split("\n\n").map((para, pIdx) => {
                      if (para.startsWith("### ")) {
                        const title = para.replace("### ", "").trim();
                        // Beautiful standard header layout
                        return (
                          <h3 
                            key={pIdx} 
                            className="text-sm font-bold font-mono text-black uppercase tracking-wider bg-gray-100 border-l-4 border-l-black px-3.5 py-1.5 inline-block rounded-none mt-6 first:mt-0"
                          >
                            {title}
                          </h3>
                        );
                      }
                      if (para.startsWith("#### ")) {
                        const title = para.replace("#### ", "").trim();
                        return (
                          <h4 key={pIdx} className="text-xs font-bold font-mono text-gray-800 uppercase tracking-widest mt-4">
                            {title}
                          </h4>
                        );
                      }
                      
                      // Process standard lists cleanly
                      if (para.startsWith("- ") || para.startsWith("* ") || para.match(/^\d+\.\s/)) {
                        return (
                          <ul key={pIdx} className="space-y-1.5 my-2 pl-4">
                            {para.split("\n").map((li, lIdx) => (
                              <li key={lIdx} className="list-disc text-sm text-gray-700 leading-relaxed font-sans">
                                {li.replace(/^[-*]\s|^\d+\.\s/, "")}
                              </li>
                            ))}
                          </ul>
                        );
                      }

                      return (
                        <p key={pIdx} className="text-sm leading-relaxed font-sans text-gray-800 my-2 select-text whitespace-pre-wrap">
                          {para}
                        </p>
                      );
                    })}

                    {isSynthesizingAnswer && (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 font-mono text-xs text-gray-500 animate-pulse mt-4">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                        <span>Streaming compliance analysis feedback from index...</span>
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>

            {/* RIGHT SPLIT COLUMN: Match Sources Desk (Image 6 right panel) */}
            <aside className="w-80 border-l border-gray-200 bg-gray-50/50 flex flex-col h-full overflow-hidden shrink-0 select-none">
              
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-black">Sources</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5 uppercase">View Sources &amp; Deep Dive</p>
                </div>
                <span className="bg-black text-white px-2 py-0.5 text-[9px] font-mono tracking-widest font-extrabold uppercase rounded-sm">
                  {activeMatchedSources.length} Hit
                </span>
              </div>

              {/* Lists of matching hits */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeMatchedSources.map((src) => (
                  <div 
                    key={src.id}
                    className="bg-white border border-gray-200 hover:border-black p-4 rounded-lg shadow-sm transition flex flex-col gap-2.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="bg-gray-100 text-gray-800 text-[8.5px] font-mono tracking-wider px-1.5 py-0.5 rounded uppercase font-bold">
                        {src.documentType}
                      </span>
                      <span className="text-[9px] font-mono text-gray-400 font-bold">
                        {src.citation}
                      </span>
                    </div>

                    <h5 className="text-xs font-extrabold text-gray-900 leading-snug font-sans tracking-tight line-clamp-2">
                      {src.title}
                    </h5>

                    <p className="text-[10.5px] text-gray-500 font-mono text-gray-400 uppercase tracking-wide">
                      {src.jurisdiction}
                    </p>

                    {/* Action anchors: View source and Deep Dive */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <button
                        id={`view-source-trigger-${src.id}`}
                        onClick={() => setActiveViewSource(src)}
                        className="text-[10.5px] font-mono font-bold text-gray-500 hover:text-black transition flex items-center gap-1 cursor-pointer"
                        title="Open official judgment transcript copy"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View Source</span>
                      </button>

                      <button
                        id={`deep-dive-trigger-${src.id}`}
                        onClick={() => setActiveDeepDiveSource(src)}
                        className="text-[10.5px] font-mono font-bold text-gray-700 hover:text-black hover:underline transition flex items-center gap-1 cursor-pointer"
                        title="Uncover core facts, principles and judgments"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Deep Dive</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              {/* Desk notes footer */}
              <div className="p-4 border-t border-gray-200 bg-white text-[10px] font-mono text-gray-400 leading-relaxed">
                *CookieCare verified court copies of judgments and original regulation copies indexed straight from official dockets.
              </div>

            </aside>

          </div>
        )}

      </div>

      {/* SELECT SOURCES MODAL (Images 2 & 3) */}
      {sourceModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-black w-full max-w-3xl h-[480px] flex flex-col shadow-2xl rounded-none relative">
            
            {/* Modal Header */}
            <div className="p-4 border-b-2 border-black flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-4.5 h-4.5 text-black" />
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase text-gray-500">1. Select sources</h3>
                  <p className="text-[11px] text-gray-400">Pick the databases, files, or websites CookieCare should consult.</p>
                </div>
              </div>
              <button 
                id="close-source-modal-x"
                onClick={() => setSourceModalOpen(false)}
                className="p-1 border border-gray-200 hover:border-black rounded transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Internal Tabs navigation */}
            <div className="flex border-b border-gray-200 px-4 bg-gray-50 shrink-0 select-none">
              <button
                id="source-modal-tab-database"
                onClick={() => setModalSubTab("database")}
                className={`px-4 py-2.5 text-xs font-mono font-bold uppercase cursor-pointer border-b-2 -mb-px transition ${
                  modalSubTab === "database" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black"
                }`}
              >
                Database
              </button>
              <button
                id="source-modal-tab-folder"
                onClick={() => setModalSubTab("folder")}
                className={`px-4 py-2.5 text-xs font-mono font-bold uppercase cursor-pointer border-b-2 -mb-px transition ${
                  modalSubTab === "folder" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black"
                }`}
              >
                Folder
              </button>
              <button
                id="source-modal-tab-web"
                onClick={() => setModalSubTab("web")}
                className={`px-4 py-2.5 text-xs font-mono font-bold uppercase cursor-pointer border-b-2 -mb-px transition ${
                  modalSubTab === "web" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black"
                }`}
              >
                Web
              </button>
            </div>

            {/* Modal Content container depending on tabs */}
            <div className="flex-1 overflow-y-auto p-5">
              
              {/* TAB A: DATABASE SELECT (Image 2) */}
              {modalSubTab === "database" && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 leading-normal mb-2 select-none">
                    Choose the databases in which to search:
                  </p>
                  
                  <div className="border border-gray-200 divide-y divide-gray-100 max-h-60 overflow-y-auto">
                    {dbCategories.map((cat, cIdx) => (
                      <div key={cIdx} className="p-3 bg-white">
                        <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5 select-none">{cat.country}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {cat.items.map((it) => {
                            const combined = `${cat.country} › ${it}`;
                            const isCh = selectedDbSources.includes(combined);
                            return (
                              <button
                                key={it}
                                type="button"
                                onClick={() => handleToggleDbSource(combined)}
                                className={`flex items-center justify-between p-2.5 text-xs border text-left transition select-none ${
                                  isCh 
                                    ? "bg-black text-white border-black font-semibold" 
                                    : "bg-gray-50 border-gray-200 hover:border-gray-400 text-gray-700"
                                }`}
                              >
                                <span>{it}</span>
                                {isCh ? <Check className="w-3.5 h-3.5 text-white" /> : <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB B: FOLDERS / INTERNAL UPLOADS (PDF, DOCX, XLS) */}
              {modalSubTab === "folder" && (
                <div className="space-y-4">
                  
                  <div className="flex flex-col md:flex-row gap-4 items-start select-none">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-2">
                        Create a folder and select files for internal knowledge bases, repositories, or past client files. Supports **PDF, DOCX, XLSX, PPTX, Image &amp; TXT** files.
                      </p>
                      
                      {/* folder create form */}
                      <div className="flex gap-1.5 mb-3">
                        <input
                          type="text"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          placeholder="New Folder Title..."
                          className="flex-1 px-3 py-1.5 border border-gray-200 text-xs font-mono rounded"
                        />
                        <button
                          type="button"
                          onClick={handleCreateFolder}
                          className="px-4 py-1.5 bg-black text-white hover:bg-gray-800 hover:border-black border text-xs font-mono font-bold uppercase transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Create</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3 border border-dashed border-gray-300 rounded bg-gray-50/50 flex flex-col items-center justify-center text-center w-full md:w-56 h-28">
                      <Upload className="w-5 h-5 text-gray-400 mb-1.5 animate-bounce" />
                      <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">Knowledge Uploader</span>
                      <span className="text-[9px] text-gray-400 mt-0.5">Drag-drop or browse files</span>
                    </div>
                  </div>

                  {/* Registered Folders stack inside modal */}
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {folders.map(f => {
                      const isSel = selectedFolderIds.includes(f.id);
                      return (
                        <div key={f.id} className="p-3 border border-gray-200 bg-white">
                          <div className="flex justify-between items-center mb-1">
                            <label className="flex items-center gap-2 text-xs font-extrabold text-gray-800 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSel}
                                onChange={() => 
                                  setSelectedFolderIds(prev => 
                                    prev.includes(f.id) ? prev.filter(id => id !== f.id) : [...prev, f.id]
                                  )
                                }
                                className="accent-black"
                              />
                              <Folder className="w-4 h-4 text-black shrink-0" />
                              <span>{f.name}</span>
                            </label>
                            
                            <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5">
                              {f.files.length} items
                            </span>
                          </div>

                          {/* list files inside list */}
                          <div className="mt-2 pl-6 space-y-1 bg-gray-50/50 p-1.5 border border-gray-100">
                            {f.files.length === 0 ? (
                              <div className="text-[9.5px] font-mono text-gray-400 italic">No files. Click standard uploading tags:</div>
                            ) : (
                              f.files.map((file, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[9.5px] font-mono text-gray-500">
                                  <span>{file.name}</span>
                                  <span>({file.size})</span>
                                </div>
                              ))
                            )}
                            
                            {/* Upload simulation actions labels */}
                            <div className="flex gap-2.5 flex-wrap pt-1 border-t border-gray-100 mt-2">
                              <button 
                                type="button" 
                                onClick={() => handleFileUpload(f.id, "audit_reconciliation_draft.pdf", "PDF", "1.4 MB")}
                                className="text-[9px] font-mono text-gray-600 hover:text-black font-bold uppercase underline"
                              >
                                + Add PDF
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleFileUpload(f.id, "liability_compromise_bylaws.docx", "DOCX", "4.2 MB")}
                                className="text-[9px] font-mono text-gray-600 hover:text-black font-bold uppercase underline"
                              >
                                + Add DOCX
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleFileUpload(f.id, "gst_assessments_q4.xlsx", "XLSX", "18.1 MB")}
                                className="text-[9px] font-mono text-gray-600 hover:text-black font-bold uppercase underline"
                              >
                                + Add XLSX
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

              {/* TAB C: LIVE WEB DISCOVERY TARGETS (Image 3) */}
              {modalSubTab === "web" && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 leading-normal select-none mb-2">
                    Specify URLs for research, such as regulatory portals, court dockets, gazette listings or cost parameters:
                  </p>

                  <div className="flex gap-1.5 select-none mb-3">
                    <input
                      type="text"
                      value={newUrlInput}
                      onChange={(e) => setNewUrlInput(e.target.value)}
                      placeholder="e.g. www.courtrecords.gov/feed"
                      className="flex-1 px-3 py-1.5 border border-gray-200 text-xs font-mono rounded"
                    />
                    <button
                      type="button"
                      onClick={handleAddNewUrl}
                      className="px-4 py-1.5 bg-black text-white hover:bg-gray-800 text-xs border border-black font-mono font-bold uppercase transition inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Website</span>
                    </button>
                  </div>

                  {/* Registered Web URLs list */}
                  <div className="border border-gray-200 rounded min-h-36 max-h-52 overflow-y-auto">
                    {webUrls.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center select-none text-gray-400 font-mono text-xs">
                        <Search className="w-6 h-6 mb-2 text-gray-300" />
                        <span>No Items Found</span>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {webUrls.map(url => {
                          const isS = selectedUrls.includes(url);
                          return (
                            <div key={url} className="p-2.5 flex justify-between items-center bg-white text-xs">
                              <label className="flex items-center gap-2 cursor-pointer font-sans truncate pr-4 text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={isS}
                                  onChange={() => 
                                    setSelectedUrls(prev => 
                                      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
                                    )
                                  }
                                  className="accent-black"
                                />
                                <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="truncate">{url}</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => handleRemoveUrl(url)}
                                className="text-gray-400 hover:text-red-500 transition px-1 cursor-pointer"
                                title="Remove website from list"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t-2 border-black bg-gray-50 flex justify-end gap-3 select-none">
              <button
                id="source-modal-cancel-btn"
                onClick={() => setSourceModalOpen(false)}
                className="px-4 py-2 border border-gray-200 hover:border-black text-xs font-mono font-bold uppercase tracking-tight bg-white select-none transition"
              >
                Cancel
              </button>

              <button
                id="source-modal-select-btn"
                onClick={() => setSourceModalOpen(false)}
                className="px-5 py-2 bg-black text-white hover:bg-gray-800 border-2 border-black text-xs font-mono font-bold uppercase tracking-tight select-none transition shadow-sm cursor-pointer"
              >
                Select
              </button>
            </div>

          </div>
        </div>
      )}

      {/* VERIFIABLE SOURCE WINDOW DOCKET (Modal) */}
      {activeViewSource && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-text">
          <div className="bg-white border-2 border-black w-full max-w-2xl h-[520px] flex flex-col shadow-2xl rounded-none relative">
            
            {/* Header */}
            <div className="p-4 border-b-2 border-black bg-black text-white flex justify-between items-center select-none shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-white" />
                <div>
                  <span className="text-[10px] font-mono uppercase text-gray-400 tracking-wider">Official Source Transcript Copy</span>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-tight">Ref: {activeViewSource.citation}</h3>
                </div>
              </div>
              
              <button 
                id="close-source-view-x"
                onClick={() => setActiveViewSource(null)}
                className="p-1 border border-black hover:bg-gray-800 rounded bg-white text-black transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Metadata indicator bar */}
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex gap-4 select-none text-[11px] font-mono text-gray-500">
              <div><strong>Jurisdiction:</strong> <span className="text-gray-800">{activeViewSource.jurisdiction}</span></div>
              <div><strong>Doc Type:</strong> <span className="text-gray-800">{activeViewSource.documentType}</span></div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 font-mono text-xs text-gray-800 bg-white leading-relaxed selection:bg-slate-200">
              <div className="whitespace-pre-wrap">
                {activeViewSource.officialCopy}
              </div>
            </div>

            {/* Actions footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 select-none shrink-0">
              <button
                id="copy-transcript-btn"
                onClick={() => {
                  navigator.clipboard.writeText(activeViewSource.officialCopy);
                  alert("Official copy transcript copied to clipboard!");
                }}
                className="px-4 py-2 border border-gray-200 hover:border-black text-xs font-mono font-bold bg-white cursor-pointer transition flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-gray-400" />
                <span>Copy Copy</span>
              </button>
              
              <button
                id="close-source-view-footer-btn"
                onClick={() => setActiveViewSource(null)}
                className="px-4 py-2 bg-black text-white hover:bg-gray-800 text-xs font-mono font-bold select-none transition cursor-pointer"
              >
                Close Transcript
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DEEP DIVE PANEL OUTLINES Drawer Modals */}
      {activeDeepDiveSource && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-end z-50 select-text">
          <div className="bg-white border-l-2 border-black w-full max-w-md h-full flex flex-col shadow-2xl relative">
            
            {/* Header */}
            <div className="p-4 border-b-2 border-black bg-white flex justify-between items-center select-none shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wide text-gray-500">Case Deep Dive analysis</h4>
                  <h3 className="text-xs font-bold text-gray-900 font-sans tracking-tight leading-tight">{activeDeepDiveSource.title}</h3>
                </div>
              </div>

              <button 
                id="close-deep-dive-x"
                onClick={() => setActiveDeepDiveSource(null)}
                className="p-1 border border-gray-200 hover:border-black rounded transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Deep dive facts analysis content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 leading-relaxed text-sm">
              
              <div>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">Citation Ref ID</span>
                <p className="text-xs font-mono font-bold text-gray-800 bg-gray-50 p-2 border border-gray-100 inline-block">{activeDeepDiveSource.citation}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">Case Facts</span>
                <p className="text-xs text-gray-700 font-sans">{activeDeepDiveSource.facts}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">Key Legal Principles</span>
                <p className="text-xs text-gray-700 font-sans">{activeDeepDiveSource.principles}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">Primary Arguments Advanced</span>
                <p className="text-xs text-gray-700 font-sans">{activeDeepDiveSource.arguments}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">Court Decision &amp; Ruling Findings</span>
                <p className="text-xs text-gray-700 font-sans">{activeDeepDiveSource.decision}</p>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 select-none">
              <button
                id="open-official-source-from-deep-dive-btn"
                onClick={() => {
                  setActiveViewSource(activeDeepDiveSource);
                  setActiveDeepDiveSource(null);
                }}
                className="px-4 py-2 border border-gray-200 hover:border-black text-[11px] font-mono font-bold bg-white cursor-pointer transition flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Source Copy</span>
              </button>

              <button
                id="close-deep-dive-footer-btn"
                onClick={() => setActiveDeepDiveSource(null)}
                className="px-4 py-2 bg-black text-white hover:bg-gray-800 text-[11px] font-mono font-bold transition cursor-pointer"
              >
                Close Deep Dive
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SLIDE-OUT HISTORY DRAWER PANEL */}
      {historyOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-end z-50 select-none">
          <div className="bg-white border-l-2 border-black w-full max-w-sm h-full flex flex-col shadow-2xl relative">
            
            {/* Header */}
            <div className="p-4 border-b-2 border-black flex justify-between items-center bg-gray-50 shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-black" />
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase text-gray-900">Historical Scenarios Docket</h3>
                  <p className="text-[10.5px] text-gray-500 uppercase">Consulting channel logs</p>
                </div>
              </div>

              <button 
                id="close-history-drawer-btn"
                onClick={() => setHistoryOpen(false)}
                className="p-1 border border-gray-200 hover:border-black rounded transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* History list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <p className="text-[10.5px] text-gray-400 font-mono uppercase tracking-wide">Select an older question to restore context:</p>
              
              {historyList.map(item => (
                <div 
                  key={item.id}
                  id={`history-item-row-${item.id}`}
                  onClick={() => handleOpenOldHistory(item)}
                  className="p-3 border border-gray-200 hover:border-black bg-white rounded-lg transition-all cursor-pointer shadow-sm hover:shadow flex flex-col gap-1.5"
                >
                  <div className="flex justify-between items-center text-[9px] font-mono text-gray-400 font-bold">
                    <span>{item.date}</span>
                    <span className="bg-gray-100 text-gray-800 px-1 rounded uppercase">{item.format}</span>
                  </div>

                  <p className="text-xs font-extrabold text-gray-900 line-clamp-2 leading-relaxed">
                    {item.query}
                  </p>

                  <div className="flex items-center gap-1 mt-1 text-[9.5px] font-mono text-emerald-700">
                    <BookmarkCheck className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.dbSources.join(", ") || "Enclave repositories"}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-[10px] text-gray-400 font-mono text-center">
              *Session logs are protected within your local browser sandbox.
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
