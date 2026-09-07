import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';

// API Base URL - Points to live Render backend with localhost fallback
// AFTER (Correct Render URL):
const API_BASE =
    typeof window !== 'undefined' && window.location.hostname !== 'localhost'
        ? 'https://cyclops-sih26183.onrender.com'
        : 'http://localhost:8000';

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

// ==================== EMBLEM ====================
function CyclopsEmblem() {
    return (
        <svg className="brand-mark" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="3" />
            <path d="M12 50 Q 50 18 88 50 Q 50 82 12 50 Z" stroke="currentColor" strokeWidth="3.5" fill="none" />
            <circle cx="50" cy="50" r="16" fill="currentColor" />
            <circle cx="53" cy="47" r="3" fill="var(--paper)" />
        </svg>
    );
}

function RiskRing({ score }) {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const color = score > 75 ? '#e0654a' : (score > 50 ? '#d9a441' : '#4caf7d');
    return (
        <div className="risk-ring-wrap">
            <svg width="68" height="68" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="34" cy="34" r={radius} stroke="#262838" strokeWidth="6" fill="transparent" />
                <circle
                    cx="34" cy="34" r={radius}
                    stroke={color}
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (circumference * score) / 100}
                    strokeLinecap="round"
                />
            </svg>
            <div className="risk-ring-num">{score}</div>
        </div>
    );
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
            const res = await fetch(`${API_BASE}/api/trace`, {
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
                        'width': 46,
                        'height': 46
                    }
                },
                {
                    selector: 'node[entity_type = "SUSPECT"]',
                    style: { 'border-color': GRAPH_COLORS.rustDark, 'border-width': 3, 'width': 52, 'height': 52 }
                },
                {
                    selector: 'node[entity_type = "CEX"]',
                    style: { 'border-color': GRAPH_COLORS.greenDark, 'border-width': 3, 'width': 52, 'height': 52 }
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
                        'text-rotation': 'autorotate'
                    }
                }
            ],
            layout: { name: 'preset', fit: true, padding: 60 }
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
            const res = await fetch(`${API_BASE}/api/report/pdf?address=${suspectInput}`);
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
            '[14:25:05] SUCCESS: Requisition Ticket #IND-I4C-2026-9821 Acknowledged by VASP.',
            '[14:25:05] BENEFICIARY ACCOUNT STATUS: TEMPORARY DEBIT RESTRICTION APPLIED.'
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const risk = activeDataset.risk_assessment;
    const primaryAttr = activeDataset.attributions[0];
    const mlData = activeDataset.ml_features;
    const currentStreamItem = LIVE_COMPLAINT_STREAM[streamIndex];

    return (
        <div className="app">

            {/* TOP COMMAND BAR — hidden on the landing screen only */}
            {currentPortal !== 'landing' && (
                <header className="topbar">
                    <div className="topbar-left">
                        <div className="brand">
                            <CyclopsEmblem />
                            <div>
                                <div className="brand-name">CYCLOPS <span style={{ opacity: 0.5, fontWeight: 600 }}>SIH26183</span></div>
                                <div className="brand-sub">Ministry of Home Affairs — NCRP &amp; SAHYOG Intelligence Grid</div>
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

                    {currentPortal === 'police' && isPoliceAuth && (
                        <div className="segmented">
                            <button className={activeLayer === 'forensics' ? 'active on-navy' : ''} onClick={() => setActiveLayer('forensics')}>Forensics Canvas</button>
                            <button className={activeLayer === 'dashboard' ? 'active on-navy' : ''} onClick={() => setActiveLayer('dashboard')}>Intelligence Grid</button>
                            <button className={activeLayer === 'dossier' ? 'active on-navy' : ''} onClick={() => setActiveLayer('dossier')}>Court Dossier</button>
                        </div>
                    )}

                    <div className="row-gap" style={{ alignItems: 'center' }}>
                        {currentPortal === 'police' && isPoliceAuth && (
                            <>
                                <button className="btn btn-rust btn-sm" onClick={handleLaunchDispatch}>Freeze VASP</button>
                                <button className="btn btn-navy btn-sm" onClick={handleExportPDF}>PDF Dossier</button>
                                <button
                                    className="btn btn-outline-invert btn-sm"
                                    onClick={() => { setDemoActive(true); setDemoStep(0); setActiveLayer('forensics'); handleSelectChain('ethereum'); }}
                                >
                                    Demo Tour
                                </button>
                                <div className="session-chip">
                                    <span className="dot" /> <span>IO-9921</span>
                                    <button onClick={handlePoliceLogout}>Exit</button>
                                </div>
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
                <div className="landing">
                    <span className="landing-flag">सत्यमेव जयते &nbsp;·&nbsp; Government of India &nbsp;·&nbsp; I4C</span>
                    <h1 className="landing-title">CYCLOPS</h1>
                    <div className="landing-kicker">Federal Cryptocurrency Forensics &amp; VASP Attribution Terminal</div>
                    <p className="landing-lede">
                        A financial intelligence terminal connecting victim-reported scam wallets, multi-hop blockchain
                        analytics, and statutory Section 91 Cr.P.C. / BNSS asset freezes inside the critical Golden Hour.
                    </p>

                    <div className="status-row">
                        <span className="pill pill-green">1930 Citizen Helpline Gateway Online</span>
                        <span className="pill pill-navy">FIU-IND Compliant VASPs Indexed (28 Registered)</span>
                        <span className="pill pill-rust">Section 91 Cr.P.C. / BNSS Requisitions Automated</span>
                    </div>

                    <div className="portal-grid">
                        {/* CITIZEN PORTAL CARD */}
                        <div className="portal-card" onClick={() => setCurrentPortal('citizen')}>
                            <div>
                                <div className="portal-card-head">
                                    <div>
                                        <h2>Citizen 1930 Helpline Portal</h2>
                                        <div className="sub" style={{ color: 'var(--green)' }}>Public complaint intake &amp; freeze tracker</div>
                                    </div>
                                    <span className="pill pill-green">Public</span>
                                </div>
                                <p>
                                    For anyone defrauded through Telegram tasks, fake forex platforms, or extortion.
                                    File a complaint, trigger automated on-chain tracing, and track officer action in real time.
                                </p>
                                <div className="check-list">
                                    <div><span className="mark">✓</span> Instant incident lodging &amp; NCRP docket number</div>
                                    <div><span className="mark">✓</span> Five-stage investigation timeline with timestamps</div>
                                    <div><span className="mark">✓</span> Assigned investigating officer details</div>
                                    <div><span className="mark">✓</span> Golden Hour emergency asset-freeze protection</div>
                                </div>
                            </div>
                            <button className="btn btn-green btn-block">Lodge incident / track case</button>
                        </div>

                        {/* POLICE PORTAL CARD */}
                        <div className="portal-card" onClick={() => setCurrentPortal('police')}>
                            <div>
                                <div className="portal-card-head">
                                    <div>
                                        <h2>Law Enforcement &amp; Police Grid</h2>
                                        <div className="sub" style={{ color: 'var(--navy)' }}>I4C &amp; state cyber cell operations</div>
                                    </div>
                                    <span className="pill pill-rust">Restricted</span>
                                </div>
                                <p>
                                    Gated operational centre for verified cybercrime officers: multi-hop graph analytics
                                    across Ethereum, Tron &amp; Bitcoin, AI topological heuristics, and SAHYOG VASP freeze notices.
                                </p>
                                <div className="check-list">
                                    <div><span className="mark">✓</span> Multi-chain graph traversal (ETH, Tron USDT, BTC, bridges)</div>
                                    <div><span className="mark">✓</span> Automated VASP attribution (Binance, CoinDCX, WazirX)</div>
                                    <div><span className="mark">✓</span> AI / ML topological heuristics &amp; anomaly detection</div>
                                    <div><span className="mark">✓</span> SAHYOG freeze notice &amp; tamper-proof court PDF dossier</div>
                                </div>
                            </div>
                            <button className="btn btn-navy btn-block">Officer verification &amp; access</button>
                        </div>
                    </div>

                    <div className="telemetry-row">
                        <span><strong>142</strong> active dockets monitored</span>
                        <span>·</span>
                        <span><strong>₹48.87M</strong> in stolen assets traced</span>
                        <span>·</span>
                        <span><strong>1.2s</strong> avg. VASP attribution speed</span>
                        <span>·</span>
                        <span><strong>87.4%</strong> Golden Hour freeze success rate</span>
                    </div>
                </div>
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

            {/* ===================== CITIZEN PORTAL ===================== */}
            {currentPortal === 'citizen' && (
                <div className="form-shell">
                    <div className="form-card">
                        <div className="form-head">
                            <h2>National Cybercrime Citizen Helpline (1930)</h2>
                            <p>Direct incident filing &amp; automated emergency asset-freeze protocol</p>
                        </div>

                        {!citizenSubmitted ? (
                            <form onSubmit={handleCitizenSubmit} className="stack">
                                <div className="form-grid-2">
                                    <div>
                                        <label className="field-label">Your full name</label>
                                        <input
                                            className="field-input" type="text" placeholder="e.g. Vikramaditya Sen"
                                            value={citizenName} onChange={(e) => setCitizenName(e.target.value)} required
                                        />
                                    </div>
                                    <div>
                                        <label className="field-label">Registered mobile number</label>
                                        <input
                                            className="field-input" type="tel" placeholder="+91 98765-XXXXX"
                                            value={citizenPhone} onChange={(e) => setCitizenPhone(e.target.value)} required
                                        />
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
                                    <label className="field-label">Suspect wallet address (where you sent crypto)</label>
                                    <input
                                        className="field-input mono" type="text" placeholder="0x... or Tron/BTC address"
                                        value={citizenWallet} onChange={(e) => setCitizenWallet(e.target.value)} required
                                    />
                                </div>

                                <div>
                                    <label className="field-label">Amount defrauded (INR &amp; crypto)</label>
                                    <input
                                        className="field-input" type="text" placeholder="e.g. ₹6,50,000 (2.50 ETH)"
                                        value={citizenLoss} onChange={(e) => setCitizenLoss(e.target.value)} required
                                    />
                                </div>

                                <div className="demo-fill-row">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCitizenName('Pooja Bhatia');
                                            setCitizenPhone('+91 98112-99821');
                                            setCitizenScamType('Task-Based Telegram Part-Time Scam');
                                            setCitizenWallet('0x9999a3b2e5f8841a0e889b41a91e1d092cb3e4a1');
                                            setCitizenLoss('₹12,12,500 (4.85 ETH)');
                                        }}
                                    >
                                        Demo fill: Telegram task fraud
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCitizenName('Suresh Menon');
                                            setCitizenPhone('+91 94451-22301');
                                            setCitizenScamType('Fake Forex / Crypto Investment Scam');
                                            setCitizenWallet('TScam9999a3b2e5f8841a0e889b41a91e1d092');
                                            setCitizenLoss('₹20,50,000 (25,000 USDT)');
                                        }}
                                    >
                                        Demo fill: Tron USDT forex scam
                                    </button>
                                </div>

                                <button type="submit" className="btn btn-green btn-block" style={{ marginTop: 4 }}>
                                    Submit complaint &amp; start emergency freeze
                                </button>
                            </form>
                        ) : (
                            <div className="stack">
                                <div className="case-summary">
                                    <div className="label">Incident lodged successfully</div>
                                    <div className="docket">{citizenDocket}</div>
                                    <div className="note">Automated on-chain attribution pipeline initiated within the Golden Hour window.</div>
                                </div>

                                <div className="officer-card">
                                    <div className="officer-card-head">
                                        <div>
                                            <div className="label">Assigned investigating officer</div>
                                            <div className="value">Insp. R. Sharma (Badge: IO-I4C-9921)</div>
                                            <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>Cyber Crime Police Station, Special Cell, New Delhi</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div className="label">Estimated resolution</div>
                                            <div className="value" style={{ color: 'var(--green)' }}>Within 48–72 hours</div>
                                            <div style={{ fontSize: 11, color: 'var(--amber)' }}>Golden Hour freeze requisition active</div>
                                        </div>
                                    </div>

                                    <div className="eyebrow" style={{ marginBottom: 12 }}>Investigation lifecycle &amp; verified timestamps</div>

                                    <div className="timeline">
                                        <div className="timeline-item">
                                            <span className="timeline-time" style={{ background: 'var(--green)' }}>14:32:05 IST</span>
                                            <div>
                                                <div className="t-title">Stage 1 · Incident registered on NCRP / 1930 Helpline</div>
                                                <div className="t-desc">Complaint verified. Cryptographic evidence hash sealed on the national docket.</div>
                                            </div>
                                        </div>
                                        <div className="timeline-item">
                                            <span className="timeline-time" style={{ background: 'var(--green)' }}>14:32:08 IST</span>
                                            <div>
                                                <div className="t-title">Stage 2 · Automated multi-hop blockchain tracing completed</div>
                                                <div className="t-desc">Three intermediary mule accounts identified layering funds via a peel chain.</div>
                                            </div>
                                        </div>
                                        <div className="timeline-item">
                                            <span className="timeline-time" style={{ background: 'var(--navy)' }}>14:32:11 IST</span>
                                            <div>
                                                <div className="t-title">Stage 3 · Off-ramp VASP identified (Binance Hot Wallet 14)</div>
                                                <div className="t-desc">Ground-truth registry matched the terminal depository (99.4% match).</div>
                                            </div>
                                        </div>
                                        <div className="timeline-item">
                                            <span className="timeline-time" style={{ background: 'var(--amber)' }}>14:40:12 IST</span>
                                            <div>
                                                <div className="t-title">Stage 4 · Emergency Sec. 91 Cr.P.C. freeze dispatched</div>
                                                <div className="t-desc">Insp. R. Sharma served the freeze notice via the SAHYOG gateway.</div>
                                            </div>
                                        </div>
                                        <div className="timeline-item">
                                            <span className="timeline-time" style={{ background: 'var(--green)' }}>14:45:00 IST</span>
                                            <div>
                                                <div className="t-title">Stage 5 · VASP compliance acknowledged, account frozen</div>
                                                <div className="t-desc">Ticket #IND-I4C-9821 confirmed. Beneficiary debit restricted within the Golden Hour.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="row-gap">
                                    <button className="btn btn-navy" style={{ flex: 1 }} onClick={() => setCurrentPortal('police')}>
                                        Authenticate as police officer to view forensics
                                    </button>
                                    <button className="btn btn-outline" onClick={() => setCitizenSubmitted(false)}>File another report</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===================== POLICE LOGIN ===================== */}
            {currentPortal === 'police' && !isPoliceAuth && (
                <div className="form-shell">
                    <div className="form-card" style={{ maxWidth: 440 }}>
                        <div className="form-head">
                            <h2>I4C Cybercrime Forensic Grid</h2>
                            <p>Ministry of Home Affairs — Law Enforcement Officer (LEO) authentication</p>
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

                            <button type="submit" className="btn btn-navy btn-block" style={{ marginTop: 4 }}>
                                Verify credentials &amp; access grid
                            </button>
                        </form>
                    </div>
                </div>
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

                    {showDispatchModal && (
                        <div className="modal-overlay">
                            <div className="modal-card">
                                <div className="modal-head">
                                    <span className="title">SAHYOG Gateway — Statutory VASP Freeze Transmission</span>
                                    <button onClick={() => setShowDispatchModal(false)}>✕</button>
                                </div>
                                <div className="terminal-log">
                                    {dispatchLogs.map((log, i) => (
                                        <div key={i} className={log.includes('SUCCESS') || log.includes('APPLIED') ? 'ok' : ''}>{log}</div>
                                    ))}
                                </div>
                                {dispatchComplete && (
                                    <div className="modal-result">
                                        <div className="t">Legal notice delivered &amp; acknowledged</div>
                                        <div className="d">Freeze order active on the beneficiary depository under Section 91 Cr.P.C. / BNSS. Golden Hour preserved.</div>
                                    </div>
                                )}
                                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                                    <button className="btn-plain-dark" style={{ padding: '8px 18px' }} onClick={() => setShowDispatchModal(false)}>Close gateway terminal</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LAYER 1: FORENSICS CANVAS */}
                    {activeLayer === 'forensics' && (
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
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
                                    <div className="golden-hour">
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
                                        <div className="head" style={{ color: primaryAttr?.category === 'CEX' ? '#4caf7d' : '#e0876f' }}>Actionable VASP identified</div>
                                        <div className="name">{primaryAttr?.entity_name}</div>
                                        <div className="meta">Distance: {primaryAttr?.hop_distance} hops · Confidence: {primaryAttr?.confidence_score}%</div>
                                        <div className="contact"><strong>VASP desk:</strong> {primaryAttr?.compliance_contact}</div>
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div className="k" style={{ marginBottom: 8 }}>Detected typologies</div>
                                        <div className="stack" style={{ gap: 6 }}>
                                            {risk.detected_patterns?.map((p, idx) => (
                                                <div key={idx} className="typology-item">{p}</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* CENTER CANVAS */}
                                <div className="ws-center" style={{ display: (!isMobile || mobileViewTab === 'canvas') ? 'flex' : 'none' }}>
                                    <div className="ws-toolbar">
                                        <div className="chain-tabs">
                                            {CHAIN_TABS.map((c) => (
                                                <button key={c.key} className={selectedChainKey === c.key ? 'active' : ''} onClick={() => handleSelectChain(c.key)}>
                                                    {c.label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="trace-bar">
                                            <input
                                                type="text"
                                                value={suspectInput}
                                                onChange={(e) => setSuspectInput(e.target.value)}
                                                placeholder="Enter wallet address (0x..., T..., or BTC)"
                                                style={{ width: isMobile ? '100%' : 380 }}
                                            />
                                            <button onClick={() => handleTraceWallet(suspectInput)} disabled={tracingLive}>
                                                {tracingLive ? 'Tracing…' : 'Trace'}
                                            </button>
                                        </div>
                                    </div>

                                    <div ref={containerRef} className="graph-canvas" />

                                    <div className="legend-bar">
                                        <div className="items">
                                            <span className="legend-item"><span className="legend-dot" style={{ background: GRAPH_COLORS.rust }} /> Suspect origin</span>
                                            <span className="legend-item"><span className="legend-dot" style={{ background: GRAPH_COLORS.slate }} /> Mule layering</span>
                                            <span className="legend-item"><span className="legend-dot" style={{ background: GRAPH_COLORS.green }} /> Exchange / VASP</span>
                                            <span className="legend-item"><span className="legend-dot" style={{ background: GRAPH_COLORS.navy }} /> Cross-chain bridge</span>
                                        </div>
                                        <div style={{ color: '#9db4d8', fontWeight: 600 }}>Live fund-flow animation active</div>
                                    </div>
                                </div>

                                {/* RIGHT INSPECTOR */}
                                <div className="ws-inspector" style={{ width: isMobile ? '100%' : 340, display: (!isMobile || mobileViewTab === 'inspector') ? 'flex' : 'none' }}>
                                    <div className="inspector-tabs">
                                        <button className={activeTab === 'inspector' ? 'active' : ''} onClick={() => setActiveTab('inspector')}>Inspector</button>
                                        <button className={activeTab === 'custody' ? 'active' : ''} onClick={() => setActiveTab('custody')}>Custody trail</button>
                                        <button className={activeTab === 'ml' ? 'active' : ''} onClick={() => setActiveTab('ml')}>ML heuristics</button>
                                        <button className={activeTab === 'legal' ? 'active' : ''} onClick={() => setActiveTab('legal')}>Sec. 91</button>
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
                                            <div className="eyebrow">Transaction hops (audit trail)</div>
                                            {activeDataset.custody_trail.map((h, i) => (
                                                <div key={i} className="hop-card">
                                                    <div className="top">
                                                        <span style={{ color: '#9db4d8', fontWeight: 700 }}>Hop #{h.hop}</span>
                                                        <span style={{ color: '#4caf7d', fontWeight: 700 }}>{h.value_eth} {h.token} (₹{h.value_inr.toLocaleString('en-IN')})</span>
                                                    </div>
                                                    <div className="ws-muted" style={{ fontSize: 11, marginBottom: 4 }}>
                                                        Target: <strong style={{ color: '#e7e5dd' }}>{h.to_name}</strong>
                                                    </div>
                                                    <div className="tx">Tx: {h.tx_hash.slice(0, 24)}...</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {activeTab === 'ml' && (
                                        <div className="inspector-body">
                                            <div className="eyebrow">Forensic ML topology analyzer</div>
                                            <div className="ws-panel">
                                                <div className="k" style={{ marginBottom: 0 }}>Model architecture</div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: '#9db4d8', margin: '2px 0 8px' }}>{mlData.model_name}</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                                    <span className="ws-muted">Predicted entity</span>
                                                    <strong style={{ color: '#4caf7d' }}>{mlData.predicted_type}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                                    <span className="ws-muted">Inference confidence</span>
                                                    <strong style={{ color: '#9db4d8' }}>{mlData.confidence}%</strong>
                                                </div>
                                            </div>

                                            <div className="eyebrow">Topological feature vector</div>
                                            <div className="stack" style={{ gap: 6 }}>
                                                {mlData.features.map((f, i) => (
                                                    <div key={i} className="feature-row">
                                                        <div>
                                                            <div style={{ fontWeight: 600 }}>{f.name}</div>
                                                            <div style={{ fontSize: 10 }} className="ws-muted">Baseline: {f.normal}</div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontWeight: 700, marginBottom: 2 }}>{f.value}</div>
                                                            <span
                                                                className="status-tag"
                                                                style={{
                                                                    background: (f.status === 'ANOMALY' || f.status === 'CRITICAL') ? 'rgba(224,101,74,0.2)' : 'rgba(157,180,216,0.2)',
                                                                    color: (f.status === 'ANOMALY' || f.status === 'CRITICAL') ? '#e0654a' : '#9db4d8'
                                                                }}
                                                            >
                                                                {f.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
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
                        </div>
                    )}

                    {/* LAYER 2: NATIONAL INTELLIGENCE GRID */}
                    {activeLayer === 'dashboard' && (
                        <div className="intel-grid" style={{ background: '#0f1117', color: '#e7e5dd' }}>
                            <h2>National Cyber-Forensics Threat Intelligence Grid</h2>
                            <p>Aggregated telemetry across state cyber cells, NCRP intake, and VASP freeze compliance.</p>

                            <div className="stat-grid">
                                <div className="stat-card">
                                    <div className="label">Total assets traced (FY 2026)</div>
                                    <div className="num" style={{ color: '#4caf7d' }}>₹48,87,500</div>
                                    <div className="sub">Across 142 cybercrime dockets</div>
                                </div>
                                <div className="stat-card">
                                    <div className="label">FIU-IND compliant VASPs</div>
                                    <div className="num" style={{ color: '#9db4d8' }}>28 registered</div>
                                    <div className="sub">CoinDCX, WazirX, Binance, CoinSwitch</div>
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
                                <h3 style={{ fontSize: 16, marginBottom: 16 }}>Active fraud typologies (NCRP ingestion stream)</h3>
                                <div className="typology-grid">
                                    <div className="typology-card">
                                        <div className="h" style={{ color: '#e0654a' }}>Telegram part-time job scams</div>
                                        <p>Victims are coerced into sending small sums that escalate, layered via 2–3 burner mules before a Binance/CoinDCX deposit.</p>
                                    </div>
                                    <div className="typology-card">
                                        <div className="h" style={{ color: '#d9a441' }}>Tron TRC-20 forex fraud</div>
                                        <p>Low-gas USDT transfers designed to evade bank scrutiny, with rapid off-ramping into international exchange deposit pools.</p>
                                    </div>
                                    <div className="typology-card">
                                        <div className="h" style={{ color: '#9db4d8' }}>Cross-chain bridge layering</div>
                                        <p>Scammers jump funds from Ethereum to Polygon or Arbitrum specifically to sever single-chain investigator trails.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LAYER 3: COURT EVIDENCE DOSSIER */}
                    {activeLayer === 'dossier' && (
                        <div className="dossier-shell">
                            <div className="dossier-page">
                                <div style={{ textAlign: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: 16, marginBottom: 20 }}>
                                    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1e3a8a', letterSpacing: 0.5 }}>INDIAN CYBER CRIME COORDINATION CENTRE (I4C)</div>
                                    <div style={{ fontSize: 13, fontWeight: 'bold' }}>MINISTRY OF HOME AFFAIRS | GOVERNMENT OF INDIA</div>
                                    <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>STATUTORY BLOCKCHAIN FORENSIC INTELLIGENCE DOSSIER (SIH26183)</div>
                                </div>

                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20, background: '#f8fafc' }}>
                                    <tbody>
                                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: 8, fontWeight: 'bold', width: '25%' }}>NCRP Docket Ref:</td>
                                            <td style={{ padding: 8, width: '25%' }}>{activeDataset.caseMeta.docket_no}</td>
                                            <td style={{ padding: 8, fontWeight: 'bold', width: '25%' }}>Date of Analysis:</td>
                                            <td style={{ padding: 8, width: '25%' }}>06-SEP-2026</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: 8, fontWeight: 'bold' }}>Complainant:</td>
                                            <td style={{ padding: 8 }}>{activeDataset.caseMeta.victim_name}</td>
                                            <td style={{ padding: 8, fontWeight: 'bold' }}>Reported Loss:</td>
                                            <td style={{ padding: 8, color: '#dc2626', fontWeight: 'bold' }}>{activeDataset.caseMeta.reported_loss}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: 8, fontWeight: 'bold' }}>Suspect Origin:</td>
                                            <td style={{ padding: 8, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 11 }}>{suspectInput}</td>
                                            <td style={{ padding: 8, fontWeight: 'bold' }}>Attributed VASP:</td>
                                            <td style={{ padding: 8, fontWeight: 'bold', color: '#059669' }}>{primaryAttr?.entity_name} ({primaryAttr?.hop_distance} Hops)</td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div style={{ fontSize: 13, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 8 }}>1. TRANSACTION CHAIN OF CUSTODY (AUDIT TRAIL)</div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 24 }}>
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
                                        {activeDataset.custody_trail.map((h, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #cbd5e1', background: idx % 2 === 0 ? '#ffffff' : '#f1f5f9' }}>
                                                <td style={{ padding: 6, textAlign: 'center', fontWeight: 'bold' }}>{h.hop}</td>
                                                <td style={{ padding: 6, fontFamily: 'monospace' }}>{h.from_addr.slice(0, 10)}...</td>
                                                <td style={{ padding: 6, fontWeight: 'bold' }}>{h.to_name}</td>
                                                <td style={{ padding: 6, textAlign: 'right' }}>{h.value_eth} {h.token}</td>
                                                <td style={{ padding: 6, textAlign: 'right', fontWeight: 'bold' }}>₹{h.value_inr.toLocaleString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div style={{ fontSize: 13, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 8 }}>2. STATUTORY DIRECTIVE UNDER SECTION 91 Cr.P.C. / BNSS 2023</div>
                                <div style={{ fontSize: 11, lineHeight: 1.6, background: '#f8fafc', border: '1px solid #cbd5e1', padding: 12, borderRadius: 4, marginBottom: 30 }}>
                                    <strong>TO: Compliance Officer, {primaryAttr?.entity_name}</strong><br />
                                    WHEREAS an official investigation is underway regarding cyber fraud registered under NCRP Docket {activeDataset.caseMeta.docket_no}.
                                    The cryptographic assets listed in Table 1 have been traced as direct proceeds of crime entering your liquidity pool.<br />
                                    <strong>YOU ARE HEREBY DIRECTED TO:</strong><br />
                                    1. Immediately FREEZE all internal withdrawal and debit facilities associated with the recipient user account.<br />
                                    2. Furnish complete subscriber KYC records (Aadhaar/Passport, Registered Mobile, PAN, Bank Off-Ramp) and IP login logs within 24 hours of receipt.
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 11, color: '#475569' }}>
                                    <div>
                                        <div>Generated by: <strong>Automated Blockchain Forensics Grid (SIH26183)</strong></div>
                                        <div>Hash Verification: <code>0x8f2b...9a12</code> (Tamper-Proof)</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 'bold' }}>Investigating Officer (Cyber Crime PS)</div>
                                        <div>Indian Cyber Crime Coordination Centre (I4C)</div>
                                        <div style={{ marginTop: 10 }}>
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
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
