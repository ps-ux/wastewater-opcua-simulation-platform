// OPC UA Architecture Presentation Page - Fullscreen presentation view

'use client';

import * as React from 'react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { usePumpStore } from '@/stores/pump-store';
import { usePumpWebSocket } from '@/hooks/use-pump-websocket';
import { Server, Zap, Activity, Info, Play, RefreshCw, Layers, ShieldCheck, Database, LayoutGrid } from 'lucide-react';

const TOTAL_SLIDES = 18;

export default function ArchitecturePage() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const [isPacketWalking, setIsPacketWalking] = useState(false);
  const [simStatus, setSimStatus] = useState<string>("");
  const [commModel, setCommModel] = useState<string>("");
  const { pumps, pumpData, fetchPumps } = usePumpStore();
  const { isConnected } = usePumpWebSocket();

  useEffect(() => {
    fetchPumps();
  }, [fetchPumps]);

  const packetAnimRef = useRef<number>(0);

  const goToSlide = useCallback((n: number) => {
    let target = n;
    if (target < 1) target = 1;
    if (target > TOTAL_SLIDES) target = TOTAL_SLIDES;
    setCurrentSlide(target);
    const el = document.getElementById('slide-' + target);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        nextSlide();
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevSlide();
        e.preventDefault();
      } else if (e.key === 'Home') {
        goToSlide(1);
        e.preventDefault();
      } else if (e.key === 'End') {
        goToSlide(TOTAL_SLIDES);
        e.preventDefault();
      } else if (e.key === 'd') {
        // 'd' for Dashboard
        window.location.href = '/';
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, goToSlide]);

  // Intersection observer for scroll detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const num = parseInt(entry.target.id.replace('slide-', ''));
            if (!isNaN(num)) {
              setCurrentSlide(num);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    for (let i = 1; i <= TOTAL_SLIDES; i++) {
      const el = document.getElementById('slide-' + i);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style jsx global>{`
        :root {
          --bg-dark: #0a0e17;
          --bg-card: #111827;
          --bg-elevated: #1a2234;
          --accent-cyan: #00d4ff;
          --accent-green: #10b981;
          --accent-orange: #f59e0b;
          --accent-red: #ef4444;
          --accent-purple: #8b5cf6;
          --accent-pink: #ec4899;
          --text-primary: #f1f5f9;
          --text-secondary: #94a3b8;
          --text-muted: #64748b;
          --border-color: #1e293b;
        }

        .presentation-container {
          font-family: 'Space Grotesk', sans-serif;
          background: var(--bg-dark);
          color: var(--text-primary);
          line-height: 1.6;
          min-height: 100vh;
        }

        .presentation-container::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: linear-gradient(rgba(0, 212, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.02) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .pres-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(10, 14, 23, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--border-color);
          z-index: 1000;
          padding: 0.6rem 1.5rem;
        }

        .pres-nav-inner {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .pres-nav-logo {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1rem;
          font-weight: 700;
          color: var(--accent-cyan);
        }

        .pres-nav-logo span {
          color: var(--text-muted);
        }

        .pres-nav-controls {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .slide-counter {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          color: var(--text-secondary);
          background: var(--bg-elevated);
          padding: 0.35rem 0.7rem;
          border-radius: 5px;
        }

        .pres-nav-btn {
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.35rem 0.7rem;
          border-radius: 5px;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.8rem;
          transition: all 0.2s;
        }

        .pres-nav-btn:hover {
          background: var(--accent-cyan);
          color: var(--bg-dark);
        }

        .slide {
          min-height: 100vh;
          padding: 70px 1.5rem 1.5rem;
          max-width: 1300px;
          margin: 0 auto;
        }

        .title-slide {
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .title-slide h1 {
          font-size: clamp(2rem, 5vw, 3.5rem);
          background: linear-gradient(135deg, var(--accent-cyan), var(--accent-green));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }

        .title-slide .subtitle {
          font-size: clamp(0.9rem, 2vw, 1.3rem);
          color: var(--text-secondary);
        }

        .title-meta {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-top: 1.5rem;
        }

        .meta-item {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
        }

        .meta-item .label {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .meta-item .value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          color: var(--accent-cyan);
        }

        .section-header {
          margin-bottom: 1.5rem;
        }

        .section-number {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          color: var(--accent-cyan);
          letter-spacing: 1.5px;
          margin-bottom: 0.4rem;
        }

        .section-title {
          font-size: clamp(1.5rem, 3.5vw, 2.2rem);
          font-weight: 700;
          margin-bottom: 0.4rem;
        }

        .section-goal {
          font-size: 0.9rem;
          color: var(--text-secondary);
          padding-left: 0.8rem;
          border-left: 2px solid var(--accent-green);
        }

        .content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .content-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 1.2rem;
          transition: all 0.2s;
        }

        .content-card:hover {
          border-color: var(--accent-cyan);
          transform: translateY(-2px);
        }

        .content-card h3 {
          font-size: 1rem;
          color: var(--accent-cyan);
          margin-bottom: 0.6rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .content-card h3 .icon {
          width: 24px;
          height: 24px;
          background: rgba(0, 212, 255, 0.1);
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
        }

        .content-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .content-card li {
          padding: 0.3rem 0;
          color: var(--text-secondary);
          padding-left: 1rem;
          font-size: 0.9rem;
          position: relative;
        }

        .content-card li::before {
          content: '▸';
          position: absolute;
          left: 0;
          color: var(--accent-green);
        }

        .diagram-container {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 1.2rem;
          margin: 1rem 0;
        }

        .diagram-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 0.8rem;
        }

        .diagram-title::before {
          content: '◆ ';
          color: var(--accent-cyan);
        }

        svg {
          max-width: 100%;
          height: auto;
        }

        svg text {
          font-family: 'JetBrains Mono', monospace;
        }

        .comparison-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .comparison-table th,
        .comparison-table td {
          padding: 0.6rem 0.8rem;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }

        .comparison-table th {
          background: var(--bg-elevated);
          color: var(--accent-cyan);
          font-size: 0.7rem;
          text-transform: uppercase;
        }

        .comparison-table td {
          color: var(--text-secondary);
        }

        .code-block {
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 0.8rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          margin: 0.6rem 0;
        }

        .code-block .comment {
          color: var(--text-muted);
        }

        .code-block .keyword {
          color: var(--accent-purple);
        }

        .code-block .string {
          color: var(--accent-green);
        }

        .code-block .number {
          color: var(--accent-orange);
        }

        .highlight-box {
          background: linear-gradient(135deg, rgba(0, 212, 255, 0.08), rgba(16, 185, 129, 0.08));
          border: 1px solid var(--accent-cyan);
          border-radius: 8px;
          padding: 1rem 1.2rem;
          margin: 1rem 0;
        }

        .highlight-box.warning {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(239, 68, 68, 0.08));
          border-color: var(--accent-orange);
        }

        .highlight-box p {
          font-size: 0.95rem;
          margin: 0;
        }

        .highlight-box strong {
          color: var(--accent-cyan);
        }

        .highlight-box.warning strong {
          color: var(--accent-orange);
        }

        .two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        @media (max-width: 800px) {
          .two-column {
            grid-template-columns: 1fr;
          }
        }

        .node-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.6rem;
          margin: 0.8rem 0;
        }

        @media (max-width: 800px) {
          .node-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .node-item {
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 0.6rem;
          text-align: center;
        }

        .node-item:hover {
          border-color: var(--accent-cyan);
        }

        .node-item .name {
          font-family: 'JetBrains Mono', monospace;
          color: var(--accent-cyan);
          font-weight: 600;
          font-size: 0.8rem;
        }

        .node-item .desc {
          font-size: 0.65rem;
          color: var(--text-muted);
        }

        .agenda-grid {
          display: grid;
          gap: 0.4rem;
        }

        .agenda-item {
          display: grid;
          grid-template-columns: 90px 1fr;
          gap: 0.8rem;
          align-items: center;
          padding: 0.6rem 1rem;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 6px;
        }

        .agenda-item:hover {
          border-color: var(--accent-cyan);
          transform: translateX(3px);
        }

        .agenda-time {
          font-family: 'JetBrains Mono', monospace;
          color: var(--accent-green);
          font-weight: 600;
          font-size: 0.8rem;
        }

        .agenda-topic {
          font-size: 0.9rem;
        }

        .status-badge {
          display: inline-flex;
          padding: 0.15rem 0.4rem;
          border-radius: 10px;
          font-size: 0.6rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.current {
          background: rgba(16, 185, 129, 0.2);
          color: var(--accent-green);
        }

        .status-badge.deprecated {
          background: rgba(239, 68, 68, 0.2);
          color: var(--accent-red);
        }

        .status-badge.testing {
          background: rgba(245, 158, 11, 0.2);
          color: var(--accent-orange);
        }

        .quote {
          font-size: 1.1rem;
          font-style: italic;
          color: var(--text-secondary);
          text-align: center;
          padding: 1.5rem;
          border-left: 3px solid var(--accent-cyan);
          background: var(--bg-card);
          border-radius: 8px;
          margin: 1.5rem 0;
        }

        .quote strong {
          color: var(--accent-cyan);
          font-style: normal;
        }

        .packet-display {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
          justify-content: center;
          margin: 1rem 0;
        }

        .packet {
          background: var(--bg-elevated);
          border: 2px solid var(--border-color);
          border-radius: 6px;
          padding: 0.5rem 1rem;
          text-align: center;
          min-width: 70px;
        }

        .packet.hel {
          border-color: var(--accent-cyan);
        }

        .packet.ack {
          border-color: var(--accent-green);
        }

        .packet.opn {
          border-color: var(--accent-orange);
        }

        .packet.msg {
          border-color: var(--accent-purple);
        }

        .packet.clo {
          border-color: var(--accent-red);
        }

        .packet .type {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .packet.hel .type {
          color: var(--accent-cyan);
        }

        .packet.ack .type {
          color: var(--accent-green);
        }

        .packet.opn .type {
          color: var(--accent-orange);
        }

        .packet.msg .type {
          color: var(--accent-purple);
        }

        .packet.clo .type {
          color: var(--accent-red);
        }

        .packet .desc {
          font-size: 0.6rem;
          color: var(--text-muted);
        }

        .packet-arrow {
          color: var(--text-muted);
          display: flex;
          align-items: center;
        }

        /* New Interactive Styles */
        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.2rem 0.6rem;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid var(--accent-green);
          border-radius: 20px;
          font-size: 0.7rem;
          color: var(--accent-green);
          font-weight: 600;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          background: var(--accent-green);
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }

        .layer-hover:hover {
          filter: drop-shadow(0 0 8px var(--accent-cyan));
          cursor: pointer;
        }

        .data-packet {
          filter: drop-shadow(0 0 3px var(--accent-cyan));
        }

        .btn-action {
          background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 5px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
          font-size: 0.8rem;
          margin-top: 1rem;
        }

        .btn-action:hover {
          transform: scale(1.05);
          filter: brightness(1.1);
        }

        .float-dashboard {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: var(--bg-card);
          border: 1px solid var(--accent-cyan);
          border-radius: 12px;
          padding: 1rem;
          width: 280px;
          z-index: 1001;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .float-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .float-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--accent-cyan);
          text-transform: uppercase;
        }

        @media print {
          .pres-nav, .float-dashboard {
            display: none;
          }
          .slide {
            page-break-after: always;
            min-height: auto;
            padding: 1rem;
          }
        }
      `}</style>

      <link
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div className="presentation-container">
        {/* Navigation */}
        <nav className="pres-nav">
          <div className="pres-nav-inner">
            <div className="pres-nav-logo">
              OPC<span>::</span>UA<span>::</span>Presentation
            </div>
            <div className="pres-nav-controls">
              <select
                className="pres-nav-btn"
                value={currentSlide}
                onChange={(e) => goToSlide(parseInt(e.target.value))}
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
              >
                {[...Array(TOTAL_SLIDES)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Slide {i + 1}</option>
                ))}
              </select>
              <a href="/" className="pres-nav-btn" style={{ textDecoration: 'none', background: 'rgba(0, 212, 255, 0.1)', borderColor: 'var(--accent-cyan)' }}>
                Go to Dashboard
              </a>
              <span className="slide-counter">
                {currentSlide} / {TOTAL_SLIDES}
              </span>
              <button className="pres-nav-btn" onClick={prevSlide}>
                ←
              </button>
              <button className="pres-nav-btn" onClick={nextSlide}>
                →
              </button>
            </div>
          </div>
        </nav>

        {/* Slide 1: Title */}
        <section className="slide title-slide" id="slide-1">
          <div style={{ position: 'absolute', top: '100px', right: '50px' }}>
            <div className="live-badge" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              <div className="pulse-dot" />
              {isConnected ? 'OPC UA SERVER CONNECTED' : 'OFFLINE'}
            </div>
          </div>
          <h1>OPC UA Architecture</h1>
          <p className="subtitle">Complete Learning & Demonstration Guide</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            A Practical OPC UA Client–Server Demonstration Using RC Wastewater Treatment Pump Model
          </p>
          <div className="title-meta">
            <div className="meta-item">
              <div className="label">Spec</div>
              <div className="value">v1.05.06 (Oct 2025)</div>
            </div>
            <div className="meta-item">
              <div className="label">Simulation</div>
              <div className="value">{Object.keys(pumpData).length} Assets Live</div>
            </div>
            <div className="meta-item">
              <div className="label">Discovery</div>
              <div className="value">opc.tcp://localhost:4840</div>
            </div>
          </div>
          <div className="diagram-container" style={{ marginTop: '1.5rem' }}>
            <svg viewBox="0 0 800 140" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="water" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#00d4ff', stopOpacity: 0.2 }} />
                  <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0.2 }} />
                </linearGradient>
              </defs>
              <path d="M120 70 L200 70" stroke="#1a2234" strokeWidth="5" />
              <path d="M280 70 L360 70" stroke="#1a2234" strokeWidth="5" />
              <path d="M440 70 L520 70" stroke="#1a2234" strokeWidth="5" />
              <path d="M600 70 L680 70" stroke="#1a2234" strokeWidth="5" />
              <circle r="3" fill="#00d4ff">
                <animateMotion dur="3s" repeatCount="indefinite" path="M120 70 L680 70" />
              </circle>
              {/* Influent */}
              <g transform="translate(40,25)">
                <rect width="80" height="90" rx="5" fill="#111827" stroke="#00d4ff" strokeWidth="1.5" />
                <text x="40" y="20" fill="#00d4ff" fontSize="8" textAnchor="middle" fontWeight="600">INFLUENT</text>
                <circle cx="40" cy="55" r="15" fill="none" stroke="#10b981" strokeWidth="1.5" />
                <circle cx="40" cy="55" r="5" fill="#10b981">
                  <animateTransform attributeName="transform" type="rotate" from="0 40 55" to="360 40 55" dur="2s" repeatCount="indefinite" />
                </circle>
              </g>
              {/* Aeration */}
              <g transform="translate(200,25)">
                <rect width="80" height="90" rx="5" fill="#111827" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="40" y="20" fill="#f59e0b" fontSize="8" textAnchor="middle" fontWeight="600">AERATION</text>
                <rect x="10" y="35" width="60" height="40" fill="url(#water)" rx="3" />
                <circle cx="25" cy="60" r="2" fill="#00d4ff" opacity="0.5">
                  <animate attributeName="cy" from="68" to="42" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="40" cy="55" r="2" fill="#00d4ff" opacity="0.5">
                  <animate attributeName="cy" from="68" to="42" dur="1.2s" repeatCount="indefinite" begin="0.3s" />
                </circle>
                <circle cx="55" cy="60" r="2" fill="#00d4ff" opacity="0.5">
                  <animate attributeName="cy" from="68" to="42" dur="1.8s" repeatCount="indefinite" begin="0.6s" />
                </circle>
              </g>
              {/* Clarifier */}
              <g transform="translate(360,25)">
                <rect width="80" height="90" rx="5" fill="#111827" stroke="#8b5cf6" strokeWidth="1.5" />
                <text x="40" y="20" fill="#8b5cf6" fontSize="8" textAnchor="middle" fontWeight="600">CLARIFIER</text>
                <path d="M15 40 L65 40 L55 80 L25 80 Z" fill="none" stroke="#8b5cf6" strokeWidth="1" />
                <rect x="20" y="60" width="40" height="12" fill="rgba(139,92,246,0.3)" />
              </g>
              {/* Sludge */}
              <g transform="translate(520,25)">
                <rect width="80" height="90" rx="5" fill="#111827" stroke="#ec4899" strokeWidth="1.5" />
                <text x="40" y="20" fill="#ec4899" fontSize="8" textAnchor="middle" fontWeight="600">SLUDGE</text>
                <ellipse cx="40" cy="55" rx="25" ry="15" fill="none" stroke="#ec4899" strokeWidth="1" />
                <circle cx="40" cy="55" r="8" fill="rgba(236,72,153,0.3)" />
              </g>
              {/* Effluent */}
              <g transform="translate(680,50)">
                <text x="0" y="15" fill="#10b981" fontSize="8" fontWeight="600">EFFLUENT</text>
                <path d="M5 30 Q20 22 35 30 Q50 38 65 30" stroke="#10b981" strokeWidth="1.5" fill="none" />
              </g>
              <text x="400" y="130" fill="#00d4ff" fontSize="8" textAnchor="middle" opacity="0.5">
                Connected via OPC UA semantic models
              </text>
            </svg>
          </div>
        </section>

        {/* Slide 2: Agenda */}
        <section className="slide" id="slide-2">
          <div className="section-header">
            <div className="section-number">AGENDA</div>
          </div>
          <div className="agenda-grid">
            {[
              'Introduction: Why OPC UA Exists',
              'Core Concepts: Client–Server & PubSub',
              'Address Space & Information Modeling',
              'Services, Data Access & Historical Aggregates',
              'Network, Transport & Security Architecture',
              'Discovery, Scalability & Edge Deployments',
              'PubSub Deep Dive & Tooling',
              'Demo',
            ].map((topic, i) => (
              <div key={i} className="agenda-item">
                <span className="agenda-time">{i + 1}.</span>
                <span className="agenda-topic">{topic}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Slide 3: Historical Challenges */}
        <section className="slide" id="slide-3">
          <div className="section-header">
            <div className="section-number">SECTION 01 • 0–5 MINUTES</div>
            <h2 className="section-title">Industrial Reality Before OPC UA</h2>
            <p className="section-goal">Goal: Establish why OPC UA exists</p>
          </div>
          <div className="content-grid">
            <div className="content-card">
              <h3><span className="icon">⚠</span> Historical Challenges</h3>
              <ul>
                <li>Vendor lock-in (each PLC spoke its own language)</li>
                <li>Proprietary & undocumented protocols</li>
                <li>Flat tag lists with no semantics</li>
                <li>Security added externally (if at all)</li>
              </ul>
            </div>
            <div className="content-card">
              <h3><span className="icon">🏭</span> Wastewater Reality</h3>
              <div className="code-block">
                <span className="comment">// PLC 1 (Siemens)</span><br />
                DB12.DBW34 = <span className="number">1450</span> <span className="comment">// What is this?</span><br /><br />
                <span className="comment">// PLC 2 (Allen-Bradley)</span><br />
                <span className="number">40001</span> = <span className="number">75.3</span> <span className="comment">// Tank level?</span>
              </div>
            </div>
          </div>
        </section>

        {/* Slide 4: Classic OPC vs OPC UA */}
        <section className="slide" id="slide-4">
          <div className="section-header">
            <div className="section-number">SECTION 01 • EVOLUTION</div>
            <h2 className="section-title">Classic OPC vs OPC UA</h2>
          </div>
          <div className="two-column">
            <div className="content-card" style={{ borderColor: '#ef4444' }}>
              <h3 style={{ color: '#ef4444' }}>
                <span className="icon" style={{ background: 'rgba(239,68,68,0.1)' }}>📦</span> Classic OPC
              </h3>
              <ul>
                <li>Windows + DCOM dependent</li>
                <li>No encryption</li>
                <li>Not firewall friendly</li>
                <li>Data only (no semantics)</li>
              </ul>
              <div style={{ marginTop: '0.6rem', padding: '0.4rem', background: 'rgba(239,68,68,0.1)', borderRadius: '5px' }}>
                <span className="status-badge deprecated">Legacy</span>
              </div>
            </div>
            <div className="content-card" style={{ borderColor: '#10b981' }}>
              <h3 style={{ color: '#10b981' }}>
                <span className="icon" style={{ background: 'rgba(16,185,129,0.1)' }}>🚀</span> OPC UA
              </h3>
              <ul>
                <li>Platform independent</li>
                <li>Secure by design</li>
                <li>Firewall friendly</li>
                <li>Information-model driven</li>
              </ul>
              <div style={{ marginTop: '0.6rem', padding: '0.4rem', background: 'rgba(16,185,129,0.1)', borderRadius: '5px' }}>
                <span className="status-badge current">Current</span>
              </div>
            </div>
          </div>
          <div className="highlight-box" style={{ marginTop: '1rem' }}>
            <p><strong>OPC UA is a Platform, Not Just a Protocol</strong></p>
            <p style={{ marginTop: '0.3rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Communication Protocol + Information Modeling + Security Framework + Scalable Architecture
            </p>
          </div>
        </section>

        {/* Slide 5: Purdue Model */}
        <section className="slide" id="slide-5">
          <div className="section-header">
            <div className="section-number">SECTION 01 • ARCHITECTURE</div>
            <h2 className="section-title flex items-center gap-3">
              Where OPC UA Fits: Purdue Model
              <span className="live-badge">
                <div className="pulse-dot" />
                Live Network Active
              </span>
            </h2>
          </div>
          <div className="two-column" style={{ gridTemplateColumns: 'minmax(0, 1.5fr) 1fr' }}>
            <div className="diagram-container" style={{ position: 'relative' }}>
              <div className="diagram-title">Purdue Model with OPC UA Backbone</div>
              <svg viewBox="0 0 800 550" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="backbone" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#00d4ff', stopOpacity: 0.7 }} />
                    <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0.7 }} />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Vertical Backbone */}
                <rect x="720" y="25" width="35" height="500" rx="5" fill="url(#backbone)" opacity="0.3" />
                <rect x="720" y="25" width="35" height="500" rx="5" fill="none" stroke="#00d4ff" strokeWidth="1.5" />
                <text x="737" y="275" fill="#00d4ff" fontSize="9" textAnchor="middle" transform="rotate(-90,737,275)" fontWeight="600">OPC UA BACKBONE</text>

                {/* Levels - Each level is now interactive */}
                {[
                  { level: 5, name: 'ENTERPRISE', color: '#8b5cf6', sub: 'ERP • Business Planning • Cloud', y: 25 },
                  { level: 4, name: 'SITE BUSINESS', color: '#ec4899', sub: 'MES • Scheduling • KPI', y: 115 },
                  { level: 3, name: 'SITE OPERATIONS', color: '#f59e0b', sub: 'SCADA • HMI • Batch', y: 205 },
                  { level: 2, name: 'AREA CONTROL', color: '#10b981', sub: 'PLCs • DCS • RTUs', y: 295 },
                  { level: 1, name: 'BASIC CONTROL', color: '#00d4ff', sub: 'Sensors • Actuators • I/O', y: 385 },
                ].map((l) => (
                  <g key={l.level}
                    className="layer-hover"
                    onClick={() => setActiveLayer(l.level)}
                    transform={`translate(40,${l.y})`}>
                    <rect width="650" height="60" rx="8"
                      fill={activeLayer === l.level ? 'rgba(0, 212, 255, 0.1)' : '#111827'}
                      stroke={activeLayer === l.level ? l.color : '#1e293b'}
                      strokeWidth={activeLayer === l.level ? 2.5 : 1}
                      style={{ transition: 'all 0.3s' }} />
                    <text x="16" y="24" fill={l.color} fontSize="14" fontWeight="800">LEVEL {l.level} — {l.name}</text>
                    <text x="16" y="46" fill="#94a3b8" fontSize="11" fontWeight="500">{l.sub}</text>

                    {/* Connection to backbone */}
                    <line x1="650" y1="30" x2="680" y2="30" stroke={l.color} strokeWidth="1" strokeDasharray="3,3" />

                    {/* Active indicators */}
                    {activeLayer === l.level && (
                      <circle cx="640" cy="30" r="4" fill={l.color} filter="url(#glow)">
                        <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
                      </circle>
                    )}
                  </g>
                ))}

                {/* Level 0 */}
                <g transform="translate(40,485)">
                  <rect width="650" height="40" rx="8" fill="#0a0e17" stroke="#334155" />
                  <text x="325" y="25" fill="#64748b" fontSize="12" textAnchor="middle" fontWeight="700">LEVEL 0 — PHYSICAL PROCESS (Wastewater Simulation)</text>
                </g>

                {/* Animated Data Packet */}
                {isPacketWalking && (
                  <g className="data-packet">
                    <circle r="9" fill="#00d4ff" filter="url(#glow)">
                      <animateMotion
                        dur="15s"
                        path="M70 505 L70 415 L737 415 L737 325 L737 235 L737 145 L737 55 L680 55"
                        keyPoints="0;0;0.1;0.1;0.2;0.4;0.4;0.6;0.6;0.8;0.8;1;1"
                        keyTimes="0;0.13;0.17;0.3;0.33;0.47;0.5;0.63;0.67;0.8;0.83;0.97;1"
                        calcMode="linear"
                        fill="freeze"
                      />
                    </circle>
                    <text fontSize="10" fill="white" fontWeight="900" textAnchor="middle" dy="-14">
                      <animateMotion
                        dur="15s"
                        path="M70 505 L70 415 L737 415 L737 325 L737 235 L737 145 L737 55 L680 55"
                        keyPoints="0;0;0.1;0.1;0.2;0.4;0.4;0.6;0.6;0.8;0.8;1;1"
                        keyTimes="0;0.13;0.17;0.3;0.33;0.47;0.5;0.63;0.67;0.8;0.83;0.97;1"
                        calcMode="linear"
                        fill="freeze"
                      />
                      DATA_PACKET
                    </text>
                  </g>
                )}
              </svg>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  className="btn-action"
                  onClick={() => {
                    setIsPacketWalking(true);
                    setSimStatus("Dwell: Level 0 (Process)...");
                    setCommModel("NA");
                    setActiveLayer(0);

                    const steps = [
                      { t: 2500, l: 1, s: "Dwell: Level 1 (I/O)...", m: "CLIENT-SERVER" },
                      { t: 5000, l: 2, s: "Dwell: Level 2 (PLC)...", m: "CLIENT-SERVER" },
                      { t: 7500, l: 3, s: "Dwell: Level 3 (SCADA)...", m: "CLIENT-SERVER" },
                      { t: 10000, l: 4, s: "Dwell: Level 4 (Business)...", m: "PUB-SUB" },
                      { t: 12500, l: 5, s: "Dwell: Level 5 (Cloud)...", m: "PUB-SUB" },
                    ];

                    steps.forEach(step => {
                      setTimeout(() => {
                        setActiveLayer(step.l);
                        setSimStatus(step.s);
                        setCommModel(step.m);
                      }, step.t);
                    });

                    setTimeout(() => {
                      setIsPacketWalking(false);
                      setSimStatus("");
                      setCommModel("");
                    }, 15500);
                  }}
                  disabled={isPacketWalking}
                >
                  <Play size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Simulate Data Flow (L0 → L5)
                </button>
                {activeLayer && (
                  <button
                    className="btn-action"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    onClick={() => setActiveLayer(null)}
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>

            <div className="content-card">
              <h3>
                <Info size={16} />
                {isPacketWalking ? "LIVE STREAMING LOG" : (activeLayer ? `Level ${activeLayer} Context` : 'Select a Layer')}
              </h3>
              {isPacketWalking ? (
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--accent-cyan)', animation: 'pulse 2s infinite' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="pulse-dot" />
                      <span className="text-[10px] font-black tracking-widest text-cyan-400">STATUS: {simStatus}</span>
                    </div>
                    {commModel !== "NA" && commModel !== "" && (
                      <div className={`px-2 py-0.5 rounded text-[8px] font-bold border ${commModel === "PUB-SUB" ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'}`}>
                        {commModel}
                      </div>
                    )}
                  </div>
                  <div className="font-mono text-[11px] text-slate-400 space-y-1">
                    <div>&gt; RAW_FLOW: {(Math.random() * 5000).toFixed(0)} m3/h</div>
                    <div>&gt; PROTOCOL: OPC_UA_BINARY</div>
                    <div>&gt; ENCRYPTION: AES_256_SHA256</div>
                    <div>&gt; TARGET_NS: namespace=1;s=IPS_PMP_001.Flow</div>
                  </div>
                </div>
              ) : !activeLayer ? (
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  Click on a layer in the Purdue model to see how OPC UA functions at that level and how it interacts with the wastewater simulation.
                </p>
              ) : (
                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                  {activeLayer === 5 && (
                    <ul style={{ fontSize: '1rem', lineHeight: '1.8' }}>
                      <li><strong>Role:</strong> Enterprise Strategy</li>
                      <li><strong>OPC UA Use:</strong> PubSub to Azure/AWS IoT Hubs for plant-wide analytics.</li>
                      <li><strong>Demo Link:</strong> View enterprise KPIs in Dashboard.</li>
                    </ul>
                  )}
                  {activeLayer === 4 && (
                    <ul style={{ fontSize: '1rem', lineHeight: '1.8' }}>
                      <li><strong>Role:</strong> Site Management</li>
                      <li><strong>OPC UA Use:</strong> Aggregating multiple servers into a Unified Namespace (UNS).</li>
                      <li><strong>Data:</strong> Historical Access (HA) for compliance reporting.</li>
                    </ul>
                  )}
                  {activeLayer === 3 && (
                    <ul style={{ fontSize: '1rem', lineHeight: '1.8' }}>
                      <li><strong>Role:</strong> Control Room</li>
                      <li><strong>OPC UA Use:</strong> Client-Server for the SCADA/HMI dashboard you use.</li>
                      <li><strong>Real-time:</strong> High-frequency subscriptions (100ms) for pump monitoring.</li>
                    </ul>
                  )}
                  {activeLayer === 2 && (
                    <ul style={{ fontSize: '1rem', lineHeight: '1.8' }}>
                      <li><strong>Role:</strong> Area Control</li>
                      <li><strong>OPC UA Use:</strong> PLC-to-PLC communication using OPC UA FX.</li>
                      <li><strong>Security:</strong> X.509 Certificate-based trust between controllers.</li>
                    </ul>
                  )}
                  {activeLayer === 1 && (
                    <ul style={{ fontSize: '1rem', lineHeight: '1.8' }}>
                      <li><strong>Role:</strong> Field Devices</li>
                      <li><strong>OPC UA Use:</strong> OPC UA Nano/Micro profiles in smart pumps.</li>
                      <li><strong>Impact:</strong> Semantic data (e.g., "Pump_1.BearingTemp") at the source.</li>
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Slide 6: Communication Models */}
        <section className="slide" id="slide-6">
          <div className="section-header">
            <div className="section-number">SECTION 02 • 5–12 MINUTES</div>
            <h2 className="section-title">Communication Models</h2>
            <p className="section-goal">Goal: Build foundational mental model</p>
          </div>
          <div className="content-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="content-card">
              <h3><span className="icon">🔄</span> Client–Server</h3>
              <ul>
                <li>Interactive control</li>
                <li>Stateful sessions</li>
                <li>Bidirectional</li>
                <li>SCADA, HMI, Engineering</li>
              </ul>
            </div>
            <div className="content-card">
              <h3><span className="icon">📡</span> PubSub</h3>
              <ul>
                <li>Scalable distribution</li>
                <li>Stateless</li>
                <li>Decoupled (read-only)</li>
                <li>Cloud, Analytics, Historian</li>
              </ul>
            </div>
          </div>
          <div className="highlight-box">
            <p><strong>Client–Server</strong> for control and interaction • <strong>PubSub</strong> for massive scale telemetry distribution</p>
          </div>
        </section>

        {/* Slide 7: SecureChannel vs Session */}
        <section className="slide" id="slide-7">
          <div className="section-header">
            <div className="section-number">SECTION 02 • SECURITY LAYERS</div>
            <h2 className="section-title">SecureChannel vs Session</h2>
            <p className="section-goal">Goal: Understand two layers of protection</p>
          </div>
          <div className="content-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="content-card" style={{ borderColor: '#8b5cf6' }}>
              <h3 style={{ color: '#8b5cf6' }}>
                <span className="icon" style={{ background: 'rgba(139,92,246,0.1)' }}>🔒</span> SecureChannel
              </h3>
              <ul>
                <li>Cryptographic protection</li>
                <li>Encrypts & signs messages</li>
                <li>TLS-like security</li>
                <li>Protects the PIPE</li>
              </ul>
            </div>
            <div className="content-card" style={{ borderColor: '#f59e0b' }}>
              <h3 style={{ color: '#f59e0b' }}>
                <span className="icon" style={{ background: 'rgba(245,158,11,0.1)' }}>👤</span> Session
              </h3>
              <ul>
                <li>User conversation context</li>
                <li>Authentication identity</li>
                <li>Authorization scope</li>
                <li>Protects the INTENT</li>
              </ul>
            </div>
          </div>
          <div className="highlight-box">
            <p><strong>SecureChannel</strong> protects the <em>pipe</em> (cryptographic transport) • <strong>Session</strong> protects the <em>intent</em> (user identity and context)</p>
          </div>
        </section>

        {/* Slide 8: Address Space */}
        <section className="slide" id="slide-8">
          <div className="section-header">
            <div className="section-number">SECTION 03 • 12–22 MINUTES</div>
            <h2 className="section-title">Address Space: Heart of OPC UA</h2>
            <p className="section-goal">Goal: Explain semantics and structure</p>
          </div>
          <div className="two-column">
            <div className="content-card" style={{ borderColor: '#ef4444' }}>
              <h3 style={{ color: '#ef4444' }}>
                <span className="icon" style={{ background: 'rgba(239,68,68,0.1)' }}>❌</span> NOT Flat Tags
              </h3>
              <div className="code-block" style={{ height: '140px' }}>
                <span className="comment">// Traditional Modbus/S7 approach</span><br />
                HR_40001 = <span className="number">1450</span><br />
                HR_40002 = <span className="number">75.3</span><br />
                <span className="comment">// If documentation is lost, meaning is lost.</span>
              </div>
            </div>
            <div className="content-card" style={{ borderColor: '#10b981' }}>
              <h3 style={{ color: '#10b981' }}>
                <span className="icon" style={{ background: 'rgba(16,185,129,0.1)' }}>✓</span> Graph of Nodes
              </h3>
              <div className="code-block" style={{ height: '140px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                  <span className="live-badge" style={{ fontSize: '0.6rem' }}>Live Graph</span>
                </div>
                <span className="comment">// OPC UA Information Model</span><br />
                Pump_01 <span className="comment">(Instance of PumpType)</span><br />
                &nbsp;├─ Speed = <span className="number">{(Object.values(pumpData)[0]?.rpm || 1450).toFixed(0)}</span> <span className="keyword">RPM</span><br />
                &nbsp;├─ Status = <span className="string">{Object.values(pumpData)[0]?.is_running ? 'Running' : 'Stopped'}</span><br />
                &nbsp;└─ Power = <span className="number">{(Object.values(pumpData)[0]?.power_consumption || 12.4).toFixed(1)}</span> <span className="keyword">kW</span>
              </div>
            </div>
          </div>
          <div className="diagram-container" style={{ textAlign: 'center' }}>
            <div className="diagram-title">Hierarchical Reference Model</div>
            <svg viewBox="0 0 600 120" xmlns="http://www.w3.org/2000/svg">
              <circle cx="300" cy="30" r="20" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" />
              <text x="300" y="34" fill="var(--accent-cyan)" fontSize="8" textAnchor="middle">Objects</text>

              <line x1="300" y1="50" x2="200" y2="90" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4" />
              <line x1="300" y1="50" x2="400" y2="90" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4" />

              <rect x="170" y="90" width="60" height="20" rx="3" fill="var(--bg-elevated)" stroke="var(--accent-green)" />
              <text x="200" y="103" fill="var(--accent-green)" fontSize="7" textAnchor="middle">Pump_1</text>

              <rect x="370" y="90" width="60" height="20" rx="3" fill="var(--bg-elevated)" stroke="var(--accent-green)" />
              <text x="400" y="103" fill="var(--accent-green)" fontSize="7" textAnchor="middle">Pump_2</text>

              <text x="250" y="70" fill="var(--text-muted)" fontSize="6" transform="rotate(-22,250,70)">Organizes</text>
              <text x="350" y="70" fill="var(--text-muted)" fontSize="6" transform="rotate(22,350,70)">Organizes</text>
            </svg>
          </div>
          <div className="highlight-box">
            <p><strong>Address Space</strong> is a graph-based model where nodes represent assets and references represent their relationships (e.g., <em>HasComponent, Organizes, HasTypeDefinition</em>).</p>
          </div>
        </section>

        {/* Slide 9: NodeClasses */}
        <section className="slide" id="slide-9">
          <div className="section-header">
            <div className="section-number">SECTION 03 • NODECLASSES</div>
            <h2 className="section-title">8 NodeClasses</h2>
          </div>
          <div className="node-grid">
            {[
              { name: 'Object', desc: 'Container' },
              { name: 'Variable', desc: 'Data values' },
              { name: 'Method', desc: 'Behavior' },
              { name: 'ObjectType', desc: 'Templates' },
              { name: 'VariableType', desc: 'Var templates' },
              { name: 'ReferenceType', desc: 'Relationships' },
              { name: 'DataType', desc: 'Value types' },
              { name: 'View', desc: 'Filtered views' },
            ].map((node, i) => (
              <div key={i} className="node-item">
                <div className="name">{node.name}</div>
                <div className="desc">{node.desc}</div>
              </div>
            ))}
          </div>
          <div className="highlight-box">
            <p><strong>PumpType (ObjectType)</strong> defines: Speed, Status, Power, Runtime, Start(), Stop() → <strong>Pump_01 (Instance)</strong> inherits all with live values</p>
          </div>
        </section>

        {/* Slide 10: Services & Data Access */}
        <section className="slide" id="slide-10">
          <div className="section-header">
            <div className="section-number">SECTION 04 • 22–30 MINUTES</div>
            <h2 className="section-title">Services & Data Access</h2>
            <p className="section-goal">Goal: Show how data flows correctly</p>
          </div>
          <div className="content-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="content-card">
              <h3><span className="icon">📋</span> Core Services</h3>
              <ul style={{ marginBottom: '1rem' }}>
                <li><strong style={{ color: '#8b5cf6' }}>Browse</strong> — Discover nodes</li>
                <li><strong style={{ color: '#00d4ff' }}>Read / Write</strong> — Discrete access</li>
                <li><strong style={{ color: '#10b981' }}>Subscribe</strong> — Change notifications</li>
                <li><strong style={{ color: '#f59e0b' }}>Call</strong> — Execute logic</li>
                <li><strong style={{ color: '#ec4899' }}>HistoryRead</strong> — Aggregates</li>
              </ul>

              <div style={{ background: 'var(--bg-elevated)', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Browse Simulation</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8rem' }}>
                  <div style={{ color: 'var(--accent-cyan)' }}>▾ Root</div>
                  <div style={{ marginLeft: '12px', color: 'var(--accent-cyan)' }}>▾ Objects</div>
                  <div style={{ marginLeft: '24px', color: 'var(--accent-green)' }}>▸ {Object.values(pumpData)[0]?.name || 'Pump_01'}</div>
                  <div style={{ marginLeft: '24px', color: 'var(--accent-green)' }}>▸ {Object.values(pumpData)[1]?.name || 'Pump_02'}</div>
                </div>
                <p style={{ fontSize: '0.65rem', marginTop: '0.6rem', color: 'var(--text-muted)' }}>
                  "Browsing" allows clients to learn the server's structure without prior knowledge.
                </p>
              </div>
            </div>
            <div className="content-card" style={{ borderColor: '#10b981' }}>
              <h3 style={{ color: '#10b981' }}>
                <span className="icon" style={{ background: 'rgba(16,185,129,0.1)' }}>⚡</span> Three Operating Rules
              </h3>
              <div style={{ marginTop: '0.6rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(16,185,129,0.1)', borderRadius: '5px', marginBottom: '0.4rem' }}>
                  <strong style={{ color: '#10b981', fontSize: '0.85rem' }}>1. Subscriptions are DEFAULT</strong>
                </div>
                <div style={{ padding: '0.5rem', background: 'rgba(245,158,11,0.1)', borderRadius: '5px', marginBottom: '0.4rem' }}>
                  <strong style={{ color: '#f59e0b', fontSize: '0.85rem' }}>2. Reads are EXCEPTIONS</strong>
                </div>
                <div style={{ padding: '0.5rem', background: 'rgba(0,212,255,0.1)', borderRadius: '5px' }}>
                  <strong style={{ color: '#00d4ff', fontSize: '0.85rem' }}>3. Quality is ALWAYS explicit</strong>
                </div>
              </div>
            </div>
          </div>
          <div className="highlight-box warning">
            <p><strong>A dissolved oxygen value without quality is dangerous.</strong> OPC UA always provides: Value + StatusCode + Timestamp</p>
          </div>
        </section>

        {/* Slide 11: Network & Transport */}
        <section className="slide" id="slide-11">
          <div className="section-header">
            <div className="section-number">SECTION 05 • 30–40 MINUTES</div>
            <h2 className="section-title">Network & Transport</h2>
            <p className="section-goal">Goal: Make security concrete and auditable</p>
          </div>
          <div className="diagram-container">
            <div className="diagram-title">UA TCP Message Flow (Handshake)</div>
            <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 400 100" style={{ maxWidth: '400px' }}>
                <rect x="20" y="20" width="60" height="60" rx="5" fill="var(--bg-elevated)" stroke="var(--accent-cyan)" />
                <text x="50" y="55" fill="var(--accent-cyan)" fontSize="8" textAnchor="middle">Client</text>

                <rect x="320" y="20" width="60" height="60" rx="5" fill="var(--bg-elevated)" stroke="var(--accent-green)" />
                <text x="350" y="55" fill="var(--accent-green)" fontSize="8" textAnchor="middle">Server</text>

                <line x1="85" y1="40" x2="315" y2="40" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4" />
                <line x1="85" y1="60" x2="315" y2="60" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4" />

                <circle r="4" fill="var(--accent-cyan)">
                  <animateMotion dur="2s" repeatCount="indefinite" path="M85 40 L315 40" />
                </circle>
                <circle r="4" fill="var(--accent-green)">
                  <animateMotion dur="2s" repeatCount="indefinite" path="M315 60 L85 60" />
                </circle>
              </svg>
            </div>
          </div>
          <div className="packet-display">
            <div className="packet hel"><div className="type">HEL</div><div className="desc">Hello</div></div>
            <span className="packet-arrow">→</span>
            <div className="packet ack"><div className="type">ACK</div><div className="desc">Acknowledge</div></div>
            <span className="packet-arrow">→</span>
            <div className="packet opn"><div className="type">OPN</div><div className="desc">Open Secure</div></div>
            <span className="packet-arrow">→</span>
            <div className="packet msg"><div className="type">MSG</div><div className="desc">Encrypted</div></div>
            <span className="packet-arrow">→</span>
            <div className="packet clo"><div className="type">CLO</div><div className="desc">Close</div></div>
          </div>
          <div className="highlight-box">
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span className="live-badge" style={{ background: 'rgba(0,212,255,0.1)' }}>Binary Protocol</span>
              <span className="live-badge" style={{ background: 'rgba(139,92,246,0.1)' }}>TLS/TCP</span>
              <span className="live-badge" style={{ background: 'rgba(16,185,129,0.1)' }}>Port 4840</span>
            </div>
            <p style={{ marginTop: '0.6rem' }}><strong>UA TCP</strong> is a high-performance binary protocol designed for industrial networks, supporting chunking, security, and multiplexing over a single TCP connection.</p>
          </div>
        </section>

        {/* Slide 12: Security Architecture */}
        <section className="slide" id="slide-12">
          <div className="section-header">
            <div className="section-number">SECTION 05 • SECURITY</div>
            <h2 className="section-title">Security Architecture</h2>
          </div>
          <div className="content-grid">
            <div className="content-card">
              <h3><span className="icon">🔐</span> Security Policies (1.05.06)</h3>
              <table className="comparison-table" style={{ fontSize: '0.8rem' }}>
                <tbody>
                  <tr><td><span style={{ color: '#10b981' }}>Aes256_Sha256_RsaPss</span></td><td><span className="status-badge current">Recommended</span></td></tr>
                  <tr><td><span style={{ color: '#10b981' }}>Aes128_Sha256_RsaOaep</span></td><td><span className="status-badge current">Current</span></td></tr>
                  <tr><td><span style={{ color: '#00d4ff' }}>ECC_nistP256 (ECC-A)</span></td><td><span className="status-badge current">1.05+</span></td></tr>
                  <tr><td><span style={{ color: '#00d4ff' }}>ECC_nistP384 (ECC-B)</span></td><td><span className="status-badge current">1.05+</span></td></tr>
                  <tr><td><span style={{ color: '#ef4444' }}>Basic256</span></td><td><span className="status-badge deprecated">Deprecated</span></td></tr>
                  <tr><td><span style={{ color: '#64748b' }}>None</span></td><td><span className="status-badge testing">Testing Only</span></td></tr>
                </tbody>
              </table>
            </div>
            <div className="content-card">
              <h3><span className="icon">🛡️</span> Security Modes</h3>
              <div style={{ marginTop: '0.6rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '6px', marginBottom: '0.4rem' }}>
                  <strong style={{ color: '#ef4444' }}>None</strong> — Testing only!
                </div>
                <div style={{ padding: '0.5rem', background: 'rgba(245,158,11,0.1)', border: '1px solid #f59e0b', borderRadius: '6px', marginBottom: '0.4rem' }}>
                  <strong style={{ color: '#f59e0b' }}>Sign</strong> — Signed but not encrypted
                </div>
                <div style={{ padding: '0.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: '6px' }}>
                  <strong style={{ color: '#10b981' }}>SignAndEncrypt ✓</strong> — PRODUCTION
                </div>
              </div>
            </div>
          </div>
          <div className="highlight-box warning">
            <p><strong>Common Misconfigurations:</strong> SecurityMode=None in production • Shared certificates • Anonymous write access • No role separation</p>
          </div>
        </section>

        {/* Slide 13: Role-Based Access Control */}
        <section className="slide" id="slide-13">
          <div className="section-header">
            <div className="section-number">SECTION 05 • AUTHORIZATION</div>
            <h2 className="section-title">Role-Based Access Control</h2>
          </div>
          <div className="content-card" style={{ width: '100%' }}>
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Pump Control</th>
                  <th>Tank Settings</th>
                  <th>Configuration</th>
                  <th>Alarms</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong style={{ color: '#10b981' }}>Operator</strong></td>
                  <td style={{ color: '#10b981' }}>✓ Start/Stop</td>
                  <td style={{ color: '#10b981' }}>✓ Set Level</td>
                  <td style={{ color: '#ef4444' }}>✗ None</td>
                  <td style={{ color: '#00d4ff' }}>○ Read</td>
                </tr>
                <tr>
                  <td><strong style={{ color: '#f59e0b' }}>Maintenance</strong></td>
                  <td style={{ color: '#f59e0b' }}>✓ Reset</td>
                  <td style={{ color: '#f59e0b' }}>✓ Calibrate</td>
                  <td style={{ color: '#00d4ff' }}>○ Read</td>
                  <td style={{ color: '#f59e0b' }}>✓ Clear</td>
                </tr>
                <tr>
                  <td><strong style={{ color: '#8b5cf6' }}>Engineer</strong></td>
                  <td style={{ color: '#8b5cf6' }}>✓ Full</td>
                  <td style={{ color: '#8b5cf6' }}>✓ Full</td>
                  <td style={{ color: '#8b5cf6' }}>✓ Modify</td>
                  <td style={{ color: '#8b5cf6' }}>✓ Full</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="content-grid" style={{ marginTop: '1rem' }}>
            <div className="content-card">
              <h3><span className="icon">🔑</span> Authentication Options</h3>
              <ul>
                <li>Anonymous (read-only, testing)</li>
                <li>Username / Password</li>
                <li>Certificate-based users</li>
                <li>X.509 User Certificates</li>
              </ul>
            </div>
            <div className="content-card">
              <h3><span className="icon">📜</span> Auditing (1.05.06)</h3>
              <ul>
                <li>Connection attempts (success/fail)</li>
                <li>Configuration changes</li>
                <li>User authentication events</li>
                <li>NIST 800-82 / IEC 62443</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Slide 14: OPC UA PubSub */}
        <section className="slide" id="slide-14">
          <div className="section-header">
            <div className="section-number">SECTION 07 • 48–55 MINUTES</div>
            <h2 className="section-title">OPC UA PubSub</h2>
            <p className="section-goal">Goal: Scalable data distribution</p>
          </div>
          <div className="content-grid">
            <div className="content-card" style={{ borderColor: '#00d4ff' }}>
              <h3 style={{ color: '#00d4ff' }}>
                <span className="icon" style={{ background: 'rgba(0,212,255,0.1)' }}>📡</span> Broker-less
              </h3>
              <ul>
                <li>UDP / Ethernet</li>
                <li>Deterministic LAN</li>
                <li>Low latency</li>
                <li>TSN-compatible</li>
              </ul>
            </div>
            <div className="content-card" style={{ borderColor: '#8b5cf6' }}>
              <h3 style={{ color: '#8b5cf6' }}>
                <span className="icon" style={{ background: 'rgba(139,92,246,0.1)' }}>☁️</span> Broker-based
              </h3>
              <ul>
                <li>MQTT / AMQP</li>
                <li>Cloud integration</li>
                <li>Azure, AWS compatible</li>
                <li>Massive scale</li>
              </ul>
            </div>
          </div>
          <div className="content-grid" style={{ marginTop: '1rem' }}>
            <div className="content-card">
              <h3><span className="icon">📦</span> Message Encodings</h3>
              <ul>
                <li><strong style={{ color: '#00d4ff' }}>UADP (Binary)</strong> — High-performance</li>
                <li><strong style={{ color: '#10b981' }}>JSON</strong> — Human-readable</li>
              </ul>
            </div>
            <div className="content-card">
              <h3><span className="icon">🔒</span> PubSub Security</h3>
              <ul>
                <li>TLS mandatory for brokers</li>
                <li>Read-only telemetry recommended</li>
                <li>Versioned schemas</li>
                <li>Signed UADP messages</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Slide 15: Information Modeling Mechanics */}
        <section className="slide" id="slide-15">
          <div className="section-header">
            <div className="section-number">SECTION 08 • INFORMATION MODELING</div>
            <h2 className="section-title">From Blueprint to Reality</h2>
            <p className="section-goal">Goal: Show how YAML/JSON becomes live objects</p>
          </div>
          <div className="two-column" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="content-card">
              <h3><Database size={16} /> 1. The Blueprint (YAML)</h3>
              <div className="code-block" style={{ fontSize: '0.65rem', maxHeight: '250px', overflowY: 'auto' }}>
                <span className="keyword">PumpType</span>:<br />
                &nbsp;&nbsp;type: <span className="string">ObjectType</span><br />
                &nbsp;&nbsp;base: <span className="string">AssetType</span><br />
                &nbsp;&nbsp;components:<br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="keyword">FlowRate</span>:<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;type: <span className="string">AnalogItemType</span><br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;dataType: <span className="string">Double</span><br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;engineeringUnits: <span className="string">m³/h</span><br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="keyword">RPM</span>:<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;type: <span className="string">AnalogItemType</span>
              </div>
              <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                Defined in <code>types.yaml</code> and <code>assets.json</code>
              </p>
            </div>
            <div className="content-card">
              <h3><RefreshCw size={16} /> 2. Live Instance (OPC UA)</h3>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', background: 'var(--accent-green)', borderRadius: '50%' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Pump_01 : PumpType</span>
                </div>
                <div style={{ paddingLeft: '1rem', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>FlowRate:</span> <span style={{ color: 'var(--accent-cyan)' }}>{(Object.values(pumpData)[0]?.flow_rate || 0).toFixed(1)} m³/h</span>
                  </div>
                  <div style={{ fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>RPM:</span> <span style={{ color: 'var(--accent-cyan)' }}>{(Object.values(pumpData)[0]?.rpm || 0).toFixed(0)}</span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <button className="btn-action" onClick={() => fetchPumps()}>
                  <RefreshCw size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Refresh Server Cache
                </button>
              </div>
            </div>
          </div>
          <div className="highlight-box">
            <p><strong>Strong Typing:</strong> By defining a <code>PumpType</code>, every pump instance in the facility inherits the same sensors, methods, and metadata automatically, ensuring consistency across thousands of assets.</p>
          </div>
        </section>

        {/* Slide 16: Interoperability */}
        <section className="slide" id="slide-16">
          <div className="section-header" style={{ paddingTop: '2rem' }}>
            <div className="section-number">SECTION 08 • INTEROPERABILITY</div>
            <h2 className="section-title">Cross-Platform Interoperability</h2>
          </div>
          <div className="diagram-container" style={{ padding: '2rem', height: '300px' }}>
            <svg viewBox="0 0 800 250" xmlns="http://www.w3.org/2000/svg">
              {/* OPC UA Server */}
              <rect x="300" y="80" width="200" height="80" rx="8" fill="var(--bg-elevated)" stroke="var(--accent-green)" strokeWidth="3" />
              <text x="400" y="115" fill="white" fontSize="14" textAnchor="middle" fontWeight="bold">OPC UA SERVER</text>
              <text x="400" y="140" fill="var(--accent-green)" fontSize="10" textAnchor="middle">Physics Simulation Engine</text>

              {/* OPC UA Client */}
              <g transform="translate(50,80)">
                <rect width="180" height="80" rx="8" fill="var(--bg-elevated)" stroke="var(--accent-cyan)" strokeWidth="3" />
                <text x="90" y="115" fill="white" fontSize="14" textAnchor="middle" fontWeight="bold">OPC UA CLIENT</text>
                <text x="90" y="140" fill="var(--accent-cyan)" fontSize="10" textAnchor="middle">Python / .NET / C++</text>
              </g>

              {/* Web Console */}
              <g transform="translate(570,80)">
                <rect width="180" height="80" rx="8" fill="var(--bg-elevated)" stroke="var(--accent-pink)" strokeWidth="3" />
                <text x="90" y="115" fill="white" fontSize="14" textAnchor="middle" fontWeight="bold">WEB INTERFACE</text>
                <text x="90" y="140" fill="var(--accent-pink)" fontSize="10" textAnchor="middle">React Dashboard</text>
              </g>

              {/* Data Flow Arrows */}
              <path d="M230 120 L300 120" stroke="var(--accent-cyan)" strokeWidth="2" strokeDasharray="5,5">
                <animate attributeName="stroke-dashoffset" from="50" to="0" dur="2s" repeatCount="indefinite" />
              </path>
              <path d="M500 120 L570 120" stroke="var(--accent-pink)" strokeWidth="2" strokeDasharray="5,5">
                <animate attributeName="stroke-dashoffset" from="0" to="50" dur="2s" repeatCount="indefinite" />
              </path>
            </svg>
          </div>
          <div className="content-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
            <div className="content-card">
              <h3 style={{ color: 'var(--accent-cyan)' }}>Hardware Independence</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                OPC UA abstracts the hardware. Whether it's a simulated Python engine or a physical PLC, the Client sees the same semantic objects.
              </p>
            </div>
            <div className="content-card">
              <h3 style={{ color: 'var(--accent-green)' }}>Physics Integration</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Our server runs real-time hydraulic equations (Head vs Flow), presenting calculated physics as safe, readable OPC UA variables.
              </p>
            </div>
          </div>
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button className="btn-action" onClick={() => goToSlide(17)}>
              Continue to Future Trends →
            </button>
          </div>
        </section>

        {/* Slide 17: Future Directions */}
        <section className="slide" id="slide-17">
          <div className="section-header">
            <div className="section-number">SECTION 08 • FUTURE READY</div>
            <h2 className="section-title">Future Directions</h2>
          </div>
          <div className="content-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="content-card" style={{ borderColor: '#00d4ff' }}>
              <h3 style={{ color: '#00d4ff' }}>
                <span className="icon" style={{ background: 'rgba(0,212,255,0.1)' }}>⏱️</span> OPC UA + TSN
              </h3>
              <ul>
                <li>Deterministic Ethernet</li>
                <li>Guaranteed latency</li>
                <li>&lt;1μs synchronization</li>
                <li>Certification: 2026</li>
              </ul>
            </div>
            <div className="content-card" style={{ borderColor: '#10b981' }}>
              <h3 style={{ color: '#10b981' }}>
                <span className="icon" style={{ background: 'rgba(16,185,129,0.1)' }}>📡</span> 5G Integration
              </h3>
              <ul>
                <li>Wireless deterministic</li>
                <li>Mobile equipment</li>
                <li>Extended coverage</li>
                <li>Wi-Fi 6 support</li>
              </ul>
            </div>
            <div className="content-card" style={{ borderColor: '#8b5cf6' }}>
              <h3 style={{ color: '#8b5cf6' }}>
                <span className="icon" style={{ background: 'rgba(139,92,246,0.1)' }}>🔧</span> OPC UA FX
              </h3>
              <ul>
                <li>Field-level communication</li>
                <li>Controller-to-Controller</li>
                <li>Unified namespace</li>
                <li>V1.00.03 (July 2025)</li>
              </ul>
            </div>
          </div>
          <div className="quote" style={{ marginTop: '1.5rem' }}>
            <strong>OPC UA is a Unified Language.</strong><br />
            It preserves <strong>meaning, trust, and quality</strong> across decades of industrial systems.
          </div>
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button className="btn-action" onClick={() => goToSlide(18)}>
              Final Conclusion →
            </button>
          </div>
        </section>

        {/* Slide 18: Conclusion */}
        <section className="slide title-slide" id="slide-18">
          <div className="quote" style={{ fontSize: '1.3rem', border: 'none', background: 'none' }}>
            <strong style={{ fontSize: '1.5rem' }}>OPC UA is not about moving numbers.</strong><br /><br />
            It is about preserving <strong>meaning</strong>, <strong>trust</strong>, and <strong>quality</strong><br />
            across decades of industrial systems.
          </div>
          <div className="content-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginTop: '2rem' }}>
            {[
              { icon: <Database size={20} />, title: 'Semantic Clarity', desc: 'First-class objects', color: 'var(--accent-cyan)' },
              { icon: <ShieldCheck size={20} />, title: 'Security by Design', desc: 'Built-in protection', color: 'var(--accent-green)' },
              { icon: <RefreshCw size={20} />, title: 'Interoperability', desc: 'Vendor-neutral', color: 'var(--accent-orange)' },
              { icon: <Layers size={20} />, title: 'Scalability', desc: 'Plant to enterprise', color: 'var(--accent-purple)' },
              { icon: <LayoutGrid size={20} />, title: 'Future-Ready', desc: 'TSN, 5G, Cloud', color: 'var(--accent-pink)' },
            ].map((item, i) => (
              <div key={i} className="content-card" style={{ textAlign: 'center', padding: '0.8rem' }}>
                <div style={{ color: item.color, marginBottom: '0.4rem', display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
                <div style={{ fontSize: '0.75rem', color: item.color, fontWeight: 600 }}>{item.title}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button className="btn-action" onClick={() => window.location.href = '/'}>
              Launch Live Dashboard →
            </button>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>Based on OPC UA Specification v1.05.06 (October 2025)</p>
          </div>
        </section>

        {/* Floating Live Data Overlay */}
        <div className="float-dashboard">
          <div className="float-header">
            <div className="float-title">
              Live Server Node: {Object.values(pumpData)[0]?.name || 'Discovery'}
            </div>
            <div className="live-badge" style={{ transform: 'scale(0.8)' }}>
              {isConnected ? 'ON' : 'OFF'}
            </div>
          </div>
          {Object.values(pumpData).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Flow Rate:</span>
                <span style={{ color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
                  {Object.values(pumpData)[0]?.flow_rate.toFixed(1)} m³/h
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Power:</span>
                <span style={{ color: 'var(--accent-green)', fontFamily: 'monospace' }}>
                  {Object.values(pumpData)[0]?.power_consumption.toFixed(2)} kW
                </span>
              </div>
              <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', marginTop: '0.2rem', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (Object.values(pumpData)[0]?.flow_rate || 0) / 2)}%`,
                  background: 'var(--accent-cyan)',
                  transition: 'width 0.5s ease-out'
                }} />
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Searching for live assets...</p>
          )}
          <button
            onClick={() => {
              const searchParams = new URLSearchParams();
              searchParams.set('open', 'true');
              window.open('/monitoring?' + searchParams.toString(), '_blank');
            }}
            style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--accent-cyan)', fontSize: '0.65rem', padding: '0.3rem', borderRadius: '4px', marginTop: '0.4rem', cursor: 'pointer' }}
          >
            View in Full Monitor
          </button>
        </div>
      </div>
    </>
  );
}
