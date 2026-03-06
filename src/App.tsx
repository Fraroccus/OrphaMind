import React, { useState } from 'react';
import { 
  Dna, 
  Stethoscope, 
  RotateCcw, 
  CheckCircle2, 
  Search,
  Activity,
  Beaker,
  Info,
  Loader2,
  ClipboardList,
  ArrowRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Disease, ConsultationState } from './types';
import { getCandidateDiseases, calculateFinalRanking } from './services/geminiService';

const categories = [
  "Rare Neurological Diseases",
  "Rare Bone & Connective Tissue Diseases",
  "Rare Metabolic Diseases",
  "Rare Cardiovascular Diseases",
  "Rare Dermatological Diseases",
  "Rare Hematological Diseases",
  "Rare Immunological Diseases",
  "Rare Ophthalmic Diseases",
  "Rare Renal Diseases",
  "Rare Respiratory Diseases"
];

export default function App() {
  const [state, setState] = useState<ConsultationState>({
    step: 'initial',
    category: '',
    initialSymptoms: '',
    refinedSymptoms: [],
    candidates: []
  });
  
  const [loading, setLoading] = useState(false);
  const [selectedRefined, setSelectedRefined] = useState<Set<string>>(new Set());
  const [finalResults, setFinalResults] = useState<Disease[]>([]);

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.category || !state.initialSymptoms) return;

    setLoading(true);
    try {
      const data = await getCandidateDiseases(state.category, state.initialSymptoms);
      setState(prev => ({
        ...prev,
        step: 'refining',
        refinedSymptoms: data.discriminatingSymptoms,
        candidates: data.candidates
      }));
    } catch (error) {
      console.error("Error fetching candidates:", error);
      alert("An error occurred while connecting to the Orphanet Knowledge Engine. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefinementSubmit = async () => {
    setLoading(true);
    try {
      const results = await calculateFinalRanking(
        state.category,
        state.initialSymptoms,
        Array.from(selectedRefined),
        state.candidates
      );
      setFinalResults(results);
      setState(prev => ({ ...prev, step: 'results' }));
    } catch (error) {
      console.error("Error calculating ranking:", error);
      alert("An error occurred during diagnostic analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleRefinedSymptom = (symptom: string) => {
    const newSet = new Set(selectedRefined);
    if (newSet.has(symptom)) newSet.delete(symptom);
    else newSet.add(symptom);
    setSelectedRefined(newSet);
  };

  const reset = () => {
    setState({
      step: 'initial',
      category: '',
      initialSymptoms: '',
      refinedSymptoms: [],
      candidates: []
    });
    setSelectedRefined(new Set());
    setFinalResults([]);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-blue-50/50 text-slate-900 font-sans selection:bg-blue-200">
      {/* Header */}
      <header className="bg-blue-600 border-b border-blue-700 sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2.5 rounded-2xl shadow-inner">
              <Stethoscope className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">OrphaMind</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" />
                <p className="text-[10px] text-blue-100 uppercase tracking-widest font-bold">Orphanet Knowledge Engine</p>
              </div>
            </div>
          </div>
          <button 
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-500 hover:bg-blue-400 rounded-2xl transition-all shadow-md active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            New Consultation
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {/* STEP 1: INITIAL PRESENTATION */}
          {state.step === 'initial' && (
            <motion.div
              key="initial"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="max-w-3xl mx-auto space-y-10"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-black uppercase tracking-widest border border-blue-200">
                  <Sparkles className="w-3.5 h-3.5" />
                  Diagnostic Intelligence
                </div>
                <h2 className="text-4xl font-black tracking-tight text-slate-900">Clinical Presentation</h2>
                <p className="text-slate-600 text-lg">Describe the symptoms and select a category to begin the analysis.</p>
              </div>

              <form onSubmit={handleInitialSubmit} className="space-y-8 bg-white p-10 rounded-[40px] shadow-2xl shadow-blue-900/5 border border-blue-100">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm">1</div>
                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest">Orphanet Category</label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setState(prev => ({ ...prev, category: cat }))}
                        className={`p-4 text-left rounded-2xl border-2 transition-all ${
                          state.category === cat 
                            ? 'bg-blue-50 border-blue-600 shadow-md text-blue-700' 
                            : 'bg-white border-slate-100 hover:border-blue-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">{cat}</span>
                          {state.category === cat && <CheckCircle2 className="w-5 h-5" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm">2</div>
                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest">Clinical Observations</label>
                  </div>
                  <div className="relative">
                    <textarea
                      value={state.initialSymptoms}
                      onChange={(e) => setState(prev => ({ ...prev, initialSymptoms: e.target.value }))}
                      placeholder="Describe major symptoms, onset age, and family history..."
                      className="w-full h-48 p-8 bg-slate-50 border-2 border-slate-100 rounded-[32px] focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all resize-none text-slate-900 text-lg placeholder:text-slate-400"
                    />
                    <div className="absolute bottom-6 right-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {state.initialSymptoms.length} characters
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !state.category || !state.initialSymptoms}
                  className="w-full py-6 bg-blue-600 text-white rounded-[32px] font-black text-lg hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-4 shadow-xl shadow-blue-600/20 active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Search className="w-7 h-7" />}
                  Identify Candidate Diseases
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 2: REFINEMENT */}
          {state.step === 'refining' && (
            <motion.div
              key="refining"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-5xl mx-auto space-y-10"
            >
              <div className="flex items-end justify-between px-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <ClipboardList className="w-3 h-3" />
                    Clinical Refinement
                  </div>
                  <h2 className="text-4xl font-black text-slate-900">Specific Manifestations</h2>
                  <p className="text-slate-600 text-lg">The engine identified {state.candidates.length} candidates. Confirm the presence of these symptoms.</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-blue-600">Step 02</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Refinement Phase</div>
                </div>
              </div>

              <div className="bg-white border border-blue-100 rounded-[48px] overflow-hidden shadow-2xl shadow-blue-900/5">
                <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
                  {state.refinedSymptoms.map((symptom, idx) => (
                    <label 
                      key={idx} 
                      className="flex items-start gap-5 cursor-pointer group"
                    >
                      <div className="relative flex items-center mt-1">
                        <input
                          type="checkbox"
                          checked={selectedRefined.has(symptom)}
                          onChange={() => toggleRefinedSymptom(symptom)}
                          className="peer sr-only"
                        />
                        <div className="w-7 h-7 border-2 border-slate-200 rounded-xl peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all shadow-sm group-hover:border-blue-300" />
                        <CheckCircle2 className="absolute w-5 h-5 text-white opacity-0 peer-checked:opacity-100 left-[4px] transition-opacity" />
                      </div>
                      <span className={`text-lg transition-colors leading-tight ${selectedRefined.has(symptom) ? 'text-blue-700 font-black' : 'text-slate-600 group-hover:text-slate-900'}`}>
                        {symptom}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="p-10 bg-blue-50/50 border-t border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white border border-blue-100 flex items-center justify-center shadow-sm">
                      <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-lg font-black text-slate-900">{selectedRefined.size}</span>
                      <span className="text-sm font-bold text-slate-500 ml-2 uppercase tracking-widest">Symptoms Confirmed</span>
                    </div>
                  </div>
                  <button
                    onClick={handleRefinementSubmit}
                    disabled={loading}
                    className="px-12 py-5 bg-blue-600 text-white rounded-[24px] font-black text-lg hover:bg-blue-700 disabled:opacity-30 transition-all flex items-center gap-3 shadow-xl shadow-blue-600/30 active:scale-95"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                    Calculate Final Probabilities
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: RESULTS */}
          {state.step === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-16"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-200">
                  <ShieldCheck className="w-4 h-4" />
                  Analysis Complete
                </div>
                <h2 className="text-5xl font-black tracking-tight text-slate-900">Top 10 Probable Diagnoses</h2>
                <p className="text-slate-600 text-xl max-w-3xl mx-auto">The OrphaMind engine has ranked the following rare diseases based on clinical correlation.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {finalResults.map((result, idx) => (
                  <motion.div
                    key={result.orphanetId}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white border border-blue-100 rounded-[48px] overflow-hidden shadow-xl hover:shadow-2xl transition-all group relative"
                  >
                    {idx === 0 && (
                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" />
                    )}
                    <div className="p-10 space-y-8">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-200">
                              {result.orphanetId}
                            </span>
                            {idx === 0 && (
                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-200">
                                Primary Match
                              </span>
                            )}
                          </div>
                          <h3 className="text-3xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{result.name}</h3>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-black text-blue-600">{result.matchScore}%</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Match Score</div>
                        </div>
                      </div>

                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${result.matchScore}%` }}
                          className={`h-full rounded-full ${result.matchScore! >= 50 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'}`}
                        />
                      </div>

                      <div className="space-y-6">
                        {/* Genetic Tests */}
                        <div className="bg-blue-50/50 rounded-[32px] p-6 border border-blue-100">
                          <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                              <Dna className="w-5 h-5 text-blue-600" />
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">Genetic Validation</h4>
                          </div>
                          <div className="space-y-4">
                            {result.geneticTests.map((test, tIdx) => (
                              <div key={tIdx} className="bg-white p-5 rounded-2xl border border-blue-100 flex items-center gap-5 shadow-sm">
                                <div className="bg-blue-600 text-white text-xs font-black w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
                                  {test.geneSymbol}
                                </div>
                                <div>
                                  <p className="text-base font-black text-slate-900 leading-tight">{test.method}</p>
                                  <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">Orphanet Protocol</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Symptoms */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Beaker className="w-3.5 h-3.5" />
                            Clinical Manifestations
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {result.symptoms.map((s, sIdx) => {
                              const isConfirmed = selectedRefined.has(s.name);
                              return (
                                <div 
                                  key={sIdx}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs transition-all ${
                                    isConfirmed 
                                      ? 'bg-blue-600 border-blue-600 text-white font-black shadow-md' 
                                      : 'bg-white border-slate-200 text-slate-500 font-bold'
                                  }`}
                                >
                                  {isConfirmed && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  {s.name}
                                  <span className={`text-[10px] opacity-70 font-bold ${isConfirmed ? 'text-blue-100' : 'text-slate-400'}`}>
                                    ({s.frequency})
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="max-w-3xl mx-auto p-8 bg-amber-50 border border-amber-100 rounded-[40px] flex gap-6 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <Info className="w-6 h-6 text-amber-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black text-amber-900 uppercase tracking-widest">Clinical Disclaimer</p>
                  <p className="text-sm text-amber-800 leading-relaxed font-medium">
                    This analysis is generated by the OrphaMind Knowledge Engine based on the Orphanet database structure. It is intended for clinical decision support and should be validated by a qualified specialist. No patient-identifiable data has been processed.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-16 border-t border-blue-100 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-3 rounded-2xl border border-blue-100 shadow-sm">
            <Stethoscope className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-xs text-slate-400 font-black uppercase tracking-[0.3em]">
            OrphaMind Pro • Powered by Gemini 2.0 & Orphanet Data
          </p>
        </div>
      </footer>
    </div>
  );
}
