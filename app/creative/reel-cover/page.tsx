"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Typings for Particle sparks
interface Spark {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export default function ReelCoverShowcase() {
  // Toggle states
  const [safeZones, setSafeZones] = useState(true);
  const [spotlight, setSpotlight] = useState(true);
  const [ribbon, setRibbon] = useState(true);
  const [particles, setParticles] = useState(true);
  const [speedLines, setSpeedLines] = useState(true);
  
  // Customization parameters
  const [warmth, setWarmth] = useState(40); // sepia / warmth percentage (0 to 100)
  const [speed, setSpeed] = useState("elegant"); // elegant | balanced | active
  
  // Detail Drawer toggle
  const [promptOpen, setPromptOpen] = useState(true);

  // Mouse coords for physical spotlight highlight
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const coverRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Track mouse coordinates over the cover preview for the spotlight shader effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!spotlight || !coverRef.current) return;
    const rect = coverRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    // Return spotlight to center when cursor leaves
    setMousePos({ x: 50, y: 50 });
  };

  // Canvas particle sparks emitter loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let sparks: Spark[] = [];
    
    const resizeCanvas = () => {
      if (canvas && coverRef.current) {
        canvas.width = coverRef.current.clientWidth;
        canvas.height = coverRef.current.clientHeight;
      }
    };
    
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Speed multiplier based on control panel selection
    const speedMult = speed === "elegant" ? 0.6 : speed === "balanced" ? 1.0 : 1.6;

    const createSpark = (): Spark => {
      const w = canvas.width;
      const h = canvas.height;
      return {
        x: Math.random() * w,
        y: h + 10,
        size: Math.random() * 2.5 + 0.8,
        speedY: -(Math.random() * 1.5 + 0.5) * speedMult,
        speedX: (Math.random() * 0.6 - 0.3) * speedMult,
        opacity: Math.random() * 0.7 + 0.3,
        life: 0,
        maxLife: Math.random() * 180 + 120,
      };
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (particles) {
        // Spawn rate based on speed
        const spawnChance = speed === "elegant" ? 0.04 : speed === "balanced" ? 0.08 : 0.15;
        if (Math.random() < spawnChance && sparks.length < 50) {
          sparks.push(createSpark());
        }

        sparks = sparks.filter((s) => {
          s.x += s.speedX;
          s.y += s.speedY;
          s.life++;
          
          // Fade sparks as they reach maxLife or float higher
          const lifeRatio = s.life / s.maxLife;
          const currentOpacity = s.opacity * (1 - lifeRatio) * Math.min(1, s.y / (canvas.height * 0.4));
          
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(212, 175, 55, ${currentOpacity})`;
          ctx.shadowBlur = s.size * 2;
          ctx.shadowColor = "rgba(212, 175, 55, 0.4)";
          ctx.fill();

          return s.life < s.maxLife && s.y > -10 && s.x > -10 && s.x < canvas.width + 10;
        });
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [particles, speed]);

  // Speed-based duration constants for ribbon and speed lines
  const ribbonDuration = speed === "elegant" ? "12s" : speed === "balanced" ? "7s" : "4s";
  const speedLineDuration = speed === "elegant" ? "6s" : speed === "balanced" ? "3.5s" : "2.2s";

  return (
    <main className="case-page" style={{ paddingTop: 120, minHeight: "100vh" }}>
      <section className="section" style={{ paddingBottom: 64 }}>
        <div className="wrap">
          {/* Eyebrow & Headline in APAR's agency web style */}
          <div className="tag-line">
            <span>AI Creative Studio · Luxury Retail</span>
            <i className="ln" />
          </div>
          
          <h1 className="display d-xl" style={{ marginTop: 24, maxWidth: "16ch" }}>
            Fast Delivery + <em>Prestige</em>
          </h1>
          
          <p className="lead" style={{ marginTop: 20 }}>
            An interactive showroom mockup of APAR&apos;s custom-crafted Instagram Reel Cover design. 
            Use the control panel to customize visual parameters, toggle Instagram safe-zone margins, 
            and alter physical motion components.
          </p>

          {/* Core Interactive Grid */}
          <div className="rc-showcase-container">
            
            {/* Left Column: Premium phone frame containing the 4:5 Cover Preview */}
            <div className="flex flex-col items-center">
              <div className="rc-phone-mockup">
                <div className="rc-phone-screen">
                  
                  {/* The Cover Frame */}
                  <div
                    ref={coverRef}
                    className="rc-cover-content"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{
                      backgroundImage: `url('/assets/luxury_jewelry_showroom.png')`,
                      filter: `sepia(${warmth / 140}) saturate(${1 + warmth / 300}) contrast(1.02)`,
                      // Inject mouse coordinates as CSS variables for spotlight shader effect
                      ["--mouse-x" as string]: `${mousePos.x}%`,
                      ["--mouse-y" as string]: `${mousePos.y}%`,
                    }}
                  >
                    {/* 1. Dynamic Cursor Spotlight Overlay */}
                    {spotlight && <div className="rc-spotlight" />}

                    {/* 2. Motion Element: Speed Lines */}
                    {speedLines && (
                      <div 
                        className="rc-speed-lines"
                        style={{ ["--speed-duration" as string]: speedLineDuration }}
                      >
                        <div className="rc-speed-line" />
                        <div className="rc-speed-line" />
                        <div className="rc-speed-line" />
                      </div>
                    )}

                    {/* 3. Motion Element: Glowing Courier Ribbon (SVG path animation) */}
                    {ribbon && (
                      <svg 
                        className="rc-ribbon-svg" 
                        viewBox="0 0 400 500"
                        style={{ ["--ribbon-duration" as string]: ribbonDuration }}
                      >
                        <defs>
                          <linearGradient id="gold-ribbon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FFF2D5" stopOpacity="0.1" />
                            <stop offset="25%" stopColor="#E5C158" stopOpacity="0.8" />
                            <stop offset="50%" stopColor="#D4AF37" stopOpacity="1" />
                            <stop offset="75%" stopColor="#B5882B" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#FFF2D5" stopOpacity="0.1" />
                          </linearGradient>
                        </defs>
                        
                        {/* Wavy stroke flowing behind the title and above the showroom counters */}
                        <path
                          className="rc-ribbon-path"
                          strokeDasharray="40, 20"
                          d="M -30 380 C 120 320, 180 200, 430 180"
                        />
                        <path
                          className="rc-ribbon-path"
                          strokeDasharray="60, 30"
                          style={{ animationDelay: "-3s", opacity: 0.5, strokeWidth: 1.5 }}
                          d="M -30 395 C 100 340, 190 220, 430 200"
                        />
                      </svg>
                    )}

                    {/* 4. Motion Element: Ambient Embers Sparks */}
                    <canvas ref={canvasRef} className="rc-embers-canvas" />

                    {/* 5. Typography Layer: Headline & Subheadline */}
                    <div className="rc-text-overlay">
                      <motion.h2 
                        className="rc-headline"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      >
                        ⚡ QUICK DELIVERY
                      </motion.h2>
                      <motion.p 
                        className="rc-subheadline"
                        initial={{ opacity: 0, letterSpacing: "0.1em" }}
                        animate={{ opacity: 0.95, letterSpacing: "0.26em" }}
                        transition={{ duration: 1.2, delay: 0.5 }}
                      >
                        WITHOUT COMPROMISING QUALITY
                      </motion.p>
                    </div>

                    {/* 6. Instagram Interactive UI Overlay (Avatar, User details, Actions) */}
                    <div className="rc-instagram-ui">
                      <div className="rc-ig-profile">
                        <div className="rc-ig-avatar">
                          <div className="rc-ig-avatar-inner" />
                        </div>
                        <span className="rc-ig-username">chhedajewellers</span>
                      </div>
                      <p className="rc-ig-description">
                        ⚡ Quick delivery, lifetime trust. Luxury crafted at the speed of culture. #heritage #gold
                      </p>

                      <div className="rc-ig-actions">
                        <div className="rc-ig-icon">
                          <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                          <span>4.8K</span>
                        </div>
                        <div className="rc-ig-icon">
                          <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                          </svg>
                          <span>182</span>
                        </div>
                        <div className="rc-ig-icon">
                          <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* 7. Instagram Safe Zones Guides */}
                    <AnimatePresence>
                      {safeZones && (
                        <motion.div 
                          className="rc-safe-zones"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {/* 4:5 center square crop margin */}
                          <div className="rc-crop-square" />
                          <div className="rc-safe-zone-label" style={{ top: '10px', left: '10px' }}>
                            4:5 Cover Safe Zone
                          </div>
                          <div className="rc-safe-zone-label" style={{ bottom: '10px', right: '10px', background: 'rgba(235, 59, 37, 0.85)' }}>
                            IG UI Margins
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                </div>
              </div>
              
              <span className="text-xs text-neutral-500 mt-4 tracking-wider uppercase font-semibold">
                Instagram Portrait Preview (4:5 Crop)
              </span>
            </div>

            {/* Right Column: Customization Controls & Design Spec Details */}
            <div className="rc-controls">
              
              {/* Glass Control Card */}
              <div className="rc-glass-card">
                <h2 className="rc-controls-title">
                  <svg className="w-5 h-5 text-[#D4AF37]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Mockup Parameters
                </h2>

                <div className="rc-control-group">
                  
                  {/* Safe Zones Toggle */}
                  <div className="rc-control-row">
                    <div className="rc-control-label">
                      <span className="rc-control-name">Instagram Safe Guides</span>
                      <span className="rc-control-desc">Visualize text margins & feed square crops</span>
                    </div>
                    <label className="rc-switch">
                      <input 
                        type="checkbox" 
                        checked={safeZones} 
                        onChange={(e) => setSafeZones(e.target.checked)} 
                      />
                      <span className="rc-slider" />
                    </label>
                  </div>

                  {/* Spotlight Toggle */}
                  <div className="rc-control-row">
                    <div className="rc-control-label">
                      <span className="rc-control-name">Spotlight Pointer Tracker</span>
                      <span className="rc-control-desc">Hover-reactive luxury light reflection</span>
                    </div>
                    <label className="rc-switch">
                      <input 
                        type="checkbox" 
                        checked={spotlight} 
                        onChange={(e) => setSpotlight(e.target.checked)} 
                      />
                      <span className="rc-slider" />
                    </label>
                  </div>

                  {/* Ribbon Toggle */}
                  <div className="rc-control-row">
                    <div className="rc-control-label">
                      <span className="rc-control-name">Flowing Gold Ribbon</span>
                      <span className="rc-control-desc">Symbolizes fast courier delivery ribbon</span>
                    </div>
                    <label className="rc-switch">
                      <input 
                        type="checkbox" 
                        checked={ribbon} 
                        onChange={(e) => setRibbon(e.target.checked)} 
                      />
                      <span className="rc-slider" />
                    </label>
                  </div>

                  {/* Embers Toggle */}
                  <div className="rc-control-row">
                    <div className="rc-control-label">
                      <span className="rc-control-name">Showroom Gold Particles</span>
                      <span className="rc-control-desc">Ambient gold sparks rising from displays</span>
                    </div>
                    <label className="rc-switch">
                      <input 
                        type="checkbox" 
                        checked={particles} 
                        onChange={(e) => setParticles(e.target.checked)} 
                      />
                      <span className="rc-slider" />
                    </label>
                  </div>

                  {/* Speed Lines Toggle */}
                  <div className="rc-control-row">
                    <div className="rc-control-label">
                      <span className="rc-control-name">Lightning Speed Lines</span>
                      <span className="rc-control-desc">Horizontal sweeps indicating fast shipping</span>
                    </div>
                    <label className="rc-switch">
                      <input 
                        type="checkbox" 
                        checked={speedLines} 
                        onChange={(e) => setSpeedLines(e.target.checked)} 
                      />
                      <span className="rc-slider" />
                    </label>
                  </div>

                  {/* Warmth Slider */}
                  <div className="rc-control-row">
                    <div className="rc-control-label">
                      <span className="rc-control-name">Boutique Warmth</span>
                      <span className="rc-control-desc">Adjust ambient lighting temperature</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400">Cool</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={warmth}
                        onChange={(e) => setWarmth(Number(e.target.value))} 
                        className="rc-range"
                      />
                      <span className="text-xs text-neutral-400">Warm</span>
                    </div>
                  </div>

                  {/* Velocity Segment Control */}
                  <div className="rc-control-row">
                    <div className="rc-control-label">
                      <span className="rc-control-name">Motion Velocity</span>
                      <span className="rc-control-desc">Adjust pacing of active elements</span>
                    </div>
                    <div className="rc-segments">
                      {(["elegant", "balanced", "active"] as const).map((m) => (
                        <button
                          key={m}
                          className={`rc-segment-btn ${speed === m ? "active" : ""}`}
                          onClick={() => setSpeed(m)}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Collapsible Design Spec Drawer */}
              <div className="rc-prompt-drawer">
                <div 
                  className="rc-prompt-header"
                  onClick={() => setPromptOpen(!promptOpen)}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#D4AF37]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Design Specifications
                  </span>
                  <span>
                    {promptOpen ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </span>
                </div>

                <AnimatePresence>
                  {promptOpen && (
                    <motion.div
                      className="rc-prompt-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p>
                        This Instagram Reel Cover combines high-end retail visual triggers with dynamic speed metaphors. 
                        By styling the textual content natively in the DOM rather than flattening it into the image, 
                        the design scales crisp, high-resolution type across all screen sizes and enables dynamic animations.
                      </p>
                      
                      <div className="mt-4">
                        <strong>Visual Hierarchy & Color Scheme:</strong>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-neutral-400">
                          <li><strong>Color Palette:</strong> Deep Obsidian Black (#0d0d0d), Polished Antique Gold (#D4AF37), and Champagne (#f4ede2).</li>
                          <li><strong>Headline Serif:</strong> Set in Newsreader/Bodoni-style serif, tracking wide with a metallic gold gradient.</li>
                          <li><strong>Subheadline:</strong> Set in Archivo sans-serif, uppercase, tracking very wide at 0.26em, centered.</li>
                          <li><strong>Background Environment:</strong> Luxury jewelry boutique with counter displays, warm overhead lighting, and rich glass reflections.</li>
                        </ul>
                      </div>

                      <div className="mt-4">
                        <strong>AI Text Generation Prompt Used:</strong>
                        <div className="rc-prompt-code">
                          {`Photorealistic, ultra-premium editorial photography of a high-end luxury jewelry boutique interior. In the center, a confident and elegant female presenter stands behind a premium black marble display counter filled with gold jewelry. Warm gold lighting, champagne color palette, and premium glass reflections. A sleek luxury jewelry box with a gold ribbon sits on the counter. The image has a portrait 4:5 aspect ratio, clean composition, high-end advertising campaign quality, sharp focus, cinematic lighting.`}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
