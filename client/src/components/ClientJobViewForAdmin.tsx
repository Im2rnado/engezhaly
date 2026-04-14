'use client';

import {
    Briefcase,
    CheckCircle,
    Clock,
    Link as LinkIcon,
    MessageSquare,
    Paperclip,
    User,
    XCircle
} from 'lucide-react';
import CountdownTimer from '@/components/CountdownTimer';
import { formatDateDDMMYYYY, formatRevisionsLabel, formatStatus } from '@/lib/utils';

/** Matches server: final workSubmission OR all proposal milestones have visible submission */
function proposalReadyForClientApproval(proposal: any) {
    const ws = proposal.workSubmission;
    const hasWs =
        ws &&
        ((typeof ws.message === 'string' && ws.message.trim()) ||
            (Array.isArray(ws.links) && ws.links.some(Boolean)) ||
            (Array.isArray(ws.files) && ws.files.some(Boolean)));
    if (hasWs) return true;
    const ms = proposal.milestones;
    if (!Array.isArray(ms) || ms.length === 0) return false;
    return ms.every((m: any) => {
        const note = typeof m.submissionNote === 'string' ? m.submissionNote.trim() : '';
        const links = Array.isArray(m.submissionLinks) ? m.submissionLinks.filter(Boolean) : [];
        const files = Array.isArray(m.submissionFiles) ? m.submissionFiles.filter(Boolean) : [];
        return (
            m.status === 'submitted' ||
            m.status === 'done' ||
            note.length > 0 ||
            links.length > 0 ||
            files.length > 0
        );
    });
}

type Props = {
    job: any;
    jobDeadline: Date | null;
    router: { push: (href: string) => void };
};

/** Same layout as the client job detail (posted jobs) — read-only; payment/accept/reject/approve hidden for admins. */
export default function ClientJobViewForAdmin({ job, jobDeadline, router }: Props) {
    return (
        <>
            {jobDeadline && job.status === 'in_progress' && (
                <div className="mb-6">
                    <CountdownTimer deadline={jobDeadline} variant="detail" />
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8 mb-6">
                <div className="flex items-start justify-between mb-6">
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2 break-words">{job.title}</h1>
                        <p className="text-sm text-gray-500 mb-2">
                            Client: {job.clientId?.firstName} {job.clientId?.lastName}
                            {job.clientId?.email ? ` · ${job.clientId.email}` : ''}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4 shrink-0" />
                                Posted {formatDateDDMMYYYY(job.createdAt)}
                            </span>
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    job.status === 'open'
                                        ? 'bg-green-100 text-green-700'
                                        : job.status === 'in_progress'
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                                {formatStatus(job.status)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-500 mb-2">Description</h3>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere min-w-0">
                            {job.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 mb-2">Budget Range</h3>
                            <p className="text-lg font-black text-gray-900">
                                {job.budgetRange?.min} - {job.budgetRange?.max} EGP
                            </p>
                        </div>
                        {job.deadline && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-500 mb-2">Deadline</h3>
                                <p className="text-lg font-black text-gray-900">{job.deadline}</p>
                            </div>
                        )}
                    </div>

                    {job.skills && job.skills.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 mb-2">Required Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {job.skills.map((skill: string, idx: number) => (
                                    <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {job.milestones && job.milestones.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 mb-2">Delivery Milestones</h3>
                            <p className="text-xs text-gray-500 mb-3">
                                Expected delivery phases. You pay once when you approve the completed project.
                            </p>
                            <div className="space-y-2">
                                {job.milestones.map((m: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200"
                                    >
                                        <span className="font-bold text-gray-900 break-words min-w-0">{m.name}</span>
                                        {m.dueDate && (
                                            <span className="text-sm text-gray-500 shrink-0">Due: {formatDateDDMMYYYY(m.dueDate)}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-black text-gray-900">Proposals ({job.proposals?.length || 0})</h2>
                </div>

                <div className="p-6 space-y-4">
                    {job.proposals && job.proposals.length > 0 ? (
                        job.proposals.map((proposal: any, idx: number) => (
                            <div key={proposal._id || idx} className="border border-gray-200 rounded-2xl p-4 md:p-6 hover:shadow-md transition-shadow min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                        <div className="w-12 h-12 bg-[#09BF44] rounded-full flex items-center justify-center text-white font-black text-lg shrink-0">
                                            {proposal.freelancerId?.firstName?.[0]?.toUpperCase() || 'F'}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-lg text-gray-900">
                                                {proposal.freelancerId?.firstName} {proposal.freelancerId?.lastName}
                                            </h3>
                                            <p className="text-sm text-gray-500 break-all">{proposal.freelancerId?.email}</p>
                                            {proposal.freelancerId?.freelancerProfile?.category && (
                                                <p className="text-xs text-gray-400 mt-1">{proposal.freelancerId.freelancerProfile.category}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="sm:text-right shrink-0">
                                        <p className="text-xl md:text-2xl font-black text-[#09BF44] mb-1">{proposal.price} EGP</p>
                                        <p className="text-sm text-gray-500">{proposal.deliveryDays} days delivery</p>
                                        <p className="text-sm text-gray-500">
                                            Revisions: {formatRevisionsLabel(proposal.revisionsUnlimited, proposal.revisions, 'short')}
                                        </p>
                                    </div>
                                </div>

                                {Array.isArray(proposal.milestones) && proposal.milestones.length > 0 && (
                                    <div className="mb-4 p-4 bg-indigo-50/80 rounded-xl border border-indigo-100 min-w-0">
                                        <p className="text-sm font-bold text-indigo-900 mb-2">Proposal milestones</p>
                                        <ul className="space-y-3 text-sm text-indigo-900">
                                            {proposal.milestones.map((m: any, mi: number) => {
                                                const subLinks = Array.isArray(m.submissionLinks) ? m.submissionLinks.filter(Boolean) : [];
                                                const subFiles = Array.isArray(m.submissionFiles) ? m.submissionFiles.filter(Boolean) : [];
                                                const subNote = typeof m.submissionNote === 'string' ? m.submissionNote.trim() : '';
                                                const hasSubmission =
                                                    subNote.length > 0 ||
                                                    subLinks.length > 0 ||
                                                    subFiles.length > 0 ||
                                                    m.status === 'submitted' ||
                                                    m.status === 'done';
                                                return (
                                                    <li key={mi} className="rounded-xl border border-indigo-100 bg-white/90 p-3 min-w-0">
                                                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                                                            <span className="font-bold text-gray-900 break-words min-w-0">
                                                                {m.name || `Milestone ${mi + 1}`}
                                                            </span>
                                                            {m.dueDate && (
                                                                <span className="text-xs text-indigo-700 shrink-0">
                                                                    Due {new Date(m.dueDate).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {m.status && (
                                                            <span className="inline-block mt-1 text-xs font-bold uppercase tracking-wide text-indigo-600">
                                                                {m.status}
                                                            </span>
                                                        )}
                                                        {hasSubmission ? (
                                                            <div className="mt-3 pt-3 border-t border-indigo-100 space-y-2 min-w-0">
                                                                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Submitted work</p>
                                                                {subNote ? (
                                                                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed break-words overflow-wrap-anywhere min-w-0">
                                                                        {subNote}
                                                                    </p>
                                                                ) : null}
                                                                {subLinks.length > 0 && (
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <LinkIcon className="w-3.5 h-3.5 text-gray-500" />
                                                                            <span className="text-xs font-bold text-gray-600">Links</span>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            {subLinks.map((link: string, li: number) => (
                                                                                <a
                                                                                    key={li}
                                                                                    href={link}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="block text-sm text-[#09BF44] hover:underline break-all"
                                                                                >
                                                                                    {link}
                                                                                </a>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {subFiles.length > 0 && (
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <Paperclip className="w-3.5 h-3.5 text-gray-500" />
                                                                            <span className="text-xs font-bold text-gray-600">Files</span>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            {subFiles.map((fileUrl: string, fi: number) => (
                                                                                <a
                                                                                    key={fi}
                                                                                    href={fileUrl}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="block text-sm text-[#09BF44] hover:underline break-all"
                                                                                >
                                                                                    {fileUrl}
                                                                                </a>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="mt-2 text-xs text-indigo-700/80">No delivery submitted for this milestone yet.</p>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}

                                {proposal.message && (
                                    <div className="mb-4 p-4 bg-gray-50 rounded-xl min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MessageSquare className="w-4 h-4 text-gray-500 shrink-0" />
                                            <span className="text-sm font-bold text-gray-700">Proposal Message</span>
                                        </div>
                                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere min-w-0">
                                            {proposal.message}
                                        </p>
                                    </div>
                                )}

                                {proposal.workSubmission && (
                                    <div className="mb-4 p-4 bg-green-50 rounded-xl border border-green-100 min-w-0">
                                        <div className="flex items-center justify-between mb-2 gap-2">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                                <span className="text-sm font-bold text-green-800">Work Submission</span>
                                            </div>
                                            {proposal.workSubmission.updatedAt && (
                                                <span className="text-xs text-green-700 shrink-0">
                                                    {new Date(proposal.workSubmission.updatedAt).toLocaleString()}
                                                </span>
                                            )}
                                        </div>

                                        {proposal.workSubmission.message && (
                                            <p className="text-sm text-gray-700 mb-3 leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere min-w-0">
                                                {proposal.workSubmission.message}
                                            </p>
                                        )}

                                        {Array.isArray(proposal.workSubmission.links) && proposal.workSubmission.links.length > 0 && (
                                            <div className="mb-3">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <LinkIcon className="w-4 h-4 text-gray-500" />
                                                    <span className="text-xs font-bold text-gray-700 uppercase">Links</span>
                                                </div>
                                                <div className="space-y-1">
                                                    {proposal.workSubmission.links.map((link: string, linkIdx: number) => (
                                                        <a
                                                            key={`${proposal._id || idx}-link-${linkIdx}`}
                                                            href={link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="block text-sm text-[#09BF44] hover:underline break-all"
                                                        >
                                                            {link}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {Array.isArray(proposal.workSubmission.files) && proposal.workSubmission.files.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <Paperclip className="w-4 h-4 text-gray-500" />
                                                    <span className="text-xs font-bold text-gray-700 uppercase">Files</span>
                                                </div>
                                                <div className="space-y-1">
                                                    {proposal.workSubmission.files.map((fileUrl: string, fileIdx: number) => (
                                                        <a
                                                            key={`${proposal._id || idx}-file-${fileIdx}`}
                                                            href={fileUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="block text-sm text-[#09BF44] hover:underline break-all"
                                                        >
                                                            {fileUrl}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {proposal.freelancerId?.freelancerProfile && (
                                    <div className="mb-4 flex flex-wrap gap-2">
                                        {proposal.freelancerId.freelancerProfile.experienceYears && (
                                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                                                {proposal.freelancerId.freelancerProfile.experienceYears} years experience
                                            </span>
                                        )}
                                        {proposal.freelancerId.freelancerProfile.rewardMostDeals && (
                                            <span className="bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-xs font-bold">⭐ Most deals</span>
                                        )}
                                        {proposal.freelancerId.freelancerProfile.rewardTopRated && (
                                            <span className="bg-yellow-50 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">⭐ Top rated</span>
                                        )}
                                        {proposal.freelancerId.freelancerProfile.rewardOnTime && (
                                            <span className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">⭐ On-time delivery</span>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => router.push(`/freelancer/${proposal.freelancerId?._id || proposal.freelancerId}`)}
                                        className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <User className="w-4 h-4" />
                                        View Profile
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => router.push(`/chat/${proposal.freelancerId?._id || proposal.freelancerId}`)}
                                        className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <MessageSquare className="w-4 h-4" /> Message
                                    </button>
                                    {job.status === 'open' && proposal.status === 'pending' && (
                                        <>
                                            <span className="flex-1 bg-red-50 text-red-700 font-bold py-2.5 rounded-xl text-center flex items-center justify-center gap-2 opacity-60 cursor-default">
                                                <XCircle className="w-4 h-4" />
                                                Reject (client only)
                                            </span>
                                            <span className="flex-1 bg-[#09BF44]/70 text-white font-bold py-2.5 rounded-xl text-center flex items-center justify-center gap-2 opacity-80 cursor-default">
                                                <CheckCircle className="w-4 h-4" />
                                                Accept Proposal (client only)
                                            </span>
                                        </>
                                    )}
                                    {proposal.status === 'accepted' && (
                                        <>
                                            {job.status === 'in_progress' && proposalReadyForClientApproval(proposal) ? (
                                                <span className="flex-1 bg-[#09BF44]/70 text-white font-bold py-2.5 rounded-xl text-center flex items-center justify-center gap-2 opacity-80 cursor-default">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Approve &amp; release (client only)
                                                </span>
                                            ) : (
                                                <span className="flex-1 bg-green-100 text-green-700 font-bold py-2.5 rounded-xl text-center flex items-center justify-center gap-2">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Accepted
                                                </span>
                                            )}
                                        </>
                                    )}
                                    {proposal.status === 'rejected' && (
                                        <span className="flex-1 bg-red-100 text-red-700 font-bold py-2.5 rounded-xl text-center flex items-center justify-center gap-2">
                                            <XCircle className="w-4 h-4" />
                                            Rejected
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-lg font-bold">No proposals yet</p>
                            <p className="text-sm mt-2">Freelancers will see your job and submit proposals here.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
