"use client";

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
    deadline: Date | string;
    variant?: 'card' | 'detail' | 'inline';
    className?: string;
}

export default function CountdownTimer({ deadline, variant = 'card', className = '' }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        isOverdue: boolean;
    } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
            const now = new Date();
            const difference = deadlineDate.getTime() - now.getTime();

            if (difference <= 0) {
                return {
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    isOverdue: true
                };
            }

            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((difference % (1000 * 60)) / 1000),
                isOverdue: false
            };
        };

        setTimeLeft(calculateTimeLeft());

        const interval = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(interval);
    }, [deadline]);

    if (!timeLeft) {
        return null;
    }

    if (variant === 'card') {
        // Compact card overlay version
        return (
            <div className={`absolute top-3 right-3 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg flex items-center gap-2 z-10 ${timeLeft.isOverdue ? 'bg-red-600/90' : ''} ${className}`}>
                <Clock className="w-3.5 h-3.5" />
                {timeLeft.isOverdue ? (
                    <span className="text-xs font-bold">Overdue</span>
                ) : (
                    <span className="text-xs font-bold">
                        {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
                        {timeLeft.hours}h {timeLeft.minutes}m
                    </span>
                )}
            </div>
        );
    }

    if (variant === 'inline') {
        return (
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${timeLeft.isOverdue ? 'text-red-600' : 'text-[#09BF44]'} ${className}`}>
                <Clock className="w-3.5 h-3.5" />
                {timeLeft.isOverdue ? 'Overdue' : (
                    <>{timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}{timeLeft.hours}h {timeLeft.minutes}m</>
                )}
            </span>
        );
    }

    // Detailed version for detail pages
    return (
        <div className={`bg-white border-2 ${timeLeft.isOverdue ? 'border-red-500' : 'border-[#09BF44]'} rounded-2xl p-4 md:p-6 ${className}`}>
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-xl ${timeLeft.isOverdue ? 'bg-red-50 text-red-600' : 'bg-green-50 text-[#09BF44]'}`}>
                    <Clock className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Deadline Countdown</h3>
                    <p className={`text-sm ${timeLeft.isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                        {timeLeft.isOverdue ? 'Project deadline has passed' : 'Time remaining until delivery'}
                    </p>
                </div>
            </div>
            {timeLeft.isOverdue ? (
                <div className="text-center py-4">
                    <p className="text-2xl font-black text-red-600">Overdue</p>
                    <p className="text-sm text-gray-500 mt-1">Please contact the freelancer/client</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <div className="text-center">
                        <div className="text-2xl md:text-3xl font-black text-gray-900">{timeLeft.days}</div>
                        <div className="text-xs font-bold text-gray-500 uppercase mt-1">Days</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl md:text-3xl font-black text-gray-900">{timeLeft.hours}</div>
                        <div className="text-xs font-bold text-gray-500 uppercase mt-1">Hours</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl md:text-3xl font-black text-gray-900">{timeLeft.minutes}</div>
                        <div className="text-xs font-bold text-gray-500 uppercase mt-1">Minutes</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl md:text-3xl font-black text-gray-900">{timeLeft.seconds}</div>
                        <div className="text-xs font-bold text-gray-500 uppercase mt-1">Seconds</div>
                    </div>
                </div>
            )}
        </div>
    );
}
