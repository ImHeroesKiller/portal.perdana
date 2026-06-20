
import React, { useState, useEffect } from 'react';
import { JobVacancy, NewJobVacancy, Client, Project } from '../../../types';
import { createJob, updateJob } from '../../../hooks/useDbQueries';
import { Input, Select, TextArea } from '../../ui/Input';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

interface JobModalProps { 
    mode: 'create' | 'edit';
    existingJob: JobVacancy | null;
    clients: Client[];
    projects: Project[];
    onClose: () => void; 
    onRefresh: () => void; 
}

export const JobModal: React.FC<JobModalProps> = ({ mode, existingJob, clients, projects, onClose, onRefresh }) => {
    const [formData, setFormData] = useState<Partial<JobVacancy>>({
        title: '', department: '', location: '', latitude: -0.9006, longitude: 119.8307,
        type: 'Full-time', description: '', requirements: [], clientId: '', projectId: '', isActive: true,
        minEducation: 'SMA/SMK/Sederajat', genderPreference: 'Any', requiredSkillsList: []
    });
    const [reqInput, setReqInput] = useState('');
    const [skillInput, setSkillInput] = useState('');

    useEffect(() => {
        if (mode === 'edit' && existingJob) setFormData(existingJob);
    }, [mode, existingJob]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const jobData = { ...formData, latitude: Number(formData.latitude), longitude: Number(formData.longitude), maxAge: formData.maxAge ? Number(formData.maxAge) : undefined } as any; 
        if (mode === 'create') await createJob(jobData as NewJobVacancy);
        else if (mode === 'edit' && existingJob) await updateJob(existingJob.id, jobData);
        onRefresh();
        onClose();
    };

    const addRequirement = () => {
        if (reqInput.trim()) {
            setFormData(prev => ({ ...prev, requirements: [...(prev.requirements || []), reqInput.trim()] }));
            setReqInput('');
        }
    };

    const addSkill = () => {
        if (skillInput.trim()) {
            setFormData(prev => ({ ...prev, requiredSkillsList: [...(prev.requiredSkillsList || []), skillInput.trim()] }));
            setSkillInput('');
        }
    }

    const availableProjects = projects.filter(p => p.clientId === formData.clientId && (p.isActive !== false || p.id === formData.projectId));

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold">{mode === 'create' ? 'Tambah Lowongan' : 'Edit Lowongan'}</h2>
                    <button onClick={onClose} className="text-2xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Judul" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                        <Input label="Departemen" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} required />
                        <Select label="Klien" value={formData.clientId || ''} onChange={e => setFormData({...formData, clientId: e.target.value, projectId: ''})} options={clients.filter(c => c.isActive !== false || c.id === formData.clientId).map(c => ({ value: c.id, label: c.name }))} />
                        <Select label="Proyek" value={formData.projectId || ''} onChange={e => setFormData({...formData, projectId: e.target.value})} options={availableProjects.map(p => ({ value: p.id, label: p.name }))} disabled={!formData.clientId} />
                        <Input label="Lokasi" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
                        <div className="grid grid-cols-2 gap-2">
                             <Select label="Tipe" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} options={[{ value: 'Full-time', label: 'Full-time' }, { value: 'Part-time', label: 'Part-time' }, { value: 'Contract', label: 'Contract' }]} />
                             <Select label="Status" value={formData.isActive ? 'active' : 'inactive'} onChange={e => setFormData({...formData, isActive: e.target.value === 'active'})} options={[{ value: 'active', label: 'Aktif' }, { value: 'inactive', label: 'Non-Aktif' }]} />
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2"><ClipboardDocumentListIcon className="h-5 w-5" /> Kriteria Screening</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <Select label="Min. Pendidikan" value={formData.minEducation} onChange={e => setFormData({...formData, minEducation: e.target.value})} options={[{value:'SMA/SMK/Sederajat', label:'SMA/SMK'}, {value:'Diploma (D3)', label:'D3'}, {value:'Sarjana (S1)', label:'S1'}]} />
                            <Input label="Max Usia" type="number" value={formData.maxAge || ''} onChange={e => setFormData({...formData, maxAge: parseInt(e.target.value)})} />
                            <Select label="Gender" value={formData.genderPreference} onChange={e => setFormData({...formData, genderPreference: e.target.value as any})} options={[{value:'Any', label:'Any'}, {value:'Laki-laki', label:'Laki-laki'}, {value:'Perempuan', label:'Perempuan'}]} />
                        </div>
                        <div className="mt-2">
                             <label className="text-sm font-medium">Skills (Tags)</label>
                             <div className="flex gap-2 mt-1">
                                <input className="border rounded px-2 py-1 text-sm flex-1" value={skillInput} onChange={e => setSkillInput(e.target.value)} placeholder="Add skill..." />
                                <button type="button" onClick={addSkill} className="px-3 bg-blue-100 rounded text-sm">Add</button>
                             </div>
                             <div className="flex flex-wrap gap-1 mt-2">{formData.requiredSkillsList?.map((s,i) => <span key={i} className="text-xs bg-gray-200 px-2 py-1 rounded">{s}</span>)}</div>
                        </div>
                    </div>

                    <TextArea label="Deskripsi" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="h-24" />
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Persyaratan</label>
                        <div className="flex gap-2">
                            <input className="flex-1 px-3 py-2 border rounded" value={reqInput} onChange={e => setReqInput(e.target.value)} />
                            <button type="button" onClick={addRequirement} className="px-4 py-2 bg-gray-200 rounded">Tambah</button>
                        </div>
                        <ul className="list-disc pl-5 text-sm mt-2">{formData.requirements?.map((req, i) => <li key={i}>{req}</li>)}</ul>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
