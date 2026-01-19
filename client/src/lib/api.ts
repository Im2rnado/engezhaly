const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'x-auth-token': token } : {})
    };
};

export const api = {
    auth: {
        register: async (data: any) => {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Registration failed');
            return result;
        },
        login: async (data: any) => {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/af39f742-c19f-4f52-bc15-a738b0e1aa96', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'client/src/lib/api.ts:24', message: 'Login attempt', data: { identifier: data.identifier }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: '1' }) }).catch(() => { });
            // #endregion
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/af39f742-c19f-4f52-bc15-a738b0e1aa96', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'client/src/lib/api.ts:31', message: 'Login response', data: { status: res.status, success: res.ok }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: '1' }) }).catch(() => { });
            // #endregion

            if (!res.ok) {
                throw new Error(result.message || 'Login failed');
            }
            return result;
        },
        forgotPassword: async (email: string) => {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Failed to send reset email');
            return result;
        }
    },
    freelancer: {
        getTopFreelancers: async () => {
            const res = await fetch(`${API_URL}/freelancer/top`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) throw new Error('Failed to fetch top freelancers');
            return res.json();
        },
        updateProfile: async (data: any) => {
            const res = await fetch(`${API_URL}/freelancer/profile`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return res.json();
        },
        getProfile: async () => {
            const res = await fetch(`${API_URL}/freelancer/profile`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch profile');
            return res.json();
        },
        getPublicProfile: async (id: string) => {
            const res = await fetch(`${API_URL}/freelancer/${id}/public`, {
                method: 'GET'
            });
            if (!res.ok) throw new Error('Failed to fetch freelancer profile');
            return res.json();
        }
    },
    client: {
        getProfile: async () => {
            const res = await fetch(`${API_URL}/client/profile`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch profile');
            return res.json();
        },
        updateProfile: async (data: any) => {
            const res = await fetch(`${API_URL}/client/profile`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update profile');
            return res.json();
        },
        getMyJobs: async () => {
            const res = await fetch(`${API_URL}/client/jobs`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch jobs');
            return res.json();
        },
        getJobById: async (id: string) => {
            const res = await fetch(`${API_URL}/client/jobs/${id}`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch job');
            return res.json();
        },
        updateJob: async (id: string, data: any) => {
            const res = await fetch(`${API_URL}/client/jobs/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update job');
            return res.json();
        },
        deleteJob: async (id: string) => {
            const res = await fetch(`${API_URL}/client/jobs/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to delete job');
            return res.json();
        },
        getMyOrders: async () => {
            const res = await fetch(`${API_URL}/client/orders`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch orders');
            return res.json();
        }
    },
    jobs: {
        create: async (data: any) => {
            const res = await fetch(`${API_URL}/jobs`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return res.json();
        },
        getAll: async () => {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/af39f742-c19f-4f52-bc15-a738b0e1aa96', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'client/src/lib/api.ts:63', message: 'Fetching all jobs', data: {}, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: '1' }) }).catch(() => { });
            // #endregion
            const res = await fetch(`${API_URL}/jobs`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch jobs');
            return res.json();
        },
        apply: async (id: string, data: any) => {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/af39f742-c19f-4f52-bc15-a738b0e1aa96', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'client/src/lib/api.ts:74', message: 'Applying to job', data: { jobId: id, ...data }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: '5' }) }).catch(() => { });
            // #endregion
            const res = await fetch(`${API_URL}/jobs/${id}/apply`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.msg || 'Failed to apply');
            }
            return res.json();
        }
    },
    projects: {
        create: async (data: any) => {
            const res = await fetch(`${API_URL}/projects`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create project');
            return res.json();
        },
        getAll: async () => {
            const res = await fetch(`${API_URL}/projects`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch projects');
            return res.json();
        },
        getMyProjects: async () => {
            const res = await fetch(`${API_URL}/projects/my-projects`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch my projects');
            return res.json();
        },
        getById: async (id: string) => {
            const res = await fetch(`${API_URL}/projects/${id}`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch project');
            return res.json();
        },
        update: async (id: string, data: any) => {
            const res = await fetch(`${API_URL}/projects/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update project');
            return res.json();
        },
        getActiveOrder: async (projectId: string) => {
            try {
                const res = await fetch(`${API_URL}/client/orders/project/${projectId}/active`, {
                    method: 'GET',
                    headers: getHeaders()
                });
                if (!res.ok) return null;
                return res.json();
            } catch {
                return null;
            }
        },
        getAllActiveOrders: async () => {
            try {
                const res = await fetch(`${API_URL}/client/orders/active`, {
                    method: 'GET',
                    headers: getHeaders()
                });
                if (!res.ok) return [];
                return res.json();
            } catch {
                return [];
            }
        }
    },
    chat: {
        getConversations: async () => {
            const res = await fetch(`${API_URL}/chat/conversations`, {
                method: 'GET',
                headers: getHeaders()
            });
            return res.json();
        },
        getMessages: async (id: string) => {
            const res = await fetch(`${API_URL}/chat/messages/${id}`, {
                method: 'GET',
                headers: getHeaders()
            });
            return res.json();
        },
        sendMessage: async (data: any) => {
            const res = await fetch(`${API_URL}/chat/messages`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return res.json();
        },
        createOffer: async (data: any) => {
            const res = await fetch(`${API_URL}/chat/offers`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create offer');
            return res.json();
        },
        acceptOffer: async (offerId: string) => {
            const res = await fetch(`${API_URL}/chat/offers/${offerId}/accept`, {
                method: 'POST',
                headers: getHeaders(),
            });
            if (!res.ok) throw new Error('Failed to accept offer');
            return res.json();
        },
        getOffers: async (conversationId: string) => {
            const res = await fetch(`${API_URL}/chat/offers/${conversationId}`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch offers');
            return res.json();
        }
    },
    admin: {
        getPendingFreelancers: async () => {
            const res = await fetch(`${API_URL}/admin/freelancers/pending`, {
                method: 'GET',
                headers: getHeaders()
            });
            return res.json();
        },
        approveFreelancer: async (id: string) => {
            const res = await fetch(`${API_URL}/admin/freelancers/${id}/approve`, {
                method: 'PUT',
                headers: getHeaders()
            });
            return res.json();
        },
        rejectFreelancer: async (id: string) => {
            const res = await fetch(`${API_URL}/admin/freelancers/${id}/reject`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return res.json();
        },
        getActiveChats: async () => {
            const res = await fetch(`${API_URL}/admin/chats`, {
                method: 'GET',
                headers: getHeaders()
            });
            return res.json();
        },
        freezeChat: async (id: string) => {
            const res = await fetch(`${API_URL}/admin/chats/${id}/freeze`, {
                method: 'PUT',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to freeze chat');
            return res.json();
        },
        unfreezeChat: async (id: string) => {
            const res = await fetch(`${API_URL}/admin/chats/${id}/unfreeze`, {
                method: 'PUT',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to unfreeze chat');
            return res.json();
        },
        addStrike: async (id: string) => {
            const res = await fetch(`${API_URL}/admin/users/${id}/strike`, {
                method: 'POST',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to add strike');
            return res.json();
        },
        toggleEmployeeOfMonth: async (id: string) => {
            const res = await fetch(`${API_URL}/admin/freelancers/${id}/employee-of-month`, {
                method: 'PUT',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to toggle reward');
            return res.json();
        },
        getInsights: async () => {
            const res = await fetch(`${API_URL}/admin/insights`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch insights');
            return res.json();
        },
        searchUser: async (query: string) => {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/af39f742-c19f-4f52-bc15-a738b0e1aa96', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'client/src/lib/api.ts:208', message: 'Searching user', data: { query }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: '4' }) }).catch(() => { });
            // #endregion
            const res = await fetch(`${API_URL}/admin/users/search?query=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('User not found');
            return res.json();
        },
        getAllUsers: async () => {
            const res = await fetch(`${API_URL}/admin/users`, {
                method: 'GET',
                headers: getHeaders()
            });
            return res.json();
        },
        updateUser: async (id: string, data: any) => {
            const res = await fetch(`${API_URL}/admin/users/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return res.json();
        },
        deleteUser: async (id: string) => {
            const res = await fetch(`${API_URL}/admin/users/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return res.json();
        },
        getAllProjects: async () => {
            const res = await fetch(`${API_URL}/admin/projects`, {
                method: 'GET',
                headers: getHeaders()
            });
            return res.json();
        },
        updateProject: async (id: string, data: any) => {
            const res = await fetch(`${API_URL}/admin/projects/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return res.json();
        },
        deleteProject: async (id: string) => {
            const res = await fetch(`${API_URL}/admin/projects/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return res.json();
        },
        getAllJobs: async () => {
            const res = await fetch(`${API_URL}/admin/jobs`, {
                method: 'GET',
                headers: getHeaders()
            });
            return res.json();
        },
        updateJob: async (id: string, data: any) => {
            const res = await fetch(`${API_URL}/admin/jobs/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return res.json();
        },
        deleteJob: async (id: string) => {
            const res = await fetch(`${API_URL}/admin/jobs/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return res.json();
        },
        getAllOrders: async () => {
            const res = await fetch(`${API_URL}/admin/orders`, {
                method: 'GET',
                headers: getHeaders()
            });
            return res.json();
        },
        updateOrder: async (id: string, data: any) => {
            const res = await fetch(`${API_URL}/admin/orders/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return res.json();
        },
        getAllTransactions: async () => {
            const res = await fetch(`${API_URL}/admin/transactions`, {
                method: 'GET',
                headers: getHeaders()
            });
            return res.json();
        },
        getTopFreelancers: async () => {
            const res = await fetch(`${API_URL}/admin/top-freelancers`, {
                method: 'GET',
                headers: getHeaders()
            });
            return res.json();
        }
    },
    wallet: {
        topUp: async (data: any) => {
            const res = await fetch(`${API_URL}/wallet/topup`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Top up failed');
            return res.json();
        },
        getBalance: async () => {
            const res = await fetch(`${API_URL}/wallet/balance`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch balance');
            return res.json();
        },
        getTransactions: async () => {
            const res = await fetch(`${API_URL}/wallet/transactions`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch transactions');
            return res.json();
        }
    }
};
