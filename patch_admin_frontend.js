const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client/src/app/admin/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add state
content = content.replace(
    /const \[users, setUsers\] = useState<any\[\]>\(\[\]\);/,
    "const [users, setUsers] = useState<any[]>([]);\n    const [unverifiedUsers, setUnverifiedUsers] = useState<any[]>([]);"
);

// 2. Fetch unverified users
content = content.replace(
    /const data = await api\.admin\.getAllUsers\(\);\n\s*setUsers\(data\);/,
    "const data = await api.admin.getAllUsers();\n            setUsers(data);\n            const unverifiedData = await api.admin.getUnverifiedUsers();\n            setUnverifiedUsers(unverifiedData);"
);

// 3. Add Unverified Users list
const listTemplate = `
                        {/* Unverified Users list */}
                        <div className={\`lg:col-span-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden \${selectedUser ? 'hidden lg:block' : 'block'}\`}>
                            <div className="p-4 border-b border-gray-100">
                                <h3 className="font-bold text-gray-900">Unverified Users</h3>
                                <p className="text-sm text-gray-500">{unverifiedUsers.length} total</p>
                            </div>
                            <div className="overflow-y-auto max-h-[calc(100vh-16rem)]">
                                {usersLoading ? (
                                    <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" /></div>
                                ) : unverifiedUsers.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">No unverified users.</div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {unverifiedUsers.map(user => {
                                            const uid = user._id != null ? String(user._id) : '';
                                            const listPic = user.freelancerProfile?.profilePicture || user.clientProfile?.profilePicture;
                                            const listInitial = (user.firstName?.[0] || user.email?.[0] || '?').toUpperCase();
                                            const listOnline = uid ? (userPresenceById[uid] ?? !!user.isOnline) : false;
                                            return (
                                                <div
                                                    key={user._id}
                                                    onClick={() => handleSelectUser(user)}
                                                    className={\`p-4 cursor-pointer hover:bg-gray-50 transition-colors \${selectedUser?._id === user._id ? 'bg-[#09BF44]/10 border-l-4 border-[#09BF44]' : ''}\`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <AdminAvatarWithPresence
                                                            src={listPic}
                                                            initial={listInitial}
                                                            alt={\`\${user.firstName || ''} \${user.lastName || ''}\`.trim() || user.email}
                                                            online={listOnline}
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                                                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">Unverified</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>`;

content = content.replace(
    /<\/div>\s*<\/div>\s*\{\/\* Detail panel/,
    `</div>\n                        </div>\n${listTemplate}\n                        {/* Detail panel`
);

// 4. Update the layout of the split view since we added another column
// We have to change lg:grid-cols-3 to lg:grid-cols-4 and lg:col-span-2 to lg:col-span-2 or similar.
// Actually, stacking them vertically in the left column is better. Let's do that instead of adding a new column!

// Wait, the regex replaced it directly. So we have 3 columns now? 1 for Verified, 1 for Unverified, 2 for Detail? That's 4 columns.
content = content.replace(
    /className="grid grid-cols-1 lg:grid-cols-3 gap-6"/,
    'className="grid grid-cols-1 lg:grid-cols-4 gap-6"'
);

// 5. Add Resend Verification Email button
content = content.replace(
    /<div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs font-bold text-gray-400 mb-1">Email<\/p><p className="font-medium text-gray-900">{user.email}<\/p><\/div>/,
    \`<div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-xs font-bold text-gray-400 mb-1">Email</p>
                                <p className="font-medium text-gray-900">{user.email}</p>
                                {user.emailVerified === false && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                await api.admin.resendVerificationEmail(user._id);
                                                showModal({ title: 'Success', message: 'Verification email resent successfully.', type: 'success' });
                                            } catch (err: any) {
                                                showModal({ title: 'Error', message: err.message || 'Failed to resend email.', type: 'error' });
                                            }
                                        }}
                                        className="mt-2 text-xs font-bold text-[#09BF44] hover:underline"
                                    >
                                        Resend Verification Email
                                    </button>
                                )}
                            </div>\`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('patched frontend admin');
