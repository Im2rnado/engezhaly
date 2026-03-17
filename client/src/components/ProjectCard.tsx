"use client";

import { useState } from 'react';
import { Clock, RotateCcw, Check, ArrowRight, Edit, MessageSquare, Phone, ChevronDown, Loader2, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useModal } from '@/context/ModalContext';
import CountdownTimer from './CountdownTimer';
import AuthModal from './AuthModal';

interface ProjectCardProps {
    project: any;
    onEdit?: () => void;
    showContactMe?: boolean; // Show Contact Me button for public viewing
    activeOrder?: any; // Active order with deliveryDate for timer
    sellerIdOverride?: string; // When parent knows the seller (e.g. freelancer profile page)
    variant?: 'default' | 'bundle'; // bundle = Fiverr-style for offer detail page
}

export default function ProjectCard({ project, onEdit, showContactMe = false, activeOrder, sellerIdOverride, variant = 'default' }: ProjectCardProps) {
    const router = useRouter();
    const { showModal } = useModal();
    const [selectedPackage, setSelectedPackage] = useState(0);
    const [showContactDropdown, setShowContactDropdown] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [orderModalStep, setOrderModalStep] = useState<'description' | 'confirm' | null>(null);
    const [orderDescription, setOrderDescription] = useState('');
    const [isCustomizeLoading, setIsCustomizeLoading] = useState(false);
    const packages = project.packages || [];
    const currentPackage = packages[selectedPackage] || {};
    const extractSellerId = (value: any): string | null => {
        if (!value) return null;
        const id = (typeof value === 'object' && value !== null)
            ? (value._id ?? value.id ?? value.$oid)
            : value;
        return id ? String(id) : null;
    };

    const sellerData = project.sellerId;
    const initialSellerId = sellerIdOverride ? String(sellerIdOverride) : extractSellerId(sellerData);

    const resolveSellerId = async (): Promise<string | null> => {
        if (initialSellerId) return initialSellerId;
        if (!project?._id) return null;

        try {
            // Some project lists omit sellerId; fetch full project as fallback.
            const fullProject = await api.projects.getById(project._id);
            return extractSellerId(fullProject?.sellerId);
        } catch {
            return null;
        }
    };

    const checkClientAuth = (): boolean => {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsAuthModalOpen(true);
            return false;
        }

        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentUser.role !== 'client') {
            showModal({
                title: 'Client Account Required',
                message: 'This feature is only available for clients. Please log in with a client account.',
                type: 'error'
            });
            return false;
        }

        return true;
    };

    const findConversationWithSeller = (conversations: any[], targetSellerId: string) =>
        conversations.find((c: any) => String(c.partnerId?._id ?? c.partnerId) === String(targetSellerId));

    const handleOpenChat = async (projectId?: string) => {
        setShowContactDropdown(false);

        if (!checkClientAuth()) {
            return;
        }
        const sellerId = await resolveSellerId();
        if (!sellerId) {
            showModal({ title: 'Error', message: 'Could not identify the freelancer.', type: 'error' });
            return;
        }

        try {
            const conversations = await api.chat.getConversations();
            let conversation = findConversationWithSeller(conversations, sellerId);

            if (!conversation) {
                await api.chat.sendMessage({
                    receiverId: sellerId,
                    content: `Hi! I'm interested in your project: ${project.title}`,
                    messageType: 'text'
                });
                const updatedConversations = await api.chat.getConversations();
                conversation = findConversationWithSeller(updatedConversations, sellerId);
            }

            const qs = new URLSearchParams({ conversation: conversation?.id ?? sellerId });
            if (projectId) qs.set('projectId', projectId);
            router.push(`/chat?${qs.toString()}`);
        } catch (err: any) {
            console.error(err);
            showModal({
                title: 'Error',
                message: err.message || 'Failed to open chat',
                type: 'error'
            });
        }
    };

    const handleBookConsultation = async () => {
        setShowContactDropdown(false);

        if (!checkClientAuth()) {
            return;
        }
        const sellerId = await resolveSellerId();
        if (!sellerId) {
            showModal({ title: 'Error', message: 'Could not identify the freelancer.', type: 'error' });
            return;
        }

        try {
            // Send consultation request and open chat - payment happens in chat when user clicks video call button
            await api.chat.sendMessage({
                receiverId: sellerId,
                content: `[CONSULTATION REQUEST] I would like to book a consultation call for ${project.title}. Please confirm availability.`,
                messageType: 'text'
            });
            showModal({
                title: 'Consultation Request Sent',
                message: `Chat opened. Click the video call button to pay and schedule your consultation.`,
                type: 'success'
            });
            handleOpenChat(project._id);
        } catch (err: any) {
            console.error(err);
            showModal({
                title: 'Error',
                message: err.message || 'Failed to send consultation request',
                type: 'error'
            });
        }
    };

    // Check if there's an active order with a deadline
    const hasActiveOrder = !onEdit && activeOrder && (activeOrder.status === 'active' || activeOrder.status === 'pending_payment') && activeOrder.deliveryDate;

    // Get freelancer info
    const seller = sellerData;
    const freelancerName = seller ? `${seller.firstName || ''} ${seller.lastName || ''}`.trim() : 'Freelancer';
    const freelancerProfilePicture = seller?.freelancerProfile?.profilePicture;
    const sellerIsBusy = !!seller?.freelancerProfile?.isBusy;
    const projectMainImage = project.images && project.images.length > 0 ? project.images[0] : null;
    const isBundle = variant === 'bundle';

    return (
        <div className={`project-card-container bg-white rounded-2xl shadow-sm border transition-all relative ${isBundle ? 'border-gray-200 p-0' : 'border-gray-200 md:rounded-3xl hover:shadow-lg'}`}>
            {/* Countdown Timer Overlay */}
            {hasActiveOrder && (
                <CountdownTimer deadline={activeOrder.deliveryDate} variant="card" />
            )}

            {/* Freelancer Profile Section - hide in bundle variant */}
            {!isBundle && (
                <div className="relative h-20 md:h-24 overflow-hidden rounded-t-2xl md:rounded-t-3xl">
                    {projectMainImage ? (
                        <div className="absolute inset-0 rounded-t-3xl overflow-hidden">
                            <Image
                                src={projectMainImage}
                                alt={project.title}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20"></div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#09BF44]/20 via-[#09BF44]/10 to-transparent rounded-t-3xl"></div>
                    )}
                    <div className="relative h-full flex items-center gap-3 md:gap-4 px-4 md:px-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center justify-center -z-10">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#09BF44]/30 via-[#09BF44]/15 to-transparent blur-md"></div>
                            </div>
                            <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-4 border-white shadow-lg z-10 bg-gray-200">
                                {freelancerProfilePicture ? (
                                    <Image
                                        src={freelancerProfilePicture}
                                        alt={freelancerName}
                                        width={64}
                                        height={64}
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#09BF44] to-[#07a63a] flex items-center justify-center text-white font-black text-xl">
                                        {freelancerName[0]?.toUpperCase() || 'F'}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm md:text-lg line-clamp-1">{freelancerName}</h4>
                            {sellerIsBusy && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">FREELANCER BUSY</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Package Tabs */}
            <div className={`flex border-b ${isBundle ? 'border-gray-200' : 'border-gray-100'}`}>
                {packages.map((pkg: any, idx: number) => (
                    <button
                        key={idx}
                        onClick={() => setSelectedPackage(idx)}
                        className={`flex-1 py-3 md:py-4 text-xs md:text-sm font-bold transition-colors ${selectedPackage === idx
                            ? 'text-[#09BF44] border-b-2 border-[#09BF44] bg-[#09BF44]/5'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {pkg.type || ['Basic', 'Standard', 'Premium'][idx]}
                    </button>
                ))}
                {/* Customize Tab */}
                <button
                    onClick={async () => {
                        if (!checkClientAuth()) {
                            return;
                        }
                        const sellerId = await resolveSellerId();
                        if (!sellerId) {
                            showModal({ title: 'Error', message: 'Could not identify the freelancer.', type: 'error' });
                            return;
                        }
                        setIsCustomizeLoading(true);
                        try {
                            const conversations = await api.chat.getConversations();
                            let conversation = findConversationWithSeller(conversations, sellerId);

                            await api.chat.sendMessage({
                                receiverId: sellerId,
                                content: `Hi, I'm interested in a custom package for your project: ${project.title}\nPlease inform the freelancer in chat what you want in your custom package.`,
                                messageType: 'text'
                            });

                            if (!conversation) {
                                const updatedConversations = await api.chat.getConversations();
                                conversation = findConversationWithSeller(updatedConversations, sellerId);
                            }

                            const url = `/chat?conversation=${conversation?.id ?? sellerId}`;
            router.push(variant === 'default' && project?._id ? `${url}&projectId=${project._id}` : url);
                        } catch (err: any) {
                            console.error(err);
                            showModal({
                                title: 'Error',
                                message: err.message || 'Failed to open chat',
                                type: 'error'
                            });
                        } finally {
                            setIsCustomizeLoading(false);
                        }
                    }}
                    disabled={isCustomizeLoading}
                    className={`flex-1 py-3 md:py-4 text-xs md:text-sm font-bold transition-colors flex items-center justify-center gap-2 ${isCustomizeLoading
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-500 hover:text-[#09BF44] hover:bg-[#09BF44]/5'
                        }`}
                >
                    {isCustomizeLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Opening chat...
                        </>
                    ) : (
                        'Customize'
                    )}
                </button>
            </div>

            {/* Package Content */}
            <div className={`p-4 md:p-6 ${isBundle ? 'md:p-8' : ''}`} style={{ overflow: 'visible' }}>
                {/* Bundle: Price first, prominent + BUSY aligned right */}
                {isBundle && (
                    <div className="mb-4 flex items-center justify-between gap-4">
                        <div className="text-3xl md:text-4xl font-bold text-gray-900">
                            {currentPackage.price || 0} <span className="text-lg font-normal text-gray-600">EGP</span>
                        </div>
                        {sellerIsBusy && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-lg font-bold rounded-full shrink-0">FREELANCER BUSY</span>
                        )}
                    </div>
                )}

                {/* Title and Price - default layout */}
                {!isBundle && (
                    <div className="flex items-start justify-between gap-2 mb-4">
                        <h3 className="text-base md:text-xl font-bold text-gray-900 leading-tight break-words">{project.title}</h3>
                        <div className="text-sm md:text-lg font-bold text-gray-900 shrink-0">
                            {currentPackage.price || 0} EGP
                        </div>
                    </div>
                )}

                {/* Package name & offer about - bundle only */}
                {/* {isBundle && (
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{currentPackage.type || 'Basic'} package</h3>
                        {project.description && (
                            <p className="text-gray-600 text-sm leading-relaxed">{project.description}</p>
                        )}
                    </div>
                )} */}

                {/* Project Description - default only */}
                {/* {!isBundle && project.description && (
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {project.description}
                    </p>
                )} */}

                {/* Delivery & Revisions - before features in bundle */}
                <div className={`flex flex-wrap items-center gap-3 md:gap-6 ${isBundle ? 'mb-4' : 'mb-4 pb-4 border-b border-gray-100'}`}>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="font-bold">{currentPackage.days || 0}-day delivery</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <RotateCcw className="w-4 h-4" />
                        <span className="font-bold">
                            {currentPackage.revisions === 0 ? 'No' : currentPackage.revisions === 1 ? '1' : currentPackage.revisions || 'Unlimited'} revision{currentPackage.revisions !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {isBundle && currentPackage.features && currentPackage.features.length > 0 ? (
                    <ul className="space-y-2 mt-1 mb-6">
                        {currentPackage.features.filter((f: any) => f?.trim()).map((feature: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-700 text-sm">
                                <Check className="w-4 h-4 text-[#09BF44] shrink-0 mt-0.5" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                ) : null}

                {!isBundle && currentPackage.features && (
                    <div className="space-y-2 mb-6">
                        {Array.isArray(currentPackage.features) ? (
                            currentPackage.features.filter((f: any) => f && f.trim()).map((feature: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-[#09BF44] shrink-0" />
                                    <span className="text-gray-700 text-sm">{feature}</span>
                                </div>
                            ))
                        ) : (
                            typeof currentPackage.features === 'string' && currentPackage.features.trim() && (
                                <div className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-[#09BF44] shrink-0" />
                                    <span className="text-gray-700 text-sm">{currentPackage.features}</span>
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-2" style={{ overflow: 'visible' }}>
                    {onEdit ? (
                        // Freelancer view - Edit and View buttons
                        <div className="flex gap-2">
                            <button
                                onClick={onEdit}
                                className="flex-1 bg-gray-100 hover:bg-[#09BF44]/20 hover:text-[#09BF44] text-gray-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Edit className="w-4 h-4" /> Edit
                            </button>
                            <button
                                onClick={() => router.push(`/dashboard/freelancer/offers/${project._id}/view`)}
                                className="flex-1 bg-[#09BF44] hover:bg-[#07a63a] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                View <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        // Public view - Continue and Contact Me buttons
                        <>
                            {sellerIsBusy ? (
                                <div className="w-full py-3 rounded-xl bg-gray-100 text-gray-500 font-bold text-center text-sm">
                                    Freelancer is busy — not accepting orders
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (!checkClientAuth()) return;
                                        setOrderDescription('');
                                        setOrderModalStep('description');
                                    }}
                                    className="w-full font-bold py-3 rounded-xl transition-colors bg-[#09BF44] hover:bg-[#07a63a] text-white"
                                >
                                    {isBundle ? 'Request to order' : 'Order'}
                                </button>
                            )}
                            {orderModalStep === 'description' && (
                                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setOrderModalStep(null)}>
                                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                                        <h3 className="text-lg font-bold mb-2">Order Description</h3>
                                        <p className="text-sm text-gray-600 mb-4">Describe what you need. The freelancer will see this and must approve before work starts.</p>
                                        {currentPackage?.type && (
                                            <div className="mb-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                                                <p className="text-sm font-bold text-gray-700 mb-2">Selected bundle: <span className="text-[#09BF44]">{currentPackage.type}</span></p>
                                                <div className="space-y-1.5 text-sm text-gray-600">
                                                    <p><span className="font-semibold">Delivery:</span> {currentPackage.days ?? '—'} days</p>
                                                    <p><span className="font-semibold">Revisions:</span> {currentPackage.revisions ?? 0}</p>
                                                    {Array.isArray(currentPackage.features) && currentPackage.features.length > 0 && (
                                                        <div>
                                                            <span className="font-semibold">Features:</span>
                                                            <ul className="list-disc list-inside mt-1 ml-1">
                                                                {currentPackage.features.map((f: string, i: number) => (
                                                                    <li key={i}>{f}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <textarea
                                            value={orderDescription}
                                            onChange={e => setOrderDescription(e.target.value)}
                                            placeholder="Describe your requirements..."
                                            className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-[#09BF44] outline-none resize-none h-32 mb-4"
                                            required
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setOrderModalStep(null)} className="px-4 py-2 rounded-xl font-bold text-gray-600 hover:bg-[#09BF44]/10 hover:text-[#09BF44]">Cancel</button>
                                            <button
                                                onClick={() => {
                                                    if (!orderDescription.trim()) return;
                                                    setOrderModalStep('confirm');
                                                }}
                                                disabled={!orderDescription.trim()}
                                                className="px-4 py-2 bg-[#09BF44] text-white rounded-xl font-bold disabled:opacity-50"
                                            >
                                                Continue
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {orderModalStep === 'confirm' && (
                                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setOrderModalStep(null)}>
                                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                                        <h3 className="text-lg font-bold mb-2">Confirm Order</h3>
                                        {currentPackage?.type && (
                                            <div className="mb-3 p-3 rounded-xl bg-[#09BF44]/5 border border-[#09BF44]/20">
                                                <p className="text-sm font-bold text-gray-800 mb-2">Bundle: <span className="text-[#09BF44]">{currentPackage.type}</span></p>
                                                <div className="space-y-1 text-sm text-gray-600">
                                                    <p><span className="font-semibold">Delivery:</span> {currentPackage.days ?? '—'} days</p>
                                                    <p><span className="font-semibold">Revisions:</span> {currentPackage.revisions ?? 0}</p>
                                                    {Array.isArray(currentPackage.features) && currentPackage.features.length > 0 && (
                                                        <div>
                                                            <span className="font-semibold">Features:</span>
                                                            <ul className="list-disc list-inside mt-1 ml-1">
                                                                {currentPackage.features.map((f: string, i: number) => (
                                                                    <li key={i}>{f}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-sm text-gray-600 mb-2">Total: <strong>{Number(currentPackage.price || 0)} EGP</strong></p>
                                        <p className="text-xs text-gray-500 mb-4">Platform fee: 20 EGP. The freelancer must approve before work starts.</p>
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setOrderModalStep('description')} className="px-4 py-2 rounded-xl font-bold text-gray-600 hover:bg-[#09BF44]/10 hover:text-[#09BF44]">Back</button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await api.projects.createOrder(project._id, selectedPackage, orderDescription.trim());
                                                        setOrderModalStep(null);
                                                        showModal({ title: 'Order Created', message: 'Your order was submitted. The freelancer will approve or decline shortly.', type: 'success' });
                                                        const sellerId = await resolveSellerId();
                                                        if (sellerId) {
                                                            const conversations = await api.chat.getConversations();
                                                            const conv = findConversationWithSeller(conversations, sellerId);
                                                            if (conv?.id) {
                                                                router.push(`/chat?conversation=${conv.id}`);
                                                            } else {
                                                                router.push('/dashboard/client?tab=orders');
                                                            }
                                                        } else {
                                                            router.push('/dashboard/client?tab=orders');
                                                        }
                                                    } catch (err: any) {
                                                        showModal({ title: 'Error', message: err.message || 'Failed to create order', type: 'error' });
                                                    }
                                                }}
                                                className="px-4 py-2 bg-[#09BF44] text-white rounded-xl font-bold"
                                            >
                                                Submit Order
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {showContactMe && (
                                <div className="relative z-20" style={{ overflow: 'visible' }}>
                                    <button
                                        onClick={() => setShowContactDropdown(!showContactDropdown)}
                                        className="w-full font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 bg-white border-2 border-gray-300 hover:border-[#09BF44] hover:bg-[#09BF44]/5 text-gray-700"
                                    >
                                        Contact me <ChevronDown className={`w-4 h-4 transition-transform ${showContactDropdown ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showContactDropdown && (
                                        <div
                                            className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden w-full"
                                            style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                marginTop: '0.25rem',
                                                zIndex: 9999
                                            }}
                                        >
                                            <button
                                                onClick={() => handleOpenChat(project._id)}
                                                className="w-full px-4 py-3 text-left hover:bg-[#09BF44]/5 flex items-center gap-3 transition-colors"
                                            >
                                                <MessageSquare className="w-5 h-5 text-[#09BF44]" />
                                                <div>
                                                    <div className="font-bold text-gray-900">Open Chat</div>
                                                    <div className="text-xs text-gray-500">Free</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={handleBookConsultation}
                                                className="w-full px-4 py-3 text-left hover:bg-[#09BF44]/5 flex items-center gap-3 transition-colors border-t border-gray-100"
                                            >
                                                <Phone className="w-5 h-5 text-[#09BF44]" />
                                                <div>
                                                    <div className="font-bold text-gray-900">Book Consultation</div>
                                                    <div className="text-xs text-gray-500">100 EGP paid call</div>
                                                </div>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Auth Modal */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialStep="login"
            />
        </div>
    );
}
