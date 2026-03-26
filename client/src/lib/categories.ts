export const CATEGORIES = {
    'Development & Tech': [
        'Web Developer',
        'Frontend',
        'Backend',
        'Full-Stack',
        'Mobile App Developer',
        'Shopify / E-commerce Store Developer'
    ],
    'Design & Creative': [
        'Graphic Designer (branding)',
        'Logo Designer',
        'UI/UX Designer',
        'Clothing / Fashion Designer'
    ],
    'Digital Marketing': [
        'Social Media Manager',
        'Media Buyer (paid ads)',
        'Email Marketing'
    ],
    'Video Editor': [
        'Video Editor - (Long Content)',
        'Video Editor - (Short Content)',
    ],
    'AI and Automations': [
        'AI Content Creation (photos or videos)',
        'AI Agents',
        'Automated Systems'
    ],
    'Writing & Language': [
        'Content Writer',
        'Copywriter',
        'Translation'
    ],
    'Voice Over': [
        'Voice Over (English)',
        'Voice Over (Arabic)',
    ]
} as const;

export const MAIN_CATEGORIES = Object.keys(CATEGORIES) as string[];

export type MainCategory = keyof typeof CATEGORIES;
export type SubCategory = typeof CATEGORIES[MainCategory][number];
