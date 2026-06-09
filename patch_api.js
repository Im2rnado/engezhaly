const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client/src/lib/api.ts');
let content = fs.readFileSync(filePath, 'utf8');

const newFunctions = `
        getUnverifiedUsers: async () => {
            const res = await apiCall('/api/admin/users/unverified');
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        resendVerificationEmail: async (userId: string) => {
            const res = await apiCall(\`/api/admin/users/\${userId}/resend-verification\`, { method: 'POST' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.msg || data.message || 'Failed to resend email');
            }
            return res.json();
        },`;

content = content.replace(
    /getAllUsers:\s*async\s*\(\)\s*=>\s*\{/,
    newFunctions + '\n        getAllUsers: async () => {'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('patched api.ts');
