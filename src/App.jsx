import { useState, useRef } from "react";

function App() {
  const [idea, setIdea] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef(null);

  // 🔥 STREAMING EN TEMPS RÉEL
  const handleGenerateStream = async () => {
    if (!idea.trim()) return;
    
    setLoading(true);
    setResult(null);
    setStreamingText("");
    setIsStreaming(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/generate-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.error) {
                alert("Erreur: " + parsed.error);
                setIsStreaming(false);
                setLoading(false);
                return;
              }
              
              if (parsed.chunk) {
                accumulated += parsed.chunk;
                setStreamingText(accumulated);
              }
              
              if (parsed.done && parsed.result) {
                setResult(parsed.result);
                setIsStreaming(false);
                setStreamingText("");
              }
            } catch (e) {
              // Ignore les erreurs de parsing
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert("Erreur: Assure-toi que le backend tourne !");
      setIsStreaming(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "brief-musical.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erreur PDF:", err);
      alert("Erreur lors de la génération du PDF: " + err.message);
    }
  };

  const exampleIdeas = [
    "Beat trap sombre, 808 puissante, mélodie lo-fi",
    "Musique afro chill, positive et groovy",
    "Lo-fi hip-hop relaxante pour podcast",
    "EDM énergique pour intro podcast"
  ];

  // Mapping des sections avec icônes et couleurs
  const sectionConfig = {
    style: { icon: "🎨", title: "Style Musical", color: "#8b5cf6" },
    bpm: { icon: "⏱️", title: "Tempo", color: "#ec4899" },
    key: { icon: "🎹", title: "Tonalité", color: "#10b981" },
    ambiance: { icon: "🌊", title: "Ambiance", color: "#f59e0b" },
    structure: { icon: "🏗️", title: "Structure", color: "#3b82f6" },
    instruments: { icon: "🎸", title: "Instruments", color: "#8b5cf6" },
    drums_patterns: { icon: "🥁", title: "Patterns de Batterie", color: "#ef4444" },
    presets_plugins: { icon: "🎛️", title: "Presets & Plugins", color: "#06b6d4" },
    mix_tips: { icon: "🎚️", title: "Conseils Mixage", color: "#a855f7" },
    mastering_tips: { icon: "✨", title: "Conseils Mastering", color: "#ec4899" },
    effects: { icon: "🌀", title: "Effets", color: "#14b8a6" },
    automation_tips: { icon: "🤖", title: "Automation", color: "#f59e0b" },
    arrangement_guide: { icon: "📐", title: "Arrangement", color: "#6366f1" }
  };

  // Fonction pour parser et formater le contenu
  const formatContent = (content) => {
    if (typeof content === "object" && content !== null) {
      if (Array.isArray(content)) {
        return content.map((item, idx) => (
          <div key={idx} style={{
            padding: "10px 14px",
            marginBottom: "8px",
            background: "#f9fafb",
            borderLeft: "3px solid #8b5cf6",
            borderRadius: "6px",
            color: "#374151",
            fontSize: "14px",
            lineHeight: "1.6"
          }}>
            {typeof item === "object" ? formatObjectToText(item) : item}
          </div>
        ));
      }
      
      return Object.entries(content).map(([key, value]) => (
        <div key={key} style={{
          padding: "12px 16px",
          marginBottom: "10px",
          background: "#f9fafb",
          borderLeft: "3px solid #8b5cf6",
          borderRadius: "6px"
        }}>
          <div style={{ 
            fontWeight: "700", 
            color: "#1f2937",
            marginBottom: "6px",
            fontSize: "14px"
          }}>
            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>
          <div style={{ color: "#4b5563", fontSize: "14px", lineHeight: "1.6" }}>
            {typeof value === "object" ? (
              Array.isArray(value) ? (
                value.map((v, i) => (
                  <div key={i} style={{ marginBottom: "4px" }}>
                    • {typeof v === "object" ? formatObjectToText(v) : v}
                  </div>
                ))
              ) : (
                formatObjectToText(value)
              )
            ) : value}
          </div>
        </div>
      ));
    }

    const text = String(content);
    const lines = text
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    return lines.map((line, idx) => {
      if (line.includes('-') && !line.startsWith('-')) {
        const parts = line.split('-').map(p => p.trim()).filter(p => p);
        return parts.map((part, i) => (
          <div key={`${idx}-${i}`} style={{
            padding: "10px 14px",
            marginBottom: "8px",
            background: "#f9fafb",
            borderLeft: "3px solid #8b5cf6",
            borderRadius: "6px",
            color: "#374151",
            fontSize: "14px",
            lineHeight: "1.6"
          }}>
            {part}
          </div>
        ));
      } else if (line.startsWith('-') || line.startsWith('•')) {
        return (
          <div key={idx} style={{
            padding: "10px 14px",
            marginBottom: "8px",
            background: "#f9fafb",
            borderLeft: "3px solid #8b5cf6",
            borderRadius: "6px",
            color: "#374151",
            fontSize: "14px",
            lineHeight: "1.6"
          }}>
            {line.replace(/^[-•]\s*/, '')}
          </div>
        );
      } else if (line.includes(',') && line.length > 50) {
        const items = line.split(',').map(i => i.trim()).filter(i => i);
        return items.map((item, i) => (
          <div key={`${idx}-${i}`} style={{
            padding: "10px 14px",
            marginBottom: "8px",
            background: "#f9fafb",
            borderLeft: "3px solid #8b5cf6",
            borderRadius: "6px",
            color: "#374151",
            fontSize: "14px",
            lineHeight: "1.6"
          }}>
            {item}
          </div>
        ));
      } else {
        return (
          <div key={idx} style={{
            padding: "10px 14px",
            marginBottom: "8px",
            background: "#f9fafb",
            borderLeft: "3px solid #8b5cf6",
            borderRadius: "6px",
            color: "#374151",
            fontSize: "14px",
            lineHeight: "1.6"
          }}>
            {line}
          </div>
        );
      }
    });
  };

  const formatObjectToText = (obj) => {
    if (typeof obj !== "object" || obj === null) return String(obj);
    
    if (Array.isArray(obj)) {
      return obj.map(item => 
        typeof item === "object" ? formatObjectToText(item) : item
      ).join(", ");
    }
    
    return Object.entries(obj)
      .map(([k, v]) => {
        const key = k.replace(/_/g, ' ');
        const value = typeof v === "object" ? formatObjectToText(v) : v;
        return `${key}: ${value}`;
      })
      .join(" | ");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #fef3f4 0%, #fdf4ff 50%, #f0f9ff 100%)",
      color: "#1f2937",
      padding: "40px 20px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "50px", animation: "fadeIn 0.6s ease-out" }}>
          <div style={{ fontSize: "80px", marginBottom: "10px" }}>🎧</div>
          <h1 style={{ 
            fontSize: "48px", 
            fontWeight: "800", 
            background: "linear-gradient(90deg, #8b5cf6, #ec4899, #f59e0b)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "15px",
            letterSpacing: "-1px"
          }}>
            Music Brief Generator
          </h1>
          <p style={{ color: "#6b7280", fontSize: "18px", fontWeight: "400" }}>
            Génère un brief ultra technique pour ingénieur son et beatmaker
          </p>
        </div>

        {/* Input Section */}
        <div style={{
          background: "white",
          padding: "30px",
          borderRadius: "20px",
          marginBottom: "30px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 20px rgba(139, 92, 246, 0.08)"
        }}>
          <textarea
            style={{
              width: "100%",
              padding: "18px",
              borderRadius: "12px",
              border: "2px solid #e5e7eb",
              background: "#f9fafb",
              color: "#1f2937",
              fontSize: "16px",
              fontFamily: "inherit",
              minHeight: "120px",
              resize: "vertical",
              outline: "none",
              transition: "all 0.3s ease"
            }}
            placeholder="Décris ton idée musicale en détail..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onFocus={(e) => {
              e.target.style.borderColor = "#8b5cf6";
              e.target.style.background = "white";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e5e7eb";
              e.target.style.background = "#f9fafb";
            }}
          />

          {/* Example Pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "20px" }}>
            <span style={{ color: "#6b7280", fontSize: "14px", marginRight: "10px", alignSelf: "center" }}>Exemples:</span>
            {exampleIdeas.map((ex, i) => (
              <button 
                key={i} 
                onClick={() => setIdea(ex)} 
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: "1px solid #e5e7eb",
                  cursor: "pointer",
                  background: "#f9fafb",
                  color: "#6b7280",
                  fontSize: "13px",
                  transition: "all 0.3s ease",
                  fontWeight: "500"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#f3f4f6";
                  e.target.style.borderColor = "#8b5cf6";
                  e.target.style.color = "#8b5cf6";
                  e.target.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#f9fafb";
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.color = "#6b7280";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateStream}
            disabled={loading || !idea.trim()}
            style={{
              width: "100%",
              padding: "18px",
              borderRadius: "12px",
              border: "none",
              fontSize: "18px",
              fontWeight: "700",
              background: loading || !idea.trim() 
                ? "#e5e7eb" 
                : "linear-gradient(90deg, #8b5cf6, #ec4899)",
              cursor: loading || !idea.trim() ? "not-allowed" : "pointer",
              marginTop: "20px",
              color: loading || !idea.trim() ? "#9ca3af" : "white",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              boxShadow: loading || !idea.trim() ? "none" : "0 4px 20px rgba(139, 92, 246, 0.3)"
            }}
            onMouseEnter={(e) => {
              if (!loading && idea.trim()) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 30px rgba(139, 92, 246, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 20px rgba(139, 92, 246, 0.3)";
            }}
          >
            {loading ? "⏳ Génération en cours..." : "✨ Générer le brief"}
          </button>
        </div>

        {/* 🔥 STREAMING BOX - NOUVEAU */}
        {isStreaming && streamingText && (
          <div style={{
            background: "white",
            padding: "25px",
            borderRadius: "16px",
            marginBottom: "30px",
            border: "2px solid #8b5cf6",
            boxShadow: "0 4px 20px rgba(139, 92, 246, 0.15)",
            animation: "pulse 2s ease-in-out infinite"
          }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              marginBottom: "15px",
              gap: "10px"
            }}>
              <div style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#10b981",
                animation: "blink 1s ease-in-out infinite"
              }}></div>
              <span style={{ 
                color: "#8b5cf6", 
                fontWeight: "700",
                fontSize: "16px"
              }}>
                Génération en cours...
              </span>
            </div>
            <pre style={{
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              color: "#374151",
              fontSize: "14px",
              lineHeight: "1.6",
              fontFamily: "'Courier New', monospace",
              margin: 0,
              maxHeight: "300px",
              overflowY: "auto"
            }}>
              {streamingText}
            </pre>
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ animation: "slideUp 0.5s ease-out" }}>
            {/* PDF Download Button */}
            <div style={{ 
              display: "flex", 
              gap: "15px", 
              marginBottom: "30px",
              justifyContent: "center"
            }}>
              <button 
                onClick={handleDownloadPDF} 
                style={{ 
                  padding: "14px 30px", 
                  borderRadius: "12px", 
                  background: "linear-gradient(135deg, #ec4899, #f43f5e)",
                  border: "none",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 15px rgba(236, 72, 153, 0.2)"
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 20px rgba(236, 72, 153, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 15px rgba(236, 72, 153, 0.2)";
                }}
              >
                📄 Télécharger PDF
              </button>
            </div>

            {/* Beautiful Cards Grid */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "20px"
            }}>
              {Object.keys(result).map((key, index) => {
                const config = sectionConfig[key] || { icon: "📝", title: key, color: "#6366f1" };
                return (
                  <div 
                    key={key} 
                    style={{
                      background: "white",
                      padding: "25px",
                      borderRadius: "16px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
                      transition: "all 0.3s ease",
                      animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
                      cursor: "default"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-5px)";
                      e.currentTarget.style.boxShadow = `0 8px 30px ${config.color}20`;
                      e.currentTarget.style.borderColor = config.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.05)";
                      e.currentTarget.style.borderColor = "#e5e7eb";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "20px", paddingBottom: "15px", borderBottom: "2px solid #f3f4f6" }}>
                      <span style={{ fontSize: "32px", marginRight: "12px" }}>{config.icon}</span>
                      <h3 style={{ 
                        margin: 0, 
                        fontSize: "20px",
                        fontWeight: "700",
                        color: config.color,
                        letterSpacing: "-0.5px"
                      }}>
                        {config.title}
                      </h3>
                    </div>
                    <div>
                      {formatContent(result[key])}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CSS Animations */}
        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes pulse {
            0%, 100% {
              box-shadow: 0 4px 20px rgba(139, 92, 246, 0.15);
            }
            50% {
              box-shadow: 0 4px 30px rgba(139, 92, 246, 0.3);
            }
          }

          @keyframes blink {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.3;
            }
          }
        `}</style>

      </div>
    </div>
  );
}

export default App;