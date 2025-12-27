// OPC UA Architecture Presentation Page - Fullscreen presentation view

'use client';

import * as React from 'react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { usePumpStore } from '@/stores/pump-store';
import { usePumpWebSocket } from '@/hooks/use-pump-websocket';
import { Server, Zap, Activity, Info, Play, RefreshCw, Layers, ShieldCheck, Database, LayoutGrid, Monitor, Smartphone, Globe, Laptop, Cloud, Radio, ArrowLeftRight, Wifi, Cable, MessageSquare } from 'lucide-react';

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

          .comm-model-card {
            padding: 1rem;
          }

          .client-icon-box {
            padding: 0.6rem;
            min-width: 60px;
          }

          .client-icon-box .icon-wrapper {
            width: 36px;
            height: 36px;
          }
        }

        @media (max-width: 1000px) {
          #slide-16 > div:nth-child(2) {
            grid-template-columns: 1fr !important;
            gap: 1rem;
          }

          #slide-16 .server-core {
            order: -1;
            margin-bottom: 1rem;
          }

          #slide-2 > div:nth-child(2) {
            grid-template-columns: 1fr !important;
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

        @keyframes dataFlow {
          0% { stroke-dashoffset: 20; }
          100% { stroke-dashoffset: 0; }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px var(--accent-cyan), 0 0 10px rgba(0, 212, 255, 0.3); }
          50% { box-shadow: 0 0 15px var(--accent-cyan), 0 0 30px rgba(0, 212, 255, 0.5); }
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes ripple {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }

        .animate-fade-in {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }

        .animate-bounce {
          animation: bounce 2s ease-in-out infinite;
        }

        .comm-model-card {
          background: var(--bg-card);
          border: 2px solid var(--border-color);
          border-radius: 16px;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .comm-model-card:hover {
          transform: translateY(-5px);
          border-color: var(--accent-cyan);
        }

        .comm-model-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--accent-cyan), var(--accent-green));
        }

        .client-icon-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          transition: all 0.3s ease;
          cursor: pointer;
          min-width: 80px;
        }

        .client-icon-box:hover {
          border-color: var(--accent-cyan);
          transform: scale(1.05);
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
        }

        .client-icon-box .icon-wrapper {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          margin-bottom: 0.5rem;
          transition: all 0.3s ease;
        }

        .client-icon-box:hover .icon-wrapper {
          transform: scale(1.1);
        }

        .protocol-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid;
        }

        .protocol-tcp {
          background: rgba(0, 212, 255, 0.1);
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
        }

        .protocol-ws {
          background: rgba(139, 92, 246, 0.1);
          border-color: var(--accent-purple);
          color: var(--accent-purple);
        }

        .protocol-mqtt {
          background: rgba(245, 158, 11, 0.1);
          border-color: var(--accent-orange);
          color: var(--accent-orange);
        }

        .topic-display {
          font-family: 'JetBrains Mono', monospace;
          background: var(--bg-dark);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 0.5rem 0.8rem;
          font-size: 0.75rem;
          color: var(--accent-green);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .topic-display::before {
          content: '📬';
          font-size: 0.9rem;
        }

        .connection-line {
          stroke-dasharray: 8 4;
          animation: dataFlow 1s linear infinite;
        }

        .server-core {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(0, 212, 255, 0.15));
          border: 2px solid var(--accent-green);
          border-radius: 16px;
          padding: 1.5rem;
          text-align: center;
          position: relative;
        }

        .server-core::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 18px;
          background: linear-gradient(45deg, var(--accent-cyan), var(--accent-green));
          z-index: -1;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .server-core:hover::after {
          opacity: 0.3;
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
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="section-number" style={{ fontSize: '0.8rem', marginBottom: '0.8rem' }}>PRESENTATION OVERVIEW</div>
            <h2 className="section-title" style={{
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-green))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Agenda</h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            {[
              { num: '01', title: 'Introduction', desc: 'Why OPC UA Exists & Industrial Reality', icon: <Info size={18} />, color: 'var(--accent-cyan)' },
              { num: '02', title: 'Core Concepts', desc: 'Client–Server & PubSub Models', icon: <ArrowLeftRight size={18} />, color: 'var(--accent-green)' },
              { num: '03', title: 'Address Space', desc: 'Information Modeling & NodeClasses', icon: <Database size={18} />, color: 'var(--accent-purple)' },
              { num: '04', title: 'Services & Data Access', desc: 'Browse, Read, Subscribe, Call, History', icon: <Activity size={18} />, color: 'var(--accent-orange)' },
              { num: '05', title: 'Network & Security', desc: 'Transport Protocols & Authentication', icon: <ShieldCheck size={18} />, color: 'var(--accent-pink)' },
              { num: '06', title: 'Communication Architecture', desc: 'Cross-Platform Interoperability', icon: <Globe size={18} />, color: 'var(--accent-cyan)' },
              { num: '07', title: 'PubSub Deep Dive', desc: 'Broker-less & Broker-based Patterns', icon: <Radio size={18} />, color: 'var(--accent-green)' },
              { num: '08', title: 'Live Demonstration', desc: 'Interactive Dashboard & Real-time Data', icon: <Play size={18} />, color: 'var(--accent-orange)' },
            ].map((item, i) => (
              <div
                key={i}
                className="animate-fade-in"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.2rem',
                  padding: '1rem 1.5rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  animationDelay: `${i * 0.08}s`,
                  opacity: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = item.color;
                  e.currentTarget.style.transform = 'translateX(8px)';
                  e.currentTarget.style.boxShadow = `0 4px 20px ${item.color}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => goToSlide(i + 3)}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  background: `${item.color}15`,
                  borderRadius: '12px',
                  color: item.color,
                  flexShrink: 0
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.3rem' }}>
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: item.color,
                      opacity: 0.8
                    }}>{item.num}</span>
                    <span style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)'
                    }}>{item.title}</span>
                  </div>
                  <p style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    margin: 0
                  }}>{item.desc}</p>
                </div>
                <div style={{ color: 'var(--text-muted)', opacity: 0.5 }}>→</div>
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

        {/* Slide 9: NodeClasses - Enhanced with Icons and Animations */}
        <section className="slide" id="slide-9">
          <div className="section-header">
            <div className="section-number">SECTION 03 • NODECLASSES</div>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              8 NodeClasses
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>(OPC 10000-3)</span>
            </h2>
          </div>

          {/* Categorized NodeClasses */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem', marginBottom: '1rem' }}>
            {[
              { name: 'Object', desc: 'Container for variables, methods, and other objects', icon: <Database size={20} />, color: 'var(--accent-cyan)', category: 'Instance', example: 'Pump_01' },
              { name: 'Variable', desc: 'Holds data values with DataType and AccessLevel', icon: <Activity size={20} />, color: 'var(--accent-green)', category: 'Instance', example: 'FlowRate = 2340.5' },
              { name: 'Method', desc: 'Callable function with input/output arguments', icon: <Play size={20} />, color: 'var(--accent-orange)', category: 'Instance', example: 'StartPump()' },
              { name: 'ObjectType', desc: 'Template defining structure for Object instances', icon: <Layers size={20} />, color: 'var(--accent-purple)', category: 'Type', example: 'PumpType' },
              { name: 'VariableType', desc: 'Template for Variable nodes with default attributes', icon: <LayoutGrid size={20} />, color: 'var(--accent-pink)', category: 'Type', example: 'AnalogItemType' },
              { name: 'ReferenceType', desc: 'Defines relationships between nodes', icon: <ArrowLeftRight size={20} />, color: 'var(--accent-cyan)', category: 'Meta', example: 'HasComponent' },
              { name: 'DataType', desc: 'Defines value types (Int32, String, Structure)', icon: <Server size={20} />, color: 'var(--accent-green)', category: 'Meta', example: 'Double, Boolean' },
              { name: 'View', desc: 'Filtered subset of the Address Space', icon: <Globe size={20} />, color: 'var(--accent-orange)', category: 'Meta', example: 'OperatorView' },
            ].map((node, i) => (
              <div
                key={i}
                className="content-card animate-fade-in"
                style={{
                  padding: '0.8rem',
                  borderColor: node.color,
                  animationDelay: `${i * 0.05}s`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                  e.currentTarget.style.boxShadow = `0 8px 25px ${node.color}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${node.color}15`,
                    borderRadius: '8px',
                    color: node.color
                  }}>
                    {node.icon}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.85rem', fontWeight: 700, color: node.color }}>{node.name}</div>
                    <span style={{
                      fontSize: '0.55rem',
                      padding: '0.1rem 0.3rem',
                      background: `${node.color}20`,
                      borderRadius: '3px',
                      color: node.color,
                      fontWeight: 600
                    }}>{node.category}</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '0 0 0.4rem 0', lineHeight: 1.4 }}>{node.desc}</p>
                <div style={{
                  fontSize: '0.6rem',
                  fontFamily: 'JetBrains Mono',
                  color: node.color,
                  background: 'var(--bg-dark)',
                  padding: '0.3rem 0.5rem',
                  borderRadius: '4px',
                  opacity: 0.8
                }}>
                  {node.example}
                </div>
              </div>
            ))}
          </div>

          {/* Type Hierarchy Diagram */}
          <div className="diagram-container" style={{ padding: '1rem' }}>
            <div className="diagram-title">Type System Hierarchy (from types.yaml)</div>
            <svg viewBox="0 0 800 100" style={{ width: '100%', height: '100px' }}>
              {/* BaseObjectType */}
              <g transform="translate(50, 40)">
                <rect width="110" height="30" rx="5" fill="var(--bg-elevated)" stroke="var(--text-muted)" strokeWidth="1.5" strokeDasharray="4 2" />
                <text x="55" y="20" fill="var(--text-muted)" fontSize="8" textAnchor="middle">BaseObjectType</text>
                <text x="55" y="45" fill="var(--text-muted)" fontSize="6" textAnchor="middle">(OPC UA Base)</text>
              </g>

              {/* Arrow */}
              <line x1="160" y1="55" x2="200" y2="55" stroke="var(--text-muted)" strokeWidth="1.5" markerEnd="url(#arrowRight)" />
              <text x="180" y="48" fill="var(--text-muted)" fontSize="6" textAnchor="middle">extends</text>

              {/* AssetType */}
              <g transform="translate(200, 40)">
                <rect width="80" height="30" rx="5" fill="var(--bg-elevated)" stroke="var(--accent-purple)" strokeWidth="2" />
                <text x="40" y="20" fill="var(--accent-purple)" fontSize="9" textAnchor="middle" fontWeight="600">AssetType</text>
                <text x="40" y="45" fill="var(--text-muted)" fontSize="6" textAnchor="middle">(abstract)</text>
              </g>

              {/* Arrow to PumpType */}
              <line x1="280" y1="55" x2="330" y2="35" stroke="var(--accent-purple)" strokeWidth="1.5" />
              <line x1="280" y1="55" x2="330" y2="75" stroke="var(--accent-purple)" strokeWidth="1.5" />

              {/* PumpType */}
              <g transform="translate(330, 20)">
                <rect width="90" height="30" rx="5" fill="var(--bg-elevated)" stroke="var(--accent-green)" strokeWidth="2" />
                <text x="45" y="20" fill="var(--accent-green)" fontSize="9" textAnchor="middle" fontWeight="600">PumpType</text>
              </g>

              {/* ChamberType */}
              <g transform="translate(330, 60)">
                <rect width="90" height="30" rx="5" fill="var(--bg-elevated)" stroke="var(--accent-pink)" strokeWidth="2" />
                <text x="45" y="20" fill="var(--accent-pink)" fontSize="9" textAnchor="middle" fontWeight="600">ChamberType</text>
              </g>

              {/* Arrow to InfluentPumpType */}
              <line x1="420" y1="35" x2="470" y2="35" stroke="var(--accent-green)" strokeWidth="1.5" />

              {/* InfluentPumpType */}
              <g transform="translate(470, 20)">
                <rect width="120" height="30" rx="5" fill="var(--bg-elevated)" stroke="var(--accent-cyan)" strokeWidth="2" className="animate-glow" />
                <text x="60" y="20" fill="var(--accent-cyan)" fontSize="9" textAnchor="middle" fontWeight="600">InfluentPumpType</text>
              </g>

              {/* Instance arrow */}
              <line x1="590" y1="35" x2="640" y2="35" stroke="var(--accent-cyan)" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="615" y="28" fill="var(--text-muted)" fontSize="6" textAnchor="middle">instance of</text>

              {/* Instance */}
              <g transform="translate(640, 20)">
                <rect width="100" height="30" rx="5" fill="rgba(0,212,255,0.1)" stroke="var(--accent-cyan)" strokeWidth="2" />
                <text x="50" y="15" fill="var(--accent-cyan)" fontSize="8" textAnchor="middle" fontWeight="600">IPS_PMP_001</text>
                <text x="50" y="26" fill="var(--accent-green)" fontSize="7" textAnchor="middle">Running</text>
              </g>

              {/* Variables */}
              <g transform="translate(640, 55)">
                <rect width="100" height="35" rx="5" fill="var(--bg-dark)" stroke="var(--border-color)" />
                <text x="10" y="12" fill="var(--text-muted)" fontSize="6">FlowRate: 2340.5</text>
                <text x="10" y="22" fill="var(--text-muted)" fontSize="6">RPM: 1145</text>
                <text x="10" y="32" fill="var(--text-muted)" fontSize="6">Power: 124.8 kW</text>
              </g>
            </svg>
          </div>

          <div className="highlight-box" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0 }}><strong>PumpType (ObjectType)</strong> defines: 27 Variables (Speed, Pressure, Vibration...), 4 Methods (Start, Stop, SetSpeed, Reset), and 6 Alarm conditions</p>
            </div>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.6rem', padding: '0.2rem 0.4rem', background: 'rgba(0,212,255,0.1)', border: '1px solid var(--accent-cyan)', borderRadius: '4px', color: 'var(--accent-cyan)' }}>Instance</span>
              <span style={{ fontSize: '0.6rem', padding: '0.2rem 0.4rem', background: 'rgba(139,92,246,0.1)', border: '1px solid var(--accent-purple)', borderRadius: '4px', color: 'var(--accent-purple)' }}>Type</span>
              <span style={{ fontSize: '0.6rem', padding: '0.2rem 0.4rem', background: 'rgba(100,116,139,0.1)', border: '1px solid var(--text-muted)', borderRadius: '4px', color: 'var(--text-muted)' }}>Meta</span>
            </div>
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

        {/* Slide 11: Network & Transport - Enhanced with Protocol Simulation */}
        <section className="slide" id="slide-11" style={{ paddingTop: '60px' }}>
          <div className="section-header" style={{ marginBottom: '0.8rem' }}>
            <div className="section-number">SECTION 05 • NETWORK PROTOCOLS</div>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              Network & Transport
              <span className="live-badge animate-glow" style={{ fontSize: '0.7rem' }}>
                <div className="pulse-dot" />
                PROTOCOL SIMULATION
              </span>
            </h2>
          </div>

          {/* Three Protocol Comparison */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            {/* UA TCP - Client/Server */}
            <div className="comm-model-card" style={{ borderColor: 'var(--accent-cyan)', padding: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
                <Cable size={22} style={{ color: 'var(--accent-cyan)' }} />
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>UA TCP Binary</h4>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                <span className="protocol-badge protocol-tcp" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>TCP :4840</span>
                <span className="protocol-badge" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'var(--accent-green)', color: 'var(--accent-green)', fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>Binary</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                High-performance, stateful sessions, SecureChannel encryption
              </div>
              {/* Mini Animation */}
              <svg width="100%" height="40" viewBox="0 0 200 40" style={{ marginTop: '0.6rem' }}>
                <rect x="5" y="10" width="35" height="20" rx="4" fill="var(--bg-elevated)" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                <text x="22" y="23" fill="var(--accent-cyan)" fontSize="8" textAnchor="middle" fontWeight="600">Client</text>
                <rect x="160" y="10" width="35" height="20" rx="4" fill="var(--bg-elevated)" stroke="var(--accent-green)" strokeWidth="1.5" />
                <text x="178" y="23" fill="var(--accent-green)" fontSize="8" textAnchor="middle" fontWeight="600">Server</text>
                <line x1="45" y1="20" x2="155" y2="20" stroke="var(--accent-cyan)" strokeWidth="2" strokeDasharray="6 3" className="connection-line" />
                <circle r="4" fill="var(--accent-cyan)">
                  <animate attributeName="cx" values="50;150;50" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="20;20;20" dur="2s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>

            {/* WebSocket */}
            <div className="comm-model-card" style={{ borderColor: 'var(--accent-purple)', padding: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
                <Wifi size={22} style={{ color: 'var(--accent-purple)' }} />
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent-purple)', fontWeight: 700 }}>UA WebSocket</h4>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                <span className="protocol-badge protocol-ws" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>WSS :443</span>
                <span className="protocol-badge" style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'var(--accent-orange)', color: 'var(--accent-orange)', fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>JSON/Binary</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                Browser-compatible, TLS encryption, firewall-friendly
              </div>
              <svg width="100%" height="40" viewBox="0 0 200 40" style={{ marginTop: '0.6rem' }}>
                <rect x="5" y="10" width="35" height="20" rx="4" fill="var(--bg-elevated)" stroke="var(--accent-purple)" strokeWidth="1.5" />
                <text x="22" y="23" fill="var(--accent-purple)" fontSize="7" textAnchor="middle" fontWeight="600">Browser</text>
                <rect x="160" y="10" width="35" height="20" rx="4" fill="var(--bg-elevated)" stroke="var(--accent-green)" strokeWidth="1.5" />
                <text x="178" y="23" fill="var(--accent-green)" fontSize="8" textAnchor="middle" fontWeight="600">Server</text>
                <path d="M45 20 Q100 5 155 20" stroke="var(--accent-purple)" strokeWidth="2" fill="none" strokeDasharray="6 3" className="connection-line" />
                <circle r="4" fill="var(--accent-purple)">
                  <animateMotion dur="1.5s" repeatCount="indefinite" path="M45 20 Q100 5 155 20" />
                </circle>
              </svg>
            </div>

            {/* UDP PubSub */}
            <div className="comm-model-card" style={{ borderColor: 'var(--accent-orange)', padding: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
                <Radio size={22} style={{ color: 'var(--accent-orange)' }} />
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent-orange)', fontWeight: 700 }}>UADP Multicast</h4>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                <span className="protocol-badge protocol-mqtt" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>UDP :4840</span>
                <span className="protocol-badge" style={{ background: 'rgba(139,92,246,0.1)', borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)', fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>UADP</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                Broker-less PubSub, deterministic latency, TSN-compatible
              </div>
              <svg width="100%" height="40" viewBox="0 0 200 40" style={{ marginTop: '0.6rem' }}>
                <rect x="80" y="5" width="40" height="15" rx="4" fill="var(--bg-elevated)" stroke="var(--accent-orange)" strokeWidth="1.5" />
                <text x="100" y="15" fill="var(--accent-orange)" fontSize="7" textAnchor="middle" fontWeight="600">Publisher</text>
                {/* Multicast arrows */}
                <line x1="100" y1="21" x2="40" y2="35" stroke="var(--accent-orange)" strokeWidth="1.5" opacity="0.7" />
                <line x1="100" y1="21" x2="100" y2="35" stroke="var(--accent-orange)" strokeWidth="1.5" opacity="0.7" />
                <line x1="100" y1="21" x2="160" y2="35" stroke="var(--accent-orange)" strokeWidth="1.5" opacity="0.7" />
                <circle cx="40" cy="35" r="5" fill="var(--bg-elevated)" stroke="var(--accent-green)" strokeWidth="1.5" />
                <circle cx="100" cy="35" r="5" fill="var(--bg-elevated)" stroke="var(--accent-green)" strokeWidth="1.5" />
                <circle cx="160" cy="35" r="5" fill="var(--bg-elevated)" stroke="var(--accent-green)" strokeWidth="1.5" />
                {/* Animated packets */}
                <circle r="3" fill="var(--accent-orange)">
                  <animate attributeName="cx" values="100;40" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="21;35" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0" dur="1s" repeatCount="indefinite" />
                </circle>
                <circle r="3" fill="var(--accent-orange)">
                  <animate attributeName="cx" values="100;160" dur="1s" begin="0.3s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="21;35" dur="1s" begin="0.3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0" dur="1s" begin="0.3s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>
          </div>

          {/* UA TCP Handshake Sequence - Interactive */}
          <div className="diagram-container" style={{ padding: '1rem' }}>
            <div className="diagram-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem' }}>
              <span style={{ color: '#f1f5f9', fontWeight: 600 }}>UA TCP Connection Sequence (OPC 10000-6)</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontFamily: 'JetBrains Mono' }}>opc.tcp://localhost:4840</span>
            </div>
            <svg viewBox="0 0 800 180" style={{ width: '100%', height: '180px' }}>
              <defs>
                <linearGradient id="clientGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="serverGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0.1" />
                </linearGradient>
                <filter id="packetGlow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Client & Server columns */}
              <rect x="40" y="10" width="90" height="160" rx="8" fill="url(#clientGrad)" stroke="var(--accent-cyan)" strokeWidth="2" />
              <text x="85" y="32" fill="var(--accent-cyan)" fontSize="12" textAnchor="middle" fontWeight="700">OPC UA Client</text>
              <text x="85" y="46" fill="#cbd5e1" fontSize="9" textAnchor="middle">192.168.1.100</text>

              <rect x="670" y="10" width="90" height="160" rx="8" fill="url(#serverGrad)" stroke="var(--accent-green)" strokeWidth="2" />
              <text x="715" y="32" fill="var(--accent-green)" fontSize="12" textAnchor="middle" fontWeight="700">OPC UA Server</text>
              <text x="715" y="46" fill="#cbd5e1" fontSize="9" textAnchor="middle">:4840</text>

              {/* Timeline */}
              <line x1="85" y1="52" x2="85" y2="165" stroke="var(--accent-cyan)" strokeWidth="2" strokeDasharray="4 2" opacity="0.5" />
              <line x1="715" y1="52" x2="715" y2="165" stroke="var(--accent-green)" strokeWidth="2" strokeDasharray="4 2" opacity="0.5" />

              {/* Step 1: HEL */}
              <g>
                <line x1="130" y1="60" x2="670" y2="60" stroke="var(--accent-cyan)" strokeWidth="2" markerEnd="url(#arrowRight)" />
                <rect x="330" y="48" width="140" height="24" rx="5" fill="var(--bg-dark)" stroke="var(--accent-cyan)" strokeWidth="2" />
                <text x="400" y="65" fill="var(--accent-cyan)" fontSize="11" textAnchor="middle" fontWeight="700">HEL (Hello)</text>
                <text x="150" y="65" fill="#cbd5e1" fontSize="10" fontWeight="600">1.</text>
                {/* Animated packet */}
                <circle r="5" fill="var(--accent-cyan)" filter="url(#packetGlow)">
                  <animate attributeName="cx" values="130;670" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="60;60" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.9;1" dur="3s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Step 2: ACK */}
              <g>
                <line x1="670" y1="82" x2="130" y2="82" stroke="var(--accent-green)" strokeWidth="2" markerStart="url(#arrowLeft)" />
                <rect x="315" y="70" width="170" height="24" rx="5" fill="var(--bg-dark)" stroke="var(--accent-green)" strokeWidth="2" />
                <text x="400" y="87" fill="var(--accent-green)" fontSize="11" textAnchor="middle" fontWeight="700">ACK (Acknowledge)</text>
                <text x="685" y="87" fill="#cbd5e1" fontSize="10" fontWeight="600">2.</text>
                <circle r="5" fill="var(--accent-green)" filter="url(#packetGlow)">
                  <animate attributeName="cx" values="670;130" dur="3s" begin="0.5s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="82;82" dur="3s" begin="0.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.9;1" dur="3s" begin="0.5s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Step 3: OPN (SecureChannel) */}
              <g>
                <line x1="130" y1="104" x2="670" y2="104" stroke="var(--accent-orange)" strokeWidth="2" />
                <rect x="290" y="92" width="220" height="24" rx="5" fill="var(--bg-dark)" stroke="var(--accent-orange)" strokeWidth="2" />
                <text x="400" y="109" fill="var(--accent-orange)" fontSize="11" textAnchor="middle" fontWeight="700">OPN (OpenSecureChannel)</text>
                <text x="150" y="109" fill="#cbd5e1" fontSize="10" fontWeight="600">3.</text>
                <circle r="5" fill="var(--accent-orange)" filter="url(#packetGlow)">
                  <animate attributeName="cx" values="130;670" dur="3s" begin="1s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="104;104" dur="3s" begin="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.9;1" dur="3s" begin="1s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Step 4: MSG (Encrypted) */}
              <g>
                <rect x="140" y="120" width="520" height="26" rx="5" fill="rgba(139,92,246,0.15)" stroke="var(--accent-purple)" strokeWidth="1.5" strokeDasharray="4 2" />
                <text x="400" y="138" fill="#e2e8f0" fontSize="10" textAnchor="middle" fontWeight="600">MSG (CreateSession → ActivateSession → Browse/Read/Subscribe)</text>
                <text x="150" y="138" fill="#cbd5e1" fontSize="10" fontWeight="600">4.</text>
                {/* Bidirectional animated packets */}
                <circle r="4" fill="var(--accent-purple)">
                  <animate attributeName="cx" values="150;650;150" dur="2s" begin="1.5s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="133;133;133" dur="2s" begin="1.5s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Step 5: CLO */}
              <g>
                <line x1="130" y1="158" x2="670" y2="158" stroke="var(--accent-red)" strokeWidth="2" />
                <rect x="305" y="146" width="190" height="24" rx="5" fill="var(--bg-dark)" stroke="var(--accent-red)" strokeWidth="2" />
                <text x="400" y="163" fill="var(--accent-red)" fontSize="11" textAnchor="middle" fontWeight="700">CLO (CloseSecureChannel)</text>
                <text x="150" y="163" fill="#cbd5e1" fontSize="10" fontWeight="600">5.</text>
              </g>

              {/* Legend */}
              <g transform="translate(510, 12)">
                <rect width="160" height="35" rx="5" fill="var(--bg-dark)" stroke="var(--border-color)" strokeWidth="1.5" />
                <circle cx="18" cy="12" r="5" fill="var(--accent-cyan)" />
                <text x="30" y="16" fill="#e2e8f0" fontSize="8" fontWeight="500">Request</text>
                <circle cx="95" cy="12" r="5" fill="var(--accent-green)" />
                <text x="107" y="16" fill="#e2e8f0" fontSize="8" fontWeight="500">Response</text>
                <text x="80" y="29" fill="var(--accent-purple)" fontSize="8" textAnchor="middle" fontWeight="500">Encrypted Channel</text>
              </g>
            </svg>
          </div>

          {/* Packet Structure Details */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '0.6rem'
          }}>
            {[
              { type: 'HEL', color: 'var(--accent-cyan)', fields: ['MessageType', 'ProtocolVersion', 'BufferSize', 'EndpointUrl'], size: '32-256 B' },
              { type: 'ACK', color: 'var(--accent-green)', fields: ['MessageType', 'ProtocolVersion', 'BufferSize', 'MaxMsgSize'], size: '28 B' },
              { type: 'OPN', color: 'var(--accent-orange)', fields: ['SecurityPolicy', 'ClientNonce', 'Lifetime', 'Certificate'], size: '~2 KB' },
              { type: 'MSG', color: 'var(--accent-purple)', fields: ['SequenceNum', 'RequestId', 'ServiceId', 'Encrypted'], size: 'Variable' },
              { type: 'CLO', color: 'var(--accent-red)', fields: ['TokenId', 'SequenceNum', 'RequestId'], size: '24 B' },
            ].map((pkt, i) => (
              <div key={i} className="content-card animate-fade-in" style={{
                padding: '0.8rem',
                borderColor: pkt.color,
                animationDelay: `${i * 0.1}s`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: pkt.color, fontSize: '1.1rem' }}>{pkt.type}</span>
                  <span style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 500 }}>{pkt.size}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {pkt.fields.map((field, j) => (
                    <span key={j} style={{ fontSize: '0.7rem', color: '#e2e8f0', fontFamily: 'JetBrains Mono' }}>• {field}</span>
                  ))}
                </div>
              </div>
            ))}
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

        {/* Slide 15: Information Modeling Mechanics - Enhanced with real types.yaml */}
        <section className="slide" id="slide-15" style={{ paddingTop: '60px' }}>
          <div className="section-header" style={{ marginBottom: '0.8rem' }}>
            <div className="section-number">SECTION 08 • INFORMATION MODELING</div>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              From Blueprint to Reality
              <span className="live-badge" style={{ fontSize: '0.7rem', background: 'rgba(139,92,246,0.1)', borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }}>
                types.yaml → OPC UA
              </span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
            {/* Type Definition */}
            <div className="content-card animate-fade-in" style={{ borderColor: 'var(--accent-purple)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <Database size={16} style={{ color: 'var(--accent-purple)' }} />
                <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--accent-purple)' }}>1. Type Definition</h4>
              </div>
              <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>types.yaml</div>
              <div className="code-block" style={{ fontSize: '0.6rem', maxHeight: '200px', overflowY: 'auto', padding: '0.6rem' }}>
                <span className="keyword">PumpType</span>:<br />
                &nbsp;&nbsp;type: <span className="string">ObjectType</span><br />
                &nbsp;&nbsp;base: <span className="string">AssetType</span><br />
                &nbsp;&nbsp;description: <span className="string">"Centrifugal pump"</span><br />
                &nbsp;&nbsp;components:<br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="keyword">FlowRate</span>:<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;type: <span className="string">AnalogItemType</span><br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;dataType: <span className="string">Double</span><br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;engineeringUnits: <span className="string">m³/h</span><br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;euRange: {'{'}low: <span className="number">0</span>, high: <span className="number">5000</span>{'}'}<br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="keyword">RPM</span>:<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;type: <span className="string">AnalogItemType</span><br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;euRange: {'{'}low: <span className="number">0</span>, high: <span className="number">1800</span>{'}'}<br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="keyword">PowerConsumption</span>:<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;engineeringUnits: <span className="string">kW</span><br />
                &nbsp;&nbsp;methods:<br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="keyword">StartPump</span>, <span className="keyword">StopPump</span>, <span className="keyword">SetSpeed</span>
              </div>
            </div>

            {/* Asset Instance */}
            <div className="content-card animate-fade-in" style={{ borderColor: 'var(--accent-orange)', animationDelay: '0.1s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <Layers size={16} style={{ color: 'var(--accent-orange)' }} />
                <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--accent-orange)' }}>2. Asset Instance</h4>
              </div>
              <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>assets.json</div>
              <div className="code-block" style={{ fontSize: '0.6rem', maxHeight: '200px', overflowY: 'auto', padding: '0.6rem' }}>
                {'{'}<br />
                &nbsp;&nbsp;<span className="keyword">"id"</span>: <span className="string">"IPS_PMP_001"</span>,<br />
                &nbsp;&nbsp;<span className="keyword">"name"</span>: <span className="string">"Influent Pump 1"</span>,<br />
                &nbsp;&nbsp;<span className="keyword">"type"</span>: <span className="string">"InfluentPumpType"</span>,<br />
                &nbsp;&nbsp;<span className="keyword">"parent"</span>: <span className="string">"S00630"</span>,<br />
                &nbsp;&nbsp;<span className="keyword">"simulate"</span>: <span className="number">true</span>,<br />
                &nbsp;&nbsp;<span className="keyword">"properties"</span>: {'{'}<br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="keyword">"Manufacturer"</span>: <span className="string">"Flygt"</span>,<br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="keyword">"Model"</span>: <span className="string">"CP3300.900"</span><br />
                &nbsp;&nbsp;{'}'},<br />
                &nbsp;&nbsp;<span className="keyword">"designSpecs"</span>: {'{'}<br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="keyword">"DesignFlow"</span>: <span className="number">2500.0</span>,<br />
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="keyword">"MaxRPM"</span>: <span className="number">1180</span><br />
                &nbsp;&nbsp;{'}'}<br />
                {'}'}
              </div>
            </div>

            {/* Live OPC UA Instance */}
            <div className="content-card animate-fade-in" style={{ borderColor: 'var(--accent-green)', animationDelay: '0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <Activity size={16} style={{ color: 'var(--accent-green)' }} />
                <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--accent-green)' }}>3. Live OPC UA Node</h4>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.55rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                <span>ns=1;s=IPS_PMP_001</span>
                <span className="live-badge" style={{ fontSize: '0.5rem' }}>
                  <div className="pulse-dot" style={{ width: '4px', height: '4px' }} />
                  LIVE
                </span>
              </div>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <div style={{ width: '6px', height: '6px', background: 'var(--accent-green)', borderRadius: '50%' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>IPS_PMP_001 : InfluentPumpType</span>
                </div>
                <div style={{ paddingLeft: '0.8rem', borderLeft: '2px solid var(--accent-green)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ fontSize: '0.65rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>FlowRate:</span>
                    <span style={{ color: 'var(--accent-cyan)', fontFamily: 'JetBrains Mono' }}>{(Object.values(pumpData)[0]?.flow_rate || 2340.5).toFixed(1)} m³/h</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>RPM:</span>
                    <span style={{ color: 'var(--accent-cyan)', fontFamily: 'JetBrains Mono' }}>{(Object.values(pumpData)[0]?.rpm || 1145).toFixed(0)}</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Power:</span>
                    <span style={{ color: 'var(--accent-orange)', fontFamily: 'JetBrains Mono' }}>{(Object.values(pumpData)[0]?.power_consumption || 124.8).toFixed(1)} kW</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                    <span style={{ color: Object.values(pumpData)[0]?.is_running ? 'var(--accent-green)' : 'var(--accent-red)', fontFamily: 'JetBrains Mono' }}>
                      {Object.values(pumpData)[0]?.is_running ? 'RUNNING' : 'STOPPED'}
                    </span>
                  </div>
                </div>
                <button className="btn-action" style={{ marginTop: '0.6rem', padding: '0.3rem 0.6rem', fontSize: '0.65rem' }} onClick={() => fetchPumps()}>
                  <RefreshCw size={10} style={{ marginRight: '3px' }} /> Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Asset Hierarchy Visualization */}
          <div className="diagram-container" style={{ padding: '1rem' }}>
            <div className="diagram-title">Asset Hierarchy (assets.json → OPC UA Address Space)</div>
            <svg viewBox="0 0 900 120" style={{ width: '100%', height: '120px' }}>
              {/* Plant Level */}
              <g transform="translate(50, 20)">
                <rect width="100" height="30" rx="5" fill="var(--bg-elevated)" stroke="var(--accent-purple)" strokeWidth="2" />
                <text x="50" y="20" fill="var(--accent-purple)" fontSize="8" textAnchor="middle" fontWeight="600">RC_RockCreek</text>
                <text x="50" y="40" fill="var(--text-muted)" fontSize="6" textAnchor="middle">Plant</text>
              </g>

              {/* Process Level */}
              <g transform="translate(200, 20)">
                <rect width="100" height="30" rx="5" fill="var(--bg-elevated)" stroke="var(--accent-cyan)" strokeWidth="2" />
                <text x="50" y="20" fill="var(--accent-cyan)" fontSize="8" textAnchor="middle" fontWeight="600">P0041_Preliminary</text>
                <text x="50" y="40" fill="var(--text-muted)" fontSize="6" textAnchor="middle">Process</text>
              </g>

              {/* System Level */}
              <g transform="translate(350, 20)">
                <rect width="120" height="30" rx="5" fill="var(--bg-elevated)" stroke="var(--accent-orange)" strokeWidth="2" />
                <text x="60" y="20" fill="var(--accent-orange)" fontSize="8" textAnchor="middle" fontWeight="600">S00630_InfluentPumping</text>
                <text x="60" y="40" fill="var(--text-muted)" fontSize="6" textAnchor="middle">System</text>
              </g>

              {/* Asset Level - Pumps */}
              <g transform="translate(520, 10)">
                <rect width="80" height="25" rx="4" fill="var(--bg-elevated)" stroke="var(--accent-green)" strokeWidth="2" className="animate-glow" />
                <text x="40" y="17" fill="var(--accent-green)" fontSize="7" textAnchor="middle" fontWeight="600">IPS_PMP_001</text>
              </g>
              <g transform="translate(620, 10)">
                <rect width="80" height="25" rx="4" fill="var(--bg-elevated)" stroke="var(--accent-green)" strokeWidth="1.5" />
                <text x="40" y="17" fill="var(--accent-green)" fontSize="7" textAnchor="middle" fontWeight="600">IPS_PMP_002</text>
              </g>
              <g transform="translate(720, 10)">
                <rect width="80" height="25" rx="4" fill="var(--bg-elevated)" stroke="var(--accent-green)" strokeWidth="1.5" />
                <text x="40" y="17" fill="var(--accent-green)" fontSize="7" textAnchor="middle" fontWeight="600">IPS_PMP_003</text>
              </g>
              <g transform="translate(820, 10)">
                <rect width="70" height="25" rx="4" fill="var(--bg-elevated)" stroke="var(--accent-pink)" strokeWidth="1.5" />
                <text x="35" y="17" fill="var(--accent-pink)" fontSize="7" textAnchor="middle" fontWeight="600">IPS_WW_001</text>
              </g>

              {/* Connection lines */}
              <line x1="150" y1="35" x2="200" y2="35" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4 2" />
              <line x1="300" y1="35" x2="350" y2="35" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4 2" />
              <line x1="470" y1="35" x2="520" y2="22" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4 2" />
              <line x1="470" y1="35" x2="620" y2="22" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4 2" />
              <line x1="470" y1="35" x2="720" y2="22" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4 2" />
              <line x1="470" y1="35" x2="820" y2="22" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4 2" />

              {/* Type inheritance */}
              <g transform="translate(520, 50)">
                <text x="0" y="10" fill="var(--text-muted)" fontSize="6">HasTypeDefinition ↓</text>
                <rect x="0" y="15" width="80" height="20" rx="3" fill="rgba(139,92,246,0.1)" stroke="var(--accent-purple)" strokeWidth="1" strokeDasharray="3 2" />
                <text x="40" y="28" fill="var(--accent-purple)" fontSize="6" textAnchor="middle">InfluentPumpType</text>
              </g>

              {/* Stats */}
              <g transform="translate(650, 60)">
                <rect width="240" height="50" rx="5" fill="var(--bg-dark)" stroke="var(--border-color)" />
                <text x="10" y="18" fill="var(--text-muted)" fontSize="7">Asset Summary (assets.json):</text>
                <text x="10" y="32" fill="var(--accent-cyan)" fontSize="7">• 7 InfluentPumpType • 4 PumpType</text>
                <text x="10" y="44" fill="var(--accent-pink)" fontSize="7">• 7 ChamberType • 15 Simulated</text>
              </g>
            </svg>
          </div>

          <div className="highlight-box" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0 }}><strong>Strong Typing:</strong> <code>PumpType</code> defines 27 sensor data points, 4 methods, and 6 alarm types. Every pump instance automatically inherits the complete schema.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className="protocol-badge" style={{ background: 'rgba(139,92,246,0.1)', borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }}>27 Data Points</span>
              <span className="protocol-badge" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}>4 Methods</span>
              <span className="protocol-badge" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}>6 Alarms</span>
            </div>
          </div>
        </section>

        {/* Slide 16: Interoperability - Complete OPC-UA Architecture */}
        <section className="slide" id="slide-16" style={{ paddingTop: '60px' }}>
          <div className="section-header" style={{ marginBottom: '1rem' }}>
            <div className="section-number">SECTION 08 • COMMUNICATION ARCHITECTURE</div>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              Cross-Platform Interoperability
              <span className="live-badge animate-glow" style={{ fontSize: '0.7rem' }}>
                <div className="pulse-dot" />
                DUAL MODEL
              </span>
            </h2>
          </div>

          {/* Main Architecture Diagram */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '1.5rem',
            alignItems: 'stretch',
            marginBottom: '1.5rem'
          }}>
            {/* Left: Client-Server Model */}
            <div className="comm-model-card" style={{ borderColor: 'var(--accent-cyan)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <ArrowLeftRight size={20} style={{ color: 'var(--accent-cyan)' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-cyan)' }}>Client–Server Model</h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Bidirectional • Stateful Sessions • Interactive Control
              </p>

              {/* Protocol Badges */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span className="protocol-badge protocol-tcp">
                  <Cable size={12} /> TCP/IP :4840
                </span>
                <span className="protocol-badge protocol-ws">
                  <Wifi size={12} /> WebSocket
                </span>
              </div>

              {/* Client Icons */}
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginTop: '1rem' }}>
                <div className="client-icon-box">
                  <div className="icon-wrapper" style={{ background: 'rgba(0, 212, 255, 0.1)' }}>
                    <Monitor size={24} style={{ color: 'var(--accent-cyan)' }} />
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Desktop</span>
                  <span className="protocol-badge protocol-tcp" style={{ marginTop: '0.3rem', fontSize: '0.55rem' }}>TCP/IP</span>
                </div>
                <div className="client-icon-box">
                  <div className="icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                    <Globe size={24} style={{ color: 'var(--accent-purple)' }} />
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Web Client</span>
                  <span className="protocol-badge protocol-ws" style={{ marginTop: '0.3rem', fontSize: '0.55rem' }}>WebSocket</span>
                </div>
                <div className="client-icon-box">
                  <div className="icon-wrapper" style={{ background: 'rgba(236, 72, 153, 0.1)' }}>
                    <Smartphone size={24} style={{ color: 'var(--accent-pink)' }} />
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Mobile</span>
                  <span className="protocol-badge protocol-ws" style={{ marginTop: '0.3rem', fontSize: '0.55rem' }}>WebSocket</span>
                </div>
              </div>

              {/* Connection Animation */}
              <div style={{ position: 'relative', height: '40px', marginTop: '1rem' }}>
                <svg width="100%" height="40" viewBox="0 0 300 40">
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--accent-cyan)" />
                      <stop offset="100%" stopColor="var(--accent-green)" />
                    </linearGradient>
                  </defs>
                  <path d="M50 20 L250 20" stroke="url(#lineGradient)" strokeWidth="2" className="connection-line" fill="none" />
                  <circle cx="150" cy="20" r="4" fill="var(--accent-cyan)">
                    <animate attributeName="cx" values="50;250;50" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <text x="150" y="35" textAnchor="middle" fill="var(--text-muted)" fontSize="8">Request/Response</text>
                </svg>
              </div>
            </div>

            {/* Center: OPC UA Server */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div className="server-core animate-glow" style={{ width: '200px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  margin: '0 auto 0.8rem',
                  background: 'linear-gradient(135deg, var(--accent-green), var(--accent-cyan))',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Server size={32} style={{ color: 'white' }} />
                </div>
                <h3 style={{ margin: '0 0 0.3rem', fontSize: '1rem', color: 'white' }}>OPC UA Server</h3>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--accent-green)' }}>Simulation Engine</p>
                <div style={{
                  marginTop: '0.8rem',
                  padding: '0.4rem',
                  background: 'var(--bg-dark)',
                  borderRadius: '6px',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '0.6rem',
                  color: 'var(--accent-cyan)'
                }}>
                  opc.tcp://localhost:4840
                </div>
              </div>

              {/* Dual arrows */}
              <svg width="200" height="80" style={{ marginTop: '-10px' }}>
                <defs>
                  <marker id="arrowLeft" markerWidth="8" markerHeight="8" refX="0" refY="3" orient="auto">
                    <path d="M8,0 L8,6 L0,3 z" fill="var(--accent-cyan)" />
                  </marker>
                  <marker id="arrowRight" markerWidth="8" markerHeight="8" refX="8" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="var(--accent-orange)" />
                  </marker>
                </defs>
                <path d="M20 30 L80 30" stroke="var(--accent-cyan)" strokeWidth="2" markerStart="url(#arrowLeft)" className="connection-line" />
                <path d="M120 30 L180 30" stroke="var(--accent-orange)" strokeWidth="2" markerEnd="url(#arrowRight)" className="connection-line" />
                <text x="50" y="50" textAnchor="middle" fill="var(--accent-cyan)" fontSize="8" fontWeight="600">C/S</text>
                <text x="150" y="50" textAnchor="middle" fill="var(--accent-orange)" fontSize="8" fontWeight="600">PubSub</text>
              </svg>
            </div>

            {/* Right: PubSub Model */}
            <div className="comm-model-card" style={{ borderColor: 'var(--accent-orange)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Radio size={20} style={{ color: 'var(--accent-orange)' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-orange)' }}>Pub/Sub Model</h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Scalable • Stateless • Decoupled Distribution
              </p>

              {/* Protocol Badge */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <span className="protocol-badge protocol-mqtt">
                  <MessageSquare size={12} /> MQTT Broker
                </span>
              </div>

              {/* Broker Icon */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '0.8rem 0',
                padding: '1rem',
                background: 'rgba(245, 158, 11, 0.1)',
                borderRadius: '12px',
                border: '1px dashed var(--accent-orange)'
              }}>
                <Cloud size={32} style={{ color: 'var(--accent-orange)', marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-orange)' }}>Message Broker</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>MQTT / AMQP</span>
              </div>

              {/* Topic Display */}
              <div className="topic-display" style={{ marginBottom: '0.8rem' }}>
                plant/pumps/Pump_01/telemetry
              </div>

              {/* Subscribers */}
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
                <div className="client-icon-box" style={{ padding: '0.6rem' }}>
                  <Globe size={20} style={{ color: 'var(--accent-pink)' }} />
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Dashboard</span>
                </div>
                <div className="client-icon-box" style={{ padding: '0.6rem' }}>
                  <Database size={20} style={{ color: 'var(--accent-purple)' }} />
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Historian</span>
                </div>
                <div className="client-icon-box" style={{ padding: '0.6rem' }}>
                  <Activity size={20} style={{ color: 'var(--accent-green)' }} />
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Analytics</span>
                </div>
              </div>

              {/* Subscription Flow */}
              <div style={{ position: 'relative', height: '30px', marginTop: '0.8rem' }}>
                <svg width="100%" height="30" viewBox="0 0 300 30">
                  <circle r="3" fill="var(--accent-orange)">
                    <animate attributeName="cx" values="50;150;250" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="15;15;15" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle r="3" fill="var(--accent-orange)" opacity="0.5">
                    <animate attributeName="cx" values="50;150;250" dur="2s" begin="0.3s" repeatCount="indefinite" />
                  </circle>
                  <circle r="3" fill="var(--accent-orange)" opacity="0.3">
                    <animate attributeName="cx" values="50;150;250" dur="2s" begin="0.6s" repeatCount="indefinite" />
                  </circle>
                  <text x="150" y="28" textAnchor="middle" fill="var(--text-muted)" fontSize="7">Broadcast to Subscribers</text>
                </svg>
              </div>
            </div>
          </div>

          {/* Bottom Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem'
          }}>
            {[
              { icon: <Cable size={18} />, title: 'TCP/IP', desc: 'Desktop OPC UA Clients', color: 'var(--accent-cyan)' },
              { icon: <Wifi size={18} />, title: 'WebSocket', desc: 'Browser-based Clients', color: 'var(--accent-purple)' },
              { icon: <Cloud size={18} />, title: 'MQTT Broker', desc: 'Scalable Distribution', color: 'var(--accent-orange)' },
              { icon: <Radio size={18} />, title: 'Topics', desc: 'Semantic Namespaces', color: 'var(--accent-green)' },
            ].map((item, i) => (
              <div key={i} className="content-card animate-fade-in" style={{
                textAlign: 'center',
                padding: '0.8rem',
                animationDelay: `${i * 0.1}s`
              }}>
                <div style={{ color: item.color, marginBottom: '0.3rem', display: 'flex', justifyContent: 'center' }}>
                  {item.icon}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: item.color }}>{item.title}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
            ))}
          </div>

          <div className="highlight-box" style={{ marginTop: '1rem' }}>
            <p style={{ margin: 0 }}>
              <strong style={{ color: 'var(--accent-cyan)' }}>Client–Server</strong> for interactive control & real-time monitoring •
              <strong style={{ color: 'var(--accent-orange)' }}> PubSub</strong> for massive scale telemetry to cloud, historians & analytics
            </p>
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
