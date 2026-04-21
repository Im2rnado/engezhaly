"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useModal } from "@/context/ModalContext";
import { Loader2, MessageSquare, PanelLeft, ArrowLeft, X, CheckCircle, LinkIcon, Paperclip } from "lucide-react";
import FreelancerSidebar from "@/components/FreelancerSidebar";
import DashboardMobileTopStrip from "@/components/DashboardMobileTopStrip";
import CountdownTimer from "@/components/CountdownTimer";
import { formatDateDDMMYYYY, formatRevisionsLabel } from "@/lib/utils";

export default function FreelancerJobDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { showModal } = useModal();
    const jobId = typeof params?.id === "string" ? params.id : "";

    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const [workOpen, setWorkOpen] = useState(false);
    const [submittingWork, setSubmittingWork] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [workSubmission, setWorkSubmission] = useState({ message: "", links: "", files: [] as File[] });

    const [milestoneSubmitModal, setMilestoneSubmitModal] = useState<{ milestoneIdx: number } | null>(null);
    const [milestoneWork, setMilestoneWork] = useState({ message: "", links: "", files: [] as File[] });
    const [milestoneSubmitting, setMilestoneSubmitting] = useState(false);
    const [milestoneUploadProgress, setMilestoneUploadProgress] = useState<number | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/");
            return;
        }
        setUser(JSON.parse(localStorage.getItem("user") || "{}"));

        const load = async () => {
            try {
                const profileData = await api.freelancer.getProfile();
                setProfile(profileData);
                if (profileData.role !== "freelancer") {
                    router.push("/");
                    return;
                }
                const j = await api.jobs.getFreelancerJobById(jobId);
                setJob(j);
            } catch (e: any) {
                showModal({ title: "Error", message: e.message || "Could not load job", type: "error" });
                router.push("/dashboard/freelancer/jobs");
            } finally {
                setLoading(false);
            }
        };
        if (jobId) load();
    }, [jobId, router, showModal]);

    const refreshJob = async () => {
        if (!jobId) return;
        const j = await api.jobs.getFreelancerJobById(jobId);
        setJob(j);
    };

    const toggleBusy = async () => {
        try {
            const newStatus = !profile?.freelancerProfile?.isBusy;
            const updated = await api.freelancer.updateProfile({ isBusy: newStatus });
            setProfile(updated);
            showModal({ title: "Success", message: `Status updated to ${newStatus ? "Busy" : "Available"}`, type: "success" });
        } catch {
            showModal({ title: "Error", message: "Failed to update status", type: "error" });
        }
    };

    const openChatWithClient = async () => {
        if (!job) return;
        try {
            const clientId = String(job?.clientId?._id || job?.clientId || "");
            if (!clientId) {
                showModal({ title: "Error", message: "Client not found for this job", type: "error" });
                return;
            }
            const conversations = await api.chat.getConversations();
            let conversation = (conversations || []).find((c: any) => String(c.partnerId?._id || c.partnerId) === clientId);
            if (!conversation) {
                await api.chat.sendMessage({
                    receiverId: clientId,
                    content: `Hi! I have an update regarding your job: ${job.title}`,
                    messageType: "text",
                });
                const updatedConversations = await api.chat.getConversations();
                conversation = (updatedConversations || []).find((c: any) => String(c.partnerId?._id || c.partnerId) === clientId);
            }
            router.push(`/chat?conversation=${conversation?.id || clientId}`);
        } catch (err: any) {
            showModal({ title: "Error", message: err.message || "Failed to open chat", type: "error" });
        }
    };

    const handleSubmitWork = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!job) return;
        setSubmittingWork(true);
        setUploadProgress(null);
        try {
            const fileUrls: string[] = [];
            const files = workSubmission.files;
            for (let i = 0; i < files.length; i++) {
                const url = await api.upload.file(files[i], {
                    onProgress: (p) => setUploadProgress(Math.round(((i + p / 100) / files.length) * 100)),
                });
                fileUrls.push(url);
            }
            setUploadProgress(100);
            const links = workSubmission.links
                .split(/[\n, ]+/)
                .map((l) => l.trim())
                .filter(Boolean);
            await api.jobs.submitWork(job._id, {
                message: workSubmission.message,
                links,
                files: fileUrls,
            });
            showModal({ title: "Success", message: "Work submitted successfully!", type: "success" });
            setWorkOpen(false);
            setWorkSubmission({ message: "", links: "", files: [] });
            await refreshJob();
        } catch (err: any) {
            showModal({ title: "Error", message: err.message || "Failed to submit work", type: "error" });
        } finally {
            setSubmittingWork(false);
            setUploadProgress(null);
        }
    };

    const handleSubmitMilestone = async () => {
        if (!job || !milestoneSubmitModal) return;
        setMilestoneSubmitting(true);
        setMilestoneUploadProgress(null);
        try {
            const fileUrls: string[] = [];
            const files = milestoneWork.files;
            for (let i = 0; i < files.length; i++) {
                const url = await api.upload.file(files[i], {
                    onProgress: (p) => setMilestoneUploadProgress(Math.round(((i + p / 100) / files.length) * 100)),
                });
                fileUrls.push(url);
            }
            setMilestoneUploadProgress(100);
            const links = milestoneWork.links
                .split(/[\n, ]+/)
                .map((l) => l.trim())
                .filter(Boolean);
            await api.freelancer.submitMilestoneWork(job._id, milestoneSubmitModal.milestoneIdx, {
                message: milestoneWork.message,
                note: milestoneWork.message,
                links,
                files: fileUrls,
            });
            showModal({ title: "Success", message: "Milestone work submitted!", type: "success" });
            setMilestoneSubmitModal(null);
            setMilestoneWork({ message: "", links: "", files: [] });
            await refreshJob();
        } catch (err: any) {
            showModal({ title: "Error", message: err.message || "Failed to submit milestone", type: "error" });
        } finally {
            setMilestoneSubmitting(false);
            setMilestoneUploadProgress(null);
        }
    };

    /** Posting `job.deadline` is a label string ("1 week"), not a Date — match client job countdown: createdAt + deliveryDays. */
    const inProgressDeliveryDeadline = useMemo(() => {
        if (!job || job.status !== "in_progress") return null;
        const proposal = job.myProposal;
        if (!proposal || proposal.status !== "accepted") return null;
        const days = proposal.deliveryDays;
        if (days == null || Number.isNaN(Number(days))) return null;
        const d = new Date(job.createdAt);
        d.setDate(d.getDate() + Number(days));
        return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }, [job]);

    if (loading || !profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#09BF44]" />
            </div>
        );
    }

    if (!job) return null;

    const myProposal = job.myProposal;
    const proposalAccepted = myProposal?.status === "accepted";
    const showDeliveryWorkspace = proposalAccepted && job.status === "in_progress";
    const showSubmissionSnapshot =
        proposalAccepted && ["in_progress", "completed", "closed"].includes(job.status);

    const ws = myProposal?.workSubmission;
    const hasFullWorkSubmission =
        ws &&
        ((typeof ws.message === "string" && ws.message.trim()) ||
            (Array.isArray(ws.links) && ws.links.some(Boolean)) ||
            (Array.isArray(ws.files) && ws.files.some(Boolean)));

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <FreelancerSidebar
                user={user}
                profile={profile}
                onToggleBusy={toggleBusy}
                mobileOpen={mobileSidebarOpen}
                onCloseMobile={() => setMobileSidebarOpen(false)}
            />
            {mobileSidebarOpen && (
                <button
                    type="button"
                    aria-label="Close sidebar"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="fixed inset-0 bg-black/40 z-30 md:hidden"
                />
            )}

            <div className="flex-1 md:ml-72 px-4 sm:px-6 md:p-8 pt-3 md:pt-8 pb-8 overflow-y-auto min-h-screen">
                <DashboardMobileTopStrip />
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            type="button"
                            onClick={() => setMobileSidebarOpen(true)}
                            className="md:hidden p-2 rounded-lg border border-gray-200 bg-white text-gray-700"
                            aria-label="Open sidebar"
                        >
                            <PanelLeft className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push("/dashboard/freelancer/jobs")}
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold"
                        >
                            <ArrowLeft className="w-5 h-5" /> Back to My Jobs
                        </button>
                    </div>

                    {showDeliveryWorkspace && inProgressDeliveryDeadline && (
                        <div className="mb-6">
                            <CountdownTimer deadline={inProgressDeliveryDeadline} variant="detail" />
                        </div>
                    )}

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 min-w-0">
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 break-words [overflow-wrap:anywhere]">{job.title}</h1>
                        <p className="text-sm text-gray-500 mt-2">
                            Client: {job.clientId?.firstName} {job.clientId?.lastName}
                            {showDeliveryWorkspace && inProgressDeliveryDeadline
                                ? ` • Deliver by ${formatDateDDMMYYYY(inProgressDeliveryDeadline)}`
                                : job.deadline
                                  ? ` • Client timeline: ${job.deadline}`
                                  : ""}
                        </p>
                        <p className="text-gray-700 mt-4 whitespace-pre-wrap break-words [overflow-wrap:anywhere] min-w-0">{job.description}</p>

                        {myProposal && (
                            <div className="mt-5 text-sm text-gray-600 space-y-1">
                                <p>
                                    <span className="font-bold text-gray-700">Your terms: </span>
                                    {myProposal.deliveryDays != null && !Number.isNaN(Number(myProposal.deliveryDays))
                                        ? `${myProposal.deliveryDays} day delivery`
                                        : "—"}
                                    {" · "}
                                    {formatRevisionsLabel(!!myProposal.revisionsUnlimited, myProposal.revisions)}
                                </p>
                            </div>
                        )}

                        {myProposal?.message?.trim() && (
                            <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-100 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="w-4 h-4 text-gray-500 shrink-0" />
                                    <span className="text-sm font-bold text-gray-800">Your proposal message</span>
                                </div>
                                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{myProposal.message}</p>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 mt-4">
                            <span
                                className={`text-xs font-bold px-3 py-1 rounded-full ${
                                    myProposal?.status === "accepted"
                                        ? "bg-green-100 text-green-700"
                                        : myProposal?.status === "rejected"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-blue-100 text-blue-700"
                                }`}
                            >
                                {myProposal?.status || "pending"}
                            </span>
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-700">{job.status}</span>
                            <span className="text-sm font-black text-[#09BF44]">Your offer: {myProposal?.price || "-"} EGP</span>
                        </div>

                        {proposalAccepted && myProposal?.milestones && myProposal.milestones.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Delivery milestones</p>
                                <div className="space-y-3">
                                    {myProposal.milestones.map((m: any, idx: number) => {
                                        const subLinks = Array.isArray(m.submissionLinks) ? m.submissionLinks.filter(Boolean) : [];
                                        const subFiles = Array.isArray(m.submissionFiles) ? m.submissionFiles.filter(Boolean) : [];
                                        const note = typeof m.submissionNote === "string" ? m.submissionNote.trim() : "";
                                        const hasSubmission =
                                            (m.status === "submitted" || m.status === "done") &&
                                            (note || subLinks.length > 0 || subFiles.length > 0);
                                        return (
                                            <div key={idx} className="bg-gray-50 rounded-xl p-3 border border-gray-100 min-w-0">
                                                <div className="flex flex-wrap items-start justify-between gap-2 min-w-0">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-gray-900 text-sm break-words [overflow-wrap:anywhere]">{m.name}</p>
                                                        {m.dueDate && (
                                                            <p className="text-xs text-gray-500">Due: {new Date(m.dueDate).toLocaleDateString()}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span
                                                            className={`text-xs font-bold px-2 py-1 rounded-full ${
                                                                m.status === "submitted"
                                                                    ? "bg-blue-100 text-blue-700"
                                                                    : m.status === "done"
                                                                      ? "bg-green-100 text-green-700"
                                                                      : "bg-gray-200 text-gray-600"
                                                            }`}
                                                        >
                                                            {m.status || "pending"}
                                                        </span>
                                                        {showDeliveryWorkspace && m.status !== "done" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setMilestoneSubmitModal({ milestoneIdx: idx });
                                                                    setMilestoneWork({ message: "", links: "", files: [] });
                                                                }}
                                                                className="text-xs bg-[#09BF44] text-white px-3 py-1 rounded-lg font-bold hover:bg-[#07a63a]"
                                                            >
                                                                {m.status === "submitted" ? "Resubmit" : "Submit"}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                {hasSubmission && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-sm">
                                                        <p className="text-xs font-bold text-gray-500 uppercase">What you submitted</p>
                                                        {note && <p className="text-gray-700 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{note}</p>}
                                                        {subLinks.length > 0 && (
                                                            <div>
                                                                <div className="flex items-center gap-1.5 mb-1">
                                                                    <LinkIcon className="w-3.5 h-3.5 text-gray-500" />
                                                                    <span className="text-xs font-bold text-gray-600">Links</span>
                                                                </div>
                                                                <ul className="space-y-1">
                                                                    {subLinks.map((link: string, li: number) => (
                                                                        <li key={li}>
                                                                            <a
                                                                                href={link}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="text-[#09BF44] hover:underline break-all text-xs"
                                                                            >
                                                                                {link}
                                                                            </a>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {subFiles.length > 0 && (
                                                            <div>
                                                                <div className="flex items-center gap-1.5 mb-1">
                                                                    <Paperclip className="w-3.5 h-3.5 text-gray-500" />
                                                                    <span className="text-xs font-bold text-gray-600">Files</span>
                                                                </div>
                                                                <ul className="space-y-1">
                                                                    {subFiles.map((fileUrl: string, fi: number) => (
                                                                        <li key={fi}>
                                                                            <a
                                                                                href={fileUrl}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="text-[#09BF44] hover:underline break-all text-xs"
                                                                            >
                                                                                {fileUrl}
                                                                            </a>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {showSubmissionSnapshot && hasFullWorkSubmission && (
                            <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        <span className="text-sm font-bold text-green-800">Your final work submission</span>
                                    </div>
                                    {ws?.updatedAt && (
                                        <span className="text-xs text-green-700">{new Date(ws.updatedAt).toLocaleString()}</span>
                                    )}
                                </div>
                                {ws?.message?.trim() && (
                                    <p className="text-sm text-gray-800 mb-3 leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{ws.message}</p>
                                )}
                                {Array.isArray(ws?.links) && ws.links.filter(Boolean).length > 0 && (
                                    <div className="mb-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <LinkIcon className="w-4 h-4 text-gray-600" />
                                            <span className="text-xs font-bold text-gray-700 uppercase">Links</span>
                                        </div>
                                        <ul className="space-y-1">
                                            {ws.links.filter(Boolean).map((link: string, i: number) => (
                                                <li key={i}>
                                                    <a href={link} target="_blank" rel="noreferrer" className="text-sm text-[#09BF44] hover:underline break-all">
                                                        {link}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {Array.isArray(ws?.files) && ws.files.filter(Boolean).length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Paperclip className="w-4 h-4 text-gray-600" />
                                            <span className="text-xs font-bold text-gray-700 uppercase">Files</span>
                                        </div>
                                        <ul className="space-y-1">
                                            {ws.files.filter(Boolean).map((fileUrl: string, i: number) => (
                                                <li key={i}>
                                                    <a href={fileUrl} target="_blank" rel="noreferrer" className="text-sm text-[#09BF44] hover:underline break-all">
                                                        {fileUrl}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {showDeliveryWorkspace && (
                            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={openChatWithClient}
                                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-200 flex items-center gap-2"
                                >
                                    <MessageSquare className="w-4 h-4" /> Message Client
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setWorkOpen(true);
                                        setWorkSubmission({
                                            message: myProposal?.workSubmission?.message || "",
                                            links: (myProposal?.workSubmission?.links || []).join(", "),
                                            files: [],
                                        });
                                    }}
                                    className="bg-[#09BF44] text-white px-5 py-2 rounded-xl font-bold hover:bg-[#07a63a]"
                                >
                                    {myProposal?.workSubmission?.updatedAt ? "Update Submission" : "Submit Full Work"}
                                </button>
                            </div>
                        )}

                        {!showDeliveryWorkspace && (
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={openChatWithClient}
                                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-200 flex items-center gap-2"
                                >
                                    <MessageSquare className="w-4 h-4" /> Chat Client
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {workOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-3xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start justify-between mb-6 gap-3">
                            <h2 className="text-2xl font-bold text-gray-900 break-words [overflow-wrap:anywhere] min-w-0 flex-1">Submit Work: {job.title}</h2>
                            <button type="button" onClick={() => setWorkOpen(false)} className="p-2 hover:bg-gray-100 rounded-full shrink-0" disabled={submittingWork}>
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitWork} className="space-y-4">
                            <textarea
                                value={workSubmission.message}
                                onChange={(e) => setWorkSubmission((p) => ({ ...p, message: e.target.value }))}
                                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none h-28 resize-none"
                                placeholder="Describe what you completed..."
                            />
                            <textarea
                                value={workSubmission.links}
                                onChange={(e) => setWorkSubmission((p) => ({ ...p, links: e.target.value }))}
                                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none h-24 resize-none"
                                placeholder="Links..."
                            />
                            <input
                                type="file"
                                multiple
                                onChange={(e) => setWorkSubmission((p) => ({ ...p, files: Array.from(e.target.files || []) }))}
                                className="w-full text-sm"
                            />
                            {uploadProgress !== null && workSubmission.files.length > 0 && (
                                <p className="text-xs font-bold text-[#09BF44]">Uploading… {uploadProgress}%</p>
                            )}
                            <div className="flex gap-4 pt-2">
                                <button type="button" onClick={() => setWorkOpen(false)} className="flex-1 bg-gray-100 font-bold p-3 rounded-xl" disabled={submittingWork}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={submittingWork} className="flex-1 bg-[#09BF44] text-white font-bold p-3 rounded-xl flex justify-center gap-2">
                                    {submittingWork && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {milestoneSubmitModal && myProposal?.milestones?.[milestoneSubmitModal.milestoneIdx] && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-3xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Submit Milestone</h2>
                            <button type="button" onClick={() => setMilestoneSubmitModal(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-4 break-words [overflow-wrap:anywhere]">{myProposal.milestones[milestoneSubmitModal.milestoneIdx].name}</p>
                        <div className="space-y-3">
                            <textarea
                                value={milestoneWork.message}
                                onChange={(e) => setMilestoneWork((w) => ({ ...w, message: e.target.value }))}
                                rows={3}
                                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none resize-none"
                                placeholder="Notes..."
                            />
                            <textarea
                                value={milestoneWork.links}
                                onChange={(e) => setMilestoneWork((w) => ({ ...w, links: e.target.value }))}
                                rows={2}
                                className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#09BF44] outline-none resize-none"
                                placeholder="Links..."
                            />
                            <input type="file" multiple onChange={(e) => setMilestoneWork((w) => ({ ...w, files: Array.from(e.target.files || []) }))} className="w-full text-sm" />
                            {milestoneUploadProgress !== null && milestoneWork.files.length > 0 && (
                                <p className="text-xs font-bold text-[#09BF44]">Uploading… {milestoneUploadProgress}%</p>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setMilestoneSubmitModal(null)} className="flex-1 bg-gray-100 font-bold py-3 rounded-xl">
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmitMilestone}
                                    disabled={milestoneSubmitting}
                                    className="flex-1 bg-[#09BF44] text-white font-bold py-3 rounded-xl flex justify-center gap-2 disabled:opacity-70"
                                >
                                    {milestoneSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
