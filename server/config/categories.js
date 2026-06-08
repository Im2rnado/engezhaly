// Must stay in sync with client/src/lib/categories.ts
const CATEGORIES = {
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
    'Marketing': [
        'Social Media Manager',
        'Media Buyer (paid ads)',
        'Email Marketing'
    ],
    'Photo/Video Editor': [
        'Video Editor - (Long / Short Content)',
        'Photo Editor',
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
};

const isValidCategorySubCategory = (category, subCategory) => {
    const allowed = CATEGORIES[category];
    return allowed && Array.isArray(allowed) && allowed.includes(subCategory);
};

module.exports = { CATEGORIES, isValidCategorySubCategory };
