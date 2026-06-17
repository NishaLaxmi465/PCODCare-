import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, apiErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

function toDateInput(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

export default function ProfilePanel({ onChanged }) {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: '',
    heightCm: '',
    targetWeightKg: '',
    dateOfBirth: '',
    diagnosisDate: '',
    lastPeriodStart: '',
    averageCycleLength: '',
    dietaryPreference: 'balanced',
    activityLevel: 'light',
    allergies: '',
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      heightCm: user.profile?.heightCm || '',
      targetWeightKg: user.profile?.targetWeightKg || '',
      dateOfBirth: toDateInput(user.profile?.dateOfBirth),
      diagnosisDate: toDateInput(user.profile?.diagnosisDate),
      lastPeriodStart: toDateInput(user.profile?.lastPeriodStart),
      averageCycleLength: user.profile?.averageCycleLength || '',
      dietaryPreference: user.profile?.dietaryPreference || 'balanced',
      activityLevel: user.profile?.activityLevel || 'light',
      allergies: (user.profile?.allergies || []).join(', '),
    });
  }, [user]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setStatus('Saving...');
    try {
      const payload = {
        name: form.name,
        profile: {
          ...user.profile,
          heightCm: Number(form.heightCm) || undefined,
          targetWeightKg: Number(form.targetWeightKg) || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          diagnosisDate: form.diagnosisDate || undefined,
          lastPeriodStart: form.lastPeriodStart || undefined,
          averageCycleLength: Number(form.averageCycleLength) || undefined,
          dietaryPreference: form.dietaryPreference,
          activityLevel: form.activityLevel,
          allergies: form.allergies
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        },
      };
      const { data } = await api.patch('/users/me', payload);
      setUser(data);
      setStatus('Profile saved');
      onChanged?.();
    } catch (error) {
      setStatus(apiErrorMessage(error, 'Could not save profile'));
    }
  };

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Profile</p>
          <h2>Personal health baseline</h2>
        </div>
      </div>

      <form className="form-grid" onSubmit={submit}>
        <label>
          Name
          <input value={form.name} onChange={(event) => update('name', event.target.value)} required />
        </label>
        <label>
          Height (cm)
          <input type="number" min="80" max="250" value={form.heightCm} onChange={(event) => update('heightCm', event.target.value)} />
        </label>
        <label>
          Target weight (kg)
          <input type="number" min="25" max="250" value={form.targetWeightKg} onChange={(event) => update('targetWeightKg', event.target.value)} />
        </label>
        <label>
          Average cycle length
          <input type="number" min="10" max="90" value={form.averageCycleLength} onChange={(event) => update('averageCycleLength', event.target.value)} />
        </label>
        <label>
          Date of birth
          <input type="date" value={form.dateOfBirth} onChange={(event) => update('dateOfBirth', event.target.value)} />
        </label>
        <label>
          Diagnosis date
          <input type="date" value={form.diagnosisDate} onChange={(event) => update('diagnosisDate', event.target.value)} />
        </label>
        <label>
          Last period start
          <input type="date" value={form.lastPeriodStart} onChange={(event) => update('lastPeriodStart', event.target.value)} />
        </label>
        <label>
          Dietary preference
          <select value={form.dietaryPreference} onChange={(event) => update('dietaryPreference', event.target.value)}>
            <option value="balanced">Balanced</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="eggetarian">Eggetarian</option>
            <option value="non-vegetarian">Non-vegetarian</option>
          </select>
        </label>
        <label>
          Activity level
          <select value={form.activityLevel} onChange={(event) => update('activityLevel', event.target.value)}>
            <option value="sedentary">Sedentary</option>
            <option value="light">Light</option>
            <option value="moderate">Moderate</option>
            <option value="active">Active</option>
          </select>
        </label>
        <label className="full-span">
          Allergies
          <input value={form.allergies} onChange={(event) => update('allergies', event.target.value)} placeholder="Peanuts, lactose, gluten" />
        </label>
        <div className="form-actions full-span">
          <button className="primary-button" type="submit">
            <Save size={16} />
            Save profile
          </button>
          {status ? <span className="form-status">{status}</span> : null}
        </div>
      </form>
    </section>
  );
}
