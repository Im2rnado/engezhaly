"use client";

import { useState } from 'react';
import { Clock, RotateCcw, Check, ArrowRight, Edit, MessageSquare, Phone, ChevronDown, Loader2 } from 'lucide-react';
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
}

export default function ProjectCard({ project, onEdit, showContactMe = false, activeOrder }: ProjectCardProps) {
    const router = useRouter();
    const { showModal } = useModal();
    const [selectedPackage, setSelectedPackage] = useState(0);
    const [showContactDropdown, setShowContactDropdown] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isCustomizeLoading, setIsCustomizeLoading] = useState(false);
    const packages = project.packages || [];
    const currentPackage = packages[selectedPackage] || {};
    const sellerId = project.sellerId?._id || project.sellerId;

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

    const handleOpenChat = async () => {
        setShowContactDropdown(false);

        if (!checkClientAuth()) {
            return;
        }

        try {
            // Create or get conversation with seller
            const conversations = await api.chat.getConversations();
            let conversation = conversations.find((c: any) =>
                c.participants?.some((p: any) => p._id === sellerId || p === sellerId)
            );

            if (!conversation) {
                // Send a message to create conversation
                await api.chat.sendMessage({
                    receiverId: sellerId,
                    content: `Hi! I'm interested in your project: ${project.title}`,
                    messageType: 'text'
                });
                // Refresh conversations
                const updatedConversations = await api.chat.getConversations();
                conversation = updatedConversations.find((c: any) =>
                    c.participants?.some((p: any) => p._id === sellerId || p === sellerId)
                );
            }

            router.push(`/chat?conversation=${conversation?._id || sellerId}`);
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

        try {
            // Check wallet balance
            const balance = await api.wallet.getBalance();
            if (balance.balance < 100) {
                showModal({
                    title: 'Insufficient Balance',
                    message: 'You need at least 100 EGP in your wallet to book a consultation.',
                    type: 'error'
                });
                return;
            }

            // Create consultation order/payment
            showModal({
                title: 'Book Consultation',
                message: 'This will charge 100 EGP from your wallet. Proceed?',
                type: 'confirm',
                onConfirm: async () => {
                    try {
                        // TODO: Create consultation booking API endpoint
                        // For now, create a conversation and send a consultation request message
                        await api.chat.sendMessage({
                            receiverId: sellerId,
                            content: `[CONSULTATION REQUEST] I would like to book a consultation call for ${project.title}. Please confirm availability.`,
                            messageType: 'text'
                        });

                        // Deduct 100 EGP from wallet
                        await api.wallet.topUp(-100); // Negative amount to deduct

                        showModal({
                            title: 'Success',
                            message: 'Consultation request sent! The freelancer will confirm availability.',
                            type: 'success'
                        });

                        // Open chat
                        handleOpenChat();
                    } catch (err: any) {
                        console.error(err);
                        showModal({
                            title: 'Error',
                            message: err.message || 'Failed to book consultation',
                            type: 'error'
                        });
                    }
                }
            });
        } catch (err: any) {
            console.error(err);
            showModal({
                title: 'Error',
                message: err.message || 'Failed to check wallet balance',
                type: 'error'
            });
        }
    };

    // Check if there's an active order with a deadline
    const hasActiveOrder = activeOrder && (activeOrder.status === 'active' || activeOrder.status === 'pending_payment') && activeOrder.deliveryDate;

    // Get freelancer info
    const seller = project.sellerId;
    const freelancerName = seller ? `${seller.firstName || ''} ${seller.lastName || ''}`.trim() : 'Freelancer';
    const freelancerProfilePicture = seller?.freelancerProfile?.profilePicture;
    const projectMainImage = project.images && project.images.length > 0 ? project.images[0] : null;

    return (
        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm hover:shadow-lg transition-all relative" style={{ overflow: 'visible' }}>
            {/* Countdown Timer Overlay */}
            {hasActiveOrder && (
                <CountdownTimer deadline={activeOrder.deliveryDate} variant="card" />
            )}

            {/* Freelancer Profile Section */}
            <div className="relative h-24 overflow-hidden rounded-t-3xl">
                {/* Background: Project Image or Gradient */}
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

                {/* Freelancer Info */}
                <div className="relative h-full flex items-center gap-4 px-6">
                    {/* Profile Picture */}
                    <div className="relative">
                        {/* Gradient Background Blur */}
                        <div className="absolute inset-0 flex items-center justify-center -z-10">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#09BF44]/30 via-[#09BF44]/15 to-transparent blur-md"></div>
                        </div>
                        {/* Profile Picture Container */}
                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg z-10 bg-gray-200">
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

                    {/* Name */}
                    <div>
                        <h4 className="font-bold text-gray-900 text-lg">{freelancerName}</h4>
                    </div>
                </div>
            </div>

            {/* Package Tabs */}
            <div className="flex border-b border-gray-100">
                {packages.map((pkg: any, idx: number) => (
                    <button
                        key={idx}
                        onClick={() => setSelectedPackage(idx)}
                        className={`flex-1 py-4 text-sm font-bold transition-colors ${selectedPackage === idx
                            ? 'text-gray-900 border-b-2 border-gray-900 bg-gray-50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {pkg.type || ['Basic', 'Standard', 'Premium'][idx]}
                    </button>
                ))}
                {/* Customize Tab - Always visible */}
                <button
                    onClick={async () => {
                        if (!checkClientAuth()) {
                            return;
                        }
                        setIsCustomizeLoading(true);
                        try {
                            // Get or create conversation first
                            const conversations = await api.chat.getConversations();
                            let conversation = conversations.find((c: any) =>
                                c.participants?.some((p: any) => p._id === sellerId || p === sellerId)
                            );

                            if (!conversation) {
                                // Send automated message to create conversation
                                await api.chat.sendMessage({
                                    receiverId: sellerId,
                                    content: `Hi! I'm interested in a custom package for your project: ${project.title}. Let's discuss the details.`,
                                    messageType: 'text'
                                });
                                // Refresh conversations
                                const updatedConversations = await api.chat.getConversations();
                                conversation = updatedConversations.find((c: any) =>
                                    c.participants?.some((p: any) => p._id === sellerId || p === sellerId)
                                );
                            } else {
                                // Send automated message in existing conversation
                                await api.chat.sendMessage({
                                    receiverId: sellerId,
                                    content: `Hi! I'm interested in a custom package for your project: ${project.title}. Let's discuss the details.`,
                                    messageType: 'text'
                                });
                            }
                            
                            router.push(`/chat?conversation=${conversation?._id || sellerId}`);
                        } catch (err: any) {
                            console.error(err);
                            setIsCustomizeLoading(false);
                            showModal({
                                title: 'Error',
                                message: err.message || 'Failed to open chat',
                                type: 'error'
                            });
                        }
                    }}
                    disabled={isCustomizeLoading}
                    className={`flex-1 py-4 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                        isCustomizeLoading 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
            <div className="p-6" style={{ overflow: 'visible' }}>
                {/* Title and Price in same row */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{project.title}</h3>
                    <div className="text-lg font-bold text-gray-900">
                        {currentPackage.price || 0} EGP
                    </div>
                </div>

                {/* Project Description */}
                {project.description && (
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {project.description}
                    </p>
                )}

                {/* Delivery & Revisions */}
                <div className="flex items-center gap-6 mb-4 pb-4 border-b border-gray-100">
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

                {/* Features */}
                {currentPackage.features && (
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
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Edit className="w-4 h-4" /> Edit
                            </button>
                            <button
                                onClick={() => router.push(`/dashboard/freelancer/projects/${project._id}/view`)}
                                className="flex-1 bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                View <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        // Public view - Continue and Contact Me buttons
                        <>
                            <button
                                onClick={() => {
                                    if (!checkClientAuth()) {
                                        return;
                                    }

                                    // TODO: Handle package purchase/order creation
                                    showModal({
                                        title: 'Continue',
                                        message: 'This will create an order for this package. Proceed?',
                                        type: 'confirm',
                                        onConfirm: () => {
                                            // Navigate to order/payment page
                                            router.push(`/projects/${project._id}/order?package=${selectedPackage}`);
                                        }
                                    });
                                }}
                                className="w-full bg-[#09BF44] hover:bg-[#07a63a] text-white font-bold py-3 rounded-xl transition-colors"
                            >
                                Continue
                            </button>
                            {showContactMe && (
                                <div className="relative z-[20]" style={{ overflow: 'visible' }}>
                                    <button
                                        onClick={() => setShowContactDropdown(!showContactDropdown)}
                                        className="w-full bg-white border-2 border-gray-300 hover:border-[#09BF44] text-gray-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        Contact Me <ChevronDown className={`w-4 h-4 transition-transform ${showContactDropdown ? 'rotate-180' : ''}`} />
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
                                                onClick={handleOpenChat}
                                                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                            >
                                                <MessageSquare className="w-5 h-5 text-[#09BF44]" />
                                                <div>
                                                    <div className="font-bold text-gray-900">Open Chat</div>
                                                    <div className="text-xs text-gray-500">Free</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={handleBookConsultation}
                                                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors border-t border-gray-100"
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
