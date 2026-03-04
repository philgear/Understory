import { Injectable } from '@angular/core';

// ─── Rich Media Card Interfaces ───────────────────────────────────────────────

export interface ThreeJsModel {
    id: string;
    name: string;
    description: string;
    threejsId: string;
    severity?: 'green' | 'yellow' | 'red';
    afflictionHighlight?: string;
    particles?: boolean;
}

export interface WikimediaImage {
    title: string;
    url: string;
    thumbUrl: string;
    descriptionUrl: string;
    credit: string;
    license: string;
}

export interface PubmedCitation {
    pmid: string;
    title: string;
    authors: string;
    journal: string;
    year: string;
    abstract: string;
    url: string;
}

export interface PhilImage {
    id: number;
    url: string;
    thumbUrl: string;
    title: string;
    credit: string;
}

export type RichCardKind = 'model-3d' | 'image-gallery' | 'pubmed-refs' | 'phil-image';

export interface RichMediaCard {
    kind: RichCardKind;
    query: string;
    severity?: 'green' | 'yellow' | 'red';
    afflictionHighlight?: string;
    particles?: boolean;
    // Resolved data (populated after fetching)
    models?: ThreeJsModel[];
    images?: WikimediaImage[];
    citations?: PubmedCitation[];
    philImages?: PhilImage[];
    // Loading state
    loading?: boolean;
    error?: string;
}

// ─── Curated Three.js Procedural Registry ────────────────────────────────────
// Rendered locally using procedural shapes in Medical3DViewerComponent

const THREEJS_REGISTRY: Record<string, ThreeJsModel[]> = {
    'spine': [
        {
            id: 'spine',
            name: 'Vertebral Column',
            description: 'Procedural spine segment',
            threejsId: 'spine'
        }
    ],
    'vertebra': [
        {
            id: 'spine',
            name: 'Vertebra Segment',
            description: 'Procedural vertebral segment',
            threejsId: 'spine'
        }
    ],
    'disc herniation': [
        {
            id: 'spine',
            name: 'Spinal Structure',
            description: 'Procedural spine segment',
            threejsId: 'spine'
        }
    ],
    'heart': [
        {
            id: 'heart',
            name: 'Human Heart',
            description: 'Procedural cardiac form',
            threejsId: 'heart'
        }
    ],
    'brain': [
        {
            id: 'brain',
            name: 'Human Brain',
            description: 'Procedural neurological visualization',
            threejsId: 'brain'
        }
    ],
    'lungs': [
        {
            id: 'lungs',
            name: 'Human Lungs',
            description: 'Procedural pulmonary system',
            threejsId: 'lungs'
        }
    ],
    'default': [
        {
            id: 'generic',
            name: 'Organ System Reference',
            description: 'Procedural internal volume reference',
            threejsId: 'generic'
        }
    ]
};

// ─── Curated PHIL Image Registry ─────────────────────────────────────────────
// Public domain CDC images — no API key required

const PHIL_REGISTRY: Record<string, PhilImage[]> = {
    'spine': [
        { id: 9501, url: 'https://phil.cdc.gov/PHIL_Images/9501/9501.jpg', thumbUrl: 'https://phil.cdc.gov/PHIL_Images/9501/9501_lores.jpg', title: 'Spinal anatomy diagram', credit: 'CDC/PHIL' },
    ],
    'pain': [
        { id: 23258, url: 'https://phil.cdc.gov/PHIL_Images/23258/23258.jpg', thumbUrl: 'https://phil.cdc.gov/PHIL_Images/23258/23258_lores.jpg', title: 'Chronic pain clinical assessment', credit: 'CDC/PHIL' },
    ],
    'opioid': [
        { id: 22940, url: 'https://phil.cdc.gov/PHIL_Images/22940/22940.jpg', thumbUrl: 'https://phil.cdc.gov/PHIL_Images/22940/22940_lores.jpg', title: 'Opioid prescribing awareness', credit: 'CDC/PHIL' },
    ],
    'depression': [
        { id: 23095, url: 'https://phil.cdc.gov/PHIL_Images/23095/23095.jpg', thumbUrl: 'https://phil.cdc.gov/PHIL_Images/23095/23095_lores.jpg', title: 'Mental health and depression', credit: 'CDC/PHIL' },
    ],
    'default': [
        { id: 11162, url: 'https://phil.cdc.gov/PHIL_Images/11162/11162.jpg', thumbUrl: 'https://phil.cdc.gov/PHIL_Images/11162/11162_lores.jpg', title: 'Clinical care setting', credit: 'CDC/PHIL' },
    ]
};

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class RichMediaService {

    // ─── Procedural Models (local registry) ───────────────────────────────────

    getThreeJsModels(query: string): ThreeJsModel[] {
        const q = query.toLowerCase();
        for (const key of Object.keys(THREEJS_REGISTRY)) {
            if (key === 'default') continue;
            if (q.includes(key)) return THREEJS_REGISTRY[key];
        }
        return THREEJS_REGISTRY['default'];
    }

    // ─── PHIL (curated registry) ─────────────────────────────────────────────

    getPhilImages(query: string): PhilImage[] {
        const q = query.toLowerCase();
        for (const key of Object.keys(PHIL_REGISTRY)) {
            if (key === 'default') continue;
            if (q.includes(key)) return PHIL_REGISTRY[key];
        }
        return PHIL_REGISTRY['default'];
    }

    // ─── Wikimedia Commons ───────────────────────────────────────────────────

    async searchWikimediaImages(query: string, limit = 6): Promise<WikimediaImage[]> {
        const encoded = encodeURIComponent(`${query} anatomy medical`);
        const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encoded}&gsrlimit=${limit}&prop=imageinfo&iiprop=url|descriptionurl|extmetadata&iiurlwidth=400&format=json&origin=*`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            const pages = data?.query?.pages ?? {};

            return Object.values(pages)
                .map((p: any) => {
                    const ii = p.imageinfo?.[0];
                    if (!ii?.url) return null;
                    const meta = ii.extmetadata ?? {};
                    return {
                        title: p.title?.replace('File:', '') ?? '',
                        url: ii.url,
                        thumbUrl: ii.thumburl ?? ii.url,
                        descriptionUrl: ii.descriptionurl ?? '',
                        credit: meta.Credit?.value?.replace(/<[^>]+>/g, '') ?? 'Wikimedia Commons',
                        license: meta.LicenseShortName?.value ?? 'See source'
                    } as WikimediaImage;
                })
                .filter((img): img is WikimediaImage => img !== null)
                .filter(img => img.url.match(/\.(jpg|jpeg|png|svg|webp)$/i));
        } catch {
            return [];
        }
    }

    // ─── PubMed ──────────────────────────────────────────────────────────────

    async searchPubmed(query: string, limit = 3): Promise<PubmedCitation[]> {
        const encoded = encodeURIComponent(query);
        const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encoded}&retmax=${limit}&retmode=json&sort=relevance`;

        try {
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();
            const ids: string[] = searchData?.esearchresult?.idlist ?? [];
            if (ids.length === 0) return [];

            const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
            const summaryRes = await fetch(summaryUrl);
            const summaryData = await summaryRes.json();
            const result = summaryData?.result ?? {};

            return ids.map(id => {
                const doc = result[id];
                if (!doc) return null;
                const authors = (doc.authors ?? []).slice(0, 3).map((a: any) => a.name).join(', ');
                return {
                    pmid: id,
                    title: doc.title ?? '',
                    authors: authors + (doc.authors?.length > 3 ? ' et al.' : ''),
                    journal: doc.source ?? '',
                    year: doc.pubdate?.split(' ')[0] ?? '',
                    abstract: doc.title ?? '', // summary doesn't include abstract — use title for preview
                    url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
                } as PubmedCitation;
            }).filter((c): c is PubmedCitation => c !== null);
        } catch {
            return [];
        }
    }

    // ─── Resolve a card (fetches live data if needed) ─────────────────────────

    async resolveCard(card: RichMediaCard): Promise<RichMediaCard> {
        switch (card.kind) {
            case 'model-3d':
                return { ...card, models: this.getThreeJsModels(card.query), loading: false };
            case 'phil-image':
                return { ...card, philImages: this.getPhilImages(card.query), loading: false };
            case 'image-gallery':
                return { ...card, images: await this.searchWikimediaImages(card.query), loading: false };
            case 'pubmed-refs':
                return { ...card, citations: await this.searchPubmed(card.query), loading: false };
        }
    }
}
