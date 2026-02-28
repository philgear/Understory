import { TranscriptEntry } from '../services/clinical-intelligence.service';

export interface VerificationIssue {
    severity: 'low' | 'medium' | 'high';
    message: string;
    suggestedFix?: string;
    claim?: string; // The specific text in the report that is being flagged
}

export interface SummaryNodeItem {
    id: string;
    html: string;
    bracketState: 'normal' | 'added' | 'removed';
    note: string;
    showNote: boolean;
    isDictating?: boolean;
    key: string;
    suggestions?: string[];
    proposedText?: string;
    verificationStatus?: 'verified' | 'unverified' | 'warning' | 'error';
    verificationIssues?: VerificationIssue[];
}

export interface SummaryNode {
    id: string;
    type: 'raw' | 'paragraph' | 'list';
    rawHtml?: string;
    ordered?: boolean;
    items?: SummaryNodeItem[];
    bracketState: 'normal' | 'added' | 'removed';
    note: string;
    showNote: boolean;
    isDictating?: boolean;
    key: string;
    suggestions?: string[];
    proposedText?: string;
    verificationStatus?: 'verified' | 'unverified' | 'warning' | 'error';
    verificationIssues?: VerificationIssue[];
}

export interface ReportSection {
    raw: string;
    heading: string;
    title: string;
    icon: string;
    nodes: SummaryNode[];
}

export interface ParsedTranscriptEntry extends TranscriptEntry {
    htmlContent?: string;
}

export type NodeAnnotation = {
    note: string,
    bracketState: 'normal' | 'added' | 'removed',
    modifiedText?: string
};
export type LensAnnotations = Record<string, Record<string, NodeAnnotation>>;
