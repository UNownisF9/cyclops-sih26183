import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';

// ==================== MULTI-CHAIN DATASETS (REALISTIC VARIATION) ====================
const CHAIN_DATASETS = {
    ethereum: {
        chainName: 'Ethereum Mainnet',
        currency: 'ETH',
        suspect_wallet: '0x9999a3b2e5f8841a0e889b41a91e1d092cb3e4a1',
        golden_hour_seconds: 5840, // 01:37:20
        caseMeta: {
            docket_no: 'NCRP-2026-DEL-1092',
            victim_name: 'Rajeshwari Iyer',
            category: 'Task-Based Telegram Part-Time Scam',
            reported_loss: '₹12,12,500 (4.85 ETH)'
        },
        elements: {
            nodes: [
                { data: { id: 'n1', label: 'Suspect (0x9999...e4a1)', full_address: '0x9999a3b2e5f8841a0e889b41a91e1d092cb3e4a1', entity_type: 'SUSPECT', entity_name: 'Telegram Scammer Wallet', tag: 'Origin Theft Node', risk_score: 92, hop_level: 0 }, position: { x: 100, y: 260 } },
                { data: { id: 'n2', label: 'Mule #1 (0x7777...5b12)', full_address: '0x77771b3e5a4439c2d1b7642e4e112d8a1c905b12', entity_type: 'INTERMEDIARY', entity_name: 'Mule Intermediary 1', tag: 'Peel-Chain Mule', risk_score: 65, hop_level: 1 }, position: { x: 350, y: 230 } },
                { data: { id: 'n3', label: 'Mule #2 (0x5555...2c45)', full_address: '0x55552c4d7e9921b3a8d9921c5f334a9b6d812c45', entity_type: 'INTERMEDIARY', entity_name: 'Mule Intermediary 2', tag: 'Consolidation Mule', risk_score: 65, hop_level: 2 }, position: { x: 600, y: 290 } },
                { data: { id: 'n4', label: 'Binance (Hot Wallet 14)', full_address: '0x28c6c06298d514db089934071355e5743bf21d60', entity_type: 'CEX', entity_name: 'Binance', tag: 'Binance: Hot Wallet 14', risk_score: 15, hop_level: 3 }, position: { x: 860, y: 260 } }
            ],
            edges: [
                { data: { id: 'e1', source: 'n1', target: 'n2', value_eth: 4.85, token: 'ETH', tx_hash: '0xaaa1111111111111111111111111111111111111111111111111111111111111' } },
                { data: { id: 'e2', source: 'n2', target: 'n3', value_eth: 4.50, token: 'ETH', tx_hash: '0xbbb1111111111111111111111111111111111111111111111111111111111111' } },
                { data: { id: 'e3', source: 'n3', target: 'n4', value_eth: 4.45, token: 'ETH', tx_hash: '0xccc1111111111111111111111111111111111111111111111111111111111111' } }
            ]
        },
        attributions: [
            { entity_name: 'Binance', category: 'CEX', tag: 'Binance: Hot Wallet 14', fiu_status: 'Compliant / Registered', terminal_address: '0x28c6c06298d514db089934071355e5743bf21d60', hop_distance: 3, confidence_score: 94.2, compliance_contact: 'case@binance.com' }
        ],
        risk_assessment: {
            overall_risk_score: 84,
            risk_rating: 'HIGH',
            detected_patterns: ['Peel-chain structuring: rapid fund pass-through', 'Direct deposit to Binance depository pool'],
            summary: 'Actionable off-ramp identified at Binance. Immediate Section 91 CrPC notice can be dispatched to case@binance.com.'
        },
        ml_features: {
            model_name: 'RandomForestClassifier (GNN Topological Weights)',
            predicted_type: 'MULE_INTERMEDIARY',
            confidence: 94.6,
            laundering_probability: 98.2,
            features: [
                { name: 'Mean Holding Velocity', value: '8.4 mins', normal: '> 24 hrs', status: 'ANOMALY' },
                { name: 'Balance Sweep Ratio', value: '99.2%', normal: '< 40%', status: 'ANOMALY' },
                { name: 'Peel-Chain Asymmetry', value: '0.97', normal: '< 0.30', status: 'ANOMALY' },
                { name: 'Counterparty Entropy', value: '0.18', normal: '> 0.75', status: 'ANOMALY' },
                { name: 'Gas Price Urgency', value: '142 Gwei', normal: '25 Gwei', status: 'HIGH' }
            ]
        },
        custody_trail: [
            { hop: 1, from_addr: '0x9999a3b2e5f8841a0e889b41a91e1d092cb3e4a1', to_addr: '0x77771b3e5a4439c2d1b7642e4e112d8a1c905b12', to_name: 'Mule Intermediary 1', value_eth: 4.85, token: 'ETH', value_inr: 1212500, tx_hash: '0xaaa1111111111111111111111111111111111111111111111111111111111111' },
            { hop: 2, from_addr: '0x77771b3e5a4439c2d1b7642e4e112d8a1c905b12', to_addr: '0x55552c4d7e9921b3a8d9921c5f334a9b6d812c45', to_name: 'Mule Intermediary 2', value_eth: 4.50, token: 'ETH', value_inr: 1125000, tx_hash: '0xbbb1111111111111111111111111111111111111111111111111111111111111' },
            { hop: 3, from_addr: '0x55552c4d7e9921b3a8d9921c5f334a9b6d812c45', to_addr: '0x28c6c06298d514db089934071355e5743bf21d60', to_name: 'Binance Hot Wallet 14', value_eth: 4.45, token: 'ETH', value_inr: 1112500, tx_hash: '0xccc1111111111111111111111111111111111111111111111111111111111111' }
        ]
    },

    tron: {
        chainName: 'Tron Network (TRC-20)',
        currency: 'USDT',
        suspect_wallet: 'TScam9999a3b2e5f8841a0e889b41a91e1d092',
        golden_hour_seconds: 1725, // 00:28:45 (URGENT)
        caseMeta: {
            docket_no: 'NCRP-2026-MUM-4402',
            victim_name: 'Aakash Verma',
            category: 'Fake Forex Trading Platform (TRC-20 USDT)',
            reported_loss: '₹20,50,000 (25,000 USDT)'
        },
        elements: {
            nodes: [
                { data: { id: 't1', label: 'Suspect (TScam9999...1e1d)', full_address: 'TScam9999a3b2e5f8841a0e889b41a91e1d092', entity_type: 'SUSPECT', entity_name: 'Forex Scam Master Wallet', tag: 'USDT Collector', risk_score: 98, hop_level: 0 }, position: { x: 120, y: 260 } },
                { data: { id: 't2', label: 'Tron Mule (TMule7777...b41a)', full_address: 'TMule77771b3e5a4439c2d1b7642e4e112d8a', entity_type: 'INTERMEDIARY', entity_name: 'Tron Aggregator Mule', tag: 'High-Velocity Mule', risk_score: 75, hop_level: 1 }, position: { x: 480, y: 260 } },
                { data: { id: 't3', label: 'Binance (Tron TRC-20 Pool)', full_address: 'TXn21YhN6mQyK4mBv3w8b4g5h6j7k8l9', entity_type: 'CEX', entity_name: 'Binance Tron VASP', tag: 'Binance: TRC-20 Hot Wallet', risk_score: 10, hop_level: 2 }, position: { x: 840, y: 260 } }
            ],
            edges: [
                { data: { id: 'te1', source: 't1', target: 't2', value_eth: 25000, token: 'USDT', tx_hash: '0xtron_tx_1111111111111111111111111111111111111111' } },
                { data: { id: 'te2', source: 't2', target: 't3', value_eth: 24850, token: 'USDT', tx_hash: '0xtron_tx_2222222222222222222222222222222222222222' } }
            ]
        },
        attributions: [
            { entity_name: 'Binance (Tron VASP)', category: 'CEX', tag: 'Binance TRC20 Deposit Pool', fiu_status: 'Compliant / Registered', terminal_address: 'TXn21YhN6mQyK4mBv3w8b4g5h6j7k8l9', hop_distance: 2, confidence_score: 99.8, compliance_contact: 'case@binance.com' }
        ],
        risk_assessment: {
            overall_risk_score: 96,
            risk_rating: 'CRITICAL',
            detected_patterns: ['High-velocity Tron TRC-20 USDT transfer (Golden Hour Alert)', 'Direct deposit to Binance Tron Hot Wallet'],
            summary: 'Critical velocity detected on Tron TRC-20. Immediate freeze requisition dispatched to Binance Tron compliance desk.'
        },
        ml_features: {
            model_name: 'GradientBoostingClassifier (Temporal Velocity)',
            predicted_type: 'MULE_HIGH_VELOCITY',
            confidence: 99.1,
            laundering_probability: 99.7,
            features: [
                { name: 'Mean Holding Velocity', value: '2.1 mins', normal: '> 24 hrs', status: 'CRITICAL' },
                { name: 'Balance Sweep Ratio', value: '99.4%', normal: '< 40%', status: 'ANOMALY' },
                { name: 'Contract Dispersal Speed', value: '18 tx/hr', normal: '< 1 tx/hr', status: 'CRITICAL' },
                { name: 'Gasless Energy Delegation', value: 'Active', normal: 'Inactive', status: 'BOT_SCRIPT' }
            ]
        },
        custody_trail: [
            { hop: 1, from_addr: 'TScam9999a3b2e5f8841a0e889b41a91e1d092', to_addr: 'TMule77771b3e5a4439c2d1b7642e4e112d8a', to_name: 'Tron Aggregator Mule', value_eth: 25000, token: 'USDT', value_inr: 2050000, tx_hash: '0xtron_tx_1111111111111111111111111111111111111111' },
            { hop: 2, from_addr: 'TMule77771b3e5a4439c2d1b7642e4e112d8a', to_addr: 'TXn21YhN6mQyK4mBv3w8b4g5h6j7k8l9', to_name: 'Binance Tron Hot Wallet', value_eth: 24850, token: 'USDT', value_inr: 2037700, tx_hash: '0xtron_tx_2222222222222222222222222222222222222222' }
        ]
    },

    bitcoin: {
        chainName: 'Bitcoin Network (UTXO)',
        currency: 'BTC',
        suspect_wallet: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        golden_hour_seconds: 11730, // 03:15:30
        caseMeta: {
            docket_no: 'NCRP-2026-CHD-0912',
            victim_name: 'Harpreet Singh',
            category: 'Sextortion / Darknet Bitcoin Extortion',
            reported_loss: '₹18,40,000 (0.35 BTC)'
        },
        elements: {
            nodes: [
                { data: { id: 'b1', label: 'Suspect (1A1zP1...vfNa)', full_address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', entity_type: 'SUSPECT', entity_name: 'Extortionist BTC Wallet', tag: 'Origin Theft Node', risk_score: 95, hop_level: 0 }, position: { x: 150, y: 260 } },
                { data: { id: 'b2', label: 'Binance (BTC Storage)', full_address: '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo', entity_type: 'CEX', entity_name: 'Binance BTC Hot Wallet', tag: 'Binance: BTC Storage', risk_score: 15, hop_level: 1 }, position: { x: 750, y: 260 } }
            ],
            edges: [
                { data: { id: 'be1', source: 'b1', target: 'b2', value_eth: 0.35, token: 'BTC', tx_hash: '0xbtc_tx_hash_1111111111111111111111111111111' } }
            ]
        },
        attributions: [
            { entity_name: 'Binance (Bitcoin VASP)', category: 'CEX', tag: 'Binance BTC Storage', fiu_status: 'Compliant', terminal_address: '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo', hop_distance: 1, confidence_score: 88.5, compliance_contact: 'case@binance.com' }
        ],
        risk_assessment: {
            overall_risk_score: 74,
            risk_rating: 'ELEVATED',
            detected_patterns: ['Direct Bitcoin transfer to identified VASP', 'Darknet / Extortionist address flag'],
            summary: 'Actionable Bitcoin off-ramp identified at Binance via Blockstream Esplora. Section 91 CrPC notice ready for dispatch.'
        },
        ml_features: {
            model_name: 'DBSCAN + Common-Input-Ownership Clustering',
            predicted_type: 'EXTORTION_DIRECT_DEPOSIT',
            confidence: 88.5,
            laundering_probability: 76.4,
            features: [
                { name: 'UTXO Co-Spend Cluster Size', value: '4 addresses', normal: '1 address', status: 'SYBIL' },
                { name: 'CoinJoin / Wasabi Obfuscation', value: 'None Detected', normal: 'Clean', status: 'CLEAR' },
                { name: 'Hop Distance to VASP', value: '1 Hop', normal: '> 3 Hops', status: 'DIRECT' }
            ]
        },
        custody_trail: [
            { hop: 1, from_addr: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', to_addr: '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo', to_name: 'Binance BTC Wallet', value_eth: 0.35, token: 'BTC', value_inr: 1840000, tx_hash: '0xbtc_tx_hash_1111111111111111111111111111111' }
        ]
    },

    multichain: {
        chainName: 'Multi-Chain (Cross-Bridge)',
        currency: 'ETH / MATIC',
        suspect_wallet: '0x8888a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9',
        golden_hour_seconds: 730, // 00:12:10 (CRITICAL EXPIRING)
        caseMeta: {
            docket_no: 'NCRP-2026-BLR-0841',
            victim_name: 'Deepak Chawla',
            category: 'Crypto Stealer & Cross-Chain Hop',
            reported_loss: '₹15,50,000 (6.20 ETH)'
        },
        elements: {
            nodes: [
                { data: { id: 'm1', label: 'Suspect (0x8888...e8f9)', full_address: '0x8888a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9', entity_type: 'SUSPECT', entity_name: 'Malware Stealer', tag: 'Origin Theft Node', risk_score: 90, hop_level: 0 }, position: { x: 100, y: 260 } },
                { data: { id: 'm2', label: 'Burner Mule (0x3333...a6b5)', full_address: '0x3333c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5', entity_type: 'INTERMEDIARY', entity_name: 'Burner Relay', tag: 'DeFi Router Relay', risk_score: 65, hop_level: 1 }, position: { x: 350, y: 230 } },
                { data: { id: 'm3', label: 'Polygon Bridge (Router)', full_address: '0x40ec5b33f54e083c748c0a969f658bcf36d758f8', entity_type: 'BRIDGE', entity_name: 'Polygon Bridge Contract', tag: 'DeFi Cross-Chain Bridge', risk_score: 50, hop_level: 2 }, position: { x: 600, y: 290 } },
                { data: { id: 'm4', label: 'CoinDCX (Polygon Hot Wallet)', full_address: '0x503828976d22510aad0201ac7ec88293211d23dc', entity_type: 'CEX', entity_name: 'CoinDCX', tag: 'CoinDCX: Main Hot Wallet', risk_score: 10, hop_level: 3 }, position: { x: 860, y: 260 } }
            ],
            edges: [
                { data: { id: 'me1', source: 'm1', target: 'm2', value_eth: 6.20, token: 'ETH', tx_hash: '0xbridge_tx_111111111111111111111111111111111111' } },
                { data: { id: 'me2', source: 'm2', target: 'm3', value_eth: 6.15, token: 'ETH', tx_hash: '0xbridge_tx_222222222222222222222222222222222222' } },
                { data: { id: 'me3', source: 'm3', target: 'm4', value_eth: 6.10, token: 'MATIC/ETH', tx_hash: '0xbridge_tx_333333333333333333333333333333333333' } }
            ]
        },
        attributions: [
            { entity_name: 'CoinDCX (Domestic VASP)', category: 'CEX', tag: 'CoinDCX Main Hot Wallet', fiu_status: 'FIU-IND Registered', terminal_address: '0x503828976d22510aad0201ac7ec88293211d23dc', hop_distance: 3, confidence_score: 92.1, compliance_contact: 'compliance@coindcx.com' }
        ],
        risk_assessment: {
            overall_risk_score: 91,
            risk_rating: 'CRITICAL',
            detected_patterns: ['Cross-Chain Bridge hop detected (Ethereum -> Polygon)', 'Final deposit into CoinDCX Domestic VASP'],
            summary: 'Value hopped across Polygon Bridge before depositing into CoinDCX. Immediate Section 91 CrPC notice can be dispatched to compliance@coindcx.com.'
        },
        ml_features: {
            model_name: 'Cross-Bridge Topology Mapper',
            predicted_type: 'CROSS_CHAIN_LAYERER',
            confidence: 92.1,
            laundering_probability: 95.8,
            features: [
                { name: 'Bridge Smart Contract Interaction', value: 'Polygon Bridge (0x40ec...)', normal: 'None', status: 'BRIDGE_DETECTED' },
                { name: 'L1 to L2 State Sync Delay', value: '7.2 mins', normal: 'N/A', status: 'ACTIVE_HOP' },
                { name: 'FIU-IND VASP Terminal Destination', value: 'CoinDCX Depository', normal: 'N/A', status: 'OFF_RAMP' }
            ]
        },
        custody_trail: [
            { hop: 1, from_addr: '0x8888a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9', to_addr: '0x3333c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5', to_name: 'Burner Relay', value_eth: 6.20, token: 'ETH', value_inr: 1550000, tx_hash: '0xbridge_tx_111111111111111111111111111111111111' },
            { hop: 2, from_addr: '0x3333c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5', to_addr: '0x40ec5b33f54e083c748c0a969f658bcf36d758f8', to_name: 'Polygon Bridge Contract', value_eth: 6.15, token: 'ETH', value_inr: 1537500, tx_hash: '0xbridge_tx_222222222222222222222222222222222222' },
            { hop: 3, from_addr: '0x40ec5b33f54e083c748c0a969f658bcf36d758f8', to_addr: '0x503828976d22510aad0201ac7ec88293211d23dc', to_name: 'CoinDCX Hot Wallet', value_eth: 6.10, token: 'MATIC/ETH', value_inr: 1525000, tx_hash: '0xbridge_tx_333333333333333333333333333333333333' }
        ]
    }
};

// Stream of simulated live 1930 Helpline citizen complaints
const LIVE_COMPLAINT_STREAM = [
    { victim: 'Priya Narang', amount: '₹8,50,000 (3.4 ETH)', type: 'Task-Based Telegram Scam', wallet: '0x9999a3b2e5f8841a0e889b41a91e1d092cb3e4a1', chain: 'ethereum' },
    { victim: 'Sunil Deshmukh', amount: '₹20,50,000 (25k USDT)', type: 'Fake Forex App', wallet: 'TScam9999a3b2e5f8841a0e889b41a91e1d092', chain: 'tron' },
    { victim: 'Dr. S. K. Roy', amount: '₹25,00,000 (10 ETH)', type: 'Hospital Ransomware', wallet: '0x1111a2b3c4d5e6f708192a3b4c5d6e7f8a9b0c1d', chain: 'ethereum' },
    { victim: 'Rohit Aggarwal', amount: '₹14,20,000 (0.28 BTC)', type: 'Sextortion Extortion', wallet: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', chain: 'bitcoin' }
];



// ==================== CYBERNETIC EYE EMBLEM COMPONENT ====================
function CyclopsEyeEmblem() {
    return (
        <div style={{ position: 'relative', width: '68px', height: '68px', margin: '0 auto 10px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Outer Glow Halo */}
            <div style={{ position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, rgba(37, 99, 235, 0) 70%)', filter: 'blur(10px)', animation: 'pulseGlow 2.5s infinite' }} />

            <svg width="96" height="96" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ zIndex: 2, filter: 'drop-shadow(0 0 14px rgba(56, 189, 248, 0.7))' }}>
                {/* Outer Tech Radar Ring */}
                <circle cx="50" cy="50" r="46" stroke="#1e3a8a" strokeWidth="1.5" strokeDasharray="6 4" />
                <circle cx="50" cy="50" r="41" stroke="#38bdf8" strokeWidth="1" opacity="0.5" strokeDasharray="30 10 15 10" />

                {/* Cyber Eye Outline (Diamond / Eye Contour) */}
                <path d="M10 50 Q 50 16 90 50 Q 50 84 10 50 Z" stroke="#38bdf8" strokeWidth="2.5" fill="rgba(14, 165, 233, 0.08)" />

                {/* Inner Tech Reticle Lines */}
                <line x1="50" y1="18" x2="50" y2="28" stroke="#38bdf8" strokeWidth="1.5" opacity="0.8" />
                <line x1="50" y1="72" x2="50" y2="82" stroke="#38bdf8" strokeWidth="1.5" opacity="0.8" />
                <line x1="12" y1="50" x2="22" y2="50" stroke="#38bdf8" strokeWidth="1.5" opacity="0.8" />
                <line x1="78" y1="50" x2="88" y2="50" stroke="#38bdf8" strokeWidth="1.5" opacity="0.8" />

                {/* Iris / Glowing Aperture */}
                <circle cx="50" cy="50" r="19" stroke="#60a5fa" strokeWidth="2" fill="rgba(30, 58, 138, 0.45)" />
                <circle cx="50" cy="50" r="13" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 2" />

                {/* Core Pupil with High-Intensity Laser Glow */}
                <circle cx="50" cy="50" r="7.5" fill="#38bdf8" />
                <circle cx="52" cy="48" r="2.5" fill="#ffffff" />
            </svg>
        </div>
    );
}

// ==================== CANVAS CYBER MATRIX PARTICLE ANIMATION ====================
function CyberBackground() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        const numParticles = 65;
        const particles = [];
        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.7,
                vy: (Math.random() - 0.5) * 0.7,
                radius: Math.random() * 2 + 1.2,
                alpha: Math.random() * 0.6 + 0.2
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw particle connections
            for (let i = 0; i < numParticles; i++) {
                for (let j = i + 1; j < numParticles; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 130) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(56, 189, 248, ${0.2 * (1 - dist / 130)})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }

            // Draw floating particles
            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#38bdf8';
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0
            }}
        />
    );
}

export default function GraphViewer() {
    const containerRef = useRef(null);
    const cyRef = useRef(null);

    // Portal View: 'citizen' | 'police'
    const [currentPortal, setCurrentPortal] = useState('landing'); // 'landing' | 'citizen' | 'police'

    // POLICE AUTHENTICATION STATE
    const [isPoliceAuth, setIsPoliceAuth] = useState(false);
    const [officerId, setOfficerId] = useState('');
    const [officerPass, setOfficerPass] = useState('');
    const [authError, setAuthError] = useState('');

    // Police Layers: 'forensics' | 'dashboard' | 'dossier'
    const [activeLayer, setActiveLayer] = useState('forensics');
    const [selectedChainKey, setSelectedChainKey] = useState('ethereum');
    const [activeDataset, setActiveDataset] = useState(CHAIN_DATASETS.ethereum);
    const [suspectInput, setSuspectInput] = useState(CHAIN_DATASETS.ethereum.suspect_wallet);
    const [selectedNode, setSelectedNode] = useState(null);
    const [activeTab, setActiveTab] = useState('inspector'); // 'inspector' | 'custody' | 'ml' | 'legal'
    const [copiedNotice, setCopiedNotice] = useState(false);
    const [tracingLive, setTracingLive] = useState(false);

    // Live Golden Hour Ticking Timer
    const [secondsRemaining, setSecondsRemaining] = useState(CHAIN_DATASETS.ethereum.golden_hour_seconds);

    // Live Stream Toast State
    const [streamIndex, setStreamIndex] = useState(0);
    const [showStreamAlert, setShowStreamAlert] = useState(true);

    // Cycle incoming citizen complaints every 16 seconds
    useEffect(() => {
        const streamTimer = setInterval(() => {
            setStreamIndex((prev) => (prev + 1) % LIVE_COMPLAINT_STREAM.length);
            setShowStreamAlert(true);
        }, 16000);
        return () => clearInterval(streamTimer);
    }, []);

    // Tick countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatGoldenHour = (sec) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    // Edge line-dash-offset animation loop (creates live moving fund current)
    useEffect(() => {
        let offset = 0;
        const animInterval = setInterval(() => {
            offset = (offset - 1) % 24;
            if (cyRef.current) {
                cyRef.current.edges().style('line-dash-offset', offset);
            }
        }, 50);
        return () => clearInterval(animInterval);
    }, []);

    // Modals
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [dispatchLogs, setDispatchLogs] = useState([]);
    const [dispatchComplete, setDispatchComplete] = useState(false);

    // Citizen Complaint Form
    const [citizenName, setCitizenName] = useState('');
    const [citizenPhone, setCitizenPhone] = useState('');
    const [citizenScamType, setCitizenScamType] = useState('Task-Based Telegram Part-Time Scam');
    const [citizenWallet, setCitizenWallet] = useState('');
    const [citizenLoss, setCitizenLoss] = useState('');
    const [citizenSubmitted, setCitizenSubmitted] = useState(false);
    const [citizenDocket, setCitizenDocket] = useState('');

    // Guided Autopilot State
    const [demoActive, setDemoActive] = useState(false);
    const [demoStep, setDemoStep] = useState(0);

    const DEMO_STEPS = [
        {
            title: 'Step 1: Live Citizen Complaint Intake (1930 / NCRP)',
            desc: 'Citizen reports a crypto fraud loss. The live Golden Hour countdown clock initiates to prevent off-ramp liquidation.'
        },
        {
            title: 'Step 2: Automated Multi-Hop Graph Traversal with Live Current',
            desc: 'Notice the animated dashed vectors tracing fund flow across intermediary mule accounts (Hop 1 & Hop 2) detecting peel-chain laundering.'
        },
        {
            title: 'Step 3: Instant VASP Attribution (Binance)',
            desc: 'The trace terminates at Hop 3 matching against the FIU-IND / VASP Ground Truth Registry with 94.2% attribution confidence.'
        },
        {
            title: 'Step 4: AI / ML Topological Classification',
            desc: 'The ML Random Forest classifier categorizes unknown nodes into Mules and Exchanges using 5 topological feature weights with court explainability.'
        },
        {
            title: 'Step 5: Statutory Enforcement & Court-Admissible Dossier',
            desc: 'One-click generation of the Section 91 Cr.P.C. freeze notice to the VASP compliance desk and exportable official investigation PDF report.'
        }
    ];

    const handlePoliceLogin = (e) => {
        e.preventDefault();
        if ((officerId.trim() === 'IO-I4C-9921' || officerId.trim() === 'admin') &&
            (officerPass.trim() === 'cybercell' || officerPass.trim() === 'admin123')) {
            setIsPoliceAuth(true);
            setAuthError('');
        } else {
            setAuthError('Invalid Officer Badge ID or Security Passcode. Access Restricted.');
        }
    };

    const handlePoliceLogout = () => {
        setIsPoliceAuth(false);
        setCurrentPortal('citizen');
        setOfficerId('');
        setOfficerPass('');
    };

    // Dedicated Auto-Trace handler for live 1930 Helpline dispatch
    const handleAutoTrace = (streamItem) => {
        const chainKey = streamItem.chain;
        setSelectedChainKey(chainKey);
        const ds = CHAIN_DATASETS[chainKey];

        const updatedCase = {
            ...ds,
            suspect_wallet: streamItem.wallet,
            caseMeta: {
                docket_no: "NCRP-2026-1930-" + streamItem.victim.split(" ")[0].toUpperCase(),
                victim_name: streamItem.victim,
                category: streamItem.type,
                reported_loss: streamItem.amount
            }
        };

        setActiveDataset(updatedCase);
        setSuspectInput(streamItem.wallet);
        setSelectedNode(null);
        setSecondsRemaining(ds.golden_hour_seconds);
        renderCytoscapeGraph(ds.elements);
    };

    const handleSelectChain = (chainKey) => {
        setSelectedChainKey(chainKey);
        const ds = CHAIN_DATASETS[chainKey];
        setActiveDataset(ds);
        setSuspectInput(ds.suspect_wallet);
        setSelectedNode(null);
        setSecondsRemaining(ds.golden_hour_seconds); // Reset to chain-specific Golden Hour!
        renderCytoscapeGraph(ds.elements);
    };

    // Live Trace Function
    const handleTraceWallet = async (walletAddress) => {
        setTracingLive(true);
        setSelectedNode(null);

        let displayVictim = `Subject (${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)})`;
        if (walletAddress.toLowerCase() === '0xd8da6bf26964af9d7eed9e03e53415d37aa96045') {
            displayVictim = 'Vitalik Buterin (vitalik.eth)';
        }

        const updatedCaseMeta = {
            docket_no: `LIVE-${walletAddress.slice(2, 8).toUpperCase()}`,
            victim_name: displayVictim,
            category: 'On-Demand Live Forensic Inquiry',
            reported_loss: 'Live On-Chain Balance'
        };

        try {
            const res = await fetch('http://localhost:8000/api/trace', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    suspect_address: walletAddress,
                    chain: selectedChainKey,
                    max_depth: 3,
                    min_value_eth: 0.01,
                    max_branches: 5
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.elements && data.elements.nodes.length > 0) {
                    const positionedNodes = data.elements.nodes.map((n, idx) => ({
                        ...n,
                        position: { x: (n.data.hop_level || idx) * 250 + 100, y: 260 + (idx % 2 === 0 ? -25 : 25) }
                    }));
                    const updatedElements = { nodes: positionedNodes, edges: data.elements.edges };
                    setActiveDataset({
                        ...activeDataset,
                        caseMeta: updatedCaseMeta,
                        suspect_wallet: walletAddress,
                        elements: updatedElements,
                        attributions: data.attributions.length > 0 ? data.attributions : activeDataset.attributions,
                        risk_assessment: data.risk_assessment || activeDataset.risk_assessment,
                        custody_trail: data.custody_trail.length > 0 ? data.custody_trail : activeDataset.custody_trail
                    });
                    renderCytoscapeGraph(updatedElements);
                    setTracingLive(false);
                    return;
                }
            }
        } catch (e) {
            console.warn('Backend live trace offline; updating dataset locally.');
        }

        // Local fallback update
        setActiveDataset({
            ...activeDataset,
            caseMeta: updatedCaseMeta,
            suspect_wallet: walletAddress
        });
        renderCytoscapeGraph(activeDataset.elements);
        setTracingLive(false);
    };

    const renderCytoscapeGraph = (elements) => {
        if (!containerRef.current) return;
        if (cyRef.current) cyRef.current.destroy();

        cyRef.current = cytoscape({
            container: containerRef.current,
            elements: [...elements.nodes, ...elements.edges],
            maxZoom: 1.2,
            minZoom: 0.3,
            style: [
                {
                    selector: 'node',
                    style: {
                        'label': 'data(label)',
                        'color': '#f8fafc',
                        'font-size': '11px',
                        'font-family': 'system-ui, -apple-system, sans-serif',
                        'font-weight': '600',
                        'text-valign': 'bottom',
                        'text-margin-y': 7,
                        'text-background-opacity': 0.88,
                        'text-background-color': '#070b14',
                        'text-background-padding': '4px',
                        'text-background-shape': 'roundrectangle',
                        'border-width': 2,
                        'border-color': '#ffffff',
                        'background-color': (ele) => {
                            const type = ele.data('entity_type');
                            if (type === 'SUSPECT') return '#ef4444';
                            if (type === 'CEX') return '#10b981';
                            if (type === 'MIXER') return '#a855f7';
                            if (type === 'BRIDGE') return '#06b6d4';
                            return '#38bdf8';
                        },
                        'width': 52,
                        'height': 52
                    }
                },
                {
                    selector: 'node[entity_type = "SUSPECT"]',
                    style: {
                        'border-color': '#fca5a5',
                        'border-width': 4,
                        'width': 60,
                        'height': 60,
                        'shadow-blur': 25,
                        'shadow-color': '#ef4444',
                        'shadow-opacity': 0.8
                    }
                },
                {
                    selector: 'node[entity_type = "CEX"]',
                    style: {
                        'border-color': '#6ee7b7',
                        'border-width': 4,
                        'width': 60,
                        'height': 60,
                        'shadow-blur': 25,
                        'shadow-color': '#10b981',
                        'shadow-opacity': 0.8
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 3.5,
                        'line-color': '#38bdf8',
                        'target-arrow-color': '#38bdf8',
                        'target-arrow-shape': 'triangle',
                        'arrow-scale': 1.4,
                        'curve-style': 'bezier',
                        'line-style': 'dashed',
                        'label': (ele) => `${ele.data('value_eth')} ${ele.data('token') || 'ETH'}`,
                        'font-size': '9px',
                        'color': '#cbd5e1',
                        'text-background-color': '#070b14',
                        'text-background-opacity': 0.95,
                        'text-background-padding': '3px',
                        'text-rotation': 'autorotate'
                    }
                }
            ],
            layout: {
                name: 'preset',
                fit: true,
                padding: 60
            }
        });

        cyRef.current.on('tap', 'node', (evt) => {
            setSelectedNode(evt.target.data());
            setActiveTab('inspector');
        });

        setTimeout(() => {
            if (cyRef.current) {
                cyRef.current.resize();
                cyRef.current.fit(undefined, 60);
            }
        }, 50);
    };

    const handleExportPDF = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/report/pdf?address=${suspectInput}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `LEA_Forensic_Dossier_${activeDataset.caseMeta.docket_no}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                return;
            }
        } catch (e) {
            console.warn('Backend PDF offline; showing dossier view.');
        }
        setActiveLayer('dossier');
    };

    const handleCopyNotice = () => {
        const targetCex = activeDataset.attributions[0] || { entity_name: 'Target VASP' };
        const text = `STATUTORY DIRECTIVE UNDER SECTION 91 Cr.P.C. / BNSS 2023

TO: Legal & Compliance Department, ${targetCex.entity_name}
FROM: Investigating Officer, Cyber Crime Police Station (I4C Portal)
REF DOCKET: ${activeDataset.caseMeta.docket_no}

SUBJECT: Emergency Account Debit Freeze - Proceeds of Crime

Sir/Madam,
This agency is investigating an active cyber theft complaint filed on NCRP. Cryptographic assets originating from suspect wallet (${suspectInput}) have been identified siphoning into your liquidity depository across multiple layering hops.

You are directed to:
1. Immediately FREEZE all internal debit and withdrawal facilities for the beneficiary account.
2. Furnish full customer KYC documentation (Aadhaar, PAN, Passport, Phone, IP logs) within 24 hours.

Investigating Officer,
Cyber Crime Division`;
        navigator.clipboard.writeText(text);
        setCopiedNotice(true);
        setTimeout(() => setCopiedNotice(false), 2500);
    };

    const handleLaunchDispatch = () => {
        setShowDispatchModal(true);
        setDispatchComplete(false);
        setDispatchLogs([]);
        const steps = [
            '[14:25:01] Connecting to I4C / SAHYOG Gateway API Node...',
            '[14:25:02] Cryptographic Evidence Package Formed (SHA-256 Checksum Verified).',
            `[14:25:03] Transmitting Statutory Section 91 Requisition to ${activeDataset.attributions[0]?.entity_name} Compliance Node...`,
            `[14:25:04] Secure Handshake with ${activeDataset.attributions[0]?.compliance_contact} Established.`,
            '[14:25:05] 🟢 SUCCESS: Requisition Ticket #IND-I4C-2026-9821 Acknowledged by VASP.',
            '[14:25:05] 🔒 BENEFICIARY ACCOUNT STATUS: TEMPORARY DEBIT RESTRICTION APPLIED.'
        ];
        steps.forEach((log, index) => {
            setTimeout(() => {
                setDispatchLogs((prev) => [...prev, log]);
                if (index === steps.length - 1) {
                    setDispatchComplete(true);
                }
            }, (index + 1) * 700);
        });
    };

    const handleCitizenSubmit = (e) => {
        e.preventDefault();
        const docket = `NCRP-2026-DEL-${Math.floor(1000 + Math.random() * 9000)}`;
        setCitizenDocket(docket);
        setCitizenSubmitted(true);

        const newCase = {
            ...activeDataset,
            suspect_wallet: citizenWallet || activeDataset.suspect_wallet,
            caseMeta: {
                docket_no: docket,
                victim_name: citizenName || 'Citizen Complainant (1930)',
                category: citizenScamType,
                reported_loss: citizenLoss || '₹10,00,000 (4.00 ETH)'
            }
        };
        setActiveDataset(newCase);
        setSuspectInput(citizenWallet || activeDataset.suspect_wallet);
        setSecondsRemaining(7190);
    };

    const handleNextDemoStep = () => {
        const next = demoStep + 1;
        if (next < DEMO_STEPS.length) {
            setDemoStep(next);
            if (next === 3) setActiveTab('ml');
            if (next === 4) setActiveLayer('dossier');
        } else {
            setDemoActive(false);
            setDemoStep(0);
            setActiveLayer('forensics');
            setActiveTab('inspector');
            handleSelectChain('ethereum');
        }
    };

    useEffect(() => {
        renderCytoscapeGraph(CHAIN_DATASETS.ethereum.elements);
    }, []);

    const risk = activeDataset.risk_assessment;
    const primaryAttr = activeDataset.attributions[0];
    const mlData = activeDataset.ml_features;
    const currentStreamItem = LIVE_COMPLAINT_STREAM[streamIndex];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw', background: '#050811', color: '#f1f5f9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflowX: 'hidden' }}>

            {/* 1. TOP COMMAND BAR (Hidden on Landing Page) */}
            {currentPortal !== 'landing' && (
                <header style={{ height: '62px', background: '#0a0f1d', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 20 }}>

                    {/* Left: Branding & Role Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(135deg, #2563eb, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', color: '#fff', boxShadow: '0 0 15px rgba(37,99,235,0.5)' }}>
                                👁️
                            </div>
                            <div>
                                <div style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    CYCLOPS
                                    <span style={{ fontSize: '10px', background: '#1e293b', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', border: '1px solid #334155' }}>SIH26183</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>Ministry of Home Affairs | NCRP & SAHYOG Automated Intelligence Grid</div>
                            </div>
                        </div>

                        {/* DUAL PORTAL ROLE TOGGLE */}
                        <button
                            onClick={() => setCurrentPortal('landing')}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #334155', background: '#0a0f1d', color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            🏠 Home
                        </button>
                        <div style={{ display: 'flex', background: '#111827', borderRadius: '8px', border: '1px solid #1e293b', padding: '3px' }}>
                            <button
                                onClick={() => setCurrentPortal('police')}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: currentPortal === 'police' ? '#2563eb' : 'transparent', color: currentPortal === 'police' ? '#fff' : '#94a3b8', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                🛡️ Police Admin Grid
                            </button>
                            <button
                                onClick={() => setCurrentPortal('citizen')}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: currentPortal === 'citizen' ? '#10b981' : 'transparent', color: currentPortal === 'citizen' ? '#fff' : '#94a3b8', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                👤 Citizen 1930 Portal
                            </button>
                        </div>
                    </div>

                    {/* Center: Layer Switcher (Only visible when Police is Authenticated) */}
                    {currentPortal === 'police' && isPoliceAuth && (
                        <div style={{ display: 'flex', background: '#111827', borderRadius: '8px', border: '1px solid #1e293b', padding: '3px', gap: '4px' }}>
                            <button
                                onClick={() => setActiveLayer('forensics')}
                                style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: activeLayer === 'forensics' ? '#2563eb' : 'transparent', color: activeLayer === 'forensics' ? '#fff' : '#94a3b8', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                🕸️ Forensics Canvas
                            </button>
                            <button
                                onClick={() => setActiveLayer('dashboard')}
                                style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: activeLayer === 'dashboard' ? '#2563eb' : 'transparent', color: activeLayer === 'dashboard' ? '#fff' : '#94a3b8', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                📊 Intelligence Grid
                            </button>
                            <button
                                onClick={() => setActiveLayer('dossier')}
                                style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: activeLayer === 'dossier' ? '#2563eb' : 'transparent', color: activeLayer === 'dossier' ? '#fff' : '#94a3b8', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                📋 Court Dossier
                            </button>
                        </div>
                    )}

                    {/* Right Action Buttons - Streamlined & Minimal */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {currentPortal === 'police' && isPoliceAuth && (
                            <>
                                <button
                                    onClick={handleLaunchDispatch}
                                    style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #dc2626, #b91c1c)', border: 'none', color: '#fff', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    🚨 Freeze VASP
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', border: 'none', color: '#ffffff', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    📄 PDF Dossier
                                </button>
                                <button
                                    onClick={() => {
                                        setDemoActive(true);
                                        setDemoStep(0);
                                        setActiveLayer('forensics');
                                        handleSelectChain('ethereum');
                                    }}
                                    style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#fff', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    ▶️ Demo Tour
                                </button>
                                <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', background: '#0a0f1d', padding: '4px 8px', borderRadius: '6px', border: '1px solid #1e293b' }}>
                                    <span>🟢</span> <span>IO-9921</span>
                                    <button onClick={handlePoliceLogout} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '10px', marginLeft: '4px' }}>[Exit]</button>
                                </div>
                            </>
                        )}

                        {currentPortal === 'citizen' && (
                            <button
                                onClick={() => setCurrentPortal('police')}
                                style={{ padding: '8px 16px', background: '#2563eb', border: 'none', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Access Police Admin Grid →
                            </button>
                        )}
                    </div>
                </header>
            )}

            {/* 2. REAL-TIME LIVE 1930 HELPLINE COMPLAINT STREAM TICKER */}
            {/* ========================================================================= */}
            {/* 1. MASTERPIECE LANDING SCREEN: TWO BIG INTERACTIVE CARDS + CYBER PARTICLES */}
            {/* ========================================================================= */}
            {currentPortal === 'landing' && (
                <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto', minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 20%, #0d1b3e 0%, #040711 75%)' }}>

                    {/* Animated Background Canvas */}
                    <CyberBackground />

                    {/* Hero Header */}
                    <div style={{ textAlign: 'center', marginBottom: '20px', maxWidth: '880px', zIndex: 10, animation: 'fadeIn 0.6s ease-out' }}>

                        {/* Cybernetic Eye Emblem Design */}
                        <CyclopsEyeEmblem />

                        {/* National Inscription */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(30, 58, 138, 0.25)', border: '1px solid #1e40af', padding: '5px 14px', borderRadius: '30px', marginBottom: '12px', backdropFilter: 'blur(8px)' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#93c5fd', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                सत्यमेव जयते • Government of India • Ministry of Home Affairs • I4C Grid
                            </span>
                        </div>

                        {/* Futuristic CYCLOPS Title with Eye Theme */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '12px' }}>
                            <h1 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: '900', letterSpacing: '4px', margin: 0, background: 'linear-gradient(135deg, #ffffff 0%, #38bdf8 45%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 0 30px rgba(56, 189, 248, 0.4)' }}>
                                CYCLOPS
                            </h1>
                            <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '3px', color: '#38bdf8', textTransform: 'uppercase', marginTop: '4px' }}>
                                Autonomous Blockchain Forensics & VASP Attribution Grid
                            </div>
                        </div>

                        <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px 0', maxWidth: '780px' }}>
                            Automated blockchain intelligence platform connecting victim-reported scam wallets, multi-hop forensic traversal, and statutory VASP asset freezing within the critical <strong>Golden Hour</strong> window.
                        </p>

                        {/* Live Operational Badges */}
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #059669', color: '#34d399', padding: '4px 12px', borderRadius: '20px', fontWeight: '600' }}>
                                🟢 NCRP & 1930 Gateway Active
                            </span>
                            <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid #0284c7', color: '#38bdf8', padding: '4px 12px', borderRadius: '20px', fontWeight: '600' }}>
                                ⚡ FIU-IND Compliant VASPs Indexed
                            </span>
                            <span style={{ fontSize: '11px', background: 'rgba(168, 85, 247, 0.12)', border: '1px solid #9333ea', color: '#c084fc', padding: '4px 12px', borderRadius: '20px', fontWeight: '600' }}>
                                ⚖️ Section 91 Cr.P.C. / BNSS Automated
                            </span>
                        </div>
                    </div>

                    {/* TWO BIG INTERACTIVE PORTAL BOXES */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', width: 'min(920px, 94vw)', zIndex: 10 }}>

                        {/* BOX 1: CITIZEN 1930 PORTAL */}
                        <div
                            onClick={() => setCurrentPortal('citizen')}
                            style={{
                                background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(10, 15, 29, 0.9) 100%)',
                                border: '2px solid #10b981',
                                borderRadius: '16px',
                                padding: '22px 20px',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                backdropFilter: 'blur(16px)',
                                boxShadow: '0 20px 40px rgba(16, 185, 129, 0.15)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-6px)';
                                e.currentTarget.style.boxShadow = '0 25px 60px rgba(16, 185, 129, 0.35)';
                                e.currentTarget.style.borderColor = '#34d399';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 20px 40px rgba(16, 185, 129, 0.15)';
                                e.currentTarget.style.borderColor = '#10b981';
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                                        👤
                                    </div>
                                    <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                                        PUBLIC ACCESS
                                    </span>
                                </div>

                                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', marginBottom: '6px' }}>
                                    Citizen 1930 Helpline Portal
                                </h2>
                                <div style={{ fontSize: '12px', color: '#34d399', fontWeight: '600', marginBottom: '14px' }}>
                                    Victim Fraud Lodging & Real-Time Recovery Tracker
                                </div>

                                <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '20px' }}>
                                    Direct portal for citizens defrauded via Telegram task jobs, fake investment apps, or sextortion. Lodge your complaint, trigger instant wallet tracking, and watch live investigating officer actions.
                                </p>

                                {/* Features list */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                    <div style={{ fontSize: '12px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Instant Incident Lodging & Docket Number Generation
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Live 5-Stage Investigation Lifecycle with Timestamps
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Assigned Investigating Officer Telemetry (IO Badge)
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Golden Hour Protection Against Cash Off-Ramping
                                    </div>
                                </div>
                            </div>

                            <button
                                style={{
                                    width: '100%',
                                    padding: '11px',
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    border: 'none',
                                    color: '#ffffff',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                                }}
                            >
                                Lodge Incident / Track Case →
                            </button>
                        </div>

                        {/* BOX 2: POLICE ADMIN GRID */}
                        <div
                            onClick={() => setCurrentPortal('police')}
                            style={{
                                background: 'linear-gradient(180deg, rgba(37, 99, 235, 0.08) 0%, rgba(10, 15, 29, 0.9) 100%)',
                                border: '2px solid #2563eb',
                                borderRadius: '16px',
                                padding: '22px 20px',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                backdropFilter: 'blur(16px)',
                                boxShadow: '0 20px 40px rgba(37, 99, 235, 0.2)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-6px)';
                                e.currentTarget.style.boxShadow = '0 25px 60px rgba(37, 99, 235, 0.45)';
                                e.currentTarget.style.borderColor = '#38bdf8';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 20px 40px rgba(37, 99, 235, 0.2)';
                                e.currentTarget.style.borderColor = '#2563eb';
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(37, 99, 235, 0.2)', border: '1px solid #2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                                        🛡️
                                    </div>
                                    <span style={{ fontSize: '10px', background: 'rgba(37, 99, 235, 0.2)', color: '#38bdf8', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                                        RESTRICTED • LEO ONLY
                                    </span>
                                </div>

                                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', marginBottom: '6px' }}>
                                    Law Enforcement & Police Admin Grid
                                </h2>
                                <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '600', marginBottom: '14px' }}>
                                    I4C & State Cyber Cell Forensic Command Operations
                                </div>

                                <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '20px' }}>
                                    Gated operational center for authorized cybercrime officers. High-speed multi-hop graph analytics, AI topological feature extraction, SAHYOG VASP emergency freeze dispatcher, and statutory court dossiers.
                                </p>

                                {/* Features list */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                    <div style={{ fontSize: '12px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>✓</span> Multi-Chain Graph Traversal (Ethereum, Tron TRC-20, Bitcoin)
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>✓</span> Automated VASP Attribution (Binance, CoinDCX, WazirX)
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>✓</span> AI/ML Topological Heuristics & Anomaly Detection Engine
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>✓</span> SAHYOG Freeze Notice & Tamper-Proof PDF Court Dossier
                                    </div>
                                </div>
                            </div>

                            <button
                                style={{
                                    width: '100%',
                                    padding: '11px',
                                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                    border: 'none',
                                    color: '#ffffff',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
                                }}
                            >
                                🔐 Officer Login & Access Grid →
                            </button>
                        </div>

                    </div>

                    {/* Bottom Telemetry Bar */}
                    <div style={{ marginTop: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', color: '#64748b', fontSize: '12px', zIndex: 10 }}>
                        <span><strong>142</strong> Active Dockets Monitored</span>
                        <span>•</span>
                        <span><strong>₹48.87M</strong> In Stolen Assets Traced</span>
                        <span>•</span>
                        <span><strong>1.2s</strong> Avg VASP Attribution Speed</span>
                        <span>•</span>
                        <span><strong>87.4%</strong> Golden Hour Freeze Success</span>
                    </div>

                </div>
            )}


            {currentPortal === 'police' && isPoliceAuth && showStreamAlert && (
                <div style={{ background: 'rgba(30, 58, 138, 0.25)', borderBottom: '1px solid #1e3a8a', padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', zIndex: 15 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 8px #ef4444' }} />
                        <span style={{ color: '#94a3b8' }}>LIVE 1930 DISPATCH INCOMING:</span>
                        <strong style={{ color: '#38bdf8' }}>{currentStreamItem.victim}</strong>
                        <span style={{ color: '#cbd5e1' }}>reported loss of {currentStreamItem.amount} ({currentStreamItem.type})</span>
                        <code style={{ color: '#93c5fd', fontSize: '11px', background: '#090d16', padding: '2px 6px', borderRadius: '4px' }}>{currentStreamItem.wallet.slice(0, 14)}...</code>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            onClick={() => handleAutoTrace(currentStreamItem)}
                            style={{ padding: '4px 10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            ⚡ Click to Auto-Trace
                        </button>
                        <button onClick={() => setShowStreamAlert(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                    </div>
                </div>
            )}

            {/* 3. CITIZEN 1930 REPORTING PORTAL */}
            {currentPortal === 'citizen' && (
                <div style={{ flex: 1, padding: '40px', overflowY: 'auto', background: '#050811', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '700px', background: '#0a0f1d', border: '1px solid #1e293b', borderRadius: '10px', padding: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontSize: '24px' }}>
                                🛡️
                            </div>
                            <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#f8fafc' }}>National Cybercrime Citizen Helpline (1930)</h2>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>Direct Incident Filing & Automated Emergency Asset Freeze Protocol</p>
                        </div>

                        {!citizenSubmitted ? (
                            <form onSubmit={handleCitizenSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>Your Full Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Vikramaditya Sen"
                                            value={citizenName}
                                            onChange={(e) => setCitizenName(e.target.value)}
                                            style={{ width: '100%', padding: '10px', background: '#111827', border: '1px solid #374151', color: '#fff', borderRadius: '6px', fontSize: '13px' }}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>Registered Mobile Number</label>
                                        <input
                                            type="tel"
                                            placeholder="+91 98765-XXXXX"
                                            value={citizenPhone}
                                            onChange={(e) => setCitizenPhone(e.target.value)}
                                            style={{ width: '100%', padding: '10px', background: '#111827', border: '1px solid #374151', color: '#fff', borderRadius: '6px', fontSize: '13px' }}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>Scam Category</label>
                                    <select
                                        value={citizenScamType}
                                        onChange={(e) => setCitizenScamType(e.target.value)}
                                        style={{ width: '100%', padding: '10px', background: '#111827', border: '1px solid #374151', color: '#fff', borderRadius: '6px', fontSize: '13px' }}
                                    >
                                        <option value="Task-Based Telegram Part-Time Scam">Task-Based Telegram Part-Time Scam</option>
                                        <option value="Fake Forex / Crypto Investment Scam">Fake Forex / Crypto Investment Scam</option>
                                        <option value="Hospital / Enterprise Ransomware">Hospital / Enterprise Ransomware</option>
                                        <option value="Sextortion / Video Call Blackmail">Sextortion / Video Call Blackmail</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>Suspect Wallet Address (Where you sent crypto)</label>
                                    <input
                                        type="text"
                                        placeholder="0x... or Tron/BTC address"
                                        value={citizenWallet}
                                        onChange={(e) => setCitizenWallet(e.target.value)}
                                        style={{ width: '100%', padding: '10px', background: '#111827', border: '1px solid #374151', color: '#fff', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace' }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>Amount Defrauded (INR & Crypto)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. ₹6,50,000 (2.50 ETH)"
                                        value={citizenLoss}
                                        onChange={(e) => setCitizenLoss(e.target.value)}
                                        style={{ width: '100%', padding: '10px', background: '#111827', border: '1px solid #374151', color: '#fff', borderRadius: '6px', fontSize: '13px' }}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCitizenName('Pooja Bhatia');
                                            setCitizenPhone('+91 98112-99821');
                                            setCitizenScamType('Task-Based Telegram Part-Time Scam');
                                            setCitizenWallet('0x9999a3b2e5f8841a0e889b41a91e1d092cb3e4a1');
                                            setCitizenLoss('₹12,12,500 (4.85 ETH)');
                                        }}
                                        style={{ flex: 1, padding: '8px', background: '#1e293b', color: '#38bdf8', border: '1px solid #334155', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                                    >
                                        ⚡ Demo Fill: Telegram Task Fraud
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCitizenName('Suresh Menon');
                                            setCitizenPhone('+91 94451-22301');
                                            setCitizenScamType('Fake Forex / High-Yield Crypto Investment');
                                            setCitizenWallet('TScam9999a3b2e5f8841a0e889b41a91e1d092');
                                            setCitizenLoss('₹20,50,000 (25,000 USDT)');
                                        }}
                                        style={{ flex: 1, padding: '8px', background: '#1e293b', color: '#10b981', border: '1px solid #334155', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                                    >
                                        ⚡ Demo Fill: Tron USDT Forex Scam
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    style={{ marginTop: '10px', padding: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    🚀 Submit Complaint & Start Emergency Freeze
                                </button>
                            </form>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '14px', color: '#10b981', fontWeight: 'bold' }}>INCIDENT LODGED SUCCESSFULLY</div>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', margin: '6px 0' }}>{citizenDocket}</div>
                                    <div style={{ fontSize: '12px', color: '#cbd5e1' }}>Automated On-Chain Attribution Pipeline Initiated within Golden Hour Window.</div>
                                </div>

                                {/* Citizen Live Progress Bar & Officer Action Feedback */}
                                <div style={{ background: '#111827', borderRadius: '10px', padding: '20px', border: '1px solid #1f2937' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>ASSIGNED INVESTIGATING OFFICER</div>
                                            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#38bdf8', marginTop: '2px' }}>Insp. R. Sharma (Badge: IO-I4C-9921)</div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Cyber Crime Police Station, Special Cell, New Delhi</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>ESTIMATED RESOLUTION DATE</div>
                                            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#10b981', marginTop: '2px' }}>Within 48-72 Hours (Est. Sep 08, 2026)</div>
                                            <div style={{ fontSize: '11px', color: '#f59e0b' }}>🟢 Golden Hour Freeze Requisition Active</div>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '12px' }}>INVESTIGATION LIFECYCLE & VERIFIED TIMESTAMPS</div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                            <span style={{ fontSize: '11px', background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>14:32:05 IST</span>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#10b981' }}>✓ Stage 1: Incident Registered on NCRP / 1930 Helpline</div>
                                                <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Complaint verified. Cryptographic evidence hash sealed on national docket.</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                            <span style={{ fontSize: '11px', background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>14:32:08 IST</span>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#10b981' }}>✓ Stage 2: Automated Multi-Hop Blockchain Tracing Completed</div>
                                                <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Algorithm identified 3 intermediary mule accounts layering funds via automated peel chain.</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                            <span style={{ fontSize: '11px', background: '#2563eb', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>14:32:11 IST</span>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8' }}>✓ Stage 3: Off-Ramp VASP Identified (Binance Hot Wallet 14)</div>
                                                <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Ground-Truth Registry matched terminal depository (VASP Registry Match: 99.4%).</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                            <span style={{ fontSize: '11px', background: '#f59e0b', color: '#000', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>14:40:12 IST</span>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f59e0b' }}>⏳ Stage 4: Officer Action - Emergency Sec 91 Cr.P.C. Freeze Dispatched</div>
                                                <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Insp. R. Sharma served emergency freeze notice to VASP Compliance Desk via SAHYOG Gateway.</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                            <span style={{ fontSize: '11px', background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>14:45:00 IST</span>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#10b981' }}>🔒 Stage 5: VASP Compliance Acknowledged (Beneficiary Account Frozen)</div>
                                                <div style={{ fontSize: '11px', color: '#cbd5e1' }}>VASP confirmed receipt of Ticket #IND-I4C-9821. Beneficiary debit facility restricted within Golden Hour.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => {
                                            setCurrentPortal('police');
                                        }}
                                        style={{ flex: 1, padding: '12px', background: '#2563eb', border: 'none', color: '#fff', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                                    >
                                        Authenticate as Police Officer to View Forensics →
                                    </button>
                                    <button
                                        onClick={() => setCitizenSubmitted(false)}
                                        style={{ padding: '12px 18px', background: '#1e293b', border: '1px solid #374151', color: '#cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                                    >
                                        File Another Report
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 4. POLICE ADMIN LOGIN SCREEN (Gated Authentication) */}
            {currentPortal === 'police' && !isPoliceAuth && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #0a1329 0%, #030611 100%)' }}>
                    <div style={{ width: '460px', background: '#0a0f1d', border: '1px solid #1e293b', borderRadius: '12px', padding: '32px', boxShadow: '0 25px 60px rgba(0,0,0,0.9)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ width: '54px', height: '54px', borderRadius: '14px', background: 'rgba(37,99,235,0.15)', border: '1px solid #2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontSize: '26px' }}>
                                🛡️
                            </div>
                            <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#f8fafc' }}>I4C Cybercrime Forensic Grid</h2>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Ministry of Home Affairs | Law Enforcement Officer (LEO) Authentication</p>
                        </div>

                        {authError && (
                            <div style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '6px', color: '#fca5a5', fontSize: '12px', marginBottom: '14px' }}>
                                {authError}
                            </div>
                        )}

                        <form onSubmit={handlePoliceLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ fontSize: '12px', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>Officer Badge ID</label>
                                <input
                                    type="text"
                                    placeholder="e.g. IO-I4C-9921"
                                    value={officerId}
                                    onChange={(e) => setOfficerId(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', background: '#111827', border: '1px solid #374151', color: '#fff', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>Security Passcode</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={officerPass}
                                    onChange={(e) => setOfficerPass(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', background: '#111827', border: '1px solid #374151', color: '#fff', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                    required
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setOfficerId('IO-I4C-9921');
                                    setOfficerPass('cybercell');
                                }}
                                style={{ padding: '8px', background: '#1e293b', color: '#38bdf8', border: '1px solid #334155', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
                            >
                                ⚡ Auto-Fill Demo Credentials (Insp. R. Sharma)
                            </button>

                            <button
                                type="submit"
                                style={{ marginTop: '6px', padding: '12px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none', color: '#fff', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.4)' }}
                            >
                                🔐 Verify Credentials & Access Grid
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 5. AUTHENTICATED POLICE FORENSIC GRID */}
            {currentPortal === 'police' && isPoliceAuth && (
                <>
                    {/* GUIDED DEMO OVERLAY (FOR JUDGES) */}
                    {demoActive && (
                        <div style={{ background: 'linear-gradient(90deg, #1e3a8a, #0f172a)', borderBottom: '2px solid #38bdf8', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 30 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <span style={{ background: '#38bdf8', color: '#090d16', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                                    DEMO STEP {demoStep + 1} / 5
                                </span>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{DEMO_STEPS[demoStep].title}</div>
                                    <div style={{ fontSize: '12px', color: '#cbd5e1' }}>{DEMO_STEPS[demoStep].desc}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={handleNextDemoStep}
                                    style={{ padding: '8px 16px', background: '#38bdf8', color: '#090d16', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                                >
                                    {demoStep === 4 ? 'Finish Demo' : 'Next Step →'}
                                </button>
                                <button
                                    onClick={() => setDemoActive(false)}
                                    style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                                >
                                    Exit
                                </button>
                            </div>
                        </div>
                    )}

                    {/* VASP FREEZE DISPATCH TERMINAL MODAL */}
                    {showDispatchModal && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
                            <div style={{ width: '600px', background: '#070b14', border: '1px solid #dc2626', borderRadius: '8px', padding: '24px', boxShadow: '0 20px 60px rgba(220,38,38,0.4)', fontFamily: 'monospace' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#ef4444' }}>🚨 SAHYOG GATEWAY | STATUTORY VASP FREEZE TRANSMISSION</span>
                                    <button onClick={() => setShowDispatchModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer' }}>✕</button>
                                </div>

                                <div style={{ background: '#030712', border: '1px solid #1f2937', padding: '11px', borderRadius: '6px', height: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                                    {dispatchLogs.map((log, i) => (
                                        <div key={i} style={{ color: log.includes('SUCCESS') || log.includes('FROZEN') ? '#10b981' : '#cbd5e1' }}>
                                            {log}
                                        </div>
                                    ))}
                                </div>

                                {dispatchComplete && (
                                    <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: '6px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#10b981' }}>LEGAL NOTICE DELIVERED & ACKNOWLEDGED</div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                            Freeze order active on beneficiary depository under Section 91 Cr.P.C. / BNSS. Golden Hour preserved.
                                        </div>
                                    </div>
                                )}

                                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => setShowDispatchModal(false)}
                                        style={{ padding: '8px 18px', background: '#1e293b', color: '#fff', border: '1px solid #374151', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                    >
                                        Close Gateway Terminal
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LAYER 1: FORENSICS CANVAS VIEW */}
                    {activeLayer === 'forensics' && (
                        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                            {/* LEFT SIDEBAR: Threat Intelligence */}
                            <div style={{ width: '330px', background: '#0a0f1d', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', padding: '16px', gap: '14px', overflowY: 'auto' }}>

                                {/* Golden Hour Countdown Clock */}
                                <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(185,28,28,0.05))', border: '1px solid #ef4444', borderRadius: '8px', padding: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fca5a5', textTransform: 'uppercase' }}>🚨 Golden Hour Response Clock</span>
                                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ef4444' }}>{formatGoldenHour(secondsRemaining)}</span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                                        Critical window to mandate VASP debit freeze before liquidation.
                                    </div>
                                </div>

                                {/* Case File Docket */}
                                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '14px' }}>
                                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold', marginBottom: '6px' }}>
                                        Active Docket: {activeDataset.caseMeta.docket_no}
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '2px' }}>
                                        {activeDataset.caseMeta.victim_name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600', marginBottom: '6px' }}>
                                        Reported Loss: {activeDataset.caseMeta.reported_loss}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                        <strong>Category:</strong> {activeDataset.caseMeta.category}
                                    </div>
                                </div>

                                {/* Radial Threat Gauge */}
                                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ position: 'relative', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="70" height="70" style={{ transform: 'rotate(-90deg)' }}>
                                            <circle cx="35" cy="35" r="30" stroke="#1f2937" strokeWidth="6" fill="transparent" />
                                            <circle
                                                cx="35"
                                                cy="35"
                                                r="30"
                                                stroke={risk.overall_risk_score > 75 ? '#ef4444' : (risk.overall_risk_score > 50 ? '#f59e0b' : '#10b981')}
                                                strokeWidth="6"
                                                fill="transparent"
                                                strokeDasharray={188.5}
                                                strokeDashoffset={188.5 - (188.5 * risk.overall_risk_score) / 100}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div style={{ position: 'absolute', fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
                                            {risk.overall_risk_score}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>THREAT LEVEL</div>
                                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: risk.risk_rating === 'CRITICAL' || risk.risk_rating === 'HIGH' ? '#ef4444' : '#10b981' }}>
                                            {risk.risk_rating}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>AI Topological Risk Score</div>
                                    </div>
                                </div>

                                {/* Identified VASP Card */}
                                <div style={{ background: primaryAttr?.category === 'CEX' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', border: primaryAttr?.category === 'CEX' ? '1px solid #059669' : '1px solid #dc2626', borderRadius: '8px', padding: '14px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: primaryAttr?.category === 'CEX' ? '#34d399' : '#f87171', textTransform: 'uppercase', marginBottom: '4px' }}>
                                        🎯 Actionable VASP Identified
                                    </div>
                                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '4px' }}>
                                        {primaryAttr?.entity_name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                                        Distance: {primaryAttr?.hop_distance} hops | Confidence: {primaryAttr?.confidence_score}%
                                    </div>
                                    <div style={{ fontSize: '11px', background: '#070b14', padding: '6px 8px', borderRadius: '4px', border: '1px solid #1e293b', color: '#93c5fd' }}>
                                        <strong>VASP Desk:</strong> {primaryAttr?.compliance_contact}
                                    </div>
                                </div>

                                {/* Typologies */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold', marginBottom: '8px' }}>
                                        Detected Typologies
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {risk.detected_patterns?.map((p, idx) => (
                                            <div key={idx} style={{ fontSize: '12px', background: '#111827', border: '1px solid #1f2937', padding: '8px', borderRadius: '6px', color: '#cbd5e1' }}>
                                                ⚡ {p}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* CENTER CANVAS & LIVE SEARCH BAR */}
                            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '500px' }}>

                                {/* Top Interactive Bar */}
                                <div style={{ position: 'absolute', top: '16px', left: '20px', zIndex: 10, display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>

                                    {/* Multi-Chain Selector Buttons */}
                                    <div style={{ display: 'flex', background: '#0a0f1d', borderRadius: '8px', border: '1px solid #1e293b', padding: '4px', gap: '4px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                                        {[
                                            { key: 'ethereum', label: 'Ξ Ethereum' },
                                            { key: 'tron', label: '₮ Tron (TRC-20)' },
                                            { key: 'bitcoin', label: '₿ Bitcoin (Esplora)' },
                                            { key: 'multichain', label: '🌉 Multi-Chain (Bridge)' }
                                        ].map((c) => (
                                            <button
                                                key={c.key}
                                                onClick={() => handleSelectChain(c.key)}
                                                style={{
                                                    padding: '8px 14px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: selectedChainKey === c.key ? '#2563eb' : 'transparent',
                                                    color: selectedChainKey === c.key ? '#fff' : '#94a3b8',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {c.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Editable Search Bar Input */}
                                    <div style={{ display: 'flex', alignItems: 'center', background: '#0a0f1d', border: '1px solid #1e293b', borderRadius: '8px', padding: '4px', gap: '6px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                                        <input
                                            type="text"
                                            value={suspectInput}
                                            onChange={(e) => setSuspectInput(e.target.value)}
                                            placeholder="Enter wallet address (0x..., T..., or BTC)"
                                            style={{
                                                width: '380px',
                                                background: '#111827',
                                                border: '1px solid #374151',
                                                color: '#38bdf8',
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontFamily: 'monospace',
                                                outline: 'none'
                                            }}
                                        />
                                        <button
                                            onClick={() => handleTraceWallet(suspectInput)}
                                            disabled={tracingLive}
                                            style={{
                                                padding: '8px 16px',
                                                background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {tracingLive ? 'Tracing...' : '🔍 Trace'}
                                        </button>
                                    </div>
                                </div>

                                {/* Cytoscape Canvas */}
                                <div ref={containerRef} style={{ flex: 1, width: '100%', height: 'calc(100vh - 120px)', minHeight: '520px' }} />

                                {/* Live Cyber Ticker */}
                                <div style={{ position: 'absolute', bottom: '16px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0f1d', padding: '8px 16px', borderRadius: '6px', border: '1px solid #1e293b', fontSize: '11px', color: '#94a3b8' }}>
                                    <div style={{ display: 'flex', gap: '14px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} /> Suspect Origin</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8' }} /> Mule Layering</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} /> Exchange / VASP</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4' }} /> Cross-Chain Bridge</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7' }} /> Mixer Contract</span>
                                    </div>
                                    <div style={{ color: '#38bdf8', fontWeight: '600' }}>
                                        ⚡ ANIMATED FUND FLOW VELOCITY ACTIVE | LIVE CURRENT ENGINE
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT SIDEBAR */}
                            <div style={{ width: '360px', background: '#0a0f1d', borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', background: '#070b14' }}>
                                    <button
                                        onClick={() => setActiveTab('inspector')}
                                        style={{ flex: 1, padding: '12px 0', background: activeTab === 'inspector' ? '#0a0f1d' : 'transparent', border: 'none', borderBottom: activeTab === 'inspector' ? '2px solid #38bdf8' : 'none', color: activeTab === 'inspector' ? '#38bdf8' : '#64748b', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        Inspector
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('custody')}
                                        style={{ flex: 1, padding: '12px 0', background: activeTab === 'custody' ? '#0a0f1d' : 'transparent', border: 'none', borderBottom: activeTab === 'custody' ? '2px solid #38bdf8' : 'none', color: activeTab === 'custody' ? '#38bdf8' : '#64748b', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        Custody Trail
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('ml')}
                                        style={{ flex: 1, padding: '12px 0', background: activeTab === 'ml' ? '#0a0f1d' : 'transparent', border: 'none', borderBottom: activeTab === 'ml' ? '2px solid #38bdf8' : 'none', color: activeTab === 'ml' ? '#38bdf8' : '#64748b', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        Forensic ML Heuristics
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('legal')}
                                        style={{ flex: 1, padding: '12px 0', background: activeTab === 'legal' ? '#0a0f1d' : 'transparent', border: 'none', borderBottom: activeTab === 'legal' ? '2px solid #38bdf8' : 'none', color: activeTab === 'legal' ? '#38bdf8' : '#64748b', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        Sec 91
                                    </button>
                                </div>

                                {/* Tab 1: Inspector */}
                                {activeTab === 'inspector' && (
                                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Selected Wallet Entity</div>
                                        {selectedNode ? (
                                            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '11px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#64748b' }}>Entity Name</div>
                                                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#f8fafc' }}>{selectedNode.entity_name}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#64748b' }}>Classification</div>
                                                    <div style={{ fontSize: '13px', fontWeight: '600', color: selectedNode.entity_type === 'CEX' ? '#10b981' : (selectedNode.entity_type === 'SUSPECT' ? '#ef4444' : '#38bdf8') }}>
                                                        {selectedNode.entity_type} ({selectedNode.tag})
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#64748b' }}>Hop Level</div>
                                                    <div style={{ fontSize: '13px', color: '#cbd5e1' }}>Hop {selectedNode.hop_level} from origin</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#64748b' }}>Wallet Address</div>
                                                    <div style={{ fontSize: '11px', wordBreak: 'break-all', color: '#93c5fd', background: '#070b14', padding: '6px', borderRadius: '4px', border: '1px solid #1e293b' }}>
                                                        {selectedNode.full_address}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', color: '#64748b', marginTop: '40px', fontSize: '13px' }}>
                                                Click any node on the graph to inspect wallet entity and risk level.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Tab 2: Custody Trail */}
                                {activeTab === 'custody' && (
                                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Transaction Hops (Audit Trail)</div>
                                        {activeDataset.custody_trail.map((h, i) => (
                                            <div key={i} style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '6px', padding: '12px', fontSize: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>Hop #{h.hop}</span>
                                                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>{h.value_eth} {h.token} (₹{h.value_inr.toLocaleString('en-IN')})</span>
                                                </div>
                                                <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>
                                                    Target: <strong style={{ color: '#e2e8f0' }}>{h.to_name}</strong>
                                                </div>
                                                <div style={{ color: '#64748b', fontSize: '10px', wordBreak: 'break-all' }}>
                                                    Tx: {h.tx_hash.slice(0, 24)}...
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Tab 3: Dedicated AI / Machine Learning Analytics */}
                                {activeTab === 'ml' && (
                                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Forensic Machine Learning Topology Analyzer</div>

                                        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '12px' }}>
                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Model Architecture</div>
                                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', marginTop: '2px' }}>{mlData.model_name}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px' }}>
                                                <span>Predicted Entity:</span>
                                                <strong style={{ color: '#10b981' }}>{mlData.predicted_type}</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px' }}>
                                                <span>Inference Confidence:</span>
                                                <strong style={{ color: '#38bdf8' }}>{mlData.confidence}%</strong>
                                            </div>
                                        </div>

                                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Topological Feature Vector</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {mlData.features.map((f, i) => (
                                                <div key={i} style={{ background: '#0d1322', border: '1px solid #1e293b', padding: '8px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                                                    <div>
                                                        <div style={{ color: '#cbd5e1', fontWeight: '600' }}>{f.name}</div>
                                                        <div style={{ color: '#64748b', fontSize: '10px' }}>Baseline: {f.normal}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ color: '#f8fafc', fontWeight: 'bold' }}>{f.value}</div>
                                                        <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: f.status === 'ANOMALY' || f.status === 'CRITICAL' ? 'rgba(239,68,68,0.2)' : 'rgba(56,189,248,0.2)', color: f.status === 'ANOMALY' || f.status === 'CRITICAL' ? '#ef4444' : '#38bdf8' }}>
                                                            {f.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tab 4: Legal Notice Draft */}
                                {activeTab === 'legal' && (
                                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Section 91 CrPC Statutory Notice</div>
                                        <textarea
                                            readOnly
                                            value={`STATUTORY DIRECTIVE UNDER SECTION 91 Cr.P.C. / BNSS 2023

TO: Legal & Compliance Department, ${primaryAttr?.entity_name}
FROM: Investigating Officer, Cyber Crime Police Station (I4C Portal)
REF DOCKET: ${activeDataset.caseMeta.docket_no}

SUBJECT: Immediate Freeze of Account Debit Facilities & Ledger Disclosure

Sir/Madam,
This agency is investigating an active cyber fraud complaint reported under NCRP. Cryptographic assets originating from suspect wallet (${suspectInput}) have been identified siphoning into your liquidity pool.

You are hereby directed to:
1. Immediately FREEZE all internal debit and withdrawal facilities for the beneficiary account.
2. Preserve all transaction ledgers and furnish full customer KYC documentation within 24 hours.

Investigating Officer,
Cyber Crime Division`}
                                            style={{ width: '100%', height: '300px', background: '#070b14', border: '1px solid #1e293b', color: '#cbd5e1', padding: '10px', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', resize: 'none' }}
                                        />
                                        <button
                                            onClick={handleCopyNotice}
                                            style={{ padding: '8px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                                        >
                                            {copiedNotice ? 'Copied to Clipboard!' : 'Copy Notice Text'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* LAYER 2: NATIONAL INTELLIGENCE GRID */}
                    {activeLayer === 'dashboard' && (
                        <div style={{ flex: 1, padding: '30px', overflowY: 'auto', background: '#050811' }}>
                            <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#38bdf8' }}>National Cyber-Forensics Threat Intelligence Grid</h2>
                            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '13px' }}>Aggregated telemetry across state cyber cells, NCRP intake, and VASP freeze compliances.</p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                                <div style={{ background: '#0a0f1d', border: '1px solid #1e293b', padding: '20px', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>TOTAL ASSETS TRACED (FY 2026)</div>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginTop: '6px' }}>₹48,87,500</div>
                                    <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px' }}>Across 142 Cybercrime Dockets</div>
                                </div>
                                <div style={{ background: '#0a0f1d', border: '1px solid #1e293b', padding: '20px', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>FIU-IND COMPLIANT VASPS</div>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#38bdf8', marginTop: '6px' }}>28 Registered</div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>CoinDCX, WazirX, Binance, CoinSwitch</div>
                                </div>
                                <div style={{ background: '#0a0f1d', border: '1px solid #1e293b', padding: '20px', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>AVG VASP ATTRIBUTION TIME</div>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', marginTop: '6px' }}>1.2 Seconds</div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Down from 72 Hours manual search</div>
                                </div>
                                <div style={{ background: '#0a0f1d', border: '1px solid #1e293b', padding: '20px', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>ASSET FREEZE SUCCESS RATE</div>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginTop: '6px' }}>87.4%</div>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>During Golden Hour Window (&lt; 2 hrs)</div>
                                </div>
                            </div>

                            <div style={{ background: '#0a0f1d', border: '1px solid #1e293b', padding: '20px', borderRadius: '8px' }}>
                                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#f8fafc' }}>Active Fraud Typologies (NCRP Ingestion Stream)</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    <div style={{ background: '#111827', padding: '16px', borderRadius: '6px', border: '1px solid #1f2937' }}>
                                        <div style={{ fontWeight: 'bold', color: '#ef4444', marginBottom: '6px' }}>Telegram Part-Time Job Scams</div>
                                        <div style={{ fontSize: '12px', color: '#cbd5e1' }}>Victims coerced into sending small sums that escalate, layered via 2-3 burner mules before Binance/CoinDCX deposit.</div>
                                    </div>
                                    <div style={{ background: '#111827', padding: '16px', borderRadius: '6px', border: '1px solid #1f2937' }}>
                                        <div style={{ fontWeight: 'bold', color: '#f59e0b', marginBottom: '6px' }}>Tron TRC-20 Forex Fraud</div>
                                        <div style={{ fontSize: '12px', color: '#cbd5e1' }}>Low-gas USDT transfers designed to evade bank scrutiny; rapid off-ramping into international exchange deposit pools.</div>
                                    </div>
                                    <div style={{ background: '#111827', padding: '16px', borderRadius: '6px', border: '1px solid #1f2937' }}>
                                        <div style={{ fontWeight: 'bold', color: '#a855f7', marginBottom: '6px' }}>Cross-Chain Bridge Layering</div>
                                        <div style={{ fontSize: '12px', color: '#cbd5e1' }}>Scammers jumping funds from Ethereum to Polygon/Arbitrum to deliberately sever single-chain investigator trails.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LAYER 3: COURT EVIDENCE DOSSIER */}
                    {activeLayer === 'dossier' && (
                        <div style={{ flex: 1, padding: '30px', overflowY: 'auto', background: '#050811', display: 'flex', justifyContent: 'center' }}>
                            <div style={{ width: '800px', background: '#ffffff', color: '#0f172a', padding: '40px', borderRadius: '4px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)', fontFamily: 'Georgia, serif' }}>

                                <div style={{ textAlign: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: '16px', marginBottom: '20px' }}>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a8a', letterSpacing: '0.5px' }}>INDIAN CYBER CRIME COORDINATION CENTRE (I4C)</div>
                                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>MINISTRY OF HOME AFFAIRS | GOVERNMENT OF INDIA</div>
                                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>STATUTORY BLOCKCHAIN FORENSIC INTELLIGENCE DOSSIER (SIH26183)</div>
                                </div>

                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '20px', background: '#f8fafc' }}>
                                    <tbody>
                                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '8px', fontWeight: 'bold', width: '25%' }}>NCRP Docket Ref:</td>
                                            <td style={{ padding: '8px', width: '25%' }}>{activeDataset.caseMeta.docket_no}</td>
                                            <td style={{ padding: '8px', fontWeight: 'bold', width: '25%' }}>Date of Analysis:</td>
                                            <td style={{ padding: '8px', width: '25%' }}>06-SEP-2026</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '8px', fontWeight: 'bold' }}>Complainant:</td>
                                            <td style={{ padding: '8px' }}>{activeDataset.caseMeta.victim_name}</td>
                                            <td style={{ padding: '8px', fontWeight: 'bold' }}>Reported Loss:</td>
                                            <td style={{ padding: '8px', color: '#dc2626', fontWeight: 'bold' }}>{activeDataset.caseMeta.reported_loss}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '8px', fontWeight: 'bold' }}>Suspect Origin:</td>
                                            <td style={{ padding: '8px', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '11px' }}>{suspectInput}</td>
                                            <td style={{ padding: '8px', fontWeight: 'bold' }}>Attributed VASP:</td>
                                            <td style={{ padding: '8px', fontWeight: 'bold', color: '#059669' }}>{primaryAttr?.entity_name} ({primaryAttr?.hop_distance} Hops)</td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '8px' }}>1. TRANSACTION CHAIN OF CUSTODY (AUDIT TRAIL)</div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '24px' }}>
                                    <thead>
                                        <tr style={{ background: '#1e3a8a', color: '#ffffff' }}>
                                            <th style={{ padding: '6px', textAlign: 'center' }}>Hop #</th>
                                            <th style={{ padding: '6px', textAlign: 'left' }}>Sender</th>
                                            <th style={{ padding: '6px', textAlign: 'left' }}>Recipient / Entity</th>
                                            <th style={{ padding: '6px', textAlign: 'right' }}>Value</th>
                                            <th style={{ padding: '6px', textAlign: 'right' }}>INR Equivalent</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeDataset.custody_trail.map((h, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #cbd5e1', background: idx % 2 === 0 ? '#ffffff' : '#f1f5f9' }}>
                                                <td style={{ padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{h.hop}</td>
                                                <td style={{ padding: '6px', fontFamily: 'monospace' }}>{h.from_addr.slice(0, 10)}...</td>
                                                <td style={{ padding: '6px', fontWeight: 'bold' }}>{h.to_name}</td>
                                                <td style={{ padding: '6px', textAlign: 'right' }}>{h.value_eth} {h.token}</td>
                                                <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>₹{h.value_inr.toLocaleString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '8px' }}>2. STATUTORY DIRECTIVE UNDER SECTION 91 Cr.P.C. / BNSS 2023</div>
                                <div style={{ fontSize: '11px', lineHeight: '1.6', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '11px', borderRadius: '4px', marginBottom: '30px' }}>
                                    <strong>TO: Compliance Officer, {primaryAttr?.entity_name}</strong><br />
                                    WHEREAS an official investigation is underway regarding cyber fraud registered under NCRP Docket {activeDataset.caseMeta.docket_no}.
                                    The cryptographic assets listed in Table 1 have been traced as direct proceeds of crime entering your liquidity pool.<br />
                                    <strong>YOU ARE HEREBY DIRECTED TO:</strong><br />
                                    1. Immediately FREEZE all internal withdrawal and debit facilities associated with the recipient user account.<br />
                                    2. Furnish complete subscriber KYC records (Aadhaar/Passport, Registered Mobile, PAN, Bank Off-Ramp) and IP login logs within 24 hours of receipt.
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '11px', color: '#475569' }}>
                                    <div>
                                        <div>Generated by: <strong>Automated Blockchain Forensics Grid (SIH26183)</strong></div>
                                        <div>Hash Verification: <code>0x8f2b...9a12</code> (Tamper-Proof)</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 'bold', color: '#0f172a' }}>Investigating Officer (Cyber Crime PS)</div>
                                        <div>Indian Cyber Crime Coordination Centre (I4C)</div>
                                        <div style={{ marginTop: '10px' }}>
                                            <button
                                                onClick={() => window.print()}
                                                style={{ padding: '6px 14px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                                            >
                                                🖨️ Print / Save PDF
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}
                </>
            )}

        </div>
    );
}

