export const CATEGORIES = {
    'Development & Tech': [
        'Web Developer',
        'Frontend',
        'Backend',
        'Full-Stack',
        'Mobile App Developer',
        'WordPress Developer',
        'Shopify / E-commerce Store Developer'
    ],
    'Design & Creativity': [
        'Graphic Designer',
        'Logo Designer',
        'Branding Specialist',
        'UI Designer',
        'UX Designer',
        'Clothing / Fashion Designer'
    ],
    'Digital Marketing': [
        'Social Media Manager',
        'Media Buyer (paid ads)',
        'Email Marketing'
    ],
    'Video Editor': [
        'Video Editor',
        'Video Commercials Ads',
        'Short Reels TikTok\'s'
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
        'Commercial Voice Over'
    ]
} as const;

export const MAIN_CATEGORIES = Object.keys(CATEGORIES) as string[];

export type MainCategory = keyof typeof CATEGORIES;
export type SubCategory = typeof CATEGORIES[MainCategory][number];
