import React from 'react';
import { Employee, JobVacancy, ApplicationStatus } from '../../../types';

// --- ANALYSIS LOGIC ---

export interface ScreeningResult {
    score: number;
    matches: string[];
    misses: string[];
    analysis: string;
}

export const analyzeCandidate = (employee: Employee, job?: JobVacancy): ScreeningResult => {
    if (!job) return { score: 0, matches: [], misses: [], analysis: 'Lowongan tidak ditemukan atau telah dihapus.' };

    let score = 0;
    const matches: string[] = [];
    const misses: string[] = [];
    
    const weights = { education: 35, age: 15, gender: 15, skills: 35 };

    // 1. Education Match
    const getEduLevel = (edu: string) => {
        const lower = edu.toLowerCase();
        if (lower.includes('s3') || lower.includes('doktor')) return 11;
        if (lower.includes('s2') || lower.includes('magister')) return 9;
        if (lower.includes('s1') || lower.includes('sarjana')) return 7;
        if (lower.includes('d3') || lower.includes('diploma')) return 5;
        if (lower.includes('sma') || lower.includes('smk')) return 3;
        if (lower.includes('smp')) return 1;
        return 0;
    };

    const candLevel = getEduLevel(employee.lastEducation);
    const jobLevel = getEduLevel(job.minEducation || 'SMA');

    if (candLevel >= jobLevel) {
        score += weights.education;
        matches.push(`Pendidikan: ${employee.lastEducation} (Memenuhi Min. ${job.minEducation || 'SMA'})`);
    } else {
        misses.push(`Pendidikan: ${employee.lastEducation} (Dibawah Min. ${job.minEducation || 'SMA'})`);
    }

    // 2. Age Check
    if (job.maxAge) {
        const birthYear = new Date(employee.dateOfBirth).getFullYear();
        const currentYear = new Date().getFullYear();
        const age = currentYear - birthYear;
        
        if (age <= job.maxAge) {
            score += weights.age;
            matches.push(`Usia: ${age} tahun (Sesuai Max ${job.maxAge})`);
        } else {
            misses.push(`Usia: ${age} tahun (Melebihi Max ${job.maxAge})`);
        }
    } else {
        score += weights.age;
    }

    // 3. Gender Check
    if (job.genderPreference && job.genderPreference !== 'Any') {
        if (employee.gender === job.genderPreference) {
            score += weights.gender;
            matches.push(`Gender: ${employee.gender} (Sesuai)`);
        } else {
            misses.push(`Gender: ${employee.gender} (Diminta: ${job.genderPreference})`);
        }
    } else {
        score += weights.gender;
    }

    // 4. Skill Match
    const rawSkills = Array.isArray(employee.skills)
        ? employee.skills.join(', ')
        : (employee.skills || '');
    const empSkills = rawSkills.toLowerCase();
    const requiredSkills = job.requiredSkillsList || [];
    const jobTitleKeywords = job.title.split(' ').filter(w => w.length > 3);
    
    let matchedSkillCount = 0;
    const targets = requiredSkills.length > 0 ? requiredSkills : jobTitleKeywords;

    targets.forEach(skill => {
        if (empSkills.includes(skill.toLowerCase())) {
            matchedSkillCount++;
        }
    });

    const skillScoreRatio = targets.length > 0 ? matchedSkillCount / targets.length : 1;
    score += (skillScoreRatio * weights.skills);

    if (matchedSkillCount > 0) matches.push(`Skill: ${matchedSkillCount} relevan.`);
    else if (targets.length > 0) misses.push('Skill spesifik belum terdeteksi.');

    let analysis = "";
    if (score >= 85) analysis = "Kandidat Sangat Potensial.";
    else if (score >= 60) analysis = "Kandidat Cukup Sesuai.";
    else analysis = "Kecocokan Rendah.";

    return { score: Math.round(score), matches, misses, analysis };
};

// --- UI COMPONENTS ---

export const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
    let colorClass = "bg-gray-100 text-gray-800";
    if (score >= 80) colorClass = "bg-green-100 text-green-800 ring-1 ring-green-600/20";
    else if (score >= 60) colorClass = "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-600/20";
    else colorClass = "bg-red-100 text-red-800 ring-1 ring-red-600/20";

    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${colorClass}`}>{score}% Match</span>;
};

export const StatusBadge: React.FC<{ status: ApplicationStatus }> = ({ status }) => {
    const colors: Record<ApplicationStatus, string> = {
        'APPLIED': 'bg-gray-100 text-gray-800', 
        'SCREENING': 'bg-blue-100 text-blue-800',
        'INTERVIEW': 'bg-purple-100 text-purple-800', 
        'OFFERING': 'bg-orange-100 text-orange-800',
        'CONTRACT': 'bg-teal-100 text-teal-800',
        'HIRED': 'bg-green-100 text-green-800', 
        'REJECTED': 'bg-red-100 text-red-800'
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${colors[status] || colors['APPLIED']}`}>{status}</span>;
};

export const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-900"></div>
    </div>
);