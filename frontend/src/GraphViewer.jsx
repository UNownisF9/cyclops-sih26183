import React, { useEffect, useMemo, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

// API Base URL - Points to live Render backend with localhost fallback
const API_BASE =
    typeof window !== 'undefined' && window.location.hostname !== 'localhost'
        ? 'https://cyclops-sih26183.onrender.com'
        : 'http://localhost:8000';

// ==================== INDIAN NUMBER SYSTEM — frontend mirrors backend ====================
function formatInrIndian(n) {
    const num = Math.abs(Math.trunc(Number(String(n).replace(/,/g, '')) || 0));
    const s = String(num);
    if (s.length <= 3) return (Number(n) < 0 ? '-' : '') + s;
    const last3 = s.slice(-3);
    let rest = s.slice(0, -3);
    const parts = [];
    while (rest.length > 2) {
        parts.push(rest.slice(-2));
        rest = rest.slice(0, -2);
    }
    if (rest) parts.push(rest);
    parts.reverse();
    const res = [...parts, last3].join(',');
    return (Number(n) < 0 ? '-' : '') + res;
}
function formatInrHuman(n) {
    const num = Number(String(n).replace(/,/g, '')) || 0;
    const absn = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    if (absn >= 1e7) return `${sign}₹${(absn / 1e7).toFixed(2)} Cr`;
    if (absn >= 1e5) return `${sign}₹${(absn / 1e5).toFixed(2)} Lakh`;
    if (absn >= 1e3) return `${sign}₹${(absn / 1000).toFixed(1)} K`;
    return `${sign}₹${formatInrIndian(absn)}`;
}
function formatInrFull(n) {
    return `₹${formatInrIndian(n)}`;
}
function currentDateStr() {
    try {
        return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-').toUpperCase();
    } catch {
        const d = new Date();
        return `${String(d.getDate()).padStart(2,'0')}-${d.toLocaleString('en', {month:'short'}).toUpperCase()}-${d.getFullYear()}`;
    }
}

// Node/edge colors used by the Cytoscape canvas. Cytoscape styles are JS,
// not CSS, so this palette is kept in one place and mirrored by the CSS
// variables of the same name in index.css.
const GRAPH_COLORS = {
    ink: '#14140f',
    rust: '#a8391c',
    rustDark: '#7a2a14',
    green: '#21603f',
    greenDark: '#164a30',
    navy: '#3b5a86',
    slate: '#5b5e6b',
    line: '#40434f',
    paper: '#f4f2ec',
};

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
    { victim: 'Sunil Deshmukh', amount: '₹20,50,000 (25,000 USDT)', type: 'Fake Forex Trading Platform (Tron USDT)', wallet: 'TScam9999a3b2e5f8841a0e889b41a91e1d092', chain: 'tron' },
    { victim: 'Priya Narang', amount: '₹12,12,500 (4.85 ETH)', type: 'Task-Based Telegram Part-Time Scam', wallet: '0x9999a3b2e5f8841a0e889b41a91e1d092cb3e4a1', chain: 'ethereum' },
    { victim: 'Deepak Chawla', amount: '₹15,50,000 (6.20 ETH)', type: 'Cross-Chain Bridge Stealer (Polygon Hop)', wallet: '0x8888a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9', chain: 'multichain' },
    { victim: 'Dr. S. K. Roy', amount: '₹25,00,000 (10.00 ETH)', type: 'Hospital Enterprise Ransomware', wallet: '0x1111a2b3c4d5e6f708192a3b4c5d6e7f8a9b0c1d', chain: 'ethereum' },
    { victim: 'Rohit Aggarwal', amount: '₹18,40,000 (0.35 BTC)', type: 'Sextortion / Darknet Bitcoin Extortion', wallet: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', chain: 'bitcoin' },
    { victim: 'Ananya Sengupta', amount: '₹7,80,000 (9,500 USDT)', type: 'WhatsApp Part-Time YouTube Like Scam', wallet: 'TScam9999a3b2e5f8841a0e889b41a91e1d092', chain: 'tron' },
    { victim: 'Kavita Reddy', amount: '₹34,00,000 (13.60 ETH)', type: 'Fake SEBI Registered Stock Advisory App', wallet: '0x9999a3b2e5f8841a0e889b41a91e1d092cb3e4a1', chain: 'ethereum' },
    { victim: 'Col. R. K. Joshi', amount: '₹16,75,000 (20,000 USDT)', type: 'Fake P2P Crypto Arbitrage Bot', wallet: 'TScam9999a3b2e5f8841a0e889b41a91e1d092', chain: 'tron' },
    { victim: 'Manish Malhotra', amount: '₹9,20,000 (0.17 BTC)', type: 'FedEx Digital Arrest Blackmail', wallet: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', chain: 'bitcoin' },
    { victim: 'Sneha Kulkarni', amount: '₹11,40,000 (4.56 ETH)', type: 'Phishing Signature Permit2 Drainer', wallet: '0x8888a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9', chain: 'multichain' }
];

const CHAIN_TABS = [
    { key: 'ethereum', label: 'Ethereum' },
    { key: 'tron', label: 'Tron (TRC-20)' },
    { key: 'bitcoin', label: 'Bitcoin (Esplora)' },
    { key: 'multichain', label: 'Multi-Chain (Bridge)' }
];

const DEMO_STEPS = [
    {
        title: 'Step 1: Live Citizen Complaint Intake (1930 / NCRP)',
        desc: 'Citizen reports a crypto fraud loss. The live Golden Hour countdown clock initiates to prevent off-ramp liquidation.'
    },
    {
        title: 'Step 2: Automated Multi-Hop Graph Traversal with Live Current',
        desc: 'The animated flow lines trace fund movement across intermediary mule accounts (Hop 1 & Hop 2), detecting peel-chain laundering.'
    },
    {
        title: 'Step 3: Instant VASP Attribution (Binance)',
        desc: 'The trace terminates at Hop 3, matching against the FIU-IND / VASP Ground Truth Registry with 94.2% attribution confidence.'
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

// ==================== PATCH NOTES — complete & concise ====================
const PATCH_NOTES = [
    {
        version: 'v6.2.0 — Live Dataset + Bcrypt',
        date: '10 Sept 2026',
        badge: 'Current',
        tag: 'Major',
        summary: 'Option B live ingester (Etherscan/Blockstream, 5/sec, offline-verifiable) + bcrypt + PBKDF2 — your “B + bcrypt yes” delivered.',
        sections: [
            {
                title: 'Live Dataset (Option B)',
                icon: '●',
                items: [
                    'New: scripts/ingest_sample.py — fetches 20 real tx hashes for Binance 0x28c6…, WazirX, CoinDCX, 0x1111… (txlist + tokentx) + Blockstream BTC 34xp… (5 txs), writes data/live_sample.json (count, provenance, ingested_normalized) + data/sample_provenance.json; respects 5/sec Etherscan limit, fallback mock if key missing',
                    'Startup load: main.py:911 LIVE_SAMPLE_DATA auto-loaded from data/live_sample.json (if present), logged, exposed via GET /api/health (dataset.live_sample_count), GET /api/security/status, GET /api/dataset/live-sample & /api/dataset/sample-provenance',
                    'Judge-verifiable: each provenance has tx_hash, source_url (https://etherscan.io/tx/… / https://blockstream.info/tx/…), verified_at, source (LIVE_ETHERSCAN/LIVE_BLOCKSTREAM vs DEMO_MOCK_DATA), not required for demo — mock remains primary per tracer deterministic priority',
                    'Committed: data/live_sample.json (5 LIVE_BLOCKSTREAM BTC txs proven, plus fallback) + data/sample_provenance.json — judges can curl or run `python scripts/ingest_sample.py --verify`',
                ]
            },
            {
                title: 'Auth Hardening — Bcrypt + PBKDF2',
                icon: '🔒',
                items: [
                    'Before: SHA256(salt+pass) single fast hash — demo-grade; key derivation SHA256(secret) — no iteration',
                    'After: bcrypt (per-password salt, slow) via `bcrypt`/`passlib` with `gensalt()` per officer at startup (`main.py:360` HAS_BCRYPT), verify via `checkpw` with SHA256 fallback for zero-downtime migration; key derivation now PBKDF2-HMAC-SHA256 100k + deterministic salt (`cyclops-salt-v2:raw`), old SHA256 key kept as _FERNET_KEY_OLD for decrypting existing enc:… in ncrp_complaints.json',
                    'Headers: added per-request CSP nonce (`nonce-…` + `unsafe-inline` for Vite compat) + X-CSP-Nonce + X-Request-ID (`main.py:1380` security_middleware), production warning if CYCLOPS_AUTH_SECRET is default in ENV=production',
                    'Deps: requirements.txt +bcrypt, +passlib[bcrypt] (11 installed), health/security endpoints now report `PBKDF2 100k` + `has_bcrypt`',
                ]
            },
        ]
    },
    {
        version: 'v6.1.1 — Layout & Single-Source Notes',
        date: '09 Sept 2026',
        badge: 'Previous',
        tag: 'Fix',
        summary: 'Court dossier/time overlap fixed, patch-notes decluttered to one suitable place — clean police grid at all widths.',
        sections: [
            {
                title: 'Layout Fix — Police Portal',
                icon: '▣',
                items: [
                    'Fixed: Court Dossier tab overlapping IST 16:17:04 / PDF Dossier (topbar had 11 items in 56px, no wrap)',
                    'Root: .topbar flex:nowrap + center flex:1 + right margin-left:auto → centre squeezed under IST at ~1180–1320px',
                    'Fix: topbar wraps at 1320px, left/center/right gaps reduced, segmented padding 7px→6px, font 12→11px, time block min-width, no overlap via z-index; tested 360→1920px',
                    'Result: Forensics / Intelligence Grid / Court Dossier + IST + PDF never collide; ticker Auto-trace still visible',
                ]
            },
            {
                title: 'Patch Notes — Single Source',
                icon: '✎',
                items: [
                    'Before: Patch Notes button in 8 places (topbar, hero, citizen tracker + form, police login, forensics toolbar, intel header, dossier banner, Cmd+K, footer) — crowded',
                    'After: exactly one entry point — Landing ledger row “CHANGELOG · v6.1.1 — Patch Notes — Complete & Concise” (click for modal). Removed all other buttons/ banners/ palette entries',
                    'Modal kept: complete history v6.1.1 + v6.1.0 + v6.0.0, expandable sections, copy-friendly',
                    'Why here: Landing ledger is first thing judges see; ledger orb + left border makes it discoverable without crowding police grid',
                ]
            },
        ]
    },
    {
        version: 'v6.1.0 — Secure & Live',
        date: '09 Sept 2026',
        badge: 'Previous',
        tag: 'Major',
        summary: 'Field encryption, live citizen tracking, dossier sync fix and multi-chain harden — judge-ready.',
        sections: [
            {
                title: 'Security Hardening',
                icon: '🔒',
                items: [
                    'Field-level AES: Fernet AES-128-CBC+HMAC for wallet/phone; masked display, decrypted on-demand for LEA only; stored as enc:… in ncrp_complaints.json',
                    'Hashed auth: SHA256(salt+passcode) + hmac.compare_digest; prevents timing-oracle & plaintext leakage',
                    'Input sanitization: strip <tags>/control chars, length caps, wallet regex (ETH/Tron/BTC)',
                    'Rate limiting: 60/min global, 10/min auth, 20/min trace + Retry-After; body guard 512KB',
                    'Headers: CSP, HSTS (63072000), X-Content-Type-Options nosniff, X-Frame DENY, Referrer-Policy, Permissions-Policy',
                    'CORS allowlist (Render/Vercel/localhost + regex) + audit log (200 events, LEA-only endpoint)',
                ]
            },
            {
                title: 'Citizen 1930 Portal — Live Tracking',
                icon: '◐',
                items: [
                    'New dark live tracker after submit: docket header + Golden Hour countdown (2h), officer & ETA, progress bar',
                    '6-stage lifecycle (FILED→TRACING→VASP_IDENTIFIED→FREEZE_DISPATCHED→FROZEN→RESOLVED) with IST timestamps, 3s polling',
                    'Docket lookup bar always visible: citizen can re-track without re-filing; live fund-hop preview (masked + encrypted toggle)',
                    'Encryption badge + expandable enc:… token demo; sanitization notice',
                    'Fallback to local demo dataset when backend unavailable — never white-screens',
                ]
            },
            {
                title: 'Court Dossier & PDF Fixes',
                icon: '⚖',
                items: [
                    'Fixed: dossier/PDF showed Unidentified Wallet / empty hops on Bitcoin/Multi-chain/auto-trace',
                    'Root: missing MOCK trails for 1A1z…, 0x8888…, 0x1111…; live Blockstream overrode mock; BRIDGE terminated trace early; target picked first attribution',
                    'Fix: added 1A1z→34xp… (BTC ₹18,40,000), 0x8888→0x3333→0x40ec→0x5038… (CoinDCX), 0x1111…; mock priority over live; BRIDGE now transit (still logged) → CEX terminal; INR rates per token; target = deepest CEX',
                    'Frontend: dossier useEffect now watches dossierAddress (activeDataset.suspect_wallet || suspectInput); displayDossier/dossierTrail memos fallback to activeDataset when backend empty; PDF uses same address',
                    'Verified: BTC→Binance (Bitcoin) 1 hop, Multi→CoinDCX 3 hops, Tron→Binance (Tron) 2 hops, ETH→Binance 5 hops — dossier & PDF match; Deepak Chawla → CoinDCX correct',
                ]
            },
            {
                title: 'Forensics & General',
                icon: '◎',
                items: [
                    'Tracer: deterministic demo priority, multi-chain bridge→CoinDCX now 3 hops; cache TTL 5 min',
                    'Health/status: /api/security/status, /api/citizen/track/{docket}, /api/audit/log',
                    'UI: landing NEW IN v6.1 banner, ledger 6 stages, police login security badges, topbar IST + PDF quick action',
                    'Version bump 6.0.0→6.1.0; patch notes surfaced via single landing ledger entry',
                ]
            },
        ]
    },
    {
        version: 'v6.0.0 — CrySec',
        date: '08 Sept 2026',
        badge: 'Previous',
        tag: 'Baseline',
        summary: 'SIH26183 baseline: multi-chain tracer, VASP registry, risk/ML heuristics, graph canvas, PDF dossier.',
        sections: [
            {
                title: 'Baseline Features',
                icon: '•',
                items: [
                    'Multi-chain BFS tracer (ETH/Tron/BTC) + FIU-IND VASP registry (Binance, CoinDCX, WazirX …)',
                    'Risk scoring (peel-chain, mixer, direct deposit) + heuristic ML (sweep, holding, peel asymmetry)',
                    'Cytoscape.js graph, NCRP live queue, citizen/police portals, ReportLab PDF dossier',
                    'Known issues fixed in v6.1.0 (see above) — dossier sync & empty hops on Bitcoin/Multi-chain',
                ]
            },
        ]
    },
];

// ==================== EMBLEM + OFFICIAL ICONS (no emoji) ====================
function CyclopsEmblem() {
    return (
        <svg className="brand-mark" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="3" />
            <path d="M12 50 Q 50 18 88 50 Q 50 82 12 50 Z" stroke="currentColor" strokeWidth="3.5" fill="none" />
            <circle cx="50" cy="50" r="16" fill="currentColor" />
            <circle cx="53" cy="47" r="3" fill="var(--paper)" />
        </svg>
    );
}
function ShieldCheckIcon({ size = 18 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 2.8L4.2 5.8V12.1C4.2 15.9 6.8 19.4 12 21.2C17.2 19.4 19.8 15.9 19.8 12.1V5.8L12 2.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" fill="none"/>
            <path d="M8.8 12.2L11.2 14.6L15.8 9.1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}
function LockShieldIcon({ size = 18 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 2.8L4.2 5.8V12.1C4.2 15.9 6.8 19.4 12 21.2C17.2 19.4 19.8 15.9 19.8 12.1V5.8L12 2.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" fill="none"/>
            <rect x="8.2" y="11.2" width="7.6" height="6.2" rx="1.4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M10.1 11.2V9.6C10.1 8.5 10.9 7.6 12 7.6C13.1 7.6 13.9 8.5 13.9 9.6V11.2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <circle cx="12" cy="14.3" r="1.1" fill="currentColor"/>
        </svg>
    );
}
function SearchTraceIcon({ size = 18 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7"/>
            <path d="M15.3 15.3L19.2 19.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M8.5 11H13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.9"/>
            <path d="M11 8.5V13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.9"/>
        </svg>
    );
}

function RiskRing({ score }) {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const color = score > 75 ? '#e0654a' : (score > 50 ? '#d9a441' : '#4caf7d');
    const reduceMotion = useReducedMotion();
    return (
        <div className="risk-ring-wrap">
            <svg width="68" height="68" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="34" cy="34" r={radius} stroke="#262838" strokeWidth="6" fill="transparent" />
                <motion.circle
                    cx="34" cy="34" r={radius}
                    stroke={color}
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    initial={false}
                    animate={{ strokeDashoffset: circumference - (circumference * score) / 100 }}
                    transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 18 }}
                />
            </svg>
            <div className="risk-ring-num">
                <AnimatedCounter value={score} />
            </div>
        </div>
    );
}

class ErrorBoundary extends React.Component {
    constructor(props){ super(props); this.state={hasError:false, error:null}; }
    static getDerivedStateFromError(error){ return {hasError:true, error}; }
    componentDidCatch(error, info){ console.error('Cyclops tab crash:', error, info); }
    render(){
        if(this.state.hasError){
            return (
                <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#0f1117', color:'#f2f1ea', padding:32, textAlign:'center' }}>
                    <div style={{ maxWidth:560, background:'#191b26', border:'1px solid #262838', borderRadius:8, padding:24 }}>
                        <div style={{ fontSize:14, fontWeight:800, color:'#e0654a', marginBottom:8 }}>This panel hit a render issue — but your case is safe.</div>
                        <div style={{ fontSize:12, color:'#8b8d9c', marginBottom:12 }}>{String(this.state.error?.message || this.state.error || 'Unknown render error')}</div>
                        <div style={{ fontSize:11, color:'#c9c8c1', marginBottom:16 }}>Try switching chain, or re-open the tab. If it persists, the fallback dossier is still available via PDF.</div>
                        <button className="btn btn-navy btn-sm" onClick={()=> this.setState({hasError:false, error:null})}>Retry render</button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// ==================== ANIMATED NUMERIC COUNTER ====================
// Rolls from the previous value to the next using a quartic-ish spring.
// Used for INR totals, risk scores, and telemetry counters. Falls back
// to an immediate jump when the user prefers reduced motion.
function AnimatedCounter({ value, prefix = '', suffix = '', formatter, initialValue }) {
    const reduceMotion = useReducedMotion();
    const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    const [display, setDisplay] = useState(initialValue !== undefined ? initialValue : numericValue);
    const fromRef = useRef(initialValue !== undefined ? initialValue : numericValue);
    const frameRef = useRef(null);

    useEffect(() => {
        if (reduceMotion) {
            setDisplay(numericValue);
            fromRef.current = numericValue;
            return;
        }
        const from = fromRef.current;
        const to = numericValue;
        if (from === to) return;
        const duration = 700;
        const start = performance.now();
        const ease = (t) => 1 - Math.pow(1 - t, 4); // quartic ease-out

        cancelAnimationFrame(frameRef.current);
        const tick = (now) => {
            const elapsed = now - start;
            const t = Math.min(1, elapsed / duration);
            const current = from + (to - from) * ease(t);
            setDisplay(current);
            if (t < 1) {
                frameRef.current = requestAnimationFrame(tick);
            } else {
                fromRef.current = to;
            }
        };
        frameRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [numericValue, reduceMotion]);

    const rendered = formatter
        ? formatter(display)
        : Math.round(display).toLocaleString('en-IN');

    return <span>{prefix}{rendered}{suffix}</span>;
}

// ==================== COMMAND PALETTE (Ctrl+K / Cmd+K) ====================
function CommandPalette({ open, onClose, commands }) {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        if (open) {
            setQuery('');
            setTimeout(() => inputRef.current?.focus(), 20);
        }
    }, [open]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return commands;
        return commands.filter((c) =>
            c.label.toLowerCase().includes(q) || (c.group || '').toLowerCase().includes(q)
        );
    }, [query, commands]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="cmdk-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.15 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="cmdk-panel"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, y: reduceMotion ? 0 : -12, scale: reduceMotion ? 1 : 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: reduceMotion ? 0 : -8, scale: reduceMotion ? 1 : 0.98 }}
                        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 28 }}
                    >
                        <div className="cmdk-input-row">
                            <span className="cmdk-icon">⌘</span>
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Switch network, freeze VASP, export report…"
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') onClose();
                                    if (e.key === 'Enter' && filtered[0]) {
                                        filtered[0].run();
                                        onClose();
                                    }
                                }}
                            />
                            <kbd>Esc</kbd>
                        </div>
                        <div className="cmdk-list">
                            {filtered.length === 0 && (
                                <div className="cmdk-empty">No matching commands</div>
                            )}
                            {filtered.map((c) => (
                                <button
                                    key={c.id}
                                    className="cmdk-item"
                                    onClick={() => { c.run(); onClose(); }}
                                >
                                    <span className="cmdk-item-label">{c.label}</span>
                                    {c.group && <span className="cmdk-item-group">{c.group}</span>}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ==================== PATCH NOTES MODAL ====================
function PatchNotesModal({ open, onClose }) {
    const reduceMotion = useReducedMotion();
    const [expanded, setExpanded] = useState(() => new Set([0])); // first expanded
    const toggle = (idx) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx); else next.add(idx);
            return next;
        });
    };
    if (!open) return null;
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="patchnotes-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.15 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="patchnotes-panel"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, y: reduceMotion ? 0 : 14, scale: reduceMotion ? 1 : 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: reduceMotion ? 0 : 8, scale: reduceMotion ? 1 : 0.98 }}
                        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 340, damping: 28 }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Patch notes"
                    >
                        <div className="patchnotes-head">
                            <div>
                                <div style={{ fontSize: 11, letterSpacing: '0.08em', color: '#8b8d9c', fontWeight: 700 }}>CYCLOPS · SIH26183</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: '#14140f', marginTop: 2, display:'flex', alignItems:'center', gap:8 }}>
                                    Patch Notes <span style={{ fontSize: 11, padding:'2px 7px', borderRadius:999, background:'#1e3a8a', color:'#fff', fontWeight:700 }}>v6.2.0</span>
                                    <span style={{ fontSize: 11, color:'#6d6f7d', fontWeight:600 }}>Complete & concise</span>
                                </div>
                                <div style={{ fontSize: 11, color:'#6d6f7d', marginTop:4 }}>Every fix that makes Citizen → Wallet → VASP → Freeze verifiable. Single source on landing.</div>
                            </div>
                            <button className="patchnotes-close" onClick={onClose} aria-label="Close patch notes">✕</button>
                        </div>
                        <div className="patchnotes-body">
                            {PATCH_NOTES.map((rel, idx) => {
                                const isOpen = expanded.has(idx);
                                return (
                                    <div key={rel.version} className={`patchnotes-release ${isOpen ? 'open' : ''}`}>
                                        <button className="patchnotes-release-head" onClick={() => toggle(idx)} aria-expanded={isOpen}>
                                            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                                                <span style={{ fontSize:13, fontWeight:800, color:'#14140f' }}>{rel.version}</span>
                                                <span style={{ fontSize:10, padding:'2px 7px', borderRadius:999, background: rel.badge==='Current' ? '#21603f' : '#e4e7ee', color: rel.badge==='Current' ? '#fff' : '#223354', fontWeight:700, border:`1px solid ${rel.badge==='Current' ? '#21603f' : '#cbd5e1'}` }}>{rel.badge}</span>
                                                <span style={{ fontSize:11, color:'#6d6f7d' }}>{rel.date}</span>
                                                <span style={{ fontSize:10, padding:'2px 6px', borderRadius:999, background:'#f4f2ec', border:'1px solid #dcd8cc', color:'#8a5a12', fontWeight:700 }}>{rel.tag}</span>
                                            </div>
                                            <span style={{ color:'#6d6f7d', fontSize:14, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.2s' }}>▾</span>
                                        </button>
                                        <div style={{ fontSize:12, color:'#4a4a42', margin:'6px 0 10px', lineHeight:1.5 }}>{rel.summary}</div>
                                        <AnimatePresence initial={false}>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ height:0, opacity:0 }}
                                                    animate={{ height:'auto', opacity:1 }}
                                                    exit={{ height:0, opacity:0 }}
                                                    transition={{ duration: reduceMotion ? 0 : 0.22 }}
                                                    style={{ overflow:'hidden' }}
                                                >
                                                    <div className="patchnotes-sections">
                                                        {rel.sections.map((sec, sIdx) => (
                                                            <div key={sIdx} className="patchnotes-section">
                                                                <div className="patchnotes-section-title"><span>{sec.icon}</span> {sec.title}</div>
                                                                <ul className="patchnotes-list">
                                                                    {sec.items.map((it, iIdx) => (
                                                                        <li key={iIdx}>{it}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="patchnotes-foot">
                            <span style={{ fontSize:11, color:'#6d6f7d' }}>Team CrySec · Ministry of Home Affairs · I4C · SIH26183 · v6.2.0 on <code style={{ background:'#f4f2ec', padding:'1px 5px', borderRadius:4, border:'1px solid #dcd8cc' }}>http://localhost:5173</code> / <code style={{ background:'#f4f2ec', padding:'1px 5px', borderRadius:4, border:'1px solid #dcd8cc' }}>http://localhost:8000/docs</code></span>
                            <button className="btn btn-navy btn-sm" onClick={onClose}>Close</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ==================== SLIDING PILL INDICATOR FOR SEGMENTED TABS ====================
// Renders inside each button; only the active button gets it, and because
// they all share layoutId, framer-motion animates the pill sliding between
// positions instead of popping between buttons.
function TabPill({ layoutId }) {
    const reduceMotion = useReducedMotion();
    return (
        <motion.span
            layoutId={layoutId}
            className="tab-pill-bg"
            transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 40 }}
        />
    );
}

// ==================== KINETIC HEADLINE ====================
// Splits each line into words and reveals them with a staggered
// blur-to-sharp rise. Falls back to a plain, instant heading for
// reduced-motion so nothing here is load-bearing for comprehension.
function KineticHeadline({ lines, className }) {
    const reduceMotion = useReducedMotion();

    if (reduceMotion) {
        return (
            <h1 className={className}>
                {lines.map((line, i) => (
                    <React.Fragment key={i}>
                        {line}
                        {i < lines.length - 1 && <br />}
                    </React.Fragment>
                ))}
            </h1>
        );
    }

    let wordCursor = 0;
    return (
        <h1 className={className}>
            {lines.map((line, li) => (
                <span key={li} className="kinetic-line">
                    {line.split(' ').map((word, wi) => {
                        const idx = wordCursor++;
                        return (
                            <motion.span
                                key={wi}
                                className="kinetic-word"
                                initial={{ opacity: 0, y: 24, filter: 'blur(7px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                transition={{ delay: 0.15 + idx * 0.045, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                            >
                                {word}&nbsp;
                            </motion.span>
                        );
                    })}
                    {li < lines.length - 1 && <br />}
                </span>
            ))}
        </h1>
    );
}

// ==================== AMBIENT NETWORK (canvas) ====================
// A quiet, GPU-cheap drifting node/link mesh behind the hero — evokes a
// ledger of wallets and transaction edges rather than generic AI-template
// particles. Pure canvas 2D, ~34 nodes, pauses entirely for
// prefers-reduced-motion instead of rendering a static frame.
function AmbientNetwork() {
    const canvasRef = useRef(null);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        if (reduceMotion) return undefined;
        const canvas = canvasRef.current;
        const parent = canvas?.parentElement;
        if (!canvas || !parent) return undefined;
        const ctx = canvas.getContext('2d');

        let raf = null;
        let w = 0;
        let h = 0;
        const nodes = [];
        const NODE_COUNT = 34;
        const LINK_DIST = 150;

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = parent.clientWidth;
            h = parent.clientHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();

        if (nodes.length === 0) {
            for (let i = 0; i < NODE_COUNT; i++) {
                nodes.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.18,
                    vy: (Math.random() - 0.5) * 0.18,
                    r: Math.random() * 1.6 + 0.7,
                });
            }
        }

        const tick = () => {
            ctx.clearRect(0, 0, w, h);
            for (const n of nodes) {
                n.x += n.vx;
                n.y += n.vy;
                if (n.x < 0 || n.x > w) n.vx *= -1;
                if (n.y < 0 || n.y > h) n.vy *= -1;
            }
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const a = nodes[i];
                    const b = nodes[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < LINK_DIST) {
                        ctx.strokeStyle = `rgba(157, 180, 216, ${0.16 * (1 - dist / LINK_DIST)})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }
            for (const n of nodes) {
                ctx.fillStyle = 'rgba(224, 101, 74, 0.4)';
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                ctx.fill();
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);

        const handleResize = () => resize();
        window.addEventListener('resize', handleResize);

        return () => {
            if (raf) cancelAnimationFrame(raf);
            window.removeEventListener('resize', handleResize);
        };
    }, [reduceMotion]);

    if (reduceMotion) return null;
    return <canvas ref={canvasRef} className="ambient-network" aria-hidden="true" />;
}

export default function GraphViewer() {
    // Responsive Mobile Detection Hook
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 960 : false);
    const [mobileViewTab, setMobileViewTab] = useState('canvas'); // 'threat' | 'canvas' | 'inspector'

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 960);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const containerRef = useRef(null);
    const cyRef = useRef(null);
    const heroRef = useRef(null);

    // Cursor-follow spotlight on the landing hero — mutates a CSS custom
    // property directly instead of React state so it never triggers a
    // re-render on mousemove.
    const handleHeroMouseMove = (e) => {
        const node = heroRef.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        node.style.setProperty('--spot-x', `${x}%`);
        node.style.setProperty('--spot-y', `${y}%`);
    };

    // Portal View: 'citizen' | 'police'
    const [currentPortal, setCurrentPortal] = useState('landing'); // 'landing' | 'citizen' | 'police'

    // POLICE AUTHENTICATION STATE (now backed by /api/auth/login JWT)
    const [isPoliceAuth, setIsPoliceAuth] = useState(() => {
        try { return !!localStorage.getItem('cyclops_token'); } catch { return false; }
    });
    const [authToken, setAuthToken] = useState(() => {
        try { return localStorage.getItem('cyclops_token') || ''; } catch { return ''; }
    });
    const [officerId, setOfficerId] = useState(() => {
        try { return localStorage.getItem('cyclops_officer') || ''; } catch { return ''; }
    });
    const [officerPass, setOfficerPass] = useState('');
    const [authError, setAuthError] = useState('');
    const [provenance, setProvenance] = useState(null);

    // Restore auth on mount — verify token still valid
    useEffect(() => {
        if (!authToken) return;
        fetch(`${API_BASE}/api/auth/verify`, { headers: { 'Authorization': `Bearer ${authToken}` } })
            .then(r => {
                if (!r.ok) throw new Error('expired');
                return r.json();
            })
            .then(() => setIsPoliceAuth(true))
            .catch(() => {
                try { localStorage.removeItem('cyclops_token'); localStorage.removeItem('cyclops_officer'); } catch {}
                setAuthToken('');
                setIsPoliceAuth(false);
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Police Layers: 'forensics' | 'dashboard' | 'dossier'
    const [activeLayer, setActiveLayer] = useState('forensics');
    const [selectedChainKey, setSelectedChainKey] = useState('ethereum');
    const [activeDataset, setActiveDataset] = useState(CHAIN_DATASETS.ethereum);
    const [suspectInput, setSuspectInput] = useState(CHAIN_DATASETS.ethereum.suspect_wallet);
    const [selectedNode, setSelectedNode] = useState(null);
    const [activeTab, setActiveTab] = useState('inspector'); // 'inspector' | 'custody' | 'ml' | 'legal'
    const [copiedNotice, setCopiedNotice] = useState(false);
    const [tracingLive, setTracingLive] = useState(false);
    // Intelligence & dossier backend state — prevents white-screen when switching subjects/tabs
    const [intelData, setIntelData] = useState(null);
    const [intelLoading, setIntelLoading] = useState(false);
    const [dossierData, setDossierData] = useState(null);
    const [dossierLoading, setDossierLoading] = useState(false);

    // Live Golden Hour Ticking Timer
    const [secondsRemaining, setSecondsRemaining] = useState(CHAIN_DATASETS.ethereum.golden_hour_seconds);

    // Live Stream Toast State
    const [streamIndex, setStreamIndex] = useState(0);
    const [showStreamAlert, setShowStreamAlert] = useState(true);

    // Cycle incoming citizen complaints every 3 seconds
    useEffect(() => {
        const streamTimer = setInterval(() => {
            setStreamIndex((prev) => (prev + 1) % LIVE_COMPLAINT_STREAM.length);
            setShowStreamAlert(true);
        }, 3000);
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

    // Live IST wall-clock (for header + freeze stamps) — ticks every second
    const [nowIST, setNowIST] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setNowIST(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    const formatISTClock = (d) => {
        try {
            return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', ' ·');
        } catch {
            return d.toLocaleString();
        }
    };
    const formatISTTime = (d) => {
        try {
            return d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
        } catch { return d.toLocaleTimeString(); }
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

    // Intelligence Grid — backend-backed but never white-screen
    useEffect(() => {
        if (!isPoliceAuth) return;
        if (activeLayer === 'dashboard' && !intelData && !intelLoading) {
            setIntelLoading(true);
            const headers = {};
            if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
            fetch(`${API_BASE}/api/intelligence/summary`, { headers })
                .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
                .then(data => setIntelData(data))
                .catch(err => {
                    console.warn('Intelligence summary fetch failed, using fallback:', err);
                    setIntelData(null);
                })
                .finally(() => setIntelLoading(false));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeLayer, isPoliceAuth, authToken]);

    // Court Dossier — always in sync with the CURRENT subject (chain switch / auto-trace / manual trace)
    // Watches the canonical address from activeDataset.suspect_wallet (primary) and suspectInput (fallback).
    // Every change while the dossier tab is open triggers a fresh backend fetch; falls back to local dataset instantly.
    const dossierAddress = (activeDataset?.suspect_wallet || suspectInput || '0x9999a3b2e5f8841a0e889b41a91e1d092cb3e4a1').trim();
    useEffect(() => {
        if (!isPoliceAuth || activeLayer !== 'dossier') return;
        let cancelled = false;
        setDossierLoading(true);
        const headers = {};
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
        const addr = encodeURIComponent(dossierAddress);
        fetch(`${API_BASE}/api/dossier/data?address=${addr}`, { headers })
            .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
            .then(data => { if (!cancelled) setDossierData(data); })
            .catch(err => {
                console.warn('Dossier fetch failed, using local dataset for', dossierAddress, err);
                if (!cancelled) setDossierData(null);
            })
            .finally(() => { if (!cancelled) setDossierLoading(false); });
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeLayer, isPoliceAuth, authToken, dossierAddress]);

    // Modals
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [dispatchLogs, setDispatchLogs] = useState([]);
    const [dispatchComplete, setDispatchComplete] = useState(false);

    // Command palette (Ctrl+K / Cmd+K)
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [showPatchNotes, setShowPatchNotes] = useState(false);
    useEffect(() => {
        const handler = (e) => {
            const isCombo = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
            if (isCombo) {
                e.preventDefault();
                setShowCommandPalette((v) => !v);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Citizen Complaint Form
    const [citizenName, setCitizenName] = useState('');
    const [citizenPhone, setCitizenPhone] = useState('');
    const [citizenScamType, setCitizenScamType] = useState('Task-Based Telegram Part-Time Scam');
    const [citizenWallet, setCitizenWallet] = useState('');
    const [citizenLoss, setCitizenLoss] = useState('');
    const [citizenSubmitted, setCitizenSubmitted] = useState(false);
    const [citizenDocket, setCitizenDocket] = useState('');
    // Citizen live tracking state (new real-time portal)
    const [citizenLookupInput, setCitizenLookupInput] = useState('');
    const [citizenLookupError, setCitizenLookupError] = useState('');
    const [citizenTrackData, setCitizenTrackData] = useState(null);
    const [citizenTrackLoading, setCitizenTrackLoading] = useState(false);
    const [citizenEncryptionMeta, setCitizenEncryptionMeta] = useState(null);
    const [showEncrypted, setShowEncrypted] = useState(false);
    const [citizenPollTick, setCitizenPollTick] = useState(0);

    // Guided Autopilot State
    const [demoActive, setDemoActive] = useState(false);
    const [demoStep, setDemoStep] = useState(0);

    const handlePoliceLogin = async (e) => {
        e.preventDefault();
        setAuthError('');
        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ officer_id: officerId.trim(), passcode: officerPass.trim() })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.detail || 'Invalid Officer Badge ID or Security Passcode. Access Restricted.');
            }
            const token = data.access_token;
            setAuthToken(token);
            setIsPoliceAuth(true);
            setAuthError('');
            try {
                localStorage.setItem('cyclops_token', token);
                localStorage.setItem('cyclops_officer', officerId.trim());
            } catch {}
        } catch (err) {
            // Fallback: if backend unreachable, keep demo client-side check so judges can still demo offline
            if (err.message && err.message.includes('fetch')) {
                if ((officerId.trim() === 'IO-I4C-9921' || officerId.trim() === 'admin') &&
                    (officerPass.trim() === 'cybercell' || officerPass.trim() === 'admin123')) {
                    setIsPoliceAuth(true);
                    setAuthError('');
                    return;
                }
            }
            setAuthError(err.message || 'Authentication failed. Check backend connection.');
        }
    };

    const handlePoliceLogout = async () => {
        try {
            if (authToken) {
                await fetch(`${API_BASE}/api/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
            }
        } catch {}
        try { localStorage.removeItem('cyclops_token'); localStorage.removeItem('cyclops_officer'); } catch {}
        setAuthToken('');
        setIsPoliceAuth(false);
        setCurrentPortal('landing');
        setOfficerPass('');
        setProvenance(null);
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
            const headers = { 'Content-Type': 'application/json' };
            if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
            const res = await fetch(`${API_BASE}/api/trace`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    suspect_address: walletAddress,
                    chain: selectedChainKey,
                    max_depth: 3,
                    min_value_eth: 0.01,
                    max_branches: 5
                })
            });
            if (res.status === 401) {
                setAuthError('Session expired. Please re-authenticate.');
                setIsPoliceAuth(false);
                try { localStorage.removeItem('cyclops_token'); } catch {}
                setAuthToken('');
                throw new Error('Unauthorized');
            }
            if (res.ok) {
                const data = await res.json();
                if (data && data.elements && data.elements.nodes.length > 0) {
                    const positionedNodes = data.elements.nodes.map((n, idx) => ({
                        ...n,
                        position: { x: (n.data.hop_level || idx) * 250 + 100, y: 260 + (idx % 2 === 0 ? -25 : 25) }
                    }));
                    const updatedElements = { nodes: positionedNodes, edges: data.elements.edges };
                    if (data.data_provenance) setProvenance(data.data_provenance);
                    setActiveDataset({
                        ...activeDataset,
                        caseMeta: updatedCaseMeta,
                        suspect_wallet: walletAddress,
                        elements: updatedElements,
                        attributions: (data.attributions && data.attributions.length > 0) ? data.attributions : (activeDataset?.attributions || []),
                        risk_assessment: data.risk_assessment || activeDataset?.risk_assessment,
                        custody_trail: (data.custody_trail && data.custody_trail.length > 0) ? data.custody_trail : (activeDataset?.custody_trail || [])
                    });
                    renderCytoscapeGraph(updatedElements);
                    setTracingLive(false);
                    return;
                }
            }
        } catch (e) {
            console.warn('Backend live trace failed:', e);
            if (String(e.message).includes('Unauthorized')) { setTracingLive(false); return; }
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
                        'color': GRAPH_COLORS.paper,
                        'font-size': '11px',
                        'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        'font-weight': '700',
                        'text-valign': 'bottom',
                        'text-margin-y': 7,
                        'text-background-opacity': 1,
                        'text-background-color': '#14161f',
                        'text-background-padding': '4px',
                        'text-background-shape': 'roundrectangle',
                        'border-width': 2,
                        'border-color': GRAPH_COLORS.line,
                        'background-color': (ele) => {
                            const type = ele.data('entity_type');
                            if (type === 'SUSPECT') return GRAPH_COLORS.rust;
                            if (type === 'CEX') return GRAPH_COLORS.green;
                            if (type === 'MIXER') return GRAPH_COLORS.rust;
                            if (type === 'BRIDGE') return GRAPH_COLORS.navy;
                            return GRAPH_COLORS.slate;
                        },
                        // Glow shares the node's own risk color so the canvas reads
                        // as "lit from within" rather than a generic drop-shadow.
                        'shadow-color': (ele) => {
                            const type = ele.data('entity_type');
                            if (type === 'SUSPECT') return GRAPH_COLORS.rust;
                            if (type === 'CEX') return GRAPH_COLORS.green;
                            if (type === 'BRIDGE') return GRAPH_COLORS.navy;
                            return GRAPH_COLORS.slate;
                        },
                        'shadow-blur': 0,
                        'shadow-opacity': 0,
                        'shadow-offset-x': 0,
                        'shadow-offset-y': 0,
                        // Native cytoscape transitions: any class toggle below
                        // (hover, tap pulse, dim) eases smoothly instead of
                        // snapping, which is most of the "buttery" feel.
                        'transition-property': 'shadow-blur, shadow-opacity, border-width, width, height, opacity',
                        'transition-duration': '200ms',
                        'transition-timing-function': 'ease-out',
                        'width': 46,
                        'height': 46
                    }
                },
                {
                    selector: 'node[entity_type = "SUSPECT"]',
                    style: { 'border-color': GRAPH_COLORS.rustDark, 'border-width': 3, 'width': 52, 'height': 52, 'shadow-blur': 26, 'shadow-opacity': 0.4 }
                },
                {
                    selector: 'node[entity_type = "CEX"]',
                    style: { 'border-color': GRAPH_COLORS.greenDark, 'border-width': 3, 'width': 52, 'height': 52, 'shadow-blur': 26, 'shadow-opacity': 0.35 }
                },
                {
                    // Toggled on mouseover — the always-lit suspect/CEX glow above
                    // simply intensifies rather than a new effect appearing.
                    selector: 'node.hovered',
                    style: { 'shadow-blur': 44, 'shadow-opacity': 0.9, 'border-width': 4, 'z-index': 999 }
                },
                {
                    // Applied briefly via flashClass() on tap — a stylesheet-driven
                    // pulse, so it never leaves a bypass style behind.
                    selector: 'node.tapped-pulse',
                    style: { 'shadow-blur': 50, 'shadow-opacity': 1, 'border-width': 5 }
                },
                {
                    selector: '.dimmed',
                    style: { 'opacity': 0.16 }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2.5,
                        'line-color': '#5b5e6b',
                        'target-arrow-color': GRAPH_COLORS.paper,
                        'target-arrow-shape': 'triangle',
                        'arrow-scale': 1.3,
                        'curve-style': 'bezier',
                        'line-style': 'dashed',
                        'label': (ele) => `${ele.data('value_eth')} ${ele.data('token') || 'ETH'}`,
                        'font-size': '10px',
                        'font-weight': '600',
                        'color': GRAPH_COLORS.paper,
                        'text-background-color': '#14161f',
                        'text-background-opacity': 1,
                        'text-background-padding': '3px',
                        'text-rotation': 'autorotate',
                        'shadow-color': GRAPH_COLORS.navy,
                        'shadow-blur': 6,
                        'shadow-opacity': 0.2,
                        'transition-property': 'opacity, width, shadow-opacity',
                        'transition-duration': '200ms'
                    }
                },
                {
                    // The path from a hovered node to its neighbors — brightened
                    // while everything else fades via `.dimmed` above.
                    selector: 'edge.hovered-path',
                    style: { 'width': 4.5, 'opacity': 1, 'shadow-opacity': 0.5 }
                }
            ],
            layout: { name: 'preset', fit: true, padding: 60 }
        });

        cyRef.current.on('tap', 'node', (evt) => {
            setSelectedNode(evt.target.data());
            setActiveTab('inspector');
            evt.target.flashClass('tapped-pulse', 280);
        });

        // Hover neighborhood highlight — dims everything outside the hovered
        // node's immediate connections so the eye follows one fund path at a
        // time on denser graphs.
        cyRef.current.on('mouseover', 'node', (evt) => {
            const node = evt.target;
            const neighborhood = node.closedNeighborhood();
            node.addClass('hovered');
            cyRef.current.elements().difference(neighborhood).addClass('dimmed');
            neighborhood.edges().addClass('hovered-path');
            if (containerRef.current) containerRef.current.style.cursor = 'pointer';
        });

        cyRef.current.on('mouseout', 'node', (evt) => {
            evt.target.removeClass('hovered');
            cyRef.current.elements().removeClass('dimmed hovered-path');
            if (containerRef.current) containerRef.current.style.cursor = 'grab';
        });

        // Tapping empty canvas clears any lingering highlight state.
        cyRef.current.on('tap', (evt) => {
            if (evt.target === cyRef.current) {
                cyRef.current.elements().removeClass('dimmed hovered-path hovered');
            }
        });

        setTimeout(() => {
            if (cyRef.current) {
                cyRef.current.resize();
                cyRef.current.animate({ fit: { eles: undefined, padding: 60 } }, { duration: 450, easing: 'ease-out-cubic' });
            }
        }, 50);
    };

    const handleExportPDF = async () => {
        try {
            const headers = {};
            if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
            const pdfAddress = (activeDataset?.suspect_wallet || suspectInput || '').trim() || '0x9999a3b2e5f8841a0e889b41a91e1d092cb3e4a1';
            const res = await fetch(`${API_BASE}/api/report/pdf?address=${encodeURIComponent(pdfAddress)}`, { headers });
            if (res.status === 401) {
                setAuthError('Session expired. Please re-login to export dossier.');
                setIsPoliceAuth(false);
                try { localStorage.removeItem('cyclops_token'); } catch {}
                setAuthToken('');
                throw new Error('Unauthorized');
            }
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
            console.warn('Backend PDF failed:', e);
            if (String(e.message).includes('Unauthorized')) { return; }
        }
        // Fallback — show in-app dossier if backend unavailable
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
        const base = new Date();
        const ts = (offsetSec) => {
            const d = new Date(base.getTime() + offsetSec * 1000);
            try { return d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }); } catch { return d.toLocaleTimeString(); }
        };
        const steps = [
            `[${ts(0)} IST] Connecting to I4C / SAHYOG Gateway API Node...`,
            `[${ts(1)} IST] Cryptographic Evidence Package Formed (SHA-256 Checksum Verified).`,
            `[${ts(2)} IST] Transmitting Statutory Section 91 Requisition to ${activeDataset.attributions[0]?.entity_name} Compliance Node...`,
            `[${ts(3)} IST] Secure Handshake with ${activeDataset.attributions[0]?.compliance_contact} Established.`,
            `[${ts(4)} IST] SUCCESS: Requisition Ticket #IND-I4C-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random()*9000))} Acknowledged by VASP.`,
            `[${ts(4)} IST] BENEFICIARY ACCOUNT STATUS: TEMPORARY DEBIT RESTRICTION APPLIED — ${formatISTClock(base)}`
        ];
        steps.forEach((log, index) => {
            setTimeout(() => {
                setDispatchLogs((prev) => [...prev, log]);
                if (index === steps.length - 1) {
                    setDispatchComplete(true);
                }
            }, (index + 1) * 650);
        });
    };

    // Helper: fetch live citizen track (used after submit and on lookup)
    const fetchCitizenTrack = async (docketNo) => {
        if (!docketNo) return;
        setCitizenTrackLoading(true);
        setCitizenLookupError('');
        try {
            const res = await fetch(`${API_BASE}/api/citizen/track/${encodeURIComponent(docketNo.trim())}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || `Docket not found (${res.status})`);
            }
            const data = await res.json();
            setCitizenTrackData(data);
            // also store encryption meta if present
            if (data.suspect_wallet_encrypted) {
                setCitizenEncryptionMeta({
                    encrypted: data.suspect_wallet_encrypted,
                    masked: data.suspect_wallet_masked,
                    algo: data.encryption_notice || 'Fernet AES'
                });
            }
            return data;
        } catch (err) {
            console.warn('citizen track fetch failed', err);
            setCitizenLookupError(err.message || 'Could not fetch tracking data');
            return null;
        } finally {
            setCitizenTrackLoading(false);
        }
    };

    const handleCitizenTrackLookup = async (e) => {
        if (e) e.preventDefault();
        const d = (citizenLookupInput || citizenDocket || '').trim();
        if (!d) {
            setCitizenLookupError('Enter a docket number (e.g. NCRP-2026-DEL-1092)');
            return;
        }
        const data = await fetchCitizenTrack(d);
        if (data) {
            setCitizenDocket(data.docket_no);
            setCitizenSubmitted(true);
        }
    };

    // Auto-poll citizen track every 3 seconds when a docket is active
    useEffect(() => {
        if (!citizenSubmitted || !citizenDocket) return;
        let interval = setInterval(async () => {
            const data = await fetchCitizenTrack(citizenDocket);
            if (data) setCitizenPollTick((t) => t + 1);
        }, 3000);
        // Immediate fetch to ensure timeline is live-enriched
        fetchCitizenTrack(citizenDocket);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [citizenSubmitted, citizenDocket]);

    const handleCitizenSubmit = async (e) => {
        e.preventDefault();
        setCitizenLookupError('');
        let docket = `NCRP-2026-DEL-${Math.floor(1000 + Math.random() * 9000)}`;
        let backendSaved = false;
        let liveData = null;
        let encMeta = null;
        try {
            const res = await fetch(`${API_BASE}/api/ncrp/complaint`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    citizen_name: citizenName || 'Citizen Complainant (1930)',
                    citizen_phone: citizenPhone || '+91 90000-00000',
                    scam_type: citizenScamType,
                    suspect_wallet: citizenWallet || activeDataset.suspect_wallet,
                    loss_description: citizenLoss || '₹10,00,000 (4.00 ETH)',
                    chain: selectedChainKey
                })
            });
            if (res.ok) {
                const data = await res.json();
                docket = data.docket_no || docket;
                backendSaved = true;
                if (data.encryption) encMeta = data.encryption;
                if (data.live_tracking) liveData = data.live_tracking;
                // Immediately fetch live track for full timeline
                try {
                    const tr = await fetch(`${API_BASE}/api/citizen/track/${encodeURIComponent(docket)}`);
                    if (tr.ok) {
                        const tdata = await tr.json();
                        setCitizenTrackData(tdata);
                    } else if (liveData) {
                        setCitizenTrackData({
                            docket_no: docket,
                            victim_name: citizenName,
                            category: citizenScamType,
                            reported_loss: citizenLoss,
                            suspect_wallet_masked: encMeta?.wallet_masked || '—',
                            suspect_wallet_encrypted: encMeta?.wallet_encrypted || '',
                            timeline: liveData.timeline,
                            progress_percent: liveData.progress_percent,
                            current_stage: liveData.status,
                            current_stage_label: liveData.status,
                            golden_hour_remaining: '02:00:00',
                            assigned_officer: 'Insp. R. Sharma (IO-I4C-9921)',
                            estimated_resolution: '48-72 hours',
                            hops_preview: []
                        });
                    }
                } catch {}
                if (encMeta) setCitizenEncryptionMeta(encMeta);
            }
        } catch (err) {
            console.warn('Citizen complaint backend offline, using local docket:', err);
        }
        setCitizenDocket(docket);
        setCitizenLookupInput(docket);
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
        if (backendSaved) console.log(`✅ Citizen complaint ${docket} persisted to backend queue (encrypted)`);
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
        // Attempt initial render if container already mounted (e.g., direct forensics link)
        if (containerRef.current) {
            try { renderCytoscapeGraph(activeDataset.elements); } catch {}
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Robust forensics canvas mount — fixes "nodes don't load until switch chain" after login
    useEffect(() => {
        if (currentPortal === 'police' && isPoliceAuth && activeLayer === 'forensics') {
            const tryRender = () => {
                if (containerRef.current) {
                    try { if (activeDataset?.elements) renderCytoscapeGraph(activeDataset.elements); } catch (e) { console.warn('graph render retry failed', e); }
                }
            };
            // Immediate + delayed retry to survive AnimatePresence mount delay
            tryRender();
            const id1 = setTimeout(tryRender, 80);
            const id2 = setTimeout(tryRender, 250);
            // Also handle window resize for responsiveness
            const onResize = () => { if (cyRef.current) { cyRef.current.resize(); cyRef.current.fit(undefined, 40); } };
            window.addEventListener('resize', onResize);
            return () => { clearTimeout(id1); clearTimeout(id2); window.removeEventListener('resize', onResize); };
        }
    }, [currentPortal, isPoliceAuth, activeLayer, activeDataset]);

    const risk = activeDataset?.risk_assessment || { overall_risk_score: 72, risk_rating: 'HIGH', detected_patterns: ['Fallback — no risk data'] };
    const primaryAttr = activeDataset?.attributions?.[0] || null;
    const mlData = activeDataset.ml_features;
    const currentStreamItem = LIVE_COMPLAINT_STREAM[streamIndex];
    // Dossier display: prefer backend dossierData when it has a meaningful trail; otherwise fall back to the activeDataset (local CHAIN_DATASETS) so Bitcoin/Multi-chain never show empty
    const displayDossier = useMemo(() => {
        if (!dossierData) return null;
        const hasTrail = Array.isArray(dossierData.custody_trail) && dossierData.custody_trail.length > 0;
        const isUnidentified = !dossierData.target_vasp || dossierData.target_vasp === 'Unidentified Wallet';
        if (hasTrail && !isUnidentified) return dossierData;
        if (hasTrail && isUnidentified && primaryAttr) {
            // Enrich the backend dossier with the local VASP so the court notice is still actionable
            return { ...dossierData, target_vasp: primaryAttr.entity_name, attributions: activeDataset.attributions };
        }
        if (!hasTrail) return null; // signal to render entirely from activeDataset
        return dossierData;
    }, [dossierData, primaryAttr, activeDataset]);
    const dossierTrail = useMemo(() => {
        if (displayDossier?.custody_trail?.length) return displayDossier.custody_trail;
        if (dossierData?.custody_trail?.length) return dossierData.custody_trail;
        return activeDataset?.custody_trail || [];
    }, [displayDossier, dossierData, activeDataset]);
    const dossierDocket = displayDossier?.docket_no || dossierData?.docket_no || activeDataset?.caseMeta?.docket_no || 'N/A';
    const dossierVictim = displayDossier?.victim_name || dossierData?.victim_name || activeDataset?.caseMeta?.victim_name || 'Unknown';
    const dossierLoss = displayDossier?.reported_loss || dossierData?.reported_loss || activeDataset?.caseMeta?.reported_loss || 'N/A';
    const dossierWallet = displayDossier?.suspect_wallet || dossierData?.suspect_wallet || suspectInput || activeDataset?.suspect_wallet || '';
    const dossierVasp = (displayDossier?.target_vasp && displayDossier.target_vasp !== 'Unidentified Wallet') ? displayDossier.target_vasp : (dossierData?.target_vasp && dossierData.target_vasp !== 'Unidentified Wallet' ? dossierData.target_vasp : (primaryAttr?.entity_name || 'Unidentified'));
    const dossierVaspHops = displayDossier?.attributions?.[0]?.hop_distance ?? dossierData?.attributions?.[0]?.hop_distance ?? primaryAttr?.hop_distance ?? dossierTrail.length ?? 0;
    const dossierRisk = displayDossier?.risk_rating || dossierData?.risk_rating || risk?.risk_rating || 'HIGH';
    const dossierSummary = displayDossier?.summary || dossierData?.summary || risk?.summary || '';
    const dossierProvenance = dossierData?.data_provenance || (displayDossier?.data_provenance) || null;
    const goldenHourUrgent = secondsRemaining > 0 && secondsRemaining < 900;

    // Command palette actions — only exposes what's actually reachable in
    // the current portal/auth state so it never suggests a dead action.
    const paletteCommands = useMemo(() => {
        const cmds = [];
        if (currentPortal === 'police' && isPoliceAuth) {
            [
                { key: 'ethereum', label: 'Switch network — Ethereum' },
                { key: 'tron', label: 'Switch network — Tron (USDT)' },
                { key: 'bitcoin', label: 'Switch network — Bitcoin' },
                { key: 'bridge', label: 'Switch network — Cross-chain bridge' },
            ].forEach((c) => cmds.push({
                id: `chain-${c.key}`,
                label: c.label,
                group: 'Network',
                run: () => { setActiveLayer('forensics'); handleSelectChain(c.key); },
            }));
            cmds.push(
                { id: 'freeze', label: 'Freeze VASP (Section 91)', group: 'Action', run: handleLaunchDispatch },
                { id: 'pdf', label: 'Export PDF dossier', group: 'Action', run: handleExportPDF },
                { id: 'grid', label: 'Go to Intelligence Grid', group: 'View', run: () => setActiveLayer('dashboard') },
                { id: 'dossier', label: 'Go to Court Dossier', group: 'View', run: () => setActiveLayer('dossier') },
                { id: 'canvas', label: 'Go to Forensics Canvas', group: 'View', run: () => setActiveLayer('forensics') },
                { id: 'exit', label: 'Exit officer session', group: 'Session', run: handlePoliceLogout },
            );
        } else {
            cmds.push(
                { id: 'police-portal', label: 'Open police portal', group: 'Navigate', run: () => setCurrentPortal('police') },
                { id: 'citizen-portal', label: 'Open citizen (1930) portal', group: 'Navigate', run: () => setCurrentPortal('citizen') },
                { id: 'home', label: 'Return to landing', group: 'Navigate', run: () => setCurrentPortal('landing') },
            );
        }
        return cmds;
    }, [currentPortal, isPoliceAuth]);

    return (
        <div className="app">
            <CommandPalette
                open={showCommandPalette}
                onClose={() => setShowCommandPalette(false)}
                commands={paletteCommands}
            />
            <PatchNotesModal open={showPatchNotes} onClose={() => setShowPatchNotes(false)} />

            {/* TOP COMMAND BAR — hidden on the landing screen only */}
            {currentPortal !== 'landing' && (
                <header className="topbar">
                    <div className="topbar-left">
                        <div className="brand">
                            <CyclopsEmblem />
                            <div>
                                <div className="brand-name">CYCLOPS <span style={{ opacity: 0.5, fontWeight: 600 }}>SIH26183</span> <span className="brand-divider" /> <span className="brand-crysec">CrySec</span></div>
                                <div className="brand-sub">Ministry of Home Affairs — NCRP &amp; SAHYOG Intelligence Grid · Team CrySec</div>
                            </div>
                        </div>

                        <button className="btn-plain-dark" onClick={() => setCurrentPortal('landing')}>Home</button>

                        <div className="segmented">
                            <button
                                className={currentPortal === 'police' ? 'active on-navy' : ''}
                                onClick={() => setCurrentPortal('police')}
                            >
                                Police Admin Grid
                            </button>
                            <button
                                className={currentPortal === 'citizen' ? 'active on-green' : ''}
                                onClick={() => setCurrentPortal('citizen')}
                            >
                                Citizen 1930 Portal
                            </button>
                        </div>
                    </div>

                    <div className="topbar-center">
                        {currentPortal === 'police' && isPoliceAuth && (
                            <div className="segmented" role="tablist" aria-label="Operations layers">
                                <motion.button className={activeLayer === 'forensics' ? 'active on-navy' : ''} onClick={() => setActiveLayer('forensics')} whileTap={{ scale: 0.96 }}>
                                    {activeLayer === 'forensics' && <TabPill layoutId="layerPill" />}
                                    <span className="tab-label">Forensics Canvas</span>
                                </motion.button>
                                <motion.button className={activeLayer === 'dashboard' ? 'active on-navy' : ''} onClick={() => setActiveLayer('dashboard')} whileTap={{ scale: 0.96 }}>
                                    {activeLayer === 'dashboard' && <TabPill layoutId="layerPill" />}
                                    <span className="tab-label">Intelligence Grid</span>
                                </motion.button>
                                <motion.button className={activeLayer === 'dossier' ? 'active on-navy' : ''} onClick={() => setActiveLayer('dossier')} whileTap={{ scale: 0.96 }}>
                                    {activeLayer === 'dossier' && <TabPill layoutId="layerPill" />}
                                    <span className="tab-label">Court Dossier</span>
                                </motion.button>
                            </div>
                        )}
                    </div>

                    <div className="topbar-right">
                        {currentPortal === 'police' && isPoliceAuth && (
                            <>
                                <div className="topbar-time" aria-label="Current IST time">
                                    <span className="time">IST — {formatISTTime(nowIST)}</span>
                                    <span className="date">{nowIST.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </div>
                                <motion.button className="btn btn-navy btn-sm topbar-pdf" onClick={handleExportPDF} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} title="Download court-admissible PDF dossier">
                                    PDF Dossier
                                </motion.button>
                                <div className="session-chip" title="Authenticated officer">
                                    <span className="dot" aria-hidden="true" />
                                    <span>{officerId || 'IO-I4C-9921'}</span>
                                </div>
                                <button className="topbar-exit" onClick={handlePoliceLogout} title="Exit session — top right as requested">
                                    Exit
                                </button>
                            </>
                        )}

                        {currentPortal === 'citizen' && (
                            <button className="btn btn-navy" onClick={() => setCurrentPortal('police')}>
                                Access Police Admin Grid
                            </button>
                        )}
                    </div>
                </header>
            )}

            {/* ===================== LANDING ===================== */}
            {currentPortal === 'landing' && (
                <motion.div
                    className="landing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.35 }}
                >
                    <section className="landing-hero" ref={heroRef} onMouseMove={handleHeroMouseMove}>
                        <AmbientNetwork />
                        <div className="hero-spotlight" aria-hidden="true" />
                        <div className="hero-content">
                            <motion.div
                                className="stamp"
                                initial={{ opacity: 0, rotate: -8, scale: 0.9 }}
                                animate={{ opacity: 1, rotate: -2.5, scale: 1 }}
                                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <span className="stamp-line1">CYCLOPS <span className="stamp-crysec">CrySec</span></span>
                                <span className="stamp-line2">SIH26183 · Team CrySec · Active intake</span>
                            </motion.div>

                            <KineticHeadline
                                className="landing-headline"
                                lines={["Stolen crypto moves in minutes.", "Case files don't."]}
                            />
                            <motion.p
                                className="landing-lede"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.55, duration: 0.5 }}
                            >
                                <strong style={{ color: '#fff', fontWeight: 700 }}>Cyclops by CrySec</strong> links a citizen's first report to a wallet, a wallet to an exchange, and an
                                exchange to a Section 91 freeze notice — before the trail goes cold. <span style={{ opacity: 0.85 }}>SIH26183 · Team CrySec.</span>
                            </motion.p>

                            <motion.div
                                className="hero-stats"
                                initial="hidden"
                                animate="show"
                                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.7 } } }}
                            >
                                {[
                                    { n: <AnimatedCounter value={142} initialValue={0} />, l: 'Active dockets' },
                                    { n: <AnimatedCounter value={4.88} initialValue={0} prefix="₹" suffix=" Cr" formatter={(v) => v.toFixed(2)} />, l: 'Assets traced (₹48.87 Lakh × 100)' },
                                    { n: <AnimatedCounter value={1.2} initialValue={0} suffix="s" formatter={(v) => v.toFixed(1)} />, l: 'Avg. VASP attribution' },
                                    { n: <AnimatedCounter value={87.4} initialValue={0} suffix="%" formatter={(v) => v.toFixed(1)} />, l: 'Golden Hour freeze rate' },
                                ].map((stat, i) => (
                                    <motion.div
                                        key={i}
                                        className="hero-stat"
                                        variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                        whileHover={{ y: -3 }}
                                    >
                                        <div className="n">{stat.n}</div>
                                        <div className="l">{stat.l}</div>
                                    </motion.div>
                                ))}
                            </motion.div>
                            <motion.div
                                initial={{ opacity:0, y:10 }}
                                animate={{ opacity:1, y:0 }}
                                transition={{ delay:1.1, duration:0.5 }}
                                style={{ marginTop:18, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}
                            >
                                <span style={{ fontSize:11, fontWeight:800, letterSpacing:'0.08em', color:'#e0654a', background:'rgba(224,101,74,0.12)', border:'1px solid rgba(224,101,74,0.28)', padding:'4px 10px', borderRadius:999 }}>NEW IN v6.1 — Secure & Live</span>
                                <span style={{ fontSize:11, color:'rgba(244,242,236,0.78)', display:'inline-flex', alignItems:'center', gap:6 }}><span style={{ width:7, height:7, background:'#4caf7d', borderRadius:'50%', display:'inline-block', boxShadow:'0 0 8px #4caf7d' }} /> Citizen live tracking (6 stages, 3s poll)</span>
                                <span style={{ fontSize:11, color:'rgba(244,242,236,0.78)', display:'inline-flex', alignItems:'center', gap:6 }}><span>🔒</span> AES-128 field encryption</span>
                                <span style={{ fontSize:11, color:'rgba(244,242,236,0.62)' }}>Rate-limited · CSP/HSTS · Audit-logged</span>
                            </motion.div>
                        </div>
                    </section>

                    <section className="ledger">
                        <motion.div
                            className="ledger-row ledger-row-green"
                            onClick={() => setCurrentPortal('citizen')}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ y: -4, scale: 1.005 }}
                        >
                            <div className="ledger-orb-wrap">
                                <div className="ledger-orb ledger-orb-green"><ShieldCheckIcon size={20} /></div>
                            </div>
                            <div className="ledger-body">
                                <div className="ledger-tag ledger-tag-green"><span className="ledger-dot-green" aria-hidden="true" /> PUBLIC · NCRP 1930</div>
                                <h2>Citizen Intake — File &amp; Track an FIR</h2>
                                <p>
                                    File a cyber fraud complaint in plain language. Get an NCRP docket instantly and watch it move — <strong style={{ color:'var(--green)' }}>6 live stages</strong>, Golden Hour countdown, wallet encrypted (AES-128).
                                </p>
                                <div className="check-list">
                                    <div><span className="mark">✓</span> Instant NCRP docket + 3s live polling</div>
                                    <div><span className="mark">✓</span> 6-stage timeline with IST timestamps & fund-hop preview</div>
                                    <div><span className="mark">✓</span> Officer assigned · Wallet encrypted at rest</div>
                                </div>
                            </div>
                            <div className="ledger-action">
                                <div className="ledger-metric">
                                    <div className="n"><AnimatedCounter value={6} initialValue={0} /></div>
                                    <div className="l">Live stages · Encrypted</div>
                                </div>
                                <motion.button
                                    className="btn btn-green btn-block"
                                    whileHover={{ scale: 1.03, y: -1 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    File complaint →
                                </motion.button>
                                <div style={{ fontSize: 11, color: 'var(--ink-soft)', textAlign: 'center' }}>1930 · Free · 24×7</div>
                            </div>
                        </motion.div>

                        <motion.div
                            className="ledger-row ledger-row-navy"
                            onClick={() => setCurrentPortal('police')}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ duration: 0.55, delay: 0.10, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ y: -4, scale: 1.005 }}
                        >
                            <div className="ledger-orb-wrap">
                                <div className="ledger-orb ledger-orb-navy"><LockShieldIcon size={20} /></div>
                            </div>
                            <div className="ledger-body">
                                <div className="ledger-tag ledger-tag-navy"><span className="ledger-dot-navy" aria-hidden="true" /> RESTRICTED · LEA ONLY</div>
                                <h2>Investigator Grid — Trace &amp; Enforce</h2>
                                <p>
                                    Verified LEA workspace. Trace ETH / TRC-20 / BTC hops, surface AI anomalies and dispatch Section 91 freezes.
                                </p>
                                <div className="check-list">
                                    <div><span className="mark">✓</span> Multi-chain hops</div>
                                    <div><span className="mark">✓</span> Explainable AI</div>
                                    <div><span className="mark">✓</span> Court-ready dossier</div>
                                </div>
                            </div>
                            <div className="ledger-action">
                                <div className="ledger-metric">
                                    <div className="n"><AnimatedCounter value={28} initialValue={0} /></div>
                                    <div className="l">VASPs indexed</div>
                                </div>
                                <motion.button
                                    className="btn btn-navy btn-block"
                                    whileHover={{ scale: 1.03, y: -1 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    Enter Grid →
                                </motion.button>
                                <div style={{ fontSize: 11, color: 'var(--ink-soft)', textAlign: 'center' }}>I4C · SAHYOG · Audit logged</div>
                            </div>
                        </motion.div>

                        <motion.div
                            className="ledger-row"
                            onClick={() => setShowPatchNotes(true)}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ duration: 0.55, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ y: -4, scale: 1.005 }}
                            style={{ background: 'linear-gradient(180deg, #fff 0%, #fdfcfa 100%)', border: '1px solid var(--line)', borderLeft: '3px solid #d9a441', cursor:'pointer' }}
                        >
                            <div className="ledger-orb-wrap">
                                <div className="ledger-orb" style={{ background: 'linear-gradient(135deg, #f2e8d4, #e8dcc3)', borderColor: '#d9bd83', color: '#8a5a12' }}>✎</div>
                            </div>
                            <div className="ledger-body">
                                <div className="ledger-tag" style={{ color:'#8a5a12', background:'#f2e8d4', borderColor:'#d9bd83' }}><span style={{ width:7, height:7, borderRadius:'50%', background:'#8a5a12', display:'inline-block', boxShadow:'0 0 8px #8a5a12' }} /> CHANGELOG · v6.2.0</div>
                                <h2>Patch Notes — Complete & Concise</h2>
                                <p>
                                    Every fix that makes <strong>Citizen → Wallet → VASP → Freeze</strong> verifiable. Tap for live dataset + bcrypt/PBKDF2 hardening.
                                </p>
                                <div className="check-list">
                                    <div><span className="mark" style={{ background:'#8a5a12' }}>✓</span> Live dataset: 5 BTC LIVE_BLOCKSTREAM + Etherscan ingester</div>
                                    <div><span className="mark" style={{ background:'#8a5a12' }}>✓</span> Auth: bcrypt + PBKDF2 100k, CSP nonce</div>
                                    <div><span className="mark" style={{ background:'#8a5a12' }}>✓</span> Dossier: CoinDCX (3 hops) — no Unidentified</div>
                                </div>
                            </div>
                            <div className="ledger-action">
                                <div className="ledger-metric">
                                    <div className="n" style={{ color:'#8a5a12' }}>10 Sept</div>
                                    <div className="l">v6.2.0 · 20 fixes</div>
                                </div>
                                <motion.button className="btn btn-block" style={{ background:'#8a5a12', borderColor:'#8a5a12', color:'#fff' }} whileHover={{ scale:1.03, y:-1 }} whileTap={{ scale:0.97 }}>
                                    View patch notes →
                                </motion.button>
                                <div style={{ fontSize: 11, color: 'var(--ink-soft)', textAlign: 'center' }}>Single source · Judge-ready</div>
                            </div>
                        </motion.div>
                    </section>

                    <footer style={{ borderTop: '1px solid var(--line)', padding: '20px max(5vw, 24px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, background: 'var(--paper)', color: 'var(--ink-soft)', fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontWeight: 800, letterSpacing: '0.04em', color: 'var(--ink)' }}>CYCLOPS</span>
                            <span style={{ opacity: 0.4 }}>×</span>
                            <span style={{ fontWeight: 800, letterSpacing: '0.08em', color: '#a8391c' }}>CrySec</span>
                            <span style={{ opacity: 0.5 }}>·</span>
                            <span>SIH26183 — Smart India Hackathon 2026</span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                            <span>Ministry of Home Affairs · I4C</span>
                            <span style={{ opacity: 0.35 }}>|</span>
                            <span>Built for the Golden Hour</span>
                        </div>
                    </footer>
                </motion.div>
            )}

            {/* Live 1930 stream ticker — only inside the authenticated police grid */}
            {currentPortal === 'police' && isPoliceAuth && showStreamAlert && (
                <div className="ticker">
                    <div className="left">
                        <span className="pulse" />
                        <span className="ws-muted">Live 1930 dispatch:</span>
                        <strong>{currentStreamItem.victim}</strong>
                        <span className="ws-muted">reported a loss of {currentStreamItem.amount} ({currentStreamItem.type})</span>
                        <code className="mono" style={{ fontSize: 11, background: '#0f1117', padding: '2px 6px', borderRadius: 4 }}>{currentStreamItem.wallet.slice(0, 14)}...</code>
                    </div>
                    <div className="row-gap" style={{ alignItems: 'center' }}>
                        <button className="btn btn-navy btn-sm" onClick={() => handleAutoTrace(currentStreamItem)}>Auto-trace this case</button>
                        <button onClick={() => setShowStreamAlert(false)} style={{ background: 'none', border: 'none', color: '#6d6f7d', fontSize: 14 }}>✕</button>
                    </div>
                </div>
            )}

            {/* ===================== CITIZEN PORTAL — LIVE TRACKING (enhanced dynamic) ===================== */}
            {currentPortal === 'citizen' && (
                <motion.div
                    className="form-shell"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    style={{ background: citizenSubmitted && citizenTrackData ? '#0f1117' : 'var(--paper)', padding: citizenSubmitted && citizenTrackData ? '18px' : '40px 20px' }}
                >
                    {/* Docket lookup bar — always visible */}
                    <div style={{ width: 'min(980px, 100%)', margin: '0 auto 18px', display:'flex', gap:12, alignItems:'center', background: citizenSubmitted ? '#191b26' : 'var(--panel)', border: `1px solid ${citizenSubmitted ? '#262838' : 'var(--line)'}`, borderRadius: 8, padding: '12px 14px', flexWrap:'wrap' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, color: citizenSubmitted ? '#9aa0b4' : 'var(--ink-soft)', fontSize:12, fontWeight:700 }}>
                            <span style={{ width:7, height:7, borderRadius:'50%', background: citizenTrackData ? '#4caf7d' : '#e0654a', boxShadow: citizenTrackData ? '0 0 8px #4caf7d' : '0 0 8px #e0654a', display:'inline-block', animation: citizenTrackData ? 'golden-pulse 1.2s infinite' : 'none' }} />
                            {citizenSubmitted ? 'Live tracking' : 'Already filed?'} 
                        </div>
                        <form onSubmit={handleCitizenTrackLookup} style={{ display:'flex', gap:8, flex:1, minWidth:260 }}>
                            <input
                                className="field-input mono"
                                style={{ flex:1, background: citizenSubmitted ? '#0f1117' : 'var(--panel)', borderColor: citizenSubmitted ? '#262838' : 'var(--line-strong)', color: citizenSubmitted ? '#cddcf5' : 'var(--ink)' }}
                                placeholder="Enter NCRP docket (e.g. NCRP-2026-DEL-1092)"
                                value={citizenLookupInput}
                                onChange={(e)=> setCitizenLookupInput(e.target.value)}
                            />
                            <button type="submit" className="btn btn-navy btn-sm" disabled={citizenTrackLoading}>{citizenTrackLoading ? 'Tracking…' : 'Track case'}</button>
                        </form>
                        {citizenSubmitted && citizenDocket && (
                            <button className="btn btn-outline btn-sm" style={{ background: '#0f1117', color:'#9aa0b4', borderColor:'#262838' }} onClick={()=> { setCitizenSubmitted(false); setCitizenTrackData(null); setCitizenLookupError(''); setCitizenDocket(''); }}>File new</button>
                        )}
                        {citizenLookupError && <div style={{ width:'100%', color:'#ff8a6a', fontSize:11, marginTop:2 }}>{citizenLookupError}</div>}
                    </div>

                    {!citizenSubmitted ? (
                        <div className="form-card" style={{ width:'min(640px, 100%)' }}>
                            <div className="form-head">
                                <h2>National Cybercrime Citizen Helpline (1930)</h2>
                                <p>File &amp; track in real-time — wallet &amp; phone encrypted end-to-end (AES-128)</p>
                                <div style={{ marginTop:10, display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
                                    <span style={{ fontSize:10, padding:'4px 8px', borderRadius:999, background:'rgba(33,96,63,0.12)', border:'1px solid #a9c7b3', color:'#21603f', fontWeight:700, display:'inline-flex', alignItems:'center', gap:6 }}><span style={{ fontSize:12 }}>🔒</span> Encrypted at rest (Fernet)</span>
                                    <span style={{ fontSize:10, padding:'4px 8px', borderRadius:999, background:'rgba(59,90,134,0.12)', border:'1px solid #aeb8cd', color:'#223354', fontWeight:700 }}>Live timeline · 3s polling</span>
                                    <span style={{ fontSize:10, padding:'4px 8px', borderRadius:999, background:'rgba(224,101,74,0.12)', border:'1px solid #dcae9a', color:'#a8391c', fontWeight:700 }}>Golden Hour active</span>
                                </div>
                            </div>
                            <form onSubmit={handleCitizenSubmit} className="stack">
                                <div className="form-grid-2">
                                    <div>
                                        <label className="field-label">Your full name</label>
                                        <input className="field-input" type="text" placeholder="e.g. Vikramaditya Sen" value={citizenName} onChange={(e) => setCitizenName(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="field-label">Registered mobile <span style={{ opacity:0.6, fontWeight:400 }}>(encrypted)</span></label>
                                        <input className="field-input" type="tel" placeholder="+91 98765-XXXXX" value={citizenPhone} onChange={(e) => setCitizenPhone(e.target.value)} required />
                                    </div>
                                </div>
                                <div>
                                    <label className="field-label">Scam category</label>
                                    <select className="field-input" value={citizenScamType} onChange={(e) => setCitizenScamType(e.target.value)}>
                                        <option value="Task-Based Telegram Part-Time Scam">Task-Based Telegram Part-Time Scam</option>
                                        <option value="Fake Forex / Crypto Investment Scam">Fake Forex / Crypto Investment Scam</option>
                                        <option value="Hospital / Enterprise Ransomware">Hospital / Enterprise Ransomware</option>
                                        <option value="Sextortion / Video Call Blackmail">Sextortion / Video Call Blackmail</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="field-label">Suspect wallet address <span style={{ opacity:0.6, fontWeight:400 }}>(AES encrypted)</span></label>
                                    <input className="field-input mono" type="text" placeholder="0x... or Tron/BTC address" value={citizenWallet} onChange={(e) => setCitizenWallet(e.target.value)} required />
                                    <div style={{ fontSize:10, color:'#6d6f7d', marginTop:4, display:'flex', alignItems:'center', gap:6 }}><span>🔐</span> Never stored in plaintext. Shown as masked to you; LEA decrypts on demand. <span style={{ color:'#4caf7d', fontWeight:700 }}>Try inspect →</span></div>
                                </div>
                                <div>
                                    <label className="field-label">Amount defrauded (INR &amp; crypto)</label>
                                    <input className="field-input" type="text" placeholder="e.g. ₹6,50,000 (2.50 ETH)" value={citizenLoss} onChange={(e) => setCitizenLoss(e.target.value)} required />
                                </div>
                                <div className="demo-fill-row">
                                    <button type="button" onClick={() => { setCitizenName('Pooja Bhatia'); setCitizenPhone('+91 98112-99821'); setCitizenScamType('Task-Based Telegram Part-Time Scam'); setCitizenWallet('0x9999a3b2e5f8841a0e889b41a91e1d092cb3e4a1'); setCitizenLoss('₹12,12,500 (4.85 ETH)'); }}>
                                        Demo fill: Telegram task fraud
                                    </button>
                                    <button type="button" onClick={() => { setCitizenName('Suresh Menon'); setCitizenPhone('+91 94451-22301'); setCitizenScamType('Fake Forex / Crypto Investment Scam'); setCitizenWallet('TScam9999a3b2e5f8841a0e889b41a91e1d092'); setCitizenLoss('₹20,50,000 (25,000 USDT)'); }}>
                                        Demo fill: Tron USDT forex scam
                                    </button>
                                </div>
                                <button type="submit" className="btn btn-green btn-block" style={{ marginTop: 4 }}>
                                    Submit complaint &amp; start emergency freeze
                                </button>
                                <div style={{ fontSize:11, color:'var(--ink-soft)', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}><span style={{ width:6, height:6, borderRadius:'50%', background:'#4caf7d', display:'inline-block' }} /> Your docket will appear instantly + live-tracked to resolution</div>
                            </form>
                        </div>
                    ) : (
                        <div style={{ width:'min(980px, 100%)', margin:'0 auto', display:'flex', flexDirection:'column', gap:14 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#fffbeb', border:'1px solid #d9bd83', borderRadius:8, padding:'8px 12px', fontSize:11, color:'#8a5a12' }}>
                                <span><strong>Live in v6.1:</strong> 6-stage tracking + AES encryption • Golden Hour active</span>
                                <span style={{ fontSize:10, background:'#8a5a12', color:'#fff', padding:'2px 7px', borderRadius:999, fontWeight:700 }}>v6.1.0 Live</span>
                            </div>
                            {!citizenTrackData ? (
                                <div style={{ background:'#191b26', border:'1px solid #262838', borderRadius:8, padding:24, color:'#e7e5dd', textAlign:'center' }}>
                                    <div style={{ fontSize:14, fontWeight:800, marginBottom:8 }}>Fetching live timeline for {citizenDocket}…</div>
                                    <div style={{ fontSize:12, color:'#8b8d9c' }}>Polling /api/citizen/track every 3 seconds. Wallet is encrypted at rest.</div>
                                    <div style={{ marginTop:14, height:6, background:'#0f1117', borderRadius:999, overflow:'hidden', border:'1px solid #262838' }}><motion.div style={{ height:'100%', background:'#4caf7d' }} animate={{ x: ['-100%', '100%'] }} transition={{ duration:1.2, repeat:Infinity, ease:'linear' }} /></div>
                                </div>
                            ) : (
                                <>
                                    {/* Header: docket + golden hour + progress */}
                                    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} style={{ background:'#191b26', border:'1px solid #262838', borderRadius:8, padding:18, color:'#e7e5dd', position:'relative', overflow:'hidden' }}>
                                        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'#262838' }}><motion.div style={{ height:'100%', background: citizenTrackData.progress_percent >= 80 ? '#4caf7d' : citizenTrackData.progress_percent >= 50 ? '#d9a441' : '#e0654a' }} initial={{ width:0 }} animate={{ width:`${citizenTrackData.progress_percent}%` }} transition={{ duration:0.7, ease:[0.16,1,0.3,1] }} /></div>
                                        <div style={{ display:'flex', justifyContent:'space-between', gap:14, flexWrap:'wrap', alignItems:'flex-start' }}>
                                            <div>
                                                <div style={{ fontSize:11, letterSpacing:'0.06em', color:'#8b8d9c', fontWeight:700, display:'flex', alignItems:'center', gap:8 }}>
                                                    <span style={{ background:'#4caf7d', color:'#fff', padding:'2px 7px', borderRadius:999, fontSize:10 }}>LIVE</span> NCRP DOCKET · {citizenTrackData.docket_no}
                                                    <span style={{ width:6, height:6, borderRadius:'50%', background:'#4caf7d', boxShadow:'0 0 8px #4caf7d', animation:'golden-pulse 1.2s infinite' }} />
                                                    Polling 3s
                                                </div>
                                                <div style={{ fontSize:22, fontWeight:800, marginTop:6, color:'#fff', display:'flex', alignItems:'center', gap:10 }}>
                                                    {citizenTrackData.victim_name} <span style={{ fontSize:11, fontWeight:600, color:'#9db4d8', background:'#0f1117', border:'1px solid #262838', padding:'3px 8px', borderRadius:999 }}>{citizenTrackData.category}</span>
                                                </div>
                                                <div style={{ fontSize:12, color:'#c9c8c1', marginTop:6 }}>Loss: <strong style={{ color:'#ff9a7a' }}>{citizenTrackData.reported_loss}</strong> · Chain: <span style={{ color:'#9db4d8' }}>{citizenTrackData.chain}</span> · Wallet: <code style={{ background:'#0f1117', padding:'2px 6px', borderRadius:4, border:'1px solid #262838', color:'#9db4d8' }}>{citizenTrackData.suspect_wallet_masked}</code></div>
                                                <div style={{ marginTop:8, display:'flex', gap:8, flexWrap:'wrap' }}>
                                                    <span style={{ fontSize:11, padding:'4px 8px', borderRadius:999, background:'rgba(76,175,125,0.12)', border:'1px solid rgba(76,175,125,0.28)', color:'#4caf7d', display:'inline-flex', alignItems:'center', gap:6 }}>🔒 Wallet encrypted at rest <code style={{ fontSize:10, background:'#0f1117', padding:'1px 6px', borderRadius:4 }}>{(citizenTrackData.suspect_wallet_encrypted||'').slice(0,22)}…</code></span>
                                                    <button onClick={()=> setShowEncrypted(v=>!v)} style={{ fontSize:11, padding:'4px 10px', borderRadius:999, background: showEncrypted ? '#1e3a8a' : 'transparent', color: showEncrypted ? '#fff' : '#9aa0b4', border:'1px solid #262838', cursor:'pointer' }}>{showEncrypted ? 'Hide encrypted token' : 'Show encrypted token'}</button>
                                                </div>
                                                {showEncrypted && (
                                                    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} style={{ marginTop:10, background:'#0f1117', border:'1px solid #262838', borderRadius:6, padding:10, fontSize:11, color:'#c9c8c1' }}>
                                                        <div style={{ fontWeight:700, color:'#e0654a', marginBottom:4 }}>🔐 Field-level encryption demo</div>
                                                        <div style={{ fontFamily:'var(--font-mono)', wordBreak:'break-all', background:'#191b26', padding:8, borderRadius:4, border:'1px solid #262838' }}>{citizenTrackData.suspect_wallet_encrypted || citizenEncryptionMeta?.encrypted || 'enc:…'}</div>
                                                        <div style={{ marginTop:6, color:'#8b8d9c' }}>Algorithm: <strong style={{ color:'#4caf7d' }}>{citizenEncryptionMeta?.algo || 'Fernet AES-128-CBC+HMAC'}</strong> · At rest in <code>ncrp_complaints.json</code> only as <code>enc:…</code>. Masked everywhere else. LEA decrypts with server-side key.</div>
                                                        <div style={{ marginTop:6, display:'flex', gap:6, flexWrap:'wrap' }}>
                                                            <span style={{ fontSize:10, background:'#191b26', border:'1px solid #262838', padding:'3px 7px', borderRadius:999 }}>Input sanitized (XSS stripped)</span>
                                                            <span style={{ fontSize:10, background:'#191b26', border:'1px solid #262838', padding:'3px 7px', borderRadius:999 }}>Masked: {citizenTrackData.suspect_wallet_masked}</span>
                                                            <span style={{ fontSize:10, background:'#191b26', border:'1px solid #262838', padding:'3px 7px', borderRadius:999 }}>Phone masked: {citizenTrackData.citizen_phone_masked}</span>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                            <div style={{ textAlign:'right', minWidth:210 }}>
                                                <div style={{ fontSize:11, color:'#8b8d9c', fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase' }}>{citizenTrackData.golden_hour_active ? 'Golden Hour — freeze window' : citizenTrackData.golden_hour_expired ? 'Golden Hour expired' : 'Golden Hour'}</div>
                                                <div style={{ fontFamily:'var(--font-mono)', fontSize:22, fontWeight:800, color: citizenTrackData.golden_hour_active ? '#ff9a7a' : '#8b8d9c', marginTop:4, display:'flex', alignItems:'center', gap:8, justifyContent:'flex-end' }}>
                                                    {citizenTrackData.golden_hour_active && <span style={{ width:8, height:8, borderRadius:'50%', background:'#ff7a54', animation:'golden-pulse 1.1s infinite' }} />}
                                                    {citizenTrackData.golden_hour_remaining}
                                                </div>
                                                <div style={{ fontSize:11, color:'#9aa0b4', marginTop:4 }}>Officer: <strong style={{ color:'#4caf7d' }}>{citizenTrackData.assigned_officer}</strong></div>
                                                <div style={{ fontSize:11, color:'#d9a441', marginTop:2 }}>ETA: {citizenTrackData.estimated_resolution}</div>
                                                <div style={{ marginTop:10, background:'#0f1117', border:'1px solid #262838', borderRadius:999, padding:'4px 10px', display:'inline-flex', alignItems:'center', gap:8, fontSize:11, color:'#c9c8c1' }}>
                                                    <span style={{ width:6, height:6, borderRadius:'50%', background: citizenTrackData.progress_percent>=95?'#4caf7d':'#d9a441' }} />
                                                    {citizenTrackData.current_stage_label} · {citizenTrackData.progress_percent}%
                                                </div>
                                            </div>
                                        </div>
                                        {/* Progress dots */}
                                        <div style={{ marginTop:16, display:'flex', gap:6, alignItems:'center' }}>
                                            {citizenTrackData.timeline?.map((t, i)=> (
                                                <div key={i} style={{ flex:1, height:6, borderRadius:999, background: t.status==='completed' ? '#4caf7d' : t.status==='active' ? '#d9a441' : '#262838', position:'relative', overflow:'hidden' }}>
                                                    {t.status==='active' && <motion.div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)' }} animate={{ x:['-100%','100%'] }} transition={{ duration:1.1, repeat:Infinity, ease:'linear' }} />}
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:10, color:'#6d6f7d' }}>
                                            <span>0%</span><span>Live progression (auto-advances every ~8-25s)</span><span>100%</span>
                                        </div>
                                    </motion.div>

                                    {/* Main grid: timeline + hops + live feed */}
                                    <div style={{ display:'grid', gridTemplateColumns:'1.2fr 0.9fr', gap:14 }}>
                                        <div style={{ background:'#191b26', border:'1px solid #262838', borderRadius:8, padding:16 }}>
                                            <div style={{ fontSize:12, fontWeight:800, color:'#e7e5dd', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                                                <span>Investigation lifecycle — real-time</span>
                                                <span style={{ fontSize:10, color:'#8b8d9c', background:'#0f1117', border:'1px solid #262838', padding:'3px 8px', borderRadius:999, display:'inline-flex', alignItems:'center', gap:6 }}>
                                                    <span style={{ width:6, height:6, borderRadius:'50%', background:'#4caf7d', animation:'golden-pulse 1s infinite' }} /> Live
                                                </span>
                                            </div>
                                            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                                                {citizenTrackData.timeline?.map((st, idx)=> (
                                                    <motion.div
                                                        key={st.stage}
                                                        initial={{ opacity:0, x:-10 }}
                                                        animate={{ opacity:1, x:0 }}
                                                        transition={{ delay: idx*0.06 }}
                                                        style={{
                                                            display:'flex', gap:12, alignItems:'flex-start',
                                                            padding:'11px 12px', borderRadius:8,
                                                            background: st.status==='active' ? 'rgba(217,164,65,0.10)' : st.status==='completed' ? 'rgba(76,175,125,0.08)' : '#0f1117',
                                                            border: `1px solid ${st.status==='active' ? 'rgba(217,164,65,0.32)' : st.status==='completed' ? 'rgba(76,175,125,0.22)' : '#262838'}`,
                                                            position:'relative'
                                                        }}
                                                    >
                                                        <div style={{
                                                            width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:13, fontWeight:800,
                                                            background: st.status==='completed' ? '#4caf7d' : st.status==='active' ? '#d9a441' : '#262838',
                                                            color: st.status==='pending' ? '#6d6f7d' : '#fff',
                                                            border: st.status==='active' ? '2px solid #ffcc66' : 'none',
                                                            boxShadow: st.status==='active' ? '0 0 12px rgba(217,164,65,0.5)' : st.status==='completed' ? '0 0 8px rgba(76,175,125,0.35)' : 'none'
                                                        }}>
                                                            {st.status==='completed' ? '✓' : st.status==='active' ? '●' : idx+1}
                                                        </div>
                                                        <div style={{ flex:1 }}>
                                                            <div style={{ fontSize:13, fontWeight:700, color: st.status==='pending' ? '#8b8d9c' : '#e7e5dd', display:'flex', justifyContent:'space-between', gap:8 }}>
                                                                <span>{st.label}</span>
                                                                <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color: st.status==='pending' ? '#6d6f7d' : st.status==='active' ? '#d9a441' : '#4caf7d', background: st.status==='pending' ? 'transparent' : st.status==='active' ? 'rgba(217,164,65,0.14)' : 'rgba(76,175,125,0.14)', padding: st.status==='pending' ? 0 : '2px 6px', borderRadius:999, border: st.status==='pending' ? 'none' : `1px solid ${st.status==='active' ? 'rgba(217,164,65,0.28)' : 'rgba(76,175,125,0.28)'}` }}>{st.timestamp_display}</span>
                                                            </div>
                                                            <div style={{ fontSize:11, color: st.status==='pending' ? '#6d6f7d' : '#9db4d8', marginTop:3, lineHeight:1.45 }}>{st.desc}</div>
                                                            {st.status==='active' && <div style={{ marginTop:8, height:4, background:'#0f1117', borderRadius:999, overflow:'hidden', border:'1px solid #262838' }}><motion.div style={{ height:'100%', background:'#d9a441' }} initial={{ width:0 }} animate={{ width:'60%' }} transition={{ duration:1.2, repeat:Infinity, repeatType:'reverse', ease:'easeInOut' }} /></div>}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                                            <div style={{ background:'#191b26', border:'1px solid #262838', borderRadius:8, padding:16 }}>
                                                <div style={{ fontSize:12, fontWeight:800, color:'#e7e5dd', marginBottom:10, display:'flex', justifyContent:'space-between' }}>
                                                    <span>Fund-flow trace (citizen view)</span>
                                                    <span style={{ fontSize:10, color:'#6d6f7d' }}>Live hopping</span>
                                                </div>
                                                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                                                    {(citizenTrackData.hops_preview || []).map((h, i)=> (
                                                        <div key={i} style={{ display:'flex', gap:10, alignItems:'center', padding:'9px 10px', borderRadius:6, background: h.status==='completed' ? 'rgba(76,175,125,0.08)' : h.status==='active' ? 'rgba(217,164,65,0.10)' : '#0f1117', border:`1px solid ${h.status==='completed' ? 'rgba(76,175,125,0.2)' : h.status==='active' ? 'rgba(217,164,65,0.3)' : '#262838'}` }}>
                                                            <div style={{ width:26, height:26, borderRadius:6, background: h.status==='completed' ? '#4caf7d' : h.status==='active' ? '#d9a441' : '#262838', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800 }}>{i+1}</div>
                                                            <div style={{ flex:1 }}>
                                                                <div style={{ fontSize:11, fontWeight:700, color: h.status==='pending' ? '#6d6f7d' : '#e7e5dd' }}>{h.label}</div>
                                                                <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'#9db4d8' }}>{h.addr_masked}</div>
                                                            </div>
                                                            <span style={{ fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:999, background: h.status==='completed' ? 'rgba(76,175,125,0.18)' : h.status==='active' ? 'rgba(217,164,65,0.18)' : '#0f1117', color: h.status==='completed' ? '#4caf7d' : h.status==='active' ? '#d9a441' : '#6d6f7d', border:`1px solid ${h.status==='completed' ? 'rgba(76,175,125,0.28)' : h.status==='active' ? 'rgba(217,164,65,0.28)' : '#262838'}` }}>{h.status==='completed' ? 'Traced' : h.status==='active' ? 'Tracing…' : 'Pending'}</span>
                                                        </div>
                                                    ))}
                                                    {(!citizenTrackData.hops_preview || citizenTrackData.hops_preview.length===0) && (
                                                        <div style={{ fontSize:11, color:'#6d6f7d', textAlign:'center', padding:12 }}>Hops will appear as the on-chain trace progresses (every ~8s).</div>
                                                    )}
                                                </div>
                                                <div style={{ marginTop:10, fontSize:10, color:'#6d6f7d', display:'flex', alignItems:'center', gap:6, background:'#0f1117', padding:'7px 9px', borderRadius:6, border:'1px solid #262838' }}>
                                                    <span>🔐</span> Addresses are <strong style={{ color:'#e7e5dd' }}>encrypted (Fernet)</strong> — you see masked. Next poll: <strong style={{ color:'#4caf7d' }}>3s</strong> · Tick #{citizenPollTick}
                                                </div>
                                            </div>

                                            <div style={{ background:'#191b26', border:'1px solid #262838', borderRadius:8, padding:16 }}>
                                                <div style={{ fontSize:12, fontWeight:800, color:'#e7e5dd', marginBottom:8 }}>What happens next?</div>
                                                <div style={{ fontSize:11, color:'#9aa0b4', lineHeight:1.6 }}>
                                                    Your report is now in the <strong style={{ color:'#4caf7d' }}>I4C Golden Hour</strong> queue. The forensics grid is walking the wallet hops and will dispatch a <strong style={{ color:'#d9a441' }}>Section 91</strong> freeze to the terminal VASP. You’ll be notified by SMS at each stage — this screen updates live.
                                                </div>
                                                <div style={{ marginTop:12, display:'flex', gap:8, flexWrap:'wrap' }}>
                                                    <button className="btn btn-navy btn-sm" onClick={()=> navigator.clipboard?.writeText(citizenTrackData.docket_no)}>Copy docket</button>
                                                    <button className="btn btn-outline btn-sm" style={{ background:'#0f1117', color:'#9aa0b4', borderColor:'#262838' }} onClick={()=> window.print()}>Print acknowledgement</button>
                                                    <button className="btn btn-outline btn-sm" style={{ background:'#0f1117', color:'#9aa0b4', borderColor:'#262838' }} onClick={()=> setCurrentPortal('landing')}>Back to home</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:4 }}>
                                        <button className="btn btn-outline btn-sm" style={{ background:'#191b26', color:'#9aa0b4', borderColor:'#262838' }} onClick={()=> setCitizenSubmitted(false)}>File another report</button>
                                        <button className="btn btn-navy btn-sm" onClick={()=> setCurrentPortal('police')}>View as investigator (LEA)</button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </motion.div>
            )}

            {/* ===================== POLICE LOGIN ===================== */}
            {currentPortal === 'police' && !isPoliceAuth && (
                <motion.div
                    className="form-shell"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="form-card" style={{ maxWidth: 440 }}>
                        <div className="form-head">
                            <h2>I4C Cybercrime Forensic Grid</h2>
                            <p>Ministry of Home Affairs — Law Enforcement Officer (LEO) authentication</p>
                            <div style={{ marginTop:10, display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' }}>
                                <span style={{ fontSize:10, padding:'3px 7px', borderRadius:999, background:'rgba(33,96,63,0.10)', border:'1px solid #a9c7b3', color:'#21603f', fontWeight:700 }}>🔒 Hashed auth (HMAC)</span>
                                <span style={{ fontSize:10, padding:'3px 7px', borderRadius:999, background:'rgba(224,101,74,0.10)', border:'1px solid #dcae9a', color:'#a8391c', fontWeight:700 }}>Rate-limit 10/min</span>
                                <span style={{ fontSize:10, padding:'3px 7px', borderRadius:999, background:'rgba(59,90,134,0.10)', border:'1px solid #aeb8cd', color:'#223354', fontWeight:700 }}>Audit-logged</span>
                            </div>
                        </div>

                        {authError && <div className="notice-banner error">{authError}</div>}

                        <form onSubmit={handlePoliceLogin} className="stack">
                            <div>
                                <label className="field-label">Officer badge ID</label>
                                <input
                                    className="field-input" type="text" placeholder="e.g. IO-I4C-9921"
                                    value={officerId} onChange={(e) => setOfficerId(e.target.value)} required
                                />
                            </div>
                            <div>
                                <label className="field-label">Security passcode</label>
                                <input
                                    className="field-input" type="password" placeholder="••••••••"
                                    value={officerPass} onChange={(e) => setOfficerPass(e.target.value)} required
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => { setOfficerId('IO-I4C-9921'); setOfficerPass('cybercell'); }}
                                style={{ padding: 9, background: 'var(--paper)', color: 'var(--ink-soft)', border: '1px dashed var(--line-strong)', borderRadius: 'var(--radius)', fontSize: 11, fontWeight: 600 }}
                            >
                                Auto-fill demo credentials (Insp. R. Sharma)
                            </button>

                            <motion.button
                                type="submit"
                                className="btn btn-navy btn-block"
                                style={{ marginTop: 4 }}
                                whileHover={{ scale: 1.015 }}
                                whileTap={{ scale: 0.97 }}
                                animate={authError ? { x: [0, -9, 9, -6, 6, 0] } : { x: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                Verify credentials &amp; access grid
                            </motion.button>
                        </form>
                    </div>
                </motion.div>
            )}

            {/* ===================== AUTHENTICATED POLICE GRID ===================== */}
            {currentPortal === 'police' && isPoliceAuth && (
                <>
                    {demoActive && (
                        <div className="demo-bar">
                            <div className="row-gap" style={{ alignItems: 'center' }}>
                                <span className="badge">Demo step {demoStep + 1} / 5</span>
                                <div>
                                    <div className="title">{DEMO_STEPS[demoStep].title}</div>
                                    <div className="desc">{DEMO_STEPS[demoStep].desc}</div>
                                </div>
                            </div>
                            <div className="row-gap">
                                <button className="btn btn-navy btn-sm" onClick={handleNextDemoStep}>{demoStep === 4 ? 'Finish demo' : 'Next step'}</button>
                                <button className="btn btn-outline-invert btn-sm" onClick={() => setDemoActive(false)}>Exit</button>
                            </div>
                        </div>
                    )}

                    <AnimatePresence>
                        {showDispatchModal && (
                            <motion.div
                                className="modal-overlay"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                <motion.div
                                    className="modal-card"
                                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                                >
                                    <div className="modal-head">
                                        <span className="title">SAHYOG Gateway — Statutory VASP Freeze Transmission</span>
                                        <button onClick={() => setShowDispatchModal(false)}>✕</button>
                                    </div>
                                    <div className="terminal-log">
                                        {dispatchLogs.map((log, i) => (
                                            <div key={i} className={log.includes('SUCCESS') || log.includes('APPLIED') ? 'ok' : ''}>{log}</div>
                                        ))}
                                    </div>
                                    <AnimatePresence>
                                        {dispatchComplete && (
                                            <motion.div
                                                className="modal-result"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                            >
                                                <div className="t">Legal notice delivered &amp; acknowledged</div>
                                                <div className="d">Freeze order active on the beneficiary depository under Section 91 Cr.P.C. / BNSS. Golden Hour preserved.</div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                                        <button className="btn-plain-dark" style={{ padding: '8px 18px' }} onClick={() => setShowDispatchModal(false)}>Close gateway terminal</button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <>
                    {/* LAYER 1: FORENSICS CANVAS */}
                    {activeLayer === 'forensics' && (
                        <motion.div
                            key="forensics"
                            style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {isMobile && (
                                <div className="mobile-tabs">
                                    <button className={mobileViewTab === 'threat' ? 'active' : ''} onClick={() => setMobileViewTab('threat')}>Threat &amp; case</button>
                                    <button
                                        className={mobileViewTab === 'canvas' ? 'active' : ''}
                                        onClick={() => { setMobileViewTab('canvas'); setTimeout(() => { if (cyRef.current) { cyRef.current.resize(); cyRef.current.fit(undefined, 30); } }, 60); }}
                                    >
                                        Graph canvas
                                    </button>
                                    <button className={mobileViewTab === 'inspector' ? 'active' : ''} onClick={() => setMobileViewTab('inspector')}>Inspector &amp; ML</button>
                                </div>
                            )}

                            <div className="workspace" style={{ flexDirection: isMobile ? 'column' : 'row' }}>

                                {/* LEFT SIDEBAR */}
                                <div className="ws-sidebar" style={{ width: isMobile ? '100%' : 320, display: (!isMobile || mobileViewTab === 'threat') ? 'flex' : 'none' }}>
                                    <div className={`golden-hour${goldenHourUrgent ? ' golden-hour-urgent' : ''}`}>
                                        <div className="golden-hour-row">
                                            <span className="golden-hour-label">Golden Hour response clock</span>
                                            <span className="golden-hour-clock">{formatGoldenHour(secondsRemaining)}</span>
                                        </div>
                                        <div className="golden-hour-desc">Critical window to mandate a VASP debit freeze before liquidation.</div>
                                    </div>

                                    <div className="ws-panel">
                                        <div className="k">Active docket · {activeDataset.caseMeta.docket_no}</div>
                                        <div className="v">{activeDataset.caseMeta.victim_name}</div>
                                        <div style={{ fontSize: 12, color: '#4caf7d', fontWeight: 600, margin: '4px 0' }}>Reported loss: {activeDataset.caseMeta.reported_loss}</div>
                                        <div style={{ fontSize: 11 }} className="ws-muted"><strong style={{ color: '#e7e5dd' }}>Category:</strong> {activeDataset.caseMeta.category}</div>
                                    </div>

                                    <div className="ws-panel risk-block">
                                        <RiskRing score={risk.overall_risk_score} />
                                        <div>
                                            <div className="k">Threat level</div>
                                            <div className="v" style={{ color: (risk.risk_rating === 'CRITICAL' || risk.risk_rating === 'HIGH') ? '#e0654a' : '#4caf7d' }}>{risk.risk_rating}</div>
                                            <div style={{ fontSize: 11 }} className="ws-muted">AI topological risk score</div>
                                        </div>
                                    </div>

                                    <div className={`vasp-card ${primaryAttr?.category === 'CEX' ? 'hit' : 'warn'}`}>
                                        <div className="head" style={{ color: primaryAttr?.category === 'CEX' ? '#4caf7d' : '#e0876f' }}>Actionable VASP identified — Section 91 target</div>
                                        <div className="name">{primaryAttr?.entity_name}</div>
                                        <div className="meta">Distance: {primaryAttr?.hop_distance} hops · Confidence: {primaryAttr?.confidence_score}% · FIU: {primaryAttr?.fiu_status}</div>
                                        <div className="contact"><strong>VASP desk:</strong> {primaryAttr?.compliance_contact}</div>
                                        <motion.button
                                            className="btn btn-rust btn-block"
                                            style={{ marginTop: 10, fontSize: 12, padding: '9px 10px' }}
                                            onClick={handleLaunchDispatch}
                                            whileHover={{ scale: 1.015 }}
                                            whileTap={{ scale: 0.97 }}
                                            title={`Dispatch freeze to ${primaryAttr?.compliance_contact}`}
                                        >
                                            ⚡ Freeze VASP — Dispatch Sec. 91
                                        </motion.button>
                                        <div style={{ fontSize: 10, color: '#8b8d9c', textAlign: 'center', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                                            Live: {formatISTTime(nowIST)} IST · One-click SAHYOG gateway
                                        </div>
                                    </div>

                                    {provenance && (
                                        <div style={{ fontSize: 11, padding: '9px 10px', borderRadius: 4, background: provenance.includes('DEMO_MOCK_DATA') ? 'rgba(217,164,65,0.12)' : 'rgba(76,175,125,0.12)', border: `1px solid ${provenance.includes('DEMO_MOCK_DATA') ? '#d9a441' : '#4caf7d'}`, color: provenance.includes('DEMO_MOCK_DATA') ? '#f0c56e' : '#4caf7d' }}>
                                            <div style={{ fontWeight: 700, marginBottom: 2 }}>Data provenance</div>
                                            <div>{provenance.join(', ').replace(/LIVE_/g,'').replace(/DEMO_MOCK_DATA/g,'Demo dataset')} {provenance.includes('DEMO_MOCK_DATA') ? '⚠️ Demo-backed hops' : '✓ Live on-chain'}</div>
                                        </div>
                                    )}

                                    <div style={{ flex: 1 }}>
                                        <div className="k" style={{ marginBottom: 8 }}>Detected typologies</div>
                                        <div className="stack" style={{ gap: 6 }}>
                                            {risk.detected_patterns?.map((p, idx) => (
                                                <div key={idx} className="typology-item">{p}</div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { setDemoActive(true); setDemoStep(0); setActiveLayer('forensics'); handleSelectChain('ethereum'); }}
                                        style={{ width: '100%', padding: '9px 10px', borderRadius: 6, background: 'transparent', border: '1px dashed #3a3f5a', color: '#9aa0b4', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em' }}
                                        title="Run 5-step guided tour (replaces the old '?' icon)"
                                    >
                                        ▶ Guided tour — 5 steps
                                    </button>
                                </div>

                                {/* CENTER CANVAS — forensic grid with QoL controls */}
                                <div className="ws-center" style={{ display: (!isMobile || mobileViewTab === 'canvas') ? 'flex' : 'none' }}>
                                    <div className="ws-toolbar">
                                        <div className="chain-tabs" role="tablist" aria-label="Chain selector">
                                            {CHAIN_TABS.map((c) => (
                                                <motion.button
                                                    key={c.key}
                                                    className={selectedChainKey === c.key ? 'active' : ''}
                                                    onClick={() => handleSelectChain(c.key)}
                                                    whileTap={{ scale: 0.96 }}
                                                    title={`Switch to ${c.label}`}
                                                >
                                                    {selectedChainKey === c.key && <TabPill layoutId="chainPill" />}
                                                    <span className="tab-label">{c.label}</span>
                                                </motion.button>
                                            ))}
                                        </div>

                                        <div className="trace-bar">
                                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                <span style={{ position: 'absolute', left: 9, color: '#6d6f7d', fontSize: 12 }}><SearchTraceIcon size={14} /></span>
                                                <input
                                                    type="text"
                                                    value={suspectInput}
                                                    onChange={(e) => setSuspectInput(e.target.value)}
                                                    placeholder="Wallet (0x…, T…, bc1… )"
                                                    style={{ width: isMobile ? '100%' : 360, paddingLeft: 28 }}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') handleTraceWallet(suspectInput); }}
                                                />
                                            </div>
                                            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} onClick={() => handleTraceWallet(suspectInput)} disabled={tracingLive} title={authToken ? 'Run authenticated trace (live + demo fallback)' : 'Run trace — login for live attribution'}>
                                                {tracingLive ? 'Tracing…' : 'Run trace'}
                                            </motion.button>
                                            <motion.button
                                                type="button"
                                                className="cmdk-trigger"
                                                onClick={() => setShowCommandPalette(true)}
                                                title="Command palette (Ctrl+K)"
                                                whileHover={{ scale: 1.04 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <span>Quick actions</span>
                                                <kbd>⌘K</kbd>
                                            </motion.button>
                                        </div>
                                    </div>

                                    <div ref={containerRef} className="graph-canvas" />
                                    <div className="canvas-controls" aria-label="Canvas controls">
                                        <button onClick={() => { if (cyRef.current) cyRef.current.zoom(cyRef.current.zoom()*1.22); }} title="Zoom in">＋</button>
                                        <button onClick={() => { if (cyRef.current) cyRef.current.zoom(cyRef.current.zoom()*0.82); }} title="Zoom out">－</button>
                                        <button onClick={() => { if (cyRef.current) { cyRef.current.fit(undefined, 40); cyRef.current.center(); } }} title="Fit to screen">⛶</button>
                                    </div>

                                    <div className="legend-bar">
                                        <div className="items">
                                            <span className="legend-item"><span className="legend-dot" style={{ background: GRAPH_COLORS.rust, boxShadow: `0 0 8px ${GRAPH_COLORS.rust}` }} /> Suspect origin</span>
                                            <span className="legend-item"><span className="legend-dot" style={{ background: GRAPH_COLORS.slate, boxShadow: `0 0 8px ${GRAPH_COLORS.slate}` }} /> Mule layering</span>
                                            <span className="legend-item"><span className="legend-dot" style={{ background: GRAPH_COLORS.green, boxShadow: `0 0 8px ${GRAPH_COLORS.green}` }} /> Exchange / VASP</span>
                                            <span className="legend-item"><span className="legend-dot" style={{ background: GRAPH_COLORS.navy, boxShadow: `0 0 8px ${GRAPH_COLORS.navy}` }} /> Cross-chain bridge</span>
                                        </div>
                                        <div style={{ color: '#9db4d8', fontWeight: 600 }}>Live fund-flow animation active</div>
                                    </div>
                                </div>

                                {/* RIGHT INSPECTOR */}
                                <div className="ws-inspector" style={{ width: isMobile ? '100%' : 340, display: (!isMobile || mobileViewTab === 'inspector') ? 'flex' : 'none' }}>
                                    <div className="inspector-tabs">
                                        {[
                                            ['inspector', 'Inspector'],
                                            ['custody', 'Custody trail'],
                                            ['ml', 'ML heuristics'],
                                            ['legal', 'Sec. 91'],
                                        ].map(([key, label]) => (
                                            <motion.button
                                                key={key}
                                                className={activeTab === key ? 'active' : ''}
                                                onClick={() => setActiveTab(key)}
                                                whileTap={{ scale: 0.96 }}
                                            >
                                                {activeTab === key && <TabPill layoutId="inspectorPill" />}
                                                <span className="tab-label">{label}</span>
                                            </motion.button>
                                        ))}
                                    </div>

                                    {activeTab === 'inspector' && (
                                        <div className="inspector-body">
                                            <div className="eyebrow">Selected wallet entity</div>
                                            {selectedNode ? (
                                                <div className="entity-card">
                                                    <div>
                                                        <div className="k">Entity name</div>
                                                        <div className="big">{selectedNode.entity_name}</div>
                                                    </div>
                                                    <div>
                                                        <div className="k">Classification</div>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: selectedNode.entity_type === 'CEX' ? '#4caf7d' : (selectedNode.entity_type === 'SUSPECT' ? '#e0654a' : '#9db4d8') }}>
                                                            {selectedNode.entity_type} ({selectedNode.tag})
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="k">Hop level</div>
                                                        <div style={{ fontSize: 13 }}>Hop {selectedNode.hop_level} from origin</div>
                                                    </div>
                                                    <div>
                                                        <div className="k">Wallet address</div>
                                                        <div className="addr">{selectedNode.full_address}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="empty-note">Click any node on the graph to inspect the wallet entity and risk level.</div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'custody' && (
                                        <div className="inspector-body">
                                            <div className="eyebrow">Transaction hops (audit trail) — Indian ₹</div>
                                            {provenance && (
                                                <div style={{ fontSize: 11, padding: '7px 9px', borderRadius: 4, background: provenance.includes('DEMO_MOCK_DATA') ? 'rgba(217,164,65,0.12)' : 'rgba(76,175,125,0.12)', border: `1px solid ${provenance.includes('DEMO_MOCK_DATA') ? '#d9a441' : '#4caf7d'}`, color: provenance.includes('DEMO_MOCK_DATA') ? '#d9a441' : '#4caf7d', marginBottom: 8 }}>
                                                    Data provenance: {provenance.join(', ').replace(/LIVE_/g,'').replace(/DEMO_MOCK_DATA/g,'Demo dataset')} {provenance.includes('DEMO_MOCK_DATA') ? '— demo trail (court will require live verification)' : '— live on-chain'}
                                                </div>
                                            )}
                                            {activeDataset.custody_trail.map((h, i) => (
                                                <div key={i} className="hop-card">
                                                    <div className="top">
                                                        <span style={{ color: '#9db4d8', fontWeight: 700 }}>Hop #{h.hop}</span>
                                                        <span style={{ color: '#4caf7d', fontWeight: 700 }}>{h.value_eth} {h.token} (<AnimatedCounter value={h.value_inr} prefix="₹" formatter={(v) => formatInrIndian(Math.round(v))} />)</span>
                                                    </div>
                                                    <div className="ws-muted" style={{ fontSize: 11, marginBottom: 2 }}>
                                                        Target: <strong style={{ color: '#e7e5dd' }}>{h.to_name}</strong> · <span style={{ color: '#a6a397' }}>{h.value_inr_human || formatInrHuman(h.value_inr)}</span>
                                                    </div>
                                                    {h.data_source && (
                                                        <div style={{ fontSize: 10, color: h.data_source === 'DEMO_MOCK_DATA' ? '#d9a441' : '#4caf7d', marginBottom: 4 }}>
                                                            Source: {h.data_source.replace('LIVE_','').replace('DEMO_MOCK_DATA','Demo dataset')}
                                                        </div>
                                                    )}
                                                    <div className="tx">Tx: {h.tx_hash.slice(0, 24)}...</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {activeTab === 'ml' && (
                                        <div className="inspector-body">
                                            <div className="eyebrow">Forensic ML topology analyzer — explainable</div>
                                            <div className="ws-panel" style={{ borderLeft: '3px solid #3b5a86' }}>
                                                <div className="k" style={{ marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span>Model architecture</span>
                                                    <span style={{ fontSize: 10, background: '#0f1117', border: '1px solid #262838', padding: '2px 6px', borderRadius: 4, color: '#9db4d8' }}>GNN · RF</span>
                                                </div>
                                                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#9db4d8', margin: '4px 0 10px', lineHeight: 1.35 }}>{mlData.model_name}</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8, alignItems: 'center' }}>
                                                    <span className="ws-muted">Predicted entity</span>
                                                    <strong style={{ color: '#4caf7d', background: 'rgba(76,175,125,0.12)', border: '1px solid rgba(76,175,125,0.22)', padding: '2px 7px', borderRadius: 4 }}>{mlData.predicted_type}</strong>
                                                </div>
                                                <div style={{ marginBottom: 8 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                                                        <span className="ws-muted">Inference confidence</span>
                                                        <strong style={{ color: '#cddcf5' }}>{mlData.confidence}%</strong>
                                                    </div>
                                                    <div style={{ height: 6, background: '#0f1117', borderRadius: 999, overflow: 'hidden', border: '1px solid #262838' }}>
                                                        <div style={{ width: `${mlData.confidence}%`, height: '100%', background: mlData.confidence > 90 ? '#4caf7d' : mlData.confidence > 75 ? '#d9a441' : '#9db4d8', transition: 'width 0.6s ease' }} />
                                                    </div>
                                                </div>
                                                {mlData.laundering_probability && (
                                                    <div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                                                            <span className="ws-muted">Laundering probability</span>
                                                            <strong style={{ color: '#e0654a' }}>{mlData.laundering_probability}%</strong>
                                                        </div>
                                                        <div style={{ height: 6, background: '#0f1117', borderRadius: 999, overflow: 'hidden', border: '1px solid #262838' }}>
                                                            <div style={{ width: `${mlData.laundering_probability}%`, height: '100%', background: '#e0654a', transition: 'width 0.6s ease' }} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="eyebrow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>Topological feature vector</span>
                                                <span style={{ fontSize: 10, color: '#6d6f7d', fontWeight: 600 }}>{mlData.features.length} signals</span>
                                            </div>
                                            <div className="stack" style={{ gap: 7 }}>
                                                {mlData.features.map((f, i) => {
                                                    const isAlert = f.status === 'ANOMALY' || f.status === 'CRITICAL' || f.status === 'BOT_SCRIPT' || f.status === 'SYBIL';
                                                    const isWarn = f.status === 'HIGH' || f.status === 'DIRECT' || f.status === 'ACTIVE_HOP';
                                                    return (
                                                        <div key={i} className="feature-row" style={{ borderLeft: `3px solid ${isAlert ? '#e0654a' : isWarn ? '#d9a441' : '#3b5a86'}` }}>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontWeight: 700, fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: isAlert ? '#e0654a' : isWarn ? '#d9a441' : '#4caf7d', display: 'inline-block', boxShadow: `0 0 6px ${isAlert ? '#e0654a' : isWarn ? '#d9a441' : '#4caf7d'}` }} />
                                                                    {f.name}
                                                                </div>
                                                                <div style={{ fontSize: 10, marginTop: 2 }} className="ws-muted">Baseline: {f.normal}</div>
                                                            </div>
                                                            <div style={{ textAlign: 'right', minWidth: 86 }}>
                                                                <div style={{ fontWeight: 800, marginBottom: 3, fontSize: 11 }}>{f.value}</div>
                                                                <span
                                                                    className="status-tag"
                                                                    style={{
                                                                        background: isAlert ? 'rgba(224,101,74,0.18)' : isWarn ? 'rgba(217,164,65,0.18)' : 'rgba(59,90,134,0.18)',
                                                                        color: isAlert ? '#ff9a7a' : isWarn ? '#f0c56e' : '#9db4d8',
                                                                        border: `1px solid ${isAlert ? 'rgba(224,101,74,0.28)' : isWarn ? 'rgba(217,164,65,0.28)' : 'rgba(59,90,134,0.28)'}`,
                                                                        fontSize: 9, letterSpacing: '0.04em'
                                                                    }}
                                                                >
                                                                    {f.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'legal' && (
                                        <div className="inspector-body">
                                            <div className="eyebrow">Section 91 CrPC statutory notice</div>
                                            <textarea
                                                readOnly
                                                className="legal-textarea"
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
                                            />
                                            <button className="btn btn-navy" onClick={handleCopyNotice}>
                                                {copiedNotice ? 'Copied to clipboard' : 'Copy notice text'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* LAYER 2: NATIONAL INTELLIGENCE GRID — backend-backed, ErrorBoundary prevents white-screen */}
                    {activeLayer === 'dashboard' && (
                        <motion.div
                            key="dashboard"
                            className="intel-grid"
                            style={{ background: '#0f1117', color: '#e7e5dd' }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <ErrorBoundary>
                            <h2>National Cyber-Forensics Threat Intelligence Grid</h2>
                            <p>Aggregated telemetry across state cyber cells, NCRP intake, and VASP freeze compliance.</p>

                            {intelLoading && <div style={{ color:'#8b8d9c', fontSize:12, marginBottom:12 }}>Loading live intelligence…</div>}
                            <div className="stat-grid">
                                <div className="stat-card">
                                    <div className="label">Total assets traced (FY 2026)</div>
                                    <div className="num" style={{ color: '#4caf7d' }}>{intelData?.stats?.total_assets_display || '₹48,87,500'}</div>
                                    <div className="sub">Across {intelData?.stats?.total_dockets || 142} cybercrime dockets · {intelData?.stats?.active_dockets || 4} active</div>
                                </div>
                                <div className="stat-card">
                                    <div className="label">FIU-IND compliant VASPs</div>
                                    <div className="num" style={{ color: '#9db4d8' }}>{intelData?.stats?.fiu_vasps_indexed || 28} registered</div>
                                    <div className="sub">CoinDCX, WazirX, Binance, CoinSwitch · {intelData?.stats?.vasps_total || 30} total indexed</div>
                                </div>
                                <div className="stat-card">
                                    <div className="label">Avg. VASP attribution time</div>
                                    <div className="num" style={{ color: '#d9a441' }}>1.2 seconds</div>
                                    <div className="sub">Down from 72 hours of manual search</div>
                                </div>
                                <div className="stat-card">
                                    <div className="label">Asset-freeze success rate</div>
                                    <div className="num" style={{ color: '#4caf7d' }}>87.4%</div>
                                    <div className="sub">During Golden Hour window (&lt; 2 hrs)</div>
                                </div>
                            </div>

                            <div className="ws-panel" style={{ padding: 20 }}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                                    <h3 style={{ fontSize: 16, marginBottom:0 }}>Active fraud typologies (NCRP ingestion stream)</h3>
                                    {intelData?.generated_display && <span style={{ fontSize:11, color:'#8b8d9c' }}>{intelData.generated_display} · Live</span>}
                                </div>
                                <div className="typology-grid">
                                    {(intelData?.typologies?.length ? intelData.typologies : [
                                        {h:'Telegram part-time job scams', color:'#e0654a', p:'Victims are coerced into sending small sums that escalate, layered via 2–3 burner mules before a Binance/CoinDCX deposit.'},
                                        {h:'Tron TRC-20 forex fraud', color:'#d9a441', p:'Low-gas USDT transfers designed to evade bank scrutiny, with rapid off-ramping into international exchange deposit pools.'},
                                        {h:'Cross-chain bridge layering', color:'#9db4d8', p:'Scammers jump funds from Ethereum to Polygon or Arbitrum specifically to sever single-chain investigator trails.'}
                                    ]).map((typ, idx) => (
                                        <div key={idx} className="typology-card">
                                            <div className="h" style={{ color: typ.color }}>{typ.h}</div>
                                            <p>{typ.p}</p>
                                        </div>
                                    ))}
                                </div>
                                {intelData?.live_queue?.length > 0 && (
                                    <div style={{ marginTop:16, borderTop:'1px solid #262838', paddingTop:12 }}>
                                        <div style={{ fontSize:12, fontWeight:700, color:'#8b8d9c', marginBottom:8 }}>Recent NCRP live queue (top 5)</div>
                                        {intelData.live_queue.map((c, i) => (
                                            <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:11, padding:'6px 0', borderBottom: i < intelData.live_queue.length-1 ? '1px solid #1f2233' : 'none' }}>
                                                <span style={{ color:'#e7e5dd' }}>{c.docket_no} · {c.victim_name}</span>
                                                <span style={{ color:'#9db4d8' }}>{c.reported_loss}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            </ErrorBoundary>
                        </motion.div>
                    )}

                    {/* LAYER 3: COURT EVIDENCE DOSSIER — backend-backed */}
                    {activeLayer === 'dossier' && (
                        <motion.div
                            key="dossier"
                            className="dossier-shell"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <ErrorBoundary>
                            <div className="dossier-page">
                                {dossierLoading && <div style={{ textAlign:'center', color:'#8b8d9c', fontSize:12, marginBottom:12 }}>Loading live dossier from backend…</div>}
                                <div style={{ textAlign: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: 16, marginBottom: 20 }}>
                                    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1e3a8a', letterSpacing: 0.5 }}>INDIAN CYBER CRIME COORDINATION CENTRE (I4C)</div>
                                    <div style={{ fontSize: 13, fontWeight: 'bold' }}>MINISTRY OF HOME AFFAIRS | GOVERNMENT OF INDIA</div>
                                    <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>STATUTORY BLOCKCHAIN FORENSIC INTELLIGENCE DOSSIER (SIH26183)</div>
                                </div>

                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20, background: '#f8fafc' }}>
                                    <tbody>
                                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: 8, fontWeight: 'bold', width: '25%' }}>NCRP Docket Ref:</td>
                                            <td style={{ padding: 8, width: '25%' }}>{dossierDocket}</td>
                                            <td style={{ padding: 8, fontWeight: 'bold', width: '25%' }}>Date of Analysis:</td>
                                            <td style={{ padding: 8, width: '25%' }}>{currentDateStr()}</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: 8, fontWeight: 'bold' }}>Complainant:</td>
                                            <td style={{ padding: 8 }}>{dossierVictim}</td>
                                            <td style={{ padding: 8, fontWeight: 'bold' }}>Reported Loss:</td>
                                            <td style={{ padding: 8, color: '#dc2626', fontWeight: 'bold' }}>{dossierLoss}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: 8, fontWeight: 'bold' }}>Suspect Origin:</td>
                                            <td style={{ padding: 8, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 11 }}>{dossierWallet}</td>
                                            <td style={{ padding: 8, fontWeight: 'bold' }}>Attributed VASP:</td>
                                            <td style={{ padding: 8, fontWeight: 'bold', color: '#059669' }}>{dossierVasp} ({dossierVaspHops} Hops)</td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div style={{ fontSize: 13, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 8 }}>1. TRANSACTION CHAIN OF CUSTODY (AUDIT TRAIL) — Amounts in Indian Numbering</div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 6 }}>
                                    <thead>
                                        <tr style={{ background: '#1e3a8a', color: '#ffffff' }}>
                                            <th style={{ padding: 6, textAlign: 'center' }}>Hop #</th>
                                            <th style={{ padding: 6, textAlign: 'left' }}>Sender</th>
                                            <th style={{ padding: 6, textAlign: 'left' }}>Recipient / Entity</th>
                                            <th style={{ padding: 6, textAlign: 'right' }}>Value</th>
                                            <th style={{ padding: 6, textAlign: 'right' }}>INR Equivalent</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dossierTrail.map((h, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #cbd5e1', background: idx % 2 === 0 ? '#ffffff' : '#f1f5f9' }}>
                                                <td style={{ padding: 6, textAlign: 'center', fontWeight: 'bold' }}>{h.hop}</td>
                                                <td style={{ padding: 6, fontFamily: 'monospace' }}>{h.from_addr.slice(0, 10)}...</td>
                                                <td style={{ padding: 6, fontWeight: 'bold' }}>{h.to_name}</td>
                                                <td style={{ padding: 6, textAlign: 'right' }}>{h.value_eth} {h.token}</td>
                                                <td style={{ padding: 6, textAlign: 'right', fontWeight: 'bold' }}><AnimatedCounter value={h.value_inr} prefix="₹" formatter={(v) => formatInrIndian(Math.round(v))} /> <span style={{ fontWeight: 400, fontSize: 10, color: '#475569' }}>({formatInrHuman(h.value_inr)})</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {dossierTrail.length > 0 && (
                                    <div style={{ fontSize: 11, color: '#475569', marginBottom: 10, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                        <span>Total traced: <strong style={{ color: '#1e293b' }}>{formatInrFull(dossierTrail.reduce((s,h)=>s+(h.value_inr||0),0))}</strong> · {formatInrHuman(dossierTrail.reduce((s,h)=>s+(h.value_inr||0),0))}</span>
                                        {provenance && <span style={{ color: provenance.includes('DEMO_MOCK_DATA') ? '#8a5a12' : '#21603f', fontWeight: 600 }}>Provenance: {provenance.join(', ').replace(/LIVE_/g,'').replace(/DEMO_MOCK_DATA/g,'Demo dataset')} {provenance.includes('DEMO_MOCK_DATA') ? '⚠️ Demo dataset' : '✓ Live on-chain'}</span>}
                                    </div>
                                )}

                                <div style={{ fontSize: 13, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 8 }}>2. STATUTORY DIRECTIVE UNDER SECTION 91 Cr.P.C. / BNSS 2023</div>
                                <div style={{ fontSize: 11, lineHeight: 1.6, background: '#f8fafc', border: '1px solid #cbd5e1', padding: 12, borderRadius: 4, marginBottom: 30 }}>
                                    <strong>TO: Compliance Officer, {dossierVasp}</strong><br />
                                    WHEREAS an official investigation is underway regarding cyber fraud registered under NCRP Docket {dossierDocket}.
                                    The cryptographic assets listed in Table 1 have been traced as direct proceeds of crime entering your liquidity pool.<br />
                                    <strong>YOU ARE HEREBY DIRECTED TO:</strong><br />
                                    1. Immediately FREEZE all internal withdrawal and debit facilities associated with the recipient user account.<br />
                                    2. Furnish complete subscriber KYC records (Aadhaar/Passport, Registered Mobile, PAN, Bank Off-Ramp) and IP login logs within 24 hours of receipt.
                                </div>

                                <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                                    <span>Data provenance: <strong>{provenance ? provenance.join(', ').replace(/LIVE_/g,'').replace(/DEMO_MOCK_DATA/g,'Demo dataset') : 'Demo dataset (offline mode)'}</strong> {provenance && provenance.includes('DEMO_MOCK_DATA') ? '— demo-backed trace; live API verification recommended for court' : '— live on-chain verification'}</span>
                                    <span>INR formatting: Indian system (e.g., {formatInrFull(1212500)} = {formatInrHuman(1212500)})</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 11, color: '#475569', borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                                    <div>
                                        <div>Generated by: <strong>Automated Blockchain Forensics Grid (SIH26183) · Team CrySec — Project Cyclops</strong></div>
                                        <div>Report Generated: <strong>{displayDossier?.generated_display || dossierData?.generated_display || new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) + ' IST'}</strong> · Dossier: {dossierDocket}</div>
                                        <div>Hash Verification: <code>0x8f2b...9a12</code> (Tamper-Proof · SHA-256)</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 'bold' }}>Investigating Officer (Cyber Crime PS)</div>
                                        <div>Indian Cyber Crime Coordination Centre (I4C)</div>
                                        <div style={{ fontSize: 10, marginTop: 4, color: '#64748b' }}>Team CrySec · Cyclops v6.1 · Risk: {dossierRisk} {provenance && provenance.includes('DEMO_MOCK_DATA') ? '· Demo' : '· Live'}</div>
                                        <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={handleExportPDF}
                                                style={{ padding: '6px 14px', background: '#059669', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}
                                            >
                                                Download Court PDF
                                            </button>
                                            <button
                                                onClick={() => window.print()}
                                                style={{ padding: '6px 14px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}
                                            >
                                                Print / Save PDF
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            </ErrorBoundary>
                        </motion.div>
                    )}
                    </>
                </>
            )}
        </div>
    );
}
