// OPC UA Architecture Presentation Page - Fullscreen presentation view

'use client';

import * as React from 'react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { usePumpStore } from '@/stores/pump-store';
import { usePumpWebSocket } from '@/hooks/use-pump-websocket';
import { Server, Zap, Activity, Info, Play, RefreshCw, Layers, ShieldCheck, Database, LayoutGrid, Monitor, Smartphone, Globe, Laptop, Cloud, Radio, ArrowLeftRight, Wifi, Cable, MessageSquare, Sun, Moon, Lock, User, AlertTriangle, Shield } from 'lucide-react';

const TOTAL_SLIDES = 22;

type Theme = 'dark' | 'business';

export default function ArchitecturePage() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const [isPacketWalking, setIsPacketWalking] = useState(false);
  const [simStatus, setSimStatus] = useState<string>("");
  const [commModel, setCommModel] = useState<string>("");
  const [theme, setTheme] = useState<Theme>('dark');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showKeyboardHints, setShowKeyboardHints] = useState<boolean>(true);
  const [showServerStatus, setShowServerStatus] = useState<boolean>(true);
  const [focusedBox, setFocusedBox] = useState<string | null>(null);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'business' : 'dark');
  }, []);
  const { pumps, pumpData, fetchPumps } = usePumpStore();
  const { isConnected } = usePumpWebSocket();

  // Update current time on client side only
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toISOString().split('T')[1].split('.')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
      } else if (e.key === 't') {
        // 't' for Theme toggle
        toggleTheme();
      } else if (e.key === 'k') {
        // 'k' for Keyboard hints toggle
        setShowKeyboardHints(prev => !prev);
      } else if (e.key === 's') {
        // 's' for Server status toggle
        setShowServerStatus(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, goToSlide, toggleTheme]);

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
        /* ========== DARK THEME (Default) ========== */
        .theme-dark {
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
          --nav-bg: rgba(10, 14, 23, 0.95);
          --grid-color: rgba(0, 212, 255, 0.02);
          --card-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          --code-bg: #0d1117;
        }

        /* ========== BUSINESS THEME (Professional Light) ========== */
        .theme-business {
          --bg-dark: #f8fafc;
          --bg-card: #ffffff;
          --bg-elevated: #f1f5f9;
          --accent-cyan: #0284c7;
          --accent-green: #059669;
          --accent-orange: #d97706;
          --accent-red: #dc2626;
          --accent-purple: #7c3aed;
          --accent-pink: #db2777;
          --text-primary: #0f172a;
          --text-secondary: #475569;
          --text-muted: #64748b;
          --border-color: #e2e8f0;
          --nav-bg: rgba(255, 255, 255, 0.95);
          --grid-color: rgba(2, 132, 199, 0.03);
          --card-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          --code-bg: #f8fafc;
        }

        /* Business theme specific overrides */
        .theme-business .content-card {
          box-shadow: var(--card-shadow);
        }

        .theme-business .diagram-container {
          box-shadow: var(--card-shadow);
        }

        .theme-business .pres-nav-btn {
          background: var(--bg-card);
          border-color: var(--border-color);
          color: var(--text-primary);
        }

        .theme-business .pres-nav-btn:hover {
          background: var(--accent-cyan);
          color: white;
        }

        .theme-business .slide-counter {
          background: var(--bg-elevated);
          color: var(--text-secondary);
        }

        .theme-business .section-number {
          color: var(--accent-cyan);
        }

        .theme-business .highlight-box {
          background: linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(5, 150, 105, 0.08));
          border-color: rgba(2, 132, 199, 0.3);
        }

        .theme-business .code-block {
          background: var(--code-bg);
          border: 1px solid var(--border-color);
        }

        .theme-business .title-slide h1 {
          background: linear-gradient(135deg, var(--accent-cyan), var(--accent-green));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .theme-business .meta-item {
          background: var(--bg-card);
          box-shadow: var(--card-shadow);
        }

        .theme-business .live-badge {
          background: linear-gradient(135deg, rgba(5, 150, 105, 0.15), rgba(2, 132, 199, 0.15));
          border-color: var(--accent-green);
        }

        /* SVG adjustments for business theme */
        .theme-business svg text {
          fill: var(--text-primary);
        }

        .theme-business svg rect[fill="#111827"] {
          fill: var(--bg-card);
        }

        .theme-business svg rect[fill="#1e293b"] {
          fill: var(--border-color);
        }

        /* Protocol boxes in Slide 4 - Tower of Babel */
        .theme-business .protocol-box-bg {
          fill: var(--bg-card) !important;
        }

        .theme-business .protocol-vendor-text {
          fill: var(--text-secondary) !important;
        }

        /* Fix for any dark rgba backgrounds in SVGs */
        .theme-business svg rect[fill^="rgba(17"] {
          fill: var(--bg-card);
        }

        /* Timeline and other SVG backgrounds */
        .theme-business svg rect[fill^="rgba(17, 24, 39"] {
          fill: var(--bg-card);
        }

        /* Chaos code block in business theme */
        .theme-business .chaos-code-block {
          background: linear-gradient(135deg, rgba(248, 250, 252, 0.95), rgba(241, 245, 249, 0.9));
          border-color: rgba(220, 38, 38, 0.3);
        }

        .theme-business .chaos-code-block::before {
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(220, 38, 38, 0.02) 2px,
            rgba(220, 38, 38, 0.02) 4px
          );
        }

        /* Protocol island in business theme */
        .theme-business .protocol-island {
          background: var(--bg-card);
          border-color: var(--border-color);
        }

        /* Comm model cards in business theme */
        .theme-business .comm-model-card {
          background: var(--bg-card);
          box-shadow: var(--card-shadow);
        }

        .theme-business .comm-model-card::before {
          background: linear-gradient(90deg, var(--accent-cyan), var(--accent-green));
        }

        /* Layer cards in business theme */
        .theme-business .layer-card {
          background: var(--bg-card);
          box-shadow: var(--card-shadow);
        }

        /* Agenda items in business theme */
        .theme-business .agenda-item {
          background: var(--bg-card);
          box-shadow: var(--card-shadow);
        }

        .theme-business .agenda-item:hover {
          background: var(--bg-elevated);
        }

        /* Quote styling in business theme */
        .theme-business .quote {
          background: linear-gradient(135deg, rgba(2, 132, 199, 0.05), rgba(5, 150, 105, 0.05));
          border-left-color: var(--accent-cyan);
        }

        /* Two column styling in business theme */
        .theme-business .two-column .content-card {
          box-shadow: var(--card-shadow);
        }

        /* Keyboard hint in business theme */
        .theme-business .keyboard-hint {
          background: var(--bg-card);
          box-shadow: var(--card-shadow);
        }

        .theme-business .keyboard-hint kbd {
          background: var(--bg-elevated);
          border-color: var(--border-color);
        }

        .presentation-container {
          font-family: 'Space Grotesk', sans-serif;
          background: var(--bg-dark);
          color: var(--text-primary);
          line-height: 1.6;
          min-height: 100vh;
          transition: background 0.3s ease, color 0.3s ease;
        }

        .presentation-container::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: linear-gradient(var(--grid-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .pres-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: var(--nav-bg);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--border-color);
          z-index: 1000;
          padding: 0.6rem 1.5rem;
          transition: background 0.3s ease, border-color 0.3s ease;
        }

        /* Theme toggle button */
        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.35rem 0.7rem;
          border-radius: 5px;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.75rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .theme-toggle:hover {
          border-color: var(--accent-cyan);
          background: rgba(0, 212, 255, 0.1);
        }

        .theme-toggle svg {
          width: 14px;
          height: 14px;
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

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }

        @keyframes glitch {
          0%, 100% { clip-path: inset(0 0 0 0); transform: translate(0); }
          20% { clip-path: inset(20% 0 60% 0); transform: translate(-2px, 2px); }
          40% { clip-path: inset(40% 0 40% 0); transform: translate(2px, -1px); }
          60% { clip-path: inset(60% 0 20% 0); transform: translate(-1px, 1px); }
          80% { clip-path: inset(80% 0 0 0); transform: translate(1px, -2px); }
        }

        @keyframes flicker {
          0%, 100% { opacity: 1; }
          5% { opacity: 0.8; }
          10% { opacity: 1; }
          15% { opacity: 0.6; }
          20% { opacity: 1; }
          50% { opacity: 0.9; }
          55% { opacity: 1; }
        }

        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }

        @keyframes brokenLine {
          0%, 100% { stroke-dashoffset: 0; opacity: 0.5; }
          50% { stroke-dashoffset: 10; opacity: 0.2; }
        }

        @keyframes questionMark {
          0%, 100% { opacity: 0.4; transform: scale(1) rotate(0deg); }
          25% { opacity: 1; transform: scale(1.2) rotate(5deg); }
          50% { opacity: 0.6; transform: scale(0.9) rotate(-5deg); }
          75% { opacity: 0.9; transform: scale(1.1) rotate(3deg); }
        }

        @keyframes protocolFloat {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }

        @keyframes staticNoise {
          0% { background-position: 0 0; }
          10% { background-position: -5% -5%; }
          20% { background-position: 10% 5%; }
          30% { background-position: -15% 10%; }
          40% { background-position: 5% -10%; }
          50% { background-position: -10% 15%; }
          60% { background-position: 15% 5%; }
          70% { background-position: 0% 10%; }
          80% { background-position: 3% -5%; }
          90% { background-position: -5% 0%; }
          100% { background-position: 0 0; }
        }

        .protocol-island {
          background: var(--bg-elevated);
          border: 2px dashed var(--border-color);
          border-radius: 12px;
          padding: 1rem;
          position: relative;
          animation: protocolFloat 4s ease-in-out infinite;
          transition: all 0.3s;
        }

        .protocol-island:hover {
          border-color: var(--accent-red);
          animation-play-state: paused;
        }

        .protocol-island::after {
          content: '?';
          position: absolute;
          top: -10px;
          right: -10px;
          width: 24px;
          height: 24px;
          background: var(--accent-red);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.9rem;
          color: white;
          animation: questionMark 2s ease-in-out infinite;
        }

        .chaos-code-block {
          background: linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(26, 34, 52, 0.9));
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          padding: 1rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          position: relative;
          overflow: hidden;
        }

        .chaos-code-block::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(239, 68, 68, 0.03) 2px,
              rgba(239, 68, 68, 0.03) 4px
            );
          animation: staticNoise 0.5s steps(10) infinite;
          pointer-events: none;
        }

        .chaos-line {
          animation: flicker 3s ease-in-out infinite;
        }

        .chaos-line:nth-child(2) { animation-delay: 0.5s; }
        .chaos-line:nth-child(3) { animation-delay: 1s; }
        .chaos-line:nth-child(4) { animation-delay: 1.5s; }

        .broken-connection {
          stroke-dasharray: 5 5;
          animation: brokenLine 1.5s ease-in-out infinite;
        }

        @keyframes signalPulse {
          0%, 100% { r: 3; opacity: 1; }
          50% { r: 6; opacity: 0.6; }
        }

        @keyframes dataRise {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-400px); opacity: 0; }
        }

        @keyframes electricFlow {
          0% { stroke-dashoffset: 20; }
          100% { stroke-dashoffset: 0; }
        }

        @keyframes sensorBlink {
          0%, 100% { fill: #10b981; filter: drop-shadow(0 0 3px #10b981); }
          50% { fill: #34d399; filter: drop-shadow(0 0 8px #34d399); }
        }

        @keyframes pumpRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes layerGlow {
          0%, 100% { box-shadow: 0 0 5px rgba(0, 212, 255, 0.2); }
          50% { box-shadow: 0 0 20px rgba(0, 212, 255, 0.5); }
        }

        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes morphGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(16, 185, 129, 0.2);
            border-color: var(--accent-cyan);
          }
          50% {
            box-shadow: 0 0 30px rgba(16, 185, 129, 0.4), 0 0 60px rgba(0, 212, 255, 0.3);
            border-color: var(--accent-green);
          }
        }

        @keyframes packetTravel {
          0% { offset-distance: 0%; opacity: 1; }
          100% { offset-distance: 100%; opacity: 1; }
        }

        @keyframes typewriterCursor {
          0%, 50% { border-right-color: var(--accent-cyan); }
          51%, 100% { border-right-color: transparent; }
        }

        @keyframes rainbowGlow {
          0% { filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.8)); }
          25% { filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.8)); }
          50% { filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.8)); }
          75% { filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.8)); }
          100% { filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.8)); }
        }

        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-100px) rotate(10deg); opacity: 0; }
        }

        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          14% { transform: scale(1.1); }
          28% { transform: scale(1); }
          42% { transform: scale(1.1); }
          70% { transform: scale(1); }
        }

        .animate-slide-left {
          animation: slideInLeft 0.6s ease-out forwards;
        }

        .animate-slide-right {
          animation: slideInRight 0.6s ease-out forwards;
        }

        .animate-scale-in {
          animation: scaleIn 0.5s ease-out forwards;
        }

        .animate-morph-glow {
          animation: morphGlow 3s ease-in-out infinite;
        }

        .animate-heartbeat {
          animation: heartbeat 1.5s ease-in-out infinite;
        }

        .animate-rainbow {
          animation: rainbowGlow 4s linear infinite;
        }

        /* Interactive Demo Styles */
        .demo-terminal {
          background: linear-gradient(180deg, #0d1117 0%, #161b22 100%);
          border: 1px solid #30363d;
          border-radius: 12px;
          overflow: hidden;
          font-family: 'JetBrains Mono', monospace;
        }

        .demo-terminal-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #21262d;
          border-bottom: 1px solid #30363d;
        }

        .demo-terminal-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .demo-terminal-body {
          padding: 16px;
          min-height: 200px;
          max-height: 300px;
          overflow-y: auto;
        }

        .demo-terminal-line {
          display: flex;
          gap: 8px;
          margin-bottom: 4px;
          font-size: 0.75rem;
        }

        .demo-terminal-prompt {
          color: var(--accent-green);
          font-weight: 600;
        }

        .demo-terminal-output {
          color: #c9d1d9;
        }

        /* Message Sequence Diagram Styles */
        .sequence-diagram {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .sequence-lifeline {
          stroke-dasharray: 8 4;
          animation: dataFlow 2s linear infinite;
        }

        .sequence-message {
          transition: all 0.3s ease;
        }

        .sequence-message:hover {
          transform: scale(1.05);
          filter: drop-shadow(0 0 8px var(--accent-cyan));
        }

        /* Keyboard Hints Overlay */
        .keyboard-hints {
          position: fixed;
          bottom: 80px;
          left: 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 0.8rem;
          font-size: 0.7rem;
          z-index: 999;
          opacity: 0.9;
          transition: opacity 0.3s;
        }

        .keyboard-hints:hover {
          opacity: 1;
        }

        .keyboard-hint-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.3rem;
        }

        .keyboard-hint-row:last-child {
          margin-bottom: 0;
        }

        .kbd {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 24px;
          height: 22px;
          padding: 0 6px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem;
          font-weight: 600;
          color: var(--text-secondary);
          box-shadow: 0 2px 0 var(--border-color);
        }

        /* Live Control Panel */
        .control-panel {
          background: linear-gradient(135deg, var(--bg-card) 0%, rgba(0, 212, 255, 0.05) 100%);
          border: 2px solid var(--accent-cyan);
          border-radius: 16px;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .control-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--accent-cyan), var(--accent-green), var(--accent-purple));
        }

        .control-button {
          background: linear-gradient(135deg, var(--accent-green) 0%, #059669 100%);
          color: white;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .control-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
        }

        .control-button.stop {
          background: linear-gradient(135deg, var(--accent-red) 0%, #dc2626 100%);
        }

        .control-button.stop:hover {
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
        }

        .gauge-container {
          position: relative;
          width: 120px;
          height: 120px;
        }

        .gauge-ring {
          fill: none;
          stroke: var(--border-color);
          stroke-width: 10;
        }

        .gauge-value {
          fill: none;
          stroke-width: 10;
          stroke-linecap: round;
          transform-origin: center;
          transform: rotate(-90deg);
          transition: stroke-dashoffset 0.5s ease;
        }

        /* Zoomable Box Styles */
        .zoomable-box {
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .zoomable-box:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
        }

        .zoom-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .zoom-content {
          background: var(--bg-card);
          border-radius: 16px;
          padding: 2rem;
          max-width: 90vw;
          max-height: 85vh;
          overflow-y: auto;
          animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
          position: relative;
        }

        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .zoom-close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: var(--bg-elevated);
          color: var(--text-muted);
          font-size: 1.2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .zoom-close-btn:hover {
          background: var(--accent-red);
          border-color: var(--accent-red);
          color: white;
          transform: rotate(90deg);
        }

        .zoom-hint {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.75rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .click-to-zoom-hint {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          font-size: 0.6rem;
          color: var(--text-muted);
          background: var(--bg-dark);
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .zoomable-box:hover .click-to-zoom-hint {
          opacity: 1;
        }

        .data-particle {
          animation: dataRise 3s linear infinite;
        }

        .data-particle:nth-child(2) { animation-delay: 0.5s; }
        .data-particle:nth-child(3) { animation-delay: 1s; }
        .data-particle:nth-child(4) { animation-delay: 1.5s; }
        .data-particle:nth-child(5) { animation-delay: 2s; }

        .layer-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1rem;
          position: relative;
          transition: all 0.3s ease;
        }

        .layer-card:hover {
          transform: translateX(5px);
          border-color: var(--accent-cyan);
          animation: layerGlow 1.5s ease-in-out infinite;
        }

        .layer-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          border-radius: 12px 0 0 12px;
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

      <div className={`presentation-container theme-${theme}`}>
        {/* Navigation */}
        <nav className="pres-nav">
          <div className="pres-nav-inner">
            <div className="pres-nav-logo">
              OPC<span>::</span>UA<span>::</span>Presentation
            </div>
            <div className="pres-nav-controls">
              {/* Theme Toggle Button */}
              <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'Business' : 'Dark'} theme`}>
                {theme === 'dark' ? (
                  <>
                    <Sun size={14} />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon size={14} />
                    <span>Dark</span>
                  </>
                )}
              </button>
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
            A Practical OPC UA Client–Server Demonstration Using <b>Rock Creek</b> Wastewater Treatment Pump Model
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.5rem' }}>
            OPC UA is <span style={{ color: 'var(--accent-cyan)' }}>industry-agnostic</span> — wastewater treatment is used for brevity.
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
              { num: '01', title: 'Introduction', desc: 'Why OPC UA Exists & Industrial Reality', icon: <Info size={18} />, color: 'var(--accent-cyan)', slides: [3, 4, 5] },
              { num: '02', title: 'Address Space & Modeling', desc: 'Information Modeling & NodeClasses', icon: <Database size={18} />, color: 'var(--accent-purple)', slides: [9, 10, 16] },
              { num: '03', title: 'Core Concepts', desc: 'Client–Server & PubSub Architectures', icon: <ArrowLeftRight size={18} />, color: 'var(--accent-green)', slides: [7, 15, 17] },
              { num: '04', title: 'Services & Data Access', desc: 'Browse, Read, Subscribe, Call, History', icon: <Activity size={18} />, color: 'var(--accent-orange)', slides: [11] },
              { num: '05', title: 'Network & Security', desc: 'Transport, SecureChannel & RBAC', icon: <ShieldCheck size={18} />, color: 'var(--accent-pink)', slides: [6, 12, 8, 13, 14] },
              { num: '06', title: 'Future Directions', desc: 'TSN, 5G, OPC UA FX & Beyond', icon: <Globe size={18} />, color: 'var(--accent-cyan)', slides: [18] },
              { num: '07', title: 'Deep Dive: Communication', desc: 'Message Sequence & Session Flow', icon: <Radio size={18} />, color: 'var(--accent-green)', slides: [19] },
              { num: '08', title: 'Live Demo', desc: 'Interactive Pump Control & Real-time Data', icon: <Play size={18} />, color: 'var(--accent-orange)', slides: [20] },
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
                onClick={() => goToSlide(item.slides[0])}
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

        {/* Slide 3: Why Do We Need Industrial Communication? */}
        <section className="slide" id="slide-3">
          <div className="section-header">
            <div className="section-number">SECTION 01 • THE CHALLENGE</div>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              Why Do We Need Industrial Communication?
              <span style={{
                fontSize: '0.65rem',
                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(16, 185, 129, 0.15))',
                color: 'var(--accent-cyan)',
                padding: '0.3rem 0.8rem',
                borderRadius: '20px',
                fontWeight: 500,
                border: '1px solid rgba(0, 212, 255, 0.3)'
              }}>FROM SIGNAL TO INSIGHT</span>
            </h2>
            <p className="section-goal">Goal: Understand the data journey from physical world to enterprise decisions</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>

            {/* Left: Animated Data Flow Diagram */}
            <div className="diagram-container" style={{ position: 'relative', overflow: 'hidden', minHeight: '480px' }}>
              <div className="diagram-title" style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--accent-green)' }}>⚡</span> Data Journey: Physical → Digital → Business
              </div>

              <svg viewBox="0 0 450 420" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
                <defs>
                  {/* Gradients */}
                  <linearGradient id="dataFlowGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#00d4ff" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                  <linearGradient id="electricGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
                  </linearGradient>
                  <filter id="glowFilter">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Data Flow Arrow (vertical backbone) */}
                <rect x="210" y="20" width="30" height="380" rx="15" fill="url(#dataFlowGrad)" opacity="0.15" />
                <path d="M225 400 L225 30 M215 45 L225 20 L235 45" stroke="url(#dataFlowGrad)" strokeWidth="2" fill="none" opacity="0.6" />

                {/* Rising data particles */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <g key={i}>
                    <circle cx="225" cy={380 - i * 70} r="4" fill="#00d4ff" filter="url(#glowFilter)">
                      <animate attributeName="cy" values={`${380};20;380`} dur="4s" repeatCount="indefinite" begin={`${i * 0.8}s`} />
                      <animate attributeName="opacity" values="1;0.3;1" dur="4s" repeatCount="indefinite" begin={`${i * 0.8}s`} />
                    </circle>
                  </g>
                ))}

                {/* LAYER 5: Enterprise (Top) */}
                <g transform="translate(20, 20)">
                  <rect width="170" height="55" rx="8" fill="#111827" stroke="#8b5cf6" strokeWidth="2" />
                  <rect width="170" height="4" rx="2" fill="#8b5cf6" opacity="0.8" />
                  <text x="15" y="30" fill="#8b5cf6" fontSize="11" fontWeight="bold">ENTERPRISE</text>
                  <text x="15" y="45" fill="#94a3b8" fontSize="9">ERP • Analytics • Cloud</text>
                  <text x="145" y="35" fill="#8b5cf6" fontSize="16">☁️</text>
                </g>
                <g transform="translate(260, 20)">
                  <rect width="170" height="55" rx="8" fill="rgba(139, 92, 246, 0.1)" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="4 2" />
                  <text x="10" y="25" fill="#a78bfa" fontSize="9">Business Intelligence</text>
                  <text x="10" y="40" fill="#94a3b8" fontSize="8">• Predictive Maintenance</text>
                  <text x="10" y="52" fill="#94a3b8" fontSize="8">• Cost Optimization</text>
                </g>

                {/* LAYER 4: SCADA/HMI */}
                <g transform="translate(20, 95)">
                  <rect width="170" height="55" rx="8" fill="#111827" stroke="#ec4899" strokeWidth="2" />
                  <rect width="170" height="4" rx="2" fill="#ec4899" opacity="0.8" />
                  <text x="15" y="30" fill="#ec4899" fontSize="11" fontWeight="bold">SCADA / HMI</text>
                  <text x="15" y="45" fill="#94a3b8" fontSize="9">Visualization • Alarming</text>
                  <text x="145" y="35" fill="#ec4899" fontSize="16">🖥️</text>
                </g>
                <g transform="translate(260, 95)">
                  <rect width="170" height="55" rx="8" fill="rgba(236, 72, 153, 0.1)" stroke="#ec4899" strokeWidth="1" strokeDasharray="4 2" />
                  <text x="10" y="25" fill="#f472b6" fontSize="9">Operator Interface</text>
                  <text x="10" y="40" fill="#94a3b8" fontSize="8">• Real-time Dashboards</text>
                  <text x="10" y="52" fill="#94a3b8" fontSize="8">• Trend Analysis</text>
                </g>

                {/* LAYER 3: Industrial Network */}
                <g transform="translate(20, 170)">
                  <rect width="170" height="55" rx="8" fill="#111827" stroke="#f59e0b" strokeWidth="2" />
                  <rect width="170" height="4" rx="2" fill="#f59e0b" opacity="0.8" />
                  <text x="15" y="30" fill="#f59e0b" fontSize="11" fontWeight="bold">INDUSTRIAL NETWORK</text>
                  <text x="15" y="45" fill="#94a3b8" fontSize="9">OPC UA • Ethernet/IP</text>
                  <text x="145" y="35" fill="#f59e0b" fontSize="16">🔗</text>
                </g>
                <g transform="translate(260, 170)">
                  <rect width="170" height="55" rx="8" fill="rgba(245, 158, 11, 0.1)" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 2" />
                  <text x="10" y="25" fill="#fbbf24" fontSize="9">Protocol Translation</text>
                  <text x="10" y="40" fill="#94a3b8" fontSize="8">• Secure Transport</text>
                  <text x="10" y="52" fill="#94a3b8" fontSize="8">• Data Normalization</text>
                </g>

                {/* LAYER 2: PLC / Controllers */}
                <g transform="translate(20, 245)">
                  <rect width="170" height="55" rx="8" fill="#111827" stroke="#00d4ff" strokeWidth="2" />
                  <rect width="170" height="4" rx="2" fill="#00d4ff" opacity="0.8" />
                  <text x="15" y="30" fill="#00d4ff" fontSize="11" fontWeight="bold">PLC / CONTROLLERS</text>
                  <text x="15" y="45" fill="#94a3b8" fontSize="9">Logic • Vendor Protocols</text>
                  <text x="145" y="35" fill="#00d4ff" fontSize="16">🔲</text>
                </g>
                <g transform="translate(260, 245)">
                  <rect width="170" height="55" rx="8" fill="rgba(0, 212, 255, 0.1)" stroke="#00d4ff" strokeWidth="1" strokeDasharray="4 2" />
                  <text x="10" y="25" fill="#22d3ee" fontSize="9">Control Logic</text>
                  <text x="10" y="40" fill="#94a3b8" fontSize="8">• S7, EtherNet/IP, Modbus</text>
                  <text x="10" y="52" fill="#94a3b8" fontSize="8">• 4-20mA → Digital</text>
                </g>

                {/* LAYER 1: Sensors / Field Devices */}
                <g transform="translate(20, 320)">
                  <rect width="170" height="55" rx="8" fill="#111827" stroke="#10b981" strokeWidth="2" />
                  <rect width="170" height="4" rx="2" fill="#10b981" opacity="0.8" />
                  <text x="15" y="30" fill="#10b981" fontSize="11" fontWeight="bold">SENSORS / I/O</text>
                  <text x="15" y="45" fill="#94a3b8" fontSize="9">4-20mA • HART • Digital</text>
                  <text x="140" y="38" fill="#10b981" fontSize="18">📡</text>
                </g>
                <g transform="translate(260, 320)">
                  <rect width="170" height="55" rx="8" fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeWidth="1" strokeDasharray="4 2" />
                  <text x="10" y="25" fill="#34d399" fontSize="9">Field Instruments</text>
                  <text x="10" y="40" fill="#94a3b8" fontSize="8">• Pressure, Flow, Level</text>
                  <text x="10" y="52" fill="#94a3b8" fontSize="8">• VFD Feedback</text>
                </g>

                {/* LAYER 0: Physical Assets */}
                <g transform="translate(70, 395)">
                  <rect width="310" height="25" rx="5" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="1" />

                  {/* Animated pump icon */}
                  <g transform="translate(30, 12)">
                    <circle r="8" fill="none" stroke="#10b981" strokeWidth="2">
                      <animateTransform attributeName="transform" type="rotate" values="0;360" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <line x1="-5" y1="0" x2="5" y2="0" stroke="#10b981" strokeWidth="2">
                      <animateTransform attributeName="transform" type="rotate" values="0;360" dur="2s" repeatCount="indefinite" />
                    </line>
                  </g>
                  <text x="50" y="16" fill="#10b981" fontSize="10" fontWeight="bold">PUMP</text>

                  {/* Tank icon */}
                  <g transform="translate(130, 5)">
                    <rect x="0" y="0" width="20" height="15" rx="2" fill="none" stroke="#10b981" strokeWidth="1.5" />
                    <rect x="2" y="8" width="16" height="5" fill="#10b981" opacity="0.5">
                      <animate attributeName="y" values="8;5;8" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="height" values="5;10;5" dur="3s" repeatCount="indefinite" />
                    </rect>
                  </g>
                  <text x="155" y="16" fill="#10b981" fontSize="10" fontWeight="bold">TANK</text>

                  {/* Motor icon */}
                  <g transform="translate(230, 12)">
                    <rect x="-12" y="-6" width="24" height="12" rx="2" fill="none" stroke="#10b981" strokeWidth="1.5" />
                    <circle r="4" fill="#10b981" opacity="0.6">
                      <animate attributeName="opacity" values="0.3;1;0.3" dur="0.5s" repeatCount="indefinite" />
                    </circle>
                  </g>
                  <text x="250" y="16" fill="#10b981" fontSize="10" fontWeight="bold">MOTOR</text>
                </g>

                {/* Electric signal animation lines */}
                <g opacity="0.6">
                  {/* From assets to sensors */}
                  <path d="M225 390 L225 375" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2">
                    <animate attributeName="stroke-dashoffset" values="6;0" dur="0.5s" repeatCount="indefinite" />
                  </path>
                  {/* Between layers */}
                  <path d="M225 320 L225 300" stroke="#00d4ff" strokeWidth="2" strokeDasharray="4 2">
                    <animate attributeName="stroke-dashoffset" values="6;0" dur="0.5s" repeatCount="indefinite" />
                  </path>
                  <path d="M225 245 L225 225" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2">
                    <animate attributeName="stroke-dashoffset" values="6;0" dur="0.5s" repeatCount="indefinite" />
                  </path>
                  <path d="M225 170 L225 150" stroke="#ec4899" strokeWidth="2" strokeDasharray="4 2">
                    <animate attributeName="stroke-dashoffset" values="6;0" dur="0.5s" repeatCount="indefinite" />
                  </path>
                  <path d="M225 95 L225 75" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4 2">
                    <animate attributeName="stroke-dashoffset" values="6;0" dur="0.5s" repeatCount="indefinite" />
                  </path>
                </g>
              </svg>
            </div>

            {/* Right: The Challenge Explained */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>

              {/* The Problem Statement */}
              <div className="content-card" style={{
                borderColor: 'rgba(0, 212, 255, 0.3)',
                background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(0, 212, 255, 0.05) 100%)'
              }}>
                <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '0.8rem' }}>
                  <span className="icon" style={{ background: 'rgba(0, 212, 255, 0.1)' }}>🎯</span>
                  The Core Challenge
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Industrial systems generate <strong style={{ color: 'var(--accent-green)' }}>massive amounts of data</strong> from
                  physical processes. This data must travel from <strong style={{ color: 'var(--accent-cyan)' }}>electrical signals</strong> at
                  the sensor level all the way up to <strong style={{ color: 'var(--accent-purple)' }}>business decisions</strong> at the enterprise level.
                </p>
              </div>

              {/* Signal Types */}
              <div className="content-card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                <h3 style={{ color: 'var(--accent-green)' }}>
                  <span className="icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>⚡</span>
                  Signal Types at the Edge
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {[
                    { signal: '4-20mA', desc: 'Analog current' },
                    { signal: '0-10V', desc: 'Analog voltage' },
                    { signal: 'HART', desc: 'Digital overlay' },
                    { signal: 'Modbus RTU', desc: 'Serial digital' },
                  ].map((item, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem'
                    }}>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>{item.signal}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: '0.3rem' }}>— {item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What needs to happen */}
              <div className="content-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                <h3 style={{ color: 'var(--accent-orange)' }}>
                  <span className="icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>🔄</span>
                  What Must Happen
                </h3>
                <ul style={{ margin: 0, fontSize: '0.85rem' }}>
                  <li><strong>Convert</strong> electrical signals to digital values</li>
                  <li><strong>Contextualize</strong> raw data with metadata</li>
                  <li><strong>Transport</strong> securely across network layers</li>
                  <li><strong>Aggregate</strong> for analytics and visualization</li>
                </ul>
              </div>

              {/* The Question */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.1))',
                border: '2px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '12px',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.1rem', color: 'var(--accent-purple)', fontWeight: 600, marginBottom: '0.3rem' }}>
                  But how do all these layers talk to each other?
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Every vendor has their own protocol... 🤔
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Data transformation strip */}
          <div style={{
            marginTop: '1rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '0.8rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            overflow: 'hidden'
          }}>
            {[
              { label: 'Electrical Signal', value: '12.45 mA', color: '#10b981', icon: '⚡' },
              { label: '', value: '→', color: 'var(--text-muted)', icon: '' },
              { label: 'Raw Value', value: '1450', color: '#00d4ff', icon: '🔢' },
              { label: '', value: '→', color: 'var(--text-muted)', icon: '' },
              { label: 'Engineering Unit', value: '1450 RPM', color: '#f59e0b', icon: '⚙️' },
              { label: '', value: '→', color: 'var(--text-muted)', icon: '' },
              { label: 'Contextualized', value: 'Pump.Speed', color: '#ec4899', icon: '🏷️' },
              { label: '', value: '→', color: 'var(--text-muted)', icon: '' },
              { label: 'Business Insight', value: '85% efficiency', color: '#8b5cf6', icon: '📊' },
            ].map((item, idx) => (
              <div key={idx} style={{
                textAlign: 'center',
                animation: item.label ? 'fadeInUp 0.5s ease-out forwards' : 'none',
                animationDelay: `${idx * 0.1}s`,
                opacity: item.label ? 0 : 1,
                animationFillMode: 'forwards'
              }}>
                {item.label ? (
                  <>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{item.label}</div>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: item.color,
                      fontFamily: 'JetBrains Mono, monospace'
                    }}>
                      {item.icon} {item.value}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '1.2rem', color: item.color, animation: 'pulse 1s infinite' }}>{item.value}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Slide 4: Historical Challenges (was Slide 3) */}
        <section className="slide" id="slide-4">
          <div className="section-header">
            <div className="section-number">SECTION 01 • 0–5 MINUTES</div>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              Industrial Reality Before OPC UA
              <span style={{
                fontSize: '0.7rem',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                padding: '0.3rem 0.6rem',
                borderRadius: '6px',
                fontWeight: 500,
                animation: 'shake 0.5s ease-in-out infinite'
              }}>CHAOS</span>
            </h2>
            <p className="section-goal">Goal: Establish why OPC UA exists</p>
          </div>

          {/* Tower of Babel Visualization */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>

            {/* Left: Protocol Islands Diagram */}
            <div className="diagram-container" style={{ position: 'relative', overflow: 'visible' }}>
              <div className="diagram-title" style={{ marginBottom: '1rem' }}>
                <span style={{ color: 'var(--accent-red)' }}>🗼</span> Tower of Babel: Industrial Protocols
              </div>

              <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
                <defs>
                  <filter id="chaos-glow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feFlood floodColor="#ef4444" floodOpacity="0.5" />
                    <feComposite in2="blur" operator="in" />
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Broken connection lines with X marks */}
                <g className="broken-connection" style={{ opacity: 0.4 }}>
                  <line x1="100" y1="80" x2="300" y2="80" stroke="#ef4444" strokeWidth="2" />
                  <line x1="100" y1="150" x2="300" y2="220" stroke="#ef4444" strokeWidth="2" />
                  <line x1="300" y1="150" x2="100" y2="220" stroke="#ef4444" strokeWidth="2" />
                  {/* X marks on broken connections */}
                  <g transform="translate(200, 80)">
                    <line x1="-8" y1="-8" x2="8" y2="8" stroke="#ef4444" strokeWidth="3" />
                    <line x1="8" y1="-8" x2="-8" y2="8" stroke="#ef4444" strokeWidth="3" />
                  </g>
                  <g transform="translate(200, 185)">
                    <line x1="-8" y1="-8" x2="8" y2="8" stroke="#ef4444" strokeWidth="3" />
                    <line x1="8" y1="-8" x2="-8" y2="8" stroke="#ef4444" strokeWidth="3" />
                  </g>
                </g>

                {/* Protocol Islands */}
                {[
                  { x: 50, y: 30, protocol: 'S7', vendor: 'Siemens', color: '#00b4a0' },
                  { x: 250, y: 30, protocol: 'EtherNet/IP', vendor: 'Rockwell', color: '#e31937' },
                  { x: 50, y: 120, protocol: 'Modbus', vendor: 'Modicon', color: '#f59e0b' },
                  { x: 250, y: 120, protocol: 'Profibus', vendor: 'DIN/ISO', color: '#8b5cf6' },
                  { x: 50, y: 210, protocol: 'DeviceNet', vendor: 'ODVA', color: '#ec4899' },
                  { x: 250, y: 210, protocol: 'BACnet', vendor: 'ASHRAE', color: '#3b82f6' },
                ].map((island, idx) => (
                  <g key={idx} style={{ animation: `protocolFloat ${3 + idx * 0.5}s ease-in-out infinite`, animationDelay: `${idx * 0.3}s` }}>
                    <rect
                      className="protocol-box-bg"
                      x={island.x}
                      y={island.y}
                      width="100"
                      height="60"
                      rx="8"
                      fill={theme === 'business' ? '#ffffff' : 'rgba(17, 24, 39, 0.9)'}
                      stroke={island.color}
                      strokeWidth="2"
                      strokeDasharray="5 3"
                    />
                    <text x={island.x + 50} y={island.y + 25} textAnchor="middle" fill={island.color} fontSize="12" fontWeight="bold">
                      {island.protocol}
                    </text>
                    <text
                      className="protocol-vendor-text"
                      x={island.x + 50}
                      y={island.y + 45}
                      textAnchor="middle"
                      fill={theme === 'business' ? '#475569' : '#94a3b8'}
                      fontSize="9"
                    >
                      {island.vendor}
                    </text>
                    {/* Question mark */}
                    <circle cx={island.x + 95} cy={island.y + 5} r="10" fill="#ef4444">
                      <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" begin={`${idx * 0.2}s`} />
                    </circle>
                    <text x={island.x + 95} y={island.y + 10} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">?</text>
                  </g>
                ))}

                {/* Confusion clouds */}
                <g style={{ opacity: 0.6 }}>
                  <text x="200" y="105" textAnchor="middle" fill="#ef4444" fontSize="20" style={{ animation: 'pulse 1s infinite' }}>✗</text>
                  <text x="145" y="185" textAnchor="middle" fill="#ef4444" fontSize="16" style={{ animation: 'pulse 1.5s infinite' }}>✗</text>
                  <text x="255" y="185" textAnchor="middle" fill="#ef4444" fontSize="16" style={{ animation: 'pulse 1.2s infinite' }}>✗</text>
                </g>
              </svg>

              <div style={{
                textAlign: 'center',
                marginTop: '0.5rem',
                fontSize: '0.85rem',
                color: 'var(--accent-red)',
                fontWeight: 500
              }}>
                Every vendor spoke a different language
              </div>
            </div>

            {/* Right: Challenges + Cryptic Code */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Historical Challenges Card */}
              <div className="content-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                <h3 style={{ color: 'var(--accent-red)' }}>
                  <span className="icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>⚠</span>
                  Historical Challenges
                </h3>
                <ul style={{ margin: 0 }}>
                  {[
                    { text: 'Vendor lock-in', sub: 'each PLC spoke its own language' },
                    { text: 'Proprietary protocols', sub: 'undocumented & closed source' },
                    { text: 'Flat tag lists', sub: 'no semantics or context' },
                    { text: 'No security', sub: 'added externally, if at all' },
                  ].map((item, idx) => (
                    <li key={idx} style={{
                      animation: 'fadeInUp 0.5s ease-out forwards',
                      animationDelay: `${idx * 0.15}s`,
                      opacity: 0,
                      animationFillMode: 'forwards'
                    }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.text}</strong>
                      <span style={{ color: 'var(--text-muted)', marginLeft: '0.3rem' }}>— {item.sub}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Wastewater Reality - Cryptic Code */}
              <div className="content-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                <h3 style={{ color: 'var(--accent-orange)' }}>
                  <span className="icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>🏭</span>
                  Wastewater Reality: What Does This Mean?
                </h3>
                <div className="chaos-code-block">
                  <div className="chaos-line" style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#6b7280' }}>// PLC 1 (Siemens S7-1500)</span>
                  </div>
                  <div className="chaos-line" style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#00b4a0' }}>DB12.DBW34</span>
                    <span style={{ color: '#94a3b8' }}> = </span>
                    <span style={{ color: '#10b981' }}>1450</span>
                    <span style={{
                      color: '#ef4444',
                      marginLeft: '0.5rem',
                      animation: 'pulse 1.5s infinite'
                    }}>← ???</span>
                  </div>
                  <div className="chaos-line" style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#6b7280' }}>// PLC 2 (Allen-Bradley)</span>
                  </div>
                  <div className="chaos-line" style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#e31937' }}>N7:42</span>
                    <span style={{ color: '#94a3b8' }}> = </span>
                    <span style={{ color: '#10b981' }}>75.3</span>
                    <span style={{
                      color: '#ef4444',
                      marginLeft: '0.5rem',
                      animation: 'pulse 1.8s infinite'
                    }}>← Tank level? RPM?</span>
                  </div>
                  <div className="chaos-line">
                    <span style={{ color: '#6b7280' }}>// PLC 3 (Modbus)</span>
                  </div>
                  <div className="chaos-line">
                    <span style={{ color: '#f59e0b' }}>40001</span>
                    <span style={{ color: '#94a3b8' }}> = </span>
                    <span style={{ color: '#10b981' }}>0x05A4</span>
                    <span style={{
                      color: '#ef4444',
                      marginLeft: '0.5rem',
                      animation: 'pulse 2s infinite'
                    }}>← No documentation!</span>
                  </div>
                </div>

                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.6rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '8px',
                  borderLeft: '3px solid var(--accent-red)',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)'
                }}>
                  <strong style={{ color: 'var(--accent-red)' }}>Integration nightmare:</strong> Custom middleware for every vendor pair.
                  Hours of guesswork to understand legacy data.
                </div>
              </div>
            </div>
          </div>

          {/* Bottom summary bar */}
          <div style={{
            marginTop: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.75rem'
          }}>
            {[
              { icon: '🔒', label: 'Vendor Lock-in', color: '#ef4444' },
              { icon: '📋', label: 'No Standards', color: '#f59e0b' },
              { icon: '🔌', label: 'Integration Hell', color: '#ec4899' },
              { icon: '🛡️', label: 'Zero Security', color: '#8b5cf6' },
            ].map((item, idx) => (
              <div key={idx} style={{
                background: 'var(--bg-card)',
                border: `1px solid ${item.color}33`,
                borderRadius: '10px',
                padding: '0.75rem',
                textAlign: 'center',
                animation: 'fadeInUp 0.4s ease-out forwards',
                animationDelay: `${0.5 + idx * 0.1}s`,
                opacity: 0,
                animationFillMode: 'forwards'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{item.icon}</div>
                <div style={{ fontSize: '0.8rem', color: item.color, fontWeight: 600 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Slide 5: Classic OPC vs OPC UA - Enhanced with Timeline */}
        <section className="slide" id="slide-5">
          <div className="section-header">
            <div className="section-number">SECTION 01 • EVOLUTION</div>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              The Evolution: Classic OPC → OPC UA
              <span style={{
                fontSize: '0.65rem',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(16, 185, 129, 0.15))',
                color: 'var(--accent-green)',
                padding: '0.3rem 0.8rem',
                borderRadius: '20px',
                fontWeight: 500,
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>30 YEARS OF PROGRESS</span>
            </h2>
            <p className="section-goal">Goal: Understand the journey from proprietary to universal</p>
          </div>

          {/* Animated Timeline */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            marginBottom: '1rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div className="diagram-title" style={{ marginBottom: '0.8rem' }}>
              <span style={{ color: 'var(--accent-cyan)' }}>📅</span> OPC Foundation Timeline
            </div>

            <svg viewBox="0 0 900 150" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
              <defs>
                <linearGradient id="timelineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="40%" stopColor="#f59e0b" />
                  <stop offset="70%" stopColor="#00d4ff" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <filter id="timeGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feFlood floodColor="#00d4ff" floodOpacity="0.6" />
                  <feComposite in2="blur" operator="in" />
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Timeline base line */}
              <rect x="50" y="70" width="800" height="6" rx="3" fill={theme === 'business' ? '#e2e8f0' : '#1e293b'} />

              {/* Animated progress line */}
              <rect x="50" y="70" width="800" height="6" rx="3" fill="url(#timelineGrad)" opacity="0.8">
                <animate attributeName="width" values="0;800" dur="2s" fill="freeze" />
              </rect>

              {/* Timeline events */}
              {[
                { x: 60, year: '1996', label: 'OPC DA', desc: 'Data Access', color: '#ef4444', legacy: true },
                { x: 175, year: '1998', label: 'OPC HDA', desc: 'Historical', color: '#ef4444', legacy: true },
                { x: 290, year: '2000', label: 'OPC A&E', desc: 'Alarms', color: '#f59e0b', legacy: true },
                { x: 420, year: '2006', label: 'UA Dev', desc: 'Started', color: '#f59e0b', legacy: false },
                { x: 550, year: '2008', label: 'UA 1.0', desc: 'Released', color: '#00d4ff', legacy: false },
                { x: 680, year: '2018', label: 'PubSub', desc: 'Part 14', color: '#10b981', legacy: false },
                { x: 810, year: '2024', label: 'UA 1.05', desc: 'Cloud', color: '#10b981', legacy: false },
              ].map((event, idx) => (
                <g key={idx} style={{
                  animation: 'fadeInUp 0.5s ease-out forwards',
                  animationDelay: `${0.3 + idx * 0.15}s`,
                  opacity: 0,
                }}>
                  {/* Event dot */}
                  <circle cx={event.x} cy="73" r="10" fill={event.color} filter={!event.legacy ? 'url(#timeGlow)' : ''}>
                    <animate attributeName="r" values="0;10" dur="0.3s" fill="freeze" begin={`${0.3 + idx * 0.15}s`} />
                  </circle>
                  <circle cx={event.x} cy="73" r="5" fill={event.legacy ? (theme === 'business' ? '#e2e8f0' : '#1e293b') : 'white'} />

                  {/* Year label - above for even, below for odd */}
                  <text x={event.x} y={idx % 2 === 0 ? 45 : 105} textAnchor="middle" fill={event.color} fontSize="12" fontWeight="bold">
                    {event.year}
                  </text>

                  {/* Event label */}
                  <text x={event.x} y={idx % 2 === 0 ? 30 : 120} textAnchor="middle" fill={theme === 'business' ? '#0f172a' : '#e2e8f0'} fontSize="10" fontWeight="600">
                    {event.label}
                  </text>

                  {/* Description */}
                  <text x={event.x} y={idx % 2 === 0 ? 16 : 134} textAnchor="middle" fill={theme === 'business' ? '#64748b' : '#94a3b8'} fontSize="8">
                    {event.desc}
                  </text>
                </g>
              ))}

              {/* Era labels - positioned below the timeline */}
              <g>
                <rect x="20" y="90" width="130" height="16" rx="4" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 2" />
                <text x="75" y="101" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="600">CLASSIC OPC (DCOM)</text>
              </g>
              <g>
                <rect x="450" y="90" width="210" height="16" rx="4" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth="1" />
                <text x="530" y="101" textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="600">OPC UA (Platform Independent)</text>
              </g>
            </svg>
          </div>

          {/* Comparison Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'stretch' }}>

            {/* Classic OPC Card */}
            <div className="content-card" style={{
              borderColor: 'rgba(239, 68, 68, 0.4)',
              background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(239, 68, 68, 0.05) 100%)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Deprecated overlay effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                background: 'linear-gradient(135deg, transparent 50%, rgba(239, 68, 68, 0.1) 50%)',
                width: '80px',
                height: '80px'
              }} />
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '-25px',
                background: '#ef4444',
                color: 'white',
                fontSize: '0.6rem',
                fontWeight: 700,
                padding: '0.2rem 2rem',
                transform: 'rotate(45deg)',
                letterSpacing: '1px'
              }}>LEGACY</div>

              <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="icon" style={{ background: 'rgba(239,68,68,0.1)', fontSize: '1.2rem' }}>📦</span>
                Classic OPC (1996-2006)
              </h3>

              <div style={{ marginTop: '0.8rem' }}>
                {[
                  { icon: '🪟', text: 'Windows + DCOM only', bad: true },
                  { icon: '🔓', text: 'No encryption', bad: true },
                  { icon: '🚫', text: 'Firewall nightmare', bad: true },
                  { icon: '📊', text: 'Data only, no context', bad: true },
                  { icon: '🔌', text: 'Separate specs (DA, HDA, A&E)', bad: true },
                ].map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.4rem 0',
                    borderBottom: idx < 4 ? '1px solid rgba(239, 68, 68, 0.1)' : 'none',
                    animation: 'fadeInUp 0.4s ease-out forwards',
                    animationDelay: `${1 + idx * 0.1}s`,
                    opacity: 0,
                    animationFillMode: 'forwards'
                  }}>
                    <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', flex: 1 }}>{item.text}</span>
                    <span style={{ color: '#ef4444', fontSize: '1rem' }}>✗</span>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: '0.8rem',
                padding: '0.5rem',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>
                  ⚠️ Deprecated - Do not use in new projects
                </span>
              </div>
            </div>

            {/* Transformation Arrow */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 0.5rem'
            }}>
              <svg viewBox="0 0 60 200" style={{ width: '60px', height: '200px' }}>
                <defs>
                  <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <marker id="arrowHead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
                  </marker>
                </defs>

                {/* Vertical transformation line */}
                <path d="M30 20 L30 180" stroke="url(#arrowGrad)" strokeWidth="3" fill="none" strokeDasharray="8 4">
                  <animate attributeName="stroke-dashoffset" values="24;0" dur="1s" repeatCount="indefinite" />
                </path>

                {/* Arrow pointing right */}
                <path d="M10 100 L50 100" stroke="url(#arrowGrad)" strokeWidth="4" markerEnd="url(#arrowHead)">
                  <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
                </path>

                {/* Evolution text */}
                <text x="30" y="60" textAnchor="middle" fill="#f59e0b" fontSize="8" fontWeight="bold">EVOLVE</text>
                <text x="30" y="150" textAnchor="middle" fill="#00d4ff" fontSize="8" fontWeight="bold">UNIFY</text>
              </svg>
            </div>

            {/* OPC UA Card */}
            <div className="content-card" style={{
              borderColor: 'rgba(16, 185, 129, 0.4)',
              background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(16, 185, 129, 0.08) 100%)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Modern badge */}
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '-20px',
                background: 'linear-gradient(135deg, #10b981, #00d4ff)',
                color: 'white',
                fontSize: '0.6rem',
                fontWeight: 700,
                padding: '0.2rem 2rem',
                transform: 'rotate(45deg)',
                letterSpacing: '1px'
              }}>CURRENT</div>

              <h3 style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="icon" style={{ background: 'rgba(16, 185, 129, 0.1)', fontSize: '1.2rem' }}>🚀</span>
                OPC UA (2008-Present)
              </h3>

              <div style={{ marginTop: '0.8rem' }}>
                {[
                  { icon: '🌐', text: 'Platform independent', good: true },
                  { icon: '🔒', text: 'Security built-in (X.509)', good: true },
                  { icon: '🔥', text: 'Firewall friendly (single port)', good: true },
                  { icon: '🧠', text: 'Rich information modeling', good: true },
                  { icon: '📦', text: 'Unified spec (DA+HDA+A&E+more)', good: true },
                ].map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.4rem 0',
                    borderBottom: idx < 4 ? '1px solid rgba(16, 185, 129, 0.1)' : 'none',
                    animation: 'fadeInUp 0.4s ease-out forwards',
                    animationDelay: `${1.2 + idx * 0.1}s`,
                    opacity: 0,
                    animationFillMode: 'forwards'
                  }}>
                    <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', flex: 1 }}>{item.text}</span>
                    <span style={{ color: '#10b981', fontSize: '1rem' }}>✓</span>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: '0.8rem',
                padding: '0.5rem',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                  ✨ IEC 62541 International Standard
                </span>
              </div>
            </div>
          </div>

          {/* Bottom: OPC UA is a Platform */}
          <div style={{
            marginTop: '1rem',
            background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(16, 185, 129, 0.1))',
            border: '2px solid rgba(0, 212, 255, 0.3)',
            borderRadius: '12px',
            padding: '1rem',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #00d4ff, #10b981)',
              borderRadius: '12px',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>🏗️</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'white', letterSpacing: '1px' }}>PLATFORM</div>
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
                OPC UA is a Platform, Not Just a Protocol
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {[
                  { label: 'Communication Protocol', color: '#00d4ff' },
                  { label: 'Information Modeling', color: '#10b981' },
                  { label: 'Security Framework', color: '#f59e0b' },
                  { label: 'Scalable Architecture', color: '#8b5cf6' },
                ].map((item, idx) => (
                  <span key={idx} style={{
                    background: `${item.color}20`,
                    border: `1px solid ${item.color}40`,
                    color: item.color,
                    padding: '0.3rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    animation: 'fadeInUp 0.4s ease-out forwards',
                    animationDelay: `${1.8 + idx * 0.1}s`,
                    opacity: 0,
                    animationFillMode: 'forwards'
                  }}>
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Slide 6: Address Space */}
        <section className="slide" id="slide-6">
          <div className="section-header">
            <div className="section-number">SECTION 02 • 12–22 MINUTES</div>
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
          {/* Two-Column: Hierarchical Model & Namespace */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.8rem' }}>
            {/* Left: Hierarchical Reference Model */}
            <div className="diagram-container" style={{ textAlign: 'center', padding: '0.8rem' }}>
              <div className="diagram-title">Hierarchical Reference Model</div>
              <svg viewBox="0 0 300 130" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '130px' }}>
                {/* Root Objects folder */}
                <g transform="translate(150, 15)">
                  <circle r="18" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" />
                  <text y="4" fill="var(--accent-cyan)" fontSize="8" textAnchor="middle" fontWeight="600">Objects</text>
                </g>

                {/* Connecting lines */}
                <line x1="150" y1="33" x2="75" y2="65" stroke="var(--accent-purple)" strokeWidth="1.5" strokeDasharray="4 2" />
                <line x1="150" y1="33" x2="225" y2="65" stroke="var(--accent-purple)" strokeWidth="1.5" strokeDasharray="4 2" />

                {/* Reference labels */}
                <text x="100" y="52" fill="var(--accent-purple)" fontSize="6" transform="rotate(-25,100,52)">Organizes</text>
                <text x="200" y="52" fill="var(--accent-purple)" fontSize="6" transform="rotate(25,200,52)">Organizes</text>

                {/* Pump_1 */}
                <g transform="translate(75, 75)">
                  <rect x="-30" y="-10" width="60" height="24" rx="4" fill={theme === 'business' ? '#ecfdf5' : 'var(--bg-elevated)'} stroke="var(--accent-green)" strokeWidth="2" />
                  <text y="4" fill="var(--accent-green)" fontSize="8" textAnchor="middle" fontWeight="600">Pump_1</text>
                </g>

                {/* Pump_2 */}
                <g transform="translate(225, 75)">
                  <rect x="-30" y="-10" width="60" height="24" rx="4" fill={theme === 'business' ? '#ecfdf5' : 'var(--bg-elevated)'} stroke="var(--accent-green)" strokeWidth="2" />
                  <text y="4" fill="var(--accent-green)" fontSize="8" textAnchor="middle" fontWeight="600">Pump_2</text>
                </g>

                {/* HasComponent lines to variables */}
                <line x1="75" y1="89" x2="75" y2="105" stroke="var(--accent-orange)" strokeWidth="1" />
                <line x1="225" y1="89" x2="225" y2="105" stroke="var(--accent-orange)" strokeWidth="1" />

                {/* Variables */}
                <g transform="translate(75, 115)">
                  <rect x="-25" y="-8" width="50" height="16" rx="3" fill={theme === 'business' ? '#fffbeb' : 'var(--bg-dark)'} stroke="var(--accent-orange)" strokeWidth="1" />
                  <text y="3" fill="var(--accent-orange)" fontSize="6" textAnchor="middle">FlowRate</text>
                </g>
                <g transform="translate(225, 115)">
                  <rect x="-25" y="-8" width="50" height="16" rx="3" fill={theme === 'business' ? '#fffbeb' : 'var(--bg-dark)'} stroke="var(--accent-orange)" strokeWidth="1" />
                  <text y="3" fill="var(--accent-orange)" fontSize="6" textAnchor="middle">FlowRate</text>
                </g>

                {/* HasComponent label */}
                <text x="55" y="100" fill="var(--accent-orange)" fontSize="5">HasComponent</text>
              </svg>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                <span style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', background: 'rgba(139,92,246,0.1)', borderRadius: '4px', color: 'var(--accent-purple)' }}>Organizes</span>
                <span style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', background: 'rgba(249,115,22,0.1)', borderRadius: '4px', color: 'var(--accent-orange)' }}>HasComponent</span>
                <span style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', background: 'rgba(0,212,255,0.1)', borderRadius: '4px', color: 'var(--accent-cyan)' }}>HasTypeDefinition</span>
              </div>
            </div>

            {/* Right: Namespace & NodeId */}
            <div className="diagram-container animate-fade-in" style={{ padding: '0.8rem', borderColor: 'var(--accent-orange)' }}>
              <div className="diagram-title" style={{ color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Globe size={14} />
                Namespace & NodeId
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 400 }}>(OPC 10000-3 §8)</span>
              </div>

              {/* NodeId Structure */}
              <div style={{
                background: theme === 'business' ? '#fffbeb' : 'var(--bg-dark)',
                borderRadius: '8px',
                padding: '0.5rem 0.6rem',
                marginBottom: '0.5rem',
                border: '1px dashed var(--accent-orange)'
              }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Every Node has a unique <strong>NodeId</strong>:</div>
                <div style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    background: 'rgba(249,115,22,0.25)',
                    padding: '0.2rem 0.4rem',
                    borderRadius: '4px',
                    color: 'var(--accent-orange)',
                    fontWeight: 700
                  }}>ns=1</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>;</span>
                  <span style={{
                    background: 'rgba(0,212,255,0.15)',
                    padding: '0.2rem 0.4rem',
                    borderRadius: '4px',
                    color: 'var(--accent-cyan)',
                    fontWeight: 600
                  }}>s=IPS_PMP_001</span>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.3rem', fontSize: '0.6rem' }}>
                  <span style={{ color: 'var(--accent-orange)' }}>↑ Namespace Index</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>↑ Identifier</span>
                </div>
              </div>

              {/* Identifier Types */}
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                <strong>Identifier Types</strong> (4 formats):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.3rem', marginBottom: '0.5rem' }}>
                {[
                  { prefix: 'i=', name: 'Numeric', example: 'i=2258', color: 'var(--accent-green)' },
                  { prefix: 's=', name: 'String', example: 's=Pump_01', color: 'var(--accent-cyan)' },
                  { prefix: 'g=', name: 'GUID', example: 'g=09f8...', color: 'var(--accent-purple)' },
                  { prefix: 'b=', name: 'Opaque', example: 'b=M/RG...', color: 'var(--accent-pink)' },
                ].map((id, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.2rem 0.4rem',
                    background: theme === 'business' ? '#f8fafc' : 'var(--bg-elevated)',
                    borderRadius: '4px',
                    borderLeft: `3px solid ${id.color}`
                  }}>
                    <code style={{
                      fontFamily: 'JetBrains Mono',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: id.color
                    }}>{id.prefix}</code>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>{id.name}</span>
                  </div>
                ))}
              </div>

              {/* Namespace Array */}
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                <strong>NamespaceArray</strong> (Server maintains):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {[
                  { idx: 0, uri: 'http://opcfoundation.org/UA/', desc: 'Base', color: 'var(--text-muted)' },
                  { idx: 1, uri: 'urn:wastewater:server', desc: 'App', color: 'var(--accent-green)' },
                ].map((ns, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.2rem 0.35rem',
                      background: theme === 'business' ? '#f8fafc' : 'var(--bg-elevated)',
                      borderRadius: '4px',
                      borderLeft: `3px solid ${ns.color}`
                    }}
                  >
                    <span style={{
                      fontFamily: 'JetBrains Mono',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: 'var(--accent-orange)',
                      minWidth: '18px'
                    }}>[{ns.idx}]</span>
                    <span style={{
                      fontFamily: 'JetBrains Mono',
                      fontSize: '0.55rem',
                      color: theme === 'business' ? '#475569' : 'var(--text-secondary)',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>{ns.uri}</span>
                    <span style={{
                      fontSize: '0.5rem',
                      padding: '0.1rem 0.25rem',
                      background: `${ns.color}20`,
                      borderRadius: '3px',
                      color: ns.color,
                      fontWeight: 600
                    }}>{ns.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="highlight-box">
            <p style={{ margin: 0 }}>
              <strong>Address Space</strong> is a graph where <strong style={{ color: 'var(--accent-green)' }}>Nodes</strong> (Objects, Variables, Methods) are linked by <strong style={{ color: 'var(--accent-purple)' }}>References</strong> (Organizes, HasComponent).
              Each Node has a globally unique <strong style={{ color: 'var(--accent-orange)' }}>NodeId = NamespaceIndex + Identifier</strong>.
              Index 0 is reserved for OPC UA base types.
            </p>
          </div>
        </section>

        {/* Slide 7: NodeClasses - Enhanced with Icons and Animations */}
        <section className="slide" id="slide-7">
          <div className="section-header">
            <div className="section-number">SECTION 02 • NODECLASSES</div>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              8 NodeClasses
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>(OPC 10000-3)</span>
            </h2>
          </div>

          {/* Categorized NodeClasses */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem', marginBottom: '1rem' }}>
            {[
              { name: 'Object', desc: 'Container for variables, methods, and other objects', icon: <Database size={22} />, color: 'var(--accent-cyan)', category: 'Instance', example: 'Pump_01' },
              { name: 'Variable', desc: 'Holds data values with DataType and AccessLevel', icon: <Activity size={22} />, color: 'var(--accent-green)', category: 'Instance', example: 'FlowRate = 2340.5' },
              { name: 'Method', desc: 'Callable function with input/output arguments', icon: <Play size={22} />, color: 'var(--accent-orange)', category: 'Instance', example: 'StartPump()' },
              { name: 'ObjectType', desc: 'Template defining structure for Objects', icon: <Layers size={22} />, color: 'var(--accent-purple)', category: 'Type', example: 'PumpType' },
              { name: 'VariableType', desc: 'Template for Variable nodes', icon: <LayoutGrid size={22} />, color: 'var(--accent-pink)', category: 'Type', example: 'AnalogItemType' },
              { name: 'ReferenceType', desc: 'Defines relationships between nodes', icon: <ArrowLeftRight size={22} />, color: 'var(--accent-cyan)', category: 'Meta', example: 'HasComponent' },
              { name: 'DataType', desc: 'Defines value types (Int32, String, etc.)', icon: <Server size={22} />, color: 'var(--accent-green)', category: 'Meta', example: 'Double, Boolean' },
              { name: 'View', desc: 'Filtered subset of Address Space', icon: <Globe size={22} />, color: 'var(--accent-orange)', category: 'Meta', example: 'OperatorView' },
            ].map((node, i) => (
              <div
                key={i}
                className="content-card animate-fade-in"
                style={{
                  padding: '1rem',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
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
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1rem', fontWeight: 700, color: node.color }}>{node.name}</div>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.4rem',
                      background: `${node.color}20`,
                      borderRadius: '4px',
                      color: node.color,
                      fontWeight: 600
                    }}>{node.category}</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: theme === 'business' ? '#475569' : 'var(--text-secondary)', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>{node.desc}</p>
                <div style={{
                  fontSize: '0.8rem',
                  fontFamily: 'JetBrains Mono',
                  color: node.color,
                  background: theme === 'business' ? '#f1f5f9' : 'var(--bg-dark)',
                  padding: '0.4rem 0.6rem',
                  borderRadius: '5px',
                  opacity: 0.9
                }}>
                  {node.example}
                </div>
              </div>
            ))}
          </div>

          {/* Type Hierarchy Diagram */}
          <div className="diagram-container" style={{ padding: '1rem' }}>
            <div className="diagram-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Type System Hierarchy (from{' '}
              <a
                href="/types"
                target="_blank"
                style={{
                  color: 'var(--accent-purple)',
                  textDecoration: 'none',
                  padding: '0.15rem 0.4rem',
                  background: 'rgba(139,92,246,0.1)',
                  borderRadius: '4px',
                  border: '1px solid var(--accent-purple)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(139,92,246,0.2)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(139,92,246,0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                types
              </a>)
            </div>
            <svg viewBox="0 0 800 120" style={{ width: '100%', height: '120px' }}>
              {/* BaseObjectType */}
              <g transform="translate(30, 45)">
                <rect width="120" height="35" rx="6" fill={theme === 'business' ? '#f1f5f9' : 'var(--bg-elevated)'} stroke={theme === 'business' ? '#94a3b8' : 'var(--text-muted)'} strokeWidth="1.5" strokeDasharray="4 2" />
                <text x="60" y="22" fill={theme === 'business' ? '#64748b' : 'var(--text-muted)'} fontSize="10" textAnchor="middle" fontWeight="600">BaseObjectType</text>
                <text x="60" y="50" fill={theme === 'business' ? '#94a3b8' : 'var(--text-muted)'} fontSize="8" textAnchor="middle">(OPC UA Base)</text>
              </g>

              {/* Arrow */}
              <line x1="150" y1="62" x2="190" y2="62" stroke={theme === 'business' ? '#64748b' : 'var(--text-muted)'} strokeWidth="1.5" markerEnd="url(#arrowRight)" />
              <text x="170" y="55" fill={theme === 'business' ? '#64748b' : 'var(--text-muted)'} fontSize="8" textAnchor="middle">extends</text>

              {/* AssetType */}
              <g transform="translate(190, 45)">
                <rect width="90" height="35" rx="6" fill={theme === 'business' ? '#f5f3ff' : 'var(--bg-elevated)'} stroke="var(--accent-purple)" strokeWidth="2" />
                <text x="45" y="22" fill="var(--accent-purple)" fontSize="11" textAnchor="middle" fontWeight="700">AssetType</text>
                <text x="45" y="50" fill={theme === 'business' ? '#7c3aed' : 'var(--text-muted)'} fontSize="8" textAnchor="middle">(abstract)</text>
              </g>

              {/* Arrow to PumpType */}
              <line x1="280" y1="62" x2="320" y2="40" stroke="var(--accent-purple)" strokeWidth="1.5" />
              <line x1="280" y1="62" x2="320" y2="85" stroke="var(--accent-purple)" strokeWidth="1.5" />

              {/* PumpType */}
              <g transform="translate(320, 22)">
                <rect width="100" height="35" rx="6" fill={theme === 'business' ? '#ecfdf5' : 'var(--bg-elevated)'} stroke="var(--accent-green)" strokeWidth="2" />
                <text x="50" y="22" fill="var(--accent-green)" fontSize="11" textAnchor="middle" fontWeight="700">PumpType</text>
              </g>

              {/* ChamberType */}
              <g transform="translate(320, 68)">
                <rect width="100" height="35" rx="6" fill={theme === 'business' ? '#fdf2f8' : 'var(--bg-elevated)'} stroke="var(--accent-pink)" strokeWidth="2" />
                <text x="50" y="22" fill="var(--accent-pink)" fontSize="11" textAnchor="middle" fontWeight="700">ChamberType</text>
              </g>

              {/* Arrow to InfluentPumpType */}
              <line x1="420" y1="40" x2="460" y2="40" stroke="var(--accent-green)" strokeWidth="1.5" />

              {/* InfluentPumpType */}
              <g transform="translate(460, 22)">
                <rect width="130" height="35" rx="6" fill={theme === 'business' ? '#ecfeff' : 'var(--bg-elevated)'} stroke="var(--accent-cyan)" strokeWidth="2" className="animate-glow" />
                <text x="65" y="22" fill="var(--accent-cyan)" fontSize="11" textAnchor="middle" fontWeight="700">InfluentPumpType</text>
              </g>

              {/* Instance arrow */}
              <line x1="590" y1="40" x2="630" y2="40" stroke="var(--accent-cyan)" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="610" y="32" fill={theme === 'business' ? '#64748b' : 'var(--text-muted)'} fontSize="8" textAnchor="middle">instance</text>

              {/* Instance */}
              <g transform="translate(630, 22)">
                <rect width="110" height="35" rx="6" fill={theme === 'business' ? 'rgba(2,132,199,0.1)' : 'rgba(0,212,255,0.1)'} stroke="var(--accent-cyan)" strokeWidth="2" />
                <text x="55" y="18" fill="var(--accent-cyan)" fontSize="10" textAnchor="middle" fontWeight="700">IPS_PMP_001</text>
                <text x="55" y="30" fill="var(--accent-green)" fontSize="9" textAnchor="middle">Running</text>
              </g>

              {/* Variables */}
              <g transform="translate(630, 62)">
                <rect width="110" height="42" rx="6" fill={theme === 'business' ? '#f8fafc' : 'var(--bg-dark)'} stroke={theme === 'business' ? '#e2e8f0' : 'var(--border-color)'} />
                <text x="10" y="14" fill={theme === 'business' ? '#475569' : 'var(--text-secondary)'} fontSize="8">FlowRate: 2340.5</text>
                <text x="10" y="26" fill={theme === 'business' ? '#475569' : 'var(--text-secondary)'} fontSize="8">RPM: 1145</text>
                <text x="10" y="38" fill={theme === 'business' ? '#475569' : 'var(--text-secondary)'} fontSize="8">Power: 124.8 kW</text>
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

        {/* Slide 8: Information Modeling Mechanics - Enhanced with real types.yaml */}
        <section className="slide" id="slide-8" style={{ paddingTop: '60px' }}>
          <div className="section-header" style={{ marginBottom: '0.8rem' }}>
            <div className="section-number">SECTION 02 • INFORMATION MODELING</div>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              From Blueprint to Reality
              <span className="live-badge" style={{ fontSize: '0.7rem', background: 'rgba(139,92,246,0.1)', borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }}>
                types → OPC UA
              </span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {/* Type Definition */}
            <div className="content-card animate-fade-in" style={{ borderColor: 'var(--accent-purple)', padding: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
                <Database size={24} style={{ color: 'var(--accent-purple)' }} />
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent-purple)' }}>1. Type Definition</h4>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>types</div>
              <div className="code-block" style={{ fontSize: '0.9rem', maxHeight: '280px', overflowY: 'auto', padding: '0.8rem', lineHeight: '1.5' }}>
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
            <div className="content-card animate-fade-in" style={{ borderColor: 'var(--accent-orange)', animationDelay: '0.1s', padding: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
                <Layers size={24} style={{ color: 'var(--accent-orange)' }} />
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent-orange)' }}>2. Asset Instance</h4>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>assets</div>
              <div className="code-block" style={{ fontSize: '0.9rem', maxHeight: '280px', overflowY: 'auto', padding: '0.8rem', lineHeight: '1.5' }}>
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
            <div className="content-card animate-fade-in" style={{ borderColor: 'var(--accent-green)', animationDelay: '0.2s', padding: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
                <Activity size={24} style={{ color: 'var(--accent-green)' }} />
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent-green)' }}>3. Live OPC UA Node</h4>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <span>ns=1;s=IPS_PMP_001</span>
                <span className="live-badge" style={{ fontSize: '0.75rem' }}>
                  <div className="pulse-dot" style={{ width: '6px', height: '6px' }} />
                  LIVE
                </span>
              </div>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <div style={{ width: '10px', height: '10px', background: 'var(--accent-green)', borderRadius: '50%' }} />
                  <span style={{ fontSize: '1rem', fontWeight: 600 }}>IPS_PMP_001 : InfluentPumpType</span>
                </div>
                <div style={{ paddingLeft: '1rem', borderLeft: '3px solid var(--accent-green)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>FlowRate:</span>
                    <span style={{ color: 'var(--accent-cyan)', fontFamily: 'JetBrains Mono' }}>{(Object.values(pumpData)[0]?.flow_rate || 2340.5).toFixed(1)} m³/h</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>RPM:</span>
                    <span style={{ color: 'var(--accent-cyan)', fontFamily: 'JetBrains Mono' }}>{(Object.values(pumpData)[0]?.rpm || 1145).toFixed(0)}</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Power:</span>
                    <span style={{ color: 'var(--accent-orange)', fontFamily: 'JetBrains Mono' }}>{(Object.values(pumpData)[0]?.power_consumption || 124.8).toFixed(1)} kW</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                    <span style={{ color: Object.values(pumpData)[0]?.is_running ? 'var(--accent-green)' : 'var(--accent-red)', fontFamily: 'JetBrains Mono' }}>
                      {Object.values(pumpData)[0]?.is_running ? 'RUNNING' : 'STOPPED'}
                    </span>
                  </div>
                </div>
                <button className="btn-action" style={{ marginTop: '0.8rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }} onClick={() => fetchPumps()}>
                  <RefreshCw size={14} style={{ marginRight: '5px' }} /> Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Asset Hierarchy Visualization */}
          <div className="diagram-container" style={{ padding: '1rem' }}>
            <div className="diagram-title">
              Asset Hierarchy (
              <a
                href="http://localhost:3000/assets"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--accent-purple)',
                  textDecoration: 'none',
                  padding: '0.15rem 0.4rem',
                  background: 'rgba(139, 92, 246, 0.15)',
                  borderRadius: '4px',
                  border: '1px solid var(--accent-purple)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                assets
              </a>
              {' → OPC UA Address Space)'}
            </div>
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
                <a href="/assets" target="_blank" style={{ cursor: 'pointer' }}>
                  <text x="10" y="18" fill="var(--accent-purple)" fontSize="7" style={{ textDecoration: 'underline' }}>Asset Summary (assets) →</text>
                </a>
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


        {/* Slide 9: Communication Models - Enhanced with Animations */}
        <section className="slide" id="slide-9" style={{ paddingTop: '60px' }}>
          <div className="section-header" style={{ marginBottom: '1rem' }}>
            <div className="section-number">SECTION 03 • 5–12 MINUTES</div>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              Core Concepts
              <span className="live-badge animate-glow" style={{ fontSize: '0.7rem' }}>
                <div className="pulse-dot" />
                LIVE COMPARISON
              </span>
            </h2>
            <p className="section-goal">Goal: Build foundational mental model</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Client-Server Model */}
            <div className="comm-model-card" style={{ borderColor: 'var(--accent-cyan)', padding: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <ArrowLeftRight size={28} style={{ color: 'var(--accent-cyan)' }} />
                  <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>Client–Server</h3>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.3rem 0.6rem',
                  background: 'rgba(0,212,255,0.1)',
                  border: '1px solid var(--accent-cyan)',
                  borderRadius: '4px',
                  color: 'var(--accent-cyan)',
                  fontWeight: 600
                }}>INTERACTIVE</span>
              </div>

              {/* Animated Client-Server Diagram */}
              <svg viewBox="0 0 340 216" style={{ width: '100%', height: '216px' }}>
                <defs>
                  <linearGradient id="csRequestGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="1" />
                    <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.3" />
                  </linearGradient>
                  <linearGradient id="csResponseGrad" x1="100%" y1="0%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="1" />
                    <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0.3" />
                  </linearGradient>
                  <filter id="csGlow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Client Box */}
                <g transform="translate(20, 55)">
                  <rect width="96" height="96" rx="12" fill={theme === 'business' ? '#f1f5f9' : 'var(--bg-elevated)'} stroke="var(--accent-cyan)" strokeWidth="2.5" />
                  <rect x="12" y="12" width="72" height="42" rx="5" fill={theme === 'business' ? '#e2e8f0' : 'rgba(0,212,255,0.1)'} stroke="var(--accent-cyan)" strokeWidth="1.5" opacity="0.7" />
                  <text x="48" y="38" fill="var(--accent-cyan)" fontSize="14" textAnchor="middle" fontWeight="600">SCADA</text>
                  <circle cx="30" cy="72" r="10" fill={theme === 'business' ? '#e2e8f0' : 'rgba(0,212,255,0.15)'} stroke="var(--accent-cyan)" strokeWidth="1.5" />
                  <circle cx="66" cy="72" r="10" fill={theme === 'business' ? '#e2e8f0' : 'rgba(0,212,255,0.15)'} stroke="var(--accent-cyan)" strokeWidth="1.5" />
                  <text x="48" y="115" fill={theme === 'business' ? '#0f172a' : 'var(--text-primary)'} fontSize="16" textAnchor="middle" fontWeight="700">CLIENT</text>
                </g>

                {/* Server Box */}
                <g transform="translate(224, 55)">
                  <rect width="96" height="96" rx="12" fill={theme === 'business' ? '#f1f5f9' : 'var(--bg-elevated)'} stroke="var(--accent-green)" strokeWidth="2.5" />
                  <rect x="18" y="14" width="60" height="16" rx="3" fill="var(--accent-green)" opacity="0.3" />
                  <rect x="18" y="34" width="60" height="16" rx="3" fill="var(--accent-green)" opacity="0.5" />
                  <rect x="18" y="54" width="60" height="16" rx="3" fill="var(--accent-green)" opacity="0.7" />
                  <circle cx="48" cy="82" r="8" fill="var(--accent-green)">
                    <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  <text x="48" y="115" fill={theme === 'business' ? '#0f172a' : 'var(--text-primary)'} fontSize="16" textAnchor="middle" fontWeight="700">SERVER</text>
                </g>

                {/* Bidirectional Connection Lines */}
                <g>
                  {/* Request Arrow (Client → Server) */}
                  <line x1="120" y1="88" x2="220" y2="88" stroke="var(--accent-cyan)" strokeWidth="2.5" strokeDasharray="10 5" opacity="0.4" />
                  <polygon points="215,82 228,88 215,94" fill="var(--accent-cyan)" opacity="0.6" />

                  {/* Response Arrow (Server → Client) */}
                  <line x1="220" y1="118" x2="120" y2="118" stroke="var(--accent-green)" strokeWidth="2.5" strokeDasharray="10 5" opacity="0.4" />
                  <polygon points="125,112 112,118 125,124" fill="var(--accent-green)" opacity="0.6" />

                  {/* Animated Request Packet */}
                  <g filter="url(#csGlow)">
                    <rect width="50" height="22" rx="4" fill="var(--accent-cyan)">
                      <animate attributeName="x" values="120;180;120" dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="y" values="77;77;77" dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.4;0.45;0.95;1" dur="2.5s" repeatCount="indefinite" />
                    </rect>
                    <text fontSize="11" fill="white" fontWeight="600" textAnchor="middle">
                      <animate attributeName="x" values="145;205;145" dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="y" values="93;93;93" dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.4;0.45;0.95;1" dur="2.5s" repeatCount="indefinite" />
                      READ
                    </text>
                  </g>

                  {/* Animated Response Packet */}
                  <g filter="url(#csGlow)">
                    <rect width="50" height="22" rx="4" fill="var(--accent-green)">
                      <animate attributeName="x" values="180;120;180" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
                      <animate attributeName="y" values="107;107;107" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.05;0.1;0.5;0.55" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
                    </rect>
                    <text fontSize="11" fill="white" fontWeight="600" textAnchor="middle">
                      <animate attributeName="x" values="205;145;205" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
                      <animate attributeName="y" values="123;123;123" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.05;0.1;0.5;0.55" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
                      DATA
                    </text>
                  </g>
                </g>

                {/* Session State Indicator */}
                <g transform="translate(132, 32)">
                  <rect width="76" height="28" rx="5" fill={theme === 'business' ? '#dbeafe' : 'rgba(139,92,246,0.2)'} stroke="var(--accent-purple)" strokeWidth="2" />
                  <text x="38" y="19" fill="var(--accent-purple)" fontSize="12" textAnchor="middle" fontWeight="600">SESSION</text>
                  <circle cx="66" cy="14" r="5" fill="var(--accent-green)">
                    <animate attributeName="fill" values="var(--accent-green);var(--accent-cyan);var(--accent-green)" dur="2s" repeatCount="indefinite" />
                  </circle>
                </g>

                {/* Labels */}
                <text x="170" y="200" fill={theme === 'business' ? '#64748b' : 'var(--text-muted)'} fontSize="13" textAnchor="middle" fontStyle="italic">Bidirectional • Stateful • 1:1 Connection</text>
              </svg>

              {/* Features List */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '1rem' }}>
                {[
                  { icon: '🔄', text: 'Interactive control' },
                  { icon: '🔐', text: 'Stateful sessions' },
                  { icon: '↔️', text: 'Bidirectional' },
                  { icon: '🖥️', text: 'SCADA, HMI' }
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.95rem',
                    color: theme === 'business' ? '#334155' : 'var(--text-secondary)'
                  }}>
                    <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PubSub Model */}
            <div className="comm-model-card" style={{ borderColor: 'var(--accent-orange)', padding: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Radio size={28} style={{ color: 'var(--accent-orange)' }} />
                  <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--accent-orange)', fontWeight: 700 }}>Publish–Subscribe</h3>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.3rem 0.6rem',
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid var(--accent-orange)',
                  borderRadius: '4px',
                  color: 'var(--accent-orange)',
                  fontWeight: 600
                }}>SCALABLE</span>
              </div>

              {/* Animated PubSub Diagram */}
              <svg viewBox="0 0 340 216" style={{ width: '100%', height: '216px' }}>
                <defs>
                  <radialGradient id="broadcastGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="var(--accent-orange)" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="var(--accent-orange)" stopOpacity="0" />
                  </radialGradient>
                  <filter id="pubGlow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Publisher (Center-Left) */}
                <g transform="translate(25, 62)">
                  <rect width="84" height="84" rx="12" fill={theme === 'business' ? '#fef3c7' : 'rgba(245,158,11,0.15)'} stroke="var(--accent-orange)" strokeWidth="2.5" />
                  <circle cx="42" cy="30" r="16" fill="var(--accent-orange)" opacity="0.8">
                    <animate attributeName="r" values="16;18;16" dur="1s" repeatCount="indefinite" />
                  </circle>
                  <text x="42" y="35" fill="white" fontSize="14" textAnchor="middle" fontWeight="700">P</text>
                  <text x="42" y="58" fill={theme === 'business' ? '#92400e' : 'var(--accent-orange)'} fontSize="12" textAnchor="middle" fontWeight="600">OPC UA</text>
                  <text x="42" y="72" fill={theme === 'business' ? '#92400e' : 'var(--accent-orange)'} fontSize="12" textAnchor="middle" fontWeight="600">Server</text>
                  <text x="42" y="102" fill={theme === 'business' ? '#0f172a' : 'var(--text-primary)'} fontSize="14" textAnchor="middle" fontWeight="700">PUBLISHER</text>
                </g>

                {/* Broadcast Waves */}
                <g transform="translate(110, 104)">
                  <circle cx="0" cy="0" r="18" fill="none" stroke="var(--accent-orange)" strokeWidth="2.5" opacity="0.8">
                    <animate attributeName="r" values="18;72;18" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="0" cy="0" r="18" fill="none" stroke="var(--accent-orange)" strokeWidth="2.5" opacity="0.6">
                    <animate attributeName="r" values="18;72;18" dur="2s" begin="0.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" begin="0.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="0" cy="0" r="18" fill="none" stroke="var(--accent-orange)" strokeWidth="2.5" opacity="0.4">
                    <animate attributeName="r" values="18;72;18" dur="2s" begin="1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" begin="1s" repeatCount="indefinite" />
                  </circle>
                </g>

                {/* MQTT Broker (Optional Middle) */}
                <g transform="translate(145, 80)">
                  <rect width="60" height="48" rx="7" fill={theme === 'business' ? '#e0e7ff' : 'rgba(139,92,246,0.2)'} stroke="var(--accent-purple)" strokeWidth="2" strokeDasharray="5 3" />
                  <text x="30" y="22" fill="var(--accent-purple)" fontSize="11" textAnchor="middle" fontWeight="600">MQTT</text>
                  <text x="30" y="38" fill="var(--accent-purple)" fontSize="11" textAnchor="middle" fontWeight="600">Broker</text>
                </g>

                {/* Subscribers (Right side - multiple) */}
                {[
                  { y: 22, label: 'Cloud', icon: '☁️', color: 'var(--accent-cyan)' },
                  { y: 82, label: 'Historian', icon: '📊', color: 'var(--accent-green)' },
                  { y: 142, label: 'Analytics', icon: '🔍', color: 'var(--accent-purple)' }
                ].map((sub, i) => (
                  <g key={i} transform={`translate(235, ${sub.y})`}>
                    <rect width="96" height="50" rx="10" fill={theme === 'business' ? '#f8fafc' : 'var(--bg-elevated)'} stroke={sub.color} strokeWidth="2" />
                    <text x="22" y="32" fontSize="18">{sub.icon}</text>
                    <text x="58" y="24" fill={sub.color} fontSize="13" textAnchor="middle" fontWeight="600">{sub.label}</text>
                    <text x="58" y="40" fill={theme === 'business' ? '#64748b' : 'var(--text-muted)'} fontSize="10" textAnchor="middle">Subscriber</text>

                    {/* Incoming data animation */}
                    <circle r="5" fill={sub.color} filter="url(#pubGlow)">
                      <animate attributeName="cx" values="0;-48" dur="1.5s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
                      <animate attributeName="cy" values="25;25" dur="1.5s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.2;0.8;1" dur="1.5s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
                    </circle>
                  </g>
                ))}

                {/* Connection lines from broker to subscribers */}
                <line x1="205" y1="104" x2="235" y2="47" stroke="var(--accent-cyan)" strokeWidth="2" strokeDasharray="5 3" opacity="0.5" />
                <line x1="205" y1="104" x2="235" y2="107" stroke="var(--accent-green)" strokeWidth="2" strokeDasharray="5 3" opacity="0.5" />
                <line x1="205" y1="104" x2="235" y2="167" stroke="var(--accent-purple)" strokeWidth="2" strokeDasharray="5 3" opacity="0.5" />

                {/* Data packets flying to subscribers */}
                <g>
                  <rect width="30" height="16" rx="3" fill="var(--accent-orange)">
                    <animate attributeName="x" values="110;225" dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="y" values="96;39" dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.85;1" dur="1.2s" repeatCount="indefinite" />
                  </rect>
                  <rect width="30" height="16" rx="3" fill="var(--accent-orange)">
                    <animate attributeName="x" values="110;225" dur="1.2s" begin="0.4s" repeatCount="indefinite" />
                    <animate attributeName="y" values="96;99" dur="1.2s" begin="0.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.85;1" dur="1.2s" begin="0.4s" repeatCount="indefinite" />
                  </rect>
                  <rect width="30" height="16" rx="3" fill="var(--accent-orange)">
                    <animate attributeName="x" values="110;225" dur="1.2s" begin="0.8s" repeatCount="indefinite" />
                    <animate attributeName="y" values="96;159" dur="1.2s" begin="0.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.85;1" dur="1.2s" begin="0.8s" repeatCount="indefinite" />
                  </rect>
                </g>

                {/* Labels */}
                <text x="170" y="200" fill={theme === 'business' ? '#64748b' : 'var(--text-muted)'} fontSize="13" textAnchor="middle" fontStyle="italic">Unidirectional • Stateless • 1:N Distribution</text>
              </svg>

              {/* Features List */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '1rem' }}>
                {[
                  { icon: '📡', text: 'Scalable distribution' },
                  { icon: '🔓', text: 'Stateless' },
                  { icon: '📤', text: 'Decoupled (read-only)' },
                  { icon: '☁️', text: 'Cloud, Analytics' }
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.95rem',
                    color: theme === 'business' ? '#334155' : 'var(--text-secondary)'
                  }}>
                    <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Comparison Summary */}
          <div className="highlight-box" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowLeftRight size={18} style={{ color: 'var(--accent-cyan)' }} />
              <span><strong style={{ color: 'var(--accent-cyan)' }}>Client–Server</strong> for control & interaction</span>
            </div>
            <div style={{ width: '2px', height: '24px', background: 'var(--border-color)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Radio size={18} style={{ color: 'var(--accent-orange)' }} />
              <span><strong style={{ color: 'var(--accent-orange)' }}>PubSub</strong> for massive scale telemetry</span>
            </div>
          </div>
        </section>
        {/* Slide 10: Interoperability - Complete OPC-UA Architecture */}
        <section className="slide" id="slide-10" style={{ paddingTop: '60px' }}>
          <div className="section-header" style={{ marginBottom: '1rem' }}>
            <div className="section-number">SECTION 03 • COMMUNICATION ARCHITECTURE</div>
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
                <h3 style={{ margin: '0 0 0.3rem', fontSize: '1rem', color: theme === 'business' ? '#0f172a' : 'white' }}>OPC UA Server</h3>
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

        {/* Slide 11: Client-Server vs PubSub - Comprehensive Comparison */}
        <section className="slide" id="slide-11" style={{ paddingTop: '60px' }}>
          <div className="section-header" style={{ marginBottom: '0.8rem' }}>
            <div className="section-number">SECTION 03 • COMMUNICATION MODELS</div>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              Client-Server vs Pub/Sub

            </h2>
          </div>

          {/* Zoom Overlay for Slide 11 */}
          {focusedBox && (
            <div className="zoom-overlay" onClick={() => setFocusedBox(null)}>
              <div className="zoom-content" onClick={(e) => e.stopPropagation()} style={{ border: '2px solid var(--accent-cyan)' }}>
                <button className="zoom-close-btn" onClick={() => setFocusedBox(null)}>×</button>

                {focusedBox === 'diagram' && (
                  <div style={{ width: '85vw', maxWidth: '1200px' }}>
                    <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '1rem', fontSize: '1.5rem' }}>Client-Server vs Pub/Sub Architecture</h3>
                    <svg viewBox="0 0 900 280" style={{ width: '100%', height: 'auto' }}>
                      <defs>
                        <linearGradient id="csGradZ" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.2" /><stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.05" /></linearGradient>
                        <linearGradient id="psGradZ" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="var(--accent-orange)" stopOpacity="0.05" /><stop offset="100%" stopColor="var(--accent-orange)" stopOpacity="0.2" /></linearGradient>
                      </defs>
                      <line x1="450" y1="10" x2="450" y2="270" stroke="var(--border-color)" strokeWidth="3" strokeDasharray="10 5" />
                      <text x="450" y="145" fill="var(--text-muted)" fontSize="20" textAnchor="middle" fontWeight="700">VS</text>
                      <g><rect x="20" y="10" width="400" height="260" rx="12" fill="url(#csGradZ)" /><text x="220" y="50" fill="var(--accent-cyan)" fontSize="26" textAnchor="middle" fontWeight="700">CLIENT-SERVER</text><g transform="translate(60, 80)"><rect width="120" height="70" rx="10" fill="var(--bg-elevated)" stroke="var(--accent-cyan)" strokeWidth="3" /><text x="60" y="32" fill="var(--accent-cyan)" fontSize="18" textAnchor="middle" fontWeight="600">CLIENT</text><text x="60" y="54" fill="var(--accent-cyan)" fontSize="12" textAnchor="middle" opacity="0.7">SCADA / HMI</text></g><g transform="translate(240, 80)"><rect width="120" height="70" rx="10" fill="var(--bg-elevated)" stroke="var(--accent-green)" strokeWidth="3" /><text x="60" y="32" fill="var(--accent-green)" fontSize="18" textAnchor="middle" fontWeight="600">SERVER</text><text x="60" y="54" fill="var(--accent-green)" fontSize="12" textAnchor="middle" opacity="0.7">OPC UA</text></g><line x1="185" y1="105" x2="235" y2="105" stroke="var(--accent-cyan)" strokeWidth="3" /><text x="210" y="95" fill="var(--accent-cyan)" fontSize="14" textAnchor="middle" fontWeight="600">Request →</text><line x1="235" y1="125" x2="185" y2="125" stroke="var(--accent-green)" strokeWidth="3" /><text x="210" y="145" fill="var(--accent-green)" fontSize="14" textAnchor="middle" fontWeight="600">← Response</text><g transform="translate(40, 170)"><rect width="340" height="85" rx="8" fill="var(--bg-dark)" stroke="var(--border-color)" strokeWidth="2" /><text x="170" y="30" fill="var(--accent-cyan)" fontSize="16" textAnchor="middle" fontWeight="700">BIDIRECTIONAL • STATEFUL • 1:1</text><text x="170" y="52" fill="var(--text-secondary)" fontSize="14" textAnchor="middle">Session maintains context, authentication</text><text x="170" y="74" fill="var(--text-muted)" fontSize="12" textAnchor="middle">Read • Write • Subscribe • Browse • Call Methods</text></g></g>
                      <g><rect x="480" y="10" width="400" height="260" rx="12" fill="url(#psGradZ)" /><text x="680" y="50" fill="var(--accent-orange)" fontSize="26" textAnchor="middle" fontWeight="700">PUB/SUB</text><g transform="translate(510, 80)"><rect width="100" height="60" rx="8" fill="var(--bg-elevated)" stroke="var(--accent-orange)" strokeWidth="3" /><text x="50" y="28" fill="var(--accent-orange)" fontSize="16" textAnchor="middle" fontWeight="600">PUBLISHER</text><text x="50" y="48" fill="var(--accent-orange)" fontSize="11" textAnchor="middle" opacity="0.7">Server/PLC</text></g><g transform="translate(660, 75)"><rect width="80" height="70" rx="8" fill="rgba(139,92,246,0.2)" stroke="var(--accent-purple)" strokeWidth="2" strokeDasharray="6 3" /><text x="40" y="28" fill="var(--accent-purple)" fontSize="14" textAnchor="middle" fontWeight="600">BROKER</text><text x="40" y="45" fill="var(--accent-purple)" fontSize="10" textAnchor="middle" opacity="0.7">(optional)</text><text x="40" y="60" fill="var(--accent-purple)" fontSize="10" textAnchor="middle" opacity="0.7">MQTT/AMQP</text></g><g transform="translate(790, 60)"><rect width="70" height="38" rx="5" fill="var(--bg-elevated)" stroke="var(--accent-green)" strokeWidth="2" /><text x="35" y="25" fill="var(--accent-green)" fontSize="13" textAnchor="middle" fontWeight="600">SUB 1</text></g><g transform="translate(790, 105)"><rect width="70" height="38" rx="5" fill="var(--bg-elevated)" stroke="var(--accent-green)" strokeWidth="2" /><text x="35" y="25" fill="var(--accent-green)" fontSize="13" textAnchor="middle" fontWeight="600">SUB 2</text></g><line x1="615" y1="110" x2="655" y2="110" stroke="var(--accent-orange)" strokeWidth="3" /><line x1="745" y1="79" x2="785" y2="79" stroke="var(--accent-orange)" strokeWidth="2" /><line x1="745" y1="124" x2="785" y2="124" stroke="var(--accent-orange)" strokeWidth="2" /><g transform="translate(500, 170)"><rect width="360" height="85" rx="8" fill="var(--bg-dark)" stroke="var(--border-color)" strokeWidth="2" /><text x="180" y="30" fill="var(--accent-orange)" fontSize="16" textAnchor="middle" fontWeight="700">UNIDIRECTIONAL • STATELESS • 1:N</text><text x="180" y="52" fill="var(--text-secondary)" fontSize="14" textAnchor="middle">Decoupled publishers and subscribers</text><text x="180" y="74" fill="var(--text-muted)" fontSize="12" textAnchor="middle">Telemetry • Analytics • Cloud • Historians</text></g></g>
                    </svg>
                  </div>
                )}

                {focusedBox === 'communication' && (
                  <div style={{ width: '500px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}><ArrowLeftRight size={32} style={{ color: 'var(--accent-purple)' }} /><h3 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--accent-purple)' }}>Communication Patterns</h3></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ background: 'rgba(0,212,255,0.1)', padding: '1.5rem', borderRadius: '12px', borderLeft: '6px solid var(--accent-cyan)' }}><div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.8rem' }}>Client-Server</div><div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}><strong>Request → Response</strong><br />TCP connection maintained throughout session<br />Session-based state preserves context<br />Supports subscriptions for real-time updates</div></div>
                      <div style={{ background: 'rgba(245,158,11,0.1)', padding: '1.5rem', borderRadius: '12px', borderLeft: '6px solid var(--accent-orange)' }}><div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-orange)', marginBottom: '0.8rem' }}>Pub/Sub</div><div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}><strong>Publish → Broadcast</strong><br />UDP multicast or broker-based routing<br />No connection state between parties<br />Fire-and-forget semantics</div></div>
                    </div>
                  </div>
                )}

                {focusedBox === 'encoding' && (
                  <div style={{ width: '550px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}><Database size={32} style={{ color: 'var(--accent-green)' }} /><h3 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--accent-green)' }}>Message Encoding</h3></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ background: 'rgba(0,212,255,0.1)', padding: '1.5rem', borderRadius: '12px', borderLeft: '6px solid var(--accent-cyan)' }}><div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '1rem' }}>Client-Server Encodings</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1rem' }}><span style={{ fontSize: '1rem', padding: '0.5rem 1rem', background: 'var(--accent-cyan)', color: 'white', borderRadius: '6px', fontWeight: 600 }}>UA Binary</span><span style={{ fontSize: '1rem', padding: '0.5rem 1rem', background: 'var(--accent-green)', color: 'white', borderRadius: '6px', fontWeight: 600 }}>XML</span><span style={{ fontSize: '1rem', padding: '0.5rem 1rem', background: 'var(--accent-purple)', color: 'white', borderRadius: '6px', fontWeight: 600 }}>JSON</span></div><div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Service-oriented messages with full request/response headers</div></div>
                      <div style={{ background: 'rgba(245,158,11,0.1)', padding: '1.5rem', borderRadius: '12px', borderLeft: '6px solid var(--accent-orange)' }}><div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-orange)', marginBottom: '1rem' }}>Pub/Sub Encodings</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1rem' }}><span style={{ fontSize: '1rem', padding: '0.5rem 1rem', background: 'var(--accent-orange)', color: 'white', borderRadius: '6px', fontWeight: 600 }}>UADP Binary</span><span style={{ fontSize: '1rem', padding: '0.5rem 1rem', background: 'var(--accent-green)', color: 'white', borderRadius: '6px', fontWeight: 600 }}>JSON</span></div><div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Compact NetworkMessages optimized for bandwidth</div></div>
                    </div>
                  </div>
                )}

                {focusedBox === 'purpose' && (
                  <div style={{ width: '500px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}><Zap size={32} style={{ color: 'var(--accent-pink)' }} /><h3 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--accent-pink)' }}>Purpose & Use Cases</h3></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ background: 'rgba(0,212,255,0.1)', padding: '1.5rem', borderRadius: '12px', borderLeft: '6px solid var(--accent-cyan)' }}><div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.8rem' }}>Client-Server</div><div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}><strong>Interactive Control & Monitoring</strong><br />Write values to actuators<br />Call methods on devices<br />Browse and discover address space</div></div>
                      <div style={{ background: 'rgba(245,158,11,0.1)', padding: '1.5rem', borderRadius: '12px', borderLeft: '6px solid var(--accent-orange)' }}><div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-orange)', marginBottom: '0.8rem' }}>Pub/Sub</div><div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}><strong>Massive Scale Telemetry</strong><br />Cloud data ingestion (Azure IoT, AWS)<br />Analytics & ML pipelines<br />Edge-to-cloud streaming</div></div>
                    </div>
                  </div>
                )}

                {focusedBox === 'cs-message' && (
                  <div style={{ width: '650px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}><Cable size={32} style={{ color: 'var(--accent-cyan)' }} /><h3 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--accent-cyan)' }}>Client-Server: Service Request</h3></div>
                    <div className="code-block" style={{ fontSize: '1.1rem', padding: '1.5rem', lineHeight: 1.8 }}><span className="comment">// ReadRequest Message</span><br />{'{'}<br />&nbsp;&nbsp;<span className="keyword">"RequestHeader"</span>: {'{'}<br />&nbsp;&nbsp;&nbsp;&nbsp;<span className="string">"AuthenticationToken"</span>: <span className="number">"session-42"</span>,<br />&nbsp;&nbsp;&nbsp;&nbsp;<span className="string">"Timestamp"</span>: <span className="string">"2025-01-15T10:30:00Z"</span>,<br />&nbsp;&nbsp;&nbsp;&nbsp;<span className="string">"RequestHandle"</span>: <span className="number">12345</span><br />&nbsp;&nbsp;{'}'},<br />&nbsp;&nbsp;<span className="keyword">"NodesToRead"</span>: [{'{'}<br />&nbsp;&nbsp;&nbsp;&nbsp;<span className="string">"NodeId"</span>: <span className="string">"ns=1;s=Pump_01.FlowRate"</span>,<br />&nbsp;&nbsp;&nbsp;&nbsp;<span className="string">"AttributeId"</span>: <span className="number">13</span> <span className="comment">// Value</span><br />&nbsp;&nbsp;{'}'}]<br />{'}'}</div>
                  </div>
                )}

                {focusedBox === 'ps-message' && (
                  <div style={{ width: '650px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}><Radio size={32} style={{ color: 'var(--accent-orange)' }} /><h3 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--accent-orange)' }}>Pub/Sub: NetworkMessage</h3></div>
                    <div className="code-block" style={{ fontSize: '1.1rem', padding: '1.5rem', lineHeight: 1.8 }}><span className="comment">// UADP NetworkMessage (compact)</span><br />{'{'}<br />&nbsp;&nbsp;<span className="keyword">"PublisherId"</span>: <span className="string">"Pump_Station_01"</span>,<br />&nbsp;&nbsp;<span className="keyword">"DataSetWriterId"</span>: <span className="number">1</span>,<br />&nbsp;&nbsp;<span className="keyword">"SequenceNumber"</span>: <span className="number">12847</span>,<br />&nbsp;&nbsp;<span className="keyword">"Payload"</span>: {'{'}<br />&nbsp;&nbsp;&nbsp;&nbsp;<span className="string">"FlowRate"</span>: <span className="number">2340.5</span>,<br />&nbsp;&nbsp;&nbsp;&nbsp;<span className="string">"RPM"</span>: <span className="number">1145</span>,<br />&nbsp;&nbsp;&nbsp;&nbsp;<span className="string">"Power"</span>: <span className="number">124.8</span><br />&nbsp;&nbsp;{'}'}<br />{'}'}</div>
                  </div>
                )}

                <div className="zoom-hint"><span className="kbd">ESC</span> or click outside to close</div>
              </div>
            </div>
          )}

          {/* Main Animated Comparison Diagram */}
          <div className="diagram-container zoomable-box" style={{ padding: '1rem', marginBottom: '1rem', position: 'relative' }} onClick={() => setFocusedBox('diagram')}>
            <span className="click-to-zoom-hint">Click to zoom</span>
            <svg viewBox="0 0 900 200" style={{ width: '100%', height: '200px' }}>
              <defs>
                {/* Client-Server gradient */}
                <linearGradient id="csGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.05" />
                </linearGradient>
                {/* PubSub gradient */}
                <linearGradient id="psGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--accent-orange)" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="var(--accent-orange)" stopOpacity="0.2" />
                </linearGradient>
                <filter id="glowCS">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Divider */}
              <line x1="450" y1="10" x2="450" y2="190" stroke={theme === 'business' ? '#e2e8f0' : 'var(--border-color)'} strokeWidth="2" strokeDasharray="8 4" />
              <text x="450" y="105" fill={theme === 'business' ? '#64748b' : 'var(--text-muted)'} fontSize="12" textAnchor="middle" fontWeight="600">VS</text>

              {/* LEFT: Client-Server Model */}
              <g>
                <rect x="20" y="10" width="400" height="180" rx="10" fill="url(#csGrad)" />
                <text x="220" y="35" fill="var(--accent-cyan)" fontSize="16" textAnchor="middle" fontWeight="700">CLIENT-SERVER</text>

                {/* Client */}
                <g transform="translate(60, 60)">
                  <rect width="80" height="50" rx="8" fill={theme === 'business' ? '#f0f9ff' : 'var(--bg-elevated)'} stroke="var(--accent-cyan)" strokeWidth="2" />
                  <text x="40" y="22" fill="var(--accent-cyan)" fontSize="10" textAnchor="middle" fontWeight="600">CLIENT</text>
                  <text x="40" y="38" fill={theme === 'business' ? '#0284c7' : '#67e8f9'} fontSize="8" textAnchor="middle">SCADA/HMI</text>
                </g>

                {/* Server */}
                <g transform="translate(280, 60)">
                  <rect width="80" height="50" rx="8" fill={theme === 'business' ? '#f0fdf4' : 'var(--bg-elevated)'} stroke="var(--accent-green)" strokeWidth="2" />
                  <text x="40" y="22" fill="var(--accent-green)" fontSize="10" textAnchor="middle" fontWeight="600">SERVER</text>
                  <text x="40" y="38" fill={theme === 'business' ? '#059669' : '#6ee7b7'} fontSize="8" textAnchor="middle">OPC UA</text>
                </g>

                {/* Bidirectional arrows with animated packets */}
                <g>
                  {/* Request arrow */}
                  <line x1="145" y1="78" x2="275" y2="78" stroke="var(--accent-cyan)" strokeWidth="2" markerEnd="url(#arrowRight)" />
                  <text x="210" y="72" fill="var(--accent-cyan)" fontSize="8" textAnchor="middle" fontWeight="600">Request</text>
                  <circle r="5" fill="var(--accent-cyan)" filter="url(#glowCS)">
                    <animate attributeName="cx" values="150;270" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="78;78" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.8;1" dur="1.5s" repeatCount="indefinite" />
                  </circle>

                  {/* Response arrow */}
                  <line x1="275" y1="92" x2="145" y2="92" stroke="var(--accent-green)" strokeWidth="2" markerEnd="url(#arrowLeft)" />
                  <text x="210" y="104" fill="var(--accent-green)" fontSize="8" textAnchor="middle" fontWeight="600">Response</text>
                  <circle r="5" fill="var(--accent-green)" filter="url(#glowCS)">
                    <animate attributeName="cx" values="270;150" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="92;92" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.8;1" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
                  </circle>
                </g>

                {/* Key characteristics */}
                <g transform="translate(60, 125)">
                  <rect width="300" height="55" rx="6" fill={theme === 'business' ? '#f8fafc' : 'var(--bg-dark)'} stroke={theme === 'business' ? '#e2e8f0' : 'var(--border-color)'} />
                  <text x="150" y="18" fill="var(--accent-cyan)" fontSize="9" textAnchor="middle" fontWeight="600">BIDIRECTIONAL • STATEFUL • 1:1 CONNECTION</text>
                  <text x="150" y="35" fill={theme === 'business' ? '#475569' : 'var(--text-secondary)'} fontSize="8" textAnchor="middle">Session maintains context, authentication, subscriptions</text>
                  <text x="150" y="48" fill={theme === 'business' ? '#64748b' : 'var(--text-muted)'} fontSize="7" textAnchor="middle">Read • Write • Subscribe • Browse • Call Methods</text>
                </g>
              </g>

              {/* RIGHT: PubSub Model */}
              <g>
                <rect x="480" y="10" width="400" height="180" rx="10" fill="url(#psGrad)" />
                <text x="680" y="35" fill="var(--accent-orange)" fontSize="16" textAnchor="middle" fontWeight="700">PUB/SUB</text>

                {/* Publisher */}
                <g transform="translate(510, 55)">
                  <rect width="70" height="40" rx="6" fill={theme === 'business' ? '#fefce8' : 'var(--bg-elevated)'} stroke="var(--accent-orange)" strokeWidth="2" />
                  <text x="35" y="18" fill="var(--accent-orange)" fontSize="9" textAnchor="middle" fontWeight="600">PUBLISHER</text>
                  <text x="35" y="32" fill={theme === 'business' ? '#b45309' : '#fde047'} fontSize="7" textAnchor="middle">Server/PLC</text>
                </g>

                {/* Broker (optional) */}
                <g transform="translate(650, 50)">
                  <rect width="60" height="50" rx="6" fill={theme === 'business' ? '#ede9fe' : 'rgba(139,92,246,0.2)'} stroke="var(--accent-purple)" strokeWidth="1.5" strokeDasharray="4 2" />
                  <text x="30" y="20" fill="var(--accent-purple)" fontSize="8" textAnchor="middle" fontWeight="600">BROKER</text>
                  <text x="30" y="32" fill={theme === 'business' ? '#7c3aed' : '#c4b5fd'} fontSize="6" textAnchor="middle">(optional)</text>
                  <text x="30" y="44" fill={theme === 'business' ? '#7c3aed' : '#c4b5fd'} fontSize="6" textAnchor="middle">MQTT/AMQP</text>
                </g>

                {/* Subscribers */}
                <g transform="translate(770, 45)">
                  <rect width="50" height="28" rx="4" fill={theme === 'business' ? '#dcfce7' : 'var(--bg-elevated)'} stroke="var(--accent-green)" strokeWidth="1.5" />
                  <text x="25" y="18" fill="var(--accent-green)" fontSize="7" textAnchor="middle" fontWeight="600">SUB 1</text>
                </g>
                <g transform="translate(770, 78)">
                  <rect width="50" height="28" rx="4" fill={theme === 'business' ? '#dcfce7' : 'var(--bg-elevated)'} stroke="var(--accent-green)" strokeWidth="1.5" />
                  <text x="25" y="18" fill="var(--accent-green)" fontSize="7" textAnchor="middle" fontWeight="600">SUB 2</text>
                </g>
                <g transform="translate(835, 60)">
                  <rect width="35" height="28" rx="4" fill={theme === 'business' ? '#dcfce7' : 'var(--bg-elevated)'} stroke="var(--accent-green)" strokeWidth="1.5" />
                  <text x="17" y="18" fill="var(--accent-green)" fontSize="7" textAnchor="middle" fontWeight="600">...</text>
                </g>

                {/* Broadcast arrows with animated packets */}
                <g>
                  <line x1="585" y1="75" x2="645" y2="75" stroke="var(--accent-orange)" strokeWidth="2" />
                  <line x1="715" y1="59" x2="765" y2="59" stroke="var(--accent-orange)" strokeWidth="1.5" />
                  <line x1="715" y1="75" x2="765" y2="75" stroke="var(--accent-orange)" strokeWidth="1.5" />
                  <line x1="715" y1="91" x2="765" y2="91" stroke="var(--accent-orange)" strokeWidth="1.5" />
                  <line x1="715" y1="75" x2="765" y2="59" stroke="var(--accent-orange)" strokeWidth="1.5" opacity="0.5" />
                  <line x1="715" y1="75" x2="765" y2="91" stroke="var(--accent-orange)" strokeWidth="1.5" opacity="0.5" />

                  {/* Animated broadcast packets */}
                  <circle r="4" fill="var(--accent-orange)">
                    <animate attributeName="cx" values="590;765" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="75;59" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.85;1" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle r="4" fill="var(--accent-orange)">
                    <animate attributeName="cx" values="590;765" dur="2s" begin="0.2s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="75;75" dur="2s" begin="0.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.85;1" dur="2s" begin="0.2s" repeatCount="indefinite" />
                  </circle>
                  <circle r="4" fill="var(--accent-orange)">
                    <animate attributeName="cx" values="590;765" dur="2s" begin="0.4s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="75;91" dur="2s" begin="0.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.85;1" dur="2s" begin="0.4s" repeatCount="indefinite" />
                  </circle>
                </g>

                {/* Key characteristics */}
                <g transform="translate(510, 125)">
                  <rect width="350" height="55" rx="6" fill={theme === 'business' ? '#f8fafc' : 'var(--bg-dark)'} stroke={theme === 'business' ? '#e2e8f0' : 'var(--border-color)'} />
                  <text x="175" y="18" fill="var(--accent-orange)" fontSize="9" textAnchor="middle" fontWeight="600">UNIDIRECTIONAL • STATELESS • 1:N DISTRIBUTION</text>
                  <text x="175" y="35" fill={theme === 'business' ? '#475569' : 'var(--text-secondary)'} fontSize="8" textAnchor="middle">Decoupled publishers and subscribers, no session</text>
                  <text x="175" y="48" fill={theme === 'business' ? '#64748b' : 'var(--text-muted)'} fontSize="7" textAnchor="middle">Telemetry • Analytics • Cloud Integration • Historians</text>
                </g>
              </g>
            </svg>
          </div>

          {/* Detailed Comparison Table */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem', marginBottom: '1rem' }}>
            {/* Communication Pattern */}
            <div className="content-card zoomable-box animate-fade-in" style={{ padding: '1rem', borderColor: 'var(--accent-purple)', position: 'relative' }} onClick={() => setFocusedBox('communication')}>
              <span className="click-to-zoom-hint">Click to zoom</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                <ArrowLeftRight size={20} style={{ color: 'var(--accent-purple)' }} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--accent-purple)', fontWeight: 700 }}>Communication</h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ background: theme === 'business' ? '#f0f9ff' : 'rgba(0,212,255,0.1)', padding: '0.6rem', borderRadius: '6px', borderLeft: '3px solid var(--accent-cyan)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.2rem' }}>Client-Server</div>
                  <div style={{ fontSize: '0.7rem', color: theme === 'business' ? '#475569' : 'var(--text-secondary)' }}>
                    Request → Response<br />
                    TCP connection maintained<br />
                    Session-based state
                  </div>
                </div>
                <div style={{ background: theme === 'business' ? '#fffbeb' : 'rgba(245,158,11,0.1)', padding: '0.6rem', borderRadius: '6px', borderLeft: '3px solid var(--accent-orange)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-orange)', marginBottom: '0.2rem' }}>Pub/Sub</div>
                  <div style={{ fontSize: '0.7rem', color: theme === 'business' ? '#475569' : 'var(--text-secondary)' }}>
                    Publish → Broadcast<br />
                    UDP multicast or broker<br />
                    No connection state
                  </div>
                </div>
              </div>
            </div>

            {/* Message Encoding */}
            <div className="content-card zoomable-box animate-fade-in" style={{ padding: '1rem', borderColor: 'var(--accent-green)', animationDelay: '0.1s', position: 'relative' }} onClick={() => setFocusedBox('encoding')}>
              <span className="click-to-zoom-hint">Click to zoom</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                <Database size={20} style={{ color: 'var(--accent-green)' }} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--accent-green)', fontWeight: 700 }}>Message Encoding</h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ background: theme === 'business' ? '#f0f9ff' : 'rgba(0,212,255,0.1)', padding: '0.6rem', borderRadius: '6px', borderLeft: '3px solid var(--accent-cyan)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.2rem' }}>Client-Server</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', background: 'var(--accent-cyan)', color: 'white', borderRadius: '3px', fontWeight: 600 }}>UA Binary</span>
                    <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', background: 'var(--accent-green)', color: 'white', borderRadius: '3px', fontWeight: 600 }}>XML</span>
                    <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', background: 'var(--accent-purple)', color: 'white', borderRadius: '3px', fontWeight: 600 }}>JSON</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: theme === 'business' ? '#64748b' : 'var(--text-muted)', marginTop: '0.3rem' }}>Service-oriented with headers</div>
                </div>
                <div style={{ background: theme === 'business' ? '#fffbeb' : 'rgba(245,158,11,0.1)', padding: '0.6rem', borderRadius: '6px', borderLeft: '3px solid var(--accent-orange)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-orange)', marginBottom: '0.2rem' }}>Pub/Sub</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', background: 'var(--accent-orange)', color: 'white', borderRadius: '3px', fontWeight: 600 }}>UADP Binary</span>
                    <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', background: 'var(--accent-green)', color: 'white', borderRadius: '3px', fontWeight: 600 }}>JSON</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: theme === 'business' ? '#64748b' : 'var(--text-muted)', marginTop: '0.3rem' }}>Compact NetworkMessages</div>
                </div>
              </div>
            </div>

            {/* Purpose & Use Cases */}
            <div className="content-card zoomable-box animate-fade-in" style={{ padding: '1rem', borderColor: 'var(--accent-pink)', animationDelay: '0.2s', position: 'relative' }} onClick={() => setFocusedBox('purpose')}>
              <span className="click-to-zoom-hint">Click to zoom</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                <Zap size={20} style={{ color: 'var(--accent-pink)' }} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--accent-pink)', fontWeight: 700 }}>Purpose</h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ background: theme === 'business' ? '#f0f9ff' : 'rgba(0,212,255,0.1)', padding: '0.6rem', borderRadius: '6px', borderLeft: '3px solid var(--accent-cyan)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.2rem' }}>Client-Server</div>
                  <div style={{ fontSize: '0.7rem', color: theme === 'business' ? '#475569' : 'var(--text-secondary)' }}>
                    Control & interaction<br />
                    Write values, call methods<br />
                    Browse address space
                  </div>
                </div>
                <div style={{ background: theme === 'business' ? '#fffbeb' : 'rgba(245,158,11,0.1)', padding: '0.6rem', borderRadius: '6px', borderLeft: '3px solid var(--accent-orange)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-orange)', marginBottom: '0.2rem' }}>Pub/Sub</div>
                  <div style={{ fontSize: '0.7rem', color: theme === 'business' ? '#475569' : 'var(--text-secondary)' }}>
                    Massive telemetry<br />
                    Cloud ingestion<br />
                    Analytics & ML pipelines
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Message Format Comparison */}
          <div className="diagram-container" style={{ padding: '1rem' }}>
            <div className="diagram-title" style={{ marginBottom: '0.8rem' }}>Message Structure Comparison (click to zoom)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Client-Server Message */}
              <div className="zoomable-box" style={{ position: 'relative', borderRadius: '8px' }} onClick={() => setFocusedBox('cs-message')}>
                <span className="click-to-zoom-hint">Click to zoom</span>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Cable size={14} /> Client-Server: Service Request
                </div>
                <div className="code-block" style={{ fontSize: '0.65rem', padding: '0.8rem' }}>
                  <span className="comment">// ReadRequest Message</span><br />
                  {'{'}<br />
                  &nbsp;&nbsp;<span className="keyword">"RequestHeader"</span>: {'{'}<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="string">"AuthenticationToken"</span>: <span className="number">"session-42"</span>,<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="string">"Timestamp"</span>: <span className="string">"2025-01-15T..."</span><br />
                  &nbsp;&nbsp;{'}'},<br />
                  &nbsp;&nbsp;<span className="keyword">"NodesToRead"</span>: [{'{'}<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="string">"NodeId"</span>: <span className="string">"ns=1;s=Pump_01.FlowRate"</span>,<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="string">"AttributeId"</span>: <span className="number">13</span> <span className="comment">// Value</span><br />
                  &nbsp;&nbsp;{'}'}]<br />
                  {'}'}
                </div>
              </div>

              {/* PubSub Message */}
              <div className="zoomable-box" style={{ position: 'relative', borderRadius: '8px' }} onClick={() => setFocusedBox('ps-message')}>
                <span className="click-to-zoom-hint">Click to zoom</span>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-orange)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Radio size={14} /> Pub/Sub: NetworkMessage
                </div>
                <div className="code-block" style={{ fontSize: '0.65rem', padding: '0.8rem' }}>
                  <span className="comment">// UADP NetworkMessage (compact)</span><br />
                  {'{'}<br />
                  &nbsp;&nbsp;<span className="keyword">"PublisherId"</span>: <span className="string">"Pump_Station_01"</span>,<br />
                  &nbsp;&nbsp;<span className="keyword">"DataSetWriterId"</span>: <span className="number">1</span>,<br />
                  &nbsp;&nbsp;<span className="keyword">"SequenceNumber"</span>: <span className="number">12847</span>,<br />
                  &nbsp;&nbsp;<span className="keyword">"Payload"</span>: {'{'}<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="string">"FlowRate"</span>: <span className="number">2340.5</span>,<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="string">"RPM"</span>: <span className="number">1145</span>,<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="string">"Power"</span>: <span className="number">124.8</span><br />
                  &nbsp;&nbsp;{'}'}<br />
                  {'}'}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Summary */}
          <div className="highlight-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowLeftRight size={18} style={{ color: 'var(--accent-cyan)' }} />
              <span><strong style={{ color: 'var(--accent-cyan)' }}>Client-Server</strong> = Interactive control, browsing, methods</span>
            </div>
            <div style={{ width: '2px', height: '24px', background: 'var(--border-color)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Radio size={18} style={{ color: 'var(--accent-orange)' }} />
              <span><strong style={{ color: 'var(--accent-orange)' }}>Pub/Sub</strong> = Scalable telemetry, cloud, analytics</span>
            </div>
          </div>
        </section>

        {/* Slide 12: Services & Data Access - Enhanced with Aggregate Formula */}
        <section className="slide" id="slide-12" style={{ paddingTop: '60px' }}>
          <div className="section-header" style={{ marginBottom: '0.8rem' }}>
            <div className="section-number">SECTION 04 • 22–30 MINUTES</div>
            <h2 className="section-title">Services & Data Access</h2>
            <p className="section-goal">Goal: Show how data flows correctly</p>
          </div>

          <div className="content-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '1rem' }}>
            <div className="content-card">
              <h3><span className="icon">📋</span> Core Services</h3>
              <ul style={{ marginBottom: '0.8rem' }}>
                <li><strong style={{ color: '#8b5cf6' }}>Browse</strong> — Discover nodes</li>
                <li><strong style={{ color: '#00d4ff' }}>Read / Write</strong> — Discrete access</li>
                <li><strong style={{ color: '#10b981' }}>Subscribe</strong> — Change notifications</li>
                <li><strong style={{ color: '#f59e0b' }}>Call</strong> — Execute logic</li>
                <li><strong style={{ color: '#ec4899' }}>HistoryRead</strong> — Aggregates</li>
              </ul>

              <div style={{ background: 'var(--bg-elevated)', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Browse Simulation</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem' }}>
                  <div style={{ color: 'var(--accent-cyan)' }}>▾ Root</div>
                  <div style={{ marginLeft: '12px', color: 'var(--accent-cyan)' }}>▾ Objects</div>
                  <div style={{ marginLeft: '24px', color: 'var(--accent-green)' }}>▸ {Object.values(pumpData)[0]?.name || 'Pump_01'}</div>
                  <div style={{ marginLeft: '24px', color: 'var(--accent-green)' }}>▸ {Object.values(pumpData)[1]?.name || 'Pump_02'}</div>
                </div>
              </div>
            </div>

            <div className="content-card" style={{ borderColor: '#10b981' }}>
              <h3 style={{ color: '#10b981' }}>
                <span className="icon" style={{ background: 'rgba(16,185,129,0.1)' }}>⚡</span> Three Operating Rules
              </h3>
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ padding: '0.4rem 0.5rem', background: 'rgba(16,185,129,0.1)', borderRadius: '5px', marginBottom: '0.3rem' }}>
                  <strong style={{ color: '#10b981', fontSize: '0.8rem' }}>1. Subscriptions are DEFAULT</strong>
                </div>
                <div style={{ padding: '0.4rem 0.5rem', background: 'rgba(245,158,11,0.1)', borderRadius: '5px', marginBottom: '0.3rem' }}>
                  <strong style={{ color: '#f59e0b', fontSize: '0.8rem' }}>2. Reads are EXCEPTIONS</strong>
                </div>
                <div style={{ padding: '0.4rem 0.5rem', background: 'rgba(0,212,255,0.1)', borderRadius: '5px' }}>
                  <strong style={{ color: '#00d4ff', fontSize: '0.8rem' }}>3. Quality is ALWAYS explicit</strong>
                </div>
              </div>
              <p style={{ fontSize: '0.7rem', marginTop: '0.6rem', color: theme === 'business' ? '#475569' : 'var(--text-muted)' }}>
                OPC UA always provides: <strong>Value + StatusCode + Timestamp</strong>
              </p>
            </div>
          </div>

          {/* IEC 62541-13 Aggregate Formula Section */}
          <div className="diagram-container" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
              <div className="diagram-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ color: theme === 'business' ? '#0f172a' : '#f1f5f9', fontWeight: 600 }}>Statistical Aggregate: Time-Weighted Average</span>
                <span style={{
                  fontSize: '0.6rem',
                  padding: '0.2rem 0.5rem',
                  background: 'rgba(236,72,153,0.1)',
                  border: '1px solid #ec4899',
                  borderRadius: '4px',
                  color: '#ec4899',
                  fontWeight: 600
                }}>IEC 62541-13</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: theme === 'business' ? '#64748b' : 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>HistoryRead Aggregates</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
              {/* Formula Display */}
              <div style={{
                background: theme === 'business' ? '#f8fafc' : 'var(--bg-dark)',
                border: `2px solid ${theme === 'business' ? '#e2e8f0' : 'var(--border-color)'}`,
                borderRadius: '10px',
                padding: '1.2rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#ec4899', marginBottom: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  OPC UA Time-Weighted Average Formula
                </div>

                {/* Main Formula using SVG for proper math rendering */}
                <svg viewBox="0 0 340 90" style={{ width: '100%', height: '90px' }}>
                  <defs>
                    <linearGradient id="formulaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>

                  {/* x-bar (Average) - x with overline */}
                  <g transform="translate(15, 45)">
                    <text x="0" y="0" fill={theme === 'business' ? '#0f172a' : '#f1f5f9'} fontSize="24" fontWeight="600" fontStyle="italic" fontFamily="Times New Roman, serif">x</text>
                    <line x1="-2" y1="-18" x2="16" y2="-18" stroke={theme === 'business' ? '#0f172a' : '#f1f5f9'} strokeWidth="2.5" />
                  </g>

                  {/* Equals sign */}
                  <text x="45" y="45" fill={theme === 'business' ? '#64748b' : '#94a3b8'} fontSize="22" fontFamily="Times New Roman, serif">=</text>

                  {/* Fraction */}
                  <g transform="translate(150, 45)">
                    {/* Numerator: Σ(xᵢ · Δtᵢ) */}
                    <g transform="translate(0, -18)">
                      <text x="0" y="0" fill="#ec4899" fontSize="22" fontFamily="Times New Roman, serif">Σ</text>
                      <text x="20" y="0" fill={theme === 'business' ? '#0f172a' : '#f1f5f9'} fontSize="18" fontFamily="Times New Roman, serif">(</text>
                      <text x="30" y="0" fill={theme === 'business' ? '#0f172a' : '#f1f5f9'} fontSize="18" fontStyle="italic" fontFamily="Times New Roman, serif">x</text>
                      <text x="42" y="5" fill={theme === 'business' ? '#0f172a' : '#f1f5f9'} fontSize="12" fontStyle="italic" fontFamily="Times New Roman, serif">i</text>
                      <text x="52" y="0" fill={theme === 'business' ? '#0f172a' : '#f1f5f9'} fontSize="18" fontFamily="Times New Roman, serif">·</text>
                      <text x="64" y="0" fill={theme === 'business' ? '#0f172a' : '#f1f5f9'} fontSize="18" fontFamily="Times New Roman, serif">Δ</text>
                      <text x="80" y="0" fill={theme === 'business' ? '#0f172a' : '#f1f5f9'} fontSize="18" fontStyle="italic" fontFamily="Times New Roman, serif">t</text>
                      <text x="90" y="5" fill={theme === 'business' ? '#0f172a' : '#f1f5f9'} fontSize="12" fontStyle="italic" fontFamily="Times New Roman, serif">i</text>
                      <text x="98" y="0" fill={theme === 'business' ? '#0f172a' : '#f1f5f9'} fontSize="18" fontFamily="Times New Roman, serif">)</text>
                    </g>

                    {/* Fraction bar - prominent horizontal line */}
                    <rect x="-10" y="-2" width="125" height="4" fill="#ec4899" rx="1" />

                    {/* Denominator: Σ(Δtᵢ) */}
                    <g transform="translate(20, 22)">
                      <text x="0" y="0" fill="#ec4899" fontSize="22" fontFamily="Times New Roman, serif">Σ</text>
                      <text x="20" y="0" fill={theme === 'business' ? '#0f172a' : '#f1f5f9'} fontSize="18" fontFamily="Times New Roman, serif">(</text>
                      <text x="30" y="0" fill={theme === 'business' ? '#0f172a' : '#f1f5f9'} fontSize="18" fontFamily="Times New Roman, serif">Δ</text>
                      <text x="46" y="0" fill={theme === 'business' ? '#0f172a' : '#f1f5f9'} fontSize="18" fontStyle="italic" fontFamily="Times New Roman, serif">t</text>
                      <text x="56" y="5" fill={theme === 'business' ? '#0f172a' : '#f1f5f9'} fontSize="12" fontStyle="italic" fontFamily="Times New Roman, serif">i</text>
                      <text x="64" y="0" fill={theme === 'business' ? '#0f172a' : '#f1f5f9'} fontSize="18" fontFamily="Times New Roman, serif">)</text>
                    </g>
                  </g>

                  {/* Annotation bracket */}
                  <g transform="translate(280, 45)">
                    <text x="0" y="5" fill={theme === 'business' ? '#94a3b8' : '#64748b'} fontSize="50" fontWeight="200" fontFamily="Times New Roman, serif">{'}'}</text>
                    <text x="22" y="-8" fill={theme === 'business' ? '#475569' : 'var(--text-secondary)'} fontSize="10" fontStyle="italic">time</text>
                    <text x="22" y="6" fill={theme === 'business' ? '#475569' : 'var(--text-secondary)'} fontSize="10" fontStyle="italic">weighted</text>
                  </g>
                </svg>

                {/* Variable definitions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '1.5rem',
                  marginTop: '0.8rem',
                  fontSize: '0.75rem',
                  color: theme === 'business' ? '#475569' : 'var(--text-secondary)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ fontStyle: 'italic', color: '#ec4899', fontWeight: 600 }}>x<sub>i</sub></span>
                    <span>=</span>
                    <span>raw data value</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ color: '#8b5cf6', fontWeight: 600 }}>Δt<sub>i</sub></span>
                    <span>=</span>
                    <span>time interval</span>
                  </div>
                </div>
              </div>

              {/* Visual Example with Timeline */}
              <div style={{
                background: theme === 'business' ? '#f8fafc' : 'var(--bg-dark)',
                border: `2px solid ${theme === 'business' ? '#e2e8f0' : 'var(--border-color)'}`,
                borderRadius: '10px',
                padding: '1rem'
              }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', marginBottom: '0.6rem', fontWeight: 600, textTransform: 'uppercase' }}>
                  Example: Pump Flow Rate
                </div>

                <svg viewBox="0 0 280 100" style={{ width: '100%', height: '100px' }}>
                  {/* Timeline axis */}
                  <line x1="20" y1="70" x2="260" y2="70" stroke={theme === 'business' ? '#cbd5e1' : 'var(--border-color)'} strokeWidth="2" />

                  {/* Time labels */}
                  <text x="20" y="85" fill={theme === 'business' ? '#64748b' : 'var(--text-muted)'} fontSize="8" textAnchor="middle">t₀</text>
                  <text x="80" y="85" fill={theme === 'business' ? '#64748b' : 'var(--text-muted)'} fontSize="8" textAnchor="middle">t₁</text>
                  <text x="160" y="85" fill={theme === 'business' ? '#64748b' : 'var(--text-muted)'} fontSize="8" textAnchor="middle">t₂</text>
                  <text x="220" y="85" fill={theme === 'business' ? '#64748b' : 'var(--text-muted)'} fontSize="8" textAnchor="middle">t₃</text>
                  <text x="260" y="85" fill={theme === 'business' ? '#64748b' : 'var(--text-muted)'} fontSize="8" textAnchor="middle">t₄</text>

                  {/* Step function - flow rate values */}
                  <path
                    d="M20 50 L80 50 L80 30 L160 30 L160 45 L220 45 L220 35 L260 35"
                    stroke="var(--accent-cyan)"
                    strokeWidth="2.5"
                    fill="none"
                  />

                  {/* Shaded areas representing time intervals */}
                  <rect x="20" y="50" width="60" height="20" fill="rgba(0,212,255,0.15)" stroke="var(--accent-cyan)" strokeWidth="1" strokeDasharray="2 2" />
                  <rect x="80" y="30" width="80" height="40" fill="rgba(236,72,153,0.15)" stroke="#ec4899" strokeWidth="1" strokeDasharray="2 2" />
                  <rect x="160" y="45" width="60" height="25" fill="rgba(139,92,246,0.15)" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="2 2" />
                  <rect x="220" y="35" width="40" height="35" fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" />

                  {/* Value labels */}
                  <text x="50" y="45" fill="var(--accent-cyan)" fontSize="9" textAnchor="middle" fontWeight="600">x₁</text>
                  <text x="120" y="25" fill="#ec4899" fontSize="9" textAnchor="middle" fontWeight="600">x₂</text>
                  <text x="190" y="40" fill="#8b5cf6" fontSize="9" textAnchor="middle" fontWeight="600">x₃</text>
                  <text x="240" y="30" fill="#10b981" fontSize="9" textAnchor="middle" fontWeight="600">x₄</text>

                  {/* Delta t labels */}
                  <text x="50" y="95" fill="var(--accent-cyan)" fontSize="7" textAnchor="middle">Δt₁</text>
                  <text x="120" y="95" fill="#ec4899" fontSize="7" textAnchor="middle">Δt₂</text>
                  <text x="190" y="95" fill="#8b5cf6" fontSize="7" textAnchor="middle">Δt₃</text>
                  <text x="240" y="95" fill="#10b981" fontSize="7" textAnchor="middle">Δt₄</text>

                  {/* Y-axis label */}
                  <text x="8" y="40" fill={theme === 'business' ? '#64748b' : 'var(--text-muted)'} fontSize="7" textAnchor="middle" transform="rotate(-90, 8, 40)">GPM</text>
                </svg>

                <div style={{
                  fontSize: '0.7rem',
                  color: theme === 'business' ? '#475569' : 'var(--text-secondary)',
                  marginTop: '0.4rem',
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}>
                  Each value is weighted by how long it was valid
                </div>
              </div>
            </div>

            {/* Why Time-Weighted? Explanation */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '0.8rem',
              padding: '0.6rem',
              background: theme === 'business' ? 'rgba(236,72,153,0.05)' : 'rgba(236,72,153,0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(236,72,153,0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Info size={16} style={{ color: '#ec4899' }} />
                <strong style={{ color: '#ec4899', fontSize: '0.75rem' }}>Why Time-Weighted?</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: theme === 'business' ? '#475569' : 'var(--text-secondary)', flex: 1 }}>
                Industrial sensors sample irregularly. A pump running at 2000 GPM for 8 hours matters more than a 5-minute spike to 3000 GPM.
                Simple arithmetic mean would be <strong style={{ color: 'var(--accent-red)' }}>misleading</strong>; time-weighting gives the <strong style={{ color: 'var(--accent-green)' }}>true operational average</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* Slide 13: Purdue Model */}
        <section className="slide" id="slide-13">
          <div className="section-header">
            <div className="section-number">SECTION 05 • Network Architecture</div>
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
                      fill={activeLayer === l.level ? 'rgba(0, 212, 255, 0.1)' : (theme === 'business' ? '#ffffff' : '#111827')}
                      stroke={activeLayer === l.level ? l.color : (theme === 'business' ? '#e2e8f0' : '#1e293b')}
                      strokeWidth={activeLayer === l.level ? 2.5 : 1}
                      style={{ transition: 'all 0.3s' }} />
                    <text x="16" y="24" fill={l.color} fontSize="14" fontWeight="800">LEVEL {l.level} — {l.name}</text>
                    <text x="16" y="46" fill={theme === 'business' ? '#475569' : '#94a3b8'} fontSize="11" fontWeight="500">{l.sub}</text>

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
                  <rect width="650" height="40" rx="8" fill={theme === 'business' ? '#f1f5f9' : '#0a0e17'} stroke={theme === 'business' ? '#cbd5e1' : '#334155'} />
                  <text x="325" y="25" fill={theme === 'business' ? '#475569' : '#94a3b8'} fontSize="12" textAnchor="middle" fontWeight="700">LEVEL 0 — PHYSICAL PROCESS (Wastewater Simulation)</text>
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
        {/* Slide 14: Network & Transport - Enhanced with Protocol Simulation */}
        <section className="slide" id="slide-14" style={{ paddingTop: '60px' }}>
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
              <div style={{ fontSize: '0.85rem', color: theme === 'business' ? '#475569' : '#e2e8f0', lineHeight: 1.5 }}>
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
              <div style={{ fontSize: '0.85rem', color: theme === 'business' ? '#475569' : '#e2e8f0', lineHeight: 1.5 }}>
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
              <div style={{ fontSize: '0.85rem', color: theme === 'business' ? '#475569' : '#e2e8f0', lineHeight: 1.5 }}>
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
              <span style={{ color: theme === 'business' ? '#0f172a' : '#f1f5f9', fontWeight: 600 }}>UA TCP Connection Sequence (OPC 10000-6)</span>
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
              <text x="85" y="46" fill={theme === 'business' ? '#64748b' : '#cbd5e1'} fontSize="9" textAnchor="middle">192.168.1.100</text>

              <rect x="670" y="10" width="90" height="160" rx="8" fill="url(#serverGrad)" stroke="var(--accent-green)" strokeWidth="2" />
              <text x="715" y="32" fill="var(--accent-green)" fontSize="12" textAnchor="middle" fontWeight="700">OPC UA Server</text>
              <text x="715" y="46" fill={theme === 'business' ? '#64748b' : '#cbd5e1'} fontSize="9" textAnchor="middle">:4840</text>

              {/* Timeline */}
              <line x1="85" y1="52" x2="85" y2="165" stroke="var(--accent-cyan)" strokeWidth="2" strokeDasharray="4 2" opacity="0.5" />
              <line x1="715" y1="52" x2="715" y2="165" stroke="var(--accent-green)" strokeWidth="2" strokeDasharray="4 2" opacity="0.5" />

              {/* Step 1: HEL */}
              <g>
                <line x1="130" y1="60" x2="670" y2="60" stroke="var(--accent-cyan)" strokeWidth="2" markerEnd="url(#arrowRight)" />
                <rect x="330" y="48" width="140" height="24" rx="5" fill="var(--bg-dark)" stroke="var(--accent-cyan)" strokeWidth="2" />
                <text x="400" y="65" fill="var(--accent-cyan)" fontSize="11" textAnchor="middle" fontWeight="700">HEL (Hello)</text>
                <text x="150" y="65" fill={theme === 'business' ? '#64748b' : '#cbd5e1'} fontSize="10" fontWeight="600">1.</text>
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
                <text x="685" y="87" fill={theme === 'business' ? '#64748b' : '#cbd5e1'} fontSize="10" fontWeight="600">2.</text>
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
                <text x="150" y="109" fill={theme === 'business' ? '#64748b' : '#cbd5e1'} fontSize="10" fontWeight="600">3.</text>
                <circle r="5" fill="var(--accent-orange)" filter="url(#packetGlow)">
                  <animate attributeName="cx" values="130;670" dur="3s" begin="1s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="104;104" dur="3s" begin="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.9;1" dur="3s" begin="1s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Step 4: MSG (Encrypted) */}
              <g>
                <rect x="140" y="120" width="520" height="26" rx="5" fill="rgba(139,92,246,0.15)" stroke="var(--accent-purple)" strokeWidth="1.5" strokeDasharray="4 2" />
                <text x="400" y="138" fill={theme === 'business' ? '#334155' : '#e2e8f0'} fontSize="10" textAnchor="middle" fontWeight="600">MSG (CreateSession → ActivateSession → Browse/Read/Subscribe)</text>
                <text x="150" y="138" fill={theme === 'business' ? '#64748b' : '#cbd5e1'} fontSize="10" fontWeight="600">4.</text>
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
                <text x="150" y="163" fill={theme === 'business' ? '#64748b' : '#cbd5e1'} fontSize="10" fontWeight="600">5.</text>
              </g>

              {/* Legend */}
              <g transform="translate(510, 12)">
                <rect width="160" height="35" rx="5" fill="var(--bg-dark)" stroke="var(--border-color)" strokeWidth="1.5" />
                <circle cx="18" cy="12" r="5" fill="var(--accent-cyan)" />
                <text x="30" y="16" fill={theme === 'business' ? '#334155' : '#e2e8f0'} fontSize="8" fontWeight="500">Request</text>
                <circle cx="95" cy="12" r="5" fill="var(--accent-green)" />
                <text x="107" y="16" fill={theme === 'business' ? '#334155' : '#e2e8f0'} fontSize="8" fontWeight="500">Response</text>
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
                  <span style={{ fontSize: '0.7rem', color: theme === 'business' ? '#64748b' : '#cbd5e1', fontWeight: 500 }}>{pkt.size}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {pkt.fields.map((field, j) => (
                    <span key={j} style={{ fontSize: '0.7rem', color: theme === 'business' ? '#475569' : '#e2e8f0', fontFamily: 'JetBrains Mono' }}>• {field}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Slide 15: Security Architecture - Enhanced with Animations */}
        <section className="slide" id="slide-15" style={{ paddingTop: '60px' }}>
          <div className="section-header" style={{ marginBottom: '0.8rem' }}>
            <div className="section-number">SECTION 05 • SECURITY</div>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              Security Architecture
              <span className="live-badge animate-glow" style={{ fontSize: '0.7rem' }}>
                <div className="pulse-dot" />
                IEC 62443 COMPLIANT
              </span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {/* Security Policies Evolution */}
            <div className="comm-model-card" style={{ borderColor: 'var(--accent-purple)', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Shield size={20} style={{ color: 'var(--accent-purple)' }} />
                  <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-purple)', fontWeight: 700 }}>Security Policies</h3>
                </div>
                <span style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', background: 'rgba(139,92,246,0.1)', border: '1px solid var(--accent-purple)', borderRadius: '4px', color: 'var(--accent-purple)' }}>v1.05.06</span>
              </div>

              {/* Animated Policy Timeline */}
              <svg viewBox="0 0 384 228" style={{ width: '100%', height: '228px' }}>
                {/* Background gradient showing evolution */}
                <defs>
                  <linearGradient id="securityEvolution" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                <rect x="5" y="5" width="374" height="210" rx="6" fill="url(#securityEvolution)" />

                {/* Timeline arrow */}
                <line x1="15" y1="198" x2="360" y2="198" stroke={theme === 'business' ? '#94a3b8' : '#94a3b8'} strokeWidth="2" />
                <polygon points="360,193 374,198 360,203" fill={theme === 'business' ? '#94a3b8' : '#94a3b8'} />
                <text x="192" y="218" fill={theme === 'business' ? '#64748b' : '#e2e8f0'} fontSize="11" textAnchor="middle" fontWeight="500">Security Strength →</text>

                {/* Deprecated - Basic256 */}
                <g transform="translate(12, 15)">
                  <rect width="108" height="84" rx="4" fill={theme === 'business' ? '#fef2f2' : 'rgba(239,68,68,0.2)'} stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" />
                  <text x="54" y="26" fill="#ef4444" fontSize="14" textAnchor="middle" fontWeight="700">Basic256</text>
                  <text x="54" y="48" fill={theme === 'business' ? '#dc2626' : '#fca5a5'} fontSize="12" textAnchor="middle" fontWeight="500">SHA-1 broken</text>
                  <text x="54" y="68" fill={theme === 'business' ? '#dc2626' : '#fca5a5'} fontSize="12" textAnchor="middle" fontWeight="500">1024-bit weak</text>
                  <line x1="15" y1="12" x2="93" y2="74" stroke="#ef4444" strokeWidth="3" />
                  <line x1="93" y1="12" x2="15" y2="74" stroke="#ef4444" strokeWidth="3" />
                </g>

                {/* Current - AES128 */}
                <g transform="translate(130, 15)">
                  <rect width="114" height="84" rx="4" fill={theme === 'business' ? '#fefce8' : 'rgba(245,158,11,0.2)'} stroke="#f59e0b" strokeWidth="2" />
                  <text x="57" y="26" fill="#f59e0b" fontSize="13" textAnchor="middle" fontWeight="700">Aes128_Sha256</text>
                  <text x="57" y="48" fill={theme === 'business' ? '#b45309' : '#fde047'} fontSize="12" textAnchor="middle" fontWeight="500">SHA-256 ✓</text>
                  <text x="57" y="68" fill={theme === 'business' ? '#b45309' : '#fde047'} fontSize="12" textAnchor="middle" fontWeight="500">2048-bit RSA ✓</text>
                  <circle cx="100" cy="14" r="9" fill="#f59e0b" opacity="0.9">
                    <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <text x="100" y="18" fill="white" fontSize="10" textAnchor="middle" fontWeight="700">✓</text>
                </g>

                {/* Recommended - AES256 + ECC */}
                <g transform="translate(255, 10)">
                  <rect width="120" height="96" rx="4" fill={theme === 'business' ? '#dcfce7' : 'rgba(16,185,129,0.25)'} stroke="#10b981" strokeWidth="2" />
                  <text x="60" y="24" fill="#10b981" fontSize="13" textAnchor="middle" fontWeight="700">Aes256_Sha256</text>
                  <text x="60" y="43" fill={theme === 'business' ? '#059669' : '#6ee7b7'} fontSize="11" textAnchor="middle" fontWeight="500">+ RsaPss padding</text>
                  <line x1="10" y1="55" x2="110" y2="55" stroke={theme === 'business' ? '#86efac' : '#34d399'} strokeWidth="1" />
                  <text x="60" y="72" fill="var(--accent-cyan)" fontSize="12" textAnchor="middle" fontWeight="600">ECC_nistP384</text>
                  <text x="60" y="89" fill={theme === 'business' ? '#0891b2' : '#22d3ee'} fontSize="11" textAnchor="middle" fontWeight="500">Quantum-ready</text>
                  <circle cx="105" cy="14" r="10" fill="#10b981">
                    <animate attributeName="r" values="10;12;10" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  <text x="105" y="18" fill="white" fontSize="12" textAnchor="middle" fontWeight="700">★</text>
                </g>

                {/* Deprecation reasons */}
                <g transform="translate(15, 115)">
                  <text x="0" y="0" fill="#ef4444" fontSize="12" fontWeight="700">Why deprecated?</text>
                  <text x="0" y="20" fill={theme === 'business' ? '#64748b' : '#cbd5e1'} fontSize="11" fontWeight="500">• SHA-1 collision attacks (2017)</text>
                  <text x="0" y="40" fill={theme === 'business' ? '#64748b' : '#cbd5e1'} fontSize="11" fontWeight="500">• 1024-bit factorable by nation-states</text>
                </g>
              </svg>
            </div>

            {/* Why X.509 Certificates */}
            <div className="comm-model-card" style={{ borderColor: 'var(--accent-green)', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Lock size={20} style={{ color: 'var(--accent-green)' }} />
                  <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-green)', fontWeight: 700 }}>Why X.509 Certificates?</h3>
                </div>
              </div>

              {/* Certificate vs Password Comparison */}
              <svg viewBox="0 0 384 228" style={{ width: '100%', height: '228px' }}>
                {/* Password-based (left - weak) */}
                <g transform="translate(5, 10)">
                  <rect width="174" height="84" rx="4" fill={theme === 'business' ? '#fef2f2' : 'rgba(239,68,68,0.15)'} stroke="#ef4444" strokeWidth="2" />
                  <text x="87" y="24" fill="#ef4444" fontSize="14" textAnchor="middle" fontWeight="700">Password Auth</text>

                  {/* Password flying over network (animated) */}
                  <rect x="12" y="36" width="148" height="34" rx="3" fill={theme === 'business' ? '#fecaca' : 'rgba(239,68,68,0.25)'} stroke="#ef4444" strokeDasharray="3 2" />
                  <text x="87" y="58" fill={theme === 'business' ? '#dc2626' : '#fca5a5'} fontSize="13" textAnchor="middle" fontFamily="JetBrains Mono" fontWeight="600">••••••••</text>

                  {/* Attacker icon */}
                  <g transform="translate(152, 50)">
                    <circle r="16" fill="#ef4444" opacity="0.9">
                      <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite" />
                    </circle>
                    <text x="0" y="5" fontSize="18" textAnchor="middle">👁️</text>
                  </g>
                </g>

                {/* Issues with passwords */}
                <g transform="translate(10, 105)">
                  <text x="0" y="0" fill={theme === 'business' ? '#dc2626' : '#f87171'} fontSize="12" fontWeight="600">✗ Shared secret on network</text>
                  <text x="0" y="22" fill={theme === 'business' ? '#dc2626' : '#f87171'} fontSize="12" fontWeight="600">✗ Replay attacks possible</text>
                  <text x="0" y="44" fill={theme === 'business' ? '#dc2626' : '#f87171'} fontSize="12" fontWeight="600">✗ No non-repudiation</text>
                  <text x="0" y="66" fill={theme === 'business' ? '#dc2626' : '#f87171'} fontSize="12" fontWeight="600">✗ Credential theft risk</text>
                </g>

                {/* VS divider */}
                <g transform="translate(192, 52)">
                  <circle r="20" fill={theme === 'business' ? '#e2e8f0' : '#1e293b'} stroke={theme === 'business' ? '#cbd5e1' : '#475569'} strokeWidth="2" />
                  <text x="0" y="6" fill={theme === 'business' ? '#475569' : '#e2e8f0'} fontSize="14" textAnchor="middle" fontWeight="700">VS</text>
                </g>

                {/* Certificate-based (right - strong) */}
                <g transform="translate(205, 10)">
                  <rect width="174" height="84" rx="4" fill={theme === 'business' ? '#dcfce7' : 'rgba(16,185,129,0.2)'} stroke="#10b981" strokeWidth="2" />
                  <text x="87" y="24" fill="#10b981" fontSize="14" textAnchor="middle" fontWeight="700">X.509 Certificate</text>

                  {/* Certificate with public key */}
                  <rect x="12" y="34" width="66" height="42" rx="3" fill={theme === 'business' ? '#bbf7d0' : 'rgba(16,185,129,0.35)'} stroke="#10b981" />
                  <text x="45" y="55" fontSize="20" textAnchor="middle">📜</text>
                  <text x="45" y="72" fill={theme === 'business' ? '#059669' : '#6ee7b7'} fontSize="11" textAnchor="middle" fontWeight="600">PubKey</text>

                  {/* Private key stays local */}
                  <rect x="86" y="34" width="66" height="42" rx="3" fill={theme === 'business' ? '#fef3c7' : 'rgba(245,158,11,0.25)'} stroke="#f59e0b" />
                  <text x="119" y="55" fontSize="20" textAnchor="middle">🔑</text>
                  <text x="119" y="72" fill={theme === 'business' ? '#b45309' : '#fde047'} fontSize="11" textAnchor="middle" fontWeight="600">LOCAL</text>

                  {/* Shield */}
                  <g transform="translate(158, 54)">
                    <circle r="16" fill="#10b981">
                      <animate attributeName="r" values="16;19;16" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <text x="0" y="6" fontSize="18" textAnchor="middle">🛡️</text>
                  </g>
                </g>

                {/* Benefits of certificates */}
                <g transform="translate(210, 105)">
                  <text x="0" y="0" fill={theme === 'business' ? '#059669' : '#4ade80'} fontSize="12" fontWeight="600">✓ No secret on network</text>
                  <text x="0" y="22" fill={theme === 'business' ? '#059669' : '#4ade80'} fontSize="12" fontWeight="600">✓ Challenge-response</text>
                  <text x="0" y="44" fill={theme === 'business' ? '#059669' : '#4ade80'} fontSize="12" fontWeight="600">✓ Digital signatures</text>
                  <text x="0" y="66" fill={theme === 'business' ? '#059669' : '#4ade80'} fontSize="12" fontWeight="600">✓ PKI trust chain</text>
                </g>

                {/* Bottom banner */}
                <rect x="-45" y="190" width="474" height="34" rx="4" fill={theme === 'business' ? '#dbeafe' : 'rgba(0,212,255,0.15)'} stroke="var(--accent-cyan)" strokeWidth="1.5" />
                <text x="192" y="212" fill="var(--accent-cyan)" fontSize="13" textAnchor="middle" fontWeight="600">
                  Private key NEVER leaves device → Zero credential theft
                </text>
              </svg>
            </div>
          </div>

          {/* Security Modes with Animation */}
          <div className="diagram-container" style={{ padding: '1rem' }}>
            <div className="diagram-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
              <span style={{ color: theme === 'business' ? '#0f172a' : '#f1f5f9', fontWeight: 600, fontSize: '1.1rem' }}>Security Mode Comparison</span>
              <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: '4px', color: '#10b981' }}>Choose Wisely</span>
            </div>

            <svg viewBox="0 0 1080 156" style={{ width: '100%', height: '156px' }}>
              {/* Mode: None */}
              <g transform="translate(20, 10)">
                <rect width="312" height="132" rx="6" fill={theme === 'business' ? '#fef2f2' : 'rgba(239,68,68,0.1)'} stroke="#ef4444" strokeWidth="2" />
                <text x="156" y="30" fill="#ef4444" fontSize="16" textAnchor="middle" fontWeight="700">SecurityMode: None</text>

                {/* Unprotected message animation */}
                <rect x="24" y="50" width="84" height="32" rx="3" fill={theme === 'business' ? '#f8fafc' : 'var(--bg-dark)'} stroke={theme === 'business' ? '#cbd5e1' : 'var(--border-color)'}>
                  <animate attributeName="x" values="24;204;24" dur="3s" repeatCount="indefinite" />
                </rect>
                <text fontSize="12" fill={theme === 'business' ? '#334155' : '#e2e8f0'} textAnchor="middle" fontWeight="500">
                  <animate attributeName="x" values="66;246;66" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="y" values="72;72;72" dur="3s" repeatCount="indefinite" />
                  Plain Text
                </text>

                {/* Attacker reading */}
                <g transform="translate(138, 56)">
                  <text fontSize="24">👁️</text>
                  <text x="32" y="14" fill="#ef4444" fontSize="12" fontWeight="600">VISIBLE!</text>
                </g>

                <text x="156" y="115" fill="#ef4444" fontSize="13" textAnchor="middle" fontWeight="600">⚠️ TESTING ONLY!</text>
              </g>

              {/* Mode: Sign */}
              <g transform="translate(365, 10)">
                <rect width="312" height="132" rx="6" fill={theme === 'business' ? '#fefce8' : 'rgba(245,158,11,0.1)'} stroke="#f59e0b" strokeWidth="2" />
                <text x="156" y="30" fill="#f59e0b" fontSize="16" textAnchor="middle" fontWeight="700">SecurityMode: Sign</text>

                {/* Signed but visible message */}
                <rect x="24" y="50" width="108" height="32" rx="3" fill={theme === 'business' ? '#fef3c7' : 'rgba(245,158,11,0.2)'} stroke="#f59e0b">
                  <animate attributeName="x" values="24;180;24" dur="3s" repeatCount="indefinite" />
                </rect>
                <text fontSize="12" fill={theme === 'business' ? '#b45309' : '#fde047'} textAnchor="middle" fontWeight="600">
                  <animate attributeName="x" values="78;234;78" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="y" values="72;72;72" dur="3s" repeatCount="indefinite" />
                  Msg + Signature ✓
                </text>

                {/* Eye can see but not modify */}
                <g transform="translate(138, 54)">
                  <text fontSize="22">👁️</text>
                  <text x="28" y="8" fill={theme === 'business' ? '#b45309' : '#fde047'} fontSize="11" fontWeight="500">Can read</text>
                  <text x="28" y="22" fill="#10b981" fontSize="11" fontWeight="500">Can't modify</text>
                </g>

                <text x="156" y="115" fill={theme === 'business' ? '#b45309' : '#fde047'} fontSize="13" textAnchor="middle" fontWeight="600">Integrity ✓ | Confidentiality ✗</text>
              </g>

              {/* Mode: SignAndEncrypt */}
              <g transform="translate(710, 10)">
                <rect width="350" height="132" rx="6" fill={theme === 'business' ? '#dcfce7' : 'rgba(16,185,129,0.15)'} stroke="#10b981" strokeWidth="3">
                  <animate attributeName="stroke-opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
                </rect>
                <text x="175" y="30" fill="#10b981" fontSize="16" textAnchor="middle" fontWeight="700">SecurityMode: SignAndEncrypt ★</text>

                {/* Encrypted message (scrambled) */}
                <rect x="24" y="50" width="132" height="32" rx="3" fill="#10b981">
                  <animate attributeName="x" values="24;194;24" dur="3s" repeatCount="indefinite" />
                </rect>
                <text fontSize="12" fill="white" textAnchor="middle" fontFamily="JetBrains Mono" fontWeight="600">
                  <animate attributeName="x" values="90;260;90" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="y" values="72;72;72" dur="3s" repeatCount="indefinite" />
                  x9f3a...encrypted
                </text>

                {/* Blocked eye */}
                <g transform="translate(162, 52)">
                  <text fontSize="22">🚫</text>
                  <text x="32" y="10" fill={theme === 'business' ? '#059669' : '#4ade80'} fontSize="12" fontWeight="600">Can't see</text>
                  <text x="32" y="26" fill={theme === 'business' ? '#059669' : '#4ade80'} fontSize="12" fontWeight="600">Can't modify</text>
                </g>

                <text x="175" y="115" fill="#10b981" fontSize="14" textAnchor="middle" fontWeight="700">✓ Integrity + ✓ Confidentiality</text>
              </g>
            </svg>
          </div>

        </section>
        {/* Slide 16: SecureChannel vs Session - Enhanced with Animations */}
        <section className="slide" id="slide-16" style={{ paddingTop: '60px' }}>
          <div className="section-header" style={{ marginBottom: '0.8rem' }}>
            <div className="section-number">SECTION 05 • SECURITY LAYERS</div>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              SecureChannel vs Session
              <span className="live-badge animate-glow" style={{ fontSize: '0.7rem' }}>
                <div className="pulse-dot" />
                DUAL PROTECTION
              </span>
            </h2>
            <p className="section-goal">Goal: Understand why OPC UA needs BOTH layers</p>
          </div>

          {/* Main Animated Diagram - Layered Security */}
          <div className="diagram-container" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <svg viewBox="0 0 900 265" style={{ width: '100%', height: '265px' }}>
              <defs>
                {/* SecureChannel gradient (purple tunnel) */}
                <linearGradient id="scTunnelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--accent-purple)" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="var(--accent-purple)" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity="0.3" />
                </linearGradient>
                {/* Session gradient (orange inner) */}
                <linearGradient id="sessionGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--accent-orange)" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="var(--accent-orange)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="var(--accent-orange)" stopOpacity="0.3" />
                </linearGradient>
                <filter id="secGlow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                {/* Encryption pattern */}
                <pattern id="encryptPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                  <text x="2" y="14" fill="var(--accent-purple)" fontSize="12" opacity="0.3">01</text>
                </pattern>
              </defs>

              {/* Client */}
              <g transform="translate(30, 70)">
                <rect width="120" height="100" rx="12" fill={theme === 'business' ? '#f8fafc' : 'var(--bg-elevated)'} stroke="var(--accent-cyan)" strokeWidth="3" />
                <rect x="15" y="14" width="90" height="32" rx="5" fill={theme === 'business' ? '#e0f2fe' : 'rgba(0,212,255,0.1)'} stroke="var(--accent-cyan)" strokeWidth="1.5" />
                <text x="60" y="36" fill="var(--accent-cyan)" fontSize="14" textAnchor="middle" fontWeight="600">SCADA App</text>
                <circle cx="35" cy="68" r="16" fill={theme === 'business' ? '#fef3c7' : 'rgba(245,158,11,0.2)'} stroke="var(--accent-orange)" strokeWidth="2" />
                <text x="35" y="74" fill="var(--accent-orange)" fontSize="14" textAnchor="middle" fontWeight="700">👤</text>
                <text x="70" y="65" fill={theme === 'business' ? '#334155' : 'var(--text-secondary)'} fontSize="11">Operator</text>
                <text x="70" y="80" fill={theme === 'business' ? '#64748b' : 'var(--text-muted)'} fontSize="10">Role: Control</text>
                <text x="60" y="118" fill={theme === 'business' ? '#0f172a' : 'var(--text-primary)'} fontSize="16" textAnchor="middle" fontWeight="700">CLIENT</text>
              </g>

              {/* Server */}
              <g transform="translate(750, 70)">
                <rect width="120" height="100" rx="12" fill={theme === 'business' ? '#f8fafc' : 'var(--bg-elevated)'} stroke="var(--accent-green)" strokeWidth="3" />
                <rect x="5" y="14" width="110" height="32" rx="5" fill={theme === 'business' ? '#dcfce7' : 'rgba(16,185,129,0.1)'} stroke="var(--accent-green)" strokeWidth="1.5" />
                <text x="60" y="36" fill="var(--accent-green)" fontSize="13" textAnchor="middle" fontWeight="600">OPC UA Server</text>
                <rect x="18" y="55" width="84" height="26" rx="4" fill={theme === 'business' ? '#f1f5f9' : 'var(--bg-dark)'} stroke={theme === 'business' ? '#cbd5e1' : 'var(--border-color)'} strokeWidth="1.5" />
                <text x="60" y="73" fill={theme === 'business' ? '#475569' : 'var(--text-muted)'} fontSize="11" textAnchor="middle">Address Space</text>
                <text x="60" y="118" fill={theme === 'business' ? '#0f172a' : 'var(--text-primary)'} fontSize="16" textAnchor="middle" fontWeight="700">SERVER</text>
              </g>

              {/* SecureChannel - Outer Tunnel */}
              <g>
                {/* Top border of tunnel */}
                <path d="M160 50 L740 50" stroke="var(--accent-purple)" strokeWidth="4" strokeDasharray="10 5" opacity="0.7" />
                {/* Bottom border of tunnel */}
                <path d="M160 195 L740 195" stroke="var(--accent-purple)" strokeWidth="4" strokeDasharray="10 5" opacity="0.7" />
                {/* Tunnel fill */}
                <rect x="160" y="50" width="580" height="145" fill="url(#scTunnelGrad)" rx="10" />
                {/* Encryption symbols floating */}
                <text x="180" y="78" fill="var(--accent-purple)" fontSize="14" opacity="0.5" fontFamily="JetBrains Mono">
                  <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
                  AES-256
                </text>
                <text x="630" y="78" fill="var(--accent-purple)" fontSize="14" opacity="0.5" fontFamily="JetBrains Mono">
                  <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" begin="1s" repeatCount="indefinite" />
                  RSA-2048
                </text>
                {/* Lock icons on tunnel */}
                <g transform="translate(165, 115)">
                  <rect width="32" height="28" rx="4" fill="var(--accent-purple)" opacity="0.8" />
                  <text x="16" y="20" fill="white" fontSize="14" textAnchor="middle">🔐</text>
                </g>
                <g transform="translate(703, 115)">
                  <rect width="32" height="28" rx="4" fill="var(--accent-purple)" opacity="0.8" />
                  <text x="16" y="20" fill="white" fontSize="14" textAnchor="middle">🔐</text>
                </g>
                {/* SecureChannel Label */}
                <rect x="360" y="36" width="180" height="30" rx="5" fill={theme === 'business' ? '#ede9fe' : 'rgba(139,92,246,0.3)'} stroke="var(--accent-purple)" strokeWidth="2" />
                <text x="450" y="57" fill="var(--accent-purple)" fontSize="16" textAnchor="middle" fontWeight="700">SECURE CHANNEL</text>
              </g>

              {/* Session - Inner Layer */}
              <g>
                <rect x="200" y="88" width="500" height="80" rx="8" fill="url(#sessionGrad)" stroke="var(--accent-orange)" strokeWidth="2" strokeDasharray="8 4" />
                {/* Session state indicator */}
                <rect x="208" y="96" width="100" height="24" rx="4" fill={theme === 'business' ? '#fef3c7' : 'rgba(245,158,11,0.2)'} stroke="var(--accent-orange)" strokeWidth="1.5" />
                <text x="258" y="113" fill="var(--accent-orange)" fontSize="11" textAnchor="middle" fontWeight="600">SessionId: 42</text>
                <rect x="592" y="96" width="100" height="24" rx="4" fill={theme === 'business' ? '#fef3c7' : 'rgba(245,158,11,0.2)'} stroke="var(--accent-orange)" strokeWidth="1.5" />
                <text x="642" y="113" fill="var(--accent-orange)" fontSize="11" textAnchor="middle" fontWeight="600">AuthToken ✓</text>
                {/* Session Label */}
                <rect x="395" y="150" width="110" height="26" rx="5" fill={theme === 'business' ? '#fef3c7' : 'rgba(245,158,11,0.3)'} stroke="var(--accent-orange)" strokeWidth="2" />
                <text x="450" y="169" fill="var(--accent-orange)" fontSize="14" textAnchor="middle" fontWeight="700">SESSION</text>
              </g>

              {/* Animated Message Flow */}
              <g>
                {/* Request message (encrypted) */}
                <g filter="url(#secGlow)">
                  <rect width="90" height="32" rx="5" fill="var(--accent-cyan)">
                    <animate attributeName="x" values="210;600" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="y" values="112;112" dur="3s" repeatCount="indefinite" />
                  </rect>
                  <text fontSize="11" fill="white" fontWeight="600" textAnchor="middle">
                    <animate attributeName="x" values="255;645" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="y" values="133" dur="3s" repeatCount="indefinite" />
                    ReadRequest
                  </text>
                  {/* Encryption overlay effect */}
                  <rect width="90" height="32" rx="5" fill="url(#encryptPattern)" opacity="0.5">
                    <animate attributeName="x" values="210;600" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="y" values="112;112" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0.2;0.5" dur="0.5s" repeatCount="indefinite" />
                  </rect>
                </g>

                {/* Response message (encrypted) */}
                <g filter="url(#secGlow)">
                  <rect width="90" height="32" rx="5" fill="var(--accent-green)">
                    <animate attributeName="x" values="600;210" dur="3s" begin="1.5s" repeatCount="indefinite" />
                    <animate attributeName="y" values="112;112" dur="3s" begin="1.5s" repeatCount="indefinite" />
                  </rect>
                  <text fontSize="11" fill="white" fontWeight="600" textAnchor="middle">
                    <animate attributeName="x" values="645;255" dur="3s" begin="1.5s" repeatCount="indefinite" />
                    <animate attributeName="y" values="133" dur="3s" begin="1.5s" repeatCount="indefinite" />
                    DataValue
                  </text>
                  <rect width="90" height="32" rx="5" fill="url(#encryptPattern)" opacity="0.5">
                    <animate attributeName="x" values="600;210" dur="3s" begin="1.5s" repeatCount="indefinite" />
                    <animate attributeName="y" values="112;112" dur="3s" begin="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0.2;0.5" dur="0.5s" repeatCount="indefinite" />
                  </rect>
                </g>
              </g>

              {/* Legend */}
              <g transform="translate(280, 225)">
                <rect x="0" y="0" width="22" height="14" rx="3" fill="var(--accent-purple)" opacity="0.5" />
                <text x="30" y="12" fill={theme === 'business' ? '#475569' : 'var(--text-muted)'} fontSize="12">Encrypted Tunnel</text>
                <rect x="160" y="0" width="22" height="14" rx="3" fill="var(--accent-orange)" opacity="0.5" />
                <text x="190" y="12" fill={theme === 'business' ? '#475569' : 'var(--text-muted)'} fontSize="12">User Context</text>
                <rect x="300" y="0" width="22" height="14" rx="3" fill="var(--accent-cyan)" />
                <text x="330" y="12" fill={theme === 'business' ? '#475569' : 'var(--text-muted)'} fontSize="12">Message</text>
              </g>
            </svg>
          </div>

          {/* Two Column Comparison with Enhanced Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
            {/* SecureChannel */}
            <div className="comm-model-card" style={{ borderColor: 'var(--accent-purple)', padding: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Lock size={28} style={{ color: 'var(--accent-purple)' }} />
                  <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--accent-purple)', fontWeight: 700 }}>SecureChannel</h3>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.3rem 0.6rem',
                  background: 'rgba(139,92,246,0.1)',
                  border: '1px solid var(--accent-purple)',
                  borderRadius: '4px',
                  color: 'var(--accent-purple)',
                  fontWeight: 600
                }}>TRANSPORT LAYER</span>
              </div>

              <div style={{ fontSize: '1.05rem', color: theme === 'business' ? '#475569' : 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                Protects the <strong style={{ color: 'var(--accent-purple)' }}>PIPE</strong> — ensures no one can read or tamper with messages in transit
              </div>

              {/* Visual: Encryption Process */}
              <svg viewBox="0 0 280 80" style={{ width: '100%', height: '80px', marginBottom: '0.8rem' }}>
                <rect x="5" y="18" width="70" height="40" rx="5" fill={theme === 'business' ? '#f1f5f9' : 'var(--bg-dark)'} stroke={theme === 'business' ? '#cbd5e1' : 'var(--border-color)'} strokeWidth="1.5" />
                <text x="40" y="44" fill={theme === 'business' ? '#334155' : 'var(--text-secondary)'} fontSize="12" textAnchor="middle">Plain MSG</text>

                <text x="92" y="42" fill="var(--accent-purple)" fontSize="20">→</text>

                <rect x="105" y="12" width="90" height="52" rx="5" fill={theme === 'business' ? '#ede9fe' : 'rgba(139,92,246,0.2)'} stroke="var(--accent-purple)" strokeWidth="2" />
                <text x="150" y="34" fill="var(--accent-purple)" fontSize="11" textAnchor="middle" fontWeight="600">🔐 ENCRYPT</text>
                <text x="150" y="52" fill="var(--accent-purple)" fontSize="11" textAnchor="middle" fontWeight="600">✍️ SIGN</text>

                <text x="210" y="42" fill="var(--accent-purple)" fontSize="20">→</text>

                <rect x="222" y="18" width="55" height="40" rx="5" fill="var(--accent-purple)" opacity="0.8" />
                <text x="249" y="36" fill="white" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">x9f3a7...</text>
                <text x="249" y="52" fill="white" fontSize="10" textAnchor="middle" fontWeight="600">Secured</text>
              </svg>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { icon: '🔐', text: 'AES-256 encryption for confidentiality' },
                  { icon: '✍️', text: 'SHA-256 signatures for integrity' },
                  { icon: '📜', text: 'X.509 certificates for identity' },
                  { icon: '🔄', text: 'Automatic key renewal' }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: theme === 'business' ? '#334155' : 'var(--text-secondary)' }}>
                    <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Session */}
            <div className="comm-model-card" style={{ borderColor: 'var(--accent-orange)', padding: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <User size={28} style={{ color: 'var(--accent-orange)' }} />
                  <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--accent-orange)', fontWeight: 700 }}>Session</h3>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.3rem 0.6rem',
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid var(--accent-orange)',
                  borderRadius: '4px',
                  color: 'var(--accent-orange)',
                  fontWeight: 600
                }}>APPLICATION LAYER</span>
              </div>

              <div style={{ fontSize: '1.05rem', color: theme === 'business' ? '#475569' : 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                Protects the <strong style={{ color: 'var(--accent-orange)' }}>INTENT</strong> — ensures only authorized users perform allowed actions
              </div>

              {/* Visual: Authentication Flow */}
              <svg viewBox="0 0 280 80" style={{ width: '100%', height: '80px', marginBottom: '0.8rem' }}>
                <circle cx="32" cy="40" r="24" fill={theme === 'business' ? '#fef3c7' : 'rgba(245,158,11,0.2)'} stroke="var(--accent-orange)" strokeWidth="2" />
                <text x="32" y="47" fontSize="22" textAnchor="middle">👤</text>

                <text x="72" y="44" fill="var(--accent-orange)" fontSize="20">→</text>

                <rect x="88" y="12" width="100" height="52" rx="5" fill={theme === 'business' ? '#fef3c7' : 'rgba(245,158,11,0.2)'} stroke="var(--accent-orange)" strokeWidth="2" />
                <text x="138" y="34" fill="var(--accent-orange)" fontSize="10" textAnchor="middle" fontWeight="600">AUTHENTICATE</text>
                <text x="138" y="52" fill="var(--accent-orange)" fontSize="10" textAnchor="middle" fontWeight="600">AUTHORIZE</text>

                <text x="205" y="44" fill="var(--accent-orange)" fontSize="20">→</text>

                <rect x="218" y="14" width="60" height="48" rx="5" fill="var(--accent-orange)" opacity="0.8" />
                <text x="248" y="34" fill="white" fontSize="10" textAnchor="middle" fontWeight="600">Operator</text>
                <text x="248" y="52" fill="white" fontSize="10" textAnchor="middle">Role: Write ✓</text>
              </svg>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { icon: '👤', text: 'User identity & authentication' },
                  { icon: '🎭', text: 'Role-based access control (RBAC)' },
                  { icon: '📋', text: 'Operation-level authorization' },
                  { icon: '📝', text: 'Audit trail per user action' }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: theme === 'business' ? '#334155' : 'var(--text-secondary)' }}>
                    <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Why Both? Explanation */}
          <div className="highlight-box" style={{ display: 'flex', alignItems: 'stretch', gap: '1rem', padding: '1rem' }}>
            <div style={{ flex: 1, borderRight: '1px solid var(--border-color)', paddingRight: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <AlertTriangle size={16} style={{ color: 'var(--accent-red)' }} />
                <strong style={{ color: 'var(--accent-red)', fontSize: '0.85rem' }}>Without SecureChannel</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: theme === 'business' ? '#475569' : 'var(--text-secondary)' }}>
                Attackers can intercept credentials, replay commands, or modify pump setpoints in transit
              </p>
            </div>
            <div style={{ flex: 1, borderRight: '1px solid var(--border-color)', paddingRight: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <AlertTriangle size={16} style={{ color: 'var(--accent-red)' }} />
                <strong style={{ color: 'var(--accent-red)', fontSize: '0.85rem' }}>Without Session</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: theme === 'business' ? '#475569' : 'var(--text-secondary)' }}>
                Any encrypted client could control critical pumps — no accountability or access control
              </p>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <Shield size={16} style={{ color: 'var(--accent-green)' }} />
                <strong style={{ color: 'var(--accent-green)', fontSize: '0.85rem' }}>With Both</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: theme === 'business' ? '#475569' : 'var(--text-secondary)' }}>
                Defense in depth: encrypted transport + authenticated users = industrial-grade security
              </p>
            </div>
          </div>
        </section>

        {/* Slide 17: Role-Based Access Control */}
        <section className="slide" id="slide-17">
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

        {/* Slide 18: Deep Dive - Communication Model */}
        <section className="slide" id="slide-18" style={{ paddingTop: '60px' }}>
          <div className="section-header" style={{ marginBottom: '0.8rem' }}>
            <div className="section-number">SECTION 06 • DEEP DIVE</div>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              Message Sequence in Detail
              <span className="live-badge animate-morph-glow" style={{ fontSize: '0.7rem' }}>
                <div className="pulse-dot" />
                INTERACTIVE
              </span>
            </h2>
            <p className="section-goal">Understanding the complete request/response lifecycle</p>
          </div>

          {/* Interactive Message Sequence Diagram */}
          <div className="sequence-diagram" style={{ marginBottom: '1rem' }}>
            <svg viewBox="0 0 900 320" style={{ width: '100%', height: '320px' }}>
              <defs>
                <linearGradient id="clientLifeline" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="1" />
                  <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="serverLifeline" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="1" />
                  <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0.3" />
                </linearGradient>
                <filter id="msgGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <marker id="arrowCyan" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L9,3 z" fill="var(--accent-cyan)" />
                </marker>
                <marker id="arrowGreen" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto">
                  <path d="M9,0 L9,6 L0,3 z" fill="var(--accent-green)" />
                </marker>
              </defs>

              {/* Client Actor */}
              <g transform="translate(80, 15)">
                <rect x="-60" y="0" width="110" height="45" rx="8" fill={theme === 'business' ? '#e0f2fe' : 'rgba(0,212,255,0.15)'} stroke="var(--accent-cyan)" strokeWidth="2" />
                <text x="0" y="20" fill="var(--accent-cyan)" fontSize="12" textAnchor="middle" fontWeight="700">OPC UA Client</text>
                <text x="0" y="35" fill={theme === 'business' ? '#0284c7' : '#67e8f9'} fontSize="9" textAnchor="middle">SCADA / HMI</text>
              </g>

              {/* Server Actor */}
              <g transform="translate(820, 15)">
                <rect x="-60" y="0" width="110" height="45" rx="8" fill={theme === 'business' ? '#dcfce7' : 'rgba(16,185,129,0.15)'} stroke="var(--accent-green)" strokeWidth="2" />
                <text x="0" y="20" fill="var(--accent-green)" fontSize="12" textAnchor="middle" fontWeight="700">OPC UA Server</text>
                <text x="0" y="35" fill={theme === 'business' ? '#059669' : '#6ee7b7'} fontSize="9" textAnchor="middle">Pump Controller</text>
              </g>

              {/* Lifelines */}
              <line x1="80" y1="65" x2="80" y2="310" stroke="url(#clientLifeline)" strokeWidth="3" className="sequence-lifeline" />
              <line x1="820" y1="65" x2="820" y2="310" stroke="url(#serverLifeline)" strokeWidth="3" className="sequence-lifeline" />

              {/* Message 1: CreateSessionRequest */}
              <g className="sequence-message" style={{ cursor: 'pointer' }}>
                <line x1="90" y1="85" x2="810" y2="85" stroke="var(--accent-cyan)" strokeWidth="2" markerEnd="url(#arrowCyan)" />
                <rect x="350" y="72" width="200" height="26" rx="5" fill={theme === 'business' ? '#f0f9ff' : 'var(--bg-dark)'} stroke="var(--accent-cyan)" strokeWidth="1.5" />
                <text x="450" y="90" fill="var(--accent-cyan)" fontSize="11" textAnchor="middle" fontWeight="600">CreateSessionRequest</text>
                <text x="100" y="78" fill={theme === 'business' ? '#64748b' : '#94a3b8'} fontSize="9">1.</text>
                {/* Animated packet */}
                <circle r="6" fill="var(--accent-cyan)" filter="url(#msgGlow)">
                  <animate attributeName="cx" values="90;810" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="85;85" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.9;1" dur="2s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Message 2: CreateSessionResponse */}
              <g className="sequence-message" style={{ cursor: 'pointer' }}>
                <line x1="810" y1="115" x2="90" y2="115" stroke="var(--accent-green)" strokeWidth="2" markerEnd="url(#arrowGreen)" />
                <rect x="330" y="102" width="240" height="26" rx="5" fill={theme === 'business' ? '#f0fdf4' : 'var(--bg-dark)'} stroke="var(--accent-green)" strokeWidth="1.5" />
                <text x="450" y="120" fill="var(--accent-green)" fontSize="11" textAnchor="middle" fontWeight="600">CreateSessionResponse (SessionId, Nonce)</text>
                <text x="830" y="108" fill={theme === 'business' ? '#64748b' : '#94a3b8'} fontSize="9">2.</text>
                <circle r="6" fill="var(--accent-green)" filter="url(#msgGlow)">
                  <animate attributeName="cx" values="810;90" dur="2s" begin="0.5s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="115;115" dur="2s" begin="0.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.9;1" dur="2s" begin="0.5s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Message 3: ActivateSessionRequest */}
              <g className="sequence-message" style={{ cursor: 'pointer' }}>
                <line x1="90" y1="150" x2="810" y2="150" stroke="var(--accent-orange)" strokeWidth="2" markerEnd="url(#arrowCyan)" />
                <rect x="310" y="137" width="280" height="26" rx="5" fill={theme === 'business' ? '#fffbeb' : 'var(--bg-dark)'} stroke="var(--accent-orange)" strokeWidth="1.5" />
                <text x="450" y="155" fill="var(--accent-orange)" fontSize="11" textAnchor="middle" fontWeight="600">ActivateSessionRequest (Credentials, Signature)</text>
                <text x="100" y="143" fill={theme === 'business' ? '#64748b' : '#94a3b8'} fontSize="9">3.</text>
                <circle r="6" fill="var(--accent-orange)" filter="url(#msgGlow)">
                  <animate attributeName="cx" values="90;810" dur="2s" begin="1s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="150;150" dur="2s" begin="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.9;1" dur="2s" begin="1s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Message 4: ActivateSessionResponse */}
              <g className="sequence-message" style={{ cursor: 'pointer' }}>
                <line x1="810" y1="180" x2="90" y2="180" stroke="var(--accent-green)" strokeWidth="2" markerEnd="url(#arrowGreen)" />
                <rect x="350" y="167" width="200" height="26" rx="5" fill={theme === 'business' ? '#f0fdf4' : 'var(--bg-dark)'} stroke="var(--accent-green)" strokeWidth="1.5" />
                <text x="450" y="185" fill="var(--accent-green)" fontSize="11" textAnchor="middle" fontWeight="600">ActivateSessionResponse ✓</text>
                <text x="830" y="173" fill={theme === 'business' ? '#64748b' : '#94a3b8'} fontSize="9">4.</text>
              </g>

              {/* Secure Channel Box */}
              <rect x="70" y="200" width="760" height="90" rx="8" fill="rgba(139,92,246,0.1)" stroke="var(--accent-purple)" strokeWidth="2" strokeDasharray="8 4" />
              <text x="450" y="218" fill="var(--accent-purple)" fontSize="10" textAnchor="middle" fontWeight="600">ENCRYPTED SESSION ESTABLISHED</text>

              {/* Message 5: ReadRequest (inside secure channel) */}
              <g className="sequence-message" style={{ cursor: 'pointer' }}>
                <line x1="90" y1="240" x2="810" y2="240" stroke="var(--accent-cyan)" strokeWidth="2" markerEnd="url(#arrowCyan)" />
                <rect x="330" y="227" width="240" height="26" rx="5" fill="var(--accent-purple)" fillOpacity="0.2" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                <text x="450" y="245" fill="var(--accent-cyan)" fontSize="11" textAnchor="middle" fontWeight="600">ReadRequest (ns=1;s=Pump_01.FlowRate)</text>
                <text x="100" y="233" fill={theme === 'business' ? '#64748b' : '#94a3b8'} fontSize="9">5.</text>
                <circle r="6" fill="var(--accent-cyan)" filter="url(#msgGlow)">
                  <animate attributeName="cx" values="90;810" dur="1.5s" begin="1.5s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="240;240" dur="1.5s" begin="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.9;1" dur="1.5s" begin="1.5s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Message 6: ReadResponse (inside secure channel) */}
              <g className="sequence-message" style={{ cursor: 'pointer' }}>
                <line x1="810" y1="270" x2="90" y2="270" stroke="var(--accent-green)" strokeWidth="2" markerEnd="url(#arrowGreen)" />
                <rect x="300" y="257" width="300" height="26" rx="5" fill="var(--accent-purple)" fillOpacity="0.2" stroke="var(--accent-green)" strokeWidth="1.5" />
                <text x="450" y="275" fill="var(--accent-green)" fontSize="11" textAnchor="middle" fontWeight="600">ReadResponse (Value: 2340.5, Status: Good, Timestamp)</text>
                <text x="830" y="263" fill={theme === 'business' ? '#64748b' : '#94a3b8'} fontSize="9">6.</text>
                <circle r="6" fill="var(--accent-green)" filter="url(#msgGlow)">
                  <animate attributeName="cx" values="810;90" dur="1.5s" begin="2s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="270;270" dur="1.5s" begin="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.9;1" dur="1.5s" begin="2s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Time annotations */}
              <g transform="translate(20, 85)">
                <text fill={theme === 'business' ? '#64748b' : '#94a3b8'} fontSize="8" textAnchor="end">t₀</text>
              </g>
              <g transform="translate(20, 180)">
                <text fill={theme === 'business' ? '#64748b' : '#94a3b8'} fontSize="8" textAnchor="end">t₁</text>
              </g>
              <g transform="translate(20, 270)">
                <text fill={theme === 'business' ? '#64748b' : '#94a3b8'} fontSize="8" textAnchor="end">t₂</text>
              </g>
            </svg>
          </div>

          {/* Key Insights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem' }}>
            {[
              { step: '1-2', title: 'Session Creation', desc: 'Server allocates resources, generates nonces for crypto', color: 'var(--accent-cyan)', icon: '🔗' },
              { step: '3-4', title: 'Authentication', desc: 'Client proves identity via signature over server nonce', color: 'var(--accent-orange)', icon: '🔐' },
              { step: '5-6', title: 'Data Exchange', desc: 'All messages encrypted with session keys', color: 'var(--accent-purple)', icon: '📨' },
              { step: 'Always', title: 'Quality Metadata', desc: 'Every response includes StatusCode + Timestamp', color: 'var(--accent-green)', icon: '✅' },
            ].map((item, i) => (
              <div key={i} className="content-card animate-fade-in" style={{
                padding: '1rem',
                borderColor: item.color,
                animationDelay: `${i * 0.1}s`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                  <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', background: `${item.color}20`, borderRadius: '4px', color: item.color, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>Step {item.step}</span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: item.color, marginBottom: '0.3rem' }}>{item.title}</div>
                <div style={{ fontSize: '0.75rem', color: theme === 'business' ? '#475569' : 'var(--text-secondary)', lineHeight: 1.4 }}>{item.desc}</div>
              </div>
            ))}
          </div>

          <div className="highlight-box" style={{ marginTop: '1rem' }}>
            <p style={{ margin: 0 }}>
              <strong>Key Insight:</strong> OPC UA's session model provides <strong style={{ color: 'var(--accent-purple)' }}>mutual authentication</strong> — both client and server verify each other's identity before any data is exchanged.
              This prevents man-in-the-middle attacks and ensures audit trails are attributable to real users.
            </p>
          </div>
        </section>

        {/* Slide 19: Future Directions */}
        <section className="slide" id="slide-19">
          <div className="section-header">
            <div className="section-number">SECTION 07 • FUTURE READY</div>
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
            <button className="btn-action" onClick={() => goToSlide(19)}>
              Deep Dive: Communication →
            </button>
          </div>
        </section>

        {/* Slide 19: Deep Dive - Communication Model */}
        <section className="slide" id="slide-19" style={{ paddingTop: '60px' }}>
          <div className="section-header" style={{ marginBottom: '0.8rem' }}>
            <div className="section-number">DEEP DIVE • COMMUNICATION MODEL</div>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              Message Sequence in Detail
              <span className="live-badge animate-morph-glow" style={{ fontSize: '0.7rem' }}>
                <div className="pulse-dot" />
                INTERACTIVE
              </span>
            </h2>
            <p className="section-goal">Understanding the complete request/response lifecycle</p>
          </div>

          {/* Interactive Message Sequence Diagram */}
          <div className="sequence-diagram" style={{ marginBottom: '1rem' }}>
            <svg viewBox="0 0 900 320" style={{ width: '100%', height: '320px' }}>
              <defs>
                <linearGradient id="clientLifeline" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="1" />
                  <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="serverLifeline" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="1" />
                  <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0.3" />
                </linearGradient>
                <filter id="msgGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <marker id="arrowCyan" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L9,3 z" fill="var(--accent-cyan)" />
                </marker>
                <marker id="arrowGreen" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto">
                  <path d="M9,0 L9,6 L0,3 z" fill="var(--accent-green)" />
                </marker>
              </defs>

              {/* Client Actor */}
              <g transform="translate(80, 15)">
                <rect x="-40" y="0" width="80" height="45" rx="8" fill={theme === 'business' ? '#e0f2fe' : 'rgba(0,212,255,0.15)'} stroke="var(--accent-cyan)" strokeWidth="2" />
                <text x="0" y="20" fill="var(--accent-cyan)" fontSize="12" textAnchor="middle" fontWeight="700">OPC UA Client</text>
                <text x="0" y="35" fill={theme === 'business' ? '#0284c7' : '#67e8f9'} fontSize="9" textAnchor="middle">SCADA / HMI</text>
              </g>

              {/* Server Actor */}
              <g transform="translate(820, 15)">
                <rect x="-40" y="0" width="80" height="45" rx="8" fill={theme === 'business' ? '#dcfce7' : 'rgba(16,185,129,0.15)'} stroke="var(--accent-green)" strokeWidth="2" />
                <text x="0" y="20" fill="var(--accent-green)" fontSize="12" textAnchor="middle" fontWeight="700">OPC UA Server</text>
                <text x="0" y="35" fill={theme === 'business' ? '#059669' : '#6ee7b7'} fontSize="9" textAnchor="middle">Pump Controller</text>
              </g>

              {/* Lifelines */}
              <line x1="80" y1="65" x2="80" y2="310" stroke="url(#clientLifeline)" strokeWidth="3" className="sequence-lifeline" />
              <line x1="820" y1="65" x2="820" y2="310" stroke="url(#serverLifeline)" strokeWidth="3" className="sequence-lifeline" />

              {/* Message 1: CreateSessionRequest */}
              <g className="sequence-message" style={{ cursor: 'pointer' }}>
                <line x1="90" y1="85" x2="810" y2="85" stroke="var(--accent-cyan)" strokeWidth="2" markerEnd="url(#arrowCyan)" />
                <rect x="350" y="72" width="200" height="26" rx="5" fill={theme === 'business' ? '#f0f9ff' : 'var(--bg-dark)'} stroke="var(--accent-cyan)" strokeWidth="1.5" />
                <text x="450" y="90" fill="var(--accent-cyan)" fontSize="11" textAnchor="middle" fontWeight="600">CreateSessionRequest</text>
                <text x="100" y="78" fill={theme === 'business' ? '#64748b' : '#94a3b8'} fontSize="9">1.</text>
                {/* Animated packet */}
                <circle r="6" fill="var(--accent-cyan)" filter="url(#msgGlow)">
                  <animate attributeName="cx" values="90;810" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="85;85" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.9;1" dur="2s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Message 2: CreateSessionResponse */}
              <g className="sequence-message" style={{ cursor: 'pointer' }}>
                <line x1="810" y1="115" x2="90" y2="115" stroke="var(--accent-green)" strokeWidth="2" markerEnd="url(#arrowGreen)" />
                <rect x="330" y="102" width="240" height="26" rx="5" fill={theme === 'business' ? '#f0fdf4' : 'var(--bg-dark)'} stroke="var(--accent-green)" strokeWidth="1.5" />
                <text x="450" y="120" fill="var(--accent-green)" fontSize="11" textAnchor="middle" fontWeight="600">CreateSessionResponse (SessionId, Nonce)</text>
                <text x="830" y="108" fill={theme === 'business' ? '#64748b' : '#94a3b8'} fontSize="9">2.</text>
                <circle r="6" fill="var(--accent-green)" filter="url(#msgGlow)">
                  <animate attributeName="cx" values="810;90" dur="2s" begin="0.5s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="115;115" dur="2s" begin="0.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.9;1" dur="2s" begin="0.5s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Message 3: ActivateSessionRequest */}
              <g className="sequence-message" style={{ cursor: 'pointer' }}>
                <line x1="90" y1="150" x2="810" y2="150" stroke="var(--accent-orange)" strokeWidth="2" markerEnd="url(#arrowCyan)" />
                <rect x="310" y="137" width="280" height="26" rx="5" fill={theme === 'business' ? '#fffbeb' : 'var(--bg-dark)'} stroke="var(--accent-orange)" strokeWidth="1.5" />
                <text x="450" y="155" fill="var(--accent-orange)" fontSize="11" textAnchor="middle" fontWeight="600">ActivateSessionRequest (Credentials, Signature)</text>
                <text x="100" y="143" fill={theme === 'business' ? '#64748b' : '#94a3b8'} fontSize="9">3.</text>
                <circle r="6" fill="var(--accent-orange)" filter="url(#msgGlow)">
                  <animate attributeName="cx" values="90;810" dur="2s" begin="1s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="150;150" dur="2s" begin="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.9;1" dur="2s" begin="1s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Message 4: ActivateSessionResponse */}
              <g className="sequence-message" style={{ cursor: 'pointer' }}>
                <line x1="810" y1="180" x2="90" y2="180" stroke="var(--accent-green)" strokeWidth="2" markerEnd="url(#arrowGreen)" />
                <rect x="350" y="167" width="200" height="26" rx="5" fill={theme === 'business' ? '#f0fdf4' : 'var(--bg-dark)'} stroke="var(--accent-green)" strokeWidth="1.5" />
                <text x="450" y="185" fill="var(--accent-green)" fontSize="11" textAnchor="middle" fontWeight="600">ActivateSessionResponse ✓</text>
                <text x="830" y="173" fill={theme === 'business' ? '#64748b' : '#94a3b8'} fontSize="9">4.</text>
              </g>

              {/* Secure Channel Box */}
              <rect x="70" y="200" width="760" height="90" rx="8" fill="rgba(139,92,246,0.1)" stroke="var(--accent-purple)" strokeWidth="2" strokeDasharray="8 4" />
              <text x="450" y="218" fill="var(--accent-purple)" fontSize="10" textAnchor="middle" fontWeight="600">ENCRYPTED SESSION ESTABLISHED</text>

              {/* Message 5: ReadRequest (inside secure channel) */}
              <g className="sequence-message" style={{ cursor: 'pointer' }}>
                <line x1="90" y1="240" x2="810" y2="240" stroke="var(--accent-cyan)" strokeWidth="2" markerEnd="url(#arrowCyan)" />
                <rect x="330" y="227" width="240" height="26" rx="5" fill="var(--accent-purple)" fillOpacity="0.2" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                <text x="450" y="245" fill="var(--accent-cyan)" fontSize="11" textAnchor="middle" fontWeight="600">ReadRequest (ns=1;s=Pump_01.FlowRate)</text>
                <text x="100" y="233" fill={theme === 'business' ? '#64748b' : '#94a3b8'} fontSize="9">5.</text>
                <circle r="6" fill="var(--accent-cyan)" filter="url(#msgGlow)">
                  <animate attributeName="cx" values="90;810" dur="1.5s" begin="1.5s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="240;240" dur="1.5s" begin="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.9;1" dur="1.5s" begin="1.5s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Message 6: ReadResponse (inside secure channel) */}
              <g className="sequence-message" style={{ cursor: 'pointer' }}>
                <line x1="810" y1="270" x2="90" y2="270" stroke="var(--accent-green)" strokeWidth="2" markerEnd="url(#arrowGreen)" />
                <rect x="300" y="257" width="300" height="26" rx="5" fill="var(--accent-purple)" fillOpacity="0.2" stroke="var(--accent-green)" strokeWidth="1.5" />
                <text x="450" y="275" fill="var(--accent-green)" fontSize="11" textAnchor="middle" fontWeight="600">ReadResponse (Value: 2340.5, Status: Good, Timestamp)</text>
                <text x="830" y="263" fill={theme === 'business' ? '#64748b' : '#94a3b8'} fontSize="9">6.</text>
                <circle r="6" fill="var(--accent-green)" filter="url(#msgGlow)">
                  <animate attributeName="cx" values="810;90" dur="1.5s" begin="2s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="270;270" dur="1.5s" begin="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.9;1" dur="1.5s" begin="2s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Time annotations */}
              <g transform="translate(20, 85)">
                <text fill={theme === 'business' ? '#64748b' : '#94a3b8'} fontSize="8" textAnchor="end">t₀</text>
              </g>
              <g transform="translate(20, 180)">
                <text fill={theme === 'business' ? '#64748b' : '#94a3b8'} fontSize="8" textAnchor="end">t₁</text>
              </g>
              <g transform="translate(20, 270)">
                <text fill={theme === 'business' ? '#64748b' : '#94a3b8'} fontSize="8" textAnchor="end">t₂</text>
              </g>
            </svg>
          </div>

          {/* Key Insights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem' }}>
            {[
              { step: '1-2', title: 'Session Creation', desc: 'Server allocates resources, generates nonces for crypto', color: 'var(--accent-cyan)', icon: '🔗' },
              { step: '3-4', title: 'Authentication', desc: 'Client proves identity via signature over server nonce', color: 'var(--accent-orange)', icon: '🔐' },
              { step: '5-6', title: 'Data Exchange', desc: 'All messages encrypted with session keys', color: 'var(--accent-purple)', icon: '📨' },
              { step: 'Always', title: 'Quality Metadata', desc: 'Every response includes StatusCode + Timestamp', color: 'var(--accent-green)', icon: '✅' },
            ].map((item, i) => (
              <div key={i} className="content-card animate-fade-in" style={{
                padding: '1rem',
                borderColor: item.color,
                animationDelay: `${i * 0.1}s`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                  <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', background: `${item.color}20`, borderRadius: '4px', color: item.color, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>Step {item.step}</span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: item.color, marginBottom: '0.3rem' }}>{item.title}</div>
                <div style={{ fontSize: '0.75rem', color: theme === 'business' ? '#475569' : 'var(--text-secondary)', lineHeight: 1.4 }}>{item.desc}</div>
              </div>
            ))}
          </div>

          <div className="highlight-box" style={{ marginTop: '1rem' }}>
            <p style={{ margin: 0 }}>
              <strong>Key Insight:</strong> OPC UA's session model provides <strong style={{ color: 'var(--accent-purple)' }}>mutual authentication</strong> — both client and server verify each other's identity before any data is exchanged.
              This prevents man-in-the-middle attacks and ensures audit trails are attributable to real users.
            </p>
          </div>
        </section>

        {/* Slide 20: Live Demo */}
        <section className="slide" id="slide-20" style={{ paddingTop: '60px' }}>
          <div className="section-header" style={{ marginBottom: '0.8rem' }}>
            <div className="section-number">SECTION 08 • LIVE DEMO</div>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              Live Pump Control Demo
              <span className="live-badge animate-heartbeat" style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.1)', borderColor: 'var(--accent-green)' }}>
                <div className="pulse-dot" style={{ background: 'var(--accent-green)' }} />
                {isConnected ? 'CONNECTED' : 'CONNECTING...'}
              </span>
            </h2>
            <p className="section-goal">Real-time OPC UA server interaction via this dashboard</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem', marginBottom: '1rem' }}>
            {/* Control Panel */}
            <div className="control-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>Pump Control</h3>
                <span style={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                  ns=1;s={Object.values(pumpData)[0]?.name || 'IPS_PMP_001'}
                </span>
              </div>

              {/* Live Status Display */}
              <div style={{
                background: 'var(--bg-dark)',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1rem',
                border: `2px solid ${Object.values(pumpData)[0]?.is_running ? 'var(--accent-green)' : 'var(--accent-orange)'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
                  <span style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: Object.values(pumpData)[0]?.is_running ? 'var(--accent-green)' : 'var(--accent-orange)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {Object.values(pumpData)[0]?.is_running ? (
                      <>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', animation: 'pulse 1.5s infinite' }} />
                        RUNNING
                      </>
                    ) : (
                      <>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-orange)' }} />
                        STOPPED
                      </>
                    )}
                  </span>
                </div>

                {/* Live Values */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div style={{ background: 'var(--bg-elevated)', padding: '0.6rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Flow Rate</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--accent-cyan)' }}>
                      {(Object.values(pumpData)[0]?.flow_rate || 0).toFixed(1)}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '4px' }}>GPM</span>
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', padding: '0.6rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>RPM</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--accent-orange)' }}>
                      {(Object.values(pumpData)[0]?.rpm || 0).toFixed(0)}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', padding: '0.6rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Power</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--accent-green)' }}>
                      {(Object.values(pumpData)[0]?.power_consumption || 0).toFixed(1)}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '4px' }}>kW</span>
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', padding: '0.6rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Power Factor</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--accent-purple)' }}>
                      {(Object.values(pumpData)[0]?.power_factor || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
                <button
                  className="control-button"
                  onClick={() => {
                    const pump = Object.keys(pumpData)[0];
                    if (pump) {
                      usePumpStore.getState().startPump(pump);
                    }
                  }}
                  disabled={Object.values(pumpData)[0]?.is_running}
                  style={{ opacity: Object.values(pumpData)[0]?.is_running ? 0.5 : 1 }}
                >
                  <Play size={16} /> Start Pump
                </button>
                <button
                  className="control-button stop"
                  onClick={() => {
                    const pump = Object.keys(pumpData)[0];
                    if (pump) {
                      usePumpStore.getState().stopPump(pump);
                    }
                  }}
                  disabled={!Object.values(pumpData)[0]?.is_running}
                  style={{ opacity: !Object.values(pumpData)[0]?.is_running ? 0.5 : 1 }}
                >
                  <Activity size={16} /> Stop Pump
                </button>
              </div>
            </div>

            {/* OPC UA Request/Response Log */}
            <div className="demo-terminal">
              <div className="demo-terminal-header">
                <div className="demo-terminal-dot" style={{ background: '#ff5f56' }} />
                <div className="demo-terminal-dot" style={{ background: '#ffbd2e' }} />
                <div className="demo-terminal-dot" style={{ background: '#27ca40' }} />
                <span style={{ marginLeft: '12px', fontSize: '0.75rem', color: '#8b949e' }}>OPC UA Communication Log</span>
              </div>
              <div className="demo-terminal-body">
                <div className="demo-terminal-line">
                  <span className="demo-terminal-prompt">$</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>opcua-client connect opc.tcp://localhost:4840</span>
                </div>
                <div className="demo-terminal-line">
                  <span style={{ color: '#8b949e' }}>[INFO]</span>
                  <span className="demo-terminal-output">Establishing SecureChannel with SecurityPolicy: Aes256_Sha256_RsaPss</span>
                </div>
                <div className="demo-terminal-line">
                  <span style={{ color: 'var(--accent-green)' }}>[SUCCESS]</span>
                  <span className="demo-terminal-output">SecureChannel established, TokenId: 1</span>
                </div>
                <div className="demo-terminal-line">
                  <span style={{ color: '#8b949e' }}>[INFO]</span>
                  <span className="demo-terminal-output">Creating session...</span>
                </div>
                <div className="demo-terminal-line">
                  <span style={{ color: 'var(--accent-green)' }}>[SUCCESS]</span>
                  <span className="demo-terminal-output">Session activated, SessionId: ns=1;i=42</span>
                </div>
                <div className="demo-terminal-line" style={{ marginTop: '8px' }}>
                  <span className="demo-terminal-prompt">$</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>read ns=1;s=IPS_PMP_001.FlowRate</span>
                </div>
                <div className="demo-terminal-line">
                  <span style={{ color: 'var(--accent-purple)' }}>[READ]</span>
                  <span className="demo-terminal-output">NodeId: ns=1;s=IPS_PMP_001.FlowRate</span>
                </div>
                <div className="demo-terminal-line">
                  <span style={{ color: 'var(--accent-green)' }}>[RESPONSE]</span>
                  <span className="demo-terminal-output">
                    Value: <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{(Object.values(pumpData)[0]?.flow_rate || 2340.5).toFixed(2)}</span> |
                    Status: <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>Good</span> |
                    Time: {currentTime || '00:00:00'}
                  </span>
                </div>
                <div className="demo-terminal-line" style={{ marginTop: '8px' }}>
                  <span className="demo-terminal-prompt">$</span>
                  <span style={{ color: 'var(--accent-orange)' }}>subscribe ns=1;s=IPS_PMP_001.* --interval=1000ms</span>
                </div>
                <div className="demo-terminal-line">
                  <span style={{ color: 'var(--accent-green)' }}>[SUBSCRIBED]</span>
                  <span className="demo-terminal-output">MonitoredItem created for 27 variables, PublishingInterval: 1000ms</span>
                </div>
                <div className="demo-terminal-line">
                  <span style={{ color: '#8b949e' }}>[NOTIFICATION]</span>
                  <span className="demo-terminal-output">
                    RPM: <span style={{ color: 'var(--accent-orange)' }}>{(Object.values(pumpData)[0]?.rpm || 1145).toFixed(0)}</span> |
                    Power: <span style={{ color: 'var(--accent-green)' }}>{(Object.values(pumpData)[0]?.power_consumption || 124.8).toFixed(1)} kW</span> |
                    PF: <span style={{ color: 'var(--accent-purple)' }}>{(Object.values(pumpData)[0]?.power_factor || 0.85).toFixed(2)}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Architecture Visualization */}
          <div className="diagram-container" style={{ padding: '1rem' }}>
            <div className="diagram-title">Live Data Flow Architecture</div>
            <svg viewBox="0 0 900 140" style={{ width: '100%', height: '140px' }}>
              {/* This Dashboard */}
              <g transform="translate(50, 50)">
                <rect width="100" height="50" rx="8" fill={theme === 'business' ? '#f0f9ff' : 'rgba(0,212,255,0.15)'} stroke="var(--accent-cyan)" strokeWidth="2" className="animate-glow" />
                <text x="50" y="25" fill="var(--accent-cyan)" fontSize="10" textAnchor="middle" fontWeight="700">This Dashboard</text>
                <text x="50" y="40" fill={theme === 'business' ? '#0284c7' : '#67e8f9'} fontSize="8" textAnchor="middle">React + WebSocket</text>
              </g>

              {/* Arrow to API */}
              <g>
                <line x1="155" y1="75" x2="250" y2="75" stroke="var(--accent-cyan)" strokeWidth="2" markerEnd="url(#arrowRight)" />
                <text x="202" y="68" fill="var(--text-muted)" fontSize="8" textAnchor="middle">HTTP/WS</text>
                <circle r="4" fill="var(--accent-cyan)">
                  <animate attributeName="cx" values="160;245" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="75;75" dur="1.5s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* FastAPI */}
              <g transform="translate(255, 40)">
                <rect width="120" height="70" rx="8" fill={theme === 'business' ? '#fefce8' : 'rgba(245,158,11,0.15)'} stroke="var(--accent-orange)" strokeWidth="2" />
                <text x="60" y="25" fill="var(--accent-orange)" fontSize="10" textAnchor="middle" fontWeight="700">FastAPI Backend</text>
                <text x="60" y="40" fill={theme === 'business' ? '#b45309' : '#fde047'} fontSize="8" textAnchor="middle">Python + asyncua</text>
                <rect x="15" y="48" width="90" height="16" rx="4" fill={theme === 'business' ? '#fef3c7' : 'rgba(245,158,11,0.2)'} />
                <text x="60" y="60" fill="var(--accent-orange)" fontSize="7" textAnchor="middle">OPC UA Client Lib</text>
              </g>

              {/* Arrow to Server */}
              <g>
                <line x1="380" y1="75" x2="490" y2="75" stroke="var(--accent-purple)" strokeWidth="2" markerEnd="url(#arrowRight)" />
                <text x="435" y="68" fill="var(--text-muted)" fontSize="8" textAnchor="middle">UA TCP :4840</text>
                <rect x="410" y="82" width="50" height="16" rx="3" fill="var(--accent-purple)" opacity="0.2" stroke="var(--accent-purple)" strokeDasharray="3 2" />
                <text x="435" y="93" fill="var(--accent-purple)" fontSize="7" textAnchor="middle">Encrypted</text>
                <circle r="4" fill="var(--accent-purple)">
                  <animate attributeName="cx" values="385;485" dur="1.5s" begin="0.3s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="75;75" dur="1.5s" begin="0.3s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* OPC UA Server */}
              <g transform="translate(495, 30)">
                <rect width="140" height="90" rx="8" fill={theme === 'business' ? '#f0fdf4' : 'rgba(16,185,129,0.15)'} stroke="var(--accent-green)" strokeWidth="2" />
                <text x="70" y="22" fill="var(--accent-green)" fontSize="10" textAnchor="middle" fontWeight="700">OPC UA Server</text>
                <text x="70" y="36" fill={theme === 'business' ? '#059669' : '#6ee7b7'} fontSize="8" textAnchor="middle">Python asyncua</text>
                <rect x="10" y="44" width="55" height="38" rx="4" fill={theme === 'business' ? '#dcfce7' : 'rgba(16,185,129,0.2)'} />
                <text x="37" y="58" fill="var(--accent-green)" fontSize="7" textAnchor="middle" fontWeight="600">Address</text>
                <text x="37" y="70" fill="var(--accent-green)" fontSize="7" textAnchor="middle" fontWeight="600">Space</text>
                <rect x="75" y="44" width="55" height="38" rx="4" fill={theme === 'business' ? '#fef3c7' : 'rgba(245,158,11,0.2)'} />
                <text x="102" y="58" fill="var(--accent-orange)" fontSize="7" textAnchor="middle" fontWeight="600">Simulation</text>
                <text x="102" y="70" fill="var(--accent-orange)" fontSize="7" textAnchor="middle" fontWeight="600">Engine</text>
              </g>

              {/* Arrow to Pumps */}
              <g>
                <line x1="640" y1="75" x2="720" y2="75" stroke="var(--accent-green)" strokeWidth="2" markerEnd="url(#arrowRight)" />
                <text x="680" y="68" fill="var(--text-muted)" fontSize="8" textAnchor="middle">Simulated</text>
              </g>

              {/* Physical Pumps */}
              <g transform="translate(725, 35)">
                <rect width="120" height="80" rx="8" fill={theme === 'business' ? '#ede9fe' : 'rgba(139,92,246,0.15)'} stroke="var(--accent-purple)" strokeWidth="2" />
                <text x="60" y="22" fill="var(--accent-purple)" fontSize="10" textAnchor="middle" fontWeight="700">Virtual Pumps</text>
                <g transform="translate(10, 32)">
                  <rect width="30" height="25" rx="4" fill={theme === 'business' ? '#f5f3ff' : 'var(--bg-dark)'} stroke="var(--accent-green)" strokeWidth="1.5" />
                  <text x="15" y="18" fill="var(--accent-green)" fontSize="8" textAnchor="middle" fontWeight="600">P1</text>
                </g>
                <g transform="translate(45, 32)">
                  <rect width="30" height="25" rx="4" fill={theme === 'business' ? '#f5f3ff' : 'var(--bg-dark)'} stroke="var(--accent-cyan)" strokeWidth="1.5" />
                  <text x="15" y="18" fill="var(--accent-cyan)" fontSize="8" textAnchor="middle" fontWeight="600">P2</text>
                </g>
                <g transform="translate(80, 32)">
                  <rect width="30" height="25" rx="4" fill={theme === 'business' ? '#f5f3ff' : 'var(--bg-dark)'} stroke="var(--accent-orange)" strokeWidth="1.5" />
                  <text x="15" y="18" fill="var(--accent-orange)" fontSize="8" textAnchor="middle" fontWeight="600">P3</text>
                </g>
                <text x="60" y="72" fill={theme === 'business' ? '#7c3aed' : '#c4b5fd'} fontSize="7" textAnchor="middle">Realistic Physics Engine</text>
              </g>
            </svg>
          </div>
        </section>

        {/* Slide 21: Key Takeaways */}
        <section className="slide" id="slide-21" style={{ paddingTop: '60px' }}>
          <div className="section-header" style={{ marginBottom: '1rem' }}>
            <div className="section-number">SUMMARY • KEY TAKEAWAYS</div>
            <h2 className="section-title">What You Should Remember</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.2rem', marginBottom: '1.5rem' }}>
            {[
              {
                icon: <Database size={32} />,
                title: 'Address Space is a Graph',
                points: ['Not flat registers or tags', 'Nodes + References = Semantic context', 'Self-describing with types and engineering units'],
                color: 'var(--accent-cyan)'
              },
              {
                icon: <Shield size={32} />,
                title: 'Security is Layered',
                points: ['SecureChannel: encrypts the pipe', 'Session: authenticates the user', 'Both required for defense in depth'],
                color: 'var(--accent-purple)'
              },
              {
                icon: <ArrowLeftRight size={32} />,
                title: 'Two Communication Models',
                points: ['Client-Server: interactive, bidirectional', 'PubSub: scalable, unidirectional', 'Choose based on use case'],
                color: 'var(--accent-orange)'
              },
              {
                icon: <Layers size={32} />,
                title: 'Type System is Powerful',
                points: ['Define once, instantiate many', 'ObjectTypes carry full schemas', 'Companion specs extend with domain knowledge'],
                color: 'var(--accent-green)'
              },
              {
                icon: <Activity size={32} />,
                title: 'Quality is First-Class',
                points: ['Every value has StatusCode + Timestamp', 'Bad quality propagates clearly', 'No silent failures'],
                color: 'var(--accent-pink)'
              },
              {
                icon: <Globe size={32} />,
                title: 'Platform Agnostic',
                points: ['Works across OS, languages, networks', 'From embedded to cloud', 'Vendor-neutral interoperability'],
                color: 'var(--accent-cyan)'
              }
            ].map((item, i) => (
              <div key={i} className="content-card animate-fade-in" style={{
                padding: '1.2rem',
                borderColor: item.color,
                animationDelay: `${i * 0.1}s`,
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.8rem' }}>
                  <div style={{ color: item.color }}>{item.icon}</div>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: item.color, fontWeight: 700 }}>{item.title}</h3>
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  {item.points.map((point, j) => (
                    <li key={j} style={{ color: theme === 'business' ? '#475569' : 'var(--text-secondary)', marginBottom: '0.3rem' }}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Quick Reference Card */}
          <div className="diagram-container" style={{ padding: '1.2rem' }}>
            <div className="diagram-title" style={{ marginBottom: '1rem' }}>Quick Reference: When to Use What</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              {[
                { scenario: 'Control a pump', solution: 'Client-Server + Write', protocol: 'TCP :4840', color: 'var(--accent-cyan)' },
                { scenario: 'Dashboard monitoring', solution: 'Client-Server + Subscribe', protocol: 'WebSocket', color: 'var(--accent-purple)' },
                { scenario: 'Cloud analytics', solution: 'PubSub + MQTT', protocol: 'MQTT :8883', color: 'var(--accent-orange)' },
                { scenario: 'Historical trends', solution: 'HistoryRead + Aggregates', protocol: 'TCP :4840', color: 'var(--accent-green)' },
              ].map((item, i) => (
                <div key={i} style={{
                  background: theme === 'business' ? '#f8fafc' : 'var(--bg-dark)',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: `1px solid ${item.color}`,
                  borderLeft: `4px solid ${item.color}`
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: item.color, marginBottom: '0.4rem' }}>{item.scenario}</div>
                  <div style={{ fontSize: '0.8rem', color: theme === 'business' ? '#334155' : 'var(--text-primary)', marginBottom: '0.4rem' }}>{item.solution}</div>
                  <div style={{ fontSize: '0.7rem', fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '0.2rem 0.4rem', borderRadius: '4px', display: 'inline-block' }}>{item.protocol}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button className="btn-action" onClick={() => goToSlide(22)}>
              Final Thoughts →
            </button>
          </div>
        </section>

        {/* Slide 22: Conclusion */}
        <section className="slide title-slide" id="slide-22">
          <div className="quote" style={{ fontSize: '1.3rem', border: 'none', background: 'none' }}>
            <strong style={{ fontSize: '1.5rem' }}>OPC UA is not about moving data.</strong><br /><br />
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
        {showServerStatus && (
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
        )}

        {/* Keyboard Hints Overlay */}
        {showKeyboardHints && (
          <div className="keyboard-hints">
            <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Keyboard Shortcuts</div>
            <div className="keyboard-hint-row">
              <span className="kbd">→</span>
              <span className="kbd">Space</span>
              <span style={{ color: 'var(--text-muted)' }}>Next slide</span>
            </div>
            <div className="keyboard-hint-row">
              <span className="kbd">←</span>
              <span style={{ color: 'var(--text-muted)' }}>Previous slide</span>
            </div>
            <div className="keyboard-hint-row">
              <span className="kbd">Home</span>
              <span style={{ color: 'var(--text-muted)' }}>First slide</span>
            </div>
            <div className="keyboard-hint-row">
              <span className="kbd">End</span>
              <span style={{ color: 'var(--text-muted)' }}>Last slide</span>
            </div>
            <div className="keyboard-hint-row">
              <span className="kbd">T</span>
              <span style={{ color: 'var(--text-muted)' }}>Toggle theme</span>
            </div>
            <div className="keyboard-hint-row">
              <span className="kbd">K</span>
              <span style={{ color: 'var(--text-muted)' }}>Toggle hints</span>
            </div>
            <div className="keyboard-hint-row">
              <span className="kbd">S</span>
              <span style={{ color: 'var(--text-muted)' }}>Toggle server status</span>
            </div>
            <div className="keyboard-hint-row">
              <span className="kbd">D</span>
              <span style={{ color: 'var(--text-muted)' }}>Go to dashboard</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}