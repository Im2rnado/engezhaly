const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.engezhaly.com/api';

const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'x-auth-token': token } : {})
    };
};

/** Clears session and redirects to home with session_expired param for user feedback */
const handleSessionExpired = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/?session_expired=1';
    }
};

/** Returns true if response is 401 (session expired), and handles redirect */
const isUnauthorized = (res: Response): boolean => {
    if (res.status === 401) {
        handleSessionExpired();
        return true;
    }
    return false;
};

export const api = {
    auth: {
        register: async (data: any) => {
            try {
                const res = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                const result = await res.json().catch(() => ({ message: '' }));
                if (!res.ok) {
                    if (res.status === 413) throw new Error('Request too large. Try a smaller profile picture or fewer files.');
                    throw new Error(result.message || result.msg || 'Registration failed');
                }
                return result;
            } catch (err: any) {
                if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
                    throw new Error('Cannot reach server. Ensure the API is running and NEXT_PUBLIC_API_URL matches.');
                }
                throw err;
            }
        },
        login: async (data: any) => {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await res.json();
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
        },
        verify: async (token: string) => {
            const res = await fetch(`${API_URL}/auth/verify?token=${encodeURIComponent(token)}`);
            const result = await res.json();
            if (!res.ok) throw new Error(result.msg || 'Verification failed');
            return result;
        },
        resetPassword: async (token: string, newPassword: string) => {
            const res = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.msg || 'Password reset failed');
            return result;
        }
    },
    upload: {
        file: async (file: File, options?: { forSignup?: boolean; onProgress?: (percent: number) => void }): Promise<string> => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const useSignupEndpoint = options?.forSignup ?? !token;
            const uploadPath = useSignupEndpoint ? `${API_URL}/upload/signup` : `${API_URL}/upload`;
            const form = new FormData();
            form.append('file', file);
            const onProgress = options?.onProgress;

            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', uploadPath);
                if (token) xhr.setRequestHeader('x-auth-token', token);

                if (onProgress) {
                    xhr.upload.onprogress = (e) => {
                        const percent = e.lengthComputable ? Math.round((e.loaded / e.total) * 100) : 50;
                        onProgress(percent);
                    };
                }

                xhr.onload = () => {
                    try {
                        const result = JSON.parse(xhr.responseText || '{}');
                        if (xhr.status >= 200 && xhr.status < 300) return resolve(result.url);
                        if (xhr.status === 401) {
                            handleSessionExpired();
                            reject(new Error('Session expired. Please log in again.'));
                            return;
                        }
                        reject(new Error(result.message || result.msg || 'Upload failed'));
                    } catch {
                        reject(new Error('Upload failed'));
                    }
                };
                xhr.onerror = () => reject(new Error('Cannot reach server. Ensure the API is running and NEXT_PUBLIC_API_URL matches (e.g. http://localhost:6767/api).'));
                xhr.send(form);
            });
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
            if (!res.ok) {
                if (isUnauthorized(res)) throw new Error('Session expired. Please log in again.');
                throw new Error('Failed to fetch profile');
            }
            return res.json();
        },
        getPublicProfile: async (id: string) => {
            const res = await fetch(`${API_URL}/freelancer/${id}/public`, {
                method: 'GET'
            });
            if (!res.ok) throw new Error('Failed to fetch freelancer profile');
            return res.json();
        },
        getMyOrders: async () => {
            const res = await fetch(`${API_URL}/freelancer/orders`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch freelancer orders');
            return res.json();
        },
        submitOrderWork: async (id: string, data: any) => {
            const res = await fetch(`${API_URL}/freelancer/orders/${id}/submit-work`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            const result = await res.json().catch(() => ({ msg: 'Failed to submit work' }));
            if (!res.ok) throw new Error(result.msg || 'Failed to submit work');
            return result;
        },
        raiseDispute: async (orderId: string, reason?: string) => {
            const res = await fetch(`${API_URL}/freelancer/orders/${orderId}/dispute`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ reason: reason || '' }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.msg || 'Failed to raise dispute');
            return result;
        },
        approveOrder: async (orderId: string) => {
            const res = await fetch(`${API_URL}/freelancer/orders/${orderId}/approve`, {
                method: 'PATCH',
                headers: getHeaders(),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.msg || 'Failed to approve order');
            return result;
        },
        denyOrder: async (orderId: string) => {
            const res = await fetch(`${API_URL}/freelancer/orders/${orderId}/deny`, {
                method: 'PATCH',
                headers: getHeaders(),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.msg || 'Failed to deny order');
            return result;
        }
    },
    client: {
        getProfile: async () => {
            const res = await fetch(`${API_URL}/client/profile`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (!res.ok) {
                if (isUnauthorized(res)) throw new Error('Session expired. Please log in again.');
                throw new Error('Failed to fetch profile');
            }
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
        acceptProposal: async (jobId: string, proposalId: string) => {
            const res = await fetch(`${API_URL}/client/jobs/${jobId}/accept-proposal`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ proposalId }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.msg || 'Failed to accept proposal');
            }
            return res.json();
        },
        getMyOrders: async () => {
            const res = await fetch(`${API_URL}/client/orders`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch orders');
            return res.json();
        },
        raiseDispute: async (orderId: string, reason?: string) => {
            const res = await fetch(`${API_URL}/client/orders/${orderId}/dispute`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ reason: reason || '' }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.msg || 'Failed to raise dispute');
            return result;
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
            const res = await fetch(`${API_URL}/jobs`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch jobs');
            return res.json();
        },
        apply: async (id: string, data: any) => {
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
        },
        getFreelancerJobs: async () => {
            const res = await fetch(`${API_URL}/jobs/freelancer/my-jobs`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch freelancer jobs');
            return res.json();
        },
        submitWork: async (id: string, data: any) => {
            const res = await fetch(`${API_URL}/jobs/${id}/submit-work`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            const result = await res.json().catch(() => ({ msg: 'Failed to submit work' }));
            if (!res.ok) throw new Error(result.msg || 'Failed to submit work');
            return result;
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
        createOrder: async (projectId: string, packageIndex: number, description: string) => {
            const res = await fetch(`${API_URL}/projects/${projectId}/order`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ packageIndex, description }),
            });
            const result = await res.json().catch(() => ({ msg: 'Failed to create order' }));
            if (!res.ok) throw new Error(result.msg || 'Failed to create order');
            return result;
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
            const result = await res.json().catch(() => ({ msg: res.statusText || 'Failed to send message' }));
            if (!res.ok) throw new Error(result.msg || 'Failed to send message');
            return result;
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
        },
        getConsultationStatus: async (conversationId: string) => {
            const res = await fetch(`${API_URL}/chat/consultation-status/${conversationId}`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to fetch consultation status');
            return res.json();
        },
        createConsultationMeeting: async (data: { conversationId: string; meetingDate: string; meetingTime: string }) => {
            const res = await fetch(`${API_URL}/chat/consultation-meeting`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            const result = await res.json().catch(() => ({ msg: 'Failed to create meeting' }));
            if (!res.ok) throw new Error(result.msg || 'Failed to create meeting');
            return result;
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
        sendAdminMessage: async (data: any) => {
            const res = await fetch(`${API_URL}/admin/chats/message`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to send admin message');
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
            if (!res.ok) {
                if (isUnauthorized(res)) throw new Error('Session expired. Please log in again.');
                throw new Error('Failed to fetch insights');
            }
            return res.json();
        },
        searchUser: async (query: string) => {
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
            if (!res.ok && isUnauthorized(res)) throw new Error('Session expired. Please log in again.');
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
            if (!res.ok && isUnauthorized(res)) throw new Error('Session expired. Please log in again.');
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
            if (!res.ok && isUnauthorized(res)) throw new Error('Session expired. Please log in again.');
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
            if (!res.ok && isUnauthorized(res)) throw new Error('Session expired. Please log in again.');
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
            if (!res.ok && isUnauthorized(res)) throw new Error('Session expired. Please log in again.');
            return res.json();
        },
        getTopFreelancers: async () => {
            const res = await fetch(`${API_URL}/admin/top-freelancers`, {
                method: 'GET',
                headers: getHeaders()
            });
            return res.json();
        },
        getEmailLogs: async () => {
            const res = await fetch(`${API_URL}/admin/email-logs`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (!res.ok) {
                if (isUnauthorized(res)) throw new Error('Session expired. Please log in again.');
                throw new Error('Failed to fetch email logs');
            }
            return res.json();
        },
        getWithdrawals: async () => {
            const res = await fetch(`${API_URL}/admin/withdrawals`, { method: 'GET', headers: getHeaders() });
            if (!res.ok) throw new Error('Failed to fetch withdrawals');
            return res.json();
        },
        completeWithdrawal: async (id: string) => {
            const res = await fetch(`${API_URL}/admin/withdrawals/${id}/complete`, {
                method: 'PATCH',
                headers: getHeaders()
            });
            const result = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(result.msg || 'Failed to complete');
            return result;
        },
        rejectWithdrawal: async (id: string, reason?: string) => {
            const res = await fetch(`${API_URL}/admin/withdrawals/${id}/reject`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ reason })
            });
            const result = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(result.msg || 'Failed to reject');
            return result;
        }
    },
    wallet: {
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
        },
        payConsultation: async (conversationId: string) => {
            const res = await fetch(`${API_URL}/wallet/consultation-pay`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ conversationId })
            });
            const result = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(result.msg || 'Failed to pay consultation');
            return result;
        },
        createWithdrawal: async (data: { amount: number; method: string; phoneNumber?: string; accountNumber?: string; bankName?: string; notes?: string }) => {
            const res = await fetch(`${API_URL}/wallet/withdraw`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            const result = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(result.msg || 'Failed to request withdrawal');
            return result;
        },
        getWithdrawals: async () => {
            const res = await fetch(`${API_URL}/wallet/withdrawals`, { method: 'GET', headers: getHeaders() });
            if (!res.ok) throw new Error('Failed to fetch withdrawals');
            return res.json();
        }
    },
    withdrawalMethods: {
        list: async () => {
            const res = await fetch(`${API_URL}/withdrawal-methods`, { method: 'GET', headers: getHeaders() });
            if (!res.ok) throw new Error('Failed to fetch withdrawal methods');
            return res.json();
        },
        add: async (data: { method: string; phoneNumber?: string; accountNumber?: string; bankName?: string; label?: string }) => {
            const res = await fetch(`${API_URL}/withdrawal-methods`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            const result = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(result.msg || 'Failed to add withdrawal method');
            return result;
        },
        remove: async (id: string) => {
            const res = await fetch(`${API_URL}/withdrawal-methods/${id}`, { method: 'DELETE', headers: getHeaders() });
            if (!res.ok) throw new Error('Failed to remove');
            return res.json();
        },
        setDefault: async (id: string) => {
            const res = await fetch(`${API_URL}/withdrawal-methods/${id}/default`, { method: 'PATCH', headers: getHeaders() });
            if (!res.ok) throw new Error('Failed to set default');
            return res.json();
        }
    },
    paymentMethods: {
        list: async () => {
            const res = await fetch(`${API_URL}/payment-methods`, { method: 'GET', headers: getHeaders() });
            if (!res.ok) throw new Error('Failed to fetch payment methods');
            return res.json();
        },
        add: async (callbackSuccessUrl?: string) => {
            const res = await fetch(`${API_URL}/payment-methods`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ callbackSuccessUrl })
            });
            const result = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(result.msg || 'Failed to add card');
            return result;
        },
        remove: async (id: string) => {
            const res = await fetch(`${API_URL}/payment-methods/${id}`, { method: 'DELETE', headers: getHeaders() });
            if (!res.ok) throw new Error('Failed to remove card');
            return res.json();
        },
        setDefault: async (id: string) => {
            const res = await fetch(`${API_URL}/payment-methods/${id}/default`, {
                method: 'PATCH',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Failed to set default');
            return res.json();
        },
        initCharge: async (data: { type: string; amountCents: number; callbackSuccessUrl?: string; [k: string]: any }) => {
            const res = await fetch(`${API_URL}/payment-methods/init-charge`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            const result = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(result.msg || 'Failed to init charge');
            return result;
        }
    }
};
